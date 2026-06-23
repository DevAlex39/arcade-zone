const jwt = require('jsonwebtoken');
const { fetchWord, validateWord, computeResult, computeDamage } = require('../games/motus');

// rooms en mémoire : code → state
const rooms = new Map();

function initSocket(io) {

  // Auth via token (JWT normal ou token invité)
  io.use((socket, next) => {
    const token    = socket.handshake.auth?.token;
    const username = socket.handshake.auth?.username;
    if (!token && !username) return next(new Error('Identification requise'));
    if (token) {
      try {
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
      } catch {
        next(new Error('Token invalide'));
      }
    } else {
      socket.user = { id: `guest_${Date.now()}`, username, role: 'guest', isGuest: true };
      next();
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;

    // ─── Rejoindre une room ────────────────────────────────────────
    socket.on('join_room', async (code) => {
      code = code?.toUpperCase();
      if (!rooms.has(code)) return socket.emit('error', 'Room introuvable');
      const room = rooms.get(code);

      const existing = room.players.find(p => p.id === user.id);

      // Bloquer uniquement les nouveaux joueurs quand la partie est commencée
      if (room.status !== 'waiting' && !existing) {
        return socket.emit('error', 'Partie déjà commencée');
      }

      socket.join(code);
      socket.currentRoom = code;

      if (existing) {
        existing.socketId = socket.id; // reconnexion
      } else {
        if (room.players.length >= room.maxPlayers) return socket.emit('error', 'Salle pleine');
        room.players.push({ id: user.id, username: user.username, socketId: socket.id, ready: false });
      }

      io.to(code).emit('room_update', sanitizeRoom(room));

      // Si la partie est en cours, renvoyer l'état du round au joueur qui reconnecte
      if (room.status === 'playing' && room.round) {
        socket.emit('round_start', {
          roundIdx:    room.round.idx,
          wordLength:  room.round.word.length,
          firstLetter: room.round.word[0],
          maxAttempts: room.round.maxAttempts,
          players:     room.players.map(p => ({ id: p.id, username: p.username, lives: p.lives, combo: p.combo })),
        });
      }
    });

    // ─── Hôte initialise la room en mémoire ────────────────────────
    socket.on('init_room', (data) => {
      const { code, gameId, settings, maxPlayers } = data;

      if (rooms.has(code)) {
        // Room existante : rejoindre le canal socket et ajouter le joueur si absent
        const room = rooms.get(code);
        socket.join(code);
        socket.currentRoom = code;
        const existing = room.players.find(p => p.id === user.id);
        if (existing) {
          existing.socketId = socket.id; // reconnexion
        } else {
          room.players.push({ id: user.id, username: user.username, socketId: socket.id, ready: false });
        }
        io.to(code).emit('room_update', sanitizeRoom(room));
        return;
      }

      const room = {
        code, gameId,
        hostId:     user.id,
        hostName:   user.username,
        maxPlayers: maxPlayers || 8,
        minPlayers: data.minPlayers || 1,
        status:     'waiting',
        settings:   { syncWords: true, comboEnabled: true, livesMax: 20, maxAttempts: 6, ...settings },
        players:    [{ id: user.id, username: user.username, socketId: socket.id, ready: true }],
        round:      null,
      };
      rooms.set(code, room);
      socket.join(code);
      socket.currentRoom = code;
      socket.emit('room_update', sanitizeRoom(room));
    });

    // ─── Lancer la partie (hôte seulement) ────────────────────────
    socket.on('start_game', async (code) => {
      const room = rooms.get(code);
      if (!room) return socket.emit('error', 'Room introuvable');
      if (room.hostId !== user.id) return socket.emit('error', 'Seul l\'hôte peut lancer la partie');
      if (room.players.length < room.minPlayers) return socket.emit('error', `Il faut au moins ${room.minPlayers} joueur(s)`);
      await startRound(io, room);
    });

    // ─── Soumettre un mot ─────────────────────────────────────────
    socket.on('submit_guess', async ({ code, guess }) => {
      const room = rooms.get(code);
      if (!room || room.status !== 'playing') return;
      const ps = room.round?.playerStates?.[user.id];
      if (!ps || ps.status !== 'playing') return;

      guess = guess.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (guess.length !== room.round.word.length) return socket.emit('guess_error', 'Longueur incorrecte');

      const valid = await validateWord(guess, room.round.word);
      if (!valid) { socket.emit('guess_invalid'); return; }

      const result = computeResult(guess, room.round.word);
      ps.guesses.push({ guess, result });

      // Mettre à jour les lettres confirmées
      result.forEach((s, i) => { if (s === 'correct') ps.confirmedLetters[i] = guess[i]; });

      const won = result.every(r => r === 'correct');
      socket.emit('guess_result', { result, confirmedLetters: ps.confirmedLetters, won });

      if (won) {
        ps.status     = 'found';
        ps.foundAtRow = ps.guesses.length - 1;
      } else if (ps.guesses.length >= room.round.maxAttempts) {
        ps.status = 'failed';
      }

      // Vérifier si tous les joueurs ont terminé
      const allDone = room.players.every(p => {
        const s = room.round.playerStates[p.id];
        return s && s.status !== 'playing';
      });
      if (allDone) await endRound(io, room);
    });

    // ─── Déconnexion ──────────────────────────────────────────────
    socket.on('disconnect', () => {
      const code = socket.currentRoom;
      if (!code || !rooms.has(code)) return;
      const room = rooms.get(code);
      const p = room.players.find(p => p.id === user.id);
      if (p) p.socketId = null; // garder dans la liste mais marquer déconnecté
      io.to(code).emit('room_update', sanitizeRoom(room));
    });
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function startRound(io, room) {
  room.status = 'playing';
  room.round  = room.round ? { ...room.round, idx: (room.round.idx || 0) + 1 } : { idx: 1 };

  // Récupérer le mot
  const word = await fetchWord();
  room.round.word        = word;
  room.round.maxAttempts = room.settings.maxAttempts || 6;

  // Initialiser l'état de chaque joueur
  room.round.playerStates = {};
  room.players.forEach(p => {
    room.round.playerStates[p.id] = {
      status:           'playing',
      guesses:          [],
      confirmedLetters: Array(word.length).fill(null).map((_, i) => i === 0 ? word[0] : null),
      foundAtRow:       null,
      lives:            p.lives ?? room.settings.livesMax,
      combo:            p.combo ?? 0,
    };
  });
  // Copier lives/combo dans les joueurs
  room.players.forEach(p => {
    if (p.lives === undefined) p.lives = room.settings.livesMax;
    if (p.combo === undefined) p.combo = 0;
  });

  io.to(room.code).emit('round_start', {
    roundIdx:    room.round.idx,
    wordLength:  word.length,
    firstLetter: word[0],
    maxAttempts: room.round.maxAttempts,
    players:     room.players.map(p => ({ id: p.id, username: p.username, lives: p.lives, combo: p.combo })),
  });
}

async function endRound(io, room) {
  const round   = room.round;
  const results = room.players.map(p => ({
    id:       p.id,
    username: p.username,
    status:   round.playerStates[p.id]?.status,
    foundAtRow: round.playerStates[p.id]?.foundAtRow,
    guesses:  round.playerStates[p.id]?.guesses?.length,
  }));

  // Calcul dégâts
  const damages = {};
  room.players.forEach(p => {
    const ps = round.playerStates[p.id];
    if (ps.status !== 'found') return;
    p.combo++;
    const dmg = computeDamage(ps.foundAtRow, round.maxAttempts, p.combo, room.settings.comboEnabled);
    room.players.forEach(other => {
      if (other.id === p.id) return;
      damages[other.id] = (damages[other.id] || 0) + dmg;
    });
  });
  room.players.forEach(p => {
    const ps = round.playerStates[p.id];
    if (ps.status !== 'found') p.combo = 0;
    if (damages[p.id]) p.lives = Math.max(0, p.lives - damages[p.id]);
  });

  const eliminated = room.players.filter(p => p.lives <= 0 && !p.eliminated).map(p => { p.eliminated = true; return p.id; });
  const alive      = room.players.filter(p => !p.eliminated);

  io.to(room.code).emit('round_end', {
    word:        round.word,
    results,
    damages,
    players:     room.players.map(p => ({ id: p.id, username: p.username, lives: p.lives, combo: p.combo, eliminated: p.eliminated })),
    eliminated,
    roundIdx:    round.idx,
  });

  if (alive.length <= 1) {
    room.status = 'finished';
    io.to(room.code).emit('game_over', { winner: alive[0] || null });
    rooms.delete(room.code);
  } else {
    // Préparer le prochain round (l'hôte devra cliquer "Rejouer")
    room.status = 'waiting';
  }
}

function sanitizeRoom(room) {
  return {
    code:        room.code,
    game_id:     room.gameId,
    host_id:     room.hostId,
    host_name:   room.hostName,
    status:      room.status,
    max_players: room.maxPlayers,
    min_players: room.minPlayers || 1,
    settings:    room.settings,
    players:     room.players.map(p => ({ id: p.id, username: p.username, ready: p.ready, lives: p.lives, combo: p.combo, eliminated: p.eliminated, online: !!p.socketId })),
  };
}

module.exports = { initSocket };
