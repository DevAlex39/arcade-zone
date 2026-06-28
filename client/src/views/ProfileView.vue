<template>
  <div class="profile-page">
    <div v-if="!authStore.isLoggedIn" class="guest-msg">
      <p>Connecte-toi pour voir ton profil, tes statistiques et ton historique de parties.</p>
      <RouterLink to="/login" class="btn-primary">Se connecter</RouterLink>
    </div>

    <template v-else>
      <!-- En-tête profil -->
      <div class="profile-header">
        <div class="avatar">{{ authStore.user?.username?.charAt(0).toUpperCase() }}</div>
        <div class="profile-info">
          <h1>{{ authStore.user?.username }}</h1>
          <p class="email">{{ authStore.user?.email }}</p>
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

@media (max-width: 600px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
