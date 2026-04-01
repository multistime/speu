-- Albums table
create table if not exists speu.albums (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references speu.artists (id) on delete cascade,
  title text not null,
  cover_url text,
  release_date date,
  description text,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Extend artist_tracks with audio, album and publishing fields
alter table speu.artist_tracks
  add column if not exists album_id uuid references speu.albums (id) on delete set null,
  add column if not exists audio_url text,
  add column if not exists duration_sec int,
  add column if not exists track_number int,
  add column if not exists cover_url text,
  add column if not exists is_published boolean not null default true;

-- Trigger for albums updated_at
drop trigger if exists set_speu_albums_updated_at on speu.albums;
create trigger set_speu_albums_updated_at
before update on speu.albums
for each row execute function speu.set_updated_at();

-- Indexes
create index if not exists idx_albums_artist_sort on speu.albums (artist_id, sort_order);
create index if not exists idx_artist_tracks_album on speu.artist_tracks (album_id);

-- RLS for albums
alter table speu.albums enable row level security;

drop policy if exists public_read_published_albums on speu.albums;
create policy public_read_published_albums on speu.albums
for select to anon, authenticated
using (is_published = true or speu.is_admin(auth.uid()));

drop policy if exists admin_manage_albums on speu.albums;
create policy admin_manage_albums on speu.albums
for all to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));

-- Storage bucket for audio files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'speu-audio',
  'speu-audio',
  true,
  52428800,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-wav', 'audio/x-mp3']
)
on conflict (id) do nothing;

-- Storage RLS policies
drop policy if exists "speu_audio_public_read" on storage.objects;
create policy "speu_audio_public_read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'speu-audio');

drop policy if exists "speu_audio_admin_insert" on storage.objects;
create policy "speu_audio_admin_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'speu-audio' and speu.is_admin(auth.uid()));

drop policy if exists "speu_audio_admin_update" on storage.objects;
create policy "speu_audio_admin_update" on storage.objects
for update to authenticated
using (bucket_id = 'speu-audio' and speu.is_admin(auth.uid()));

drop policy if exists "speu_audio_admin_delete" on storage.objects;
create policy "speu_audio_admin_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'speu-audio' and speu.is_admin(auth.uid()));
