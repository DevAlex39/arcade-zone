const router = require('express').Router();
const { pool } = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

// Liste des jeux
router.get('/games', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM games ORDER BY sort_order');
  res.json(rows);
});

// Activer / désactiver un jeu
router.patch('/games/:id/toggle', async (req, res) => {
  const [rows] = await pool.query('SELECT is_active FROM games WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Jeu introuvable' });
  const newState = !rows[0].is_active;
  await pool.query('UPDATE games SET is_active=? WHERE id=?', [newState, req.params.id]);
  res.json({ id: req.params.id, is_active: newState });
});

// Liste des utilisateurs
router.get('/users', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, username, email, first_name, last_name, role, created_at, last_login FROM users ORDER BY created_at DESC'
  );
  res.json(rows);
});

// Changer le rôle d'un utilisateur
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['user','admin'].includes(role)) return res.status(400).json({ error: 'Rôle invalide' });
  await pool.query('UPDATE users SET role=? WHERE id=?', [role, req.params.id]);
  res.json({ ok: true });
});

// Stats rapides
router.get('/stats', async (req, res) => {
  const [[{ users }]] = await pool.query('SELECT COUNT(*) AS users FROM users');
  const [[{ rooms }]] = await pool.query('SELECT COUNT(*) AS rooms FROM rooms');
  const [[{ sessions }]] = await pool.query('SELECT COUNT(*) AS sessions FROM game_sessions');
  res.json({ users, rooms, sessions });
});

module.exports = router;
