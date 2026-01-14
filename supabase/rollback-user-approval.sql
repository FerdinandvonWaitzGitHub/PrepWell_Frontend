-- ============================================
-- T14: ROLLBACK - User Approval System
-- ============================================
-- Fuehre dieses Script aus um das Approval System zu entfernen
-- ACHTUNG: Loescht alle Profile-Daten!
-- ============================================

-- Trigger entfernen
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists update_profiles_updated_at on public.profiles;

-- Funktionen entfernen
drop function if exists public.handle_new_user();
drop function if exists public.is_user_approved(uuid);

-- Policies entfernen
drop policy if exists "profiles_read_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

-- Indexes entfernen
drop index if exists idx_profiles_approved;
drop index if exists idx_profiles_email;

-- Tabelle entfernen (VORSICHT: Loescht alle Profile-Daten!)
drop table if exists public.profiles;

-- ============================================
-- DONE: Approval System entfernt
-- ============================================
