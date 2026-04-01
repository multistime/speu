-- Expose speu.profiles through a public RPC function so the anon/authenticated
-- PostgREST role can access profile data without needing the speu schema
-- to be listed in Supabase's "Exposed schemas" setting.

create or replace function public.get_speu_profile(_user_id uuid)
returns table(id uuid, display_name text, is_admin boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.is_admin
  from speu.profiles p
  where p.id = _user_id;
$$;

-- Allow authenticated and anon roles to call this function
grant execute on function public.get_speu_profile(uuid) to authenticated, anon;
