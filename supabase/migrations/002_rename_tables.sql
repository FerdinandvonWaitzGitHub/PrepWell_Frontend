-- PrepWell Database Migration: Rename Tables
-- Slot → Block, Block → Session
--
-- IMPORTANT: Run this migration AFTER updating the frontend code!
-- This ensures the new table names match the updated code references.

-- ============================================
-- STEP 1: RENAME TABLES
-- ============================================

-- calendar_slots → calendar_blocks
ALTER TABLE IF EXISTS calendar_slots RENAME TO calendar_blocks;

-- private_blocks → private_sessions
ALTER TABLE IF EXISTS private_blocks RENAME TO private_sessions;

-- time_blocks → time_sessions
ALTER TABLE IF EXISTS time_blocks RENAME TO time_sessions;

-- ============================================
-- STEP 2: RENAME INDEXES
-- ============================================

-- calendar_slots indexes → calendar_blocks
ALTER INDEX IF EXISTS idx_calendar_slots_user_id RENAME TO idx_calendar_blocks_user_id;
ALTER INDEX IF EXISTS idx_calendar_slots_date RENAME TO idx_calendar_blocks_date;
ALTER INDEX IF EXISTS idx_calendar_slots_user_date RENAME TO idx_calendar_blocks_user_date;
ALTER INDEX IF EXISTS idx_calendar_slots_series_id RENAME TO idx_calendar_blocks_series_id;

-- private_blocks indexes → private_sessions
ALTER INDEX IF EXISTS idx_private_blocks_user_id RENAME TO idx_private_sessions_user_id;
ALTER INDEX IF EXISTS idx_private_blocks_date RENAME TO idx_private_sessions_date;
ALTER INDEX IF EXISTS idx_private_blocks_user_date RENAME TO idx_private_sessions_user_date;
ALTER INDEX IF EXISTS idx_private_blocks_series_id RENAME TO idx_private_sessions_series_id;

-- ============================================
-- STEP 3: DROP OLD RLS POLICIES
-- ============================================

-- Drop calendar_slots policies
DROP POLICY IF EXISTS "Users can view own calendar_slots" ON calendar_blocks;
DROP POLICY IF EXISTS "Users can create own calendar_slots" ON calendar_blocks;
DROP POLICY IF EXISTS "Users can update own calendar_slots" ON calendar_blocks;
DROP POLICY IF EXISTS "Users can delete own calendar_slots" ON calendar_blocks;

-- Drop private_blocks policies
DROP POLICY IF EXISTS "Users can view own private_blocks" ON private_sessions;
DROP POLICY IF EXISTS "Users can create own private_blocks" ON private_sessions;
DROP POLICY IF EXISTS "Users can update own private_blocks" ON private_sessions;
DROP POLICY IF EXISTS "Users can delete own private_blocks" ON private_sessions;

-- Drop time_blocks policies
DROP POLICY IF EXISTS "Users can view own time_blocks" ON time_sessions;
DROP POLICY IF EXISTS "Users can create own time_blocks" ON time_sessions;
DROP POLICY IF EXISTS "Users can update own time_blocks" ON time_sessions;
DROP POLICY IF EXISTS "Users can delete own time_blocks" ON time_sessions;

-- ============================================
-- STEP 4: CREATE NEW RLS POLICIES
-- ============================================

-- calendar_blocks policies
CREATE POLICY "Users can view own calendar_blocks" ON calendar_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own calendar_blocks" ON calendar_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar_blocks" ON calendar_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar_blocks" ON calendar_blocks FOR DELETE USING (auth.uid() = user_id);

-- private_sessions policies
CREATE POLICY "Users can view own private_sessions" ON private_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own private_sessions" ON private_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own private_sessions" ON private_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own private_sessions" ON private_sessions FOR DELETE USING (auth.uid() = user_id);

-- time_sessions policies
CREATE POLICY "Users can view own time_sessions" ON time_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own time_sessions" ON time_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time_sessions" ON time_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own time_sessions" ON time_sessions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STEP 5: RENAME TRIGGERS
-- ============================================

-- Rename calendar_slots trigger
DROP TRIGGER IF EXISTS update_calendar_slots_updated_at ON calendar_blocks;
CREATE TRIGGER update_calendar_blocks_updated_at BEFORE UPDATE ON calendar_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Rename private_blocks trigger
DROP TRIGGER IF EXISTS update_private_blocks_updated_at ON private_sessions;
CREATE TRIGGER update_private_sessions_updated_at BEFORE UPDATE ON private_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Rename time_blocks trigger
DROP TRIGGER IF EXISTS update_time_blocks_updated_at ON time_sessions;
CREATE TRIGGER update_time_sessions_updated_at BEFORE UPDATE ON time_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STEP 6: UPDATE FOREIGN KEY REFERENCES
-- ============================================

-- Update calendar_tasks foreign key reference (if exists)
-- Note: This assumes the constraint name follows the default pattern
ALTER TABLE IF EXISTS calendar_tasks
  DROP CONSTRAINT IF EXISTS calendar_tasks_linked_slot_id_fkey;

ALTER TABLE IF EXISTS calendar_tasks
  ADD CONSTRAINT calendar_tasks_linked_block_id_fkey
  FOREIGN KEY (linked_slot_id) REFERENCES calendar_blocks(id) ON DELETE SET NULL;

-- Optionally rename the column (commented out - would require code changes)
-- ALTER TABLE calendar_tasks RENAME COLUMN linked_slot_id TO linked_block_id;

-- ============================================
-- END OF MIGRATION
-- ============================================
