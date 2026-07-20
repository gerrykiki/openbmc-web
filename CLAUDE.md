# bmc-web

## 這是什麼

Vue 3 + Pinia + Vue Router 寫的 OpenBMC Redfish 前端練習專案。使用者(Gerry)
用這個專案練習 Redfish/D-Bus 相關的前端開發,目標之一是準備 BMC/OpenBMC 相關的
技術面試 —— 所以合作時偏好「真的理解架構在幹嘛」而不是只求功能能動,遇到錯誤
訊息(例如 503)會希望被解釋成因、教怎麼用 `busctl`/`journalctl` 在 BMC 上驗證,
而不是直接被告知怎麼修。

後端是接 WSL2 裡跑的 `evb-ast2600` QEMU 模擬環境,透過 ngrok 對外開放,Vite dev
server 當 proxy 轉發 `/redfish/...` 請求以避開瀏覽器 CORS 限制。ngrok 免費版網址
每次重開會換,要記得更新 `.env` 的 `VITE_API_TARGET`。

## 常用指令

```bash
npm install
npm run dev      # http://localhost:5173(可能因 port 占用跳到其他 port)
npm run build
npm run preview
```

## 架構

```
瀏覽器(Vue App)→ /redfish/...(同源)
  → Vite dev server proxy(Node.js,伺服器對伺服器,無 CORS 問題)
    → ngrok 網址 → Windows → WSL2 → QEMU → BMC(bmcweb, port 443)
```

## 專案結構

```
src/
  services/
    redfish.js    所有 Redfish HTTP 呼叫(login/get/post/ping/logout),
                  也是 Demo 模式的分流點(isDemoMode() 為真時全部轉呼叫 fixtures.js)
    fixtures.js   Demo 模式的假資料 + 假 request handler,狀態可變
                  (例如按「開機」真的會改變記憶體裡的 PowerState 並產生一筆假 log)
  stores/
    auth.js       session token、登入登出、demo 模式的進出
    bmc.js        Systems/Chassis/Managers、sensorSummary()、
                  resetSystem()(電源 Action)、fetchEventLog()
  router/index.js 路由 + 登入守衛(beforeEach 檢查 auth.isAuthenticated)
  views/
    LoginView.vue     登入頁,含「使用 Demo 模式」按鈕
    DashboardView.vue 總覽
    SystemsView.vue   Systems 詳細資料 + 電源開關按鈕(ComputerSystem.Reset Action)
    ChassisView.vue   Chassis 詳細資料
    SensorsView.vue   感測器列表(從 Chassis 的 Thermal/Power 攤平,見下方已知問題)
    EventLogView.vue  LogServices/EventLog,表格用 .table-wrap 包 overflow-x:auto
  components/
    NavSidebar.vue  桌機側欄 + 手機版頂欄/底部分頁列(同一元件用 media query 切換,
                    Vue 3 多根節點,不是兩個元件)
    StatusLed.vue   狀態燈號(OK/Warning/Critical/online/offline)
    PageHeader.vue  共用頁首
```

## 目前已完成的功能(依 session 順序)

1. **Power On/Off 按鈕**(`SystemsView.vue` + `bmc.resetSystem()`)—— 打
   `POST .../Actions/ComputerSystem.Reset`,`target` 跟 `AllowableValues` 都從
   `system.Actions['#ComputerSystem.Reset']` 讀,不自己拼路徑。送出後等 1.5 秒
   再重新 GET 該 System,因為 BMC 執行電源動作需要時間反映在 `PowerState` 上。
   按鈕依目前 `PowerState` 做互斥 disable。

2. **Event Log 頁**(`EventLogView.vue` + `bmc.fetchEventLog()`)—— 拉
   `LogServices/EventLog/Entries`,只展開最新 50 筆避免打爆 ngrok/QEMU。這份資料
   來自 `phosphor-logging`,只在有明確 fault/error 事件被 Commit 時才會有內容,
   跟 Thermal/Power 感測器資料是否存在無關 —— 健康的 QEMU 環境本來就可能是空的
   (`Members@odata.count: 0` 是正常情況,不是 bug)。

3. **手機版 RWD**(`NavSidebar.vue` + `App.vue` + `PageHeader.vue`)—— 768px
   斷點,桌機側欄 vs. 手機頂欄+底部分頁列(5 個項目,沿用原本的兩位數代碼當
   「圖示」維持 terminal 美學,沒有另外拉圖示庫)。表格頁面(Sensors/EventLog)
   包了 `.table-wrap { overflow-x: auto }` 避免窄螢幕被撐爆。

4. **Demo 模式**(`services/fixtures.js` + `redfish.js` 的 `isDemoMode()`)——
   人在外面連不到家裡 BMC 時,Login 頁可以選「使用 Demo 模式」,完全不打網路
   請求,用假資料展示整個 app,包括原本容易空白的 Sensors/Event Log。旗標存在
   `sessionStorage`(跟登入 session 同生命週期,關分頁即失效),對 stores/views
   完全透明,不需要知道自己在讀假資料。

5. **Vercel 部署 + 正式站 CORS 代理**(`api/redfish/[...path].js` +
   `vercel.json`)—— `vite.config.js` 的 `server.proxy` 只在本機 `npm run
   dev` 的 Node process 有效,`vite build` 出來的 `dist/` 是純靜態檔案,部署到
   Vercel 後沒有東西幫忙轉發 `/redfish/...`。這支 Serverless Function 扮演
   跟 Vite proxy 一樣的角色:瀏覽器打同源的 `/redfish/...`(靠 `vercel.json`
   的 `rewrites` 轉給 `/api/redfish/...`),function 在伺服器端把請求轉發到
   `API_TARGET`(Vercel 專案的 Environment Variable,存放 ngrok 網址,**不要**
   加 `VITE_` 前綴以免被打包進前端),回應(含 `X-Auth-Token`/`Location` 這些
   `redfish.js` 依賴的 header)原封不動轉回去。因為是 server-to-server,瀏覽器
   端完全不知道背後真正打到哪裡,不會觸發同源政策檢查。`vercel.json` 另外加了
   SPA fallback(`/((?!api/).*) → /index.html`),因為 Vue Router 用
   `createWebHistory`,直接用網址列進 `/systems` 這類子路由時需要伺服器端
   fallback 到 `index.html`,不然 Vercel 靜態站會回 404。
   ngrok 網址換掉時記得回 Vercel 專案設定更新 `API_TARGET` 並重新 deploy;
   ngrok 免費方案有提供一個固定的 static domain 可以申請,申請後這個網址就不
   會再變,可以省掉每次重開都要回來改設定的麻煩。

## 已知問題 / 待驗證

- **Thermal/Power 可能根本沒抓到資料**:`bmc.sensorSummary()` 讀
  `chassis.Thermal.Temperatures`,但依 Redfish schema,`Chassis` 資源上的
  `Thermal`/`Power` 通常只是連到獨立子資源的連結(`{"@odata.id": ".../Thermal"}`),
  不是內嵌資料。也就是說就算 QEMU 真的有掛感測器,現在的 `fetchAll()` 也可能讀不到,
  因為沒有多打一次 GET 展開那個子資源。**還沒用真 BMC 驗證**,下次連得上時看一下
  `/redfish/v1/Chassis/chassis` 的原始回應長什麼樣,如果確認是連結,要把
  `fetchAll()` 改成對每個 chassis 多抓 `/Thermal`、`/Power`。
- **Power Action 可能回 503**:`evb-ast2600` 這個 QEMU machine type 通常只模擬
  BMC 本身,沒有模擬 host CPU,所以 `xyz.openbmc_project.State.Host` 這類物件可能
  沒有正常工作,打 `ComputerSystem.Reset` 可能收到
  `503 The service is temporarily unavailable`。排查方式:SSH 進 BMC 用
  `busctl introspect xyz.openbmc_project.Logging /xyz/openbmc_project/logging`、
  `journalctl -u bmcweb` 看實際的 D-Bus 錯誤。
- **登出導頁**(已修):`auth.logout()` 只清 store 狀態不會觸發路由守衛,原本會
  導致登出後畫面卡在原頁面內容、側欄消失但頁面沒換。已在 `NavSidebar.vue` 加
  `router.push({name:'login'})` 修掉,之後新增登出入口時要記得一起處理。

## 之後可以繼續練的方向

- 修 Thermal/Power 的展開邏輯(見上)。
- 深入聊 D-Bus ↔ Redfish 的對應關係:bmcweb 怎麼把 D-Bus 物件轉成 Redfish 資源,
  這是常見的架構面試題,目前還沒深入討論過。
- 研究在 OpenBMC 裡加模擬感測器(dbus-sensors 的 emulator),讓真實環境的
  Sensors 頁也有數字跑,而不只是靠 Demo 模式假資料。
