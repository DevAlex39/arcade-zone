<template>
  <div class="profile-page">
    <div v-if="!authStore.isLoggedIn" class="guest-msg">
      <p>Connecte-toi pour voir ton profil, tes statistiques et ton historique de parties.</p>
      <RouterLink to="/login" class="btn-primary">Se connecter</RouterLink>
    </div>

    <template v-else>
      <!-- En-tête profil -->
      <div class="profile-header">
        <div class="avatar" :style="avatarStyle">{{ avatarDisplay }}</div>
        <div class="profile-info">
          <h1>{{ authStore.user?.username }}</h1>
          <p class="email">{{ authStore.user?.email }}</p>
        </div>
        <button class="btn-avatar-edit" @click="avatarPicker = !avatarPicker">🎨 Avatar</button>
      </div>

      <!-- Sélecteur d'avatar -->
      <div class="card avatar-picker" v-if="avatarPicker">
        <div class="card-header"><span class="card-title">🎨 Personnalise ton avatar</span></div>
        <p class="picker-label">Emoji</p>
        <div class="emoji-grid">
          <button v-for="e in AVATAR_EMOJIS" :key="e" class="emoji-btn"
            :class="{ active: pickEmoji === e }" @click="pickEmoji = pickEmoji === e ? null : e">{{ e }}</button>
        </div>
        <p class="picker-label">Couleur</p>
        <div class="color-grid">
          <button v-for="c in AVATAR_COLORS" :key="c" class="color-btn"
            :class="{ active: pickColor === c }" :style="{ background: c }" @click="pickColor = pickColor === c ? null : c" />
        </div>
        <div class="picker-preview">
          <span>Aperçu :</span>
          <div class="avatar avatar-sm" :style="previewStyle">{{ pickEmoji || authStore.user?.username?.charAt(0).toUpperCase() }}</div>
          <button class="btn-save-avatar" :disabled="savingAvatar" @click="saveAvatar">{{ savingAvatar ? '⟳' : 'Enregistrer' }}</button>
        </div>
      </div>

      <!-- Niveau & XP -->
      <div class="card xp-card">
        <div class="card-header">
          <span class="card-title">⭐ Niveau {{ xpStore.level }}</span>
          <span class="xp-total">{{ xpStore.xp.toLocaleString() }} XP total</span>
        </div>
        <div class="xp-bar-big">
          <div class="xp-fill-big" :style="{ width: xpStore.pct + '%' }"></div>
        </div>
        <div class="xp-labels">
          <span>{{ xpStore.xpInLevel }} / {{ xpStore.xpForLevel }} XP</span>
          <span>{{ xpStore.pct }}%</span>
        </div>
      </div>

      <!-- Stats rapides -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-val">{{ xpStore.stats.total_games || 0 }}</div>
          <div class="stat-lbl">Parties jouées</div>
        </div>
        <div class="stat-card win">
          <div class="stat-val">{{ xpStore.stats.wins || 0 }}</div>
          <div class="stat-lbl">Victoires</div>
        </div>
        <div class="stat-card loss">
          <div class="stat-val">{{ xpStore.stats.losses || 0 }}</div>
          <div class="stat-lbl">Défaites</div>
        </div>
        <div class="stat-card xp">
          <div class="stat-val">{{ winRate }}%</div>
          <div class="stat-lbl">Taux de victoire</div>
        </div>
      </div>

      <!-- Rival -->
      <div class="card rival-card" v-if="xpStore.rival">
        <span class="rival-emoji">⚔️</span>
        <span class="rival-text">Ton adversaire le plus battu : <strong>{{ xpStore.rival.name }}</strong></span>
        <span class="rival-count">{{ xpStore.rival.wins }} victoire{{ xpStore.rival.wins > 1 ? 's' : '' }} contre lui 😄</span>
      </div>

      <!-- Ratio par jeu -->
      <div class="card" v-if="xpStore.perGame.length">
        <div class="card-header">
          <span class="card-title">📊 Ratio par jeu</span>
        </div>
        <div class="pergame-list">
          <div v-for="g in xpStore.perGame" :key="g.game_id" class="pergame-row">
            <span class="pg-icon">{{ g.game_icon || '🎮' }}</span>
            <span class="pg-name">{{ g.game_name || g.game_id }}</span>
            <div class="pg-bar">
              <div class="pg-fill" :style="{ width: pgPct(g) + '%' }"></div>
            </div>
            <span class="pg-ratio">{{ g.wins || 0 }}V / {{ g.losses || 0 }}D</span>
            <span class="pg-pct">{{ pgPct(g) }}%</span>
          </div>
        </div>
      </div>

      <!-- Badges -->
      <div class="card" v-if="xpStore.badges.length">
        <div class="card-header">
          <span class="card-title">🎖️ Succès</span>
          <span class="badges-count">{{ earnedCount }}/{{ xpStore.badges.length }}</span>
        </div>
        <div class="badges-grid">
          <div v-for="b in xpStore.badges" :key="b.id" class="badge-tile" :class="{ locked: !b.earned }" :title="b.desc">
            <span class="badge-icon">{{ b.icon }}</span>
            <span class="badge-label">{{ b.label }}</span>
          </div>
        </div>
      </div>

      <!-- Défi du jour -->
      <div class="card challenge-card" v-if="xpStore.challenge">
        <div class="card-header">
          <span class="card-title">{{ xpStore.challenge.icon }} Défi du jour</span>
          <span class="challenge-xp">+{{ xpStore.challenge.xp }} XP</span>
        </div>
        <p class="challenge-desc">{{ xpStore.challenge.desc }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: challengePct + '%' }" :class="{ done: xpStore.challenge.completed }"></div>
        </div>
        <div class="progress-labels">
          <span>{{ xpStore.challenge.progress || 0 }} / {{ xpStore.challenge.target }}</span>
          <span v-if="xpStore.challenge.completed" class="done-label">✅ Complété !</span>
        </div>
      </div>

      <!-- Historique récent -->
      <div class="card history-card">
        <div class="card-header">
          <span class="card-title">🕹️ Historique des parties</span>
        </div>
        <div v-if="!xpStore.history.length" class="empty-state">Aucune partie enregistrée.</div>
        <div class="history-list">
          <div v-for="h in xpStore.history" :key="h.id" class="history-row">
            <span class="h-icon">{{ h.game_icon || '🎮' }}</span>
            <span class="h-name">{{ h.game_name || h.game_id }}</span>
            <span class="h-result" :class="h.result">{{ resultLabel(h.result) }}</span>
            <span class="h-score" v-if="h.score !== null">{{ h.score }} pts</span>
            <span class="h-date">{{ formatDate(h.played_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Derniers gains XP -->
      <div class="card xplog-card">
        <div class="card-header">
          <span class="card-title">✨ Derniers gains XP</span>
        </div>
        <div v-if="!xpStore.xpLog.length" class="empty-state">Pas encore de gain XP.</div>
        <div class="xplog-list">
          <div v-for="(l, i) in xpStore.xpLog" :key="i" class="xplog-row">
            <span class="xpl-amount">+{{ l.amount }}</span>
            <span class="xpl-reason">{{ reasonLabel(l.reason) }}</span>
            <span class="xpl-date">{{ formatDate(l.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Classement -->
      <div class="card leaderboard-card">
        <div class="card-header">
          <span class="card-title">🏆 Classement XP</span>
        </div>
        <div v-if="!leaderboard.length" class="empty-state">Chargement...</div>
        <div class="lb-list">
          <div v-for="(u, i) in leaderboard" :key="u.username" class="lb-row" :class="{ me: u.username === authStore.user?.username }">
            <span class="lb-rank">{{ i + 1 }}</span>
            <span class="lb-name">{{ u.username }}</span>
            <span class="lb-lv">Nv.{{ u.level }}</span>
            <span class="lb-xp">{{ u.xp.toLocaleString() }} XP</span>
            <span class="lb-wins">{{ u.wins }} 🏅</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useXpStore } from '@/stores/xp';

const authStore = useAuthStore();
const xpStore   = useXpStore();
const leaderboard = ref([]);

const winRate = computed(() => {
  const total = xpStore.stats.total_games || 0;
  if (!total) return 0;
  return Math.round(((xpStore.stats.wins || 0) / total) * 100);
});

const earnedCount = computed(() => xpStore.badges.filter(b => b.earned).length);

// ── Avatar personnalisable ──
const AVATAR_EMOJIS = ['😎','🦊','🐸','🐼','🦁','🐙','👻','🤖','🐲','🦄','🍕','🎩','💀','👽','🔥','⚡','🎯','🃏','🌵','🦈'];
const AVATAR_COLORS = ['#06b6d4','#8b5cf6','#f43f5e','#f59e0b','#22c55e','#3b82f6','#ec4899','#64748b'];
const avatarPicker = ref(false);
const pickEmoji    = ref(authStore.user?.avatar_emoji || null);
const pickColor    = ref(authStore.user?.avatar_color || null);
const savingAvatar = ref(false);

const avatarDisplay = computed(() => authStore.user?.avatar_emoji || authStore.user?.username?.charAt(0).toUpperCase());
const avatarStyle   = computed(() => authStore.user?.avatar_color ? { background: authStore.user.avatar_color } : {});
const previewStyle  = computed(() => pickColor.value ? { background: pickColor.value } : {});

async function saveAvatar() {
  savingAvatar.value = true;
  try {
    const { data } = await axios.post('/api/auth/avatar', { emoji: pickEmoji.value, color: pickColor.value });
    if (authStore.user) {
      authStore.user.avatar_emoji = data.avatar_emoji;
      authStore.user.avatar_color = data.avatar_color;
    }
    avatarPicker.value = false;
  } catch { /* silencieux */ }
  savingAvatar.value = false;
}

function pgPct(g) {
  const total = Number(g.total) || 0;
  if (!total) return 0;
  return Math.round(((Number(g.wins) || 0) / total) * 100);
}

const challengePct = computed(() => {
  const c = xpStore.challenge;
  if (!c) return 0;
  return Math.min(100, Math.round(((c.progress || 0) / c.target) * 100));
});

function resultLabel(r) {
  return { win: '✅ Victoire', loss: '❌ Défaite', draw: '🤝 Égalité', solo: '🎮 Solo' }[r] || r;
}

function reasonLabel(r) {
  return {
    daily_login: 'Connexion journalière',
    game_played: 'Partie jouée',
    game_won: 'Partie gagnée',
    daily_challenge: 'Défi quotidien',
  }[r] || r;
}

function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

onMounted(async () => {
  if (authStore.isLoggedIn && !xpStore.loaded) await xpStore.fetchMe();
  try {
    const { data } = await axios.get('/api/xp/leaderboard');
    leaderboard.value = data;
  } catch {}
});
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.guest-msg {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255,255,255,0.7);
}
.btn-primary {
  display: inline-block;
  margin-top: 16px;
  padding: 10px 24px;
  background: #8b5cf6;
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255,255,255,0.04);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
}
.profile-info h1 { font-size: 1.4rem; font-weight: 700; margin: 0; }
.profile-info .email { font-size: 0.85rem; color: rgba(255,255,255,0.5); margin: 4px 0 0; }

.card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card-title { font-weight: 700; font-size: 1rem; }

.xp-card .xp-total { font-size: 0.85rem; color: #fbbf24; }
.xp-bar-big {
  height: 10px;
  background: rgba(255,255,255,0.1);
  border-radius: 5px;
  overflow: hidden;
}
.xp-fill-big {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  border-radius: 5px;
  transition: width 0.6s ease;
}
.xp-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
  margin-top: 6px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}
.stat-card.win  { border-color: rgba(74,222,128,0.3); }
.stat-card.loss { border-color: rgba(239,68,68,0.3); }
.stat-card.xp   { border-color: rgba(251,191,36,0.3); }
.stat-val { font-size: 1.6rem; font-weight: 700; }
.stat-lbl { font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-top: 4px; }

.challenge-card .challenge-xp { color: #fbbf24; font-weight: 700; }
.challenge-desc { font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-bottom: 12px; }
.progress-bar {
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #8b5cf6;
  border-radius: 4px;
  transition: width 0.5s ease;
}
.progress-fill.done { background: #4ade80; }
.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
  margin-top: 6px;
}
.done-label { color: #4ade80; font-weight: 600; }

.empty-state { text-align: center; color: rgba(255,255,255,0.4); font-size: 0.9rem; padding: 16px 0; }

.history-list, .xplog-list, .lb-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-row, .xplog-row, .lb-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  font-size: 0.85rem;
}
.h-icon { font-size: 1.1rem; }
.h-name { flex: 1; font-weight: 500; }
.h-result { font-size: 0.8rem; }
.h-result.win  { color: #4ade80; }
.h-result.loss { color: #f87171; }
.h-result.draw { color: #fbbf24; }
.h-result.solo { color: #60a5fa; }
.h-score { color: rgba(255,255,255,0.6); font-size: 0.8rem; }
.h-date  { color: rgba(255,255,255,0.4); font-size: 0.75rem; white-space: nowrap; }

.xpl-amount { color: #a78bfa; font-weight: 700; min-width: 40px; }
.xpl-reason { flex: 1; }
.xpl-date   { color: rgba(255,255,255,0.4); font-size: 0.75rem; white-space: nowrap; }

.lb-rank  { min-width: 28px; font-weight: 700; color: rgba(255,255,255,0.5); }
.lb-name  { flex: 1; font-weight: 600; }
.lb-lv    { font-size: 0.8rem; color: #fbbf24; }
.lb-xp    { font-size: 0.85rem; color: #a78bfa; }
.lb-wins  { font-size: 0.8rem; }
.lb-row.me { background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); }

/* Avatar picker */
.btn-avatar-edit { margin-left: auto; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #fff; border-radius: 8px; padding: 8px 14px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: border-color .15s; }
.btn-avatar-edit:hover { border-color: #8b5cf6; }
.picker-label { font-size: 0.78rem; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; letter-spacing: .05em; margin: 10px 0 6px; }
.emoji-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.emoji-btn { font-size: 1.3rem; background: rgba(255,255,255,0.04); border: 2px solid transparent; border-radius: 10px; padding: 6px 8px; cursor: pointer; transition: all .12s; }
.emoji-btn:hover { transform: scale(1.15); }
.emoji-btn.active { border-color: #06b6d4; background: rgba(6,182,212,0.12); }
.color-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.color-btn { width: 34px; height: 34px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: transform .12s; }
.color-btn:hover { transform: scale(1.15); }
.color-btn.active { border-color: #fff; }
.picker-preview { display: flex; align-items: center; gap: 14px; margin-top: 16px; }
.avatar-sm { width: 48px; height: 48px; font-size: 1.4rem; }
.btn-save-avatar { margin-left: auto; background: #8b5cf6; border: none; color: #fff; border-radius: 8px; padding: 10px 20px; font-weight: 700; cursor: pointer; }
.btn-save-avatar:disabled { opacity: .6; }

/* Rival */
.rival-card { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; border-color: rgba(251,191,36,0.3); }
.rival-emoji { font-size: 1.5rem; }
.rival-text { flex: 1; font-size: 0.9rem; }
.rival-count { font-size: 0.8rem; color: #fbbf24; font-weight: 600; }

/* Ratio par jeu */
.pergame-list { display: flex; flex-direction: column; gap: 10px; }
.pergame-row { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; }
.pg-icon { font-size: 1.1rem; }
.pg-name { width: 130px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pg-bar { flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
.pg-fill { height: 100%; background: linear-gradient(90deg, #4ade80, #22c55e); border-radius: 4px; transition: width 0.5s ease; }
.pg-ratio { color: rgba(255,255,255,0.6); font-size: 0.78rem; white-space: nowrap; }
.pg-pct { min-width: 40px; text-align: right; font-weight: 700; color: #4ade80; }

/* Badges */
.badges-count { font-size: 0.85rem; color: #fbbf24; font-weight: 700; }
.badges-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; }
.badge-tile {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 8px; border-radius: 12px; text-align: center;
  background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.3);
}
.badge-tile.locked { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.08); opacity: 0.45; filter: grayscale(1); }
.badge-icon { font-size: 1.6rem; }
.badge-label { font-size: 0.72rem; font-weight: 600; line-height: 1.2; }

@media (max-width: 600px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .pg-name { width: 90px; }
}
</style>
