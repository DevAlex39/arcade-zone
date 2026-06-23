<template>
  <div class="die-wrap" :class="{ kept, selectable }" @click="$emit('click')">
    <svg viewBox="0 0 60 60" class="die-svg">
      <defs>
        <linearGradient :id="`dface-${idx}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="kept ? 'var(--die-kept-2)' : 'var(--die-face-1)'" />
          <stop offset="100%" :stop-color="kept ? 'var(--die-kept-1)' : 'var(--die-face-2)'" />
        </linearGradient>
      </defs>

      <!-- Face -->
      <rect rx="11" ry="11" width="60" height="60" :fill="`url(#dface-${idx})`" />

      <!-- Pips -->
      <circle
        v-for="(pip, i) in PIPS[val] || []"
        :key="i"
        :cx="pip[0]" :cy="pip[1]" r="5.5"
        :fill="pipColor(i)"
      />
    </svg>
    <div v-if="kept" class="kept-tag">Gardé</div>
  </div>
</template>

<script setup>
const props = defineProps({
  val:       { type: Number, default: 1 },
  kept:      { type: Boolean, default: false },
  selectable:{ type: Boolean, default: false },
  idx:       { type: Number, default: 0 },
});

defineEmits(['click']);

const PIPS = {
  1: [[30, 30]],
  2: [[18, 18], [42, 42]],
  3: [[18, 18], [30, 30], [42, 42]],
  4: [[18, 18], [42, 18], [18, 42], [42, 42]],
  5: [[18, 18], [42, 18], [30, 30], [18, 42], [42, 42]],
  6: [[18, 14], [42, 14], [18, 30], [42, 30], [18, 46], [42, 46]],
};

function pipColor(i) {
  if (props.kept) return 'var(--die-kept-pip)';
  if (props.val === 1 && i === 0) return 'var(--die-pip-1)';
  return 'var(--die-pip)';
}
</script>

<style scoped>
.die-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  cursor: default; user-select: none;
  transition: transform .15s;
}
.die-wrap.selectable { cursor: pointer; }
.die-wrap.selectable:hover { transform: translateY(-4px); }
.die-wrap.selectable:hover .die-svg { filter: drop-shadow(0 4px 8px rgba(0,0,0,.4)); }

.die-svg {
  width: 56px; height: 56px;
  transition: filter .2s;
}

.die-wrap.kept .die-svg {
  filter: drop-shadow(0 0 8px var(--die-kept-glow, rgba(70,214,255,.5)));
}

.kept-tag {
  font-size: .6rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
  color: var(--cyan); opacity: .9;
}
</style>
