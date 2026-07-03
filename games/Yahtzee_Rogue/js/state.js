'use strict';

// ══════════════════════════════════════════════════════════════════
//  ÉTAT DU JEU + SEED/RNG + UTILITAIRES + NAVIGATION ÉCRANS
// ══════════════════════════════════════════════════════════════════
let G = {};

const MAX_CONSUMABLES = 2;

function resetGame(seedStr) {
  G = {
    ante:         1,
    blindIdx:     0,
    score:        0,
    target:       0,
    handsLeft:    BASE_HANDS,
    rollsLeft:    BASE_ROLLS,
    gold:         BASE_GOLD,
    jokers:       [],
    consumables:  [],
    dice:         [1,1,1,1,1],
    kept:         [false,false,false,false,false],
    rolling:      false,
    scoring:      false,
    hasRolled:    false,
    bossEffect:   null,
    bannedValue:  null,
    bossOrder:    shuffleArray([...BOSS_BLINDS]),
    doubleNext:   false,
    wildPending:  false,
    oracleActive:     false,
    shopRerollCost:   2,
    shopItems:        { jokers:[], consumables:[], boosters:[] },
    comboBoosts:      {}, // { comboId: { chips, mult } }
    seed:         seedStr || generateSeedString(),
    runHands:     0,
    runScore:     0,
    runYahtzees:  0,
  };
  initSeed(G.seed);
}

// ══════════════════════════════════════════════════════════════════
//  SEED & RNG
// ══════════════════════════════════════════════════════════════════
let _shopRng = Math.random; // RNG seedé uniquement pour la boutique

function seedToNum(s) {
  let h = 0xDEADBEEF;
  for (const c of s) h = Math.imul(31, h) + c.charCodeAt(0) | 0;
  return h >>> 0;
}

function makeMulberry32(seed) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function initSeed(seedStr) {
  G.seed   = seedStr.toUpperCase();
  _shopRng = makeMulberry32(seedToNum(seedStr) + G.ante * 1000 + G.blindIdx * 100);
}

function generateSeedString() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ══════════════════════════════════════════════════════════════════
//  UTILITAIRES
// ══════════════════════════════════════════════════════════════════
const rand  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getCounts(dice) {
  return dice.reduce((a, d) => { a[d] = (a[d]||0)+1; return a; }, {});
}

function hasSeq(dice, len) {
  const u = [...new Set(dice)].sort((a,b)=>a-b);
  let streak = 1, best = 1;
  for (let i = 1; i < u.length; i++) {
    streak = u[i] === u[i-1]+1 ? streak+1 : 1;
    if (streak > best) best = streak;
  }
  return best >= len;
}

// ══════════════════════════════════════════════════════════════════
//  NAVIGATION ÉCRANS
// ══════════════════════════════════════════════════════════════════
const SCREENS = ['screenTitle','screenBlindIntro','screenGame','screenShop','screenGameOver','screenWin'];

function showScreen(id) {
  SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (!el) return;
    if (s === id) {
      el.classList.remove('hidden');
      el.classList.remove('screen-enter');
      void el.offsetWidth; // reflow pour reset animation
      el.classList.add('screen-enter');
    } else {
      el.classList.add('hidden');
      el.classList.remove('screen-enter');
    }
  });
}

function visibleScreenId() {
  return SCREENS.find(id => { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); });
}
