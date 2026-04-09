-- Genres for an artist are derived from published catalog tracks (artist_tracks.genres), not stored on artists.

alter table speu.artists
  drop column if exists genres;
