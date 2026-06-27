<template>
  <div class="pc-multi">

    <div class="game-bar">
      <router-link to="/" class="btn btn-ghost btn-sm">← Menu</router-link>
      <span class="game-title">🐴 Petits Chevaux</span>
      <span class="room-code">{{ roomCode }}</span>
    </div>

    <div v-if="!state" class="waiting"><p>{{ t('waiting_game') }}</p></div>

    <template v-else>
      <!-- Info tour -->
      <div class="turn-info">
        <span v-if="isMyTurn" class="my-turn">🎯 {{ t('your_turn') }}</span>
        <span v-else>{{ t('turn_of') }} <strong :style="{ color: colorHex(state.colorMap[currentPlayerId]) }">{{ playerName(currentPlayerId) }}</strong></span>
        <div class="color-badge" :style="{ background: colorHex(myColor) }">{{ colorLabel(myColor) }}</div>
      </div>

      <div class="main-layout">
        <!-- Plateau -->
        <div class="board-wrap" :style="{ width: boardSize + 'px', height: boardSize + 'px' }">
          <svg class="board" :viewBox="`0 0 ${boardSize} ${boardSize}`" :width="boardSize" :height="boardSize">
            <rect :width="boardSize" :height="boardSize" fill="var(--bg-3)" />

            <!-- Zones d'écurie -->
            <rect x="2" y="2" :width="CELL*6-4" :height="CELL*6-4" rx="12" :fill="COLOR_HEX.red"    opacity="0.10" />
            <rect :x="CELL*9+2" y="2" :width="CELL*6-4" :height="CELL*6-4" rx="12" :fill="COLOR_HEX.blue"   opacity="0.10" />
            <rect :x="CELL*9+2" :y="CELL*9+2" :width="CELL*6-4" :height="CELL*6-4" rx="12" :fill="COLOR_HEX.green"  opacity="0.10" />
            <rect x="2" :y="CELL*9+2" :width="CELL*6-4" :height="CELL*6-4" rx="12" :fill="COLOR_HEX.yellow" opacity="0.10" />

            <!-- Emplacements de pions dans l'écurie -->
            <circle v-for="(s, i) in stableRings" :key="'sr'+i"
              :cx="s.x" :cy="s.y" :r="CELL*0.42" fill="none" :stroke="s.color"
              stroke-width="1.5" stroke-dasharray="3 4" opacity="0.55" />

            <!-- Couloirs d'arrivée colorés -->
            <rect v-for="(c, i) in laneCells" :key="'lc'+i"
              :x="c.x" :y="c.y" :width="CELL" :height="CELL" rx="4" :fill="c.fill" opacity="0.22" />

            <!-- Grille de piste -->
            <rect v-for="(c, i) in trackCells" :key="'tc'+i"
              :x="c.x" :y="c.y" :width="CELL" :height="CELL" rx="5"
              fill="var(--bg-4)" stroke="var(--border)" stroke-width="1" />

            <!-- Cases de départ (alignées sur l'entrée réelle) -->
            <template v-for="(s, i) in startCells" :key="'st'+i">
              <rect :x="s.x" :y="s.y" :width="CELL" :height="CELL" rx="6" :fill="s.color" opacity="0.7" />
              <circle :cx="s.x + CELL/2" :cy="s.y + CELL/2" r="6.5" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.7" />
            </template>

            <!-- Centre -->
            <circle :cx="CELL*7.5" :cy="CELL*7.5" :r="CELL*1.3" fill="var(--bg-2)" stroke="var(--border)" stroke-width="2" />
            <circle :cx="CELL*7.5" :cy="CELL*7.5" :r="CELL*1.55" fill="none" stroke="var(--cyan)" stroke-width="1" stroke-dasharray="4 8" opacity="0.3" class="ring-spin" />
            <text :x="CELL*7.5" :y="CELL*7.5 + 10" text-anchor="middle" font-size="30" class="trophy">🏆</text>
          </svg>

          <!-- Lueur centrale -->
          <div class="board-glow"></div>

          <!-- Numéros des corridors -->
          <div v-for="(n, i) in homeNumbers" :key="'hn'+i" class="home-num"
            :style="{ left: n.left + 'px', top: n.top + 'px', color: n.color }">{{ n.n }}</div>

          <!-- Pions -->
          <div v-for="pw in pawnList" :key="pw.key"
            class="pawn" :class="{ movable: pw.movable, done: pw.done }"
            :style="{ left: pw.x + 'px', top: pw.y + 'px', '--pc': pw.color }"
            @click="selectPion(pw.pid, pw.idx)"></div>
        </div>

        <!-- Panneau droit -->
        <div class="panel">
          <div class="dice-box">
            <div class="die-holder">
              <DieFace v-if="state.diceValue" :val="state.diceValue" :idx="0" />
              <div v-else class="die-placeholder">—</div>
            </div>
            <button class="btn btn-primary btn-full" :disabled="!isMyTurn || state.hasRolled" @click="roll">
              {{ t('pc.roll') }}
            </button>
          </div>

          <div v-if="isMyTurn && state.phase === 'select'" class="hint emph">{{ t('pc.click_pion') }}</div>
          <div v-else-if="isMyTurn && !state.hasRolled" class="hint">{{ t('pc.roll_hint') }}</div>
          <div v-else-if="!isMyTurn" class="hint muted">{{ t('pc.waiting_for', { name: playerName(currentPlayerId) }) }}</div>

          <div class="players-list">
            <div v-for="pid in state.playerOrder" :key="pid" class="player-row"
              :class="{ active: pid === currentPlayerId }"
              :style="pid === currentPlayerId ? { boxShadow: 'inset 3px 0 0 ' + colorHex(state.colorMap[pid]) } : {}">
              <div class="color-dot" :style="{ background: colorHex(state.colorMap[pid]), boxShadow: pid === currentPlayerId ? '0 0 8px ' + colorHex(state.colorMap[pid]) : 'none' }"></div>
              <span class="pname">{{ playerName(pid) }}</span>
              <span v-if="isAIPlayer(pid)" class="badge-ai">IA</span>
              <span class="done-count">{{ doneCount(pid) }}/{{ state.pawns[pid].length }} ✓</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Game over -->
    <Teleport to="body">
      <div v-if="gameOver" class="modal-backdrop">
        <div class="modal-box text-center">
          <div style="font-size:3rem">{{ gameOver.winner?.id === myId ? '🏆' : '🏁' }}</div>
          <h2 class="mt-1">{{ gameOver.winner ? t('pc.wins', { name: gameOver.winner.username }) : t('pc.game_over') }}</h2>
          <router-link to="/" class="btn btn-primary btn-full mt-2">{{ t('back_home') }}</router-link>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.js';
import DieFace from '@/components/DieFace.vue';
import { useI18n } from '@/composables/useI18n.js';

const props = defineProps({ roomCode: String, game: Object });
const auth  = useAuthStore();
const { t } = useI18n();

let socket = null;

const CELL      = 36;
const boardSize = CELL * 15;

// Palette alignée sur le thème cobalt/ember
const COLOR_HEX = { red: '#ff5d8f', blue: '#46d6ff', green: '#2fe6b0', yellow: '#ffc24b' };
const COLOR_LABELS = computed(() => ({
  red: t('pc.red'), blue: t('pc.blue'), green: t('pc.green'), yellow: t('pc.yellow'),
}));

const TRACK = (() => {
  const arr = [];
  for (let r = 14; r >= 0; r--) arr.push([r, 0]);
  for (let c = 1;  c <= 14; c++) arr.push([0, c]);
  for (let r = 1;  r <= 14; r++) arr.push([r, 14]);
  for (let c = 13; c >= 1;  c--) arr.push([14, c]);
  return arr;
})();

const START_IDX = { red: 8, blue: 22, green: 36, yellow: 50 };
const HOME_PATH = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  blue:   [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  green:  [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  yellow: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
};
const STABLE_SLOTS = {
  red:    [[2,2],[2,4],[4,2],[4,4],[3,3]],
  blue:   [[2,10],[2,12],[4,10],[4,12],[3,11]],
  green:  [[10,10],[10,12],[12,10],[12,12],[11,11]],
  yellow: [[10,2],[10,4],[12,2],[12,4],[11,3]],
};
const COLORS_ORDER = ['red', 'blue', 'green', 'yellow'];
const POS_STABLE = -1;
const POS_DONE   = 62;
const TRACK_LEN  = 56;

const state    = ref(null);
const gameOver = ref(null);

const myId            = computed(() => auth.user?.id);
const myColor         = computed(() => state.value?.colorMap?.[myId.value] ?? 'red');
const currentPlayerId = computed(() => state.value?.playerOrder?.[state.value.curPlayer] ?? '');
const isMyTurn        = computed(() => currentPlayerId.value === myId.value);

function playerName(pid) { return state.value?.players?.find(p => p.id === pid)?.username ?? pid; }
function isAIPlayer(pid) { return state.value?.players?.find(p => p.id === pid)?.isAI ?? false; }
function colorHex(color) { return COLOR_HEX[color] ?? '#888'; }
function colorLabel(color) { return COLOR_LABELS.value[color] ?? color; }
function isMovable(pid, idx) {
  return isMyTurn.value && pid === myId.value && state.value?.movablePawns?.includes(idx);
}
function doneCount(pid) {
  return state.value?.pawns?.[pid]?.filter(p => p.pos === POS_DONE).length ?? 0;
}
function getAbsPos(relPos, color) { return (START_IDX[color] + relPos) % TRACK_LEN; }
function pionCell(color, pion) {
  if (!color || pion.pos === POS_STABLE || pion.pos === POS_DONE) return null;
  if (pion.pos >= TRACK_LEN) return HOME_PATH[color][pion.pos - TRACK_LEN];
  return TRACK[getAbsPos(pion.pos, color)];
}
function pionOffset(idx) { return [idx % 2 === 0 ? -4 : 4, idx < 2 ? -4 : 4]; }

// ── Géométrie de rendu ─────────────────────────────────────────
const trackCells = TRACK.map(([r, c]) => ({ x: c * CELL, y: r * CELL }));
const laneCells = (() => {
  const out = [];
  COLORS_ORDER.forEach(color => HOME_PATH[color].forEach(([r, c]) => out.push({ x: c * CELL, y: r * CELL, fill: COLOR_HEX[color] })));
  return out;
})();
const homeNumbers = (() => {
  const out = [];
  COLORS_ORDER.forEach(color => HOME_PATH[color].slice(0, 5).forEach(([r, c], i) =>
    out.push({ n: i + 1, left: c * CELL + CELL / 2, top: r * CELL + CELL / 2, color: COLOR_HEX[color] })));
  return out;
})();
const startCells = COLORS_ORDER.map(color => {
  const [r, c] = TRACK[START_IDX[color]];
  return { x: c * CELL, y: r * CELL, color: COLOR_HEX[color] };
});

const stableRings = computed(() => {
  if (!state.value) return [];
  const out = [];
  state.value.playerOrder.forEach(pid => {
    const color = state.value.colorMap[pid];
    const n = state.value.pawns[pid].length;
    for (let i = 0; i < n; i++) {
      const slot = STABLE_SLOTS[color][i];
      if (slot) out.push({ x: slot[1] * CELL + CELL / 2, y: slot[0] * CELL + CELL / 2, color: COLOR_HEX[color] });
    }
  });
  return out;
});

const pawnList = computed(() => {
  if (!state.value) return [];
  const out = [];
  state.value.playerOrder.forEach(pid => {
    const color = state.value.colorMap[pid];
    state.value.pawns[pid].forEach((pion, idx) => {
      const xy = pawnXY(color, pion, idx);
      if (!xy) return;
      out.push({
        key: pid + '_' + idx, x: xy.x, y: xy.y, color: COLOR_HEX[color],
        movable: isMovable(pid, idx), done: pion.pos === POS_DONE, pid, idx,
      });
    });
  });
  return out;
});

function pawnXY(color, pion, idx) {
  if (pion.pos === POS_STABLE) {
    const s = STABLE_SLOTS[color][idx] || STABLE_SLOTS[color][0];
    return { x: s[1] * CELL + CELL / 2, y: s[0] * CELL + CELL / 2 };
  }
  if (pion.pos === POS_DONE) {
    return { x: CELL * 7.5 + (idx % 3 - 1) * CELL * 0.5, y: CELL * 7.5 + (Math.floor(idx / 3) - 0.5) * CELL * 0.5 };
  }
  const cell = pionCell(color, pion);
  if (!cell) return null;
  const off = pionOffset(idx);
  return { x: cell[1] * CELL + CELL / 2 + off[0], y: cell[0] * CELL + CELL / 2 + off[1] };
}

function selectPion(pid, idx) {
  if (!isMovable(pid, idx)) return;
  socket?.emit('pc_action', { code: props.roomCode, action: 'move', data: { pionIdx: idx } });
}
function roll() {
  if (!isMyTurn.value || state.value?.hasRolled) return;
  socket?.emit('pc_action', { code: props.roomCode, action: 'roll' });
}

onMounted(() => {
  socket = io('/', { auth: { token: auth.token, username: auth.user?.username } });
  socket.on('connect', () => { socket.emit('join_room', props.roomCode); });
  socket.on('pc_state',  (gs) => { state.value = gs; });
  socket.on('game_over', (data) => { gameOver.value = data; });
});
onUnmounted(() => socket?.disconnect());
</script>

<style scoped>
.pc-multi { max-width: 1100px; margin: 0 auto; padding: 1rem; color: var(--text); }

.game-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; gap: .75rem; }
.game-title { font-family: var(--font-title); font-size: 1.2rem; font-weight: 800; }
.room-code  { font-size: .85rem; font-weight: 700; letter-spacing: .12em; background: var(--bg-3); color: var(--text-2); padding: .3rem .65rem; border-radius: 6px; }
.waiting    { text-align: center; padding: 3rem; opacity: .6; }

.turn-info {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius);
  padding: .6rem 1rem; margin-bottom: 1rem;
}
.my-turn { color: var(--green); font-weight: 700; }
.color-badge { padding: .25rem .75rem; border-radius: 6px; font-size: .78rem; font-weight: 700; color: #fff; }

.main-layout { display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap; }

/* Plateau */
.board-wrap { position: relative; flex-shrink: 0; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
.board { display: block; }
.board-glow {
  position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen;
  background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--cyan) 16%, transparent), transparent 52%);
  animation: pcGlowPulse 4s ease-in-out infinite;
}
.ring-spin { transform-box: fill-box; transform-origin: center; animation: pcRingSpin 28s linear infinite; }
.trophy    { transform-box: fill-box; transform-origin: center; animation: pcBob 3s ease-in-out infinite; }

.home-num {
  position: absolute; width: 20px; height: 20px; margin: -10px 0 0 -10px;
  border-radius: 50%; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-title); font-weight: 800; font-size: 12px; line-height: 1;
  pointer-events: none; z-index: 2;
}

.pawn {
  position: absolute; width: 22px; height: 22px; margin: -11px 0 0 -11px;
  border-radius: 50%; z-index: 3;
  background: radial-gradient(circle at 35% 28%, rgba(255,255,255,.85), var(--pc) 70%);
  border: 2px solid rgba(0,0,0,.4);
  box-shadow: 0 3px 7px rgba(0,0,0,.55);
  transition: left .17s cubic-bezier(.34,1.4,.5,1), top .17s cubic-bezier(.34,1.4,.5,1), box-shadow .25s;
}
.pawn.done { width: 18px; height: 18px; margin: -9px 0 0 -9px; border-color: var(--amber); z-index: 4; }
.pawn.movable {
  cursor: pointer; z-index: 6; border-color: #ffc24b;
  box-shadow: 0 0 0 4px rgba(255,194,75,.35), 0 0 18px rgba(255,194,75,.7);
  animation: pcBob 1s ease-in-out infinite;
}

/* Panneau */
.panel { flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: .85rem; }
.dice-box {
  background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 1.1rem; display: flex; flex-direction: column; align-items: center; gap: .85rem;
}
.die-holder { padding: .2rem; }
.die-placeholder {
  font-size: 2.2rem; font-weight: 900; color: var(--text-3);
  width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;
  border: 2px dashed var(--border); border-radius: 13px;
}

.hint {
  font-size: .82rem; text-align: center; border-radius: var(--radius-sm); padding: .55rem .75rem;
  background: var(--bg-3); border: 1px solid var(--border); color: var(--text-2);
}
.hint.emph {
  background: color-mix(in srgb, var(--amber) 12%, transparent);
  border-color: color-mix(in srgb, var(--amber) 32%, transparent); color: var(--amber);
}
.hint.muted { background: var(--bg-3); border-color: var(--border); color: var(--text-2); }

.players-list {
  background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius);
  padding: .75rem; display: flex; flex-direction: column; gap: .4rem;
}
.player-row { display: flex; align-items: center; gap: .55rem; padding: .35rem .5rem; border-radius: var(--radius-sm); transition: background .12s; }
.player-row.active { background: var(--bg-3); }
.color-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.pname { flex: 1; font-weight: 600; font-size: .88rem; }
.badge-ai {
  font-size: .62rem; font-weight: 800; letter-spacing: .05em;
  background: color-mix(in srgb, var(--violet) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--violet) 32%, transparent);
  color: var(--violet); border-radius: 4px; padding: 0 .35rem;
}
.done-count { font-size: .8rem; color: var(--text-2); font-variant-numeric: tabular-nums; }

.mt-1 { margin-top: .5rem; }
.mt-2 { margin-top: 1rem; }

@keyframes pcGlowPulse { 0%,100% { opacity: .4; } 50% { opacity: .9; } }
@keyframes pcRingSpin  { to { transform: rotate(360deg); } }
@keyframes pcBob       { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
</style>
