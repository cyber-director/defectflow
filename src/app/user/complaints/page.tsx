import { createClient } from '@/lib/supabase/server'
import { mapComplaint } from '@/lib/supabase/mappers'
import { getSignedUrlMap } from '@/lib/supabase/signed-url'
import { attachQueuePositions } from '@/lib/queue/fetch'
import { TicketCard } from '@/components/tickets/TicketCard'

export default async function UserComplaintsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from('complaints')
    .select('*')
    .eq('reporter_id', user!.id)
    .order('created_at', { ascending: false })

  const complaints = (rows ?? []).map(mapComplaint)
  const [thumbnailMap, positions] = await Promise.all([
    getSignedUrlMap(complaints.map((c) => c.thumbnailPath)),
    attachQueuePositions(supabase, complaints),
  ])

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">My Complaints</h1>
          <p className="text-sm text-ink-secondary mt-1">All defects you have reported</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {complaints.map((c) => (
          <TicketCard
            key={c.id}
            id={c.id}
            createdAt={c.createdAt}
            href={`/user/complaints/${c.id}`}
            thumbnailUrl={thumbnailMap[c.thumbnailPath] ?? null}
            defect={c.detectedDefect}
            category={c.category}
            severity={c.severityLabel}
            priorityScore={c.priorityScore}
            status={c.status}
            location={c.location}
            queuePosition={positions.get(c.id)}
          />
        ))}
        {complaints.length === 0 && (
          <div className="card px-6 py-12 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-ink-primary">No complaints yet</h3>
            <p className="text-sm text-ink-secondary mt-2">
              Report a defect to create your first complaint.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
