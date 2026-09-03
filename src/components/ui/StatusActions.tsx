'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ComplaintStatus } from '@/types/domain'

// Replaces the old free-form StatusUpdater.tsx dropdown with the exact
// required state machine (CLAUDE.md §30) — one button, always the only
// legal next step, never a jump or a backwards move.
const NEXT_ACTION: Partial<Record<ComplaintStatus, { label: string; next: ComplaintStatus }>> = {
  Submitted: { label: 'Assign to me', next: 'Assigned' },
  Assigned: { label: 'Start work', next: 'In Progress' },
  'In Progress': { label: 'Mark resolved', next: 'Resolved' },
}

export function StatusActions({
  complaintId,
  status,
}: {
  complaintId: string
  status: ComplaintStatus
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const action = NEXT_ACTION[status]
  if (!action) return null

  async function handleClick() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/staff/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaintId, newStatus: action!.next }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Failed to update status.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button 
        onClick={handleClick} 
        disabled={loading} 
        className="btn-primary flex items-center justify-center gap-2"
        aria-live="polite"
      >
        {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
        {loading ? 'Updating…' : action.label}
      </button>
      {error && (
        <div className="p-2 mt-2 bg-red-50 rounded-md border border-red-100 flex items-start gap-2" role="alert">
          <svg className="h-4 w-4 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
