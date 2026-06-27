// ─── LISTE DE SECOURS (mots français 6 lettres courants) ───────────────────
const FALLBACK_WORDS = [
  'MAISON','JARDIN','SOLEIL','MARCHE','FLEUVE','PIERRE','PRISON','FUSEAU',
  'BATEAU','CHEMIN','FORÊTS','MOUTON','LUMIER','PAPIER','PLANTE','VENTRE',
  'FARINE','ORANGE','BOUCHE','CHEVAL','LIMITE','MUSEAU','RIVAGE','FAGOTS',
  'PALAIS','DRAGON','NUAGES','FLEURS','COMBAT','RAISON','CARTON','MOUCHE',
  'ANIMAL','CASQUE','ENTREE','SALADE','POMMES','TOMATE','CAHIER','CANARD',
  'LAPIN','LOUVRE','MIROIR','NATION','PARLER','RIDEAU','SAUMON','TALENT',
  'VOISIN','WAGON','YEUX','ZÈBRE','ARBRE','BALLON','CAHIER','DANSE',
  'ABRUPT','BRISER','CALMER','DANSER','ELEVER','FERMER','GARDER','HUMEUR',
  'IMPOSER','JOYEUX','KLAXON','LEÇON','MOURIR','NAÎTRE','OUVRIR','PASSER',
  'QUARTZ','RANGER','SAUTER','TENTER','URGENT','VALEUR','XERCES','ZINNIA',
  'ACTION','BILLET','CARNET','DEBOUT','EFFORT','FACILE','GALERE','HASARD',
  'INDIEN','JUNGLE','KODIAK','LANCER','MARRON','NAVIRE','OPAQUE','PARTIR',
  'RAPIDE','SOLIDE','TOUCHE','ULTIME','VAGUES','WALLON','XIMENA','YAOURT',
  'ACCENT','BEURRE','CIGARE','DONNER','EMPIRE','FONDER','GLOIRE','HUMAIN',
  'IRONIE','JOUEUR','KIWI','LARGUE','METTRE','NOMMER','OCCUPER','PLAIRE',
  'QUICHE','RESTER','SORTIR','TISSER','UTOPIE','VIANDE','ZAPPER','ACTIVE',
  'ARBRES','BOUGER','CLAIRE','DESTIN','ENTIER','FIGURE','GRAINS','HANTER',
  'ISOLER','JAMBON','LANCER','MATURE','NIVEAU','OREILLE','PLUTOT','REGARD',
  'SAVEUR','TERRRE','UNIQUE','VIOLET','WIDGET','EXPRES','YEOMAN','ZANZI',
].filter(w => w.length >= 5 && w.length <= 8 && /^[A-ZÉÈÊËÀÂÙÛÜÔÎÏÇ]+$/i.test(w));

// ─── KEYBOARD LAYOUT ────────────────────────────────────────────────────────
const KB_ROWS = [
  ['A','Z','E','R','T','Y','U','I','O','P'],
  ['Q','S','D','F','G','H','J','K','L','M'],
  ['⌫','W','X','C','V','B','N','←']
];

// ─── STATE ──────────────────────────────────────────────────────────────────
let targetWord   = '';
let wordLen      = 0;
let maxAttempts  = 6;
let currentRow   = 0;
let currentInput = [];
let gameOver     = false;
let score        = parseInt(localStorage.getItem('motus_score') || '0');

// ─── DOM REFS ───────────────────────────────────────────────────────────────
const grid        = document.getElementById('grid');
const statusText  = document.getElementById('statusText');
const badge       = document.getElementById('wordLengthBadge');
const btnSubmit   = document.getElementById('btnSubmit');
const btnNew      = document.getElementById('btnNew');
const btnHelp     = document.getElementById('btnHelp');
const scoreVal    = document.getElementById('score');
const helpModal   = document.getElementById('helpModal');
const endModal    = document.getElementById('endModal');
const closeHelp   = document.getElementById('closeHelp');
const btnNewEnd   = document.getElementById('btnNewEnd');

// ─── INIT ────────────────────────────────────────────────────────────────────
scoreVal.textContent = score;
buildKeyboard();
fetchWord();

// ─── FETCH MOT ───────────────────────────────────────────────────────────────
async function fetchWord() {
  statusText.textContent = 'Chargement du mot…';
  badge.textContent = '';
  grid.innerHTML = '';
  currentRow = 0; currentInput = []; gameOver = false;
  btnSubmit.disabled = true;

  let word = null;

  // Tentative API trouve-mot.fr (renvoie un mot aléatoire)
  try {
    const res = await fetch('https://trouve-mot.fr/api/random?minLength=6&maxLength=7', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      // L'API renvoie un tableau [{mot: "...", ...}]
      const raw = Array.isArray(data) ? data[0]?.mot : data?.mot;
      if (raw && /^[a-zA-ZÀ-ÿ]{5,8}$/.test(raw)) {
        word = raw.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      }
    }
  } catch (_) { /* fallback */ }

  // Fallback liste locale
  if (!word) {
    const pool = FALLBACK_WORDS.filter(w => w.length >= 5 && w.length <= 7);
    word = pool[Math.floor(Math.random() * pool.length)];
  }

  targetWord = word;
  wordLen    = targetWord.length;

  badge.textContent  = `${wordLen} lettres`;
  statusText.textContent = 'Trouvez le mot !';

  buildGrid();
  revealFirstLetter();
  resetKeyboardColors();
}

// ─── GRID ────────────────────────────────────────────────────────────────────
function buildGrid() {
  grid.innerHTML = '';
  for (let r = 0; r < maxAttempts; r++) {
    const row = document.createElement('div');
    row.className = 'row';
    row.id = `row-${r}`;
    for (let c = 0; c < wordLen; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = `cell-${r}-${c}`;
      row.appendChild(cell);
    }
    grid.appendChild(row);
  }
}

function revealFirstLetter() {
  const cell = document.getElementById(`cell-${currentRow}-0`);
  if (!cell) return;
  cell.textContent = targetWord[0];
  cell.classList.add('first-letter');
  currentInput = [targetWord[0]];
}

// ─── KEYBOARD ────────────────────────────────────────────────────────────────
function buildKeyboard() {
  const rows = ['kbRow1','kbRow2','kbRow3'];
  KB_ROWS.forEach((keys, i) => {
    const row = document.getElementById(rows[i]);
    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'kb-key' + (k === '⌫' || k === '←' ? ' special' : '');
      btn.textContent = k === '←' ? '⌫' : k;
      btn.dataset.key = k;
      btn.addEventListener('click', () => handleKey(k === '←' ? '⌫' : k));
      row.appendChild(btn);
    });
  });
}

function resetKeyboardColors() {
  document.querySelectorAll('.kb-key').forEach(k => {
    k.classList.remove('kb-correct','kb-present','kb-absent');
  });
}

function updateKeyboard(letter, state) {
  const priority = { 'kb-correct': 3, 'kb-present': 2, 'kb-absent': 1 };
  const cls = `kb-${state}`;
  document.querySelectorAll('.kb-key').forEach(btn => {
    if (btn.textContent === letter) {
      const current = ['kb-correct','kb-present','kb-absent'].find(c => btn.classList.contains(c));
      if (!current || priority[cls] > priority[current]) {
        btn.classList.remove('kb-correct','kb-present','kb-absent');
        btn.classList.add(cls);
      }
    }
  });
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Enter') { handleSubmit(); return; }
  if (e.key === 'Backspace') { handleKey('⌫'); return; }
  const letter = e.key.toUpperCase();
  if (/^[A-Z]$/.test(letter)) handleKey(letter);
});

function handleKey(key) {
  if (gameOver) return;
  if (key === '⌫') {
    deleteLetter();
  } else if (/^[A-Z]$/.test(key)) {
    addLetter(key);
  }
}

function addLetter(letter) {
  if (currentInput.length >= wordLen) return;
  currentInput.push(letter);
  const idx = currentInput.length - 1;
  const cell = document.getElementById(`cell-${currentRow}-${idx}`);
  if (!cell) return;
  cell.textContent = letter;
  cell.classList.add('filled');
  btnSubmit.disabled = currentInput.length < wordLen;
}

function deleteLetter() {
  // Ne pas supprimer la 1ère lettre (toujours révélée)
  if (currentInput.length <= 1) return;
  const idx = currentInput.length - 1;
  const cell = document.getElementById(`cell-${currentRow}-${idx}`);
  if (cell) { cell.textContent = ''; cell.classList.remove('filled'); }
  currentInput.pop();
  btnSubmit.disabled = currentInput.length < wordLen;
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────
btnSubmit.addEventListener('click', handleSubmit);

async function handleSubmit() {
  if (gameOver || currentInput.length < wordLen) return;

  const guess = currentInput.join('');

  // Indicateur de chargement pendant la vérification
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Vérification…';

  const valid = await isValidWord(guess);

  btnSubmit.textContent = 'Valider';
  btnSubmit.disabled = false;

  if (!valid) {
    shakeRow(currentRow);
    showToast('Mot non reconnu dans le dictionnaire !');
    return;
  }

  const result = computeResult(guess, targetWord);
  revealRow(currentRow, result, guess);

  const won = result.every(r => r === 'correct');
  if (won) {
    setTimeout(() => endGame(true, currentRow + 1), wordLen * 90 + 300);
    return;
  }

  currentRow++;
  if (currentRow >= maxAttempts) {
    setTimeout(() => endGame(false), wordLen * 90 + 300);
    return;
  }

  // Préparer la ligne suivante
  setTimeout(() => {
    currentInput = [targetWord[0]];
    revealFirstLetter();
    btnSubmit.disabled = true;
    statusText.textContent = `Essai ${currentRow + 1} / ${maxAttempts}`;
  }, wordLen * 90 + 250);
}

// ─── CALCUL RÉSULTAT ─────────────────────────────────────────────────────────
function computeResult(guess, target) {
  const result = Array(target.length).fill('absent');
  const targetArr = target.split('');
  const guessArr  = guess.split('');
  const usedTarget = Array(target.length).fill(false);
  const usedGuess  = Array(guess.length).fill(false);

  // 1. Corrects
  for (let i = 0; i < target.length; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct';
      usedTarget[i] = true;
      usedGuess[i]  = true;
    }
  }
  // 2. Présents
  for (let i = 0; i < guess.length; i++) {
    if (usedGuess[i]) continue;
    for (let j = 0; j < target.length; j++) {
      if (!usedTarget[j] && guessArr[i] === targetArr[j]) {
        result[i] = 'present';
        usedTarget[j] = true;
        break;
      }
    }
  }
  return result;
}

// ─── RÉVÉLATION LIGNE ────────────────────────────────────────────────────────
function revealRow(rowIdx, result, guess) {
  result.forEach((state, i) => {
    const cell = document.getElementById(`cell-${rowIdx}-${i}`);
    if (!cell) return;
    setTimeout(() => {
      cell.classList.remove('filled','first-letter');
      cell.classList.add(state);
      updateKeyboard(guess[i], state);
    }, i * 90);
  });
}

// ─── FIN DE PARTIE ───────────────────────────────────────────────────────────
function endGame(won, attempts) {
  gameOver = true;
  btnSubmit.disabled = true;

  if (won) {
    // Bounce animation sur la ligne gagnante
    document.getElementById(`row-${currentRow}`).classList.add('bounce');
    score += Math.max(10, 60 - (attempts - 1) * 10);
    localStorage.setItem('motus_score', score);
    scoreVal.textContent = score;
  }

  setTimeout(() => {
    document.getElementById('endEmoji').textContent  = won ? '🎉' : '😔';
    document.getElementById('endTitle').textContent  = won ? 'Bravo !' : 'Perdu…';
    document.getElementById('endSub').textContent    = won
      ? `Trouvé en ${attempts} essai${attempts > 1 ? 's' : ''} ! +${Math.max(10, 60-(attempts-1)*10)} points`
      : 'Le mot était :';
    document.getElementById('endWord').textContent   = targetWord;
    endModal.classList.remove('hidden');
  }, 600);
}

// ─── VÉRIFICATION MOT ────────────────────────────────────────────────────────
async function isValidWord(word) {
  // Le mot cible est toujours valide
  if (word === targetWord) return true;

  const lower = word.toLowerCase();

  // Source 1 — trouve-mot.fr
  try {
    const res = await fetch(
      `https://trouve-mot.fr/api/mot?mot=${encodeURIComponent(lower)}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return true;
      if (Array.isArray(data) && data.length === 0) return false; // réponse claire : mot inexistant
    }
  } catch (_) { /* API injoignable, on continue */ }

  // Source 2 — Wiktionnaire français (CORS ouvert via origin=*)
  try {
    const url = `https://fr.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(lower)}&format=json&origin=*`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages ?? {};
      // La clé "-1" signifie que la page n'existe pas
      const exists = !Object.keys(pages).includes('-1');
      return exists;
    }
  } catch (_) { /* API injoignable, on continue */ }

  // Source 3 — liste locale embarquée (hors connexion totale)
  return FALLBACK_WORDS.includes(word.toUpperCase());
}

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────
function shakeRow(rowIdx) {
  const row = document.getElementById(`row-${rowIdx}`);
  if (!row) return;
  row.classList.add('shake');
  row.addEventListener('animationend', () => row.classList.remove('shake'), { once: true });
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────
btnNew.addEventListener('click', () => {
  endModal.classList.add('hidden');
  fetchWord();
});
btnNewEnd.addEventListener('click', () => {
  endModal.classList.add('hidden');
  fetchWord();
});
btnHelp.addEventListener('click', () => helpModal.classList.remove('hidden'));
closeHelp.addEventListener('click', () => helpModal.classList.add('hidden'));
helpModal.addEventListener('click', e => { if (e.target === helpModal) helpModal.classList.add('hidden'); });
endModal.addEventListener('click',  e => { if (e.target === endModal)  endModal.classList.add('hidden'); });
