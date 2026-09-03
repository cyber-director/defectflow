-- Duplicate-submission protection. See CLAUDE.md §54.
--
-- The client generates one UUID per submit attempt. If a network retry
-- or double-click sends the same request twice, the second insert with
-- the same (reporter_id, client_request_id) pair is rejected by this
-- unique index, and the route handler treats that as "already created"
-- instead of making a duplicate complaint.

alter table public.complaints
  add column client_request_id uuid;

create unique index complaints_client_request_id_idx
  on public.complaints (reporter_id, client_request_id)
  where client_request_id is not null;
