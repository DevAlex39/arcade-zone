<template>
  <div class="auth-page">
    <div class="auth-card card text-center">
      <span class="join-icon">{{ room?.icon || '🎮' }}</span>
      <h2 class="mt-1">{{ room?.game_name || 'Salle' }}</h2>
      <div class="lobby-code mt-1">{{ code }}</div>
      <p class="text-muted mt-1" v-if="room">
        {{ room.players?.length || 0 }} / {{ room.max_players }} joueurs
      </p>

      <!-- Saisie pseudo si non authentifié -->
      <template v-if="!auth.isLoggedIn">
        <p class="text-muted" style="font-size:.82rem; margin-top:.75rem;">
          Tu rejoins en tant qu'invité — entre un pseudo :
        </p>
        <input v-model="guestName" placeholder="Pseudo" maxlength="20"
               style="text-align:center; margin-top:.5rem;" @keydown.enter="join" />
        <p class="text-muted" style="font-size:.72rem; margin-top:.3rem;">
          Ou <router-link to="/login" style="color:var(--cyan)">connecte-toi</router-link> pour sauvegarder tes stats.
        </p>
      </template>

      <p v-if="error" class="auth-error mt-2">{{ error }}</p>
      <button class="btn btn-primary btn-full btn-lg mt-2"
              :disabled="loading || !!error || (!auth.isLoggedIn && !guestName.trim())"
              @click="join">
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
import { useAuthStore } from '@/stores/auth.js';

const route    = useRoute();
const router   = useRouter();
const platform = usePlatformStore();
const auth     = useAuthStore();

const code      = route.params.code.toUpperCase();
const room      = ref(null);
const loading   = ref(false);
const error     = ref('');
const guestName = ref('');

onMounted(async () => {
  try {
    room.value = await platform.fetchRoom(code);
    if (room.value.status !== 'waiting') error.value = 'Cette partie a déjà commencé.';
  } catch {
    error.value = 'Salle introuvable ou expirée.';
  }
});

async function join() {
  if (!auth.isLoggedIn && !guestName.value.trim()) return;
  loading.value = true;
  try {
    // Si non authentifié, créer une session invitée d'abord
    if (!auth.isLoggedIn) {
      await auth.loginAsGuest(guestName.value.trim());
    }
    await platform.joinRoom(code, auth.user?.isGuest ? guestName.value.trim() : undefined);
    router.push(`/lobby/${code}`);
  } catch (e) {
    error.value = e.response?.data?.error || 'Impossible de rejoindre';
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
