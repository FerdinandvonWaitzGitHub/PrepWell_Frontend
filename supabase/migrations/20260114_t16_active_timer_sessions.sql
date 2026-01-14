-- T16-W3: Active Timer Sessions Table
-- Stores the currently running timer for each user, enabling persistence across browser restarts
-- This allows users to close the browser and resume their timer session later

-- Create the active_timer_sessions table
CREATE TABLE IF NOT EXISTS active_timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timer_type TEXT NOT NULL CHECK (timer_type IN ('pomodoro', 'countdown', 'countup')),
  timer_state TEXT NOT NULL CHECK (timer_state IN ('running', 'paused', 'break')),
  started_at TIMESTAMPTZ NOT NULL,
  paused_at TIMESTAMPTZ,
  accumulated_pause_ms BIGINT DEFAULT 0,

  -- Timer-specific settings (stored as JSONB for flexibility)
  pomodoro_settings JSONB,
  countdown_settings JSONB,
  current_session INT DEFAULT 1,
  total_sessions INT DEFAULT 1,
  is_break BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active timer per user (upsert will replace existing)
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_timer_user ON active_timer_sessions(user_id);

-- Enable Row Level Security
ALTER TABLE active_timer_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own active timer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own active timer'
  ) THEN
    CREATE POLICY "Users can manage own active timer"
      ON active_timer_sessions FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Index for quick lookups by user_id (already covered by unique index)
-- Performance index on updated_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_active_timer_updated ON active_timer_sessions(updated_at);

-- Add comment for documentation
COMMENT ON TABLE active_timer_sessions IS 'T16-W3: Stores active timer state for persistence across browser restarts. Each user can have at most one active timer.';
