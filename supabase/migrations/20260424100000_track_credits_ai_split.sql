-- Authors (lyrics / music) and split AI flags; remove legacy is_ai when present

alter table speu.release_submission_tracks
  add column if not exists lyrics_author text,
  add column if not exists music_author text,
  add column if not exists is_ai_lyrics boolean not null default false,
  add column if not exists is_ai_music boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'speu'
      and table_name = 'release_submission_tracks'
      and column_name = 'is_ai'
  ) then
    update speu.release_submission_tracks
    set is_ai_lyrics = is_ai, is_ai_music = is_ai
    where is_ai = true;
    alter table speu.release_submission_tracks drop column is_ai;
  end if;
end $$;

alter table speu.artist_tracks
  add column if not exists lyrics_author text,
  add column if not exists music_author text,
  add column if not exists is_ai_lyrics boolean not null default false,
  add column if not exists is_ai_music boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'speu'
      and table_name = 'artist_tracks'
      and column_name = 'is_ai'
  ) then
    update speu.artist_tracks
    set is_ai_lyrics = is_ai, is_ai_music = is_ai
    where is_ai = true;
    alter table speu.artist_tracks drop column is_ai;
  end if;
end $$;
