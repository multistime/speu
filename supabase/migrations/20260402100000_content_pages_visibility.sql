-- Public visibility toggle per page (nav + access). Home must stay visible.
alter table speu.content_pages
  add column if not exists visible_on_site boolean not null default true;

update speu.content_pages set visible_on_site = true where slug = 'home';

alter table speu.content_pages drop constraint if exists content_pages_home_must_be_visible;
alter table speu.content_pages add constraint content_pages_home_must_be_visible
  check (slug <> 'home' or visible_on_site = true);

-- Routable sections that were missing from CMS rows
insert into speu.content_pages (slug, title, status, visible_on_site, seo_title, seo_description)
values
  ('radio', 'Радыё Мара', 'published', true, 'Радыё Мара — Speu', 'Онлайн-радыё і плэйліст беларускай музыкі'),
  ('generator', 'Генератар', 'published', true, 'Генератар тэкстаў — Speu', 'Інструмент для тэкстаў песень на беларускай мове'),
  ('cabinet', 'Кабінет', 'published', true, 'Кабінет — Speu', 'Асабісты кабінет')
on conflict (slug) do nothing;

-- RLS: anon sees only published pages that are visible (home always visible via constraint)
drop policy if exists public_read_published_pages on speu.content_pages;
create policy public_read_published_pages on speu.content_pages
for select to anon, authenticated
using (
  speu.is_admin(auth.uid())
  or (
    status = 'published'
    and (
      slug = 'home'
      or visible_on_site = true
    )
  )
);

drop policy if exists public_read_blocks on speu.content_blocks;
create policy public_read_blocks on speu.content_blocks
for select to anon, authenticated
using (
  enabled = true
  and exists (
    select 1 from speu.content_pages cp
    where cp.id = page_id
      and cp.status = 'published'
      and (
        cp.slug = 'home'
        or cp.visible_on_site = true
      )
  )
  or speu.is_admin(auth.uid())
);
