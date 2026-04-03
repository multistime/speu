-- Tracks included in the public "Радыё Мара" playlist (browser-based rotation)
alter table speu.artist_tracks
  add column if not exists play_on_radio boolean not null default false;

create index if not exists idx_artist_tracks_radio
  on speu.artist_tracks (play_on_radio, is_published)
  where play_on_radio = true and is_published = true;

-- Allow anyone to read radio-related site settings (stream URL, name, etc.)
drop policy if exists public_read_radio_site_settings on speu.site_settings;
create policy public_read_radio_site_settings on speu.site_settings
for select to anon, authenticated
using (key like 'radio_%');
