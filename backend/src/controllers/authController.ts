import type { Context } from 'hono'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {
  checkExistingEmail,
  createUser,
  findAuthUserById,
  findUserByEmail,
} from '../models/authModel.js'

export async function login(c: Context) {
  try {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Request body harus berupa JSON yang valid' }, 400)
    }

    // Reject non-object bodies and non-string field values (prevents object injection)
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return c.json({ error: 'Format request tidak valid' }, 400)
    }

    const { email, password } = body as Record<string, unknown>

    if (typeof email !== 'string' || typeof password !== 'string') {
      return c.json({ error: 'Email dan password harus berupa string' }, 400)
    }

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      return c.json({ error: 'Email dan password wajib diisi' }, 400)
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return c.json({ error: 'Format email tidak valid' }, 400)
    }

    const rows = await findUserByEmail(trimmedEmail)
    if (!rows.length) return c.json({ error: 'Email atau password salah' }, 401)

    const user = rows[0]
    const isMatch = await bcrypt.compare(trimmedPassword, user.password)
    if (!isMatch) return c.json({ error: 'Email atau password salah' }, 401)

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: '1d',
      algorithm: 'HS256',
    })

    return c.json({
      message: 'Login berhasil',
      token,
      user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
    })
  } catch (err) {
    console.error('Login error:', err)
    return c.json({ error: 'Terjadi kesalahan server' }, 500)
  }
}


export async function register(c: Context) {
  try {
    const { nama, email, password, role } = await c.req.json<{
      nama: string
      email: string
      password: string
      role?: string
    }>()

    if (!nama || !email || !password) {
      return c.json({ error: 'Nama, email, dan password wajib diisi' }, 400)
    }

    const validRole = ['admin', 'dosen', 'reviewer'].includes(role ?? '') ? role : 'dosen'
    const existing = await checkExistingEmail(email)
    if (existing.length) return c.json({ error: 'Email sudah terdaftar' }, 409)

    const hashed = await bcrypt.hash(password, 10)
    const rows = await createUser(nama, email, hashed, validRole!)
    const newUser = rows[0]
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET!, {
      expiresIn: '1d',
    })

    return c.json({ message: 'Registrasi berhasil', token, user: newUser }, 201)
  } catch (err) {
    console.error('Register error:', err)
    return c.json({ error: 'Terjadi kesalahan server' }, 500)
  }
}

export async function me(c: Context) {
  try {
    // jwtUser is set by authMiddleware — no need to re-verify the token here
    const jwtUser = c.get('jwtUser') as { id: number }
    const rows = await findAuthUserById(jwtUser.id)
    if (!rows.length) return c.json({ error: 'User tidak ditemukan' }, 404)
    return c.json({ user: rows[0] })
  } catch (_err) {
    return c.json({ error: 'Token tidak valid' }, 401)
  }
}

