create schema if not exists speu;

create table if not exists speu.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists speu.roles (
  id bigserial primary key,
  code text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists speu.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id bigint not null references speu.roles (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  primary key (user_id, role_id)
);

create table if not exists speu.content_pages (
  id bigserial primary key,
  slug text not null unique,
  title text not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  seo_title text,
  seo_description text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists speu.content_blocks (
  id bigserial primary key,
  page_id bigint not null references speu.content_pages (id) on delete cascade,
  block_key text not null,
  block_type text not null,
  order_index int not null default 0,
  enabled boolean not null default true,
  payload_json jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, block_key)
);

create table if not exists speu.artists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_en text,
  tagline text,
  bio text,
  genres text[] not null default '{}'::text[],
  location text,
  year_started int,
  initials text,
  social_links jsonb not null default '{}'::jsonb,
  visual_json jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  sort_order int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists speu.artist_tracks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references speu.artists (id) on delete cascade,
  title text not null,
  external_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists speu.support_tiers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  label_be text,
  description text,
  price_amount numeric(10,2) not null default 0,
  currency text not null default 'USD',
  period text not null default '/мес',
  perks jsonb not null default '[]'::jsonb,
  highlighted boolean not null default false,
  accent_color text,
  glow_rgb text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists speu.service_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  service_type text not null,
  description text not null,
  budget text,
  deadline date,
  status text not null default 'new' check (status in ('new', 'in_progress', 'done', 'rejected')),
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists speu.admin_audit_log (
  id bigserial primary key,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function speu.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function speu.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into speu.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function speu.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from speu.profiles p
    where p.id = _user_id and p.is_admin = true
  );
$$;

create or replace function speu.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from speu.user_roles ur
    join speu.roles r on r.id = ur.role_id
    where ur.user_id = _user_id
      and r.code = _role
      and (ur.expires_at is null or ur.expires_at > now())
  );
$$;

create or replace function speu.sync_profile_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _role_code text;
  _is_admin_role boolean;
begin
  if tg_op = 'DELETE' then
    select code into _role_code from speu.roles where id = old.role_id;
    if _role_code in ('owner', 'admin') then
      update speu.profiles
      set is_admin = exists (
        select 1
        from speu.user_roles ur
        join speu.roles r on r.id = ur.role_id
        where ur.user_id = old.user_id
          and r.code in ('owner', 'admin')
          and (ur.expires_at is null or ur.expires_at > now())
      )
      where id = old.user_id;
    end if;
    return old;
  end if;

  select code into _role_code from speu.roles where id = new.role_id;
  _is_admin_role := _role_code in ('owner', 'admin');

  if _is_admin_role then
    update speu.profiles
    set is_admin = true
    where id = new.user_id;
  end if;

  return new;
end;
$$;

insert into speu.roles (code, description)
values
  ('owner', 'Full access including role management'),
  ('admin', 'Manage content, artists, leads and settings'),
  ('editor', 'Manage content without user role management'),
  ('support', 'Manage leads and support flows'),
  ('viewer', 'Read-only access')
on conflict (code) do nothing;

create index if not exists idx_user_roles_user_id on speu.user_roles (user_id);
create index if not exists idx_content_pages_slug on speu.content_pages (slug);
create index if not exists idx_content_blocks_page_order on speu.content_blocks (page_id, order_index);
create index if not exists idx_artists_status_sort on speu.artists (status, sort_order);
create index if not exists idx_artist_tracks_artist_sort on speu.artist_tracks (artist_id, sort_order);
create index if not exists idx_support_tiers_active_sort on speu.support_tiers (is_active, sort_order);
create index if not exists idx_service_requests_status_created on speu.service_requests (status, created_at desc);

drop trigger if exists set_speu_profiles_updated_at on speu.profiles;
create trigger set_speu_profiles_updated_at
before update on speu.profiles
for each row execute function speu.set_updated_at();

drop trigger if exists set_speu_content_pages_updated_at on speu.content_pages;
create trigger set_speu_content_pages_updated_at
before update on speu.content_pages
for each row execute function speu.set_updated_at();

drop trigger if exists set_speu_content_blocks_updated_at on speu.content_blocks;
create trigger set_speu_content_blocks_updated_at
before update on speu.content_blocks
for each row execute function speu.set_updated_at();

drop trigger if exists set_speu_artists_updated_at on speu.artists;
create trigger set_speu_artists_updated_at
before update on speu.artists
for each row execute function speu.set_updated_at();

drop trigger if exists set_speu_artist_tracks_updated_at on speu.artist_tracks;
create trigger set_speu_artist_tracks_updated_at
before update on speu.artist_tracks
for each row execute function speu.set_updated_at();

drop trigger if exists set_speu_support_tiers_updated_at on speu.support_tiers;
create trigger set_speu_support_tiers_updated_at
before update on speu.support_tiers
for each row execute function speu.set_updated_at();

drop trigger if exists set_speu_service_requests_updated_at on speu.service_requests;
create trigger set_speu_service_requests_updated_at
before update on speu.service_requests
for each row execute function speu.set_updated_at();

drop trigger if exists on_auth_user_created_speu on auth.users;
create trigger on_auth_user_created_speu
after insert on auth.users
for each row execute procedure speu.handle_new_user();

drop trigger if exists sync_profile_admin_after_role_upsert on speu.user_roles;
create trigger sync_profile_admin_after_role_upsert
after insert or update on speu.user_roles
for each row execute function speu.sync_profile_admin_flag();

drop trigger if exists sync_profile_admin_after_role_delete on speu.user_roles;
create trigger sync_profile_admin_after_role_delete
after delete on speu.user_roles
for each row execute function speu.sync_profile_admin_flag();

alter table speu.profiles enable row level security;
alter table speu.roles enable row level security;
alter table speu.user_roles enable row level security;
alter table speu.content_pages enable row level security;
alter table speu.content_blocks enable row level security;
alter table speu.artists enable row level security;
alter table speu.artist_tracks enable row level security;
alter table speu.support_tiers enable row level security;
alter table speu.service_requests enable row level security;
alter table speu.admin_audit_log enable row level security;

drop policy if exists profile_owner_select on speu.profiles;
create policy profile_owner_select on speu.profiles
for select to authenticated
using (auth.uid() = id or speu.is_admin(auth.uid()));

drop policy if exists profile_owner_update on speu.profiles;
create policy profile_owner_update on speu.profiles
for update to authenticated
using (auth.uid() = id or speu.is_admin(auth.uid()))
with check (auth.uid() = id or speu.is_admin(auth.uid()));

drop policy if exists profile_owner_insert on speu.profiles;
create policy profile_owner_insert on speu.profiles
for insert to authenticated
with check (auth.uid() = id or speu.is_admin(auth.uid()));

drop policy if exists admin_read_roles on speu.roles;
create policy admin_read_roles on speu.roles
for select to authenticated
using (speu.is_admin(auth.uid()));

drop policy if exists admin_manage_user_roles on speu.user_roles;
create policy admin_manage_user_roles on speu.user_roles
for all to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));

drop policy if exists public_read_published_pages on speu.content_pages;
create policy public_read_published_pages on speu.content_pages
for select to anon, authenticated
using (status = 'published' or speu.is_admin(auth.uid()));

drop policy if exists admin_manage_pages on speu.content_pages;
create policy admin_manage_pages on speu.content_pages
for all to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));

drop policy if exists public_read_blocks on speu.content_blocks;
create policy public_read_blocks on speu.content_blocks
for select to anon, authenticated
using (
  enabled = true and exists (
    select 1 from speu.content_pages cp
    where cp.id = page_id and cp.status = 'published'
  )
  or speu.is_admin(auth.uid())
);

drop policy if exists admin_manage_blocks on speu.content_blocks;
create policy admin_manage_blocks on speu.content_blocks
for all to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));

drop policy if exists public_read_artists on speu.artists;
create policy public_read_artists on speu.artists
for select to anon, authenticated
using (status = 'published' or speu.is_admin(auth.uid()));

drop policy if exists admin_manage_artists on speu.artists;
create policy admin_manage_artists on speu.artists
for all to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));

drop policy if exists public_read_artist_tracks on speu.artist_tracks;
create policy public_read_artist_tracks on speu.artist_tracks
for select to anon, authenticated
using (
  exists (
    select 1 from speu.artists a
    where a.id = artist_id and a.status = 'published'
  ) or speu.is_admin(auth.uid())
);

drop policy if exists admin_manage_artist_tracks on speu.artist_tracks;
create policy admin_manage_artist_tracks on speu.artist_tracks
for all to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));

drop policy if exists public_read_support_tiers on speu.support_tiers;
create policy public_read_support_tiers on speu.support_tiers
for select to anon, authenticated
using (is_active = true or speu.is_admin(auth.uid()));

drop policy if exists admin_manage_support_tiers on speu.support_tiers;
create policy admin_manage_support_tiers on speu.support_tiers
for all to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));

drop policy if exists public_insert_service_requests on speu.service_requests;
create policy public_insert_service_requests on speu.service_requests
for insert to anon, authenticated
with check (true);

drop policy if exists admin_read_service_requests on speu.service_requests;
create policy admin_read_service_requests on speu.service_requests
for select to authenticated
using (speu.is_admin(auth.uid()));

drop policy if exists admin_update_service_requests on speu.service_requests;
create policy admin_update_service_requests on speu.service_requests
for update to authenticated
using (speu.is_admin(auth.uid()))
with check (speu.is_admin(auth.uid()));

drop policy if exists admin_read_audit_log on speu.admin_audit_log;
create policy admin_read_audit_log on speu.admin_audit_log
for select to authenticated
using (speu.is_admin(auth.uid()));

drop policy if exists admin_insert_audit_log on speu.admin_audit_log;
create policy admin_insert_audit_log on speu.admin_audit_log
for insert to authenticated
with check (speu.is_admin(auth.uid()));

insert into speu.content_pages (slug, title, status, seo_title, seo_description)
values
  ('home', 'Галоўная', 'published', 'Спеў — Беларуская музыка на роднай мове', 'Беларускі музычны лейбл з арыгінальнай музыкай і генератыўнымі інструментамі'),
  ('artists', 'Артысты', 'published', 'Артысты Speu', 'Каталог беларускіх артыстаў Speu'),
  ('support', 'Падтрымка', 'published', 'Падтрымка Speu', 'Узроўні падтрымкі беларускага музычнага лейбла'),
  ('services', 'Паслугі', 'published', 'Паслугі Speu', 'Музычныя паслугі і заяўкі')
on conflict (slug) do nothing;

insert into speu.content_blocks (page_id, block_key, block_type, order_index, payload_json)
select cp.id, b.block_key, b.block_type, b.order_index, b.payload_json
from speu.content_pages cp
cross join (
  values
    ('home', 'about', 'text', 10, '{"label":"Пра нас","title":"Там, дзе старажытны спеў сустракае новы гук","body":"Спеў — беларускі музычны лейбл. Наша місія простая: каб было больш добрай музыкі на беларускай мове і ў яе было больш слухачоў. Мы ствараем яе самі і дапамагаем гэта рабіць іншым.","subbody":"Беларуская мова можа гучаць у любым жанры — у фолку і электроніцы, у попе і амбіенце. Каранямі мы ў традыцыі: вуснай творчасці, прыродзе, продках. Поглядам — наперад. Слова жыве, пакуль яно гучыць."}'::jsonb),
    ('home', 'generator_cta', 'cta', 20, '{"label":"Наш інструмент","title":"Напішыце тэкст для вашай песні","description":"Спеу-генератар дапамагае ствараць тэксты на беларускай мове: выберыце жанр, настрой і тэму — і атрымайце гатовую структуру песні за секунды.","button":{"label":"Адкрыць генератар","href":"/generator"}}'::jsonb),
    ('home', 'radio_cta', 'cta', 30, '{"label":"Новае на Speu","title":"Радыё Мара","description":"Радыё Мара - наша онлайн-радыёстанцыя, якая 24/7 круціць беларускі плэйліст у выпадковым парадку.","button":{"label":"Слухаць Радыё Мара","href":"/radio"}}'::jsonb),
    ('home', 'support_header', 'text', 40, '{"label":"Падтрымай сцэну","title":"Падтрымай Speǔ","description":"Беларуская музыка расце разам з яе супольнасцю. Падтрымай лейбл — і стань часткай таго, як беларуская мова гучыць сёння."}'::jsonb)
) as b(page_slug, block_key, block_type, order_index, payload_json)
where cp.slug = b.page_slug
on conflict (page_id, block_key) do nothing;

insert into speu.support_tiers (code, name, label_be, description, price_amount, currency, period, perks, highlighted, accent_color, glow_rgb, is_active, sort_order)
values
  ('supporter', 'Падтрымальнік', 'Падтрымальнік', 'Музыка на роднай мове жыве дзякуючы вам. Кожны ўклад мае значэнне.', 5, 'USD', '/мес', '["Ранні доступ да новых выданняў","Імя ў альбомных крэдытах","Прыватная рассылка лейбла","Штомесячны дайджэст"]'::jsonb, false, '#4A7CB5', '74, 124, 181', true, 10),
  ('patron', 'Мецэнат', 'Мецэнат', 'Уваходзіце глыбей. Фармуйце тое, што мы ствараем.', 15, 'USD', '/мес', '["Усё ад узроўню Падтрымальнік","Галасаванне за тэмы наступных выданняў","Сцябліны і файлы праекта","Эксклюзіўныя B-сайды і дэмо","Штомесячная слуханка"]'::jsonb, true, '#C07A30', '192, 122, 48', true, 20),
  ('coproducer', 'Сасупрадзюсар', 'Сасупрадзюсар', 'Станьце часткай лейбла. Ваша імя — на запісе.', 50, 'USD', '/мес', '["Усё ад узроўню Мецэнат","Крэдыт сасупрадзюсара на выданнях","Замова аднаго аўтарскага трэка ў год","Доля раялці на сумесных выданнях","Прыватныя сесіі абмеркавання (анлайн)","Уплыў на стратэгію лейбла"]'::jsonb, false, '#7B5EA7', '123, 94, 167', true, 30)
on conflict (code) do nothing;
