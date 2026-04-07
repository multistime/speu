-- Song lyrics (multiline); optional on catalog tracks and submission draft tracks
alter table speu.artist_tracks
  add column if not exists lyrics text;

alter table speu.release_submission_tracks
  add column if not exists lyrics text;
