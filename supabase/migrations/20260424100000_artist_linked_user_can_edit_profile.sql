-- Linked cabinet user may edit public artist card (bio, photo, socials, visual) when linked_user_can_edit_profile is true.

alter table speu.artists
  add column if not exists linked_user_can_edit_profile boolean not null default true;

comment on column speu.artists.linked_user_can_edit_profile is
  'When true, speu.artists.user_id may update profile fields (not slug/status/sort_order/user_id) via RLS.';

-- ---- speu.user_can_edit_artist_profile -----------------------------------------
create or replace function speu.user_can_edit_artist_profile(p_artist_id uuid)
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
      and coalesce(a.linked_user_can_edit_profile, true)
  );
$$;

revoke all on function speu.user_can_edit_artist_profile(uuid) from public;
grant execute on function speu.user_can_edit_artist_profile(uuid) to authenticated;

-- ---- artists: linked user can read own row (e.g. draft) -----------------------
drop policy if exists public_read_artists on speu.artists;
create policy public_read_artists on speu.artists
for select to anon, authenticated
using (
  status = 'published'
  or speu.is_admin(auth.uid())
  or speu.user_owns_artist(id)
);

-- ---- artists: linked user update (content columns guarded by trigger) ----------
drop policy if exists artist_linked_user_update_own_card on speu.artists;
create policy artist_linked_user_update_own_card on speu.artists
for update to authenticated
using (speu.user_can_edit_artist_profile(id))
with check (speu.user_can_edit_artist_profile(id));

-- ---- trigger: block structural fields for linked editors (non-admin) ----------
create or replace function speu.artists_linked_editor_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if speu.is_admin(auth.uid()) then
    return new;
  end if;
  if old.user_id is distinct from auth.uid() then
    return new;
  end if;
  if not coalesce(old.linked_user_can_edit_profile, true) then
    return new;
  end if;
  if new.user_id is distinct from old.user_id
     or new.slug is distinct from old.slug
     or new.status is distinct from old.status
     or new.sort_order is distinct from old.sort_order
     or new.id is distinct from old.id
     or new.created_by is distinct from old.created_by
  then
    raise exception 'linked_artist_cannot_change_structural_fields' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_artists_linked_editor_guard on speu.artists;
create trigger trg_artists_linked_editor_guard
before update on speu.artists
for each row execute function speu.artists_linked_editor_guard();

-- ---- get_my_speu_profile: can_edit_profile per linked artist -------------------
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
    p.player_single_repeat
  from speu.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.get_my_speu_profile() from public;
grant execute on function public.get_my_speu_profile() to authenticated;

-- ---- Storage: speu-images/artist-profile/{artist_id}/... ----------------------
drop policy if exists "speu_images_artist_profile_insert" on storage.objects;
create policy "speu_images_artist_profile_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'speu-images'
  and split_part(name, '/', 1) = 'artist-profile'
  and split_part(name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and speu.user_can_edit_artist_profile((split_part(name, '/', 2))::uuid)
);

drop policy if exists "speu_images_artist_profile_update" on storage.objects;
create policy "speu_images_artist_profile_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'speu-images'
  and split_part(name, '/', 1) = 'artist-profile'
  and split_part(name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and speu.user_can_edit_artist_profile((split_part(name, '/', 2))::uuid)
)
with check (
  bucket_id = 'speu-images'
  and split_part(name, '/', 1) = 'artist-profile'
  and split_part(name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and speu.user_can_edit_artist_profile((split_part(name, '/', 2))::uuid)
);

drop policy if exists "speu_images_artist_profile_delete" on storage.objects;
create policy "speu_images_artist_profile_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'speu-images'
  and split_part(name, '/', 1) = 'artist-profile'
  and split_part(name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and speu.user_can_edit_artist_profile((split_part(name, '/', 2))::uuid)
);
