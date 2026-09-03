import Link from 'next/link'
import type { DefectType, StaffCategory, ComplaintStatus, SeverityLabel } from '@/types/domain'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { labelFor } from '@/config/defects'

export interface TicketCardProps {
  href: string
  id?: string
  createdAt?: string
  thumbnailUrl: string | null
  defect: DefectType
  category: StaffCategory
  severity: SeverityLabel
  priorityScore: number
  status: ComplaintStatus
  location: string
  queuePosition?: number
  assignedStaffName?: string | null
}

export function TicketCard({
  href,
  id,
  createdAt,
  thumbnailUrl,
  defect,
  category,
  severity,
  priorityScore,
  status,
  location,
  queuePosition,
  assignedStaffName,
}: TicketCardProps) {
  const dateFormatted = createdAt ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  return (
    <Link
      href={href}
      className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-700"
    >
      <div className="h-48 sm:h-24 sm:w-32 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt={`Photo of detected ${labelFor(defect)}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted text-xs">No image</div>
        )}
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-base font-semibold text-ink-primary truncate">{labelFor(defect)}</p>
              <div className="flex items-center gap-2 mt-1">
                {id && <span className="text-xs font-mono text-ink-muted">#{id.split('-')[0]}</span>}
                {dateFormatted && <span className="text-xs text-ink-secondary">{dateFormatted}</span>}
              </div>
            </div>
            {status !== 'Resolved' && (
              <div className="flex flex-col items-end shrink-0" title="Higher scores are handled earlier.">
                <span className="text-xs font-medium text-ink-secondary bg-surface-muted px-2 py-1 rounded-md border border-border">
                  Priority score: {Math.round(priorityScore)}/100
                </span>
                {queuePosition && (
                  <span className="text-xs font-medium text-brand-700 mt-1">
                    Queue #{queuePosition}
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="mt-2 truncate text-sm text-ink-secondary flex items-center gap-1">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </p>
        </div>
        
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <CategoryBadge category={category} />
          <SeverityBadge severity={severity} />
          {assignedStaffName && (
            <span className="text-xs text-ink-muted ml-auto sm:ml-2">Claimed by {assignedStaffName}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
