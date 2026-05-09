import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import BkdLogo from '../components/BkdLogo'
import { useAuth } from '../context/AuthContext'
import { ErrorMessage } from '../components/UI'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email || !password) {
      setError('Email dan password wajib diisi')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal. Periksa email dan password.')
    } finally {
      setLoading(false)
    }
  }

  // Demo accounts helper
  const DEMO = [
    { label: 'Admin',    email: 'admin@univ.ac.id',  role: 'admin' },
    { label: 'Dosen',    email: 'budi@univ.ac.id',   role: 'dosen' },
    { label: 'Reviewer', email: 'ahmad@univ.ac.id',  role: 'reviewer' },
  ]

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <BkdLogo className="w-16 h-16 mx-auto mb-4 text-brand-600 drop-shadow-md" />
          <h1 className="text-2xl font-bold text-slate-800">BKD Online</h1>
          <p className="text-slate-500 text-sm mt-1">Sistem Monitoring Kinerja Dosen</p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-md">
          <h2 className="text-lg font-bold text-slate-800 mb-5">Masuk ke akun Anda</h2>

          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="nama@univ.ac.id"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Masuk...
                </span>
              ) : (
                <>
                  <LogIn size={16} /> Masuk
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Akun Demo
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO.map(d => (
                <button
                  key={d.email}
                  onClick={() => { setEmail(d.email); setPassword('admin123') }}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition-all group"
                >
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md
                    ${d.role === 'admin' ? 'bg-brand-100 text-brand-700' :
                      d.role === 'dosen' ? 'bg-purple-100 text-purple-700' :
                      'bg-teal-100 text-teal-700'}`}>
                    {d.label}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-brand-500 transition-colors truncate w-full text-center">
                    {d.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Klik akun → password otomatis terisi → klik Masuk
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2025 BKD Online · Universitas
        </p>
      </div>
    </div>
  )
}
