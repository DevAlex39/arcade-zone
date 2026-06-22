const router = require('express').Router();
const { pool } = require('../config/db');

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM games ORDER BY sort_order');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM games WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Jeu introuvable' });
  res.json(rows[0]);
});

module.exports = router;
