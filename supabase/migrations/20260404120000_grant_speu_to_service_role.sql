-- Admin API на Vercel выкарыстоўвае SUPABASE_SERVICE_ROLE_KEY → PostgREST уваходзіць як ролю service_role.
-- Раней USAGE/GRANT былі толькі для anon і authenticated, таму з'яўлялася:
--   permission denied for schema speu

grant usage on schema speu to service_role;

grant all on all tables in schema speu to service_role;
grant all on all sequences in schema speu to service_role;

-- Новыя табліцы / паслядоўнасці, створаныя postgres
alter default privileges for role postgres in schema speu
  grant all on tables to service_role;
alter default privileges for role postgres in schema speu
  grant all on sequences to service_role;
