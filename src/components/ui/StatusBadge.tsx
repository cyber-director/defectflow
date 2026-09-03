import type { ComplaintStatus } from '@/types/domain'

const STYLES: Record<ComplaintStatus, string> = {
  Submitted: 'bg-slate-50 text-slate-700 border-slate-200',
  Assigned: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  Resolved: 'bg-green-50 text-green-700 border-green-200',
}

const DOTS: Record<ComplaintStatus, string> = {
  Submitted: 'bg-slate-400',
  Assigned: 'bg-blue-500',
  'In Progress': 'bg-amber-500',
  Resolved: 'bg-green-500',
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium border ${STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status]}`} aria-hidden="true" />
      {status}
    </span>
  )
}
