<script setup>
import { computed, onMounted } from 'vue'
import { useBmcStore } from '../stores/bmc'
import PageHeader from '../components/PageHeader.vue'
import StatusLed from '../components/StatusLed.vue'

const bmc = useBmcStore()

onMounted(() => {
  if (bmc.systems.length === 0) bmc.fetchAll()
})

const sensors = computed(() => bmc.sensorSummary())
const warningCount = computed(
  () => sensors.value.filter((s) => s.status === 'Warning').length,
)
const criticalCount = computed(
  () => sensors.value.filter((s) => s.status === 'Critical').length,
)

function formatTime(d) {
  if (!d) return '—'
  return d.toLocaleTimeString('zh-TW', { hour12: false })
}
</script>

<template>
  <div>
    <PageHeader
      eyebrow="OVERVIEW"
      title="Dashboard"
      :subtitle="`最後更新 ${formatTime(bmc.lastUpdated)} · ${bmc.loading ? '讀取中…' : '已同步'}`"
    >
      <template #actions>
        <button class="refresh mono" @click="bmc.fetchAll()" :disabled="bmc.loading">
          {{ bmc.loading ? 'syncing…' : 'refresh' }}
        </button>
      </template>
    </PageHeader>

    <p v-if="bmc.error" class="error mono">{{ bmc.error }}</p>

    <section class="grid">
      <div class="card">
        <div class="card-label mono">CONNECTION</div>
        <StatusLed :status="bmc.connection" />
        <div class="card-value mono">{{ bmc.connection }}</div>
      </div>
      <div class="card">
        <div class="card-label mono">SYSTEMS</div>
        <div class="card-value mono">{{ bmc.systems.length }}</div>
      </div>
      <div class="card">
        <div class="card-label mono">CHASSIS</div>
        <div class="card-value mono">{{ bmc.chassis.length }}</div>
      </div>
      <div class="card">
        <div class="card-label mono">MANAGERS</div>
        <div class="card-value mono">{{ bmc.managers.length }}</div>
      </div>
      <div class="card" :class="{ warn: warningCount > 0 }">
        <div class="card-label mono">WARNINGS</div>
        <div class="card-value mono">{{ warningCount }}</div>
      </div>
      <div class="card" :class="{ critical: criticalCount > 0 }">
        <div class="card-label mono">CRITICAL</div>
        <div class="card-value mono">{{ criticalCount }}</div>
      </div>
    </section>

    <section class="systems-list">
      <h2 class="section-title mono">SYSTEMS</h2>
      <div v-if="bmc.systems.length === 0 && !bmc.loading" class="empty">
        還沒有資料,點右上角 refresh 試試看。
      </div>
      <div v-for="s in bmc.systems" :key="s['@odata.id']" class="system-row">
        <StatusLed :status="s.Status?.Health || 'Unknown'" />
        <span class="mono">{{ s.Id }}</span>
        <span class="dim mono">{{ s.PowerState }}</span>
        <span class="dim mono">{{ s.Manufacturer }} {{ s.Model }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.refresh {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text-lo);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.refresh:hover:not(:disabled) {
  border-color: var(--phosphor);
  color: var(--phosphor);
}

.error {
  color: var(--red);
  font-size: 13px;
  margin-bottom: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  margin-bottom: 36px;
}
.card {
  background: var(--ink-100);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.card.warn {
  border-color: var(--amber);
}
.card.critical {
  border-color: var(--red);
}
.card-label {
  font-size: 11px;
  color: var(--text-lo);
  letter-spacing: 0.06em;
}
.card-value {
  font-size: 22px;
  color: var(--text-hi);
}

.section-title {
  font-size: 12px;
  color: var(--text-lo);
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}
.system-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: var(--ink-100);
  border: 1px solid var(--line);
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 13px;
}
.dim {
  color: var(--text-lo);
}
.empty {
  color: var(--text-lo);
  font-size: 13px;
  padding: 20px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  text-align: center;
}
</style>
