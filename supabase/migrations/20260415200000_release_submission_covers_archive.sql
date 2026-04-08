-- Per-track cover art (singles), submission archive flag, broader artist delete policy.

alter table speu.release_submission_tracks
  add column if not exists cover_url text,
  add column if not exists cover_storage_path text;

alter table speu.release_submissions
  add column if not exists archived_at timestamptz;

create index if not exists idx_release_submissions_archived_at
  on speu.release_submissions (archived_at)
  where archived_at is not null;

drop policy if exists release_submissions_delete_artist on speu.release_submissions;
create policy release_submissions_delete_artist on speu.release_submissions
for delete to authenticated
using (
  user_id = auth.uid()
  and status in ('draft', 'needs_changes', 'rejected')
);
