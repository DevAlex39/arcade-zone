const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');
const { awardXp, claimDailyBonus, levelProgress, getTodayChallenge, todayStr, updateChallenge, recordGame } = require('../services/xp');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Non authentifié' });
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Token invalide' }); }
}

// GET /api/xp/me — profil XP complet
router.get('/me', authMiddleware, async (req, res) => {
  if (req.user.isGuest) return res.json({ guest: true });
  const uid = req.user.id;
  const today = todayStr();

  try {
    const [[user]] = await pool.query('SELECT xp, level, last_daily_bonus FROM users WHERE id=?', [uid]);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const progress = levelProgress(user.xp || 0);

    // Défi du jour
    const challenge = getTodayChallenge();
    const [[challRow]] = await pool.query(
      'SELECT progress, completed FROM user_daily_challenges WHERE user_id=? AND challenge_date=?',
      [uid, today]
    );
    const dailyBonus = String(user.last_daily_bonus || '').slice(0, 10) === today;

    // Historique récent (10 dernières)
    const [history] = await pool.query(
      `SELECT gh.*, g.name AS game_name, g.icon AS game_icon
       FROM game_history gh
       LEFT JOIN games g ON g.id = gh.game_id
       WHERE gh.user_id = ?
       ORDER BY gh.played_at DESC LIMIT 10`,
      [uid]
    );

    // XP log récent (5 derniers gains)
    const [xpLog] = await pool.query(
      'SELECT amount, reason, game_id, created_at FROM xp_log WHERE user_id=? ORDER BY created_at DESC LIMIT 5',
      [uid]
    );

    // Stats globales
    const [[stats]] = await pool.query(
      `SELECT COUNT(*) AS total_games,
              SUM(result='win') AS wins,
              SUM(result='loss') AS losses
       FROM game_history WHERE user_id=?`,
      [uid]
    );

    res.json({
      xp: user.xp || 0,
      ...progress,
      dailyBonusClaimed: dailyBonus,
      challenge: {
        ...challenge,
        progress:  challRow?.progress  || 0,
        completed: challRow?.completed || false,
      },
      history,
      xpLog,
      stats: stats || { total_games: 0, wins: 0, losses: 0 },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/xp/daily-bonus — réclamer le bonus de connexion
router.post('/daily-bonus', authMiddleware, async (req, res) => {
  if (req.user.isGuest) return res.json({ guest: true });
  try {
    const result = await claimDailyBonus(req.user.id);
    res.json(result || { already: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/xp/solo-result — fin de partie solo (iframe postMessage)
router.post('/solo-result', authMiddleware, async (req, res) => {
  if (req.user.isGuest) return res.json({ ok: true });
  const uid = req.user.id;
  const { game_id, won } = req.body;
  if (!game_id) return res.status(400).json({ error: 'game_id requis' });
  try {
    await recordGame(uid, game_id, won ? 'win' : 'loss', null, 1, null);
    let xpGained = 0;
    xpGained += 10; await awardXp(uid, 10, 'game_played', game_id);
    if (won) { xpGained += 50; await awardXp(uid, 50, 'game_won', game_id); }
    await updateChallenge(uid, 'play', game_id);
    await updateChallenge(uid, 'play_distinct', game_id);
    if (won) {
      await updateChallenge(uid, 'win', game_id);
      await updateChallenge(uid, 'win_any', game_id);
    }
    res.json({ ok: true, xpGained });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/xp/leaderboard — classement global par XP
router.get('/leaderboard', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT username, xp, level,
              (SELECT COUNT(*) FROM game_history WHERE user_id=u.id AND result='win') AS wins
       FROM users u
       WHERE xp > 0
       ORDER BY xp DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
