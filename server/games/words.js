// Dictionnaires locaux par langue — aucune dépendance réseau

const LANGS = {
  fr: null, // chargé en lazy
  // en: null, // à ajouter plus tard avec 'an-array-of-english-words'
};

function loadFr() {
  if (LANGS.fr) return LANGS.fr;
  const raw = require('an-array-of-french-words');
  // Garder uniquement les mots alphabétiques purs (pas de tiret, apostrophe…)
  LANGS.fr = raw
    .map(w => w.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))
    .filter(w => /^[A-Z]{4,10}$/.test(w));
  return LANGS.fr;
}

/**
 * Récupère un mot aléatoire dans la langue donnée.
 * @param {string} lang  'fr' | 'en'
 * @param {number} min   longueur minimale
 * @param {number} max   longueur maximale
 */
function getRandomWord(lang = 'fr', min = 5, max = 6) {
  const list = lang === 'fr' ? loadFr() : loadFr();
  const pool = list.filter(w => w.length >= min && w.length <= max);
  if (!pool.length) return 'MAISON'; // ultra-fallback
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Vérifie qu'un mot existe dans le dictionnaire.
 */
function isValidWord(word, lang = 'fr') {
  const list = lang === 'fr' ? loadFr() : loadFr();
  return list.includes(word.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
}

module.exports = { getRandomWord, isValidWord };
