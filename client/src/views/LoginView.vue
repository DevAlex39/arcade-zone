<template>
  <div class="auth-page">
    <div class="auth-card card">
      <h2 class="auth-title">Connexion</h2>
      <p class="text-muted mb-2">Heureux de te revoir !</p>

      <form @submit.prevent="submit" class="auth-form">
        <div class="input-group">
          <label>Identifiant ou email</label>
          <input v-model="form.login" type="text" placeholder="alexis ou alexis@mail.com" required />
        </div>
        <div class="input-group">
          <label>Mot de passe</label>
          <input v-model="form.password" type="password" placeholder="••••••••" required />
        </div>

        <p v-if="error" class="auth-error">{{ error }}</p>

        <button class="btn btn-primary btn-full mt-2" :disabled="loading">
          <span v-if="loading" class="spin">⟳</span>
          {{ loading ? 'Connexion…' : 'Se connecter →' }}
        </button>
      </form>

      <div class="divider mt-2 mb-2">ou</div>

      <a class="btn btn-google btn-full" :href="googleUrl">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuer avec Google
      </a>

      <p class="auth-footer">Pas encore de compte ? <router-link to="/register">S'inscrire</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { useXpStore } from '@/stores/xp.js';

const auth    = useAuthStore();
const xpStore = useXpStore();
const router  = useRouter();
const route   = useRoute();

const form    = ref({ login: '', password: '' });
const error   = ref('');
const loading = ref(false);

const googleUrl = '/api/auth/google';

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    const data = await auth.login(form.value.login, form.value.password);
    await xpStore.fetchMe();
    if (data?.dailyBonus && !data.dailyBonus.already) {
      xpStore.showXpToast('Bonus connexion journalier !', data.dailyBonus.bonus || 25);
    }
    router.push(route.query.redirect || '/');
  } catch (e) {
    error.value = e.response?.data?.error || 'Erreur de connexion';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; }
.auth-card { max-width: 400px; width: 100%; }
.auth-title { font-size: 1.5rem; margin-bottom: .25rem; }
.auth-form { display: flex; flex-direction: column; gap: .75rem; }
.auth-error { color: #f87171; font-size: .82rem; background: rgba(239,68,68,.1); padding: .5rem .75rem; border-radius: 7px; }
.auth-footer { text-align: center; font-size: .85rem; color: var(--text-2); margin-top: 1rem; }
.auth-footer a { color: var(--cyan); text-decoration: none; }
</style>
