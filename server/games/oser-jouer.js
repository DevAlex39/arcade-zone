// ═══════════════════════════════════════════════════════════════════
//  OSER JOUER — logique serveur (type Limite-Limite / Blanc Manger Coco)
//  Modes : 'master' (Maître du jeu) | 'vote' (Vote unanime)
// ═══════════════════════════════════════════════════════════════════
const { getDeck, blanksCount } = require('./oser-jouer-cards');

const HAND_SIZE = 7;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initGame(players, settings) {
  const category    = settings.ojCategory || 'all';   // 'public' | 'trash' | 'all'
  const mode        = settings.ojMode === 'vote' ? 'vote' : 'master';
  const targetScore = parseInt(settings.ojTargetScore) || 10;

  const deck = getDeck(category);
  // Cartes indexées avec id pour référence côté client
  const answerCards = shuffle(deck.answers.map((c, i) => ({ id: i, fr: c.fr, en: c.en })));
  const promptCards = shuffle(deck.prompts.map((c, i) => ({ id: i, fr: c.fr, en: c.en, blanks: blanksCount(c) })));

  const playerIds = players.map(p => p.id);
  const hands  = {};
  const scores = {};
  playerIds.forEach(id => { scores[id] = 0; hands[id] = []; });

  const gs = {
    mode, targetScore, category,
    players: players.map(p => ({ id: p.id, username: p.username })),
    playerIds,
    hands,              // { pid: [card, …] }
    scores,             // { pid: points }
    drawPile:    answerCards,
    promptPile:  promptCards,
    discard:     [],
    roundIdx:    0,
    masterIdx:   0,     // mode master : index du maître dans playerIds
    phase:       'submit',  // submit | judge | vote | reveal | end
    prompt:      null,
    submissions: {},    // { pid: [card, …] }
    submitOrder: [],    // ordre anonymisé pour l'affichage
    votes:       {},    // mode vote : { pid: targetPid }
    roundWinners: [],
    winner:      null,
  };
  playerIds.forEach(id => refillHand(gs, id));
  startRound(gs);
  return gs;
}

function drawAnswer(gs) {
  if (gs.drawPile.length === 0) gs.drawPile = shuffle(gs.discard.splice(0));
  return gs.drawPile.pop() || null;
}

function refillHand(gs, pid) {
  const hand = gs.hands[pid];
  while (hand.length < HAND_SIZE) {
    const c = drawAnswer(gs);
    if (!c) break;
    hand.push(c);
  }
}

function startRound(gs) {
  gs.roundIdx++;
  gs.phase       = 'submit';
  gs.submissions = {};
  gs.submitOrder = [];
  gs.votes       = {};
  gs.roundWinners = [];
  // Manche finale : un joueur est à 1 point de la victoire → ses adversaires marquent DOUBLE
  gs.leaders    = gs.playerIds.filter(id => (gs.scores[id] || 0) >= gs.targetScore - 1).map(String);
  gs.finalRound = gs.leaders.length > 0;
  if (gs.promptPile.length === 0) {
    // Recycler tous les prompts si épuisés
    const deck = getDeck(gs.category);
    gs.promptPile = shuffle(deck.prompts.map((c, i) => ({ id: i, fr: c.fr, en: c.en, blanks: blanksCount(c) })));
  }
  gs.prompt = gs.promptPile.pop();
}

// Joueurs devant soumettre une carte ce tour
function submitters(gs) {
  if (gs.mode === 'master') {
    const masterId = gs.playerIds[gs.masterIdx % gs.playerIds.length];
    return gs.playerIds.filter(id => id !== masterId);
  }
  return [...gs.playerIds];
}

function masterId(gs) {
  return gs.mode === 'master' ? gs.playerIds[gs.masterIdx % gs.playerIds.length] : null;
}

// Soumission d'un joueur : cardIds = ids des cartes de sa main (ordre = ordre des trous)
function submitCards(gs, pid, cardIds) {
  if (gs.phase !== 'submit') return { error: 'Phase invalide' };
  if (!submitters(gs).includes(pid)) return { error: 'Vous ne jouez pas ce tour' };
  if (gs.submissions[pid]) return { error: 'Déjà validé' };
  const need = gs.prompt.blanks;
  if (!Array.isArray(cardIds) || cardIds.length !== need) return { error: `Il faut ${need} carte(s)` };

  const hand  = gs.hands[pid];
  const cards = [];
  for (const cid of cardIds) {
    const idx = hand.findIndex(c => c.id === cid);
    if (idx === -1) return { error: 'Carte inconnue' };
    cards.push(hand.splice(idx, 1)[0]);
  }
  gs.submissions[pid] = cards;

  const allDone = submitters(gs).every(id => gs.submissions[id]);
  if (allDone) {
    gs.submitOrder = shuffle(Object.keys(gs.submissions));
    gs.phase = gs.mode === 'master' ? 'judge' : 'vote';
  }
  return { ok: true, allDone };
}

// Points d'une victoire de manche : double pour les poursuivants en manche finale
function roundPoints(gs, pid) {
  return (gs.finalRound && !gs.leaders.includes(String(pid))) ? 2 : 1;
}

// Mode master : le maître choisit la meilleure soumission
function judgePick(gs, pid, winnerPid) {
  if (gs.phase !== 'judge') return { error: 'Phase invalide' };
  if (String(pid) !== String(masterId(gs))) return { error: 'Seul le Maître du jeu choisit' };
  if (!gs.submissions[winnerPid]) return { error: 'Soumission inconnue' };
  gs.roundWinners = [winnerPid];
  gs.scores[winnerPid] += roundPoints(gs, winnerPid);
  return finishRound(gs);
}

// Mode vote : chaque joueur vote (pas pour lui-même)
function castVote(gs, pid, targetPid) {
  if (gs.phase !== 'vote') return { error: 'Phase invalide' };
  if (!gs.playerIds.includes(pid)) return { error: 'Joueur inconnu' };
  if (gs.votes[pid]) return { error: 'Déjà voté' };
  if (String(pid) === String(targetPid)) return { error: 'Impossible de voter pour soi-même' };
  if (!gs.submissions[targetPid]) return { error: 'Soumission inconnue' };
  gs.votes[pid] = targetPid;

  const allVoted = gs.playerIds.every(id => gs.votes[id]);
  if (!allVoted) return { ok: true, allDone: false };

  // Dépouillement : le(s) plus voté(s) gagne(nt) 1 point (égalité = tous gagnent)
  const counts = {};
  Object.values(gs.votes).forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  const max = Math.max(...Object.values(counts));
  gs.roundWinners = Object.keys(counts).filter(t => counts[t] === max);
  gs.roundWinners.forEach(w => { gs.scores[w] += roundPoints(gs, w); });
  const r = finishRound(gs);
  return { ...r, allDone: true };
}

function finishRound(gs) {
  gs.phase = 'reveal';
  // Défausser les cartes jouées
  Object.values(gs.submissions).forEach(cards => gs.discard.push(...cards));
  // Vainqueur de la partie ?
  const gameWinner = gs.playerIds.find(id => gs.scores[id] >= gs.targetScore);
  if (gameWinner) {
    gs.winner = gameWinner;
    gs.phase  = 'end';
  }
  return { ok: true, gameOver: !!gameWinner };
}

// Passage à la manche suivante (après le reveal)
function nextRound(gs) {
  if (gs.phase !== 'reveal') return { error: 'Phase invalide' };
  // Re-piocher autant de cartes que posées
  Object.keys(gs.submissions).forEach(pid => refillHand(gs, pid));
  if (gs.mode === 'master') gs.masterIdx = (gs.masterIdx + 1) % gs.playerIds.length;
  startRound(gs);
  return { ok: true };
}

// Retire un joueur (kick / départ) — cartes défaussées, score supprimé
function removePlayer(gs, pid) {
  const idx = gs.playerIds.indexOf(pid);
  if (idx === -1) return;
  gs.playerIds.splice(idx, 1);
  gs.players = gs.players.filter(p => p.id !== pid);
  if (gs.hands[pid]) gs.discard.push(...gs.hands[pid]);
  delete gs.hands[pid];
  delete gs.scores[pid];
  delete gs.submissions[pid];
  delete gs.votes[pid];
  gs.submitOrder = gs.submitOrder.filter(id => id !== pid);
  if (gs.mode === 'master' && idx < gs.masterIdx) gs.masterIdx--;
  if (gs.masterIdx >= gs.playerIds.length) gs.masterIdx = 0;
  // Retirer les votes pointant vers ce joueur
  Object.keys(gs.votes).forEach(v => { if (gs.votes[v] === pid) delete gs.votes[v]; });
}

// État public commun (sans les mains des autres ni les auteurs avant le reveal)
function publicState(gs, forPid) {
  const revealAuthors = gs.phase === 'reveal' || gs.phase === 'end';
  return {
    mode:        gs.mode,
    targetScore: gs.targetScore,
    category:    gs.category,
    players:     gs.players,
    scores:      gs.scores,
    roundIdx:    gs.roundIdx,
    phase:       gs.phase,
    prompt:      gs.prompt,
    finalRound:  gs.finalRound || false,
    leaders:     gs.leaders || [],
    masterId:    masterId(gs),
    myHand:      gs.hands[forPid] || [],
    submittedIds: Object.keys(gs.submissions),
    // Soumissions anonymisées (judge/vote) ou attribuées (reveal/end)
    submissions: (gs.phase === 'judge' || gs.phase === 'vote' || revealAuthors)
      ? gs.submitOrder.map(pid => ({
          pid: revealAuthors ? pid : null,
          key: gs.submitOrder.indexOf(pid),
          cards: gs.submissions[pid],
        }))
      : [],
    votes:        revealAuthors ? gs.votes : {},
    votedIds:     Object.keys(gs.votes),
    roundWinners: gs.roundWinners,
    winner:       gs.winner,
  };
}

module.exports = {
  initGame, submitCards, judgePick, castVote, nextRound, removePlayer,
  publicState, submitters, masterId, HAND_SIZE,
};
