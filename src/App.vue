<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useBmcStore } from './stores/bmc'
import NavSidebar from './components/NavSidebar.vue'

const route = useRoute()
const auth = useAuthStore()
const bmc = useBmcStore()

let timer
onMounted(() => {
  bmc.checkConnection()
  timer = setInterval(() => bmc.checkConnection(), 15000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div v-if="route.meta.public || !auth.isAuthenticated" class="bare">
    <router-view />
  </div>
  <div v-else class="shell">
    <NavSidebar />
    <main class="main scrollbar-thin">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.bare {
  min-height: 100vh;
}
.shell {
  display: flex;
  min-height: 100vh;
}
.main {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
  max-height: 100vh;
}

/* 手機版:側欄變成頂部列 + 底部分頁列,主內容區改成整頁捲動,
   底部留白避開固定的分頁列 */
@media (max-width: 768px) {
  .shell {
    flex-direction: column;
    min-height: 100vh;
  }
  .main {
    max-height: none;
    padding: 20px 16px 88px;
  }
}
</style>
