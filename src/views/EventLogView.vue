<script setup>
import { onMounted } from 'vue'
import { useBmcStore } from '../stores/bmc'
import PageHeader from '../components/PageHeader.vue'
import StatusLed from '../components/StatusLed.vue'

const bmc = useBmcStore()

onMounted(() => {
  if (bmc.eventLog.length === 0) bmc.fetchEventLog()
})

function formatTime(entry) {
  const raw = entry.Created || entry.EventTimestamp
  if (!raw) return '—'
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleString()
}
</script>

<template>
  <div>
    <PageHeader
      eyebrow="AUDIT"
      title="Event Log"
      subtitle="/redfish/v1/Systems/.../LogServices/EventLog/Entries —— BMC 自己的 journal,不需要 host 就有資料"
    >
      <template #actions>
        <button class="refresh-btn mono" :disabled="bmc.eventLogLoading" @click="bmc.fetchEventLog()">
          {{ bmc.eventLogLoading ? '讀取中…' : '重新整理' }}
        </button>
      </template>
    </PageHeader>

    <p v-if="bmc.eventLogError" class="error mono">{{ bmc.eventLogError }}</p>

    <div v-if="!bmc.eventLogError && bmc.eventLog.length === 0 && !bmc.eventLogLoading" class="empty">
      目前沒有事件紀錄。
    </div>

    <div v-else-if="bmc.eventLog.length > 0" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>狀態</th>
            <th>時間</th>
            <th>Id</th>
            <th>MessageId</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in bmc.eventLog" :key="e['@odata.id']">
            <td><StatusLed :status="e.Severity || 'Unknown'" /></td>
            <td class="mono nowrap">{{ formatTime(e) }}</td>
            <td class="mono">{{ e.Id }}</td>
            <td class="mono">{{ e.MessageId || '—' }}</td>
            <td>{{ e.Message || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.refresh-btn {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text-lo);
  font-size: 12px;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.refresh-btn:hover:not(:disabled) {
  border-color: var(--phosphor-dim);
  color: var(--phosphor);
}
.refresh-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

.error {
  color: var(--red);
  font-size: 13px;
  padding: 14px 16px;
  border: 1px solid var(--red);
  border-radius: 8px;
  margin-bottom: 16px;
}

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
  min-width: 640px;
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
  vertical-align: top;
}
.table tbody tr:hover {
  background: var(--ink-100);
}
.nowrap {
  white-space: nowrap;
}
</style>
