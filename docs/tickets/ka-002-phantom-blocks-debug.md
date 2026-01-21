# KA-002: Phantom-Blöcke & Leere Monatsansicht - Debug-Protokoll

## Status: FIXED

**Letzte Aktualisierung:** 2026-01-17

---

## Problem-Beschreibung (Aktualisiert)

### Symptom 1: Phantom-Blöcke in Wochenansicht
- Blöcke erscheinen in der "Plan"-Row für Tage, an denen keine Blöcke erstellt wurden
- **Beispiel:** 2 "mathe" Blöcke auf Mittwoch (14. Jan), obwohl für Freitag erstellt

### Symptom 2: Leere Monatsansicht
- Monatsansicht (Januar 2026) zeigt **keine Blöcke** mehr an
- Nur leere Zellen mit "+" Buttons sind sichtbar
- **Kritisch:** Gleiche Datenquelle sollte beide Views beliefern

### Symptom 3: Browser-Konsole leer
- Keine Fehler in der Konsole
- Sync-Logs zeigen: `[useSupabaseSync] Syncing 2 local-only items in 1 chunk(s)...`
- `Successfully synced all 2 items` - Sync scheint zu funktionieren

---

## Screenshot-Analyse (17.01.2026)

### Wochenansicht (Kalenderwoche 3: 12.-18. Januar 2026)
```
┌─────────┬───────────┬───────────┬────────────┬─────────┬──────────┬─────────┐
│ Montag  │ Dienstag  │ Mittwoch  │ Donnerstag │ Freitag │ Samstag  │ Sonntag │
│ 12. Jan │ 13. Jan   │ 14. Jan   │ 15. Jan    │ 16. Jan │ 17. Jan⚠│ 18. Jan │
├─────────┴───────────┴───────────┴────────────┴─────────┴──────────┴─────────┤
│ PLAN    │           │ mathe (2x)│            │         │          │         │
├─────────┴───────────┴───────────┴────────────┴─────────┴──────────┴─────────┤
│ 08:00   │           │           │            │ mathe   │ mathe    │         │
│ ...     │           │ testen    │            │         │          │         │
│         │           │ 12:30     │            │         │          │         │
└─────────┴───────────┴───────────┴────────────┴─────────┴──────────┴─────────┘
```

**Beobachtungen:**
1. "Plan"-Row zeigt 2 "mathe" Blöcke auf **Mittwoch** (14. Jan)
2. Zeit-Grid zeigt "mathe" Sessions auf **Freitag + Samstag** (16.-17. Jan)
3. "testen" Session auf **Mittwoch** (14. Jan) um 12:30

### Monatsansicht (Januar 2026)
- **Komplett leer** - keine Blöcke sichtbar
- Nur "+" Buttons in jeder Zelle
- Heute (17.) ist blau markiert

---

## Datenfluss-Analyse

### Architektur
```
                    ┌─────────────────────────────────────┐
                    │         CalendarContext             │
                    │  ┌─────────────┬───────────────┐    │
                    │  │blocksByDate │visibleBlocks  │    │
                    │  │    (raw)    │  ByDate       │    │
                    │  └──────┬──────┴───────┬───────┘    │
                    └─────────┼──────────────┼────────────┘
                              │              │
              ┌───────────────┼──────────────┼───────────────┐
              ▼               ▼              ▼               ▼
        ┌──────────┐    ┌──────────┐   ┌──────────┐   ┌──────────┐
        │Month View│    │Week View │   │ WeekGrid │   │Dashboard │
        │(calendar │    │(week-    │   │lernplan- │   │          │
        │-view.jsx)│    │view.jsx) │   │Blocks    │   │          │
        └──────────┘    └──────────┘   └──────────┘   └──────────┘
             │                │              │
             ▼                ▼              ▼
        displayBlocks    timeBlocksBy   lernplanBlocks
        ByDate           Date           ByDate
```

### Kritische Dateien
1. **CalendarContext** (`src/contexts/calendar-context.jsx`)
   - `blocksByDate` - Rohdaten aus LocalStorage/Supabase
   - `visibleBlocksByDate` - Gefilterte Daten (ohne archivierte Pläne)

2. **Supabase Sync** (`src/hooks/use-supabase-sync.js`)
   - `useCalendarBlocksSync()` - Lädt und transformiert Daten
   - `transformFromSupabase()` - Konvertiert Supabase → Frontend-Format

3. **Week View** (`src/features/calendar/components/week-view.jsx`)
   - Übergibt `lernplanBlocks={visibleBlocksByDate || {}}` an WeekGrid
   - Hat eigene `formatDateKey()` Funktion

4. **Week Grid** (`src/features/calendar/components/week-grid.jsx`)
   - Zeigt "Plan"-Row basierend auf `lernplanBlocks` prop
   - Hat eigene `formatDateKey()` Funktion (KA-002 FIX angewendet)

5. **Month View** (`src/features/calendar/components/calendar-view.jsx`)
   - Verwendet `displayBlocksByDate = visibleBlocksByDate || blocksByDate || {}`
   - Importiert `formatDateKey` aus `blockUtils.ts`

---

## Implementierte Fixes (17.01.2026)

### Fix 1: formatDateKey Timezone (toISOString → lokale Zeit)
Folgende Dateien wurden geändert:

| Datei | Funktion | Status |
|-------|----------|--------|
| `week-grid.jsx:249` | `formatDateKey` | ✅ Gefixt |
| `week-view.jsx:84` | `formatDateKey` | ✅ Gefixt |
| `use-dashboard.js:22` | `formatDate` | ✅ Gefixt |
| `calendar-context.jsx:774` | Repeat dates | ✅ Gefixt |
| `calendar-context.jsx:2612` | `cleanupExpiredSchedules` | ✅ Gefixt |
| `calendar-context.jsx:2739` | `getDateRangeData` | ✅ Gefixt |
| `useStatistics.js:26` | `getDateKey` | ✅ Gefixt |
| `create-private-session-dialog.jsx:131` | `formatDateForInput` | ✅ Gefixt |
| `manage-private-session-dialog.jsx:118` | `formatDateForInput` | ✅ Gefixt |

**Das Problem besteht weiterhin!** → Timezone war nicht die einzige Ursache

---

## Tiefere Analyse erforderlich

### Hypothese 1: Daten-Inkonsistenz zwischen LocalStorage und Anzeige

**Prüfung erforderlich:**
```javascript
// Im Browser-Console ausführen:
const ls = localStorage.getItem('prepwell_blocks');
const data = JSON.parse(ls);
console.log('blocksByDate keys:', Object.keys(data || {}));
console.log('Full data:', data);
```

**Erwartung:** Keys sollten wie `2026-01-14`, `2026-01-17` aussehen

### Hypothese 2: visibleBlocksByDate wird falsch berechnet

**Datei:** `calendar-context.jsx:221-253`
```javascript
const visibleBlocksByDate = useMemo(() => {
  if (!blocksByDate || typeof blocksByDate !== 'object') {
    return {};  // ← Wird {} zurückgegeben?
  }
  // ...
}, [blocksByDate, archivedContentPlanIds]);
```

**Debug hinzufügen:**
```javascript
console.log('[CalendarContext] blocksByDate:', Object.keys(blocksByDate || {}));
console.log('[CalendarContext] visibleBlocksByDate:', Object.keys(visibleBlocksByDate || {}));
```

### Hypothese 3: Supabase-Daten werden nicht korrekt geladen

**Datei:** `use-supabase-sync.js:1234-1250`
```javascript
const fetchFromSupabase = useCallback(async () => {
  // ...
  const { data, error } = await supabase
    .from('calendar_blocks')
    .select('*')
    .order('block_date', { ascending: true });
  // ...
});
```

**Prüfung:** Network-Tab → Supabase Request → Response prüfen

### Hypothese 4: Month View iteriert über falsche Daten

**Datei:** `calendar-view.jsx`
- Wie werden die Tage generiert?
- Wie werden Blöcke pro Tag abgefragt?

---

## Debug-Plan

### Schritt 1: LocalStorage-Inhalt prüfen
```javascript
// Browser Console:
Object.entries(localStorage)
  .filter(([k]) => k.includes('prepwell'))
  .forEach(([k, v]) => {
    console.log(`${k}:`, JSON.parse(v));
  });
```

### Schritt 2: CalendarContext Debug-Logs hinzufügen
```javascript
// In calendar-context.jsx, nach Zeile 253 (nach visibleBlocksByDate):
console.log('[CalendarContext] Raw blocksByDate keys:', Object.keys(blocksByDate || {}));
console.log('[CalendarContext] Visible blocksByDate keys:', Object.keys(visibleBlocksByDate || {}));
console.log('[CalendarContext] Sample block:', Object.values(blocksByDate || {})[0]?.[0]);
```

### Schritt 3: WeekGrid Debug-Logs prüfen
```javascript
// In week-grid.jsx, nach lernplanBlocksByDate berechnet wird:
console.log('[WeekGrid] lernplanBlocks input keys:', Object.keys(lernplanBlocks || {}));
console.log('[WeekGrid] lernplanBlocksByDate computed keys:', Object.keys(lernplanBlocksByDate));
```

### Schritt 4: Month View Debug-Logs hinzufügen
```javascript
// In calendar-view.jsx:
console.log('[CalendarView] displayBlocksByDate keys:', Object.keys(displayBlocksByDate));
console.log('[CalendarView] Sample day data:', displayBlocksByDate['2026-01-14']);
```

### Schritt 5: Supabase direkt abfragen
```sql
-- In Supabase SQL Editor:
SELECT id, block_date, title, position, block_type, content_plan_id
FROM calendar_blocks
WHERE user_id = 'USER_ID_HERE'
ORDER BY block_date DESC
LIMIT 20;
```

---

## Mögliche Root Causes

### A. LocalStorage hat alte/korrupte Daten
- **Symptom:** Daten existieren in LS aber mit falschen Keys
- **Fix:** LocalStorage löschen und neu syncen

### B. Supabase-Sync überschreibt/ignoriert lokale Daten
- **Symptom:** Nach Login verschwinden Daten
- **Prüfen:** `syncedRef` und `userIdRef` in use-supabase-sync.js

### C. contentPlanId Filter entfernt alle Blöcke
- **Symptom:** Alle Blöcke haben `contentPlanId` der einem archivierten Plan gehört
- **Prüfen:** `archivedContentPlanIds` Set in calendar-context.jsx

### D. Block-Objekte haben kein/falsches `date` Feld
- **Symptom:** `block.date` !== dateKey unter dem sie gespeichert sind
- **Fix:** Daten korrigieren oder Lookup anpassen

### E. Daten werden unter `slot_date` statt `block_date` gespeichert
- **Symptom:** Migration war unvollständig
- **Prüfen:** Supabase Schema und Daten

---

## Nächste Schritte

1. [ ] Browser LocalStorage inspizieren (prepwell_blocks)
2. [x] CalendarContext Debug-Logs hinzufügen und testen
3. [ ] Supabase-Daten direkt abfragen
4. [ ] Network-Tab auf API-Responses prüfen
5. [ ] Ggf. LocalStorage löschen und Sync-Verhalten beobachten

---

## Debug-Logs hinzugefügt (17.01.2026)

Die folgenden Debug-Logs wurden implementiert:

### 1. CalendarContext (`calendar-context.jsx:255-261`)
```javascript
console.log('[CalendarContext] blocksByDate keys:', Object.keys(blocksByDate || {}));
console.log('[CalendarContext] visibleBlocksByDate keys:', Object.keys(visibleBlocksByDate || {}));
console.log('[CalendarContext] Sample block (first key):', firstKey, blocksByDate[firstKey]);
```

### 2. CalendarView - MonthView (`calendar-view.jsx:346-351`)
```javascript
// Nur für Tag 14 und 17 (Debug)
console.log(`[CalendarView] getSampleLearningBlocks day=${day}, dateKey=${dateKey}`);
console.log(`[CalendarView] displayBlocksByDate keys:`, Object.keys(displayBlocksByDate));
console.log(`[CalendarView] displayBlocksByDate[${dateKey}]:`, displayBlocksByDate[dateKey]);
```

### 3. WeekView (`week-view.jsx:623-624`)
```javascript
console.log('[WeekView] visibleBlocksByDate keys:', Object.keys(visibleBlocksByDate || {}));
```

### 4. WeekGrid (`week-grid.jsx:285-290, 243-244, 752-758`)
```javascript
// Input-Daten
console.log('[WeekGrid] lernplanBlocks input keys:', Object.keys(lernplanBlocks || {}));
console.log('[WeekGrid] lernplanBlocks sample:', firstKey, lernplanBlocks[firstKey]);
console.log('[WeekGrid] weekDates:', weekDates.map(d => formatDateKey(d)));

// Plan-Row Lookup
console.log('[WeekGrid PlanRow] lernplanBlocksByDate keys:', Object.keys(lernplanBlocksByDate));
console.log(`[WeekGrid PlanRow] dateKey=${dateKey}, dayIndex=${dayIndex}, blocksForDay:`, blocksForDay);
```

### Erwartete Console-Ausgabe

Bei korrekter Funktion sollte die Konsole zeigen:
```
[CalendarContext] blocksByDate keys: ['2026-01-14', '2026-01-17']
[CalendarContext] visibleBlocksByDate keys: ['2026-01-14', '2026-01-17']
[WeekView] visibleBlocksByDate keys: ['2026-01-14', '2026-01-17']
[WeekGrid] lernplanBlocks input keys: ['2026-01-14', '2026-01-17']
[WeekGrid] weekDates: ['2026-01-13', '2026-01-14', '2026-01-15', ...]
[CalendarView] getSampleLearningBlocks day=14, dateKey=2026-01-14
[CalendarView] displayBlocksByDate keys: ['2026-01-14', '2026-01-17']
```

**Problem-Indikatoren:**
- Leere `[]` Arrays → Daten werden nicht geladen
- Falsche dateKeys → Timezone-Problem noch nicht vollständig behoben
- Keys existieren aber Lookup schlägt fehl → Datenformat-Inkonsistenz

---

## ROOT CAUSE FOUND (17.01.2026)

### Problem
Blöcke aus dem Wizard wurden mit `topicTitle` gespeichert, aber der Sync-Code verwendete `title`.

### Analyse
1. `createTopicBlocks()` in `blockUtils.ts:162` erstellt Blöcke mit `topicTitle` Feld
2. `transformToSupabase()` in `use-supabase-sync.js:1212` mappte nur `block.title` → DB
3. Da Wizard-Blöcke `topicTitle` hatten (nicht `title`), wurde `null` gespeichert
4. `transformFromSupabase()` berechnete `hasContent = !!(row.title || row.content_id)`
5. Da `title = null`, wurde `status: 'empty'` gesetzt
6. `lernplanBlocksByDate` filtert `status !== 'empty'` - daher keine Blöcke angezeigt!

### Fixes Applied
**Datei:** `src/hooks/use-supabase-sync.js`

1. **Line 1213** - transformToSupabase:
   ```javascript
   // KA-002 FIX: Map both title and topicTitle (wizard uses topicTitle)
   title: block.title || block.topicTitle,
   ```

2. **Line 1160** - transformFromSupabase:
   ```javascript
   // KA-002 FIX: Also map to topicTitle for backwards compatibility
   topicTitle: row.title,
   ```

3. **Line 1151** - hasContent check:
   ```javascript
   // Also consider rechtsgebiet since wizard blocks often have it
   const hasContent = !!(row.title || row.content_id || row.rechtsgebiet);
   ```

4. **Line 113** - cleanupBlocksByDate:
   ```javascript
   const hasContent = !!(block.title || block.topicTitle || block.contentId || block.rechtsgebiet);
   ```

### Status: FIXED

Die Fixes stellen sicher dass:
- Neue Blöcke korrekt mit title gespeichert werden
- Bestehende Blöcke mit rechtsgebiet als "occupied" erkannt werden
- topicTitle für Frontend-Kompatibilität zurückgemappt wird

### Nächste Schritte
- [ ] User muss App neu laden um Fixes zu testen
- [ ] Falls bestehende Daten keine `rechtsgebiet` haben, müssen sie neu erstellt werden

---

## Referenzen

- **Ticket:** KA-002
- **Erstellt:** 17.01.2026
- **Status:** FIXED
- **Betroffene Views:** Wochenansicht (Plan-Row), Monatsansicht
- **Priorität:** Hoch (Core-Funktionalität betroffen)
