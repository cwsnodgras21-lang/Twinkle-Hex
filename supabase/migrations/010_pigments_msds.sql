-- Pigments inventory + MSDS document attachments (Supabase Storage)

CREATE TABLE IF NOT EXISTS pigments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  supplier TEXT,
  color_description TEXT,
  unit TEXT NOT NULL DEFAULT 'g',
  quantity_on_hand NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS pigments_updated_at ON pigments;
CREATE TRIGGER pigments_updated_at
  BEFORE UPDATE ON pigments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS pigments_name_idx ON pigments (name);

CREATE TABLE IF NOT EXISTS pigment_msds_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pigment_id UUID NOT NULL REFERENCES pigments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pigment_msds_documents_pigment_id_idx
  ON pigment_msds_documents (pigment_id);

COMMENT ON TABLE pigments IS 'Color pigments and micas used in polish formulas.';
COMMENT ON TABLE pigment_msds_documents IS 'MSDS / SDS sheets attached to a pigment (PDF in msds-sheets bucket).';

-- RLS (MVP admin pattern — replace with auth-based policies before launch)
ALTER TABLE pigments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pigment_msds_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pigments_admin_mvp_all" ON pigments;
CREATE POLICY "pigments_admin_mvp_all"
  ON pigments
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "pigment_msds_documents_admin_mvp_all" ON pigment_msds_documents;
CREATE POLICY "pigment_msds_documents_admin_mvp_all"
  ON pigment_msds_documents
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Private storage bucket for MSDS PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'msds-sheets',
  'msds-sheets',
  false,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "msds_sheets_admin_mvp_select" ON storage.objects;
CREATE POLICY "msds_sheets_admin_mvp_select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'msds-sheets');

DROP POLICY IF EXISTS "msds_sheets_admin_mvp_insert" ON storage.objects;
CREATE POLICY "msds_sheets_admin_mvp_insert"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'msds-sheets');

DROP POLICY IF EXISTS "msds_sheets_admin_mvp_update" ON storage.objects;
CREATE POLICY "msds_sheets_admin_mvp_update"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'msds-sheets')
  WITH CHECK (bucket_id = 'msds-sheets');

DROP POLICY IF EXISTS "msds_sheets_admin_mvp_delete" ON storage.objects;
CREATE POLICY "msds_sheets_admin_mvp_delete"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'msds-sheets');
