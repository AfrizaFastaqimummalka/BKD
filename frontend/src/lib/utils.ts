import type { AktivitasStatus, JenisTridharma } from '../api/services'

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(dateStr))
}

export function formatScore(n: number | string): string {
  return Number(n).toFixed(2)
}

export const STATUS_LABEL: Record<AktivitasStatus, string> = {
  draft:    'Draft',
  pending:  'Menunggu Verifikasi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

export const JENIS_LABEL: Record<JenisTridharma, string> = {
  pendidikan:  'Pendidikan',
  penelitian:  'Penelitian',
  pengabdian:  'Pengabdian',
}

export function statusBadgeClass(status: AktivitasStatus): string {
  return {
    draft:    'badge-draft',
    pending:  'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  }[status]
}

export function jenisBadgeClass(jenis: JenisTridharma): string {
  return {
    pendidikan:  'badge-pendidikan',
    penelitian:  'badge-penelitian',
    pengabdian:  'badge-pengabdian',
  }[jenis]
}
