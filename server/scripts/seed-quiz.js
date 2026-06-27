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

const RC_SUCCESS     = 0;
const RC_NO_RESULTS  = 1;
const RC_TOKEN_EMPTY = 4;

function decode(str) {
  try { return decodeURIComponent(str); } catch { return str; }
}
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getToken() {
  const res  = await fetch('https://opentdb.com/api_token.php?command=request');
  const data = await res.json();
  return data.token;
}

async function fetchAll(categoryId, type, lang, token) {
  const all = [];
  let page  = 0;
  while (true) {
    page++;
    const langParam = lang === 'en' ? '' : `&lang=${lang}`;
    const url = `https://opentdb.com/api.php?amount=50&category=${categoryId}&type=${type}&encode=url3986&token=${token}${langParam}`;
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
      if (data.results.length < 50) break;
      await wait(5500);
    } else if (data.response_code === RC_TOKEN_EMPTY || data.response_code === RC_NO_RESULTS) {
      break;
    } else {
      console.error(`  ⚠️  code ${data.response_code} p${page}`);
      break;
    }
  }
  return all;
}

async function seedLang(pool, lang) {
  console.log(`\n━━━ Langue : ${lang.toUpperCase()} ━━━\n`);
  let total = 0;

  for (const cat of CATEGORIES) {
    const [[row]] = await pool.query('SELECT id FROM quiz_categories WHERE opentdb_id=?', [cat.id]);
    const catId = row.id;

    for (const type of ['multiple', 'boolean']) {
      const token = await getToken();
      await wait(1000);

      process.stdout.write(`  ${cat.icon} ${cat.name_en} [${type}]... `);
      const questions = await fetchAll(cat.id, type, lang, token);

      let inserted = 0;
      for (const q of questions) {
        try {
          await pool.query(
            'INSERT IGNORE INTO quiz_questions (category_id, type, difficulty, lang, question, correct_answer, incorrect_answers) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [catId, q.type, q.difficulty, lang, decode(q.question), decode(q.correct_answer), JSON.stringify(q.incorrect_answers.map(decode))]
          );
          inserted++;
          total++;
        } catch {}
      }
      console.log(`${inserted} questions`);
      await wait(5500);
    }
  }
  return total;
}

async function main() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'plateforme_jeux',
  });

  console.log('📚 Seed Quiz Zone — OpenTDB (EN + FR)\n');

  // Ajouter colonne lang si absente
  try {
    await pool.query("ALTER TABLE quiz_questions ADD COLUMN lang VARCHAR(2) NOT NULL DEFAULT 'en' AFTER difficulty");
    console.log("✅ Colonne 'lang' ajoutée\n");
  } catch (e) {
    if (!e.message.includes('Duplicate')) throw e;
    console.log("✅ Colonne 'lang' déjà présente\n");
  }

  // Marquer les existantes comme EN
  await pool.query("UPDATE quiz_questions SET lang='en' WHERE lang='' OR lang IS NULL");

  for (const cat of CATEGORIES) {
    await pool.query(
      'INSERT IGNORE INTO quiz_categories (opentdb_id, name_fr, name_en, icon) VALUES (?, ?, ?, ?)',
      [cat.id, cat.name_fr, cat.name_en, cat.icon]
    );
  }
  console.log('✅ Catégories insérées');

  // Seed EN (questions existantes conservées, on insère uniquement les manquantes)
  const enTotal = await seedLang(pool, 'en');

  // Seed FR
  const frTotal = await seedLang(pool, 'fr');

  console.log(`\n✅ Terminé : ${enTotal} EN + ${frTotal} FR importées`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
