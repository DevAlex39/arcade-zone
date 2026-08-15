<template>
  <!-- Badge spectateur -->
  <div v-if="mr.isSpectator?.value" class="spec-chip">
    👁️ Spectateur — vous entrerez dans la prochaine partie
  </div>

  <!-- Écran intermédiaire de tournoi -->
  <Teleport to="body">
    <div v-if="mr.tournament?.value?.phase === 'interstitial'" class="tn-overlay">
      <div class="tn-modal">
        <div class="tn-head">🏆 Tournoi — {{ mr.tournament.value.idx + 1 }}/{{ mr.tournament.value.total }}</div>
        <div class="tn-standings">
          <div v-for="(s, i) in mr.tournament.value.standings" :key="s.id" class="tn-row" :class="{ first: i === 0 }">
            <span class="tn-rank">{{ ['🥇','🥈','🥉'][i] || `#${i + 1}` }}</span>
            <span class="tn-name">{{ s.username }}</span>
            <span class="tn-pts">{{ s.points }} pts</span>
          </div>
        </div>
        <div class="tn-next">
          Prochain jeu : <strong>{{ gameLabel(mr.tournament.value.nextGameId) }}</strong>
        </div>
        <button v-if="mr.isHost.value" class="tn-btn" @click="mr.launchNext()">▶️ Lancer {{ gameLabel(mr.tournament.value.nextGameId) }}</button>
        <p v-else class="tn-wait"><span class="spin">⟳</span> L'hôte lance le jeu suivant…</p>
      </div>
    </div>
  </Teleport>

  <!-- Barre de réactions : pilule flottante en bas de l'écran -->
  <div class="rx-bar">
    <button v-for="e in EMOJIS" :key="e" class="rx-btn" @click="send(e)">{{ e }}</button>
    <span class="rx-sep" />
    <button class="rx-btn rx-mute" :title="mr.audio.soundOn.value ? 'Couper le son' : 'Activer le son'" @click="mr.audio.toggle()">
      {{ mr.audio.soundOn.value ? '🔊' : '🔇' }}
    </button>
  </div>

  <!-- Couche des emojis flottants (au-dessus de tout, clics traversants) -->
  <Teleport to="body">
    <div class="rx-layer">
      <div v-for="r in mr.reactions.value" :key="r.id" class="rx-float" :style="{ left: r.x + '%' }">
        <span class="rx-emoji">{{ r.emoji }}</span>
        <span class="rx-name">{{ r.username }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { usePlatformStore } from '@/stores/platform.js';

const props = defineProps({ mr: Object }); // objet retourné par useMultiRoom
const platform = usePlatformStore();

const EMOJIS = ['😂', '🔥', '😱', '👏', '😭', '😈'];

function send(emoji) {
  props.mr.sendReaction(emoji);
}

function gameLabel(id) {
  const g = platform.games.find(x => x.id === id);
  return g ? `${g.icon} ${g.name}` : id;
}
</script>

<style scoped>
/* Tournoi — écran intermédiaire */
.tn-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 900; }
.tn-modal { background: var(--bg-2, #16162a); border: 1px solid rgba(245,158,11,.4); border-radius: 18px; padding: 1.8rem 2.2rem; max-width: 420px; width: calc(100% - 2rem); text-align: center; box-shadow: 0 24px 80px rgba(0,0,0,.6); }
.tn-head { font-weight: 900; font-size: 1.15rem; color: #f59e0b; margin-bottom: 1rem; }
.tn-standings { display: flex; flex-direction: column; gap: .35rem; margin-bottom: 1rem; }
.tn-row { display: flex; align-items: center; gap: .6rem; padding: .4rem .7rem; background: var(--bg-3, #1e1e38); border: 1px solid var(--border, #333); border-radius: 9px; font-size: .88rem; }
.tn-row.first { border-color: rgba(245,158,11,.5); background: rgba(245,158,11,.08); }
.tn-rank { min-width: 30px; font-weight: 800; }
.tn-name { flex: 1; font-weight: 700; text-align: left; }
.tn-pts { font-weight: 800; color: var(--cyan, #06b6d4); }
.tn-next { font-size: .9rem; color: var(--text-2, #aaa); margin-bottom: 1rem; }
.tn-btn { background: #f59e0b; border: none; color: #1a1000; font-weight: 800; font-size: .95rem; padding: .75rem 1.5rem; border-radius: 11px; cursor: pointer; transition: transform .12s; }
.tn-btn:hover { transform: translateY(-2px); }
.tn-wait { display: flex; align-items: center; justify-content: center; gap: .5rem; color: var(--text-2, #aaa); font-size: .85rem; }
.spin { display: inline-block; animation: tnSpin 1.2s linear infinite; }
@keyframes tnSpin { to { transform: rotate(360deg); } }

.spec-chip {
  position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
  z-index: 480; padding: .35rem .9rem; border-radius: 999px;
  background: rgba(139,92,246,.16); border: 1px solid rgba(139,92,246,.5);
  color: #c4b5fd; font-size: .76rem; font-weight: 700; white-space: nowrap;
  backdrop-filter: blur(10px);
}

.rx-bar {
  position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%);
  z-index: 480;
  display: flex; gap: .15rem;
  background: color-mix(in srgb, var(--bg-2, #16162a) 88%, transparent);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border, #333);
  border-radius: 999px;
  padding: .3rem .45rem;
  box-shadow: 0 8px 28px rgba(0,0,0,.45);
}
.rx-btn {
  background: transparent; border: none; cursor: pointer;
  font-size: 1.25rem; line-height: 1;
  padding: .3rem .4rem; border-radius: 50%;
  transition: transform .12s ease, background .12s;
}
.rx-btn:hover  { transform: scale(1.3); background: rgba(255,255,255,.08); }
.rx-btn:active { transform: scale(.9); }
.rx-sep { width: 1px; align-self: stretch; margin: .2rem .1rem; background: var(--border, #333); }
.rx-mute { font-size: 1rem; opacity: .75; }
.rx-mute:hover { transform: scale(1.15); opacity: 1; }

.rx-layer { position: fixed; inset: 0; pointer-events: none; z-index: 481; overflow: hidden; }
.rx-float {
  position: absolute; bottom: 64px;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  animation: rxFloat 3.5s ease-out forwards;
}
.rx-emoji { font-size: 2.1rem; animation: rxWiggle 1.1s ease-in-out infinite; }
.rx-name {
  font-size: .62rem; font-weight: 700; color: var(--text-2, #aaa);
  background: color-mix(in srgb, var(--bg, #0a0a14) 75%, transparent);
  padding: .05rem .4rem; border-radius: 999px; white-space: nowrap;
}
@keyframes rxFloat {
  0%   { transform: translateY(0) scale(.5);   opacity: 0; }
  8%   { transform: translateY(-4vh) scale(1.15); opacity: 1; }
  75%  { opacity: 1; }
  100% { transform: translateY(-52vh) scale(1); opacity: 0; }
}
@keyframes rxWiggle {
  0%, 100% { rotate: -8deg; }
  50%      { rotate: 8deg; }
}

@media (max-width: 640px) {
  .rx-bar { bottom: 10px; padding: .22rem .35rem; }
  .rx-btn { font-size: 1.1rem; padding: .25rem .32rem; }
}
</style>
