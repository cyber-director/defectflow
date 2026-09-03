import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeImageOnServer } from '@/lib/inference/server/detect'
import { hasDetection } from '@/types/domain'
import { labelFor } from '@/config/defects'

export const runtime = 'nodejs'

// The Option-B submission flow (CLAUDE.md §18): the browser only ever
// sends already-compressed images and its own (untrusted) preview. This
// route re-runs inference itself and that result — not anything the
// client claims — is what gets saved.
export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const formData = await request.formData()
  const reporterName = String(formData.get('reporterName') || '').trim()
  const location = String(formData.get('location') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const imageFile = formData.get('image')
  const thumbnailFile = formData.get('thumbnail')
  const clientRequestId = String(formData.get('clientRequestId') || '') || null

  if (!reporterName || !location || !description) {
    return NextResponse.json(
      { error: 'Name, location, and description are required.' },
      { status: 400 }
    )
  }
  if (!(imageFile instanceof File) || !(thumbnailFile instanceof File)) {
    return NextResponse.json({ error: 'A photo is required.' }, { status: 400 })
  }

  const requestStart = performance.now()
  const admin = createAdminClient()

  // Idempotency (CLAUDE.md §54): a retried/double-clicked submit with
  // the same client-generated ID returns the complaint already created
  // instead of making a duplicate.
  if (clientRequestId) {
    const { data: existing } = await admin
      .from('complaints')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('client_request_id', clientRequestId)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ id: existing.id, deduplicated: true })
    }
  }

  const [imageBuffer, thumbnailBuffer] = await Promise.all([
    imageFile.arrayBuffer().then((b) => Buffer.from(b)),
    thumbnailFile.arrayBuffer().then((b) => Buffer.from(b)),
  ])

  const complaintId = randomUUID()
  const imagePath = `${user.id}/${complaintId}/image.webp`
  const thumbnailPath = `${user.id}/${complaintId}/thumbnail.webp`

  // Inference and the Storage upload don't depend on each other — run
  // them concurrently (CLAUDE.md §18) rather than one after the other.
  const inferenceStart = performance.now()
  const [analysis, [imageUpload, thumbnailUpload]] = await Promise.all([
    analyzeImageOnServer(imageBuffer),
    Promise.all([
      admin.storage
        .from('complaint-images')
        .upload(imagePath, imageBuffer, { contentType: 'image/webp' }),
      admin.storage
        .from('complaint-images')
        .upload(thumbnailPath, thumbnailBuffer, { contentType: 'image/webp' }),
    ]),
  ])
  const inferenceMs = Math.round(performance.now() - inferenceStart)

  if (imageUpload.error || thumbnailUpload.error) {
    await admin.storage.from('complaint-images').remove([imagePath, thumbnailPath])
    return NextResponse.json(
      { error: 'Failed to store the photo. Please try again.' },
      { status: 500 }
    )
  }

  if (!hasDetection(analysis)) {
    // Never invent a classification just to make a ticket appear
    // (CLAUDE.md §40, §55).
    await admin.storage.from('complaint-images').remove([imagePath, thumbnailPath])
    return NextResponse.json(
      {
        error:
          'Unable to confidently identify a supported visible defect. Please submit a clearer photograph.',
      },
      { status: 422 }
    )
  }

  const { error: insertError } = await admin.from('complaints').insert({
    id: complaintId,
    reporter_id: user.id,
    reporter_name: reporterName,
    location,
    description,
    image_path: imagePath,
    thumbnail_path: thumbnailPath,
    detected_defect: analysis.primaryDefect,
    category: analysis.category,
    confidence: analysis.confidence,
    visible_extent: analysis.visibleExtent,
    largest_region: analysis.largestRegion,
    detection_count: analysis.detectionCount,
    severity_score: analysis.severityScore,
    severity_label: analysis.severityLabel,
    priority_score: analysis.priorityScore,
    detections: analysis.detections,
    model_version: analysis.modelVersion,
    model_hash: analysis.modelHash ?? null,
    priority_version: analysis.priorityVersion,
    inference_ms: analysis.inferenceMs ?? inferenceMs,
    processing_ms: Math.round(performance.now() - requestStart),
    client_request_id: clientRequestId,
  })

  if (insertError) {
    await admin.storage.from('complaint-images').remove([imagePath, thumbnailPath])
    return NextResponse.json(
      { error: 'Failed to save the complaint. Please try again.' },
      { status: 500 }
    )
  }

  // Initial timeline events. Later status-change events are written
  // automatically by the complaints_status_change trigger
  // (008_triggers.sql) — only these first three need to happen here.
  await admin.from('ticket_updates').insert([
    { complaint_id: complaintId, type: 'system', message: 'Complaint submitted' },
    {
      complaint_id: complaintId,
      type: 'system',
      message: `Automatically detected: ${labelFor(analysis.primaryDefect)} · ${analysis.category} · ${analysis.severityLabel}`,
    },
    { complaint_id: complaintId, type: 'system', message: `Routed to ${analysis.category} queue` },
  ])

  return NextResponse.json({ id: complaintId })
}
