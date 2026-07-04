const router = require('express').Router();
const { pool } = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const cards = require('../games/oser-jouer-cards');

// GET /api/oser-jouer/answers — liste des cartes custom (admin)
router.get('/answers', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM oj_custom_answers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/oser-jouer/answers { fr, en?, cat } — ajout d'une carte réponse (admin)
// Refuse si la carte existe déjà (cartes de base + customs, comparaison normalisée)
router.post('/answers', requireAdmin, async (req, res) => {
  const fr  = (req.body.fr || '').trim();
  const en  = (req.body.en || '').trim() || fr;
  const cat = req.body.cat === 'trash' ? 'trash' : 'public';
  if (!fr) return res.status(400).json({ error: 'Texte FR requis' });
  if (fr.length > 255) return res.status(400).json({ error: 'Texte trop long (255 max)' });

  await cards.ensureCustomLoaded();
  if (cards.answerExists(fr)) {
    return res.status(409).json({ error: 'Cette réponse existe déjà !' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO oj_custom_answers (text_fr, text_en, cat, user_id) VALUES (?,?,?,?)',
      [fr, en, cat, req.user?.id || null]
    );
    cards.addCustomToCache({ cat, fr, en });
    res.json({ id: result.insertId, text_fr: fr, text_en: en, cat });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Cette réponse existe déjà !' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/oser-jouer/answers/:id — suppression d'une carte custom (admin)
router.delete('/answers/:id', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT text_fr FROM oj_custom_answers WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Introuvable' });
    await pool.query('DELETE FROM oj_custom_answers WHERE id=?', [req.params.id]);
    cards.removeCustomFromCache(rows[0].text_fr);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
