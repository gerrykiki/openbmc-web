<script setup>
const props = defineProps({
  status: {
    type: String,
    default: 'Unknown', // OK | Warning | Critical | online | offline | Unknown
  },
  label: {
    type: String,
    default: '',
  },
})

const colorMap = {
  OK: 'var(--phosphor)',
  online: 'var(--phosphor)',
  Enabled: 'var(--phosphor)',
  Warning: 'var(--amber)',
  Critical: 'var(--red)',
  offline: 'var(--red)',
  Unknown: 'var(--text-lo)',
}

function color(status) {
  return colorMap[status] || colorMap.Unknown
}
</script>

<template>
  <span class="led-wrap">
    <span
      class="led"
      :style="{ background: color(props.status), boxShadow: `0 0 6px ${color(props.status)}` }"
    />
    <span v-if="label" class="led-label mono">{{ label }}</span>
  </span>
</template>

<style scoped>
.led-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.led {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.led-label {
  font-size: 12px;
  color: var(--text-lo);
  letter-spacing: 0.02em;
}
</style>
