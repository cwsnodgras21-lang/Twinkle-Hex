-- Production Operating System (additive).
-- Depends on post-012 core: ingredients, polishes, polish_recipe_lines,
-- finished_inventory_items, ingredient_msds_documents.
--
-- Reintroduces lean releases / batches / swatchers for operational planning
-- without restoring the old CRM/community/marketing suite.
-- Polishes remain standalone; releases link via release_polishes.

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION _lock_table_to_admin(target text) RETURNS void AS $$
BEGIN
  IF to_regclass('public.' || target) IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', target);
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

-- ============================================================
-- Ingredient lifecycle (R&D vs production eligibility)
-- ============================================================

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'tracked';
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS received_date DATE;
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS lot_number TEXT;
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS supplier_identifier TEXT;

ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_lifecycle_status_check;
ALTER TABLE ingredients
  ADD CONSTRAINT ingredients_lifecycle_status_check
  CHECK (lifecycle_status IN ('tracked', 'experimental', 'approved', 'rejected', 'archived'));

COMMENT ON COLUMN ingredients.lifecycle_status IS
  'tracked=ops-relevant without R&D gate; experimental/approved/rejected for R&D pigments; archived=hidden from active pickers.';

-- ============================================================
-- Formula version counter on polish (current formula = recipe lines)
-- ============================================================

ALTER TABLE polishes
  ADD COLUMN IF NOT EXISTS formula_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE polishes
  ADD COLUMN IF NOT EXISTS is_core BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE polishes
  ADD COLUMN IF NOT EXISTS stock_target INTEGER;

ALTER TABLE polish_recipe_lines
  ADD COLUMN IF NOT EXISTS ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS polish_recipe_lines_ingredient_id_idx
  ON polish_recipe_lines (ingredient_id);

-- Bump formula_version whenever recipe lines are replaced via RPC.
CREATE OR REPLACE FUNCTION replace_polish_recipe_lines(p_polish_id uuid, p_lines jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  DELETE FROM polish_recipe_lines WHERE polish_id = p_polish_id;
  IF p_lines IS NOT NULL AND jsonb_typeof(p_lines) = 'array' AND jsonb_array_length(p_lines) > 0 THEN
    INSERT INTO polish_recipe_lines (polish_id, sort_order, ingredient_name, amount_oz, ingredient_id)
    SELECT p_polish_id,
           (t.ord - 1)::int,
           trim((t.elem->>'ingredient_name')::text),
           (t.elem->>'amount_oz')::numeric,
           CASE
             WHEN t.elem ? 'ingredient_id'
               AND nullif(trim(t.elem->>'ingredient_id'), '') IS NOT NULL
             THEN (t.elem->>'ingredient_id')::uuid
             ELSE NULL
           END
    FROM jsonb_array_elements(p_lines) WITH ORDINALITY AS t(elem, ord);
  END IF;

  UPDATE polishes
  SET formula_version = COALESCE(formula_version, 1) + 1
  WHERE id = p_polish_id;
END;
$$;

GRANT EXECUTE ON FUNCTION replace_polish_recipe_lines(uuid, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION replace_polish_recipe_lines(uuid, jsonb) TO authenticated;

-- ============================================================
-- Ops settings (single-row defaults)
-- ============================================================

CREATE TABLE IF NOT EXISTS ops_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_batch_oz NUMERIC NOT NULL DEFAULT 32 CHECK (default_batch_oz > 0),
  -- Lead times: days BEFORE target_launch_date
  lead_marketing_days INTEGER NOT NULL DEFAULT 7 CHECK (lead_marketing_days >= 0),
  lead_swatch_return_days INTEGER NOT NULL DEFAULT 21 CHECK (lead_swatch_return_days >= 0),
  lead_swatcher_send_days INTEGER NOT NULL DEFAULT 35 CHECK (lead_swatcher_send_days >= 0),
  lead_production_complete_days INTEGER NOT NULL DEFAULT 42 CHECK (lead_production_complete_days >= 0),
  -- Workdays: array of ISO weekday numbers 1=Mon .. 7=Sun
  production_weekdays INTEGER[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5],
  max_batches_per_day INTEGER NOT NULL DEFAULT 2 CHECK (max_batches_per_day >= 1),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS ops_settings_updated_at ON ops_settings;
CREATE TRIGGER ops_settings_updated_at
  BEFORE UPDATE ON ops_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO ops_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

SELECT _lock_table_to_admin('ops_settings');

-- ============================================================
-- Releases / collections
-- ============================================================

CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  target_launch_date DATE,
  production_complete_by DATE,
  swatcher_send_by DATE,
  swatch_return_by DATE,
  marketing_ready_by DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT releases_status_check
    CHECK (status IN ('planned', 'in_production', 'swatching', 'marketing', 'launched', 'archived'))
);

DROP TRIGGER IF EXISTS releases_updated_at ON releases;
CREATE TRIGGER releases_updated_at
  BEFORE UPDATE ON releases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS releases_target_launch_date_idx ON releases (target_launch_date);
CREATE INDEX IF NOT EXISTS releases_status_idx ON releases (status);

SELECT _lock_table_to_admin('releases');

-- Join: polishes stay independent; a polish may appear in multiple releases over time.
CREATE TABLE IF NOT EXISTS release_polishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  polish_id UUID NOT NULL REFERENCES polishes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  production_status TEXT NOT NULL DEFAULT 'needed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT release_polishes_unique UNIQUE (release_id, polish_id),
  CONSTRAINT release_polishes_production_status_check
    CHECK (production_status IN ('needed', 'formula_ready', 'batched', 'complete'))
);

DROP TRIGGER IF EXISTS release_polishes_updated_at ON release_polishes;
CREATE TRIGGER release_polishes_updated_at
  BEFORE UPDATE ON release_polishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS release_polishes_release_id_idx ON release_polishes (release_id);
CREATE INDEX IF NOT EXISTS release_polishes_polish_id_idx ON release_polishes (polish_id);

SELECT _lock_table_to_admin('release_polishes');

-- ============================================================
-- Production batches (execution history + formula snapshot)
-- ============================================================

CREATE TABLE IF NOT EXISTS production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  polish_id UUID NOT NULL REFERENCES polishes(id) ON DELETE RESTRICT,
  release_id UUID REFERENCES releases(id) ON DELETE SET NULL,
  batch_size_oz NUMERIC NOT NULL DEFAULT 32 CHECK (batch_size_oz > 0),
  status TEXT NOT NULL DEFAULT 'planned',
  planned_date DATE,
  completed_at TIMESTAMPTZ,
  formula_version INTEGER NOT NULL,
  formula_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT production_batches_status_check
    CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled'))
);

DROP TRIGGER IF EXISTS production_batches_updated_at ON production_batches;
CREATE TRIGGER production_batches_updated_at
  BEFORE UPDATE ON production_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS production_batches_polish_id_idx ON production_batches (polish_id);
CREATE INDEX IF NOT EXISTS production_batches_release_id_idx ON production_batches (release_id);
CREATE INDEX IF NOT EXISTS production_batches_status_idx ON production_batches (status);
CREATE INDEX IF NOT EXISTS production_batches_planned_date_idx ON production_batches (planned_date);

COMMENT ON COLUMN production_batches.formula_snapshot IS
  'Immutable copy of recipe lines [{ingredient_name, amount_oz, ingredient_id?}] at batch time.';

SELECT _lock_table_to_admin('production_batches');

-- ============================================================
-- R&D prototypes (structurally separate from production batches)
-- ============================================================

CREATE TABLE IF NOT EXISTS rd_prototypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_date DATE,
  observation_notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  outcome_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT rd_prototypes_status_check
    CHECK (status IN ('in_progress', 'approved', 'rejected'))
);

DROP TRIGGER IF EXISTS rd_prototypes_updated_at ON rd_prototypes;
CREATE TRIGGER rd_prototypes_updated_at
  BEFORE UPDATE ON rd_prototypes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS rd_prototypes_review_date_idx ON rd_prototypes (review_date);
CREATE INDEX IF NOT EXISTS rd_prototypes_status_idx ON rd_prototypes (status);
CREATE INDEX IF NOT EXISTS rd_prototypes_ingredient_id_idx ON rd_prototypes (ingredient_id);

SELECT _lock_table_to_admin('rd_prototypes');

-- ============================================================
-- Swatchers
-- ============================================================

CREATE TABLE IF NOT EXISTS swatchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  social_handle TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS swatchers_updated_at ON swatchers;
CREATE TRIGGER swatchers_updated_at
  BEFORE UPDATE ON swatchers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

SELECT _lock_table_to_admin('swatchers');

CREATE TABLE IF NOT EXISTS swatcher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swatcher_id UUID NOT NULL REFERENCES swatchers(id) ON DELETE CASCADE,
  release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  polish_id UUID REFERENCES polishes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  send_by DATE,
  sent_at DATE,
  expected_return_at DATE,
  returned_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT swatcher_assignments_status_check
    CHECK (status IN ('planned', 'sent', 'returned', 'cancelled'))
);

DROP TRIGGER IF EXISTS swatcher_assignments_updated_at ON swatcher_assignments;
CREATE TRIGGER swatcher_assignments_updated_at
  BEFORE UPDATE ON swatcher_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS swatcher_assignments_release_idx ON swatcher_assignments (release_id);
CREATE INDEX IF NOT EXISTS swatcher_assignments_swatcher_idx ON swatcher_assignments (swatcher_id);
CREATE INDEX IF NOT EXISTS swatcher_assignments_send_by_idx ON swatcher_assignments (send_by);

SELECT _lock_table_to_admin('swatcher_assignments');

-- ============================================================
-- Thin calendar notes (optional marketing milestones — not a second CRM)
-- ============================================================

CREATE TABLE IF NOT EXISTS ops_calendar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  item_date DATE NOT NULL,
  kind TEXT NOT NULL DEFAULT 'marketing',
  notes TEXT,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ops_calendar_items_kind_check
    CHECK (kind IN ('marketing', 'email', 'post', 'other'))
);

DROP TRIGGER IF EXISTS ops_calendar_items_updated_at ON ops_calendar_items;
CREATE TRIGGER ops_calendar_items_updated_at
  BEFORE UPDATE ON ops_calendar_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS ops_calendar_items_item_date_idx ON ops_calendar_items (item_date);

SELECT _lock_table_to_admin('ops_calendar_items');

DROP FUNCTION _lock_table_to_admin(text);
