const router = require('express').Router();
const { pool } = require('../config/db');

// GET /api/quiz/categories
router.get('/categories', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM quiz_categories ORDER BY name_fr');
  res.json(rows);
});

module.exports = router;
