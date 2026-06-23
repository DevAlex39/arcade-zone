<template>
  <div class="lobby-page">
    <div class="lobby-inner" v-if="room">

      <!-- Header -->
      <div class="lobby-header">
        <router-link to="/" class="btn btn-ghost btn-sm">← Retour</router-link>
        <div>
          <span class="badge badge-cyan">{{ room.game_name }}</span>
          <span class="badge badge-violet ml-1">{{ room.icon }}</span>
        </div>
      </div>

      <div class="lobby-layout">

        <!-- LEFT: code + QR -->
        <div class="lobby-share card">
          <h2 class="lobby-code-label">Code de la salle</h2>
          <div class="lobby-code">{{ room.code }}</div>

          <div class="qr-wrap">
            <img :src="room.qr" alt="QR code" class="qr-img" />
          </div>

          <div class="share-actions">
            <button class="btn btn-secondary btn-sm btn-full" @click="copyLink">
              {{ copied ? '✅ Copié !' : '📋 Copier le lien' }}
            </button>
          </div>

          <p class="share-hint">Partagez ce code ou ce QR code — les autres joueurs se connectent sur leur propre appareil.</p>
        </div>

        <!-- RIGHT: settings + players -->
        <div class="lobby-right">

          <!-- Paramètres Petits Chevaux (hôte seulement) -->
          <div class="card lobby-settings" v-if="isHost && room.game_id === 'petits-chevaux'">
            <h3 class="settings-title">Paramètres</h3>
            <div class="setting-row">
              <label>Pions par joueur</label>
              <div class="stepper">
                <button @click="settings.pionsPerPlayer = Math.max(1, settings.pionsPerPlayer - 1)">−</button>
                <span>{{ settings.pionsPerPlayer }}</span>
                <button @click="settings.pionsPerPlayer = Math.min(5, settings.pionsPerPlayer + 1)">+</button>
              </div>
            </div>
            <div class="setting-row">
              <span class="toggle-label">🎲 Rejouer sur 6</span>
              <button class="toggle" :class="{ on: settings.rejouerSur6 }" @click="settings.rejouerSur6 = !settings.rejouerSur6">
                <span class="toggle-thumb" />
              </button>
            </div>
          </div>

          <!-- Paramètres Motus (hôte seulement) -->
          <div class="card lobby-settings" v-if="isHost && room.game_id === 'motus'">
            <h3 class="settings-title">Paramètres</h3>

            <!-- Catégories (multi-sélection) -->
            <div class="setting-block">
              <label class="setting-label">Catégories <span class="badge-beta">Bêta</span></label>
              <div class="cat-grid">
                <button
                  v-for="cat in CATEGORY_LIST"
                  :key="cat.id"
                  class="cat-chip"
                  :class="{ active: isCatActive(cat.id) }"
                  @click="toggleCat(cat.id)"
                >{{ cat.icon }} {{ cat.label }}</button>
              </div>
            </div>

            <div class="setting-row">
              <label>Vies de départ</label>
              <div class="stepper">
                <button @click="settings.livesMax = Math.max(5, settings.livesMax - 5)">−</button>
                <span>{{ settings.livesMax }}</span>
                <button @click="settings.livesMax = Math.min(50, settings.livesMax + 5)">+</button>
              </div>
            </div>
            <div class="setting-row">
              <label>Essais par mot</label>
              <div class="stepper">
                <button @click="settings.maxAttempts = Math.max(4, settings.maxAttempts - 1)">−</button>
                <span>{{ settings.maxAttempts }}</span>
                <button @click="settings.maxAttempts = Math.min(8, settings.maxAttempts + 1)">+</button>
              </div>
            </div>
            <div class="setting-row">
              <label>Lettres min</label>
              <div class="stepper">
                <button @click="settings.minLetters = Math.max(4, settings.minLetters - 1)">−</button>
                <span>{{ settings.minLetters }}</span>
                <button @click="settings.minLetters = Math.min(settings.maxLetters, settings.minLetters + 1)">+</button>
              </div>
            </div>
            <div class="setting-row">
              <label>Lettres max</label>
              <div class="stepper">
                <button @click="settings.maxLetters = Math.max(settings.minLetters, settings.maxLetters - 1)">−</button>
                <span>{{ settings.maxLetters }}</span>
                <button @click="settings.maxLetters = Math.min(8, settings.maxLetters + 1)">+</button>
              </div>
            </div>
            <div class="setting-row">
              <span class="toggle-label">Même mot pour tous</span>
              <button class="toggle" :class="{ on: settings.syncWords }" @click="settings.syncWords = !settings.syncWords">
                <span class="toggle-thumb" />
              </button>
            </div>
            <div class="setting-row">
              <span class="toggle-label">Mode Combo (×2, ×3…)</span>
              <button class="toggle" :class="{ on: settings.comboEnabled }" @click="settings.comboEnabled = !settings.comboEnabled">
                <span class="toggle-thumb" />
              </button>
            </div>
            <div class="setting-row">
              <span class="toggle-label">Changer de mot dès qu'un joueur trouve</span>
              <button class="toggle" :class="{ on: settings.changeOnFind }" @click="settings.changeOnFind = !settings.changeOnFind">
                <span class="toggle-thumb" />
              </button>
            </div>
          </div>

          <!-- Liste des joueurs -->
          <div class="card lobby-players">
            <h3 class="settings-title">Joueurs ({{ room.players?.length || 0 }} / {{ room.max_players }})</h3>
            <div class="player-list">
              <div v-for="p in room.players" :key="p.id" class="player-row">
                <div class="player-avatar">{{ p.username[0].toUpperCase() }}</div>
                <span class="player-name">{{ p.username }}</span>
                <span v-if="p.id === room.host_id" class="badge badge-amber">Hôte</span>
                <span v-else-if="p.online !== false" class="badge badge-green">En ligne</span>
                <span v-else class="badge" style="color:var(--text-3)">Déconnecté</span>
                <!-- Bouton kick (hôte seulement, pas sur soi-même) -->
                <button
                  v-if="isHost && p.id !== room.host_id"
                  class="btn-kick"
                  title="Exclure ce joueur"
                  @click="kickPlayer(p.id)"
                >✕</button>
              </div>
              <div v-if="(room.players?.length || 0) < room.max_players" class="player-row placeholder">
                <div class="player-avatar ghost">?</div>
                <span class="text-muted">En attente…</span>
              </div>
            </div>
          </div>

          <!-- Lancer -->
          <button
            v-if="isHost"
            class="btn btn-primary btn-full btn-lg"
            :disabled="!canStart"
            @click="startGame"
          >
            {{ canStart ? 'Lancer la partie →' : `Il faut au moins ${room.min_players} joueurs` }}
          </button>
          <div v-else class="waiting-msg">
            <span class="spin">⟳</span> En attente que l'hôte lance la partie…
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading-state">
      <span class="spin" style="font-size:2rem">⟳</span>
      <p class="text-muted mt-2">Chargement de la salle…</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.js';
import { usePlatformStore } from '@/stores/platform.js';

const route    = useRoute();
const router   = useRouter();
const auth     = useAuthStore();
const platform = usePlatformStore();

const room     = ref(null);
const copied   = ref(false);
const settings = ref({
  livesMax: 20, maxAttempts: 6, syncWords: true, comboEnabled: true,
  minLetters: 5, maxLetters: 6, lang: 'fr', changeOnFind: false,
  categories: ['tous'],
  pionsPerPlayer: 2, rejouerSur6: true,
});
let socket = null;

const CATEGORY_LIST = [
  { id: 'tous',       icon: '📚', label: 'Tous les mots' },
  { id: 'animaux',    icon: '🐾', label: 'Animaux' },
  { id: 'cuisine',    icon: '🍽️', label: 'Cuisine & Nourriture' },
  { id: 'sport',      icon: '⚽', label: 'Sport' },
  { id: 'nature',     icon: '🌿', label: 'Nature & Plantes' },
  { id: 'geographie', icon: '🌍', label: 'Géographie' },
  { id: 'metiers',    icon: '👷', label: 'Métiers' },
  { id: 'corps',      icon: '🫀', label: 'Corps humain' },
  { id: 'transport',  icon: '🚗', label: 'Transport' },
];

function isCatActive(id) {
  return settings.value.categories.includes(id);
}
function toggleCat(id) {
  const cats = settings.value.categories;
  if (id === 'tous') {
    settings.value.categories = ['tous'];
    return;
  }
  // Retirer 'tous' si on sélectionne une vraie catégorie
  let next = cats.filter(c => c !== 'tous');
  if (next.includes(id)) {
    next = next.filter(c => c !== id);
  } else {
    next.push(id);
  }
  settings.value.categories = next.length ? next : ['tous'];
}

const isHost = computed(() => {
  if (!room.value || !auth.user) return false;
  if (auth.user.isGuest) return room.value.host_name === auth.user.username;
  return room.value.host_id === auth.user.id;
});
const canStart = computed(() => (room.value?.players?.length || 0) >= (room.value?.min_players || 2));

async function loadRoom() {
  try {
    const data = await platform.fetchRoom(route.params.code);
    room.value = data;
    if (data.settings) settings.value = { ...settings.value, ...data.settings };
    connectSocket();
  } catch {
    platform.showToast('Salle introuvable', 'error');
    router.push('/');
  }
}

function connectSocket() {
  socket = io('/', { auth: { token: auth.token, username: auth.user?.username } });

  socket.on('connect', () => {
    socket.emit('init_room', {
      code:       room.value.code,
      gameId:     room.value.game_id,
      settings:   settings.value,
      maxPlayers: room.value.max_players,
      minPlayers: room.value.min_players,
    });
  });

  socket.on('room_update', (data) => {
    room.value = { ...room.value, ...data };
  });

  // Motus démarre avec round_start, les autres jeux avec leur propre événement
  socket.on('round_start',    () => router.push(`/game/${room.value.game_id}?room=${room.value.code}`));
  socket.on('yahtzee_state',  () => router.push(`/game/${room.value.game_id}?room=${room.value.code}`));
  socket.on('skyjo_state',    () => router.push(`/game/${room.value.game_id}?room=${room.value.code}`));
  socket.on('pc_state',       () => router.push(`/game/${room.value.game_id}?room=${room.value.code}`));

  socket.on('kicked', () => {
    platform.showToast('Vous avez été exclu de la salle par l\'hôte', 'error');
    router.push('/');
  });

  socket.on('connect_error', (err) => platform.showToast('Erreur de connexion : ' + err.message, 'error'));
  socket.on('error', (msg) => platform.showToast(msg, 'error'));
}

function startGame() {
  if (!socket) return;
  // Synchroniser les settings avant de lancer (l'init_room initial ne capture pas les changements tardifs)
  socket.emit('update_settings', { code: room.value.code, settings: settings.value });
  socket.emit('start_game', room.value.code);
}

function kickPlayer(targetId) {
  if (!socket) return;
  socket.emit('kick_player', { code: room.value.code, targetId });
}

async function copyLink() {
  await navigator.clipboard.writeText(room.value.joinUrl);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

onMounted(loadRoom);
onUnmounted(() => socket?.disconnect());
</script>

<style scoped>
.lobby-page { flex: 1; padding: 1.5rem 1rem; }
.lobby-inner { max-width: 900px; margin: 0 auto; }
.lobby-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.ml-1 { margin-left: .35rem; }

.lobby-layout { display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; }
@media (max-width: 680px) { .lobby-layout { grid-template-columns: 1fr; } }

.lobby-share { text-align: center; display: flex; flex-direction: column; gap: .75rem; }
.lobby-code-label { font-size: .75rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-2); }
.lobby-code {
  font-family: var(--font-title); font-size: 2.8rem; font-weight: 800; letter-spacing: .25em;
  color: var(--cyan); text-shadow: 0 0 20px rgba(56,189,248,.4);
}
.qr-wrap { background: var(--bg-3); border-radius: var(--radius); padding: 1rem; }
.qr-img { width: 100%; max-width: 160px; border-radius: 8px; }
.share-hint { font-size: .75rem; color: var(--text-3); line-height: 1.5; }

.lobby-right { display: flex; flex-direction: column; gap: 1rem; }
.settings-title { font-size: .85rem; font-weight: 800; color: var(--text-2); text-transform: uppercase; letter-spacing: .06em; margin-bottom: .75rem; }
.setting-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: .6rem; font-size: .85rem; gap: .75rem; }
.toggle-label { flex: 1; line-height: 1.3; }

/* Stepper */
.stepper { display: flex; align-items: center; gap: 0; background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.stepper button {
  width: 30px; height: 30px; background: transparent; border: none;
  color: var(--text); cursor: pointer; font-size: 1.1rem; font-weight: 700;
  transition: background .12s;
}
.stepper button:hover { background: var(--bg-4); }
.stepper span { min-width: 28px; text-align: center; font-weight: 700; font-size: .9rem; border-left: 1px solid var(--border); border-right: 1px solid var(--border); padding: 0 4px; }

/* Toggle pill */
.toggle {
  position: relative; display: inline-flex; align-items: center;
  width: 44px; height: 24px; border-radius: 999px; border: none; cursor: pointer;
  background: var(--bg-4); border: 1px solid var(--border);
  transition: background .2s, border-color .2s;
  flex-shrink: 0; padding: 0;
}
.toggle.on { background: var(--cyan, #38bdf8); border-color: var(--cyan, #38bdf8); }
.toggle-thumb {
  position: absolute; left: 3px; width: 18px; height: 18px; border-radius: 50%;
  background: var(--text-3); transition: left .2s, background .2s;
}
.toggle.on .toggle-thumb { left: 23px; background: #fff; }

/* Catégorie */
.setting-block { margin-bottom: .6rem; font-size: .85rem; }
.setting-label { display: block; margin-bottom: .4rem; color: var(--text-2, #8c95b8); }
.cat-grid { display: flex; flex-wrap: wrap; gap: .35rem; }
.cat-chip {
  padding: .25rem .6rem; border-radius: 20px; font-size: .75rem; cursor: pointer;
  border: 1px solid var(--border); background: var(--bg-3); color: var(--text-2, #8c95b8);
  transition: all .15s;
}
.cat-chip:hover { border-color: var(--cyan, #46d6ff); color: var(--text); }
.cat-chip.active { background: color-mix(in srgb, var(--cyan, #46d6ff) 15%, transparent); border-color: var(--cyan, #46d6ff); color: var(--cyan, #46d6ff); font-weight: 600; }
.badge-beta {
  display: inline-block; background: rgba(251,191,36,.15); border: 1px solid rgba(251,191,36,.4);
  color: #fbbf24; border-radius: 4px; padding: 0 .35rem; font-size: .65rem;
  font-weight: 700; letter-spacing: .04em; vertical-align: middle; margin-left: .3rem;
}

/* Players */
.player-list { display: flex; flex-direction: column; gap: .5rem; }
.player-row { display: flex; align-items: center; gap: .6rem; }
.player-avatar {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--cyan), var(--violet));
  display: flex; align-items: center; justify-content: center;
  font-size: .75rem; font-weight: 800; color: var(--bg);
}
.player-avatar.ghost { background: var(--bg-4); color: var(--text-3); }
.player-name { flex: 1; font-weight: 600; }
.player-row.placeholder { opacity: .4; }

/* Kick button */
.btn-kick {
  background: transparent; border: 1px solid rgba(239,68,68,.35); border-radius: 6px;
  color: #f87171; cursor: pointer; width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center; font-size: .7rem;
  transition: background .12s;
  flex-shrink: 0;
}
.btn-kick:hover { background: rgba(239,68,68,.15); }

.waiting-msg { display: flex; align-items: center; gap: .6rem; color: var(--text-2); font-size: .88rem; padding: 1rem; background: var(--bg-3); border-radius: var(--radius); }
.loading-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .5rem; }
</style>
