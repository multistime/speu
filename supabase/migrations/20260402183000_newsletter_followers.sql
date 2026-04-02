-- Падпісчыкі з лэндынга (Tilda і г.д.)

create table if not exists speu.newsletter_followers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'tilda',
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_followers_email_lower_unique
  on speu.newsletter_followers (lower(trim(email)));

alter table speu.newsletter_followers enable row level security;

drop policy if exists public_insert_newsletter_followers on speu.newsletter_followers;
create policy public_insert_newsletter_followers on speu.newsletter_followers
for insert to anon, authenticated
with check (true);

drop policy if exists admin_read_newsletter_followers on speu.newsletter_followers;
create policy admin_read_newsletter_followers on speu.newsletter_followers
for select to authenticated
using (speu.is_admin(auth.uid()));

grant select on speu.newsletter_followers to anon, authenticated;
grant insert on speu.newsletter_followers to anon, authenticated;
