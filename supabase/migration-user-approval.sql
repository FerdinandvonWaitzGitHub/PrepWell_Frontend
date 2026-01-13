-- PrepWell Migration: User Approval System (Option 3)
-- Run this in Supabase SQL Editor after schema.sql
-- IDEMPOTENT: Can be run multiple times without errors

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Create profiles table to store user metadata including approval status
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,  -- Admin email/ID who approved
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Migration: Add approved column if table exists but column doesn't
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN approved BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN approved_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN approved_by TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can only view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (but NOT the approved field)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profile is auto-created on signup via trigger (see below)
DROP POLICY IF EXISTS "System can create profiles" ON profiles;
CREATE POLICY "System can create profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- HELPER FUNCTION: Check if user is approved
-- ============================================

CREATE OR REPLACE FUNCTION is_user_approved(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT approved FROM profiles WHERE id = user_uuid),
    FALSE
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, approved, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    FALSE,  -- New users start as NOT approved
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- UPDATED RLS POLICIES: Require Approval
-- ============================================
-- These policies REPLACE the existing ones to add approval check

-- Content Plans: Require approval
DROP POLICY IF EXISTS "Users can view own content_plans" ON content_plans;
CREATE POLICY "Users can view own content_plans" ON content_plans
  FOR SELECT USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can create own content_plans" ON content_plans;
CREATE POLICY "Users can create own content_plans" ON content_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can update own content_plans" ON content_plans;
CREATE POLICY "Users can update own content_plans" ON content_plans
  FOR UPDATE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own content_plans" ON content_plans;
CREATE POLICY "Users can delete own content_plans" ON content_plans
  FOR DELETE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Calendar Blocks: Require approval
DROP POLICY IF EXISTS "Users can view own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can view own calendar_blocks" ON calendar_blocks
  FOR SELECT USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can create own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can create own calendar_blocks" ON calendar_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can update own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can update own calendar_blocks" ON calendar_blocks
  FOR UPDATE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can delete own calendar_blocks" ON calendar_blocks
  FOR DELETE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Time Sessions: Require approval
DROP POLICY IF EXISTS "Users can view own time_sessions" ON time_sessions;
CREATE POLICY "Users can view own time_sessions" ON time_sessions
  FOR SELECT USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can create own time_sessions" ON time_sessions;
CREATE POLICY "Users can create own time_sessions" ON time_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can update own time_sessions" ON time_sessions;
CREATE POLICY "Users can update own time_sessions" ON time_sessions
  FOR UPDATE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own time_sessions" ON time_sessions;
CREATE POLICY "Users can delete own time_sessions" ON time_sessions
  FOR DELETE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Private Sessions: Require approval
DROP POLICY IF EXISTS "Users can view own private_sessions" ON private_sessions;
CREATE POLICY "Users can view own private_sessions" ON private_sessions
  FOR SELECT USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can create own private_sessions" ON private_sessions;
CREATE POLICY "Users can create own private_sessions" ON private_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can update own private_sessions" ON private_sessions;
CREATE POLICY "Users can update own private_sessions" ON private_sessions
  FOR UPDATE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own private_sessions" ON private_sessions;
CREATE POLICY "Users can delete own private_sessions" ON private_sessions
  FOR DELETE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Calendar Tasks: Require approval
DROP POLICY IF EXISTS "Users can view own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can view own calendar_tasks" ON calendar_tasks
  FOR SELECT USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can create own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can create own calendar_tasks" ON calendar_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can update own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can update own calendar_tasks" ON calendar_tasks
  FOR UPDATE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can delete own calendar_tasks" ON calendar_tasks
  FOR DELETE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Timer Sessions: Require approval
DROP POLICY IF EXISTS "Users can view own timer_sessions" ON timer_sessions;
CREATE POLICY "Users can view own timer_sessions" ON timer_sessions
  FOR SELECT USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can create own timer_sessions" ON timer_sessions;
CREATE POLICY "Users can create own timer_sessions" ON timer_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Logbuch Entries: Require approval
DROP POLICY IF EXISTS "Users can view own logbuch_entries" ON logbuch_entries;
CREATE POLICY "Users can view own logbuch_entries" ON logbuch_entries
  FOR SELECT USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can create own logbuch_entries" ON logbuch_entries;
CREATE POLICY "Users can create own logbuch_entries" ON logbuch_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can update own logbuch_entries" ON logbuch_entries;
CREATE POLICY "Users can update own logbuch_entries" ON logbuch_entries
  FOR UPDATE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own logbuch_entries" ON logbuch_entries;
CREATE POLICY "Users can delete own logbuch_entries" ON logbuch_entries
  FOR DELETE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Check-In Responses: Require approval
DROP POLICY IF EXISTS "Users can view own checkin_responses" ON checkin_responses;
CREATE POLICY "Users can view own checkin_responses" ON checkin_responses
  FOR SELECT USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can create own checkin_responses" ON checkin_responses;
CREATE POLICY "Users can create own checkin_responses" ON checkin_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can update own checkin_responses" ON checkin_responses;
CREATE POLICY "Users can update own checkin_responses" ON checkin_responses
  FOR UPDATE USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- ============================================
-- USER SETTINGS: Allow without approval
-- (so users can see the pending screen and settings)
-- ============================================

-- Keep user_settings accessible without approval check
-- (Already defined in schema.sql, no changes needed)

-- ============================================
-- ADMIN: Approve User Function
-- ============================================

-- Function to approve a user (call from Supabase Dashboard or Admin API)
CREATE OR REPLACE FUNCTION approve_user(user_email TEXT, admin_id TEXT DEFAULT 'system')
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id FROM profiles WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_email;
  END IF;

  -- Update approval status
  UPDATE profiles
  SET approved = TRUE,
      approved_at = NOW(),
      approved_by = admin_id,
      updated_at = NOW()
  WHERE id = target_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list pending users (for admin dashboard)
CREATE OR REPLACE FUNCTION get_pending_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
  SELECT id, email, full_name, created_at
  FROM profiles
  WHERE approved = FALSE
  ORDER BY created_at DESC;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- INDEX for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_approved ON profiles(approved);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- TRIGGER: Update updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- END OF MIGRATION
-- ============================================
