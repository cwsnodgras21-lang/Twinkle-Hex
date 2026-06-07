-- Backfill production batches schema so the admin CRUD pages can read and write safely.
-- Safe to run multiple times.

ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS batch_number TEXT,
  ADD COLUMN IF NOT EXISTS product_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS planned_date DATE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quantity_produced INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE batches
SET batch_number = id::text
WHERE batch_number IS NULL;

ALTER TABLE batches
  ALTER COLUMN batch_number SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'batches_status_check'
      AND conrelid = 'batches'::regclass
  ) THEN
    ALTER TABLE batches
      ADD CONSTRAINT batches_status_check
      CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS batches_batch_number_key
  ON batches (batch_number);

CREATE INDEX IF NOT EXISTS batches_status_idx
  ON batches (status);

CREATE INDEX IF NOT EXISTS batches_planned_date_idx
  ON batches (planned_date);

DROP TRIGGER IF EXISTS batches_updated_at ON batches;
CREATE TRIGGER batches_updated_at
  BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
