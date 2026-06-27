import type { Context } from 'hono'
import { deleteFile, uploadBuffer } from '../lib/cloudinary.js'
import {
  createDokumen,
  deleteDokumen,
  findAktivitasExists,
  listDokumenByAktivitas,
} from '../models/dokumenModel.js'

export async function uploadDokumen(c: Context) {
  const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    const aktivitasId = formData.get('aktivitas_id') as string | null

    if (!file || !aktivitasId) return c.json({ error: 'file dan aktivitas_id wajib diisi' }, 400)

    if (file.size > MAX_SIZE) {
      return c.json({ error: `Ukuran file terlalu besar. Maksimal 50MB, ukuran file Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB` }, 413)
    }

    const id = parseInt(aktivitasId)
    if (isNaN(id)) return c.json({ error: 'aktivitas_id tidak valid' }, 400)

    const exists = await findAktivitasExists(id)
    if (!exists.length) return c.json({ error: 'Aktivitas tidak ditemukan' }, 404)

    const buffer = Buffer.from(await file.arrayBuffer())
    const { url, public_id } = await uploadBuffer(buffer, file.name)
    const rows = await createDokumen(id, file.name, url, public_id)
    return c.json({ data: rows[0] }, 201)
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Failed to upload dokumen' }, 500)
  }
}

export async function getDokumen(c: Context) {
  const aktivitasId = c.req.query('aktivitas_id')
  if (!aktivitasId) return c.json({ error: 'aktivitas_id required' }, 400)
  try {
    const rows = await listDokumenByAktivitas(parseInt(aktivitasId))
    return c.json({ data: rows })
  } catch (_e) {
    return c.json({ error: 'Failed to fetch dokumen' }, 500)
  }
}

export async function removeDokumen(c: Context) {
  const id = parseInt(c.req.param('id') ?? '')
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)
  try {
    const rows = await deleteDokumen(id)
    if (!rows.length) return c.json({ error: 'Dokumen not found' }, 404)
    await deleteFile(rows[0].public_id)
    return c.json({ message: 'Dokumen deleted' })
  } catch (_e) {
    return c.json({ error: 'Failed to delete dokumen' }, 500)
  }
}
