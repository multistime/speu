-- speu.is_admin() must match public.get_my_speu_profile(): admin access via profiles.is_admin
-- OR active owner/admin row in speu.user_roles. Otherwise RLS lets you "into" admin UI but
-- returns zero rows from speu.* (e.g. empty artists list).

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
