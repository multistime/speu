-- Align RLS (speu.is_admin) with get_my_speu_profile() and backfill profiles.is_admin
-- for users who only had owner/admin via user_roles (avoids empty admin lists when
-- SUPABASE_SERVICE_ROLE_KEY is missing and requests use the user JWT).

create or replace function speu.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from speu.profiles p where p.id = _user_id),
    false
  )
  or exists (
    select 1
    from speu.user_roles ur
    join speu.roles r on r.id = ur.role_id
    where ur.user_id = _user_id
      and r.code in ('owner', 'admin')
      and (ur.expires_at is null or ur.expires_at > now())
  );
$$;

update speu.profiles p
set is_admin = true
where exists (
  select 1
  from speu.user_roles ur
  join speu.roles r on r.id = ur.role_id
  where ur.user_id = p.id
    and r.code in ('owner', 'admin')
    and (ur.expires_at is null or ur.expires_at > now())
)
and coalesce(p.is_admin, false) = false;
