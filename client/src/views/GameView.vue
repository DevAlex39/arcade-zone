<template>
  <div class="game-view">

    <!-- JEU SOLO : iframe vers le jeu HTML existant -->
    <template v-if="game && !game.has_multiplayer && !roomCode">
      <div class="solo-bar">
        <router-link to="/" class="btn btn-ghost btn-sm">← Menu</router-link>
        <span class="solo-title">{{ game.icon }} {{ game.name }}</span>
        <span class="badge badge-cyan">Solo</span>
      </div>
      <iframe :src="game.solo_url" class="game-frame" :title="game.name" />
    </template>

    <!-- JEU MULTI Motus : composant socket -->
    <template v-else-if="game?.id === 'motus' && roomCode">
      <MotusMultiGame :room-code="roomCode" :game="game" />
    </template>

    <!-- JEU MULTI avec solo_url : iframe (multi socket pas encore implémenté) -->
    <template v-else-if="game?.solo_url && roomCode">
      <div class="solo-bar">
        <router-link to="/" class="btn btn-ghost btn-sm">← Menu</router-link>
        <span class="solo-title">{{ game.icon }} {{ game.name }}</span>
        <span class="badge badge-rose">Multi</span>
      </div>
      <iframe :src="game.solo_url" class="game-frame" :title="game.name" />
    </template>

    <!-- Solo sans multi -->
    <template v-else-if="game && !game.has_multiplayer">
      <div class="solo-bar">
        <router-link to="/" class="btn btn-ghost btn-sm">← Menu</router-link>
        <span class="solo-title">{{ game.icon }} {{ game.name }}</span>
        <span class="badge badge-cyan">Solo</span>
      </div>
      <iframe :src="game.solo_url" class="game-frame" :title="game.name" />
    </template>

    <!-- État de chargement -->
    <div v-else class="loading-state">
      <span class="spin" style="font-size:2rem">⟳</span>
      <p class="text-muted mt-2">Chargement…</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { usePlatformStore } from '@/stores/platform.js';
import MotusMultiGame from '@/views/games/MotusMultiGame.vue';

const route    = useRoute();
const platform = usePlatformStore();

const game     = computed(() => platform.games.find(g => g.id === route.params.gameId));
const roomCode = computed(() => route.query.room || null);
</script>

<style scoped>
.game-view { flex: 1; display: flex; flex-direction: column; }

.solo-bar {
  display: flex; align-items: center; gap: .75rem;
  padding: .6rem 1rem;
  background: var(--bg-2); border-bottom: 1px solid var(--border);
}
.solo-title { flex: 1; font-weight: 700; font-size: .9rem; }
.game-frame { flex: 1; border: none; width: 100%; min-height: calc(100vh - 48px - 48px); }

.loading-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
</style>
