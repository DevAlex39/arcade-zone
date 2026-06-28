<template>
  <div class="game-card" :style="{ '--card-color': game.color }">
    <div class="card-glow"></div>

    <div v-if="game.image_url" class="card-image-wrap">
      <img :src="game.image_url" :alt="game.name" class="card-image" />
    </div>

    <div class="card-top">
      <span v-if="!game.image_url" class="card-icon">{{ game.icon }}</span>
      <div class="card-badges">
        <span v-if="game.solo_url || game.min_players === 1" class="badge badge-cyan">Solo</span>
        <span v-if="game.has_multiplayer" class="badge badge-rose">Multi</span>
        <span v-if="game.max_players > 1" class="badge badge-violet">
          {{ game.min_players === game.max_players ? game.min_players : `${game.min_players}–${game.max_players}` }} {{ t('gc.players') }}
        </span>
      </div>
    </div>

    <h3 class="card-name">{{ game.name }}</h3>
    <p class="card-desc">{{ game.description }}</p>

    <div class="card-actions">
      <button v-if="game.solo_url || game.min_players === 1" class="btn btn-secondary btn-sm btn-full" @click="$emit('play', game)">
        {{ t('gc.play_solo') }}
      </button>
      <div v-if="game.has_multiplayer" class="actions-multi">
        <button class="btn btn-primary btn-sm" @click="$emit('create', game)">{{ t('gc.create') }}</button>
        <button class="btn btn-secondary btn-sm" @click="$emit('join', game)">{{ t('gc.join') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '@/composables/useI18n.js';
defineProps({ game: Object });
defineEmits(['play', 'create', 'join']);
const { t } = useI18n();
</script>

<style scoped>
.game-card {
  position: relative;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  overflow: hidden;
  transition: transform .2s, border-color .2s, box-shadow .2s;
  display: flex; flex-direction: column;
  min-height: 200px;
}
.game-card:hover {
  transform: translateY(-4px);
  border-color: var(--card-color, var(--cyan));
  box-shadow: 0 14px 40px rgba(0,0,0,.4), 0 0 0 1px var(--card-color, var(--cyan));
}
.card-glow {
  position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
  background: radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--card-color, var(--cyan)) 14%, transparent), transparent 60%);
}
.card-image-wrap { position: relative; width: 100%; height: 160px; display: flex; align-items: center; justify-content: center; margin-bottom: .5rem; }
.card-image { max-height: 160px; max-width: 100%; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,.5)); }
.card-top  { position: relative; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .3rem; }
.card-icon { font-size: 2.2rem; line-height: 1; }
.card-badges { display: flex; flex-direction: row; align-items: center; gap: .3rem; flex-wrap: wrap; }
.card-name { position: relative; font-family: var(--font-title); font-size: 1.15rem; font-weight: 800; margin: .7rem 0 0; }
.card-desc { position: relative; font-size: .84rem; color: var(--text-2); line-height: 1.55; margin: .4rem 0 0; flex: 1; }

.card-actions { position: relative; margin-top: 1rem; display: flex; flex-direction: column; gap: .5rem; }
.actions-multi { display: flex; gap: .5rem; }
.actions-multi .btn-primary { flex: 1; }
</style>
