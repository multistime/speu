-- RLS for artist release submissions (linked user ↔ speu.artists.user_id).
-- Storage: submission-drafts/{auth.uid()}/... under speu-audio and speu-images.

-- ---- release_submissions ----------------------------------------------------

drop policy if exists release_submissions_select on speu.release_submissions;
create policy release_submissions_select on speu.release_submissions
for select to authenticated
using (user_id = auth.uid() or speu.is_admin(auth.uid()));

drop policy if exists release_submissions_insert on speu.release_submissions;
create policy release_submissions_insert on speu.release_submissions
for insert to authenticated
with check (
  user_id = auth.uid()
  and artist_id = speu.my_artist_id()
  and speu.my_artist_id() is not null
);

drop policy if exists release_submissions_update_artist on speu.release_submissions;
create policy release_submissions_update_artist on speu.release_submissions
for update to authenticated
using (user_id = auth.uid() and status in ('draft', 'needs_changes'))
with check (
  user_id = auth.uid()
  and artist_id = speu.my_artist_id()
);

drop policy if exists release_submissions_update_admin on speu.release_submissions;
create policy release_submissions_update_admin on speu.release_submissions
for update to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));

drop policy if exists release_submissions_delete_artist on speu.release_submissions;
create policy release_submissions_delete_artist on speu.release_submissions
for delete to authenticated
using (user_id = auth.uid() and status = 'draft');

drop policy if exists release_submissions_delete_admin on speu.release_submissions;
create policy release_submissions_delete_admin on speu.release_submissions
for delete to authenticated
using (speu.is_admin(auth.uid()));

-- ---- release_submission_tracks ----------------------------------------------

drop policy if exists release_submission_tracks_select on speu.release_submission_tracks;
create policy release_submission_tracks_select on speu.release_submission_tracks
for select to authenticated
using (
  exists (
    select 1
    from speu.release_submissions s
    where s.id = release_submission_tracks.submission_id
      and (s.user_id = auth.uid() or speu.is_admin(auth.uid()))
  )
);

drop policy if exists release_submission_tracks_mutate_artist on speu.release_submission_tracks;
create policy release_submission_tracks_mutate_artist on speu.release_submission_tracks
for all to authenticated
using (
  exists (
    select 1
    from speu.release_submissions s
    where s.id = release_submission_tracks.submission_id
      and s.user_id = auth.uid()
      and s.status in ('draft', 'needs_changes')
  )
)
with check (
  exists (
    select 1
    from speu.release_submissions s
    where s.id = release_submission_tracks.submission_id
      and s.user_id = auth.uid()
      and s.status in ('draft', 'needs_changes')
  )
);

drop policy if exists release_submission_tracks_admin on speu.release_submission_tracks;
create policy release_submission_tracks_admin on speu.release_submission_tracks
for all to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));

-- ---- Storage: artists upload drafts (requires linked artist) ----------------

drop policy if exists "speu_audio_submission_draft_insert" on storage.objects;
create policy "speu_audio_submission_draft_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'speu-audio'
  and speu.my_artist_id() is not null
  and split_part(name, '/', 1) = 'submission-drafts'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "speu_audio_submission_draft_update" on storage.objects;
create policy "speu_audio_submission_draft_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'speu-audio'
  and speu.my_artist_id() is not null
  and split_part(name, '/', 1) = 'submission-drafts'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "speu_audio_submission_draft_delete" on storage.objects;
create policy "speu_audio_submission_draft_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'speu-audio'
  and speu.my_artist_id() is not null
  and split_part(name, '/', 1) = 'submission-drafts'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "speu_images_submission_draft_insert" on storage.objects;
create policy "speu_images_submission_draft_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'speu-images'
  and speu.my_artist_id() is not null
  and split_part(name, '/', 1) = 'submission-drafts'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "speu_images_submission_draft_update" on storage.objects;
create policy "speu_images_submission_draft_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'speu-images'
  and speu.my_artist_id() is not null
  and split_part(name, '/', 1) = 'submission-drafts'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "speu_images_submission_draft_delete" on storage.objects;
create policy "speu_images_submission_draft_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'speu-images'
  and speu.my_artist_id() is not null
  and split_part(name, '/', 1) = 'submission-drafts'
  and split_part(name, '/', 2) = auth.uid()::text
);
