-- PrepWell Database Schema for Supabase
-- ============================================
-- Version: 2.0 (Konsolidiert am 2026-01-15)
-- IDEMPOTENT: Can be run multiple times without errors
--
-- Changelog:
-- 2.0 (2026-01-15): Konsolidiert aus 14 Migrations (T20)
--   - profiles Tabelle hinzugefuegt (T14 User Approval)
--   - active_timer_sessions hinzugefuegt (T16 Timer Persistence)
--   - Email Notification Functions hinzugefuegt
--   - Legacy-Tabellen entfernt: calendar_slots, themenlisten
--   - Alle Migrations integriert
-- 1.0 (Initial): Basis-Schema
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================

-- pg_net fuer HTTP-Calls (Email Notifications)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================
-- ENUMS
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

-- Lernplaene (Learning Plans) - Must be created first (referenced by other tables)
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

-- Content Plans (Lernplaene & Themenlisten) - Must be created before calendar_blocks
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
  -- T27/T32: New flat structure for Themenlisten
  status TEXT CHECK (status IN ('draft', 'active')) DEFAULT 'draft',
  selected_areas JSONB DEFAULT '[]',
  themen JSONB DEFAULT '[]',
  kapitel JSONB DEFAULT '[]',
  use_kapitel BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- T32: Add new columns to existing content_plans table if they don't exist
DO $$ BEGIN
  ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'active')) DEFAULT 'draft';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS selected_areas JSONB DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS themen JSONB DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS kapitel JSONB DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS use_kapitel BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Contents (Learning Material) - Must be created before aufgaben
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

-- Calendar Blocks (User's learning blocks) - Must be created before calendar_tasks
-- PRD: BlockAllocation hat NUR position (1-4), KEINE Uhrzeiten!
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
  repeat_enabled BOOLEAN DEFAULT FALSE,
  repeat_type TEXT,
  repeat_count INT,
  series_id TEXT,  -- T30: Changed from UUID to TEXT (IDs are strings like "private-series-...")
  custom_days JSONB,
  tasks JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Timer Sessions (T16: Timer Persistence)
-- Stores currently running timer for browser restart persistence
CREATE TABLE IF NOT EXISTS active_timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timer_type TEXT NOT NULL CHECK (timer_type IN ('pomodoro', 'countdown', 'countup')),
  timer_state TEXT NOT NULL CHECK (timer_state IN ('running', 'paused', 'break')),
  started_at TIMESTAMPTZ NOT NULL,
  paused_at TIMESTAMPTZ,
  accumulated_pause_ms BIGINT DEFAULT 0,
  pomodoro_settings JSONB,
  countdown_settings JSONB,
  current_session INT DEFAULT 1,
  total_sessions INT DEFAULT 1,
  is_break BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Archived Lernplaene
CREATE TABLE IF NOT EXISTS archived_lernplaene (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  blocks_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Custom Unterrechtsgebiete
CREATE TABLE IF NOT EXISTS custom_unterrechtsgebiete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rechtsgebiet TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, rechtsgebiet)
);

-- Leistungen (Exams/Grades - Normal Mode) - DEPRECATED: Use semester_leistungen instead
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

-- Semester-Leistungen für Normal Mode (T28 - getrennt von Übungsklausuren)
CREATE TABLE IF NOT EXISTS semester_leistungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pflichtfelder
  rechtsgebiet TEXT NOT NULL,
  titel TEXT NOT NULL,

  -- Optionale Felder
  beschreibung TEXT,
  semester TEXT,
  datum DATE,
  uhrzeit TEXT,
  ects INTEGER,
  note DECIMAL(3,1),
  noten_system TEXT DEFAULT 'punkte' CHECK (noten_system IN ('punkte', 'noten')),
  status TEXT DEFAULT 'ausstehend' CHECK (status IN ('angemeldet', 'ausstehend', 'bestanden', 'nicht bestanden')),

  -- Kalender-Integration
  in_kalender BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logbuch Entries (Manual time tracking)
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

-- Private Sessions (Personal calendar entries)
CREATE TABLE IF NOT EXISTS private_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  end_date DATE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT FALSE,
  is_multi_day BOOLEAN DEFAULT FALSE,
  repeat_enabled BOOLEAN DEFAULT FALSE,
  repeat_type TEXT,
  repeat_count INT,
  series_id TEXT,  -- T30: Changed from UUID to TEXT (IDs are strings like "private-series-...")
  custom_days JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (T14: User Approval System)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- Time Sessions (Time-based sessions for Week/Dashboard)
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
  series_id TEXT,  -- T30: Changed from UUID to TEXT (IDs are strings like "private-series-...")
  custom_days JSONB,
  tasks JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- Uebungsklausuren (Practice Exams - Exam Mode)
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

-- User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  mentor_activated BOOLEAN DEFAULT FALSE,
  preferred_grade_system grade_system DEFAULT 'punkte',
  timer_settings JSONB DEFAULT '{}',
  custom_subjects TEXT[] DEFAULT '{}',
  subject_settings JSONB DEFAULT '{}',
  studiengang TEXT,
  themenliste_kapitel_default BOOLEAN DEFAULT FALSE, -- T27: Default für Kapitel-Ebene in neuen Themenlisten
  kapitel_ebene_aktiviert BOOLEAN DEFAULT FALSE, -- T22: Kapitel-Ebene Aktivierung für Jura-Studenten
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

-- ============================================
-- INDEXES
-- ============================================

-- active_timer_sessions
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_timer_user ON active_timer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_timer_updated ON active_timer_sessions(updated_at);

-- archived_lernplaene
CREATE INDEX IF NOT EXISTS idx_archived_lernplaene_user_id ON archived_lernplaene(user_id);

-- aufgaben
CREATE INDEX IF NOT EXISTS idx_aufgaben_user_id ON aufgaben(user_id);
CREATE INDEX IF NOT EXISTS idx_aufgaben_lernplan_id ON aufgaben(lernplan_id);
CREATE INDEX IF NOT EXISTS idx_aufgaben_due_date ON aufgaben(due_date);
CREATE INDEX IF NOT EXISTS idx_aufgaben_status ON aufgaben(status);

-- calendar_blocks
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_user_id ON calendar_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_date ON calendar_blocks(block_date);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_user_date ON calendar_blocks(user_id, block_date);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_series_id ON calendar_blocks(series_id);
-- KA-002: Unique constraint to prevent duplicate blocks on same date/position
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_blocks_unique_position
ON calendar_blocks(user_id, block_date, position)
WHERE position IS NOT NULL;

-- calendar_tasks
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_user_id ON calendar_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_date ON calendar_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_user_date ON calendar_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_linked_block_id ON calendar_tasks(linked_block_id);

-- checkin_responses
CREATE INDEX IF NOT EXISTS idx_checkin_user_date ON checkin_responses(user_id, response_date);

-- content_plans
CREATE INDEX IF NOT EXISTS idx_content_plans_user_id ON content_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_type ON content_plans(type);
CREATE INDEX IF NOT EXISTS idx_content_plans_archived ON content_plans(archived);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_imported_template ON content_plans(user_id, imported_from) WHERE imported_from IS NOT NULL;

-- contents
CREATE INDEX IF NOT EXISTS idx_contents_lernplan_id ON contents(lernplan_id);

-- leistungen
CREATE INDEX IF NOT EXISTS idx_leistungen_user_id ON leistungen(user_id);

-- semester_leistungen (T28)
CREATE INDEX IF NOT EXISTS idx_semester_leistungen_user_id ON semester_leistungen(user_id);
CREATE INDEX IF NOT EXISTS idx_semester_leistungen_datum ON semester_leistungen(datum);
CREATE INDEX IF NOT EXISTS idx_semester_leistungen_user_datum ON semester_leistungen(user_id, datum);

-- lernplaene
CREATE INDEX IF NOT EXISTS idx_lernplaene_user_id ON lernplaene(user_id);
CREATE INDEX IF NOT EXISTS idx_lernplaene_archived ON lernplaene(archived);

-- logbuch_entries
CREATE INDEX IF NOT EXISTS idx_logbuch_entries_user_id ON logbuch_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_logbuch_entries_date ON logbuch_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_logbuch_entries_user_date ON logbuch_entries(user_id, entry_date);

-- private_sessions
CREATE INDEX IF NOT EXISTS idx_private_sessions_user_id ON private_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_private_sessions_date ON private_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_private_sessions_user_date ON private_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_private_sessions_series_id ON private_sessions(series_id);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON profiles(approved);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- published_themenlisten
CREATE INDEX IF NOT EXISTS idx_published_themenlisten_user_id ON published_themenlisten(user_id);

-- time_sessions
CREATE INDEX IF NOT EXISTS idx_time_sessions_user_id ON time_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_date ON time_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_time_sessions_user_date ON time_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_time_sessions_series_id ON time_sessions(series_id);

-- timer_sessions
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_id ON timer_sessions(user_id);

-- uebungsklausuren
CREATE INDEX IF NOT EXISTS idx_uebungsklausuren_user_id ON uebungsklausuren(user_id);

-- user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_studiengang ON user_settings(studiengang);

-- ============================================
-- SCHEMA MIGRATIONS (T17: Column Renames)
-- ============================================

-- T17: Rename block_date to session_date in private_sessions (if old column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'private_sessions' AND column_name = 'block_date'
  ) THEN
    ALTER TABLE private_sessions RENAME COLUMN block_date TO session_date;
  END IF;
END $$;

-- ============================================
-- SCHEMA MIGRATIONS (T30: Series Info)
-- ============================================

-- T30: Add series metadata columns to time_sessions
-- NOTE: series_origin_id is TEXT (not UUID) because session IDs are strings like "timeblock-..."
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS series_index INT;
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS series_total INT;
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS series_origin_id TEXT;
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS repeat_end_mode TEXT;
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS repeat_end_date DATE;

-- T30: Fix column type if it was previously created as UUID
-- This is safe to run even if column is already TEXT
DO $$
BEGIN
  ALTER TABLE time_sessions ALTER COLUMN series_origin_id TYPE TEXT;
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

-- T30: Add series metadata columns to private_sessions
-- NOTE: series_origin_id is TEXT (not UUID) because session IDs are strings like "private-..."
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS series_index INT;
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS series_total INT;
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS series_origin_id TEXT;
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS repeat_end_mode TEXT;
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS repeat_end_date DATE;

-- T30: Fix column type if it was previously created as UUID
DO $$
BEGIN
  ALTER TABLE private_sessions ALTER COLUMN series_origin_id TYPE TEXT;
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

-- T30: Fix series_id column type if it was previously created as UUID
-- This affects calendar_blocks, private_sessions, and time_sessions
DO $$
BEGIN
  ALTER TABLE calendar_blocks ALTER COLUMN series_id TYPE TEXT;
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE private_sessions ALTER COLUMN series_id TYPE TEXT;
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE time_sessions ALTER COLUMN series_id TYPE TEXT;
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

-- ============================================
-- SCHEMA MIGRATIONS (T27: Themenliste Kapitel Settings)
-- ============================================

-- T27: Add themenliste_kapitel_default column to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS themenliste_kapitel_default BOOLEAN DEFAULT FALSE;

-- T22: Add kapitel_ebene_aktiviert column to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS kapitel_ebene_aktiviert BOOLEAN DEFAULT FALSE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE active_timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_lernplaene ENABLE ROW LEVEL SECURITY;
ALTER TABLE aufgaben ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_unterrechtsgebiete ENABLE ROW LEVEL SECURITY;
ALTER TABLE leistungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_leistungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE lernplaene ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbuch_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_themenlisten ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE uebungsklausuren ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wizard_drafts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES
-- ============================================

-- Active Timer Sessions
DROP POLICY IF EXISTS "Users can manage own active timer" ON active_timer_sessions;
CREATE POLICY "Users can manage own active timer" ON active_timer_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Archived Lernplaene
DROP POLICY IF EXISTS "Users can view own archived_lernplaene" ON archived_lernplaene;
CREATE POLICY "Users can view own archived_lernplaene" ON archived_lernplaene FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own archived_lernplaene" ON archived_lernplaene;
CREATE POLICY "Users can create own archived_lernplaene" ON archived_lernplaene FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own archived_lernplaene" ON archived_lernplaene;
CREATE POLICY "Users can delete own archived_lernplaene" ON archived_lernplaene FOR DELETE USING (auth.uid() = user_id);

-- Aufgaben
DROP POLICY IF EXISTS "Users can view own aufgaben" ON aufgaben;
CREATE POLICY "Users can view own aufgaben" ON aufgaben FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own aufgaben" ON aufgaben;
CREATE POLICY "Users can create own aufgaben" ON aufgaben FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own aufgaben" ON aufgaben;
CREATE POLICY "Users can update own aufgaben" ON aufgaben FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own aufgaben" ON aufgaben;
CREATE POLICY "Users can delete own aufgaben" ON aufgaben FOR DELETE USING (auth.uid() = user_id);

-- Calendar Blocks
DROP POLICY IF EXISTS "Users can view own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can view own calendar_blocks" ON calendar_blocks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can create own calendar_blocks" ON calendar_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can update own calendar_blocks" ON calendar_blocks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can delete own calendar_blocks" ON calendar_blocks FOR DELETE USING (auth.uid() = user_id);

-- Calendar Tasks
DROP POLICY IF EXISTS "Users can view own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can view own calendar_tasks" ON calendar_tasks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can create own calendar_tasks" ON calendar_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can update own calendar_tasks" ON calendar_tasks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can delete own calendar_tasks" ON calendar_tasks FOR DELETE USING (auth.uid() = user_id);

-- Check-In Responses
DROP POLICY IF EXISTS "Users can view own checkin_responses" ON checkin_responses;
CREATE POLICY "Users can view own checkin_responses" ON checkin_responses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own checkin_responses" ON checkin_responses;
CREATE POLICY "Users can create own checkin_responses" ON checkin_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own checkin_responses" ON checkin_responses;
CREATE POLICY "Users can update own checkin_responses" ON checkin_responses FOR UPDATE USING (auth.uid() = user_id);

-- Content Plans
DROP POLICY IF EXISTS "Users can view own content_plans" ON content_plans;
CREATE POLICY "Users can view own content_plans" ON content_plans FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own content_plans" ON content_plans;
CREATE POLICY "Users can create own content_plans" ON content_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own content_plans" ON content_plans;
CREATE POLICY "Users can update own content_plans" ON content_plans FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own content_plans" ON content_plans;
CREATE POLICY "Users can delete own content_plans" ON content_plans FOR DELETE USING (auth.uid() = user_id);

-- Contents
DROP POLICY IF EXISTS "Users can view own contents" ON contents;
CREATE POLICY "Users can view own contents" ON contents FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own contents" ON contents;
CREATE POLICY "Users can create own contents" ON contents FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own contents" ON contents;
CREATE POLICY "Users can update own contents" ON contents FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own contents" ON contents;
CREATE POLICY "Users can delete own contents" ON contents FOR DELETE USING (auth.uid() = user_id);

-- Custom Unterrechtsgebiete
DROP POLICY IF EXISTS "Users can view own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete;
CREATE POLICY "Users can view own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete;
CREATE POLICY "Users can create own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete;
CREATE POLICY "Users can delete own custom_unterrechtsgebiete" ON custom_unterrechtsgebiete FOR DELETE USING (auth.uid() = user_id);

-- Leistungen
DROP POLICY IF EXISTS "Users can view own leistungen" ON leistungen;
CREATE POLICY "Users can view own leistungen" ON leistungen FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own leistungen" ON leistungen;
CREATE POLICY "Users can create own leistungen" ON leistungen FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own leistungen" ON leistungen;
CREATE POLICY "Users can update own leistungen" ON leistungen FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own leistungen" ON leistungen;
CREATE POLICY "Users can delete own leistungen" ON leistungen FOR DELETE USING (auth.uid() = user_id);

-- Semester Leistungen (T28)
DROP POLICY IF EXISTS "Users can view own semester_leistungen" ON semester_leistungen;
CREATE POLICY "Users can view own semester_leistungen" ON semester_leistungen FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own semester_leistungen" ON semester_leistungen;
CREATE POLICY "Users can create own semester_leistungen" ON semester_leistungen FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own semester_leistungen" ON semester_leistungen;
CREATE POLICY "Users can update own semester_leistungen" ON semester_leistungen FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own semester_leistungen" ON semester_leistungen;
CREATE POLICY "Users can delete own semester_leistungen" ON semester_leistungen FOR DELETE USING (auth.uid() = user_id);

-- Lernplaene
DROP POLICY IF EXISTS "Users can view own lernplaene" ON lernplaene;
CREATE POLICY "Users can view own lernplaene" ON lernplaene FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own lernplaene" ON lernplaene;
CREATE POLICY "Users can create own lernplaene" ON lernplaene FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own lernplaene" ON lernplaene;
CREATE POLICY "Users can update own lernplaene" ON lernplaene FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own lernplaene" ON lernplaene;
CREATE POLICY "Users can delete own lernplaene" ON lernplaene FOR DELETE USING (auth.uid() = user_id);

-- Logbuch Entries
DROP POLICY IF EXISTS "Users can view own logbuch_entries" ON logbuch_entries;
CREATE POLICY "Users can view own logbuch_entries" ON logbuch_entries FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own logbuch_entries" ON logbuch_entries;
CREATE POLICY "Users can create own logbuch_entries" ON logbuch_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own logbuch_entries" ON logbuch_entries;
CREATE POLICY "Users can update own logbuch_entries" ON logbuch_entries FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own logbuch_entries" ON logbuch_entries;
CREATE POLICY "Users can delete own logbuch_entries" ON logbuch_entries FOR DELETE USING (auth.uid() = user_id);

-- Private Sessions
DROP POLICY IF EXISTS "Users can view own private_sessions" ON private_sessions;
CREATE POLICY "Users can view own private_sessions" ON private_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own private_sessions" ON private_sessions;
CREATE POLICY "Users can create own private_sessions" ON private_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own private_sessions" ON private_sessions;
CREATE POLICY "Users can update own private_sessions" ON private_sessions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own private_sessions" ON private_sessions;
CREATE POLICY "Users can delete own private_sessions" ON private_sessions FOR DELETE USING (auth.uid() = user_id);

-- Profiles
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Published Themenlisten
DROP POLICY IF EXISTS "Anyone can view published_themenlisten" ON published_themenlisten;
CREATE POLICY "Anyone can view published_themenlisten" ON published_themenlisten FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users can create own published_themenlisten" ON published_themenlisten;
CREATE POLICY "Users can create own published_themenlisten" ON published_themenlisten FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own published_themenlisten" ON published_themenlisten;
CREATE POLICY "Users can delete own published_themenlisten" ON published_themenlisten FOR DELETE USING (auth.uid() = user_id);

-- Time Sessions
DROP POLICY IF EXISTS "Users can view own time_sessions" ON time_sessions;
CREATE POLICY "Users can view own time_sessions" ON time_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own time_sessions" ON time_sessions;
CREATE POLICY "Users can create own time_sessions" ON time_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own time_sessions" ON time_sessions;
CREATE POLICY "Users can update own time_sessions" ON time_sessions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own time_sessions" ON time_sessions;
CREATE POLICY "Users can delete own time_sessions" ON time_sessions FOR DELETE USING (auth.uid() = user_id);

-- Timer Sessions
DROP POLICY IF EXISTS "Users can view own timer_sessions" ON timer_sessions;
CREATE POLICY "Users can view own timer_sessions" ON timer_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own timer_sessions" ON timer_sessions;
CREATE POLICY "Users can create own timer_sessions" ON timer_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Uebungsklausuren
DROP POLICY IF EXISTS "Users can view own uebungsklausuren" ON uebungsklausuren;
CREATE POLICY "Users can view own uebungsklausuren" ON uebungsklausuren FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own uebungsklausuren" ON uebungsklausuren;
CREATE POLICY "Users can create own uebungsklausuren" ON uebungsklausuren FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own uebungsklausuren" ON uebungsklausuren;
CREATE POLICY "Users can update own uebungsklausuren" ON uebungsklausuren FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own uebungsklausuren" ON uebungsklausuren;
CREATE POLICY "Users can delete own uebungsklausuren" ON uebungsklausuren FOR DELETE USING (auth.uid() = user_id);

-- User Settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own settings" ON user_settings;
CREATE POLICY "Users can create own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Wizard Drafts
DROP POLICY IF EXISTS "Users can view own wizard_drafts" ON wizard_drafts;
CREATE POLICY "Users can view own wizard_drafts" ON wizard_drafts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own wizard_drafts" ON wizard_drafts;
CREATE POLICY "Users can create own wizard_drafts" ON wizard_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own wizard_drafts" ON wizard_drafts;
CREATE POLICY "Users can update own wizard_drafts" ON wizard_drafts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own wizard_drafts" ON wizard_drafts;
CREATE POLICY "Users can delete own wizard_drafts" ON wizard_drafts FOR DELETE USING (auth.uid() = user_id);

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

-- T14: Handle new user registration (creates profile with approved=false)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    FALSE
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

-- T14: Helper function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT approved FROM profiles WHERE id = user_uuid), FALSE);
$$;

-- T14: Email notification to admin on new user registration
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://vitvxwfcutysuifuqnqi.supabase.co';
BEGIN
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/notify-admin',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'full_name', NEW.full_name,
        'created_at', NEW.created_at
      )
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_admin_on_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- T14: Email notification to user on approval
CREATE OR REPLACE FUNCTION public.notify_user_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://vitvxwfcutysuifuqnqi.supabase.co';
BEGIN
  IF OLD.approved = FALSE AND NEW.approved = TRUE THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/notify-approval',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', NEW.id,
          'email', NEW.email,
          'full_name', NEW.full_name,
          'approved', NEW.approved
        ),
        'old_record', jsonb_build_object(
          'id', OLD.id,
          'email', OLD.email,
          'full_name', OLD.full_name,
          'approved', OLD.approved
        )
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_user_on_approval failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- updated_at triggers
DROP TRIGGER IF EXISTS update_active_timer_sessions_updated_at ON active_timer_sessions;
CREATE TRIGGER update_active_timer_sessions_updated_at BEFORE UPDATE ON active_timer_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_aufgaben_updated_at ON aufgaben;
CREATE TRIGGER update_aufgaben_updated_at BEFORE UPDATE ON aufgaben
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_calendar_blocks_updated_at ON calendar_blocks;
CREATE TRIGGER update_calendar_blocks_updated_at BEFORE UPDATE ON calendar_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_calendar_tasks_updated_at ON calendar_tasks;
CREATE TRIGGER update_calendar_tasks_updated_at BEFORE UPDATE ON calendar_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_content_plans_updated_at ON content_plans;
CREATE TRIGGER update_content_plans_updated_at BEFORE UPDATE ON content_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_contents_updated_at ON contents;
CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON contents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_leistungen_updated_at ON leistungen;
CREATE TRIGGER update_leistungen_updated_at BEFORE UPDATE ON leistungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_semester_leistungen_updated_at ON semester_leistungen;
CREATE TRIGGER update_semester_leistungen_updated_at BEFORE UPDATE ON semester_leistungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_lernplaene_updated_at ON lernplaene;
CREATE TRIGGER update_lernplaene_updated_at BEFORE UPDATE ON lernplaene
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_logbuch_entries_updated_at ON logbuch_entries;
CREATE TRIGGER update_logbuch_entries_updated_at BEFORE UPDATE ON logbuch_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_private_sessions_updated_at ON private_sessions;
CREATE TRIGGER update_private_sessions_updated_at BEFORE UPDATE ON private_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_time_sessions_updated_at ON time_sessions;
CREATE TRIGGER update_time_sessions_updated_at BEFORE UPDATE ON time_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_uebungsklausuren_updated_at ON uebungsklausuren;
CREATE TRIGGER update_uebungsklausuren_updated_at BEFORE UPDATE ON uebungsklausuren
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- T14: User approval triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_new_profile_notify_admin ON profiles;
CREATE TRIGGER on_new_profile_notify_admin
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_admin_on_new_user();

DROP TRIGGER IF EXISTS on_profile_approval_change ON profiles;
CREATE TRIGGER on_profile_approval_change
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_user_on_approval();

-- ============================================
-- END OF SCHEMA
-- ============================================
