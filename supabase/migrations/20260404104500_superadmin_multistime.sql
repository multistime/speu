-- Галоўны адмін: профіль + ролі owner і admin (калі карыстальнік ужо зарэгістраваны ў auth.users).

do $$
declare
  uid uuid;
  rid_owner bigint;
  rid_admin bigint;
begin
  select id into uid
  from auth.users
  where lower(trim(email)) = 'multistime@gmail.com'
  limit 1;

  if uid is null then
    raise notice 'Superadmin: карыстальнік multistime@gmail.com яшчэ не ў auth.users — прапускаем';
    return;
  end if;

  insert into speu.profiles (id, display_name, is_admin)
  values (
    uid,
    coalesce(
      (select raw_user_meta_data ->> 'full_name' from auth.users where id = uid),
      split_part((select email from auth.users where id = uid), '@', 1)
    ),
    true
  )
  on conflict (id) do update set is_admin = true;

  select id into rid_owner from speu.roles where code = 'owner' limit 1;
  select id into rid_admin from speu.roles where code = 'admin' limit 1;

  if rid_owner is not null then
    insert into speu.user_roles (user_id, role_id)
    values (uid, rid_owner)
    on conflict (user_id, role_id) do nothing;
  end if;

  if rid_admin is not null then
    insert into speu.user_roles (user_id, role_id)
    values (uid, rid_admin)
    on conflict (user_id, role_id) do nothing;
  end if;
end $$;
