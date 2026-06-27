'use strict';

// ══════════════════════════════════════════════════════
//  CONSTANTES
// ══════════════════════════════════════════════════════
const PLAYER_COLORS = ['#8b5cf6','#f59e0b','#10b981','#ef4444'];
const PLAYER_EMOJIS = ['🟣','🟡','🟢','🔴'];

const CATEGORIES = [
  // ── Section haute ──
  { id:'ones',   name:'As',       section:'upper', desc:'Somme des 1' },
  { id:'twos',   name:'Deux',     section:'upper', desc:'Somme des 2' },
  { id:'threes', name:'Trois',    section:'upper', desc:'Somme des 3' },
  { id:'fours',  name:'Quatre',   section:'upper', desc:'Somme des 4' },
  { id:'fives',  name:'Cinq',     section:'upper', desc:'Somme des 5' },
  { id:'sixes',  name:'Six',      section:'upper', desc:'Somme des 6' },
  // ── Bonus section haute ──
  { id:'bonus',  name:'Bonus',    section:'bonus', desc:'+35 si ≥ 63' },
  // ── Section basse ──
  { id:'threeKind', name:'Brelan',        section:'lower', desc:'3 dés identiques → somme' },
  { id:'fourKind',  name:'Carré',         section:'lower', desc:'4 dés identiques → somme' },
  { id:'fullHouse', name:'Full House',    section:'lower', desc:'3+2 identiques → 25 pts' },
  { id:'smStraight',name:'Petite suite',  section:'lower', desc:'4 consécutifs → 30 pts' },
  { id:'lgStraight',name:'Grande suite',  section:'lower', desc:'5 consécutifs → 40 pts' },
  { id:'yahtzee',   name:'Yahtzee !',     section:'lower', desc:'5 identiques → 50 pts' },
  { id:'chance',    name:'Chance',        section:'lower', desc:'Somme de tous les dés' },
  // ── Total ──
  { id:'total',  name:'Total',    section:'total', desc:'' },
];

const SCORABLE = CATEGORIES.filter(c => !['bonus','total'].includes(c.id));

// Positions des points [left%, top%] — disposition classique d'un vrai dé
const DOT_POSITIONS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 22], [28, 50], [28, 78], [72, 22], [72, 50], [72, 78]],
};

// ══════════════════════════════════════════════════════
//  ÉTAT DU JEU
// ══════════════════════════════════════════════════════
let players    = [];   // [{name, color, scores:{}}]
let curPlayer  = 0;
let curRound   = 0;    // 0-12 (13 manches)
let rollsLeft  = 3;
let dice       = [1,1,1,1,1];
let kept       = [false,false,false,false,false];
let rolling    = false;
let hasRolled  = false;
const TOTAL_ROUNDS = 13;

// ══════════════════════════════════════════════════════
//  SETUP SCREEN
// ══════════════════════════════════════════════════════
let selectedPlayerCount = 1;

document.querySelectorAll('.pcb').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedPlayerCount = parseInt(btn.dataset.n);
    document.querySelectorAll('.pcb').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderNameInputs();
  });
});

function renderNameInputs() {
  const container = document.getElementById('playerNameInputs');
  container.innerHTML = '';
  for (let i = 0; i < selectedPlayerCount; i++) {
    const row = document.createElement('div');
    row.className = 'player-name-row';
    row.innerHTML = `
      <div class="player-name-color" style="background:${PLAYER_COLORS[i]}"></div>
      <input class="player-name-input" id="pname${i}" type="text"
             placeholder="Joueur ${i+1}" value="Joueur ${i+1}" maxlength="16"/>
    `;
    container.appendChild(row);
  }
}
renderNameInputs();

document.getElementById('btnStart').addEventListener('click', startGame);

function startGame() {
  players = [];
  for (let i = 0; i < selectedPlayerCount; i++) {
    const inp = document.getElementById(`pname${i}`);
    const name = inp?.value.trim() || `Joueur ${i+1}`;
    players.push({ name, color: PLAYER_COLORS[i], emoji: PLAYER_EMOJIS[i], scores: {} });
  }
  curPlayer = 0; curRound = 0;
  beginTurn();
  document.getElementById('screenSetup').classList.add('hidden');
  document.getElementById('screenGame').classList.remove('hidden');
}

document.getElementById('btnBackSetup').addEventListener('click', () => {
  if (!confirm('Quitter la partie en cours ?')) return;
  document.getElementById('screenGame').classList.add('hidden');
  document.getElementById('screenSetup').classList.remove('hidden');
});

// ══════════════════════════════════════════════════════
//  LOGIQUE DU TOUR
// ══════════════════════════════════════════════════════
function beginTurn() {
  dice    = [1,1,1,1,1];
  kept    = [false,false,false,false,false];
  rollsLeft = 3;
  hasRolled = false;

  renderHeader();
  renderDice();
  renderScoreboard();
  renderPreview([]);
  updateRollButton();
  document.getElementById('diceHint').textContent = 'Cliquez sur Lancer pour commencer';
}

function renderHeader() {
  const p = players[curPlayer];
  const el = document.getElementById('turnPlayer');
  el.textContent = `${p.emoji} ${p.name}`;
  el.style.color = p.color;
  document.getElementById('turnSub').textContent =
    `Manche ${curRound + 1} / ${TOTAL_ROUNDS}`;
  updateRollPips();
}

function updateRollPips() {
  const pips = document.querySelectorAll('.pip');
  const used = 3 - rollsLeft;
  pips.forEach((p, i) => p.classList.toggle('used', i < used));
}

// ══════════════════════════════════════════════════════
//  LANCER
// ══════════════════════════════════════════════════════
document.getElementById('btnRoll').addEventListener('click', rollDice);
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const btn = document.getElementById('btnRoll');
    if (!btn.disabled && btn.offsetParent !== null) btn.click();
  }
});

async function rollDice() {
  if (rollsLeft <= 0 || rolling) return;
  rolling = true;
  rollsLeft--;
  hasRolled = true;
  updateRollButton();
  updateRollPips();
  document.getElementById('diceHint').textContent =
    kept.some(Boolean) ? 'Les dés verts sont conservés 🔒' : '';

  const dieEls = document.querySelectorAll('.die');
  const ROLL_VARIANTS = ['roll-v1','roll-v2','roll-v3'];
  const ANIM_DURATION = 750; // ms — doit correspondre aux keyframes CSS

  // Assigner une variante d'animation à chaque dé non conservé
  dieEls.forEach((el, i) => {
    if (kept[i]) return;
    const variant = ROLL_VARIANTS[rand(0, 2)];
    el.classList.add(variant);
    el.dataset.rollVariant = variant;
  });

  // Flash de valeurs pendant l'animation (simule les faces qui défilent)
  const flashInterval = 55;
  const flashCount    = Math.floor(ANIM_DURATION / flashInterval) - 2;
  for (let f = 0; f < flashCount; f++) {
    dieEls.forEach((el, i) => {
      if (kept[i]) return;
      const v = rand(1, 6);
      el.dataset.val = v;
      renderDots(el, v);
    });
    await sleep(flashInterval);
  }

  // Valeurs finales avant la fin de l'animation
  dice.forEach((_, i) => {
    if (!kept[i]) dice[i] = rand(1, 6);
  });
  dieEls.forEach((el, i) => {
    el.dataset.val = dice[i];
    renderDots(el, dice[i]);
  });

  // Attendre la fin de l'animation 3D puis jouer l'atterrissage
  await sleep(flashInterval * 2);
  dieEls.forEach((el, i) => {
    if (kept[i]) return;
    const variant = el.dataset.rollVariant;
    el.classList.remove(variant);
    // Micro-délai décalé par dé pour un effet cascade naturel
    setTimeout(() => {
      el.classList.add('landing');
      el.addEventListener('animationend', () => el.classList.remove('landing'), { once: true });
    }, i * 40);
  });

  rolling = false;
  updateRollButton();
  renderPreview(dice);

  if (rollsLeft === 0) {
    document.getElementById('diceHint').textContent = '⚠️ Plus de lancers — choisissez une combinaison ci-dessous';
  }
}

function updateRollButton() {
  const btn   = document.getElementById('btnRoll');
  const label = document.getElementById('btnRollLabel');
  if (rollsLeft <= 0) {
    btn.disabled = true;
    label.textContent = 'Plus de lancers';
  } else if (!hasRolled) {
    btn.disabled = false;
    label.textContent = 'Lancer les dés';
  } else {
    btn.disabled = rolling;
    label.textContent = rollsLeft === 1 ? 'Dernier lancer !' : `Relancer (${rollsLeft} restant${rollsLeft>1?'s':''})`;
  }
}

// ══════════════════════════════════════════════════════
//  RENDU DES DÉS
// ══════════════════════════════════════════════════════
function renderDice() {
  const row = document.getElementById('diceRow');
  row.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const die = document.createElement('div');
    die.className = 'die' + (kept[i] ? ' kept' : '') + (!hasRolled ? ' die-disabled' : '');
    die.dataset.val = dice[i];
    die.title = kept[i] ? 'Cliquer pour relâcher' : 'Cliquer pour conserver';

    renderDots(die, dice[i]);

    die.addEventListener('click', () => toggleKeep(i));
    row.appendChild(die);
  }
}

function renderDots(dieEl, val) {
  // Supprimer les anciens points directement dans le dé
  dieEl.querySelectorAll('.dot').forEach(d => d.remove());
  const positions = DOT_POSITIONS[val] || DOT_POSITIONS[1];
  positions.forEach(([l, t]) => {
    const d = document.createElement('div');
    d.className = 'dot';
    d.style.left = l + '%';
    d.style.top  = t + '%';
    dieEl.appendChild(d);
  });
}

function toggleKeep(i) {
  if (!hasRolled || rolling || rollsLeft === 3) return;
  kept[i] = !kept[i];
  const die = document.querySelectorAll('.die')[i];
  if (!die) return;
  die.classList.toggle('kept', kept[i]);
  die.title = kept[i] ? 'Cliquer pour relâcher' : 'Cliquer pour conserver';
  // Rafraîchir les points (couleur gérée par CSS .kept .dot)
  renderDots(die, dice[i]);
}

// ══════════════════════════════════════════════════════
//  PRÉVISUALISATION SCORES
// ══════════════════════════════════════════════════════
function renderPreview(currentDice) {
  const grid = document.getElementById('previewGrid');
  grid.innerHTML = '';
  if (!currentDice.length) return;

  const playerScores = players[curPlayer].scores;
  let bestPts = 0;
  const items = [];

  SCORABLE.forEach(cat => {
    const alreadyUsed = playerScores[cat.id] !== undefined;
    const pts = calcScore(currentDice, cat.id);
    if (pts > bestPts && !alreadyUsed) bestPts = pts;
    items.push({ cat, pts, alreadyUsed });
  });

  items.forEach(({ cat, pts, alreadyUsed }) => {
    const div = document.createElement('div');
    div.className = 'preview-item' +
      (alreadyUsed ? ' preview-used' : '') +
      (pts === 0 && !alreadyUsed ? ' preview-zero' : '') +
      (pts === bestPts && pts > 0 && !alreadyUsed ? ' preview-best' : '');

    div.innerHTML = `
      <span class="preview-name">${cat.name}</span>
      <span class="preview-pts">${alreadyUsed ? '✓' : pts > 0 ? pts + ' pts' : '0'}</span>
    `;
    if (!alreadyUsed) div.addEventListener('click', () => selectScore(cat.id, pts));
    grid.appendChild(div);
  });
}

// ══════════════════════════════════════════════════════
//  SÉLECTION D'UN SCORE
// ══════════════════════════════════════════════════════
function selectScore(catId, pts) {
  if (!hasRolled) return;
  const p = players[curPlayer];
  if (p.scores[catId] !== undefined) return;

  p.scores[catId] = pts;

  // Calcul bonus section haute
  const upperSum = ['ones','twos','threes','fours','fives','sixes']
    .reduce((s,id) => s + (p.scores[id] ?? 0), 0);

  const allUpperDone = ['ones','twos','threes','fours','fives','sixes']
    .every(id => p.scores[id] !== undefined);

  if (allUpperDone && p.scores.bonus === undefined) {
    p.scores.bonus = upperSum >= 63 ? 35 : 0;
  }

  // Calcul total
  p.scores.total = CATEGORIES
    .filter(c => !['total'].includes(c.id))
    .reduce((s, c) => s + (p.scores[c.id] ?? 0), 0);

  renderScoreboard();

  // Vérifier fin de partie
  const roundsDone = SCORABLE.every(c => players.every(pl => pl.scores[c.id] !== undefined));
  if (roundsDone) { endGame(); return; }

  // Joueur suivant
  curPlayer = (curPlayer + 1) % players.length;
  if (curPlayer === 0) curRound++;

  beginTurn();
}

// ══════════════════════════════════════════════════════
//  TABLEAU DES SCORES
// ══════════════════════════════════════════════════════
function renderScoreboard() {
  const sb = document.getElementById('scoreboard');
  const cols = players.length + 1; // catégorie + joueurs

  // Header joueurs
  let html = `<div class="sb-row sb-header" style="grid-template-columns:1fr${' 52px'.repeat(players.length)}">
    <div class="sb-cell sb-cat-name">Catégorie</div>
    ${players.map((p,i) => `<div class="sb-cell sb-score sb-player-header" style="color:${p.color}">${p.emoji}</div>`).join('')}
  </div>`;

  const colTpl = `grid-template-columns:1fr${' 52px'.repeat(players.length)}`;

  let currentSection = '';
  CATEGORIES.forEach(cat => {
    if (cat.section !== currentSection) {
      currentSection = cat.section;
      const labels = { upper:'Section haute (objectif ≥ 63)', bonus:'Bonus', lower:'Section basse', total:'Total général' };
      html += `<div class="sb-section-label">${labels[cat.section] || ''}</div>`;
    }

    const rowClass = cat.id === 'bonus' ? ' sb-bonus' : cat.id === 'total' ? ' sb-total' : '';
    html += `<div class="sb-row${rowClass}" style="${colTpl}">
      <div class="sb-cell">
        <span class="sb-cat-name">${cat.name}<span class="sb-cat-info">${cat.desc}</span></span>
      </div>
      ${players.map((p,i) => {
        const val = p.scores[cat.id];
        const isActive = i === curPlayer && cat.id !== 'bonus' && cat.id !== 'total';
        const filled   = val !== undefined;
        const isBest   = filled && cat.id !== 'total' && cat.id !== 'bonus' &&
                         players.every(pl => !filled || (pl.scores[cat.id] ?? -1) <= val);
        return `<div class="sb-cell sb-score
          ${filled ? 'filled' : 'empty'}
          ${isActive ? ' active-player' : ''}
          ${cat.id === 'bonus' && val === 35 ? ' bonus-ok' : ''}
          ${cat.id === 'total' ? ' total-cell' : ''}">
          ${filled ? val : (isActive && cat.id !== 'bonus' && cat.id !== 'total' ? '…' : '-')}
        </div>`;
      }).join('')}
    </div>`;
  });

  sb.innerHTML = html;
}

// ══════════════════════════════════════════════════════
//  FIN DE PARTIE
// ══════════════════════════════════════════════════════
function endGame() {
  const sorted = [...players]
    .map((p, i) => ({ ...p, idx: i, total: p.scores.total ?? 0 }))
    .sort((a, b) => b.total - a.total);

  const winner = sorted[0];
  const medals = ['🥇','🥈','🥉','🏅'];
  const podiumEmoji = players.length === 1 ? '🎉' : '🏆';

  document.getElementById('podium').textContent = podiumEmoji;
  document.getElementById('endTitle').textContent =
    players.length === 1 ? `Score final : ${winner.total} pts` : `${winner.emoji} ${winner.name} gagne !`;

  const finalScores = document.getElementById('finalScores');
  finalScores.innerHTML = sorted.map((p, rank) => `
    <div class="final-score-row ${rank === 0 ? 'fsr-winner' : ''}">
      <span class="fsr-rank">${medals[rank]}</span>
      <span class="fsr-name" style="color:${p.color}">${p.name}</span>
      <span class="fsr-score">${p.total} pts</span>
    </div>
  `).join('');

  document.getElementById('endModal').classList.remove('hidden');
}

document.getElementById('btnReplay').addEventListener('click', () => {
  document.getElementById('endModal').classList.add('hidden');
  document.getElementById('screenGame').classList.add('hidden');
  document.getElementById('screenSetup').classList.remove('hidden');
});

// ══════════════════════════════════════════════════════
//  CALCUL DES SCORES
// ══════════════════════════════════════════════════════
function calcScore(dice, catId) {
  if (!dice.length) return 0;
  const sum    = dice.reduce((a, b) => a + b, 0);
  const counts = getCounts(dice);
  const vals   = Object.values(counts);

  switch (catId) {
    case 'ones':   return dice.filter(d => d === 1).reduce((a,b)=>a+b,0);
    case 'twos':   return dice.filter(d => d === 2).reduce((a,b)=>a+b,0);
    case 'threes': return dice.filter(d => d === 3).reduce((a,b)=>a+b,0);
    case 'fours':  return dice.filter(d => d === 4).reduce((a,b)=>a+b,0);
    case 'fives':  return dice.filter(d => d === 5).reduce((a,b)=>a+b,0);
    case 'sixes':  return dice.filter(d => d === 6).reduce((a,b)=>a+b,0);

    case 'threeKind': return vals.some(c => c >= 3) ? sum : 0;
    case 'fourKind':  return vals.some(c => c >= 4) ? sum : 0;

    case 'fullHouse': {
      const sorted = [...vals].sort();
      return sorted[0] === 2 && sorted[1] === 3 ? 25 : 0;
    }
    case 'smStraight': return hasSeq(dice, 4) ? 30 : 0;
    case 'lgStraight': return hasSeq(dice, 5) ? 40 : 0;
    case 'yahtzee':    return vals.some(c => c === 5) ? 50 : 0;
    case 'chance':     return sum;

    default: return 0;
  }
}

function getCounts(dice) {
  return dice.reduce((acc, d) => { acc[d] = (acc[d]||0)+1; return acc; }, {});
}

function hasSeq(dice, len) {
  const unique = [...new Set(dice)].sort((a,b)=>a-b);
  let streak = 1, best = 1;
  for (let i = 1; i < unique.length; i++) {
    streak = unique[i] === unique[i-1] + 1 ? streak + 1 : 1;
    if (streak > best) best = streak;
  }
  return best >= len;
}

// ══════════════════════════════════════════════════════
//  UTILITAIRES
// ══════════════════════════════════════════════════════
const rand  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const sleep = ms => new Promise(r => setTimeout(r, ms));
