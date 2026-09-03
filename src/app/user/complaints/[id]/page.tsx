import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { mapComplaint, mapTicketUpdate } from '@/lib/supabase/mappers'
import { getSignedUrl } from '@/lib/supabase/signed-url'
import { attachQueuePositions } from '@/lib/queue/fetch'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatusStepper } from '@/components/tickets/StatusStepper'
import { TicketActivity } from '@/components/activity/TicketActivity'
import { labelFor } from '@/config/defects'

export default async function UserComplaintDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: row } = await supabase.from('complaints').select('*').eq('id', params.id).single()
  if (!row) notFound()

  const complaint = mapComplaint(row)

  // RLS already scopes what this query can return, but this page is
  // user-facing specifically, so double-check ownership defensively
  // too rather than relying on RLS alone (CLAUDE.md §25).
  if (complaint.reporterId !== user!.id) notFound()

  const { data: updateRows } = await supabase
    .from('ticket_updates')
    .select('*')
    .eq('complaint_id', complaint.id)
    .order('created_at', { ascending: true })
  const updates = (updateRows ?? []).map(mapTicketUpdate)

  const [imageUrl, positions] = await Promise.all([
    getSignedUrl(complaint.imagePath),
    attachQueuePositions(supabase, [complaint]),
  ])
  const queuePosition = positions.get(complaint.id)

  return (
    <div className="max-w-4xl mx-auto w-full pb-12">
      <div className="mb-6">
        <a href="/user/complaints" className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline">
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to My Complaints
        </a>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-ink-primary">{labelFor(complaint.detectedDefect)}</h1>
              <span className="text-sm font-mono text-ink-muted">#{complaint.id.split('-')[0]}</span>
            </div>
            <p className="mt-2 text-base text-ink-secondary flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {complaint.location}
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <StatusBadge status={complaint.status} />
            <span className="text-xs text-ink-muted">
              Submitted {new Date(complaint.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <StatusStepper status={complaint.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={`Photo of detected ${labelFor(complaint.detectedDefect)} at ${complaint.location}`}
                className="w-full object-contain max-h-[60vh] bg-surface-muted"
              />
            ) : (
              <div className="w-full aspect-video bg-surface-muted flex items-center justify-center text-ink-muted">
                No image available
              </div>
            )}
            
            <div className="p-6 border-t border-border bg-surface">
              <h2 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-2">Description</h2>
              <p className="text-ink-primary whitespace-pre-wrap">{complaint.description || 'No additional description provided.'}</p>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">Details</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <CategoryBadge category={complaint.category} />
              <SeverityBadge severity={complaint.severityLabel} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4 p-4 bg-surface-muted rounded-lg">
              {complaint.status !== 'Resolved' && queuePosition !== undefined && (
                <div>
                  <p className="text-ink-secondary">Queue position</p>
                  <p className="font-medium text-ink-primary">#{queuePosition} in {complaint.category}</p>
                </div>
              )}
              {complaint.assignedStaffName && (
                <div>
                  <p className="text-ink-secondary">Assigned to</p>
                  <p className="font-medium text-ink-primary">{complaint.assignedStaffName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 h-full flex flex-col">
            <h2 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">Activity Timeline</h2>
            <div className="flex-1">
              <TicketActivity complaintId={complaint.id} initialUpdates={updates} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
