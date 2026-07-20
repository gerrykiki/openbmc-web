<script setup>
import { onMounted } from 'vue'
import { useBmcStore } from '../stores/bmc'
import PageHeader from '../components/PageHeader.vue'
import StatusLed from '../components/StatusLed.vue'

const bmc = useBmcStore()

onMounted(() => {
  if (bmc.chassis.length === 0) bmc.fetchAll()
})
</script>

<template>
  <div>
    <PageHeader eyebrow="ENCLOSURE" title="Chassis" subtitle="/redfish/v1/Chassis 底下展開的每個 member" />

    <div v-if="bmc.chassis.length === 0 && !bmc.loading" class="empty">尚無資料</div>

    <div class="cards">
      <div v-for="c in bmc.chassis" :key="c['@odata.id']" class="detail-card">
        <div class="detail-head">
          <StatusLed :status="c.Status?.Health || 'Unknown'" />
          <span class="mono id">{{ c.Id }}</span>
        </div>
        <dl>
          <div class="row"><dt>ChassisType</dt><dd class="mono">{{ c.ChassisType || '—' }}</dd></div>
          <div class="row"><dt>Manufacturer</dt><dd class="mono">{{ c.Manufacturer || '—' }}</dd></div>
          <div class="row"><dt>PartNumber</dt><dd class="mono">{{ c.PartNumber || '—' }}</dd></div>
          <div class="row"><dt>State</dt><dd class="mono">{{ c.Status?.State || '—' }}</dd></div>
        </dl>
      </div>
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
  text-align: center;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.detail-card {
  background: var(--ink-100);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 18px;
}
.detail-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}
.id {
  font-size: 14px;
  color: var(--text-hi);
}
dl {
  margin: 0;
}
.row {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  padding: 6px 0;
}
.row dt {
  color: var(--text-lo);
}
.row dd {
  margin: 0;
  color: var(--text-hi);
}
</style>
