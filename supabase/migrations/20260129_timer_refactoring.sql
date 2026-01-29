-- ============================================
-- PW-035: TIMER SESSIONS REFACTORING MIGRATION
-- ============================================
-- Datum: 2026-01-29
-- Zweck: Duplikat-Problem beheben, sauberes Datenmodell einführen
-- WICHTIG: Dieses Script löscht ALLE bestehenden Timer-Daten!

-- 1. TRUNCATE (Clean Slate - 39.000+ Duplikate entfernen)
TRUNCATE timer_sessions;

-- 2. Neue Spalten hinzufügen
ALTER TABLE timer_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE timer_sessions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
ALTER TABLE timer_sessions ADD COLUMN IF NOT EXISTS duration_ms BIGINT;
ALTER TABLE timer_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE timer_sessions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE timer_sessions ADD COLUMN IF NOT EXISTS task_id UUID;
ALTER TABLE timer_sessions ADD COLUMN IF NOT EXISTS task_title TEXT;
ALTER TABLE timer_sessions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';

-- 3. Alte Spalten ENTFERNEN
ALTER TABLE timer_sessions DROP COLUMN IF EXISTS session_date;
ALTER TABLE timer_sessions DROP COLUMN IF EXISTS session_time;
ALTER TABLE timer_sessions DROP COLUMN IF EXISTS duration_seconds;
ALTER TABLE timer_sessions DROP COLUMN IF EXISTS completed;

-- 4. Status-Constraint hinzufügen (nur wenn nicht existiert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'timer_sessions_status_check'
  ) THEN
    ALTER TABLE timer_sessions ADD CONSTRAINT timer_sessions_status_check
      CHECK (status IN ('running', 'completed', 'cancelled'));
  END IF;
END $$;

-- 5. Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_started
  ON timer_sessions (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_status_running
  ON timer_sessions (status) WHERE status = 'running';

-- 6. View für Tages-Statistiken
CREATE OR REPLACE VIEW daily_timer_stats AS
SELECT
  user_id,
  DATE(started_at) AS day,
  COUNT(*) AS session_count,
  SUM(duration_ms) AS total_duration_ms,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
  AVG(duration_ms) AS avg_duration_ms
FROM timer_sessions
WHERE started_at IS NOT NULL
GROUP BY user_id, DATE(started_at);

-- 7. View für Wochen-Statistiken
CREATE OR REPLACE VIEW weekly_timer_stats AS
SELECT
  user_id,
  DATE_TRUNC('week', started_at)::date AS week_start,
  COUNT(*) AS session_count,
  SUM(duration_ms) AS total_duration_ms,
  COUNT(DISTINCT DATE(started_at)) AS learning_days,
  AVG(duration_ms) AS avg_duration_ms
FROM timer_sessions
WHERE started_at IS NOT NULL AND status = 'completed'
GROUP BY user_id, DATE_TRUNC('week', started_at);

-- 8. RLS Policies aktualisieren
DROP POLICY IF EXISTS "Users can view own timer_sessions" ON timer_sessions;
DROP POLICY IF EXISTS "Users can insert own timer_sessions" ON timer_sessions;
DROP POLICY IF EXISTS "Users can update own timer_sessions" ON timer_sessions;

CREATE POLICY "Users can view own timer_sessions" ON timer_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timer_sessions" ON timer_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timer_sessions" ON timer_sessions
  FOR UPDATE USING (auth.uid() = user_id);
