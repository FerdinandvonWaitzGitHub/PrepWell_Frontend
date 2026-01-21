-- T22: Add kapitel_ebene_aktiviert column to user_settings
-- This setting controls whether the Kapitel (chapter) hierarchy level is shown
-- Only relevant for Jura students, default is false

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS kapitel_ebene_aktiviert BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN user_settings.kapitel_ebene_aktiviert IS 'T22: Enables Kapitel hierarchy level in Themenliste (only for Jura students)';
