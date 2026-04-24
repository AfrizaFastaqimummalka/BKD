import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar         from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import Aktivitas  from './pages/Aktivitas'
import Verifikasi from './pages/Verifikasi'
import RekapSkor  from './pages/RekapSkor'
import Users      from './pages/Users'
import { PageLoader } from './components/UI'

function AppRoutes() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-100">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-6">
              <Routes>
                <Route path="/"           element={<Dashboard />} />
                <Route path="/aktivitas"  element={<Aktivitas />} />
                <Route path="/verifikasi" element={<Verifikasi />} />
                <Route path="/rekap"      element={<RekapSkor />} />
                <Route path="/users"      element={<Users />} />
                <Route path="*"           element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
