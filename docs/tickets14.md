# T14: User Approval System

## Status: ABGESCHLOSSEN ✓

---

## Ueberblick

Neuen Usern soll nach der Registrierung ein "Pending Approval" Screen angezeigt werden, bis ein Admin sie manuell freischaltet.

---

## IST-Analyse: Warum es beim letzten Mal nicht funktioniert hat

### Problem 1: `profiles` Tabelle existiert nicht

**In `supabase/schema.sql` fehlt:**
- Die `profiles` Tabelle komplett
- Der `handle_new_user()` Trigger
- Die `is_user_approved()` Funktion
- Die RLS Policy `profiles_read_own`

**Konsequenz:** `checkApprovalStatus()` in auth-context.jsx schlaegt fehl oder gibt `true` zurueck (Fallback).

### Problem 2: Router prueft Approval-Status nicht

**In `router.jsx` Zeile 60-78:**
```javascript
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  // FEHLT: isApproved, approvalLoading werden nicht geprueft!
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return children;  // User kommt durch, egal ob approved oder nicht
}
```

**Konsequenz:** Selbst wenn `isApproved = false`, sieht der User die App.

### Problem 3: Approval-Check ist deaktiviert

**In `auth-context.jsx` Zeile 71-74:**
```javascript
// User Approval System (Option 3) - TEMPORARILY DISABLED
// Set to true by default to bypass approval check while debugging
const [isApproved, setIsApproved] = useState(true);  // <-- IMMER TRUE
const [approvalLoading, setApprovalLoading] = useState(false);
```

**Zeile 188-189 und 208-209:** Der Check ist auskommentiert:
```javascript
// TEMPORARILY DISABLED: Check approval status
// await checkApprovalStatus(session.user.id);
```

### Problem 4: Race Condition

**Ablauf bisher:**
1. Auth laed → `loading = false`
2. Router rendert App (weil `isAuthenticated = true`)
3. Approval-Check startet (falls aktiviert)
4. Approval-Check fertig → `isApproved` wird gesetzt
5. **Zu spaet!** User hat App bereits gesehen

---

## SOLL-Zustand

### Ablauf nach Implementierung

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER REGISTRIERT                         │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  TRIGGER: handle_new_user()                                     │
│  → Erstellt Zeile in profiles mit approved = false              │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  AUTH-CONTEXT: checkApprovalStatus()                            │
│  → Liest profiles.approved                                      │
│  → Setzt isApproved = false                                     │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  ROUTER: ProtectedRoute                                         │
│  → Prueft: loading? → Spinner                                   │
│  → Prueft: approvalLoading? → Spinner                           │
│  → Prueft: !isAuthenticated? → /auth                            │
│  → Prueft: !isApproved? → /pending-approval                     │
│  → Sonst: children                                              │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  PENDING-APPROVAL SCREEN                                        │
│  → "Dein Account wartet auf Freischaltung"                      │
│  → Retry-Button zum erneuten Pruefen                            │
│  → Logout-Button                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementierungsplan

### Phase 1: SQL-Schema (Supabase Dashboard)

**Neue Datei:** `supabase/migration-user-approval.sql`

**WICHTIG:** Diese Migration muss in der richtigen Reihenfolge ausgefuehrt werden!

```sql
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
-- ============================================
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
on public.profiles
for select
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
-- SCHRITT 7: Helper-Funktion fuer RLS
-- ============================================
create or replace function public.is_user_approved(user_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select approved from public.profiles where id = user_uuid), false);
$$;
```

**Verifizierung nach Migration:**
```sql
-- Pruefe: Alle bestehenden User haben approved = true
select id, email, approved, approved_at, created_at
from public.profiles
order by created_at desc;

-- Erwartetes Ergebnis: Alle Zeilen haben approved = true
```

### Phase 2: Frontend - Auth Context

**Datei:** `src/contexts/auth-context.jsx`

**Aenderungen:**
1. `isApproved` default auf `null` setzen (nicht `true`)
2. `approvalLoading` default auf `true` setzen
3. Approval-Check aktivieren (auskommentierte Zeilen)
4. Retry-Funktion hinzufuegen

```javascript
// VORHER:
const [isApproved, setIsApproved] = useState(true);
const [approvalLoading, setApprovalLoading] = useState(false);

// NACHHER:
const [isApproved, setIsApproved] = useState(null);
const [approvalLoading, setApprovalLoading] = useState(true);
```

### Phase 3: Frontend - Router

**Datei:** `src/router.jsx`

**Aenderungen:**
1. `ProtectedRoute` prueft `isApproved` und `approvalLoading`
2. Neue Route `/pending-approval`
3. Neuer Screen `PendingApprovalPage`

```javascript
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, isApproved, approvalLoading } = useAuth();

  // Auth loading
  if (loading) return <LoadingSpinner />;

  // Not logged in
  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  // Approval check loading
  if (approvalLoading) return <LoadingSpinner />;

  // Not approved
  if (!isApproved) return <Navigate to="/pending-approval" replace />;

  return children;
}
```

### Phase 4: Pending Approval Screen

**Neue Datei:** `src/pages/pending-approval.jsx`

Features:
- Nachricht: "Dein Account wartet auf Freischaltung"
- Retry-Button: Prueft erneut den Status
- Logout-Button: Zurueck zur Login-Seite
- Email-Hinweis: "Du wirst per Email benachrichtigt"

---

## Rollback-Plan

Falls etwas schiefgeht, kann jeder Schritt einzeln rueckgaengig gemacht werden:

### SQL Rollback:
```sql
-- Trigger entfernen
drop trigger if exists on_auth_user_created on auth.users;

-- Funktion entfernen
drop function if exists public.handle_new_user();
drop function if exists public.is_user_approved(uuid);

-- Policy entfernen
drop policy if exists "profiles_read_own" on public.profiles;

-- Tabelle entfernen (VORSICHT: Loescht alle Profile-Daten!)
drop table if exists public.profiles;
```

### Frontend Rollback:
```javascript
// auth-context.jsx: Zurueck auf bypass
const [isApproved, setIsApproved] = useState(true);
const [approvalLoading, setApprovalLoading] = useState(false);
```

---

## Testplan

### Test 1: Trigger funktioniert
1. Neuen User registrieren
2. SQL: `select * from profiles order by created_at desc limit 1;`
3. **Erwartet:** Neue Zeile mit `approved = false`

### Test 2: RLS erlaubt Lesen
1. Als neuer User einloggen
2. Browser DevTools → Network → Supabase Request an profiles
3. **Erwartet:** 200 OK mit eigener Zeile

### Test 3: Pending Screen erscheint
1. Als nicht-freigeschalteter User einloggen
2. **Erwartet:** Redirect zu `/pending-approval`

### Test 4: Freischaltung funktioniert
1. SQL: `update profiles set approved = true where email = 'test@example.com';`
2. Retry-Button klicken
3. **Erwartet:** Redirect zum Dashboard

### Test 5: Bestehende User
1. Existierenden User ohne profiles-Eintrag testen
2. **Erwartet:** Pending Screen ODER automatisch Profile erstellen

---

## Risiken und Mitigationen

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|--------|-------------------|------------|------------|
| Trigger wird nicht erstellt | Mittel | Kritisch | Migration in Supabase Dashboard manuell ausfuehren, nicht nur ueber schema.sql |
| RLS blockiert Lesen | Hoch | Kritisch | `profiles_read_own` Policy MUSS existieren |
| Race Condition im Frontend | Mittel | Mittel | `approvalLoading` blockiert Rendering bis Check fertig |
| Bestehende User ausgesperrt | Niedrig | Kritisch | Schritt 4 der Migration setzt alle bestehenden User auf `approved = true` |
| Supabase nicht konfiguriert | Niedrig | Niedrig | Offline-Modus: `isApproved = true` |

---

## Checkliste

### Phase 1: SQL
- [x] Migration-Datei erstellen
- [x] In Supabase Dashboard ausfuehren
- [x] Trigger testen (neuer User → profiles Eintrag?)
- [x] RLS testen (User kann eigenes Profil lesen?)

### Phase 2: Auth Context
- [x] `isApproved` default auf `null`
- [x] `approvalLoading` default auf `true`
- [x] Approval-Check aktivieren
- [x] Retry-Funktion hinzufuegen

### Phase 3: Router
- [x] ProtectedRoute anpassen
- [x] `/pending-approval` Route hinzufuegen

### Phase 4: Pending Screen
- [x] Page erstellen
- [x] Retry-Button
- [x] Logout-Button

### Bestehende User
- [x] Migration fuer existierende User (approved = true setzen) → In Schritt 4 der SQL-Migration enthalten

### Phase 5a: Admin-Benachrichtigung
- [x] Edge Function `notify-admin` erstellen
- [x] Trigger `on_new_profile_notify_admin` erstellen
- [x] Testen: Neuer User registriert → Admin bekommt Email

### Phase 5b: User-Benachrichtigung
- [x] Edge Function `notify-approval` erstellen
- [x] Trigger `on_profile_approval_change` erstellen
- [x] Testen: Admin schaltet frei → User bekommt Email

### Abschluss
- [x] Alle Tests bestanden
- [x] Kein User ausgesperrt
- [x] Rollback-Plan dokumentiert

---

## Entscheidungen

1. ~~**Bestehende User:** Sollen alle existierenden User automatisch `approved = true` bekommen?~~
   **ENTSCHIEDEN:** Ja, alle bestehenden User bekommen `approved = true` (Schritt 4 der Migration)

2. ~~**Admin UI:** Wie werden User freigeschaltet?~~
   **ENTSCHIEDEN:** Erstmal SQL Editor, Admin-Page kommt spaeter

3. ~~**Email-Benachrichtigung an User:** Soll der User per Email informiert werden wenn er freigeschaltet wird?~~
   **ENTSCHIEDEN:** Ja, per Supabase Edge Function (Phase 5b)

4. ~~**Email-Benachrichtigung an Admin:** Soll der Admin per Email benachrichtigt werden wenn sich ein neuer User registriert?~~
   **ENTSCHIEDEN:** Ja, per Supabase Edge Function (Phase 5a)

---

## Phase 5: Email-Benachrichtigungen (nach Basis-System)

Es gibt zwei Email-Benachrichtigungen:
- **5a:** Admin wird benachrichtigt, wenn sich ein neuer User registriert
- **5b:** User wird benachrichtigt, wenn sein Account freigeschaltet wird

---

### Phase 5a: Admin-Benachrichtigung bei neuer Registrierung

**Ablauf:**

```
Neuer User registriert sich
         ↓
Trigger on_auth_user_created feuert
         ↓
profiles-Eintrag wird erstellt (approved = false)
         ↓
Edge Function notify-admin wird aufgerufen
         ↓
Email an Admin: "Neuer User wartet auf Freischaltung"
```

**Supabase Edge Function:** `supabase/functions/notify-admin/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend'

const ADMIN_EMAIL = 'admin@prepwell.de' // Oder aus Environment Variable

serve(async (req) => {
  const { record } = await req.json()

  const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

  await resend.emails.send({
    from: 'PrepWell System <noreply@prepwell.de>',
    to: ADMIN_EMAIL,
    subject: `Neuer User wartet auf Freischaltung: ${record.email}`,
    html: `
      <h1>Neuer User registriert</h1>
      <p><strong>Email:</strong> ${record.email}</p>
      <p><strong>Name:</strong> ${record.full_name || 'Nicht angegeben'}</p>
      <p><strong>Registriert am:</strong> ${new Date(record.created_at).toLocaleString('de-DE')}</p>
      <hr />
      <p>Um den User freizuschalten, fuehre folgenden SQL-Befehl im Supabase Dashboard aus:</p>
      <pre>UPDATE profiles SET approved = true, approved_at = now() WHERE email = '${record.email}';</pre>
      <p><a href="https://supabase.com/dashboard/project/vitvxwfcutysuifuqnqi/editor">Zum Supabase Dashboard</a></p>
    `
  })

  return new Response('OK', { status: 200 })
})
```

**Database Trigger fuer Admin-Benachrichtigung:**

```sql
-- Funktion die Edge Function aufruft wenn neuer User erstellt wird
create or replace function public.notify_admin_on_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Nur bei neuen Usern (nicht bei Updates)
  perform net.http_post(
    url := 'https://vitvxwfcutysuifuqnqi.supabase.co/functions/v1/notify-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'record', row_to_json(new)
    )
  );
  return new;
end;
$$;

-- Trigger auf profiles INSERT
create trigger on_new_profile_notify_admin
after insert on public.profiles
for each row execute function public.notify_admin_on_new_user();
```

---

### Phase 5b: User-Benachrichtigung bei Freischaltung

**Ablauf:**

```
Admin setzt approved = true
         ↓
Database Trigger feuert
         ↓
Edge Function wird aufgerufen
         ↓
Email an User: "Dein Account wurde freigeschaltet"
```

### Supabase Edge Function

**Datei:** `supabase/functions/notify-approval/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { record, old_record } = await req.json()

  // Nur wenn approved von false auf true wechselt
  if (!old_record.approved && record.approved) {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    await resend.emails.send({
      from: 'PrepWell <noreply@prepwell.de>',
      to: record.email,
      subject: 'Dein PrepWell-Account wurde freigeschaltet',
      html: `
        <h1>Willkommen bei PrepWell!</h1>
        <p>Hallo ${record.full_name || 'dort'},</p>
        <p>Dein Account wurde freigeschaltet. Du kannst dich jetzt einloggen und loslegen.</p>
        <a href="https://app.prepwell.de">Jetzt einloggen</a>
      `
    })
  }

  return new Response('OK', { status: 200 })
})
```

### Database Trigger fuer Edge Function

```sql
-- Nach der Basis-Migration hinzufuegen
create or replace function public.notify_on_approval()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Nur wenn approved von false auf true wechselt
  if old.approved = false and new.approved = true then
    perform net.http_post(
      url := 'https://vitvxwfcutysuifuqnqi.supabase.co/functions/v1/notify-approval',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'record', row_to_json(new),
        'old_record', row_to_json(old)
      )
    );
  end if;
  return new;
end;
$$;

create trigger on_profile_approval_change
after update on public.profiles
for each row execute function public.notify_on_approval();
```

### Voraussetzungen fuer Phase 5

- [x] Resend Account (oder anderer Email-Provider)
- [x] `RESEND_API_KEY` in Supabase Secrets
- [x] `ADMIN_EMAIL` in Supabase Secrets (oder hardcoded)
- [x] `pg_net` Extension aktiviert (fuer HTTP calls aus Postgres)
- [x] Edge Functions deployen:
  - `supabase functions deploy notify-admin`
  - `supabase functions deploy notify-approval`

**Hinweis:** Emails werden aktuell ueber `onboarding@resend.dev` (Resend Test-Domain) versendet. Fuer Produktion: Domain `prepwell.de` in Resend verifizieren.

---

## Implementierungsreihenfolge

| Phase | Was | Blockiert von |
|-------|-----|---------------|
| 1 | SQL Migration + Trigger | - |
| 2 | Auth Context anpassen | Phase 1 |
| 3 | Router + ProtectedRoute | Phase 2 |
| 4 | Pending Approval Screen | Phase 3 |
| 5a | Admin-Benachrichtigung (neue User) | Phase 1 + Resend Setup |
| 5b | User-Benachrichtigung (Freischaltung) | Phase 1 + Resend Setup |

**Empfehlung:** Phase 1-4 zuerst fertig machen und testen. Phase 5a/5b (Emails) koennen unabhaengig danach kommen.
