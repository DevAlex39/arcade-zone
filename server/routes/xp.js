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

    // Ratio par jeu
    const [perGame] = await pool.query(
      `SELECT gh.game_id, g.name AS game_name, g.icon AS game_icon,
              COUNT(*) AS total,
              SUM(gh.result='win')  AS wins,
              SUM(gh.result='loss') AS losses
       FROM game_history gh
       LEFT JOIN games g ON g.id = gh.game_id
       WHERE gh.user_id = ?
       GROUP BY gh.game_id, g.name, g.icon
       ORDER BY total DESC`,
      [uid]
    );

    // Adversaire le plus battu (adversaires stockés dans details depuis 2026-07)
    const [winRows] = await pool.query(
      `SELECT details FROM game_history
       WHERE user_id=? AND result='win' AND details IS NOT NULL
       ORDER BY played_at DESC LIMIT 500`,
      [uid]
    );
    const beaten = {};
    for (const row of winRows) {
      const d = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
      (d?.opponents || []).forEach(name => { beaten[name] = (beaten[name] || 0) + 1; });
    }
    const rival = Object.entries(beaten).sort((a, b) => b[1] - a[1])[0] || null;

    // Badges / succès (calculés à la volée, pas de table dédiée)
    const wins  = Number(stats?.wins) || 0;
    const total = Number(stats?.total_games) || 0;
    const gWins = id => Number(perGame.find(p => p.game_id === id)?.wins) || 0;
    const lvl   = user.level || 1;
    const badges = [
      { id:'first_win',   icon:'🏆', label:'Première victoire',  desc:'Gagner une partie',                    earned: wins >= 1 },
      { id:'win_10',      icon:'🔥', label:'En feu',             desc:'Gagner 10 parties',                    earned: wins >= 10 },
      { id:'win_50',      icon:'👑', label:'Champion',           desc:'Gagner 50 parties',                    earned: wins >= 50 },
      { id:'play_25',     icon:'🎮', label:'Assidu',             desc:'Jouer 25 parties',                     earned: total >= 25 },
      { id:'play_100',    icon:'🎖️', label:'Vétéran',            desc:'Jouer 100 parties',                    earned: total >= 100 },
      { id:'variety_5',   icon:'🌍', label:'Touche-à-tout',      desc:'Jouer à 5 jeux différents',            earned: perGame.length >= 5 },
      { id:'level_5',     icon:'⭐', label:'Niveau 5',           desc:'Atteindre le niveau 5',                earned: lvl >= 5 },
      { id:'level_10',    icon:'🌟', label:'Niveau 10',          desc:'Atteindre le niveau 10',               earned: lvl >= 10 },
      { id:'quiz_5',      icon:'🧠', label:'Cerveau',            desc:'Gagner 5 parties de Quiz',             earned: gWins('quiz') >= 5 },
      { id:'motus_5',     icon:'🔤', label:'Lexicologue',        desc:'Gagner 5 parties de Trouve le Mot',    earned: gWins('motus') >= 5 },
      { id:'oj_5',        icon:'😈', label:'Roi de la soirée',   desc:'Gagner 5 parties d\'Oser Jouer',       earned: gWins('oser-jouer') >= 5 },
      { id:'winrate_50',  icon:'🥇', label:'Redoutable',         desc:'50% de victoires sur 10+ parties',     earned: total >= 10 && wins / total >= 0.5 },
    ];

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
      perGame,
      rival: rival ? { name: rival[0], wins: rival[1] } : null,
      badges,
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

// GET /api/xp/weekly — victoires de la semaine en cours (reset chaque lundi)
router.get('/weekly', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.username, COUNT(*) AS wins
       FROM game_history gh
       JOIN users u ON u.id = gh.user_id
       WHERE gh.result = 'win'
         AND YEARWEEK(gh.played_at, 1) = YEARWEEK(CURDATE(), 1)
       GROUP BY u.id, u.username
       ORDER BY wins DESC, u.username ASC
       LIMIT 10`
    );
    res.json(rows);
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
