'use strict';

// ═══════════════════════════════════════════════════════════════════
//  CONSTANTES
// ═══════════════════════════════════════════════════════════════════
const MIN_PLAYERS = 2, MAX_PLAYERS = 8;
const COLS = 4, ROWS = 3, HAND_SIZE = COLS * ROWS; // 12 cartes
const END_SCORE = 100; // seuil de fin de partie

// Composition du deck Skyjo (150 cartes)
function createDeck() {
  const d = [];
  for (let i = 0; i < 5;  i++) d.push(-2);
  for (let i = 0; i < 10; i++) d.push(-1);
  for (let i = 0; i < 15; i++) d.push(0);
  for (let v = 1; v <= 12; v++)
    for (let i = 0; i < 10; i++) d.push(v);
  return shuffle(d);
}

function cardBg(v) {
  if (v === -2) return '#1d4ed8';
  if (v === -1) return '#2563eb';
  if (v === 0)  return '#0e7490';
  if (v <= 2)   return '#15803d';
  if (v <= 4)   return '#4d7c0f';
  if (v <= 6)   return '#a16207';
  if (v <= 8)   return '#c2410c';
  return '#b91c1c';
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Colonnes : col j → indices j, j+4, j+8
function colIndices(col) { return [col, col + COLS, col + COLS * 2]; }

// ═══════════════════════════════════════════════════════════════════
//  AUDIO — Web Audio API
// ═══════════════════════════════════════════════════════════════════
let _ac = null;
function getAC() {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  if (_ac.state === 'suspended') _ac.resume();
  return _ac;
}

// Retournement de carte — frottement bref + tonalité douce
function playFlip() {
  const ac = getAC(), now = ac.currentTime;
  const len = Math.floor(ac.sampleRate * 0.09);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5);

  const src  = ac.createBufferSource(); src.buffer = buf;
  const bp   = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.2;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.28, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  src.connect(bp); bp.connect(gain); gain.connect(ac.destination);
  src.start(now);

  // Micro-clic final
  const osc  = ac.createOscillator(); osc.type = 'sine'; osc.frequency.value = 1200;
  const g2   = ac.createGain();
  g2.gain.setValueAtTime(0.12, now + 0.06);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
  osc.connect(g2); g2.connect(ac.destination);
  osc.start(now + 0.06); osc.stop(now + 0.12);
}

// Pioche dans le deck — glissement de carte
function playDraw() {
  const ac = getAC(), now = ac.currentTime;
  const len = Math.floor(ac.sampleRate * 0.07);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource(); src.buffer = buf;
  const hp  = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
  const lp  = ac.createBiquadFilter(); lp.type = 'lowpass';  lp.frequency.value = 8000;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  src.connect(hp); hp.connect(lp); lp.connect(gain); gain.connect(ac.destination);
  src.start(now);
}

// Pose/échange de carte — impact sourd
function playPlace() {
  const ac = getAC(), now = ac.currentTime;
  const osc = ac.createOscillator(); osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.1);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.45, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
  osc.connect(gain); gain.connect(ac.destination);
  osc.start(now); osc.stop(now + 0.14);

  // Bruit d'impact
  const len = Math.floor(ac.sampleRate * 0.04);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const dat = buf.getChannelData(0);
  for (let i = 0; i < len; i++) dat[i] = Math.random() * 2 - 1;
  const src2 = ac.createBufferSource(); src2.buffer = buf;
  const lp   = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
  const g2   = ac.createGain();
  g2.gain.setValueAtTime(0.18, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  src2.connect(lp); lp.connect(g2); g2.connect(ac.destination);
  src2.start(now);
}

// Colonne éliminée — accord montant
function playEliminate() {
  const ac = getAC(), now = ac.currentTime;
  [523, 659, 784].forEach((freq, i) => {
    const osc  = ac.createOscillator(); osc.type = 'triangle'; osc.frequency.value = freq;
    const gain = ac.createGain();
    const t    = now + i * 0.07;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(t); osc.stop(t + 0.6);
  });
}

// ═══════════════════════════════════════════════════════════════════
//  AMBIANCE MUSICALE — Ré mineur, atmosphère carte / Nordic chill
// ═══════════════════════════════════════════════════════════════════
let _ambNodes = null;
let _ambTimer = null;

// Progression Dm → Gm → C → Am
const AMB_CHORDS = [
  [146.83, 174.61, 220.00], // Dm : D3 F3 A3
  [196.00, 233.08, 293.66], // Gm : G3 Bb3 D4
  [130.81, 164.81, 196.00], // C  : C3 E3 G3
  [220.00, 261.63, 329.63], // Am : A3 C4 E4
];
const AMB_MEL = [587.33, 659.25, 698.46, 783.99, 880.00, 783.99, 659.25, 523.25];

function startAmbient() {
  if (_ambNodes) return;
  const ac = getAC();

  const master = ac.createGain();
  master.gain.setValueAtTime(0, ac.currentTime);
  master.gain.linearRampToValueAtTime(0.12, ac.currentTime + 4);
  master.connect(ac.destination);

  let chordIdx = 0;
  let melStep  = 0;
  const pads   = [];

  function setChord(freqs) {
    pads.forEach(({ g }) => {
      g.gain.linearRampToValueAtTime(0, ac.currentTime + 0.9);
    });
    const dying = pads.splice(0);
    setTimeout(() => dying.forEach(({ osc }) => { try { osc.stop(); } catch (e) {} }), 1000);

    freqs.forEach((freq, i) => {
      const osc = ac.createOscillator();
      osc.type  = 'sine';
      osc.frequency.value = freq;
      osc.detune.value    = i % 2 === 0 ? 5 : -5;

      const g = ac.createGain();
      g.gain.setValueAtTime(0, ac.currentTime);
      g.gain.linearRampToValueAtTime(0.28 / freqs.length, ac.currentTime + 0.9);

      osc.connect(g); g.connect(master);
      osc.start();
      pads.push({ osc, g });
    });
  }

  setChord(AMB_CHORDS[0]);

  function tick() {
    if (!_ambNodes) return;
    chordIdx = (chordIdx + 1) % AMB_CHORDS.length;
    setChord(AMB_CHORDS[chordIdx]);

    // 2 notes mélodiques pendant ce temps
    [0, 1].forEach(i => {
      setTimeout(() => {
        if (!_ambNodes) return;
        const now  = ac.currentTime;
        const freq = AMB_MEL[melStep % AMB_MEL.length];
        melStep++;
        const osc = ac.createOscillator();
        osc.type  = 'triangle';
        osc.frequency.value = freq;
        const g = ac.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.07, now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.65);
      }, i * 900 + Math.random() * 400);
    });

    _ambTimer = setTimeout(tick, 3800);
  }

  _ambTimer = setTimeout(tick, 3800);
  _ambNodes = { master, pads };
}

function stopAmbient() {
  if (!_ambNodes) return;
  clearTimeout(_ambTimer);
  _ambTimer = null;
  const ac    = getAC();
  const nodes = _ambNodes;
  _ambNodes   = null;
  nodes.master.gain.linearRampToValueAtTime(0, ac.currentTime + 2);
  setTimeout(() => nodes.pads.forEach(({ osc }) => { try { osc.stop(); } catch (e) {} }), 2100);
}

// ═══════════════════════════════════════════════════════════════════
//  ÉTAT
// ═══════════════════════════════════════════════════════════════════
const config = {
  playerCount: 2,
  players: Array.from({ length: MAX_PLAYERS }, (_, i) => ({
    name: `Joueur ${i + 1}`,
    ia: false,
  })),
};

let G = {};

// ═══════════════════════════════════════════════════════════════════
//  DOM UTILS
// ═══════════════════════════════════════════════════════════════════
function $(id) { return document.getElementById(id); }
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  $(id).classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════════════
//  CONFIG SCREEN
// ═══════════════════════════════════════════════════════════════════
function renderConfig() {
  $('playerCountVal').textContent = config.playerCount;
  const wrap = $('playerSetup');
  wrap.innerHTML = '';

  for (let i = 0; i < config.playerCount; i++) {
    const p = config.players[i];
    const card = document.createElement('div');
    card.className = 'player-card';

    const num = document.createElement('div');
    num.className = 'player-num';
    num.textContent = i + 1;

    const input = document.createElement('input');
    input.className = 'player-name-input';
    input.type = 'text';
    input.maxLength = 14;
    input.value = p.name;
    input.addEventListener('input', e => { config.players[i].name = e.target.value || `Joueur ${i + 1}`; });

    const iaBtn = document.createElement('button');
    iaBtn.className = 'ia-toggle' + (p.ia ? ' active' : '');
    iaBtn.textContent = p.ia ? '🤖 IA' : '👤 Humain';
    iaBtn.addEventListener('click', () => { config.players[i].ia = !config.players[i].ia; renderConfig(); });

    card.append(num, input, iaBtn);
    wrap.appendChild(card);
  }
}

$('btnMinus').addEventListener('click', () => { if (config.playerCount > MIN_PLAYERS) { config.playerCount--; renderConfig(); } });
$('btnPlus').addEventListener('click',  () => { if (config.playerCount < MAX_PLAYERS) { config.playerCount++; renderConfig(); } });
$('btnStart').addEventListener('click', startGame);
$('btnReplay').addEventListener('click', () => { stopAmbient(); showScreen('screenConfig'); renderConfig(); });

// ═══════════════════════════════════════════════════════════════════
//  LANCEMENT
// ═══════════════════════════════════════════════════════════════════
function startGame() {
  G.players = config.players.slice(0, config.playerCount).map((p, i) => ({
    name: p.name.trim() || `Joueur ${i + 1}`,
    ia:   p.ia,
    cards: [],
    totalScore: 0,
  }));
  G.round        = 1;
  G.firstPlayer  = 0; // tourne à chaque manche
  startRound();
}

// ═══════════════════════════════════════════════════════════════════
//  MANCHE
// ═══════════════════════════════════════════════════════════════════
function startRound() {
  let deck = createDeck();

  G.players.forEach(p => {
    p.cards = [];
    for (let i = 0; i < HAND_SIZE; i++) {
      p.cards.push({ value: deck.shift(), revealed: false, eliminated: false });
    }
  });

  // Première carte de la défausse
  const firstDiscard = deck.shift();
  G.deck             = deck;
  G.discard          = [firstDiscard];

  G.phase            = 'initFlip';   // 'initFlip' | 'draw' | 'hold' | 'lastTurn'
  G.initFlipPlayer   = G.firstPlayer;
  G.initFlipCount    = 0;            // cartes retournées par le joueur courant
  G.currentIdx       = G.firstPlayer;
  G.heldCard         = null;
  G.heldFrom         = null;         // 'deck' | 'discard'
  G.endTriggeredBy   = null;
  G.lastTurnCount    = 0;

  showScreen('screenGame');
  startAmbient();
  renderAll();
}

// ═══════════════════════════════════════════════════════════════════
//  RENDU GLOBAL
// ═══════════════════════════════════════════════════════════════════
function renderAll() {
  renderCenter();
  renderPlayers();
  renderHint();
}

function renderCenter() {
  // Deck
  const deckEl = $('deckCard');
  $('deckCount').textContent = `${G.deck.length} cartes`;
  const deckClickable = G.phase === 'draw' && !G.players[G.currentIdx].ia;
  deckEl.classList.toggle('clickable', deckClickable);
  deckEl.onclick = deckClickable ? drawFromDeck : null;

  // Défausse
  const top      = G.discard[G.discard.length - 1];
  const discardEl = $('discardTop');
  styleCard(discardEl, top, true);
  const discardClickable = G.phase === 'draw' && !G.players[G.currentIdx].ia;
  discardEl.classList.toggle('clickable', discardClickable);
  discardEl.onclick = discardClickable ? takeFromDiscard : null;

  // Carte en main
  const heldZone = $('heldZone');
  if (G.heldCard !== null) {
    heldZone.classList.remove('hidden');
    styleCard($('heldCard'), G.heldCard, true);
    const canDiscard = G.heldFrom === 'deck';
    $('btnDiscardHeld').classList.toggle('hidden', !canDiscard);
  } else {
    heldZone.classList.add('hidden');
  }
}

function renderPlayers() {
  const wrap = $('playersWrap');
  wrap.innerHTML = '';

  G.players.forEach((p, pi) => {
    const zone = document.createElement('div');
    zone.className = 'player-zone' + (pi === G.currentIdx ? ' active' : '');
    zone.id = `zone-${pi}`;

    const header = document.createElement('div');
    header.className = 'zone-header';

    const nameEl = document.createElement('div');
    nameEl.className = 'zone-name' + (p.ia ? ' ia-label' : '');
    nameEl.textContent = p.name + (p.ia ? ' 🤖' : '');

    const scoreEl = document.createElement('div');
    scoreEl.className = 'zone-score';
    scoreEl.textContent = `Visible : ${visibleScore(p)}  |  Total : ${p.totalScore}`;

    header.append(nameEl, scoreEl);

    const grid = document.createElement('div');
    grid.className = 'card-grid';

    p.cards.forEach((card, ci) => {
      const el = document.createElement('div');
      el.className = 'card';

      if (card.eliminated) {
        el.classList.add('card-eliminated');
        grid.appendChild(el);
        return;
      }

      if (card.revealed) {
        styleCard(el, card.value, true);
      } else {
        el.classList.add('card-back');
        el.textContent = '?';
      }

      // Cliquabilité
      const clickable = isCardClickable(pi, ci, card);
      if (clickable) {
        el.classList.add('clickable');
        el.addEventListener('click', () => onCardClick(pi, ci));
      }

      grid.appendChild(el);
    });

    zone.append(header, grid);
    wrap.appendChild(zone);
  });
}

function renderHint() {
  const el = $('gameHint');
  const p  = G.players[G.currentIdx];
  if (p.ia) { el.textContent = `${p.name} réfléchit…`; return; }

  switch (G.phase) {
    case 'initFlip':
      el.textContent = `${p.name} — Retourne ${2 - G.initFlipCount} carte(s)`;
      break;
    case 'draw':
      el.textContent = `${p.name} — Pioche dans le deck ou prends la défausse`;
      break;
    case 'hold':
      if (G.heldFrom === 'discard') {
        el.textContent = `${p.name} — Clique une carte à remplacer`;
      } else {
        el.textContent = `${p.name} — Remplace une carte, ou défausse et révèle une cachée`;
      }
      break;
    case 'lastTurn':
      el.textContent = `${p.name} — Dernier tour ! (${G.lastTurnCount}/${G.players.length - 1} joués)`;
      break;
    default:
      el.textContent = '';
  }
}

function isCardClickable(pi, ci, card) {
  if (card.eliminated) return false;
  const isCurrentPlayer = pi === G.currentIdx;

  if (G.phase === 'initFlip')
    return isCurrentPlayer && pi === G.initFlipPlayer && !card.revealed;

  if (G.phase === 'hold' && isCurrentPlayer)
    return !card.eliminated; // peut remplacer n'importe quelle carte (révélée ou non)

  if ((G.phase === 'draw' || G.phase === 'lastTurn') && G.heldCard !== null && isCurrentPlayer)
    return !card.eliminated;

  return false;
}

function styleCard(el, value, revealed) {
  if (!revealed) {
    el.className = 'card card-back';
    el.textContent = '?';
    el.style.background = '';
    return;
  }
  el.className  = 'card';
  el.textContent = value === 0 ? '0' : (value > 0 ? `+${value}` : value);
  el.style.background = cardBg(value);
  el.style.borderColor = '#fff3';
}

// ═══════════════════════════════════════════════════════════════════
//  INTERACTIONS
// ═══════════════════════════════════════════════════════════════════
function onCardClick(pi, ci) {
  const card = G.players[pi].cards[ci];

  if (G.phase === 'initFlip' && pi === G.initFlipPlayer && !card.revealed) {
    playFlip();
    card.revealed = true;
    G.initFlipCount++;
    renderAll();

    if (G.initFlipCount >= 2) {
      // Passer au joueur suivant (initFlip)
      const next = (G.initFlipPlayer + 1) % G.players.length;
      if (next === G.firstPlayer) {
        // Tous ont retourné 2 cartes → début du jeu
        beginGame();
      } else {
        G.initFlipPlayer = next;
        G.initFlipCount  = 0;
        G.currentIdx     = next;
        renderAll();
      }
    }
    return;
  }

  if ((G.phase === 'hold' || G.phase === 'lastTurn') && G.heldCard !== null && pi === G.currentIdx) {
    swapCard(ci);
    return;
  }
}

function drawFromDeck() {
  if (G.phase !== 'draw' && G.phase !== 'lastTurn') return;
  playDraw();
  const value = deckPop();
  G.heldCard = value;
  G.heldFrom = 'deck';
  G.phase    = 'hold';
  renderAll();
}

function takeFromDiscard() {
  if ((G.phase !== 'draw' && G.phase !== 'lastTurn') || G.discard.length === 0) return;
  playDraw();
  const value = G.discard.pop();
  G.heldCard = value;
  G.heldFrom = 'discard';
  G.phase    = 'hold';
  renderAll();
}

function swapCard(ci) {
  const p    = G.players[G.currentIdx];
  const old  = p.cards[ci];

  // Défausse la carte en place
  if (!old.eliminated) G.discard.push(old.value);

  // Place la carte tenue
  playPlace();
  old.value    = G.heldCard;
  old.revealed = true;
  old.eliminated = false;

  G.heldCard = null;
  G.heldFrom = null;
  G.phase    = G.endTriggeredBy !== null ? 'lastTurn' : 'draw';

  checkColumnElimination(G.currentIdx);
  afterMove();
}

// Défausser la carte tenue (depuis deck uniquement) + retourner une carte cachée
$('btnDiscardHeld').addEventListener('click', () => {
  if (G.heldFrom !== 'deck' || G.heldCard === null) return;
  G.discard.push(G.heldCard);
  G.heldCard = null;
  G.heldFrom = null;
  // Passe en mode "flip" : attendre que le joueur clique une carte cachée
  G.phase = 'flipOne';
  renderAll();
  $('gameHint').textContent = `${G.players[G.currentIdx].name} — Clique une carte cachée pour la révéler`;
});

// Gestion du clic en phase flipOne (révéler une carte cachée)
$('playersWrap').addEventListener('click', e => {
  if (G.phase !== 'flipOne') return;
  const zoneEl = e.target.closest('.player-zone');
  const cardEl = e.target.closest('.card');
  if (!zoneEl || !cardEl) return;

  const pi = G.players.findIndex((_, i) => `zone-${i}` === zoneEl.id);
  if (pi !== G.currentIdx) return;

  const ci = [...zoneEl.querySelector('.card-grid').children].indexOf(cardEl);
  if (ci < 0) return;

  const card = G.players[pi].cards[ci];
  if (card.eliminated || card.revealed) return;

  playFlip();
  card.revealed = true;
  G.phase = G.endTriggeredBy !== null ? 'lastTurn' : 'draw';
  checkColumnElimination(pi);
  afterMove();
});

// ═══════════════════════════════════════════════════════════════════
//  LOGIQUE DE JEU
// ═══════════════════════════════════════════════════════════════════
function deckPop() {
  if (G.deck.length === 0) {
    const top = G.discard.pop();
    G.deck    = shuffle(G.discard);
    G.discard = [top];
    toast('Deck mélangé à nouveau !');
  }
  return G.deck.shift();
}

function checkColumnElimination(pi) {
  const p = G.players[pi];
  for (let col = 0; col < COLS; col++) {
    const idxs = colIndices(col);
    const cards = idxs.map(i => p.cards[i]);
    if (cards.every(c => !c.eliminated && c.revealed)) {
      const val = cards[0].value;
      if (cards.every(c => c.value === val)) {
        idxs.forEach(i => {
          G.discard.push(p.cards[i].value);
          p.cards[i].eliminated = true;
        });
        playEliminate();
        toast(`${p.name} : colonne éliminée ! (${val > 0 ? '+' : ''}${val})`);
      }
    }
  }
}

function allRevealed(p) {
  return p.cards.every(c => c.eliminated || c.revealed);
}

function visibleScore(p) {
  return p.cards.reduce((s, c) => (!c.eliminated && c.revealed ? s + c.value : s), 0);
}

function totalRoundScore(p) {
  return p.cards.reduce((s, c) => (c.eliminated ? s : s + c.value), 0);
}

function afterMove() {
  const p = G.players[G.currentIdx];

  // Le joueur a tout révélé → déclenche le dernier tour
  if (G.endTriggeredBy === null && allRevealed(p)) {
    G.endTriggeredBy = G.currentIdx;
    toast(`${p.name} a tout révélé ! Dernier tour pour les autres.`, '#eab308');
    G.phase = 'lastTurn';
    endTurn();
    return;
  }

  // Déjà en lastTurn : décompter
  if (G.phase === 'lastTurn' || G.endTriggeredBy !== null) {
    G.lastTurnCount++;
    if (G.lastTurnCount >= G.players.length - 1) {
      endRound();
      return;
    }
  }

  endTurn();
}

function beginGame() {
  G.phase      = 'draw';
  G.currentIdx = G.firstPlayer;
  renderAll();
  if (G.players[G.currentIdx].ia) setTimeout(doIATurn, 900);
}

function endTurn() {
  G.heldCard   = null;
  G.heldFrom   = null;
  G.currentIdx = (G.currentIdx + 1) % G.players.length;

  // Si on revient au joueur déclencheur → fin de manche
  if (G.endTriggeredBy !== null && G.currentIdx === G.endTriggeredBy) {
    endRound();
    return;
  }

  if (G.phase !== 'lastTurn') G.phase = 'draw';

  renderAll();

  if (G.players[G.currentIdx].ia) setTimeout(doIATurn, 900);
}

// ═══════════════════════════════════════════════════════════════════
//  FIN DE MANCHE
// ═══════════════════════════════════════════════════════════════════
function endRound() {
  // Révéler toutes les cartes cachées
  G.players.forEach(p => p.cards.forEach(c => { if (!c.eliminated) c.revealed = true; }));

  const roundScores = G.players.map(p => totalRoundScore(p));
  const minScore    = Math.min(...roundScores);
  let   doubled     = false;

  // Double si le déclencheur n'a pas le score le plus bas
  if (roundScores[G.endTriggeredBy] > minScore) {
    roundScores[G.endTriggeredBy] *= 2;
    doubled = true;
  }

  G.players.forEach((p, i) => { p.totalScore += roundScores[i]; });
  G.roundScores = roundScores;
  G.doubled     = doubled ? G.endTriggeredBy : null;

  renderAll();

  const maxTotal = Math.max(...G.players.map(p => p.totalScore));
  if (maxTotal >= END_SCORE) {
    showWinner();
  } else {
    showScoreScreen();
  }
}

// ═══════════════════════════════════════════════════════════════════
//  IA (simple)
// ═══════════════════════════════════════════════════════════════════
function doIATurn() {
  if (G.phase === 'initFlip') {
    // Retourner 2 cartes aléatoires
    const hidden = G.players[G.initFlipPlayer].cards
      .map((c, i) => ({ c, i })).filter(({ c }) => !c.revealed && !c.eliminated);
    if (hidden.length > 0) {
      const pick = hidden[Math.floor(Math.random() * hidden.length)];
      playFlip();
      pick.c.revealed = true;
      G.initFlipCount++;
      renderAll();
    }
    if (G.initFlipCount < 2) {
      setTimeout(doIATurn, 500);
    } else {
      const next = (G.initFlipPlayer + 1) % G.players.length;
      if (next === G.firstPlayer) {
        setTimeout(beginGame, 600);
      } else {
        G.initFlipPlayer = next;
        G.initFlipCount  = 0;
        G.currentIdx     = next;
        renderAll();
        if (G.players[next].ia) setTimeout(doIATurn, 600);
      }
    }
    return;
  }

  // Tour normal : stratégie simple
  // 1. Si la défausse est négative ou 0 → la prendre et remplacer la carte visible la plus haute
  // 2. Sinon piocher
  setTimeout(() => {
    const p   = G.players[G.currentIdx];
    const top = G.discard[G.discard.length - 1];

    const highestVisible = p.cards
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !c.eliminated && c.revealed)
      .sort((a, b) => b.c.value - a.c.value)[0];

    if (top <= 4 && highestVisible && highestVisible.c.value > top) {
      // Prendre la défausse et remplacer la carte la plus haute
      takeFromDiscard();
      setTimeout(() => {
        swapCard(highestVisible.i);
        renderAll();
      }, 400);
    } else {
      // Piocher
      const drawn = deckPop();
      G.heldCard = drawn;
      G.heldFrom = 'deck';
      G.phase    = 'hold';
      renderAll();

      setTimeout(() => {
        // Si la carte piochée est meilleure que la carte visible la plus haute → échanger
        if (highestVisible && drawn < highestVisible.c.value) {
          swapCard(highestVisible.i);
        } else {
          // Sinon défausser et révéler une carte cachée
          G.discard.push(G.heldCard);
          G.heldCard = null;
          G.heldFrom = null;
          G.phase    = 'draw';
          const hidden = p.cards.map((c, i) => ({ c, i })).filter(({ c }) => !c.eliminated && !c.revealed);
          if (hidden.length > 0) {
            const pick = hidden[Math.floor(Math.random() * hidden.length)];
            pick.c.revealed = true;
            checkColumnElimination(G.currentIdx);
          }
          afterMove();
          renderAll();
        }
      }, 500);
    }
  }, 600);
}


// ═══════════════════════════════════════════════════════════════════
//  ÉCRAN SCORE
// ═══════════════════════════════════════════════════════════════════
function showScoreScreen() {
  $('scoreTitle').textContent = `Fin de la manche ${G.round}`;

  const minRound = Math.min(...G.roundScores);
  const rows = G.players.map((p, i) => {
    const rs    = G.roundScores[i];
    const dbl   = G.doubled === i;
    const best  = rs === minRound && !dbl;
    return `<tr class="${best ? 'best-score' : ''}${G.players[i].totalScore === Math.min(...G.players.map(x => x.totalScore)) ? ' leader' : ''}">
      <td>${p.name}</td>
      <td class="${dbl ? 'doubled' : ''}">${rs > 0 ? '+' : ''}${rs}${dbl ? ' ×2' : ''}</td>
      <td><strong>${p.totalScore}</strong></td>
    </tr>`;
  }).join('');

  $('scoreTable').innerHTML = `
    <table class="score-table">
      <thead><tr><th>Joueur</th><th>Manche ${G.round}</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  showScreen('screenScore');
}

$('btnNextRound').addEventListener('click', () => {
  G.round++;
  G.firstPlayer = (G.firstPlayer + 1) % G.players.length;
  startRound();
});

// ═══════════════════════════════════════════════════════════════════
//  ÉCRAN VICTOIRE
// ═══════════════════════════════════════════════════════════════════
function showWinner() {
  stopAmbient();
  const minTotal  = Math.min(...G.players.map(p => p.totalScore));
  const winner    = G.players.find(p => p.totalScore === minTotal);

  $('winnerName').textContent       = winner.name;
  $('winnerName').style.color       = cssVar('--green');

  const sorted = [...G.players].sort((a, b) => a.totalScore - b.totalScore);
  $('winScores').innerHTML = sorted.map(p => `
    <div class="win-score-row ${p === winner ? 'winner' : ''}">
      <span>${p === winner ? '🥇 ' : ''}${p.name}</span>
      <span>${p.totalScore} pts</span>
    </div>`).join('');

  showScreen('screenWin');
  try {
    window.parent.postMessage({ type: 'GAME_OVER', game: 'skyjo', winner: winner.name, isAI: winner.ia || false }, '*');
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════════
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function toast(msg, color) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  el.style.borderLeftColor = color || cssVar('--accent-1');
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('toast-out'), 2400);
  setTimeout(() => el.remove(), 2900);
}

// ═══════════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════════
renderConfig();
