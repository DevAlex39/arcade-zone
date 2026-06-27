const jwt = require('jsonwebtoken');

const { fetchWord, validateWord, computeResult, computeDamage } = require('../games/motus');
const yahtzee = require('../games/yahtzee');
const skyjo   = require('../games/skyjo');
const pc      = require('../games/petits-chevaux');
const quiz    = require('../games/quiz');
const { pool } = require('../config/db');

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
      } else if (room.gameId === 'quiz') {
        startQuizGame(io, room);
      }
    });

    // ─── Actions Quiz ────────────────────────────────────────────────
    socket.on('quiz_answer', ({ code, answer }) => {
      const room = rooms.get(code?.toUpperCase());
      if (!room || room.status !== 'playing' || room.gameId !== 'quiz') return;
      const gs = room.gameState;
      if (!gs || gs.phase !== 'question') return;
      if (gs.eliminated.includes(user.id)) return;
      if (gs.answers[user.id]) return; // déjà répondu

      const elapsed = Date.now() - gs.questionStart;
      const q = gs.questions[gs.currentIdx];
      const isCorrect = answer === q.correct_answer;
      const answersCount = Object.keys(gs.answers).length;
      const points = gs.mode === 1 ? quiz.calcSpeedPoints(elapsed, gs.settings.timer * 1000, isCorrect) : (isCorrect ? 1 : 0);

      gs.answers[user.id] = { answer, elapsed, correct: isCorrect, points };

      // Notifier que le joueur a répondu (sans révéler la réponse)
      io.to(code).emit('quiz_player_answered', { playerId: user.id });

      // Si tout le monde a répondu → résultat immédiat
      const activePlayers = gs.playerIds.filter(id => !gs.eliminated.includes(id));
      const allAnswered = activePlayers.every(id => gs.answers[id]);
      if (allAnswered) {
        clearTimeout(gs.timer);
        gs.timer = null;
        resolveQuizQuestion(io, code, room, gs);
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
      const cats  = room.settings.categories || (room.settings.category ? [room.settings.category] : ['tous']);
      const valid = await validateWord(guess, room.round.word, room.settings.lang || 'fr', cats);
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
            gs.phase = 'draw';
            gs.curPlayer = findSkyjoStartPlayer(gs);
          }
        }
        io.to(code).emit('skyjo_state', publicSkyjoState(gs));
        scheduleAISkyjoTurn(io, code, room);
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
        skyjo.checkColumnElimination(hand, gs.discard);
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
        skyjo.checkColumnElimination(gs.hands[curId], gs.discard);
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
        gs.movablePawns = pc.computeMovablePawns(gs.pawns[curId], gs.colorMap[curId], dice, gs.settings, gs.pawns, gs.colorMap);
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
  const cats = s.categories || (s.category ? [s.category] : ['tous']);
  const word = await fetchWord(s.lang || 'fr', s.minLetters || 5, s.maxLetters || 6, cats);
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
    word: round.word, results, damages, roundIdx: round.idx, categories: room.settings.categories || [room.settings.category || 'tous'],
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

  // Le trouveur inflige des dégâts à tous les autres (qu'ils soient encore en jeu ou non).
  const damages = {};
  room.players.forEach(p => {
    if (p.id === finderId) return;
    const ps = round.playerStates[p.id];
    if (!ps) return;
    if (ps.status === 'playing') ps.status = 'failed';
    damages[p.id] = dmg;
    p.lives = Math.max(0, (p.lives || 0) - dmg);
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
    word: round.word, results, damages, roundIdx: round.idx, categories: room.settings.categories || [room.settings.category || 'tous'],
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
  const realCount = room.players.length;
  const aiCount   = Math.min(room.settings?.aiCount || 0, 8 - realCount);
  const aiPlayers = Array.from({ length: aiCount }, (_, i) => ({
    id: `ai_skyjo_${i}`, username: `IA ${i + 1}`, isAI: true,
  }));
  const allPlayers = [...room.players, ...aiPlayers];
  room.status    = 'playing';
  room.gameState = skyjo.initGame(allPlayers);
  io.to(room.code).emit('skyjo_state', publicSkyjoState(room.gameState));
  scheduleAISkyjoTurn(io, room.code, room);
}

function publicSkyjoState(gs) {
  return {
    players:        gs.players || [],
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
      const winner = (gs.players || []).find(p => p.id === sorted[0].id)
                  || room.players.find(p => p.id === sorted[0].id);

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
  scheduleAISkyjoTurn(io, code, room);
}

function findSkyjoStartPlayer(gs) {
  let maxScore = -Infinity, maxIdx = 0;
  gs.playerOrder.forEach((pid, i) => {
    const s = skyjo.visibleScore(gs.hands[pid]);
    if (s > maxScore) { maxScore = s; maxIdx = i; }
  });
  return maxIdx;
}

function scheduleAISkyjoTurn(io, code, room) {
  if (room.status !== 'playing') return;
  const gs = room.gameState;
  if (!gs || !gs.players) return;

  if (gs.phase === 'initFlip') {
    const flipPid = gs.playerOrder[gs.initFlipPlayer];
    const flipPlayer = gs.players.find(p => p.id === flipPid);
    if (!flipPlayer?.isAI) return;
    aiDoSkyjoInitFlip(io, code, room, gs, flipPid);
    return;
  }

  if (gs.phase === 'finished') return;
  const curId = gs.playerOrder[gs.curPlayer];
  const curPlayer = gs.players.find(p => p.id === curId);
  if (!curPlayer?.isAI) return;

  setTimeout(() => {
    if (room.status !== 'playing') return;
    aiPlaySkyjoTurn(io, code, room, gs, curId);
  }, 900);
}

function aiDoSkyjoInitFlip(io, code, room, gs, flipPid) {
  const hand = gs.hands[flipPid];
  const unrevealed = hand.map((c, i) => i).filter(i => !hand[i].revealed && !hand[i].eliminated);
  if (unrevealed.length < 2) return;

  setTimeout(() => {
    if (room.status !== 'playing') return;
    hand[unrevealed[0]].revealed = true;
    gs.initFlipCount++;
    io.to(code).emit('skyjo_state', publicSkyjoState(gs));

    setTimeout(() => {
      if (room.status !== 'playing') return;
      hand[unrevealed[1]].revealed = true;
      gs.initFlipCount++;
      if (gs.initFlipCount >= 2) {
        gs.initFlipCount = 0;
        gs.initFlipPlayer = (gs.initFlipPlayer + 1) % gs.playerOrder.length;
        if (gs.initFlipPlayer === 0) {
          gs.phase = 'draw';
          gs.curPlayer = findSkyjoStartPlayer(gs);
        }
      }
      io.to(code).emit('skyjo_state', publicSkyjoState(gs));
      scheduleAISkyjoTurn(io, code, room);
    }, 600);
  }, 800);
}

function aiPlaySkyjoTurn(io, code, room, gs, curId) {
  const hand = gs.hands[curId];
  const discardTop = gs.discard[gs.discard.length - 1] ?? null;

  const revealedHigh = hand.reduce((best, c, i) => {
    if (!c.revealed || c.eliminated) return best;
    if (c.value > best.val) return { val: c.value, i };
    return best;
  }, { val: -Infinity, i: -1 });

  // Take discard if it's low and better than our worst revealed
  if (discardTop !== null && discardTop <= 2 && revealedHigh.i >= 0 && discardTop < revealedHigh.val) {
    gs.heldCard = gs.discard.pop();
    gs.heldFrom = 'discard';
    gs.phase = 'hold';
    io.to(code).emit('skyjo_state', publicSkyjoState(gs));
    setTimeout(() => {
      if (room.status !== 'playing') return;
      const old = hand[revealedHigh.i];
      gs.discard.push(old.value);
      old.value = gs.heldCard; old.revealed = true; old.eliminated = false;
      gs.heldCard = null; gs.heldFrom = null;
      skyjo.checkColumnElimination(hand, gs.discard);
      advanceSkyjoTurn(io, code, room, gs);
    }, 700);
    return;
  }

  // Draw from deck
  gs.heldCard = skyjo.deckPop(gs.deck, gs.discard);
  gs.heldFrom = 'deck';
  gs.phase = 'hold';
  io.to(code).emit('skyjo_state', publicSkyjoState(gs));

  setTimeout(() => {
    if (room.status !== 'playing') return;
    // Find worst card to replace (highest value or unknown)
    const worst = hand.reduce((best, c, i) => {
      if (c.eliminated) return best;
      const effective = c.revealed ? c.value : 6;
      if (effective > best.val) return { val: effective, i };
      return best;
    }, { val: -Infinity, i: -1 });

    if (gs.heldCard < (worst.val > 5 ? worst.val : 7) && worst.i >= 0) {
      const old = hand[worst.i];
      gs.discard.push(old.value);
      old.value = gs.heldCard; old.revealed = true; old.eliminated = false;
      gs.heldCard = null; gs.heldFrom = null;
      skyjo.checkColumnElimination(hand, gs.discard);
    } else {
      // Discard and flip an unrevealed card
      gs.discard.push(gs.heldCard);
      gs.heldCard = null; gs.heldFrom = null;
      const unIdx = hand.findIndex(c => !c.revealed && !c.eliminated);
      if (unIdx >= 0) {
        hand[unIdx].revealed = true;
        skyjo.checkColumnElimination(hand, gs.discard);
      }
    }
    advanceSkyjoTurn(io, code, room, gs);
  }, 700);
}

// ═══════════════════════════════════════════════════════════════════════
// PETITS CHEVAUX
// ═══════════════════════════════════════════════════════════════════════
function startPCGame(io, room) {
  const realCount = room.players.length;
  const aiCount   = Math.min(room.settings.aiCount || 0, 4 - realCount);
  const aiPlayers = Array.from({ length: aiCount }, (_, i) => ({
    id: `ai_${i}`, username: `IA ${i + 1}`, isAI: true,
  }));
  const allPlayers = [...room.players, ...aiPlayers];
  room.status    = 'playing';
  room.gameState = pc.initGame(allPlayers, room.settings.pionsPerPlayer || 2);
  room.gameState.settings = room.settings; // pour y accéder depuis les fonctions AI
  io.to(room.code).emit('pc_state', publicPCState(room.gameState));
  scheduleAITurn(io, room.code, room);
}

function pickBestPion(gs, pid, movable, diceValue) {
  const color = gs.colorMap[pid];
  const pawns = gs.pawns[pid];
  // 1. Capturer un adversaire
  for (const idx of movable) {
    const pion = pawns[idx];
    if (pion.pos === pc.POS_STABLE || pion.pos >= pc.TRACK_LEN) continue;
    const newPos = pion.pos + diceValue;
    if (newPos >= pc.TRACK_LEN) continue;
    const absNew = pc.getAbsPos(newPos, color);
    if (pc.SAFE_ABS.has(absNew)) continue;
    for (const [othId, othPawns] of Object.entries(gs.pawns)) {
      if (othId === pid) continue;
      const othColor = gs.colorMap[othId];
      for (const op of othPawns) {
        if (op.pos === pc.POS_STABLE || op.pos >= pc.TRACK_LEN) continue;
        if (pc.getAbsPos(op.pos, othColor) === absNew) return idx;
      }
    }
  }
  // 2. Sortir de l'écurie sur un 6
  if (diceValue === 6) {
    const out = movable.find(i => pawns[i].pos === pc.POS_STABLE);
    if (out !== undefined) return out;
  }
  // 3. Avancer le pion le plus en avant
  return movable.reduce((best, idx) => pawns[idx].pos > pawns[best].pos ? idx : best, movable[0]);
}

function scheduleAITurn(io, code, room) {
  if (room.status !== 'playing') return;
  const gs    = room.gameState;
  const curId = gs.playerOrder[gs.curPlayer];
  const isAI  = gs.players.find(p => p.id === curId)?.isAI;
  if (!isAI) return;
  setTimeout(() => {
    if (room.status !== 'playing') return;
    // Lancer le dé
    const dice = pc.rollDice();
    gs.diceValue    = dice;
    gs.hasRolled    = true;
    gs.movablePawns = pc.computeMovablePawns(gs.pawns[curId], gs.colorMap[curId], dice, gs.settings, gs.pawns, gs.colorMap);
    io.to(code).emit('pc_state', publicPCState(gs));
    setTimeout(() => {
      if (room.status !== 'playing') return;
      if (gs.movablePawns.length === 0) {
        advancePCTurn(io, code, room, gs, dice === 6 && (room.settings.rejouerSur6 !== false));
      } else {
        applyPCMove(io, code, room, gs, pickBestPion(gs, curId, gs.movablePawns, dice));
      }
    }, 600);
  }, 900);
}

function publicPCState(gs) {
  return {
    players:      gs.players,
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
    io.to(code).emit('game_over', { winner: gs.players.find(p => p.id === winner) || null });
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
  scheduleAITurn(io, code, room);
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
  } else if (room.gameId === 'quiz' && room.gameState) {
    const gs = room.gameState;
    const q = gs.questions[gs.currentIdx];
    socket.emit('quiz_question', {
      question: quiz.publicQuestion(q, gs.currentIdx, gs.questions.length, gs.settings.timer),
      scores: gs.mode !== 2 ? gs.scores : null,
      lives: gs.lives,
      eliminated: gs.eliminated,
      players: gs.players,
    });
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

// ═══════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════
async function startQuizGame(io, room) {
  const s = room.settings;
  const mode = parseInt(s.quizMode || 1);
  const timer = parseInt(s.timer || 15);
  const targetScore = parseInt(s.targetScore || 100);
  const questionCount = parseInt(s.questionCount || 20);
  const lives = parseInt(s.lives || 5);
  const categories = s.quizCategories || [];
  const questionTypes = s.questionTypes || 'both';
  const difficulty = s.difficulty || 'mixed';
  const lang = s.quizLang || s.lang || 'fr';

  // Récupérer les questions depuis la DB
  let catFilter = '';
  let params = [lang];
  if (categories.length > 0) {
    catFilter = `AND qc.id IN (${categories.map(() => '?').join(',')})`;
    params.push(...categories);
  }
  let typeFilter = '';
  if (questionTypes === 'multiple') typeFilter = `AND qq.type = 'multiple'`;
  else if (questionTypes === 'boolean') typeFilter = `AND qq.type = 'boolean'`;

  let diffFilter = '';
  if (difficulty !== 'mixed') diffFilter = `AND qq.difficulty = '${difficulty}'`;

  const limit = mode === 1 ? 999 : questionCount; // mode 1 : illimité jusqu'au score cible
  const [rows] = await pool.query(
    `SELECT qq.*, qc.name_fr AS category_name, qc.name_en AS category_name_en
     FROM quiz_questions qq
     JOIN quiz_categories qc ON qq.category_id = qc.id
     WHERE qq.lang = ? ${catFilter} ${typeFilter} ${diffFilter}
     ORDER BY RAND() LIMIT ?`,
    [...params, limit]
  );

  if (rows.length === 0) {
    io.to(room.code).emit('error', 'Aucune question trouvée avec ces paramètres.');
    return;
  }

  const settings = { mode, timer, targetScore, questionCount: rows.length, lives };
  room.status    = 'playing';
  room.gameState = quiz.initGame(room.players, settings, rows);
  sendQuizQuestion(io, room.code, room);
}

function sendQuizQuestion(io, code, room) {
  const gs = room.gameState;
  gs.phase         = 'question';
  gs.answers       = {};
  gs.questionStart = Date.now();

  const q = gs.questions[gs.currentIdx];
  const publicQ = quiz.publicQuestion(q, gs.currentIdx, gs.questions.length, gs.settings.timer);

  io.to(code).emit('quiz_question', {
    question: publicQ,
    scores:   gs.mode !== 2 ? gs.scores : null,
    lives:    gs.lives,
    eliminated: gs.eliminated,
    players:  gs.players,
  });

  // Timer serveur
  gs.timer = setTimeout(() => {
    gs.timer = null;
    resolveQuizQuestion(io, code, room, gs);
  }, gs.settings.timer * 1000 + 500); // +500ms de marge réseau
}

function resolveQuizQuestion(io, code, room, gs) {
  const q = gs.questions[gs.currentIdx];
  const activePlayers = gs.playerIds.filter(id => !gs.eliminated.includes(id));

  // Appliquer les résultats
  const results = {};
  activePlayers.forEach(id => {
    const ans = gs.answers[id];
    const isCorrect = ans?.correct || false;
    const points    = ans?.points  || 0;

    if (gs.mode === 1 || gs.mode === 2) {
      gs.scores[id] = (gs.scores[id] || 0) + points;
    } else if (gs.mode === 3) {
      if (!isCorrect) {
        gs.lives[id] = Math.max(0, (gs.lives[id] || 0) - 1);
        if (gs.lives[id] <= 0 && !gs.eliminated.includes(id)) {
          gs.eliminated.push(id);
        }
      }
    }
    results[id] = { correct: isCorrect, answer: ans?.answer || null, points, elapsed: ans?.elapsed || null };
  });

  io.to(code).emit('quiz_result', {
    correctAnswer: q.correct_answer,
    results,
    scores: gs.scores,
    lives:  gs.lives,
    eliminated: gs.eliminated,
  });

  // Vérifier fin de partie
  setTimeout(() => {
    if (room.status !== 'playing') return;

    const stillAlive = gs.playerIds.filter(id => !gs.eliminated.includes(id));

    // Mode 1 : quelqu'un a atteint le score cible ?
    if (gs.mode === 1) {
      const winner = gs.playerIds.find(id => gs.scores[id] >= gs.settings.targetScore);
      if (winner) { endQuizGame(io, code, room, gs); return; }
    }

    // Mode 3 : plus qu'un seul joueur en vie ?
    if (gs.mode === 3 && stillAlive.length <= 1) {
      endQuizGame(io, code, room, gs); return;
    }

    // Mode 2 : toutes les questions épuisées ?
    if (gs.mode === 2 && gs.currentIdx >= gs.questions.length - 1) {
      endQuizGame(io, code, room, gs); return;
    }

    // Mode 1 : plus de questions (sécurité)
    if (gs.mode === 1 && gs.currentIdx >= gs.questions.length - 1) {
      endQuizGame(io, code, room, gs); return;
    }

    // Question suivante
    gs.currentIdx++;
    sendQuizQuestion(io, code, room);
  }, 4000); // 4s pour voir le résultat avant la prochaine question
}

function endQuizGame(io, code, room, gs) {
  gs.phase    = 'end';
  room.status = 'finished';

  // Classement final
  const rankings = gs.playerIds
    .map(id => ({
      id,
      username: gs.players.find(p => p.id === id)?.username || id,
      score:    gs.scores[id] || 0,
      lives:    gs.lives[id] || 0,
      eliminated: gs.eliminated.includes(id),
    }))
    .sort((a, b) => {
      if (gs.mode === 3) {
        // Survivant d'abord, puis par vies restantes
        if (!a.eliminated && b.eliminated) return -1;
        if (a.eliminated && !b.eliminated) return 1;
        return b.lives - a.lives;
      }
      return b.score - a.score;
    });

  const winner = rankings[0] ? room.players.find(p => p.id === rankings[0].id) || rankings[0] : null;

  io.to(code).emit('quiz_end', { rankings, mode: gs.mode, winner });
  io.to(code).emit('game_over', { winner });
  rooms.delete(code);
}

module.exports = { initSocket };
