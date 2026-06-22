<template>
  <div class="auth-page">
    <div class="text-center">
      <span class="spin" style="font-size:2rem">⟳</span>
      <p class="text-muted mt-2">Connexion via Google…</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import axios from 'axios';

const route  = useRoute();
const router = useRouter();
const auth   = useAuthStore();

onMounted(async () => {
  const token = route.query.token;
  if (!token) { router.push('/login?error=google'); return; }
  try {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const { data } = await axios.get('/api/auth/me');
    auth.setAuth({ token, user: data.user });
    router.push('/');
  } catch {
    router.push('/login?error=google');
  }
});
</script>

<style scoped>
.auth-page { flex:1; display:flex; align-items:center; justify-content:center; }
</style>
