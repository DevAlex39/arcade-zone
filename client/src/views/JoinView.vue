<template>
  <div class="auth-page">
    <div class="auth-card card text-center">
      <span class="join-icon">{{ room?.icon || '🎮' }}</span>
      <h2 class="mt-1">{{ room?.game_name || 'Salle' }}</h2>
      <div class="lobby-code mt-1">{{ code }}</div>
      <p class="text-muted mt-1" v-if="room">
        {{ room.players?.length || 0 }} / {{ room.max_players }} joueurs
      </p>
      <p v-if="error" class="auth-error mt-2">{{ error }}</p>
      <button class="btn btn-primary btn-full btn-lg mt-2" :disabled="loading || !!error" @click="join">
        <span v-if="loading" class="spin">⟳</span>
        {{ loading ? 'Connexion…' : 'Rejoindre la partie →' }}
      </button>
      <router-link to="/" class="btn btn-ghost btn-full mt-1">Annuler</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlatformStore } from '@/stores/platform.js';

const route    = useRoute();
const router   = useRouter();
const platform = usePlatformStore();

const code    = route.params.code.toUpperCase();
const room    = ref(null);
const loading = ref(false);
const error   = ref('');

onMounted(async () => {
  try {
    room.value = await platform.fetchRoom(code);
    if (room.value.status !== 'waiting') error.value = 'Cette partie a déjà commencé.';
  } catch {
    error.value = 'Salle introuvable ou expirée.';
  }
});

async function join() {
  loading.value = true;
  try {
    await platform.joinRoom(code);
    router.push(`/lobby/${code}`);
  } catch (e) {
    error.value = e.response?.data?.error || 'Impossible de rejoindre';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page { flex:1; display:flex; align-items:center; justify-content:center; padding:2rem 1rem; }
.auth-card { max-width:360px; width:100%; }
.join-icon { font-size:3rem; }
.lobby-code { font-family:var(--font-title); font-size:2.4rem; font-weight:800; letter-spacing:.25em; color:var(--cyan); }
.auth-error { color:#f87171; font-size:.82rem; background:rgba(239,68,68,.1); padding:.5rem .75rem; border-radius:7px; }
</style>
