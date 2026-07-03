const { getRandomWord, isValidWord } = require('./words');
const { CATEGORIES } = require('./categories');
const { pool } = require('../config/db');

// ── Blacklist admin : mots à ne plus jamais proposer ──────────────
let _blacklist = null;
async function getBlacklist() {
  if (_blacklist) return _blacklist;
  try {
    const [rows] = await pool.query('SELECT word FROM motus_word_blacklist');
    _blacklist = new Set(rows.map(r => r.word));
  } catch {
    _blacklist = new Set(); // table absente ou DB indisponible → pas de filtre
  }
  return _blacklist;
}
function addToBlacklist(word) { if (_blacklist) _blacklist.add(word.toUpperCase()); }

// Normalise un tableau de catégories (accepte string ou array, gère compat)
function normCats(categories) {
  if (!categories) return ['tous'];
  if (Array.isArray(categories)) return categories.length ? categories : ['tous'];
  return [categories];
}

async function fetchWord(lang = 'fr', minLength = 5, maxLength = 6, categories = ['tous']) {
  const cats = normCats(categories);
  const blacklist = await getBlacklist();

  function pickCandidate() {
    // 'tous' ou liste vide → dictionnaire complet
    if (cats.includes('tous')) return getRandomWord(lang, minLength, maxLength);

    // Fusionner les mots de toutes les catégories sélectionnées
    let words = [];
    cats.forEach(catId => {
      const cat = CATEGORIES[catId];
      if (cat?.words) {
        words = words.concat(cat.words.filter(w => w.length >= minLength && w.length <= maxLength));
      }
    });
    words = [...new Set(words)];
    if (words.length > 0) return words[Math.floor(Math.random() * words.length)];
    return getRandomWord(lang, minLength, maxLength); // fallback
  }

  // Re-tirer si le mot est blacklisté (limité pour éviter une boucle infinie)
  let word = pickCandidate();
  for (let i = 0; i < 30 && blacklist.has(word); i++) word = pickCandidate();
  return word;
}

async function validateWord(word, targetWord, lang = 'fr', categories = []) {
  if (word === targetWord) return true;
  if (word.length !== targetWord.length) return false;

  // Accepter les mots présents dans les listes de catégories (noms propres inclus)
  const cats = normCats(categories);
  for (const catId of cats) {
    const cat = CATEGORIES[catId];
    if (cat?.words && cat.words.includes(word)) return true;
  }

  return isValidWord(word, lang);
}

function computeResult(guess, target) {
  const result    = Array(target.length).fill('absent');
  const targetArr = [...target];
  const guessArr  = [...guess];
  const usedT     = Array(target.length).fill(false);
  const usedG     = Array(guess.length).fill(false);
  for (let i = 0; i < target.length; i++) {
    if (guessArr[i] === targetArr[i]) { result[i] = 'correct'; usedT[i] = usedG[i] = true; }
  }
  for (let i = 0; i < guess.length; i++) {
    if (usedG[i]) continue;
    for (let j = 0; j < target.length; j++) {
      if (!usedT[j] && guessArr[i] === targetArr[j]) { result[i] = 'present'; usedT[j] = true; break; }
    }
  }
  return result;
}

function computeDamage(row, maxAttempts, combo, comboEnabled) {
  const base       = (maxAttempts - 1 - row) + 1;
  const multiplier = comboEnabled ? Math.max(1, combo) : 1;
  return base * multiplier;
}

module.exports = { fetchWord, validateWord, computeResult, computeDamage, addToBlacklist };
