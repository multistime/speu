-- public_read_artists uses speu.user_owns_artist(id). Only authenticated had EXECUTE
-- (see 20260422100000_multi_artist_user_links.sql); anon PostgREST embeds then failed with
-- "permission denied for function user_owns_artist" and catalog helpers returned [].
-- Safe for anon: function is SECURITY DEFINER and returns false when auth.uid() is null.

grant execute on function speu.user_owns_artist(uuid) to anon;
