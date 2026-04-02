-- Выполни в Supabase Dashboard → SQL Editor → Run.
-- То же самое, что миграция 20260402183100_site_settings_public_flags.sql
-- (anon/authenticated смогут читать site_settings с ключами artists_* и support_*).

drop policy if exists public_read_artists_support_flags on speu.site_settings;

create policy public_read_artists_support_flags on speu.site_settings
for select to anon, authenticated
using (key like 'artists_%' or key like 'support_%');
