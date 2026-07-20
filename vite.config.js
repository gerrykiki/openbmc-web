import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// 開發模式下,所有打到 /redfish 的請求都會由 Vite 這個 Node.js 伺服器
// 轉發到 VITE_API_TARGET(你的 ngrok 網址),瀏覽器端看到的永遠是同一個
// origin,不會觸發 CORS 檢查。
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_TARGET || 'https://localhost:2443'

  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        '/redfish': {
          target,
          changeOrigin: true,
          secure: false, // 後端(bmcweb / ngrok)可能是自簽憑證,開發階段先關閉驗證
        },
      },
    },
  }
})
