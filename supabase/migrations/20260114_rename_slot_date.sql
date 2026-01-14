-- Migration: Rename slot_date to block_date in calendar_blocks
-- Fixes: 'null value in column "slot_date" violates not-null constraint'
-- The code sends block_date but the DB has slot_date

-- Rename the column (idempotent - won't fail if already renamed)
DO $$
BEGIN
  -- Check if slot_date exists and block_date doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_blocks' AND column_name = 'slot_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_blocks' AND column_name = 'block_date'
  ) THEN
    ALTER TABLE calendar_blocks RENAME COLUMN slot_date TO block_date;
    RAISE NOTICE 'Renamed slot_date to block_date';
  ELSE
    RAISE NOTICE 'Column already correct (block_date exists or slot_date does not exist)';
  END IF;
END $$;

-- Verify the column exists with the correct name
SELECT column_name FROM information_schema.columns
WHERE table_name = 'calendar_blocks' AND column_name = 'block_date';
