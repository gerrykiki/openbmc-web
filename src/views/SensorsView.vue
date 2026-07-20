<script setup>
import { computed, onMounted } from 'vue'
import { useBmcStore } from '../stores/bmc'
import PageHeader from '../components/PageHeader.vue'
import StatusLed from '../components/StatusLed.vue'

const bmc = useBmcStore()

onMounted(() => {
  if (bmc.chassis.length === 0) bmc.fetchAll()
})

const rows = computed(() => bmc.sensorSummary())
</script>

<template>
  <div>
    <PageHeader
      eyebrow="TELEMETRY"
      title="Sensors"
      subtitle="從 Chassis 的 Thermal / Power 資源攤平出來的感測器讀值"
    />

    <div v-if="rows.length === 0 && !bmc.loading" class="empty">
      這個模擬環境目前沒有回傳感測器資料(QEMU 沒有接實體感測器很正常),
      之後接到真實硬體或有掛載感測器模擬的 image 就會有數值。
    </div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>狀態</th>
            <th>Chassis</th>
            <th>種類</th>
            <th>名稱</th>
            <th>讀值</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i">
            <td><StatusLed :status="r.status" /></td>
            <td class="mono">{{ r.chassis }}</td>
            <td class="mono">{{ r.kind }}</td>
            <td class="mono">{{ r.name }}</td>
            <td class="mono">{{ r.reading ?? '—' }} {{ r.unit }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.empty {
  color: var(--text-lo);
  font-size: 13px;
  padding: 20px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  line-height: 1.6;
}
.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: 13px;
}
.table th {
  text-align: left;
  color: var(--text-lo);
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.05em;
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
}
.table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  color: var(--text-hi);
}
.table tbody tr:hover {
  background: var(--ink-100);
}
</style>
