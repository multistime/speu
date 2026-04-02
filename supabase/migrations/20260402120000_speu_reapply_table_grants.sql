-- Tables created after 20260401170000 never received PostgREST role grants:
-- GRANT ... ON ALL TABLES only applies to tables that exist at execution time.
-- Without these, authenticated gets "permission denied for table ..." before RLS runs.

GRANT SELECT ON ALL TABLES IN SCHEMA speu TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA speu TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA speu TO authenticated;

-- New tables created in future migrations (as postgres) inherit the same grants.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA speu
  GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA speu
  GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA speu
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
