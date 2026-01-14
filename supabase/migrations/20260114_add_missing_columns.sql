-- Migration: Add all missing columns to calendar_blocks and private_sessions
-- Run this in Supabase SQL Editor to fix 400 errors

-- ============================================
-- calendar_blocks: Add missing columns
-- ============================================

-- Basic content columns
DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN content_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN content_plan_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN position INT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN title TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN block_type TEXT DEFAULT 'lernblock';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- W5: Rechtsgebiet columns for coloring
DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN rechtsgebiet TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN unterrechtsgebiet TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Lock/Lernplan flags
DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN is_from_lernplan BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Repeat/Series columns
DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN repeat_enabled BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN repeat_type TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN repeat_count INT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN series_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN custom_days JSONB;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Tasks and metadata
DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN tasks JSONB DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_blocks ADD COLUMN metadata JSONB DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================
-- private_sessions: Add missing columns
-- ============================================

-- Multi-day support (BUG-012 FIX)
DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN end_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN is_multi_day BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN all_day BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Repeat/Series columns
DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN repeat_enabled BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN repeat_type TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN repeat_count INT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN series_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN custom_days JSONB;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Metadata
DO $$ BEGIN
  ALTER TABLE private_sessions ADD COLUMN metadata JSONB DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================
-- time_sessions: Add missing columns
-- ============================================

DO $$ BEGIN
  ALTER TABLE time_sessions ADD COLUMN rechtsgebiet TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE time_sessions ADD COLUMN unterrechtsgebiet TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE time_sessions ADD COLUMN repeat_enabled BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE time_sessions ADD COLUMN repeat_type TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE time_sessions ADD COLUMN repeat_count INT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE time_sessions ADD COLUMN series_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE time_sessions ADD COLUMN custom_days JSONB;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE time_sessions ADD COLUMN tasks JSONB DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE time_sessions ADD COLUMN metadata JSONB DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================
-- Verify: Check column existence
-- ============================================

-- Uncomment to verify columns after running:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'calendar_blocks' ORDER BY ordinal_position;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'private_sessions' ORDER BY ordinal_position;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'time_sessions' ORDER BY ordinal_position;
