import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

export const useXpStore = defineStore('xp', () => {
  const xp               = ref(0);
  const level            = ref(1);
  const xpInLevel        = ref(0);
  const xpForLevel       = ref(100);
  const pct              = ref(0);
  const dailyBonusClaimed = ref(false);
  const challenge        = ref(null);
  const history          = ref([]);
  const xpLog            = ref([]);
  const stats            = ref({ total_games: 0, wins: 0, losses: 0 });
  const loaded           = ref(false);

  // Toast XP
  const toasts = ref([]);

  function showXpToast(msg, amount) {
    const id = Date.now() + Math.random();
    toasts.value.push({ id, msg, amount });
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id);
    }, 3000);
  }

  async function fetchMe() {
    try {
      const { data } = await axios.get('/api/xp/me');
      if (data.guest) return;
      xp.value               = data.xp;
      level.value            = data.level;
      xpInLevel.value        = data.xpInLevel;
      xpForLevel.value       = data.xpForLevel;
      pct.value              = data.pct;
      dailyBonusClaimed.value = data.dailyBonusClaimed;
      challenge.value        = data.challenge;
      history.value          = data.history || [];
      xpLog.value            = data.xpLog || [];
      stats.value            = data.stats || { total_games: 0, wins: 0, losses: 0 };
      loaded.value           = true;
    } catch {}
  }

  async function handleDailyBonus(bonusResult) {
    if (!bonusResult || bonusResult.already) return;
    await fetchMe();
    showXpToast('Bonus connexion journalier !', bonusResult.bonus || 25);
  }

  return {
    xp, level, xpInLevel, xpForLevel, pct,
    dailyBonusClaimed, challenge, history, xpLog, stats, loaded,
    toasts,
    fetchMe, handleDailyBonus, showXpToast,
  };
});
