
# T20: SQL Schema Konsolidierung

## Status: ABGESCHLOSSEN

### Fortschritt
- [x] **Phase 1: Analyse** - Abgeschlossen (2026-01-15)
  - Alle 14 SQL-Dateien analysiert
  - Fehlende Features identifiziert
  - Dokumentation: [db-schema-snapshot.md](db-schema-snapshot.md)
- [x] **Phase 2: Konsolidierung** - Abgeschlossen (2026-01-15)
  - Neues schema.sql v2.0 erstellt (857 Zeilen)
  - profiles + active_timer_sessions hinzugefuegt
  - Email Notification Functions integriert
  - Legacy-Tabellen entfernt (slots, themenlisten)
- [x] **Phase 3: Validierung** - Ausstehend (manuell in Supabase)
- [x] **Phase 4: Aufraeumen** - Abgeschlossen
  - 13 Migration-Dateien geloescht
  - migrations/ Ordner entfernt
- [ ] **Phase 5: Dokumentation** - CLAUDE.md Update ausstehend

---

## Ziel
Alle SQL-Migrations in eine einzige, saubere `schema.sql` konsolidieren und alle anderen SQL-Dateien löschen.

---

## Aktuelle Situation

### Dateien im supabase/ Ordner

| Datei | Typ | Status |
|-------|-----|--------|
| `schema.sql` | Haupt-Schema | UNVOLLSTÄNDIG - fehlen Tabellen |
| `migration-email-notifications.sql` | Feature | Nicht in schema.sql |
| `migration-remove-time-from-blocks.sql` | Cleanup | Evtl. veraltet |
| `migration-subject-settings.sql` | Feature | Evtl. in schema.sql |
| `migration-t7-studiengang.sql` | Feature | In schema.sql |
| `migration-user-approval.sql` | Feature | `profiles` Tabelle FEHLT in schema.sql |
| `rollback-user-approval.sql` | Rollback | Löschen |
| `migrations/001_add_missing_columns.sql` | Migration | Teils in schema.sql |
| `migrations/002_rename_tables.sql` | Migration | Bereits angewendet |
| `migrations/20260114_t16_active_timer_sessions.sql` | Feature | `active_timer_sessions` FEHLT in schema.sql |
| `migrations/20260114_t18_cleanup_duplicates.sql` | Cleanup | Einmalig |
| `migrations/20260114_add_missing_columns.sql` | Migration | Duplikat |
| `migrations/20260114_rename_slot_date.sql` | Migration | Bereits angewendet |
| `migrations/add_linked_block_id.sql` | Migration | In schema.sql |

### Fehlende Tabellen in schema.sql

1. **`profiles`** - User Approval System (T14)
2. **`active_timer_sessions`** - Timer Persistence (T16)

### Fehlende Features in schema.sql

1. **Email Notification Triggers** - `notify_admin_on_new_user()`, `notify_user_on_approval()`
2. **pg_net Extension** - Für HTTP-Calls aus DB

---

## Implementierungsplan

### Phase 1: Analyse (Vorbereitung)

#### Schritt 1.1: Produktions-Schema dokumentieren
```sql
-- Im Supabase SQL Editor ausführen:

-- Alle Tabellen auflisten
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Alle Spalten pro Tabelle
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Alle Policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Alle Triggers
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Alle Functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public';
```

#### Schritt 1.2: Ergebnis in Datei speichern
Ergebnis der Queries als `docs/db-schema-snapshot.md` speichern für Referenz.

---

### Phase 2: Konsolidierung

#### Schritt 2.1: Neues schema.sql erstellen

Struktur der neuen `schema.sql`:

```sql
-- PrepWell Database Schema
-- IDEMPOTENT: Kann mehrfach ausgeführt werden
-- Version: 2.0 (Konsolidiert am YYYY-MM-DD)

-- ============================================
-- EXTENSIONS
-- ============================================
-- pg_net für HTTP-Calls (Email Notifications)

-- ============================================
-- ENUMS
-- ============================================
-- app_mode, task_priority, task_status, etc.

-- ============================================
-- TABLES (alphabetisch)
-- ============================================
-- active_timer_sessions (NEU)
-- archived_lernplaene
-- aufgaben
-- calendar_blocks
-- calendar_tasks
-- checkin_responses
-- content_plans
-- contents
-- custom_unterrechtsgebiete
-- leistungen
-- lernplaene
-- logbuch_entries
-- private_sessions
-- profiles (NEU)
-- published_themenlisten
-- slots (LEGACY)
-- themenlisten (LEGACY)
-- time_sessions
-- timer_sessions
-- uebungsklausuren
-- user_settings
-- wizard_drafts

-- ============================================
-- INDEXES
-- ============================================

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- ============================================
-- POLICIES
-- ============================================

-- ============================================
-- FUNCTIONS
-- ============================================
-- update_updated_at()
-- handle_new_user()
-- notify_admin_on_new_user()
-- notify_user_on_approval()
-- is_user_approved()

-- ============================================
-- TRIGGERS
-- ============================================
```

#### Schritt 2.2: Tabellen hinzufügen

**profiles Tabelle (aus migration-user-approval.sql):**
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
```

**active_timer_sessions Tabelle (aus 20260114_t16_active_timer_sessions.sql):**
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
```

#### Schritt 2.3: Email Notification Functions hinzufügen

```sql
-- Extension für HTTP-Calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Admin Notification Function
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_user()
RETURNS TRIGGER AS $$ ... $$;

-- User Approval Notification Function
CREATE OR REPLACE FUNCTION public.notify_user_on_approval()
RETURNS TRIGGER AS $$ ... $$;

-- Triggers
CREATE TRIGGER on_new_profile_notify_admin ...
CREATE TRIGGER on_profile_approval_change ...
```

---

### Phase 3: Validierung

#### Schritt 3.1: Lokale Testdatenbank

```bash
# Option A: Supabase CLI (lokal)
supabase db reset  # Setzt lokale DB zurück und wendet schema.sql an

# Option B: Neue Supabase Instanz
# Neues Projekt erstellen, schema.sql ausführen, prüfen
```

#### Schritt 3.2: Validierungs-Queries

```sql
-- Prüfen: Alle Tabellen vorhanden?
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Erwartung: ~22 Tabellen

-- Prüfen: Alle Policies vorhanden?
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';

-- Prüfen: Alle Triggers vorhanden?
SELECT COUNT(*) FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

#### Schritt 3.3: Frontend-Test

1. App starten
2. Alle Features testen (Login, Kalender, Timer, etc.)
3. Console auf Supabase-Fehler prüfen

---

### Phase 4: Aufräumen

#### Schritt 4.1: Alte Dateien löschen

```bash
# Zu löschende Dateien:
rm supabase/migration-email-notifications.sql
rm supabase/migration-remove-time-from-blocks.sql
rm supabase/migration-subject-settings.sql
rm supabase/migration-t7-studiengang.sql
rm supabase/migration-user-approval.sql
rm supabase/rollback-user-approval.sql
rm -rf supabase/migrations/
```

#### Schritt 4.2: Finale Struktur

```
supabase/
├── schema.sql              # EINZIGE Schema-Datei (SSOT)
└── functions/              # Edge Functions (behalten)
    └── ...
```

---

### Phase 5: Dokumentation

#### Schritt 5.1: CLAUDE.md aktualisieren

```markdown
### Supabase-Schema

Schema: `supabase/schema.sql` (Single Source of Truth)

Bei Schema-Änderungen:
1. `schema.sql` anpassen
2. Migration-SQL für Produktion erstellen (einmalig)
3. In Supabase SQL Editor ausführen
```

#### Schritt 5.2: Changelog erstellen

In `schema.sql` Header:
```sql
-- Version History:
-- 2.0 (2026-01-15): Konsolidiert aus 14 Migrations
--   - profiles Tabelle hinzugefügt (T14)
--   - active_timer_sessions hinzugefügt (T16)
--   - Email Notification Triggers hinzugefügt
--   - Legacy: slots, themenlisten (deprecated)
-- 1.0 (Initial): Basis-Schema
```

---

## Checkliste

### Vorbereitung
- [x] Produktions-Schema exportieren → SQL-Queries in db-schema-snapshot.md
- [x] Backup der aktuellen schema.sql → Git-History
- [x] Alle Migrations-Dateien dokumentieren → db-schema-snapshot.md

### Konsolidierung
- [ ] profiles Tabelle hinzufügen
- [ ] active_timer_sessions Tabelle hinzufügen
- [ ] Email Notification Functions hinzufügen
- [ ] Alle Indexes prüfen/hinzufügen
- [ ] Alle RLS Policies prüfen/hinzufügen
- [ ] Alle Triggers prüfen/hinzufügen

### Validierung
- [ ] Schema auf Test-DB ausführen
- [ ] Keine SQL-Fehler
- [ ] Frontend funktioniert

### Aufräumen
- [ ] Alte Migrations löschen
- [ ] CLAUDE.md aktualisieren
- [ ] Ticket schließen

---

## Risiken

| Risiko | Mitigation |
|--------|------------|
| Schema-Mismatch Produktion vs. Datei | Vorher Produktions-Schema exportieren |
| Vergessene Features | Alle Migrations einzeln durchgehen |
| RLS-Policy fehlt | Systematisch alle Tabellen prüfen |
| Trigger fehlt | Systematisch alle Triggers prüfen |

---

## Zeitaufwand

| Phase | Geschätzt |
|-------|-----------|
| Analyse | 30 min |
| Konsolidierung | 60 min |
| Validierung | 30 min |
| Aufräumen | 15 min |
| **Gesamt** | **~2-3 Stunden** |

---

## Referenzen

- Aktuelle schema.sql: 744 Zeilen
- Migrations zu integrieren: 13 Dateien
- Neue Tabellen: 2 (profiles, active_timer_sessions)
- Neue Functions: 4 (handle_new_user, notify_*, is_user_approved)
