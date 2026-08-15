<template>
  <div class="fd-game">

    <!-- Header -->
    <div class="game-bar">
      <router-link to="/" class="btn btn-ghost btn-sm">← Menu</router-link>
      <span class="game-title">🗣️ Fais Deviner !</span>
      <span class="round-badge" v-if="state">{{ t('fd.round', { n: state.round }) }}</span>
      <span class="round-badge" v-if="state && state.phase === 'turn'">🃏 {{ t('fd.cards_left', { n: state.deckLeft }) }}</span>
    </div>

    <div v-if="!state" class="waiting-screen">
      <span class="spin" style="font-size:2rem">⟳</span>
      <p>{{ t('waiting_game') }}</p>
    </div>

    <template v-else>
      <!-- Scores d'équipes -->
      <div class="teams-strip">
        <div class="team-chip team-blue" :class="{ active: state.curTeam === 'blue' }">
          <span class="tc-name">{{ t('quiz.team_blue') }}</span>
          <span class="tc-members">{{ teamMembers('blue') }}</span>
          <span class="tc-score">{{ state.totals.blue }}</span>
        </div>
        <span class="teams-vs">VS</span>
        <div class="team-chip team-red" :class="{ active: state.curTeam === 'red' }">
          <span class="tc-name">{{ t('quiz.team_red') }}</span>
          <span class="tc-members">{{ teamMembers('red') }}</span>
          <span class="tc-score">{{ state.totals.red }}</span>
        </div>
      </div>

      <!-- Règle de la manche en cours -->
      <div class="rule-banner">{{ t(`fd.rule_${state.round}`) }}</div>

      <!-- ── AVANT LE TOUR ── -->
      <template v-if="state.phase === 'idle'">
        <div class="center-zone">
          <template v-if="iAmSpeaker">
            <p class="speaker-hint">{{ t('fd.speaker_you') }}</p>
            <button class="btn btn-primary btn-lg" @click="emitAction('start_turn')">{{ t('fd.start_turn') }}</button>
          </template>
          <template v-else>
            <p class="speaker-hint">{{ t('fd.speaker_is', { name: speakerName, team: curTeamLabel }) }}</p>
            <p class="text-muted">{{ t('fd.listen') }}</p>
          </template>
        </div>
      </template>

      <!-- ── PENDANT LE TOUR ── -->
      <template v-else-if="state.phase === 'turn'">
        <div class="timer-wrap">
          <div class="timer-bar" :style="{ width: timerPct + '%' }" :class="{ urgent: timeLeft <= 10 }" />
          <span class="timer-num" :class="{ urgent: timeLeft <= 10 }">{{ timeLeft }}s</span>
        </div>

        <div class="center-zone">
          <template v-if="iAmSpeaker">
            <div class="word-card">{{ cardText }}</div>
            <div class="speaker-actions">
              <button class="btn-found" @click="emitAction('found')">{{ t('fd.found') }}</button>
              <button class="btn-pass" @click="emitAction('pass')">{{ t('fd.pass') }}</button>
            </div>
          </template>
          <template v-else>
            <div class="listen-card">
              <span class="listen-emoji">👂</span>
              <p class="speaker-hint">{{ t('fd.speaker_is', { name: speakerName, team: curTeamLabel }) }}</p>
              <p class="text-muted">{{ t('fd.listen') }}</p>
            </div>
          </template>
        </div>
      </template>

      <!-- ── FIN DE MANCHE ── -->
      <template v-else-if="state.phase === 'roundEnd'">
        <div class="center-zone">
          <h2 class="round-end-title">🏁 {{ t('fd.round_end', { n: state.round }) }}</h2>
          <div class="round-scores">
            <div class="rs-row" v-for="r in state.round" :key="r">
              <span class="rs-label">{{ t('fd.round', { n: r }) }}</span>
              <span class="rs-blue">🔵 {{ state.scores.blue[r-1] }}</span>
              <span class="rs-red">🔴 {{ state.scores.red[r-1] }}</span>
            </div>
          </div>
          <p class="text-muted" style="margin-top:.6rem">{{ t(`fd.rule_${Math.min(state.round + 1, 3)}`) }}</p>
          <button v-if="mr.isHost.value" class="btn btn-primary btn-lg" @click="emitAction('next_round')">{{ t('fd.next_round') }}</button>
          <p v-else class="text-muted">{{ t('fd.waiting_host') }}</p>
        </div>
      </template>
    </template>

    <!-- Menu hamburger : règles + joueurs -->
    <ReactionBar :mr="mr" />
    <GameMenu :room="mr.room.value" :is-host="mr.isHost.value" :ai-supported="false" @kick="mr.kick" />

    <!-- Game over -->
    <PostGameModal :game-over="mr.gameOver.value" :is-host="mr.isHost.value" :my-id="myId"
      @replay="mr.choose('replay')" @lobby="mr.choose('lobby')" @home="mr.choose('home')">
      <div class="final-scores" v-if="mr.gameOver.value?.scores">
        <div class="fs-row"><span>{{ t('quiz.team_blue') }}</span><span>{{ mr.gameOver.value.scores.blue }} pts</span></div>
        <div class="fs-row"><span>{{ t('quiz.team_red') }}</span><span>{{ mr.gameOver.value.scores.red }} pts</span></div>
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
import ReactionBar from '@/components/ReactionBar.vue';
import PostGameModal from '@/components/PostGameModal.vue';
import { useMultiRoom } from '@/composables/useMultiRoom.js';
import { useI18n } from '@/composables/useI18n.js';

const props    = defineProps({ roomCode: String, game: Object });
const auth     = useAuthStore();
const platform = usePlatformStore();
const { t }    = useI18n();
const mr       = useMultiRoom(props.roomCode);

let socket = null;
let tick   = null;

const state    = ref(null);
const timeLeft = ref(0);

const myId       = computed(() => auth.user?.id);
const iAmSpeaker = computed(() => String(state.value?.speakerId) === String(myId.value));
const speakerName = computed(() => state.value?.players?.find(p => String(p.id) === String(state.value?.speakerId))?.username ?? '?');
const curTeamLabel = computed(() => state.value?.curTeam === 'blue' ? t('quiz.team_blue') : t('quiz.team_red'));
const cardText = computed(() => {
  const c = state.value?.card;
  if (!c) return '…';
  return platform.lang === 'en' ? c.en : c.fr;
});
const timerPct = computed(() => {
  if (!state.value?.turnSec) return 0;
  return Math.max(0, Math.min(100, (timeLeft.value / state.value.turnSec) * 100));
});

function teamMembers(team) {
  return (state.value?.teams?.[team] || [])
    .map(id => state.value.players.find(p => String(p.id) === String(id))?.username || '?')
    .join(', ');
}

function emitAction(action) {
  socket.emit('fd_action', { code: props.roomCode, action });
}

function startTick() {
  clearInterval(tick);
  tick = setInterval(() => {
    if (state.value?.timerEnd) {
      timeLeft.value = Math.max(0, Math.ceil((state.value.timerEnd - Date.now()) / 1000));
    }
  }, 200);
}

onMounted(() => {
  socket = io('/', { auth: { token: auth.token, username: auth.user?.username } });
  socket.on('connect', () => { socket.emit('join_room', props.roomCode); });
  socket.on('fd_state', (gs) => {
    const prevPhase = state.value?.phase;
    state.value = gs;
    if (gs.phase === 'turn' && prevPhase !== 'turn') { mr.audio.turn(); startTick(); }
    if (gs.phase !== 'turn') clearInterval(tick);
    if (gs.timerEnd) timeLeft.value = Math.max(0, Math.ceil((gs.timerEnd - Date.now()) / 1000));
  });
  socket.on('error', msg => platform.showToast(msg, 'error'));
  mr.bind(socket, { onReplay: () => { state.value = null; } });
});
onUnmounted(() => { socket?.disconnect(); clearInterval(tick); });
</script>

<style scoped>
.fd-game { flex: 1; display: flex; flex-direction: column; max-width: 900px; width: 100%; margin: 0 auto; padding-bottom: 4rem; }
.game-bar { display: flex; align-items: center; gap: .75rem; padding: .6rem 1rem; background: var(--bg-2); border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.game-title { font-weight: 800; }
.round-badge { font-size: .75rem; font-weight: 700; color: var(--text-2); background: var(--bg-3); border: 1px solid var(--border); border-radius: 6px; padding: .1rem .5rem; }
.waiting-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .6rem; color: var(--text-2); }

.teams-strip { display: flex; align-items: center; justify-content: center; gap: .8rem; padding: .7rem 1rem; flex-wrap: wrap; }
.team-chip { display: flex; align-items: center; gap: .55rem; padding: .4rem .8rem; border-radius: 12px; border: 2px solid transparent; background: var(--bg-3); font-size: .82rem; transition: all .2s; }
.team-blue { border-color: rgba(59,130,246,.45); }
.team-red  { border-color: rgba(244,63,94,.45); }
.team-chip.active { box-shadow: 0 0 14px rgba(255,255,255,.1); transform: scale(1.05); }
.tc-name { font-weight: 800; }
.tc-members { font-size: .68rem; color: var(--text-3); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tc-score { font-weight: 900; font-size: 1.1rem; color: var(--cyan); }
.teams-vs { font-weight: 900; font-size: .75rem; color: var(--text-3); }

.rule-banner { text-align: center; font-size: .88rem; font-weight: 700; color: #fbbf24; background: rgba(251,191,36,.08); border: 1px solid rgba(251,191,36,.3); border-radius: 10px; margin: .3rem 1rem; padding: .5rem .8rem; }

.center-zone { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 1.5rem 1rem; text-align: center; }
.speaker-hint { font-size: 1.05rem; font-weight: 700; }

.timer-wrap { position: relative; height: 26px; margin: .4rem 1rem; background: var(--bg-3); border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
.timer-bar { height: 100%; background: linear-gradient(90deg, var(--cyan, #06b6d4), #22c55e); transition: width .2s linear; }
.timer-bar.urgent { background: linear-gradient(90deg, #f43f5e, #f59e0b); }
.timer-num { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: .85rem; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.6); }
.timer-num.urgent { animation: urgentBlink .5s step-start infinite; }
@keyframes urgentBlink { 50% { opacity: .4; } }

.word-card { background: #fff; color: #111; font-size: clamp(1.6rem, 5vw, 2.4rem); font-weight: 900; padding: 2rem 2.5rem; border-radius: 18px; box-shadow: 0 12px 40px rgba(0,0,0,.5); min-width: min(80%, 420px); }
.speaker-actions { display: flex; gap: .8rem; }
.btn-found { background: #22c55e; border: none; color: #04130a; font-size: 1.1rem; font-weight: 800; padding: .9rem 2rem; border-radius: 12px; cursor: pointer; transition: transform .1s; }
.btn-pass  { background: var(--bg-3); border: 1px solid var(--border); color: var(--text); font-size: 1.1rem; font-weight: 800; padding: .9rem 1.6rem; border-radius: 12px; cursor: pointer; transition: transform .1s; }
.btn-found:active, .btn-pass:active { transform: scale(.94); }

.listen-card { display: flex; flex-direction: column; align-items: center; gap: .5rem; }
.listen-emoji { font-size: 3rem; animation: listenWiggle 1.5s ease-in-out infinite; }
@keyframes listenWiggle { 0%,100% { rotate: -10deg; } 50% { rotate: 10deg; } }

.round-end-title { font-size: 1.4rem; }
.round-scores { display: flex; flex-direction: column; gap: .4rem; }
.rs-row { display: flex; gap: 1rem; align-items: center; background: var(--bg-3); border: 1px solid var(--border); border-radius: 9px; padding: .4rem .9rem; font-size: .9rem; }
.rs-label { flex: 1; color: var(--text-2); font-size: .78rem; font-weight: 700; }
.rs-blue, .rs-red { font-weight: 800; }

.final-scores { display: flex; flex-direction: column; gap: .3rem; margin-top: .6rem; }
.fs-row { display: flex; justify-content: space-between; font-size: .85rem; padding: .25rem .5rem; background: var(--bg-3, #1e1e38); border-radius: 6px; }
</style>
