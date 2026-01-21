-- Migration: Add unique constraint on (user_id, block_date, position) for calendar_blocks
-- Date: 2026-01-16
-- Ticket: KA-002 - Prevent duplicate blocks on the same date/position
-- ============================================

-- First, remove any existing duplicates (keep the newest by updated_at)
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, block_date, position
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
         ) as rn
  FROM calendar_blocks
  WHERE position IS NOT NULL
)
DELETE FROM calendar_blocks
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Add unique constraint to prevent future duplicates
-- Only applies when position is NOT NULL (empty placeholder blocks don't have position)
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_blocks_unique_position
ON calendar_blocks(user_id, block_date, position)
WHERE position IS NOT NULL;

-- Add comment explaining the constraint
COMMENT ON INDEX idx_calendar_blocks_unique_position IS
  'KA-002: Prevents duplicate blocks on same date/position. Max 4 blocks per day (positions 1-4).';
