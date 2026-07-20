<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useBmcStore } from '../stores/bmc'
import { isDemoMode } from '../services/redfish'
import StatusLed from './StatusLed.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const bmc = useBmcStore()

const nav = [
  { to: '/', name: 'dashboard', label: 'Dashboard', code: '00' },
  { to: '/systems', name: 'systems', label: 'Systems', code: '01' },
  { to: '/chassis', name: 'chassis', label: 'Chassis', code: '02' },
  { to: '/sensors', name: 'sensors', label: 'Sensors', code: '03' },
  { to: '/events', name: 'events', label: 'Event Log', code: '04' },
]

// auth.logout() 只清 store 狀態,不會自己導頁 —— router 的登入守衛只在
// 「導航發生時」才會檢查,單純改 store 狀態不會觸發它,所以這裡要自己 push
async function onLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-dot"></span>
      <div>
        <div class="brand-title mono">
          bmc-web
          <span v-if="isDemoMode()" class="demo-tag mono">DEMO</span>
        </div>
        <div class="brand-sub mono">evb-ast2600 · redfish console</div>
      </div>
    </div>

    <nav class="nav">
      <router-link
        v-for="item in nav"
        :key="item.name"
        :to="item.to"
        class="nav-item"
        :class="{ active: route.name === item.name }"
      >
        <span class="nav-code mono">{{ item.code }}</span>
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <StatusLed :status="bmc.connection" :label="bmc.connection === 'online' ? 'LINK UP' : 'NO LINK'" />
      <div class="user-row">
        <span class="mono user-name">{{ auth.username }}</span>
        <button class="logout-btn mono" @click="onLogout">登出</button>
      </div>
    </div>
  </aside>

  <!-- 手機版頂部列:品牌 + 連線狀態 + 登出,取代桌機側欄的 brand/footer -->
  <header class="mobile-topbar">
    <div class="mobile-brand">
      <span class="brand-dot"></span>
      <span class="mono">bmc-web</span>
      <span v-if="isDemoMode()" class="demo-tag mono">DEMO</span>
    </div>
    <div class="mobile-actions">
      <StatusLed :status="bmc.connection" />
      <button class="logout-btn mono" @click="onLogout">登出</button>
    </div>
  </header>

  <!-- 手機版底部分頁列:取代桌機側欄的 nav -->
  <nav class="mobile-tabbar">
    <router-link
      v-for="item in nav"
      :key="item.name"
      :to="item.to"
      class="tab-item"
      :class="{ active: route.name === item.name }"
    >
      <span class="tab-code mono">{{ item.code }}</span>
      <span class="tab-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--ink-100);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px;
  border-bottom: 1px solid var(--line);
}
.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--phosphor);
  box-shadow: 0 0 10px var(--phosphor);
  flex-shrink: 0;
}
.brand-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-hi);
}
.brand-sub {
  font-size: 11px;
  color: var(--text-lo);
  margin-top: 2px;
}
.demo-tag {
  font-size: 9px;
  color: var(--amber);
  border: 1px solid var(--amber);
  border-radius: 3px;
  padding: 1px 4px;
  margin-left: 6px;
  letter-spacing: 0.05em;
  vertical-align: middle;
}

.nav {
  display: flex;
  flex-direction: column;
  padding: 12px 10px;
  gap: 2px;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  text-decoration: none;
  color: var(--text-lo);
  font-size: 14px;
  transition: background 0.12s ease, color 0.12s ease;
}
.nav-item:hover {
  background: var(--ink-200);
  color: var(--text-hi);
}
.nav-item.active {
  background: var(--ink-200);
  color: var(--phosphor);
}
.nav-code {
  font-size: 11px;
  color: var(--text-lo);
  width: 18px;
}
.nav-item.active .nav-code {
  color: var(--phosphor);
}

.sidebar-footer {
  padding: 16px 18px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.user-name {
  font-size: 12px;
  color: var(--text-lo);
}
.logout-btn {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text-lo);
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.logout-btn:hover {
  border-color: var(--red);
  color: var(--red);
}

/* ------------------------------------------------------------
   手機版:預設隱藏,768px 以下才切換顯示
   桌機側欄(.sidebar)則反過來在這個斷點被隱藏
------------------------------------------------------------- */
.mobile-topbar,
.mobile-tabbar {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .mobile-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    background: var(--ink-100);
    border-bottom: 1px solid var(--line);
    position: sticky;
    top: 0;
    z-index: 30;
  }
  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-hi);
  }
  .mobile-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .mobile-actions .logout-btn {
    padding: 5px 10px;
  }

  .mobile-tabbar {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--ink-100);
    border-top: 1px solid var(--line);
    z-index: 30;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 9px 4px 10px;
    text-decoration: none;
    color: var(--text-lo);
  }
  .tab-code {
    font-size: 11px;
  }
  .tab-label {
    font-size: 10px;
    letter-spacing: 0.01em;
  }
  .tab-item.active {
    color: var(--phosphor);
  }
}
</style>
