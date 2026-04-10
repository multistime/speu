-- Прэсет «default» → «paparat» (Папараць); абнаўленне check constraint

update speu.profiles
set ui_accent_preset_id = 'paparat'
where ui_accent_preset_id = 'default';

do $$
declare
  r record;
begin
  for r in
    select c.conname as name
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'speu'
      and t.relname = 'profiles'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%ui_accent_preset_id%'
  loop
    execute format('alter table speu.profiles drop constraint if exists %I', r.name);
  end loop;
end $$;

alter table speu.profiles
  add constraint profiles_ui_accent_preset_id_check
  check (
    ui_accent_preset_id in ('paparat', 'lyasun', 'vuzel', 'rasitsa', 'balota', 'zhytnik')
  );
