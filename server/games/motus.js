const fetch = require('node-fetch');

const FALLBACK = ['MAISON','JARDIN','SOLEIL','MARCHE','FLEUVE','PIERRE','PRISON','BATEAU',
  'CHEMIN','PLANTE','VENTRE','FARINE','ORANGE','BOUCHE','CHEVAL','PALAIS','DRAGON',
  'COMBAT','RAISON','ANIMAL','ENTREE','SALADE','TALENT','VOISIN','BRISER','HUMEUR',
  'ACTION','EFFORT','FACILE','HASARD','NAVIRE','RAPIDE','TOUCHE','BEURRE','DONNER',
  'GLOIRE','JOUEUR','RESTER','SORTIR','GRAINS','MATURE','REGARD','SAVEUR','VIOLET'];

async function fetchWord() {
  try {
    const res = await fetch('https://trouve-mot.fr/api/random?minLength=6&maxLength=7', { timeout: 5000 });
    if (res.ok) {
      const data = await res.json();
      const raw = Array.isArray(data) ? data[0]?.mot : data?.mot;
      if (raw && /^[a-zA-ZÀ-ÿ]{5,8}$/.test(raw))
        return raw.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }
  } catch (_) {}
  const pool = FALLBACK.filter(w => w.length >= 5 && w.length <= 7);
  return pool[Math.floor(Math.random() * pool.length)];
}

async function validateWord(word, targetWord) {
  if (word === targetWord) return true;
  const lower = word.toLowerCase();
  try {
    const res = await fetch(`https://trouve-mot.fr/api/mot?mot=${encodeURIComponent(lower)}`, { timeout: 3000 });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data.length > 0;
    }
  } catch (_) {}
  return FALLBACK.includes(word.toUpperCase());
}

function computeResult(guess, target) {
  const result     = Array(target.length).fill('absent');
  const targetArr  = [...target];
  const guessArr   = [...guess];
  const usedT      = Array(target.length).fill(false);
  const usedG      = Array(guess.length).fill(false);
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

// Calcule les dégâts pour un joueur ayant trouvé le mot à la ligne `row`
function computeDamage(row, maxAttempts, combo, comboEnabled) {
  const remaining  = maxAttempts - 1 - row;
  const base       = remaining + 1;
  const multiplier = comboEnabled ? Math.max(1, combo) : 1;
  return base * multiplier;
}

module.exports = { fetchWord, validateWord, computeResult, computeDamage };
