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
    const { email, password } = await c.req.json<{ email: string; password: string }>()
    if (!email || !password) return c.json({ error: 'Email dan password wajib diisi' }, 400)

    const rows = await findUserByEmail(email)
    if (!rows.length) return c.json({ error: 'Email atau password salah' }, 401)

    const user = rows[0]
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return c.json({ error: 'Email atau password salah' }, 401)

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: '1d',
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
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Token tidak ditemukan' }, 401)
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number }
    const rows = await findAuthUserById(decoded.id)
    if (!rows.length) return c.json({ error: 'User tidak ditemukan' }, 404)
    return c.json({ user: rows[0] })
  } catch (_err) {
    return c.json({ error: 'Token tidak valid' }, 401)
  }
}
