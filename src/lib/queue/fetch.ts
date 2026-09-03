// Queue position is never stored (CLAUDE.md §21) — this fetches each
// relevant category's active complaints once and computes every
// requested complaint's position from that, instead of doing it
// per-row (which would mean one query per complaint).

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Complaint, StaffCategory } from '@/types/domain'
import { computeQueuePosition, type QueueRankable } from './rank'

export async function attachQueuePositions(
  supabase: SupabaseClient,
  complaints: Complaint[]
): Promise<Map<string, number>> {
  const active = complaints.filter((c) => c.status !== 'Resolved')
  const categories = [...new Set(active.map((c) => c.category))] as StaffCategory[]

  const rows = await Promise.all(
    categories.map((category) =>
      supabase
        .from('complaints')
        .select('id, priority_score, created_at')
        .eq('category', category)
        .neq('status', 'Resolved')
    )
  )

  const byCategory = new Map<StaffCategory, QueueRankable[]>(
    categories.map((category, i) => [
      category,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((rows[i].data ?? []) as any[]).map((r) => ({
        id: r.id as string,
        priorityScore: r.priority_score as number,
        createdAt: r.created_at as string,
      })),
    ])
  )

  const positions = new Map<string, number>()
  for (const c of active) {
    positions.set(c.id, computeQueuePosition(c, byCategory.get(c.category) ?? []))
  }
  return positions
}
