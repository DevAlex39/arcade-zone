const jwt = require('jsonwebtoken');

const { fetchWord, validateWord, computeResult, computeDamage } = require('../games/motus');
const yahtzee = require('../games/yahtzee');
const skyjo   = require('../games/skyjo');
const pc      = require('../games/petits-chevaux');

const rooms           = new Map();
const disconnectTimers = new Map();

function clearDisconnectTimer(code, userId) {
  const key = `${code}_${userId}`;
  if (disconnectTimers.has(key)) {
    clearTimeout(disconnectTimers.get(key));
    disconnectTimers.delete(key);
  }
}

function initSocket(io) {

  io.use((socket, next) => {
    const token    = socket.handshake.auth?.token;
    const username = socket.handshake.auth?.username;
    if (!token && !username) return next(new Error('Identification requise'));
    if (token) {
      try { socket.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
      catch { next(new Error('Token invalide')); }
    } else {
      socket.user = { id: `guest_${Date.now()}`, username, role: 'guest', isGuest: true };
      next();
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;

    // ─── Rejoindre une room ─────────────────────────────────────────
    socket.on('join_room', (code) => {
      code = code?.toUpperCase();
      if (!rooms.has(code)) return socket.emit('error', 'Room introuvable');
      const room = rooms.get(code);
      const existing = room.players.find(p => p.id === user.id);
      if (room.status !== 'waiting' && !existing) return socket.emit('error', 'Partie déjà commencée');
      socket.join(code);
      socket.currentRoom = code;
      clearDisconnectTimer(code, user.id);
      if (existing) existing.socketId = socket.id;
      else {
        if (room.players.length >= room.maxPlayers) return socket.emit('error', 'Salle pleine');
        room.players.push({ id: user.id, username: user.username, socketId: socket.id, ready: false });
      }
      io.to(code).emit('room_update', sanitizeRoom(room));
      // Reconnecter en partie
      if (room.status === 'playing') {
        resendGameState(socket, room);
      }
    });

    // ─── Hôte initialise la room ────────────────────────────────────
    socket.on('init_room', (data) => {
      const { code, gameId, settings, maxPlayers } = data;
      if (rooms.has(code)) {
        const room = rooms.get(code);
        socket.join(code); socket.currentRoom = code;
        clearDisconnectTimer(code, user.id);
        const existing = room.players.find(p => p.id === user.id);
        if (existing) existing.socketId = socket.id;
        else room.players.push({ id: user.id, username: user.username, socketId: socket.id, ready: false });
        io.to(code).emit('room_update', sanitizeRoom(room));
        return;
      }
      const room = {
        code, gameId,
        hostId:     user.id,
        hostName:   user.username,
        maxPlayers: maxPlayers || 8,
        minPlayers: Math.max(2, data.minPlayers || 2),
        status:     'waiting',
        settings: { syncWords: true, comboEnabled: true, livesMax: 20, maxAttempts: 6,
          minLetters: 5, maxLetters: 6, lang: 'fr', changeOnFind: false, category: 'tous',
          pionsPerPlayer: 2, ...settings },
        players: [{ id: user.id, username: user.username, socketId: socket.id, ready: true }],
        round:   null,
        gameState: null,
      };
      rooms.set(code, room);
      socket.join(code); socket.currentRoom = code;
      socket.emit('room_update', sanitizeRoom(room));
    });

    // ─── Mise à jour des settings (hôte seulement) ─────────────────
    socket.on('update_settings', ({ code, settings }) => {
      code = code?.toUpperCase();
      const room = rooms.get(code);
      if (!room || room.hostId !== user.id || room.status !== 'waiting') return;
      room.settings = { ...room.settings, ...settings };
    });

    // ─── Lancer la partie ───────────────────────────────────────────
    socket.on('start_game', async (code) => {
      const room = rooms.get(code);
      if (!room) return socket.emit('error', 'Room introuvable');
      if (room.hostId !== user.id) return socket.emit('error', 'Seul l\'hôte peut lancer');
      if (room.players.length < room.minPlayers) return socket.emit('error', `Il faut au moins ${room.minPlayers} joueurs`);

      if (room.gameId === 'motus') {
        await startMotusRound(io, room);
      } else if (room.gameId === 'yahtzee') {
        startYahtzeeGame(io, room);
      } else if (room.gameId === 'skyjo') {
        startSkyjoGame(io, room);
      } else if (room.gameId === 'petits-chevaux') {
        startPCGame(io, room);
      }
    });

    // ─── Kick ───────────────────────────────────────────────────────
    socket.on('kick_player', ({ code, targetId }) => {
      code = code?.toUpperCase();
      const room = rooms.get(code);
      if (!room || room.hostId !== user.id) return;
      if (targetId === user.id) return;
      const target = room.players.find(p => p.id === targetId);
      if (!target) return;
      if (target.socketId) io.to(target.socketId).emit('kicked');
      room.players = room.players.filter(p => p.id !== targetId);
      clearDisconnectTimer(code, targetId);
      io.to(code).emit('room_update', sanitizeRoom(room));
    });

    // ─── Actions Motus ──────────────────────────────────────────────
    socket.on('submit_guess', async ({ code, guess }) => {
      const room = rooms.get(code);
      if (!room || room.status !== 'playing' || room.gameId !== 'motus') return;
      const ps = room.round?.playerStates?.[user.id];
      if (!ps || ps.status !== 'playing') return;
      guess = guess.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (guess.length !== room.round.word.length) return socket.emit('guess_error', 'Longueur incorrecte');
      const valid = await validateWord(guess, room.round.word, room.settings.lang || 'fr');
      if (!valid) { socket.emit('guess_invalid'); return; }
      const result = computeResult(guess, room.round.word);
      ps.guesses.push({ guess, result });
      result.forEach((s, i) => { if (s === 'correct') ps.confirmedLetters[i] = guess[i]; });
      const won = result.every(r => r === 'correct');
      socket.emit('guess_result', { result, confirmedLetters: ps.confirmedLetters, won });
      if (won) { ps.status = 'found'; ps.foundAtRow = ps.guesses.length - 1; }
      else if (ps.guesses.length >= room.round.maxAttempts) { ps.status = 'failed'; }

      if (won && room.settings.changeOnFind) {
        // Fin anticipée : les joueurs encore en cours ne reçoivent pas de dégâts
        await endMotusRoundChangeOnFind(io, room, user.id);
      } else {
        const allDone = room.players.every(p => { const s = room.round.playerStates[p.id]; return s && s.status !== 'playing'; });
        if (allDone) await endMotusRound(io, room);
      }
    });

    // ─── Actions Yahtzee ────────────────────────────────────────────
    socket.on('yahtzee_action', ({ code, action, data: aData }) => {
      const room = rooms.get(code?.toUpperCase());
      if (!room || room.status !== 'playing' || room.gameId !== 'yahtzee') return;
      const gs = room.gameState;
      const curId = gs.playerOrder[gs.curPlayer];
      if (user.id !== curId) return socket.emit('error', 'Ce n\'est pas votre tour');

      if (action === 'roll') {
        if (gs.rollsLeft <= 0) return socket.emit('error', 'Plus de lancers disponibles');
        gs.dice = yahtzee.rollDice(gs.dice, gs.kept);
        gs.rollsLeft--;
        gs.hasRolled = true;
        io.to(code).emit('yahtzee_state', publicYahtzeeState(gs));
      }
      else if (action === 'keep') {
        if (!gs.hasRolled) return;
        gs.kept[aData.idx] = !gs.kept[aData.idx];
        io.to(code).emit('yahtzee_state', publicYahtzeeState(gs));
      }
      else if (action === 'score') {
        if (!gs.hasRolled) return socket.emit('error', 'Lancez d\'abord les dés');
        const { catId } = aData;
        if (!yahtzee.SCORABLE.includes(catId)) return;
        if (gs.scores[curId][catId] !== undefined) return socket.emit('error', 'Catégorie déjà utilisée');

        gs.scores[curId][catId] = yahtzee.calcScore(gs.dice, catId);

        // Bonus section haute
        const bonus = yahtzee.computeBonus(gs.scores[curId]);
        if (bonus !== undefined) gs.scores[curId].bonus = bonus;
        gs.scores[curId].total = yahtzee.computeTotal(gs.scores[curId]);

        // Vérifier fin de partie
        if (yahtzee.isGameOver(gs.scores, gs.playerOrder)) {
          const totals = gs.playerOrder.map(pid => ({ id: pid, total: gs.scores[pid].total || 0 }));
          const winner = totals.reduce((a, b) => b.total > a.total ? b : a);
          gs.winner = winner.id;
          room.status = 'finished';
          io.to(code).emit('yahtzee_state', publicYahtzeeState(gs));
          io.to(code).emit('game_over', { winner: room.players.find(p => p.id === winner.id) || null });
          rooms.delete(code);
          return;
        }

        // Tour suivant
        gs.curPlayer = (gs.curPlayer + 1) % gs.playerOrder.length;
        if (gs.curPlayer === 0) gs.curRound++;
        gs.dice      = [1,1,1,1,1];
        gs.kept      = [false,false,false,false,false];
        gs.rollsLeft = 3;
        gs.hasRolled = false;
        io.to(code).emit('yahtzee_state', publicYahtzeeState(gs));
      }
    });

    // ─── Actions Skyjo ──────────────────────────────────────────────
    socket.on('skyjo_action', ({ code, action, data: aData }) => {
      const room = rooms.get(code?.toUpperCase());
      if (!room || room.status !== 'playing' || room.gameId !== 'skyjo') return;
      const gs = room.gameState;

      // initFlip : chaque joueur retourne 2 cartes dans l'ordre
      if (action === 'flip' && gs.phase === 'initFlip') {
        const flipPid = gs.playerOrder[gs.initFlipPlayer];
        if (user.id !== flipPid) return;
        const card = gs.hands[flipPid][aData.idx];
        if (!card || card.revealed) return;
        card.revealed = true;
        gs.initFlipCount++;
        if (gs.initFlipCount >= 2) {
          gs.initFlipCount = 0;
          gs.initFlipPlayer = (gs.initFlipPlayer + 1) % gs.playerOrder.length;
          if (gs.initFlipPlayer === 0) {
            gs.phase = 'draw'; // tous ont retourné 2 cartes
          }
        }
        io.to(code).emit('skyjo_state', publicSkyjoState(gs));
        return;
      }

      // Phase draw / hold — seulement le joueur courant
      const curId = gs.playerOrder[gs.curPlayer];
      if (user.id !== curId) return socket.emit('error', 'Ce n\'est pas votre tour');

      if (action === 'draw_deck' && (gs.phase === 'draw' || gs.phase === 'lastTurn')) {
        gs.heldCard = skyjo.deckPop(gs.deck, gs.discard);
        gs.heldFrom = 'deck';
        gs.phase    = 'hold';
        io.to(code).emit('skyjo_state', publicSkyjoState(gs));
      }
      else if (action === 'take_discard' && (gs.phase === 'draw' || gs.phase === 'lastTurn')) {
        if (gs.discard.length === 0) return;
        gs.heldCard = gs.discard.pop();
        gs.heldFrom = 'discard';
        gs.phase    = 'hold';
        io.to(code).emit('skyjo_state', publicSkyjoState(gs));
      }
      else if (action === 'swap' && (gs.phase === 'hold' || gs.phase === 'lastTurn') && gs.heldCard !== null) {
        const hand = gs.hands[curId];
        const old  = hand[aData.idx];
        if (!old || old.eliminated) return;
        gs.discard.push(old.value);
        old.value    = gs.heldCard;
        old.revealed = true;
        old.eliminated = false;
        gs.heldCard = null; gs.heldFrom = null;
        skyjo.checkColumnElimination(hand);
        advanceSkyjoTurn(io, code, room, gs);
      }
      else if (action === 'discard_and_flip' && gs.phase === 'hold' && gs.heldFrom === 'deck') {
        gs.discard.push(gs.heldCard);
        gs.heldCard = null; gs.heldFrom = null;
        gs.phase = 'flipOne';
        io.to(code).emit('skyjo_state', publicSkyjoState(gs));
      }
      else if (action === 'flip_one' && gs.phase === 'flipOne') {
        const card = gs.hands[curId][aData.idx];
        if (!card || card.revealed || card.eliminated) return;
        card.revealed = true;
        gs.heldCard = null;
        skyjo.checkColumnElimination(gs.hands[curId]);
        advanceSkyjoTurn(io, code, room, gs);
      }
    });

    // ─── Actions Petits Chevaux ─────────────────────────────────────
    socket.on('pc_action', ({ code, action, data: aData }) => {
      const room = rooms.get(code?.toUpperCase());
      if (!room || room.status !== 'playing' || room.gameId !== 'petits-chevaux') return;
      const gs = room.gameState;
      const curId = gs.playerOrder[gs.curPlayer];
      if (user.id !== curId) return socket.emit('error', 'Ce n\'est pas votre tour');

      if (action === 'roll' && !gs.hasRolled) {
        const dice = pc.rollDice();
        gs.diceValue  = dice;
        gs.hasRolled  = true;
        gs.movablePawns = pc.computeMovablePawns(gs.pawns[curId], gs.colorMap[curId], dice);
        if (gs.movablePawns.length === 0) {
          // Aucun pion ne peut bouger → passer le tour (rejouer si 6 et règle active)
          advancePCTurn(io, code, room, gs, dice === 6 && (room.settings.rejouerSur6 !== false));
        } else if (gs.movablePawns.length === 1) {
          // Un seul pion possible → auto-déplacer
          applyPCMove(io, code, room, gs, gs.movablePawns[0]);
        } else {
          gs.phase = 'select';
          io.to(code).emit('pc_state', publicPCState(gs));
        }
      }
      else if (action === 'move' && gs.phase === 'select') {
        if (!gs.movablePawns.includes(aData.pionIdx)) return;
        applyPCMove(io, code, room, gs, aData.pionIdx);
      }
    });

    // ─── Déconnexion ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const code = socket.currentRoom;
      if (!code || !rooms.has(code)) return;
      const room  = rooms.get(code);
      const p = room.players.find(pl => pl.id === user.id);
      if (!p) return;
      p.socketId = null;
      io.to(code).emit('room_update', sanitizeRoom(room));
      if (room.status === 'waiting') {
        const timerKey = `${code}_${user.id}`;
        const timer = setTimeout(() => {
          disconnectTimers.delete(timerKey);
          const r = rooms.get(code);
          if (!r || r.status !== 'waiting') return;
          r.players = r.players.filter(pl => pl.id !== user.id);
          if (r.hostId === user.id) {
            if (r.players.length > 0) { r.hostId = r.players[0].id; r.hostName = r.players[0].username; }
            else { rooms.delete(code); return; }
          }
          io.to(code).emit('room_update', sanitizeRoom(r));
        }, 30_000);
        disconnectTimers.set(timerKey, timer);
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// MOTUS
// ═══════════════════════════════════════════════════════════════════════
async function startMotusRound(io, room) {
  room.status = 'playing';
  room.round  = room.round ? { ...room.round, idx: (room.round.idx || 0) + 1 } : { idx: 1 };
  const s    = room.settings;
  const word = await fetchWord(s.lang || 'fr', s.minLetters || 5, s.maxLetters || 6, s.category || 'tous');
  room.round.word        = word;
  room.round.maxAttempts = s.maxAttempts || 6;
  room.round.playerStates = {};
  room.players.forEach(p => {
    room.round.playerStates[p.id] = {
      status: 'playing', guesses: [],
      confirmedLetters: Array(word.length).fill(null).map((_, i) => i === 0 ? word[0] : null),
      foundAtRow: null,
      lives: p.lives ?? s.livesMax,
      combo: p.combo ?? 0,
    };
  });
  room.players.forEach(p => {
    if (p.lives === undefined) p.lives = s.livesMax;
    if (p.combo === undefined) p.combo = 0;
  });
  io.to(room.code).emit('round_start', {
    roundIdx: room.round.idx, wordLength: word.length, firstLetter: word[0],
    maxAttempts: room.round.maxAttempts,
    players: room.players.map(p => ({ id: p.id, username: p.username, lives: p.lives, combo: p.combo })),
  });
}

async function endMotusRound(io, room) {
  const round   = room.round;
  const results = room.players.map(p => ({
    id: p.id, username: p.username,
    status: round.playerStates[p.id]?.status,
    foundAtRow: round.playerStates[p.id]?.foundAtRow,
    guesses: round.playerStates[p.id]?.guesses?.length,
  }));
  const damages = {};
  room.players.forEach(p => {
    const ps = round.playerStates[p.id];
    if (ps.status !== 'found') return;
    p.combo++;
    const dmg = computeDamage(ps.foundAtRow, round.maxAttempts, p.combo, room.settings.comboEnabled);
    room.players.forEach(other => { if (other.id !== p.id) damages[other.id] = (damages[other.id] || 0) + dmg; });
  });
  room.players.forEach(p => {
    const ps = round.playerStates[p.id];
    if (ps.status !== 'found') p.combo = 0;
    if (damages[p.id]) p.lives = Math.max(0, p.lives - damages[p.id]);
  });
  const eliminated = room.players.filter(p => p.lives <= 0 && !p.eliminated).map(p => { p.eliminated = true; return p.id; });
  const alive      = room.players.filter(p => !p.eliminated);
  io.to(room.code).emit('round_end', {
    word: round.word, results, damages, roundIdx: round.idx, category: room.settings.category || 'tous',
    players: room.players.map(p => ({ id: p.id, username: p.username, lives: p.lives, combo: p.combo, eliminated: p.eliminated })),
    eliminated,
  });
  if (alive.length <= 1) {
    room.status = 'finished';
    io.to(room.code).emit('game_over', { winner: alive[0] || null });
    rooms.delete(room.code);
  } else {
    room.status = 'waiting';
  }
}

async function endMotusRoundChangeOnFind(io, room, finderId) {
  const round = room.round;
  const finder = room.players.find(p => p.id === finderId);
  const finderPs = round.playerStates[finderId];

  finder.combo = (finder.combo || 0) + 1;
  const dmg = computeDamage(finderPs.foundAtRow, round.maxAttempts, finder.combo, room.settings.comboEnabled);

  // Dégâts uniquement pour les joueurs qui ont naturellement échoué (essais épuisés).
  // Les joueurs encore en cours (status 'playing') sont juste interrompus sans pénalité.
  const damages = {};
  room.players.forEach(p => {
    if (p.id === finderId) return;
    const ps = round.playerStates[p.id];
    if (!ps) return;
    if (ps.status === 'playing') {
      ps.status = 'failed'; // interrompu, pas de dégâts
    } else if (ps.status === 'failed') {
      damages[p.id] = dmg; // a épuisé ses essais avant que le trouveur trouve
      p.lives = Math.max(0, (p.lives || 0) - dmg);
    }
  });

  room.players.forEach(p => {
    if (p.id !== finderId) p.combo = 0;
  });

  const results = room.players.map(p => ({
    id: p.id, username: p.username,
    status: round.playerStates[p.id]?.status,
    foundAtRow: round.playerStates[p.id]?.foundAtRow,
    guesses: round.playerStates[p.id]?.guesses?.length,
  }));

  const eliminated = room.players.filter(p => p.lives <= 0 && !p.eliminated).map(p => { p.eliminated = true; return p.id; });
  const alive = room.players.filter(p => !p.eliminated);

  io.to(room.code).emit('round_end', {
    word: round.word, results, damages, roundIdx: round.idx, category: room.settings.category || 'tous',
    players: room.players.map(p => ({ id: p.id, username: p.username, lives: p.lives, combo: p.combo, eliminated: p.eliminated })),
    eliminated,
  });

  if (alive.length <= 1) {
    room.status = 'finished';
    io.to(room.code).emit('game_over', { winner: alive[0] || null });
    rooms.delete(room.code);
  } else {
    room.status = 'waiting';
  }
}

// ═══════════════════════════════════════════════════════════════════════
// YAHTZEE
// ═══════════════════════════════════════════════════════════════════════
function startYahtzeeGame(io, room) {
  room.status    = 'playing';
  room.gameState = yahtzee.initGame(room.players);
  io.to(room.code).emit('yahtzee_state', publicYahtzeeState(room.gameState));
}

function publicYahtzeeState(gs) {
  return {
    dice:        gs.dice,
    kept:        gs.kept,
    rollsLeft:   gs.rollsLeft,
    hasRolled:   gs.hasRolled,
    curPlayer:   gs.curPlayer,
    curRound:    gs.curRound,
    scores:      gs.scores,
    playerOrder: gs.playerOrder,
    players:     gs.players || [],
    previews:    gs.hasRolled ? yahtzee.allPreviews(gs.dice) : {},
    winner:      gs.winner || null,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// SKYJO
// ═══════════════════════════════════════════════════════════════════════
function startSkyjoGame(io, room) {
  room.status    = 'playing';
  room.gameState = skyjo.initGame(room.players);
  io.to(room.code).emit('skyjo_state', publicSkyjoState(room.gameState));
}

function publicSkyjoState(gs) {
  return {
    hands:          gs.hands,
    deckSize:       gs.deck.length,
    discardTop:     gs.discard[gs.discard.length - 1] ?? null,
    playerOrder:    gs.playerOrder,
    curPlayer:      gs.curPlayer,
    phase:          gs.phase,
    initFlipPlayer: gs.initFlipPlayer,
    initFlipCount:  gs.initFlipCount,
    heldCard:       gs.heldCard,
    heldFrom:       gs.heldFrom,
    endTriggeredBy: gs.endTriggeredBy,
    lastTurnCount:  gs.lastTurnCount,
    roundScores:    gs.roundScores,
  };
}

function advanceSkyjoTurn(io, code, room, gs) {
  const curId = gs.playerOrder[gs.curPlayer];

  // Vérifier si ce joueur a tout révélé → déclenche le dernier tour
  if (gs.endTriggeredBy === null && skyjo.allRevealed(gs.hands[curId])) {
    gs.endTriggeredBy = curId;
  }

  if (gs.endTriggeredBy !== null) {
    if (curId !== gs.endTriggeredBy) {
      gs.lastTurnCount++;
    }
    // Tous les autres ont joué leur dernier tour
    const remaining = gs.playerOrder.length - 1;
    if (gs.lastTurnCount >= remaining) {
      // Fin de partie — calculer scores
      const scores = {};
      gs.playerOrder.forEach(pid => {
        scores[pid] = skyjo.totalScore(gs.hands[pid]);
      });
      gs.roundScores = scores;
      gs.phase = 'finished';
      room.status = 'finished';

      const sorted = gs.playerOrder
        .map(pid => ({ id: pid, score: scores[pid] }))
        .sort((a, b) => a.score - b.score);
      const winner = room.players.find(p => p.id === sorted[0].id);

      io.to(code).emit('skyjo_state', publicSkyjoState(gs));
      io.to(code).emit('game_over', { winner, scores });
      rooms.delete(code);
      return;
    }
    gs.phase = 'lastTurn';
  } else {
    gs.phase = 'draw';
  }

  gs.curPlayer = (gs.curPlayer + 1) % gs.playerOrder.length;
  io.to(code).emit('skyjo_state', publicSkyjoState(gs));
}

// ═══════════════════════════════════════════════════════════════════════
// PETITS CHEVAUX
// ═══════════════════════════════════════════════════════════════════════
function startPCGame(io, room) {
  room.status    = 'playing';
  room.gameState = pc.initGame(room.players, room.settings.pionsPerPlayer || 2);
  io.to(room.code).emit('pc_state', publicPCState(room.gameState));
}

function publicPCState(gs) {
  return {
    playerOrder:  gs.playerOrder,
    colorMap:     gs.colorMap,
    pawns:        gs.pawns,
    curPlayer:    gs.curPlayer,
    diceValue:    gs.diceValue,
    hasRolled:    gs.hasRolled,
    movablePawns: gs.movablePawns,
    phase:        gs.phase,
    winner:       gs.winner,
  };
}

function applyPCMove(io, code, room, gs, pionIdx) {
  const curId = gs.playerOrder[gs.curPlayer];
  pc.applyMove(gs.pawns, gs.playerOrder, gs.colorMap, curId, pionIdx, gs.diceValue);

  const winner = pc.checkWinner(gs.pawns, gs.playerOrder);
  if (winner) {
    gs.winner   = winner;
    gs.phase    = 'done';
    room.status = 'finished';
    io.to(code).emit('pc_state', publicPCState(gs));
    io.to(code).emit('game_over', { winner: room.players.find(p => p.id === winner) || null });
    rooms.delete(code);
    return;
  }

  const rolledSix = gs.diceValue === 6 && (room.settings.rejouerSur6 !== false);
  advancePCTurn(io, code, room, gs, rolledSix);
}

function advancePCTurn(io, code, room, gs, reroll) {
  gs.diceValue  = null;
  gs.hasRolled  = false;
  gs.movablePawns = [];
  gs.phase      = 'roll';
  // Rejouer si 6 tiré (même joueur), sinon passer au suivant
  if (!reroll) {
    gs.curPlayer = (gs.curPlayer + 1) % gs.playerOrder.length;
  }
  io.to(code).emit('pc_state', publicPCState(gs));
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS COMMUNS
// ═══════════════════════════════════════════════════════════════════════
function resendGameState(socket, room) {
  if (room.gameId === 'motus' && room.round) {
    socket.emit('round_start', {
      roundIdx: room.round.idx, wordLength: room.round.word.length,
      firstLetter: room.round.word[0], maxAttempts: room.round.maxAttempts,
      players: room.players.map(p => ({ id: p.id, username: p.username, lives: p.lives, combo: p.combo })),
    });
  } else if (room.gameId === 'yahtzee' && room.gameState) {
    socket.emit('yahtzee_state', publicYahtzeeState(room.gameState));
  } else if (room.gameId === 'skyjo' && room.gameState) {
    socket.emit('skyjo_state', publicSkyjoState(room.gameState));
  } else if (room.gameId === 'petits-chevaux' && room.gameState) {
    socket.emit('pc_state', publicPCState(room.gameState));
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
    min_players: room.minPlayers || 2,
    settings:    room.settings,
    players:     room.players.map(p => ({
      id: p.id, username: p.username, ready: p.ready,
      lives: p.lives, combo: p.combo, eliminated: p.eliminated, online: !!p.socketId,
    })),
  };
}

module.exports = { initSocket };
