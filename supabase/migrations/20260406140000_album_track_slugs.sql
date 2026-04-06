-- Human-readable URLs: slug from title (filled / updated by app); backfill stable unique values.
alter table speu.albums
  add column if not exists slug text;

alter table speu.artist_tracks
  add column if not exists slug text;

update speu.albums
set slug = 'album-' || replace(id::text, '-', '')
where slug is null or trim(slug) = '';

update speu.artist_tracks
set slug = 'track-' || replace(id::text, '-', '')
where slug is null or trim(slug) = '';

alter table speu.albums
  alter column slug set not null;

alter table speu.artist_tracks
  alter column slug set not null;

create unique index if not exists idx_speu_albums_slug on speu.albums (slug);
create unique index if not exists idx_speu_artist_tracks_slug on speu.artist_tracks (slug);
