// Demo / 離線示範資料。
// 純前端假資料,完全不會發出網路請求 —— 目的是在連不到真的 BMC 時
// (人在外面、ngrok 沒開之類),還是能展示整個 app 的畫面跟操作流程。
//
// redfish.js 在 isDemoMode() 為 true 時,會把 get/post/login 都導來這裡,
// 對 stores/views 來說完全透明,不需要知道自己在讀假資料。

const PREFIX = '/redfish/v1'

const state = {
  powerState: 'Off',
  entries: [
    makeEntry(1, 'OK', 'OpenBMC.0.1.ServiceStarted', 'bmcweb 服務啟動完成', 3),
    makeEntry(2, 'Warning', 'OpenBMC.0.1.FanRedundancyLost', 'Fan 冗餘狀態異常,Fan_2 轉速偏低', 2),
    makeEntry(3, 'Critical', 'OpenBMC.0.1.PowerSupplyFailed', '電源供應器 PSU_2 回報故障', 1),
  ],
  nextId: 4,
}

function makeEntry(id, severity, messageId, message, hoursAgo) {
  return {
    '@odata.id': `${PREFIX}/Systems/system/LogServices/EventLog/Entries/${id}`,
    '@odata.type': '#LogEntry.v1_13_0.LogEntry',
    Id: String(id),
    Name: `Log Entry ${id}`,
    EntryType: 'Event',
    Severity: severity,
    MessageId: messageId,
    Message: message,
    Created: new Date(Date.now() - hoursAgo * 3600_000).toISOString(),
  }
}

function addEntry(severity, messageId, message) {
  const id = state.nextId++
  state.entries.push(makeEntry(id, severity, messageId, message, 0))
}

function normalize(path) {
  return path.startsWith(PREFIX) ? path.slice(PREFIX.length) : path
}

function collection(ids) {
  return { 'Members@odata.count': ids.length, Members: ids.map((id) => ({ '@odata.id': id })) }
}

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function systemPayload() {
  return {
    '@odata.id': `${PREFIX}/Systems/system`,
    '@odata.type': '#ComputerSystem.v1_20_0.ComputerSystem',
    Id: 'system',
    Name: 'demo-system',
    Status: { Health: 'OK', State: 'Enabled' },
    PowerState: state.powerState,
    Manufacturer: 'ASPEED (Demo)',
    Model: 'AST2600 EVB',
    SerialNumber: 'DEMO-0001',
    BiosVersion: 'demo-1.0.0',
    ProcessorSummary: { Count: 2, Status: { Health: 'OK' } },
    MemorySummary: { TotalSystemMemoryGiB: 16, Status: { Health: 'OK' } },
    LogServices: { '@odata.id': `${PREFIX}/Systems/system/LogServices` },
    Actions: {
      '#ComputerSystem.Reset': {
        target: `${PREFIX}/Systems/system/Actions/ComputerSystem.Reset`,
        'ResetType@Redfish.AllowableValues': [
          'On',
          'GracefulShutdown',
          'GracefulRestart',
          'ForceRestart',
          'ForceOff',
        ],
      },
    },
  }
}

function chassisPayload() {
  return {
    '@odata.id': `${PREFIX}/Chassis/chassis`,
    '@odata.type': '#Chassis.v1_22_0.Chassis',
    Id: 'chassis',
    Name: 'demo-chassis',
    ChassisType: 'RackMount',
    Manufacturer: 'ASPEED (Demo)',
    PartNumber: 'EVB-AST2600',
    Status: { Health: 'Warning', State: 'Enabled' },
    // 真實的 bmcweb 這裡通常是連到 /Thermal、/Power 的連結,不是內嵌資料;
    // 這裡照抄 sensorSummary() 目前預期的內嵌格式,讓 demo 資料能直接顯示。
    Thermal: {
      Temperatures: [
        { Name: 'CPU_Temp', ReadingCelsius: 52, Status: { Health: 'OK' } },
        { Name: 'Inlet_Temp', ReadingCelsius: 29, Status: { Health: 'OK' } },
        { Name: 'Outlet_Temp', ReadingCelsius: 61, Status: { Health: 'Warning' } },
      ],
      Fans: [
        { Name: 'Fan_1', Reading: 8200, ReadingUnits: 'RPM', Status: { Health: 'OK' } },
        { Name: 'Fan_2', Reading: 1100, ReadingUnits: 'RPM', Status: { Health: 'Warning' } },
      ],
    },
    Power: {
      Voltages: [
        { Name: 'PSU_1_Voltage', ReadingVolts: 12.02, Status: { Health: 'OK' } },
        { Name: 'PSU_2_Voltage', ReadingVolts: 0, Status: { Health: 'Critical' } },
      ],
    },
  }
}

function managerPayload() {
  return {
    '@odata.id': `${PREFIX}/Managers/bmc`,
    '@odata.type': '#Manager.v1_16_0.Manager',
    Id: 'bmc',
    Name: 'demo-bmc',
    ManagerType: 'BMC',
    Status: { Health: 'OK', State: 'Enabled' },
    FirmwareVersion: 'demo-2.16.0',
  }
}

export async function demoLogin(username) {
  await delay(200)
  return {
    token: 'demo-token',
    location: `${PREFIX}/SessionService/Sessions/demo`,
    body: {
      '@odata.id': `${PREFIX}/SessionService/Sessions/demo`,
      UserName: username || 'demo',
    },
  }
}

export async function demoGet(path) {
  await delay()
  const p = normalize(path)

  if (p === '/' || p === '') return { '@odata.id': PREFIX, Name: 'Demo Redfish Service' }
  if (p === '/Systems') return collection([`${PREFIX}/Systems/system`])
  if (p === '/Systems/system') return systemPayload()
  if (p === '/Chassis') return collection([`${PREFIX}/Chassis/chassis`])
  if (p === '/Chassis/chassis') return chassisPayload()
  if (p === '/Managers') return collection([`${PREFIX}/Managers/bmc`])
  if (p === '/Managers/bmc') return managerPayload()
  if (p === '/Systems/system/LogServices') {
    return collection([`${PREFIX}/Systems/system/LogServices/EventLog`])
  }
  if (p === '/Systems/system/LogServices/EventLog') {
    return {
      '@odata.id': `${PREFIX}/Systems/system/LogServices/EventLog`,
      Id: 'EventLog',
      Name: 'System Event Log',
      Entries: { '@odata.id': `${PREFIX}/Systems/system/LogServices/EventLog/Entries` },
    }
  }
  if (p === '/Systems/system/LogServices/EventLog/Entries') {
    return collection(state.entries.map((e) => e['@odata.id']))
  }
  const entryMatch = p.match(/^\/Systems\/system\/LogServices\/EventLog\/Entries\/(\d+)$/)
  if (entryMatch) {
    const entry = state.entries.find((e) => e.Id === entryMatch[1])
    if (entry) return entry
  }

  throw new Error(`Demo 模式沒有這條路徑的假資料:${path}`)
}

export async function demoPost(path, body) {
  await delay()
  const p = normalize(path)

  if (p === '/Systems/system/Actions/ComputerSystem.Reset') {
    const resetType = body?.ResetType
    const poweredOn = ['On', 'ForceOn', 'GracefulRestart', 'ForceRestart'].includes(resetType)
    state.powerState = poweredOn ? 'On' : 'Off'
    addEntry(
      'OK',
      'OpenBMC.0.1.ResetExecuted',
      `已執行 ${resetType},PowerState 變成 ${state.powerState}(demo 模擬)`,
    )
    return {}
  }

  throw new Error(`Demo 模式沒有這個 Action:${path}`)
}
