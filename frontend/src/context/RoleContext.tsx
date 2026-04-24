import React, { createContext, useContext, useState } from 'react'

export type Role = 'admin' | 'dosen' | 'reviewer'

export interface CurrentUser {
  id: number
  nama: string
  email: string
  role: Role
}

// Temporary demo users (replaced by real auth later)
export const DEMO_USERS: CurrentUser[] = [
  { id: 1, nama: 'Admin BKD',          email: 'admin@univ.ac.id',  role: 'admin' },
  { id: 2, nama: 'Dr. Budi Santoso',   email: 'budi@univ.ac.id',   role: 'dosen' },
  { id: 3, nama: 'Dr. Sari Dewi',      email: 'sari@univ.ac.id',   role: 'dosen' },
  { id: 4, nama: 'Prof. Ahmad Reviewer', email: 'ahmad@univ.ac.id', role: 'reviewer' },
]

interface RoleContextType {
  currentUser: CurrentUser
  setCurrentUser: (user: CurrentUser) => void
}

const RoleContext = createContext<RoleContextType | null>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(DEMO_USERS[1]) // default: dosen

  return (
    <RoleContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
