// Visible-severity scoring. See CLAUDE.md §20.
//
// Deliberately does NOT use model confidence — confidence measures how
// sure the model is, not how physically severe the defect looks. These
// thresholds are a documented starting point; recalibrate them once you
// have real evaluation-set metrics (see ml/scripts/evaluate.py and the
// "Evaluation results" section of the final report).

import type { SeverityLabel } from '@/types/domain'

export interface SeverityInput {
  visibleExtent: number // 0-1, fraction of image area
  largestRegion: number // 0-1, area ratio of the single largest box
  detectionCount: number
}

export function calculateSeverityScore({
  visibleExtent,
  largestRegion,
  detectionCount,
}: SeverityInput): number {
  const extentScore = Math.min(visibleExtent / 0.35, 1)
  const largestRegionScore = Math.min(largestRegion / 0.25, 1)
  const countScore = Math.min(detectionCount / 4, 1)

  return 0.7 * extentScore + 0.2 * largestRegionScore + 0.1 * countScore
}

export function severityLabelFor(severityScore: number): SeverityLabel {
  if (severityScore < 0.33) return 'Low'
  if (severityScore < 0.66) return 'Medium'
  return 'High'
}
