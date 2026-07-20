import { defineStore } from 'pinia'
import { redfish, setDemoMode } from '../services/redfish'

const STORAGE_KEY = 'bmc-web:session'

function loadPersisted() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const persisted = loadPersisted()
    return {
      token: persisted?.token || null,
      sessionPath: persisted?.sessionPath || null,
      username: persisted?.username || null,
      error: null,
      pending: false,
    }
  },

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },

  actions: {
    persist() {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: this.token,
          sessionPath: this.sessionPath,
          username: this.username,
        }),
      )
    },

    async login(username, password) {
      this.pending = true
      this.error = null
      try {
        const { token, location, body } = await redfish.login(username, password)
        if (!token) {
          throw new Error('伺服器沒有回傳 X-Auth-Token,請確認 Redfish 版本')
        }
        this.token = token
        this.sessionPath = location || body?.['@odata.id'] || null
        this.username = username
        this.persist()
        return true
      } catch (err) {
        this.error = err.message || '登入失敗'
        return false
      } finally {
        this.pending = false
      }
    },

    async logout() {
      await redfish.logout(this.token, this.sessionPath)
      this.token = null
      this.sessionPath = null
      this.username = null
      sessionStorage.removeItem(STORAGE_KEY)
      setDemoMode(false)
    },
  },
})
