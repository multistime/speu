-- Fix infinite RLS recursion between speu.artist_tracks and speu.track_artists:
-- each policy subquery touched the other table, re-triggering policies.
-- SECURITY DEFINER helpers read underlying rows without re-evaluating those policies.

create or replace function speu.track_is_published(_track_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select t.is_published from speu.artist_tracks t where t.id = _track_id),
    false
  );
$$;

create or replace function speu.track_has_published_credited_artist(_track_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from speu.track_artists ta
    inner join speu.artists a on a.id = ta.artist_id
    where ta.track_id = _track_id
      and a.status = 'published'
  );
$$;

grant execute on function speu.track_is_published(uuid) to anon, authenticated;
grant execute on function speu.track_has_published_credited_artist(uuid) to anon, authenticated;

drop policy if exists public_read_artist_tracks on speu.artist_tracks;
create policy public_read_artist_tracks on speu.artist_tracks
for select to anon, authenticated
using (
  speu.is_admin(auth.uid())
  or (
    is_published = true
    and speu.track_has_published_credited_artist(id)
  )
);

drop policy if exists public_read_track_artists on speu.track_artists;
create policy public_read_track_artists on speu.track_artists
for select to anon, authenticated
using (
  speu.is_admin(auth.uid())
  or (
    speu.track_is_published(track_id)
    and speu.track_has_published_credited_artist(track_id)
  )
);
