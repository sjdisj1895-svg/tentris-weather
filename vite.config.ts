import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// 개발 서버에서도 배포 환경(Vercel)과 같은 /api/gear-lookup 를 쓰도록 연결합니다.
// .env 의 GNU_RAG_* 값은 서버 쪽에서만 읽고, 브라우저 코드에는 포함되지 않습니다.
function gearLookupDev(env: Record<string, string>): Plugin {
  return {
    name: 'gear-lookup-dev',
    configureServer(server) {
      server.middlewares.use('/api/gear-lookup', (req, res) => {
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk
          if (raw.length > 4096) req.destroy()
        })
        req.on('end', async () => {
          let body: unknown
          try {
            body = JSON.parse(raw)
          } catch {
            body = undefined
          }
          try {
            const mod = await server.ssrLoadModule('/api/gear-lookup.ts')
            const ip = req.socket.remoteAddress ?? 'local'
            const out = await mod.handleRequest(req.method ?? 'GET', ip, body, env)
            res.statusCode = out.status
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(out.body))
          } catch (e) {
            console.error('[gear-lookup dev]', e)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: '개발 서버에서 AI 검색을 처리하지 못했어요.' }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), gearLookupDev(env)],
    server: {
      port: 5173,
      open: true,
    },
  }
})
