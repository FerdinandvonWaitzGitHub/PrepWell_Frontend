# User Approval System (Option 3)

## Ubersicht

Das User Approval System ermoöglicht es Administratoren, neue Benutzerkonten manuell freizuschalten, bevor diese auf die App-Daten zugreifen können.

**Warum Option 3?**
- Benutzer können sich selbst registrieren (skalierbar)
- Keine manuelle Account-Erstellung durch Admin nötig
- Volle Kontrolle über den Zugang zur App
- RLS-basierte Sicherheit auf Datenbankebene

---

## Funktionsweise

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Benutzer registriert sich                                │
│    └── profile Eintrag wird erstellt (approved = false)     │
├─────────────────────────────────────────────────────────────┤
│ 2. Benutzer landet auf /pending-approval                    │
│    └── Kann nur warten oder sich abmelden                   │
├─────────────────────────────────────────────────────────────┤
│ 3. Admin schaltet Benutzer frei                             │
│    └── UPDATE profiles SET approved = true                  │
├─────────────────────────────────────────────────────────────┤
│ 4. Benutzer kann App vollständig nutzen                     │
│    └── RLS Policies erlauben Datenzugriff                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `supabase/migration-user-approval.sql` | SQL Migration mit profiles Tabelle und RLS Policies |
| `src/contexts/auth-context.jsx` | `isApproved`, `approvalLoading`, `checkApprovalStatus` |
| `src/pages/pending-approval.jsx` | UI für nicht-freigeschaltete Benutzer |
| `src/router.jsx` | Routing-Logik mit Approval-Check |

---

## SQL Migration

**Datei:** `supabase/migration-user-approval.sql`

### Profiles Tabelle

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Automatische Profil-Erstellung

Bei jeder neuen Registrierung wird automatisch ein Profil erstellt:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, approved, created_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), FALSE, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies

Alle relevanten Tabellen haben aktualisierte RLS Policies:

```sql
-- Beispiel: content_plans
CREATE POLICY "Users can view own content_plans" ON content_plans
  FOR SELECT USING (auth.uid() = user_id AND is_user_approved(auth.uid()));
```

Die `is_user_approved()` Funktion prüft den Approval-Status:

```sql
CREATE OR REPLACE FUNCTION is_user_approved(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT approved FROM profiles WHERE id = user_uuid), FALSE);
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

## Admin-Funktionen

### Benutzer freischalten

```sql
-- Option A: Direkter SQL-Befehl
UPDATE profiles SET approved = true, approved_at = NOW() WHERE email = 'user@example.com';

-- Option B: Über Funktion
SELECT approve_user('user@example.com', 'admin@prepwell.de');
```

### Ausstehende Benutzer anzeigen

```sql
SELECT * FROM get_pending_users();
```

Oder direkt:

```sql
SELECT id, email, full_name, created_at
FROM profiles
WHERE approved = FALSE
ORDER BY created_at DESC;
```

---

## Frontend-Integration

### AuthContext

Neue Exports:
- `isApproved` - Boolean, ob Benutzer freigeschaltet ist
- `approvalLoading` - Boolean, ob Status geprüft wird
- `checkApprovalStatus()` - Funktion zum erneuten Prüfen

```jsx
const { isApproved, approvalLoading, checkApprovalStatus } = useAuth();
```

### ProtectedRoute

Der ProtectedRoute-Wrapper prüft jetzt auch den Approval-Status:

```jsx
// Standard: Erfordert Approval
<ProtectedRoute>
  <SomePage />
</ProtectedRoute>

// Ohne Approval-Check (für /pending-approval)
<ProtectedRoute requireApproval={false}>
  <PendingApprovalPage />
</ProtectedRoute>
```

---

## Deployment-Checkliste

1. **Migration ausführen:**
   - Öffne Supabase Dashboard → SQL Editor
   - Führe `supabase/migration-user-approval.sql` aus
   - Prüfe, dass alle Tabellen und Policies erstellt wurden

2. **Bestehende Benutzer freischalten:**
   ```sql
   UPDATE profiles SET approved = true WHERE email IN ('admin@example.com', ...);
   ```

3. **Frontend deployen:**
   - Build: `npm run build`
   - Deploy auf Vercel

4. **Testen:**
   - Registriere einen neuen Test-Account
   - Prüfe, dass /pending-approval angezeigt wird
   - Schalte Account frei und prüfe Zugang

---

## Hinweise

- **Offline-Modus:** Im Offline-Modus (Supabase nicht konfiguriert) wird `isApproved = true` gesetzt
- **Bestehende Accounts:** Müssen einmalig manuell freigeschaltet werden
- **E-Mail-Benachrichtigung:** Aktuell keine automatische E-Mail nach Freischaltung (kann später über Supabase Edge Functions ergänzt werden)

---

## Datum

**Implementiert:** 2026-01-13
