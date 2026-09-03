-- Multi-staff support.
--
-- 1. The original complaints_status_change trigger (008_triggers.sql)
--    wrote every status-change timeline entry with
--    actor_id = complaints.assigned_staff_id. That was harmless with
--    exactly one staff member per category, but wrong the moment a
--    second one exists: whoever actually clicks "Start work" or "Mark
--    resolved" isn't necessarily the same person who originally
--    claimed the ticket. The API route handler knows exactly who is
--    calling it, so attribution now happens there instead — this
--    trigger goes back to only managing resolved_at.
--
-- 2. assigned_staff_name is a denormalized copy of the assigned
--    staff member's name (same pattern as complaints.reporter_name),
--    set once at assignment time, so the UI can show "Assigned to: X"
--    without every viewer needing read access to other staff members'
--    profile rows.

create or replace function public.handle_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'Resolved' then
      new.resolved_at = now();
    else
      new.resolved_at = null;
    end if;
  end if;

  return new;
end;
$$;

alter table public.complaints
  add column assigned_staff_name text;
