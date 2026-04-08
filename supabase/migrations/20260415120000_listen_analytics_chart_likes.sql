-- Listen outcomes, daily rollups (Europe/Minsk), chart snapshots, like_count

alter table speu.artist_tracks
  add column if not exists like_count integer not null default 0;

create or replace function speu.bump_track_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update speu.artist_tracks set like_count = like_count + 1 where id = new.track_id;
    return new;
  elsif tg_op = 'DELETE' then
    update speu.artist_tracks
    set like_count = greatest(0, like_count - 1)
    where id = old.track_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_speu_track_likes_bump_count on speu.track_likes;
create trigger trg_speu_track_likes_bump_count
after insert or delete on speu.track_likes
for each row execute function speu.bump_track_like_count();

update speu.artist_tracks at
set like_count = coalesce(lc.c, 0)
from (
  select track_id, count(*)::int as c
  from speu.track_likes
  group by track_id
) lc
where at.id = lc.track_id;

create table if not exists speu.track_listen_by_day_minsk (
  day_minsk date not null,
  track_id uuid not null references speu.artist_tracks (id) on delete cascade,
  full_to_chart int not null default 0,
  partial_to_chart int not null default 0,
  full_total int not null default 0,
  partial_total int not null default 0,
  primary key (day_minsk, track_id)
);

create index if not exists idx_speu_track_listen_day on speu.track_listen_by_day_minsk (day_minsk desc);

alter table speu.track_listen_by_day_minsk enable row level security;

create table if not exists speu.listen_quota_listener (
  listener_kind text not null check (listener_kind in ('user', 'anon')),
  listener_id uuid not null,
  bucket_start timestamptz not null,
  bucket_kind text not null check (bucket_kind in ('hour', 'day')),
  full_to_chart int not null default 0,
  partial_to_chart int not null default 0,
  primary key (listener_kind, listener_id, bucket_start, bucket_kind)
);

create index if not exists idx_speu_listen_quota_listener_time
  on speu.listen_quota_listener (bucket_start);

alter table speu.listen_quota_listener enable row level security;

create table if not exists speu.listen_quota_track_day (
  listener_kind text not null check (listener_kind in ('user', 'anon')),
  listener_id uuid not null,
  track_id uuid not null references speu.artist_tracks (id) on delete cascade,
  day_utc date not null,
  full_to_chart int not null default 0,
  primary key (listener_kind, listener_id, track_id, day_utc)
);

alter table speu.listen_quota_track_day enable row level security;

create table if not exists speu.listen_outcomes (
  listening_session_id uuid primary key,
  created_at timestamptz not null default now(),
  track_id uuid not null references speu.artist_tracks (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  anon_listener_id uuid,
  qualifies_partial boolean not null,
  qualifies_full boolean not null,
  counts_partial_chart boolean not null default false,
  counts_full_chart boolean not null default false,
  client_ip inet,
  constraint listen_outcomes_one_listener check (
    (user_id is not null and anon_listener_id is null)
    or (user_id is null and anon_listener_id is not null)
  )
);

create index if not exists idx_speu_listen_outcomes_created on speu.listen_outcomes (created_at desc);
create index if not exists idx_speu_listen_outcomes_user_time on speu.listen_outcomes (user_id, created_at desc);
create index if not exists idx_speu_listen_outcomes_anon_time on speu.listen_outcomes (anon_listener_id, created_at desc);

alter table speu.listen_outcomes enable row level security;

create table if not exists speu.chart_snapshots (
  snapshot_date date not null,
  rank int not null check (rank >= 1 and rank <= 500),
  track_id uuid not null references speu.artist_tracks (id) on delete cascade,
  score numeric not null default 0,
  primary key (snapshot_date, rank),
  unique (snapshot_date, track_id)
);

create index if not exists idx_speu_chart_snapshots_date on speu.chart_snapshots (snapshot_date desc);

alter table speu.chart_snapshots enable row level security;

drop policy if exists chart_snapshots_public_read on speu.chart_snapshots;
create policy chart_snapshots_public_read on speu.chart_snapshots
for select to anon, authenticated
using (true);

create or replace function speu.record_listen_terminal(
  p_listening_session uuid,
  p_track_id uuid,
  p_user_id uuid,
  p_anon_id uuid,
  p_duration_ms integer,
  p_max_position_ms integer,
  p_had_user_seek boolean,
  p_had_user_pause boolean,
  p_short_gap_count integer,
  p_client_ip text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_exists boolean;
  v_dur_sec int;
  v_expected_ms int;
  v_ratio float;
  v_partial boolean := false;
  v_full boolean := false;
  v_chart_partial boolean := false;
  v_chart_full boolean := false;
  v_likeable boolean;
  v_kind text;
  v_lid uuid;
  v_day_minsk date;
  v_day_utc date;
  v_hour_start timestamptz;
  v_day_start timestamptz;
  v_rate_1m int;
  v_rate_ip_1m int;
  v_lim_full_day int;
  v_lim_full_hour int;
  v_lim_partial_day int;
  v_lim_partial_hour int;
  v_lim_track_full_day int;
  v_cur_full_day int;
  v_cur_full_hour int;
  v_cur_partial_day int;
  v_cur_partial_hour int;
  v_cur_track_full int;
  v_ip inet;
  v_inc_full_chart int;
  v_inc_partial_chart int;
  v_inc_full_total int;
  v_inc_partial_total int;
begin
  if p_listening_session is null or p_track_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_args');
  end if;

  if (p_user_id is null and p_anon_id is null) or (p_user_id is not null and p_anon_id is not null) then
    return jsonb_build_object('ok', false, 'error', 'listener_required');
  end if;

  select true from speu.listen_outcomes where listening_session_id = p_listening_session into v_exists;
  if v_exists then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  select coalesce(speu.track_is_publicly_likeable(p_track_id), false) into v_likeable;
  if not v_likeable then
    return jsonb_build_object('ok', false, 'error', 'track_not_eligible');
  end if;

  select duration_sec into v_dur_sec from speu.artist_tracks where id = p_track_id;
  if v_dur_sec is not null and v_dur_sec > 0 then
    v_expected_ms := v_dur_sec * 1000;
  else
    v_expected_ms := greatest(1000, least(p_duration_ms, 7200000));
  end if;

  if p_max_position_ms < 0 or p_duration_ms < 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_positions');
  end if;

  if abs(p_duration_ms - v_expected_ms) > 3500 then
    return jsonb_build_object('ok', false, 'error', 'duration_mismatch');
  end if;

  if p_max_position_ms > v_expected_ms + 2500 then
    return jsonb_build_object('ok', false, 'error', 'position_overflow');
  end if;

  v_ratio := case when v_expected_ms <= 0 then 0 else p_max_position_ms::float / v_expected_ms end;

  if v_ratio >= 0.15 then
    v_partial := true;
  end if;

  if v_partial
     and not p_had_user_seek
     and not p_had_user_pause
     and least(coalesce(p_short_gap_count, 0), 99) <= 3
     and v_ratio >= 0.8
  then
    if v_expected_ms >= 10000 then
      if p_max_position_ms >= 10000 then
        v_full := true;
      end if;
    else
      if p_max_position_ms::float >= v_expected_ms * 0.95 then
        v_full := true;
      end if;
    end if;
  end if;

  if p_user_id is not null then
    v_kind := 'user';
    v_lid := p_user_id;
    v_lim_full_day := 100;
    v_lim_full_hour := 28;
    v_lim_partial_day := 280;
    v_lim_partial_hour := 72;
    v_lim_track_full_day := 12;
  else
    v_kind := 'anon';
    v_lid := p_anon_id;
    v_lim_full_day := 36;
    v_lim_full_hour := 10;
    v_lim_partial_day := 100;
    v_lim_partial_hour := 28;
    v_lim_track_full_day := 6;
  end if;

  select count(*)::int into v_rate_1m
  from speu.listen_outcomes o
  where o.created_at > now() - interval '1 minute'
    and (
      (p_user_id is not null and o.user_id = p_user_id)
      or (p_user_id is null and o.anon_listener_id = p_anon_id)
    );

  if v_rate_1m >= 48 then
    return jsonb_build_object('ok', false, 'error', 'rate_listener');
  end if;

  if p_client_ip is not null and btrim(p_client_ip) <> '' then
    begin
      v_ip := split_part(p_client_ip, ',', 1)::inet;
    exception when others then
      v_ip := null;
    end;
  end if;

  if v_ip is not null then
    select count(*)::int into v_rate_ip_1m
    from speu.listen_outcomes o
    where o.created_at > now() - interval '1 minute'
      and o.client_ip = v_ip;
    if v_rate_ip_1m >= 180 then
      return jsonb_build_object('ok', false, 'error', 'rate_ip');
    end if;
  end if;

  v_day_minsk := (timezone('Europe/Minsk', now()))::date;
  v_day_utc := ((now() at time zone 'utc'))::date;
  v_hour_start := (date_trunc('hour', now() at time zone 'utc') at time zone 'utc');
  v_day_start := (date_trunc('day', now() at time zone 'utc') at time zone 'utc');

  if v_partial then
    select coalesce(l.partial_to_chart, 0) into v_cur_partial_hour
    from speu.listen_quota_listener l
    where l.listener_kind = v_kind and l.listener_id = v_lid
      and l.bucket_kind = 'hour' and l.bucket_start = v_hour_start;

    select coalesce(l.partial_to_chart, 0) into v_cur_partial_day
    from speu.listen_quota_listener l
    where l.listener_kind = v_kind and l.listener_id = v_lid
      and l.bucket_kind = 'day' and l.bucket_start = v_day_start;

    if coalesce(v_cur_partial_hour, 0) < v_lim_partial_hour
       and coalesce(v_cur_partial_day, 0) < v_lim_partial_day then
      v_chart_partial := true;
    end if;
  end if;

  if v_full then
    select coalesce(l.full_to_chart, 0) into v_cur_full_hour
    from speu.listen_quota_listener l
    where l.listener_kind = v_kind and l.listener_id = v_lid
      and l.bucket_kind = 'hour' and l.bucket_start = v_hour_start;

    select coalesce(l.full_to_chart, 0) into v_cur_full_day
    from speu.listen_quota_listener l
    where l.listener_kind = v_kind and l.listener_id = v_lid
      and l.bucket_kind = 'day' and l.bucket_start = v_day_start;

    select coalesce(t.full_to_chart, 0) into v_cur_track_full
    from speu.listen_quota_track_day t
    where t.listener_kind = v_kind and t.listener_id = v_lid
      and t.track_id = p_track_id and t.day_utc = v_day_utc;

    if coalesce(v_cur_full_hour, 0) < v_lim_full_hour
       and coalesce(v_cur_full_day, 0) < v_lim_full_day
       and coalesce(v_cur_track_full, 0) < v_lim_track_full_day then
      v_chart_full := true;
    end if;
  end if;

  if v_chart_full then
    v_chart_partial := false;
  end if;

  v_inc_full_chart := case when v_chart_full then 1 else 0 end;
  v_inc_partial_chart := case when v_chart_partial and not v_chart_full then 1 else 0 end;
  v_inc_full_total := case when v_full then 1 else 0 end;
  v_inc_partial_total := case when v_partial and not v_full then 1 else 0 end;

  insert into speu.listen_outcomes (
    listening_session_id, track_id, user_id, anon_listener_id,
    qualifies_partial, qualifies_full, counts_partial_chart, counts_full_chart, client_ip
  ) values (
    p_listening_session, p_track_id, p_user_id, p_anon_id,
    v_partial, v_full, v_chart_partial, v_chart_full, v_ip
  );

  insert into speu.track_listen_by_day_minsk (
    day_minsk, track_id, full_to_chart, partial_to_chart, full_total, partial_total
  ) values (
    v_day_minsk, p_track_id, v_inc_full_chart, v_inc_partial_chart, v_inc_full_total, v_inc_partial_total
  )
  on conflict (day_minsk, track_id) do update set
    full_to_chart = speu.track_listen_by_day_minsk.full_to_chart + excluded.full_to_chart,
    partial_to_chart = speu.track_listen_by_day_minsk.partial_to_chart + excluded.partial_to_chart,
    full_total = speu.track_listen_by_day_minsk.full_total + excluded.full_total,
    partial_total = speu.track_listen_by_day_minsk.partial_total + excluded.partial_total;

  if v_chart_partial then
    insert into speu.listen_quota_listener as l (listener_kind, listener_id, bucket_start, bucket_kind, partial_to_chart)
    values (v_kind, v_lid, v_hour_start, 'hour', 1)
    on conflict (listener_kind, listener_id, bucket_start, bucket_kind)
    do update set partial_to_chart = l.partial_to_chart + 1;

    insert into speu.listen_quota_listener as l (listener_kind, listener_id, bucket_start, bucket_kind, partial_to_chart)
    values (v_kind, v_lid, v_day_start, 'day', 1)
    on conflict (listener_kind, listener_id, bucket_start, bucket_kind)
    do update set partial_to_chart = l.partial_to_chart + 1;
  end if;

  if v_chart_full then
    insert into speu.listen_quota_listener as l (listener_kind, listener_id, bucket_start, bucket_kind, full_to_chart)
    values (v_kind, v_lid, v_hour_start, 'hour', 1)
    on conflict (listener_kind, listener_id, bucket_start, bucket_kind)
    do update set full_to_chart = l.full_to_chart + 1;

    insert into speu.listen_quota_listener as l (listener_kind, listener_id, bucket_start, bucket_kind, full_to_chart)
    values (v_kind, v_lid, v_day_start, 'day', 1)
    on conflict (listener_kind, listener_id, bucket_start, bucket_kind)
    do update set full_to_chart = l.full_to_chart + 1;

    insert into speu.listen_quota_track_day as t (listener_kind, listener_id, track_id, day_utc, full_to_chart)
    values (v_kind, v_lid, p_track_id, v_day_utc, 1)
    on conflict (listener_kind, listener_id, track_id, day_utc)
    do update set full_to_chart = t.full_to_chart + 1;
  end if;

  return jsonb_build_object(
    'ok', true,
    'qualifies_partial', v_partial,
    'qualifies_full', v_full,
    'counts_partial_chart', v_chart_partial,
    'counts_full_chart', v_chart_full
  );
end;
$$;

grant execute on function speu.record_listen_terminal(
  uuid, uuid, uuid, uuid, int, int, boolean, boolean, int, text
) to service_role;

insert into speu.site_settings (key, value, description) values
  ('chart_publish_time', '03:00', 'Час публікацыі чарта (па chart_publish_timezone)'),
  ('chart_publish_timezone', 'Europe/Minsk', 'Часавы пояс для chart_publish_time'),
  ('chart_window_days', '7', 'Колькасць дзён (Minsk) для сумавання ў чарце'),
  ('chart_partial_weight', '0.25', 'Вага partial да score адносна full')
on conflict (key) do nothing;
