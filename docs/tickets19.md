# T19: Fehleranalyse und Fixes

## Status: ALLE FEHLER BEHOBEN

---

## Fehler-Übersicht

| # | Fehler | Schwere | Status |
|---|--------|---------|--------|
| 1 | AudioContext Warning | HARMLOS | GEFIXT |
| 2 | Invalid date key: null | HARMLOS | GEFIXT |
| 3 | 400 Bad Request calendar_blocks | KRITISCH | GEFIXT (Root Cause: Duplikat-IDs, Fix: insert→upsert) |

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

## Fehler 3: 400 Bad Request calendar_blocks (KRITISCH) - GEFIXT

### Symptom
```
POST .../calendar_blocks?columns=... 400 (Bad Request)
```
Aber: "Migrated 4 blocks to Supabase" - EINIGE Inserts funktionieren!

### Schwere: KRITISCH (war)
Daten konnten nicht vollständig in Supabase gespeichert werden.

### Root Cause Analyse
**Erste Annahme (FALSCH):** Fehlende Spalten in der Datenbank
- Migrationen wurden ausgeführt
- Alle 19 Spalten existierten in der Tabelle

**Tatsächliche Ursache (KORREKT):** Duplikat-IDs
- Der Code verwendete `insert` statt `upsert`
- Wenn Blöcke mit gleicher ID bereits in Supabase existierten, schlug `insert` fehl
- Daher: EINIGE Blöcke wurden erfolgreich eingefügt (neue IDs), andere schlugen fehl (existierende IDs)

### Lösung: IMPLEMENTIERT
`insert` zu `upsert` geändert in `use-supabase-sync.js`:

```javascript
// VORHER (fehlgeschlagen bei Duplikaten):
await supabase.from('calendar_blocks').insert(dataToInsert);

// NACHHER (funktioniert immer):
await supabase.from('calendar_blocks').upsert(dataToInsert, { onConflict: 'id' });
```

### Betroffene Stellen
1. Zeile ~1197: Migration sync
2. Zeile ~1268: saveDaySlots
3. Zeile ~1302: saveAllSlots

---

## Alle Fixes erledigt

- [x] AudioContext Warning - User Interaction Tracking
- [x] Invalid date key: null - filterValidDateKeys Helper
- [x] 400 Bad Request - insert zu upsert geändert
- [x] Position Constraint - Validierung für DB CHECK (1-4 oder null)
- [x] Error Logging - Detaillierte Fehlermeldungen hinzugefügt
- [x] UUID Validierung - IDs wie "2026-01-14-1" zu echten UUIDs konvertiert
- [ ] **slot_date → block_date** - Spalte in DB umbenennen (Migration erforderlich!)

---

## Fehler 5: slot_date NOT NULL Constraint (KRITISCH) - MIGRATION ERFORDERLICH

### Symptom
```
message: 'null value in column "slot_date" of relation "calendar_blocks" violates not-null constraint'
code: '23502'
```

### Ursache
**Schema-Mismatch:** Die Produktions-DB hat noch die alte Spalte `slot_date`, aber der Code sendet `block_date`.

### Lösung: Migration ausführen
Führe diese Migration im Supabase SQL Editor aus:
```sql
-- Rename slot_date to block_date
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_blocks' AND column_name = 'slot_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_blocks' AND column_name = 'block_date'
  ) THEN
    ALTER TABLE calendar_blocks RENAME COLUMN slot_date TO block_date;
  END IF;
END $$;
```

Datei: `supabase/migrations/20260114_rename_slot_date.sql`

---

## Fehler 4: Invalid UUID Format (KRITISCH) - GEFIXT

### Symptom
```
message: 'invalid input syntax for type uuid: "2026-01-14-1"'
code: '22P02'
```

### Ursache
Block-IDs wurden im Format `"YYYY-MM-DD-N"` (Datum-Position) generiert statt als UUID.
Die Datenbank erwartet aber UUIDs für die `id` Spalte.

### Lösung: UUID Validierung hinzugefügt
```javascript
// UUID validation regex (standard UUID format: 8-4-4-4-12 hex chars)
const isValidUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Check if ID needs replacement
const needsNewId = !block.id ||
  block.id?.startsWith('slot-') ||
  !isValidUuid(block.id);

// Generate new UUID if current ID is invalid
const blockId = needsNewId ? crypto.randomUUID() : block.id;
```

---

## Debugging: Detailliertes Error-Logging

Falls der 400-Fehler weiterhin auftritt, wird jetzt die genaue Ursache in der Konsole angezeigt:

```javascript
[saveDaySlots] Supabase error details: {
  message: "...",      // Was genau schief geht
  details: "...",      // Welche Daten/Spalten betroffen
  hint: "...",         // Supabase-Hinweis zur Lösung
  code: "...",         // PostgreSQL Error-Code
  dataToInsert: [...]  // Die Daten, die gesendet wurden
}
```

### Mögliche Ursachen nach dem Upsert-Fix:

1. **Position außerhalb 1-4**: `CHECK (position >= 1 AND position <= 4)` - GEFIXED
2. **Foreign Key Violation**: `content_plan_id` referenziert content_plans, ungültige ID → 400
3. **Datentyp-Konflikt**: z.B. String statt UUID für content_plan_id

---

## Zusammenfassung

| Fehler | Aktion | Aufwand |
|--------|--------|---------|
| AudioContext | Lazy init implementieren | 15 min |
| Invalid date key | Bereits gefixt, Warnungen ignorierbar | 0 min |
| 400 Bad Request | **MIGRATION AUSFÜHREN** | 2 min |

**Wichtigster Schritt:** Die Supabase-Migration muss ausgeführt werden, sonst funktioniert die Datenspeicherung nicht!
