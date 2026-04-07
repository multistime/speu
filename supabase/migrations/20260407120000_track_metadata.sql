-- Per-track metadata: age rating, vocal language, AI flag
alter table speu.artist_tracks
  add column if not exists is_explicit boolean not null default false,
  add column if not exists language text not null default 'bel',
  add column if not exists is_ai boolean not null default false;

alter table speu.artist_tracks
  drop constraint if exists artist_tracks_language_check;

alter table speu.artist_tracks
  add constraint artist_tracks_language_check
  check (language in ('bel', 'ru', 'en', 'instrumental'));
