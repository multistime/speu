-- Прадвызначэнне UI-палітры: «Начны лес» (lyasun); міграцыя былых default → lyasun

update speu.profiles
set ui_accent_preset_id = 'lyasun'
where ui_accent_preset_id = 'default';

alter table speu.profiles
  alter column ui_accent_preset_id set default 'lyasun';
