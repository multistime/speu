-- Public nav / visibility for streaming hub «Спеў»
insert into speu.content_pages (slug, title, status, visible_on_site, seo_title, seo_description)
values
  (
    'speu',
    'Спеў',
    'published',
    true,
    'Спеў — струмень беларускай музыкі',
    'Слухайце каталог лейбла: плэйліст, трэкі, альбомы і артысты.'
  )
on conflict (slug) do nothing;
