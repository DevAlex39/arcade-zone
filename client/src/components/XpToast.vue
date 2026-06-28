<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div v-for="t in xpStore.toasts" :key="t.id" class="xp-toast">
          <span class="toast-icon">✨</span>
          <span class="toast-text">{{ t.msg }}</span>
          <span class="toast-amount">+{{ t.amount }} XP</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useXpStore } from '@/stores/xp';
const xpStore = useXpStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.xp-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #1e1b4b, #312e81);
  border: 1px solid #8b5cf6;
  border-radius: 12px;
  padding: 10px 16px;
  color: #fff;
  font-size: 0.875rem;
  box-shadow: 0 4px 20px rgba(139,92,246,0.4);
  min-width: 220px;
}
.toast-icon { font-size: 1rem; }
.toast-text { flex: 1; }
.toast-amount { font-weight: 700; color: #fbbf24; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { transform: translateX(100%); opacity: 0; }
.toast-leave-to   { transform: translateX(100%); opacity: 0; }
</style>
