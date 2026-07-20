<script setup>
import { onMounted } from 'vue'
import { useBmcStore } from '../stores/bmc'
import PageHeader from '../components/PageHeader.vue'
import StatusLed from '../components/StatusLed.vue'

const bmc = useBmcStore()

onMounted(() => {
  if (bmc.systems.length === 0) bmc.fetchAll()
})

// ResetType 對應的中文標籤,順序也決定按鈕排列順序
const RESET_LABELS = {
  On: '開機',
  ForceOn: '強制開機',
  GracefulShutdown: '正常關機',
  GracefulRestart: '正常重開機',
  ForceRestart: '強制重開機',
  ForceOff: '強制關機',
  Nmi: '傳送 NMI',
  PushPowerButton: '模擬電源鍵',
}
// 有些 bmcweb 版本不會回傳 ResetType@Redfish.AllowableValues,
// 這時退回一組常見的預設值,讓按鈕還是能顯示出來
const DEFAULT_RESET_TYPES = ['On', 'GracefulShutdown', 'ForceRestart', 'ForceOff']

function allowableResets(s) {
  const values = s.Actions?.['#ComputerSystem.Reset']?.['ResetType@Redfish.AllowableValues']
  return values && values.length ? values : DEFAULT_RESET_TYPES
}

function btnVariant(resetType) {
  if (['On', 'ForceOn'].includes(resetType)) return 'variant-on'
  if (['ForceOff', 'ForceRestart'].includes(resetType)) return 'variant-force'
  return 'variant-graceful'
}

// 系統已經是 On 就不能再按開機類動作,反之亦然
function isDisabled(s, resetType) {
  if (bmc.actionPending[s.Id]) return true
  const isOn = s.PowerState === 'On'
  if (['On', 'ForceOn'].includes(resetType)) return isOn
  if (['GracefulShutdown', 'ForceOff', 'GracefulRestart', 'ForceRestart'].includes(resetType)) {
    return !isOn
  }
  return false
}

function onReset(s, resetType) {
  bmc.resetSystem(s, resetType)
}
</script>

<template>
  <div>
    <PageHeader eyebrow="COMPUTE" title="Systems" subtitle="/redfish/v1/Systems 底下展開的每個 member" />

    <div v-if="bmc.systems.length === 0 && !bmc.loading" class="empty">尚無資料</div>

    <div class="cards">
      <div v-for="s in bmc.systems" :key="s['@odata.id']" class="detail-card">
        <div class="detail-head">
          <StatusLed :status="s.Status?.Health || 'Unknown'" />
          <span class="mono id">{{ s.Id }}</span>
        </div>
        <dl>
          <div class="row"><dt>PowerState</dt><dd class="mono">{{ s.PowerState }}</dd></div>
          <div class="row"><dt>Manufacturer</dt><dd class="mono">{{ s.Manufacturer || '—' }}</dd></div>
          <div class="row"><dt>Model</dt><dd class="mono">{{ s.Model || '—' }}</dd></div>
          <div class="row"><dt>SerialNumber</dt><dd class="mono">{{ s.SerialNumber || '—' }}</dd></div>
          <div class="row"><dt>BIOSVersion</dt><dd class="mono">{{ s.BiosVersion || '—' }}</dd></div>
          <div class="row" v-if="s.ProcessorSummary">
            <dt>Processors</dt>
            <dd class="mono">{{ s.ProcessorSummary?.Count ?? '—' }}</dd>
          </div>
          <div class="row" v-if="s.MemorySummary">
            <dt>Memory</dt>
            <dd class="mono">{{ s.MemorySummary?.TotalSystemMemoryGiB ?? '—' }} GiB</dd>
          </div>
        </dl>

        <div class="power-controls">
          <button
            v-for="rt in allowableResets(s)"
            :key="rt"
            class="reset-btn mono"
            :class="btnVariant(rt)"
            :disabled="isDisabled(s, rt)"
            @click="onReset(s, rt)"
          >
            {{ RESET_LABELS[rt] || rt }}
          </button>
        </div>
        <p v-if="bmc.actionPending[s.Id]" class="power-status mono">POST ComputerSystem.Reset 送出中…</p>
        <p v-if="bmc.actionError[s.Id]" class="power-error mono">{{ bmc.actionError[s.Id] }}</p>
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

.power-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}
.reset-btn {
  font-size: 11.5px;
  letter-spacing: 0.03em;
  padding: 7px 12px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--ink-000);
  color: var(--text-hi);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.reset-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.variant-on {
  color: var(--phosphor);
  border-color: var(--phosphor-dim);
}
.variant-on:hover:not(:disabled) {
  background: var(--phosphor-dim);
  color: #eafff2;
}
.variant-graceful {
  color: var(--amber);
  border-color: var(--amber);
}
.variant-graceful:hover:not(:disabled) {
  background: rgba(232, 162, 61, 0.14);
}
.variant-force {
  color: var(--red);
  border-color: var(--red);
}
.variant-force:hover:not(:disabled) {
  background: rgba(229, 72, 77, 0.14);
}

.power-status {
  margin: 10px 0 0;
  font-size: 11.5px;
  color: var(--text-lo);
}
.power-error {
  margin: 10px 0 0;
  font-size: 11.5px;
  color: var(--red);
}
</style>
