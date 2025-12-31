-- Migration: Add missing columns for Supabase integration
-- Run this if you have an existing database

-- Add period and stress columns to checkin_responses
ALTER TABLE checkin_responses
ADD COLUMN IF NOT EXISTS period TEXT CHECK (period IN ('morning', 'evening')) DEFAULT 'morning',
ADD COLUMN IF NOT EXISTS stress INT CHECK (stress >= 1 AND stress <= 5);

-- Drop old unique constraint and add new one with period
ALTER TABLE checkin_responses
DROP CONSTRAINT IF EXISTS checkin_responses_user_id_response_date_key;

-- Add new unique constraint (user_id, response_date, period)
-- Note: This may fail if there are duplicate entries - handle manually if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'checkin_responses_user_id_response_date_period_key'
  ) THEN
    ALTER TABLE checkin_responses
    ADD CONSTRAINT checkin_responses_user_id_response_date_period_key
    UNIQUE (user_id, response_date, period);
  END IF;
END $$;

-- Add custom_subjects column to user_settings
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS custom_subjects TEXT[] DEFAULT '{}';

-- Create new tables if they don't exist
-- content_plans
CREATE TABLE IF NOT EXISTS content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('lernplan', 'themenliste')) DEFAULT 'themenliste',
  description TEXT,
  mode app_mode DEFAULT 'standard',
  exam_date DATE,
  archived BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  rechtsgebiete JSONB DEFAULT '[]',
  imported_from TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- published_themenlisten
CREATE TABLE IF NOT EXISTS published_themenlisten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_plan_id UUID REFERENCES content_plans(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  mode app_mode DEFAULT 'standard',
  stats JSONB DEFAULT '{"unterrechtsgebiete": 0, "themen": 0}',
  gewichtung JSONB DEFAULT '{}',
  rechtsgebiete JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes if not exist
CREATE INDEX IF NOT EXISTS idx_content_plans_user_id ON content_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_type ON content_plans(type);
CREATE INDEX IF NOT EXISTS idx_content_plans_archived ON content_plans(archived);
CREATE INDEX IF NOT EXISTS idx_published_themenlisten_user_id ON published_themenlisten(user_id);

-- Enable RLS on new tables
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_themenlisten ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_plans
DROP POLICY IF EXISTS "Users can view own content_plans" ON content_plans;
CREATE POLICY "Users can view own content_plans" ON content_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own content_plans" ON content_plans;
CREATE POLICY "Users can create own content_plans" ON content_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own content_plans" ON content_plans;
CREATE POLICY "Users can update own content_plans" ON content_plans
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own content_plans" ON content_plans;
CREATE POLICY "Users can delete own content_plans" ON content_plans
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for published_themenlisten
DROP POLICY IF EXISTS "Anyone can view published_themenlisten" ON published_themenlisten;
CREATE POLICY "Anyone can view published_themenlisten" ON published_themenlisten
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can create own published_themenlisten" ON published_themenlisten;
CREATE POLICY "Users can create own published_themenlisten" ON published_themenlisten
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own published_themenlisten" ON published_themenlisten;
CREATE POLICY "Users can delete own published_themenlisten" ON published_themenlisten
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at on content_plans
DROP TRIGGER IF EXISTS update_content_plans_updated_at ON content_plans;
CREATE TRIGGER update_content_plans_updated_at
  BEFORE UPDATE ON content_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
