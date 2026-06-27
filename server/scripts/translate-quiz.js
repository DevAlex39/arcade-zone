/**
 * Traduit toutes les questions EN en FR via Google Translate (API non officielle).
 * Lance : node server/scripts/translate-quiz.js
 * Durée estimée : ~2-3h pour 7600 questions (délais anti rate-limit inclus)
 *
 * Installe d'abord le module : npm install google-translate-api-x --prefix server
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql     = require('mysql2/promise');
const translate = require('google-translate-api-x');

const BATCH      = 5;    // questions par appel API
const DELAY_MS   = 4000; // délai entre batches (ms)
const SEP        = ' ||| '; // séparateur pour grouper les textes

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseAnswers(raw) {
  try { return JSON.parse(raw || '[]'); } catch {
    // Fallback: valeur CSV brute
    return (raw || '').split(',').map(s => s.trim()).filter(Boolean);
  }
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function translateTexts(texts) {
  // On joint tous les textes avec un séparateur rare pour minimiser les appels API
  const joined = texts.join(SEP);
  const result = await translate(joined, { from: 'en', to: 'fr' });
  const translated = result.text.split(SEP);
  // Si Google change le séparateur ou regroupe, on retourne les textes originaux en fallback
  if (translated.length !== texts.length) return texts;
  return translated;
}

async function main() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'plateforme_jeux',
  });

  console.log('🌍 Traduction Quiz Zone EN → FR\n');

  // Récupérer les questions EN qui n'ont pas encore de version FR
  const [rows] = await pool.query(`
    SELECT q.id, q.category_id, q.type, q.difficulty, q.question, q.correct_answer, q.incorrect_answers
    FROM quiz_questions q
    WHERE q.lang = 'en'
      AND NOT EXISTS (
        SELECT 1 FROM quiz_questions q2
        WHERE q2.category_id = q.category_id
          AND q2.lang = 'fr'
          AND q2.question = q.question
      )
    ORDER BY q.id
  `);

  console.log(`📊 ${rows.length} questions à traduire\n`);

  const batches = chunk(rows, BATCH);
  let done = 0;
  let errors = 0;

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];

    // Construire tous les textes à traduire pour ce batch
    // Pour chaque question : question + bonne réponse + réponses incorrectes (si QCM)
    const textsToTranslate = [];
    for (const q of batch) {
      textsToTranslate.push(q.question);
      textsToTranslate.push(q.correct_answer);
      const incorrects = parseAnswers(q.incorrect_answers);
      incorrects.forEach(a => textsToTranslate.push(a));
      // Padding : pour boolean on ajoute des placeholders pour que l'index soit prévisible
      if (q.type === 'boolean') {
        textsToTranslate.push('__PAD__');
        textsToTranslate.push('__PAD__');
        textsToTranslate.push('__PAD__');
      }
    }

    try {
      const translated = await translateTexts(textsToTranslate);
      let idx = 0;

      for (const q of batch) {
        const qFr       = translated[idx++];
        const correctFr = translated[idx++];
        const incorrects = parseAnswers(q.incorrect_answers);
        const incorrectsFr = incorrects.map(() => translated[idx++]);
        if (q.type === 'boolean') idx += 3; // skip pads

        try {
          await pool.query(
            'INSERT IGNORE INTO quiz_questions (category_id, type, difficulty, lang, question, correct_answer, incorrect_answers) VALUES (?,?,?,?,?,?,?)',
            [q.category_id, q.type, q.difficulty, 'fr', qFr, correctFr, JSON.stringify(incorrectsFr)]
          );
          done++;
        } catch {}
      }

      const pct = Math.round(((b + 1) / batches.length) * 100);
      process.stdout.write(`\r  ✅ ${done} traduite(s) — ${pct}% [batch ${b + 1}/${batches.length}] ${errors > 0 ? `⚠️ ${errors} erreurs` : ''}   `);
    } catch (e) {
      errors++;
      process.stdout.write(`\r  ⚠️  Erreur batch ${b + 1}: ${e.message.substring(0, 60)}   `);
    }

    if (b < batches.length - 1) await wait(DELAY_MS);
  }

  console.log(`\n\n✅ Terminé : ${done} questions traduites, ${errors} erreurs`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
