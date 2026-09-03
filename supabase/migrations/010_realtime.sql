-- Enables Postgres Changes Realtime for the tables the UI subscribes
-- to (CLAUDE.md §27). Without this, .channel(...).on('postgres_changes', ...)
-- silently never fires — Supabase requires each table to be explicitly
-- added to the supabase_realtime publication.

alter publication supabase_realtime add table public.complaints;
alter publication supabase_realtime add table public.ticket_updates;
