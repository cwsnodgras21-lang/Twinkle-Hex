-- Restrict all admin-managed tables to the "admin" role claim now that real
-- auth is wired up, replacing the wide-open MVP policies from earlier
-- migrations (004_rls_admin_mvp.sql, 005_release_polishes_recipe.sql,
-- 010_pigments_msds.sql) that granted `anon, authenticated` full read/write
-- with USING (true).
--
-- Those policies meant anyone holding the public NEXT_PUBLIC_SUPABASE_ANON_KEY
-- (shipped to every browser) could read and write these tables directly via
-- the Supabase REST API, regardless of what the Next.js app enforced.
--
-- The app now sets a custom `app_metadata.role = "admin"` claim (only
-- settable with the service-role key - see lib/auth/admin-check.ts) which is
-- embedded in the user's JWT and readable via auth.jwt() in RLS policies.
--
-- Run this in the Supabase SQL editor (or via the CLI) against your project.

CREATE OR REPLACE FUNCTION _lock_table_to_admin(target text) RETURNS void AS $$
BEGIN
  IF to_regclass('public.' || target) IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', target);

  -- Drop any previously-created MVP/admin policies on this table by name.
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', target || '_admin_mvp_all', target);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', target || '_admin_only', target);

  EXECUTE format(
    'CREATE POLICY %I ON %I FOR ALL TO authenticated '
    || 'USING ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'') '
    || 'WITH CHECK ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'')',
    target || '_admin_only', target
  );
END;
$$ LANGUAGE plpgsql;

-- Tables that previously had wide-open "admin_mvp" policies:
SELECT _lock_table_to_admin('finished_inventory_items');
SELECT _lock_table_to_admin('releases');
SELECT _lock_table_to_admin('release_polishes');
SELECT _lock_table_to_admin('polish_recipe_lines');
SELECT _lock_table_to_admin('pigments');
SELECT _lock_table_to_admin('pigment_msds_documents');

-- Tables that had RLS disabled entirely (readable/writable by anyone with
-- the anon key, since Postgres grants apply with no row filtering at all
-- when RLS isn't enabled). Locked down here for the first time.
SELECT _lock_table_to_admin('ingredients');
SELECT _lock_table_to_admin('supplies');
SELECT _lock_table_to_admin('batches');
SELECT _lock_table_to_admin('swatchers');
SELECT _lock_table_to_admin('swatcher_assignments');
SELECT _lock_table_to_admin('events');
SELECT _lock_table_to_admin('retail_partners');
SELECT _lock_table_to_admin('charity_polishes');

DROP FUNCTION _lock_table_to_admin(text);

-- Storage: msds-sheets bucket (private, PDF only) - was anon/authenticated,
-- now admin only.
DROP POLICY IF EXISTS "msds_sheets_admin_mvp_select" ON storage.objects;
DROP POLICY IF EXISTS "msds_sheets_admin_mvp_insert" ON storage.objects;
DROP POLICY IF EXISTS "msds_sheets_admin_mvp_update" ON storage.objects;
DROP POLICY IF EXISTS "msds_sheets_admin_mvp_delete" ON storage.objects;
DROP POLICY IF EXISTS "msds_sheets_admin_only_select" ON storage.objects;
DROP POLICY IF EXISTS "msds_sheets_admin_only_insert" ON storage.objects;
DROP POLICY IF EXISTS "msds_sheets_admin_only_update" ON storage.objects;
DROP POLICY IF EXISTS "msds_sheets_admin_only_delete" ON storage.objects;

CREATE POLICY "msds_sheets_admin_only_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'msds-sheets'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "msds_sheets_admin_only_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'msds-sheets'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "msds_sheets_admin_only_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'msds-sheets'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    bucket_id = 'msds-sheets'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "msds_sheets_admin_only_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'msds-sheets'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Promote yourself to admin (run separately, once, with your own email):
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
--   where email = 'owner@example.com';
