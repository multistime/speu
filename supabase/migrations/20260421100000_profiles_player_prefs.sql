-- Перавагі глабальнага плэера (чарга / адзіночны трэк) для аўтарызаваных карыстальнікаў

alter table speu.profiles
  add column if not exists player_queue_repeat_mode text not null default 'all'
    check (player_queue_repeat_mode in ('off', 'all', 'one')),
  add column if not exists player_queue_shuffle boolean not null default false,
  add column if not exists player_single_repeat boolean not null default false;

drop function if exists public.get_my_speu_profile();

create function public.get_my_speu_profile()
returns table(
  id uuid,
  display_name text,
  is_admin boolean,
  is_artist boolean,
  artist_id uuid,
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
    (speu.my_artist_id() is not null) as is_artist,
    speu.my_artist_id() as artist_id,
    p.player_queue_repeat_mode,
    p.player_queue_shuffle,
    p.player_single_repeat
  from speu.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.get_my_speu_profile() from public;
grant execute on function public.get_my_speu_profile() to authenticated;
