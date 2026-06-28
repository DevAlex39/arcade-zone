<template>
  <NavBar />

  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>

  <!-- Toast global -->
  <transition name="toast">
    <div v-if="platform.toast" class="global-toast" :class="`toast-${platform.toast.type}`">
      {{ platform.toast.msg }}
    </div>
  </transition>

  <XpToast />
</template>

<script setup>
import { onMounted, watch } from 'vue';
import NavBar from '@/components/NavBar.vue';
import XpToast from '@/components/XpToast.vue';
import { useAuthStore } from '@/stores/auth.js';
import { usePlatformStore } from '@/stores/platform.js';
import { useXpStore } from '@/stores/xp.js';

const auth     = useAuthStore();
const platform = usePlatformStore();
const xpStore  = useXpStore();

onMounted(async () => {
  platform.applyTheme();
  await auth.init();
  await platform.fetchGames();
  if (auth.isLoggedIn && !auth.user?.isGuest) {
    await xpStore.fetchMe();
  }
});

// Re-fetch XP si l'utilisateur se connecte après le mount
watch(() => auth.isLoggedIn, async (loggedIn) => {
  if (loggedIn && !auth.user?.isGuest) {
    await xpStore.fetchMe();
  }
});
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.global-toast {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999;
  padding: .7rem 1.2rem; border-radius: 10px;
  font-weight: 700; font-size: .88rem;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 20px rgba(0,0,0,.4);
}
.toast-info    { background: rgba(56,189,248,.2);  border: 1px solid rgba(56,189,248,.4);  color: #38bdf8; }
.toast-success { background: rgba(74,222,128,.2);  border: 1px solid rgba(74,222,128,.4);  color: #4ade80; }
.toast-error   { background: rgba(239,68,68,.2);   border: 1px solid rgba(239,68,68,.4);   color: #f87171; }
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }
</style>
