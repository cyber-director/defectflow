import type { SeverityLabel } from '@/types/domain'

const STYLES: Record<SeverityLabel, string> = {
  Low: 'bg-ink-muted/10 text-ink-secondary border-ink-muted/20',
  Medium: 'bg-category-performance/10 text-category-performance border-category-performance/20',
  High: 'bg-category-structural/10 text-category-structural border-category-structural/20',
}

export function SeverityBadge({ severity }: { severity: SeverityLabel }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${STYLES[severity]}`}
    >
      {severity}
    </span>
  )
}
