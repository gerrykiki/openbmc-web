<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <header class="page-header">
    <div>
      <div v-if="eyebrow" class="eyebrow mono">{{ eyebrow }}</div>
      <h1 class="title">{{ title }}</h1>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    </div>
    <div class="actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}
.eyebrow {
  font-size: 11px;
  color: var(--phosphor);
  letter-spacing: 0.12em;
  margin-bottom: 6px;
}
.title {
  font-size: 24px;
  margin: 0;
  color: var(--text-hi);
}
.subtitle {
  font-size: 13px;
  color: var(--text-lo);
  margin: 6px 0 0;
}

@media (max-width: 768px) {
  .page-header {
    margin-bottom: 20px;
  }
  .title {
    font-size: 20px;
  }
  .actions {
    width: 100%;
  }
  .actions :deep(button) {
    width: 100%;
  }
}
</style>
