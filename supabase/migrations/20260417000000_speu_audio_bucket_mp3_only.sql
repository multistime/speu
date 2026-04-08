-- v1: only MP3 uploads (WAV/OGG caused browser/storage edge cases; WAV MIME/size handling was misleading).

update storage.buckets
set
  file_size_limit = 104857600, -- 100 MiB (enough for long MP3 masters)
  allowed_mime_types = array[
    'audio/mpeg',
    'audio/mp3',
    'audio/x-mp3'
  ]
where id = 'speu-audio';
