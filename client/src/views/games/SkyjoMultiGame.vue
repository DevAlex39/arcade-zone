<template>
  <div class="skyjo-multi">

    <!-- Header -->
    <div class="game-bar">
      <router-link to="/" class="btn btn-ghost btn-sm">← Retour</router-link>
      <span class="game-title">🃏 Cell Number</span>
      <span class="room-code-badge">{{ roomCode }}</span>
    </div>

    <div v-if="!state" class="waiting-screen">
      <span class="spin-icon">⟳</span>
      <p>{{ t('waiting_game') }}</p>
    </div>

    <template v-else>
      <!-- HUD tour / phase -->
      <div class="turn-hud">
        <div class="hud-left">
          <span v-if="isMyTurn" class="my-turn-badge">{{ t('your_turn') }}</span>
          <span v-else class="other-turn">
            {{ t('turn_of') }} <strong>{{ currentPlayerName }}</strong>
            <span v-if="isAIPlayer(currentPlayerId)" class="ai-tag">IA</span>
          </span>
        </div>
        <span class="phase-label">{{ phaseLabel }}</span>
      </div>

      <!-- Zone centrale: deck + défausse + carte en main -->
      <div class="central-zone">
        <div class="pile-wrap">
          <div class="pile deck-pile" :class="{ clickable: isMyTurn && canDrawDeck }" @click="drawDeck">
            <div class="pile-inner">
              <span class="pile-icon">🂠</span>
              <small>{{ state.deckSize }}</small>
            </div>
          </div>
          <span class="pile-label">{{ t('skyjo.deck') }}</span>
        </div>

        <div class="pile-wrap">
          <div class="pile discard-pile" :class="{ clickable: isMyTurn && canTakeDiscard }" @click="takeDiscard">
            <div v-if="state.discardTop !== null" class="card-face" :style="cardStyle(state.discardTop)">
              {{ state.discardTop }}
            </div>
            <div v-else class="pile-inner"><span class="pile-icon">—</span></div>
          </div>
          <span class="pile-label">{{ t('skyjo.discard') }}</span>
        </div>

        <div v-if="state.heldCard !== null" class="held-wrap">
          <div class="card-face held-card" :style="cardStyle(state.heldCard)">
            {{ state.heldCard }}
          </div>
          <button v-if="state.heldFrom === 'deck'" class="btn btn-secondary btn-sm mt-1" @click="discardAndFlip">
            {{ t('skyjo.discard_flip') }}
          </button>
          <span class="held-hint">{{ t('skyjo.held_hint') }}</span>
        </div>
      </div>

      <!-- Mains des joueurs -->
      <div class="all-hands">
        <div
          v-for="pid in state.playerOrder"
          :key="pid"
          class="player-hand card"
          :class="{ 'hand-me': pid === myId, 'hand-active': pid === currentPlayerId }"
        >
          <div class="hand-header">
            <span class="hand-name">{{ playerName(pid) }}</span>
            <span v-if="pid === myId" class="hand-you">({{ t('you') }})</span>
            <span v-if="isAIPlayer(pid)" class="ai-tag">IA</span>
            <span class="hand-score">{{ handScore(pid) }} {{ t('skyjo.pts') }}</span>
          </div>
          <div class="hand-grid">
            <template v-for="(card, idx) in state.hands[pid]" :key="idx">
              <div
                class="card-slot"
                :class="{
                  eliminated: card.eliminated,
                  clickable: isClickable(pid, idx, card),
                  swappable: isMyTurn && state.heldCard !== null && !card.eliminated && pid === myId,
                }"
                @click="cardClick(pid, idx, card)"
              >
                <div v-if="card.revealed || card.eliminated || pid === myId" class="card-face" :style="cardStyle(card.value)">
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
      <div v-if="gameOver" class="modal-backdrop" @click.self="$router.push('/')">
        <div class="modal-box game-over-modal">
          <div class="go-title">
            {{ gameOver.winner?.id === myId ? t('victory') : t('game_over_title') }}
          </div>
          <p v-if="gameOver.winner" class="go-winner">
            {{ t('winner_label') }} <strong>{{ gameOver.winner.username }}</strong>
          </p>
          <div class="score-list">
            <div v-for="(sc, pid) in gameOver.scores" :key="pid" class="score-row">
              <span class="score-name">{{ playerName(pid) }}</span>
              <span class="score-val">{{ sc }} pts</span>
            </div>
          </div>
          <button class="btn btn-primary mt-2" @click="$router.push('/')">{{ t('back_home') }}</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.js';
import { useI18n } from '@/composables/useI18n.js';

const props = defineProps({ roomCode: String, game: Object });
const auth  = useAuthStore();
const { t } = useI18n();

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
    const name = fp === myId.value ? t('you') : playerName(fp);
    return t('skyjo.init_flip', { name });
  }
  if (p === 'draw')     return t('skyjo.draw');
  if (p === 'hold')     return t('skyjo.hold');
  if (p === 'flipOne')  return t('skyjo.flip_one');
  if (p === 'lastTurn') return t('skyjo.last_turn');
  return '';
});

const canDrawDeck    = computed(() => ['draw','lastTurn'].includes(state.value?.phase));
const canTakeDiscard = computed(() => ['draw','lastTurn'].includes(state.value?.phase) && (state.value?.discardTop ?? null) !== null);

function playerName(pid) {
  return state.value?.players?.find(p => p.id === pid)?.username ?? pid ?? 'Joueur';
}

function isAIPlayer(pid) {
  return state.value?.players?.find(p => p.id === pid)?.isAI ?? false;
}

function handScore(pid) {
  const hand = state.value?.hands?.[pid];
  if (!hand) return 0;
  return hand.filter(c => c.revealed && !c.eliminated).reduce((s, c) => s + c.value, 0);
}

function emit(action, data = {}) {
  socket?.emit('skyjo_action', { code: props.roomCode, action, data });
}

function drawDeck()       { if (isMyTurn.value && canDrawDeck.value) emit('draw_deck'); }
function takeDiscard()    { if (isMyTurn.value && canTakeDiscard.value) emit('take_discard'); }
function discardAndFlip() { emit('discard_and_flip'); }

function cardClick(pid, idx, card) {
  if (!isMyTurn.value || card.eliminated) return;
  const p = state.value?.phase;

  if (p === 'initFlip') {
    const fp = playerOrder.value[state.value?.initFlipPlayer ?? 0];
    if (pid !== fp || pid !== myId.value) return;
    if (!card.revealed) emit('flip', { idx });
    return;
  }
  if ((p === 'hold' || p === 'lastTurn') && state.value.heldCard !== null && pid === myId.value) {
    emit('swap', { idx });
    return;
  }
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

function cardStyle(val) {
  if (val === null || val === undefined) return { background: 'var(--bg-3)', color: 'var(--text-2)' };
  if (val < 0)  return { background: '#1e40af', color: '#fff' };
  if (val === 0)return { background: '#166534', color: '#fff' };
  if (val <= 4) return { background: '#15803d', color: '#fff' };
  if (val <= 8) return { background: '#ca8a04', color: '#fff' };
  return { background: '#b91c1c', color: '#fff' };
}

onMounted(() => {
  socket = io('/', { auth: { token: auth.token, username: auth.user?.username } });
  socket.on('connect', () => { socket.emit('join_room', props.roomCode); });
  socket.on('skyjo_state', (gs) => { state.value = gs; });
  socket.on('game_over', (data) => { gameOver.value = data; });
});

onUnmounted(() => { socket?.disconnect(); });
</script>

<style scoped>
.skyjo-multi { max-width: 1100px; margin: 0 auto; padding: 1rem 1.25rem; color: var(--text); }

.game-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1rem; gap: .75rem;
}
.game-title { font-family: var(--font-title); font-size: 1.3rem; font-weight: 800; color: var(--cyan); }
.room-code-badge { font-size: .8rem; font-weight: 700; letter-spacing: .12em; background: var(--bg-3); color: var(--text-2); padding: .25rem .6rem; border-radius: 6px; }

.waiting-screen { text-align: center; padding: 4rem 1rem; color: var(--text-3); }
.spin-icon { display: inline-block; font-size: 2rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.turn-hud {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: .65rem 1rem; margin-bottom: 1rem; gap: .5rem;
}
.hud-left { display: flex; align-items: center; gap: .5rem; }
.my-turn-badge { background: var(--cyan); color: var(--bg-1); font-weight: 700; font-size: .8rem; padding: .2rem .6rem; border-radius: 20px; }
.other-turn { font-size: .9rem; display: flex; align-items: center; gap: .4rem; }
.phase-label { font-size: .82rem; color: var(--text-2); }

.ai-tag { background: #7c3aed; color: #fff; font-size: .7rem; font-weight: 700; padding: .15rem .45rem; border-radius: 10px; }

.central-zone {
  display: flex; align-items: flex-start; justify-content: center; gap: 1.5rem;
  flex-wrap: wrap; margin-bottom: 1.5rem;
}
.pile-wrap { display: flex; flex-direction: column; align-items: center; gap: .4rem; }
.pile-label { font-size: .72rem; color: var(--text-3); font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }

.pile {
  width: 70px; height: 100px; border-radius: var(--radius-sm);
  border: 2px solid var(--border); cursor: default;
  display: flex; align-items: center; justify-content: center;
  transition: box-shadow .15s, transform .15s;
}
.pile.clickable { cursor: pointer; border-color: var(--cyan); box-shadow: 0 0 0 2px var(--cyan); }
.pile.clickable:hover { transform: translateY(-3px); }
.pile-inner { display: flex; flex-direction: column; align-items: center; gap: .25rem; color: var(--text-3); font-size: .78rem; }
.pile-icon { font-size: 1.8rem; }

.card-face {
  width: 70px; height: 100px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; font-weight: 800; font-family: var(--font-title);
}
.card-back {
  width: 70px; height: 100px; border-radius: var(--radius-sm);
  background: linear-gradient(135deg, #1e3a5f 0%, #0f2040 100%);
  border: 1px solid #334;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; color: #475569;
}

.held-wrap { display: flex; flex-direction: column; align-items: center; gap: .4rem; }
.held-card { border: 2px solid var(--cyan); box-shadow: 0 0 12px color-mix(in srgb, var(--cyan) 40%, transparent); }
.held-hint { font-size: .72rem; color: var(--text-3); }
.mt-1 { margin-top: .25rem; }

/* All hands */
.all-hands { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; }

.player-hand {
  padding: 1rem; min-width: 320px; flex: 1;
  border: 2px solid transparent;
  transition: border-color .2s;
}
.hand-active { border-color: var(--cyan); }
.hand-me { background: color-mix(in srgb, var(--cyan) 5%, var(--surface)); }

.hand-header { display: flex; align-items: center; gap: .4rem; margin-bottom: .75rem; flex-wrap: wrap; }
.hand-name { font-weight: 700; font-size: .9rem; }
.hand-you { font-size: .8rem; color: var(--text-3); }
.hand-score { margin-left: auto; font-family: var(--font-title); font-size: .85rem; color: var(--cyan); font-weight: 700; }

.hand-grid { display: grid; grid-template-columns: repeat(4, 70px); gap: 6px; }

.card-slot { cursor: default; border-radius: var(--radius-sm); transition: transform .15s; }
.card-slot.clickable, .card-slot.swappable {
  cursor: pointer; outline: 2px solid var(--cyan);
  outline-offset: 2px; transform: translateY(-3px);
}
.card-slot.eliminated { opacity: .25; pointer-events: none; }
.x-mark { font-size: .9rem; opacity: .6; }

/* Game over modal */
.game-over-modal { max-width: 420px; }
.go-title { font-family: var(--font-title); font-size: 2rem; font-weight: 800; text-align: center; margin-bottom: .5rem; }
.go-winner { text-align: center; color: var(--text-2); margin-bottom: 1rem; }
.score-list { display: flex; flex-direction: column; gap: .4rem; margin-bottom: 1rem; }
.score-row { display: flex; justify-content: space-between; background: var(--bg-3); border-radius: 8px; padding: .4rem .8rem; font-size: .9rem; }
.score-name { font-weight: 600; }
.score-val { color: var(--cyan); font-family: var(--font-title); font-weight: 700; }
.mt-2 { margin-top: .5rem; width: 100%; }
</style>
