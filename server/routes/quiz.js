const router = require('express').Router();
const { pool } = require('../config/db');

// GET /api/quiz/categories
router.get('/categories', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM quiz_categories ORDER BY name_fr');
  res.json(rows);
});

// GET /api/quiz/questions?count=20&difficulty=mixed&categories=1,2&types=both
router.get('/questions', async (req, res) => {
  try {
    const count      = Math.min(parseInt(req.query.count) || 20, 100);
    const difficulty = req.query.difficulty || 'mixed';
    const types      = req.query.types || 'both';
    const cats       = req.query.categories ? req.query.categories.split(',').map(Number).filter(Boolean) : [];

    let where = [];
    let params = [];

    const lang = req.query.lang || 'fr';
    where.push('q.lang = ?'); params.push(lang);
    if (difficulty !== 'mixed') { where.push('q.difficulty = ?'); params.push(difficulty); }
    if (types === 'multiple')   { where.push("q.type = 'multiple'"); }
    if (types === 'boolean')    { where.push("q.type = 'boolean'"); }
    if (cats.length)            { where.push(`q.category_id IN (${cats.map(() => '?').join(',')})`); params.push(...cats); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const sql = `
      SELECT q.id, q.type, q.difficulty, q.question, q.correct_answer, q.incorrect_answers,
             c.name_fr AS category_name, c.name_en AS category_name_en, c.icon AS category_icon
      FROM quiz_questions q
      JOIN quiz_categories c ON c.id = q.category_id
      ${whereClause}
      ORDER BY RAND()
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [...params, count]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quiz/solo-result
router.post('/solo-result', async (req, res) => {
  try {
    const { username, user_id, lives_start, lives_remaining, correct, total, difficulty } = req.body;
    const [result] = await pool.query(
      'INSERT INTO quiz_solo_results (username, user_id, lives_start, lives_remaining, correct, total, difficulty) VALUES (?,?,?,?,?,?,?)',
      [username || 'Anonyme', user_id || null, lives_start || 5, lives_remaining || 0, correct || 0, total || 0, difficulty || 'mixed']
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quiz/leaderboard?difficulty=mixed&lives_start=5
router.get('/leaderboard', async (req, res) => {
  try {
    const difficulty  = req.query.difficulty  || 'mixed';
    const lives_start = parseInt(req.query.lives_start) || 5;

    const where  = ['lives_start = ?'];
    const params = [lives_start];
    if (difficulty !== 'mixed') { where.push('difficulty = ?'); params.push(difficulty); }

    // Classement groupé par vies restantes, puis par % correct, puis date
    const [rows] = await pool.query(`
      SELECT username, lives_remaining, correct, total,
             ROUND(correct / total * 100) AS pct,
             played_at
      FROM quiz_solo_results
      WHERE ${where.join(' AND ')}
      ORDER BY lives_remaining DESC, correct DESC, total DESC, played_at ASC
      LIMIT 100
    `, params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
