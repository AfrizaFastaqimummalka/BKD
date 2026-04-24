import api from './client'

// ── Types ────────────────────────────────────────────────────────────────────
export type Role           = 'admin' | 'dosen' | 'reviewer'
export type JenisTridharma = 'pendidikan' | 'penelitian' | 'pengabdian'
export type AktivitasStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface User {
  id: number; nama: string; email: string; role: Role; created_at: string
}

export interface Dokumen {
  id: number; aktivitas_id: number; nama_file: string
  url_cloudinary: string; public_id: string; created_at: string
}

export interface Verifikasi {
  id: number; aktivitas_id: number; reviewer_id: number
  reviewer_nama: string; status: 'approved' | 'rejected'
  catatan: string | null; verified_at: string
}

export interface Aktivitas {
  id: number; user_id: number; dosen_nama: string
  jenis: JenisTridharma; judul: string; deskripsi: string | null
  tanggal: string; skor_raw: number; status: AktivitasStatus
  created_at: string; updated_at: string
  dokumen: Dokumen[]; verifikasi_history?: Verifikasi[]
}

export interface RekapSkor {
  id: number; user_id: number; dosen_nama: string; periode: string
  total_pendidikan: number; total_penelitian: number
  total_pengabdian: number; total_skor: number; generated_at: string
}

// ── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get<{ data: User[] }>('/users').then(r => r.data.data),
  get:  (id: number) => api.get<{ data: User }>(`/users/${id}`).then(r => r.data.data),
  create: (body: Omit<User, 'id' | 'created_at'>) =>
    api.post<{ data: User }>('/users', body).then(r => r.data.data),
  update: (id: number, body: Partial<Omit<User, 'id' | 'created_at'>>) =>
    api.put<{ data: User }>(`/users/${id}`, body).then(r => r.data.data),
  delete: (id: number) => api.delete(`/users/${id}`),
}

// ── Aktivitas ────────────────────────────────────────────────────────────────
export const aktivitasApi = {
  list: (params?: { user_id?: number; status?: string; jenis?: string }) =>
    api.get<{ data: Aktivitas[] }>('/aktivitas', { params }).then(r => r.data.data),
  get: (id: number) =>
    api.get<{ data: Aktivitas }>(`/aktivitas/${id}`).then(r => r.data.data),
  create: (body: {
    user_id: number; jenis: JenisTridharma; judul: string
    deskripsi?: string; tanggal: string; skor_raw: number
  }) => api.post<{ data: Aktivitas }>('/aktivitas', body).then(r => r.data.data),
  update: (id: number, body: Partial<Aktivitas>) =>
    api.put<{ data: Aktivitas }>(`/aktivitas/${id}`, body).then(r => r.data.data),
  delete: (id: number) => api.delete(`/aktivitas/${id}`),
  submit: (id: number) =>
    api.patch<{ data: Aktivitas }>(`/aktivitas/${id}/submit`).then(r => r.data.data),
}

// ── Dokumen ──────────────────────────────────────────────────────────────────
export const dokumenApi = {
  list: (aktivitasId: number) =>
    api.get<{ data: Dokumen[] }>('/dokumen', { params: { aktivitas_id: aktivitasId } })
       .then(r => r.data.data),
  upload: (aktivitasId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('aktivitas_id', String(aktivitasId))
    return api.post<{ data: Dokumen }>('/dokumen', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data)
  },
  delete: (id: number) => api.delete(`/dokumen/${id}`),
}

// ── Verifikasi ───────────────────────────────────────────────────────────────
export const verifikasiApi = {
  list: (status?: string) =>
    api.get<{ data: Aktivitas[] }>('/verifikasi', { params: { status } }).then(r => r.data.data),
  history: (aktivitasId: number) =>
    api.get<{ data: Verifikasi[] }>(`/verifikasi/history/${aktivitasId}`).then(r => r.data.data),
  process: (aktivitasId: number, body: {
    reviewer_id: number; status: 'approved' | 'rejected'; catatan?: string
  }) => api.post<{ data: Verifikasi }>(`/verifikasi/${aktivitasId}`, body).then(r => r.data.data),
}

// ── Rekap Skor ───────────────────────────────────────────────────────────────
export const rekapApi = {
  list: (userId?: number) =>
    api.get<{ data: RekapSkor[] }>('/rekap', { params: userId ? { user_id: userId } : {} })
       .then(r => r.data.data),
  generate: (userId: number, periode: string) =>
    api.post<{ data: RekapSkor }>('/rekap/generate', { user_id: userId, periode })
       .then(r => r.data.data),
  generateAll: (periode: string) =>
    api.post<{ data: RekapSkor[]; count: number }>('/rekap/generate-all', { periode })
       .then(r => r.data),
}
