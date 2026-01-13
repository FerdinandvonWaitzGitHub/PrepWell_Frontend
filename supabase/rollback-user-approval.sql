-- ROLLBACK: User Approval System
-- Run this to restore original RLS policies (without approval check)

-- Content Plans
DROP POLICY IF EXISTS "Users can view own content_plans" ON content_plans;
CREATE POLICY "Users can view own content_plans" ON content_plans FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own content_plans" ON content_plans;
CREATE POLICY "Users can create own content_plans" ON content_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own content_plans" ON content_plans;
CREATE POLICY "Users can update own content_plans" ON content_plans FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own content_plans" ON content_plans;
CREATE POLICY "Users can delete own content_plans" ON content_plans FOR DELETE USING (auth.uid() = user_id);

-- Calendar Blocks
DROP POLICY IF EXISTS "Users can view own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can view own calendar_blocks" ON calendar_blocks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can create own calendar_blocks" ON calendar_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can update own calendar_blocks" ON calendar_blocks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own calendar_blocks" ON calendar_blocks;
CREATE POLICY "Users can delete own calendar_blocks" ON calendar_blocks FOR DELETE USING (auth.uid() = user_id);

-- Time Sessions
DROP POLICY IF EXISTS "Users can view own time_sessions" ON time_sessions;
CREATE POLICY "Users can view own time_sessions" ON time_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own time_sessions" ON time_sessions;
CREATE POLICY "Users can create own time_sessions" ON time_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own time_sessions" ON time_sessions;
CREATE POLICY "Users can update own time_sessions" ON time_sessions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own time_sessions" ON time_sessions;
CREATE POLICY "Users can delete own time_sessions" ON time_sessions FOR DELETE USING (auth.uid() = user_id);

-- Private Sessions
DROP POLICY IF EXISTS "Users can view own private_sessions" ON private_sessions;
CREATE POLICY "Users can view own private_sessions" ON private_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own private_sessions" ON private_sessions;
CREATE POLICY "Users can create own private_sessions" ON private_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own private_sessions" ON private_sessions;
CREATE POLICY "Users can update own private_sessions" ON private_sessions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own private_sessions" ON private_sessions;
CREATE POLICY "Users can delete own private_sessions" ON private_sessions FOR DELETE USING (auth.uid() = user_id);

-- Calendar Tasks
DROP POLICY IF EXISTS "Users can view own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can view own calendar_tasks" ON calendar_tasks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can create own calendar_tasks" ON calendar_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can update own calendar_tasks" ON calendar_tasks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own calendar_tasks" ON calendar_tasks;
CREATE POLICY "Users can delete own calendar_tasks" ON calendar_tasks FOR DELETE USING (auth.uid() = user_id);

-- Timer Sessions
DROP POLICY IF EXISTS "Users can view own timer_sessions" ON timer_sessions;
CREATE POLICY "Users can view own timer_sessions" ON timer_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own timer_sessions" ON timer_sessions;
CREATE POLICY "Users can create own timer_sessions" ON timer_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Logbuch Entries
DROP POLICY IF EXISTS "Users can view own logbuch_entries" ON logbuch_entries;
CREATE POLICY "Users can view own logbuch_entries" ON logbuch_entries FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own logbuch_entries" ON logbuch_entries;
CREATE POLICY "Users can create own logbuch_entries" ON logbuch_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own logbuch_entries" ON logbuch_entries;
CREATE POLICY "Users can update own logbuch_entries" ON logbuch_entries FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own logbuch_entries" ON logbuch_entries;
CREATE POLICY "Users can delete own logbuch_entries" ON logbuch_entries FOR DELETE USING (auth.uid() = user_id);

-- Check-In Responses
DROP POLICY IF EXISTS "Users can view own checkin_responses" ON checkin_responses;
CREATE POLICY "Users can view own checkin_responses" ON checkin_responses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own checkin_responses" ON checkin_responses;
CREATE POLICY "Users can create own checkin_responses" ON checkin_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own checkin_responses" ON checkin_responses;
CREATE POLICY "Users can update own checkin_responses" ON checkin_responses FOR UPDATE USING (auth.uid() = user_id);

-- DONE: Policies restored to original state (no approval check)
