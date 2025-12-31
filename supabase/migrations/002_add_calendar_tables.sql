-- Migration: Add calendar-related tables for full Supabase sync
-- Run this if you have an existing database

-- ============================================
-- NEW TABLES
-- ============================================

-- Private Blocks (Personal calendar entries, not part of Lernplan)
CREATE TABLE IF NOT EXISTS private_blocks (
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
CREATE TABLE IF NOT EXISTS calendar_slots (
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
CREATE TABLE IF NOT EXISTS calendar_tasks (
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

-- ============================================
-- INDEXES
-- ============================================

-- Private Blocks indexes
CREATE INDEX IF NOT EXISTS idx_private_blocks_user_id ON private_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_private_blocks_date ON private_blocks(block_date);
CREATE INDEX IF NOT EXISTS idx_private_blocks_user_date ON private_blocks(user_id, block_date);

-- Calendar Slots indexes
CREATE INDEX IF NOT EXISTS idx_calendar_slots_user_id ON calendar_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_slots_date ON calendar_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_calendar_slots_user_date ON calendar_slots(user_id, slot_date);

-- Calendar Tasks indexes
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_user_id ON calendar_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_date ON calendar_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_user_date ON calendar_tasks(user_id, task_date);

-- Archived Lernplaene indexes
CREATE INDEX IF NOT EXISTS idx_archived_lernplaene_user_id ON archived_lernplaene(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE private_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_lernplaene ENABLE ROW LEVEL SECURITY;

-- Private Blocks Policies
DROP POLICY IF EXISTS "Users can view own private_blocks" ON private_blocks;
CREATE POLICY "Users can view own private_blocks" ON private_blocks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own private_blocks" ON private_blocks;
CREATE POLICY "Users can create own private_blocks" ON private_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own private_blocks" ON private_blocks;
CREATE POLICY "Users can update own private_blocks" ON private_blocks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own private_blocks" ON private_blocks;
CREATE POLICY "Users can delete own private_blocks" ON private_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- Calendar Slots Policies
DROP POLICY IF EXISTS "Users can view own calendar_slots" ON calendar_slots;
CREATE POLICY "Users can view own calendar_slots" ON calendar_slots
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own calendar_slots" ON calendar_slots;
CREATE POLICY "Users can create own calendar_slots" ON calendar_slots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own calendar_slots" ON calendar_slots;
CREATE POLICY "Users can update own calendar_slots" ON calendar_slots
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own calendar_slots" ON calendar_slots;
CREATE POLICY "Users can delete own calendar_slots" ON calendar_slots
  FOR DELETE USING (auth.uid() = user_id);

-- Calendar Tasks Policies
DROP POLICY IF EXISTS "Users can view own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can view own calendar_tasks" ON calendar_tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can create own calendar_tasks" ON calendar_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can update own calendar_tasks" ON calendar_tasks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can delete own calendar_tasks" ON calendar_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Archived Lernplaene Policies
DROP POLICY IF EXISTS "Users can view own archived_lernplaene" ON archived_lernplaene;
CREATE POLICY "Users can view own archived_lernplaene" ON archived_lernplaene
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own archived_lernplaene" ON archived_lernplaene;
CREATE POLICY "Users can create own archived_lernplaene" ON archived_lernplaene
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own archived_lernplaene" ON archived_lernplaene;
CREATE POLICY "Users can delete own archived_lernplaene" ON archived_lernplaene
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at on new tables
DROP TRIGGER IF EXISTS update_private_blocks_updated_at ON private_blocks;
CREATE TRIGGER update_private_blocks_updated_at BEFORE UPDATE ON private_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_calendar_slots_updated_at ON calendar_slots;
CREATE TRIGGER update_calendar_slots_updated_at BEFORE UPDATE ON calendar_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_calendar_tasks_updated_at ON calendar_tasks;
CREATE TRIGGER update_calendar_tasks_updated_at BEFORE UPDATE ON calendar_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
