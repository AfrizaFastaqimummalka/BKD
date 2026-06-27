import type { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'

export type JwtPayload = {
  id: number
  role: string
}

/**
 * Auth middleware — validates Bearer JWT with algorithm strictly locked to HS256.
 * Sets c.set('jwtUser', payload) so downstream handlers can read the authenticated user.
 * Rejects: missing token, invalid signature, expired token, alg:none, any non-HS256 alg.
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: token tidak ditemukan' }, 401)
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return c.json({ error: 'Unauthorized: token tidak ditemukan' }, 401)
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'], // Explicitly whitelist — rejects alg:none and any other alg
    }) as JwtPayload

    c.set('jwtUser', decoded)
    await next()
  } catch (_err) {
    return c.json({ error: 'Unauthorized: token tidak valid atau kadaluarsa' }, 401)
  }
}
