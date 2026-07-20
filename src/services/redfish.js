// 統一管理所有打到 BMC 的 Redfish 請求。
// 開發模式下,實際的 fetch 路徑是 /redfish/...,由 vite.config.js 的
// proxy 轉發到 .env 裡設定的 ngrok 網址,瀏覽器端不會看到真實網域,
// 也因此不會遇到 CORS 問題。

import { demoGet, demoPost, demoLogin } from './fixtures'

const BASE = '/redfish/v1'
const DEMO_KEY = 'bmc-web:demo-mode'

/** Demo 模式:不打真的網路請求,全部走 fixtures.js 的假資料 */
export function isDemoMode() {
  return sessionStorage.getItem(DEMO_KEY) === '1'
}

export function setDemoMode(on) {
  if (on) sessionStorage.setItem(DEMO_KEY, '1')
  else sessionStorage.removeItem(DEMO_KEY)
}

class RedfishError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function authHeaders(token) {
  return token ? { 'X-Auth-Token': token } : {}
}

async function handle(res) {
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body?.error?.message || JSON.stringify(body)
    } catch {
      detail = res.statusText
    }
    throw new RedfishError(`${res.status} ${detail}`, res.status)
  }
  // 204 No Content 之類的回應不會有 body
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const redfish = {
  /**
   * 用帳密向 SessionService 換取 X-Auth-Token
   */
  async login(username, password) {
    if (isDemoMode()) return demoLogin(username)
    const res = await fetch(`${BASE}/SessionService/Sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ UserName: username, Password: password }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new RedfishError(
        body?.error?.message || '登入失敗,請確認帳號密碼',
        res.status,
      )
    }
    const token = res.headers.get('X-Auth-Token')
    const location = res.headers.get('Location')
    const body = await res.json().catch(() => ({}))
    return { token, location, body }
  },

  async logout(token, sessionPath) {
    if (isDemoMode()) return
    if (!token || !sessionPath) return
    await fetch(sessionPath, {
      method: 'DELETE',
      headers: authHeaders(token),
    }).catch(() => {})
  },

  /** 通用 GET,path 可以是相對路徑(例如 /Systems)或完整 @odata.id */
  async get(path, token) {
    if (isDemoMode()) return demoGet(path)
    const url = path.startsWith('/redfish') ? path : `${BASE}${path}`
    const res = await fetch(url, { headers: authHeaders(token) })
    return handle(res)
  },

  /** 通用 POST,主要用來打 Action(例如 ComputerSystem.Reset) */
  async post(path, body, token) {
    if (isDemoMode()) return demoPost(path, body)
    const url = path.startsWith('/redfish') ? path : `${BASE}${path}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(body),
    })
    return handle(res)
  },

  /** 不帶認證資訊,單純確認服務有沒有回應(用於連線狀態指示燈) */
  async ping() {
    if (isDemoMode()) return { '@odata.id': BASE }
    const res = await fetch(`${BASE}/`)
    return handle(res)
  },
}

export { RedfishError }
