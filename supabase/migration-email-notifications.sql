-- ============================================
-- T14: Email Notifications - SQL Migration
-- ============================================
-- VORAUSSETZUNGEN:
-- 1. pg_net Extension muss aktiviert sein
-- 2. Edge Functions muessen deployed sein:
--    - supabase functions deploy notify-admin
--    - supabase functions deploy notify-approval
-- 3. Supabase Secrets muessen gesetzt sein:
--    - RESEND_API_KEY
--    - ADMIN_EMAIL
-- ============================================

-- ============================================
-- SCHRITT 1: pg_net Extension aktivieren
-- (ermoeglicht HTTP-Requests aus der Datenbank)
-- ============================================
create extension if not exists pg_net with schema extensions;

-- ============================================
-- SCHRITT 2: Phase 5a - Admin-Benachrichtigung
-- Sendet Email an Admin wenn neuer User registriert
-- ============================================

-- Funktion die Edge Function aufruft
create or replace function public.notify_admin_on_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  service_role_key text;
  supabase_url text := 'https://vitvxwfcutysuifuqnqi.supabase.co';
begin
  -- Service Role Key aus Vault holen (falls konfiguriert)
  -- Alternativ: Direkter Aufruf ohne Auth fuer interne Trigger

  -- HTTP POST an Edge Function
  perform net.http_post(
    url := supabase_url || '/functions/v1/notify-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', new.id,
        'email', new.email,
        'full_name', new.full_name,
        'created_at', new.created_at
      )
    )
  );

  return new;
exception
  when others then
    -- Log error but don't block user registration
    raise warning 'notify_admin_on_new_user failed: %', sqlerrm;
    return new;
end;
$$;

-- Trigger auf profiles INSERT
drop trigger if exists on_new_profile_notify_admin on public.profiles;
create trigger on_new_profile_notify_admin
after insert on public.profiles
for each row execute function public.notify_admin_on_new_user();

-- ============================================
-- SCHRITT 3: Phase 5b - User-Benachrichtigung
-- Sendet Email an User wenn approved = true
-- ============================================

-- Funktion die Edge Function aufruft
create or replace function public.notify_user_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  supabase_url text := 'https://vitvxwfcutysuifuqnqi.supabase.co';
begin
  -- Nur wenn approved von false auf true wechselt
  if old.approved = false and new.approved = true then
    perform net.http_post(
      url := supabase_url || '/functions/v1/notify-approval',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', new.id,
          'email', new.email,
          'full_name', new.full_name,
          'approved', new.approved
        ),
        'old_record', jsonb_build_object(
          'id', old.id,
          'email', old.email,
          'full_name', old.full_name,
          'approved', old.approved
        )
      )
    );
  end if;

  return new;
exception
  when others then
    -- Log error but don't block approval
    raise warning 'notify_user_on_approval failed: %', sqlerrm;
    return new;
end;
$$;

-- Trigger auf profiles UPDATE
drop trigger if exists on_profile_approval_change on public.profiles;
create trigger on_profile_approval_change
after update on public.profiles
for each row execute function public.notify_user_on_approval();

-- ============================================
-- VERIFIZIERUNG
-- ============================================
-- Pruefe ob Trigger existieren:
-- select tgname, tgrelid::regclass from pg_trigger where tgname like '%notify%';

-- ============================================
-- ROLLBACK (falls noetig)
-- ============================================
-- drop trigger if exists on_new_profile_notify_admin on public.profiles;
-- drop trigger if exists on_profile_approval_change on public.profiles;
-- drop function if exists public.notify_admin_on_new_user();
-- drop function if exists public.notify_user_on_approval();
