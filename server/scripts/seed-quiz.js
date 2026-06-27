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

// Codes de retour OpenTDB
const RC_SUCCESS      = 0;
const RC_NO_RESULTS   = 1; // pas assez de questions dispo (stock épuisé)
const RC_TOKEN_EMPTY  = 4; // toutes les questions du token ont été servies

function decode(str) {
  try { return decodeURIComponent(str); } catch { return str; }
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getToken() {
  const res  = await fetch('https://opentdb.com/api_token.php?command=request');
  const data = await res.json();
  return data.token;
}

// Récupère TOUTES les questions dispo pour une catégorie+type
// en paginant avec le token de session (max 50/requête)
async function fetchAll(categoryId, type, token) {
  const all = [];
  let page  = 0;

  while (true) {
    page++;
    const url = `https://opentdb.com/api.php?amount=50&category=${categoryId}&type=${type}&encode=url3986&token=${token}`;
    let data;
    try {
      const res = await fetch(url);
      data = await res.json();
    } catch (e) {
      console.error(`  ⚠️  Erreur réseau p${page}:`, e.message);
      break;
    }

    if (data.response_code === RC_SUCCESS) {
      all.push(...data.results);
      // Si on reçoit moins de 50, c'est le dernier lot
      if (data.results.length < 50) break;
      await wait(5500); // respect rate limit entre pages
    } else if (data.response_code === RC_TOKEN_EMPTY || data.response_code === RC_NO_RESULTS) {
      // Plus rien à récupérer
      break;
    } else {
      console.error(`  ⚠️  code ${data.response_code} p${page}`);
      break;
    }
  }

  return all;
}

async function main() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'plateforme_jeux',
  });

  console.log('📚 Seed Quiz Zone — Open Trivia DB (mode exhaustif)\n');

  // Vider les questions existantes pour un re-seed propre
  await pool.query('DELETE FROM quiz_questions');
  console.log('🗑️  Questions existantes supprimées\n');

  for (const cat of CATEGORIES) {
    await pool.query(
      'INSERT IGNORE INTO quiz_categories (opentdb_id, name_fr, name_en, icon) VALUES (?, ?, ?, ?)',
      [cat.id, cat.name_fr, cat.name_en, cat.icon]
    );
  }
  console.log('✅ Catégories insérées\n');

  let grandTotal = 0;

  for (const cat of CATEGORIES) {
    const [[row]] = await pool.query('SELECT id FROM quiz_categories WHERE opentdb_id=?', [cat.id]);
    const catId = row.id;

    for (const type of ['multiple', 'boolean']) {
      // Token frais par combo catégorie/type pour un max de questions
      const token = await getToken();
      await wait(1000);

      process.stdout.write(`  ${cat.icon} ${cat.name_en} [${type}]... `);
      const questions = await fetchAll(cat.id, type, token);

      let inserted = 0;
      for (const q of questions) {
        try {
          await pool.query(
            'INSERT IGNORE INTO quiz_questions (category_id, type, difficulty, question, correct_answer, incorrect_answers) VALUES (?, ?, ?, ?, ?, ?)',
            [catId, q.type, q.difficulty, decode(q.question), decode(q.correct_answer), JSON.stringify(q.incorrect_answers.map(decode))]
          );
          inserted++;
          grandTotal++;
        } catch {}
      }
      console.log(`${inserted} questions`);
      await wait(5500);
    }
  }

  console.log(`\n✅ ${grandTotal} questions importées au total !`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
