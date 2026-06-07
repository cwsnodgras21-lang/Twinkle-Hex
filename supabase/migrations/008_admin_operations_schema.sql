-- Twinkle & Hex: Batches, swatchers, events, retail partners, and charity polishes
-- Run in Supabase SQL editor when ready.
-- Future: RLS policies for admin-only access.

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  product_id TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  planned_date DATE,
  completed_at TIMESTAMPTZ,
  quantity_produced INTEGER CHECK (quantity_produced IS NULL OR quantity_produced >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT batches_status_check
    CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled'))
);

DROP TRIGGER IF EXISTS batches_updated_at ON batches;
CREATE TRIGGER batches_updated_at
  BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS batches_status_idx ON batches (status);
CREATE INDEX IF NOT EXISTS batches_planned_date_idx ON batches (planned_date);

CREATE TABLE IF NOT EXISTS swatchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  social_handle TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS swatchers_updated_at ON swatchers;
CREATE TRIGGER swatchers_updated_at
  BEFORE UPDATE ON swatchers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS swatcher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swatcher_id UUID NOT NULL REFERENCES swatchers(id) ON DELETE CASCADE,
  release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  shade_name TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  feedback_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT swatcher_assignments_status_check
    CHECK (status IN ('pending', 'sent', 'received', 'feedback'))
);

DROP TRIGGER IF EXISTS swatcher_assignments_updated_at ON swatcher_assignments;
CREATE TRIGGER swatcher_assignments_updated_at
  BEFORE UPDATE ON swatcher_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS swatcher_assignments_release_idx
  ON swatcher_assignments (release_id);
CREATE INDEX IF NOT EXISTS swatcher_assignments_swatcher_idx
  ON swatcher_assignments (swatcher_id);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  location TEXT,
  booth TEXT,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT events_status_check
    CHECK (status IN ('planned', 'confirmed', 'completed', 'cancelled'))
);

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS events_start_date_idx ON events (start_date);
CREATE INDEX IF NOT EXISTS events_status_idx ON events (status);

CREATE TABLE IF NOT EXISTS retail_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT retail_partners_status_check
    CHECK (status IN ('active', 'inactive', 'pending'))
);

DROP TRIGGER IF EXISTS retail_partners_updated_at ON retail_partners;
CREATE TRIGGER retail_partners_updated_at
  BEFORE UPDATE ON retail_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS retail_partners_status_idx ON retail_partners (status);

CREATE TABLE IF NOT EXISTS charity_polishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_id TEXT,
  charity_name TEXT NOT NULL,
  donation_per_unit NUMERIC(12, 2),
  total_raised NUMERIC(12, 2),
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT charity_polishes_status_check
    CHECK (status IN ('active', 'completed', 'paused'))
);

DROP TRIGGER IF EXISTS charity_polishes_updated_at ON charity_polishes;
CREATE TRIGGER charity_polishes_updated_at
  BEFORE UPDATE ON charity_polishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS charity_polishes_status_idx ON charity_polishes (status);
