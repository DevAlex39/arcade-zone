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

          <!-- Paramètres Motus (hôte seulement) -->
          <div class="card lobby-settings" v-if="isHost && room.game_id === 'motus-multi'">
            <h3 class="settings-title">Paramètres</h3>
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
            <div class="setting-toggle">
              <label><input type="checkbox" v-model="settings.syncWords" /> Même mot pour tous</label>
            </div>
            <div class="setting-toggle">
              <label><input type="checkbox" v-model="settings.comboEnabled" /> Mode Combo (×2, ×3…)</label>
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
const settings = ref({ livesMax: 20, maxAttempts: 6, syncWords: true, comboEnabled: true });
let   socket   = null;

const isHost   = computed(() => {
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

  // Attendre la connexion avant d'émettre (fix timing)
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

  socket.on('round_start', () => {
    router.push(`/game/${room.value.game_id}?room=${room.value.code}`);
  });

  socket.on('connect_error', (err) => platform.showToast('Erreur de connexion : ' + err.message, 'error'));
  socket.on('error', (msg) => platform.showToast(msg, 'error'));
}

function startGame() {
  if (!socket) return;
  socket.emit('start_game', room.value.code);
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
.setting-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: .5rem; font-size: .85rem; }
.stepper { display: flex; align-items: center; gap: .6rem; }
.stepper button { width: 26px; height: 26px; border-radius: 6px; background: var(--bg-4); border: 1px solid var(--border); color: var(--text); cursor: pointer; font-size: 1rem; }
.setting-toggle { font-size: .83rem; margin-bottom: .35rem; }
.setting-toggle label { display: flex; align-items: center; gap: .5rem; cursor: pointer; }
.setting-toggle input { accent-color: var(--cyan); }

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

.waiting-msg { display: flex; align-items: center; gap: .6rem; color: var(--text-2); font-size: .88rem; padding: 1rem; background: var(--bg-3); border-radius: var(--radius); }
.loading-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .5rem; }
</style>
