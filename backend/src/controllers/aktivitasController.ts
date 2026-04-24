import type { Context } from 'hono'
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

export async function getAktivitas(c: Context) {
  try {
    const userId = c.req.query('user_id')
    const status = c.req.query('status')
    const jenis = c.req.query('jenis')

    const rows = await listAktivitas({
      userId: userId ? parseInt(userId) : undefined,
      status: status ?? undefined,
      jenis: jenis ?? undefined,
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

    const dok = await listDokumenByAktivitasId(id)
    const ver = await listVerifikasiByAktivitasId(id)
    return c.json({ data: { ...rows[0], dokumen: dok, verifikasi_history: ver } })
  } catch (_e) {
    return c.json({ error: 'Failed to fetch aktivitas' }, 500)
  }
}

export async function createAktivitas(c: Context) {
  try {
    const body = await c.req.json<{
      user_id: number
      jenis: string
      judul: string
      deskripsi?: string
      tanggal: string
      skor_raw: number
    }>()

    const { user_id, jenis, judul, tanggal } = body
    if (!user_id || !jenis || !judul || !tanggal) {
      return c.json({ error: 'user_id, jenis, judul, tanggal wajib diisi' }, 400)
    }
    if (!['pendidikan', 'penelitian', 'pengabdian'].includes(jenis)) {
      return c.json({ error: 'jenis tidak valid' }, 400)
    }

    const rows = await insertAktivitas(body)
    return c.json({ data: rows[0] }, 201)
  } catch (_e) {
    return c.json({ error: 'Failed to create aktivitas' }, 500)
  }
}

export async function editAktivitas(c: Context) {
  const id = parseInt(c.req.param('id') ?? '')
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  try {
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
    const rows = await submitAktivitas(id)
    if (!rows.length) return c.json({ error: 'Aktivitas not found or not in draft status' }, 400)
    return c.json({ data: rows[0] })
  } catch (_e) {
    return c.json({ error: 'Failed to submit aktivitas' }, 500)
  }
}
