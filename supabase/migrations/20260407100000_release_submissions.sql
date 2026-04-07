-- Artist release submissions (cabinet → label moderation)

create or replace function speu.my_artist_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select a.id
  from speu.artists a
  where a.user_id = auth.uid()
  limit 1;
$$;

revoke all on function speu.my_artist_id() from public;
grant execute on function speu.my_artist_id() to authenticated;

-- OUT/return shape changed vs 20260403190000; REPLACE alone is not allowed in Postgres.
drop function if exists public.get_my_speu_profile();

create function public.get_my_speu_profile()
returns table(id uuid, display_name text, is_admin boolean, is_artist boolean, artist_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.display_name,
    (
      coalesce(p.is_admin, false)
      or exists (
        select 1
        from speu.user_roles ur
        join speu.roles r on r.id = ur.role_id
        where ur.user_id = auth.uid()
          and r.code in ('owner', 'admin')
          and (ur.expires_at is null or ur.expires_at > now())
      )
    ) as is_admin,
    (speu.my_artist_id() is not null) as is_artist,
    speu.my_artist_id() as artist_id
  from speu.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.get_my_speu_profile() from public;
grant execute on function public.get_my_speu_profile() to authenticated;

create table if not exists speu.release_submissions (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references speu.artists (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  release_kind text not null default 'single' check (release_kind in ('single', 'album')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'needs_changes', 'approved', 'rejected')),
  title text not null default '',
  cover_url text,
  cover_storage_path text,
  artist_note text,
  moderator_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_release_submissions_artist_updated
  on speu.release_submissions (artist_id, updated_at desc);

create index if not exists idx_release_submissions_status_created
  on speu.release_submissions (status, created_at desc);

create table if not exists speu.release_submission_tracks (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references speu.release_submissions (id) on delete cascade,
  sort_order int not null,
  title text not null default '',
  audio_url text,
  audio_storage_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_release_submission_tracks_sub_sort
  on speu.release_submission_tracks (submission_id, sort_order);

drop trigger if exists set_release_submissions_updated_at on speu.release_submissions;
create trigger set_release_submissions_updated_at
before update on speu.release_submissions
for each row execute function speu.set_updated_at();

drop trigger if exists set_release_submission_tracks_updated_at on speu.release_submission_tracks;
create trigger set_release_submission_tracks_updated_at
before update on speu.release_submission_tracks
for each row execute function speu.set_updated_at();

alter table speu.release_submissions enable row level security;
alter table speu.release_submission_tracks enable row level security;
