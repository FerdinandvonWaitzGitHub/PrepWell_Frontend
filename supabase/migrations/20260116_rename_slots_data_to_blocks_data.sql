-- Migration: Rename slots_data to blocks_data in archived_lernplaene
-- Date: 2026-01-16
-- Ticket: KA-002 Terminology Refactoring (slot → block)
-- ============================================

-- Rename the column from slots_data to blocks_data
ALTER TABLE archived_lernplaene
RENAME COLUMN slots_data TO blocks_data;

-- Add comment explaining the rename
COMMENT ON COLUMN archived_lernplaene.blocks_data IS
  'Block allocation data for the archived learning plan. Renamed from slots_data (2026-01-16).';
