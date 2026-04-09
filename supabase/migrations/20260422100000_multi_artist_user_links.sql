-- Many label artists can share the same auth user (cabinet). RLS uses user_owns_artist(artist_id).

-- ---- schema: drop 1:1 unique on artists.user_id --------------------------------
alter table speu.artists drop constraint if exists artists_user_id_key;

create index if not exists idx_artists_user_id on speu.artists (user_id);

-- ---- speu.user_owns_artist -----------------------------------------------------
create or replace function speu.user_owns_artist(p_artist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from speu.artists a
    where a.id = p_artist_id
      and a.user_id = (select auth.uid())
  );
$$;

revoke all on function speu.user_owns_artist(uuid) from public;
grant execute on function speu.user_owns_artist(uuid) to authenticated;

-- ---- release_submissions + storage RLS -----------------------------------------
drop policy if exists release_submissions_insert on speu.release_submissions;
create policy release_submissions_insert on speu.release_submissions
for insert to authenticated
with check (
  user_id = auth.uid()
  and speu.user_owns_artist(artist_id)
);

drop policy if exists release_submissions_update_artist on speu.release_submissions;
create policy release_submissions_update_artist on speu.release_submissions
for update to authenticated
using (user_id = auth.uid() and status in ('draft', 'needs_changes'))
with check (
  user_id = auth.uid()
  and speu.user_owns_artist(artist_id)
);

drop policy if exists "speu_audio_submission_draft_insert" on storage.objects;
create policy "speu_audio_submission_draft_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'speu-audio'
  and exists (select 1 from speu.artists a where a.user_id = auth.uid())
  and split_part(name, '/', 1) = 'submission-drafts'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "speu_audio_submission_draft_update" on storage.objects;
create policy "speu_audio_submission_draft_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'speu-audio'
  and exists (select 1 from speu.artists a where a.user_id = auth.uid())
  and split_part(name, '/', 1) = 'submission-drafts'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "speu_audio_submission_draft_delete" on storage.objects;
create policy "speu_audio_submission_draft_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'speu-audio'
  and exists (select 1 from speu.artists a where a.user_id = auth.uid())
  and split_part(name, '/', 1) = 'submission-drafts'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "speu_images_submission_draft_insert" on storage.objects;
create policy "speu_images_submission_draft_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'speu-images'
  and exists (select 1 from speu.artists a where a.user_id = auth.uid())
  and split_part(name, '/', 1) = 'submission-drafts'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "speu_images_submission_draft_update" on storage.objects;
create policy "speu_images_submission_draft_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'speu-images'
  and exists (select 1 from speu.artists a where a.user_id = auth.uid())
  and split_part(name, '/', 1) = 'submission-drafts'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "speu_images_submission_draft_delete" on storage.objects;
create policy "speu_images_submission_draft_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'speu-images'
  and exists (select 1 from speu.artists a where a.user_id = auth.uid())
  and split_part(name, '/', 1) = 'submission-drafts'
  and split_part(name, '/', 2) = auth.uid()::text
);

-- ---- artist_listen_dashboard: explicit artist + backward compat --------------
drop function if exists speu.artist_listen_dashboard(integer);

create or replace function speu.artist_listen_dashboard(
  p_period_days integer default 28,
  p_artist_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_artist_id uuid;
  v_link_count int;
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

  if p_artist_id is not null then
    if not speu.user_owns_artist(p_artist_id) then
      return jsonb_build_object('ok', false, 'error', 'forbidden');
    end if;
    v_artist_id := p_artist_id;
  else
    select count(*)::int into v_link_count
    from speu.artists a
    where a.user_id = v_uid;

    if v_link_count = 0 then
      return jsonb_build_object('ok', false, 'error', 'not_artist');
    elsif v_link_count > 1 then
      return jsonb_build_object('ok', false, 'error', 'artist_required');
    end if;

    select a.id into v_artist_id
    from speu.artists a
    where a.user_id = v_uid
    limit 1;
  end if;

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

comment on function speu.artist_listen_dashboard(integer, uuid) is
  'Cabinet: listen KPIs for an artist owned by auth.uid(). Pass p_artist_id when user has multiple links.';

revoke all on function speu.artist_listen_dashboard(integer, uuid) from public;
grant execute on function speu.artist_listen_dashboard(integer, uuid) to authenticated;

-- ---- get_my_speu_profile: linked_artists ---------------------------------------
drop function if exists public.get_my_speu_profile();

create function public.get_my_speu_profile()
returns table(
  id uuid,
  display_name text,
  is_admin boolean,
  is_artist boolean,
  artist_id uuid,
  linked_artists jsonb,
  player_queue_repeat_mode text,
  player_queue_shuffle boolean,
  player_single_repeat boolean
)
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
    exists (
      select 1 from speu.artists a2 where a2.user_id = auth.uid()
    ) as is_artist,
    (
      select a3.id
      from speu.artists a3
      where a3.user_id = auth.uid()
      order by a3.name asc
      limit 1
    ) as artist_id,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('id', a4.id, 'name', a4.name, 'slug', a4.slug)
          order by a4.name
        )
        from speu.artists a4
        where a4.user_id = auth.uid()
      ),
      '[]'::jsonb
    ) as linked_artists,
    p.player_queue_repeat_mode,
    p.player_queue_shuffle,
    p.player_single_repeat
  from speu.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.get_my_speu_profile() from public;
grant execute on function public.get_my_speu_profile() to authenticated;
