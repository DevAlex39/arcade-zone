<template>
  <div class="yahtzee-multi">
    <!-- En-tête -->
    <div class="game-bar">
      <span class="game-title">🎲 Yahtzee</span>
      <span class="room-code">{{ roomCode }}</span>
    </div>

    <!-- Attente -->
    <div v-if="!state" class="waiting">
      <p>En attente du début de la partie…</p>
    </div>

    <template v-else>
      <!-- Infos tour -->
      <div class="turn-info">
        <span v-if="isMyTurn" class="my-turn">Votre tour — {{ rollsLeft }} lancer(s) restant(s)</span>
        <span v-else>Tour de <strong>{{ currentPlayerName }}</strong></span>
        <span class="round-num">Manche {{ curRound + 1 }}</span>
      </div>

      <!-- Dés -->
      <div class="dice-row">
        <div
          v-for="(val, i) in dice"
          :key="i"
          class="die"
          :class="{ kept: kept[i], selectable: isMyTurn && hasRolled }"
          @click="toggleKeep(i)"
        >
          <svg viewBox="0 0 60 60" width="56" height="56">
            <rect rx="8" ry="8" width="60" height="60" fill="currentColor" />
            <g fill="white">
              <template v-if="val===1"><circle cx="30" cy="30" r="6"/></template>
              <template v-else-if="val===2"><circle cx="18" cy="18" r="6"/><circle cx="42" cy="42" r="6"/></template>
              <template v-else-if="val===3"><circle cx="18" cy="18" r="6"/><circle cx="30" cy="30" r="6"/><circle cx="42" cy="42" r="6"/></template>
              <template v-else-if="val===4"><circle cx="18" cy="18" r="6"/><circle cx="42" cy="18" r="6"/><circle cx="18" cy="42" r="6"/><circle cx="42" cy="42" r="6"/></template>
              <template v-else-if="val===5"><circle cx="18" cy="18" r="6"/><circle cx="42" cy="18" r="6"/><circle cx="30" cy="30" r="6"/><circle cx="18" cy="42" r="6"/><circle cx="42" cy="42" r="6"/></template>
              <template v-else><circle cx="18" cy="18" r="6"/><circle cx="42" cy="18" r="6"/><circle cx="18" cy="30" r="6"/><circle cx="42" cy="30" r="6"/><circle cx="18" cy="42" r="6"/><circle cx="42" cy="42" r="6"/></template>
            </g>
          </svg>
          <div v-if="kept[i]" class="kept-label">Gardé</div>
        </div>
      </div>

      <!-- Bouton Lancer -->
      <div class="roll-row">
        <button class="btn-roll" :disabled="!isMyTurn || rollsLeft <= 0" @click="roll">
          🎲 Lancer ({{ rollsLeft }})
        </button>
      </div>

      <!-- Tableau de scores -->
      <div class="score-section">
        <h3>Scores</h3>
        <table class="score-table">
          <thead>
            <tr>
              <th>Catégorie</th>
              <th v-for="pid in playerOrder" :key="pid" :class="{ 'active-col': pid === currentPlayerId }">
                {{ playerName(pid) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in UPPER_CATS" :key="cat.id" class="cat-row upper">
              <td>{{ cat.label }}</td>
              <td
                v-for="pid in playerOrder" :key="pid"
                :class="{ 'can-score': isMyTurn && hasRolled && pid === myId && scores[myId]?.[cat.id] === undefined, filled: scores[pid]?.[cat.id] !== undefined }"
                @click="scoreCategory(cat.id, pid)"
              >
                {{ cellValue(pid, cat.id) }}
              </td>
            </tr>
            <!-- Bonus section haute -->
            <tr class="bonus-row">
              <td>Bonus (+35 si ≥63)</td>
              <td v-for="pid in playerOrder" :key="pid">{{ scores[pid]?.bonus ?? '—' }}</td>
            </tr>
            <tr v-for="cat in LOWER_CATS" :key="cat.id" class="cat-row lower">
              <td>{{ cat.label }}</td>
              <td
                v-for="pid in playerOrder" :key="pid"
                :class="{ 'can-score': isMyTurn && hasRolled && pid === myId && scores[myId]?.[cat.id] === undefined, filled: scores[pid]?.[cat.id] !== undefined }"
                @click="scoreCategory(cat.id, pid)"
              >
                {{ cellValue(pid, cat.id) }}
              </td>
            </tr>
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td v-for="pid in playerOrder" :key="pid"><strong>{{ scores[pid]?.total ?? 0 }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Game over -->
    <Teleport to="body">
      <div v-if="gameOver" class="overlay">
        <div class="modal-go">
          <h2>{{ gameOver.winner?.id === myId ? '🏆 Victoire !' : '😔 Fin de partie' }}</h2>
          <p v-if="gameOver.winner">Gagnant : <strong>{{ gameOver.winner.username }}</strong></p>
          <button class="btn-back" @click="$router.push('/')">Retour</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.js';

const props  = defineProps({ roomCode: String, game: Object });
const router = useRouter();
const auth   = useAuthStore();

let socket = null;

const state       = ref(null);
const gameOver    = ref(null);

const dice        = computed(() => state.value?.dice    ?? [1,1,1,1,1]);
const kept        = computed(() => state.value?.kept    ?? [false,false,false,false,false]);
const rollsLeft   = computed(() => state.value?.rollsLeft ?? 3);
const hasRolled   = computed(() => state.value?.hasRolled  ?? false);
const curRound    = computed(() => state.value?.curRound   ?? 0);
const scores      = computed(() => state.value?.scores     ?? {});
const playerOrder = computed(() => state.value?.playerOrder ?? []);
const previews    = computed(() => state.value?.previews    ?? {});
const myId        = computed(() => auth.user?.id);

const currentPlayerId  = computed(() => playerOrder.value[state.value?.curPlayer ?? 0]);
const isMyTurn         = computed(() => currentPlayerId.value === myId.value);
const currentPlayerName = computed(() => {
  const pid = currentPlayerId.value;
  return state.value?.players?.find(p => p.id === pid)?.username ?? pid;
});

const UPPER_CATS = [
  { id:'ones',   label:'1 — As'     },
  { id:'twos',   label:'2 — Deux'   },
  { id:'threes', label:'3 — Trois'  },
  { id:'fours',  label:'4 — Quatre' },
  { id:'fives',  label:'5 — Cinq'   },
  { id:'sixes',  label:'6 — Six'    },
];
const LOWER_CATS = [
  { id:'threeKind',  label:'Brelan'           },
  { id:'fourKind',   label:'Carré'            },
  { id:'fullHouse',  label:'Full (25 pts)'    },
  { id:'smStraight', label:'Petite suite (30)'},
  { id:'lgStraight', label:'Grande suite (40)'},
  { id:'yahtzee',    label:'Yahtzee (50)'     },
  { id:'chance',     label:'Chance'           },
];

function playerName(pid) {
  return state.value?.players?.find(p => p.id === pid)?.username ?? pid;
}

function cellValue(pid, catId) {
  const s = scores.value[pid];
  if (!s) return '—';
  if (s[catId] !== undefined) return s[catId];
  if (isMyTurn.value && hasRolled.value && pid === myId.value && previews.value[catId] !== undefined) {
    return `(${previews.value[catId]})`;
  }
  return '—';
}

function roll() {
  if (!isMyTurn.value || rollsLeft.value <= 0) return;
  socket.emit('yahtzee_action', { code: props.roomCode, action: 'roll' });
}

function toggleKeep(idx) {
  if (!isMyTurn.value || !hasRolled.value) return;
  socket.emit('yahtzee_action', { code: props.roomCode, action: 'keep', data: { idx } });
}

function scoreCategory(catId, pid) {
  if (!isMyTurn.value || !hasRolled.value || pid !== myId.value) return;
  if (scores.value[myId.value]?.[catId] !== undefined) return;
  socket.emit('yahtzee_action', { code: props.roomCode, action: 'score', data: { catId } });
}

onMounted(() => {
  socket = io('/', { auth: { token: auth.token, username: auth.user?.username } });
  socket.on('connect', () => { socket.emit('join_room', props.roomCode); });
  socket.on('yahtzee_state', (gs) => { state.value = gs; });
  socket.on('game_over', (data) => { gameOver.value = data; });
});

onUnmounted(() => {
  socket?.disconnect();
});
</script>

<style scoped>
.yahtzee-multi { max-width:900px; margin:0 auto; padding:1rem; color:var(--text); }
.game-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
.game-title { font-size:1.4rem; font-weight:700; }
.room-code { font-size:.9rem; opacity:.6; }
.waiting { text-align:center; padding:3rem; opacity:.6; }
.turn-info { display:flex; justify-content:space-between; align-items:center; background:var(--surface); border-radius:8px; padding:.6rem 1rem; margin-bottom:1rem; }
.my-turn { color:#4caf50; font-weight:600; }
.round-num { opacity:.6; font-size:.85rem; }

.dice-row { display:flex; gap:12px; justify-content:center; margin-bottom:1rem; flex-wrap:wrap; }
.die { position:relative; cursor:default; color:#ddd; transition:transform .15s; }
.die.selectable { cursor:pointer; }
.die.kept { color:#fbbf24; }
.die.selectable:hover { transform:scale(1.08); }
.kept-label { text-align:center; font-size:.65rem; color:#fbbf24; margin-top:2px; }

.roll-row { text-align:center; margin-bottom:1.5rem; }
.btn-roll { padding:.7rem 2rem; border:none; border-radius:8px; background:#4caf50; color:#fff; font-size:1rem; font-weight:600; cursor:pointer; }
.btn-roll:disabled { opacity:.4; cursor:not-allowed; }

.score-section h3 { margin-bottom:.5rem; }
.score-table { width:100%; border-collapse:collapse; font-size:.85rem; }
.score-table th, .score-table td { padding:.4rem .6rem; border:1px solid var(--border, #333); text-align:center; }
.score-table th { background:var(--surface); }
.score-table .upper td:first-child { color:#90caf9; }
.score-table .lower td:first-child { color:#ce93d8; }
.score-table .can-score { cursor:pointer; color:#fbbf24; font-style:italic; }
.score-table .can-score:hover { background:rgba(251,191,36,.12); }
.score-table .filled { color:var(--text); font-style:normal; }
.score-table .active-col { background:rgba(76,175,80,.1); }
.bonus-row td { background:rgba(144,202,249,.06); font-style:italic; font-size:.8rem; }
.total-row td { background:var(--surface); font-size:.95rem; }

.overlay { position:fixed; inset:0; background:rgba(0,0,0,.65); display:flex; align-items:center; justify-content:center; z-index:999; }
.modal-go { background:var(--surface); border-radius:16px; padding:2.5rem 3rem; text-align:center; }
.modal-go h2 { font-size:2rem; margin-bottom:1rem; }
.btn-back { margin-top:1.5rem; padding:.7rem 2rem; border:none; border-radius:8px; background:#4caf50; color:#fff; cursor:pointer; font-size:1rem; }
</style>
