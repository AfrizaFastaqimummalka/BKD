import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, ClipboardList, ShieldCheck, Users, BookOpen, LogOut, ChevronDown } from 'lucide-react'
import BkdLogo from './BkdLogo'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const ROLE_COLOR: Record<string, string> = {
  admin:    'bg-brand-600 text-white',
  dosen:    'bg-purple-600 text-white',
  reviewer: 'bg-teal-600 text-white',
}

const ROLE_LABEL: Record<string, string> = {
  admin:    'Admin',
  dosen:    'Dosen',
  reviewer: 'Reviewer',
}

function NavLink({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  const { pathname } = useLocation()
  const active = pathname === to || (to !== '/' && pathname.startsWith(to))
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all
        ${active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navLinks = [
    { to: '/',           icon: BarChart3,     label: 'Dashboard',  roles: ['admin', 'dosen', 'reviewer'] },
    { to: '/aktivitas',  icon: ClipboardList, label: 'Aktivitas',  roles: ['admin', 'dosen'] },
    { to: '/verifikasi', icon: ShieldCheck,   label: 'Verifikasi', roles: ['admin', 'reviewer'] },
    { to: '/rekap',      icon: BookOpen,      label: 'Rekap Skor', roles: ['admin', 'dosen', 'reviewer'] },
    { to: '/users',      icon: Users,         label: 'Pengguna',   roles: ['admin'] },
  ]

  const visibleLinks = navLinks.filter(l => user && l.roles.includes(user.role))

  if (!user) return null

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <BkdLogo className="w-9 h-9 text-brand-600 drop-shadow-sm" />
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-slate-800 leading-tight">BKD Online</div>
            <div className="text-[10px] text-slate-400 leading-tight">Monitoring Kinerja Dosen</div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {visibleLinks.map(l => <NavLink key={l.to} {...l} />)}
        </nav>

        {/* User menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all"
          >
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${ROLE_COLOR[user.role]}`}>
              {ROLE_LABEL[user.role]}
            </span>
            <span className="text-sm font-semibold text-slate-700 max-w-[100px] truncate hidden sm:inline">
              {user.nama.split(' ').slice(0, 2).join(' ')}
            </span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-fade-in z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="font-bold text-slate-800 text-sm">{user.nama}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                  <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-md text-xs font-bold ${ROLE_COLOR[user.role]}`}>
                    {ROLE_LABEL[user.role]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 transition-colors text-left mt-1"
                >
                  <LogOut size={15} />
                  <span className="text-sm font-semibold">Keluar</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
