const router = require('express').Router();
const QRCode = require('qrcode');
const { pool } = require('../config/db');
const { optionalAuth } = require('../middleware/auth');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genCode() {
  return Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
}

async function uniqueCode() {
  let code, tries = 0;
  do {
    code = genCode();
    const [r] = await pool.query('SELECT id FROM rooms WHERE code=?', [code]);
    if (!r.length) return code;
  } while (++tries < 10);
  throw new Error('Impossible de générer un code unique');
}

// Créer une room — accessible aux invités et utilisateurs connectés
router.post('/', optionalAuth, async (req, res) => {
  const { game_id, settings = {}, guest_name } = req.body;
  if (!game_id) return res.status(400).json({ error: 'game_id requis' });
  if (!req.user && !guest_name?.trim()) return res.status(401).json({ error: 'Identification requise (connecte-toi ou entre un pseudo)' });

  const [games] = await pool.query('SELECT * FROM games WHERE id=? AND is_active=TRUE', [game_id]);
  if (!games.length) return res.status(404).json({ error: 'Jeu introuvable ou inactif' });

  const code = await uniqueCode();

  // host_id = NULL pour les invités, host_name pour tous
  const hostId   = req.user?.isGuest ? null : (req.user?.id ?? null);
  const hostName = req.user ? req.user.username : guest_name.trim();

  const [result] = await pool.query(
    'INSERT INTO rooms (code, game_id, host_id, host_name, max_players, settings) VALUES (?,?,?,?,?,?)',
    [code, game_id, hostId, hostName, games[0].max_players, JSON.stringify(settings)]
  );
  const roomId = result.insertId;

  // Ajouter le créateur dans room_players (user_id NULL si invité)
  if (hostId) {
    await pool.query('INSERT INTO room_players (room_id, user_id, is_ready) VALUES (?,?,TRUE)', [roomId, hostId]);
  } else {
    await pool.query('INSERT INTO room_players (room_id, guest_name, is_ready) VALUES (?,?,TRUE)', [roomId, hostName]);
  }

  const joinUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join/${code}`;
  const qr = await QRCode.toDataURL(joinUrl, { color: { dark: '#000000', light: '#ffffff' }, margin: 1 });

  res.status(201).json({ code, roomId, joinUrl, qr });
});

// Infos d'une room — accessible à tous
router.get('/:code', optionalAuth, async (req, res) => {
  const [rooms] = await pool.query(`
    SELECT r.*, g.name AS game_name, g.icon, g.color, g.has_multiplayer, g.min_players
    FROM rooms r JOIN games g ON r.game_id=g.id
    WHERE r.code=?`, [req.params.code.toUpperCase()]);
  if (!rooms.length) return res.status(404).json({ error: 'Room introuvable' });
  const room = rooms[0];

  const [players] = await pool.query(`
    SELECT
      COALESCE(u.id, -1) AS id,
      COALESCE(u.username, rp.guest_name) AS username,
      u.first_name, u.last_name, u.avatar_url, rp.is_ready
    FROM room_players rp
    LEFT JOIN users u ON rp.user_id = u.id
    WHERE rp.room_id=?`, [room.id]);

  const joinUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join/${room.code}`;
  const qr = await QRCode.toDataURL(joinUrl, { color: { dark: '#000000', light: '#ffffff' }, margin: 1 });

  res.json({ ...room, settings: room.settings || {}, players, joinUrl, qr });
});

// Rejoindre (POST) — accessible à tous
router.post('/:code/join', optionalAuth, async (req, res) => {
  const { guest_name } = req.body;
  if (!req.user && !guest_name?.trim()) return res.status(401).json({ error: 'Pseudo requis pour rejoindre en tant qu\'invité' });

  const [rooms] = await pool.query('SELECT * FROM rooms WHERE code=?', [req.params.code.toUpperCase()]);
  if (!rooms.length) return res.status(404).json({ error: 'Room introuvable' });
  const room = rooms[0];
  if (room.status !== 'waiting') return res.status(409).json({ error: 'Partie déjà commencée' });

  const [count] = await pool.query('SELECT COUNT(*) AS n FROM room_players WHERE room_id=?', [room.id]);
  if (count[0].n >= room.max_players) return res.status(409).json({ error: 'Salle pleine' });

  const userId   = req.user?.isGuest ? null : (req.user?.id ?? null);
  const userName = req.user ? req.user.username : guest_name.trim();

  if (userId) {
    const [existing] = await pool.query('SELECT id FROM room_players WHERE room_id=? AND user_id=?', [room.id, userId]);
    if (!existing.length) {
      await pool.query('INSERT INTO room_players (room_id, user_id) VALUES (?,?)', [room.id, userId]);
    }
  } else {
    await pool.query('INSERT INTO room_players (room_id, guest_name) VALUES (?,?)', [room.id, userName]);
  }

  res.json({ ok: true, code: room.code });
});

module.exports = router;
