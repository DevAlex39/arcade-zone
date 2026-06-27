<template>
  <div class="quiz-game" :class="`mode-${gameMode}`">

    <!-- HEADER -->
    <div class="quiz-header">
      <router-link to="/" class="btn-back">← Menu</router-link>
      <div class="quiz-title">🧠 Quiz Zone</div>
      <div class="mode-badge" :class="`badge-mode${gameMode}`">
        {{ gameMode === 1 ? '⚡ Rapidité' : gameMode === 2 ? '🎭 Suspense' : '❤️ Vies' }}
      </div>
    </div>

    <!-- ── PHASE QUESTION ── -->
    <div v-if="phase === 'question'" class="question-phase">

      <!-- Barre de progression + timer -->
      <div class="progress-bar-wrap">
        <div class="progress-bar" :style="{ width: timerPct + '%' }" :class="timerClass" />
      </div>
      <div class="question-meta">
        <span class="q-counter">{{ t('quiz.question', { n: (currentQ?.idx ?? 0) + 1, total: currentQ?.total ?? '?' }) }}</span>
        <span class="q-category">{{ currentQ?.category }}</span>
        <span class="q-timer" :class="timerClass">{{ timeLeft }}s</span>
      </div>

      <!-- Question -->
      <transition name="slide-up" appear>
        <div class="question-card" :key="currentQ?.id">
          <div class="question-text">{{ currentQ?.question }}</div>

          <!-- Réponses -->
          <div class="answers-grid" :class="currentQ?.type === 'boolean' ? 'two-col' : 'four-col'">
            <button
              v-for="(ans, i) in currentQ?.answers"
              :key="i"
              class="answer-btn"
              :class="answerBtnClass(ans)"
              :disabled="myAnswer !== null"
              @click="submitAnswer(ans)"
            >
              <span class="answer-letter">{{ answerLetters[i] }}</span>
              <span class="answer-text">{{ displayAnswer(ans) }}</span>
            </button>
          </div>

          <!-- Feedback après réponse -->
          <transition name="fade">
            <div v-if="myAnswer !== null" class="answer-feedback" :class="myAnswerCorrect ? 'correct' : 'wrong'">
              {{ myAnswerCorrect ? t('quiz.correct') : t('quiz.wrong') }}
              <span v-if="!myAnswerCorrect" class="feedback-hint">{{ t('quiz.waiting') }}</span>
            </div>
          </transition>
        </div>
      </transition>

      <!-- Joueurs qui ont répondu -->
      <div class="answered-list">
        <div v-for="p in players" :key="p.id" class="answered-chip"
          :class="{ answered: answeredPlayers.has(p.id), eliminated: eliminated.includes(p.id) }">
          <span class="chip-avatar">{{ p.username[0].toUpperCase() }}</span>
          <span class="chip-name">{{ p.username }}</span>
          <span v-if="gameMode === 3" class="chip-lives">
            <span v-for="l in (lives[p.id] ?? 0)" :key="l">❤️</span>
            <span v-for="l in Math.max(0, startLives - (lives[p.id] ?? 0))" :key="'e'+l">🖤</span>
          </span>
          <span v-else-if="gameMode !== 2" class="chip-score">{{ scores[p.id] ?? 0 }} pts</span>
          <span v-if="eliminated.includes(p.id)" class="chip-elim">{{ t('quiz.eliminated') }}</span>
        </div>
      </div>
    </div>

    <!-- ── PHASE RÉSULTAT ── -->
    <div v-else-if="phase === 'result'" class="result-phase">
      <div class="result-card" :class="myAnswerCorrect ? 'correct' : 'wrong'">
        <div class="result-icon">{{ myAnswerCorrect ? '✅' : '❌' }}</div>
        <div class="result-label">{{ myAnswerCorrect ? t('quiz.correct') : t('quiz.wrong') }}</div>
        <div class="correct-answer-reveal">
          <span class="reveal-label">Bonne réponse :</span>
          <span class="reveal-value">{{ displayAnswer(correctAnswer) }}</span>
        </div>
        <div v-if="gameMode === 1 && myAnswerCorrect" class="points-earned">
          +{{ myPoints }} pts
        </div>
      </div>

      <!-- Scores (mode 1 seulement) -->
      <div v-if="gameMode === 1" class="scoreboard">
        <div v-for="p in sortedPlayers" :key="p.id" class="score-row"
          :class="{ 'my-row': p.id === myId, eliminated: eliminated.includes(p.id) }">
          <div class="score-avatar">{{ p.username[0].toUpperCase() }}</div>
          <span class="score-name">{{ p.username }}</span>
          <div class="score-bar-wrap">
            <div class="score-bar" :style="{ width: scoreBarPct(p.id) + '%' }" />
          </div>
          <span class="score-val">{{ scores[p.id] ?? 0 }} / {{ targetScore }}</span>
        </div>
      </div>

      <!-- Vies (mode 3) -->
      <div v-if="gameMode === 3" class="lives-board">
        <div v-for="p in players" :key="p.id" class="lives-row"
          :class="{ eliminated: eliminated.includes(p.id) }">
          <span class="lives-name">{{ p.username }}</span>
          <div class="hearts">
            <transition-group name="heart-pop">
              <span v-for="l in (lives[p.id] ?? 0)" :key="'h'+l" class="heart">❤️</span>
              <span v-for="l in Math.max(0, startLives - (lives[p.id] ?? 0))" :key="'he'+l" class="heart lost">🖤</span>
            </transition-group>
          </div>
        </div>
      </div>

      <div class="next-hint">{{ t('quiz.next_in', { n: nextCountdown }) }}</div>
    </div>

    <!-- ── PHASE REVEAL (mode 2 fin de partie) ── -->
    <div v-else-if="phase === 'reveal'" class="reveal-phase">
      <div class="reveal-title">{{ t('quiz.reveal_title') }}</div>
      <div class="reveal-podium">
        <transition-group name="podium-drop">
          <div v-for="(entry, i) in revealedRankings" :key="entry.id"
            class="podium-card"
            :class="{ 'my-card': entry.id === myId, [`rank-${i+1}`]: true }">
            <div class="podium-rank"># {{ rankings.findIndex(r => r.id === entry.id) + 1 }}</div>
            <div class="podium-avatar">{{ entry.username[0].toUpperCase() }}</div>
            <div class="podium-name">{{ entry.username }}</div>
            <div class="podium-score">{{ entry.score }} pts</div>
          </div>
        </transition-group>
      </div>
    </div>

    <!-- ── PHASE END ── -->
    <div v-else-if="phase === 'end'" class="end-phase">
      <div class="winner-burst">🏆</div>
      <div class="winner-title">{{ t('victory') }}</div>
      <div class="winner-name">{{ winner?.username }}</div>

      <div class="final-rankings">
        <div v-for="(entry, i) in rankings" :key="entry.id"
          class="ranking-row"
          :class="{ 'my-row': entry.id === myId }">
          <span class="rank-num">{{ ['🥇','🥈','🥉'][i] || `#${i+1}` }}</span>
          <div class="rank-avatar">{{ entry.username[0].toUpperCase() }}</div>
          <span class="rank-name">{{ entry.username }}</span>
          <span v-if="gameMode !== 3" class="rank-score">{{ entry.score }} pts</span>
          <span v-else class="rank-lives">
            <span v-if="!entry.eliminated">❤️ × {{ entry.lives }}</span>
            <span v-else class="elim-label">{{ t('quiz.eliminated') }}</span>
          </span>
        </div>
      </div>

      <router-link to="/" class="btn btn-primary">← Retour au menu</router-link>
    </div>

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

const socket   = ref(null);
const myId     = computed(() => auth.user?.id?.toString() || auth.user?.id);

// State
const phase         = ref('question');
const gameMode      = ref(1);
const currentQ      = ref(null);
const myAnswer      = ref(null);
const myAnswerCorrect = ref(false);
const myPoints      = ref(0);
const correctAnswer = ref(null);
const players       = ref([]);
const scores        = ref({});
const lives         = ref({});
const eliminated    = ref([]);
const answeredPlayers = ref(new Set());
const rankings      = ref([]);
const revealedRankings = ref([]);
const winner        = ref(null);
const targetScore   = ref(100);
const startLives    = ref(5);
const nextCountdown = ref(4);

// Timer
const timeLeft  = ref(15);
const timerPct  = ref(100);
let   timerInterval = null;

const answerLetters = ['A', 'B', 'C', 'D'];

const timerClass = computed(() => {
  if (timeLeft.value > 10) return 'green';
  if (timeLeft.value > 5)  return 'orange';
  return 'red';
});

function displayAnswer(ans) {
  if (ans === 'True')  return t('quiz.true');
  if (ans === 'False') return t('quiz.false');
  return ans;
}

function answerBtnClass(ans) {
  if (myAnswer.value === null) return '';
  if (ans === correctAnswer.value) return 'correct';
  if (ans === myAnswer.value && myAnswer.value !== correctAnswer.value) return 'wrong';
  return 'dimmed';
}

const sortedPlayers = computed(() =>
  [...players.value].sort((a, b) => (scores.value[b.id] ?? 0) - (scores.value[a.id] ?? 0))
);

function scoreBarPct(id) {
  const max = Math.max(targetScore.value, ...Object.values(scores.value));
  return Math.min(100, ((scores.value[id] ?? 0) / max) * 100);
}

function startTimer(seconds) {
  clearInterval(timerInterval);
  timeLeft.value = seconds;
  timerPct.value = 100;
  const total = seconds * 1000;
  const start = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, seconds - elapsed / 1000);
    timeLeft.value  = Math.ceil(remaining);
    timerPct.value  = (remaining / seconds) * 100;
    if (remaining <= 0) clearInterval(timerInterval);
  }, 100);
}

function startNextCountdown() {
  nextCountdown.value = 4;
  const interval = setInterval(() => {
    nextCountdown.value--;
    if (nextCountdown.value <= 0) clearInterval(interval);
  }, 1000);
}

function submitAnswer(ans) {
  if (myAnswer.value !== null) return;
  myAnswer.value = ans;
  clearInterval(timerInterval);
  socket.value?.emit('quiz_answer', { code: props.roomCode, answer: ans });
}

function connectSocket() {
  socket.value = io('/', { auth: { token: auth.token, username: auth.user?.username } });

  socket.value.on('connect', () => {
    socket.value.emit('join_room', props.roomCode);
  });

  socket.value.on('quiz_question', (data) => {
    phase.value     = 'question';
    currentQ.value  = data.question;
    myAnswer.value  = null;
    myAnswerCorrect.value = false;
    correctAnswer.value   = null;
    myPoints.value  = 0;
    answeredPlayers.value = new Set();
    if (data.scores)     scores.value    = data.scores;
    if (data.lives)      lives.value     = data.lives;
    if (data.eliminated) eliminated.value = data.eliminated;
    if (data.players)    players.value   = data.players;
    startTimer(data.question.timeLimit);
  });

  socket.value.on('quiz_player_answered', ({ playerId }) => {
    answeredPlayers.value = new Set([...answeredPlayers.value, playerId]);
  });

  socket.value.on('quiz_result', (data) => {
    phase.value     = 'result';
    correctAnswer.value = data.correctAnswer;
    scores.value    = data.scores;
    lives.value     = data.lives;
    eliminated.value = data.eliminated;
    clearInterval(timerInterval);

    const myResult = data.results[myId.value];
    if (myResult) {
      myAnswerCorrect.value = myResult.correct;
      myPoints.value = myResult.points || 0;
    }
    startNextCountdown();
  });

  socket.value.on('quiz_end', (data) => {
    rankings.value = data.rankings;
    winner.value   = data.winner;
    gameMode.value = data.mode;

    if (data.mode === 2) {
      // Animation de révélation progressive
      phase.value = 'reveal';
      revealedRankings.value = [];
      const sorted = [...data.rankings].reverse(); // du dernier au premier
      sorted.forEach((entry, i) => {
        setTimeout(() => {
          revealedRankings.value = [entry, ...revealedRankings.value];
        }, i * 1500 + 500);
      });
      // Après la révélation → écran end
      setTimeout(() => {
        phase.value = 'end';
      }, sorted.length * 1500 + 2500);
    } else {
      phase.value = 'end';
    }
  });

  socket.value.on('room_update', (data) => {
    if (data.settings) {
      gameMode.value   = data.settings.quizMode || 1;
      targetScore.value = data.settings.targetScore || 100;
      startLives.value  = data.settings.lives || 5;
    }
    if (data.players) players.value = data.players;
  });
}

onMounted(connectSocket);
onUnmounted(() => { socket.value?.disconnect(); clearInterval(timerInterval); });
</script>

<style scoped>
/* ── Layout ── */
.quiz-game {
  min-height: 100vh;
  background: var(--bg-1);
  display: flex;
  flex-direction: column;
  font-family: var(--font-body);
}

/* ── Header ── */
.quiz-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: .7rem 1.2rem;
  background: var(--bg-2);
  border-bottom: 1px solid var(--border);
}
.btn-back { color: var(--text-2); text-decoration: none; font-size: .88rem; }
.btn-back:hover { color: var(--text-1); }
.quiz-title { flex: 1; font-weight: 800; font-size: 1rem; color: var(--text-1); }
.mode-badge {
  font-size: .75rem; font-weight: 700; padding: .25rem .7rem;
  border-radius: 999px;
}
.badge-mode1 { background: rgba(251,191,36,.15); color: #fbbf24; border: 1px solid rgba(251,191,36,.3); }
.badge-mode2 { background: rgba(167,139,250,.15); color: #a78bfa; border: 1px solid rgba(167,139,250,.3); }
.badge-mode3 { background: rgba(239,68,68,.15);  color: #f87171;  border: 1px solid rgba(239,68,68,.3); }

/* ── Progress bar ── */
.progress-bar-wrap {
  height: 6px;
  background: var(--bg-3);
  width: 100%;
}
.progress-bar {
  height: 100%;
  transition: width .1s linear, background .5s;
  border-radius: 0 3px 3px 0;
}
.progress-bar.green  { background: #4ade80; }
.progress-bar.orange { background: #fb923c; }
.progress-bar.red    { background: #f87171; animation: pulse-bar .5s infinite alternate; }

@keyframes pulse-bar { from { opacity: 1; } to { opacity: .5; } }

/* ── Question phase ── */
.question-phase {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  gap: 1rem;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: .75rem;
  font-size: .82rem;
}
.q-counter { color: var(--text-2); font-weight: 700; }
.q-category {
  flex: 1;
  color: var(--cyan);
  font-weight: 600;
  font-size: .8rem;
  background: rgba(6,182,212,.1);
  padding: .2rem .6rem;
  border-radius: 999px;
}
.q-timer { font-weight: 800; font-size: 1.1rem; min-width: 2.5rem; text-align: right; }
.q-timer.green  { color: #4ade80; }
.q-timer.orange { color: #fb923c; }
.q-timer.red    { color: #f87171; animation: pulse-txt .5s infinite alternate; }
@keyframes pulse-txt { from { opacity: 1; } to { opacity: .4; } }

.question-card {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.question-text {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-1);
  line-height: 1.5;
  text-align: center;
}

/* ── Answers ── */
.answers-grid {
  display: grid;
  gap: .75rem;
}
.four-col { grid-template-columns: 1fr 1fr; }
.two-col  { grid-template-columns: 1fr 1fr; }

@media (max-width: 480px) {
  .four-col, .two-col { grid-template-columns: 1fr; }
}

.answer-btn {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .85rem 1rem;
  background: var(--bg-3);
  border: 2px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-1);
  font-size: .95rem;
  font-weight: 600;
  transition: all .15s ease;
  text-align: left;
}
.answer-btn:hover:not(:disabled) {
  border-color: var(--cyan);
  background: rgba(6,182,212,.08);
  transform: translateY(-2px);
}
.answer-btn:disabled { cursor: default; }
.answer-btn.correct {
  border-color: #4ade80;
  background: rgba(74,222,128,.12);
  color: #4ade80;
  animation: correct-pop .4s ease;
}
.answer-btn.wrong {
  border-color: #f87171;
  background: rgba(248,113,113,.12);
  color: #f87171;
  animation: wrong-shake .4s ease;
}
.answer-btn.dimmed { opacity: .4; }

@keyframes correct-pop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.04); }
  100% { transform: scale(1); }
}
@keyframes wrong-shake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-6px); }
  75%      { transform: translateX(6px); }
}

.answer-letter {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-1);
  border-radius: 8px;
  font-size: .8rem;
  font-weight: 800;
  flex-shrink: 0;
}
.answer-text { flex: 1; }

/* ── Feedback ── */
.answer-feedback {
  text-align: center;
  font-weight: 800;
  font-size: 1.1rem;
  padding: .75rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: .25rem;
}
.answer-feedback.correct { background: rgba(74,222,128,.1); color: #4ade80; }
.answer-feedback.wrong   { background: rgba(248,113,113,.1); color: #f87171; }
.feedback-hint { font-size: .8rem; font-weight: 500; opacity: .7; }

/* ── Answered chips ── */
.answered-list {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
}
.answered-chip {
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .35rem .7rem;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: .8rem;
  transition: all .3s ease;
}
.answered-chip.answered {
  border-color: var(--cyan);
  background: rgba(6,182,212,.1);
}
.answered-chip.eliminated {
  opacity: .4;
  text-decoration: line-through;
}
.chip-avatar {
  width: 22px; height: 22px;
  background: var(--cyan);
  color: #000;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .7rem; font-weight: 800;
}
.chip-score { color: var(--cyan); font-weight: 700; }
.chip-lives { display: flex; gap: 1px; font-size: .75rem; }
.chip-elim  { color: #f87171; font-size: .7rem; }

/* ── Result phase ── */
.result-phase {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  gap: 1.5rem;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
}

.result-card {
  width: 100%;
  padding: 2rem;
  border-radius: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: .75rem;
  animation: result-in .5s ease;
}
.result-card.correct { background: rgba(74,222,128,.1); border: 2px solid rgba(74,222,128,.3); }
.result-card.wrong   { background: rgba(248,113,113,.1); border: 2px solid rgba(248,113,113,.3); }
@keyframes result-in { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }

.result-icon  { font-size: 3rem; }
.result-label { font-size: 1.4rem; font-weight: 800; }
.correct-answer-reveal { display: flex; flex-direction: column; gap: .2rem; }
.reveal-label { font-size: .8rem; opacity: .7; }
.reveal-value { font-size: 1.1rem; font-weight: 700; }
.points-earned { font-size: 1.8rem; font-weight: 900; color: #fbbf24; animation: points-pop .4s ease; }
@keyframes points-pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.scoreboard {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: .5rem;
}
.score-row {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .6rem .9rem;
  background: var(--bg-2);
  border-radius: 10px;
  border: 1px solid var(--border);
  transition: all .3s;
}
.score-row.my-row { border-color: var(--cyan); }
.score-avatar {
  width: 32px; height: 32px;
  background: var(--cyan); color: #000;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800;
}
.score-name { min-width: 80px; font-weight: 600; }
.score-bar-wrap { flex: 1; height: 8px; background: var(--bg-3); border-radius: 4px; overflow: hidden; }
.score-bar { height: 100%; background: var(--cyan); border-radius: 4px; transition: width .6s ease; }
.score-val { font-weight: 700; font-size: .88rem; min-width: 60px; text-align: right; }

.lives-board {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: .6rem;
}
.lives-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: .6rem 1rem;
  background: var(--bg-2);
  border-radius: 10px;
}
.lives-row.eliminated { opacity: .4; }
.lives-name { min-width: 80px; font-weight: 600; }
.hearts { display: flex; gap: 2px; flex-wrap: wrap; }
.heart { font-size: 1.2rem; }
.heart.lost { filter: grayscale(1); opacity: .4; }

.heart-pop-enter-active { transition: all .3s ease; }
.heart-pop-leave-active { transition: all .3s ease; }
.heart-pop-enter-from  { transform: scale(0); opacity: 0; }
.heart-pop-leave-to    { transform: scale(2); opacity: 0; }

.next-hint {
  color: var(--text-2);
  font-size: .88rem;
  font-weight: 600;
}

/* ── Reveal phase (mode 2) ── */
.reveal-phase {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  gap: 2rem;
  background: radial-gradient(ellipse at center, rgba(139,92,246,.15) 0%, transparent 70%);
}
.reveal-title {
  font-size: 2rem;
  font-weight: 900;
  color: var(--text-1);
  text-align: center;
  animation: glow-pulse 2s infinite alternate;
}
@keyframes glow-pulse {
  from { text-shadow: 0 0 10px rgba(167,139,250,.5); }
  to   { text-shadow: 0 0 30px rgba(167,139,250,.9), 0 0 60px rgba(167,139,250,.4); }
}

.reveal-podium {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}
.podium-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--bg-2);
  border-radius: 14px;
  border: 1px solid var(--border);
}
.podium-card.rank-1 {
  border-color: #fbbf24;
  background: rgba(251,191,36,.08);
  box-shadow: 0 0 20px rgba(251,191,36,.2);
}
.podium-card.my-card { border-color: var(--cyan); }
.podium-rank { font-size: 1.5rem; font-weight: 900; min-width: 2rem; }
.podium-avatar {
  width: 42px; height: 42px;
  background: var(--cyan); color: #000;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; font-weight: 800;
}
.podium-name  { flex: 1; font-weight: 700; font-size: 1.05rem; }
.podium-score { font-weight: 800; color: #fbbf24; font-size: 1.1rem; }

.podium-drop-enter-active {
  animation: podium-in .6s cubic-bezier(.34,1.56,.64,1);
}
@keyframes podium-in {
  from { opacity: 0; transform: translateY(-40px) scale(.8); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── End phase ── */
.end-phase {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  gap: 1.5rem;
}
.winner-burst {
  font-size: 5rem;
  animation: trophy-bounce 1s ease infinite alternate;
}
@keyframes trophy-bounce {
  from { transform: translateY(0) rotate(-5deg); }
  to   { transform: translateY(-12px) rotate(5deg); }
}
.winner-title { font-size: 2rem; font-weight: 900; color: #fbbf24; }
.winner-name  { font-size: 1.5rem; font-weight: 700; color: var(--text-1); }

.final-rankings {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: .5rem;
}
.ranking-row {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .7rem 1rem;
  background: var(--bg-2);
  border-radius: 12px;
  border: 1px solid var(--border);
  animation: rank-in .4s ease both;
}
.ranking-row.my-row { border-color: var(--cyan); background: rgba(6,182,212,.05); }
@keyframes rank-in {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
.rank-num { font-size: 1.3rem; min-width: 2rem; }
.rank-avatar {
  width: 36px; height: 36px;
  background: var(--cyan); color: #000;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800;
}
.rank-name  { flex: 1; font-weight: 600; }
.rank-score { font-weight: 800; color: #fbbf24; }
.rank-lives { font-weight: 700; }
.elim-label { color: #f87171; font-size: .85rem; }

/* ── Transitions ── */
.slide-up-enter-active { transition: all .4s cubic-bezier(.34,1.56,.64,1); }
.slide-up-enter-from   { opacity: 0; transform: translateY(30px) scale(.95); }
.fade-enter-active, .fade-leave-active { transition: opacity .3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
