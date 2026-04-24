import { query } from '../db/client.js'

export function listVerifikasiByStatus(status: string) {
  return query(
    `SELECT a.*, u.nama AS dosen_nama,
            COALESCE(json_agg(d.*) FILTER (WHERE d.id IS NOT NULL), '[]') AS dokumen
     FROM aktivitas a
     JOIN users u ON u.id = a.user_id
     LEFT JOIN dokumen d ON d.aktivitas_id = a.id
     WHERE a.status = $1::aktivitas_status
     GROUP BY a.id, u.nama
     ORDER BY a.updated_at ASC`,
    [status]
  )
}

export function listVerifikasiHistory(aktivitasId: number) {
  return query(
    `SELECT v.*, u.nama AS reviewer_nama, u.email AS reviewer_email
     FROM verifikasi v
     JOIN users u ON u.id = v.reviewer_id
     WHERE v.aktivitas_id = $1
     ORDER BY v.verified_at DESC`,
    [aktivitasId]
  )
}

export function getAktivitasStatus(aktivitasId: number) {
  return query<{ status: string }>(
    `SELECT status FROM aktivitas WHERE id = $1`,
    [aktivitasId]
  )
}

export function insertVerifikasi(payload: {
  aktivitasId: number
  reviewerId: number
  status: 'approved' | 'rejected'
  catatan?: string
}) {
  return query(
    `INSERT INTO verifikasi (aktivitas_id, reviewer_id, status, catatan)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [payload.aktivitasId, payload.reviewerId, payload.status, payload.catatan ?? null]
  )
}

export function updateAktivitasStatus(aktivitasId: number, status: 'approved' | 'rejected') {
  return query(
    `UPDATE aktivitas SET status = $1::aktivitas_status WHERE id = $2`,
    [status, aktivitasId]
  )
}
