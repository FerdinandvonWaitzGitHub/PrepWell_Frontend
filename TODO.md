# PrepWell Frontend - TODO Liste

## Kritische Bugs (Priorität: HOCH)

### BUG-001: Session-Persistenz - Kein Auto-Logout ✅
- **Problem:** Benutzer bleibt eingeloggt, egal von welchem Gerät/Browser auf https://prep-well-frontend.vercel.app/ zugegriffen wird
- **Erwartet:** Beim Schließen des Tabs/Browsers soll der Benutzer automatisch ausgeloggt werden
- **Betrifft:** `src/services/supabase.ts`
- **Lösung:** Supabase Auth auf `sessionStorage` umgestellt (statt localStorage)
- **Status:** [x] Erledigt

### BUG-002: Timer bei Tab-Schließen ✅
- **Problem:** Timer sollte beim Tab-Schließen gestoppt werden
- **Erwartet:** Timer läuft im Hintergrund weiter (bei Tab-Wechsel), wird beim Tab-Schließen beendet
- **Betrifft:** `src/services/supabase.ts` (indirekt über Session)
- **Lösung:** Durch sessionStorage wird User beim Tab-Schließen ausgeloggt → Timer-State wird zurückgesetzt
- **Hinweis:** Timer läuft absichtlich im Hintergrund weiter - App funktioniert normal bei Tab-Wechsel
- **Status:** [x] Erledigt

### BUG-003: Check-In wird ohne aktivierten Mentor angezeigt ✅
- **Problem:** Morgendliche Check-In Fragen erscheinen, obwohl Mentor nicht aktiviert ist
- **Erwartet:** Check-In Fragen NUR anzeigen, wenn Mentor aktiviert ist
- **Betrifft:** `src/contexts/checkin-context.jsx`
- **Lösung:** `useMentor` Hook integriert, `isCheckInNeeded` prüft Mentor-Status
- **Status:** [x] Erledigt

---

## Feature Requests (Priorität: MITTEL)

### FEAT-001: Mentor Deaktivierung in Einstellungen ✅
- **Beschreibung:** Option in Einstellungen hinzufügen, um Mentor zu deaktivieren
- **Betrifft:** `src/components/settings/settings-content.jsx`
- **Anforderungen:**
  - [x] Toggle für "Mentor aktivieren/deaktivieren"
  - [x] Wenn deaktiviert: keine Check-Ins, keine Mentor-Statistiken
  - [x] Einstellung in user_settings speichern (via useMentor Hook)
- **Lösung:** Neue "Mentor" Section mit Toggle hinzugefügt
- **Status:** [x] Erledigt

### FEAT-002: Modus-Trennung (Normal vs. Examen) ✅
- **Beschreibung:** Features je nach App-Modus ein-/ausblenden
- **Betrifft:**
  - `src/contexts/appmode-context.jsx` (isNavItemHidden, isWizardAvailable)
  - `src/components/layout/navigation.jsx` (dynamisches Verwaltung-Submenu)
  - `src/pages/lernplaene.jsx` (Wizard-Button konditionell)
- **Lösung:**
  - Navigation zeigt "Übungsklausuren" nur im Examen-Modus
  - Navigation zeigt "Leistungen (Coming Soon)" nur im Normal-Modus
  - "Neuen Lernplan erstellen"-Button nur im Examen-Modus
- **Status:** [x] Erledigt

---

## Feature-Klassifizierung nach Modus

### Beide Modi (Normal + Examen)
| Feature | Beschreibung |
|---------|--------------|
| Dashboard | Startseite mit Tagesübersicht |
| Kalender (Woche) | Wochenansicht mit Sessions |
| Kalender (Monat) | Monatsansicht mit Blöcken |
| Timer | Pomodoro, Countdown, Countup |
| Mentor | Check-In, Statistiken, Heatmap (wenn aktiviert) |
| Verwaltung/Aufgaben | Todo-Verwaltung |
| Themenlisten | Themen-Hierarchie und Fortschritt |
| Lernpläne (Übersicht) | Liste der erstellten Lernpläne |
| Profil | Benutzer-Profil und Modus-Wechsel |
| Einstellungen | Alle Einstellungen |

### Nur Examen-Modus
| Feature | Beschreibung |
|---------|--------------|
| Lernplan-Wizard | 10-Schritte Wizard zur Erstellung |
| Übungsklausuren | Verwaltung/Leistungen zeigt Übungsklausuren |

### Nur Normal-Modus
| Feature | Beschreibung |
|---------|--------------|
| Semester-Noten | Verwaltung/Leistungen zeigt Noten (Coming Soon) |

---

## Navigation nach Modus

### Examen-Modus Navigation
```
- Startseite (Dashboard)
- Lernpläne
- Kalender
  - Woche
  - Monat
- Verwaltung
  - Übungsklausuren
  - Aufgaben
- Mentor
```

### Normal-Modus Navigation
```
- Startseite (Dashboard)
- Lernpläne (ohne Wizard-Button? / oder Wizard ausgeblendet)
- Kalender
  - Woche
  - Monat
- Verwaltung
  - Leistungen (Noten - Coming Soon)
  - Aufgaben
- Mentor
```

---

## Implementierungs-Checkliste

### Phase 1: Kritische Bugs beheben
- [x] BUG-001: Session-Persistenz fixen (Auto-Logout) ✅ 2026-01-05
- [x] BUG-002: Timer bei Tab-Schließen stoppen (via Session-Logout) ✅ 2026-01-05
- [x] BUG-003: Check-In an Mentor-Aktivierung koppeln ✅ 2026-01-05

### Phase 2: Mentor-Feature erweitern
- [x] FEAT-001: Mentor Toggle in Einstellungen ✅ 2026-01-05

### Phase 3: Modus-Trennung
- [x] FEAT-002.1: Navigation dynamisch nach Modus ✅ 2026-01-05
- [x] FEAT-002.2: Verwaltung/Leistungen nach Modus anpassen ✅ 2026-01-05
- [x] FEAT-002.3: Lernplan-Wizard im Normal-Modus ausblenden ✅ 2026-01-05

---

## Technische Notizen

### Auto-Logout Implementierung
```javascript
// Option 1: Supabase Session auf "session only" setzen
const supabase = createClient(url, key, {
  auth: {
    persistSession: false, // Keine Persistenz
    // ODER
    storage: sessionStorage // Nur für Tab-Session
  }
})

// Option 2: beforeunload Event
window.addEventListener('beforeunload', () => {
  supabase.auth.signOut()
})
```

### Timer bei Tab-Schließen
```javascript
// Der Timer läuft absichtlich im Hintergrund weiter (Tab-Wechsel)
// Beim Tab-SCHLIESSEN wird der User automatisch ausgeloggt (sessionStorage)
// → Timer-State wird natürlich zurückgesetzt beim nächsten Login

// NICHT implementiert (absichtlich):
// - visibilitychange Event (würde Timer bei Tab-Wechsel pausieren)
// - beforeunload Event (unzuverlässig für async Operationen)

// Die Lösung über sessionStorage ist elegant:
// - User bleibt eingeloggt bei Tab-Wechsel ✅
// - Timer läuft im Hintergrund weiter ✅
// - Bei Tab-Schließen: Auto-Logout + Timer-Reset ✅
```

### Check-In Mentor-Abhängigkeit
```javascript
// In checkin-context.jsx
const { isMentorEnabled } = useSettings()

const shouldShowCheckIn = useMemo(() => {
  if (!isMentorEnabled) return false
  // ... restliche Logik
}, [isMentorEnabled, ...])
```

---

*Erstellt: 2026-01-05*
*Letzte Aktualisierung: 2026-01-05*
