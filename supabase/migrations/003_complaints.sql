-- DefectFlow schema: complaints
--
-- One row per submitted defect report. AI-derived fields
-- (detected_defect, category, severity_*, priority_score, model_*) are
-- only ever written by trusted server code (route handlers using the
-- Supabase server/admin clients) — never directly from the browser.
-- See migration 006_rls.sql for the enforcement.

create table public.complaints (
  id uuid primary key default gen_random_uuid(),

  reporter_id uuid not null references auth.users(id) on delete cascade,
  reporter_name text not null,
  location text not null,
  description text not null,

  image_path text not null,
  thumbnail_path text not null,

  detected_defect public.defect_type not null,
  category public.staff_category not null,

  confidence real not null check (confidence >= 0 and confidence <= 1),
  visible_extent real not null check (visible_extent >= 0 and visible_extent <= 1),
  largest_region real not null default 0 check (largest_region >= 0 and largest_region <= 1),
  detection_count integer not null default 1 check (detection_count >= 0),

  severity_score real not null check (severity_score >= 0 and severity_score <= 1),
  severity_label public.severity_label not null,
  priority_score real not null,

  detections jsonb not null default '[]'::jsonb,

  status public.complaint_status not null default 'Submitted',
  assigned_staff_id uuid references auth.users(id),

  model_version text not null,
  model_hash text,
  priority_version text not null default 'extent-v1',

  inference_ms integer,
  processing_ms integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.complaints enable row level security;
