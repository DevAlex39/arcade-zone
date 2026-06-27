<template>
  <div class="home">

    <!-- HERO -->
    <section class="hero">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-halo" aria-hidden="true"></div>
      <div class="hero-inner">
        <div class="hero-badge">🎮 Plateforme de jeux</div>
        <h1 class="hero-title">ARCADE<span class="gradient-text">ZONE</span></h1>
        <p class="hero-sub">Joue seul ou affronte tes amis en temps réel — chacun sur son écran.</p>
        <div class="hero-actions">
          <template v-if="!auth.isLoggedIn">
            <router-link to="/register" class="btn btn-primary btn-lg">Créer un compte →</router-link>
            <router-link to="/login"    class="btn btn-secondary btn-lg">Connexion</router-link>
          </template>
          <template v-else>
            <span class="hero-welcome">
              Bienvenue, <strong>{{ auth.user.username }}</strong>
              <span v-if="auth.isGuest" class="badge badge-amber" style="margin-left:.5rem; font-size:.7rem;">Invité</span>
              👋
            </span>
            <button v-if="auth.isGuest" class="btn btn-ghost btn-sm" @click="auth.logout()">Changer de pseudo</button>
          </template>
        </div>
      </div>
    </section>

    <!-- JOIN BAR -->
    <section class="join-bar">
      <div class="join-bar-inner">
        <span class="text-muted">Tu as un code de partie ?</span>
        <div class="join-input-wrap">
          <input v-model="joinCode" placeholder="Ex: XKTP42" maxlength="6"
                 @keydown.enter="handleJoin" style="text-transform:uppercase; letter-spacing:.15em; font-weight:700;" />
          <button class="btn btn-primary btn-sm" @click="handleJoin" :disabled="joinCode.length < 6">Rejoindre →</button>
        </div>
      </div>
    </section>

    <!-- GAMES GRID -->
    <section class="games-section">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">Les jeux</h2>
          <div class="filter-tabs">
            <button v-for="f in filters" :key="f.value" class="filter-tab"
              :class="{ active: activeFilter === f.value }" @click="activeFilter = f.value">{{ f.label }}</button>
          </div>
        </div>

        <div v-if="platform.games.length === 0" class="loading-row"><span class="spin">⟳</span> Chargement…</div>

        <div class="games-grid">
          <GameCard v-for="g in filteredGames" :key="g.id" :game="g"
            @play="handlePlay"
            @create="(game) => requireIdentity(game, 'create')"
            @join="(game) => requireIdentity(game, 'join')" />
        </div>

        <p v-if="filteredGames.length === 0 && platform.games.length > 0" class="no-results">Aucun jeu dans cette catégorie.</p>
      </div>
    </section>

    <!-- Modal: rejoindre partie multi -->
    <div v-if="joinModalGame" class="modal-backdrop" @click.self="joinModalGame = null">
      <div class="modal-box">
        <h3>Rejoindre — {{ joinModalGame.name }}</h3>
        <p class="text-muted mt-1 mb-2">Entre le code de la salle partagé par ton ami :</p>
        <input v-model="joinCodeModal" placeholder="Ex: XKTP42" maxlength="6"
               style="text-transform:uppercase; letter-spacing:.15em; font-weight:700; font-size:1.2rem; text-align:center;" />
        <div class="flex gap-1 mt-2">
          <button class="btn btn-secondary btn-full" @click="joinModalGame = null">Annuler</button>
          <button class="btn btn-primary btn-full" @click="handleJoinModal" :disabled="joinCodeModal.length < 6">Rejoindre →</button>
        </div>
      </div>
    </div>

    <!-- Modal: invité -->
    <div v-if="guestModal.open" class="modal-backdrop" @click.self="guestModal.open = false">
      <div class="modal-box">
        <h3>Choisir un pseudo</h3>
        <p class="text-muted mt-1 mb-2">Tu joues sans compte — entre un pseudo pour cette session :</p>
        <input v-model="guestModal.name" placeholder="Pseudo" maxlength="20" @keydown.enter="confirmGuest"
               style="font-size:1rem; text-align:center;" ref="guestInput" />
        <p class="text-muted" style="font-size:.75rem; margin-top:.4rem;">
          Ou <router-link to="/login" style="color:var(--cyan)">connecte-toi</router-link> pour sauvegarder tes stats.
        </p>
        <div class="flex gap-1 mt-2">
          <button class="btn btn-secondary btn-full" @click="guestModal.open = false">Annuler</button>
          <button class="btn btn-primary btn-full" @click="confirmGuest" :disabled="!guestModal.name.trim()">Continuer →</button>
        </div>
        <div v-if="guestModal.error" class="text-error mt-1">{{ guestModal.error }}</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import GameCard from '@/components/GameCard.vue';
import { useAuthStore } from '@/stores/auth.js';
import { usePlatformStore } from '@/stores/platform.js';

const auth     = useAuthStore();
const platform = usePlatformStore();
const router   = useRouter();

const joinCode      = ref('');
const joinModalGame = ref(null);
const joinCodeModal = ref('');
const guestInput    = ref(null);
const activeFilter  = ref('all');

const filters = [
  { value: 'all',   label: 'Tout' },
  { value: 'solo',  label: 'Solo' },
  { value: 'multi', label: 'Multi' },
];

const pendingAction = ref(null);
const guestModal = ref({ open: false, name: '', error: '' });

const activeGames = computed(() => platform.games.filter(g => g.is_active));

const filteredGames = computed(() => {
  return activeGames.value.filter(g => {
    if (activeFilter.value === 'solo')  return g.solo_url || g.min_players === 1;
    if (activeFilter.value === 'multi') return g.has_multiplayer;
    return true;
  });
});

function handlePlay(game) {
  router.push(`/game/${game.id}`);
}

function requireIdentity(game, type) {
  if (auth.isLoggedIn) {
    executeAction(game, type);
  } else {
    pendingAction.value = { type, game };
    guestModal.value = { open: true, name: '', error: '' };
    nextTick(() => guestInput.value?.focus());
  }
}

async function confirmGuest() {
  const name = guestModal.value.name.trim();
  if (!name) return;
  guestModal.value.error = '';
  try {
    await auth.loginAsGuest(name);
    guestModal.value.open = false;
    if (pendingAction.value) {
      const { type, game } = pendingAction.value;
      pendingAction.value = null;
      executeAction(game, type);
    }
  } catch (e) {
    guestModal.value.error = e.response?.data?.error || 'Erreur';
  }
}

async function executeAction(game, type) {
  if (type === 'create') {
    await handleCreate(game);
  } else {
    showJoinPrompt(game);
  }
}

async function handleCreate(game) {
  try {
    const room = await platform.createRoom(game.id);
    router.push(`/lobby/${room.code}`);
  } catch (e) {
    platform.showToast(e.response?.data?.error || 'Erreur lors de la création', 'error');
  }
}

function showJoinPrompt(game) {
  joinModalGame.value = game;
  joinCodeModal.value = '';
}

function handleJoin() {
  const code = joinCode.value.toUpperCase().trim();
  if (code.length < 6) return;
  if (!auth.isLoggedIn) {
    pendingAction.value = { type: 'join-code', code };
    guestModal.value = { open: true, name: '', error: '' };
    nextTick(() => guestInput.value?.focus());
    return;
  }
  router.push(`/join/${code}`);
}

function handleJoinModal() {
  const code = joinCodeModal.value.toUpperCase().trim();
  if (code.length < 6) return;
  joinModalGame.value = null;
  router.push(`/join/${code}`);
}
</script>

<style scoped>
.home { flex: 1; display: flex; flex-direction: column; }

/* HERO */
.hero { position: relative; overflow: hidden; padding: 4.5rem 1.5rem 3.5rem; text-align: center; }
.hero-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size: 48px 48px;
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, black 35%, transparent 100%);
  mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, black 35%, transparent 100%);
}
.hero-halo {
  position: absolute; top: -120px; left: 50%; transform: translateX(-50%);
  width: 560px; height: 300px; pointer-events: none; filter: blur(8px);
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--cyan) 16%, transparent), transparent 70%);
}
.hero-inner { position: relative; max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 1.15rem; }
.hero-badge {
  display: inline-flex; align-items: center; gap: .4rem; font-size: .72rem; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase; padding: .3rem .7rem; border-radius: 999px;
  background: color-mix(in srgb, var(--cyan) 14%, transparent); color: var(--cyan);
  border: 1px solid color-mix(in srgb, var(--cyan) 35%, transparent);
}
.hero-title { font-family: var(--font-title); font-size: clamp(2.8rem, 8vw, 5.2rem); font-weight: 800; letter-spacing: .06em; line-height: .95; color: var(--text); }
.gradient-text { background: linear-gradient(135deg, var(--cyan), var(--violet)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.hero-sub { font-size: 1.1rem; color: var(--text-2); max-width: 460px; line-height: 1.65; }
.hero-actions { display: flex; gap: .75rem; flex-wrap: wrap; justify-content: center; align-items: center; margin-top: .3rem; }
.hero-welcome { font-size: 1rem; color: var(--text-2); padding: .6rem 1.2rem; background: var(--bg-3); border-radius: var(--radius-sm); border: 1px solid var(--border); }

/* JOIN BAR */
.join-bar { background: var(--bg-2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 1rem 1.5rem; }
.join-bar-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; justify-content: center; }
.join-input-wrap { display: flex; gap: .5rem; }
.join-input-wrap input { max-width: 180px; }

/* GAMES */
.games-section { flex: 1; padding: 3rem 1.5rem 5rem; }
.section-inner { max-width: 1200px; margin: 0 auto; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: .75rem; }
.section-title { font-family: var(--font-title); font-size: 1.5rem; font-weight: 800; }
.games-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1.25rem; }
.loading-row { color: var(--text-2); display: flex; align-items: center; gap: .5rem; padding: 2rem 0; }
.no-results  { color: var(--text-3); text-align: center; padding: 3rem 0; font-size: .9rem; }

.filter-tabs { display: flex; gap: .2rem; background: var(--bg-3); border-radius: var(--radius-sm); padding: .22rem; border: 1px solid var(--border); }
.filter-tab  { padding: .35rem .9rem; border-radius: 6px; border: none; background: transparent; color: var(--text-2); font-size: .8rem; font-weight: 700; cursor: pointer; transition: background .15s, color .15s; }
.filter-tab:hover  { color: var(--text); }
.filter-tab.active { background: var(--cyan); color: var(--bg); }

.text-error { color: #f87171; font-size: .82rem; }
</style>
