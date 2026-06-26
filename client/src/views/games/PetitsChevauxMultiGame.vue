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
        <template v-if="isMyTurn">
          <span class="my-turn">{{ t('your_turn') }}</span>
        </template>
        <template v-else>
          <span>{{ t('turn_of') }} <strong :style="{ color: colorHex(state.colorMap[currentPlayerId]) }">{{ playerName(currentPlayerId) }}</strong></span>
        </template>
        <div class="color-badge" :style="{ background: colorHex(myColor), color: '#fff' }">
          {{ colorLabel(myColor) }}
        </div>
      </div>

      <div class="main-layout">
        <!-- Plateau SVG -->
        <svg class="board" :viewBox="`0 0 ${CELL*15} ${CELL*15}`" :width="boardSize" :height="boardSize">
          <!-- Fond -->
          <rect width="100%" height="100%" fill="var(--bg-3)"/>

          <!-- Zones d'écurie -->
          <rect x="0" y="0" :width="CELL*6" :height="CELL*6" :fill="stableColor('red')" rx="4"/>
          <rect :x="CELL*9" y="0" :width="CELL*6" :height="CELL*6" :fill="stableColor('blue')" rx="4"/>
          <rect :x="CELL*9" :y="CELL*9" :width="CELL*6" :height="CELL*6" :fill="stableColor('green')" rx="4"/>
          <rect x="0" :y="CELL*9" :width="CELL*6" :height="CELL*6" :fill="stableColor('yellow')" rx="4"/>

          <!-- Couloirs d'arrivée colorés -->
          <rect v-for="c in 6" :key="`hr${c}`" :x="CELL*c" :y="CELL*6" :width="CELL" :height="CELL*3"
            fill="none"/>
          <rect v-for="c in 6" :key="`hr2${c}`" :x="CELL*c" :y="CELL*7" :width="CELL" :height="CELL"
            :fill="COLOR_HEX.red" opacity="0.25"/>
          <rect v-for="r in 6" :key="`hb${r}`" :x="CELL*7" :y="CELL*r" :width="CELL" :height="CELL"
            :fill="COLOR_HEX.blue" opacity="0.25"/>
          <rect v-for="c in 6" :key="`hg${c}`" :x="CELL*(8+c)" :y="CELL*7" :width="CELL" :height="CELL"
            :fill="COLOR_HEX.green" opacity="0.25"/>
          <rect v-for="r in 6" :key="`hy${r}`" :x="CELL*7" :y="CELL*(8+r)" :width="CELL" :height="CELL"
            :fill="COLOR_HEX.yellow" opacity="0.25"/>

          <!-- Grille de piste -->
          <rect
            v-for="([row,col], ti) in TRACK" :key="`t${ti}`"
            :x="CELL*col" :y="CELL*row" :width="CELL" :height="CELL"
            fill="var(--bg-4)" stroke="var(--border)" stroke-width="1"
          />

          <!-- Cases de départ (couleur) -->
          <rect :x="CELL*8"  :y="CELL*6"  :width="CELL" :height="CELL" :fill="COLOR_HEX.red"    opacity="0.5"/>
          <rect :x="CELL*14" :y="CELL*8"  :width="CELL" :height="CELL" :fill="COLOR_HEX.blue"   opacity="0.5"/>
          <rect :x="CELL*6"  :y="CELL*8"  :width="CELL" :height="CELL" :fill="COLOR_HEX.green"  opacity="0.5"/>
          <rect :x="CELL*0"  :y="CELL*6"  :width="CELL" :height="CELL" :fill="COLOR_HEX.yellow" opacity="0.5"/>

          <!-- Centre -->
          <circle :cx="CELL*7.5" :cy="CELL*7.5" :r="CELL*2" fill="var(--bg-2)" stroke="var(--border)" stroke-width="2"/>
          <text :x="CELL*7.5" :y="CELL*7.5+6" text-anchor="middle" font-size="22" fill="var(--text-2)">🏆</text>

          <!-- Pions -->
          <template v-for="(pid, pi) in state.playerOrder" :key="`pawns${pi}`">
            <template v-for="(pion, idx) in state.pawns[pid]" :key="`p${pi}_${idx}`">
              <circle
                v-if="pion.pos === POS_STABLE"
                :cx="CELL * (STABLE_SLOTS[state.colorMap[pid]]?.[idx]?.[1] ?? 3) + CELL*0.5"
                :cy="CELL * (STABLE_SLOTS[state.colorMap[pid]]?.[idx]?.[0] ?? 3) + CELL*0.5"
                :r="CELL*0.32"
                :fill="colorHex(state.colorMap[pid])"
                :stroke="isMovable(pid, idx) ? 'var(--yellow)' : 'var(--bg)'"
                :stroke-width="isMovable(pid, idx) ? 2.5 : 1.5"
                :style="{ cursor: isMovable(pid, idx) ? 'pointer' : 'default', filter: isMovable(pid, idx) ? 'drop-shadow(0 0 6px gold)' : 'none' }"
                @click="selectPion(pid, idx)"
              />
              <circle
                v-else-if="pion.pos === POS_DONE"
                :cx="CELL*7.5 + (idx % 3 - 1) * CELL*0.5"
                :cy="CELL*7.5 + (Math.floor(idx / 3) - 0.5) * CELL*0.5"
                :r="CELL*0.26"
                :fill="colorHex(state.colorMap[pid])"
                stroke="var(--yellow)" stroke-width="1.5"
              />
              <circle
                v-else-if="pionCell(pid, pion)"
                :cx="CELL * (pionCell(pid, pion)[1] + 0.5) + pionOffset(idx)[0]"
                :cy="CELL * (pionCell(pid, pion)[0] + 0.5) + pionOffset(idx)[1]"
                :r="CELL*0.32"
                :fill="colorHex(state.colorMap[pid])"
                :stroke="isMovable(pid, idx) ? 'var(--yellow)' : 'var(--bg)'"
                :stroke-width="isMovable(pid, idx) ? 2.5 : 1.5"
                :style="{ cursor: isMovable(pid, idx) ? 'pointer' : 'default', filter: isMovable(pid, idx) ? 'drop-shadow(0 0 6px gold)' : 'none' }"
                @click="selectPion(pid, idx)"
              />
            </template>
          </template>
        </svg>

        <!-- Panneau droit -->
        <div class="panel">

          <!-- Dé -->
          <div class="dice-box">
            <div v-if="state.diceValue" class="die-holder">
              <DieFace :val="state.diceValue" :idx="0" />
            </div>
            <div v-else class="die-placeholder">—</div>
            <button
              class="btn btn-primary btn-full mt-1"
              :disabled="!isMyTurn || state.hasRolled"
              @click="roll"
            >{{ t('pc.roll') }}</button>
          </div>

          <!-- Hint -->
          <div v-if="isMyTurn && state.phase === 'select'" class="hint">
            {{ t('pc.click_pion') }}
          </div>
          <div v-else-if="isMyTurn && !state.hasRolled" class="hint">
            {{ t('pc.roll_hint') }}
          </div>
          <div v-else-if="!isMyTurn" class="hint muted">
            {{ t('pc.waiting_for', { name: playerName(currentPlayerId) }) }}
          </div>

          <!-- Joueurs -->
          <div class="players-list">
            <div
              v-for="(pid, pi) in state.playerOrder"
              :key="pid"
              class="player-row"
              :class="{ active: pid === currentPlayerId }"
            >
              <div class="color-dot" :style="{ background: colorHex(state.colorMap[pid]) }"></div>
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

const COLOR_HEX = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308' };
const COLOR_LABELS = computed(() => ({
  red: t('pc.red'), blue: t('pc.blue'), green: t('pc.green'), yellow: t('pc.yellow'),
}));

const TRACK = (() => {
  const t = [];
  for (let r = 14; r >= 0; r--) t.push([r, 0]);
  for (let c = 1;  c <= 14; c++) t.push([0, c]);
  for (let r = 1;  r <= 14; r++) t.push([r, 14]);
  for (let c = 13; c >= 1;  c--) t.push([14, c]);
  return t;
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
const POS_STABLE = -1;
const POS_DONE   = 62;
const TRACK_LEN  = 56;

const state    = ref(null);
const gameOver = ref(null);

const myId             = computed(() => auth.user?.id);
const myColor          = computed(() => state.value?.colorMap?.[myId.value] ?? 'red');
const currentPlayerId  = computed(() => state.value?.playerOrder?.[state.value.curPlayer] ?? '');
const isMyTurn         = computed(() => currentPlayerId.value === myId.value);

function playerName(pid) {
  return state.value?.players?.find(p => p.id === pid)?.username ?? pid;
}
function isAIPlayer(pid) {
  return state.value?.players?.find(p => p.id === pid)?.isAI ?? false;
}
function colorHex(color) { return COLOR_HEX[color] ?? '#888'; }
function colorLabel(color) { return COLOR_LABELS.value[color] ?? color; }
function stableColor(color) {
  const hex = COLOR_HEX[color];
  return hex + '22'; // très transparent
}
function isMovable(pid, idx) {
  return isMyTurn.value && pid === myId.value && state.value?.movablePawns?.includes(idx);
}
function doneCount(pid) {
  return state.value?.pawns?.[pid]?.filter(p => p.pos === POS_DONE).length ?? 0;
}
function getAbsPos(relPos, color) {
  return (START_IDX[color] + relPos) % TRACK_LEN;
}
function pionCell(pid, pion) {
  const color = state.value?.colorMap?.[pid];
  if (!color || pion.pos === POS_STABLE || pion.pos === POS_DONE) return null;
  if (pion.pos >= TRACK_LEN) return HOME_PATH[color][pion.pos - TRACK_LEN];
  return TRACK[getAbsPos(pion.pos, color)];
}
function pionOffset(idx) {
  return [idx % 2 === 0 ? -4 : 4, idx < 2 ? -4 : 4];
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

.game-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1rem; gap: .75rem;
}
.game-title { font-family: var(--font-title); font-size: 1.2rem; font-weight: 800; }
.room-code  { font-size: .85rem; color: var(--text-2); }
.waiting    { text-align: center; padding: 3rem; opacity: .6; }

.turn-info {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius);
  padding: .6rem 1rem; margin-bottom: 1rem;
}
.my-turn { color: var(--green); font-weight: 700; }
.color-badge {
  padding: .2rem .75rem; border-radius: 6px; font-size: .78rem; font-weight: 700;
  text-transform: capitalize;
}

.main-layout { display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap; }
.board { border-radius: var(--radius); flex-shrink: 0; }

/* Panneau */
.panel { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: .75rem; }

.dice-box {
  background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: .5rem;
}
.die-holder { padding: .4rem; }
.die-placeholder {
  font-size: 2.5rem; font-weight: 900; color: var(--text-3);
  width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;
  border: 2px dashed var(--border); border-radius: 11px;
}

.hint {
  font-size: .85rem; background: color-mix(in srgb, var(--yellow) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--yellow) 30%, transparent);
  color: var(--yellow); border-radius: var(--radius-sm); padding: .5rem .75rem; text-align: center;
}
.hint.muted { background: var(--bg-3); border-color: var(--border); color: var(--text-2); }

.players-list {
  background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius);
  padding: .75rem; display: flex; flex-direction: column; gap: .4rem;
}
.player-row {
  display: flex; align-items: center; gap: .6rem; padding: .35rem .5rem;
  border-radius: var(--radius-sm); transition: background .12s;
}
.player-row.active { background: var(--bg-3); }
.color-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.pname { flex: 1; font-weight: 600; font-size: .88rem; }
.badge-ai {
  font-size: .65rem; font-weight: 800; letter-spacing: .06em;
  background: rgba(129,140,248,.15); border: 1px solid rgba(129,140,248,.3);
  color: var(--violet); border-radius: 4px; padding: 0 .35rem;
}
.done-count { font-size: .8rem; color: var(--text-2); }

.mt-1 { margin-top: .5rem; }
</style>
