-- MIGRATION: Change custom_subjects from TEXT[] to JSONB
--
-- T-SET-1: Custom Rechtsgebiet-Farben & Faecher
-- Die custom_subjects Spalte muss JSONB sein, um colorOverrides und customSubjects zu speichern.
--
-- Struktur:
-- {
--   "colorOverrides": { "oeffentliches-recht": "emerald", ... },
--   "customSubjects": [{ "id": "europarecht", "name": "Europarecht", "color": "amber" }]
-- }

-- Step 1: Add new JSONB column
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS subject_settings JSONB DEFAULT '{}';

-- Step 2: Migrate existing data (if any custom_subjects exist as TEXT[])
-- Note: Old custom_subjects was TEXT[], new structure is JSONB
UPDATE user_settings
SET subject_settings = jsonb_build_object(
  'colorOverrides', '{}',
  'customSubjects', COALESCE(
    (SELECT jsonb_agg(elem) FROM unnest(custom_subjects) AS elem WHERE elem IS NOT NULL),
    '[]'
  )
)
WHERE custom_subjects IS NOT NULL
  AND array_length(custom_subjects, 1) > 0
  AND (subject_settings IS NULL OR subject_settings = '{}');

-- Step 3: Drop old column (optional - can keep for backwards compatibility)
-- ALTER TABLE user_settings DROP COLUMN IF EXISTS custom_subjects;

-- Verify
-- SELECT id, subject_settings FROM user_settings;
