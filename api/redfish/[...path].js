// Vercel Serverless Function:正式站版本的「Vite proxy」。
// 瀏覽器打 /redfish/...(同源,見 vercel.json 的 rewrites),由這支
// function 在伺服器端轉發到 API_TARGET(目前的 ngrok 網址),繞開瀏覽器的
// CORS 檢查 —— server-to-server 之間沒有同源政策這回事。
//
// API_TARGET 要設在 Vercel 專案的 Environment Variables(不能加 VITE_
// 前綴,否則會被 Vite 打包進前端 bundle,讓瀏覽器直接看到這個網址)。
// ngrok 網址換掉時,更新這個變數後要重新 deploy 才會生效。

export default async function handler(req, res) {
  const target = process.env.API_TARGET
  if (!target) {
    res.status(500).json({
      error: { message: '尚未設定 API_TARGET 環境變數(Vercel 專案設定裡加一個)' },
    })
    return
  }

  const segments = Array.isArray(req.query.path) ? req.query.path : []
  const restPath = segments.join('/')
  const queryIndex = req.url.indexOf('?')
  const qs = queryIndex >= 0 ? req.url.slice(queryIndex) : ''
  const url = `${target.replace(/\/$/, '')}/redfish/${restPath}${qs}`

  const forwardHeaders = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (['host', 'connection', 'content-length'].includes(key)) continue
    forwardHeaders[key] = value
  }

  const init = { method: req.method, headers: forwardHeaders }
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  }

  let upstream
  try {
    upstream = await fetch(url, init)
  } catch (err) {
    res.status(502).json({
      error: { message: `打不到後端(ngrok/WSL2/QEMU 可能沒開):${err.message}` },
    })
    return
  }

  res.status(upstream.status)
  upstream.headers.forEach((value, key) => {
    if (['content-encoding', 'transfer-encoding', 'connection'].includes(key)) return
    res.setHeader(key, value)
  })

  const text = await upstream.text()
  res.send(text)
}
