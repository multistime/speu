-- Release submission + catalog: genres, work_kind, vocal metadata, legal attestation

alter table speu.release_submissions
  add column if not exists accepted_terms boolean not null default false,
  add column if not exists confirmed_rights boolean not null default false,
  add column if not exists rights_attested_at timestamptz,
  add column if not exists terms_version text;

alter table speu.release_submission_tracks
  add column if not exists genres text[] not null default '{}'::text[],
  add column if not exists work_kind text not null default 'track',
  add column if not exists is_explicit boolean not null default false,
  add column if not exists is_ai boolean not null default false,
  add column if not exists language text not null default 'bel';

alter table speu.release_submission_tracks
  drop constraint if exists release_submission_tracks_work_kind_check;
alter table speu.release_submission_tracks
  add constraint release_submission_tracks_work_kind_check
  check (work_kind in ('track', 'beat', 'podcast', 'audiobook'));

alter table speu.release_submission_tracks
  drop constraint if exists release_submission_tracks_language_check;
alter table speu.release_submission_tracks
  add constraint release_submission_tracks_language_check
  check (language in ('bel', 'ru', 'en', 'instrumental'));

alter table speu.artist_tracks
  add column if not exists genres text[] not null default '{}'::text[],
  add column if not exists work_kind text not null default 'track';

alter table speu.artist_tracks
  drop constraint if exists artist_tracks_work_kind_check;
alter table speu.artist_tracks
  add constraint artist_tracks_work_kind_check
  check (work_kind in ('track', 'beat', 'podcast', 'audiobook'));
