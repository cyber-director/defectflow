// Supabase (without generated types) returns raw snake_case rows
// matching the actual Postgres columns. Every page/component in this
// app works with the camelCase domain types from src/types/domain.ts
// instead — these two functions are the only place that translation
// happens, including for Realtime payloads (payload.new is also a raw
// row, so pass it through the matching mapper before using it).

import type { Complaint, TicketUpdate } from '@/types/domain'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapComplaint(row: any): Complaint {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name,
    location: row.location,
    description: row.description,
    imagePath: row.image_path,
    thumbnailPath: row.thumbnail_path,
    detectedDefect: row.detected_defect,
    category: row.category,
    confidence: row.confidence,
    visibleExtent: row.visible_extent,
    largestRegion: row.largest_region,
    detectionCount: row.detection_count,
    severityScore: row.severity_score,
    severityLabel: row.severity_label,
    priorityScore: row.priority_score,
    detections: row.detections ?? [],
    status: row.status,
    assignedStaffId: row.assigned_staff_id,
    assignedStaffName: row.assigned_staff_name,
    modelVersion: row.model_version,
    modelHash: row.model_hash,
    priorityVersion: row.priority_version,
    inferenceMs: row.inference_ms,
    processingMs: row.processing_ms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTicketUpdate(row: any): TicketUpdate {
  return {
    id: row.id,
    complaintId: row.complaint_id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    type: row.type,
    message: row.message,
    oldStatus: row.old_status,
    newStatus: row.new_status,
    createdAt: row.created_at,
  }
}
