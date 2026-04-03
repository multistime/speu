-- ============================================================================
-- ЧАСЦЬ 1 — заўсёды бяспечна (структура, ролі, функцыі, RLS).
-- Скапіюйце ўвесь вынік у чат.
-- Калі ўсё ok — запусціце таксама migration-check-speu-extensions-data.sql
-- і дашліце яго вынік.
-- ============================================================================

with checks as (
  select *
  from (values
    (
      'table_track_artists',
      case when to_regclass('speu.track_artists') is not null then 'ok' else 'fail' end,
      coalesce(to_regclass('speu.track_artists')::text, 'missing')
    ),
    (
      'column_artists_user_id',
      case
        when exists (
          select 1 from information_schema.columns c
          where c.table_schema = 'speu' and c.table_name = 'artists' and c.column_name = 'user_id'
        ) then 'ok' else 'fail' end,
      'speu.artists.user_id'
    ),
    (
      'role_listener',
      case when exists (select 1 from speu.roles where code = 'listener') then 'ok' else 'fail' end,
      'speu.roles listener'
    ),
    (
      'role_artist',
      case when exists (select 1 from speu.roles where code = 'artist') then 'ok' else 'fail' end,
      'speu.roles artist'
    ),
    (
      'function_refresh_track_primary',
      case when exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'speu' and p.proname = 'refresh_track_primary_artist'
      ) then 'ok' else 'fail' end,
      'speu.refresh_track_primary_artist()'
    ),
    (
      'function_track_artists_touch_primary',
      case when exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'speu' and p.proname = 'track_artists_touch_primary'
      ) then 'ok' else 'fail' end,
      'speu.track_artists_touch_primary()'
    ),
    (
      'trigger_track_artists_primary',
      case when exists (
        select 1 from pg_trigger t
        join pg_class c on c.oid = t.tgrelid
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'speu' and c.relname = 'track_artists' and t.tgname = 'trg_track_artists_primary'
      ) then 'ok' else 'fail' end,
      'trg_track_artists_primary on speu.track_artists'
    ),
    (
      'policy_public_read_artist_tracks',
      case when exists (
        select 1 from pg_policies
        where schemaname = 'speu' and tablename = 'artist_tracks' and policyname = 'public_read_artist_tracks'
      ) then 'ok' else 'fail' end,
      'RLS policy on artist_tracks'
    ),
    (
      'policy_public_read_track_artists',
      case when exists (
        select 1 from pg_policies
        where schemaname = 'speu' and tablename = 'track_artists' and policyname = 'public_read_track_artists'
      ) then 'ok' else 'fail' end,
      'RLS policy on track_artists'
    ),
    (
      'policy_admin_manage_track_artists',
      case when exists (
        select 1 from pg_policies
        where schemaname = 'speu' and tablename = 'track_artists' and policyname = 'admin_manage_track_artists'
      ) then 'ok' else 'fail' end,
      'admin RLS on track_artists'
    )
  ) as t(check_name, status, detail)
)
select check_name, status, detail from checks
order by
  case status when 'fail' then 0 when 'warn' then 1 else 2 end,
  check_name;
