-- Аператарскія запыты для дыягностыкі праслухоўванняў (Supabase SQL editor).
-- Падстаўце UUID трэка замест :track_id.

-- 1) Ці запісваюцца сесіі для трэка (тое самае, што record_listen_terminal)
-- select speu.track_is_publicly_likeable(':track_id'::uuid);

-- 2) Апублікаванасць і даўжыня (расход duration_sec з плеерам дае duration_mismatch)
-- select id, title, slug, is_published, duration_sec
-- from speu.artist_tracks
-- where id = ':track_id'::uuid;

-- 3) Апублікаваныя артысты ў крэдытах
-- select a.id, a.name, a.status
-- from speu.track_artists ta
-- join speu.artists a on a.id = ta.artist_id
-- where ta.track_id = ':track_id'::uuid;

-- 4) Апошнія сыравінныя сесіі
-- select listening_session_id, created_at, qualifies_full, qualifies_partial
-- from speu.listen_outcomes
-- where track_id = ':track_id'::uuid
-- order by created_at desc
-- limit 30;

-- 5) Дзённыя агрэгаты (Minsk)
-- select day_minsk, full_total, partial_total, full_to_chart, partial_to_chart
-- from speu.track_listen_by_day_minsk
-- where track_id = ':track_id'::uuid
-- order by day_minsk desc
-- limit 60;

-- 6) Рэкансіліяцыя: сума сесій з outcomes па дні Minsk vs радок агрэгата
-- with day_from_outcomes as (
--   select
--     track_id,
--     (created_at at time zone 'Europe/Minsk')::date as day_minsk,
--     count(*) filter (where qualifies_full) as full_n,
--     count(*) filter (where qualifies_partial and not qualifies_full) as partial_n
--   from speu.listen_outcomes
--   where track_id = ':track_id'::uuid
--   group by 1, 2
-- )
-- select
--   d.day_minsk,
--   d.full_n,
--   d.partial_n,
--   coalesce(a.full_total, 0) as agg_full,
--   coalesce(a.partial_total, 0) as agg_partial
-- from day_from_outcomes d
-- left join speu.track_listen_by_day_minsk a
--   on a.track_id = d.track_id and a.day_minsk = d.day_minsk
-- where d.full_n != coalesce(a.full_total, 0)
--    or d.partial_n != coalesce(a.partial_total, 0)
-- order by d.day_minsk desc;
