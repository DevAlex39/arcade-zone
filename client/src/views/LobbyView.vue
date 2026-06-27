<template>
  <div class="lobby-page">
    <div class="lobby-inner" v-if="room">

      <!-- Header -->
      <div class="lobby-header">
        <router-link to="/" class="btn btn-ghost btn-sm">← Retour</router-link>
        <div class="lobby-tags">
          <span class="badge badge-cyan">{{ room.game_name }}</span>
          <span class="badge badge-violet ml-1">{{ room.icon }}</span>
        </div>
      </div>

      <div class="lobby-layout">

        <!-- LEFT: code + QR -->
        <div class="lobby-share card">
          <h2 class="lobby-code-label">{{ t('lobby.room_code') }}</h2>
          <div class="lobby-code">{{ room.code }}</div>

          <div class="qr-wrap">
            <img :src="room.qr" alt="QR code" class="qr-img" />
          </div>

          <button class="btn btn-secondary btn-sm btn-full" @click="copyLink">
            {{ copied ? t('lobby.copied') : t('lobby.copy_link') }}
          </button>

          <p class="share-hint">{{ t('lobby.share_hint') }}</p>
        </div>

        <!-- RIGHT: settings + players -->
        <div class="lobby-right">

          <!-- Paramètres Cell Number -->
          <div class="card lobby-settings" v-if="isHost && room.game_id === 'skyjo'">
            <h3 class="settings-title">{{ t('lobby.settings') }}</h3>
            <div class="setting-row">
              <label>{{ t('lobby.ai_players') }}</label>
              <div class="stepper">
                <button @click="settings.aiCount = Math.max(0, settings.aiCount - 1)">−</button>
                <span>{{ settings.aiCount }}</span>
                <button @click="settings.aiCount = Math.min(6, settings.aiCount + 1)">+</button>
              </div>
            </div>
          </div>

          <!-- Paramètres Petits Chevaux -->
          <div class="card lobby-settings" v-if="isHost && room.game_id === 'petits-chevaux'">
            <h3 class="settings-title">{{ t('lobby.settings') }}</h3>
            <div class="setting-row">
              <label>{{ t('lobby.pawns') }}</label>
              <div class="stepper">
                <button @click="settings.pionsPerPlayer = Math.max(1, settings.pionsPerPlayer - 1)">−</button>
                <span>{{ settings.pionsPerPlayer }}</span>
                <button @click="settings.pionsPerPlayer = Math.min(5, settings.pionsPerPlayer + 1)">+</button>
              </div>
            </div>
            <div class="setting-row">
              <span class="toggle-label">{{ t('lobby.replay_6') }}</span>
              <button class="toggle" :class="{ on: settings.rejouerSur6 }" @click="settings.rejouerSur6 = !settings.rejouerSur6"><span class="toggle-thumb" /></button>
            </div>
            <div class="setting-row">
              <label>{{ t('lobby.ai_players') }}</label>
              <div class="stepper">
                <button @click="settings.aiCount = Math.max(0, settings.aiCount - 1)">−</button>
                <span>{{ settings.aiCount }}</span>
                <button @click="settings.aiCount = Math.min(3, settings.aiCount + 1)">+</button>
              </div>
            </div>
            <div class="setting-row">
              <span class="toggle-label">{{ t('lobby.allow_overtake') }}</span>
              <button class="toggle" :class="{ on: settings.allowOvertake }" @click="settings.allowOvertake = !settings.allowOvertake"><span class="toggle-thumb" /></button>
            </div>
            <div class="setting-row">
              <span class="toggle-label">{{ t('lobby.corridor_simple') }}</span>
              <button class="toggle" :class="{ on: settings.corridorSimplifie }" @click="settings.corridorSimplifie = !settings.corridorSimplifie"><span class="toggle-thumb" /></button>
            </div>
          </div>

          <!-- Paramètres Motus -->
          <div class="card lobby-settings" v-if="isHost && room.game_id === 'motus'">
            <h3 class="settings-title">{{ t('lobby.settings') }}</h3>

            <div class="setting-row">
              <span class="toggle-label">{{ t('lobby.word_lang') }}</span>
              <div class="lang-switch">
                <button class="lang-btn" :class="{ active: settings.lang === 'fr' }" @click="settings.lang = 'fr'">🇫🇷 FR</button>
                <button class="lang-btn" :class="{ active: settings.lang === 'en' }" @click="settings.lang = 'en'">🇬🇧 EN</button>
              </div>
            </div>

            <div class="setting-block">
              <label class="setting-label">{{ t('lobby.categories') }} <span class="badge-beta">Bêta</span></label>
              <div class="cat-grid">
                <button v-for="cat in CATEGORY_LIST" :key="cat.id" class="cat-chip"
                  :class="{ active: isCatActive(cat.id) }" @click="toggleCat(cat.id)">{{ cat.icon }} {{ cat.label }}</button>
              </div>
            </div>

            <div class="setting-row">
              <label>{{ t('lobby.lives') }}</label>
              <div class="stepper">
                <button @click="settings.livesMax = Math.max(5, settings.livesMax - 5)">−</button>
                <span>{{ settings.livesMax }}</span>
                <button @click="settings.livesMax = Math.min(50, settings.livesMax + 5)">+</button>
              </div>
            </div>
            <div class="setting-row">
              <label>{{ t('lobby.attempts') }}</label>
              <div class="stepper">
                <button @click="settings.maxAttempts = Math.max(4, settings.maxAttempts - 1)">−</button>
                <span>{{ settings.maxAttempts }}</span>
                <button @click="settings.maxAttempts = Math.min(8, settings.maxAttempts + 1)">+</button>
              </div>
            </div>
            <div class="setting-row">
              <label>{{ t('lobby.min_letters') }}</label>
              <div class="stepper">
                <button @click="settings.minLetters = Math.max(4, settings.minLetters - 1)">−</button>
                <span>{{ settings.minLetters }}</span>
                <button @click="settings.minLetters = Math.min(settings.maxLetters, settings.minLetters + 1)">+</button>
              </div>
            </div>
            <div class="setting-row">
              <label>{{ t('lobby.max_letters') }}</label>
              <div class="stepper">
                <button @click="settings.maxLetters = Math.max(settings.minLetters, settings.maxLetters - 1)">−</button>
                <span>{{ settings.maxLetters }}</span>
                <button @click="settings.maxLetters = Math.min(8, settings.maxLetters + 1)">+</button>
              </div>
            </div>
            <div class="setting-row">
              <span class="toggle-label">{{ t('lobby.same_word') }}</span>
              <button class="toggle" :class="{ on: settings.syncWords }" @click="settings.syncWords = !settings.syncWords"><span class="toggle-thumb" /></button>
            </div>
            <div class="setting-row">
              <span class="toggle-label">{{ t('lobby.combo_mode') }}</span>
              <button class="toggle" :class="{ on: settings.comboEnabled }" @click="settings.comboEnabled = !settings.comboEnabled"><span class="toggle-thumb" /></button>
            </div>
            <div class="setting-row">
              <span class="toggle-label">{{ t('lobby.change_on_find') }}</span>
              <button class="toggle" :class="{ on: settings.changeOnFind }" @click="settings.changeOnFind = !settings.changeOnFind"><span class="toggle-thumb" /></button>
            </div>
          </div>

          <!-- Liste des joueurs -->
          <div class="card lobby-players">
            <h3 class="settings-title">{{ t('lobby.players') }} ({{ (room.players?.length || 0) + (settings.aiCount || 0) }} / {{ room.max_players }})</h3>
            <div class="player-list">
              <div v-for="p in room.players" :key="p.id" class="player-row">
                <div class="player-avatar">{{ p.username[0].toUpperCase() }}</div>
                <span class="player-name">{{ p.username }}</span>
                <span v-if="p.id === room.host_id" class="badge badge-amber">{{ t('lobby.host') }}</span>
                <span v-else-if="p.online !== false" class="badge badge-green">{{ t('lobby.online') }}</span>
                <span v-else class="badge" style="color:var(--text-3)">{{ t('lobby.disconnected') }}</span>
                <button v-if="isHost && p.id !== room.host_id" class="btn-kick" title="Exclure ce joueur" @click="kickPlayer(p.id)">✕</button>
              </div>
              <div v-for="i in (settings.aiCount || 0)" :key="'ai-' + i" class="player-row">
                <div class="player-avatar" style="background:var(--cyan);color:#000">🤖</div>
                <span class="player-name">{{ t('lobby.ai_players') }} {{ i }}</span>
                <span class="badge" style="background:rgba(6,182,212,.15);color:var(--cyan)">IA</span>
              </div>
              <div v-if="(room.players?.length || 0) + (settings.aiCount || 0) < room.max_players" class="player-row placeholder">
                <div class="player-avatar ghost">?</div>
                <span class="text-muted">{{ t('lobby.waiting_slot') }}</span>
              </div>
            </div>
          </div>

          <!-- Lancer -->
          <button v-if="isHost" class="btn btn-primary btn-full btn-lg" :disabled="!canStart" @click="startGame">
            {{ canStart ? t('lobby.start') : t('lobby.need_players', { n: room.min_players }) }}
          </button>
          <div v-else class="waiting-msg">{{ t('lobby.waiting_host') }}</div>
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
import { useI18n } from '@/composables/useI18n.js';

const route    = useRoute();
const router   = useRouter();
const auth     = useAuthStore();
const platform = usePlatformStore();
const { t }    = useI18n();

const room     = ref(null);
const copied   = ref(false);
const settings = ref({
  livesMax: 20, maxAttempts: 6, syncWords: true, comboEnabled: true,
  minLetters: 5, maxLetters: 6, lang: platform.lang, changeOnFind: false,
  categories: ['tous'], aiCount: 0,
  pionsPerPlayer: 2, rejouerSur6: true, allowOvertake: false, corridorSimplifie: false,
});
let socket = null;

const CATEGORY_LIST = computed(() => [
  { id: 'tous',       icon: '📚', label: t('lobby.cat_all') },
  { id: 'animaux',    icon: '🐾', label: t('lobby.cat_animals') },
  { id: 'cuisine',    icon: '🍽️', label: t('lobby.cat_food') },
  { id: 'sport',      icon: '⚽', label: t('lobby.cat_sport') },
  { id: 'nature',     icon: '🌿', label: t('lobby.cat_nature') },
  { id: 'geographie', icon: '🌍', label: t('lobby.cat_geo') },
  { id: 'metiers',    icon: '👷', label: t('lobby.cat_jobs') },
  { id: 'corps',      icon: '🫀', label: t('lobby.cat_body') },
  { id: 'transport',  icon: '🚗', label: t('lobby.cat_transport') },
]);

function isCatActive(id) { return settings.value.categories.includes(id); }
function toggleCat(id) {
  const cats = settings.value.categories;
  if (id === 'tous') { settings.value.categories = ['tous']; return; }
  let next = cats.filter(c => c !== 'tous');
  if (next.includes(id)) next = next.filter(c => c !== id);
  else next.push(id);
  settings.value.categories = next.length ? next : ['tous'];
}

const isHost = computed(() => {
  if (!room.value || !auth.user) return false;
  if (auth.user.isGuest) return room.value.host_name === auth.user.username;
  return room.value.host_id === auth.user.id;
});
const canStart = computed(() => {
  const real = room.value?.players?.length || 0;
  const ai   = settings.value.aiCount || 0;
  return (real + ai) >= (room.value?.min_players || 2);
});

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

  socket.on('room_update', (data) => { room.value = { ...room.value, ...data }; });

  socket.on('round_start',   () => router.push(`/game/${room.value.game_id}?room=${room.value.code}`));
  socket.on('yahtzee_state', () => router.push(`/game/${room.value.game_id}?room=${room.value.code}`));
  socket.on('skyjo_state',   () => router.push(`/game/${room.value.game_id}?room=${room.value.code}`));
  socket.on('pc_state',      () => router.push(`/game/${room.value.game_id}?room=${room.value.code}`));

  socket.on('kicked', () => {
    platform.showToast('Vous avez été exclu de la salle par l\'hôte', 'error');
    router.push('/');
  });

  socket.on('connect_error', (err) => platform.showToast('Erreur de connexion : ' + err.message, 'error'));
  socket.on('error', (msg) => platform.showToast(msg, 'error'));
}

function startGame() {
  if (!socket) return;
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
.lobby-page { flex: 1; padding: 1.5rem 1rem 4rem; }
.lobby-inner { max-width: 920px; margin: 0 auto; }
.lobby-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.lobby-tags { display: flex; gap: .4rem; }
.ml-1 { margin-left: .35rem; }

.lobby-layout { display: grid; grid-template-columns: 300px 1fr; gap: 1.25rem; }
@media (max-width: 680px) { .lobby-layout { grid-template-columns: 1fr; } }

.lobby-share { text-align: center; display: flex; flex-direction: column; gap: .85rem; height: max-content; }
.lobby-code-label { font-size: .72rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-2); }
.lobby-code {
  font-family: var(--font-title); font-size: 2.6rem; font-weight: 800; letter-spacing: .22em;
  color: var(--cyan); text-shadow: 0 0 24px color-mix(in srgb, var(--cyan) 45%, transparent); padding-left: .22em;
}
.qr-wrap { background: #fff; border-radius: var(--radius); padding: 14px; display: flex; align-items: center; justify-content: center; }
.qr-img { width: 100%; max-width: 160px; border-radius: 4px; }
.share-hint { font-size: .74rem; color: var(--text-3); line-height: 1.5; }

.lobby-right { display: flex; flex-direction: column; gap: 1rem; }
.settings-title { font-size: .78rem; font-weight: 800; color: var(--text-2); text-transform: uppercase; letter-spacing: .06em; margin-bottom: .85rem; }
.setting-row { display: flex; align-items: center; justify-content: space-between; gap: .75rem; font-size: .85rem; padding: .45rem 0; }
.toggle-label { flex: 1; line-height: 1.3; }

.stepper { display: flex; align-items: center; background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.stepper button { width: 30px; height: 30px; background: transparent; border: none; color: var(--text); cursor: pointer; font-size: 1.1rem; font-weight: 700; transition: background .12s; }
.stepper button:hover { background: var(--bg-4); }
.stepper span { min-width: 30px; text-align: center; font-weight: 700; font-size: .9rem; border-left: 1px solid var(--border); border-right: 1px solid var(--border); padding: 0 4px; }

.toggle { position: relative; display: inline-flex; align-items: center; width: 44px; height: 24px; border-radius: 999px; cursor: pointer; background: var(--bg-4); border: 1px solid var(--border); transition: background .2s, border-color .2s; flex-shrink: 0; padding: 0; }
.toggle.on { background: var(--cyan); border-color: var(--cyan); }
.toggle-thumb { position: absolute; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: var(--text-3); transition: left .2s, background .2s; }
.toggle.on .toggle-thumb { left: 23px; background: #fff; }

.setting-block { margin-bottom: .6rem; font-size: .85rem; }
.setting-label { display: block; margin-bottom: .4rem; color: var(--text-2); }
.cat-grid { display: flex; flex-wrap: wrap; gap: .35rem; }
.cat-chip { padding: .25rem .6rem; border-radius: 20px; font-size: .75rem; cursor: pointer; border: 1px solid var(--border); background: var(--bg-3); color: var(--text-2); transition: all .15s; }
.cat-chip:hover { border-color: var(--cyan); color: var(--text); }
.cat-chip.active { background: color-mix(in srgb, var(--cyan) 15%, transparent); border-color: var(--cyan); color: var(--cyan); font-weight: 600; }
.lang-switch { display: flex; background: var(--bg-3); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.lang-btn { padding: .25rem .55rem; background: transparent; border: none; cursor: pointer; font-size: .75rem; font-weight: 700; color: var(--text-2); transition: all .12s; }
.lang-btn:hover { background: var(--bg-4); color: var(--text); }
.lang-btn.active { background: var(--bg-4); color: var(--cyan); }

.badge-beta { display: inline-block; background: color-mix(in srgb, var(--amber) 15%, transparent); border: 1px solid color-mix(in srgb, var(--amber) 40%, transparent); color: var(--amber); border-radius: 4px; padding: 0 .35rem; font-size: .65rem; font-weight: 700; letter-spacing: .04em; vertical-align: middle; margin-left: .3rem; }

.player-list { display: flex; flex-direction: column; gap: .55rem; }
.player-row { display: flex; align-items: center; gap: .6rem; }
.player-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, var(--cyan), var(--violet)); display: flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 800; color: var(--bg); }
.player-avatar.ghost { background: var(--bg-4); color: var(--text-3); }
.player-name { flex: 1; font-weight: 600; }
.player-row.placeholder { opacity: .4; }

.btn-kick { background: transparent; border: 1px solid rgba(239,68,68,.35); border-radius: 6px; color: #f87171; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: .7rem; transition: background .12s; flex-shrink: 0; }
.btn-kick:hover { background: rgba(239,68,68,.15); }

.waiting-msg { display: flex; align-items: center; gap: .6rem; color: var(--text-2); font-size: .88rem; padding: 1rem; background: var(--bg-3); border-radius: var(--radius); }
.loading-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .5rem; }
</style>
