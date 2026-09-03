'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { mapTicketUpdate } from '@/lib/supabase/mappers'
import type { TicketUpdate } from '@/types/domain'

// Replaces the old 15-second-polling CommentThread.tsx with a real
// Realtime subscription (CLAUDE.md §27). Also listens for UPDATE on the
// complaint row itself, so a status change refreshes the page's other
// data (queue position, staff assignment) even though that information
// isn't part of this component's own state.
export function TicketActivity({
  complaintId,
  initialUpdates,
}: {
  complaintId: string
  initialUpdates: TicketUpdate[]
}) {
  const [updates, setUpdates] = useState(initialUpdates)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`complaint-${complaintId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_updates',
          filter: `complaint_id=eq.${complaintId}`,
        },
        (payload) => {
          setUpdates((prev) => [...prev, mapTicketUpdate(payload.new)])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
          filter: `id=eq.${complaintId}`,
        },
        () => {
          // Status/assignment changed — re-fetch the server-rendered
          // parts of the page (queue position, status badge, etc).
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [complaintId, router])

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {updates.map((update, idx) => (
          <li key={update.id}>
            <div className="relative pb-8">
              {idx !== updates.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-surface ${
                    update.type === 'status' ? 'bg-brand-100 text-brand-700' : 'bg-surface-muted text-ink-secondary'
                  }`}>
                    {update.type === 'status' ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    )}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-ink-primary">
                      {update.type === 'status' ? (
                        <>
                          <span className="font-medium text-ink-primary">{update.actorName || 'System'}</span> changed status to <span className="font-medium">{update.newStatus}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-ink-primary">{update.actorName || 'Staff'}</span> added a note
                        </>
                      )}
                    </p>
                    {update.message && (
                      <p className="mt-2 text-sm text-ink-secondary bg-surface-muted p-3 rounded-lg rounded-tl-none inline-block">
                        {update.message}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-ink-muted">
                    {new Date(update.createdAt).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
