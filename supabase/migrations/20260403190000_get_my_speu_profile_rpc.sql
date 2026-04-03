-- Профіль для бягучага карыстальніка: is_admin = слупок у profiles АБО роля owner/admin у user_roles.
-- SECURITY DEFINER каб чытаць user_roles без RLS (інакш не-admin не бачыць свае радкі ў speu.user_roles праз API).
-- Выклік толькі з auth.uid() унутры — нельга паглядзець чужы профіль.

create or replace function public.get_my_speu_profile()
returns table(id uuid, display_name text, is_admin boolean)
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
    ) as is_admin
  from speu.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.get_my_speu_profile() from public;
grant execute on function public.get_my_speu_profile() to authenticated;
