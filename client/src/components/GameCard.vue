<template>
  <div class="game-card" :style="{ '--card-color': game.color }">
    <div class="card-glow" />
    <div class="card-top">
      <span class="card-icon">{{ game.icon }}</span>
      <div class="card-badges">
        <span v-if="game.solo_url && !game.has_multiplayer" class="badge badge-cyan">Solo</span>
        <span v-else-if="!game.solo_url && game.has_multiplayer" class="badge badge-rose">Multi</span>
        <template v-else>
          <span class="badge badge-cyan">Solo</span>
          <span class="badge badge-rose">Multi</span>
        </template>
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
        <div class="actions-multi">
          <button class="btn btn-primary btn-sm" @click="$emit('create', game)">Créer une salle</button>
          <button class="btn btn-secondary btn-sm" @click="$emit('join', game)">Rejoindre</button>
        </div>
      </template>

      <!-- Solo + Multi -->
      <template v-else>
        <div class="actions-split">
          <div class="actions-solo">
            <span class="action-label">SOLO</span>
            <button class="btn btn-secondary btn-sm" @click="$emit('play', game)">Jouer seul →</button>
          </div>
          <div class="actions-divider" />
          <div class="actions-multi-group">
            <span class="action-label action-label-rose">MULTI</span>
            <div class="actions-multi">
              <button class="btn btn-primary btn-sm" @click="$emit('create', game)">Créer</button>
              <button class="btn btn-secondary btn-sm" @click="$emit('join', game)">Rejoindre</button>
            </div>
          </div>
        </div>
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

/* Actions */
.card-actions { margin-top: .25rem; }

.actions-multi { display: flex; gap: .5rem; }

/* Solo + Multi split */
.actions-split {
  display: flex; flex-direction: column; gap: .5rem;
  background: var(--bg-3); border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  padding: .6rem .75rem;
}
.actions-divider {
  height: 1px; background: var(--border); margin: 0 -.75rem;
}
.actions-solo, .actions-multi-group {
  display: flex; align-items: center; justify-content: space-between; gap: .5rem;
}
.action-label {
  font-size: .65rem; font-weight: 800; letter-spacing: .1em;
  color: var(--cyan); text-transform: uppercase; white-space: nowrap;
}
.action-label-rose { color: var(--rose); }
</style>
