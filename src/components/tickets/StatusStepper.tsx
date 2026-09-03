import type { ComplaintStatus } from '@/types/domain'

const STAGES: ComplaintStatus[] = ['Submitted', 'Assigned', 'In Progress', 'Resolved']

// Makes the full lifecycle visible at a glance — StatusActions only
// ever shows the single legal next step as a button, which on its own
// can read as "the other stages don't exist." This shows all four,
// with the completed/current ones filled in.
export function StatusStepper({ status }: { status: ComplaintStatus }) {
  const currentIndex = STAGES.indexOf(status)

  return (
    <ol className="flex items-start gap-2">
      {STAGES.map((stage, i) => {
        const reached = i <= currentIndex
        const active = i === currentIndex
        return (
          <li key={stage} className="flex flex-1 flex-col items-center gap-2">
            <div className={`h-2 w-full rounded-full ${reached ? 'bg-brand-700' : 'bg-border'}`} />
            <span className={`text-xs ${active ? 'font-semibold text-ink-primary' : (reached ? 'font-medium text-ink-secondary' : 'text-ink-muted')}`}>
              {stage}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
