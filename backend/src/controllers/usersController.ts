import type { Context } from 'hono'
import bcrypt from 'bcrypt'
import {
  deleteUser,
  findUserById,
  insertUser,
  listUsers,
  updateUser,
} from '../models/usersModel.js'

export async function getUsers(c: Context) {
  try {
    const rows = await listUsers()
    return c.json({ data: rows })
  } catch (_e) {
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
}

export async function getUserById(c: Context) {
  const id = parseInt(c.req.param('id') ?? '')
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)
  try {
    const rows = await findUserById(id)
    if (!rows.length) return c.json({ error: 'User not found' }, 404)
    return c.json({ data: rows[0] })
  } catch (_e) {
    return c.json({ error: 'Failed to fetch user' }, 500)
  }
}

export async function createUser(c: Context) {
  try {
    const body = await c.req.json<{ nama: string; email: string; role: string }>()
    const { nama, email, role } = body
    if (!nama || !email || !role) {
      return c.json({ error: 'nama, email, dan role wajib diisi' }, 400)
    }
    if (!['admin', 'dosen', 'reviewer'].includes(role)) {
      return c.json({ error: 'Role tidak valid' }, 400)
    }

    const defaultPassword = await bcrypt.hash('admin123', 10)
    const rows = await insertUser(nama, email, defaultPassword, role)
    return c.json({ data: rows[0] }, 201)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('unique')) return c.json({ error: 'Email sudah terdaftar' }, 409)
    return c.json({ error: 'Failed to create user' }, 500)
  }
}

export async function editUser(c: Context) {
  const id = parseInt(c.req.param('id') ?? '')
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)
  try {
    const body = await c.req.json<{ nama?: string; email?: string; role?: string }>()
    if (body.role && !['admin', 'dosen', 'reviewer'].includes(body.role)) {
      return c.json({ error: 'Role tidak valid' }, 400)
    }

    const rows = await updateUser(id, body.nama ?? null, body.email ?? null, body.role ?? null)
    if (!rows.length) return c.json({ error: 'User not found' }, 404)
    return c.json({ data: rows[0] })
  } catch (_e) {
    return c.json({ error: 'Failed to update user' }, 500)
  }
}

export async function removeUser(c: Context) {
  const id = parseInt(c.req.param('id') ?? '')
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)
  try {
    const rows = await deleteUser(id)
    if (!rows.length) return c.json({ error: 'User not found' }, 404)
    return c.json({ message: 'User deleted' })
  } catch (_e) {
    return c.json({ error: 'Failed to delete user' }, 500)
  }
}
