import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Upload, Edit2, Trash2, Send, Filter } from 'lucide-react'
import { aktivitasApi, type Aktivitas, type AktivitasStatus } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, JenisBadge } from '../components/Badge'
import AktivitasForm from '../components/AktivitasForm'
import UploadModal from '../components/UploadModal'
import { PageLoader, EmptyState } from '../components/UI'
import { formatDate, formatScore, JENIS_LABEL } from '../lib/utils'
import { ClipboardList } from 'lucide-react'

type Modal = { type: 'form'; data?: Aktivitas } | { type: 'upload'; data: Aktivitas } | null

const STATUS_FILTERS: { value: AktivitasStatus | 'all'; label: string }[] = [
  { value: 'all',      label: 'Semua' },
  { value: 'draft',    label: 'Draft' },
  { value: 'pending',  label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
]

export default function AktivitasPage() {
  const { user: currentUser } = useAuth()
  if (!currentUser) return null
  const [items, setItems]       = useState<Aktivitas[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState<Modal>(null)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState<AktivitasStatus | 'all'>('all')
  const [deleting, setDeleting] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState<number | null>(null)

  const isDosen = currentUser.role === 'dosen'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {}
      if (isDosen) params.user_id = currentUser.id
      if (statusFilter !== 'all') params.status = statusFilter
      const data = await aktivitasApi.list(params)
      setItems(data)
    } finally {
      setLoading(false)
    }
  }, [currentUser, isDosen, statusFilter])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(a =>
    a.judul.toLowerCase().includes(search.toLowerCase()) ||
    a.dosen_nama?.toLowerCase().includes(search.toLowerCase()) ||
    JENIS_LABEL[a.jenis].toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus aktivitas ini?')) return
    setDeleting(id)
    try { await aktivitasApi.delete(id); await load() }
    finally { setDeleting(null) }
  }

  const handleSubmit = async (id: number) => {
    setSubmitting(id)
    try { await aktivitasApi.submit(id); await load() }
    finally { setSubmitting(null) }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Aktivitas Tridharma</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isDosen ? 'Kelola aktivitas tridharma Anda' : 'Semua aktivitas dosen'}
          </p>
        </div>
        {isDosen && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ type: 'form' })}>
            <Plus size={16} /> Tambah Aktivitas
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Cari aktivitas, dosen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter size={14} className="text-slate-400 shrink-0" />
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                ${statusFilter === f.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ClipboardList size={24} />}
            title="Belum ada aktivitas"
            description={isDosen ? 'Tambah aktivitas tridharma pertama Anda' : 'Tidak ada aktivitas ditemukan'}
            action={isDosen && (
              <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ type: 'form' })}>
                <Plus size={15} /> Tambah Aktivitas
              </button>
            )}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Aktivitas', 'Dosen', 'Tanggal', 'SKS', 'Status', 'Dokumen', 'Aksi'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <JenisBadge jenis={a.jenis} />
                      </div>
                      <div className="font-semibold text-slate-800 max-w-xs truncate">{a.judul}</div>
                      {a.deskripsi && <div className="text-xs text-slate-400 truncate max-w-xs">{a.deskripsi}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{a.dosen_nama}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(a.tanggal)}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{formatScore(a.skor_raw)}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setModal({ type: 'upload', data: a })}
                        className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                      >
                        <Upload size={12} />
                        {(a.dokumen ?? []).length} file
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {isDosen && a.status === 'draft' && (
                          <>
                            <button
                              onClick={() => setModal({ type: 'form', data: a })}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleSubmit(a.id)}
                              disabled={submitting === a.id}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                              title="Submit untuk verifikasi"
                            >
                              <Send size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(a.id)}
                              disabled={deleting === a.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(a.id)}
                            disabled={deleting === a.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-slate-100">
            {filtered.map(a => (
              <div key={a.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <JenisBadge jenis={a.jenis} />
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="font-semibold text-slate-800">{a.judul}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{a.dosen_nama} · {formatDate(a.tanggal)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-800">{formatScore(a.skor_raw)}</div>
                    <div className="text-xs text-slate-400">SKS</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setModal({ type: 'upload', data: a })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg">
                    <Upload size={12} /> {(a.dokumen ?? []).length} Dokumen
                  </button>
                  {isDosen && a.status === 'draft' && (
                    <>
                      <button onClick={() => setModal({ type: 'form', data: a })}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={() => handleSubmit(a.id)} disabled={submitting === a.id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                        <Send size={12} /> Submit
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'form' && (
        <AktivitasForm
          existing={modal.data}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
      {modal?.type === 'upload' && (
        <UploadModal
          aktivitasId={modal.data.id}
          existingDocs={modal.data.dokumen ?? []}
          onClose={() => setModal(null)}
          onSaved={() => load()}
        />
      )}
    </div>
  )
}
