import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Users, Edit2 } from 'lucide-react'
import { usersApi, type User } from '../api/services'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { PageLoader, EmptyState, ErrorMessage } from '../components/UI'

const ROLE_COLOR: Record<string, string> = {
  admin:    'bg-brand-100 text-brand-700',
  dosen:    'bg-purple-100 text-purple-700',
  reviewer: 'bg-teal-100 text-teal-700',
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  if (!currentUser) return null
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [modal, setModal]     = useState<{ user?: User } | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [form, setForm] = useState({ nama: '', email: '', role: 'dosen' })
  const [saving, setSaving]   = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await usersApi.list()
      setUsers(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat pengguna')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openModal = (user?: User) => {
    setForm(user ? { nama: user.nama, email: user.email, role: user.role } : { nama: '', email: '', role: 'dosen' })
    setFormError('')
    setModal({ user })
  }

  const handleSave = async () => {
    if (!form.nama || !form.email) { setFormError('Nama dan email wajib diisi'); return }
    setSaving(true)
    setFormError('')
    try {
      if (modal?.user) {
        await usersApi.update(modal.user.id, form as Partial<User>)
      } else {
        await usersApi.create(form as Omit<User, 'id' | 'created_at'>)
      }
      setModal(null)
      await load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (id === currentUser.id) { alert('Tidak dapat menghapus akun sendiri'); return }
    if (!confirm('Hapus pengguna ini?')) return
    setDeleting(id)
    try { await usersApi.delete(id); await load() }
    finally { setDeleting(null) }
  }

  if (currentUser.role !== 'admin') {
    return (
      <div className="card p-8 text-center">
        <div className="text-slate-500 font-medium">Akses ditolak. Halaman ini hanya untuk Admin.</div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Manajemen Pengguna</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola akun Admin, Dosen, dan Reviewer</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => openModal()}>
          <Plus size={16} /> Tambah Pengguna
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <PageLoader />
      ) : users.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users size={24} />}
            title="Belum ada pengguna"
            description="Tambah pengguna baru untuk memulai"
            action={
              <button className="btn-primary flex items-center gap-2" onClick={() => openModal()}>
                <Plus size={15} /> Tambah Pengguna
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['#', 'Nama', 'Email', 'Role', 'Bergabung', 'Aksi'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${u.id === currentUser.id ? 'bg-brand-50/50' : ''}`}>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{u.nama}</div>
                      {u.id === currentUser.id && <div className="text-xs text-brand-500 font-medium">Anda</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${ROLE_COLOR[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openModal(u)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deleting === u.id || u.id === currentUser.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors disabled:opacity-30"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="sm:hidden divide-y divide-slate-100">
            {users.map(u => (
              <div key={u.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-600">
                  {u.nama[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{u.nama}</div>
                  <div className="text-xs text-slate-400 truncate">{u.email}</div>
                  <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-bold capitalize ${ROLE_COLOR[u.role]}`}>
                    {u.role}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openModal(u)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id || u.id === currentUser.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors disabled:opacity-30">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {modal !== null && (
        <Modal title={modal.user ? 'Edit Pengguna' : 'Tambah Pengguna'} onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            {formError && <ErrorMessage message={formError} />}
            <div>
              <label className="label">Nama Lengkap</label>
              <input className="input" placeholder="Dr. Nama Dosen" value={form.nama}
                onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="nama@univ.ac.id" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['admin', 'dosen', 'reviewer'] as const).map(r => (
                  <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                    className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all capitalize
                      ${form.role === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setModal(null)} disabled={saving}>Batal</button>
              <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : modal.user ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
