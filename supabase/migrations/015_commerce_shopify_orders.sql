-- Commerce / Shopify order ingestion (additive).
-- Shopify → app webhook API → these tables. App owns validation and persistence.
-- Maps Shopify variants to existing polishes (canonical product entity).

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
-- Orders
-- ============================================================

CREATE TABLE IF NOT EXISTS commerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain TEXT NOT NULL DEFAULT 'primary',
  shopify_order_id TEXT NOT NULL,
  shopify_order_number INTEGER,
  shopify_order_name TEXT,
  customer_name TEXT,
  customer_email TEXT,
  financial_status TEXT,
  fulfillment_status TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ordered_at TIMESTAMPTZ,
  shopify_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT commerce_orders_shop_order_unique UNIQUE (shop_domain, shopify_order_id)
);

CREATE INDEX IF NOT EXISTS commerce_orders_ordered_at_idx
  ON commerce_orders (ordered_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS commerce_orders_fulfillment_status_idx
  ON commerce_orders (fulfillment_status);

DROP TRIGGER IF EXISTS commerce_orders_updated_at ON commerce_orders;
CREATE TRIGGER commerce_orders_updated_at
  BEFORE UPDATE ON commerce_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Order lines
-- ============================================================

CREATE TABLE IF NOT EXISTS commerce_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_order_id UUID NOT NULL REFERENCES commerce_orders(id) ON DELETE CASCADE,
  shopify_line_item_id TEXT NOT NULL,
  shopify_product_id TEXT,
  shopify_variant_id TEXT,
  sku TEXT,
  product_title TEXT,
  variant_title TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  polish_id UUID REFERENCES polishes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT commerce_order_lines_order_line_unique UNIQUE (commerce_order_id, shopify_line_item_id)
);

CREATE INDEX IF NOT EXISTS commerce_order_lines_variant_idx
  ON commerce_order_lines (shopify_variant_id);
CREATE INDEX IF NOT EXISTS commerce_order_lines_polish_id_idx
  ON commerce_order_lines (polish_id);
CREATE INDEX IF NOT EXISTS commerce_order_lines_unmapped_idx
  ON commerce_order_lines (shopify_variant_id)
  WHERE polish_id IS NULL;

DROP TRIGGER IF EXISTS commerce_order_lines_updated_at ON commerce_order_lines;
CREATE TRIGGER commerce_order_lines_updated_at
  BEFORE UPDATE ON commerce_order_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Product mappings (Shopify variant → polish)
-- ============================================================

CREATE TABLE IF NOT EXISTS commerce_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'shopify' CHECK (provider = 'shopify'),
  shop_domain TEXT NOT NULL DEFAULT 'primary',
  shopify_product_id TEXT,
  shopify_variant_id TEXT NOT NULL,
  sku TEXT,
  polish_id UUID NOT NULL REFERENCES polishes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT commerce_product_mappings_variant_unique UNIQUE (provider, shop_domain, shopify_variant_id)
);

CREATE INDEX IF NOT EXISTS commerce_product_mappings_polish_id_idx
  ON commerce_product_mappings (polish_id);

DROP TRIGGER IF EXISTS commerce_product_mappings_updated_at ON commerce_product_mappings;
CREATE TRIGGER commerce_product_mappings_updated_at
  BEFORE UPDATE ON commerce_product_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Integration events (idempotency + observability)
-- ============================================================

CREATE TABLE IF NOT EXISTS commerce_integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'shopify',
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  shop_domain TEXT NOT NULL DEFAULT 'primary',
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'duplicate', 'failed')),
  commerce_order_id UUID REFERENCES commerce_orders(id) ON DELETE SET NULL,
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT commerce_integration_events_provider_event_unique UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS commerce_integration_events_order_idx
  ON commerce_integration_events (commerce_order_id);
CREATE INDEX IF NOT EXISTS commerce_integration_events_status_idx
  ON commerce_integration_events (status);

DROP TRIGGER IF EXISTS commerce_integration_events_updated_at ON commerce_integration_events;
CREATE TRIGGER commerce_integration_events_updated_at
  BEFORE UPDATE ON commerce_integration_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS: admin JWT only (service role bypasses for webhook ingest)
-- ============================================================

SELECT _lock_table_to_admin('commerce_orders');
SELECT _lock_table_to_admin('commerce_order_lines');
SELECT _lock_table_to_admin('commerce_product_mappings');
SELECT _lock_table_to_admin('commerce_integration_events');

COMMENT ON TABLE commerce_orders IS
  'Shopify orders ingested via app webhook API. App owns validation and persistence.';
COMMENT ON TABLE commerce_order_lines IS
  'Line items for commerce_orders. polish_id null until Shopify variant is mapped.';
COMMENT ON TABLE commerce_product_mappings IS
  'Durable Shopify variant → polishes mapping. Variant ID is the immutable key.';
COMMENT ON TABLE commerce_integration_events IS
  'Idempotency + observability for Shopify webhook deliveries (X-Shopify-Webhook-Id).';
