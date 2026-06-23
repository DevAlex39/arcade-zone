// Génération : wordlist-fr/en.js (formes de base : infinitifs, singuliers)
// Validation FR : an-array-of-french-words (formes conjuguées incluses)
// Validation EN : wordlist-en.js (même liste que génération, suffisant pour le jeu)

const WORDLIST_FR = require('./wordlist-fr');
const WORDLIST_EN = require('./wordlist-en');

const VALIDATION = { fr: null, en: null };

function normalize(w) {
  return w.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function loadValidation(lang) {
  if (VALIDATION[lang]) return VALIDATION[lang];
  if (lang === 'en') {
    VALIDATION.en = new Set(WORDLIST_EN);
    return VALIDATION.en;
  }
  // FR — an-array-of-french-words avec fallback
  try {
    const raw = require('an-array-of-french-words');
    VALIDATION.fr = new Set(raw.map(normalize).filter(w => /^[A-Z]{4,10}$/.test(w)));
  } catch {
    VALIDATION.fr = new Set(WORDLIST_FR);
  }
  return VALIDATION.fr;
}

function getRandomWord(lang = 'fr', min = 5, max = 6) {
  const list = lang === 'en' ? WORDLIST_EN : WORDLIST_FR;
  const pool = list.filter(w => w.length >= min && w.length <= max);
  if (!pool.length) return lang === 'en' ? 'STONE' : 'MAISON';
  return pool[Math.floor(Math.random() * pool.length)];
}

function isValidWord(word, lang = 'fr') {
  return loadValidation(lang).has(normalize(word));
}

module.exports = { getRandomWord, isValidWord };
