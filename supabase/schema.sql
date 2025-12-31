-- PrepWell Database Schema for Supabase
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/vitvxwfcutysuifuqnqi/sql)

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE app_mode AS ENUM ('standard', 'exam');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('unerledigt', 'erledigt');
CREATE TYPE grade_system AS ENUM ('punkte', 'noten');
CREATE TYPE exam_status AS ENUM ('angemeldet', 'bestanden', 'nicht_bestanden', 'ausstehend');
CREATE TYPE timer_type AS ENUM ('pomodoro', 'countdown', 'countup');
CREATE TYPE block_type AS ENUM ('lernblock', 'exam', 'repetition', 'private');

-- ============================================
-- TABLES
-- ============================================

-- Lernpläne (Learning Plans)
CREATE TABLE lernplaene (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  mode app_mode DEFAULT 'standard',
  start_date DATE,
  end_date DATE,
  archived BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contents (Learning Material)
CREATE TABLE contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lernplan_id UUID REFERENCES lernplaene(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  rechtsgebiet TEXT,
  unterrechtsgebiet TEXT,
  block_type block_type DEFAULT 'lernblock',
  color TEXT,
  themes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Slots
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lernplan_id UUID NOT NULL REFERENCES lernplaene(id) ON DELETE CASCADE,
  content_id UUID REFERENCES contents(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  position INT CHECK (position >= 1 AND position <= 4),
  is_locked BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lernplan_id, date, position)
);

-- Aufgaben (Tasks)
CREATE TABLE aufgaben (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lernplan_id UUID REFERENCES lernplaene(id) ON DELETE CASCADE,
  content_id UUID REFERENCES contents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'unerledigt',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leistungen (Exams/Grades - Normal Mode)
CREATE TABLE leistungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  title TEXT,
  description TEXT,
  exam_date DATE NOT NULL,
  exam_time TIME,
  grade DECIMAL(4,1),
  grade_system grade_system DEFAULT 'punkte',
  ects INT,
  semester TEXT,
  status exam_status DEFAULT 'ausstehend',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Übungsklausuren (Practice Exams - Exam Mode)
CREATE TABLE uebungsklausuren (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lernplan_id UUID REFERENCES lernplaene(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  rechtsgebiet TEXT,
  description TEXT,
  exam_date DATE NOT NULL,
  punkte INT CHECK (punkte >= 0 AND punkte <= 18),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Plans (Lernpläne & Themenlisten - hierarchical structure)
-- Stores the full hierarchy: Plan → Rechtsgebiete → Unterrechtsgebiete → Kapitel → Themen → Aufgaben
CREATE TABLE content_plans (
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
  -- Full hierarchical structure as JSONB
  -- Structure: [{ rechtsgebietId, name, unterrechtsgebiete: [{ id, name, kategorie, kapitel: [{ id, title, themen: [{ id, title, aufgaben: [...] }] }] }] }]
  rechtsgebiete JSONB DEFAULT '[]',
  -- Import tracking
  imported_from TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Published Themenlisten (Community sharing)
CREATE TABLE published_themenlisten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_plan_id UUID REFERENCES content_plans(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  mode app_mode DEFAULT 'standard',
  -- Statistics
  stats JSONB DEFAULT '{"unterrechtsgebiete": 0, "themen": 0}',
  gewichtung JSONB DEFAULT '{}',
  -- Snapshot of rechtsgebiete at publish time
  rechtsgebiete JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Themenlisten (Theme Lists) - LEGACY, kept for backwards compatibility
CREATE TABLE themenlisten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rechtsgebiet TEXT,
  themes JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Unterrechtsgebiete
CREATE TABLE custom_unterrechtsgebiete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rechtsgebiet TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, rechtsgebiet)
);

-- Check-In Responses (Mentor)
CREATE TABLE checkin_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  response_date DATE NOT NULL,
  period TEXT CHECK (period IN ('morning', 'evening')) DEFAULT 'morning',
  mood INT CHECK (mood >= 1 AND mood <= 5),
  energy INT CHECK (energy >= 1 AND energy <= 5),
  focus INT CHECK (focus >= 1 AND focus <= 5),
  stress INT CHECK (stress >= 1 AND stress <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, response_date, period)
);

-- Timer Sessions (for statistics)
CREATE TABLE timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lernplan_id UUID REFERENCES lernplaene(id) ON DELETE SET NULL,
  session_type timer_type DEFAULT 'pomodoro',
  duration_seconds INT,
  completed BOOLEAN DEFAULT FALSE,
  session_date DATE,
  session_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wizard Draft (persists incomplete wizards)
CREATE TABLE wizard_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INT DEFAULT 1,
  wizard_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Private Blocks (Personal calendar entries, not part of Lernplan)
CREATE TABLE private_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT FALSE,
  repeat_enabled BOOLEAN DEFAULT FALSE,
  repeat_type TEXT,
  repeat_count INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Slots (User's learning slots, independent of Lernplan)
-- Supports both wizard-created and manual slots
CREATE TABLE calendar_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_plan_id UUID REFERENCES content_plans(id) ON DELETE SET NULL,
  slot_date DATE NOT NULL,
  position INT CHECK (position >= 1 AND position <= 4),
  content_id TEXT,
  title TEXT,
  rechtsgebiet TEXT,
  unterrechtsgebiet TEXT,
  block_type TEXT DEFAULT 'lernblock',
  is_locked BOOLEAN DEFAULT FALSE,
  is_from_lernplan BOOLEAN DEFAULT FALSE,
  has_time BOOLEAN DEFAULT FALSE,
  start_hour INT,
  duration INT,
  start_time TIME,
  end_time TIME,
  repeat_enabled BOOLEAN DEFAULT FALSE,
  repeat_type TEXT,
  repeat_count INT,
  tasks JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Tasks (Daily tasks, separate from Aufgaben in content plans)
CREATE TABLE calendar_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  completed BOOLEAN DEFAULT FALSE,
  linked_slot_id UUID REFERENCES calendar_slots(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Archived Lernpläne (Previous calendar configurations)
CREATE TABLE archived_lernplaene (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  slots_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  mentor_activated BOOLEAN DEFAULT FALSE,
  preferred_grade_system grade_system DEFAULT 'punkte',
  timer_settings JSONB DEFAULT '{}',
  custom_subjects TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_lernplaene_user_id ON lernplaene(user_id);
CREATE INDEX idx_lernplaene_archived ON lernplaene(archived);
CREATE INDEX idx_contents_lernplan_id ON contents(lernplan_id);
CREATE INDEX idx_slots_lernplan_id ON slots(lernplan_id);
CREATE INDEX idx_slots_date ON slots(date);
CREATE INDEX idx_slots_lernplan_date ON slots(lernplan_id, date);
CREATE INDEX idx_aufgaben_user_id ON aufgaben(user_id);
CREATE INDEX idx_aufgaben_lernplan_id ON aufgaben(lernplan_id);
CREATE INDEX idx_aufgaben_due_date ON aufgaben(due_date);
CREATE INDEX idx_aufgaben_status ON aufgaben(status);
CREATE INDEX idx_leistungen_user_id ON leistungen(user_id);
CREATE INDEX idx_uebungsklausuren_user_id ON uebungsklausuren(user_id);
CREATE INDEX idx_checkin_user_date ON checkin_responses(user_id, response_date);
CREATE INDEX idx_timer_sessions_user_id ON timer_sessions(user_id);
CREATE INDEX idx_content_plans_user_id ON content_plans(user_id);
CREATE INDEX idx_content_plans_type ON content_plans(type);
CREATE INDEX idx_content_plans_archived ON content_plans(archived);
CREATE INDEX idx_published_themenlisten_user_id ON published_themenlisten(user_id);

-- Private Blocks indexes
CREATE INDEX idx_private_blocks_user_id ON private_blocks(user_id);
CREATE INDEX idx_private_blocks_date ON private_blocks(block_date);
CREATE INDEX idx_private_blocks_user_date ON private_blocks(user_id, block_date);

-- Calendar Slots indexes
CREATE INDEX idx_calendar_slots_user_id ON calendar_slots(user_id);
CREATE INDEX idx_calendar_slots_date ON calendar_slots(slot_date);
CREATE INDEX idx_calendar_slots_user_date ON calendar_slots(user_id, slot_date);

-- Calendar Tasks indexes
CREATE INDEX idx_calendar_tasks_user_id ON calendar_tasks(user_id);
CREATE INDEX idx_calendar_tasks_date ON calendar_tasks(task_date);
CREATE INDEX idx_calendar_tasks_user_date ON calendar_tasks(user_id, task_date);

-- Archived Lernplaene indexes
CREATE INDEX idx_archived_lernplaene_user_id ON archived_lernplaene(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE lernplaene ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE aufgaben ENABLE ROW LEVEL SECURITY;
ALTER TABLE leistungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE uebungsklausuren ENABLE ROW LEVEL SECURITY;
ALTER TABLE themenlisten ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_themenlisten ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_unterrechtsgebiete ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wizard_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_lernplaene ENABLE ROW LEVEL SECURITY;

-- Lernplaene Policies
CREATE POLICY "Users can view own lernplaene" ON lernplaene
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own lernplaene" ON lernplaene
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lernplaene" ON lernplaene
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lernplaene" ON lernplaene
  FOR DELETE USING (auth.uid() = user_id);

-- Contents Policies
CREATE POLICY "Users can view own contents" ON contents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own contents" ON contents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contents" ON contents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contents" ON contents
  FOR DELETE USING (auth.uid() = user_id);

-- Slots Policies (based on lernplan ownership)
CREATE POLICY "Users can view slots of own lernplaene" ON slots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM lernplaene WHERE lernplaene.id = slots.lernplan_id AND lernplaene.user_id = auth.uid())
  );
CREATE POLICY "Users can create slots in own lernplaene" ON slots
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM lernplaene WHERE lernplaene.id = slots.lernplan_id AND lernplaene.user_id = auth.uid())
  );
CREATE POLICY "Users can update slots in own lernplaene" ON slots
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM lernplaene WHERE lernplaene.id = slots.lernplan_id AND lernplaene.user_id = auth.uid())
  );
CREATE POLICY "Users can delete slots in own lernplaene" ON slots
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM lernplaene WHERE lernplaene.id = slots.lernplan_id AND lernplaene.user_id = auth.uid())
  );

-- Aufgaben Policies
CREATE POLICY "Users can view own aufgaben" ON aufgaben
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own aufgaben" ON aufgaben
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own aufgaben" ON aufgaben
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own aufgaben" ON aufgaben
  FOR DELETE USING (auth.uid() = user_id);

-- Leistungen Policies
CREATE POLICY "Users can view own leistungen" ON leistungen
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own leistungen" ON leistungen
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leistungen" ON leistungen
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leistungen" ON leistungen
  FOR DELETE USING (auth.uid() = user_id);

-- Übungsklausuren Policies
CREATE POLICY "Users can view own uebungsklausuren" ON uebungsklausuren
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own uebungsklausuren" ON uebungsklausuren
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own uebungsklausuren" ON uebungsklausuren
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own uebungsklausuren" ON uebungsklausuren
  FOR DELETE USING (auth.uid() = user_id);

-- Themenlisten Policies (public for published) - LEGACY
CREATE POLICY "Users can view own themenlisten" ON themenlisten
  FOR SELECT USING (auth.uid() = user_id OR is_published = TRUE);
CREATE POLICY "Users can create own themenlisten" ON themenlisten
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own themenlisten" ON themenlisten
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own themenlisten" ON themenlisten
  FOR DELETE USING (auth.uid() = user_id);

-- Content Plans Policies
CREATE POLICY "Users can view own content_plans" ON content_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own content_plans" ON content_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content_plans" ON content_plans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content_plans" ON content_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Published Themenlisten Policies (public read for community)
CREATE POLICY "Anyone can view published_themenlisten" ON published_themenlisten
  FOR SELECT USING (TRUE);
CREATE POLICY "Users can create own published_themenlisten" ON published_themenlisten
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own published_themenlisten" ON published_themenlisten
  FOR DELETE USING (auth.uid() = user_id);

-- Custom Unterrechtsgebiete Policies
CREATE POLICY "Users can view own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete
  FOR DELETE USING (auth.uid() = user_id);

-- Check-In Policies
CREATE POLICY "Users can view own checkin_responses" ON checkin_responses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own checkin_responses" ON checkin_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkin_responses" ON checkin_responses
  FOR UPDATE USING (auth.uid() = user_id);

-- Timer Sessions Policies
CREATE POLICY "Users can view own timer_sessions" ON timer_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own timer_sessions" ON timer_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wizard Drafts Policies
CREATE POLICY "Users can view own wizard_drafts" ON wizard_drafts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own wizard_drafts" ON wizard_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wizard_drafts" ON wizard_drafts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wizard_drafts" ON wizard_drafts
  FOR DELETE USING (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Private Blocks Policies
CREATE POLICY "Users can view own private_blocks" ON private_blocks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own private_blocks" ON private_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own private_blocks" ON private_blocks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own private_blocks" ON private_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- Calendar Slots Policies
CREATE POLICY "Users can view own calendar_slots" ON calendar_slots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own calendar_slots" ON calendar_slots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar_slots" ON calendar_slots
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar_slots" ON calendar_slots
  FOR DELETE USING (auth.uid() = user_id);

-- Calendar Tasks Policies
CREATE POLICY "Users can view own calendar_tasks" ON calendar_tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own calendar_tasks" ON calendar_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar_tasks" ON calendar_tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar_tasks" ON calendar_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Archived Lernplaene Policies
CREATE POLICY "Users can view own archived_lernplaene" ON archived_lernplaene
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own archived_lernplaene" ON archived_lernplaene
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own archived_lernplaene" ON archived_lernplaene
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_lernplaene_updated_at BEFORE UPDATE ON lernplaene
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON contents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_slots_updated_at BEFORE UPDATE ON slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_aufgaben_updated_at BEFORE UPDATE ON aufgaben
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_leistungen_updated_at BEFORE UPDATE ON leistungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_uebungsklausuren_updated_at BEFORE UPDATE ON uebungsklausuren
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_themenlisten_updated_at BEFORE UPDATE ON themenlisten
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_content_plans_updated_at BEFORE UPDATE ON content_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_private_blocks_updated_at BEFORE UPDATE ON private_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_calendar_slots_updated_at BEFORE UPDATE ON calendar_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_calendar_tasks_updated_at BEFORE UPDATE ON calendar_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
