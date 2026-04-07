-- Link submission draft tracks to catalog rows after moderator approval (idempotent promotion).

alter table speu.release_submission_tracks
  add column if not exists artist_track_id uuid references speu.artist_tracks (id) on delete set null;

create index if not exists idx_release_submission_tracks_artist_track
  on speu.release_submission_tracks (artist_track_id)
  where artist_track_id is not null;
