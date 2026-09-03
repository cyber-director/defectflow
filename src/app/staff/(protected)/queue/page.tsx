import { createClient } from '@/lib/supabase/server'
import { mapComplaint } from '@/lib/supabase/mappers'
import { getSignedUrlMap } from '@/lib/supabase/signed-url'
import { sortByQueueOrder } from '@/lib/queue/rank'
import { TicketCard } from '@/components/tickets/TicketCard'
import { QueueRealtime } from '@/components/tickets/QueueRealtime'

export default async function StaffQueuePage({
  searchParams,
}: {
  searchParams: { resolved?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('staff_category')
    .eq('id', user!.id)
    .single()

  const category = profile!.staff_category
  const showResolved = searchParams.resolved === '1'

  const { data: rows } = showResolved
    ? await supabase
        .from('complaints')
        .select('*')
        .eq('category', category)
        .eq('status', 'Resolved')
        .order('resolved_at', { ascending: false })
    : await supabase.from('complaints').select('*').eq('category', category).neq('status', 'Resolved')

  let complaints = (rows ?? []).map(mapComplaint)
  // Resolved tickets stay in resolved_at order (most recent first);
  // everything else uses queue order (CLAUDE.md §49) — this is the
  // same "removed from the queue" moment described in §51.
  if (!showResolved) {
    complaints = sortByQueueOrder(complaints)
  }

  const thumbnailMap = await getSignedUrlMap(complaints.map((c) => c.thumbnailPath))

  return (
    <div className="max-w-4xl mx-auto w-full">
      <QueueRealtime category={category} />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-primary">
          {showResolved ? 'Resolved' : 'Queue'}
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          {category} category complaints
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {complaints.map((c, i) => (
          <TicketCard
            key={c.id}
            href={`/staff/complaints/${c.id}`}
            thumbnailUrl={thumbnailMap[c.thumbnailPath] ?? null}
            defect={c.detectedDefect}
            category={c.category}
            severity={c.severityLabel}
            priorityScore={c.priorityScore}
            status={c.status}
            location={c.location}
            queuePosition={!showResolved ? i + 1 : undefined}
            assignedStaffName={c.assignedStaffName}
          />
        ))}
        
        {complaints.length === 0 && (
          <div className="card px-6 py-12 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-ink-primary">
              {showResolved ? 'No resolved complaints yet' : 'Queue is clear'}
            </h3>
            <p className="text-sm text-ink-secondary mt-2">
              {showResolved 
                ? 'Resolved tickets will appear here.'
                : 'New complaints assigned to your category will appear here automatically.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
