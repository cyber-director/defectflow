// Turns a raw Detection[] into the single AnalysisResult the rest of
// the app cares about. See CLAUDE.md §22 (multiple visible defects).
//
// Shared by the stub detector and the real ONNX detector, and by both
// the browser preview and the server-authoritative path, so the
// "which defect wins" rule only lives in one place.

import { categoryFor } from '@/config/defects'
import { calculateSeverityScore, severityLabelFor } from '@/lib/priority/severity'
import { calculatePriority, PRIORITY_VERSION } from '@/lib/priority/calculate'
import type { AnalysisResult, Detection, DetectorOutput, DefectType } from '@/types/domain'

export interface AggregateOptions {
  modelVersion: string
  modelHash?: string
  inferenceMs?: number
}

export function aggregateDetections(
  detections: Detection[],
  options: AggregateOptions
): DetectorOutput {
  if (detections.length === 0) {
    return { detections: [], primaryDefect: null, reason: 'no_confident_detection' }
  }

  const byClass = new Map<DefectType, Detection[]>()
  for (const d of detections) {
    const list = byClass.get(d.defect) ?? []
    list.push(d)
    byClass.set(d.defect, list)
  }

  const classSummaries = Array.from(byClass.entries()).map(([defect, group]) => ({
    defect,
    totalExtent: Math.min(1, group.reduce((sum, d) => sum + d.areaRatio, 0)),
    largestRegion: Math.max(...group.map((d) => d.areaRatio)),
    count: group.length,
    maxConfidence: Math.max(...group.map((d) => d.confidence)),
  }))

  // Domain rule, not just "biggest area wins": within Performance,
  // cracked_tiles always outranks paint_peeling regardless of visible
  // extent (CLAUDE.md §21/§22). Outside that pair, the class with the
  // largest total visible extent is primary; ties break on confidence.
  classSummaries.sort((a, b) => {
    if (a.defect === 'cracked_tiles' && b.defect === 'paint_peeling') return -1
    if (a.defect === 'paint_peeling' && b.defect === 'cracked_tiles') return 1
    if (b.totalExtent !== a.totalExtent) return b.totalExtent - a.totalExtent
    return b.maxConfidence - a.maxConfidence
  })

  const primary = classSummaries[0]
  const severityScore = calculateSeverityScore({
    visibleExtent: primary.totalExtent,
    largestRegion: primary.largestRegion,
    detectionCount: primary.count,
  })

  const result: AnalysisResult = {
    detections,
    primaryDefect: primary.defect,
    category: categoryFor(primary.defect),
    confidence: primary.maxConfidence,
    visibleExtent: primary.totalExtent,
    largestRegion: primary.largestRegion,
    detectionCount: primary.count,
    severityScore,
    severityLabel: severityLabelFor(severityScore),
    priorityScore: calculatePriority(primary.defect, severityScore),
    modelVersion: options.modelVersion,
    modelHash: options.modelHash,
    priorityVersion: PRIORITY_VERSION,
    inferenceMs: options.inferenceMs,
  }

  return result
}
