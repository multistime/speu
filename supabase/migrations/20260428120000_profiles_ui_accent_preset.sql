-- Прэсет акцэнту інтэрфейсу (хаб Спеў, плэер) — палітра без custom

alter table speu.profiles
  add column if not exists ui_accent_preset_id text not null default 'default'
    check (ui_accent_preset_id in ('default', 'lyasun', 'vuzel', 'rasitsa', 'balota', 'zhytnik'));

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
  player_single_repeat boolean,
  ui_accent_preset_id text
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
          jsonb_build_object(
            'id', a4.id,
            'name', a4.name,
            'slug', a4.slug,
            'can_edit_profile', coalesce(a4.linked_user_can_edit_profile, true)
          )
          order by a4.name
        )
        from speu.artists a4
        where a4.user_id = auth.uid()
      ),
      '[]'::jsonb
    ) as linked_artists,
    p.player_queue_repeat_mode,
    p.player_queue_shuffle,
    p.player_single_repeat,
    p.ui_accent_preset_id
  from speu.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.get_my_speu_profile() from public;
grant execute on function public.get_my_speu_profile() to authenticated;
