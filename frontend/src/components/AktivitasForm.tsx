import { useState } from 'react'
import Modal from './Modal'
import { aktivitasApi, type Aktivitas, type JenisTridharma } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { ErrorMessage } from './UI'

interface Props {
  onClose: () => void
  onSaved: () => void
  existing?: Aktivitas
}

const JENIS_OPTIONS: { value: JenisTridharma; label: string }[] = [
  { value: 'pendidikan',  label: 'Pendidikan' },
  { value: 'penelitian',  label: 'Penelitian' },
  { value: 'pengabdian',  label: 'Pengabdian' },
]

export default function AktivitasForm({ onClose, onSaved, existing }: Props) {
  const { user: currentUser } = useAuth()
  if (!currentUser) return null
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [form, setForm] = useState({
    jenis:     (existing?.jenis     ?? 'pendidikan') as JenisTridharma,
    judul:     existing?.judul      ?? '',
    deskripsi: existing?.deskripsi  ?? '',
    tanggal:   existing?.tanggal?.split('T')[0] ?? '',
    skor_raw:  existing?.skor_raw   ?? 0,
  })

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.judul || !form.tanggal) {
      setError('Judul dan tanggal wajib diisi')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (existing) {
        await aktivitasApi.update(existing.id, { ...form })
      } else {
        await aktivitasApi.create({ user_id: currentUser.id, ...form })
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={existing ? 'Edit Aktivitas' : 'Tambah Aktivitas'} onClose={onClose}>
      <div className="space-y-4">
        {error && <ErrorMessage message={error} />}

        <div>
          <label className="label">Jenis Tridharma</label>
          <div className="grid grid-cols-3 gap-2">
            {JENIS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('jenis', opt.value)}
                className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all
                  ${form.jenis === opt.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Judul Aktivitas</label>
          <input
            className="input"
            placeholder="Contoh: Mengajar Matakuliah Pemrograman Web"
            value={form.judul}
            onChange={e => set('judul', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Deskripsi <span className="text-slate-400 font-normal">(opsional)</span></label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Deskripsi singkat aktivitas..."
            value={form.deskripsi}
            onChange={e => set('deskripsi', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tanggal</label>
            <input
              type="date"
              className="input"
              value={form.tanggal}
              onChange={e => set('tanggal', e.target.value)}
            />
          </div>
          <div>
            <label className="label">SKS / Skor</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className="input"
              placeholder="0"
              value={form.skor_raw}
              onChange={e => set('skor_raw', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Menyimpan...' : existing ? 'Simpan Perubahan' : 'Tambah Aktivitas'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
