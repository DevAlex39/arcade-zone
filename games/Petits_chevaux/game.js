'use strict';

// ═══════════════════════════════════════════════════════════════════
//  CONSTANTES
// ═══════════════════════════════════════════════════════════════════
const COLORS       = ['red','blue','green','yellow'];
const COLOR_HEX    = { red:'#ef4444', blue:'#3b82f6', green:'#22c55e', yellow:'#eab308' };
const COLOR_DARK   = { red:'#991b1b', blue:'#1e40af', green:'#14532d', yellow:'#713f12' };
const COLOR_NAMES  = { red:'Rouge',   blue:'Bleu',    green:'Vert',    yellow:'Jaune'   };
const DEFAULT_NAMES= ['Rouge','Bleu','Vert','Jaune'];
const MIN_PLAYERS  = 1;
const MAX_PLAYERS  = 4;
const MIN_PIONS    = 1;
const MAX_PIONS    = 5;
const BOARD_SIZE   = 600;
const GRID         = 15;
const CELL         = BOARD_SIZE / GRID;  // 40px

// ───────────────────────────────────────────────────────────────────
//  PISTE (56 cases, sens horaire)
//  Grille 15×15 (rows/cols 0-14), centre à (7,7)
//  Périmètre extérieur : col 0 montant + row 0 droite + col 14 descendant + row 14 gauche
// ───────────────────────────────────────────────────────────────────
const TRACK = (() => {
  const t = [];
  for (let r = 14; r >= 0; r--) t.push([r, 0]);       // gauche montant  (15)
  for (let c = 1; c <= 14; c++) t.push([0, c]);         // haut droite     (14)
  for (let r = 1; r <= 14; r++) t.push([r, 14]);        // droite descendant (14)
  for (let c = 13; c >= 1; c--) t.push([14, c]);        // bas gauche      (13)
  return t; // 56 cases
})();

// Case de départ absolue dans TRACK pour chaque couleur
const START_IDX = { red:8, blue:22, green:36, yellow:50 };

// Couloirs d'arrivée (6 cases vers le centre, excluant (7,7))
const HOME_PATH = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  blue:   [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  green:  [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  yellow: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
};
const CENTER = [7, 7];
const TRACK_LEN  = 56;
const HOME_LEN   = 6;
const POS_STABLE = -1;
const POS_DONE   = TRACK_LEN + HOME_LEN; // 62 = arrivé au centre

// Emplacements pions dans l'écurie (row,col relatifs à l'écurie)
const STABLE_SLOTS = {
  red:    [[2,2],[2,4],[4,2],[4,4]],
  blue:   [[2,10],[2,12],[4,10],[4,12]],
  green:  [[10,10],[10,12],[12,10],[12,12]],
  yellow: [[10,2],[10,4],[12,2],[12,4]],
};

// ═══════════════════════════════════════════════════════════════════
//  OPTIONS
// ═══════════════════════════════════════════════════════════════════
const OPTIONS = {
  volume:    0.7,
  diceSpeed: 'normal', // 'slow' | 'normal' | 'fast'
  autoMode:  false,
};
const DICE_DURATIONS = { slow: 1300, normal: 700, fast: 280 };

const RULES = {
  rejouerSur6:       true,  // rejoue immédiatement après un 6
  allowOvertake:     false, // peut sauter par-dessus les pions adverses
  corridorSimplifie: false, // dans le corridor, tout dé valide (sinon: distance exacte)
};

// ═══════════════════════════════════════════════════════════════════
//  AUDIO — Web Audio API
// ═══════════════════════════════════════════════════════════════════
let _audioCtx = null;
function getAC() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function playDiceRoll() {
  if (OPTIONS.volume === 0) return;
  const ac      = getAC();
  const impacts = 4 + Math.floor(Math.random() * 3); // 4-6 impacts irréguliers

  // Impacts roulants — bruit filtré façon dé en bois/plastique
  for (let i = 0; i < impacts; i++) {
    const delay = i === 0 ? 0 : (0.055 + Math.random() * 0.04) * i;
    const vol   = (0.25 + Math.random() * 0.2) * OPTIONS.volume;

    setTimeout(() => {
      const bufLen = Math.floor(ac.sampleRate * 0.03);
      const buf    = ac.createBuffer(1, bufLen, ac.sampleRate);
      const data   = buf.getChannelData(0);
      for (let j = 0; j < bufLen; j++) data[j] = Math.random() * 2 - 1;

      const src = ac.createBufferSource();
      src.buffer = buf;

      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 700 + Math.random() * 700;
      bp.Q.value = 1.8;

      const hp = ac.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 250;

      const gain = ac.createGain();
      const now  = ac.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

      src.connect(bp); bp.connect(hp); hp.connect(gain); gain.connect(ac.destination);
      src.start(now);
    }, delay * 1000);
  }

  // Impact final plus lourd (le dé qui s'arrête)
  const finalDelay = impacts * 0.07 + 0.04;
  setTimeout(() => {
    const bufLen = Math.floor(ac.sampleRate * 0.06);
    const buf    = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data   = buf.getChannelData(0);
    for (let j = 0; j < bufLen; j++) data[j] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buf;

    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 450 + Math.random() * 250;
    bp.Q.value = 2.5;

    const gain = ac.createGain();
    const now  = ac.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(OPTIONS.volume * 0.65, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    src.connect(bp); bp.connect(gain); gain.connect(ac.destination);
    src.start(now);
  }, finalDelay * 1000);
}

// ═══════════════════════════════════════════════════════════════════
//  AMBIANCE MUSICALE — Do majeur, jeu de société festif
// ═══════════════════════════════════════════════════════════════════
let _ambNodes    = null;
let _ambInterval = null;

function startAmbient() {
  if (_ambNodes) return;
  const ac = getAC();

  const master = ac.createGain();
  master.gain.setValueAtTime(0, ac.currentTime);
  master.gain.linearRampToValueAtTime(0.14, ac.currentTime + 3);
  master.connect(ac.destination);

  // Pad Do majeur grave : C2, G2, C3, E3
  const padFreqs = [65.41, 98.00, 130.81, 164.81];
  const pads = padFreqs.map((freq, i) => {
    const osc = ac.createOscillator();
    osc.type  = 'sine';
    osc.frequency.value = freq;
    osc.detune.value    = i % 2 === 0 ? 4 : -4;

    const lfo  = ac.createOscillator();
    lfo.frequency.value = 0.07 + i * 0.02;
    const lfoG = ac.createGain();
    lfoG.gain.value = freq * 0.004;
    lfo.connect(lfoG); lfoG.connect(osc.frequency);

    const g = ac.createGain();
    g.gain.value = 0.26 / padFreqs.length;

    osc.connect(g); g.connect(master);
    osc.start(); lfo.start();
    return { osc, lfo };
  });

  // Mélodie arpège Do majeur (C4–C5 aller-retour)
  const melody = [523.25, 659.25, 783.99, 1046.50, 783.99, 659.25, 587.33, 523.25];
  let step = 0;

  function playNote() {
    if (!_ambNodes) return;
    const now  = ac.currentTime;
    const freq = melody[step % melody.length];
    step++;

    const osc = ac.createOscillator();
    osc.type  = 'triangle';
    osc.frequency.value = freq;

    const g = ac.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.10, now + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(g); g.connect(master);
    osc.start(now); osc.stop(now + 0.28);
  }

  playNote();
  _ambInterval = setInterval(playNote, 545); // 110 BPM
  _ambNodes = { master, pads };
}

function stopAmbient() {
  if (!_ambNodes) return;
  clearInterval(_ambInterval);
  _ambInterval = null;
  const ac    = getAC();
  const nodes = _ambNodes;
  _ambNodes   = null;
  nodes.master.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5);
  setTimeout(() => nodes.pads.forEach(({ osc, lfo }) => {
    try { osc.stop(); lfo.stop(); } catch (e) {}
  }), 1600);
}

// ═══════════════════════════════════════════════════════════════════
//  ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════════════
let G = {};

const config = {
  playerCount: 2,
  players: [
    { name:'Rouge',  color:'red',    pions:2, ia:false },
    { name:'Bleu',   color:'blue',   pions:2, ia:false },
    { name:'Vert',   color:'green',  pions:2, ia:false },
    { name:'Jaune',  color:'yellow', pions:2, ia:false },
  ],
};

// ═══════════════════════════════════════════════════════════════════
//  UTILITAIRES DOM
// ═══════════════════════════════════════════════════════════════════
function $(id) { return document.getElementById(id); }
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  $(id).classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════════════
//  ÉCRAN CONFIG
// ═══════════════════════════════════════════════════════════════════
function renderConfig() {
  $('playerCountVal').textContent = config.playerCount;
  const wrap = $('playerSetup');
  wrap.innerHTML = '';

  for (let i = 0; i < config.playerCount; i++) {
    const p = config.players[i];

    const card = document.createElement('div');
    card.className = 'player-card';

    const avatar = document.createElement('div');
    avatar.className = 'player-avatar';
    avatar.style.background = COLOR_HEX[p.color];

    const nameInput = document.createElement('input');
    nameInput.className = 'player-name-input';
    nameInput.type = 'text';
    nameInput.maxLength = 14;
    nameInput.value = p.name;
    nameInput.addEventListener('input', e => { config.players[i].name = e.target.value || DEFAULT_NAMES[i]; });

    const colorPicker = document.createElement('div');
    colorPicker.className = 'color-picker';
    COLORS.forEach(c => {
      const dot = document.createElement('div');
      dot.className = 'color-dot' + (p.color === c ? ' selected' : '');
      dot.dataset.color = c;
      const taken = config.players.slice(0, config.playerCount).some((pl, j) => j !== i && pl.color === c);
      if (taken) { dot.style.opacity = '.25'; dot.style.cursor = 'default'; }
      else dot.addEventListener('click', () => { config.players[i].color = c; renderConfig(); });
      colorPicker.appendChild(dot);
    });

    const pionsStepper = document.createElement('div');
    pionsStepper.className = 'pions-stepper';
    const pMinus = document.createElement('button');
    pMinus.className = 'btn-step'; pMinus.textContent = '−';
    pMinus.addEventListener('click', () => { if (config.players[i].pions > MIN_PIONS) { config.players[i].pions--; renderConfig(); } });
    const pVal = document.createElement('span');
    pVal.textContent = p.pions;
    const pLabel = document.createElement('span');
    pLabel.textContent = '🐴'; pLabel.style.marginLeft = '2px';
    const pPlus = document.createElement('button');
    pPlus.className = 'btn-step'; pPlus.textContent = '+';
    pPlus.addEventListener('click', () => { if (config.players[i].pions < MAX_PIONS) { config.players[i].pions++; renderConfig(); } });
    pionsStepper.append(pMinus, pVal, pLabel, pPlus);

    const iaBtn = document.createElement('button');
    iaBtn.className = 'ia-toggle' + (p.ia ? ' active' : '');
    iaBtn.textContent = p.ia ? '🤖 IA' : '👤 Humain';
    iaBtn.addEventListener('click', () => { config.players[i].ia = !config.players[i].ia; renderConfig(); });

    card.append(avatar, nameInput, colorPicker, pionsStepper, iaBtn);
    wrap.appendChild(card);
  }
}

$('btnPlayerMinus').addEventListener('click', () => { if (config.playerCount > MIN_PLAYERS) { config.playerCount--; renderConfig(); } });
$('btnPlayerPlus').addEventListener('click',  () => { if (config.playerCount < MAX_PLAYERS) { config.playerCount++; renderConfig(); } });

// ═══════════════════════════════════════════════════════════════════
//  LANCEMENT
// ═══════════════════════════════════════════════════════════════════
$('btnStartGame').addEventListener('click', () => {
  const players = config.players.slice(0, config.playerCount).map((p, i) => {
    const pions = Array.from({ length: p.pions }, (_, k) => ({ pos: POS_STABLE, slot: k, selected: false }));
    return { name: p.name.trim() || DEFAULT_NAMES[i], color: p.color, pions, ia: p.ia };
  });

  G = {
    players,
    currentIdx: 0,
    diceValue:  null,
    phase:      'roll',       // 'roll' | 'select' | 'done'
    selectedPion: null,       // { playerIdx, pionIdx }
    winner: null,
  };

  showScreen('screenGame');
  startAmbient();
  drawBoard();
  drawPions();
  renderSidebar();
  renderTurnInfo();
});

// ═══════════════════════════════════════════════════════════════════
//  DESSIN DU PLATEAU
// ═══════════════════════════════════════════════════════════════════
const canvas = $('board');
const ctx    = canvas.getContext('2d');

function cellXY(r, c) {
  return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 };
}

function drawBoard() {
  ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  // Fond avec subtil dégradé
  const bgGrad = ctx.createRadialGradient(BOARD_SIZE/2, BOARD_SIZE/2, 0, BOARD_SIZE/2, BOARD_SIZE/2, BOARD_SIZE*0.7);
  bgGrad.addColorStop(0, '#16162a');
  bgGrad.addColorStop(1, '#0a0a14');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  drawStables();
  drawTrackCells();
  drawHomePaths();
  drawCenter();
  drawStartMarkers();
  drawBoardBorder();
}

function drawBoardBorder() {
  ctx.strokeStyle = '#3a3a5c';
  ctx.lineWidth   = 3;
  ctx.strokeRect(1.5, 1.5, BOARD_SIZE - 3, BOARD_SIZE - 3);
}

function roundCell(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawTrackCells() {
  const PAD = 2, R = 4;
  TRACK.forEach(([row, col], i) => {
    const x = col * CELL + PAD, y = row * CELL + PAD;
    const w = CELL - PAD * 2,   h = CELL - PAD * 2;
    // Alternance légère de luminosité
    const shade = i % 2 === 0 ? '#1e1e38' : '#23233e';
    ctx.fillStyle   = shade;
    ctx.strokeStyle = '#33335a';
    ctx.lineWidth   = 1;
    roundCell(x, y, w, h, R);
    ctx.fill(); ctx.stroke();
  });
}

function drawHomePaths() {
  Object.entries(HOME_PATH).forEach(([color, cells]) => {
    cells.forEach(([row, col], stepIdx) => {
      const x = col * CELL + 2, y = row * CELL + 2;
      const w = CELL - 4,       h = CELL - 4;
      // Dégradé de luminosité : plus clair vers le centre
      const alpha = Math.round(40 + stepIdx * 18).toString(16).padStart(2,'0');
      ctx.fillStyle   = COLOR_HEX[color] + alpha;
      ctx.strokeStyle = COLOR_HEX[color] + 'aa';
      ctx.lineWidth   = 1.5;
      roundCell(x, y, w, h, 4);
      ctx.fill(); ctx.stroke();

      // Numéro de case (1 = entrée, 6 = avant centre)
      ctx.fillStyle    = COLOR_HEX[color] + 'cc';
      ctx.font         = `bold ${CELL * 0.38}px Segoe UI`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stepIdx + 1, col * CELL + CELL / 2, row * CELL + CELL / 2);
    });
  });
}

function drawStables() {
  const stableCorners = { red:[0,0], blue:[0,8], green:[8,8], yellow:[8,0] };
  COLORS.forEach(color => {
    const [sr, sc] = stableCorners[color];
    const x = sc * CELL, y = sr * CELL;
    const sz = 6 * CELL;

    // Fond dégradé écurie
    const grad = ctx.createRadialGradient(x+sz/2, y+sz/2, sz*0.1, x+sz/2, y+sz/2, sz*0.65);
    grad.addColorStop(0, COLOR_HEX[color] + '30');
    grad.addColorStop(1, COLOR_HEX[color] + '10');
    ctx.fillStyle   = grad;
    ctx.strokeStyle = COLOR_HEX[color] + 'cc';
    ctx.lineWidth   = 2.5;
    roundCell(x + 3, y + 3, sz - 6, sz - 6, 12);
    ctx.fill(); ctx.stroke();

    // Motif diamant central décoratif
    const cx = x + sz / 2, cy = y + sz / 2;
    const d  = CELL * 0.55;
    ctx.beginPath();
    ctx.moveTo(cx, cy - d); ctx.lineTo(cx + d, cy);
    ctx.lineTo(cx, cy + d); ctx.lineTo(cx - d, cy);
    ctx.closePath();
    ctx.strokeStyle = COLOR_HEX[color] + '33';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Emplacements pions : silhouette cheval fantôme
    STABLE_SLOTS[color].forEach(([r, c]) => {
      const px = c * CELL + CELL / 2, py = r * CELL + CELL / 2;
      ctx.save();
      ctx.globalAlpha = 0.2;
      drawPawn(ctx, px, py, CELL * 0.26, COLOR_HEX[color], COLOR_DARK[color], false);
      ctx.globalAlpha = 1;
      ctx.restore();
    });

    // Label couleur
    const lrMap = { red:0.6, blue:0.6, green:8.6, yellow:8.6 };
    const lcMap = { red:3,   blue:11,  green:11,  yellow:3   };
    ctx.fillStyle    = COLOR_HEX[color] + 'dd';
    ctx.font         = `bold ${CELL * 0.42}px Segoe UI`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(COLOR_NAMES[color].toUpperCase(), lcMap[color] * CELL, lrMap[color] * CELL);
  });
}

function drawStartMarkers() {
  COLORS.forEach(color => {
    const [row, col] = TRACK[START_IDX[color]];
    const x = col * CELL + 3, y = row * CELL + 3;
    const w = CELL - 6,       h = CELL - 6;

    // Fond coloré arrondi
    ctx.fillStyle   = COLOR_HEX[color] + '55';
    ctx.strokeStyle = COLOR_HEX[color];
    ctx.lineWidth   = 2;
    roundCell(x, y, w, h, 5);
    ctx.fill(); ctx.stroke();

    // Étoile
    drawStar(ctx, col * CELL + CELL/2, row * CELL + CELL/2, CELL * 0.22, CELL * 0.1, 5, COLOR_HEX[color]);
  });
}

function drawStar(ctx, cx, cy, outerR, innerR, points, color) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI / points) - Math.PI / 2;
    const r     = i % 2 === 0 ? outerR : innerR;
    i === 0 ? ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
            : ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawCenter() {
  const [row, col] = CENTER;
  const x = col * CELL + 2, y = row * CELL + 2;
  const sz = CELL - 4;

  // Dégradé violet
  const grad = ctx.createRadialGradient(x+sz/2, y+sz/2, 0, x+sz/2, y+sz/2, sz*0.6);
  grad.addColorStop(0, '#818cf8ee');
  grad.addColorStop(1, '#6366f1bb');
  ctx.fillStyle   = grad;
  ctx.strokeStyle = '#a5b4fc';
  ctx.lineWidth   = 2;
  roundCell(x, y, sz, sz, 8);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle    = '#fff';
  ctx.font         = `${CELL * 0.55}px Segoe UI`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏠', col * CELL + CELL/2, row * CELL + CELL/2);
}

// ═══════════════════════════════════════════════════════════════════
//  DESSIN DES PIONS
// ═══════════════════════════════════════════════════════════════════
function pionXY(player, pion) {
  const { color } = player;
  const pos = pion.pos;

  if (pos === POS_STABLE) {
    const [r, c] = STABLE_SLOTS[color][pion.slot] ?? [0, 0];
    return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 };
  }
  if (pos === POS_DONE) {
    const [r, c] = CENTER;
    return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 };
  }
  if (pos >= TRACK_LEN) {
    // Home path
    const [r, c] = HOME_PATH[color][pos - TRACK_LEN];
    return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 };
  }
  // Common track
  const absIdx  = (START_IDX[color] + pos) % TRACK_LEN;
  const [r, c]  = TRACK[absIdx];
  return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 };
}

function drawPions() {
  drawBoard();

  if (G.selectedPion !== null && G.diceValue !== null) {
    highlightMoves(G.selectedPion);
  }

  G.players.forEach((player, pi) => {
    const byPos = {};
    player.pions.forEach((pion, ki) => {
      const key = `${pion.pos}`;
      if (!byPos[key]) byPos[key] = [];
      byPos[key].push({ pion, ki });
    });

    player.pions.forEach((pion, ki) => {
      if (pion.pos === POS_DONE) return;
      const { x, y } = pionXY(player, pion);

      const key    = `${pion.pos}`;
      const group  = byPos[key];
      const idx    = group.findIndex(g => g.ki === ki);
      const offset = groupOffset(group.length, idx);
      const isSelected = G.selectedPion?.playerIdx === pi && G.selectedPion?.pionIdx === ki;

      drawPawn(ctx, x + offset.dx, y + offset.dy, CELL * 0.26,
                COLOR_HEX[player.color], COLOR_DARK[player.color], isSelected);
    });
  });
}

// ─── Forme pion classique (symétrique) ───────────────────────────
function pawnShape(ctx, s) {
  ctx.beginPath();
  // Sommet du dôme
  ctx.moveTo(0, -s * 0.96);
  // Côté droit du dôme → cou
  ctx.bezierCurveTo( s * 0.44, -s * 0.96,  s * 0.44, -s * 0.28,  s * 0.22, -s * 0.20);
  // Cou → corps → évasement
  ctx.bezierCurveTo( s * 0.42,  s * 0.08,  s * 0.58,  s * 0.42,  s * 0.58,  s * 0.62);
  // Base droite → fond
  ctx.quadraticCurveTo( s * 0.60,  s * 0.88,  0,         s * 0.88);
  // Fond → base gauche
  ctx.quadraticCurveTo(-s * 0.60,  s * 0.88, -s * 0.58,  s * 0.62);
  // Évasement → cou → dôme gauche
  ctx.bezierCurveTo(-s * 0.58,  s * 0.42, -s * 0.42,  s * 0.08, -s * 0.22, -s * 0.20);
  // Côté gauche du dôme
  ctx.bezierCurveTo(-s * 0.44, -s * 0.28, -s * 0.44, -s * 0.96,  0,        -s * 0.96);
  ctx.closePath();
}

function drawPawn(ctx, cx, cy, s, fillColor, strokeColor, isSelected) {
  ctx.save();
  ctx.translate(cx, cy + s * 0.06); // légère correction verticale pour centrer visuellement

  // Ombre portée
  ctx.save();
  ctx.translate(2, 3);
  pawnShape(ctx, s);
  ctx.fillStyle = '#00000050';
  ctx.fill();
  ctx.restore();

  // Halo sélection
  if (isSelected) {
    ctx.save();
    pawnShape(ctx, s * 1.15);
    ctx.fillStyle   = '#ffffff22';
    ctx.strokeStyle = '#ffffffcc';
    ctx.lineWidth   = 2.5;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Corps — dégradé du clair (haut) au foncé (bas)
  pawnShape(ctx, s);
  const grad = ctx.createLinearGradient(0, -s, 0, s * 0.9);
  grad.addColorStop(0,   lighten(fillColor, 0.30));
  grad.addColorStop(0.5, fillColor);
  grad.addColorStop(1,   darken(fillColor, 0.25));
  ctx.fillStyle   = grad;
  ctx.strokeStyle = isSelected ? '#ffffff' : strokeColor;
  ctx.lineWidth   = isSelected ? 2.2 : 1.5;
  ctx.fill();
  ctx.stroke();

  // Reflet brillant sur le dôme (haut-gauche)
  ctx.beginPath();
  ctx.ellipse(-s * 0.08, -s * 0.65, s * 0.14, s * 0.09, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff55';
  ctx.fill();

  // Ligne de séparation cou/corps (subtile)
  ctx.beginPath();
  ctx.moveTo(-s * 0.22, -s * 0.20);
  ctx.bezierCurveTo(-s * 0.18, -s * 0.24, s * 0.18, -s * 0.24, s * 0.22, -s * 0.20);
  ctx.strokeStyle = strokeColor + '88';
  ctx.lineWidth   = 1;
  ctx.stroke();

  ctx.restore();
}

function lighten(hex, t) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, (n >> 16) + Math.round(255 * t));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * t));
  const b = Math.min(255, (n & 0xff) + Math.round(255 * t));
  return `rgb(${r},${g},${b})`;
}
function darken(hex, t) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, (n >> 16) - Math.round(255 * t));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * t));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * t));
  return `rgb(${r},${g},${b})`;
}

function groupOffset(total, idx) {
  if (total === 1) return { dx: 0, dy: 0 };
  const offsets = [
    [{ dx:-7, dy:-7 }, { dx:7, dy:-7 }],
    [{ dx:-7, dy:-7 }, { dx:7, dy:-7 }, { dx:0, dy:7 }],
    [{ dx:-7, dy:-7 }, { dx:7, dy:-7 }, { dx:-7, dy:7 }, { dx:7, dy:7 }],
    [{ dx:-8, dy:-8 }, { dx:8, dy:-8 }, { dx:0, dy:0 }, { dx:-8, dy:8 }, { dx:8, dy:8 }],
  ];
  return (offsets[total - 2] ?? [])[idx] ?? { dx: 0, dy: 0 };
}

function highlightMoves(sel) {
  const player = G.players[sel.playerIdx];
  const pion   = player.pions[sel.pionIdx];
  const dest   = getDestPos(player, pion, G.diceValue);
  if (dest === null) return;

  const { x, y } = pionXY(player, { pos: dest });
  const s = CELL * 0.26;

  ctx.save();
  ctx.translate(x, y + s * 0.2);
  ctx.globalAlpha = 0.45;
  ctx.setLineDash([4, 3]);
  pawnShape(ctx, s * 1.1);
  ctx.fillStyle   = COLOR_HEX[player.color];
  ctx.strokeStyle = COLOR_HEX[player.color];
  ctx.lineWidth   = 2;
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════
//  LOGIQUE DE JEU
// ═══════════════════════════════════════════════════════════════════
function getDestPos(player, pion, dice) {
  if (pion.pos === POS_DONE) return null;

  if (pion.pos === POS_STABLE) {
    return dice === 6 ? 0 : null;
  }

  const newPos = pion.pos + dice;
  if (newPos > POS_DONE) return null;

  // Corridor strict : dans le couloir d'arrivée, le dé doit être EXACTEMENT la distance restante
  if (!RULES.corridorSimplifie && pion.pos >= TRACK_LEN && newPos !== POS_DONE) return null;

  // Pas de dépassement : ne peut pas sauter par-dessus un pion adverse sur la piste
  if (!RULES.allowOvertake && pion.pos >= 0 && pion.pos < TRACK_LEN) {
    const myAbs = absTrackIdx(player.color, pion.pos);
    for (const other of G.players) {
      if (other === player) continue;
      for (const op of other.pions) {
        if (op.pos <= 0 || op.pos >= TRACK_LEN) continue;
        const othAbs = absTrackIdx(other.color, op.pos);
        const dist = (othAbs - myAbs + TRACK_LEN) % TRACK_LEN;
        if (dist > 0 && dist < dice) return null; // ennemi sur le chemin
      }
    }
  }

  return newPos;
}

function absTrackIdx(color, relPos) {
  return (START_IDX[color] + relPos) % TRACK_LEN;
}

function movePion(playerIdx, pionIdx) {
  const player = G.players[playerIdx];
  const pion   = player.pions[pionIdx];
  const dest   = getDestPos(player, pion, G.diceValue);
  if (dest === null) return false;

  pion.pos = dest;

  // Capture : si pion adverse sur la même case de piste commune
  if (dest >= 0 && dest < TRACK_LEN) {
    const absIdx = absTrackIdx(player.color, dest);
    G.players.forEach((other, oi) => {
      if (oi === playerIdx) return;
      other.pions.forEach(op => {
        if (op.pos < 0 || op.pos >= TRACK_LEN) return;
        const opAbs = absTrackIdx(other.color, op.pos);
        if (opAbs === absIdx) {
          // Pas de capture sur les cases de départ
          const isOtherStart = op.pos === 0;
          if (!isOtherStart) {
            op.pos = POS_STABLE;
            toast(`💥 ${player.name} capture un pion de ${other.name} !`, COLOR_HEX[player.color]);
          }
        }
      });
    });
  }

  // Vérifier victoire
  if (player.pions.every(p => p.pos === POS_DONE)) {
    G.winner = playerIdx;
    G.phase  = 'done';
    return true;
  }

  return true;
}

function hasValidMove(player) {
  return player.pions.some(pion => getDestPos(player, pion, G.diceValue) !== null);
}

function getMovablePions(player) {
  return player.pions.map((pion, i) => ({ pion, i })).filter(({ pion }) => getDestPos(player, pion, G.diceValue) !== null);
}

function endTurn() {
  const rolledSix = G.diceValue === 6;
  G.selectedPion  = null;
  G.diceValue     = null;

  if (RULES.rejouerSur6 && rolledSix) {
    // Même joueur rejoue
    const cur = G.players[G.currentIdx];
    toast(`${cur.name} rejoue !`, COLOR_HEX[cur.color]);
  } else {
    G.currentIdx = (G.currentIdx + 1) % G.players.length;
  }
  G.phase = 'roll';

  drawPions();
  renderSidebar();
  renderTurnInfo();

  // Tour IA ?
  const cur = G.players[G.currentIdx];
  if (cur.ia) setTimeout(doIATurn, 700);
}

function doIATurn() {
  if (G.phase !== 'roll') return;
  const cur      = G.players[G.currentIdx];
  const finalVal = Math.ceil(Math.random() * 6);

  animateDice(finalVal, COLOR_HEX[cur.color], () => {
    G.diceValue = finalVal;
    G.phase     = 'select';
    renderTurnInfo();

    setTimeout(() => {
      const player = G.players[G.currentIdx];
      const best   = selectBestPion(player, null);
      if (!best) {
        toast(`${player.name} ne peut pas jouer.`, '#64748b');
        endTurn();
        return;
      }

      movePion(G.currentIdx, best.i);
      drawPions();
      renderTurnInfo();

      if (G.phase === 'done') { showWinner(); return; }
      setTimeout(endTurn, 600);
    }, 600);
  });
}

// ═══════════════════════════════════════════════════════════════════
//  MODE AUTOMATIQUE
// ═══════════════════════════════════════════════════════════════════
function autoMoveHuman() {
  const player    = G.players[G.currentIdx];
  const enEcurie  = player.pions.filter(p => p.pos === POS_STABLE && getDestPos(player, p, G.diceValue) !== null);
  const surPlateau= player.pions.filter(p => p.pos >= 0 && p.pos < TRACK_LEN);

  // Si 6 avec pions dans les deux états → laisser le choix
  if (G.diceValue === 6 && enEcurie.length > 0 && surPlateau.length > 0) {
    showSixChoiceModal(player);
    return;
  }

  if (!hasValidMove(player)) {
    toast(`${player.name} ne peut pas jouer (${G.diceValue}).`, '#64748b');
    setTimeout(endTurn, 900);
    return;
  }

  const best = selectBestPion(player, null);
  if (!best) { setTimeout(endTurn, 900); return; }

  setTimeout(() => {
    movePion(G.currentIdx, best.i);
    drawPions(); renderTurnInfo();
    if (G.phase === 'done') { showWinner(); return; }
    setTimeout(endTurn, 500);
  }, 420);
}

function selectBestPion(player, preferStable) {
  // preferStable: true = sortir de l'écurie, false = rester sur plateau, null = auto
  let candidates = getMovablePions(player);
  if (!candidates.length) return null;

  if (preferStable === true)  candidates = candidates.filter(({pion}) => pion.pos === POS_STABLE).length ? candidates.filter(({pion}) => pion.pos === POS_STABLE) : candidates;
  if (preferStable === false) candidates = candidates.filter(({pion}) => pion.pos !== POS_STABLE).length ? candidates.filter(({pion}) => pion.pos !== POS_STABLE) : candidates;

  let best = null, bestScore = -Infinity;
  candidates.forEach(({pion, i}) => {
    const dest = getDestPos(player, pion, G.diceValue);
    if (dest === null) return;
    let score = 0;

    // Capture adversaire → priorité haute (bonus si le pion capturé est bien avancé)
    if (dest >= 0 && dest < TRACK_LEN) {
      const ai = absTrackIdx(player.color, dest);
      G.players.forEach((o, oi) => {
        if (oi === G.currentIdx) return;
        o.pions.forEach(op => {
          if (op.pos <= 0 || op.pos >= TRACK_LEN) return;
          if (absTrackIdx(o.color, op.pos) === ai) score += 1000 + op.pos;
        });
      });
    }

    // Rentrer à la maison
    if (dest === POS_DONE)        score += 600;
    else if (dest >= TRACK_LEN)   score += 200 + (dest - TRACK_LEN) * 10; // avancer dans le couloir
    else if (pion.pos === POS_STABLE) score += 60;                          // sortir de l'écurie
    else score += dest;                                                      // avancer sur la piste

    // Malus danger : un adversaire peut nous capturer au prochain tour
    if (dest >= 0 && dest < TRACK_LEN) {
      const destAbs = absTrackIdx(player.color, dest);
      G.players.forEach((o, oi) => {
        if (oi === G.currentIdx) return;
        o.pions.forEach(op => {
          if (op.pos < 0 || op.pos >= TRACK_LEN) return;
          const opAbs = absTrackIdx(o.color, op.pos);
          for (let d = 1; d <= 6; d++) {
            if ((opAbs + d) % TRACK_LEN === destAbs) { score -= 80; break; }
          }
        });
      });
    }

    if (score > bestScore) { bestScore = score; best = { pion, i }; }
  });
  return best;
}

function showSixChoiceModal(player) {
  $('sixChoiceName').textContent      = player.name;
  $('sixChoiceName').style.color      = COLOR_HEX[player.color];
  $('sixChoiceModal').classList.remove('hidden');
}

function hideSixChoiceModal() { $('sixChoiceModal').classList.add('hidden'); }

function applyAutoChoice(preferStable) {
  hideSixChoiceModal();
  const best = selectBestPion(G.players[G.currentIdx], preferStable);
  if (!best) { setTimeout(endTurn, 500); return; }
  setTimeout(() => {
    movePion(G.currentIdx, best.i);
    drawPions(); renderTurnInfo();
    if (G.phase === 'done') { showWinner(); return; }
    setTimeout(endTurn, 500);
  }, 250);
}

$('btnChoiceExit').addEventListener('click', () => applyAutoChoice(true));
$('btnChoiceMove').addEventListener('click', () => applyAutoChoice(false));

// ═══════════════════════════════════════════════════════════════════
//  OPTIONS — modal
// ═══════════════════════════════════════════════════════════════════
function openOptions() { $('optionsModal').classList.remove('hidden'); }
function closeOptions() { $('optionsModal').classList.add('hidden'); }

$('btnOpenOptionsCfg').addEventListener('click',  openOptions);
$('btnOpenOptionsGame').addEventListener('click',  openOptions);
$('btnCloseOptions').addEventListener('click',     closeOptions);
$('btnCloseOptionsSave').addEventListener('click', closeOptions);
$('optionsModal').addEventListener('click', e => { if (e.target === $('optionsModal')) closeOptions(); });

$('optVolume').addEventListener('input', e => {
  OPTIONS.volume = parseInt(e.target.value) / 100;
  $('optVolumeVal').textContent = e.target.value + '%';
});

document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    OPTIONS.diceSpeed = btn.dataset.speed;
  });
});

$('optAutoMode').addEventListener('change', e => {
  OPTIONS.autoMode = e.target.checked;
});

$('ruleRejouer6').addEventListener('change', e => {
  RULES.rejouerSur6 = e.target.checked;
});

$('ruleAllowOvertake').addEventListener('change', e => {
  RULES.allowOvertake = e.target.checked;
});

$('ruleCorridorSimplifie').addEventListener('change', e => {
  RULES.corridorSimplifie = e.target.checked;
});

// ═══════════════════════════════════════════════════════════════════
//  INTERACTION CANVAS
// ═══════════════════════════════════════════════════════════════════

// Touch → synthétise un click pour supprimer le délai 300ms sur mobile
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  canvas.dispatchEvent(new MouseEvent('click', { clientX: t.clientX, clientY: t.clientY, bubbles: true }));
}, { passive: false });

canvas.addEventListener('click', e => {
  if (G.phase !== 'select') return;

  const rect   = canvas.getBoundingClientRect();
  const scaleX = BOARD_SIZE / rect.width;
  const scaleY = BOARD_SIZE / rect.height;
  const mx     = (e.clientX - rect.left) * scaleX;
  const my     = (e.clientY - rect.top)  * scaleY;

  const player = G.players[G.currentIdx];

  // Si un pion est déjà sélectionné, cliquer sur la destination le déplace
  if (G.selectedPion !== null) {
    const pion   = player.pions[G.selectedPion.pionIdx];
    const dest   = getDestPos(player, pion, G.diceValue);
    if (dest !== null) {
      const destPion = { pos: dest };
      const { x, y } = pionXY(player, destPion);
      if (Math.hypot(mx - x, my - y) < CELL * 0.5) {
        movePion(G.selectedPion.playerIdx, G.selectedPion.pionIdx);
        drawPions();
        renderTurnInfo();
        if (G.phase === 'done') { showWinner(); return; }
        setTimeout(endTurn, 400);
        return;
      }
    }
  }

  // Chercher un pion cliqué
  let found = null;
  player.pions.forEach((pion, ki) => {
    if (getDestPos(player, pion, G.diceValue) === null) return;
    const { x, y } = pionXY(player, pion);
    if (Math.hypot(mx - x, my - y) < CELL * 0.45) {
      found = { playerIdx: G.currentIdx, pionIdx: ki };
    }
  });

  if (found !== null) {
    G.selectedPion = found;
    drawPions();
  }
});

// ═══════════════════════════════════════════════════════════════════
//  BOUTON DÉ
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const btn = $('btnRoll');
    if (!btn.disabled && btn.offsetParent !== null) btn.click();
  }
});

$('btnRoll').addEventListener('click', () => {
  if (G.phase !== 'roll') return;
  const cur = G.players[G.currentIdx];
  if (cur.ia) return;

  const finalValue = Math.ceil(Math.random() * 6);
  $('btnRoll').disabled      = true;
  $('btnRoll').style.opacity = '.5';

  animateDice(finalValue, COLOR_HEX[cur.color], () => {
    G.diceValue = finalValue;
    G.phase     = 'select';
    renderTurnInfo();

    // Mode automatique pour joueurs humains
    if (OPTIONS.autoMode) {
      autoMoveHuman();
      return;
    }

    if (!hasValidMove(cur)) {
      toast(`${cur.name} ne peut pas jouer (${G.diceValue}).`, '#64748b');
      setTimeout(endTurn, 1000);
      return;
    }

    const movable = getMovablePions(cur);
    if (movable.length === 1) {
      G.selectedPion = { playerIdx: G.currentIdx, pionIdx: movable[0].i };
    }
    drawPions();
  }); // fin animateDice
});

// ═══════════════════════════════════════════════════════════════════
//  AFFICHAGE VICTOIRE
// ═══════════════════════════════════════════════════════════════════
function showWinner() {
  stopAmbient();
  const p = G.players[G.winner];
  $('winnerName').textContent  = p.name;
  $('winnerEmoji').textContent = '🏆';
  $('winnerName').style.color  = COLOR_HEX[p.color];
  showScreen('screenWin');
  try {
    window.parent.postMessage({ type: 'GAME_OVER', game: 'petits-chevaux', winner: p.name, isAI: p.ia || false }, '*');
  } catch(e) {}
}

$('btnPlayAgain').addEventListener('click', () => { showScreen('screenConfig'); renderConfig(); });

// ═══════════════════════════════════════════════════════════════════
//  SIDEBAR & TOUR
// ═══════════════════════════════════════════════════════════════════
function renderSidebar() {
  const list = $('playerList');
  list.innerHTML = '';
  G.players.forEach((p, i) => {
    const done  = p.pions.filter(pion => pion.pos === POS_DONE).length;
    const total = p.pions.length;
    const div   = document.createElement('div');
    div.className = 'sidebar-player' + (i === G.currentIdx ? ' active' : '');
    div.innerHTML = `
      <div class="sidebar-dot" style="background:${COLOR_HEX[p.color]}"></div>
      <span>${p.name}${p.ia ? ' 🤖' : ''}</span>
      <span class="pion-count">${done}/${total} 🏠</span>
    `;
    list.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════════════════════
//  DÉ — canvas dédié
// ═══════════════════════════════════════════════════════════════════
const diceCanvas = $('diceCanvas');
const dctx       = diceCanvas.getContext('2d');
const DICE_SIZE  = 80;
const DOT_POS    = {
  1: [[.5,.5]],
  2: [[.25,.25],[.75,.75]],
  3: [[.25,.25],[.5,.5],[.75,.75]],
  4: [[.25,.25],[.75,.25],[.25,.75],[.75,.75]],
  5: [[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]],
  6: [[.25,.2],[.75,.2],[.25,.5],[.75,.5],[.25,.8],[.75,.8]],
};

let diceAnimFrame = null;

function drawDiceFace(value, color = '#e2e8f0', shake = 0) {
  const S = DICE_SIZE;
  dctx.clearRect(0, 0, S, S);

  const ox = shake ? (Math.random() - .5) * shake : 0;
  const oy = shake ? (Math.random() - .5) * shake : 0;

  // Fond arrondi
  dctx.fillStyle   = '#1a1a2e';
  dctx.strokeStyle = color + 'cc';
  dctx.lineWidth   = 2.5;
  dctx.beginPath();
  dctx.roundRect(4 + ox, 4 + oy, S - 8, S - 8, 12);
  dctx.fill();
  dctx.stroke();

  // Points
  const dots = DOT_POS[value] ?? [];
  dots.forEach(([fx, fy]) => {
    dctx.beginPath();
    dctx.arc((4 + ox) + fx * (S - 8), (4 + oy) + fy * (S - 8), 6, 0, Math.PI * 2);
    dctx.fillStyle = color;
    dctx.fill();
  });
}

function drawDiceIdle() {
  const S = DICE_SIZE;
  dctx.clearRect(0, 0, S, S);
  dctx.fillStyle   = '#1a1a2e';
  dctx.strokeStyle = '#3a3a5c';
  dctx.lineWidth   = 2;
  dctx.beginPath();
  dctx.roundRect(4, 4, S - 8, S - 8, 12);
  dctx.fill();
  dctx.stroke();
  // Point d'interrogation
  dctx.fillStyle    = '#4a4a6a';
  dctx.font         = 'bold 28px Segoe UI';
  dctx.textAlign    = 'center';
  dctx.textBaseline = 'middle';
  dctx.fillText('?', S / 2, S / 2);
}

function animateDice(finalValue, color, onDone) {
  if (diceAnimFrame) cancelAnimationFrame(diceAnimFrame);
  playDiceRoll();
  const start    = performance.now();
  const duration = DICE_DURATIONS[OPTIONS.diceSpeed] ?? 700;
  let   lastVal  = 0;

  function frame(now) {
    const elapsed = now - start;
    const t       = Math.min(elapsed / duration, 1);
    // Fréquence de changement décélère progressivement
    const interval = 40 + t * 120;
    const randVal  = Math.ceil(Math.random() * 6);
    const shake    = (1 - t) * 5;

    if (elapsed % interval < 20 || randVal !== lastVal) {
      drawDiceFace(elapsed > duration - 60 ? finalValue : randVal, color, shake);
      lastVal = randVal;
    }

    if (t < 1) {
      diceAnimFrame = requestAnimationFrame(frame);
    } else {
      drawDiceFace(finalValue, color, 0);
      diceAnimFrame = null;
      onDone();
    }
  }
  diceAnimFrame = requestAnimationFrame(frame);
}

function renderTurnInfo() {
  if (G.phase === 'done') return;
  const p = G.players[G.currentIdx];
  $('currentPlayer').innerHTML = `<span style="color:${COLOR_HEX[p.color]}">${p.name}</span>`;

  if (G.diceValue) {
    drawDiceFace(G.diceValue, COLOR_HEX[p.color]);
  } else {
    drawDiceIdle();
  }

  const btn = $('btnRoll');
  if (G.phase === 'roll') {
    btn.textContent   = 'Lancer le dé';
    btn.disabled      = p.ia;
    btn.style.opacity = p.ia ? '.5' : '1';
  } else {
    btn.textContent   = 'Choisir un pion';
    btn.disabled      = true;
    btn.style.opacity = '.5';
  }
}

// ═══════════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════════
function toast(msg, color = '#e2e8f0') {
  const el        = document.createElement('div');
  el.className    = 'toast';
  el.textContent  = msg;
  el.style.borderLeftColor = color;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('toast-out'), 2200);
  setTimeout(() => el.remove(), 2700);
}

// ═══════════════════════════════════════════════════════════════════
//  UTILITAIRES
// ═══════════════════════════════════════════════════════════════════
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ═══════════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════════
renderConfig();
