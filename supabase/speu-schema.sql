-- SPEU isolated schema in shared Supabase project.
-- Keeps existing app tables (e.g. mylinks.*) untouched.

create schema if not exists speu;

create table if not exists speu.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function speu.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_speu_profiles_updated_at on speu.profiles;
create trigger set_speu_profiles_updated_at
before update on speu.profiles
for each row
execute function speu.set_updated_at();

alter table speu.profiles enable row level security;

drop policy if exists "profile_owner_select" on speu.profiles;
create policy "profile_owner_select"
on speu.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profile_owner_update" on speu.profiles;
create policy "profile_owner_update"
on speu.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profile_owner_insert" on speu.profiles;
create policy "profile_owner_insert"
on speu.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- Auto-create row in speu.profiles after signup.
create or replace function speu.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into speu.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_speu on auth.users;
create trigger on_auth_user_created_speu
after insert on auth.users
for each row
execute procedure speu.handle_new_user();

-- Optional bootstrap: mark existing user as admin (replace UUID).
-- update speu.profiles set is_admin = true where id = '00000000-0000-0000-0000-000000000000';
