-- Service role updates use auth.uid() = NULL. The guard compared old.user_id to auth.uid();
-- when both were NULL, the "not the linked user" shortcut did not run and linking user_id
-- was wrongly treated as a forbidden structural change (linked_artist_cannot_change_structural_fields).

create or replace function speu.artists_linked_editor_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if speu.is_admin(auth.uid()) then
    return new;
  end if;
  if auth.uid() is null then
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
