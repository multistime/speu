-- Hub /speu: configurable vinyl hero size (public read for SSR + anon API)
insert into speu.site_settings (key, value, description) values
  (
    'speu_hub_hero_disc_scale',
    '1',
    'Памер пластыны на старонцы «Спеў»: 1 — мінімум (як раней), 5 — найбуйнейшы'
  )
on conflict (key) do update set description = excluded.description;

drop policy if exists public_read_artists_support_flags on speu.site_settings;
create policy public_read_artists_support_flags on speu.site_settings
for select to anon, authenticated
using (
  key like 'artists_%'
  or key like 'support_%'
  or key like 'speu_%'
);
