import { query } from '../db/client.js'

export async function generateRekap(userId: number, periode: string) {
  // Sum approved aktivitas skor per jenis for the given user and periode
  // Periode format: "2024/2025-1" — we match by year in tanggal
  const [periodeYear, semester] = periode.split('-')
  const [tahunMulai, tahunAkhir] = periodeYear.split('/')
  const semesterNum = parseInt(semester ?? '1')

  // Semester 1 = Aug-Jan, Semester 2 = Feb-Jul
  const dateFilter =
    semesterNum === 1
      ? `tanggal BETWEEN '${tahunMulai}-08-01' AND '${tahunAkhir}-01-31'`
      : `tanggal BETWEEN '${tahunAkhir}-02-01' AND '${tahunAkhir}-07-31'`

  const rows = await query<{ jenis: string; total: string }>(
    `SELECT jenis, COALESCE(SUM(skor_raw), 0) AS total
     FROM aktivitas
     WHERE user_id = $1
       AND status = 'approved'
       AND ${dateFilter}
     GROUP BY jenis`,
    [userId]
  )

  const totals = { pendidikan: 0, penelitian: 0, pengabdian: 0 }
  for (const r of rows) {
    if (r.jenis === 'pendidikan')  totals.pendidikan  = parseFloat(r.total)
    if (r.jenis === 'penelitian')  totals.penelitian  = parseFloat(r.total)
    if (r.jenis === 'pengabdian')  totals.pengabdian  = parseFloat(r.total)
  }

  // Upsert rekap_skor
  const result = await query(
    `INSERT INTO rekap_skor (user_id, periode, total_pendidikan, total_penelitian, total_pengabdian)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, periode) DO UPDATE SET
       total_pendidikan = EXCLUDED.total_pendidikan,
       total_penelitian = EXCLUDED.total_penelitian,
       total_pengabdian = EXCLUDED.total_pengabdian,
       generated_at     = NOW()
     RETURNING *`,
    [userId, periode, totals.pendidikan, totals.penelitian, totals.pengabdian]
  )

  return result[0]
}
