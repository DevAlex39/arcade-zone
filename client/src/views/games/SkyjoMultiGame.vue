<template>
  <div class="skyjo-multi">
    <div class="game-bar">
      <span class="game-title">🃏 Cell Number</span>
      <span class="room-code">{{ roomCode }}</span>
    </div>

    <div v-if="!state" class="waiting"><p>En attente de la partie…</p></div>

    <template v-else>
      <!-- Info tour -->
      <div class="turn-info">
        <span v-if="isMyTurn" class="my-turn">Votre tour</span>
        <span v-else>Tour de <strong>{{ currentPlayerName }}</strong></span>
        <span class="phase-label">{{ phaseLabel }}</span>
      </div>

      <!-- Zone centrale : deck + défausse -->
      <div class="central-zone">
        <div class="pile" :class="{ clickable: isMyTurn && canDrawDeck }" @click="drawDeck">
          <div class="pile-back">DECK<br><small>{{ state.deckSize }} cartes</small></div>
        </div>
        <div class="pile discard-pile" :class="{ clickable: isMyTurn && canTakeDiscard }" @click="takeDiscard">
          <div class="card-face" :style="cardColor(state.discardTop)">{{ state.discardTop ?? '?' }}</div>
        </div>
        <div v-if="state.heldCard !== null" class="held-zone">
          <div class="card-face held" :style="cardColor(state.heldCard)">{{ state.heldCard }}</div>
          <div class="held-actions">
            <button v-if="state.heldFrom === 'deck'" class="btn-sm" @click="discardAndFlip">Défausser + Retourner</button>
          </div>
        </div>
      </div>

      <!-- Mains des joueurs -->
      <div class="all-hands">
        <div v-for="pid in state.playerOrder" :key="pid" class="player-hand" :class="{ 'me': pid === myId, 'active-player': pid === currentPlayerId }">
          <div class="hand-name">{{ playerName(pid) }}<span v-if="pid === myId"> (vous)</span></div>
          <div class="hand-grid">
            <template v-for="(card, idx) in state.hands[pid]" :key="idx">
              <div
                class="card"
                :class="{
                  eliminated: card.eliminated,
                  clickable: isClickable(pid, idx, card),
                  selectable: isMyTurn && state.heldCard !== null && !card.eliminated && pid === myId,
                }"
                @click="cardClick(pid, idx, card)"
              >
                <div v-if="card.revealed || card.eliminated || pid === myId" class="card-face" :style="cardColor(card.value)">
                  <span v-if="!card.eliminated">{{ card.value }}</span>
                  <span v-else class="x-mark">✕</span>
                </div>
                <div v-else class="card-back">?</div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>

    <!-- Game over -->
    <Teleport to="body">
      <div v-if="gameOver" class="overlay">
        <div class="modal-go">
          <h2>{{ gameOver.winner?.id === myId ? '🏆 Victoire !' : '🏁 Fin de partie' }}</h2>
          <p v-if="gameOver.winner">Gagnant : <strong>{{ gameOver.winner.username }}</strong> (score le plus bas)</p>
          <table class="final-scores">
            <tr v-for="(sc, pid) in gameOver.scores" :key="pid">
              <td>{{ playerName(pid) }}</td><td>{{ sc }} pts</td>
            </tr>
          </table>
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

const props = defineProps({ roomCode: String, game: Object });
const auth  = useAuthStore();

let socket = null;

const state    = ref(null);
const gameOver = ref(null);

const myId            = computed(() => auth.user?.id);
const playerOrder     = computed(() => state.value?.playerOrder ?? []);
const currentPlayerId = computed(() => playerOrder.value[state.value?.curPlayer ?? 0]);
const isMyTurn        = computed(() => currentPlayerId.value === myId.value);

const currentPlayerName = computed(() => playerName(currentPlayerId.value));

const phaseLabel = computed(() => {
  const p = state.value?.phase;
  if (p === 'initFlip') {
    const fp = playerOrder.value[state.value?.initFlipPlayer ?? 0];
    return `Retournez 2 cartes (${fp === myId.value ? 'vous' : playerName(fp)})`;
  }
  if (p === 'draw') return 'Piochez une carte';
  if (p === 'hold') return 'Échangez ou défaussez';
  if (p === 'flipOne') return 'Retournez une carte';
  if (p === 'lastTurn') return 'Dernier tour !';
  return '';
});

const canDrawDeck    = computed(() => ['draw','lastTurn'].includes(state.value?.phase));
const canTakeDiscard = computed(() => ['draw','lastTurn'].includes(state.value?.phase) && (state.value?.discardTop ?? null) !== null);

function playerName(pid) {
  const players = state.value?.playerOrder ?? [];
  return pid ?? 'Joueur';
}

function emit(action, data = {}) {
  socket?.emit('skyjo_action', { code: props.roomCode, action, data });
}

function drawDeck()      { if (isMyTurn.value && canDrawDeck.value) emit('draw_deck'); }
function takeDiscard()   { if (isMyTurn.value && canTakeDiscard.value) emit('take_discard'); }
function discardAndFlip(){ emit('discard_and_flip'); }

function cardClick(pid, idx, card) {
  if (!isMyTurn.value || card.eliminated) return;
  const p = state.value?.phase;

  // initFlip : chaque joueur retourne ses propres cartes
  if (p === 'initFlip') {
    const fp = playerOrder.value[state.value?.initFlipPlayer ?? 0];
    if (pid !== fp || pid !== myId.value) return;
    if (!card.revealed) emit('flip', { idx });
    return;
  }

  // hold : swap avec une carte de sa main
  if ((p === 'hold' || p === 'lastTurn') && state.value.heldCard !== null && pid === myId.value) {
    emit('swap', { idx });
    return;
  }

  // flipOne : retourner une carte de sa main
  if (p === 'flipOne' && pid === myId.value && !card.revealed) {
    emit('flip_one', { idx });
  }
}

function isClickable(pid, idx, card) {
  if (!isMyTurn.value || card.eliminated) return false;
  const p = state.value?.phase;
  if (p === 'initFlip') {
    const fp = playerOrder.value[state.value?.initFlipPlayer ?? 0];
    return pid === fp && pid === myId.value && !card.revealed;
  }
  if ((p === 'hold' || p === 'lastTurn') && state.value.heldCard !== null && pid === myId.value) return true;
  if (p === 'flipOne' && pid === myId.value && !card.revealed) return true;
  return false;
}

function cardColor(val) {
  if (val === null || val === undefined) return { background:'#555' };
  if (val < 0)  return { background:'#1e40af', color:'#fff' };
  if (val === 0)return { background:'#166534', color:'#fff' };
  if (val <= 4) return { background:'#15803d', color:'#fff' };
  if (val <= 8) return { background:'#ca8a04', color:'#fff' };
  return { background:'#b91c1c', color:'#fff' };
}

onMounted(() => {
  socket = io('/', { auth: { token: auth.token, username: auth.user?.username } });
  socket.on('connect', () => { socket.emit('join_room', props.roomCode); });
  socket.on('skyjo_state', (gs) => { state.value = gs; });
  socket.on('game_over', (data) => { gameOver.value = data; });
});

onUnmounted(() => {
  socket?.disconnect();
});
</script>

<style scoped>
.skyjo-multi { max-width:960px; margin:0 auto; padding:1rem; color:var(--text); }
.game-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
.game-title { font-size:1.4rem; font-weight:700; }
.room-code { font-size:.9rem; opacity:.6; }
.waiting { text-align:center; padding:3rem; opacity:.6; }
.turn-info { display:flex; justify-content:space-between; align-items:center; background:var(--surface); border-radius:8px; padding:.6rem 1rem; margin-bottom:1rem; }
.my-turn { color:#4caf50; font-weight:600; }
.phase-label { font-size:.85rem; opacity:.7; }

.central-zone { display:flex; align-items:center; gap:1.5rem; justify-content:center; margin-bottom:1.5rem; flex-wrap:wrap; }
.pile { width:64px; height:90px; border-radius:8px; display:flex; align-items:center; justify-content:center; text-align:center; font-size:.8rem; cursor:default; }
.pile.clickable { cursor:pointer; box-shadow:0 0 0 2px #4caf50; }
.pile-back { background:#334155; color:#94a3b8; width:100%; height:100%; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-direction:column; }
.discard-pile { background:transparent; }
.held-zone { display:flex; flex-direction:column; align-items:center; gap:.4rem; }
.held { border:2px solid #fbbf24; }
.held-actions { display:flex; flex-direction:column; gap:.3rem; }
.btn-sm { padding:.3rem .6rem; font-size:.75rem; border:none; border-radius:6px; background:#4b5563; color:#fff; cursor:pointer; }
.btn-sm:hover { background:#6b7280; }

.card-face { width:64px; height:90px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.3rem; font-weight:700; }
.card-back { width:64px; height:90px; border-radius:8px; background:#1e3a5f; display:flex; align-items:center; justify-content:center; font-size:1.5rem; color:#475569; }
.x-mark { font-size:1rem; opacity:.5; }

.all-hands { display:flex; flex-wrap:wrap; gap:1.5rem; justify-content:center; }
.player-hand { background:var(--surface); border-radius:12px; padding:1rem; min-width:300px; }
.active-player { border:2px solid #4caf50; }
.hand-name { font-weight:600; margin-bottom:.6rem; font-size:.9rem; }
.hand-grid { display:grid; grid-template-columns:repeat(4, 64px); gap:6px; }
.card { cursor:default; }
.card.clickable, .card.selectable { cursor:pointer; transform:scale(1.05); box-shadow:0 0 0 2px #fbbf24; border-radius:8px; }
.card.eliminated { opacity:.3; pointer-events:none; }

.overlay { position:fixed; inset:0; background:rgba(0,0,0,.65); display:flex; align-items:center; justify-content:center; z-index:999; }
.modal-go { background:var(--surface); border-radius:16px; padding:2.5rem 3rem; text-align:center; }
.modal-go h2 { font-size:2rem; margin-bottom:1rem; }
.final-scores { margin:.8rem auto; border-collapse:collapse; }
.final-scores td { padding:.3rem .8rem; border:1px solid #333; }
.btn-back { margin-top:1.5rem; padding:.7rem 2rem; border:none; border-radius:8px; background:#4caf50; color:#fff; cursor:pointer; font-size:1rem; }
</style>
