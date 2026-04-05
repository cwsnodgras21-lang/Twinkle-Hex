-- Twinkle & Hex: Releases (launch pipeline) - MVP schema
-- Run in Supabase SQL editor when ready.
-- Future: RLS policies for admin-only access.

-- Release stages: concept → formula development → testing → swatcher phase →
-- photography → marketing → launch ready → live
CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  collection TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'concept',
  target_launch_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS releases_updated_at ON releases;
CREATE TRIGGER releases_updated_at
  BEFORE UPDATE ON releases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Placeholder for future: shades/polishes per release
-- Links to Shopify products when sync is built
-- CREATE TABLE release_items (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
--   shade_name TEXT,
--   product_id TEXT,  -- Shopify product ID
--   variant_id TEXT, -- Shopify variant ID
--   sort_order INTEGER DEFAULT 0,
--   created_at TIMESTAMPTZ DEFAULT now(),
--   updated_at TIMESTAMPTZ DEFAULT now()
-- );

-- Future: swatcher_assignments already references releases(id)
-- Future: social_posts can add release_id for launch campaigns
-- Future: release_items links releases to products/shades
