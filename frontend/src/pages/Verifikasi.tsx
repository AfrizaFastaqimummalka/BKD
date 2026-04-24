import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, FileText, ChevronDown, ChevronUp, History } from 'lucide-react'
import { verifikasiApi, type Aktivitas, type Verifikasi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, JenisBadge } from '../components/Badge'
import Modal from '../components/Modal'
import { PageLoader, EmptyState, ErrorMessage } from '../components/UI'
import { formatDate, formatScore } from '../lib/utils'
import { ShieldCheck } from 'lucide-react'

export default function VerifikasiPage() {
  const { user: currentUser } = useAuth()
  if (!currentUser) return null
  const [items, setItems]     = useState<Aktivitas[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [history, setHistory]   = useState<Record<number, Verifikasi[]>>({})
  const [modal, setModal]       = useState<{ aktivitas: Aktivitas; action: 'approved' | 'rejected' } | null>(null)
  const [catatan, setCatatan]   = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError]           = useState('')
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await verifikasiApi.list(statusFilter)
      setItems(data)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const loadHistory = async (id: number) => {
    if (history[id]) return
    const h = await verifikasiApi.history(id)
    setHistory(prev => ({ ...prev, [id]: h }))
  }

  const toggleExpand = (id: number) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    loadHistory(id)
  }

  const handleProcess = async () => {
    if (!modal) return
    setProcessing(true)
    setError('')
    try {
      await verifikasiApi.process(modal.aktivitas.id, {
        reviewer_id: currentUser.id,
        status: modal.action,
        catatan: catatan || undefined,
      })
      setModal(null)
      setCatatan('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses')
    } finally {
      setProcessing(false)
    }
  }

  const isReviewer = currentUser.role === 'reviewer' || currentUser.role === 'admin'

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Verifikasi Aktivitas</h1>
        <p className="text-sm text-slate-500 mt-1">Review dan verifikasi aktivitas tridharma dosen</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize
              ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}
          >
            {s === 'pending' ? 'Menunggu' : s === 'approved' ? 'Disetujui' : 'Ditolak'}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ShieldCheck size={24} />}
            title="Tidak ada aktivitas"
            description={`Tidak ada aktivitas dengan status ${statusFilter}`}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(a => (
            <div key={a.id} className="card overflow-hidden">
              {/* Main row */}
              <div className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <JenisBadge jenis={a.jenis} />
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="font-semibold text-slate-800">{a.judul}</div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {a.dosen_nama} · {formatDate(a.tanggal)} · {formatScore(a.skor_raw)} SKS
                  </div>
                  {a.deskripsi && (
                    <div className="text-sm text-slate-500 mt-1 line-clamp-2">{a.deskripsi}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isReviewer && a.status === 'pending' && (
                    <>
                      <button
                        onClick={() => { setModal({ aktivitas: a, action: 'approved' }); setError('') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-semibold text-xs rounded-lg transition-colors"
                      >
                        <CheckCircle size={13} /> Setuju
                      </button>
                      <button
                        onClick={() => { setModal({ aktivitas: a, action: 'rejected' }); setError('') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-lg transition-colors"
                      >
                        <XCircle size={13} /> Tolak
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => toggleExpand(a.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    {expanded === a.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded: dokumen + history */}
              {expanded === a.id && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4 animate-fade-in">
                  {/* Dokumen */}
                  {(a.dokumen ?? []).length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bukti Dokumen</div>
                      <div className="flex flex-wrap gap-2">
                        {a.dokumen.map(d => (
                          <a
                            key={d.id}
                            href={d.url_cloudinary}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-brand-600 hover:border-brand-300 transition-colors"
                          >
                            <FileText size={12} /> {d.nama_file}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* History */}
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <History size={12} /> Riwayat Verifikasi
                    </div>
                    {(history[a.id] ?? []).length === 0 ? (
                      <div className="text-xs text-slate-400">Belum ada riwayat verifikasi</div>
                    ) : (
                      <div className="space-y-2">
                        {(history[a.id] ?? []).map(v => (
                          <div key={v.id} className="flex items-start gap-3 text-xs">
                            <span className={`px-2 py-0.5 rounded-md font-semibold shrink-0
                              ${v.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {v.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-700">{v.reviewer_nama}</div>
                              {v.catatan && <div className="text-slate-500 mt-0.5">"{v.catatan}"</div>}
                              <div className="text-slate-400 mt-0.5">{formatDate(v.verified_at)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      {modal && (
        <Modal
          title={modal.action === 'approved' ? 'Setujui Aktivitas' : 'Tolak Aktivitas'}
          onClose={() => setModal(null)}
          size="sm"
        >
          <div className="space-y-4">
            {error && <ErrorMessage message={error} />}

            <div className={`p-3 rounded-xl ${modal.action === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="text-sm font-semibold text-slate-700">{modal.aktivitas.judul}</div>
              <div className="text-xs text-slate-500 mt-0.5">{modal.aktivitas.dosen_nama}</div>
            </div>

            <div>
              <label className="label">Catatan <span className="text-slate-400 font-normal">(opsional)</span></label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder={modal.action === 'approved' ? 'Catatan persetujuan...' : 'Alasan penolakan...'}
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setModal(null)} disabled={processing}>Batal</button>
              <button
                className={`flex-1 font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50
                  ${modal.action === 'approved' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                onClick={handleProcess}
                disabled={processing}
              >
                {processing ? 'Memproses...' : modal.action === 'approved' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
