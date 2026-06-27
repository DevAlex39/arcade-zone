<template>
  <div class="quiz-solo">

    <!-- ── CONFIG ── -->
    <div v-if="phase === 'config'" class="config-screen">
      <div class="config-card">
        <div class="config-icon">🧠</div>
        <h1 class="config-title">Quiz Zone — Solo</h1>
        <p class="config-subtitle">Mode Vies · Réponds juste pour rester en vie !</p>

        <div class="config-fields">
          <div class="field-group">
            <label>Langue des questions</label>
            <div class="count-row">
              <button class="btn-chip" :class="{ active: cfg.lang === 'fr' }" @click="cfg.lang = 'fr'">🇫🇷 Français</button>
              <button class="btn-chip" :class="{ active: cfg.lang === 'en' }" @click="cfg.lang = 'en'">🇬🇧 English</button>
            </div>
          </div>

          <div class="field-group">
            <label>Vies de départ</label>
            <div class="lives-picker">
              <button class="btn-icon" @click="cfg.lives = Math.max(1, cfg.lives - 1)">−</button>
              <span class="lives-val">
                <span v-for="i in cfg.lives" :key="i">❤️</span>
              </span>
              <button class="btn-icon" @click="cfg.lives = Math.min(10, cfg.lives + 1)">+</button>
            </div>
          </div>

          <div class="field-group">
            <label>Nombre de questions</label>
            <div class="count-row">
              <button v-for="n in [10,20,30,50]" :key="n"
                class="btn-chip" :class="{ active: cfg.count === n }"
                @click="cfg.count = n">{{ n }}</button>
            </div>
          </div>

          <div class="field-group">
            <label>Temps par question</label>
            <div class="count-row">
              <button v-for="s in [10,15,20,30]" :key="s"
                class="btn-chip" :class="{ active: cfg.timer === s }"
                @click="cfg.timer = s">{{ s }}s</button>
            </div>
          </div>

          <div class="field-group">
            <label>Difficulté</label>
            <div class="count-row">
              <button v-for="d in difficulties" :key="d.v"
                class="btn-chip" :class="{ active: cfg.difficulty === d.v }"
                @click="cfg.difficulty = d.v">{{ d.l }}</button>
            </div>
          </div>

          <div class="field-group">
            <label>Types de questions</label>
            <div class="count-row">
              <button v-for="tp in qtypes" :key="tp.v"
                class="btn-chip" :class="{ active: cfg.types === tp.v }"
                @click="cfg.types = tp.v">{{ tp.l }}</button>
            </div>
          </div>

          <div class="field-group">
            <label>Catégories <span class="hint">(vide = toutes)</span></label>
            <div class="cat-grid">
              <button v-for="cat in categories" :key="cat.id"
                class="btn-cat" :class="{ active: cfg.categories.includes(cat.id) }"
                @click="toggleCat(cat.id)">
                {{ cat.icon }} {{ cat.name_fr }}
              </button>
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-start" @click="startGame" :disabled="loading">
          {{ loading ? 'Chargement…' : '▶ Lancer la partie' }}
        </button>
        <router-link to="/" class="btn btn-ghost btn-sm mt-2">← Menu</router-link>
      </div>
    </div>

    <!-- ── JEU ── -->
    <template v-else-if="phase === 'playing' || phase === 'result_q'">

      <div class="quiz-header">
        <router-link to="/" class="btn-back">← Menu</router-link>
        <span class="q-counter">{{ qIdx + 1 }} / {{ questions.length }}</span>
        <div class="lives-display">
          <transition-group name="heart-pop">
            <span v-for="l in livesLeft" :key="'h'+l" class="heart">❤️</span>
            <span v-for="l in (cfg.lives - livesLeft)" :key="'e'+l" class="heart lost">🖤</span>
          </transition-group>
        </div>
      </div>

      <!-- Timer bar -->
      <div class="progress-bar-wrap">
        <div class="progress-bar" :style="{ width: timerPct + '%' }" :class="timerClass" />
      </div>

      <div class="game-body">
        <div class="question-meta">
          <span class="q-category">{{ currentQ?.category_icon }} {{ currentQ?.category_name }}</span>
          <span class="q-diff" :class="currentQ?.difficulty">{{ diffLabel(currentQ?.difficulty) }}</span>
          <span class="q-timer" :class="timerClass">{{ timeLeft }}s</span>
        </div>

        <transition name="slide-up" appear>
          <div class="question-card" :key="qIdx">
            <div class="question-text">{{ currentQ?.question }}</div>

            <div class="answers-grid" :class="currentQ?.type === 'boolean' ? 'two-col' : 'four-col'">
              <button
                v-for="(ans, i) in shuffledAnswers"
                :key="i"
                class="answer-btn"
                :class="answerClass(ans)"
                :disabled="myAnswer !== null"
                @click="pickAnswer(ans)"
              >
                <span class="answer-letter">{{ answerLetters[i] }}</span>
                <span class="answer-text">{{ displayAnswer(ans) }}</span>
              </button>
            </div>

            <!-- Feedback inter-question -->
            <transition name="fade">
              <div v-if="phase === 'result_q'" class="answer-feedback" :class="lastCorrect ? 'correct' : 'wrong'">
                <span class="fb-icon">{{ lastCorrect ? '✅' : (myAnswer ? '❌' : '⏰') }}</span>
                <span class="fb-text">
                  {{ lastCorrect ? 'Bonne réponse !' : (myAnswer ? 'Mauvaise réponse' : 'Temps écoulé !') }}
                </span>
                <span v-if="!lastCorrect" class="fb-lives">
                  {{ livesLeft > 0 ? `Il te reste ${livesLeft} vie${livesLeft > 1 ? 's' : ''}` : '💀 Plus de vies !' }}
                </span>
              </div>
            </transition>
          </div>
        </transition>

        <!-- Score courant -->
        <div class="live-score">
          <span class="score-chip">✅ {{ correctCount }} bonne{{ correctCount > 1 ? 's' : '' }}</span>
          <span class="score-chip grey">❌ {{ qIdx - correctCount + (phase === 'result_q' ? 0 : 0) }} fausse{{ (qIdx - correctCount) > 1 ? 's' : '' }}</span>
        </div>
      </div>
    </template>

    <!-- ── RÉSULTATS ── -->
    <div v-else-if="phase === 'end'" class="end-screen">
      <div class="end-header">
        <div class="end-icon">{{ livesLeft > 0 ? '🏁' : '💀' }}</div>
        <div class="end-title">{{ livesLeft > 0 ? 'Partie terminée !' : 'Game Over !' }}</div>
      </div>

      <div class="final-score-card">
        <div class="fs-main">
          <span class="fs-num">{{ correctCount }}</span>
          <span class="fs-sep">/</span>
          <span class="fs-total">{{ questions.length }}</span>
        </div>
        <div class="fs-pct">{{ pct }}% de bonnes réponses</div>
        <div class="fs-lives">
          <span v-for="l in livesLeft" :key="l">❤️</span>
          <span v-for="l in (cfg.lives - livesLeft)" :key="'e'+l" class="lost-heart">🖤</span>
          <span class="lives-label">{{ livesLeft }} vie{{ livesLeft > 1 ? 's' : '' }} restante{{ livesLeft > 1 ? 's' : '' }}</span>
        </div>
      </div>

      <!-- Classement compétitif -->
      <div class="leaderboard" v-if="leaderboard.length">
        <div class="lb-title">🏆 Classement — {{ cfg.lives }} vies de départ</div>

        <!-- Groupe de ma performance -->
        <div class="lb-my-rank" v-if="myRankInfo">
          <span class="rank-badge">{{ myRankInfo.rank }}</span>
          <span class="rank-txt">
            {{ myRankInfo.better }} joueur{{ myRankInfo.better > 1 ? 's' : '' }} ont fait mieux que toi
          </span>
        </div>

        <!-- Top par vies restantes -->
        <div class="lb-groups">
          <div v-for="group in lbGroups" :key="group.lives" class="lb-group">
            <div class="lb-group-header">
              <span v-for="l in group.lives" :key="l">❤️</span>
              <span v-if="group.lives === 0" class="no-lives">💀</span>
              <span class="group-label">{{ group.lives }} vie{{ group.lives > 1 ? 's' : '' }} restante{{ group.lives > 1 ? 's' : '' }}</span>
              <span class="group-count">{{ group.entries.length }} joueur{{ group.entries.length > 1 ? 's' : '' }}</span>
            </div>
            <div v-for="(entry, i) in group.entries.slice(0, 5)" :key="i"
              class="lb-row" :class="{ 'my-row': isMyEntry(entry) }">
              <span class="lb-pos">{{ i + 1 }}</span>
              <span class="lb-name">{{ entry.username }}</span>
              <span class="lb-score">{{ entry.correct }}/{{ entry.total }} <span class="lb-pct">({{ entry.pct }}%)</span></span>
            </div>
            <div v-if="group.entries.length > 5" class="lb-more">
              + {{ group.entries.length - 5 }} autres
            </div>
          </div>
        </div>
      </div>

      <div class="end-actions">
        <button class="btn btn-primary" @click="restart">↺ Rejouer</button>
        <router-link to="/" class="btn btn-ghost">← Menu</router-link>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';

const auth = useAuthStore();

// ── Config ──────────────────────────────────────────────────────────────────
const cfg = reactive({ lang: 'fr', lives: 5, count: 20, timer: 15, difficulty: 'mixed', types: 'both', categories: [] });
const difficulties = [
  { v: 'mixed', l: 'Mixte' }, { v: 'easy', l: 'Facile' },
  { v: 'medium', l: 'Moyen' }, { v: 'hard', l: 'Difficile' },
];
const qtypes = [
  { v: 'both', l: 'Les deux' }, { v: 'multiple', l: 'QCM' }, { v: 'boolean', l: 'Vrai/Faux' },
];
const categories = ref([]);
const loading    = ref(false);

// ── Game state ──────────────────────────────────────────────────────────────
const phase         = ref('config');
const questions     = ref([]);
const qIdx          = ref(0);
const myAnswer      = ref(null);
const lastCorrect   = ref(false);
const livesLeft     = ref(5);
const correctCount  = ref(0);
const shuffledAnswers = ref([]);
const leaderboard   = ref([]);
const myEntryId     = ref(null);

const answerLetters = ['A', 'B', 'C', 'D'];

// ── Timer ───────────────────────────────────────────────────────────────────
const timeLeft  = ref(15);
const timerPct  = ref(100);
let   timerInterval = null;

const timerClass = computed(() => {
  if (timeLeft.value > cfg.timer * 0.6) return 'green';
  if (timeLeft.value > cfg.timer * 0.3) return 'orange';
  return 'red';
});

const currentQ = computed(() => questions.value[qIdx.value] || null);
const pct      = computed(() => questions.value.length ? Math.round(correctCount.value / questions.value.length * 100) : 0);

function displayAnswer(ans) {
  if (ans === 'True')  return 'Vrai';
  if (ans === 'False') return 'Faux';
  return ans;
}

function diffLabel(d) {
  return { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' }[d] || d;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function answerClass(ans) {
  if (phase.value !== 'result_q') return '';
  if (ans === currentQ.value?.correct_answer) return 'correct';
  if (ans === myAnswer.value && myAnswer.value !== currentQ.value?.correct_answer) return 'wrong';
  return 'dimmed';
}

function toggleCat(id) {
  const idx = cfg.categories.indexOf(id);
  if (idx >= 0) cfg.categories.splice(idx, 1);
  else cfg.categories.push(id);
}

function prepareAnswers(q) {
  if (!q) return;
  const incorrect = JSON.parse(q.incorrect_answers || '[]');
  if (q.type === 'boolean') {
    shuffledAnswers.value = ['True', 'False'];
  } else {
    shuffledAnswers.value = shuffle([q.correct_answer, ...incorrect]);
  }
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft.value = cfg.timer;
  timerPct.value = 100;
  const start = Date.now();
  timerInterval = setInterval(() => {
    const elapsed   = Date.now() - start;
    const remaining = Math.max(0, cfg.timer - elapsed / 1000);
    timeLeft.value  = Math.ceil(remaining);
    timerPct.value  = (remaining / cfg.timer) * 100;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      pickAnswer(null); // timeout
    }
  }, 100);
}

async function startGame() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      count:      cfg.count,
      difficulty: cfg.difficulty,
      types:      cfg.types,
      lang:       cfg.lang,
    });
    if (cfg.categories.length) params.set('categories', cfg.categories.join(','));

    const res  = await fetch(`/api/quiz/questions?${params}`);
    const data = await res.json();
    if (!data.length) { alert('Aucune question trouvée avec ces paramètres.'); return; }

    questions.value    = data;
    qIdx.value         = 0;
    myAnswer.value     = null;
    livesLeft.value    = cfg.lives;
    correctCount.value = 0;
    myEntryId.value    = null;
    phase.value        = 'playing';
    prepareAnswers(questions.value[0]);
    startTimer();
  } finally {
    loading.value = false;
  }
}

function pickAnswer(ans) {
  if (myAnswer.value !== null && phase.value === 'result_q') return;
  clearInterval(timerInterval);
  myAnswer.value = ans;

  const correct = ans === currentQ.value?.correct_answer;
  lastCorrect.value = correct;
  if (correct) correctCount.value++;
  else          livesLeft.value = Math.max(0, livesLeft.value - 1);

  phase.value = 'result_q';

  // Délai avant question suivante (ou fin)
  const delay = livesLeft.value === 0 ? 1500 : 2000;
  setTimeout(() => nextQuestion(), delay);
}

function nextQuestion() {
  if (livesLeft.value === 0 || qIdx.value >= questions.value.length - 1) {
    endGame();
    return;
  }
  qIdx.value++;
  myAnswer.value = null;
  phase.value    = 'playing';
  prepareAnswers(questions.value[qIdx.value]);
  startTimer();
}

async function endGame() {
  phase.value = 'end';
  clearInterval(timerInterval);

  // Sauvegarder le résultat
  try {
    const username = auth.user?.username || 'Invité';
    const body = {
      username,
      user_id:        auth.user?.id || null,
      lives_start:    cfg.lives,
      lives_remaining: livesLeft.value,
      correct:        correctCount.value,
      total:          questions.value.length,
      difficulty:     cfg.difficulty,
    };
    const res  = await fetch('/api/quiz/solo-result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    myEntryId.value = data.id;
  } catch {}

  // Charger le classement
  try {
    const params = new URLSearchParams({ lives_start: cfg.lives, difficulty: cfg.difficulty });
    const res  = await fetch(`/api/quiz/leaderboard?${params}`);
    leaderboard.value = await res.json();
  } catch {}
}

// Groupes du leaderboard par vies restantes (décroissant)
const lbGroups = computed(() => {
  const map = new Map();
  for (const entry of leaderboard.value) {
    const k = entry.lives_remaining;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(entry);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([lives, entries]) => ({ lives, entries }));
});

function isMyEntry(entry) {
  const username = auth.user?.username || 'Invité';
  return entry.username === username && entry.lives_remaining === livesLeft.value && entry.correct === correctCount.value;
}

const myRankInfo = computed(() => {
  if (!leaderboard.value.length) return null;
  const better = leaderboard.value.filter(e =>
    e.lives_remaining > livesLeft.value ||
    (e.lives_remaining === livesLeft.value && e.correct > correctCount.value)
  ).length;
  return { rank: `#${better + 1}`, better };
});

function restart() {
  phase.value = 'config';
}

onMounted(async () => {
  const res  = await fetch('/api/quiz/categories');
  categories.value = await res.json();
});

onUnmounted(() => clearInterval(timerInterval));
</script>

<style scoped>
.quiz-solo {
  min-height: 100vh;
  background: var(--bg-1);
  display: flex;
  flex-direction: column;
}

/* ── Config ── */
.config-screen {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
}
.config-card {
  width: 100%;
  max-width: 600px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}
.config-icon  { font-size: 3rem; }
.config-title { font-size: 1.6rem; font-weight: 900; color: var(--text-1); text-align: center; margin: 0; }
.config-subtitle { color: var(--text-2); font-size: .9rem; text-align: center; margin: 0; }

.config-fields { width: 100%; display: flex; flex-direction: column; gap: 1.25rem; }
.field-group   { display: flex; flex-direction: column; gap: .5rem; }
.field-group label { font-weight: 700; font-size: .85rem; color: var(--text-2); }
.hint { font-weight: 400; opacity: .6; }

.lives-picker {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.btn-icon {
  width: 36px; height: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-3);
  color: var(--text-1);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.btn-icon:hover { border-color: var(--cyan); }
.lives-val { display: flex; gap: 2px; font-size: 1.1rem; }

.count-row { display: flex; gap: .5rem; flex-wrap: wrap; }
.btn-chip {
  padding: .4rem .9rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-3);
  color: var(--text-2);
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}
.btn-chip.active, .btn-chip:hover { border-color: #8b5cf6; background: rgba(139,92,246,.15); color: #a78bfa; }

.cat-grid { display: flex; flex-wrap: wrap; gap: .4rem; }
.btn-cat {
  padding: .35rem .75rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-3);
  color: var(--text-2);
  font-size: .82rem;
  cursor: pointer;
  transition: all .15s;
}
.btn-cat.active { border-color: #8b5cf6; background: rgba(139,92,246,.15); color: #a78bfa; }

.btn-start { width: 100%; padding: .9rem; font-size: 1rem; }
.mt-2 { margin-top: .5rem; }

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
.q-counter { flex: 1; font-weight: 800; font-size: .95rem; color: var(--text-1); text-align: center; }

.lives-display { display: flex; gap: 2px; }
.heart     { font-size: 1.1rem; transition: all .3s; }
.heart.lost { filter: grayscale(1); opacity: .4; }

.heart-pop-enter-active { transition: all .3s ease; }
.heart-pop-leave-active { transition: all .3s ease; }
.heart-pop-leave-to     { transform: scale(2); opacity: 0; }

/* ── Progress bar ── */
.progress-bar-wrap { height: 6px; background: var(--bg-3); }
.progress-bar { height: 100%; transition: width .1s linear; border-radius: 0 3px 3px 0; }
.progress-bar.green  { background: #4ade80; }
.progress-bar.orange { background: #fb923c; }
.progress-bar.red    { background: #f87171; animation: pulse-bar .5s infinite alternate; }
@keyframes pulse-bar { from { opacity: 1; } to { opacity: .5; } }

/* ── Game body ── */
.game-body {
  flex: 1;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: .6rem;
  font-size: .82rem;
}
.q-category {
  flex: 1;
  color: var(--cyan);
  font-weight: 600;
  background: rgba(6,182,212,.1);
  padding: .2rem .65rem;
  border-radius: 999px;
}
.q-diff { font-weight: 700; padding: .2rem .65rem; border-radius: 999px; font-size: .78rem; }
.q-diff.easy   { background: rgba(74,222,128,.1); color: #4ade80; }
.q-diff.medium { background: rgba(251,191,36,.1);  color: #fbbf24; }
.q-diff.hard   { background: rgba(248,113,113,.1); color: #f87171; }
.q-timer { font-weight: 800; font-size: 1.05rem; min-width: 2.5rem; text-align: right; }
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
  line-height: 1.55;
  text-align: center;
}

.answers-grid { display: grid; gap: .7rem; }
.four-col { grid-template-columns: 1fr 1fr; }
.two-col  { grid-template-columns: 1fr 1fr; }
@media (max-width: 480px) { .four-col, .two-col { grid-template-columns: 1fr; } }

.answer-btn {
  display: flex; align-items: center; gap: .75rem;
  padding: .8rem 1rem;
  background: var(--bg-3);
  border: 2px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-1);
  font-size: .92rem;
  font-weight: 600;
  transition: all .15s;
  text-align: left;
}
.answer-btn:hover:not(:disabled) { border-color: #8b5cf6; background: rgba(139,92,246,.08); transform: translateY(-2px); }
.answer-btn:disabled { cursor: default; }
.answer-btn.correct { border-color: #4ade80; background: rgba(74,222,128,.12); color: #4ade80; animation: correct-pop .4s ease; }
.answer-btn.wrong   { border-color: #f87171; background: rgba(248,113,113,.12); color: #f87171; animation: wrong-shake .4s ease; }
.answer-btn.dimmed  { opacity: .4; }
@keyframes correct-pop { 0%{transform:scale(1)}40%{transform:scale(1.04)}100%{transform:scale(1)} }
@keyframes wrong-shake { 0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)} }

.answer-letter {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-1); border-radius: 7px;
  font-size: .78rem; font-weight: 800; flex-shrink: 0;
}

.answer-feedback {
  display: flex; flex-direction: column; align-items: center; gap: .2rem;
  padding: .9rem; border-radius: 10px;
  animation: fb-in .3s ease;
}
.answer-feedback.correct { background: rgba(74,222,128,.1); border: 1px solid rgba(74,222,128,.3); }
.answer-feedback.wrong   { background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.3); }
@keyframes fb-in { from { opacity: 0; transform: scale(.93); } to { opacity: 1; transform: scale(1); } }
.fb-icon { font-size: 1.8rem; }
.fb-text { font-weight: 800; font-size: 1rem; }
.fb-lives { font-size: .85rem; opacity: .8; }

.live-score {
  display: flex;
  gap: .5rem;
  justify-content: center;
}
.score-chip {
  padding: .3rem .8rem;
  background: rgba(74,222,128,.1);
  border: 1px solid rgba(74,222,128,.2);
  border-radius: 999px;
  font-size: .82rem;
  font-weight: 700;
  color: #4ade80;
}
.score-chip.grey { background: rgba(248,113,113,.1); border-color: rgba(248,113,113,.2); color: #f87171; }

/* ── End screen ── */
.end-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  gap: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.end-header { text-align: center; }
.end-icon   { font-size: 4rem; animation: bounce-end 1s ease infinite alternate; }
@keyframes bounce-end { from{transform:translateY(0)} to{transform:translateY(-10px)} }
.end-title  { font-size: 1.8rem; font-weight: 900; color: var(--text-1); margin-top: .5rem; }

.final-score-card {
  width: 100%;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}
.fs-main { display: flex; align-items: baseline; justify-content: center; gap: .2rem; }
.fs-num   { font-size: 3.5rem; font-weight: 900; color: #8b5cf6; }
.fs-sep   { font-size: 2rem; color: var(--text-2); }
.fs-total { font-size: 2rem; font-weight: 700; color: var(--text-2); }
.fs-pct   { font-size: 1rem; font-weight: 600; color: var(--text-2); }
.fs-lives { display: flex; align-items: center; justify-content: center; gap: .3rem; font-size: 1.1rem; flex-wrap: wrap; }
.lost-heart { filter: grayscale(1); opacity: .4; }
.lives-label { font-size: .9rem; font-weight: 700; color: var(--text-2); }

/* ── Leaderboard ── */
.leaderboard {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.lb-title { font-size: 1rem; font-weight: 800; color: var(--text-1); text-align: center; }

.lb-my-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  padding: .75rem 1rem;
  background: rgba(139,92,246,.1);
  border: 1px solid rgba(139,92,246,.3);
  border-radius: 12px;
}
.rank-badge { font-size: 1.3rem; font-weight: 900; color: #a78bfa; }
.rank-txt   { font-weight: 600; font-size: .9rem; color: var(--text-1); }

.lb-groups { display: flex; flex-direction: column; gap: .75rem; }
.lb-group {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.lb-group-header {
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .55rem .9rem;
  background: var(--bg-3);
  font-size: .85rem;
}
.group-label { flex: 1; font-weight: 700; }
.group-count { color: var(--text-2); font-size: .8rem; }
.no-lives    { font-size: 1.1rem; }

.lb-row {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .45rem .9rem;
  border-top: 1px solid var(--border);
  font-size: .85rem;
}
.lb-row.my-row { background: rgba(139,92,246,.07); }
.lb-pos  { min-width: 20px; font-weight: 700; color: var(--text-2); }
.lb-name { flex: 1; font-weight: 600; }
.lb-score { font-weight: 700; }
.lb-pct   { color: var(--text-2); font-weight: 400; font-size: .8rem; }
.lb-more  { padding: .35rem .9rem; font-size: .8rem; color: var(--text-2); border-top: 1px solid var(--border); text-align: center; }

.end-actions {
  display: flex;
  gap: .75rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* ── Transitions ── */
.slide-up-enter-active { transition: all .35s cubic-bezier(.34,1.56,.64,1); }
.slide-up-enter-from   { opacity: 0; transform: translateY(24px) scale(.96); }
.fade-enter-active, .fade-leave-active { transition: opacity .25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
