// Priority ranking. See CLAUDE.md §21.
//
// The problem statement explicitly requires:
//   any Cracked Tiles complaint > any Paint Peeling complaint
// within the Performance category. Non-overlapping score bands
// guarantee that ordering regardless of severity, while severity still
// ranks complaints within the same defect type.
//
// Structural and Functional each have exactly one defect today, so
// their band width mostly just needs to stay clear of the others' —
// the internal ordering within those categories is driven by severity.

import type { DefectType } from '@/types/domain'

export const PRIORITY_VERSION = 'extent-v1'

export function calculatePriority(defect: DefectType, severityScore: number): number {
  const s = Math.max(0, Math.min(1, severityScore))

  switch (defect) {
    case 'cracked_tiles':
      return 70 + s * 29 // 70–99
    case 'paint_peeling':
      return 40 + s * 29 // 40–69
    case 'spalling':
      return 60 + s * 39 // 60–99
    case 'stagnant_water':
      return 60 + s * 39 // 60–99
  }
}
