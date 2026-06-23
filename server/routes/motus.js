const router = require('express').Router();
const { fetchWord, validateWord } = require('../games/motus');

// GET /api/motus/word?min=5&max=6&lang=fr
router.get('/word', async (req, res) => {
  const min  = parseInt(req.query.min)  || 5;
  const max  = parseInt(req.query.max)  || 6;
  const lang = req.query.lang || 'fr';
  const word = await fetchWord(lang, min, max);
  res.json({ word });
});

// GET /api/motus/validate?word=renard&lang=fr
router.get('/validate', async (req, res) => {
  const word = (req.query.word || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const lang = req.query.lang || 'fr';
  if (!word) return res.status(400).json({ valid: false });
  const valid = await validateWord(word, word, lang); // target = word → longueur ok, vérifie dico
  res.json({ valid });
});

module.exports = router;
