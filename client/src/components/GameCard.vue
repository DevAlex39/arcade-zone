<template>
  <div class="game-card" :style="{ '--card-color': game.color }">
    <div class="card-glow" />
    <div class="card-top">
      <span class="card-icon">{{ game.icon }}</span>
      <div class="card-badges">
        <span class="badge" :class="game.has_multiplayer ? 'badge-rose' : 'badge-cyan'">
          {{ game.has_multiplayer ? 'Multi' : 'Solo' }}
        </span>
        <span class="badge badge-violet" v-if="game.max_players > 1">
          {{ game.min_players === game.max_players ? game.min_players : `${game.min_players}–${game.max_players}` }} joueurs
        </span>
      </div>
    </div>

    <h3 class="card-name">{{ game.name }}</h3>
    <p class="card-desc">{{ game.description }}</p>

    <div class="card-actions">
      <!-- Solo only -->
      <template v-if="!game.has_multiplayer">
        <button class="btn btn-primary btn-sm" @click="$emit('play', game)">Jouer →</button>
      </template>
      <!-- Multi only (pas de solo_url) -->
      <template v-else-if="!game.solo_url">
        <button class="btn btn-primary btn-sm" @click="$emit('create', game)">Créer une salle</button>
        <button class="btn btn-secondary btn-sm" @click="$emit('join', game)">Rejoindre</button>
      </template>
      <!-- Solo + Multi -->
      <template v-else>
        <button class="btn btn-ghost btn-sm" @click="$emit('play', game)">Solo</button>
        <button class="btn btn-primary btn-sm" @click="$emit('create', game)">Créer</button>
        <button class="btn btn-secondary btn-sm" @click="$emit('join', game)">Rejoindre</button>
      </template>
    </div>
  </div>
</template>

<script setup>
defineProps({ game: Object });
defineEmits(['play', 'create', 'join']);
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
  display: flex; flex-direction: column; gap: .75rem;
}
.game-card:hover {
  transform: translateY(-3px);
  border-color: var(--card-color, var(--cyan));
  box-shadow: 0 8px 32px rgba(0,0,0,.3), 0 0 0 1px var(--card-color, var(--cyan));
}
.card-glow {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--card-color, var(--cyan)) 12%, transparent), transparent 60%);
  border-radius: inherit;
}
.card-top  { display: flex; align-items: flex-start; justify-content: space-between; }
.card-icon { font-size: 2.2rem; line-height: 1; }
.card-badges { display: flex; flex-direction: column; align-items: flex-end; gap: .25rem; }
.card-name { font-family: var(--font-title); font-size: 1.1rem; font-weight: 800; }
.card-desc { font-size: .82rem; color: var(--text-2); line-height: 1.5; flex: 1; }
.card-actions { display: flex; gap: .5rem; margin-top: .25rem; }
</style>
