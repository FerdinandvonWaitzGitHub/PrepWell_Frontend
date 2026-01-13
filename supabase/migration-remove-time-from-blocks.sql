-- MIGRATION: Remove time fields from calendar_blocks (PRD Compliance)
--
-- PRD Rule: BlockAllocation (Monatsansicht) darf KEINE Uhrzeiten haben!
-- - BlockAllocation: date, kind, size (1-4), content_id
-- - Session (time_sessions): start_at, end_at, kind
--
-- Diese Migration entfernt die Zeit-Felder aus calendar_blocks

-- Step 1: Check if any blocks have time data that should be migrated to time_sessions
-- (Run this SELECT first to see if data migration is needed)
/*
SELECT id, block_date, title, start_time, end_time, has_time
FROM calendar_blocks
WHERE has_time = true OR start_time IS NOT NULL OR end_time IS NOT NULL;
*/

-- Step 2: Remove time columns from calendar_blocks
ALTER TABLE calendar_blocks DROP COLUMN IF EXISTS has_time;
ALTER TABLE calendar_blocks DROP COLUMN IF EXISTS start_hour;
ALTER TABLE calendar_blocks DROP COLUMN IF EXISTS duration;
ALTER TABLE calendar_blocks DROP COLUMN IF EXISTS start_time;
ALTER TABLE calendar_blocks DROP COLUMN IF EXISTS end_time;

-- Verify: Show remaining columns
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'calendar_blocks';

-- DONE: calendar_blocks now only has position-based fields (PRD compliant)
