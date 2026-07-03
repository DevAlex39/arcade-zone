'use strict';

// ══════════════════════════════════════════════════════════════════
//  AUDIO — musique ambiante + effets sonores (Web Audio API)
// ══════════════════════════════════════════════════════════════════
let audioCtx  = null;
let musicNodes = null;
let melodyTimer = null;
let masterVolume = 0.6; // 0–1

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// ── Musique ambiante ──────────────────────────────────────────────
function startMusic() {
  if (musicNodes) return;
  const ctx = getCtx();
  musicNodes = {};

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.13 * masterVolume, ctx.currentTime);
  master.connect(ctx.destination);
  musicNodes.master = master;

  // Pad grave : La mineur (A1, E2, A2) — simplifié pour moins d'oppression
  const padFreqs = [55, 82.4, 110];
  padFreqs.forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const filt = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const lfo  = ctx.createOscillator();
    const lfoG = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(500, ctx.currentTime); // filtre plus agressif → son plus sourd

    lfo.frequency.setValueAtTime(0.04 + i * 0.015, ctx.currentTime);
    lfoG.gain.setValueAtTime(freq * 0.003, ctx.currentTime);
    lfo.connect(lfoG); lfoG.connect(osc.frequency); lfo.start();

    gain.gain.setValueAtTime(0.22 / padFreqs.length, ctx.currentTime);
    osc.connect(filt); filt.connect(gain); gain.connect(master);
    osc.start();
    musicNodes[`pad${i}`] = { osc, lfo };
  });

  // Notes mélodiques aléatoires aiguës/graves
  scheduleMelody(ctx, master);
}

// Gamme pentatonique mineure de La : A C D E G
const MELODY_NOTES = [
  110, 130.8, 146.8, 164.8, 196,    // octave 2 — graves
  220, 261.6, 293.7, 329.6, 392,    // octave 3 — medium
  440, 523.3, 587.3, 659.3, 784,    // octave 4 — aigus
  880,                               // octave 5 — ponctuel
];

function scheduleMelody(ctx, master) {
  function fireNote() {
    if (!musicNodes) return;

    const pool = Math.random() < 0.3
      ? MELODY_NOTES.slice(0, 5)     // grave (30%)
      : Math.random() < 0.4
        ? MELODY_NOTES.slice(11)     // aigu (28%)
        : MELODY_NOTES.slice(5, 10); // médium (42%)

    const freq = pool[Math.floor(Math.random() * pool.length)];
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(1800, ctx.currentTime);

    const vol = freq > 500 ? 0.045 : 0.075;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);

    osc.connect(filt); filt.connect(gain); gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 2.5);

    // Prochaine note dans 1.5–4.5 secondes (plus fréquent)
    melodyTimer = setTimeout(fireNote, 1500 + Math.random() * 3000);
  }

  melodyTimer = setTimeout(fireNote, 1500);
}

// ── Son dés sur plateau ───────────────────────────────────────────
function playRollSound() {
  const ctx  = getCtx();
  const now  = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.9 * masterVolume, now);
  master.connect(ctx.destination);

  // Simuler 5 dés qui roulent et frappent le plateau à des moments décalés
  const totalDuration = 0.72; // durée totale du roulement

  for (let d = 0; d < 5; d++) {
    // Chaque dé fait 2-4 impacts pendant le roulement
    const impacts = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < impacts; k++) {
      // Impacts distribués sur la durée, le dernier toujours proche de la fin
      const t = k === impacts - 1
        ? now + totalDuration - 0.04 - Math.random() * 0.08 + d * 0.04
        : now + (k / impacts) * (totalDuration * 0.7) + Math.random() * 0.08 + d * 0.03;

      clack(ctx, master, t, k === impacts - 1);
    }
  }
}

function clack(ctx, dest, when, isFinal) {
  // Corps : bruit blanc très court filtré → son de plastique/bois
  const bufLen = Math.floor(ctx.sampleRate * 0.04);
  const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.2));

  const src  = ctx.createBufferSource();
  const hp   = ctx.createBiquadFilter();
  const bp   = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  src.buffer = buf;
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(600 + Math.random() * 300, when); // moins strident
  bp.type = 'peaking';
  bp.frequency.setValueAtTime(1400 + Math.random() * 500, when); // plus doux
  bp.gain.setValueAtTime(5, when);

  const vol = isFinal ? 0.38 + Math.random() * 0.15 : 0.16 + Math.random() * 0.12; // gain réduit
  gain.gain.setValueAtTime(vol, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.06);

  src.connect(hp); hp.connect(bp); bp.connect(gain); gain.connect(dest);
  src.start(when);
  src.stop(when + 0.07);

  // Résonance basse courte sur l'impact final (le dé qui s'arrête)
  if (isFinal) {
    const body  = ctx.createOscillator();
    const bodyG = ctx.createGain();
    body.type = 'sine';
    body.frequency.setValueAtTime(200 + Math.random() * 80, when);
    body.frequency.exponentialRampToValueAtTime(80, when + 0.08);
    bodyG.gain.setValueAtTime(0.18, when);
    bodyG.gain.exponentialRampToValueAtTime(0.001, when + 0.1);
    body.connect(bodyG); bodyG.connect(dest);
    body.start(when); body.stop(when + 0.11);
  }
}

// ── Son de score ──────────────────────────────────────────────────
function playScoreSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Deux notes montantes (quinte) → sensation de validation
  [[880, 0], [1320, 0.1]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + delay);
    g.gain.setValueAtTime(0.18 * masterVolume, now + delay);
    g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.35);
  });
}
