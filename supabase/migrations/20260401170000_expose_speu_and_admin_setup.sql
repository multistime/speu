-- ============================================================
-- 1. Expose the speu schema to PostgREST
--    This makes .schema("speu").from("...") work from the API.
--    After running this migration, reload PostgREST config.
-- ============================================================

ALTER ROLE authenticator SET pgrst.db_schema = 'public, graphql_public, speu';
NOTIFY pgrst, 'reload config';

-- ============================================================
-- 2. Grant usage on speu schema to the PostgREST roles
--    so they can access the tables in that schema.
-- ============================================================

GRANT USAGE ON SCHEMA speu TO anon, authenticated;

-- Grant read access on all tables (RLS policies still apply)
GRANT SELECT ON ALL TABLES IN SCHEMA speu TO anon, authenticated;

-- Grant write access for authenticated users (RLS still enforces per-row checks)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA speu TO authenticated;

-- Grant sequence access for auto-increment columns
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA speu TO authenticated;

-- ============================================================
-- 3. Set yourself as admin
--    Replace 'YOUR_EMAIL@gmail.com' with your actual email,
--    then run this block.
-- ============================================================

-- UPDATE speu.profiles
-- SET is_admin = true
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@gmail.com' LIMIT 1
-- );
