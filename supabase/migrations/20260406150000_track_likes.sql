-- Лайкі трэкаў (карыстальнік ↔ трэк), для аўтарызаваных праз RLS

create or replace function speu.track_is_publicly_likeable(_track_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    speu.track_is_published(_track_id)
    and speu.track_has_published_credited_artist(_track_id),
    false
  );
$$;

grant execute on function speu.track_is_publicly_likeable(uuid) to anon, authenticated;

create table if not exists speu.track_likes (
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id uuid not null references speu.artist_tracks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create index if not exists idx_speu_track_likes_track_id
  on speu.track_likes (track_id);

alter table speu.track_likes enable row level security;

drop policy if exists track_likes_select_own on speu.track_likes;
create policy track_likes_select_own on speu.track_likes
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists track_likes_insert_own on speu.track_likes;
create policy track_likes_insert_own on speu.track_likes
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and speu.track_is_publicly_likeable(track_id)
);

drop policy if exists track_likes_delete_own on speu.track_likes;
create policy track_likes_delete_own on speu.track_likes
for delete to authenticated
using (user_id = (select auth.uid()));
