-- Public read for placeholder toggles (anon uses /api/public/site-settings)
drop policy if exists public_read_artists_support_flags on speu.site_settings;
create policy public_read_artists_support_flags on speu.site_settings
for select to anon, authenticated
using (key like 'artists_%' or key like 'support_%');
