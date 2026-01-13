-- PrepWell Database Schema for Supabase
-- IDEMPOTENT: Can be run multiple times without errors
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/vitvxwfcutysuifuqnqi/sql)

-- ============================================
-- ENUMS (with IF NOT EXISTS workaround)
-- ============================================

DO $$ BEGIN
  CREATE TYPE app_mode AS ENUM ('standard', 'exam');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('unerledigt', 'erledigt');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE grade_system AS ENUM ('punkte', 'noten');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE exam_status AS ENUM ('angemeldet', 'bestanden', 'nicht_bestanden', 'ausstehend');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE timer_type AS ENUM ('pomodoro', 'countdown', 'countup');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE block_type AS ENUM ('lernblock', 'exam', 'repetition', 'private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- TABLES
-- ============================================

-- Lernpläne (Learning Plans)
CREATE TABLE IF NOT EXISTS lernplaene (
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
CREATE TABLE IF NOT EXISTS contents (
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

-- Calendar Slots (Legacy)
CREATE TABLE IF NOT EXISTS slots (
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
CREATE TABLE IF NOT EXISTS aufgaben (
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
CREATE TABLE IF NOT EXISTS leistungen (
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
CREATE TABLE IF NOT EXISTS uebungsklausuren (
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

-- Published Themenlisten (Community sharing)
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

-- Themenlisten (Theme Lists) - LEGACY
CREATE TABLE IF NOT EXISTS themenlisten (
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
CREATE TABLE IF NOT EXISTS custom_unterrechtsgebiete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rechtsgebiet TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, rechtsgebiet)
);

-- Check-In Responses (Mentor)
CREATE TABLE IF NOT EXISTS checkin_responses (
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
CREATE TABLE IF NOT EXISTS timer_sessions (
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

-- Logbuch Entries (Manual time tracking for learning sessions)
CREATE TABLE IF NOT EXISTS logbuch_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  rechtsgebiet TEXT,
  duration_minutes INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wizard Draft (persists incomplete wizards)
CREATE TABLE IF NOT EXISTS wizard_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INT DEFAULT 1,
  wizard_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Private Sessions (Personal calendar entries, formerly private_blocks)
CREATE TABLE IF NOT EXISTS private_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  end_date DATE, -- BUG-012 FIX: End date for multi-day sessions
  title TEXT NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT FALSE,
  is_multi_day BOOLEAN DEFAULT FALSE, -- BUG-012 FIX: Multi-day flag
  repeat_enabled BOOLEAN DEFAULT FALSE,
  repeat_type TEXT,
  repeat_count INT,
  series_id UUID,
  custom_days JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Blocks (User's learning blocks, formerly calendar_slots)
-- PRD: BlockAllocation hat NUR position (1-4), KEINE Uhrzeiten!
-- Zeit-basierte Sessions gehören in time_sessions, nicht hier.
CREATE TABLE IF NOT EXISTS calendar_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_plan_id UUID REFERENCES content_plans(id) ON DELETE SET NULL,
  block_date DATE NOT NULL,
  position INT CHECK (position >= 1 AND position <= 4),
  content_id TEXT,
  title TEXT,
  rechtsgebiet TEXT,
  unterrechtsgebiet TEXT,
  block_type TEXT DEFAULT 'lernblock',
  is_locked BOOLEAN DEFAULT FALSE,
  is_from_lernplan BOOLEAN DEFAULT FALSE,
  -- KEINE Zeit-Felder hier! (has_time, start_hour, duration, start_time, end_time)
  repeat_enabled BOOLEAN DEFAULT FALSE,
  repeat_type TEXT,
  repeat_count INT,
  series_id UUID,
  custom_days JSONB,
  tasks JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Tasks (Daily tasks)
CREATE TABLE IF NOT EXISTS calendar_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  completed BOOLEAN DEFAULT FALSE,
  linked_block_id UUID REFERENCES calendar_blocks(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Sessions (Time-based sessions for Week/Dashboard - BUG-023 FIX, formerly time_blocks)
-- Strictly separated from calendar_blocks (position-based, Month view)
CREATE TABLE IF NOT EXISTS time_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  block_type TEXT DEFAULT 'lernblock' CHECK (block_type IN ('lernblock', 'repetition', 'exam', 'private')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  rechtsgebiet TEXT,
  unterrechtsgebiet TEXT,
  repeat_enabled BOOLEAN DEFAULT FALSE,
  repeat_type TEXT,
  repeat_count INT,
  series_id UUID,
  custom_days JSONB,
  tasks JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Archived Lernpläne
CREATE TABLE IF NOT EXISTS archived_lernplaene (
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
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  mentor_activated BOOLEAN DEFAULT FALSE,
  preferred_grade_system grade_system DEFAULT 'punkte',
  timer_settings JSONB DEFAULT '{}',
  custom_subjects TEXT[] DEFAULT '{}',  -- Legacy, use subject_settings stattdessen
  subject_settings JSONB DEFAULT '{}',   -- T-SET-1: { colorOverrides: {}, customSubjects: [] }
  studiengang TEXT,                       -- T7: Studiengang (jura, medizin, informatik, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MIGRATIONS (for existing databases)
-- Must run BEFORE indexes to ensure columns exist
-- ============================================

-- Migration: Add series_id and custom_days to private_sessions
DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN series_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN custom_days JSONB;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Migration: Add series_id and custom_days to calendar_blocks
DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN series_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN custom_days JSONB;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Migration: Add end_date and is_multi_day to private_sessions (BUG-012 FIX)
DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN end_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN is_multi_day BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Migration: Add studiengang to user_settings (T7)
DO $$ BEGIN
  ALTER TABLE user_settings ADD COLUMN studiengang TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lernplaene_user_id ON lernplaene(user_id);
CREATE INDEX IF NOT EXISTS idx_lernplaene_archived ON lernplaene(archived);
CREATE INDEX IF NOT EXISTS idx_contents_lernplan_id ON contents(lernplan_id);
CREATE INDEX IF NOT EXISTS idx_slots_lernplan_id ON slots(lernplan_id);
CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date);
CREATE INDEX IF NOT EXISTS idx_slots_lernplan_date ON slots(lernplan_id, date);
CREATE INDEX IF NOT EXISTS idx_aufgaben_user_id ON aufgaben(user_id);
CREATE INDEX IF NOT EXISTS idx_aufgaben_lernplan_id ON aufgaben(lernplan_id);
CREATE INDEX IF NOT EXISTS idx_aufgaben_due_date ON aufgaben(due_date);
CREATE INDEX IF NOT EXISTS idx_aufgaben_status ON aufgaben(status);
CREATE INDEX IF NOT EXISTS idx_leistungen_user_id ON leistungen(user_id);
CREATE INDEX IF NOT EXISTS idx_uebungsklausuren_user_id ON uebungsklausuren(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_user_date ON checkin_responses(user_id, response_date);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_id ON timer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_logbuch_entries_user_id ON logbuch_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_logbuch_entries_date ON logbuch_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_logbuch_entries_user_date ON logbuch_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_content_plans_user_id ON content_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_type ON content_plans(type);
CREATE INDEX IF NOT EXISTS idx_content_plans_archived ON content_plans(archived);
CREATE INDEX IF NOT EXISTS idx_published_themenlisten_user_id ON published_themenlisten(user_id);
CREATE INDEX IF NOT EXISTS idx_private_sessions_user_id ON private_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_private_sessions_date ON private_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_private_sessions_user_date ON private_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_private_sessions_series_id ON private_sessions(series_id);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_user_id ON calendar_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_date ON calendar_blocks(block_date);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_user_date ON calendar_blocks(user_id, block_date);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_series_id ON calendar_blocks(series_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_user_id ON time_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_date ON time_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_time_sessions_user_date ON time_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_time_sessions_series_id ON time_sessions(series_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_user_id ON calendar_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_date ON calendar_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_user_date ON calendar_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_archived_lernplaene_user_id ON archived_lernplaene(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_studiengang ON user_settings(studiengang);

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
ALTER TABLE logbuch_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wizard_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_lernplaene ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES (with DROP IF EXISTS)
-- ============================================

-- Lernplaene Policies
DROP POLICY IF EXISTS "Users can view own lernplaene" ON lernplaene;
CREATE POLICY "Users can view own lernplaene" ON lernplaene FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own lernplaene" ON lernplaene;
CREATE POLICY "Users can create own lernplaene" ON lernplaene FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own lernplaene" ON lernplaene;
CREATE POLICY "Users can update own lernplaene" ON lernplaene FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own lernplaene" ON lernplaene;
CREATE POLICY "Users can delete own lernplaene" ON lernplaene FOR DELETE USING (auth.uid() = user_id);

-- Contents Policies
DROP POLICY IF EXISTS "Users can view own contents" ON contents;
CREATE POLICY "Users can view own contents" ON contents FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own contents" ON contents;
CREATE POLICY "Users can create own contents" ON contents FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own contents" ON contents;
CREATE POLICY "Users can update own contents" ON contents FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own contents" ON contents;
CREATE POLICY "Users can delete own contents" ON contents FOR DELETE USING (auth.uid() = user_id);

-- Slots Policies
DROP POLICY IF EXISTS "Users can view slots of own lernplaene" ON slots;
CREATE POLICY "Users can view slots of own lernplaene" ON slots FOR SELECT USING (
  EXISTS (SELECT 1 FROM lernplaene WHERE lernplaene.id = slots.lernplan_id AND lernplaene.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can create slots in own lernplaene" ON slots;
CREATE POLICY "Users can create slots in own lernplaene" ON slots FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM lernplaene WHERE lernplaene.id = slots.lernplan_id AND lernplaene.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update slots in own lernplaene" ON slots;
CREATE POLICY "Users can update slots in own lernplaene" ON slots FOR UPDATE USING (
  EXISTS (SELECT 1 FROM lernplaene WHERE lernplaene.id = slots.lernplan_id AND lernplaene.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can delete slots in own lernplaene" ON slots;
CREATE POLICY "Users can delete slots in own lernplaene" ON slots FOR DELETE USING (
  EXISTS (SELECT 1 FROM lernplaene WHERE lernplaene.id = slots.lernplan_id AND lernplaene.user_id = auth.uid())
);

-- Aufgaben Policies
DROP POLICY IF EXISTS "Users can view own aufgaben" ON aufgaben;
CREATE POLICY "Users can view own aufgaben" ON aufgaben FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own aufgaben" ON aufgaben;
CREATE POLICY "Users can create own aufgaben" ON aufgaben FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own aufgaben" ON aufgaben;
CREATE POLICY "Users can update own aufgaben" ON aufgaben FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own aufgaben" ON aufgaben;
CREATE POLICY "Users can delete own aufgaben" ON aufgaben FOR DELETE USING (auth.uid() = user_id);

-- Leistungen Policies
DROP POLICY IF EXISTS "Users can view own leistungen" ON leistungen;
CREATE POLICY "Users can view own leistungen" ON leistungen FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own leistungen" ON leistungen;
CREATE POLICY "Users can create own leistungen" ON leistungen FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own leistungen" ON leistungen;
CREATE POLICY "Users can update own leistungen" ON leistungen FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own leistungen" ON leistungen;
CREATE POLICY "Users can delete own leistungen" ON leistungen FOR DELETE USING (auth.uid() = user_id);

-- Uebungsklausuren Policies
DROP POLICY IF EXISTS "Users can view own uebungsklausuren" ON uebungsklausuren;
CREATE POLICY "Users can view own uebungsklausuren" ON uebungsklausuren FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own uebungsklausuren" ON uebungsklausuren;
CREATE POLICY "Users can create own uebungsklausuren" ON uebungsklausuren FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own uebungsklausuren" ON uebungsklausuren;
CREATE POLICY "Users can update own uebungsklausuren" ON uebungsklausuren FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own uebungsklausuren" ON uebungsklausuren;
CREATE POLICY "Users can delete own uebungsklausuren" ON uebungsklausuren FOR DELETE USING (auth.uid() = user_id);

-- Themenlisten Policies (LEGACY)
DROP POLICY IF EXISTS "Users can view own themenlisten" ON themenlisten;
CREATE POLICY "Users can view own themenlisten" ON themenlisten FOR SELECT USING (auth.uid() = user_id OR is_published = TRUE);
DROP POLICY IF EXISTS "Users can create own themenlisten" ON themenlisten;
CREATE POLICY "Users can create own themenlisten" ON themenlisten FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own themenlisten" ON themenlisten;
CREATE POLICY "Users can update own themenlisten" ON themenlisten FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own themenlisten" ON themenlisten;
CREATE POLICY "Users can delete own themenlisten" ON themenlisten FOR DELETE USING (auth.uid() = user_id);

-- Content Plans Policies
DROP POLICY IF EXISTS "Users can view own content_plans" ON content_plans;
CREATE POLICY "Users can view own content_plans" ON content_plans FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own content_plans" ON content_plans;
CREATE POLICY "Users can create own content_plans" ON content_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own content_plans" ON content_plans;
CREATE POLICY "Users can update own content_plans" ON content_plans FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own content_plans" ON content_plans;
CREATE POLICY "Users can delete own content_plans" ON content_plans FOR DELETE USING (auth.uid() = user_id);

-- Published Themenlisten Policies
DROP POLICY IF EXISTS "Anyone can view published_themenlisten" ON published_themenlisten;
CREATE POLICY "Anyone can view published_themenlisten" ON published_themenlisten FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users can create own published_themenlisten" ON published_themenlisten;
CREATE POLICY "Users can create own published_themenlisten" ON published_themenlisten FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own published_themenlisten" ON published_themenlisten;
CREATE POLICY "Users can delete own published_themenlisten" ON published_themenlisten FOR DELETE USING (auth.uid() = user_id);

-- Custom Unterrechtsgebiete Policies
DROP POLICY IF EXISTS "Users can view own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete;
CREATE POLICY "Users can view own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete;
CREATE POLICY "Users can create own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete;
CREATE POLICY "Users can delete own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete FOR DELETE USING (auth.uid() = user_id);

-- Check-In Policies
DROP POLICY IF EXISTS "Users can view own checkin_responses" ON checkin_responses;
CREATE POLICY "Users can view own checkin_responses" ON checkin_responses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own checkin_responses" ON checkin_responses;
CREATE POLICY "Users can create own checkin_responses" ON checkin_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own checkin_responses" ON checkin_responses;
CREATE POLICY "Users can update own checkin_responses" ON checkin_responses FOR UPDATE USING (auth.uid() = user_id);

-- Timer Sessions Policies
DROP POLICY IF EXISTS "Users can view own timer_sessions" ON timer_sessions;
CREATE POLICY "Users can view own timer_sessions" ON timer_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own timer_sessions" ON timer_sessions;
CREATE POLICY "Users can create own timer_sessions" ON timer_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Logbuch Entries Policies
DROP POLICY IF EXISTS "Users can view own logbuch_entries" ON logbuch_entries;
DROP POLICY IF EXISTS "logbuch_select" ON logbuch_entries;
CREATE POLICY "Users can view own logbuch_entries" ON logbuch_entries FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own logbuch_entries" ON logbuch_entries;
DROP POLICY IF EXISTS "logbuch_insert" ON logbuch_entries;
CREATE POLICY "Users can create own logbuch_entries" ON logbuch_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own logbuch_entries" ON logbuch_entries;
DROP POLICY IF EXISTS "logbuch_update" ON logbuch_entries;
CREATE POLICY "Users can update own logbuch_entries" ON logbuch_entries FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own logbuch_entries" ON logbuch_entries;
DROP POLICY IF EXISTS "logbuch_delete" ON logbuch_entries;
CREATE POLICY "Users can delete own logbuch_entries" ON logbuch_entries FOR DELETE USING (auth.uid() = user_id);

-- Wizard Drafts Policies
DROP POLICY IF EXISTS "Users can view own wizard_drafts" ON wizard_drafts;
CREATE POLICY "Users can view own wizard_drafts" ON wizard_drafts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own wizard_drafts" ON wizard_drafts;
CREATE POLICY "Users can create own wizard_drafts" ON wizard_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own wizard_drafts" ON wizard_drafts;
CREATE POLICY "Users can update own wizard_drafts" ON wizard_drafts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own wizard_drafts" ON wizard_drafts;
CREATE POLICY "Users can delete own wizard_drafts" ON wizard_drafts FOR DELETE USING (auth.uid() = user_id);

-- User Settings Policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own settings" ON user_settings;
CREATE POLICY "Users can create own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Private Sessions Policies (formerly private_blocks)
DROP POLICY IF EXISTS "Users can view own private_sessions" ON private_sessions;
CREATE POLICY "Users can view own private_sessions" ON private_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own private_sessions" ON private_sessions;
CREATE POLICY "Users can create own private_sessions" ON private_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own private_sessions" ON private_sessions;
CREATE POLICY "Users can update own private_sessions" ON private_sessions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own private_sessions" ON private_sessions;
CREATE POLICY "Users can delete own private_sessions" ON private_sessions FOR DELETE USING (auth.uid() = user_id);

-- Time Sessions Policies (BUG-023 FIX: Separate from calendar_blocks, formerly time_blocks)
DROP POLICY IF EXISTS "Users can view own time_sessions" ON time_sessions;
CREATE POLICY "Users can view own time_sessions" ON time_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own time_sessions" ON time_sessions;
CREATE POLICY "Users can create own time_sessions" ON time_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own time_sessions" ON time_sessions;
CREATE POLICY "Users can update own time_sessions" ON time_sessions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own time_sessions" ON time_sessions;
CREATE POLICY "Users can delete own time_sessions" ON time_sessions FOR DELETE USING (auth.uid() = user_id);

-- Calendar Blocks Policies (formerly calendar_slots)
DROP POLICY IF EXISTS "Users can view own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can view own calendar_blocks" ON calendar_blocks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can create own calendar_blocks" ON calendar_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can update own calendar_blocks" ON calendar_blocks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can delete own calendar_blocks" ON calendar_blocks FOR DELETE USING (auth.uid() = user_id);

-- Calendar Tasks Policies
DROP POLICY IF EXISTS "Users can view own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can view own calendar_tasks" ON calendar_tasks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can create own calendar_tasks" ON calendar_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can update own calendar_tasks" ON calendar_tasks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can delete own calendar_tasks" ON calendar_tasks FOR DELETE USING (auth.uid() = user_id);

-- Archived Lernplaene Policies
DROP POLICY IF EXISTS "Users can view own archived_lernplaene" ON archived_lernplaene;
CREATE POLICY "Users can view own archived_lernplaene" ON archived_lernplaene FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own archived_lernplaene" ON archived_lernplaene;
CREATE POLICY "Users can create own archived_lernplaene" ON archived_lernplaene FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own archived_lernplaene" ON archived_lernplaene;
CREATE POLICY "Users can delete own archived_lernplaene" ON archived_lernplaene FOR DELETE USING (auth.uid() = user_id);

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

-- ============================================
-- TRIGGERS (with DROP IF EXISTS)
-- ============================================

DROP TRIGGER IF EXISTS update_lernplaene_updated_at ON lernplaene;
CREATE TRIGGER update_lernplaene_updated_at BEFORE UPDATE ON lernplaene
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_contents_updated_at ON contents;
CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON contents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_slots_updated_at ON slots;
CREATE TRIGGER update_slots_updated_at BEFORE UPDATE ON slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_aufgaben_updated_at ON aufgaben;
CREATE TRIGGER update_aufgaben_updated_at BEFORE UPDATE ON aufgaben
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_leistungen_updated_at ON leistungen;
CREATE TRIGGER update_leistungen_updated_at BEFORE UPDATE ON leistungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_uebungsklausuren_updated_at ON uebungsklausuren;
CREATE TRIGGER update_uebungsklausuren_updated_at BEFORE UPDATE ON uebungsklausuren
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_themenlisten_updated_at ON themenlisten;
CREATE TRIGGER update_themenlisten_updated_at BEFORE UPDATE ON themenlisten
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_content_plans_updated_at ON content_plans;
CREATE TRIGGER update_content_plans_updated_at BEFORE UPDATE ON content_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_logbuch_entries_updated_at ON logbuch_entries;
CREATE TRIGGER update_logbuch_entries_updated_at BEFORE UPDATE ON logbuch_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_private_sessions_updated_at ON private_sessions;
CREATE TRIGGER update_private_sessions_updated_at BEFORE UPDATE ON private_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_time_sessions_updated_at ON time_sessions;
CREATE TRIGGER update_time_sessions_updated_at BEFORE UPDATE ON time_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_calendar_blocks_updated_at ON calendar_blocks;
CREATE TRIGGER update_calendar_blocks_updated_at BEFORE UPDATE ON calendar_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_calendar_tasks_updated_at ON calendar_tasks;
CREATE TRIGGER update_calendar_tasks_updated_at BEFORE UPDATE ON calendar_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- END OF SCHEMA
-- ============================================
