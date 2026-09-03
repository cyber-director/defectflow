-- DefectFlow schema: triggers
--
-- 1. handle_new_user      — creates a `profiles` row for every new
--                            auth.users signup. Always role='user'; staff
--                            profiles are only ever promoted by the
--                            service-role seed script, never by this
--                            trigger, so a public signup can never grant
--                            itself staff access.
-- 2. set_updated_at       — keeps complaints.updated_at current.
-- 3. handle_status_change — on a status transition, stamps/clears
--                            resolved_at and writes the corresponding
--                            'status' row into ticket_updates, so every
--                            route handler that changes status gets a
--                            timeline entry for free instead of
--                            duplicating that insert in application code.

-- ─── 1. profile creation ────────────────────────────────────────────────

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, staff_category)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'user',
    null
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 2. updated_at bookkeeping ──────────────────────────────────────────

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger complaints_set_updated_at
  before update on public.complaints
  for each row execute function public.set_updated_at();

-- ─── 3. status-change activity + resolved_at ────────────────────────────

create function public.handle_status_change()
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

    insert into public.ticket_updates (
      complaint_id, actor_id, actor_name, type, old_status, new_status
    ) values (
      new.id, new.assigned_staff_id, null, 'status', old.status, new.status
    );
  end if;

  return new;
end;
$$;

create trigger complaints_status_change
  before update on public.complaints
  for each row execute function public.handle_status_change();
