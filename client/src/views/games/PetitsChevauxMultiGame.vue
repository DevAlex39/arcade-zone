<template>
  <div class="pc-multi">
    <div class="game-bar">
      <span class="game-title">🐴 Petits Chevaux</span>
      <span class="room-code">{{ roomCode }}</span>
    </div>

    <div v-if="!state" class="waiting"><p>En attente de la partie…</p></div>

    <template v-else>
      <!-- Info tour -->
      <div class="turn-info">
        <span v-if="isMyTurn" class="my-turn">Votre tour</span>
        <span v-else>Tour de <strong>{{ currentPlayerName }}</strong></span>
        <div class="color-badge" :style="{ background: colorHex(myColor) }">{{ myColor }}</div>
      </div>

      <!-- Plateau SVG + panneau de jeu -->
      <div class="main-layout">
        <!-- Plateau -->
        <svg class="board" :viewBox="`0 0 ${CELL*15} ${CELL*15}`" :width="boardSize" :height="boardSize">
          <!-- Fond -->
          <rect width="100%" height="100%" fill="#1a1a2e"/>

          <!-- Zones d'écurie (coins) -->
          <rect x="0" y="0" :width="CELL*5" :height="CELL*5" fill="#7f0000" opacity="0.3"/>
          <rect :x="CELL*10" y="0" :width="CELL*5" :height="CELL*5" fill="#003f7f" opacity="0.3"/>
          <rect :x="CELL*10" :y="CELL*10" :width="CELL*5" :height="CELL*5" fill="#006f00" opacity="0.3"/>
          <rect x="0" :y="CELL*10" :width="CELL*5" :height="CELL*5" fill="#7f7f00" opacity="0.3"/>

          <!-- Couloirs d'arrivée -->
          <!-- Rouge : colonnes 1-6, ligne 7 -->
          <rect v-for="c in 6" :key="`hr${c}`" :x="CELL*c" :y="CELL*7" :width="CELL" :height="CELL" fill="#7f0000" opacity="0.5"/>
          <!-- Bleu : lignes 1-6, colonne 7 -->
          <rect v-for="r in 6" :key="`hb${r}`" :x="CELL*7" :y="CELL*r" :width="CELL" :height="CELL" fill="#003f7f" opacity="0.5"/>
          <!-- Vert : colonnes 8-13, ligne 7 -->
          <rect v-for="c in 6" :key="`hg${c}`" :x="CELL*(7+c)" :y="CELL*7" :width="CELL" :height="CELL" fill="#006f00" opacity="0.5"/>
          <!-- Jaune : lignes 8-13, colonne 7 -->
          <rect v-for="r in 6" :key="`hy${r}`" :x="CELL*7" :y="CELL*(7+r)" :width="CELL" :height="CELL" fill="#7f7f00" opacity="0.5"/>

          <!-- Grille de piste (cases blanches périphériques) -->
          <rect
            v-for="([row,col], ti) in TRACK" :key="`t${ti}`"
            :x="CELL*col" :y="CELL*row" :width="CELL" :height="CELL"
            fill="none" stroke="#444" stroke-width="1"
          />

          <!-- Centre -->
          <circle :cx="CELL*7.5" :cy="CELL*7.5" :r="CELL*1.5" fill="#2a2a3e" stroke="#555" stroke-width="2"/>

          <!-- Pions -->
          <template v-for="(pid, pi) in state.playerOrder" :key="`pawns${pi}`">
            <template v-for="(pion, idx) in state.pawns[pid]" :key="`p${pi}_${idx}`">
              <!-- Pion en écurie -->
              <circle
                v-if="pion.pos === POS_STABLE"
                :cx="CELL * (STABLE_SLOTS[state.colorMap[pid]]?.[idx]?.[1] ?? 3) + CELL*0.5"
                :cy="CELL * (STABLE_SLOTS[state.colorMap[pid]]?.[idx]?.[0] ?? 3) + CELL*0.5"
                :r="CELL*0.3"
                :fill="colorHex(state.colorMap[pid])"
                :stroke="isMyTurn && pid === myId && state.movablePawns.includes(idx) ? '#fbbf24' : '#000'"
                stroke-width="2"
                :style="{ cursor: isMyTurn && pid === myId && state.movablePawns.includes(idx) ? 'pointer' : 'default' }"
                @click="selectPion(pid, idx)"
              />
              <!-- Pion arrivé au centre -->
              <circle
                v-else-if="pion.pos === POS_DONE"
                :cx="CELL*7.5 + (idx % 3 - 1) * CELL*0.45"
                :cy="CELL*7.5 + (Math.floor(idx / 3) - 0.5) * CELL*0.45"
                :r="CELL*0.25"
                :fill="colorHex(state.colorMap[pid])"
                stroke="#fbbf24" stroke-width="1.5"
              />
              <!-- Pion sur la piste ou dans le couloir -->
              <circle
                v-else-if="pionCell(pid, pion)"
                :cx="CELL * (pionCell(pid, pion)[1] + 0.5) + pionOffset(pid, idx, pion)[0]"
                :cy="CELL * (pionCell(pid, pion)[0] + 0.5) + pionOffset(pid, idx, pion)[1]"
                :r="CELL*0.3"
                :fill="colorHex(state.colorMap[pid])"
                :stroke="isMyTurn && pid === myId && state.movablePawns.includes(idx) ? '#fbbf24' : '#000'"
                stroke-width="2"
                :style="{ cursor: isMyTurn && pid === myId && state.movablePawns.includes(idx) ? 'pointer' : 'default' }"
                @click="selectPion(pid, idx)"
              />
            </template>
          </template>
        </svg>

        <!-- Panneau droit -->
        <div class="panel">
          <!-- Dé -->
          <div class="dice-box">
            <div v-if="state.diceValue" class="dice-val" :class="`d${state.diceValue}`">{{ state.diceValue }}</div>
            <div v-else class="dice-val empty">—</div>
            <button class="btn-roll" :disabled="!isMyTurn || state.hasRolled" @click="roll">🎲 Lancer</button>
          </div>

          <!-- Message -->
          <div v-if="isMyTurn && state.phase === 'select'" class="hint">
            Cliquez sur un pion doré pour le déplacer
          </div>
          <div v-else-if="isMyTurn && !state.hasRolled" class="hint">Lancez le dé !</div>

          <!-- Joueurs -->
          <div class="players-list">
            <div v-for="(pid, pi) in state.playerOrder" :key="pid" class="player-row" :class="{ active: pid === currentPlayerId }">
              <div class="color-dot" :style="{ background: colorHex(state.colorMap[pid]) }"></div>
              <span>{{ playerName(pid) }}</span>
              <span class="done-count">{{ doneCount(pid) }}/{{ state.pawns[pid].length }} ✓</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Game over -->
    <Teleport to="body">
      <div v-if="gameOver" class="overlay">
        <div class="modal-go">
          <h2>{{ gameOver.winner?.id === myId ? '🏆 Victoire !' : '🏁 Fin !' }}</h2>
          <p v-if="gameOver.winner">Gagnant : <strong>{{ gameOver.winner.username }}</strong></p>
          <button class="btn-back" @click="$router.push('/')">Retour</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.js';

const props  = defineProps({ roomCode: String, game: Object });
const auth   = useAuthStore();

let socket = null;

const CELL      = 35;
const boardSize = CELL * 15;

// Piste 56 cases (reproduite côté client pour le rendu)
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

const myId = computed(() => auth.user?.id);
const myColor = computed(() => state.value?.colorMap?.[myId.value] ?? 'red');
const currentPlayerId  = computed(() => state.value?.playerOrder?.[state.value.curPlayer] ?? '');
const isMyTurn         = computed(() => currentPlayerId.value === myId.value);
const currentPlayerName = computed(() => playerName(currentPlayerId.value));

function playerName(pid) { return pid; }

function colorHex(color) {
  return { red:'#ef4444', blue:'#3b82f6', green:'#22c55e', yellow:'#eab308' }[color] ?? '#888';
}

function doneCount(pid) {
  return state.value?.pawns?.[pid]?.filter(p => p.pos === POS_DONE).length ?? 0;
}

function getAbsPos(relPos, color) {
  return (START_IDX[color] + relPos) % TRACK_LEN;
}

function pionCell(pid, pion) {
  const color = state.value?.colorMap?.[pid];
  if (!color) return null;
  if (pion.pos === POS_STABLE) return null; // rendered in stable zone
  if (pion.pos === POS_DONE)   return null; // rendered at center
  if (pion.pos >= TRACK_LEN)   return HOME_PATH[color][pion.pos - TRACK_LEN];
  return TRACK[getAbsPos(pion.pos, color)];
}

function pionOffset(pid, idx, pion) {
  // décalage léger si plusieurs pions à la même position
  if (pion.pos === POS_STABLE) {
    const color = state.value?.colorMap?.[pid];
    const slot  = STABLE_SLOTS[color]?.[idx] ?? [0, 0];
    return [0, 0]; // on utilise les coordonnées directes pour l'écurie
  }
  return [idx % 2 === 0 ? -4 : 4, idx < 2 ? -4 : 4];
}

function selectPion(pid, idx) {
  if (!isMyTurn.value || pid !== myId.value) return;
  if (!state.value?.movablePawns?.includes(idx)) return;
  socket?.emit('pc_action', { code: props.roomCode, action: 'move', data: { pionIdx: idx } });
}

function roll() {
  if (!isMyTurn.value || state.value?.hasRolled) return;
  socket?.emit('pc_action', { code: props.roomCode, action: 'roll' });
}

onMounted(() => {
  socket = io('/', { auth: { token: auth.token, username: auth.user?.username } });
  socket.on('connect', () => { socket.emit('join_room', props.roomCode); });
  socket.on('pc_state', (gs) => { state.value = gs; });
  socket.on('game_over', (data) => { gameOver.value = data; });
});

onUnmounted(() => {
  socket?.disconnect();
});
</script>

<style scoped>
.pc-multi { max-width:1100px; margin:0 auto; padding:1rem; color:var(--text); }
.game-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
.game-title { font-size:1.4rem; font-weight:700; }
.room-code { font-size:.9rem; opacity:.6; }
.waiting { text-align:center; padding:3rem; opacity:.6; }

.turn-info { display:flex; align-items:center; gap:1rem; background:var(--surface); border-radius:8px; padding:.6rem 1rem; margin-bottom:1rem; }
.my-turn { color:#4caf50; font-weight:600; }
.color-badge { padding:.2rem .7rem; border-radius:6px; font-size:.8rem; font-weight:600; text-transform:capitalize; color:#fff; }

.main-layout { display:flex; gap:1.5rem; align-items:flex-start; flex-wrap:wrap; }
.board { border-radius:8px; background:#1a1a2e; flex-shrink:0; }

.panel { flex:1; min-width:200px; display:flex; flex-direction:column; gap:1rem; }
.dice-box { background:var(--surface); border-radius:12px; padding:1rem; text-align:center; }
.dice-val { font-size:3rem; font-weight:900; padding:.5rem; border-radius:8px; background:#2a2a3e; display:inline-block; min-width:80px; }
.dice-val.empty { opacity:.3; }
.dice-val.d6 { color:#fbbf24; }
.btn-roll { display:block; width:100%; margin-top:.8rem; padding:.6rem; border:none; border-radius:8px; background:#4caf50; color:#fff; font-size:1rem; cursor:pointer; font-weight:600; }
.btn-roll:disabled { opacity:.4; cursor:not-allowed; }
.hint { font-size:.85rem; color:#fbbf24; background:rgba(251,191,36,.1); border-radius:8px; padding:.5rem .8rem; text-align:center; }

.players-list { background:var(--surface); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:.5rem; }
.player-row { display:flex; align-items:center; gap:.6rem; padding:.4rem; border-radius:6px; }
.player-row.active { background:rgba(76,175,80,.15); }
.color-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
.done-count { margin-left:auto; font-size:.8rem; opacity:.7; }

.overlay { position:fixed; inset:0; background:rgba(0,0,0,.65); display:flex; align-items:center; justify-content:center; z-index:999; }
.modal-go { background:var(--surface); border-radius:16px; padding:2.5rem 3rem; text-align:center; }
.modal-go h2 { font-size:2rem; margin-bottom:1rem; }
.btn-back { margin-top:1.5rem; padding:.7rem 2rem; border:none; border-radius:8px; background:#4caf50; color:#fff; cursor:pointer; font-size:1rem; }
</style>
