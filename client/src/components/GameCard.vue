<template>
  <div class="game-card" :style="{ '--card-color': game.color }">
    <div class="card-glow"></div>

    <div class="card-top">
      <span class="card-icon">{{ game.icon }}</span>
      <div class="card-badges">
        <span v-if="game.solo_url" class="badge badge-cyan">Solo</span>
        <span v-if="game.has_multiplayer" class="badge badge-rose">Multi</span>
        <span v-if="game.max_players > 1" class="badge badge-violet">
          {{ game.min_players === game.max_players ? game.min_players : `${game.min_players}–${game.max_players}` }} joueurs
        </span>
      </div>
    </div>

    <h3 class="card-name">{{ game.name }}</h3>
    <p class="card-desc">{{ game.description }}</p>

    <div class="card-actions">
      <button v-if="game.solo_url" class="btn btn-secondary btn-sm btn-full" @click="$emit('play', game)">
        Jouer seul →
      </button>
      <div v-if="game.has_multiplayer" class="actions-multi">
        <button class="btn btn-primary btn-sm" @click="$emit('create', game)">Créer une salle</button>
        <button class="btn btn-secondary btn-sm" @click="$emit('join', game)">Rejoindre</button>
      </div>
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
.card-top  { position: relative; display: flex; align-items: flex-start; justify-content: space-between; }
.card-icon { font-size: 2.2rem; line-height: 1; }
.card-badges { display: flex; flex-direction: column; align-items: flex-end; gap: .3rem; }
.card-name { position: relative; font-family: var(--font-title); font-size: 1.15rem; font-weight: 800; margin: .7rem 0 0; }
.card-desc { position: relative; font-size: .84rem; color: var(--text-2); line-height: 1.55; margin: .4rem 0 0; flex: 1; }

.card-actions { position: relative; margin-top: 1rem; display: flex; flex-direction: column; gap: .5rem; }
.actions-multi { display: flex; gap: .5rem; }
.actions-multi .btn-primary { flex: 1; }
</style>
