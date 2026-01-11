-- 🏥 Alakeed QC Dashboard - Supabase Schema Setup (v1.1)

-- 1. Create AI Reports Table with proper UUID generation
CREATE TABLE IF NOT EXISTS ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id TEXT NOT NULL,
    analysis TEXT NOT NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    prompt_id TEXT NOT NULL,
    report_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID DEFAULT auth.uid() -- Track which user performed the audit
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_ai_reports_lab_id ON ai_reports(lab_id);

-- 2. Create Dashboard Settings Table
CREATE TABLE IF NOT EXISTS dashboard_settings (
    id TEXT PRIMARY KEY, -- We'll use 'global' as the ID
    ai_settings JSONB NOT NULL,
    prompt_state JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID DEFAULT auth.uid()
);

-- 3. Enable RLS
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_settings ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Public read, Authenticated write for medical staff)
DROP POLICY IF EXISTS "Allow anonymous select" ON ai_reports;
CREATE POLICY "Allow authenticated read" ON ai_reports FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert" ON ai_reports;
CREATE POLICY "Allow authenticated insert" ON ai_reports FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous select settings" ON dashboard_settings;
CREATE POLICY "Allow authenticated read settings" ON dashboard_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow anonymous upsert settings" ON dashboard_settings;
CREATE POLICY "Allow authenticated manage settings" ON dashboard_settings FOR ALL TO authenticated USING (true);
