<template>
  <Teleport to="body">
    <div v-if="gameOver" class="pg-overlay">
      <div class="pg-modal">
        <div class="pg-emoji">{{ isWinner ? '🏆' : '🏁' }}</div>
        <h2>{{ isWinner ? t('victory') : t('game_over_title') }}</h2>
        <p v-if="gameOver.winner" class="pg-winner">
          {{ t('winner_label') }} <strong>{{ gameOver.winner.username }}</strong>
        </p>

        <!-- Classement final de tournoi -->
        <div v-if="gameOver.tournamentStandings" class="pg-standings">
          <div v-for="(s, i) in gameOver.tournamentStandings" :key="s.id" class="pg-st-row" :class="{ first: i === 0 }">
            <span>{{ ['🥇','🥈','🥉'][i] || `#${i + 1}` }}</span>
            <span class="pg-st-name">{{ s.username }}</span>
            <span class="pg-st-pts">{{ s.points }} pts</span>
          </div>
        </div>

        <slot />

        <div v-if="isHost" class="pg-actions">
          <button class="pg-btn pg-primary" @click="$emit('replay')">{{ t('pg.replay') }}</button>
          <button class="pg-btn" @click="$emit('lobby')">{{ t('pg.back_lobby') }}</button>
          <button class="pg-btn pg-ghost" @click="$emit('home')">{{ t('pg.back_home') }}</button>
        </div>
        <div v-else class="pg-actions">
          <p class="pg-waiting"><span class="spin">⟳</span> {{ t('pg.waiting_host') }}</p>
          <button class="pg-btn pg-ghost" @click="$emit('home')">{{ t('pg.back_home') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n.js';

const props = defineProps({
  gameOver: Object,   // { winner, scores? } ou null
  isHost:   Boolean,
  myId:     [String, Number],
});
defineEmits(['replay', 'lobby', 'home']);

const { t } = useI18n();
const isWinner = computed(() => props.gameOver?.winner && String(props.gameOver.winner.id) === String(props.myId));
</script>

<style scoped>
.pg-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; }
.pg-modal { background: var(--bg-2, #16162a); border: 1px solid var(--border, #333); border-radius: 18px; padding: 2.2rem 2.6rem; text-align: center; max-width: 420px; width: calc(100% - 2rem); box-shadow: 0 24px 80px rgba(0,0,0,.6); animation: pgIn .3s ease; }
@keyframes pgIn { from { opacity: 0; transform: translateY(16px) scale(.96); } to { opacity: 1; transform: none; } }
.pg-emoji { font-size: 2.6rem; margin-bottom: .4rem; }
.pg-modal h2 { font-size: 1.5rem; margin-bottom: .5rem; }
.pg-winner { color: var(--text-2, #aaa); margin-bottom: .5rem; }
.pg-actions { display: flex; flex-direction: column; gap: .55rem; margin-top: 1.4rem; }
.pg-btn { padding: .7rem 1.4rem; border-radius: 10px; border: 1px solid var(--border, #333); background: var(--bg-3, #1e1e38); color: var(--text, #eee); font-size: .95rem; font-weight: 700; cursor: pointer; transition: all .15s; }
.pg-btn:hover { border-color: var(--cyan, #06b6d4); transform: translateY(-1px); }
.pg-primary { background: var(--cyan, #06b6d4); border-color: var(--cyan, #06b6d4); color: #04131a; }
.pg-primary:hover { filter: brightness(1.1); }
.pg-ghost { background: transparent; }
.pg-waiting { display: flex; align-items: center; justify-content: center; gap: .5rem; color: var(--text-2, #aaa); font-size: .88rem; }
.pg-standings { display: flex; flex-direction: column; gap: .3rem; margin-top: .8rem; }
.pg-st-row { display: flex; align-items: center; gap: .6rem; padding: .35rem .6rem; background: var(--bg-3, #1e1e38); border: 1px solid var(--border, #333); border-radius: 8px; font-size: .85rem; }
.pg-st-row.first { border-color: rgba(245,158,11,.5); background: rgba(245,158,11,.08); }
.pg-st-name { flex: 1; text-align: left; font-weight: 700; }
.pg-st-pts { font-weight: 800; color: var(--cyan, #06b6d4); }
.spin { display: inline-block; animation: pgSpin 1.2s linear infinite; }
@keyframes pgSpin { to { transform: rotate(360deg); } }
</style>
