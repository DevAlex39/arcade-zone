// ═══════════════════════════════════════════════════════════════════
//  FAIS DEVINER ! — logique serveur (Times Up en ligne, support de soirée)
//  Le site affiche la carte à l'orateur + timer + scores ; on parle IRL.
//  3 manches sur le même paquet : 1) description libre 2) UN mot 3) mime
// ═══════════════════════════════════════════════════════════════════
const { WORDS } = require('./fais-deviner-cards');

function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

function initGame(players, settings) {
  const turnSec   = [30, 45, 60].includes(parseInt(settings.fdTurnSec)) ? parseInt(settings.fdTurnSec) : 45;
  const cardCount = Math.min(Math.max(parseInt(settings.fdCards) || 30, 10), WORDS.length);

  const teams = { blue: [], red: [] };
  players.forEach((p, i) => teams[i % 2 === 0 ? 'blue' : 'red'].push(p.id));

  const deckAll = shuffle(WORDS.map((w, i) => ({ id: i, fr: w.fr, en: w.en }))).slice(0, cardCount);

  return {
    players: players.map(p => ({ id: p.id, username: p.username })),
    teams, turnSec, cardCount,
    round: 1,                    // 1..3
    phase: 'idle',               // idle (avant un tour) | turn | roundEnd | end
    curTeam: 'blue',
    speakerIdx: { blue: 0, red: 0 },
    deckAll,
    deck: shuffle([...deckAll]),
    current: null,               // carte en cours (visible orateur uniquement)
    scores: { blue: [0, 0, 0], red: [0, 0, 0] },  // points par manche
    timerEnd: null,
    timer: null,                 // ref serveur
    winner: null,
  };
}

function speakerId(gs) {
  const t = gs.teams[gs.curTeam];
  return t.length ? t[gs.speakerIdx[gs.curTeam] % t.length] : null;
}

function totalScore(gs, team) {
  return gs.scores[team].reduce((a, b) => a + b, 0);
}

// L'orateur lance son tour
function startTurn(gs, pid) {
  if (gs.phase !== 'idle') return { error: 'Phase invalide' };
  if (String(pid) !== String(speakerId(gs))) return { error: 'Ce n\'est pas à vous de faire deviner' };
  gs.phase    = 'turn';
  gs.current  = gs.deck.pop() || null;
  gs.timerEnd = Date.now() + gs.turnSec * 1000;
  return { ok: true };
}

// Mot trouvé → point, carte suivante (fin de manche si paquet vide)
function found(gs, pid) {
  if (gs.phase !== 'turn') return { error: 'Phase invalide' };
  if (String(pid) !== String(speakerId(gs))) return { error: 'Réservé à l\'orateur' };
  if (!gs.current) return { error: 'Aucune carte' };
  gs.scores[gs.curTeam][gs.round - 1]++;
  gs.current = gs.deck.pop() || null;
  if (!gs.current) return endRound(gs);
  return { ok: true };
}

// Passer → carte remise sous le paquet
function pass(gs, pid) {
  if (gs.phase !== 'turn') return { error: 'Phase invalide' };
  if (String(pid) !== String(speakerId(gs))) return { error: 'Réservé à l\'orateur' };
  if (!gs.current) return { error: 'Aucune carte' };
  if (gs.deck.length === 0) return { error: 'Dernière carte — impossible de passer !' };
  gs.deck.unshift(gs.current);
  gs.current = gs.deck.pop();
  return { ok: true };
}

// Fin du tour (timer écoulé) : carte en cours remise sous le paquet, équipe suivante
function endTurn(gs) {
  if (gs.phase !== 'turn') return { ok: false };
  if (gs.current) { gs.deck.unshift(gs.current); gs.current = null; }
  gs.timerEnd = null;
  gs.speakerIdx[gs.curTeam]++;
  gs.curTeam = gs.curTeam === 'blue' ? 'red' : 'blue';
  gs.phase = 'idle';
  return { ok: true };
}

// Fin de manche : paquet épuisé
function endRound(gs) {
  gs.current  = null;
  gs.timerEnd = null;
  if (gs.round >= 3) {
    gs.phase  = 'end';
    const b = totalScore(gs, 'blue'), r = totalScore(gs, 'red');
    gs.winner = b === r ? 'tie' : (b > r ? 'blue' : 'red');
    return { ok: true, gameOver: true };
  }
  gs.phase = 'roundEnd';
  return { ok: true, roundOver: true };
}

// Lancer la manche suivante (même paquet remélangé, rotation continue)
function nextRound(gs) {
  if (gs.phase !== 'roundEnd') return { error: 'Phase invalide' };
  gs.round++;
  gs.deck = shuffle([...gs.deckAll]);
  gs.speakerIdx[gs.curTeam]++;
  gs.curTeam = gs.curTeam === 'blue' ? 'red' : 'blue';
  gs.phase = 'idle';
  return { ok: true };
}

// Retrait d'un joueur (kick / départ)
function removePlayer(gs, pid) {
  gs.players = gs.players.filter(p => String(p.id) !== String(pid));
  for (const team of ['blue', 'red']) {
    const idx = gs.teams[team].findIndex(id => String(id) === String(pid));
    if (idx !== -1) {
      gs.teams[team].splice(idx, 1);
      if (idx < gs.speakerIdx[team] % Math.max(1, gs.teams[team].length + 1)) gs.speakerIdx[team]--;
    }
  }
}

function publicState(gs, forPid) {
  const sid = speakerId(gs);
  const isSpeaker = String(forPid) === String(sid);
  return {
    players:    gs.players,
    teams:      gs.teams,
    turnSec:    gs.turnSec,
    round:      gs.round,
    phase:      gs.phase,
    curTeam:    gs.curTeam,
    speakerId:  sid,
    deckLeft:   gs.deck.length + (gs.current ? 1 : 0),
    cardCount:  gs.cardCount,
    scores:     gs.scores,
    totals:     { blue: totalScore(gs, 'blue'), red: totalScore(gs, 'red') },
    timerEnd:   gs.timerEnd,
    // La carte n'est visible QUE par l'orateur
    card:       isSpeaker && gs.phase === 'turn' ? gs.current : null,
    winner:     gs.winner,
  };
}

module.exports = { initGame, startTurn, found, pass, endTurn, endRound, nextRound, removePlayer, publicState, speakerId, totalScore };
