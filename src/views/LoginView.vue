<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { setDemoMode } from '../services/redfish'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const username = ref('root')
const password = ref('')

async function onSubmit() {
  const ok = await auth.login(username.value, password.value)
  if (ok) {
    router.push(route.query.redirect || '/')
  }
}

async function onDemo() {
  setDemoMode(true)
  const ok = await auth.login('demo', 'demo')
  if (ok) {
    router.push(route.query.redirect || '/')
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="boot-log mono">
        <p>Phosphor OpenBMC (Reference Distro)</p>
        <p>evb-ast2600 login console</p>
        <p class="dim">connecting to session service...</p>
      </div>

      <h1 class="mono title">SIGN IN</h1>
      <p class="subtitle">輸入 BMC 帳號密碼建立 Redfish Session</p>

      <form class="form" @submit.prevent="onSubmit">
        <label class="field">
          <span class="field-label mono">username</span>
          <input v-model="username" type="text" autocomplete="username" />
        </label>
        <label class="field">
          <span class="field-label mono">password</span>
          <input v-model="password" type="password" autocomplete="current-password" />
        </label>

        <button class="submit mono" type="submit" :disabled="auth.pending">
          {{ auth.pending ? 'connecting…' : 'connect' }}
        </button>

        <p v-if="auth.error" class="error mono">{{ auth.error }}</p>
      </form>

      <div class="demo-divider mono">或者</div>

      <button type="button" class="demo-btn mono" @click="onDemo" :disabled="auth.pending">
        使用 Demo 模式(不需連線)
      </button>
      <p class="demo-hint">
        連不到家裡的 BMC 時,可以先用這個看整個 app 的畫面跟操作流程,
        資料都是假的,不會打任何網路請求。
      </p>

      <p class="hint">
        預設帳密:<span class="mono">root / 0penBmc</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background:
    radial-gradient(circle at 20% 20%, rgba(61, 220, 132, 0.06), transparent 40%),
    var(--ink-000);
}

.login-card {
  width: 380px;
  max-width: 100%;
  background: var(--ink-100);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 28px;
}

.boot-log {
  font-size: 11px;
  color: var(--text-lo);
  line-height: 1.6;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.boot-log .dim {
  color: var(--phosphor-dim);
}

.title {
  font-size: 20px;
  letter-spacing: 0.08em;
  margin: 0 0 4px;
  color: var(--text-hi);
}
.subtitle {
  font-size: 13px;
  color: var(--text-lo);
  margin: 0 0 20px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 11px;
  color: var(--text-lo);
  letter-spacing: 0.05em;
}
.field input {
  background: var(--ink-000);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 10px 12px;
  color: var(--text-hi);
  font-size: 14px;
}
.field input:focus {
  border-color: var(--phosphor-dim);
}

.submit {
  margin-top: 6px;
  background: var(--phosphor-dim);
  border: 1px solid var(--phosphor);
  color: #eafff2;
  border-radius: 6px;
  padding: 10px;
  font-size: 13px;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background 0.15s ease;
}
.submit:hover:not(:disabled) {
  background: var(--phosphor);
  color: #05130c;
}
.submit:disabled {
  opacity: 0.6;
  cursor: wait;
}

.error {
  color: var(--red);
  font-size: 12px;
}

.hint {
  margin: 18px 0 0;
  font-size: 12px;
  color: var(--text-lo);
  text-align: center;
}

.demo-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0 14px;
  font-size: 11px;
  color: var(--text-lo);
}
.demo-divider::before,
.demo-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}

.demo-btn {
  width: 100%;
  background: transparent;
  border: 1px solid var(--amber);
  color: var(--amber);
  border-radius: 6px;
  padding: 10px;
  font-size: 13px;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 0.15s ease;
}
.demo-btn:hover:not(:disabled) {
  background: rgba(232, 162, 61, 0.12);
}
.demo-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.demo-hint {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-lo);
}
</style>
