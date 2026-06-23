const { getRandomWord, isValidWord } = require('./words');

async function fetchWord(lang = 'fr', minLength = 5, maxLength = 6) {
  return getRandomWord(lang, minLength, maxLength);
}

async function validateWord(word, targetWord, lang = 'fr') {
  if (word === targetWord) return true;
  if (word.length !== targetWord.length) return false;
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

module.exports = { fetchWord, validateWord, computeResult, computeDamage };
