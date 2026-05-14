-- Галоўная старонка: is_home (не прывязана да slug 'home').
-- Кабінет адміністратара: admin_show_all_pages — паказ у меню ўсіх пунктаў (уключна схаваныя з сайта).

alter table speu.content_pages
  add column if not exists is_home boolean not null default false;

update speu.content_pages set is_home = false where is_home is distinct from true;
update speu.content_pages set is_home = true where slug = 'home';

drop index if exists speu.content_pages_one_is_home;
create unique index content_pages_one_is_home
  on speu.content_pages ((1))
  where is_home;

alter table speu.content_pages drop constraint if exists content_pages_home_must_be_visible;
alter table speu.content_pages add constraint content_pages_home_must_be_visible
  check (not is_home or visible_on_site = true);

drop policy if exists public_read_published_pages on speu.content_pages;
create policy public_read_published_pages on speu.content_pages
for select to anon, authenticated
using (
  speu.is_admin(auth.uid())
  or (
    status = 'published'
    and (
      is_home
      or visible_on_site = true
    )
  )
);

drop policy if exists public_read_blocks on speu.content_blocks;
create policy public_read_blocks on speu.content_blocks
for select to anon, authenticated
using (
  enabled = true
  and exists (
    select 1 from speu.content_pages cp
    where cp.id = page_id
      and cp.status = 'published'
      and (
        cp.is_home
        or cp.visible_on_site = true
      )
  )
  or speu.is_admin(auth.uid())
);

alter table speu.profiles
  add column if not exists admin_show_all_pages boolean not null default false;

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
  ui_accent_preset_id text,
  admin_show_all_pages boolean
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
    p.ui_accent_preset_id,
    coalesce(p.admin_show_all_pages, false) as admin_show_all_pages
  from speu.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.get_my_speu_profile() from public;
grant execute on function public.get_my_speu_profile() to authenticated;
