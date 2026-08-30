-- Twinkle & Hex production ops requirements (additive).
-- Extends batches (oz + bottles + lot), packaging BOM, polish prototypes,
-- Google Drive SDS links, photo deadlines, collaboration programs, revenue,
-- and inventory consumption. Does not rewrite historical migrations.
--
-- Rewards engine is intentionally NOT built; only shopify_customer_id is
-- added so future rewards can key off Shopify identity (not email alone).

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
-- Ops settings: fill size, photo lead time, revenue goal
-- ============================================================

ALTER TABLE ops_settings
  ADD COLUMN IF NOT EXISTS default_fill_oz_per_bottle NUMERIC NOT NULL DEFAULT 0.5
    CHECK (default_fill_oz_per_bottle > 0);
ALTER TABLE ops_settings
  ADD COLUMN IF NOT EXISTS lead_photo_upload_days INTEGER NOT NULL DEFAULT 14
    CHECK (lead_photo_upload_days >= 0);
ALTER TABLE ops_settings
  ADD COLUMN IF NOT EXISTS monthly_revenue_goal NUMERIC NOT NULL DEFAULT 1500
    CHECK (monthly_revenue_goal >= 0);

COMMENT ON COLUMN ops_settings.default_fill_oz_per_bottle IS
  'Typical ounces poured into one finished bottle (used to derive bulk remaining).';
COMMENT ON COLUMN ops_settings.lead_photo_upload_days IS
  'Days before launch that photo uploads are due for LLB/SOU/LBOH programs.';
COMMENT ON COLUMN ops_settings.monthly_revenue_goal IS
  'Twinkle & Hex monthly revenue target (not SaaS MRR). Default $1500.';

-- ============================================================
-- Ingredient cost fields (purchase → unit cost)
-- ============================================================

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS purchase_cost NUMERIC CHECK (purchase_cost IS NULL OR purchase_cost >= 0);
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS purchase_quantity NUMERIC CHECK (purchase_quantity IS NULL OR purchase_quantity > 0);
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC CHECK (unit_cost IS NULL OR unit_cost >= 0);

COMMENT ON COLUMN ingredients.purchase_cost IS 'What was paid for the last purchase lot.';
COMMENT ON COLUMN ingredients.purchase_quantity IS 'Quantity purchased in ingredient.unit for that cost.';
COMMENT ON COLUMN ingredients.unit_cost IS
  'Normalized cost per ingredient.unit. Prefer explicit value; else purchase_cost/purchase_quantity.';

-- One pigment record = one supplier. Same pigment from two suppliers = two rows.
COMMENT ON COLUMN ingredients.supplier IS
  'Single supplier for this record. Pigments from different suppliers are separate rows.';

-- ============================================================
-- Google Drive SDS as canonical compliance source
-- Existing Supabase Storage uploads remain for legacy viewing but are not
-- the long-term source of truth.
-- ============================================================

ALTER TABLE ingredient_msds_documents
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'supabase_storage';
ALTER TABLE ingredient_msds_documents
  ADD COLUMN IF NOT EXISTS google_drive_file_id TEXT;
ALTER TABLE ingredient_msds_documents
  ADD COLUMN IF NOT EXISTS google_drive_url TEXT;
ALTER TABLE ingredient_msds_documents
  ADD COLUMN IF NOT EXISTS verified_at DATE;

ALTER TABLE ingredient_msds_documents DROP CONSTRAINT IF EXISTS ingredient_msds_documents_source_check;
ALTER TABLE ingredient_msds_documents
  ADD CONSTRAINT ingredient_msds_documents_source_check
  CHECK (source IN ('supabase_storage', 'google_drive'));

-- Drive-linked rows may omit storage_path; legacy uploads keep it.
ALTER TABLE ingredient_msds_documents ALTER COLUMN storage_path DROP NOT NULL;

ALTER TABLE ingredient_msds_documents DROP CONSTRAINT IF EXISTS ingredient_msds_documents_drive_or_storage;
ALTER TABLE ingredient_msds_documents
  ADD CONSTRAINT ingredient_msds_documents_drive_or_storage
  CHECK (
    (source = 'supabase_storage' AND storage_path IS NOT NULL)
    OR (source = 'google_drive' AND google_drive_file_id IS NOT NULL AND google_drive_url IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS ingredient_msds_documents_drive_file_idx
  ON ingredient_msds_documents (google_drive_file_id)
  WHERE google_drive_file_id IS NOT NULL;

COMMENT ON COLUMN ingredient_msds_documents.source IS
  'google_drive = canonical SDS for compliance; supabase_storage = legacy/local upload.';

-- ============================================================
-- Releases: collaboration programs + photo upload deadline
-- ============================================================

ALTER TABLE releases
  ADD COLUMN IF NOT EXISTS collaboration_program TEXT;
ALTER TABLE releases
  ADD COLUMN IF NOT EXISTS photo_upload_by DATE;

ALTER TABLE releases DROP CONSTRAINT IF EXISTS releases_collaboration_program_check;
ALTER TABLE releases
  ADD CONSTRAINT releases_collaboration_program_check
  CHECK (
    collaboration_program IS NULL
    OR collaboration_program IN ('LLB', 'SOU', 'LBOH')
  );

CREATE INDEX IF NOT EXISTS releases_photo_upload_by_idx ON releases (photo_upload_by);
CREATE INDEX IF NOT EXISTS releases_collaboration_program_idx ON releases (collaboration_program);

COMMENT ON COLUMN releases.collaboration_program IS
  'Hard-coded box/collaboration programs: LLB, SOU, LBOH. Null = store/own release.';
COMMENT ON COLUMN releases.photo_upload_by IS
  'Operational deadline for uploading photos (esp. LLB/SOU/LBOH).';

-- ============================================================
-- Production batches: oz + bottles + remaining bulk + lot number
-- ============================================================

ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS total_bulk_oz NUMERIC;
ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS bottles_filled INTEGER NOT NULL DEFAULT 0
    CHECK (bottles_filled >= 0);
ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS fill_oz_per_bottle NUMERIC
    CHECK (fill_oz_per_bottle IS NULL OR fill_oz_per_bottle > 0);
ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS ounces_used_for_bottles NUMERIC
    CHECK (ounces_used_for_bottles IS NULL OR ounces_used_for_bottles >= 0);
ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS bulk_remaining_oz NUMERIC
    CHECK (bulk_remaining_oz IS NULL OR bulk_remaining_oz >= 0);
ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS lot_number TEXT;
ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS inventory_consumed_at TIMESTAMPTZ;
ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS estimated_cost_per_bottle NUMERIC
    CHECK (estimated_cost_per_bottle IS NULL OR estimated_cost_per_bottle >= 0);

-- Backfill total_bulk_oz from existing batch_size_oz
UPDATE production_batches
SET total_bulk_oz = batch_size_oz
WHERE total_bulk_oz IS NULL;

ALTER TABLE production_batches
  ALTER COLUMN total_bulk_oz SET DEFAULT 32;
ALTER TABLE production_batches
  ALTER COLUMN total_bulk_oz SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS production_batches_lot_number_uidx
  ON production_batches (lot_number)
  WHERE lot_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS production_batches_lot_number_search_idx
  ON production_batches (lot_number);

COMMENT ON COLUMN production_batches.batch_size_oz IS
  'Legacy / planned batch size in ounces. Preserved; prefer total_bulk_oz for produced bulk.';
COMMENT ON COLUMN production_batches.total_bulk_oz IS 'Total bulk polish ounces produced in this batch.';
COMMENT ON COLUMN production_batches.bottles_filled IS
  'Sellable + swatcher bottles filled from this same batch (no separate swatcher batch).';
COMMENT ON COLUMN production_batches.bulk_remaining_oz IS 'Unbottled bulk remaining after fills.';
COMMENT ON COLUMN production_batches.lot_number IS
  'Human-readable lot e.g. TH-2026-0830-001. Immutable after create.';
COMMENT ON COLUMN production_batches.inventory_consumed_at IS
  'Set once when inventory decrements are applied; prevents double-decrement.';

-- Daily lot sequence for TH-YYYY-MMDD-NNN
CREATE TABLE IF NOT EXISTS production_lot_counters (
  lot_date DATE PRIMARY KEY,
  last_seq INTEGER NOT NULL DEFAULT 0 CHECK (last_seq >= 0)
);

SELECT _lock_table_to_admin('production_lot_counters');

CREATE OR REPLACE FUNCTION allocate_production_lot_number(p_at TIMESTAMPTZ DEFAULT now())
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  d DATE := (p_at AT TIME ZONE 'America/Chicago')::date;
  seq INTEGER;
BEGIN
  INSERT INTO production_lot_counters (lot_date, last_seq)
  VALUES (d, 1)
  ON CONFLICT (lot_date) DO UPDATE
    SET last_seq = production_lot_counters.last_seq + 1
  RETURNING last_seq INTO seq;

  RETURN 'TH-' || to_char(d, 'YYYY') || '-' || to_char(d, 'MMDD') || '-' || lpad(seq::text, 3, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION allocate_production_lot_number(timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION allocate_production_lot_number(timestamptz) TO authenticated;

-- ============================================================
-- Packaging BOM (supplies per finished bottle — NOT in polish formula)
-- ============================================================

CREATE TABLE IF NOT EXISTS packaging_boms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Default finished bottle',
  polish_id UUID REFERENCES polishes(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- At most one default global BOM (polish_id IS NULL + is_default)
CREATE UNIQUE INDEX IF NOT EXISTS packaging_boms_default_uidx
  ON packaging_boms ((COALESCE(polish_id::text, 'global')))
  WHERE is_default = true;

DROP TRIGGER IF EXISTS packaging_boms_updated_at ON packaging_boms;
CREATE TRIGGER packaging_boms_updated_at
  BEFORE UPDATE ON packaging_boms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

SELECT _lock_table_to_admin('packaging_boms');

CREATE TABLE IF NOT EXISTS packaging_bom_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packaging_bom_id UUID NOT NULL REFERENCES packaging_boms(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity_per_bottle NUMERIC NOT NULL DEFAULT 1 CHECK (quantity_per_bottle > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT packaging_bom_lines_unique UNIQUE (packaging_bom_id, ingredient_id)
);

DROP TRIGGER IF EXISTS packaging_bom_lines_updated_at ON packaging_bom_lines;
CREATE TRIGGER packaging_bom_lines_updated_at
  BEFORE UPDATE ON packaging_bom_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS packaging_bom_lines_bom_idx ON packaging_bom_lines (packaging_bom_id);
CREATE INDEX IF NOT EXISTS packaging_bom_lines_ingredient_idx ON packaging_bom_lines (ingredient_id);

SELECT _lock_table_to_admin('packaging_bom_lines');

COMMENT ON TABLE packaging_boms IS
  'Finished-bottle packaging bill of materials. Packaging is NOT part of polish formulas.';
COMMENT ON TABLE packaging_bom_lines IS
  'Supply ingredients (bottles, caps, labels, boxes) consumed per finished bottle.';

-- Seed a default empty BOM shell if none exists
INSERT INTO packaging_boms (name, is_default, notes)
SELECT 'Default finished bottle', true, 'Edit to add bottle, cap/brush, label, optional box.'
WHERE NOT EXISTS (SELECT 1 FROM packaging_boms WHERE is_default = true AND polish_id IS NULL);

-- ============================================================
-- Inventory movement audit (ties consumption to production batch)
-- ============================================================

CREATE TABLE IF NOT EXISTS production_inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  movement_kind TEXT NOT NULL,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  finished_inventory_item_id UUID REFERENCES finished_inventory_items(id) ON DELETE SET NULL,
  quantity_delta NUMERIC NOT NULL,
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT production_inventory_movements_kind_check
    CHECK (movement_kind IN (
      'ingredient_consume',
      'packaging_consume',
      'finished_bottle_increase'
    ))
);

CREATE INDEX IF NOT EXISTS production_inventory_movements_batch_idx
  ON production_inventory_movements (production_batch_id);

SELECT _lock_table_to_admin('production_inventory_movements');

-- Atomic inventory apply: refuses if already consumed.
CREATE OR REPLACE FUNCTION apply_production_batch_inventory(
  p_batch_id UUID,
  p_ingredient_decrements JSONB,
  p_packaging_decrements JSONB,
  p_finished_delta NUMERIC,
  p_polish_id UUID,
  p_polish_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_consumed TIMESTAMPTZ;
  v_elem JSONB;
  v_ing UUID;
  v_qty NUMERIC;
  v_unit TEXT;
  v_stock NUMERIC;
  v_fin_id UUID;
BEGIN
  SELECT inventory_consumed_at INTO v_consumed
  FROM production_batches
  WHERE id = p_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production batch % not found', p_batch_id;
  END IF;
  IF v_consumed IS NOT NULL THEN
    RAISE EXCEPTION 'Inventory already consumed for batch % at %', p_batch_id, v_consumed;
  END IF;

  -- Ingredient / pigment decrements
  IF p_ingredient_decrements IS NOT NULL AND jsonb_typeof(p_ingredient_decrements) = 'array' THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_ingredient_decrements)
    LOOP
      v_ing := (v_elem->>'ingredient_id')::uuid;
      v_qty := (v_elem->>'quantity')::numeric;
      IF v_ing IS NULL OR v_qty IS NULL OR v_qty = 0 THEN
        CONTINUE;
      END IF;
      SELECT quantity_on_hand, unit INTO v_stock, v_unit
      FROM ingredients WHERE id = v_ing FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Ingredient % not found', v_ing;
      END IF;
      UPDATE ingredients
      SET quantity_on_hand = quantity_on_hand - v_qty
      WHERE id = v_ing;
      INSERT INTO production_inventory_movements (
        production_batch_id, movement_kind, ingredient_id, quantity_delta, unit, notes
      ) VALUES (
        p_batch_id, 'ingredient_consume', v_ing, -v_qty, v_unit, v_elem->>'notes'
      );
    END LOOP;
  END IF;

  -- Packaging / supply decrements
  IF p_packaging_decrements IS NOT NULL AND jsonb_typeof(p_packaging_decrements) = 'array' THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_packaging_decrements)
    LOOP
      v_ing := (v_elem->>'ingredient_id')::uuid;
      v_qty := (v_elem->>'quantity')::numeric;
      IF v_ing IS NULL OR v_qty IS NULL OR v_qty = 0 THEN
        CONTINUE;
      END IF;
      SELECT quantity_on_hand, unit INTO v_stock, v_unit
      FROM ingredients WHERE id = v_ing FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Packaging supply % not found', v_ing;
      END IF;
      UPDATE ingredients
      SET quantity_on_hand = quantity_on_hand - v_qty
      WHERE id = v_ing;
      INSERT INTO production_inventory_movements (
        production_batch_id, movement_kind, ingredient_id, quantity_delta, unit, notes
      ) VALUES (
        p_batch_id, 'packaging_consume', v_ing, -v_qty, v_unit, v_elem->>'notes'
      );
    END LOOP;
  END IF;

  -- Finished bottle inventory increase
  IF p_finished_delta IS NOT NULL AND p_finished_delta > 0 AND p_polish_id IS NOT NULL THEN
    SELECT id INTO v_fin_id
    FROM finished_inventory_items
    WHERE polish_id = p_polish_id
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1
    FOR UPDATE;

    IF v_fin_id IS NULL THEN
      INSERT INTO finished_inventory_items (name, polish_id, quantity_on_hand, reserved_quantity)
      VALUES (COALESCE(NULLIF(trim(p_polish_name), ''), 'Finished polish'), p_polish_id, p_finished_delta, 0)
      RETURNING id INTO v_fin_id;
    ELSE
      UPDATE finished_inventory_items
      SET quantity_on_hand = quantity_on_hand + p_finished_delta
      WHERE id = v_fin_id;
    END IF;

    INSERT INTO production_inventory_movements (
      production_batch_id, movement_kind, finished_inventory_item_id, quantity_delta, unit, notes
    ) VALUES (
      p_batch_id, 'finished_bottle_increase', v_fin_id, p_finished_delta, 'bottle', 'Filled bottles from production batch'
    );
  END IF;

  UPDATE production_batches
  SET inventory_consumed_at = now()
  WHERE id = p_batch_id;
END;
$$;

GRANT EXECUTE ON FUNCTION apply_production_batch_inventory(uuid, jsonb, jsonb, numeric, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION apply_production_batch_inventory(uuid, jsonb, jsonb, numeric, uuid, text) TO authenticated;

-- ============================================================
-- Polish prototypes (separate from ingredient R&D rd_prototypes)
-- ============================================================

CREATE TABLE IF NOT EXISTS polish_prototypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_size_ml NUMERIC NOT NULL DEFAULT 15 CHECK (target_size_ml > 0),
  status TEXT NOT NULL DEFAULT 'testing',
  notes TEXT,
  observations TEXT,
  promoted_polish_id UUID REFERENCES polishes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT polish_prototypes_status_check
    CHECK (status IN ('testing', 'selected', 'rejected', 'archived'))
);

DROP TRIGGER IF EXISTS polish_prototypes_updated_at ON polish_prototypes;
CREATE TRIGGER polish_prototypes_updated_at
  BEFORE UPDATE ON polish_prototypes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS polish_prototypes_status_idx ON polish_prototypes (status);
CREATE INDEX IF NOT EXISTS polish_prototypes_promoted_polish_idx ON polish_prototypes (promoted_polish_id);

SELECT _lock_table_to_admin('polish_prototypes');

CREATE TABLE IF NOT EXISTS polish_prototype_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prototype_id UUID NOT NULL REFERENCES polish_prototypes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  ingredient_name TEXT NOT NULL,
  amount_oz NUMERIC NOT NULL DEFAULT 0 CHECK (amount_oz >= 0),
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS polish_prototype_lines_updated_at ON polish_prototype_lines;
CREATE TRIGGER polish_prototype_lines_updated_at
  BEFORE UPDATE ON polish_prototype_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS polish_prototype_lines_prototype_idx ON polish_prototype_lines (prototype_id);

SELECT _lock_table_to_admin('polish_prototype_lines');

CREATE TABLE IF NOT EXISTS polish_prototype_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prototype_id UUID NOT NULL REFERENCES polish_prototypes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS polish_prototype_photos_prototype_idx
  ON polish_prototype_photos (prototype_id);

SELECT _lock_table_to_admin('polish_prototype_photos');

-- Link production polish back to originating prototype (optional)
ALTER TABLE polishes
  ADD COLUMN IF NOT EXISTS source_prototype_id UUID REFERENCES polish_prototypes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS polishes_source_prototype_idx ON polishes (source_prototype_id);

COMMENT ON TABLE polish_prototypes IS
  'Polish development prototypes (15 ml standard). Separate from ingredient R&D rd_prototypes.';
COMMENT ON TABLE polish_prototype_photos IS
  'Prototype photos stored in app Supabase storage (prototype-photos bucket).';

-- Private storage bucket for prototype photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prototype-photos',
  'prototype-photos',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "prototype_photos_admin_select" ON storage.objects;
CREATE POLICY "prototype_photos_admin_select"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'prototype-photos');

DROP POLICY IF EXISTS "prototype_photos_admin_insert" ON storage.objects;
CREATE POLICY "prototype_photos_admin_insert"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'prototype-photos');

DROP POLICY IF EXISTS "prototype_photos_admin_update" ON storage.objects;
CREATE POLICY "prototype_photos_admin_update"
  ON storage.objects FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'prototype-photos')
  WITH CHECK (bucket_id = 'prototype-photos');

DROP POLICY IF EXISTS "prototype_photos_admin_delete" ON storage.objects;
CREATE POLICY "prototype_photos_admin_delete"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = 'prototype-photos');

-- ============================================================
-- Manual program revenue (PayPal-derived LLB/SOU/LBOH)
-- Designed so automated PayPal ingest can write the same table later.
-- ============================================================

CREATE TABLE IF NOT EXISTS revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  source TEXT NOT NULL,
  payment_method TEXT,
  external_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT revenue_entries_source_check
    CHECK (source IN ('LLB', 'SOU', 'LBOH', 'other'))
);

DROP TRIGGER IF EXISTS revenue_entries_updated_at ON revenue_entries;
CREATE TRIGGER revenue_entries_updated_at
  BEFORE UPDATE ON revenue_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS revenue_entries_received_date_idx ON revenue_entries (received_date DESC);
CREATE INDEX IF NOT EXISTS revenue_entries_source_idx ON revenue_entries (source);
CREATE INDEX IF NOT EXISTS revenue_entries_external_ref_idx
  ON revenue_entries (external_reference)
  WHERE external_reference IS NOT NULL;

SELECT _lock_table_to_admin('revenue_entries');

COMMENT ON TABLE revenue_entries IS
  'Manual (and future automated) program revenue by business source. Shopify store revenue stays in commerce_orders.';
COMMENT ON COLUMN revenue_entries.source IS
  'Business source: LLB / SOU / LBOH (not payment method).';
COMMENT ON COLUMN revenue_entries.payment_method IS
  'Optional: paypal, transfer, etc. Do not use as the reporting category.';
COMMENT ON COLUMN revenue_entries.external_reference IS
  'PayPal transaction id or similar — supports future automated ingest dedupe.';

-- ============================================================
-- Rewards readiness (do NOT build the engine yet)
-- Prefer Shopify customer id over email as durable identity.
-- ============================================================

ALTER TABLE commerce_orders
  ADD COLUMN IF NOT EXISTS shopify_customer_id TEXT;

CREATE INDEX IF NOT EXISTS commerce_orders_shopify_customer_id_idx
  ON commerce_orders (shopify_customer_id)
  WHERE shopify_customer_id IS NOT NULL;

COMMENT ON COLUMN commerce_orders.shopify_customer_id IS
  'Shopify customer GID/id for future rewards. Do not treat email as irreversible identity.';

-- Placeholder tables documenting future rewards shape without implementing engine.
CREATE TABLE IF NOT EXISTS rewards_future_notes (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  notes TEXT NOT NULL DEFAULT
    'Rewards deferred: Shopify orders = purchase truth; collections via Shopify collections; '
    'dedupe polish per customer for collection completion; physical patches ship with orders; '
    'identity = shopify_customer_id (not email alone).',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO rewards_future_notes (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
SELECT _lock_table_to_admin('rewards_future_notes');

DROP FUNCTION _lock_table_to_admin(text);
