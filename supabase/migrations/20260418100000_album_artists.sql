-- Many-to-many: album ↔ artists (collaborations). albums.artist_id stays denormalized "primary" (first credit by sort_order).

create table if not exists speu.album_artists (
  album_id uuid not null references speu.albums (id) on delete cascade,
  artist_id uuid not null references speu.artists (id) on delete cascade,
  sort_order int not null default 0,
  primary key (album_id, artist_id)
);

create index if not exists idx_album_artists_artist on speu.album_artists (artist_id);
create index if not exists idx_album_artists_album_sort on speu.album_artists (album_id, sort_order);

insert into speu.album_artists (album_id, artist_id, sort_order)
select id, artist_id, 0
from speu.albums
where artist_id is not null
on conflict (album_id, artist_id) do nothing;

-- Deleting one credited artist must not drop the whole album (multi-artist releases).
alter table speu.albums drop constraint if exists albums_artist_id_fkey;
alter table speu.albums alter column artist_id drop not null;
alter table speu.albums
  add constraint albums_artist_id_fkey
  foreign key (artist_id) references speu.artists (id) on delete set null;

create or replace function speu.refresh_album_primary_artist(p_album_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _aid uuid;
begin
  select aa.artist_id into _aid
  from speu.album_artists aa
  where aa.album_id = p_album_id
  order by aa.sort_order asc, aa.artist_id asc
  limit 1;

  update speu.albums b
  set artist_id = _aid
  where b.id = p_album_id;
end;
$$;

create or replace function speu.album_artists_touch_primary()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  aid uuid;
begin
  if tg_op = 'DELETE' then
    aid := old.album_id;
  else
    aid := new.album_id;
  end if;

  perform speu.refresh_album_primary_artist(aid);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_album_artists_primary on speu.album_artists;
create trigger trg_album_artists_primary
after insert or update or delete on speu.album_artists
for each row execute function speu.album_artists_touch_primary();

-- Refresh primaries once (in case order differs from legacy artist_id).
do $$
declare
  r record;
begin
  for r in select distinct album_id from speu.album_artists loop
    perform speu.refresh_album_primary_artist(r.album_id);
  end loop;
end $$;

create or replace function speu.album_is_published(_album_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select b.is_published from speu.albums b where b.id = _album_id),
    false
  );
$$;

grant execute on function speu.album_is_published(uuid) to anon, authenticated;

alter table speu.album_artists enable row level security;

drop policy if exists public_read_album_artists on speu.album_artists;
create policy public_read_album_artists on speu.album_artists
for select to anon, authenticated
using (
  speu.is_admin(auth.uid())
  or speu.album_is_published(album_id)
);

drop policy if exists admin_manage_album_artists on speu.album_artists;
create policy admin_manage_album_artists on speu.album_artists
for all to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));

grant select on speu.album_artists to anon, authenticated;
grant insert, update, delete on speu.album_artists to authenticated;
