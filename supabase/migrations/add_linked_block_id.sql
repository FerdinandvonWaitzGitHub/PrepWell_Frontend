-- Migration: Add linked_block_id to calendar_tasks
-- Run this in Supabase SQL Editor if the column doesn't exist
-- Date: 2026-01-14

-- Add linked_block_id column to calendar_tasks
DO $$ BEGIN
  ALTER TABLE calendar_tasks ADD COLUMN linked_block_id UUID REFERENCES calendar_blocks(id) ON DELETE SET NULL;
  RAISE NOTICE 'Added linked_block_id column to calendar_tasks';
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'Column linked_block_id already exists in calendar_tasks';
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_linked_block_id ON calendar_tasks(linked_block_id);
