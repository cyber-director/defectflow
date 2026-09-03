-- DefectFlow schema: Row Level Security
--
-- Design (see CLAUDE.md §25):
--   - Users may read their own profile, their own complaints, and the
--     ticket_updates belonging to their own complaints.
--   - Staff may read their own profile and complaints/updates in their
--     assigned category only.
--   - No INSERT/UPDATE/DELETE policies are granted to the `authenticated`
--     role on complaints or ticket_updates. All writes to AI-derived
--     fields and all staff mutations happen through Next.js route
--     handlers that (a) verify the session/role server-side and then
--     (b) write using the service-role admin client, which bypasses RLS
--     by design. This keeps "browser cannot set its own severity/
--     priority/category" enforced at the database boundary, not just in
--     application code.

-- ─── profiles ───────────────────────────────────────────────────────────

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- No insert/update/delete policy for authenticated/anon: profile rows are
-- created only by the handle_new_user trigger (008_triggers.sql) and
-- modified only by the service-role seed script.

-- ─── complaints ─────────────────────────────────────────────────────────

create policy "complaints_select_own"
on public.complaints
for select
to authenticated
using (reporter_id = auth.uid());

create policy "complaints_select_staff_category"
on public.complaints
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'staff'
      and p.staff_category = complaints.category
  )
);

-- ─── ticket_updates ─────────────────────────────────────────────────────

create policy "ticket_updates_select_own_complaint"
on public.ticket_updates
for select
to authenticated
using (
  exists (
    select 1 from public.complaints c
    where c.id = ticket_updates.complaint_id
      and c.reporter_id = auth.uid()
  )
);

create policy "ticket_updates_select_staff_category"
on public.ticket_updates
for select
to authenticated
using (
  exists (
    select 1 from public.complaints c
    join public.profiles p on p.id = auth.uid()
    where c.id = ticket_updates.complaint_id
      and p.role = 'staff'
      and p.staff_category = c.category
  )
);
