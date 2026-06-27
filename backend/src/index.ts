import 'dotenv/config'
import auth from './routes/auth.js'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { serve, getRequestListener } from '@hono/node-server'
import { authMiddleware } from './middleware/auth.js'

import users      from './routes/users.js'
import aktivitas  from './routes/aktivitas.js'
import dokumen    from './routes/dokumen.js'
import verifikasi from './routes/verifikasi.js'
import rekap      from './routes/rekap.js'

const app = new Hono()

// ── Security headers (Fix 4) ────────────────────────────────────────────────
app.use('*', secureHeaders())

// ── Logging ─────────────────────────────────────────────────────────────────
app.use('*', logger())

// ── CORS — explicit whitelist only, no wildcard (Fix 7) ─────────────────────
app.use('*', cors({
  origin: (origin) => {
    const allowed = ['http://localhost:5173', 'https://bkds.app', 'https://www.bkds.app']
    return allowed.includes(origin) ? origin : null
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  credentials: true,
  maxAge: 600,
}))

// ── Health check (public) ────────────────────────────────────────────────────
app.get('/', (c) => c.json({ status: 'ok', service: 'BKD Online API', version: '1.0.0' }))

// ── Public auth routes (no JWT required) ────────────────────────────────────
// POST /api/auth/login and POST /api/auth/register are intentionally public.
// GET /api/auth/me is mounted here but has its own inline token check (kept for compatibility).
app.route('/api/auth', auth)

// ── Auth middleware applied to ALL routes below this line ────────────────────
app.use('/api/*', authMiddleware)

// ── Protected routes ─────────────────────────────────────────────────────────
app.route('/api/users',      users)
app.route('/api/aktivitas',  aktivitas)
app.route('/api/dokumen',    dokumen)
app.route('/api/verifikasi', verifikasi)
app.route('/api/rekap',      rekap)

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Route not found' }, 404))

// ── Error handler ─────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

// ── Start the server ──────────────────────────────────────────────────────────
const port = parseInt(process.env.PORT ?? '3001')
console.log(`🚀 BKD Online API running on port ${port}`)
serve({ fetch: app.fetch, port })

// For Vercel fallback
export default getRequestListener(app.fetch)
