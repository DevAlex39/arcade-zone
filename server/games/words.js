// Dictionnaires — génération vs validation séparées.
// Génération : wordlist-fr.js (formes de base uniquement : infinitifs, singuliers)
// Validation  : an-array-of-french-words (tout le vocabulaire, formes conjuguées incluses)

const WORDLIST_BASE = require('./wordlist-fr');

const VALIDATION = {
  fr: null, // chargé en lazy depuis an-array-of-french-words
};

function normalize(w) {
  return w.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function loadValidationFr() {
  if (VALIDATION.fr) return VALIDATION.fr;
  try {
    const raw = require('an-array-of-french-words');
    VALIDATION.fr = new Set(
      raw.map(normalize).filter(w => /^[A-Z]{4,10}$/.test(w))
    );
  } catch {
    // Package non installé (ex: avant npm install) — fallback sur la liste de base
    VALIDATION.fr = new Set(WORDLIST_BASE);
  }
  return VALIDATION.fr;
}

/**
 * Récupère un mot aléatoire depuis la liste curated (formes de base uniquement).
 */
function getRandomWord(lang = 'fr', min = 5, max = 6) {
  const pool = WORDLIST_BASE.filter(w => w.length >= min && w.length <= max);
  if (!pool.length) return 'MAISON';
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Vérifie qu'un mot soumis par le joueur est valide (toutes formes acceptées).
 */
function isValidWord(word, lang = 'fr') {
  const dict = lang === 'fr' ? loadValidationFr() : loadValidationFr();
  return dict.has(normalize(word));
}

module.exports = { getRandomWord, isValidWord };
