// Queue position. See CLAUDE.md §21, §49.
//
// Position is never stored — it changes every time a complaint in the
// same category arrives or resolves, so storing it would just mean
// remembering to invalidate it everywhere. Always compute it from
// priority_score + created_at at read time.

export interface QueueRankable {
  id: string
  priorityScore: number
  createdAt: string // ISO timestamp
}

/**
 * Pure function used by scripts/queue-test.ts and anywhere else that
 * already has the candidate set in memory. `activeComplaints` should
 * already be filtered to the same category and non-Resolved status.
 */
export function computeQueuePosition(
  target: QueueRankable,
  activeComplaints: QueueRankable[]
): number {
  const targetTime = new Date(target.createdAt).getTime()

  const ahead = activeComplaints.filter((c) => {
    if (c.id === target.id) return false
    if (c.priorityScore > target.priorityScore) return true
    if (c.priorityScore === target.priorityScore) {
      return new Date(c.createdAt).getTime() < targetTime
    }
    return false
  })

  return 1 + ahead.length
}

/**
 * Sorts a category's active complaints into queue order:
 * priority_score DESC, created_at ASC (deterministic tie-break).
 */
export function sortByQueueOrder<T extends QueueRankable>(complaints: T[]): T[] {
  return [...complaints].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}
