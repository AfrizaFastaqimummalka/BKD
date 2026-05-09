import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Download, BookOpen } from 'lucide-react'
import { rekapApi, usersApi, type RekapSkor, type User } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { PageLoader, EmptyState, ErrorMessage } from '../components/UI'
import Modal from '../components/Modal'
import { formatScore } from '../lib/utils'

const PERIODE_OPTIONS = [
  { value: '2025/2026-1', label: 'Ganjil 2025/2026' },
  { value: '2025/2026-2', label: 'Genap 2025/2026' },
  { value: '2024/2025-1', label: 'Ganjil 2024/2025' },
  { value: '2024/2025-2', label: 'Genap 2024/2025' },
  { value: '2023/2024-1', label: 'Ganjil 2023/2024' },
  { value: '2023/2024-2', label: 'Genap 2023/2024' },
]

export default function RekapPage() {
  const { user: currentUser } = useAuth()
  if (!currentUser) return null
  const [items, setItems]   = useState<RekapSkor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [modal, setModal]     = useState(false)
  const [users, setUsers]     = useState<User[]>([])
  const [genUserId, setGenUserId]     = useState('')
  const [genPeriode, setGenPeriode]   = useState(PERIODE_OPTIONS[0].value)
  const [generating, setGenerating]   = useState(false)
  const [genError, setGenError]       = useState('')

  const isAdmin = currentUser.role === 'admin'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const userId = !isAdmin ? currentUser.id : undefined
      const data = await rekapApi.list(userId)
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat rekap')
    } finally {
      setLoading(false)
    }
  }, [currentUser, isAdmin])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (isAdmin && modal) {
      usersApi.list().then(u => setUsers(u.filter(x => x.role === 'dosen')))
    }
  }, [isAdmin, modal])

  const handleGenerate = async () => {
    if (!genPeriode) { setGenError('Periode wajib dipilih'); return }
    if (isAdmin && !genUserId) { setGenError('Pilih dosen terlebih dahulu'); return }
    setGenerating(true)
    setGenError('')
    try {
      if (isAdmin && genUserId === 'all') {
        await rekapApi.generateAll(genPeriode)
      } else {
        const uid = isAdmin ? parseInt(genUserId) : currentUser.id
        await rekapApi.generate(uid, genPeriode)
      }
      setModal(false)
      await load()
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Gagal generate rekap')
    } finally {
      setGenerating(false)
    }
  }

  // Export rekap as PDF via browser print
  const handleDownloadPDF = (r: RekapSkor, nama: string) => {
    const periodeLabel = PERIODE_OPTIONS.find(p => p.value === r.periode)?.label ?? r.periode
    const tanggal = new Date(r.generated_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

    const minSKS = 12
    const totalNum = parseFloat(String(r.total_skor))
    const statusWarna = totalNum >= minSKS ? '#16a34a' : '#dc2626'
    const statusTeks  = totalNum >= minSKS ? 'MEMENUHI STANDAR BKD' : 'BELUM MEMENUHI STANDAR BKD'
    const pdd = parseFloat(String(r.total_pendidikan))
    const pnl = parseFloat(String(r.total_penelitian))
    const pgb = parseFloat(String(r.total_pengabdian))
    const maxVal = Math.max(pdd, pnl, pgb, 1)

    const barRow = (label: string, val: number, color: string) => {
      const pct = Math.round((val / maxVal) * 100)
      return `
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#475569;width:110px;font-size:13px;">${label}</td>
          <td style="padding:8px 4px;">
            <div style="background:#f1f5f9;border-radius:6px;height:14px;overflow:hidden;">
              <div style="background:${color};height:100%;width:${pct}%;border-radius:6px;"></div>
            </div>
          </td>
          <td style="padding:8px 12px;font-weight:700;color:#1e293b;text-align:right;width:80px;font-size:13px;">${formatScore(val)} SKS</td>
        </tr>`
    }

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Rekap BKD - ${nama}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#fff; color:#1e293b; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display:none; }
    }
    .page { max-width:680px; margin:0 auto; padding:48px 40px; }
    .header { display:flex; align-items:center; justify-content:space-between; padding-bottom:20px; border-bottom:2px solid #3366ff; margin-bottom:28px; }
    .logo { display:flex; align-items:center; gap:12px; }
    .logo-box { width:44px; height:44px; color:#1a44f5; display:flex; align-items:center; justify-content:center; }
    .logo-box svg { width:44px; height:44px; }
    .logo-text h1 { font-size:16px; font-weight:700; color:#1e293b; }
    .logo-text p  { font-size:11px; color:#64748b; margin-top:1px; }
    .doc-meta { text-align:right; }
    .doc-meta .doc-title { font-size:11px; color:#64748b; }
    .doc-meta .doc-id { font-size:11px; font-weight:600; color:#3366ff; margin-top:2px; }
    .section-title { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.08em; margin-bottom:10px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:28px; }
    .info-card { background:#f8fafc; border-radius:10px; padding:14px 16px; border:1px solid #e2e8f0; }
    .info-card .lbl { font-size:11px; color:#94a3b8; font-weight:600; margin-bottom:4px; }
    .info-card .val { font-size:14px; font-weight:700; color:#1e293b; }
    .total-box { background:linear-gradient(135deg,#3366ff,#1432e1); border-radius:14px; padding:24px 28px; margin-bottom:28px; color:white; display:flex; align-items:center; justify-content:space-between; }
    .total-box .lbl { font-size:12px; opacity:.8; margin-bottom:4px; }
    .total-box .num { font-size:48px; font-weight:800; line-height:1; }
    .total-box .unit { font-size:14px; opacity:.7; margin-left:6px; }
    .status-badge { padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700; background:rgba(255,255,255,0.2); }
    .breakdown { margin-bottom:28px; }
    .breakdown table { width:100%; border-collapse:collapse; }
    .divider { border:none; border-top:1px solid #e2e8f0; margin:24px 0; }
    .footer { display:flex; justify-content:space-between; align-items:center; padding-top:16px; border-top:1px solid #e2e8f0; }
    .footer p { font-size:11px; color:#94a3b8; }
    .print-btn { position:fixed; bottom:24px; right:24px; background:#3366ff; color:white; border:none; padding:12px 24px; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(51,102,255,.4); }
    .print-btn:hover { background:#1432e1; }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="logo">
      <div class="logo-box">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/>
          <line x1="50" y1="50" x2="50" y2="96" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
          <line x1="50" y1="50" x2="10" y2="27" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
          <line x1="50" y1="50" x2="90" y2="27" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
          <text x="50" y="31" font-size="28" font-weight="800" font-family="sans-serif" fill="currentColor" text-anchor="middle" dominant-baseline="middle">B</text>
          <text x="30" y="66" font-size="28" font-weight="800" font-family="sans-serif" fill="currentColor" text-anchor="middle" dominant-baseline="middle">K</text>
          <text x="70" y="66" font-size="28" font-weight="800" font-family="sans-serif" fill="currentColor" text-anchor="middle" dominant-baseline="middle">D</text>
        </svg>
      </div>
      <div class="logo-text">
        <h1>BKD Online</h1>
        <p>Sistem Monitoring Kinerja Dosen</p>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-title">Dokumen Rekap BKD</div>
      <div class="doc-id">BKD/${r.periode}/${String(r.user_id).padStart(4,'0')}</div>
    </div>
  </div>

  <!-- Info -->
  <div class="section-title">Informasi Dosen</div>
  <div class="info-grid">
    <div class="info-card"><div class="lbl">Nama Dosen</div><div class="val">${nama}</div></div>
    <div class="info-card"><div class="lbl">Periode</div><div class="val">${periodeLabel}</div></div>
    <div class="info-card"><div class="lbl">Tanggal Cetak</div><div class="val">${tanggal}</div></div>
    <div class="info-card"><div class="lbl">Status Minimum BKD</div><div class="val" style="color:${statusWarna};">${totalNum >= minSKS ? '✓' : '✗'} Min. ${minSKS} SKS</div></div>
  </div>

  <!-- Total -->
  <div class="total-box">
    <div>
      <div class="lbl">Total Skor Kinerja</div>
      <div>
        <span class="num">${formatScore(r.total_skor)}</span>
        <span class="unit">SKS</span>
      </div>
    </div>
    <div class="status-badge" style="background:${statusWarna}33;color:white;">${statusTeks}</div>
  </div>

  <!-- Breakdown -->
  <div class="breakdown">
    <div class="section-title">Rincian Per Bidang</div>
    <table>
      ${barRow('Pendidikan', pdd, '#3b82f6')}
      ${barRow('Penelitian', pnl, '#a855f7')}
      ${barRow('Pengabdian', pgb, '#14b8a6')}
    </table>
  </div>

  <hr class="divider"/>

  <!-- Footer -->
  <div class="footer">
    <p>Dicetak dari BKD Online &nbsp;·&nbsp; ${new Date().toLocaleDateString('id-ID')}</p>
    <p style="font-weight:600;color:#3366ff;">bkd-five.vercel.app</p>
  </div>
</div>

<button class="print-btn no-print" onclick="window.print();this.remove()">🖨️ Cetak / Simpan PDF</button>
</body>
</html>`

    const win = window.open('', '_blank')
    if (!win) { alert('Izinkan popup di browser untuk export PDF'); return }
    win.document.write(html)
    win.document.close()
  }

  // Group by dosen for admin view
  const grouped = isAdmin
    ? items.reduce<Record<string, RekapSkor[]>>((acc, r) => {
        const key = r.dosen_nama
        acc[key] = [...(acc[key] ?? []), r]
        return acc
      }, {})
    : { [currentUser.nama]: items }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Rekap Skor</h1>
          <p className="text-sm text-slate-500 mt-1">Rekapitulasi skor kinerja per periode</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <RefreshCw size={15} /> Generate Rekap
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<BookOpen size={24} />}
            title="Belum ada rekap"
            description="Generate rekap skor untuk periode yang diinginkan"
            action={
              <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
                <RefreshCw size={15} /> Generate Rekap
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([nama, rekaps]) => (
            <div key={nama} className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <div className="font-bold text-slate-800">{nama}</div>
              </div>

              {/* Summary cards */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rekaps.map(r => (
                  <div key={r.id} className="border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{r.periode}</div>
                      <button
                        onClick={() => handleDownloadPDF(r, nama)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors"
                        title="Export PDF"
                      >
                        <Download size={13} />
                      </button>
                    </div>

                    {/* Total */}
                    <div className="text-3xl font-bold text-brand-600 mb-3">
                      {formatScore(r.total_skor)}
                      <span className="text-sm font-normal text-slate-400 ml-1">SKS</span>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2">
                      {[
                        { label: 'Pendidikan',  value: r.total_pendidikan,  color: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700' },
                        { label: 'Penelitian',  value: r.total_penelitian,  color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
                        { label: 'Pengabdian',  value: r.total_pengabdian,  color: 'bg-teal-500',   bg: 'bg-teal-50',   text: 'text-teal-700' },
                      ].map(item => {
                        const pct = r.total_skor > 0 ? (item.value / r.total_skor) * 100 : 0
                        return (
                          <div key={item.label}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold ${item.text}`}>{item.label}</span>
                              <span className={`text-xs font-bold ${item.text}`}>{formatScore(item.value)}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.color} rounded-full transition-all`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Modal */}
      {modal && (
        <Modal title="Generate Rekap Skor" onClose={() => setModal(false)} size="sm">
          <div className="space-y-4">
            {genError && <ErrorMessage message={genError} />}

            {isAdmin && (
              <div>
                <label className="label">Dosen</label>
                <select className="input" value={genUserId} onChange={e => setGenUserId(e.target.value)}>
                  <option value="">Pilih dosen...</option>
                  <option value="all">🔄 Semua Dosen</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.nama}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Periode</label>
              <select className="input" value={genPeriode} onChange={e => setGenPeriode(e.target.value)}>
                {PERIODE_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <div className="text-xs text-slate-400 mt-1">Pilih semester yang ingin direkap</div>
            </div>

            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setModal(false)} disabled={generating}>Batal</button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={handleGenerate} disabled={generating}>
                <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
