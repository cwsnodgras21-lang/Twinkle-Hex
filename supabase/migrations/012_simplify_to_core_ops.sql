-- Simplify to a lean internal ops tool answering three questions:
--   1. What's in finished stock?
--   2. What's in ingredients (raw materials, pigments, supplies)?
--   3. How is each polish made (recipe)?
--
-- This drops the storefront/community/production-planning/marketing feature
-- tables that shipped in earlier migrations and are no longer used by the
-- app, and folds pigments + supplies into one "ingredients" table (with a
-- `category` column) so there's one gravitational home for raw materials
-- instead of three parallel tables. Historical migration files are left
-- untouched; this is an additive cleanup migration.

-- ============================================================
-- 1. Unify ingredients / pigments / supplies into one table
-- ============================================================

-- Ensure the base table exists (it may only have been created ad hoc against
-- earlier commented-out schema in 000_admin_schema.sql).
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  supplier TEXT,
  unit TEXT NOT NULL DEFAULT 'g',
  quantity_on_hand NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'ingredient';
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS color_description TEXT;

ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_category_check;
ALTER TABLE ingredients
  ADD CONSTRAINT ingredients_category_check
  CHECK (category IN ('ingredient', 'pigment', 'supply'));

CREATE INDEX IF NOT EXISTS ingredients_category_idx ON ingredients (category);

DROP TRIGGER IF EXISTS ingredients_updated_at ON ingredients;
CREATE TRIGGER ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Fold pigments in, preserving id so MSDS document links keep working.
DO $$
BEGIN
  IF to_regclass('public.pigments') IS NOT NULL THEN
    INSERT INTO ingredients (id, name, sku, supplier, category, color_description, unit, quantity_on_hand, low_stock_threshold, notes, created_at, updated_at)
    SELECT id, name, sku, supplier, 'pigment', color_description, unit, quantity_on_hand, low_stock_threshold, notes, created_at, updated_at
    FROM pigments
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Fold supplies in; the old free-text "category" (e.g. "labels", "bottles")
-- becomes a note prefix since it isn't the same concept as the new
-- ingredient/pigment/supply category column.
DO $$
BEGIN
  IF to_regclass('public.supplies') IS NOT NULL THEN
    INSERT INTO ingredients (id, name, sku, category, unit, quantity_on_hand, low_stock_threshold, notes, created_at, updated_at)
    SELECT
      id,
      name,
      sku,
      'supply',
      unit,
      quantity_on_hand,
      low_stock_threshold,
      NULLIF(trim(both E'\n' from concat_ws(E'\n',
        CASE WHEN category IS NOT NULL AND category <> '' THEN 'Supply type: ' || category END,
        notes
      )), ''),
      created_at,
      updated_at
    FROM supplies
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Repoint MSDS documents at the unified table.
DO $$
BEGIN
  IF to_regclass('public.pigment_msds_documents') IS NOT NULL THEN
    ALTER TABLE pigment_msds_documents RENAME TO ingredient_msds_documents;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.ingredient_msds_documents') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'ingredient_msds_documents' AND column_name = 'pigment_id'
    ) THEN
      ALTER TABLE ingredient_msds_documents RENAME COLUMN pigment_id TO ingredient_id;
    END IF;
    ALTER TABLE ingredient_msds_documents DROP CONSTRAINT IF EXISTS pigment_msds_documents_pigment_id_fkey;
    ALTER TABLE ingredient_msds_documents DROP CONSTRAINT IF EXISTS ingredient_msds_documents_ingredient_id_fkey;
    ALTER TABLE ingredient_msds_documents
      ADD CONSTRAINT ingredient_msds_documents_ingredient_id_fkey
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS ingredient_msds_documents_ingredient_id_idx
      ON ingredient_msds_documents (ingredient_id);
  END IF;
END $$;

DROP TABLE IF EXISTS pigments;
DROP TABLE IF EXISTS supplies;

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ingredients_admin_mvp_all" ON ingredients;
DROP POLICY IF EXISTS "ingredients_admin_only" ON ingredients;
CREATE POLICY "ingredients_admin_only"
  ON ingredients FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DO $$
BEGIN
  IF to_regclass('public.ingredient_msds_documents') IS NOT NULL THEN
    ALTER TABLE ingredient_msds_documents ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "pigment_msds_documents_admin_mvp_all" ON ingredient_msds_documents;
    DROP POLICY IF EXISTS "pigment_msds_documents_admin_only" ON ingredient_msds_documents;
    DROP POLICY IF EXISTS "ingredient_msds_documents_admin_only" ON ingredient_msds_documents;
    EXECUTE 'CREATE POLICY "ingredient_msds_documents_admin_only" ON ingredient_msds_documents FOR ALL TO authenticated '
      || 'USING ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'') '
      || 'WITH CHECK ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'')';
  END IF;
END $$;

-- ============================================================
-- 2. Polishes stand alone (no more Releases wrapper)
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.release_polishes') IS NOT NULL THEN
    ALTER TABLE release_polishes RENAME TO polishes;
  END IF;
END $$;

ALTER TABLE polishes DROP COLUMN IF EXISTS release_id;
ALTER TABLE polishes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE polishes ADD COLUMN IF NOT EXISTS color_hex TEXT;
ALTER TABLE polishes DROP CONSTRAINT IF EXISTS polishes_color_hex_check;
ALTER TABLE polishes
  ADD CONSTRAINT polishes_color_hex_check
  CHECK (color_hex IS NULL OR color_hex ~* '^#[0-9a-f]{6}$');

DROP POLICY IF EXISTS "release_polishes_admin_mvp_all" ON polishes;
DROP POLICY IF EXISTS "release_polishes_admin_only" ON polishes;
DROP POLICY IF EXISTS "polishes_admin_only" ON polishes;
ALTER TABLE polishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "polishes_admin_only"
  ON polishes FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- 3. Finished stock links to the polish/recipe that made it,
--    instead of the old release/batch plumbing.
-- ============================================================

ALTER TABLE finished_inventory_items DROP COLUMN IF EXISTS release_id;
ALTER TABLE finished_inventory_items DROP COLUMN IF EXISTS batch_id;
ALTER TABLE finished_inventory_items ADD COLUMN IF NOT EXISTS polish_id UUID REFERENCES polishes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS finished_inventory_items_polish_id_idx ON finished_inventory_items (polish_id);

COMMENT ON COLUMN finished_inventory_items.polish_id IS 'Which polish/recipe this stock is — the connective tissue between Stock and Recipes.';

-- ============================================================
-- 4. Drop tables for removed features (production planning,
--    marketing/sales, swatchers, community, storefront scaffolding).
-- ============================================================

DROP TABLE IF EXISTS swatcher_assignments;
DROP TABLE IF EXISTS swatchers;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS releases CASCADE;
DROP TABLE IF EXISTS social_posts;
DROP TABLE IF EXISTS retail_partners;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS charity_polishes;
DROP TABLE IF EXISTS community_replies;
DROP TABLE IF EXISTS community_posts;
DROP TABLE IF EXISTS community_channels;
DROP TABLE IF EXISTS community_profiles;
DROP TABLE IF EXISTS community_badges;
DROP TABLE IF EXISTS moderation_reports;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS products;
