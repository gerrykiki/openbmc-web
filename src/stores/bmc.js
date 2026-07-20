import { defineStore } from 'pinia'
import { redfish } from '../services/redfish'
import { useAuthStore } from './auth'

// Redfish 的集合(Collection)只會回傳成員的連結,要另外展開每一個
// member 才拿得到實際內容 —— 這是 HATEOAS 的典型模式。
async function expandCollection(collectionPath, token) {
  const collection = await redfish.get(collectionPath, token)
  const members = collection?.Members || []
  const details = await Promise.all(
    members.map((m) => redfish.get(m['@odata.id'], token).catch(() => null)),
  )
  return details.filter(Boolean)
}

export const useBmcStore = defineStore('bmc', {
  state: () => ({
    connection: 'unknown', // 'online' | 'offline' | 'unknown'
    systems: [],
    chassis: [],
    managers: [],
    loading: false,
    error: null,
    lastUpdated: null,
    actionPending: {}, // { [systemId]: boolean } —— 電源操作送出中
    actionError: {}, // { [systemId]: string } —— 電源操作的錯誤訊息
    eventLog: [],
    eventLogLoading: false,
    eventLogError: null,
  }),

  actions: {
    async checkConnection() {
      try {
        await redfish.ping()
        this.connection = 'online'
      } catch {
        this.connection = 'offline'
      }
    },

    async fetchAll() {
      const auth = useAuthStore()
      this.loading = true
      this.error = null
      try {
        const [systems, chassis, managers] = await Promise.all([
          expandCollection('/Systems', auth.token),
          expandCollection('/Chassis', auth.token),
          expandCollection('/Managers', auth.token),
        ])
        this.systems = systems
        this.chassis = chassis
        this.managers = managers
        this.connection = 'online'
        this.lastUpdated = new Date()
      } catch (err) {
        this.error = err.message || '資料抓取失敗'
        this.connection = 'offline'
      } finally {
        this.loading = false
      }
    },

    /**
     * 打 ComputerSystem.Reset Action(POST),對系統下電源指令。
     * target 直接讀 system.Actions 裡的 @odata.id,不自己拼路徑——
     * 這是 Redfish Action 的標準用法,server 給什麼路徑就打什麼路徑。
     */
    async resetSystem(system, resetType) {
      const auth = useAuthStore()
      const target = system.Actions?.['#ComputerSystem.Reset']?.target
      const id = system.Id
      if (!target) {
        this.actionError = { ...this.actionError, [id]: '這個 System 沒有提供 Reset Action' }
        return
      }
      this.actionPending = { ...this.actionPending, [id]: true }
      this.actionError = { ...this.actionError, [id]: null }
      try {
        await redfish.post(target, { ResetType: resetType }, auth.token)
        // BMC 執行電源動作需要一點時間才會反映在 PowerState 上,
        // 稍等一下再重新抓這個 System,確認狀態真的變了。
        await new Promise((resolve) => setTimeout(resolve, 1500))
        const fresh = await redfish.get(system['@odata.id'], auth.token)
        const idx = this.systems.findIndex((s) => s['@odata.id'] === system['@odata.id'])
        if (idx !== -1) this.systems[idx] = fresh
      } catch (err) {
        this.actionError = { ...this.actionError, [id]: err.message || '電源操作失敗' }
      } finally {
        this.actionPending = { ...this.actionPending, [id]: false }
      }
    },

    /**
     * 抓 LogServices/EventLog 底下的事件紀錄。這份資料是 BMC 自己的
     * journal(開機、登入、D-Bus 錯誤都會記),不像 Thermal/Power
     * 需要真的接上 host 或感測器才有東西,所以在純 BMC QEMU 環境下
     * 一定會有資料可以看。
     */
    async fetchEventLog() {
      const auth = useAuthStore()
      this.eventLogLoading = true
      this.eventLogError = null
      try {
        if (this.systems.length === 0) await this.fetchAll()
        const system = this.systems[0]
        const logServicesLink = system?.LogServices?.['@odata.id']
        if (!logServicesLink) throw new Error('這個 System 沒有提供 LogServices')

        const logServices = await redfish.get(logServicesLink, auth.token)
        const members = logServices?.Members || []
        const eventLogMember =
          members.find((m) => m['@odata.id']?.endsWith('/EventLog')) || members[0]
        if (!eventLogMember) throw new Error('找不到 EventLog 這個 LogService')

        const eventLog = await redfish.get(eventLogMember['@odata.id'], auth.token)
        const entriesLink = eventLog?.Entries?.['@odata.id']
        if (!entriesLink) throw new Error('EventLog 沒有提供 Entries 連結')

        const entriesCollection = await redfish.get(entriesLink, auth.token)
        const entryLinks = entriesCollection?.Members || []
        // 條目可能累積很多筆,只展開最新的一批,避免對 QEMU/ngrok 打出過量請求
        const MAX_ENTRIES = 50
        const recent = entryLinks.slice(-MAX_ENTRIES).reverse()

        const details = await Promise.all(
          recent.map((m) => redfish.get(m['@odata.id'], auth.token).catch(() => null)),
        )
        this.eventLog = details.filter(Boolean)
      } catch (err) {
        this.eventLogError = err.message || '事件日誌抓取失敗'
      } finally {
        this.eventLogLoading = false
      }
    },

    /** 從已展開的 chassis 資料裡,把感測器相關連結攤平成一份清單方便畫面顯示 */
    sensorSummary() {
      const rows = []
      for (const c of this.chassis) {
        const temps = c?.Thermal?.Temperatures || []
        const fans = c?.Thermal?.Fans || []
        const voltages = c?.Power?.Voltages || []
        for (const t of temps) {
          rows.push({
            chassis: c.Id,
            kind: '溫度',
            name: t.Name,
            reading: t.ReadingCelsius,
            unit: '°C',
            status: t.Status?.Health || 'Unknown',
          })
        }
        for (const f of fans) {
          rows.push({
            chassis: c.Id,
            kind: '風扇',
            name: f.Name,
            reading: f.Reading,
            unit: f.ReadingUnits || 'RPM',
            status: f.Status?.Health || 'Unknown',
          })
        }
        for (const v of voltages) {
          rows.push({
            chassis: c.Id,
            kind: '電壓',
            name: v.Name,
            reading: v.ReadingVolts,
            unit: 'V',
            status: v.Status?.Health || 'Unknown',
          })
        }
      }
      return rows
    },
  },
})
