<template>
  <div class="admin-page">
    <div class="admin-inner">
      <div class="admin-header">
        <h1>⚙ Administration</h1>
        <div class="admin-stats">
          <div class="stat-card"><span class="stat-val">{{ stats.users }}</span><span class="stat-lbl">Joueurs</span></div>
          <div class="stat-card"><span class="stat-val">{{ stats.rooms }}</span><span class="stat-lbl">Salles créées</span></div>
          <div class="stat-card"><span class="stat-val">{{ stats.sessions }}</span><span class="stat-lbl">Parties</span></div>
        </div>
      </div>

      <!-- Jeux -->
      <section class="admin-section card">
        <h2>🎮 Jeux</h2>
        <p class="text-muted mb-2">Activez ou désactivez les jeux visibles sur la plateforme.</p>
        <div class="game-list">
          <div v-for="g in games" :key="g.id" class="game-row">
            <span class="game-icon">{{ g.icon }}</span>
            <div class="game-info">
              <span class="game-name">{{ g.name }}</span>
              <span class="game-id">{{ g.id }}</span>
            </div>
            <span class="badge" :class="g.has_multiplayer ? 'badge-rose' : 'badge-cyan'">
              {{ g.has_multiplayer ? 'Multi' : 'Solo' }}
            </span>
            <label class="toggle-switch">
              <input type="checkbox" :checked="g.is_active" @change="toggleGame(g)" />
              <span class="toggle-slider"></span>
            </label>
            <span class="game-status" :class="g.is_active ? 'active' : 'inactive'">
              {{ g.is_active ? 'Actif' : 'Inactif' }}
            </span>
          </div>
        </div>
      </section>

      <!-- Utilisateurs -->
      <section class="admin-section card">
        <h2>👥 Utilisateurs</h2>
        <div class="user-table-wrap">
          <table class="user-table">
            <thead>
              <tr>
                <th>#</th><th>Username</th><th>Nom</th><th>Email</th><th>Rôle</th><th>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td>{{ u.id }}</td>
                <td><strong>{{ u.username }}</strong></td>
                <td>{{ u.first_name }} {{ u.last_name }}</td>
                <td>{{ u.email }}</td>
                <td>
                  <span class="badge" :class="u.role === 'admin' ? 'badge-amber' : 'badge-cyan'">{{ u.role }}</span>
                </td>
                <td>{{ formatDate(u.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const games = ref([]);
const users = ref([]);
const stats = ref({ users: 0, rooms: 0, sessions: 0 });

async function load() {
  const [g, u, s] = await Promise.all([
    axios.get('/api/admin/games'),
    axios.get('/api/admin/users'),
    axios.get('/api/admin/stats'),
  ]);
  games.value = g.data;
  users.value = u.data;
  stats.value = s.data;
}

async function toggleGame(game) {
  const { data } = await axios.patch(`/api/admin/games/${game.id}/toggle`);
  game.is_active = data.is_active;
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
}

onMounted(load);
</script>

<style scoped>
.admin-page  { flex: 1; padding: 2rem 1.5rem; }
.admin-inner { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

.admin-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.admin-header h1 { font-size: 1.5rem; }

.admin-stats { display: flex; gap: .75rem; }
.stat-card {
  background: var(--bg-3); border: 1px solid var(--border); border-radius: var(--radius);
  padding: .6rem 1.2rem; text-align: center; min-width: 80px;
}
.stat-val { display: block; font-family: var(--font-title); font-size: 1.6rem; font-weight: 800; color: var(--cyan); }
.stat-lbl { font-size: .7rem; color: var(--text-2); text-transform: uppercase; letter-spacing: .06em; }

.admin-section h2 { font-size: 1rem; margin-bottom: 1rem; }

/* Jeux */
.game-list { display: flex; flex-direction: column; gap: .5rem; }
.game-row  {
  display: flex; align-items: center; gap: .75rem;
  padding: .6rem .75rem; background: var(--bg-3); border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}
.game-icon { font-size: 1.4rem; flex-shrink: 0; }
.game-info { flex: 1; }
.game-name { font-weight: 700; font-size: .88rem; display: block; }
.game-id   { font-size: .72rem; color: var(--text-3); }
.game-status { font-size: .75rem; font-weight: 700; }
.game-status.active   { color: var(--green); }
.game-status.inactive { color: var(--text-3); }

/* Toggle switch */
.toggle-switch { position: relative; width: 42px; height: 24px; flex-shrink: 0; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute; inset: 0; cursor: pointer;
  background: var(--bg-4); border-radius: 999px; transition: background .2s;
}
.toggle-slider::before {
  content: ''; position: absolute;
  width: 18px; height: 18px; border-radius: 50%;
  left: 3px; top: 3px;
  background: var(--text-2); transition: transform .2s, background .2s;
}
.toggle-switch input:checked + .toggle-slider { background: var(--cyan); }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(18px); background: var(--bg); }

/* Tableau utilisateurs */
.user-table-wrap { overflow-x: auto; }
.user-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
.user-table th { text-align: left; padding: .5rem .75rem; color: var(--text-2); font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid var(--border); }
.user-table td { padding: .5rem .75rem; border-bottom: 1px solid var(--border); }
.user-table tr:last-child td { border-bottom: none; }
</style>
