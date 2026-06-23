const router = require('express').Router();
const { pool } = require('../config/db');
const { fetchWord, validateWord } = require('../games/motus');
const { optionalAuth } = require('../middleware/auth');

// GET /api/motus/word?min=5&max=6&lang=fr&category=animaux
router.get('/word', async (req, res) => {
  const min      = parseInt(req.query.min)  || 5;
  const max      = parseInt(req.query.max)  || 6;
  const lang     = req.query.lang     || 'fr';
  const category = req.query.category || 'tous';
  const word = await fetchWord(lang, min, max, category);
  res.json({ word });
});

// GET /api/motus/validate?word=renard&lang=fr
router.get('/validate', async (req, res) => {
  const word = (req.query.word || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const lang = req.query.lang || 'fr';
  if (!word) return res.status(400).json({ valid: false });
  const valid = await validateWord(word, word, lang);
  res.json({ valid });
});

// POST /api/motus/report  { word, category }
router.post('/report', optionalAuth, async (req, res) => {
  const { word, category } = req.body;
  if (!word) return res.status(400).json({ error: 'Mot requis' });
  try {
    await pool.query(
      'INSERT INTO motus_word_reports (word, category, user_id) VALUES (?, ?, ?)',
      [word.toUpperCase().trim(), category || 'tous', req.user?.id || null]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
