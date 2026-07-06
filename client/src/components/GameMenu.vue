<template>
  <!-- Bouton hamburger flottant -->
  <button class="gm-burger" :class="{ open }" @click="open = !open" title="Menu">
    <span /><span /><span />
  </button>

  <Teleport to="body">
    <transition name="gm-slide">
      <div v-if="open" class="gm-drawer">
        <div class="gm-head">
          <h3>{{ t('menu.title') }}</h3>
          <button class="gm-close" @click="open = false">✕</button>
        </div>

        <!-- Règles sélectionnées dans le lobby -->
        <section class="gm-section">
          <h4>{{ t('menu.rules') }}</h4>
          <ul class="gm-rules">
            <li v-for="r in rulesList" :key="r.label">
              <span class="gm-rule-label">{{ r.label }}</span>
              <span class="gm-rule-val">{{ r.value }}</span>
            </li>
            <li v-if="!rulesList.length" class="gm-empty">—</li>
          </ul>
        </section>

        <!-- Joueurs présents -->
        <section class="gm-section">
          <h4>{{ t('menu.players') }} ({{ players.length }})</h4>
          <div class="gm-players">
            <div v-for="p in players" :key="p.id" class="gm-player">
              <div class="gm-avatar">{{ (p.username || '?')[0].toUpperCase() }}</div>
              <span class="gm-pname">{{ p.username }}</span>
              <span v-if="p.id === hostId" class="gm-badge gm-badge-host">{{ t('menu.host') }}</span>
              <span v-else-if="p.online !== false" class="gm-badge gm-badge-on">{{ t('menu.online') }}</span>
              <span v-else class="gm-badge gm-badge-off">{{ t('menu.offline') }}</span>
              <button v-if="isHost && p.id !== hostId" class="gm-kick" @click="kickTarget = p" :title="t('menu.kick')">✕</button>
            </div>
          </div>
        </section>
      </div>
    </transition>

    <!-- Confirmation de kick -->
    <div v-if="kickTarget" class="gm-overlay" @click.self="kickTarget = null">
      <div class="gm-modal">
        <h3>{{ t('menu.kick_title', { name: kickTarget.username }) }}</h3>
        <div class="gm-modal-actions">
          <button v-if="aiSupported" class="gm-btn gm-btn-ai" @click="confirmKick(true)">{{ t('menu.kick_ai') }}</button>
          <button class="gm-btn gm-btn-danger" @click="confirmKick(false)">{{ t('menu.kick_remove') }}</button>
          <button class="gm-btn" @click="kickTarget = null">{{ t('menu.cancel') }}</button>
        </div>
        <p class="gm-hint">{{ t('menu.kick_remove_hint') }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from '@/composables/useI18n.js';

const props = defineProps({
  room:        Object,   // room sanitisée (settings, players, host_id)
  isHost:      Boolean,
  aiSupported: Boolean,  // true pour skyjo / petits-chevaux
});
const emit = defineEmits(['kick']);

const { t } = useI18n();
const open       = ref(false);
const kickTarget = ref(null);

const players = computed(() => props.room?.players || []);
const hostId  = computed(() => props.room?.host_id);

function confirmKick(replaceByAI) {
  emit('kick', { targetId: kickTarget.value.id, replaceByAI });
  kickTarget.value = null;
}

const onOff = v => v ? '✅' : '—';

// Formatage lisible des règles selon le jeu
const rulesList = computed(() => {
  const s = props.room?.settings;
  const gid = props.room?.game_id;
  if (!s) return [];
  const rules = [];
  const add = (label, value) => rules.push({ label, value });

  if (gid === 'motus') {
    add(t('lobby.word_lang'), (s.lang || 'fr').toUpperCase());
    add(t('lobby.lives'), s.livesMax);
    add(t('lobby.attempts'), s.maxAttempts);
    add(t('lobby.min_letters') + ' / ' + t('lobby.max_letters'), `${s.minLetters} – ${s.maxLetters}`);
    add(t('lobby.same_word'), onOff(s.syncWords));
    add(t('lobby.combo_mode'), onOff(s.comboEnabled));
    add(t('lobby.change_on_find'), onOff(s.changeOnFind));
    add(t('lobby.categories'), (s.categories || ['tous']).join(', '));
  } else if (gid === 'petits-chevaux') {
    add(t('lobby.pawns'), s.pionsPerPlayer);
    add(t('lobby.replay_6'), onOff(s.rejouerSur6 !== false));
    add(t('lobby.allow_overtake'), onOff(s.allowOvertake));
    add(t('lobby.corridor_simple'), onOff(s.corridorSimplifie));
    if (s.aiCount) add(t('lobby.ai_players'), s.aiCount);
  } else if (gid === 'skyjo' || gid === 'yahtzee') {
    if (s.aiCount) add(t('lobby.ai_players'), s.aiCount);
  } else if (gid === 'oser-jouer') {
    add(t('oj.mode'), s.ojMode === 'vote' ? t('oj.mode_vote') : t('oj.mode_master'));
    add(t('oj.category'), s.ojCategory === 'public' ? t('oj.cat_public') : s.ojCategory === 'trash' ? t('oj.cat_trash') : t('oj.cat_all'));
    add(t('oj.target'), s.ojTargetScore || 10);
  } else if (gid === 'quiz') {
    add(t('quiz.mode'), s.quizMode === 1 ? t('quiz.mode1') : s.quizMode === 2 ? t('quiz.mode2') : t('quiz.mode3'));
    add(t('quiz.timer'), `${s.timer}s`);
    if (s.quizMode === 1) add(t('quiz.target_score'), s.targetScore);
    if (s.quizMode === 2) add(t('quiz.question_count'), s.questionCount);
    if (s.quizMode === 3) add(t('quiz.lives'), s.lives);
    add(t('quiz.difficulty'), s.difficulty);
  } else {
    // fallback générique : afficher les settings simples
    Object.entries(s).forEach(([k, v]) => {
      if (typeof v === 'boolean') add(k, onOff(v));
      else if (typeof v === 'number' || typeof v === 'string') add(k, v);
    });
  }
  return rules;
});
</script>

<style scoped>
.gm-burger { position: fixed; top: 64px; right: 14px; z-index: 500; width: 40px; height: 40px; border-radius: 10px; background: var(--bg-2, #16162a); border: 1px solid var(--border, #333); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; transition: all .2s; }
.gm-burger:hover { border-color: var(--cyan, #06b6d4); }
.gm-burger span { display: block; width: 18px; height: 2px; border-radius: 2px; background: var(--text, #eee); transition: all .25s; }
.gm-burger.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.gm-burger.open span:nth-child(2) { opacity: 0; }
.gm-burger.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

.gm-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 320px; max-width: 88vw; background: var(--bg-2, #16162a); border-left: 1px solid var(--border, #333); z-index: 499; padding: 1.1rem; overflow-y: auto; box-shadow: -12px 0 44px rgba(0,0,0,.45); }
.gm-slide-enter-active, .gm-slide-leave-active { transition: transform .25s ease, opacity .25s ease; }
.gm-slide-enter-from, .gm-slide-leave-to { transform: translateX(100%); opacity: 0; }

.gm-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.gm-head h3 { font-size: 1.05rem; }
.gm-close { background: transparent; border: none; color: var(--text-2, #aaa); font-size: 1.1rem; cursor: pointer; }

.gm-section { margin-bottom: 1.4rem; }
.gm-section h4 { font-size: .78rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--text-2, #aaa); margin-bottom: .6rem; }

.gm-rules { list-style: none; display: flex; flex-direction: column; gap: .35rem; }
.gm-rules li { display: flex; justify-content: space-between; gap: .6rem; font-size: .82rem; padding: .3rem .5rem; background: var(--bg-3, #1e1e38); border-radius: 8px; }
.gm-rule-label { color: var(--text-2, #aaa); }
.gm-rule-val { font-weight: 700; text-align: right; }
.gm-empty { color: var(--text-3, #666); }

.gm-players { display: flex; flex-direction: column; gap: .5rem; }
.gm-player { display: flex; align-items: center; gap: .55rem; }
.gm-avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, var(--cyan, #06b6d4), var(--violet, #8b5cf6)); display: flex; align-items: center; justify-content: center; font-size: .7rem; font-weight: 800; color: #04131a; }
.gm-pname { flex: 1; font-weight: 600; font-size: .88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gm-badge { font-size: .62rem; font-weight: 700; padding: .12rem .4rem; border-radius: 5px; }
.gm-badge-host { background: rgba(245,158,11,.15); color: #f59e0b; }
.gm-badge-on   { background: rgba(34,197,94,.15);  color: #22c55e; }
.gm-badge-off  { background: rgba(100,116,139,.15); color: #94a3b8; }
.gm-kick { background: transparent; border: 1px solid rgba(239,68,68,.35); border-radius: 6px; color: #f87171; cursor: pointer; width: 22px; height: 22px; font-size: .65rem; flex-shrink: 0; }
.gm-kick:hover { background: rgba(239,68,68,.15); }

.gm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center; z-index: 600; }
.gm-modal { background: var(--bg-2, #16162a); border: 1px solid var(--border, #333); border-radius: 14px; padding: 1.6rem; max-width: 380px; width: calc(100% - 2rem); text-align: center; }
.gm-modal h3 { margin-bottom: .8rem; font-size: 1.05rem; }
.gm-modal-actions { display: flex; flex-direction: column; gap: .5rem; margin: .8rem 0; }
.gm-btn { padding: .6rem 1rem; border-radius: 9px; border: 1px solid var(--border, #333); background: var(--bg-3, #1e1e38); color: var(--text, #eee); font-weight: 700; font-size: .88rem; cursor: pointer; transition: all .15s; }
.gm-btn:hover { border-color: var(--cyan, #06b6d4); }
.gm-btn-ai { background: rgba(6,182,212,.12); border-color: rgba(6,182,212,.4); color: var(--cyan, #06b6d4); }
.gm-btn-danger { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.4); color: #f87171; }
.gm-hint { font-size: .74rem; color: var(--text-3, #888); line-height: 1.4; }
</style>
