import type { Context } from 'hono'
import {
  getAktivitasStatus,
  insertVerifikasi,
  listVerifikasiByStatus,
  listVerifikasiHistory,
  updateAktivitasStatus,
} from '../models/verifikasiModel.js'

export async function getVerifikasiList(c: Context) {
  try {
    const status = c.req.query('status') ?? 'pending'
    const rows = await listVerifikasiByStatus(status)
    return c.json({ data: rows })
  } catch (_e) {
    return c.json({ error: 'Failed to fetch verifikasi list' }, 500)
  }
}

export async function getVerifikasiHistory(c: Context) {
  const id = parseInt(c.req.param('aktivitas_id') ?? '')
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)
  try {
    const rows = await listVerifikasiHistory(id)
    return c.json({ data: rows })
  } catch (_e) {
    return c.json({ error: 'Failed to fetch verifikasi history' }, 500)
  }
}

export async function processVerifikasi(c: Context) {
  const aktivitasId = parseInt(c.req.param('aktivitas_id') ?? '')
  if (isNaN(aktivitasId)) return c.json({ error: 'Invalid ID' }, 400)
  try {
    const body = await c.req.json<{
      reviewer_id: number
      status: 'approved' | 'rejected'
      catatan?: string
    }>()
    const { reviewer_id, status, catatan } = body

    if (!reviewer_id || !status) {
      return c.json({ error: 'reviewer_id dan status wajib diisi' }, 400)
    }
    if (!['approved', 'rejected'].includes(status)) {
      return c.json({ error: 'status harus approved atau rejected' }, 400)
    }

    const act = await getAktivitasStatus(aktivitasId)
    if (!act.length) return c.json({ error: 'Aktivitas tidak ditemukan' }, 404)
    if (act[0].status !== 'pending') {
      return c.json({ error: 'Aktivitas harus dalam status pending untuk diverifikasi' }, 400)
    }

    const verRow = await insertVerifikasi({
      aktivitasId,
      reviewerId: reviewer_id,
      status,
      catatan,
    })
    await updateAktivitasStatus(aktivitasId, status)
    return c.json({ data: verRow[0] }, 201)
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Failed to process verifikasi' }, 500)
  }
}
