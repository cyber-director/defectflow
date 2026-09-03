-- DefectFlow schema: profiles
--
-- Every auth.users row gets exactly one profiles row. Public signup always
-- produces role='user'. Staff role/category is only ever set by the
-- trusted seed script (scripts/seed-staff.ts) using the service-role key.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'user',
  staff_category public.staff_category,
  created_at timestamptz not null default now(),

  constraint profiles_staff_category_check check (
    (role = 'user' and staff_category is null)
    or
    (role = 'staff' and staff_category is not null)
  )
);

alter table public.profiles enable row level security;
