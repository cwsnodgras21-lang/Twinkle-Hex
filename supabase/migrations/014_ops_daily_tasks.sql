-- Daily task checklist for the ops dashboard ("Today's Plan").
-- Deliberately minimal: no priority/assignee/recurrence — just a per-day list.

CREATE TABLE IF NOT EXISTS ops_daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  tag TEXT,
  time_label TEXT,
  item_date DATE NOT NULL DEFAULT CURRENT_DATE,
  done BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS ops_daily_tasks_updated_at ON ops_daily_tasks;
CREATE TRIGGER ops_daily_tasks_updated_at
  BEFORE UPDATE ON ops_daily_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS ops_daily_tasks_item_date_idx ON ops_daily_tasks (item_date);

ALTER TABLE ops_daily_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ops_daily_tasks_admin_only ON ops_daily_tasks;
CREATE POLICY ops_daily_tasks_admin_only ON ops_daily_tasks FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
