import type { Context } from 'hono'
import { generateRekap } from '../lib/scoring.js'
import { findRekapByUserAndPeriode, listAllDosenIds, listRekap } from '../models/rekapModel.js'

function isValidPeriode(periode: string) {
  return /^\d{4}\/\d{4}-[12]$/.test(periode)
}

export async function getRekap(c: Context) {
  try {
    const userId = c.req.query('user_id')
    const rows = await listRekap(userId ? parseInt(userId) : undefined)
    return c.json({ data: rows })
  } catch (_e) {
    return c.json({ error: 'Failed to fetch rekap' }, 500)
  }
}

export async function getRekapByUserPeriode(c: Context) {
  const userId = parseInt(c.req.param('user_id') ?? '')
  const periode = c.req.param('periode') ?? ''
  if (isNaN(userId)) return c.json({ error: 'Invalid user_id' }, 400)
  try {
    const rows = await findRekapByUserAndPeriode(userId, periode)
    if (!rows.length) return c.json({ error: 'Rekap tidak ditemukan' }, 404)
    return c.json({ data: rows[0] })
  } catch (_e) {
    return c.json({ error: 'Failed to fetch rekap' }, 500)
  }
}

export async function generateSingleRekap(c: Context) {
  try {
    const body = await c.req.json<{ user_id: number; periode: string }>()
    const { user_id, periode } = body
    if (!user_id || !periode) return c.json({ error: 'user_id dan periode wajib diisi' }, 400)
    if (!isValidPeriode(periode)) {
      return c.json({ error: 'Format periode tidak valid. Contoh: 2024/2025-1' }, 400)
    }
    const result = await generateRekap(user_id, periode)
    return c.json({ data: result }, 201)
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Failed to generate rekap' }, 500)
  }
}

export async function generateAllRekap(c: Context) {
  try {
    const body = await c.req.json<{ periode: string }>()
    const { periode } = body
    if (!periode) return c.json({ error: 'periode wajib diisi' }, 400)
    if (!isValidPeriode(periode)) {
      return c.json({ error: 'Format periode tidak valid. Contoh: 2024/2025-1' }, 400)
    }

    const dosens = await listAllDosenIds()
    const results = await Promise.all(dosens.map((d) => generateRekap(d.id, periode)))
    return c.json({ data: results, count: results.length })
  } catch (_e) {
    return c.json({ error: 'Failed to generate rekap for all dosen' }, 500)
  }
}
