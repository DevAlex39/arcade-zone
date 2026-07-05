import { ref } from 'vue';

/**
 * Sons synthétisés (Web Audio) + vibrations pour les jeux multi.
 * Singleton : tous les composants partagent le même état (mute, contexte audio).
 * Aucun fichier audio — tout est généré, comme dans RDR et Cell Number solo.
 */

let _ctx = null;
const soundOn = ref((() => {
  try { return localStorage.getItem('az_sound') !== 'off'; } catch { return true; }
})());

function ac() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// L'AudioContext ne peut démarrer qu'après un geste utilisateur :
// on le débloque au premier clic/touch de la page.
let _armed = false;
function armOnGesture() {
  if (_armed) return;
  _armed = true;
  const unlock = () => { try { ac(); } catch {} };
  document.addEventListener('pointerdown', unlock, { once: true, capture: true });
  document.addEventListener('keydown', unlock, { once: true, capture: true });
}

function toggle() {
  soundOn.value = !soundOn.value;
  try { localStorage.setItem('az_sound', soundOn.value ? 'on' : 'off'); } catch {}
  if (soundOn.value) blip(); // feedback immédiat
}

// ── Brique de base : une note ──────────────────────────────────────
function tone(freq, delay = 0, dur = 0.15, { type = 'sine', vol = 0.18, glideTo = null } = {}) {
  if (!soundOn.value) return;
  let ctx;
  try { ctx = ac(); } catch { return; }
  if (ctx.state === 'suspended') return; // pas encore débloqué par un geste
  const t0  = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

function vibrate(pattern) {
  if (!soundOn.value) return;
  try { navigator.vibrate?.(pattern); } catch {}
}

// ── Sons du jeu ────────────────────────────────────────────────────
// Pop montant : un joueur rejoint
function pop()    { tone(440, 0, 0.14, { glideTo: 880, vol: 0.16 }); }
// Pop descendant : un joueur part
function popOut() { tone(660, 0, 0.16, { glideTo: 320, vol: 0.12 }); }
// Micro-blip : réaction emoji, feedback discret
function blip()   { tone(950, 0, 0.06, { vol: 0.08 }); }
// À toi de jouer : deux notes montantes + petite vibration
function turn()   { tone(660, 0, 0.1, { type: 'triangle' }); tone(880, 0.1, 0.14, { type: 'triangle' }); vibrate(35); }
// Jingle de victoire : arpège majeur montant + vibration festive
function win() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.28, { type: 'triangle', vol: 0.2 }));
  tone(1046.5, 0.55, 0.5, { type: 'sine', vol: 0.14 });
  vibrate([90, 40, 90, 40, 180]);
}
// Défaite : deux notes descendantes douces
function lose()   { tone(392, 0, 0.25, { type: 'triangle', vol: 0.14 }); tone(294, 0.22, 0.4, { type: 'triangle', vol: 0.12 }); vibrate(180); }
// Carillon : événement notable (transfert d'hôte, nouvelle manche…)
function chime()  { tone(880, 0, 0.2, { vol: 0.12 }); tone(1320, 0.09, 0.3, { vol: 0.1 }); }

export function useGameAudio() {
  armOnGesture();
  return { soundOn, toggle, pop, popOut, blip, turn, win, lose, chime, vibrate };
}
