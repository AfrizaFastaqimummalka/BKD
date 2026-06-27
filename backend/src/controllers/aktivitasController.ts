import type { Context } from 'hono'
import type { JwtPayload } from '../middleware/auth.js'
import {
  findAktivitasById,
  insertAktivitas,
  listAktivitas,
  listDokumenByAktivitasId,
  listVerifikasiByAktivitasId,
  removeAktivitas,
  submitAktivitas,
  updateAktivitas,
} from '../models/aktivitasModel.js'

/** Roles that can access any user's data (not just their own) */
const PRIVILEGED_ROLES = ['admin', 'reviewer']

export async function getAktivitas(c: Context) {
  try {
    const actor = c.get('jwtUser') as JwtPayload
    const statusQ = c.req.query('status')
    const jenisQ = c.req.query('jenis')

    let userId: number | undefined

    if (PRIVILEGED_ROLES.includes(actor.role)) {
      // Admin/reviewer: allow filtering by any user_id query param
      const userIdQ = c.req.query('user_id')
      userId = userIdQ ? parseInt(userIdQ) : undefined
    } else {
      // Dosen: can ONLY see their own aktivitas — ignore user_id query param
      userId = actor.id
    }

    const rows = await listAktivitas({
      userId,
      status: statusQ ?? undefined,
      jenis: jenisQ ?? undefined,
    })

    return c.json({ data: rows })
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Failed to fetch aktivitas' }, 500)
  }
}

export async function getAktivitasById(c: Context) {
  const id = parseInt(c.req.param('id') ?? '')
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  try {
    const rows = await findAktivitasById(id)
    if (!rows.length) return c.json({ error: 'Aktivitas not found' }, 404)

    const actor = c.get('jwtUser') as JwtPayload
    const record = rows[0] as Record<string, unknown>

    // IDOR check: dosen can only view their own record
    if (!PRIVILEGED_ROLES.includes(actor.role) && record.user_id !== actor.id) {
      return c.json({ error: 'Forbidden: bukan milik Anda' }, 403)
    }

    const dok = await listDokumenByAktivitasId(id)
    const ver = await listVerifikasiByAktivitasId(id)
    return c.json({ data: { ...record, dokumen: dok, verifikasi_history: ver } })
  } catch (_e) {
    return c.json({ error: 'Failed to fetch aktivitas' }, 500)
  }
}

export async function createAktivitas(c: Context) {
  try {
    const actor = c.get('jwtUser') as JwtPayload
    const body = await c.req.json<{
      user_id?: number
      jenis: string
      judul: string
      deskripsi?: string
      tanggal: string
      skor_raw?: number
    }>()

    const { jenis, judul, tanggal } = body
    if (!jenis || !judul || !tanggal) {
      return c.json({ error: 'jenis, judul, tanggal wajib diisi' }, 400)
    }
    if (!['pendidikan', 'penelitian', 'pengabdian'].includes(jenis)) {
      return c.json({ error: 'jenis tidak valid' }, 400)
    }

    // Force user_id from JWT — dosen cannot create aktivitas on behalf of others
    const user_id = PRIVILEGED_ROLES.includes(actor.role) && body.user_id
      ? body.user_id
      : actor.id

    const rows = await insertAktivitas({ ...body, user_id })
    return c.json({ data: rows[0] }, 201)
  } catch (_e) {
    return c.json({ error: 'Failed to create aktivitas' }, 500)
  }
}

export async function editAktivitas(c: Context) {
  const id = parseInt(c.req.param('id') ?? '')
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  try {
    const actor = c.get('jwtUser') as JwtPayload

    // Fetch record first to check ownership
    const existing = await findAktivitasById(id)
    if (!existing.length) return c.json({ error: 'Aktivitas not found' }, 404)
    const record = existing[0] as Record<string, unknown>

    // IDOR check
    if (!PRIVILEGED_ROLES.includes(actor.role) && record.user_id !== actor.id) {
      return c.json({ error: 'Forbidden: bukan milik Anda' }, 403)
    }

    const body = await c.req.json<{
      judul?: string
      deskripsi?: string
      tanggal?: string
      skor_raw?: number
      status?: string
    }>()

    if (body.status && !['draft', 'pending', 'approved', 'rejected'].includes(body.status)) {
      return c.json({ error: 'Status tidak valid' }, 400)
    }

    const rows = await updateAktivitas(id, body)
    if (!rows.length) return c.json({ error: 'Aktivitas not found' }, 404)
    return c.json({ data: rows[0] })
  } catch (_e) {
    return c.json({ error: 'Failed to update aktivitas' }, 500)
  }
}

export async function deleteAktivitas(c: Context) {
  const id = parseInt(c.req.param('id') ?? '')
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  try {
    const actor = c.get('jwtUser') as JwtPayload

    // Fetch record first to check ownership
    const existing = await findAktivitasById(id)
    if (!existing.length) return c.json({ error: 'Aktivitas not found' }, 404)
    const record = existing[0] as Record<string, unknown>

    // IDOR check
    if (!PRIVILEGED_ROLES.includes(actor.role) && record.user_id !== actor.id) {
      return c.json({ error: 'Forbidden: bukan milik Anda' }, 403)
    }

    const rows = await removeAktivitas(id)
    if (!rows.length) return c.json({ error: 'Aktivitas not found' }, 404)
    return c.json({ message: 'Aktivitas deleted' })
  } catch (_e) {
    return c.json({ error: 'Failed to delete aktivitas' }, 500)
  }
}

export async function submitAktivitasDraft(c: Context) {
  const id = parseInt(c.req.param('id') ?? '')
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  try {
    const actor = c.get('jwtUser') as JwtPayload

    // Fetch record first to check ownership
    const existing = await findAktivitasById(id)
    if (!existing.length) return c.json({ error: 'Aktivitas not found' }, 400)
    const record = existing[0] as Record<string, unknown>

    // IDOR check
    if (!PRIVILEGED_ROLES.includes(actor.role) && record.user_id !== actor.id) {
      return c.json({ error: 'Forbidden: bukan milik Anda' }, 403)
    }

    const rows = await submitAktivitas(id)
    if (!rows.length) return c.json({ error: 'Aktivitas not found or not in draft status' }, 400)
    return c.json({ data: rows[0] })
  } catch (_e) {
    return c.json({ error: 'Failed to submit aktivitas' }, 500)
  }
}
