import { query } from '../db/client.js'

export function listAktivitas(filters: {
  userId?: number
  status?: string
  jenis?: string
}) {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters.userId) {
    params.push(filters.userId)
    conditions.push(`a.user_id = $${params.length}`)
  }
  if (filters.status) {
    params.push(filters.status)
    conditions.push(`a.status = $${params.length}::aktivitas_status`)
  }
  if (filters.jenis) {
    params.push(filters.jenis)
    conditions.push(`a.jenis = $${params.length}::jenis_tridharma`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  return query(
    `SELECT a.*, u.nama AS dosen_nama,
            COALESCE(
              json_agg(d.*) FILTER (WHERE d.id IS NOT NULL), '[]'
            ) AS dokumen
     FROM aktivitas a
     JOIN users u ON u.id = a.user_id
     LEFT JOIN dokumen d ON d.aktivitas_id = a.id
     ${where}
     GROUP BY a.id, u.nama
     ORDER BY a.created_at DESC`,
    params
  )
}

export function findAktivitasById(id: number) {
  return query(
    `SELECT a.*, u.nama AS dosen_nama FROM aktivitas a
     JOIN users u ON u.id = a.user_id WHERE a.id = $1`,
    [id]
  )
}

export function listDokumenByAktivitasId(id: number) {
  return query(`SELECT * FROM dokumen WHERE aktivitas_id = $1`, [id])
}

export function listVerifikasiByAktivitasId(id: number) {
  return query(
    `SELECT v.*, u.nama AS reviewer_nama FROM verifikasi v
     JOIN users u ON u.id = v.reviewer_id WHERE v.aktivitas_id = $1
     ORDER BY v.verified_at DESC`,
    [id]
  )
}

export function insertAktivitas(payload: {
  user_id: number
  jenis: string
  judul: string
  deskripsi?: string
  tanggal: string
  skor_raw?: number
}) {
  return query(
    `INSERT INTO aktivitas (user_id, jenis, judul, deskripsi, tanggal, skor_raw, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'draft') RETURNING *`,
    [
      payload.user_id,
      payload.jenis,
      payload.judul,
      payload.deskripsi ?? null,
      payload.tanggal,
      payload.skor_raw ?? 0,
    ]
  )
}

export function updateAktivitas(
  id: number,
  body: {
    judul?: string
    deskripsi?: string
    tanggal?: string
    skor_raw?: number
    status?: string
  }
) {
  return query(
    `UPDATE aktivitas SET
      judul      = COALESCE($1, judul),
      deskripsi  = COALESCE($2, deskripsi),
      tanggal    = COALESCE($3, tanggal),
      skor_raw   = COALESCE($4, skor_raw),
      status     = COALESCE($5::aktivitas_status, status)
     WHERE id = $6 RETURNING *`,
    [
      body.judul ?? null,
      body.deskripsi ?? null,
      body.tanggal ?? null,
      body.skor_raw ?? null,
      body.status ?? null,
      id,
    ]
  )
}

export function removeAktivitas(id: number) {
  return query(`DELETE FROM aktivitas WHERE id = $1 RETURNING id`, [id])
}

export function submitAktivitas(id: number) {
  return query(
    `UPDATE aktivitas SET status = 'pending'
     WHERE id = $1 AND status = 'draft' RETURNING *`,
    [id]
  )
}
