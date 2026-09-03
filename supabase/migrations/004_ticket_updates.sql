-- DefectFlow schema: ticket_updates
--
-- The activity timeline shown on the right side of a ticket: system
-- events (submitted, routed), status changes, and staff notes.

create table public.ticket_updates (
  id bigint generated always as identity primary key,
  complaint_id uuid not null references public.complaints(id) on delete cascade,

  actor_id uuid references auth.users(id),
  actor_name text,

  type text not null check (type in ('system', 'status', 'staff_note')),
  message text,

  old_status public.complaint_status,
  new_status public.complaint_status,

  created_at timestamptz not null default now()
);

alter table public.ticket_updates enable row level security;
