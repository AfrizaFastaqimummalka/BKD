import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

export type Role = 'admin' | 'dosen' | 'reviewer'

export interface AuthUser {
  id: number
  nama: string
  email: string
  role: Role
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount — restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('bkd_token')
    const savedUser  = localStorage.getItem('bkd_user')
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
      } catch {
        localStorage.removeItem('bkd_token')
        localStorage.removeItem('bkd_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post<{
      message: string
      token: string
      user: AuthUser
    }>('/auth/login', { email, password })

    const { token: newToken, user: newUser } = res.data

    // Save to state + localStorage
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('bkd_token', newToken)
    localStorage.setItem('bkd_user', JSON.stringify(newUser))

    // Set axios default header for all future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('bkd_token')
    localStorage.removeItem('bkd_user')
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
