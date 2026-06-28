const { pool } = require('../config/db');

// ── Formule de niveau ──────────────────────────────────────────────────────
// XP total pour atteindre le niveau n : n*(n-1)/2 * 100
// Lv1=0, Lv2=100, Lv3=300, Lv4=600, Lv5=1000, Lv10=4500

function totalXpForLevel(n) {
  return n <= 1 ? 0 : n * (n - 1) / 2 * 100;
}

function levelFromXp(xp) {
  if (xp <= 0) return 1;
  // Résoudre n*(n-1)/2*100 <= xp  →  n = floor((1+sqrt(1+0.08*xp))/2)
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + 0.08 * xp)) / 2));
}

function levelProgress(xp) {
  const level       = levelFromXp(xp);
  const xpThisLevel = totalXpForLevel(level);
  const xpNextLevel = totalXpForLevel(level + 1);
  return {
    level,
    xpInLevel:  xp - xpThisLevel,
    xpForLevel: xpNextLevel - xpThisLevel,
    pct: Math.min(100, Math.floor((xp - xpThisLevel) / (xpNextLevel - xpThisLevel) * 100)),
  };
}

// ── Défis quotidiens ───────────────────────────────────────────────────────
const CHALLENGES = [
  { id:  1, game: 'quiz',          type: 'win_solo',       target: 1,  xp: 150, icon: '🧠', desc: 'Terminer une partie solo de Quiz Zone (sans perdre toutes ses vies)' },
  { id:  2, game: 'quiz',          type: 'correct',        target: 15, xp: 150, icon: '✅', desc: 'Répondre correctement à 15 questions de Quiz' },
  { id:  3, game: 'petits-chevaux',type: 'win',            target: 1,  xp: 150, icon: '🐴', desc: 'Gagner une partie de Petits Chevaux' },
  { id:  4, game: 'yahtzee',       type: 'play',           target: 1,  xp: 100, icon: '🎯', desc: 'Jouer une partie de Roll the Dice' },
  { id:  5, game: 'motus',         type: 'win',            target: 1,  xp: 150, icon: '🔤', desc: 'Trouver un mot dans Trouve le Mot' },
  { id:  6, game: null,            type: 'play_distinct',  target: 3,  xp: 200, icon: '🎮', desc: 'Jouer à 3 jeux différents aujourd\'hui' },
  { id:  7, game: 'skyjo',         type: 'win',            target: 1,  xp: 150, icon: '🃏', desc: 'Gagner une partie de Cell Number' },
  { id:  8, game: 'quiz',          type: 'win_multi',      target: 1,  xp: 200, icon: '🏆', desc: 'Gagner une partie multijoueur de Quiz Zone' },
  { id:  9, game: null,            type: 'win_any',        target: 2,  xp: 200, icon: '🥇', desc: 'Gagner 2 parties dans la même journée' },
  { id: 10, game: 'yahtzee',       type: 'win',            target: 1,  xp: 150, icon: '🎲', desc: 'Gagner une partie de Roll the Dice' },
  { id: 11, game: 'skyjo',         type: 'play',           target: 1,  xp: 100, icon: '🃏', desc: 'Jouer une partie de Cell Number' },
  { id: 12, game: 'petits-chevaux',type: 'play',           target: 1,  xp: 100, icon: '🐴', desc: 'Jouer une partie de Petits Chevaux' },
  { id: 13, game: 'quiz',          type: 'correct',        target: 25, xp: 200, icon: '🧠', desc: 'Répondre correctement à 25 questions de Quiz' },
  { id: 14, game: null,            type: 'win_any',        target: 1,  xp: 100, icon: '🏅', desc: 'Gagner n\'importe quelle partie' },
];

function getTodayChallenge() {
  const start    = new Date(2026, 0, 1);
  const today    = new Date();
  const dayIndex = Math.floor((today - start) / 86400000);
  return CHALLENGES[dayIndex % CHALLENGES.length];
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Récompense XP ──────────────────────────────────────────────────────────
async function awardXp(userId, amount, reason, gameId = null) {
  if (!userId || String(userId).startsWith('guest')) return null;
  const uid = parseInt(userId);
  if (isNaN(uid)) return null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[user]] = await conn.query('SELECT xp, level FROM users WHERE id=?', [uid]);
    if (!user) { await conn.rollback(); return null; }

    const newXp    = (user.xp || 0) + amount;
    const newLevel = levelFromXp(newXp);
    const leveledUp = newLevel > (user.level || 1);

    await conn.query('UPDATE users SET xp=?, level=? WHERE id=?', [newXp, newLevel, uid]);
    await conn.query(
      'INSERT INTO xp_log (user_id, amount, reason, game_id) VALUES (?,?,?,?)',
      [uid, amount, reason, gameId]
    );

    await conn.commit();
    return { xp: newXp, amount, reason, leveledUp, ...levelProgress(newXp) };
  } catch (e) {
    await conn.rollback();
    console.error('awardXp error:', e.message);
    return null;
  } finally {
    conn.release();
  }
}

// ── Bonus connexion journalier ──────────────────────────────────────────────
async function claimDailyBonus(userId) {
  if (!userId || String(userId).startsWith('guest')) return null;
  const uid = parseInt(userId);
  if (isNaN(uid)) return null;

  const today = todayStr();
  const [[user]] = await pool.query('SELECT last_daily_bonus FROM users WHERE id=?', [uid]);
  if (!user) return null;

  const lastBonus = user.last_daily_bonus ? String(user.last_daily_bonus).slice(0, 10) : null;
  if (lastBonus === today) return { already: true };

  await pool.query('UPDATE users SET last_daily_bonus=? WHERE id=?', [today, uid]);
  const result = await awardXp(uid, 25, 'daily_login');
  return { ...result, already: false, bonus: 25 };
}

// ── Mise à jour défi quotidien ──────────────────────────────────────────────
async function updateChallenge(userId, eventType, gameId, delta = 1) {
  if (!userId || String(userId).startsWith('guest')) return null;
  const uid = parseInt(userId);
  if (isNaN(uid)) return null;

  const challenge = getTodayChallenge();
  const today     = todayStr();

  // Vérifier si ce défi est concerné par cet événement
  const matches =
    challenge.type === eventType &&
    (challenge.game === null || challenge.game === gameId);

  if (!matches) return null;

  // Récupérer ou créer la progression du jour
  const [[existing]] = await pool.query(
    'SELECT * FROM user_daily_challenges WHERE user_id=? AND challenge_date=?',
    [uid, today]
  );

  if (existing?.completed) return { already: true };

  if (!existing) {
    await pool.query(
      'INSERT INTO user_daily_challenges (user_id, challenge_date, challenge_id, progress) VALUES (?,?,?,?)',
      [uid, today, challenge.id, 0]
    );
  }

  const newProgress = (existing?.progress || 0) + delta;
  const completed   = newProgress >= challenge.target;

  await pool.query(
    'UPDATE user_daily_challenges SET progress=?, completed=?, completed_at=? WHERE user_id=? AND challenge_date=?',
    [Math.min(newProgress, challenge.target), completed, completed ? new Date() : null, uid, today]
  );

  if (completed) {
    const xpResult = await awardXp(uid, challenge.xp, 'daily_challenge', gameId);
    return { completed: true, xpResult, challenge };
  }

  return { completed: false, progress: newProgress, target: challenge.target };
}

// ── Enregistrer une partie en historique ───────────────────────────────────
async function recordGame(userId, gameId, result, score = null, playersCount = 1, details = null) {
  if (!userId || String(userId).startsWith('guest')) return;
  const uid = parseInt(userId);
  if (isNaN(uid)) return;

  try {
    await pool.query(
      'INSERT INTO game_history (user_id, game_id, result, score, players_count, details) VALUES (?,?,?,?,?,?)',
      [uid, gameId, result, score, playersCount, details ? JSON.stringify(details) : null]
    );
  } catch {}
}

module.exports = {
  awardXp, claimDailyBonus, updateChallenge, recordGame,
  levelFromXp, levelProgress, totalXpForLevel,
  getTodayChallenge, CHALLENGES, todayStr,
};
