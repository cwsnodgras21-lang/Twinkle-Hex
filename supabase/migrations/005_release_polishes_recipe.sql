-- Polishes (shades) per release + recipe lines with amounts in ounces.
-- Ingredient names are stored on each line (no catalog dependency for MVP).

CREATE TABLE IF NOT EXISTS release_polishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS release_polishes_release_id_idx ON release_polishes (release_id);

DROP TRIGGER IF EXISTS release_polishes_updated_at ON release_polishes;
CREATE TRIGGER release_polishes_updated_at
  BEFORE UPDATE ON release_polishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS polish_recipe_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  polish_id UUID NOT NULL REFERENCES release_polishes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  ingredient_name TEXT NOT NULL,
  amount_oz NUMERIC NOT NULL CHECK (amount_oz >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS polish_recipe_lines_polish_id_idx ON polish_recipe_lines (polish_id);

DROP TRIGGER IF EXISTS polish_recipe_lines_updated_at ON polish_recipe_lines;
CREATE TRIGGER polish_recipe_lines_updated_at
  BEFORE UPDATE ON polish_recipe_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE release_polishes IS 'Polish / shade names belonging to a release (collection launch).';
COMMENT ON TABLE polish_recipe_lines IS 'Recipe for a polish: ingredient display name and amount in ounces.';
COMMENT ON COLUMN polish_recipe_lines.amount_oz IS 'Amount in ounces (US fl oz interpretation is up to the business; stored as a numeric quantity).';

-- RLS (same MVP pattern as releases / finished_inventory_items)
ALTER TABLE release_polishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE polish_recipe_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "release_polishes_admin_mvp_all" ON release_polishes;
CREATE POLICY "release_polishes_admin_mvp_all"
  ON release_polishes
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "polish_recipe_lines_admin_mvp_all" ON polish_recipe_lines;
CREATE POLICY "polish_recipe_lines_admin_mvp_all"
  ON polish_recipe_lines
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Demo data (fixed UUIDs; safe to re-apply with ON CONFLICT)
INSERT INTO releases (id, name, collection, status)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Betrayed by a Spring Forecast',
  NULL,
  'live'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO release_polishes (id, release_id, name, sort_order)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Still Too Cold To Swim',
  0
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO polish_recipe_lines (id, polish_id, sort_order, ingredient_name, amount_oz)
VALUES
  ('33333333-3333-3333-3333-333333333301'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 0, 'TKB Blue', 0.5),
  ('33333333-3333-3333-3333-333333333302'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 1, 'Glitter Unique Red #34', 0.125),
  ('33333333-3333-3333-3333-333333333303'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 2, 'Glitter Unique Black', 0.125),
  ('33333333-3333-3333-3333-333333333304'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 3, 'TKB Love', 0.25),
  ('33333333-3333-3333-3333-333333333305'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 4, 'TKB Love', 0.25),
  ('33333333-3333-3333-3333-333333333306'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 5, 'Sheenbow TR2808', 0.1)
ON CONFLICT (id) DO NOTHING;
