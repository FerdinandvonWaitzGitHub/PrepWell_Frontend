# PrepWell Database Schema Snapshot

**Erstellt:** 2026-01-15
**Zweck:** Analyse für T20 Schema-Konsolidierung

---

## 1. Migrations-Inventar

### 1.1 Alle SQL-Dateien

| Datei | Inhalt | In schema.sql? | Aktion |
|-------|--------|----------------|--------|
| `schema.sql` | Haupt-Schema (744 Zeilen) | - | BEHALTEN + ERWEITERN |
| `migration-email-notifications.sql` | pg_net, notify_admin, notify_approval | NEIN | INTEGRIEREN |
| `migration-remove-time-from-blocks.sql` | DROP time columns von calendar_blocks | JA (Kommentar) | LÖSCHEN |
| `migration-subject-settings.sql` | subject_settings JSONB Spalte | JA | LÖSCHEN |
| `migration-t7-studiengang.sql` | studiengang Spalte + Index | JA | LÖSCHEN |
| `migration-user-approval.sql` | profiles Tabelle, RLS, Triggers | NEIN | INTEGRIEREN |
| `rollback-user-approval.sql` | Rollback-Script | - | LÖSCHEN |
| `migrations/001_add_missing_columns.sql` | checkin, content_plans, published | TEILWEISE | LÖSCHEN |
| `migrations/002_rename_tables.sql` | slots→blocks, blocks→sessions | VERALTET | LÖSCHEN |
| `migrations/20260114_t16_active_timer_sessions.sql` | active_timer_sessions Tabelle | NEIN | INTEGRIEREN |
| `migrations/20260114_t18_cleanup_duplicates.sql` | DELETE Duplikate + UNIQUE Index | EINMALIG | LÖSCHEN |
| `migrations/20260114_add_missing_columns.sql` | Spalten für blocks/sessions | JA | LÖSCHEN |
| `migrations/20260114_rename_slot_date.sql` | slot_date → block_date | JA | LÖSCHEN |
| `migrations/add_linked_block_id.sql` | linked_block_id FK | JA | LÖSCHEN |

### 1.2 Edge Functions (behalten)

| Funktion | Zweck |
|----------|-------|
| `functions/notify-admin/index.ts` | Email an Admin bei neuem User |
| `functions/notify-approval/index.ts` | Email an User bei Freischaltung |

---

## 2. Tabellen-Übersicht

### 2.1 In schema.sql definiert (21 Tabellen)

| Tabelle | Status | Anmerkung |
|---------|--------|-----------|
| `lernplaene` | AKTIV | |
| `contents` | AKTIV | |
| `slots` | LEGACY | Markiert als "(Legacy)" |
| `aufgaben` | AKTIV | |
| `leistungen` | AKTIV | |
| `uebungsklausuren` | AKTIV | |
| `content_plans` | AKTIV | |
| `published_themenlisten` | AKTIV | |
| `themenlisten` | LEGACY | Markiert als "LEGACY" |
| `custom_unterrechtsgebiete` | AKTIV | |
| `checkin_responses` | AKTIV | |
| `timer_sessions` | AKTIV | Timer-History |
| `logbuch_entries` | AKTIV | |
| `wizard_drafts` | AKTIV | |
| `private_sessions` | AKTIV | Ehem. private_blocks |
| `calendar_blocks` | AKTIV | Ehem. calendar_slots |
| `calendar_tasks` | AKTIV | |
| `time_sessions` | AKTIV | Ehem. time_blocks |
| `archived_lernplaene` | AKTIV | |
| `user_settings` | AKTIV | |

### 2.2 FEHLEN in schema.sql (2 Tabellen)

| Tabelle | Quelle | Beschreibung |
|---------|--------|--------------|
| `profiles` | migration-user-approval.sql | User Approval System (T14) |
| `active_timer_sessions` | 20260114_t16_active_timer_sessions.sql | Timer Persistence (T16) |

---

## 3. Fehlende Features in schema.sql

### 3.1 profiles Tabelle (T14)

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON profiles(approved);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- RLS Policies
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger für updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.2 active_timer_sessions Tabelle (T16)

```sql
CREATE TABLE IF NOT EXISTS active_timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timer_type TEXT NOT NULL CHECK (timer_type IN ('pomodoro', 'countdown', 'countup')),
  timer_state TEXT NOT NULL CHECK (timer_state IN ('running', 'paused', 'break')),
  started_at TIMESTAMPTZ NOT NULL,
  paused_at TIMESTAMPTZ,
  accumulated_pause_ms BIGINT DEFAULT 0,
  pomodoro_settings JSONB,
  countdown_settings JSONB,
  current_session INT DEFAULT 1,
  total_sessions INT DEFAULT 1,
  is_break BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique Index (nur ein aktiver Timer pro User)
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_timer_user ON active_timer_sessions(user_id);

-- Performance Index
CREATE INDEX IF NOT EXISTS idx_active_timer_updated ON active_timer_sessions(updated_at);

-- RLS Policy
CREATE POLICY "Users can manage own active timer" ON active_timer_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger für updated_at
CREATE TRIGGER update_active_timer_sessions_updated_at BEFORE UPDATE ON active_timer_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.3 Email Notification Functions

```sql
-- Extension für HTTP-Calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Admin Notification bei neuem User
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://vitvxwfcutysuifuqnqi.supabase.co';
BEGIN
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/notify-admin',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'full_name', NEW.full_name,
        'created_at', NEW.created_at
      )
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_admin_on_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- User Notification bei Freischaltung
CREATE OR REPLACE FUNCTION public.notify_user_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://vitvxwfcutysuifuqnqi.supabase.co';
BEGIN
  IF OLD.approved = FALSE AND NEW.approved = TRUE THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/notify-approval',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', NEW.id,
          'email', NEW.email,
          'full_name', NEW.full_name,
          'approved', NEW.approved
        ),
        'old_record', jsonb_build_object(
          'id', OLD.id,
          'email', OLD.email,
          'full_name', OLD.full_name,
          'approved', OLD.approved
        )
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_user_on_approval failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Triggers
CREATE TRIGGER on_new_profile_notify_admin
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_admin_on_new_user();

CREATE TRIGGER on_profile_approval_change
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_user_on_approval();
```

### 3.4 User Approval Trigger + Helper

```sql
-- Trigger für neue User (erstellt Profile mit approved=false)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    FALSE
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper Function
CREATE OR REPLACE FUNCTION public.is_user_approved(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT approved FROM profiles WHERE id = user_uuid), FALSE);
$$;
```

### 3.5 Content Plans Unique Index (T18)

```sql
-- Verhindert Duplikate bei importierten Templates
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_imported_template
  ON content_plans (user_id, imported_from)
  WHERE imported_from IS NOT NULL;
```

---

## 4. ENUMs (vollständig)

```sql
app_mode: 'standard', 'exam'
task_priority: 'low', 'medium', 'high'
task_status: 'unerledigt', 'erledigt'
grade_system: 'punkte', 'noten'
exam_status: 'angemeldet', 'bestanden', 'nicht_bestanden', 'ausstehend'
timer_type: 'pomodoro', 'countdown', 'countup'
block_type: 'lernblock', 'exam', 'repetition', 'private'
```

---

## 5. Spalten-Checkliste pro Tabelle

### calendar_blocks (19 Spalten)
- [x] id, user_id, created_at, updated_at
- [x] block_date (NICHT slot_date!)
- [x] position (1-4)
- [x] content_id, content_plan_id
- [x] title, block_type, rechtsgebiet, unterrechtsgebiet
- [x] is_locked, is_from_lernplan
- [x] repeat_enabled, repeat_type, repeat_count, series_id, custom_days
- [x] tasks, metadata
- [ ] KEINE Zeit-Felder (has_time, start_hour, duration, start_time, end_time)

### private_sessions (17 Spalten)
- [x] id, user_id, created_at, updated_at
- [x] session_date, end_date, is_multi_day
- [x] title, description
- [x] start_time, end_time, all_day
- [x] repeat_enabled, repeat_type, repeat_count, series_id, custom_days
- [x] metadata

### time_sessions (18 Spalten)
- [x] id, user_id, created_at, updated_at
- [x] session_date
- [x] title, description, block_type
- [x] start_time, end_time (NOT NULL)
- [x] rechtsgebiet, unterrechtsgebiet
- [x] repeat_enabled, repeat_type, repeat_count, series_id, custom_days
- [x] tasks, metadata

### user_settings (8 Spalten)
- [x] id, user_id, created_at, updated_at
- [x] mentor_activated
- [x] preferred_grade_system
- [x] timer_settings (JSONB)
- [x] custom_subjects (TEXT[] - Legacy)
- [x] subject_settings (JSONB)
- [x] studiengang

### calendar_tasks (9 Spalten)
- [x] id, user_id, created_at, updated_at
- [x] task_date
- [x] title, description
- [x] priority, completed
- [x] linked_block_id (FK → calendar_blocks)
- [x] metadata

---

## 6. SQL-Queries für Produktions-Analyse

Diese Queries im Supabase SQL Editor ausführen:

```sql
-- 1. Alle Tabellen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Spalten einer Tabelle (z.B. calendar_blocks)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'calendar_blocks'
ORDER BY ordinal_position;

-- 3. Alle Policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Alle Indexes
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Alle Triggers
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. Alle Functions
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 7. Prüfe ob profiles existiert
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'profiles'
);

-- 8. Prüfe ob active_timer_sessions existiert
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'active_timer_sessions'
);
```

---

## 7. Zusammenfassung

### Zu integrieren in schema.sql:
1. `profiles` Tabelle + RLS + Triggers
2. `active_timer_sessions` Tabelle + RLS + Trigger
3. `pg_net` Extension
4. Email Notification Functions (`notify_admin_on_new_user`, `notify_user_on_approval`)
5. User Approval Functions (`handle_new_user`, `is_user_approved`)
6. Unique Index für content_plans (`unique_user_imported_template`)

### Zu löschen (13 Dateien):
- `migration-email-notifications.sql`
- `migration-remove-time-from-blocks.sql`
- `migration-subject-settings.sql`
- `migration-t7-studiengang.sql`
- `migration-user-approval.sql`
- `rollback-user-approval.sql`
- `migrations/001_add_missing_columns.sql`
- `migrations/002_rename_tables.sql`
- `migrations/20260114_t16_active_timer_sessions.sql`
- `migrations/20260114_t18_cleanup_duplicates.sql`
- `migrations/20260114_add_missing_columns.sql`
- `migrations/20260114_rename_slot_date.sql`
- `migrations/add_linked_block_id.sql`

### Zu behalten:
- `schema.sql` (erweitert)
- `functions/` Ordner (Edge Functions)
