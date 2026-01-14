-- T18: Content Plan Duplikations-Bug Fix
-- Dieses Script entfernt duplizierte Content Plans basierend auf (user_id, imported_from)

-- Schritt 1: Identifiziere Duplikate und behalte nur den ältesten pro User+Template
-- (Der älteste hat wahrscheinlich die meisten Aufgaben/Fortschritte)

WITH duplicates AS (
  SELECT
    id,
    user_id,
    name,
    imported_from,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, imported_from
      ORDER BY created_at ASC  -- Behalte den ältesten
    ) as rn
  FROM content_plans
  WHERE imported_from IS NOT NULL
)
DELETE FROM content_plans
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Schritt 2: Log wie viele gelöscht wurden (optional - auskommentiert)
-- SELECT
--   COUNT(*) as deleted_count
-- FROM content_plans
-- WHERE imported_from IS NOT NULL
-- GROUP BY user_id, imported_from
-- HAVING COUNT(*) > 1;

-- Schritt 3: Füge Unique Constraint hinzu um zukünftige Duplikate zu verhindern
-- NULLS DISTINCT (default): Erlaubt mehrere Plans mit NULL imported_from (manuell erstellte),
-- aber nur einen pro Template-ID (NOT NULL imported_from)
ALTER TABLE content_plans
DROP CONSTRAINT IF EXISTS unique_user_imported_from;

-- Partial unique index: Nur für Einträge MIT imported_from (nicht NULL)
-- Das erlaubt beliebig viele manuell erstellte Plans (imported_from = NULL)
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_imported_template
ON content_plans (user_id, imported_from)
WHERE imported_from IS NOT NULL;

-- Hinweis: Nach diesem Script muss der User seinen localStorage clearen:
-- localStorage.removeItem('prepwell_content_plans')
-- oder sich einmal aus- und wieder einloggen.
