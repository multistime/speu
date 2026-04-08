-- Aggregated listen analytics for the linked artist (cabinet). Uses security definer + auth.uid().

create index if not exists idx_speu_track_listen_by_track
  on speu.track_listen_by_day_minsk (track_id);

create or replace function speu.artist_listen_dashboard(p_period_days integer default 28)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_artist_id uuid;
  v_days int;
  v_end date;
  v_start date;
  v_prev_end date;
  v_prev_start date;
  v_t_start timestamptz;
  v_t_end_excl timestamptz;
  v_pt_start timestamptz;
  v_pt_end_excl timestamptz;
  r jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  v_days := coalesce(nullif(p_period_days, 0), 28);
  if v_days < 1 then
    v_days := 1;
  end if;
  if v_days > 366 then
    v_days := 366;
  end if;

  select a.id into v_artist_id
  from speu.artists a
  where a.user_id = v_uid
  limit 1;

  if v_artist_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_artist');
  end if;

  v_end := (timezone('Europe/Minsk', now()))::date;
  v_start := v_end - (v_days - 1);
  v_prev_end := v_start - 1;
  v_prev_start := v_prev_end - (v_days - 1);

  v_t_start := (v_start::timestamp AT TIME ZONE 'Europe/Minsk');
  v_t_end_excl := ((v_end + 1)::timestamp AT TIME ZONE 'Europe/Minsk');
  v_pt_start := (v_prev_start::timestamp AT TIME ZONE 'Europe/Minsk');
  v_pt_end_excl := ((v_prev_end + 1)::timestamp AT TIME ZONE 'Europe/Minsk');

  with my_tracks as (
    select distinct x.track_id
    from (
      select t.id as track_id
      from speu.artist_tracks t
      where t.artist_id = v_artist_id
      union
      select ta.track_id
      from speu.track_artists ta
      where ta.artist_id = v_artist_id
    ) x
  ),
  daily as (
    select
      l.day_minsk::text as d,
      sum(l.full_total)::bigint as full_c,
      sum(l.partial_total)::bigint as part_c
    from speu.track_listen_by_day_minsk l
    inner join my_tracks m on m.track_id = l.track_id
    where l.day_minsk between v_start and v_end
    group by l.day_minsk
  ),
  summary_now as (
    select
      coalesce(sum(l.full_total), 0)::bigint as full_c,
      coalesce(sum(l.partial_total), 0)::bigint as part_c
    from speu.track_listen_by_day_minsk l
    inner join my_tracks m on m.track_id = l.track_id
    where l.day_minsk between v_start and v_end
  ),
  summary_prev as (
    select
      coalesce(sum(l.full_total), 0)::bigint as full_c,
      coalesce(sum(l.partial_total), 0)::bigint as part_c
    from speu.track_listen_by_day_minsk l
    inner join my_tracks m on m.track_id = l.track_id
    where l.day_minsk between v_prev_start and v_prev_end
  ),
  uniq_now as (
    select count(*)::bigint as c
    from (
      select distinct case
        when o.user_id is not null then 'u:' || o.user_id::text
        else 'a:' || o.anon_listener_id::text
      end as lid
      from speu.listen_outcomes o
      inner join my_tracks m on m.track_id = o.track_id
      where o.created_at >= v_t_start and o.created_at < v_t_end_excl
    ) s
  ),
  uniq_prev as (
    select count(*)::bigint as c
    from (
      select distinct case
        when o.user_id is not null then 'u:' || o.user_id::text
        else 'a:' || o.anon_listener_id::text
      end as lid
      from speu.listen_outcomes o
      inner join my_tracks m on m.track_id = o.track_id
      where o.created_at >= v_pt_start and o.created_at < v_pt_end_excl
    ) s
  ),
  tracks_base as (
    select
      t.id,
      t.title,
      t.slug,
      coalesce(t.like_count, 0)::int as like_count
    from speu.artist_tracks t
    inner join my_tracks m on m.track_id = t.id
  ),
  period_by_track as (
    select
      l.track_id,
      sum(l.full_total)::bigint as p_full,
      sum(l.partial_total)::bigint as p_part
    from speu.track_listen_by_day_minsk l
    inner join my_tracks m on m.track_id = l.track_id
    where l.day_minsk between v_start and v_end
    group by l.track_id
  ),
  alltime_by_track as (
    select
      l.track_id,
      sum(l.full_total)::bigint as a_full,
      sum(l.partial_total)::bigint as a_part
    from speu.track_listen_by_day_minsk l
    inner join my_tracks m on m.track_id = l.track_id
    group by l.track_id
  ),
  tracks_agg as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', tb.id,
          'title',
          case
            when btrim(coalesce(tb.title, '')) = '' then 'Без назвы'
            else tb.title
          end,
          'slug', tb.slug,
          'like_count', tb.like_count,
          'period_full', coalesce(pb.p_full, 0),
          'period_partial', coalesce(pb.p_part, 0),
          'all_full', coalesce(ab.a_full, 0),
          'all_partial', coalesce(ab.a_part, 0)
        )
        order by (coalesce(pb.p_full, 0) + coalesce(pb.p_part, 0)) desc,
          case
            when btrim(coalesce(tb.title, '')) = '' then 'Без назвы'
            else tb.title
          end
      ),
      '[]'::jsonb
    ) as j
    from tracks_base tb
    left join period_by_track pb on pb.track_id = tb.id
    left join alltime_by_track ab on ab.track_id = tb.id
  ),
  daily_agg as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('d', d, 'full', full_c, 'partial', part_c)
        order by d
      ),
      '[]'::jsonb
    ) as j
    from daily
  )
  select jsonb_build_object(
    'ok', true,
    'period_days', v_days,
    'range', jsonb_build_object('start', v_start, 'end', v_end),
    'prev_range', jsonb_build_object('start', v_prev_start, 'end', v_prev_end),
    'summary', jsonb_build_object(
      'full_listens', (select full_c from summary_now),
      'partial_listens', (select part_c from summary_now),
      'total_sessions', (select full_c + part_c from summary_now),
      'unique_listeners', (select c from uniq_now),
      'prev_full_listens', (select full_c from summary_prev),
      'prev_partial_listens', (select part_c from summary_prev),
      'prev_total_sessions', (select full_c + part_c from summary_prev),
      'prev_unique_listeners', (select c from uniq_prev)
    ),
    'daily', (select j from daily_agg),
    'tracks', (select j from tracks_agg)
  )
  into r;

  return r;
end;
$$;

comment on function speu.artist_listen_dashboard(integer) is
  'Cabinet: listen KPIs, daily series, per-track totals for the artist linked to auth.uid().';

revoke all on function speu.artist_listen_dashboard(integer) from public;
grant execute on function speu.artist_listen_dashboard(integer) to authenticated;
