-- DefectFlow schema: enum types
-- Run in the Supabase SQL Editor in filename order, or via `supabase db push`.

create type public.user_role as enum ('user', 'staff');

create type public.staff_category as enum (
  'Structural',
  'Functional',
  'Performance'
);

create type public.complaint_status as enum (
  'Submitted',
  'Assigned',
  'In Progress',
  'Resolved'
);

create type public.defect_type as enum (
  'spalling',
  'stagnant_water',
  'cracked_tiles',
  'paint_peeling'
);

create type public.severity_label as enum (
  'Low',
  'Medium',
  'High'
);
