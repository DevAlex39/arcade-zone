const router    = require('express').Router();
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const passport  = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { pool }  = require('../config/db');
const { claimDailyBonus } = require('../services/xp');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeUser(u) {
  return { id: u.id, username: u.username, email: u.email, first_name: u.first_name, last_name: u.last_name, role: u.role, avatar_url: u.avatar_url };
}

// ─── Inscription ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, email, password, first_name, last_name } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Champs requis manquants' });
  if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 chars min)' });

  try {
    const [exists] = await pool.query('SELECT id FROM users WHERE username=? OR email=?', [username, email]);
    if (exists.length) return res.status(409).json({ error: 'Nom d\'utilisateur ou email déjà utilisé' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES (?,?,?,?,?)',
      [username, email, hash, first_name || '', last_name || '']
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id=?', [result.insertId]);
    res.status(201).json({ token: makeToken(rows[0]), user: safeUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Connexion ───────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { login, password } = req.body; // login = username ou email
  if (!login || !password) return res.status(400).json({ error: 'Champs requis manquants' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username=? OR email=?', [login, login]);
    if (!rows.length) return res.status(401).json({ error: 'Identifiants incorrects' });
    const user = rows[0];
    if (!user.password_hash) return res.status(401).json({ error: 'Ce compte utilise Google pour se connecter' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Identifiants incorrects' });

    await pool.query('UPDATE users SET last_login=NOW() WHERE id=?', [user.id]);
    const bonusResult = await claimDailyBonus(user.id).catch(() => null);
    res.json({ token: makeToken(user), user: safeUser(user), dailyBonus: bonusResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Invité (session temporaire 6h) ──────────────────────────────────────────
router.post('/guest', (req, res) => {
  const { username } = req.body;
  if (!username?.trim()) return res.status(400).json({ error: 'Pseudo requis' });
  const name = username.trim().slice(0, 20);
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const token = jwt.sign(
    { id: guestId, username: name, role: 'guest', isGuest: true },
    process.env.JWT_SECRET,
    { expiresIn: '6h' }
  );
  res.json({ token, user: { id: guestId, username: name, role: 'guest', isGuest: true } });
});

// ─── Me (vérif token) ────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    // Les invités n'ont pas de ligne en BDD
    if (decoded.isGuest) return res.json({ user: { id: decoded.id, username: decoded.username, role: 'guest', isGuest: true } });
    const [rows] = await pool.query('SELECT * FROM users WHERE id=?', [decoded.id]);
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ user: safeUser(rows[0]) });
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${process.env.SERVER_URL || 'http://localhost:3000'}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const [rows] = await pool.query('SELECT * FROM users WHERE google_id=? OR email=?', [profile.id, email]);
      let user = rows[0];
      if (!user) {
        const [ins] = await pool.query(
          'INSERT INTO users (username, email, google_id, first_name, last_name, avatar_url) VALUES (?,?,?,?,?,?)',
          [profile.displayName.replace(/\s/g,'_').toLowerCase().slice(0,50), email, profile.id,
           profile.name?.givenName || '', profile.name?.familyName || '',
           profile.photos?.[0]?.value || null]
        );
        const [r] = await pool.query('SELECT * FROM users WHERE id=?', [ins.insertId]);
        user = r[0];
      } else if (!user.google_id) {
        await pool.query('UPDATE users SET google_id=?, avatar_url=? WHERE id=?', [profile.id, profile.photos?.[0]?.value, user.id]);
      }
      done(null, user);
    } catch (err) { done(err); }
  }));

  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google` }),
    (req, res) => {
      const token = makeToken(req.user);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
    }
  );
} else {
  router.get('/google', (_, res) => res.status(503).json({ error: 'Google OAuth non configuré. Ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env' }));
}

module.exports = router;
