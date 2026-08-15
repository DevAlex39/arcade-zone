<template>
  <!-- Badge spectateur -->
  <div v-if="mr.isSpectator?.value" class="spec-chip">
    👁️ Spectateur — vous entrerez dans la prochaine partie
  </div>

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
const props = defineProps({ mr: Object }); // objet retourné par useMultiRoom

const EMOJIS = ['😂', '🔥', '😱', '👏', '😭', '😈'];

function send(emoji) {
  props.mr.sendReaction(emoji);
}
</script>

<style scoped>
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
