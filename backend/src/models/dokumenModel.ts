import { query } from '../db/client.js'

export function findAktivitasExists(id: number) {
  return query(`SELECT id FROM aktivitas WHERE id = $1`, [id])
}

export function createDokumen(
  aktivitasId: number,
  namaFile: string,
  url: string,
  publicId: string
) {
  return query(
    `INSERT INTO dokumen (aktivitas_id, nama_file, url_cloudinary, public_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [aktivitasId, namaFile, url, publicId]
  )
}

export function listDokumenByAktivitas(aktivitasId: number) {
  return query(
    `SELECT * FROM dokumen WHERE aktivitas_id = $1 ORDER BY created_at`,
    [aktivitasId]
  )
}

export function deleteDokumen(id: number) {
  return query<{ public_id: string }>(
    `DELETE FROM dokumen WHERE id = $1 RETURNING public_id`,
    [id]
  )
}
