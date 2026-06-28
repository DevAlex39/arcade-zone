<template>
  <RouterLink to="/profile" class="xp-bar-wrap" title="Voir mon profil">
    <span class="xp-level">Nv.{{ xpStore.level }}</span>
    <div class="xp-track">
      <div class="xp-fill" :style="{ width: xpStore.pct + '%' }"></div>
    </div>
    <span class="xp-label">{{ xpStore.xpInLevel }}/{{ xpStore.xpForLevel }}</span>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { useXpStore } from '@/stores/xp';
const xpStore = useXpStore();
</script>

<style scoped>
.xp-bar-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}
.xp-bar-wrap:hover { background: rgba(255,255,255,0.08); }

.xp-level {
  font-size: 0.7rem;
  font-weight: 700;
  color: #fbbf24;
  white-space: nowrap;
}
.xp-track {
  width: 80px;
  height: 6px;
  background: rgba(255,255,255,0.15);
  border-radius: 3px;
  overflow: hidden;
}
.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  border-radius: 3px;
  transition: width 0.5s ease;
}
.xp-label {
  font-size: 0.65rem;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
}
</style>
