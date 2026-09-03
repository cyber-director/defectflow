import { Lock } from 'lucide-react'
import type { AnalysisResult } from '@/types/domain'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { labelFor } from '@/config/defects'

// The non-editable analysis block shown during complaint entry
// (CLAUDE.md §15). Nothing here is a form control — there is
// deliberately no way for the user to override any of these values.
export function AnalysisPreview({ result }: { result: AnalysisResult }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
        <Lock size={20} />
        Automatically determined from the submitted photograph
      </p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-ink-muted">Detected defect</dt>
          <dd className="font-medium text-ink-primary">{labelFor(result.primaryDefect)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Category</dt>
          <dd className="mt-0.5">
            <CategoryBadge category={result.category} />
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Severity</dt>
          <dd className="mt-0.5">
            <SeverityBadge severity={result.severityLabel} />
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Priority</dt>
          <dd className="font-medium text-ink-primary">{Math.round(result.priorityScore)} / 100</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Visible extent</dt>
          <dd className="font-medium text-ink-primary">{Math.round(result.visibleExtent * 100)}%</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Confidence</dt>
          <dd className="font-medium text-ink-primary">{Math.round(result.confidence * 100)}%</dd>
        </div>
      </dl>
    </div>
  )
}
