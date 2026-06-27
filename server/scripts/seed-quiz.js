require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const CATEGORIES = [
  { id: 9,  name_fr: 'Culture générale', name_en: 'General Knowledge', icon: '🌍' },
  { id: 11, name_fr: 'Cinéma',           name_en: 'Film',              icon: '🎬' },
  { id: 12, name_fr: 'Musique',          name_en: 'Music',             icon: '🎵' },
  { id: 14, name_fr: 'Télévision',       name_en: 'Television',        icon: '📺' },
  { id: 15, name_fr: 'Jeux vidéo',       name_en: 'Video Games',       icon: '🎮' },
  { id: 17, name_fr: 'Science & Nature', name_en: 'Science & Nature',  icon: '🔬' },
  { id: 18, name_fr: 'Informatique',     name_en: 'Computers',         icon: '💻' },
  { id: 19, name_fr: 'Mathématiques',    name_en: 'Mathematics',       icon: '🔢' },
  { id: 21, name_fr: 'Sport',            name_en: 'Sports',            icon: '⚽' },
  { id: 22, name_fr: 'Géographie',       name_en: 'Geography',         icon: '🗺️' },
  { id: 23, name_fr: 'Histoire',         name_en: 'History',           icon: '📜' },
  { id: 27, name_fr: 'Animaux',          name_en: 'Animals',           icon: '🦁' },
];

function decode(str) {
  try { return decodeURIComponent(str); } catch { return str; }
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchQuestions(categoryId, type) {
  const url = `https://opentdb.com/api.php?amount=50&category=${categoryId}&type=${type}&encode=url3986`;
  try {
    const res  = await fetch(url);
    const data = await res.json();
    if (data.response_code !== 0) return [];
    return data.results;
  } catch (e) {
    console.error(`Erreur fetch cat ${categoryId} type ${type}:`, e.message);
    return [];
  }
}

async function main() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'plateforme_jeux',
  });

  console.log('📚 Seed Quiz Zone — Open Trivia DB\n');

  for (const cat of CATEGORIES) {
    await pool.query(
      'INSERT IGNORE INTO quiz_categories (opentdb_id, name_fr, name_en, icon) VALUES (?, ?, ?, ?)',
      [cat.id, cat.name_fr, cat.name_en, cat.icon]
    );
  }
  console.log('✅ Catégories insérées\n');

  let total = 0;
  for (const cat of CATEGORIES) {
    const [[row]] = await pool.query('SELECT id FROM quiz_categories WHERE opentdb_id=?', [cat.id]);
    const catId = row.id;

    for (const type of ['multiple', 'boolean']) {
      process.stdout.write(`  ${cat.icon} ${cat.name_en} [${type}]... `);
      const questions = await fetchQuestions(cat.id, type);
      let inserted = 0;
      for (const q of questions) {
        try {
          await pool.query(
            'INSERT IGNORE INTO quiz_questions (category_id, type, difficulty, question, correct_answer, incorrect_answers) VALUES (?, ?, ?, ?, ?, ?)',
            [catId, q.type, q.difficulty, decode(q.question), decode(q.correct_answer), JSON.stringify(q.incorrect_answers.map(decode))]
          );
          inserted++;
          total++;
        } catch {}
      }
      console.log(`${inserted} questions`);
      await wait(5500); // Rate limit OpenTDB
    }
  }

  console.log(`\n✅ ${total} questions importées au total !`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
