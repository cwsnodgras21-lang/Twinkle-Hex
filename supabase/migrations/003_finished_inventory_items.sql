-- Finished goods inventory items (local tracking; optional Shopify + release links)
-- Run after 002_releases_schema.sql (releases table required for release_id FK).

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS finished_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  release_id UUID REFERENCES releases(id) ON DELETE SET NULL,
  quantity_on_hand NUMERIC NOT NULL DEFAULT 0,
  reserved_quantity NUMERIC NOT NULL DEFAULT 0,
  location TEXT,
  product_id TEXT,
  variant_id TEXT,
  batch_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS finished_inventory_items_updated_at ON finished_inventory_items;
CREATE TRIGGER finished_inventory_items_updated_at
  BEFORE UPDATE ON finished_inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE finished_inventory_items IS 'Finished polish stock; optional link to releases for launch planning.';
COMMENT ON COLUMN finished_inventory_items.release_id IS 'FK to releases — optional campaign / launch grouping.';
COMMENT ON COLUMN finished_inventory_items.product_id IS 'Shopify product GID or numeric id when synced.';
COMMENT ON COLUMN finished_inventory_items.variant_id IS 'Shopify variant id when synced.';
