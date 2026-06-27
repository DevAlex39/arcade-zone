function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Retourne la question à envoyer aux clients (sans la bonne réponse)
function publicQuestion(q, idx, total, timeLimit) {
  const answers = q.type === 'boolean'
    ? ['True', 'False']
    : shuffle([q.correct_answer, ...JSON.parse(q.incorrect_answers)]);
  return {
    idx,
    total,
    id: q.id,
    question: q.question,
    answers,
    type: q.type,
    category: q.category_name,
    difficulty: q.difficulty,
    timeLimit,
  };
}

// Calcule les points pour le mode 1 (vitesse)
// Premier correct = 10 pts, dernier correct avant le timer = 1 pt
function calcSpeedPoints(elapsedMs, timeLimitMs, isCorrect, answerRank) {
  if (!isCorrect) return 0;
  const timeRatio = Math.max(0, 1 - elapsedMs / timeLimitMs);
  const base = Math.max(1, Math.round(1 + timeRatio * 9));
  return base;
}

// Initialise le game state
function initGame(players, settings, questions) {
  const { mode = 1, timer = 15, targetScore = 100, questionCount = 20, lives = 5 } = settings;

  const playerIds = players.map(p => p.id);
  const scores    = {};
  const livesMap  = {};
  playerIds.forEach(id => { scores[id] = 0; livesMap[id] = lives; });

  return {
    phase:       'question', // question | result | reveal | end
    mode,
    settings,
    players:     players.map(p => ({ id: p.id, username: p.username })),
    playerIds,
    questions,   // full list (server-side only)
    currentIdx:  0,
    scores,
    lives:       livesMap,
    eliminated:  [],
    answers:     {},      // { [playerId]: { answer, elapsed, correct, points } }
    questionStart: null,
    timer:       null,    // server-side timeout ref
  };
}

module.exports = { publicQuestion, calcSpeedPoints, initGame, shuffle };
