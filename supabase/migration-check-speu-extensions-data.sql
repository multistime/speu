-- Даныя: запусціце пасля ЧАСЦІ 1, калі table_track_artists = ok.
-- Інакш будзе памылка «relation does not exist».

select 'count_artist_tracks' as check_name, 'ok' as status, count(*)::text as detail from speu.artist_tracks
union all
select 'count_track_artists_rows', 'ok', count(*)::text from speu.track_artists
union all
select
  'tracks_without_track_artists_row',
  case when count(*) = 0 then 'ok' else 'warn' end,
  count(*)::text || ' tracks lack speu.track_artists (backfill needed)'
from speu.artist_tracks t
where not exists (select 1 from speu.track_artists ta where ta.track_id = t.id);
