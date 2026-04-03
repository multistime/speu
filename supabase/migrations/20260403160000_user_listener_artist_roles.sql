-- Product-facing roles for cabinet / permissions (staff roles unchanged: owner, admin, editor, …)
insert into speu.roles (code, description)
values
  ('listener', 'Default listener / site user'),
  ('artist', 'Artist account — publishing / artist features')
on conflict (code) do nothing;
