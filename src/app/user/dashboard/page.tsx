import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { mapComplaint } from '@/lib/supabase/mappers'
import { getSignedUrlMap } from '@/lib/supabase/signed-url'
import { attachQueuePositions } from '@/lib/queue/fetch'
import { TicketCard } from '@/components/tickets/TicketCard'

export default async function UserDashboardPage() {
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
  const active = complaints.filter((c) => c.status !== 'Resolved')
  const resolved = complaints.filter((c) => c.status === 'Resolved')

  const recent = complaints.slice(0, 5)
  const [thumbnailMap, positions] = await Promise.all([
    getSignedUrlMap(recent.map((c) => c.thumbnailPath)),
    attachQueuePositions(supabase, complaints),
  ])

  return (
    <div className="max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-semibold text-ink-primary">Overview</h1>
      <p className="text-sm text-ink-secondary mt-1">Summary of your reported defects</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Active" value={active.length} />
        <StatCard label="Resolved" value={resolved.length} />
        <StatCard label="Total" value={complaints.length} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-ink-primary">Recent complaints</h2>
        <Link href="/user/complaints/new" className="btn-primary">
          + Report a defect
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {recent.map((c) => (
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
            <p className="text-sm text-ink-secondary mt-2 mb-6">
              Report a defect to create your first complaint.
            </p>
            <Link href="/user/complaints/new" className="btn-primary">
              Report a defect
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-5 py-4 flex flex-col justify-between h-24">
      <p className="text-sm font-medium text-ink-secondary uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-ink-primary">{value}</p>
    </div>
  )
}
