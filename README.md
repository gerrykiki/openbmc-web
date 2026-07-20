# bmc-web

用 Vue 3 + Vue Router + Pinia 做的 OpenBMC Redfish 前端練習專案,
接你在 WSL2 裡跑的 `evb-ast2600` QEMU 模擬環境(透過 ngrok 對外)。

## 架構

```
瀏覽器(這個 Vue App)
  → 呼叫同源的 /redfish/...
    → Vite dev server(Node.js,伺服器對伺服器,不會有 CORS 問題)
      → 你的 ngrok 網址
        → Windows → WSL2 → QEMU → BMC (bmcweb, port 443)
```

之所以透過 Vite 的 dev proxy 轉發,而不是讓瀏覽器直接打 ngrok 網址,
是為了避開瀏覽器端的 CORS 限制 —— proxy 這段是 Node.js 在背後幫你轉發,
瀏覽器全程只看到自己這個 origin。

## 第一次使用

```bash
npm install
```

打開 `.env`,把 `VITE_API_TARGET` 換成你**目前** ngrok 顯示的網址
(每次重開 ngrok 網址都會變,記得同步更新):

```
VITE_API_TARGET=https://xxxx-xxxx.ngrok-free.app
```

啟動開發伺服器:

```bash
npm run dev
```

打開瀏覽器 `http://localhost:5173`,用 BMC 帳密登入(預設 `root` / `0penBmc`)。

## 專案結構

```
src/
  services/redfish.js   所有 Redfish HTTP 呼叫的封裝(login / get / ping)
  stores/auth.js        Pinia store:管理 session token、登入登出
  stores/bmc.js         Pinia store:抓 Systems / Chassis / Managers,並把
                        Thermal/Power 資料攤平成 sensorSummary()
  router/index.js       路由設定 + 登入守衛(未登入會被導去 /login)
  views/
    LoginView.vue        登入頁
    DashboardView.vue    總覽:連線狀態、資源數量、警示數
    SystemsView.vue      /redfish/v1/Systems 詳細資料
    ChassisView.vue      /redfish/v1/Chassis 詳細資料
    SensorsView.vue      感測器列表(溫度 / 風扇 / 電壓)
  components/
    NavSidebar.vue        側邊導覽
    StatusLed.vue         狀態指示燈(OK/Warning/Critical)
    PageHeader.vue        共用頁首
```

## 已知限制 / 之後可以練習加強的方向

- QEMU 模擬環境沒有接實體感測器,`Sensors` 頁通常會是空的,這是正常現象,
  之後可以研究怎麼在 OpenBMC 裡加模擬感測器(dbus-sensors 的 emulator)。
- 目前只做 GET 讀取,沒有做「送電源開關指令」這種 POST/PATCH 操作,
  可以練習加一個「Power On/Off」按鈕打
  `POST /redfish/v1/Systems/{id}/Actions/ComputerSystem.Reset`。
- Session token 存在 `sessionStorage`,分頁關閉就會登出,是刻意的簡化。
- ngrok 免費版網址每次重啟會換,面試展示前記得重新開好、更新 `.env`、
  重啟 `npm run dev`。
