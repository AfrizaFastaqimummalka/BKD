import { query } from '../db/client.js'

export function listRekap(userId?: number) {
  if (userId) {
    return query(
      `SELECT r.*, u.nama AS dosen_nama FROM rekap_skor r
       JOIN users u ON u.id = r.user_id
       WHERE r.user_id = $1 ORDER BY r.periode DESC`,
      [userId]
    )
  }

  return query(
    `SELECT r.*, u.nama AS dosen_nama FROM rekap_skor r
     JOIN users u ON u.id = r.user_id
     ORDER BY r.periode DESC, u.nama`
  )
}

export function findRekapByUserAndPeriode(userId: number, periode: string) {
  return query(
    `SELECT r.*, u.nama AS dosen_nama FROM rekap_skor r
     JOIN users u ON u.id = r.user_id
     WHERE r.user_id = $1 AND r.periode = $2`,
    [userId, periode]
  )
}

export function listAllDosenIds() {
  return query<{ id: number }>(`SELECT id FROM users WHERE role = 'dosen'`)
}
