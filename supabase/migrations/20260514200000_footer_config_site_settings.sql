-- Публічнае чытанне канфіга футэра (JSON), API /api/public/site-settings
drop policy if exists public_read_footer_config on speu.site_settings;
create policy public_read_footer_config on speu.site_settings
for select to anon, authenticated
using (key = 'footer_config');

insert into speu.site_settings (key, value, description)
values (
  'footer_config',
  '{"brandDescription":"Беларускі музычны лейбл. Ствараем і падтрымліваем арыгінальную музыку на беларускай мове.","social":[{"kind":"instagram","label":"Instagram","href":"https://instagram.com/speu_label","enabled":true},{"kind":"telegram","label":"Telegram","href":"https://t.me/speu_label","enabled":true},{"kind":"youtube","label":"YouTube","href":"https://youtube.com/@speu_label","enabled":true},{"kind":"spotify","label":"Spotify","href":"https://open.spotify.com","enabled":true},{"kind":"soundcloud","label":"SoundCloud","href":"https://soundcloud.com/speu_label","enabled":true}],"contactIntro":"Цікавіць супрацоўніцтва? Пішыце нам.","contactEmail":"hello@speu.by","messengersTitle":"Мы ў мессенджэрах:","messengers":[{"kind":"telegram","label":"Telegram","href":"https://t.me/speu_label","enabled":true},{"kind":"instagram","label":"Instagram","href":"https://instagram.com/speu_label","enabled":true}],"copyright":"© 2026 Спеў. Корань у мове.","legal":[{"label":"Прыватнасць","href":"#","enabled":true},{"label":"Умовы","href":"#","enabled":true}]}',
  'Футэр сайта: JSON (тэкст, сацсеткі, кантакт, мессенджэры, юрыдычныя спасылкі)'
)
on conflict (key) do nothing;
