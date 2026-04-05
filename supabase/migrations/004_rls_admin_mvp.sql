-- Row Level Security for admin tables used with NEXT_PUBLIC_SUPABASE_ANON_KEY.
-- The Next.js server uses the anon role; without policies, INSERT/SELECT fail with RLS errors.
--
-- SECURITY NOTE: These policies allow anon + authenticated full access to the named tables.
-- Anyone with your anon key can read/write these rows (same exposure as disabling RLS for that key).
-- Before launch: replace with policies tied to auth.uid() and an admin claim, or use a server-only
-- service_role client for admin mutations.

-- --- finished_inventory_items ---
ALTER TABLE finished_inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finished_inventory_items_admin_mvp_all" ON finished_inventory_items;
CREATE POLICY "finished_inventory_items_admin_mvp_all"
  ON finished_inventory_items
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- --- releases (if you enable RLS there and hits the same error, this fixes it) ---
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "releases_admin_mvp_all" ON releases;
CREATE POLICY "releases_admin_mvp_all"
  ON releases
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
