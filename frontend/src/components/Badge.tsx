import { Clock, CheckCircle, XCircle, FileEdit } from 'lucide-react'
import type { AktivitasStatus, JenisTridharma } from '../api/services'
import { STATUS_LABEL, JENIS_LABEL, statusBadgeClass, jenisBadgeClass } from '../lib/utils'

const STATUS_ICON: Record<AktivitasStatus, React.ElementType> = {
  draft:    FileEdit,
  pending:  Clock,
  approved: CheckCircle,
  rejected: XCircle,
}

export function StatusBadge({ status }: { status: AktivitasStatus }) {
  const Icon = STATUS_ICON[status]
  return (
    <span className={statusBadgeClass(status)}>
      <Icon size={11} />
      {STATUS_LABEL[status]}
    </span>
  )
}

export function JenisBadge({ jenis }: { jenis: JenisTridharma }) {
  return <span className={jenisBadgeClass(jenis)}>{JENIS_LABEL[jenis]}</span>
}
