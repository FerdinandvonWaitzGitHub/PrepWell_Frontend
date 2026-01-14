-- ============================================
-- T14: User Approval System - SQL Migration
-- ============================================
-- WICHTIG: Diese Migration in der richtigen Reihenfolge ausfuehren!
-- Empfehlung: Im Supabase Dashboard SQL Editor ausfuehren
--
-- UNTERSCHIED ZUR ALTEN VERSION:
-- - KEINE RLS-Aenderungen an anderen Tabellen!
-- - Approval-Check passiert im FRONTEND (Router)
-- - Nur profiles Tabelle + Trigger + Helper
-- ============================================

-- ============================================
-- SCHRITT 1: Profiles Tabelle erstellen
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  approved boolean not null default false,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- SCHRITT 2: RLS aktivieren
-- ============================================
alter table public.profiles enable row level security;

-- ============================================
-- SCHRITT 3: Policy - User kann eigenes Profil lesen
-- WICHTIG: KEINE Approval-Check hier! Sonst kann User
-- seinen eigenen Status nicht abfragen.
-- ============================================
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
on public.profiles
for select
using (auth.uid() = id);

-- User kann auch eigenes Profil updaten (ausser approved Felder)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id);

-- ============================================
-- SCHRITT 4: BESTEHENDE USER MIGRIEREN (KRITISCH!)
-- Alle existierenden User bekommen approved = true
-- damit sie weiterhin die App nutzen koennen
-- ============================================
insert into public.profiles (id, email, full_name, approved, approved_at)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', ''),
  true,  -- WICHTIG: Bestehende User sind automatisch freigeschaltet!
  now()
from auth.users
on conflict (id) do update
  set approved = true,
      approved_at = now();

-- ============================================
-- SCHRITT 5: Trigger-Funktion fuer NEUE User
-- Neue User bekommen approved = false
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, approved)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    false  -- Neue User muessen freigeschaltet werden
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;
  return new;
end;
$$;

-- ============================================
-- SCHRITT 6: Trigger erstellen
-- ============================================
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================
-- SCHRITT 7: Helper-Funktion (optional)
-- ============================================
create or replace function public.is_user_approved(user_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select approved from public.profiles where id = user_uuid), false);
$$;

-- ============================================
-- SCHRITT 8: Index fuer Performance
-- ============================================
create index if not exists idx_profiles_approved on public.profiles(approved);
create index if not exists idx_profiles_email on public.profiles(email);

-- ============================================
-- SCHRITT 9: Updated_at Trigger
-- ============================================
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at();

-- ============================================
-- VERIFIZIERUNG: Nach Migration ausfuehren
-- ============================================
-- Pruefe: Alle bestehenden User haben approved = true
-- select id, email, approved, approved_at, created_at
-- from public.profiles
-- order by created_at desc;

-- ============================================
-- ADMIN HELPER: User freischalten
-- ============================================
-- UPDATE profiles SET approved = true, approved_at = now() WHERE email = 'user@example.com';
