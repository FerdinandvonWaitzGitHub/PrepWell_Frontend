# PrepWell API-Dokumentation

**Erstellt:** 21.01.2026
**Ticket:** T26
**Version:** 1.0

---

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Authentifizierung (Auth)](#1-authentifizierung-auth)
3. [Kalender (Calendar)](#2-kalender-calendar)
4. [Sessions](#3-sessions)
5. [Timer](#4-timer)
6. [Content Plans / Themenlisten](#5-content-plans--themenlisten)
7. [Exams / Leistungen](#6-exams--leistungen)
8. [Check-In](#7-check-in)
9. [Logbuch](#8-logbuch)
10. [Settings](#9-settings)
11. [Archiv](#10-archiv)
12. [Row Level Security (RLS)](#11-row-level-security-rls-policies)
13. [Rate Limiting & Quotas](#12-rate-limiting--quotas)

---

## Übersicht

### Backend-Architektur

PrepWell verwendet **Supabase** als Backend mit folgender Strategie:

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
├─────────────────────────────────────────────────────────────┤
│  Authenticated User?                                        │
│  ├── YES → Supabase (Primary) + LocalStorage (Cache)       │
│  └── NO  → LocalStorage only (Offline-First)               │
└─────────────────────────────────────────────────────────────┘
```

### Supabase-Client Konfiguration

**Datei:** `src/services/supabase.ts`

```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeSessionStorage,
    storageKey: 'prepwell-auth',
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

### Sync-Strategie

**Datei:** `src/hooks/use-supabase-sync.js`

| Szenario | Verhalten |
|----------|-----------|
| Nicht eingeloggt | LocalStorage only |
| Eingeloggt, keine Supabase-Daten | LocalStorage → Supabase migrieren |
| Eingeloggt, Supabase-Daten vorhanden | Supabase als SSOT, LocalStorage als Cache |

---

## 1. Authentifizierung (Auth)

**Datei:** `src/contexts/auth-context.jsx`

### 1.1 Session abrufen

| Feld | Wert |
|------|------|
| **Name** | getSession |
| **Zweck** | Aktuelle Auth-Session beim App-Start laden |
| **Trigger** | App-Start, Tab wird sichtbar |

**API-Call:**
```javascript
supabase.auth.getSession()
```

**Response:**
```json
{
  "data": {
    "session": {
      "access_token": "eyJ...",
      "refresh_token": "...",
      "expires_at": 1737500000,
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "user_metadata": {
          "first_name": "Max",
          "last_name": "Mustermann"
        }
      }
    }
  }
}
```

---

### 1.2 Registrierung (Sign Up)

| Feld | Wert |
|------|------|
| **Name** | signUp |
| **Zweck** | Neuen Benutzer registrieren |
| **Trigger** | User-Aktion (Registrierungs-Formular) |

**API-Call:**
```javascript
supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
    },
  },
})
```

**Request Body:**
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| email | string | Ja | E-Mail-Adresse |
| password | string | Ja | Passwort (min. 6 Zeichen) |
| first_name | string | Nein | Vorname |
| last_name | string | Nein | Nachname |

**Erfolgs-Response:**
```json
{
  "data": {
    "user": { "id": "uuid", "email": "..." },
    "session": null
  },
  "error": null
}
```

**Fehlerfälle:**
| Code | Bedeutung |
|------|-----------|
| 400 | Invalid email oder password |
| 422 | User already registered |

---

### 1.3 Login (Sign In)

| Feld | Wert |
|------|------|
| **Name** | signInWithPassword |
| **Zweck** | Benutzer einloggen |
| **Trigger** | User-Aktion (Login-Formular) |

**API-Call:**
```javascript
supabase.auth.signInWithPassword({ email, password })
```

**Erfolgs-Response:**
```json
{
  "data": {
    "user": { "id": "uuid", "email": "...", "user_metadata": {...} },
    "session": { "access_token": "...", "refresh_token": "..." }
  },
  "error": null
}
```

**Fehlerfälle:**
| Code | Bedeutung |
|------|-----------|
| 400 | Invalid login credentials |

---

### 1.4 Logout (Sign Out)

| Feld | Wert |
|------|------|
| **Name** | signOut |
| **Zweck** | Benutzer ausloggen, LocalStorage leeren |
| **Trigger** | User-Aktion (Logout-Button) |

**API-Call:**
```javascript
supabase.auth.signOut()
```

**Datenfluss:**
1. `clearAllUserData()` - Alle PrepWell LocalStorage-Keys löschen
2. `supabase.auth.signOut()` - Session beenden
3. State zurücksetzen: `user = null`, `session = null`

---

### 1.5 Passwort zurücksetzen

| Feld | Wert |
|------|------|
| **Name** | resetPasswordForEmail |
| **Zweck** | Passwort-Reset-E-Mail senden |
| **Trigger** | User-Aktion (Passwort vergessen) |

**API-Call:**
```javascript
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
})
```

---

### 1.6 Benutzer aktualisieren

| Feld | Wert |
|------|------|
| **Name** | updateUser |
| **Zweck** | Passwort oder Profildaten ändern |
| **Trigger** | User-Aktion (Einstellungen) |

**API-Call (Passwort):**
```javascript
supabase.auth.updateUser({ password: newPassword })
```

**API-Call (Profil):**
```javascript
supabase.auth.updateUser({
  data: {
    first_name: "...",
    last_name: "...",
    full_name: "..."
  }
})
```

---

### 1.7 Approval-Status prüfen

| Feld | Wert |
|------|------|
| **Name** | checkApprovalStatus |
| **Zweck** | Prüfen ob Benutzer freigeschaltet ist |
| **Tabelle** | `profiles` |
| **Trigger** | Nach Login |

**API-Call:**
```javascript
supabase
  .from('profiles')
  .select('approved')
  .eq('id', userId)
  .single()
```

**Response:**
```json
{
  "data": { "approved": true },
  "error": null
}
```

---

### 1.8 User Settings initialisieren

| Feld | Wert |
|------|------|
| **Name** | initializeUserSettings |
| **Zweck** | Default-Einstellungen für neue User anlegen |
| **Tabelle** | `user_settings` |
| **Trigger** | Nach Login (wenn keine Settings existieren) |

**Check (SELECT):**
```javascript
supabase
  .from('user_settings')
  .select('id')
  .eq('user_id', userId)
  .single()
```

**Insert (wenn nicht vorhanden):**
```javascript
supabase
  .from('user_settings')
  .insert({
    user_id: userId,
    mentor_activated: false,
    preferred_grade_system: 'punkte',
    timer_settings: {},
    custom_subjects: [],
  })
```

---

## 2. Kalender (Calendar)

**Hook:** `useCalendarBlocksSync()`, `useCalendarTasksSync()`
**Datei:** `src/hooks/use-supabase-sync.js`

### 2.1 Calendar Blocks

| Feld | Wert |
|------|------|
| **Tabelle** | `calendar_blocks` |
| **LocalStorage Key** | `prepwell_calendar_blocks` |
| **Zweck** | Monatsansicht - Kapazitätsplanung (Blöcke pro Tag) |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key → auth.users |
| date | date | Datum (YYYY-MM-DD) |
| position | int | Position 1-4 |
| kind | text | 'thema' \| 'wiederholung' \| 'klausur' \| 'privat' |
| status | text | 'empty' \| 'occupied' |
| title | text | Titel |
| rechtsgebiet | text | Rechtsgebiet-ID |
| content_id | text | Referenz zu Content |
| created_at | timestamp | Erstellungsdatum |

**Operationen:**

**SELECT (Laden):**
```javascript
supabase
  .from('calendar_blocks')
  .select('*')
  .order('created_at', { ascending: false })
```

**UPSERT (Speichern/Aktualisieren):**
```javascript
supabase
  .from('calendar_blocks')
  .upsert(dataToInsert, { onConflict: 'id' })
```

**DELETE (Löschen):**
```javascript
supabase
  .from('calendar_blocks')
  .delete()
  .eq('id', blockId)
```

---

### 2.2 Calendar Tasks

| Feld | Wert |
|------|------|
| **Tabelle** | `calendar_tasks` |
| **LocalStorage Key** | `prepwell_tasks` |
| **Zweck** | Aufgaben für Kalender-Blöcke |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key |
| title | text | Aufgabentitel |
| date | date | Datum |
| completed | boolean | Erledigt? |
| block_id | uuid | Referenz zu calendar_blocks |
| created_at | timestamp | Erstellungsdatum |

**Operationen:**

**SELECT:**
```javascript
supabase
  .from('calendar_tasks')
  .select('*')
  .order('created_at', { ascending: false })
```

**INSERT:**
```javascript
supabase
  .from('calendar_tasks')
  .insert(dataToInsert)
```

**DELETE:**
```javascript
supabase
  .from('calendar_tasks')
  .delete()
  .eq('id', taskId)
```

---

## 3. Sessions

### 3.1 Private Sessions

**Hook:** `usePrivateSessionsSync()`

| Feld | Wert |
|------|------|
| **Tabelle** | `private_sessions` |
| **LocalStorage Key** | `prepwell_private_sessions` |
| **Zweck** | Wochenansicht - Private Zeitblöcke (Freizeit, Termine) |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key |
| title | text | Titel |
| start_at | timestamp | Startzeit |
| end_at | timestamp | Endzeit |
| kind | text | 'privat' |
| is_recurring | boolean | Wiederkehrend? |
| recurrence_rule | jsonb | Wiederholungsregel |
| created_at | timestamp | Erstellungsdatum |

**Operationen:**

**SELECT:**
```javascript
supabase
  .from('private_sessions')
  .select('*')
  .order('created_at', { ascending: false })
```

**INSERT:**
```javascript
supabase
  .from('private_sessions')
  .insert(dataToInsert)
```

**DELETE:**
```javascript
supabase
  .from('private_sessions')
  .delete()
  .eq('id', sessionId)
```

---

### 3.2 Time Sessions (Theme, Exam, Repetition)

**Hook:** `useTimeSessionsSync()`

| Feld | Wert |
|------|------|
| **Tabelle** | `time_sessions` |
| **LocalStorage Key** | `prepwell_time_sessions` |
| **Zweck** | Wochenansicht - Lernsessions mit Uhrzeiten |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key |
| title | text | Titel |
| start_at | timestamp | Startzeit |
| end_at | timestamp | Endzeit |
| kind | text | 'thema' \| 'wiederholung' \| 'klausur' |
| rechtsgebiet | text | Rechtsgebiet-ID |
| content_id | text | Referenz zu Content |
| created_at | timestamp | Erstellungsdatum |

**Operationen:** Analog zu Private Sessions (SELECT, INSERT, DELETE)

---

## 4. Timer

**Datei:** `src/contexts/timer-context.jsx`

### 4.1 Active Timer Sessions (Live-Sync)

| Feld | Wert |
|------|------|
| **Tabelle** | `active_timer_sessions` |
| **Zweck** | Aktiven Timer über Tabs/Geräte synchronisieren |
| **Trigger** | Timer läuft, Zustand ändert sich |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| user_id | uuid | Primary Key (1 pro User) |
| timer_type | text | 'pomodoro' \| 'countdown' \| 'countup' |
| timer_state | text | 'idle' \| 'running' \| 'paused' |
| started_at | timestamp | Startzeit |
| paused_at | timestamp | Pausiert seit |
| accumulated_pause_ms | int | Gesamte Pausenzeit |
| pomodoro_settings | jsonb | Pomodoro-Einstellungen |
| countdown_settings | jsonb | Countdown-Einstellungen |
| current_session | int | Aktuelle Session-Nr. |
| total_sessions | int | Gesamtzahl Sessions |
| is_break | boolean | In Pause? |
| updated_at | timestamp | Letzte Aktualisierung |

**UPSERT (Speichern):**
```javascript
supabase
  .from('active_timer_sessions')
  .upsert(activeTimer, { onConflict: 'user_id' })
```

**SELECT (Laden bei App-Start):**
```javascript
supabase
  .from('active_timer_sessions')
  .select('*')
  .eq('user_id', userId)
  .single()
```

**DELETE (Timer gestoppt):**
```javascript
supabase
  .from('active_timer_sessions')
  .delete()
  .eq('user_id', userId)
```

---

### 4.2 Timer Sessions (History)

**Hook:** `useTimerHistorySync()`

| Feld | Wert |
|------|------|
| **Tabelle** | `timer_sessions` |
| **LocalStorage Key** | `prepwell_timer_history` |
| **Zweck** | Abgeschlossene Timer-Sessions speichern |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key |
| session_type | text | 'pomodoro' \| 'countdown' \| 'countup' |
| duration_seconds | int | Dauer in Sekunden |
| completed | boolean | Vollständig abgeschlossen? |
| session_date | date | Datum |
| session_time | time | Uhrzeit |
| created_at | timestamp | Erstellungsdatum |

---

## 5. Content Plans / Themenlisten

### 5.1 Content Plans

**Hook:** `useContentPlansSync()`

| Feld | Wert |
|------|------|
| **Tabelle** | `content_plans` |
| **LocalStorage Key** | `prepwell_content_plans` |
| **Zweck** | Lernpläne und Themenlisten |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key |
| name | text | Name des Plans |
| type | text | 'lernplan' \| 'themenliste' |
| description | text | Beschreibung |
| mode | text | 'standard' \| 'exam' |
| exam_date | date | Examendatum (wenn mode='exam') |
| archived | boolean | Archiviert? |
| is_published | boolean | Veröffentlicht? |
| rechtsgebiete | jsonb | Array von Rechtsgebieten |
| imported_from | uuid | Importiert von (Plan-ID) |
| created_at | timestamp | Erstellungsdatum |
| updated_at | timestamp | Letzte Änderung |

**Transform App → DB:**
```javascript
{
  name: plan.name,
  type: plan.type || 'themenliste',
  mode: plan.mode === 'examen' ? 'exam' : (plan.mode || 'standard'),
  // ... weitere Felder
}
```

**Transform DB → App:**
```javascript
{
  // mode: 'exam' → 'examen' (German UI)
  mode: row.mode === 'exam' ? 'examen' : row.mode,
  examDate: row.exam_date,
  // ... weitere Felder
}
```

---

### 5.2 Published Themenlisten

**Hook:** `usePublishedThemenlistenSync()`

| Feld | Wert |
|------|------|
| **Tabelle** | `published_themenlisten` |
| **LocalStorage Key** | `prepwell_published_themenlisten` |
| **Zweck** | Community-Themenlisten |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| source_plan_id | uuid | Original-Plan |
| name | text | Name |
| description | text | Beschreibung |
| mode | text | Modus |
| stats | jsonb | Statistiken |
| gewichtung | jsonb | Gewichtung |
| rechtsgebiete | jsonb | Rechtsgebiete |
| tags | text[] | Tags |
| published_at | timestamp | Veröffentlichungsdatum |

---

## 6. Exams / Leistungen

### 6.1 Leistungen (Exams)

**Hook:** `useExamsSync()`

| Feld | Wert |
|------|------|
| **Tabelle** | `leistungen` |
| **LocalStorage Key** | `prepwell_exams` |
| **Zweck** | Universitäre Prüfungen/Leistungen |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key |
| subject | text | Fach |
| title | text | Titel |
| description | text | Beschreibung |
| exam_date | date | Prüfungsdatum |
| exam_time | time | Prüfungszeit |
| grade | numeric | Note |
| grade_system | text | 'punkte' \| 'noten' |
| ects | int | ECTS-Punkte |
| semester | text | Semester |
| status | text | 'ausstehend' \| 'bestanden' \| 'nicht_bestanden' |

---

### 6.2 Übungsklausuren

**Hook:** `useUebungsklausurenSync()`

| Feld | Wert |
|------|------|
| **Tabelle** | `uebungsklausuren` |
| **LocalStorage Key** | `prepwell_uebungsklausuren` |
| **Zweck** | Übungsklausuren zur Prüfungsvorbereitung |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key |
| title | text | Titel |
| rechtsgebiet | text | Rechtsgebiet |
| description | text | Beschreibung |
| exam_date | date | Datum |
| punkte | int | Punktzahl |

---

## 7. Check-In

**Hook:** `useCheckInSync()` + `CheckInProvider`
**Datei:** `src/contexts/checkin-context.jsx`

| Feld | Wert |
|------|------|
| **Tabelle** | `checkin_responses` |
| **LocalStorage Key** | `prepwell_checkin_responses` |
| **Zweck** | Tägliche Stimmungs-/Energie-Abfrage |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key |
| response_date | date | Datum |
| period | text | 'morning' \| 'evening' |
| mood | int | Stimmung (1-5) |
| energy | int | Energie (1-5) |
| focus | int | Fokus/Motivation (1-5) |
| stress | int | Stress (1-5) |
| notes | text | Notizen |
| created_at | timestamp | Erstellungsdatum |

**Unique Constraint:** `(user_id, response_date, period)`

**UPSERT:**
```javascript
supabase
  .from('checkin_responses')
  .upsert({
    user_id: user.id,
    response_date: date,
    period,
    mood: data.answers?.positivity,
    energy: data.answers?.energy,
    focus: data.answers?.motivation,
    stress: data.answers?.stress,
    notes: data.notes || null,
  }, { onConflict: 'user_id,response_date,period' })
```

---

## 8. Logbuch

**Hook:** `useLogbuchSync()`
**Datei:** `src/hooks/use-supabase-sync.js` (Zeile 798-822)
**UI:** `src/components/dashboard/timer/timer-logbuch-dialog.jsx`

| Feld | Wert |
|------|------|
| **Tabelle** | `logbuch_entries` |
| **LocalStorage Key** | `prepwell_logbuch_entries` |
| **Zweck** | Manuelle Zeiterfassung (Lernzeit nachtragen) |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key |
| entry_date | date | Datum des Eintrags |
| start_time | text | Startzeit (HH:MM Format) |
| end_time | text | Endzeit (HH:MM Format) |
| rechtsgebiet | text | Rechtsgebiet-ID |
| duration_minutes | int | Berechnete Dauer in Minuten |
| notes | text | Optionale Notizen |
| created_at | timestamp | Erstellungsdatum |
| updated_at | timestamp | Letzte Änderung |

**Trigger:** User öffnet Logbuch-Dialog über Timer-Bereich

**Transform App → Supabase:**
```javascript
transformToSupabase: (entry) => ({
  id: entry.id?.startsWith('logbuch-') ? undefined : entry.id,
  entry_date: entry.date,
  start_time: entry.startTime,
  end_time: entry.endTime,
  rechtsgebiet: entry.rechtsgebiet,
  duration_minutes: entry.durationMinutes,
  notes: entry.notes,
})
```

**Transform Supabase → App:**
```javascript
transformFromSupabase: (row) => ({
  id: row.id,
  date: row.entry_date,
  startTime: row.start_time,
  endTime: row.end_time,
  rechtsgebiet: row.rechtsgebiet,
  durationMinutes: row.duration_minutes,
  notes: row.notes,
  createdAt: row.created_at,
})
```

**Operationen:**

**SELECT (Laden):**
```javascript
supabase
  .from('logbuch_entries')
  .select('*')
  .order('entry_date', { ascending: false })
```

**INSERT/UPSERT (Speichern):**
```javascript
// Über generischen useSupabaseSync Hook
// Ersetzt alle Einträge für den aktuellen Tag
const todayEntries = entries
  .filter(e => e.startTime && e.endTime && e.rechtsgebiet)
  .map(entry => ({
    ...entry,
    date: today,
    id: entry.id || `logbuch-${Date.now()}-${randomId}`
  }));
```

**Datenfluss:**
1. User öffnet Logbuch-Dialog
2. `useLogbuchSync()` lädt alle Einträge
3. Einträge für heute werden gefiltert und angezeigt
4. User kann Zeiten eintragen (Von/Bis/Rechtsgebiet)
5. Beim Speichern: Heute-Einträge werden ersetzt
6. Sync zu Supabase + LocalStorage Fallback

**Verwendung im UI:**
```jsx
const { data: allEntries, save: saveAllEntries } = useLogbuchSync();

// Einträge für heute filtern
const todayEntries = allEntries.filter(entry => entry.date === today);
```

---

## 9. Settings

### 9.1 User Settings

**Hook:** `useUserSettingsSync()`

| Feld | Wert |
|------|------|
| **Tabelle** | `user_settings` |
| **LocalStorage Key** | `prepwell_settings` |
| **Zweck** | Benutzereinstellungen |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key (Unique) |
| mentor_activated | boolean | Mentor aktiv? |
| preferred_grade_system | text | 'punkte' \| 'noten' |
| timer_settings | jsonb | Timer-Konfiguration |
| custom_subjects | jsonb | Benutzerdefinierte Fächer |
| onboarding_complete | boolean | Onboarding abgeschlossen? |
| app_mode | text | 'standard' \| 'exam' |
| created_at | timestamp | Erstellungsdatum |
| updated_at | timestamp | Letzte Änderung |

**SELECT (mit spezifischem Feld):**
```javascript
supabase
  .from('user_settings')
  .select('timer_settings')
  .eq('user_id', userId)
  .single()
```

**UPSERT:**
```javascript
supabase
  .from('user_settings')
  .upsert({
    user_id: userId,
    timer_settings: { ... },
    updated_at: new Date().toISOString()
  })
  .select()
```

---

### 9.2 Wizard Drafts

**Hook:** `useWizardDraftSync()`

| Feld | Wert |
|------|------|
| **Tabelle** | `wizard_drafts` |
| **LocalStorage Key** | `prepwell_lernplan_wizard_draft` |
| **Zweck** | Unfertige Lernplan-Wizard-Entwürfe speichern |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key |
| draft_data | jsonb | Wizard-Zustand |
| created_at | timestamp | Erstellungsdatum |
| updated_at | timestamp | Letzte Änderung |

---

## 10. Archiv

### 10.1 Archived Lernpläne

**Hook:** `useArchivedLernplaeneSync()`

| Feld | Wert |
|------|------|
| **Tabelle** | `archived_lernplaene` |
| **LocalStorage Key** | `prepwell_archived_lernplaene` |
| **Zweck** | Archivierte/abgeschlossene Lernpläne |

**Schema:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Foreign Key |
| name | text | Name |
| data | jsonb | Vollständige Plan-Daten |
| archived_at | timestamp | Archivierungsdatum |
| created_at | timestamp | Erstellungsdatum |

---

## Fehlercodes

### Supabase Auth Errors

| Code | Bedeutung | Handling |
|------|-----------|----------|
| 400 | Invalid request | Validierung prüfen |
| 401 | Unauthorized | Session abgelaufen, neu einloggen |
| 403 | Forbidden | Keine Berechtigung |
| 422 | Unprocessable | z.B. User existiert bereits |

### Supabase Database Errors

| Code | Bedeutung | Handling |
|------|-----------|----------|
| PGRST116 | No rows returned | Erwartbar für neue User |
| 23505 | Unique violation | Duplikat, ggf. UPSERT verwenden |
| 42P01 | Relation does not exist | Migration fehlt |

---

## Datenfluss-Diagramm

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   UI/Page   │ ──► │   Context    │ ──► │    Hook     │
└─────────────┘     └──────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
            ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
            │ LocalStorage │◄────────►│   Supabase   │◄────────►│   Supabase   │
            │   (Cache)    │  Sync    │   (Tables)   │  Auth    │    (Auth)    │
            └──────────────┘          └──────────────┘          └──────────────┘
```

---

## LocalStorage Keys

| Key | Beschreibung |
|-----|--------------|
| `prepwell_calendar_blocks` | Kalender-Blöcke |
| `prepwell_tasks` | Kalender-Aufgaben |
| `prepwell_private_sessions` | Private Sessions |
| `prepwell_time_sessions` | Zeit-Sessions |
| `prepwell_content_plans` | Content Plans |
| `prepwell_published_themenlisten` | Published Themenlisten |
| `prepwell_exams` | Leistungen |
| `prepwell_uebungsklausuren` | Übungsklausuren |
| `prepwell_checkin_responses` | Check-In Responses |
| `prepwell_timer_history` | Timer History |
| `prepwell_timer_config` | Timer Config |
| `prepwell_settings` | User Settings |
| `prepwell_lernplan_wizard_draft` | Wizard Draft |
| `prepwell_archived_lernplaene` | Archived Lernpläne |
| `prepwell_lernplan_metadata` | Lernplan Metadata |
| `prepwell_custom_unterrechtsgebiete` | Custom Unterrechtsgebiete |
| `prepwell-auth` | Auth Session (sessionStorage) |

---

## 11. Row Level Security (RLS) Policies

### Übersicht

Alle Tabellen haben RLS aktiviert. Jeder User kann nur seine eigenen Daten sehen und bearbeiten.

**Grundprinzip:**
```sql
-- Für SELECT/UPDATE/DELETE
USING (auth.uid() = user_id)

-- Für INSERT
WITH CHECK (auth.uid() = user_id)
```

### Policies nach Tabelle

| Tabelle | SELECT | INSERT | UPDATE | DELETE | Besonderheit |
|---------|--------|--------|--------|--------|--------------|
| `active_timer_sessions` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | FOR ALL Policy |
| `archived_lernplaene` | ✅ Own | ✅ Own | ❌ | ✅ Own | Kein Update erlaubt |
| `aufgaben` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | |
| `calendar_blocks` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | |
| `calendar_tasks` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | |
| `checkin_responses` | ✅ Own | ✅ Own | ✅ Own | ❌ | Kein Delete erlaubt |
| `content_plans` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | |
| `contents` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | |
| `custom_unterrechtsgebiete` | ✅ Own | ✅ Own | ❌ | ✅ Own | Kein Update erlaubt |
| `leistungen` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | |
| `lernplaene` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | |
| `logbuch_entries` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | |
| `private_sessions` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | |
| `profiles` | ✅ Own | ❌ | ✅ Own | ❌ | Nur lesen/updaten, PK = auth.uid |
| `published_themenlisten` | ✅ **All** | ✅ Own | ❌ | ✅ Own | **Öffentlich lesbar!** |
| `time_sessions` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | |
| `timer_sessions` | ✅ Own | ✅ Own | ❌ | ❌ | Nur lesen/erstellen |
| `uebungsklausuren` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | |
| `user_settings` | ✅ Own | ✅ Own | ✅ Own | ❌ | Kein Delete erlaubt |
| `wizard_drafts` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | |

### Besondere Policies

**1. profiles (User Approval)**
```sql
-- User kann nur eigenes Profil lesen (id = auth.uid)
CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- User kann eigenes Profil updaten (aber nicht approved-Feld!)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

**2. published_themenlisten (Community-Feature)**
```sql
-- Jeder kann alle veröffentlichten Themenlisten sehen
CREATE POLICY "Anyone can view published_themenlisten" ON published_themenlisten
  FOR SELECT USING (TRUE);

-- Nur eigene erstellen/löschen
CREATE POLICY "Users can create own published_themenlisten" ON published_themenlisten
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### RLS-bedingte Fehlermeldungen

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| `new row violates row-level security policy` | INSERT ohne user_id oder mit falscher user_id | `user_id: user.id` im Request mitgeben |
| `0 rows affected` bei UPDATE/DELETE | RLS blockiert Zugriff auf fremde Daten | Ist korrekt, keine Aktion nötig |
| `permission denied for table X` | RLS nicht korrekt konfiguriert | Schema prüfen |

---

## 12. Rate Limiting & Quotas

### Supabase Free Tier Limits

| Resource | Limit | Beschreibung |
|----------|-------|--------------|
| **API Requests** | 500 req/sec | Pro Projekt |
| **Database Size** | 500 MB | PostgreSQL Storage |
| **Storage** | 1 GB | File Storage |
| **Bandwidth** | 2 GB/Monat | Egress Traffic |
| **Edge Functions** | 500K Invocations/Monat | Serverless Functions |
| **Realtime** | 200 concurrent connections | WebSocket Verbindungen |
| **Auth Users** | Unlimited | Keine Beschränkung |

### Pro Tier Limits (falls Upgrade)

| Resource | Limit |
|----------|-------|
| API Requests | 1000 req/sec |
| Database Size | 8 GB |
| Storage | 100 GB |
| Bandwidth | 50 GB/Monat |

### PrepWell-spezifische Limits

**1. LocalStorage Fallback**
- Max. ~5-10 MB pro Origin (Browser-abhängig)
- Bei Quota-Exceeded: Alte Daten werden nicht automatisch gelöscht

**2. Timer History**
```javascript
// Begrenzt auf 1000 Einträge
const trimmedHistory = history.slice(-1000);
```

**3. Sync Debouncing**
```javascript
// Active Timer speichert max alle 1 Sekunde
const timeoutId = setTimeout(() => {
  saveActiveTimerToSupabase();
}, 1000);
```

### Best Practices

1. **Batch Operations vermeiden**: Einzelne UPSERTs statt bulk INSERT bei Sync
2. **Debouncing nutzen**: Timer-State wird debounced gespeichert
3. **Selective Sync**: Nur geänderte Daten synchronisieren
4. **LocalStorage als Cache**: Reduziert API-Calls

### Monitoring

Supabase Dashboard zeigt:
- API Request Count
- Database Size
- Active Connections
- Error Rates

**URL:** `https://supabase.com/dashboard/project/[PROJECT_ID]/reports`

---

## Offene Punkte / TODOs

- [x] ~~Logbuch-Tabelle dokumentieren~~ ✅ Erledigt (Abschnitt 8)
- [ ] Realtime Subscriptions (falls zukünftig verwendet)
