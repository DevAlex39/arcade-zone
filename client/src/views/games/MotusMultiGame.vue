<template>
  <div class="motus-multi">

    <!-- Barre de statut -->
    <div class="game-bar">
      <router-link to="/" class="btn btn-ghost btn-sm">← Menu</router-link>
      <div class="bar-status">
        <span class="badge badge-rose">🔥 Multi</span>
        <span class="bar-round" v-if="roundState">Manche {{ roundState.roundIdx }}</span>
      </div>
      <span class="bar-info">{{ statusMsg }}</span>
    </div>

    <!-- HUD Joueurs -->
    <div class="players-hud" v-if="players.length">
      <div
        v-for="p in players"
        :key="p.id"
        class="hud-card"
        :class="{ eliminated: p.eliminated, me: p.id === myId }"
      >
        <span class="hud-name">{{ p.username }}</span>
        <span class="hud-lives">{{ p.eliminated ? '💀' : `❤️ ${p.lives}` }}</span>
        <span v-if="p.combo >= 2" class="hud-combo">🔥×{{ p.combo }}</span>
      </div>
    </div>

    <!-- Grille + clavier (quand c'est ma partie) -->
    <div class="game-area" v-if="phase === 'playing' && !myDone">
      <div class="game-sub">{{ wordLength }} lettres — essai {{ myGuesses + 1 }}/{{ maxAttempts }}</div>

      <div class="grid">
        <div v-for="r in maxAttempts" :key="r" class="row">
          <div
            v-for="c in wordLength"
            :key="c"
            class="cell"
            :class="getCellClass(r-1, c-1)"
            :id="`cell-${r-1}-${c-1}`"
            @click="setCursorAt(c-1)"
          >{{ getCellLetter(r-1, c-1) }}</div>
        </div>
      </div>

      <div class="keyboard">
        <div v-for="(row, ri) in KB_ROWS" :key="ri" class="kb-row">
          <button
            v-for="k in row"
            :key="k"
            class="kb-key"
            :class="['special', '⌫', '←'].includes(k) ? 'special' : kbClass(k)"
            @click="handleKey(k === '←' ? '⌫' : k)"
          >{{ k === '←' ? '⌫' : k }}</button>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-primary" :disabled="!canSubmit || checking" @click="submitGuess">
          {{ checking ? '⟳ Vérification…' : 'Valider' }}
        </button>
      </div>
    </div>

    <!-- Attente après ma tentative -->
    <div class="waiting-others" v-else-if="phase === 'playing' && myDone">
      <div class="w-icon">{{ myResult === 'found' ? '🎉' : '😔' }}</div>
      <h3>{{ myResult === 'found' ? 'Mot trouvé !' : `Le mot était : ${roundState?.word || '…'}` }}</h3>
      <p class="text-muted mt-1">En attente des autres joueurs…</p>
      <div class="spin mt-2" style="font-size:1.5rem">⟳</div>
    </div>

    <!-- Résultats de manche -->
    <div class="modal-backdrop" v-if="showResults">
      <div class="modal-box results-modal">
        <h2>📊 Manche {{ roundResults?.roundIdx }}</h2>
        <p class="text-muted mb-2">Mot : <strong>{{ roundResults?.word }}</strong></p>

        <div class="rr-list">
          <div v-for="r in roundResults?.results" :key="r.id" class="rr-row">
            <span class="rr-name">{{ r.username }}</span>
            <span :class="r.status === 'found' ? 'rr-found' : 'rr-failed'">
              {{ r.status === 'found' ? `✅ Essai ${r.foundAtRow + 1}` : '❌ Raté' }}
            </span>
            <span v-if="roundResults.damages?.[r.id]" class="rr-dmg">
              ⚔️ −{{ roundResults.damages[r.id] }}
            </span>
          </div>
        </div>

        <div class="rr-lives mt-2">
          <div v-for="p in roundResults?.players" :key="p.id" class="rr-life-row">
            <span>{{ p.eliminated ? '💀' : '❤️' }} {{ p.username }}</span>
            <span>{{ p.eliminated ? 'Éliminé' : `${p.lives} vie${p.lives > 1 ? 's' : ''}` }}</span>
          </div>
        </div>

        <button v-if="isHost" class="btn btn-primary btn-full mt-2" @click="nextRound">
          Manche suivante →
        </button>
        <p v-else class="text-muted text-center mt-2">L'hôte prépare la prochaine manche…</p>
      </div>
    </div>

    <!-- Victoire -->
    <div class="modal-backdrop" v-if="winner !== undefined">
      <div class="modal-box text-center">
        <div style="font-size:3rem">🏆</div>
        <h2 class="mt-1">{{ winner ? `${winner.username} gagne !` : 'Match nul !' }}</h2>
        <p class="text-muted mt-1">{{ winner ? `Dernier survivant avec ${winner.lives} vie${winner.lives > 1 ? 's' : ''} !` : 'Tout le monde est éliminé !' }}</p>
        <router-link to="/" class="btn btn-primary btn-full mt-2">Retour au menu →</router-link>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.js';
import { usePlatformStore } from '@/stores/platform.js';

const props = defineProps({ roomCode: String, game: Object });

const auth     = useAuthStore();
const platform = usePlatformStore();
const myId     = auth.user?.id;
const isHost   = ref(false);

const KB_ROWS = [
  ['A','Z','E','R','T','Y','U','I','O','P'],
  ['Q','S','D','F','G','H','J','K','L','M'],
  ['⌫','W','X','C','V','B','N','←'],
];

// Socket
let socket = null;

// Jeu
const phase       = ref('waiting'); // waiting | playing | results | finished
const players     = ref([]);
const roundState  = ref(null);
const statusMsg   = ref('En attente…');
const showResults = ref(false);
const roundResults= ref(null);
const winner      = ref(undefined); // undefined = pas fini

// Ma grille
const wordLength      = ref(6);
const maxAttempts     = ref(6);
const confirmedLetters= ref([]);
const currentInput    = ref([]);
const cursorPos       = ref(1);
const revealedRows    = ref([]); // [{result:[…], guess:string}]
const myGuesses       = computed(() => revealedRows.value.length);
const myDone          = ref(false);
const myResult        = ref(null); // 'found' | 'failed'
const checking        = ref(false);
const kbState         = ref({}); // letter → 'correct'|'present'|'absent'
const canSubmit       = computed(() => currentInput.value.every(l => !!l));

// ─── Socket connexion ─────────────────────────────────────────────
onMounted(() => {
  socket = io('/', { auth: { token: auth.token, username: auth.user?.username } });

  socket.on('connect', () => {
    socket.emit('join_room', props.roomCode);
  });

  socket.on('room_update', (data) => {
    players.value = data.players || [];
    isHost.value  = data.host_id === myId;
    if (data.status === 'playing' && phase.value === 'waiting') {
      // round_start devrait arriver
    }
  });

  socket.on('round_start', (data) => {
    roundState.value     = data;
    wordLength.value     = data.wordLength;
    maxAttempts.value    = data.maxAttempts;
    confirmedLetters.value = Array(data.wordLength).fill(null);
    confirmedLetters.value[0] = data.firstLetter;
    players.value        = data.players || players.value;
    resetGrid();
    phase.value = 'playing';
    myDone.value = false; myResult.value = null;
    statusMsg.value = `Manche ${data.roundIdx} — Trouve le mot !`;
    showResults.value = false;
    winner.value = undefined;
  });

  socket.on('guess_result', ({ result, confirmedLetters: cl, won }) => {
    checking.value = false;
    const guess = currentInput.value.join('');
    revealedRows.value.push({ result, guess });
    confirmedLetters.value = cl;
    // Mettre à jour le clavier
    result.forEach((s, i) => {
      const l = guess[i];
      const priority = { correct: 3, present: 2, absent: 1 };
      if (!kbState.value[l] || priority[s] > priority[kbState.value[l]]) kbState.value[l] = s;
    });
    if (won) { myDone.value = true; myResult.value = 'found'; }
    else if (revealedRows.value.length >= maxAttempts.value) { myDone.value = true; myResult.value = 'failed'; }
    else { prefillRow(); }
  });

  socket.on('guess_invalid', () => {
    checking.value = false;
    platform.showToast('Mot non reconnu !', 'error');
  });

  socket.on('guess_error', (msg) => {
    checking.value = false;
    platform.showToast(msg, 'error');
  });

  socket.on('round_end', (data) => {
    roundResults.value = data;
    players.value      = data.players || players.value;
    phase.value = 'results';
    showResults.value = true;
    if (roundState.value) roundState.value.word = data.word;
  });

  socket.on('game_over', (data) => {
    showResults.value = false;
    winner.value = data.winner || null;
    phase.value = 'finished';
  });

  socket.on('error', msg => platform.showToast(msg, 'error'));
});

onUnmounted(() => socket?.disconnect());

// ─── Grille ───────────────────────────────────────────────────────
function resetGrid() {
  currentInput.value = Array(wordLength.value).fill(null);
  revealedRows.value = [];
  kbState.value = {};
  prefillRow();
}

function prefillRow() {
  currentInput.value = Array(wordLength.value).fill(null);
  // Pos 0 toujours fixée, autres positions pré-remplies comme hint (éditables)
  for (let i = 0; i < wordLength.value; i++) {
    if (confirmedLetters.value[i]) currentInput.value[i] = confirmedLetters.value[i];
  }
  cursorPos.value = 1; // départ toujours en pos 1
}

function getCellClass(r, c) {
  if (r < revealedRows.value.length) return revealedRows.value[r].result[c];
  if (r === revealedRows.value.length) {
    if (c === 0) return 'first-letter'; // pos 0 toujours verrouillée visuellement
    if (c === cursorPos.value) return confirmedLetters.value[c] ? 'confirmed-cursor' : 'cursor-active';
    if (confirmedLetters.value[c] && currentInput.value[c] === confirmedLetters.value[c]) return 'confirmed-hint';
    if (currentInput.value[c]) return 'filled';
  }
  return '';
}

function getCellLetter(r, c) {
  if (r < revealedRows.value.length) return revealedRows.value[r].guess[c];
  if (r === revealedRows.value.length) return currentInput.value[c] || '';
  return '';
}

function kbClass(k) {
  const s = kbState.value[k];
  return s ? `kb-${s}` : '';
}

// ─── Curseur & saisie ────────────────────────────────────────────
function setCursorAt(col) {
  if (col === 0 || myDone.value || revealedRows.value.length >= maxAttempts.value) return;
  cursorPos.value = col;
}

function handleKey(key) {
  if (myDone.value) return;
  if (key === '⌫') deleteLetter();
  else if (/^[A-Z]$/.test(key)) addLetter(key);
  else if (key === 'Entrée') submitGuess();
}

function nextEditablePos(from) {
  // Avancer vers la prochaine case vide (ou fin)
  for (let i = from + 1; i < wordLength.value; i++)
    if (!currentInput.value[i]) return i;
  // Si tout est rempli, rester sur la dernière pos éditable
  return from + 1 < wordLength.value ? from + 1 : -1;
}

function addLetter(letter) {
  const pos = cursorPos.value;
  if (pos <= 0 || pos >= wordLength.value) return; // bloquer pos 0
  currentInput.value = [...currentInput.value];
  currentInput.value[pos] = letter;
  // Avancer vers la prochaine case (vide en priorité, sinon juste +1)
  const next = nextEditablePos(pos);
  cursorPos.value = next >= 0 ? next : (pos + 1 < wordLength.value ? pos + 1 : pos);
}

function deleteLetter() {
  const inp = [...currentInput.value];
  const pos = cursorPos.value;
  // Effacer la case courante si elle a une lettre (sauf pos 0)
  if (pos > 0 && inp[pos]) {
    inp[pos] = null;
    currentInput.value = inp;
    return;
  }
  // Sinon reculer et effacer
  for (let i = pos - 1; i >= 1; i--) {
    if (inp[i]) {
      inp[i] = null;
      currentInput.value = inp;
      cursorPos.value = i;
      return;
    }
  }
}

// ─── Clavier physique ─────────────────────────────────────────────
function onKeydown(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Enter') { submitGuess(); return; }
  if (e.key === 'Backspace') { handleKey('⌫'); return; }
  const l = e.key.toUpperCase();
  if (/^[A-Z]$/.test(l)) handleKey(l);
}
onMounted(() => document.addEventListener('keydown', onKeydown));
onUnmounted(() => document.removeEventListener('keydown', onKeydown));

// ─── Soumettre ───────────────────────────────────────────────────
function submitGuess() {
  if (!canSubmit.value || checking.value || myDone.value) return;
  checking.value = true;
  const guess = currentInput.value.join('');
  socket.emit('submit_guess', { code: props.roomCode, guess });
}

function nextRound() {
  showResults.value = false;
  socket.emit('start_game', props.roomCode);
}
</script>

<style scoped>
.motus-multi { flex: 1; display: flex; flex-direction: column; }

.game-bar {
  display: flex; align-items: center; gap: .75rem;
  padding: .6rem 1rem; background: var(--bg-2); border-bottom: 1px solid var(--border);
}
.bar-status { display: flex; align-items: center; gap: .4rem; }
.bar-round  { font-size: .82rem; font-weight: 700; color: var(--text-2); }
.bar-info   { flex: 1; text-align: right; font-size: .82rem; color: var(--text-2); }

/* HUD */
.players-hud {
  display: flex; flex-wrap: wrap; gap: .5rem;
  padding: .6rem 1rem; background: var(--bg-2); border-bottom: 1px solid var(--border);
}
.hud-card {
  background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px;
  padding: .3rem .7rem; display: flex; align-items: center; gap: .4rem;
  font-size: .78rem;
}
.hud-card.me         { border-color: var(--cyan); }
.hud-card.eliminated { opacity: .4; }
.hud-name  { font-weight: 700; }
.hud-lives { color: var(--text-2); }
.hud-combo { color: var(--amber); font-weight: 800; font-size: .7rem; }

/* Grille */
.game-area { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1.25rem 1rem; }
.game-sub  { font-size: .78rem; color: var(--text-2); }

.grid { display: flex; flex-direction: column; gap: 6px; }
.row  { display: flex; gap: 6px; }
.cell {
  width: clamp(42px,8vw,58px); height: clamp(42px,8vw,58px);
  border: 2px solid var(--border); border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: clamp(1rem,3vw,1.4rem); font-weight: 800; text-transform: uppercase;
  background: var(--bg-2); color: var(--text);
  transition: border-color .15s;
  user-select: none; cursor: default;
}
.cell.filled          { border-color: rgba(255,255,255,.3); }
.cell.first-letter    { border-color: #1a8a4a !important; background: #0d4f2a !important; }
/* Lettre confirmée éditable — hint vert doux */
.cell.confirmed-hint  { border-color: #1a8a4a; background: #0d4f2a; opacity: .65; cursor: pointer; }
/* Lettre confirmée avec curseur dessus */
.cell.confirmed-cursor{ border-color: var(--cyan) !important; background: #0d4f2a; box-shadow: 0 0 0 2px rgba(56,189,248,.3); cursor: text; }
.cell.cursor-active   { border-color: var(--cyan) !important; box-shadow: 0 0 0 2px rgba(56,189,248,.3); }
.cell.correct { background: #0d4f2a; border-color: #1a8a4a; animation: flip .4s ease; }
.cell.present { background: #4a2e00; border-color: #c97d00; animation: flip .4s ease; }
.cell.absent  { background: #3a3d4d; border-color: transparent; color: #6b6f82; animation: flip .4s ease; }

@keyframes flip { 0%{transform:rotateX(0)} 50%{transform:rotateX(-90deg)} 100%{transform:rotateX(0)} }

/* Clavier */
.keyboard { display: flex; flex-direction: column; gap: 5px; align-items: center; }
.kb-row { display: flex; gap: 4px; }
.kb-key {
  min-width: clamp(26px,7vw,38px); height: 48px;
  border-radius: 6px; background: var(--bg-3); border: 1px solid var(--border);
  color: var(--text); font-family: var(--font-body); font-size: .75rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background .12s;
}
.kb-key.special     { min-width: clamp(40px,10vw,56px); }
.kb-key.kb-correct  { background: #0d4f2a; border-color: #1a8a4a; }
.kb-key.kb-present  { background: #4a2e00; border-color: #c97d00; }
.kb-key.kb-absent   { background: #3d1212; border-color: rgba(220,38,38,.35); color: #f87171; }

.actions { margin-top: .5rem; }

/* Attente */
.waiting-others { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .5rem; }
.w-icon { font-size: 3rem; }

/* Résultats */
.results-modal { max-width: 480px !important; }
.rr-list { display: flex; flex-direction: column; gap: .4rem; }
.rr-row { display: flex; align-items: center; gap: .5rem; font-size: .85rem; padding: .35rem 0; border-bottom: 1px solid var(--border); }
.rr-name { flex: 1; font-weight: 700; }
.rr-found { color: #4ade80; }
.rr-failed { color: var(--text-2); }
.rr-dmg { color: #f87171; font-size: .75rem; }
.rr-lives { display: flex; flex-direction: column; gap: .3rem; background: var(--bg-3); border-radius: 8px; padding: .6rem; }
.rr-life-row { display: flex; justify-content: space-between; font-size: .82rem; }
</style>
