import 'dotenv/config'
import auth from './routes/auth.js'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'

import users      from './routes/users.js'
import aktivitas  from './routes/aktivitas.js'
import dokumen    from './routes/dokumen.js'
import verifikasi from './routes/verifikasi.js'
import rekap      from './routes/rekap.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://mybkd.vercel.app'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'BKD Online API', version: '1.0.0' }))

// Routes
app.route('/api/users',      users)
app.route('/api/aktivitas',  aktivitas)
app.route('/api/dokumen',    dokumen)
app.route('/api/verifikasi', verifikasi)
app.route('/api/rekap',      rekap)
app.route('/api/auth', auth)

// 404 fallback
app.notFound((c) => c.json({ error: 'Route not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

import { handle } from '@hono/node-server/vercel'

// Start server (local dev)
if (process.env.NODE_ENV !== 'production') {
  const port = parseInt(process.env.PORT ?? '3001')
  console.log(`🚀 BKD Online API running on http://localhost:${port}`)
  serve({ fetch: app.fetch, port })
}

export default handle(app)
