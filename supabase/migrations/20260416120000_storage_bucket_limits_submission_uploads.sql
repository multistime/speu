-- Artist submission uploads: larger caps + MIME types browsers actually send (WAV/PNG).

update storage.buckets
set
  file_size_limit = 12582912, -- 12 MiB (covers; was 5 MiB)
  allowed_mime_types = array[
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/x-png',
    'image/webp',
    'image/gif'
  ]
where id = 'speu-images';

update storage.buckets
set
  file_size_limit = 157286400, -- 150 MiB (WAV masters; was 50 MiB)
  allowed_mime_types = array[
    'audio/mpeg',
    'audio/mp3',
    'audio/x-mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/x-ms-wav',
    'audio/ogg',
    'audio/opus',
    'application/ogg'
  ]
where id = 'speu-audio';
