<template>
  <div class="oj-game">

    <!-- Header -->
    <div class="game-bar">
      <router-link to="/" class="btn btn-ghost btn-sm">← Menu</router-link>
      <span class="game-title">😈 Oser Jouer</span>
      <span class="round-badge" v-if="state">{{ t('oj.round', { n: state.roundIdx }) }}</span>
      <span class="target-badge" v-if="state">🎯 {{ state.targetScore }} pts</span>
    </div>

    <div v-if="!state" class="waiting-screen">
      <span class="spin" style="font-size:2rem">⟳</span>
      <p>{{ t('waiting_game') }}</p>
    </div>

    <template v-else>
      <!-- Scores -->
      <div class="scores-strip">
        <div v-for="p in state.players" :key="p.id" class="score-chip"
          :class="{ me: p.id === myId, master: p.id === state.masterId, winner: isRoundWinner(p.id) && (state.phase === 'reveal' || state.phase === 'end') }">
          <span v-if="p.id === state.masterId" class="crown">👑</span>
          <span class="sc-name">{{ p.username }}</span>
          <span class="sc-pts">{{ state.scores[p.id] ?? 0 }}</span>
        </div>
      </div>

      <!-- Phrase à trous -->
      <div class="prompt-card">
        <div class="prompt-text" v-html="promptDisplay"></div>
        <div class="prompt-sub">
          <span v-if="state.mode === 'master' && iAmMaster">{{ t('oj.you_are_master') }}</span>
          <span v-else-if="state.mode === 'master'">{{ t('oj.master_is', { name: masterName }) }}</span>
        </div>
      </div>

      <!-- ── PHASE SUBMIT ── -->
      <template v-if="state.phase === 'submit'">
        <div class="phase-hint">
          <template v-if="canSubmit && !hasSubmitted">{{ t('oj.pick_cards', { n: state.prompt?.blanks || 1 }) }}</template>
          <template v-else-if="hasSubmitted">{{ t('oj.submitted') }}</template>
          <template v-else>{{ t('oj.waiting_subs', { n: state.submittedIds.length, total: submittersCount }) }}</template>
        </div>

        <div v-if="canSubmit && !hasSubmitted" class="my-hand">
          <div class="hand-label">{{ t('oj.hand') }}</div>
          <div class="hand-grid">
            <button v-for="c in state.myHand" :key="c.id" class="answer-card"
              :class="{ selected: selected.includes(c.id) }" @click="toggleCard(c.id)">
              <span v-if="selected.includes(c.id)" class="sel-num">{{ selected.indexOf(c.id) + 1 }}</span>
              {{ cardText(c) }}
            </button>
          </div>
          <button class="btn btn-primary btn-lg validate-btn" :disabled="selected.length !== (state.prompt?.blanks || 1)" @click="submitCards">
            {{ t('oj.validate') }}
          </button>
        </div>

        <div v-else class="waiting-panel">
          <div class="sub-progress">
            <div v-for="pid in submitterIds" :key="pid" class="sub-chip" :class="{ done: state.submittedIds.includes(pid) }">
              {{ playerName(pid) }} {{ state.submittedIds.includes(pid) ? '✅' : '⏳' }}
            </div>
          </div>
        </div>
      </template>

      <!-- ── PHASE JUDGE / VOTE ── -->
      <template v-else-if="state.phase === 'judge' || state.phase === 'vote'">
        <div class="phase-hint">
          <template v-if="state.phase === 'judge'">{{ iAmMaster ? t('oj.judge_pick') : t('oj.judge_waiting') }}</template>
          <template v-else>{{ hasVoted ? t('oj.voted') : t('oj.vote_pick') }}</template>
        </div>

        <div class="submissions-grid">
          <button v-for="sub in state.submissions" :key="sub.key" class="submission-card"
            :class="{ clickable: canPick(sub), mine: isMine(sub) }"
            :disabled="!canPick(sub)"
            @click="pick(sub)">
            <div class="sub-cards">
              <div v-for="(c, i) in sub.cards" :key="i" class="sub-card-text">{{ cardText(c) }}</div>
            </div>
            <div v-if="isMine(sub)" class="mine-tag">{{ t('oj.your_card') }}</div>
          </button>
        </div>
      </template>

      <!-- ── PHASE REVEAL ── -->
      <template v-else-if="state.phase === 'reveal' || state.phase === 'end'">
        <div class="phase-hint reveal-hint">
          <span v-for="w in state.roundWinners" :key="w">{{ t('oj.point_to', { name: playerName(w) }) }}</span>
        </div>

        <div class="submissions-grid">
          <div v-for="(sub, i) in state.submissions" :key="sub.key" class="submission-card revealed"
            :class="{ winner: isRoundWinner(sub.pid) }"
            :style="{ animationDelay: `${i * 0.45}s` }">
            <div class="sub-cards">
              <div v-for="(c, j) in sub.cards" :key="j" class="sub-card-text">{{ cardText(c) }}</div>
            </div>
            <div class="author-tag">
              {{ playerName(sub.pid) }}
              <span v-if="voteCount(sub.pid)" class="vote-count">🗳️ {{ voteCount(sub.pid) }}</span>
              <span v-if="isRoundWinner(sub.pid)">🏆</span>
            </div>
          </div>
        </div>

        <div v-if="state.phase === 'reveal'" class="next-wrap">
          <button v-if="canAdvance" class="btn btn-primary btn-lg" @click="nextRound">{{ t('oj.next_round') }}</button>
          <p v-else class="text-muted">{{ t('oj.waiting_next') }}</p>
        </div>
      </template>
    </template>

    <!-- Menu hamburger : règles + joueurs -->
    <GameMenu :room="mr.room.value" :is-host="mr.isHost.value" :ai-supported="false" @kick="mr.kick" />

    <!-- Game over -->
    <PostGameModal :game-over="mr.gameOver.value" :is-host="mr.isHost.value" :my-id="myId"
      @replay="mr.choose('replay')" @lobby="mr.choose('lobby')" @home="mr.choose('home')">
      <div class="final-scores" v-if="mr.gameOver.value?.scores">
        <div v-for="(sc, pid) in mr.gameOver.value.scores" :key="pid" class="fs-row">
          <span>{{ playerName(pid) }}</span><span>{{ sc }} pts</span>
        </div>
      </div>
    </PostGameModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.js';
import { usePlatformStore } from '@/stores/platform.js';
import GameMenu from '@/components/GameMenu.vue';
import PostGameModal from '@/components/PostGameModal.vue';
import { useMultiRoom } from '@/composables/useMultiRoom.js';
import { useI18n } from '@/composables/useI18n.js';

const props    = defineProps({ roomCode: String, game: Object });
const auth     = useAuthStore();
const platform = usePlatformStore();
const { t }    = useI18n();
const mr       = useMultiRoom(props.roomCode);

let socket = null;

const state          = ref(null);
const selected       = ref([]);      // ids des cartes sélectionnées (ordre = ordre des trous)
const mySubmittedIds = ref([]);      // pour reconnaître ma soumission en phase vote

const myId       = computed(() => auth.user?.id);
const iAmMaster  = computed(() => state.value?.masterId === myId.value);
const masterName = computed(() => playerName(state.value?.masterId));
const canSubmit  = computed(() => state.value?.mode === 'vote' || !iAmMaster.value);
const hasSubmitted = computed(() => state.value?.submittedIds?.includes(String(myId.value)) || state.value?.submittedIds?.includes(myId.value));
const hasVoted     = computed(() => state.value?.votedIds?.includes(String(myId.value)) || state.value?.votedIds?.includes(myId.value));

const submitterIds = computed(() => {
  if (!state.value) return [];
  const ids = state.value.players.map(p => p.id);
  return state.value.mode === 'master' ? ids.filter(id => id !== state.value.masterId) : ids;
});
const submittersCount = computed(() => submitterIds.value.length);

const canAdvance = computed(() => {
  if (!state.value) return false;
  return state.value.mode === 'master' ? iAmMaster.value : mr.isHost.value;
});

function cardText(c) { return platform.lang === 'en' ? c.en : c.fr; }

function isRoundWinner(pid) {
  return (state.value?.roundWinners || []).some(w => String(w) === String(pid));
}

function voteCount(pid) {
  return Object.values(state.value?.votes || {}).filter(t => String(t) === String(pid)).length;
}

function playerName(pid) {
  return state.value?.players?.find(p => String(p.id) === String(pid))?.username
    ?? mr.room.value?.players?.find(p => String(p.id) === String(pid))?.username ?? '?';
}

// Phrase avec les trous remplis par la sélection en cours (aperçu)
const promptDisplay = computed(() => {
  const p = state.value?.prompt;
  if (!p) return '';
  let text = platform.lang === 'en' ? p.en : p.fr;
  const cards = selected.value.map(id => state.value.myHand.find(c => c.id === id)).filter(Boolean);
  let i = 0;
  text = text.replace(/___/g, () => {
    const c = cards[i++];
    return c ? `<span class="blank filled">${cardText(c)}</span>` : '<span class="blank">______</span>';
  });
  return text;
});

function toggleCard(id) {
  if (selected.value.includes(id)) selected.value = selected.value.filter(x => x !== id);
  else if (selected.value.length < (state.value?.prompt?.blanks || 1)) selected.value = [...selected.value, id];
}

function submitCards() {
  if (selected.value.length !== (state.value?.prompt?.blanks || 1)) return;
  mySubmittedIds.value = [...selected.value];
  socket.emit('oj_action', { code: props.roomCode, action: 'submit', data: { cardIds: selected.value } });
  selected.value = [];
}

function isMine(sub) {
  return sub.cards.some(c => mySubmittedIds.value.includes(c.id));
}

function canPick(sub) {
  if (!state.value) return false;
  if (state.value.phase === 'judge') return iAmMaster.value;
  if (state.value.phase === 'vote')  return !hasVoted.value && !isMine(sub);
  return false;
}

function pick(sub) {
  if (!canPick(sub)) return;
  if (state.value.phase === 'judge') {
    // Le serveur identifie la soumission par son auteur : on envoie la clé anonyme,
    // il retrouve le pid via submitOrder — ici on envoie l'index anonymisé
    socket.emit('oj_action', { code: props.roomCode, action: 'judge_pick', data: { winnerKey: sub.key } });
  } else {
    socket.emit('oj_action', { code: props.roomCode, action: 'vote', data: { targetKey: sub.key } });
  }
}

function nextRound() {
  socket.emit('oj_action', { code: props.roomCode, action: 'next_round' });
}

onMounted(() => {
  socket = io('/', { auth: { token: auth.token, username: auth.user?.username } });
  socket.on('connect', () => { socket.emit('join_room', props.roomCode); });
  socket.on('oj_state', (gs) => {
    const prevRound = state.value?.roundIdx;
    state.value = gs;
    if (gs.roundIdx !== prevRound) { selected.value = []; mySubmittedIds.value = []; }
  });
  socket.on('error', msg => platform.showToast(msg, 'error'));
  mr.bind(socket, { onReplay: () => { state.value = null; selected.value = []; mySubmittedIds.value = []; } });
});
onUnmounted(() => socket?.disconnect());
</script>

<style scoped>
.oj-game { flex: 1; display: flex; flex-direction: column; max-width: 980px; width: 100%; margin: 0 auto; padding-bottom: 2rem; }
.game-bar { display: flex; align-items: center; gap: .75rem; padding: .6rem 1rem; background: var(--bg-2); border-bottom: 1px solid var(--border); }
.game-title { font-weight: 800; }
.round-badge, .target-badge { font-size: .75rem; font-weight: 700; color: var(--text-2); background: var(--bg-3); border: 1px solid var(--border); border-radius: 6px; padding: .1rem .5rem; }
.waiting-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .6rem; color: var(--text-2); }

.scores-strip { display: flex; flex-wrap: wrap; gap: .45rem; padding: .7rem 1rem; }
.score-chip { display: flex; align-items: center; gap: .35rem; background: var(--bg-3); border: 1px solid var(--border); border-radius: 999px; padding: .25rem .7rem; font-size: .78rem; transition: all .2s; }
.score-chip.me { border-color: var(--cyan); }
.score-chip.master { border-color: #f59e0b; background: rgba(245,158,11,.08); }
.score-chip.winner { border-color: #4ade80; background: rgba(74,222,128,.1); transform: scale(1.05); }
.sc-name { font-weight: 700; }
.sc-pts { font-weight: 800; color: var(--cyan); }

.prompt-card { margin: .5rem 1rem; background: var(--bg-2); border: 1px solid var(--border); border-radius: 14px; padding: 1.3rem 1.5rem; text-align: center; }
.prompt-text { font-size: 1.25rem; font-weight: 700; line-height: 1.6; }
.prompt-text :deep(.blank) { color: var(--text-3); border-bottom: 2px dashed var(--text-3); padding: 0 .3rem; }
.prompt-text :deep(.blank.filled) { color: var(--cyan); border-bottom-color: var(--cyan); font-style: italic; }
.prompt-sub { margin-top: .55rem; font-size: .82rem; color: #f59e0b; font-weight: 700; }

.phase-hint { text-align: center; font-size: .9rem; color: var(--text-2); padding: .5rem 1rem; }
.reveal-hint { display: flex; flex-direction: column; gap: .2rem; color: #4ade80; font-weight: 800; font-size: 1rem; }

.my-hand { padding: 0 1rem; display: flex; flex-direction: column; gap: .7rem; align-items: center; }
.hand-label { font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--text-2); align-self: flex-start; }
.hand-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: .6rem; width: 100%; }
.answer-card { position: relative; background: #fff; color: #111; border: 2px solid transparent; border-radius: 12px; padding: .9rem .8rem; font-size: .85rem; font-weight: 700; line-height: 1.35; text-align: left; cursor: pointer; min-height: 84px; transition: all .15s; box-shadow: 0 4px 14px rgba(0,0,0,.35); }
.answer-card:hover { transform: translateY(-3px); }
.answer-card.selected { border-color: var(--cyan); box-shadow: 0 0 0 3px color-mix(in srgb, var(--cyan) 35%, transparent); }
.sel-num { position: absolute; top: -8px; right: -8px; width: 22px; height: 22px; border-radius: 50%; background: var(--cyan); color: #04131a; font-size: .72rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.validate-btn { min-width: 240px; }

.waiting-panel { padding: 1rem; }
.sub-progress { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; }
.sub-chip { background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px; padding: .35rem .7rem; font-size: .8rem; opacity: .6; }
.sub-chip.done { opacity: 1; border-color: #4ade80; }

.submissions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .7rem; padding: .5rem 1rem; }
.submission-card { background: #fff; color: #111; border: 2px solid transparent; border-radius: 12px; padding: 1rem .9rem; text-align: left; min-height: 96px; display: flex; flex-direction: column; justify-content: space-between; gap: .5rem; box-shadow: 0 4px 14px rgba(0,0,0,.35); font: inherit; }
.submission-card.clickable { cursor: pointer; transition: all .15s; }
.submission-card.clickable:hover { transform: translateY(-3px); border-color: var(--cyan); }
.submission-card:disabled { cursor: default; }
.submission-card.mine { border-color: #f59e0b; }
.submission-card.revealed { animation: cardReveal .5s ease backwards; }
.submission-card.winner { border-color: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,.35), 0 4px 14px rgba(0,0,0,.35); }
@keyframes cardReveal { from { opacity: 0; transform: rotateY(90deg); } to { opacity: 1; transform: none; } }
.sub-cards { display: flex; flex-direction: column; gap: .4rem; }
.sub-card-text { font-size: .85rem; font-weight: 700; line-height: 1.35; }
.sub-card-text + .sub-card-text { border-top: 1px dashed #ccc; padding-top: .4rem; }
.mine-tag { font-size: .68rem; font-weight: 800; color: #b45309; text-transform: uppercase; }
.author-tag { font-size: .74rem; font-weight: 800; color: #555; display: flex; align-items: center; gap: .35rem; }
.vote-count { color: #2563eb; }

.next-wrap { text-align: center; padding: 1rem; }
.final-scores { display: flex; flex-direction: column; gap: .3rem; margin-top: .6rem; }
.fs-row { display: flex; justify-content: space-between; font-size: .85rem; padding: .25rem .5rem; background: var(--bg-3, #1e1e38); border-radius: 6px; }
</style>
