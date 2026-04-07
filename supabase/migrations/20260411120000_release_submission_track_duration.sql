-- Duration (seconds) measured in the artist cabinet when uploading audio; copied to catalog on approval.

alter table speu.release_submission_tracks
  add column if not exists duration_sec int;
