const router = require('express').Router();
const QRCode = require('qrcode');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

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

// Créer une room
router.post('/', requireAuth, async (req, res) => {
  const { game_id, settings = {} } = req.body;
  if (!game_id) return res.status(400).json({ error: 'game_id requis' });

  const [games] = await pool.query('SELECT * FROM games WHERE id=? AND is_active=TRUE', [game_id]);
  if (!games.length) return res.status(404).json({ error: 'Jeu introuvable ou inactif' });

  const code = await uniqueCode();
  const [result] = await pool.query(
    'INSERT INTO rooms (code, game_id, host_id, max_players, settings) VALUES (?,?,?,?,?)',
    [code, game_id, req.user.id, games[0].max_players, JSON.stringify(settings)]
  );
  const roomId = result.insertId;
  await pool.query('INSERT INTO room_players (room_id, user_id, is_ready) VALUES (?,?,TRUE)', [roomId, req.user.id]);

  const joinUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join/${code}`;
  const qr = await QRCode.toDataURL(joinUrl, { color: { dark: '#e2e4ef', light: '#00000000' } });

  res.status(201).json({ code, roomId, joinUrl, qr });
});

// Rejoindre une room (infos)
router.get('/:code', requireAuth, async (req, res) => {
  const [rooms] = await pool.query(`
    SELECT r.*, g.name AS game_name, g.icon, g.color, g.has_multiplayer, g.min_players
    FROM rooms r JOIN games g ON r.game_id=g.id
    WHERE r.code=?`, [req.params.code.toUpperCase()]);
  if (!rooms.length) return res.status(404).json({ error: 'Room introuvable' });
  const room = rooms[0];

  const [players] = await pool.query(`
    SELECT u.id, u.username, u.first_name, u.last_name, u.avatar_url, rp.is_ready
    FROM room_players rp JOIN users u ON rp.user_id=u.id
    WHERE rp.room_id=?`, [room.id]);

  const joinUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join/${room.code}`;
  const qr = await QRCode.toDataURL(joinUrl, { color: { dark: '#e2e4ef', light: '#00000000' } });

  res.json({ ...room, settings: room.settings || {}, players, joinUrl, qr });
});

// Rejoindre (POST — ajouter le joueur)
router.post('/:code/join', requireAuth, async (req, res) => {
  const [rooms] = await pool.query('SELECT * FROM rooms WHERE code=?', [req.params.code.toUpperCase()]);
  if (!rooms.length) return res.status(404).json({ error: 'Room introuvable' });
  const room = rooms[0];
  if (room.status !== 'waiting') return res.status(409).json({ error: 'Partie déjà commencée' });

  const [existing] = await pool.query('SELECT id FROM room_players WHERE room_id=? AND user_id=?', [room.id, req.user.id]);
  if (!existing.length) {
    const [count] = await pool.query('SELECT COUNT(*) AS n FROM room_players WHERE room_id=?', [room.id]);
    if (count[0].n >= room.max_players) return res.status(409).json({ error: 'Salle pleine' });
    await pool.query('INSERT INTO room_players (room_id, user_id) VALUES (?,?)', [room.id, req.user.id]);
  }

  res.json({ ok: true, code: room.code });
});

module.exports = router;
