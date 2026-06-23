<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <router-link to="/" class="brand">
        <span class="brand-icon">🎮</span>
        <span class="brand-text">ARCADE<span class="brand-zone">ZONE</span></span>
      </router-link>

      <div class="nav-right">
        <!-- Theme switcher -->
        <div class="switcher" title="Thème">
          <button
            class="sw-btn"
            :class="{ active: platform.theme === 'cobalt' }"
            @click="platform.setTheme('cobalt')"
          >🌌</button>
          <button
            class="sw-btn"
            :class="{ active: platform.theme === 'ember' }"
            @click="platform.setTheme('ember')"
          >🔥</button>
        </div>

        <!-- Lang switcher -->
        <div class="switcher" title="Langue">
          <button
            class="sw-btn sw-text"
            :class="{ active: platform.lang === 'fr' }"
            @click="platform.setLang('fr')"
          >FR</button>
          <button
            class="sw-btn sw-text"
            :class="{ active: platform.lang === 'en' }"
            @click="platform.setLang('en')"
          >EN</button>
        </div>

        <template v-if="auth.isLoggedIn">
          <router-link v-if="auth.isAdmin" to="/admin" class="btn btn-ghost btn-sm">⚙ Admin</router-link>
          <div class="user-pill">
            <span class="user-avatar">{{ initials }}</span>
            <span class="user-name">{{ auth.user.username }}</span>
            <button class="btn btn-ghost btn-sm" @click="handleLogout">Déco</button>
          </div>
        </template>
        <template v-else>
          <router-link to="/login"    class="btn btn-ghost btn-sm">Connexion</router-link>
          <router-link to="/register" class="btn btn-primary btn-sm">S'inscrire</router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { usePlatformStore } from '@/stores/platform.js';

const auth     = useAuthStore();
const platform = usePlatformStore();
const router   = useRouter();

const initials = computed(() => {
  if (!auth.user) return '?';
  const u = auth.user;
  return ((u.first_name?.[0] || '') + (u.last_name?.[0] || u.username?.[0] || '')).toUpperCase() || '?';
});

function handleLogout() {
  auth.logout();
  router.push('/');
}
</script>

<style scoped>
.navbar {
  position: sticky; top: 0; z-index: 50;
  background: rgba(13,15,26,.85); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
html[data-theme="ember"] .navbar { background: rgba(16,13,10,.88); }

.navbar-inner {
  max-width: 1200px; margin: 0 auto;
  padding: .65rem 1.5rem;
  display: flex; align-items: center; justify-content: space-between;
}
.brand {
  display: flex; align-items: center; gap: .6rem;
  text-decoration: none;
}
.brand-icon { font-size: 1.4rem; }
.brand-text {
  font-family: var(--font-title); font-size: 1.2rem; font-weight: 800; letter-spacing: .1em;
  color: var(--cyan); text-transform: uppercase;
}
.brand-zone { color: var(--violet); }

.nav-right { display: flex; align-items: center; gap: .5rem; }

/* Switcher pill */
.switcher {
  display: flex; background: var(--bg-3); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden; flex-shrink: 0;
}
.sw-btn {
  padding: .3rem .5rem; background: transparent; border: none;
  cursor: pointer; font-size: .85rem; color: var(--text-2);
  transition: background .12s, color .12s;
}
.sw-btn.sw-text { font-size: .72rem; font-weight: 800; letter-spacing: .05em; padding: .3rem .45rem; }
.sw-btn:hover { color: var(--text); background: var(--bg-4); }
.sw-btn.active { background: var(--bg-4); color: var(--cyan); }

.user-pill {
  display: flex; align-items: center; gap: .5rem;
  background: var(--bg-3); border: 1px solid var(--border);
  border-radius: 999px; padding: .3rem .3rem .3rem .5rem;
}
.user-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, var(--cyan), var(--violet));
  color: var(--bg); font-size: .7rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.user-name { font-size: .82rem; font-weight: 700; color: var(--text); }
</style>
