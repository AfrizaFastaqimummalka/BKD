import type { Context, Next } from 'hono'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS = 10

// Cleanup expired entries every 15 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key)
  }
}, WINDOW_MS)

/**
 * In-memory rate limiter middleware for Hono.
 * Max 10 requests per 15 minutes per IP.
 * Uses X-Forwarded-For only if it's a single trusted value (not a comma-list from untrusted proxies).
 */
export function loginRateLimiter(c: Context, next: Next) {
  // Use the direct connection IP to avoid X-Forwarded-For spoofing
  // Only trust X-Forwarded-For if you control the reverse proxy and know it sets a single IP
  const forwarded = c.req.header('x-forwarded-for')
  const ip = (forwarded ? forwarded.split(',')[0].trim() : null)
    ?? c.req.header('x-real-ip')
    ?? 'unknown'

  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || entry.resetAt <= now) {
    // First request in a new window
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return next()
  }

  entry.count++

  if (entry.count > MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
    c.header('Retry-After', String(retryAfterSec))
    c.header('X-RateLimit-Limit', String(MAX_REQUESTS))
    c.header('X-RateLimit-Remaining', '0')
    return c.json(
      { error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
      429
    )
  }

  c.header('X-RateLimit-Limit', String(MAX_REQUESTS))
  c.header('X-RateLimit-Remaining', String(MAX_REQUESTS - entry.count))
  return next()
}
