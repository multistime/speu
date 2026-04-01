-- Key-value store for site-wide settings (radio, general config, etc.)
create table if not exists speu.site_settings (
  key text primary key,
  value text,
  description text,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table speu.site_settings enable row level security;

drop policy if exists admin_read_site_settings on speu.site_settings;
create policy admin_read_site_settings on speu.site_settings
for select to authenticated
using (speu.is_admin(auth.uid()));

drop policy if exists admin_manage_site_settings on speu.site_settings;
create policy admin_manage_site_settings on speu.site_settings
for all to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));

-- Seed default keys so they exist from the start
insert into speu.site_settings (key, value, description) values
  ('radio_stream_url',    '',      'Асноўны URL стрыму (Icecast / SHOUTcast / HLS)'),
  ('radio_fallback_url',  '',      'Рэзервовы URL стрыму'),
  ('radio_name',          'Радыё Мара', 'Адлюстроўваемая назва радыёстанцыі'),
  ('radio_enabled',       'true',  'Ці ўключана радыёстанцыя (true/false)'),
  ('radio_description',   '',      'Кароткае апісанне радыёстанцыі'),
  ('radio_nowplaying_url','',      'URL API метадата / now-playing'),
  ('site_contact_email',  '',      'Кантактны email для заявак і сувязі'),
  ('site_og_image_url',   '',      'URL дэфолтнай OG-выявы')
on conflict (key) do nothing;
