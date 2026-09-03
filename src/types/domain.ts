// DefectFlow domain types.
//
// These types are the contract shared by:
//   - the ML/inference layer (browser + server)
//   - the priority/severity calculators
//   - the Supabase data layer
//   - every UI component
//
// Keep this file dependency-free (no Supabase/ONNX imports) so it can be
// safely imported from client components, server components, and route
// handlers alike.

export type DefectType =
  | 'spalling'
  | 'stagnant_water'
  | 'cracked_tiles'
  | 'paint_peeling'

export type StaffCategory = 'Structural' | 'Functional' | 'Performance'

export type ComplaintStatus =
  | 'Submitted'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'

export type SeverityLabel = 'Low' | 'Medium' | 'High'

export type UserRole = 'user' | 'staff'

// ─── Inference ───────────────────────────────────────────────────────────

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

/** A single raw detection from the ONNX model, in normalized [0,1] image
 *  coordinates so it is resolution-independent. */
export interface Detection {
  defect: DefectType
  confidence: number
  box: BoundingBox
  /** Fraction of total image area covered by this detection's box. */
  areaRatio: number
}

/**
 * The full result of running the detector on one photograph, after
 * postprocessing (NMS, thresholding) and after severity/priority have
 * been derived from the detections.
 *
 * This is the exact shape returned by both `analyzeImageInBrowser()` and
 * `analyzeImageOnServer()` — they must agree, because only the server
 * result is ever persisted.
 */
export interface AnalysisResult {
  detections: Detection[]

  /** The single defect chosen for routing/category/priority purposes. */
  primaryDefect: DefectType
  category: StaffCategory
  confidence: number

  /** Visible extent of the primary defect as a fraction of image area (0-1). */
  visibleExtent: number
  /** Area ratio of the single largest detection box for the primary defect. */
  largestRegion: number
  /** Count of valid (post-threshold) detections for the primary defect. */
  detectionCount: number

  severityScore: number
  severityLabel: SeverityLabel
  priorityScore: number

  modelVersion: string
  modelHash?: string
  priorityVersion: string

  inferenceMs?: number
}

/** Returned when no supported defect clears the confidence threshold. */
export interface NoDetectionResult {
  detections: []
  primaryDefect: null
  reason: 'no_confident_detection'
}

export type DetectorOutput = AnalysisResult | NoDetectionResult

export function hasDetection(
  result: DetectorOutput
): result is AnalysisResult {
  return result.primaryDefect !== null
}

// ─── Complaints / tickets ────────────────────────────────────────────────

export interface Complaint {
  id: string

  reporterId: string
  reporterName: string
  location: string
  description: string

  imagePath: string
  thumbnailPath: string

  detectedDefect: DefectType
  category: StaffCategory

  confidence: number
  visibleExtent: number
  largestRegion: number
  detectionCount: number

  severityScore: number
  severityLabel: SeverityLabel
  priorityScore: number

  detections: Detection[]

  status: ComplaintStatus
  assignedStaffId: string | null
  assignedStaffName: string | null

  modelVersion: string
  modelHash: string | null
  priorityVersion: string

  inferenceMs: number | null
  processingMs: number | null

  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

export type TicketUpdateType = 'system' | 'status' | 'staff_note'

export interface TicketUpdate {
  id: number
  complaintId: string
  actorId: string | null
  actorName: string | null
  type: TicketUpdateType
  message: string | null
  oldStatus: ComplaintStatus | null
  newStatus: ComplaintStatus | null
  createdAt: string
}

export interface Profile {
  id: string
  fullName: string
  role: UserRole
  staffCategory: StaffCategory | null
  createdAt: string
}

// ─── Status state machine ────────────────────────────────────────────────

export const STATUS_FLOW: Record<ComplaintStatus, ComplaintStatus[]> = {
  Submitted: ['Assigned'],
  Assigned: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: [],
}

export function canTransition(
  from: ComplaintStatus,
  to: ComplaintStatus
): boolean {
  return STATUS_FLOW[from].includes(to)
}
