-- Many-to-many: track ↔ artists (credits / collaborations). Keeps artist_tracks.artist_id as denormalized "primary" (first credit).
create table if not exists speu.track_artists (
  track_id uuid not null references speu.artist_tracks (id) on delete cascade,
  artist_id uuid not null references speu.artists (id) on delete cascade,
  sort_order int not null default 0,
  primary key (track_id, artist_id)
);

create index if not exists idx_track_artists_artist on speu.track_artists (artist_id);
create index if not exists idx_track_artists_track_sort on speu.track_artists (track_id, sort_order);

insert into speu.track_artists (track_id, artist_id, sort_order)
select id, artist_id, 0
from speu.artist_tracks
on conflict (track_id, artist_id) do nothing;

-- 1:1 auth user ↔ label artist (cabinet / future analytics)
alter table speu.artists add column if not exists user_id uuid unique references auth.users (id) on delete set null;
create index if not exists idx_artists_user_id on speu.artists (user_id);

create or replace function speu.refresh_track_primary_artist(p_track_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _aid uuid;
begin
  select ta.artist_id into _aid
  from speu.track_artists ta
  where ta.track_id = p_track_id
  order by ta.sort_order asc, ta.artist_id asc
  limit 1;

  if _aid is null then
    return;
  end if;

  update speu.artist_tracks t
  set artist_id = _aid
  where t.id = p_track_id;
end;
$$;

create or replace function speu.track_artists_touch_primary()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  tid uuid;
begin
  if tg_op = 'DELETE' then
    tid := old.track_id;
  else
    tid := new.track_id;
  end if;

  perform speu.refresh_track_primary_artist(tid);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_track_artists_primary on speu.track_artists;
create trigger trg_track_artists_primary
after insert or update or delete on speu.track_artists
for each row execute function speu.track_artists_touch_primary();

-- Refresh primaries once after backfill (trigger already ran per row on insert migration — safe to noop)
update speu.artist_tracks t
set artist_id = coalesce(
  (select ta.artist_id
   from speu.track_artists ta
   where ta.track_id = t.id
   order by ta.sort_order asc, ta.artist_id asc
   limit 1),
  t.artist_id
);

-- Public visibility: published track + at least one published credited artist
drop policy if exists public_read_artist_tracks on speu.artist_tracks;
create policy public_read_artist_tracks on speu.artist_tracks
for select to anon, authenticated
using (
  speu.is_admin(auth.uid())
  or (
    is_published = true
    and exists (
      select 1
      from speu.track_artists ta
      inner join speu.artists a on a.id = ta.artist_id
      where ta.track_id = artist_tracks.id
        and a.status = 'published'
    )
  )
);

alter table speu.track_artists enable row level security;

drop policy if exists public_read_track_artists on speu.track_artists;
create policy public_read_track_artists on speu.track_artists
for select to anon, authenticated
using (
  speu.is_admin(auth.uid())
  or (
    exists (
      select 1
      from speu.artist_tracks t
      where t.id = track_artists.track_id
        and t.is_published = true
        and exists (
          select 1
          from speu.track_artists ta2
          inner join speu.artists a on a.id = ta2.artist_id
          where ta2.track_id = t.id
            and a.status = 'published'
        )
    )
  )
);

drop policy if exists admin_manage_track_artists on speu.track_artists;
create policy admin_manage_track_artists on speu.track_artists
for all to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));
