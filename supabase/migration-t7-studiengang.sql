-- MIGRATION T7: Add studiengang column to user_settings
--
-- T7: Nicht-Jura Studiengänge - Phase 1
-- Der Studiengang muss zu Supabase gesynct werden.
--
-- Speichert: "jura", "medizin", "informatik", "bwl", etc.

-- Step 1: Add studiengang column
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS studiengang TEXT;

-- Step 2: Create index for potential future queries
CREATE INDEX IF NOT EXISTS idx_user_settings_studiengang ON user_settings(studiengang);

-- Verify
-- SELECT id, user_id, studiengang FROM user_settings;
