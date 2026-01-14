# T19: Fehleranalyse und Fixes

## Status: ERLEDIGT (Migration manuell ausführen)

---

## Fehler-Übersicht

| # | Fehler | Schwere | Status |
|---|--------|---------|--------|
| 1 | AudioContext Warning | HARMLOS | GEFIXT |
| 2 | Invalid date key: null | HARMLOS | GEFIXT |
| 3 | 400 Bad Request calendar_blocks | KRITISCH | Migration manuell ausführen |

---

## Fehler 1: AudioContext Warning

### Symptom
```
The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
```

### Schwere: HARMLOS (nur Warning)
Dies ist **KEIN Fehler**, sondern eine Browser-Sicherheitswarnung. Chrome/Firefox blockieren Audio-Autoplay bis der User mit der Seite interagiert.

### Ursache
Der Timer-Code initialisiert einen AudioContext beim Laden, um später Sounds abspielen zu können (z.B. Pomodoro-Ende-Gong). Der Browser blockiert das, bis der User klickt.

### Warum passiert das?
- Timer wird aus Supabase restored: `[Timer] Restored active timer from Supabase`
- Timer-Code versucht AudioContext zu initialisieren
- Browser blockiert, weil noch keine User-Interaktion

### Lösung: IMPLEMENTIERT
AudioContext wird jetzt nur gestartet, wenn der User mit der Seite interagiert hat.

### Betroffene Datei
`src/contexts/timer-context.jsx`

### Implementierter Fix
```javascript
// Track user interaction
let userHasInteracted = false;
window.addEventListener('click', () => { userHasInteracted = true; }, { once: true });
window.addEventListener('keydown', () => { userHasInteracted = true; }, { once: true });
window.addEventListener('touchstart', () => { userHasInteracted = true; }, { once: true });

const playNotificationSound = () => {
  // Skip if user hasn't interacted yet
  if (!userHasInteracted) {
    console.log('[Timer] Skipping notification sound - no user interaction yet');
    return;
  }
  // ... AudioContext code
};
```

---

## Fehler 2: Invalid date key: null

### Symptom
```
[filterValidDateKeys] Removing invalid date key: null
[useSupabaseSync] Skipping invalid date key: null
```

### Schwere: HARMLOS (bereits gefixt)
Diese Meldungen sind **KEINE Fehler**, sondern zeigen, dass der Fix funktioniert!

### Was passiert?
1. Irgendwann wurde korrupte Daten in localStorage gespeichert mit `"null"` als Datum-Key
2. Der neue `filterValidDateKeys` Filter entfernt diese ungültigen Keys
3. Die Warnungen zeigen, dass der Filter arbeitet

### Warum immer noch Warnungen?
- Die korrupten Daten sind noch in localStorage
- Bei jedem Laden werden sie gefiltert und übersprungen
- Die Warnungen verschwinden, sobald localStorage bereinigt wird

### Permanente Lösung: localStorage bereinigen

**Option A: Im Browser DevTools**
```javascript
// In Console ausführen:
const key = 'prepwell_privateSessions';
const data = JSON.parse(localStorage.getItem(key) || '{}');
const cleaned = {};
Object.entries(data).forEach(([k, v]) => {
  if (k && k !== 'null' && /^\d{4}-\d{2}-\d{2}$/.test(k)) {
    cleaned[k] = v;
  }
});
localStorage.setItem(key, JSON.stringify(cleaned));
console.log('Cleaned! Removed invalid keys.');
```

**Option B: Automatische Bereinigung beim Speichern**
Die Bereinigung passiert bereits automatisch durch `filterValidDateKeys`. Nach dem nächsten erfolgreichen Sync werden die korrupten Daten überschrieben.

---

## Fehler 3: 400 Bad Request calendar_blocks (KRITISCH)

### Symptom
```
POST .../calendar_blocks?columns=... 400 (Bad Request)
```

### Schwere: KRITISCH
Daten können nicht in Supabase gespeichert werden!

### Ursache
Die Spalten in der POST-Anfrage existieren nicht in der Datenbank:
- `rechtsgebiet` - fehlt
- `unterrechtsgebiet` - fehlt
- Andere Spalten möglicherweise auch

### Warum?
Die Datenbank-Migration wurde noch nicht ausgeführt. Die Datei existiert:
- `supabase/migrations/20260114_add_missing_columns.sql`

### Lösung: Migration ausführen

**Schritt 1:** Gehe zu Supabase Dashboard → SQL Editor

**Schritt 2:** Führe folgendes SQL aus:

```sql
-- Add missing columns to calendar_blocks
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS rechtsgebiet TEXT;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS unterrechtsgebiet TEXT;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS block_size INTEGER DEFAULT 1;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS has_time BOOLEAN DEFAULT FALSE;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS start_hour INTEGER;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS repeat_end_mode TEXT;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS repeat_end_date DATE;

-- Add missing columns to private_sessions
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT FALSE;
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS is_multi_day BOOLEAN DEFAULT FALSE;
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS rechtsgebiet TEXT;

-- Add missing columns to time_sessions
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS rechtsgebiet TEXT;
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS description TEXT;
```

**Schritt 3:** Vercel neu deployen oder Seite neu laden

---

## Fix-Reihenfolge

### 1. Sofort (Kritisch)
- [ ] Supabase Migration ausführen (Fehler 3)

### 2. Optional (Qualitätsverbesserung)
- [ ] AudioContext lazy initialisieren (Fehler 1)
- [ ] localStorage manuell bereinigen (Fehler 2) - oder einfach warten

---

## Zusammenfassung

| Fehler | Aktion | Aufwand |
|--------|--------|---------|
| AudioContext | Lazy init implementieren | 15 min |
| Invalid date key | Bereits gefixt, Warnungen ignorierbar | 0 min |
| 400 Bad Request | **MIGRATION AUSFÜHREN** | 2 min |

**Wichtigster Schritt:** Die Supabase-Migration muss ausgeführt werden, sonst funktioniert die Datenspeicherung nicht!
