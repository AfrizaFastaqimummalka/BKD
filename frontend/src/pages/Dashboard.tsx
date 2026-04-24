import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, ShieldCheck, BookOpen, TrendingUp, Clock, CheckCircle, XCircle, FileEdit, ArrowRight } from 'lucide-react'
import { aktivitasApi, rekapApi, type Aktivitas, type RekapSkor } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, JenisBadge } from '../components/Badge'
import { formatDate, formatScore } from '../lib/utils'
import { PageLoader } from '../components/UI'

interface Stats {
  total: number; draft: number; pending: number; approved: number; rejected: number
}

export default function Dashboard() {
  const { user: currentUser } = useAuth()
  if (!currentUser) return null
  const [stats, setStats]   = useState<Stats>({ total: 0, draft: 0, pending: 0, approved: 0, rejected: 0 })
  const [recent, setRecent] = useState<Aktivitas[]>([])
  const [rekap, setRekap]   = useState<RekapSkor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const params = currentUser.role === 'dosen' ? { user_id: currentUser.id } : {}
        const all = await aktivitasApi.list(params)
        setRecent(all.slice(0, 5))
        setStats({
          total:    all.length,
          draft:    all.filter(a => a.status === 'draft').length,
          pending:  all.filter(a => a.status === 'pending').length,
          approved: all.filter(a => a.status === 'approved').length,
          rejected: all.filter(a => a.status === 'rejected').length,
        })
        if (currentUser.role === 'dosen') {
          const r = await rekapApi.list(currentUser.id)
          setRekap(r.slice(0, 3))
        } else if (currentUser.role === 'admin') {
          const r = await rekapApi.list()
          setRekap(r.slice(0, 3))
        }
      } catch (_) {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentUser])

  if (loading) return <PageLoader />

  const statCards = [
    { label: 'Total Aktivitas', value: stats.total,    icon: ClipboardList, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Draft',           value: stats.draft,    icon: FileEdit,      color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'Menunggu',        value: stats.pending,  icon: Clock,         color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Disetujui',       value: stats.approved, icon: CheckCircle,   color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Ditolak',         value: stats.rejected, icon: XCircle,       color: 'text-red-600',   bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="card p-6 bg-gradient-to-br from-brand-600 to-brand-800 text-white border-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-brand-200 text-sm font-semibold mb-1">Selamat datang 👋</div>
            <h1 className="text-2xl font-bold">{currentUser.nama}</h1>
            <p className="text-brand-200 text-sm mt-1">
              {currentUser.role === 'admin' && 'Kelola seluruh aktivitas dan pengguna sistem BKD'}
              {currentUser.role === 'dosen' && 'Input dan pantau aktivitas tridharma Anda'}
              {currentUser.role === 'reviewer' && 'Verifikasi aktivitas tridharma yang masuk'}
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} className="text-white" />
          </div>
        </div>
        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-5">
          {currentUser.role !== 'reviewer' && (
            <Link to="/aktivitas" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
              <ClipboardList size={15} /> Lihat Aktivitas
            </Link>
          )}
          {currentUser.role === 'reviewer' && (
            <Link to="/verifikasi" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
              <ShieldCheck size={15} /> Verifikasi Sekarang
            </Link>
          )}
          <Link to="/rekap" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
            <BookOpen size={15} /> Rekap Skor
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="card p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="section-title">Aktivitas Terbaru</h2>
            <Link to="/aktivitas" className="text-sm text-brand-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recent.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">Belum ada aktivitas</div>
            ) : (
              recent.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <JenisBadge jenis={a.jenis} />
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="text-sm font-semibold text-slate-800 truncate">{a.judul}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {a.dosen_nama} · {formatDate(a.tanggal)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-800">{formatScore(a.skor_raw)}</div>
                    <div className="text-xs text-slate-400">skor</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rekap Skor Summary */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="section-title">Rekap Skor</h2>
            <Link to="/rekap" className="text-sm text-brand-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Lihat <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {rekap.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-6">Belum ada rekap</div>
            ) : (
              rekap.map(r => (
                <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-slate-500">{r.periode}</div>
                    {currentUser.role !== 'dosen' && (
                      <div className="text-xs text-slate-500 truncate max-w-[120px]">{r.dosen_nama}</div>
                    )}
                  </div>
                  <div className="text-lg font-bold text-brand-600">{formatScore(r.total_skor)} <span className="text-xs text-slate-400 font-normal">total SKS</span></div>
                  <div className="grid grid-cols-3 gap-1 mt-2">
                    {[
                      { label: 'Pdd', value: r.total_pendidikan, color: 'text-blue-600' },
                      { label: 'Pnl', value: r.total_penelitian, color: 'text-purple-600' },
                      { label: 'Pgb', value: r.total_pengabdian, color: 'text-teal-600' },
                    ].map(item => (
                      <div key={item.label} className="text-center">
                        <div className={`text-xs font-bold ${item.color}`}>{formatScore(item.value)}</div>
                        <div className="text-[10px] text-slate-400">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
