# TICKET KA-002: Monatsansicht Block-Farben + Plus-Button Bug

**Typ:** Bug-Fix
**Priorität:** Hoch
**Status:** IMPLEMENTIERT - Warten auf User-Test ✅
**Erstellt:** 2026-01-16
**Aufwand:** Mittel (Root Cause Analyse + 3 Fixes)

---

## 1. Problem-Beschreibung

Nach den Design-Änderungen in KA-001 (Wochenansicht) werden Lernblöcke in der Monatsansicht weiterhin in der alten Pink/Rot-Farbe (`primary-50/100`) angezeigt, obwohl die Wochenansicht bereits auf `neutral-100` umgestellt wurde.

### Symptome:
1. **Blöcke sind pink**: Neue Blöcke in der Monatsansicht erscheinen in `bg-primary-50` (pink/rot)
2. **"Nicht im Lernzeitraum" pink**: Der isOutOfRange-Status verwendet ebenfalls `bg-primary-100`
3. **Inkonsistenz**: Wochenansicht zeigt neutral, Monatsansicht zeigt pink
4. **Plus-Button fehlt**: Bei Tagen mit leerem Array `[]` in `blocksByDate` wird kein Plus-Button angezeigt

---

## 2. Root Cause Analyse

### 2.1 Architektur-Unterschied

Die Monatsansicht und Wochenansicht verwenden **unterschiedliche Komponenten** für Block-Rendering:

| Ansicht | Komponente | Farb-Definition |
|---------|------------|-----------------|
| **Wochenansicht** | `week-grid.jsx` | `BLOCK_COLORS` Konstante (geändert zu neutral) |
| **Monatsansicht** | `learning-session.jsx` | `getBackgroundColor()` Funktion (noch primary) |

### 2.2 Betroffene Datei

**Datei:** `src/features/calendar/components/learning-session.jsx`

**Problem-Stellen:**

```jsx
// Zeile 60 - isOutOfRange (NOCH PINK):
<div className={`bg-primary-100 border-primary-200 rounded px-4.5 py-5 pointer-events-none ${className}`}>

// Zeile 91-92 - Default Color (NOCH PINK):
case 'theme':
case 'lernblock':
default:
  return 'bg-primary-50 border-primary-100'; // Primary für learning
```

### 2.3 Korrekter Wert (aus week-grid.jsx)

In KA-001 wurde `BLOCK_COLORS` in `week-grid.jsx` geändert zu:

```jsx
const BLOCK_COLORS = {
  // Learning blocks (theme/lernblock) - neutral color
  theme: 'bg-neutral-100 border-neutral-200 hover:bg-neutral-50',
  lernblock: 'bg-neutral-100 border-neutral-200 hover:bg-neutral-50',
  // ... andere Typen unverändert
};
```

---

## 3. Implementierung

### 3.1 Fix für isOutOfRange (Zeile 60)

```jsx
// ALT:
<div className={`bg-primary-100 border-primary-200 rounded px-4.5 py-5 pointer-events-none ${className}`}>

// NEU (neutral statt primary):
<div className={`bg-neutral-100 border-neutral-200 rounded px-4.5 py-5 pointer-events-none ${className}`}>
```

### 3.2 Fix für Default-Farbe (Zeile 91-92)

```jsx
// ALT:
case 'theme':
case 'lernblock':
default:
  return 'bg-primary-50 border-primary-100'; // Primary für learning

// NEU (neutral-100 wie week-grid.jsx):
case 'theme':
case 'lernblock':
default:
  return 'bg-neutral-100 border-neutral-200'; // Neutral für learning
```

---

## 4. Betroffene Dateien

| Datei | Änderungen |
|-------|------------|
| `src/features/calendar/components/learning-session.jsx` | 2 Stellen: Zeile 60, Zeile 91-92 |

---

## 5. Wichtiger Hinweis

### Rechtsgebiet-Farben bleiben erhalten!

Die Funktion `getRechtsgebietColor()` (Zeile 70-73) sorgt bereits dafür, dass Blöcke MIT Rechtsgebiet die entsprechende Farbe erhalten (Blau für Zivilrecht, Grün für Öff. Recht, etc.).

Der Fix betrifft nur den **Fallback** wenn:
- Kein `rechtsgebiet` gesetzt ist
- Oder `blockType` nicht spezifisch ist

---

## 6. Vergleich: Vorher/Nachher

| Element | Vorher | Nachher |
|---------|--------|---------|
| Default Block Background | `bg-primary-50` (pink) | `bg-neutral-100` (grau) |
| Default Block Border | `border-primary-100` (pink) | `border-neutral-200` (grau) |
| isOutOfRange Background | `bg-primary-100` (pink) | `bg-neutral-100` (grau) |
| isOutOfRange Border | `border-primary-200` (pink) | `border-neutral-200` (grau) |

---

## 7. Akzeptanzkriterien

- [ ] Neue Lernblöcke in der Monatsansicht erscheinen in neutral (grau) statt pink
- [ ] "Nicht im Lernzeitraum" erscheint in neutral statt pink
- [ ] Blöcke MIT Rechtsgebiet zeigen weiterhin die Rechtsgebiet-Farbe
- [ ] Wochenansicht und Monatsansicht haben konsistente Farben

---

## 8. Test-Checkliste

- [ ] Monatsansicht öffnen
- [ ] Neuen Block erstellen (ohne Rechtsgebiet) → sollte neutral sein
- [ ] Block mit Rechtsgebiet erstellen → sollte Rechtsgebiet-Farbe haben
- [ ] Tag außerhalb Lernzeitraum → sollte neutral sein (nicht pink)
- [ ] Wochenansicht öffnen → gleiche Farben wie Monatsansicht

---

## 9. Abhängigkeiten

- KA-001 (Wochenansicht Design-Anpassung) - bereits implementiert
- `bg-neutral-100` und `border-neutral-200` sind Standard-Tailwind-Klassen

---

## 10. Zusätzliche Beobachtung (kein Fix nötig)

### Plus-Button Logik

Der Plus-Button erscheint nur wenn `freeBlocks > 0`. Das bedeutet:
- Wenn alle 4 Block-Slots belegt sind, wird kein Plus-Button angezeigt
- Dies ist **korrektes Verhalten** (kann keine weiteren Blöcke hinzufügen wenn voll)

Falls der User berichtet, dass Plus-Buttons "verschwunden" sind, könnte dies bedeuten:
1. Die Tage haben bereits 4 Blöcke (korrekt)
2. Oder es gibt ein Data-Issue (blocksByDate enthält unerwartete Daten)

Zur Diagnose: Browser DevTools → Application → Local Storage → `prepwell_calendar_blocks` prüfen

---

## 11. Bug: Plus-Button verschwindet auf bestimmten Tagen

### Beobachtung

Der Plus-Button zum Erstellen neuer Blöcke verschwindet auf bestimmten Tagen (z.B. 14. und 16. Januar), obwohl diese Tage keine sichtbaren Blöcke haben.

### Console-Log Analyse

```
Day clicked: {day: 16, isCurrentMonth: true, learningBlocks: Array(0)}
Day clicked: {day: 14, isCurrentMonth: true, learningBlocks: Array(0)}
```

**Erkenntnis:** `learningBlocks` ist ein leeres Array `[]` statt ein Array mit 4 leeren Blöcken.

---

## 12. WICHTIGE ERKENNTNIS: Farb-Änderungen sind NICHT die Ursache

### Was geändert wurde (nur CSS):

| Datei | Änderung | Daten-Auswirkung |
|-------|----------|------------------|
| `learning-session.jsx` | `bg-primary-*` → `bg-neutral-*` | ❌ Keine |
| `week-grid.jsx` | `BLOCK_COLORS` geändert | ❌ Keine |
| `week-view-header.jsx` | `text-neutral-900` → `text-neutral-950` | ❌ Keine |

**Fazit:** CSS-Farb-Änderungen können KEINE Daten-Korruption verursachen. Das Problem existierte bereits vorher.

---

## 13. ROOT CAUSE ANALYSE: Leere Arrays in localStorage

### 13.1 Datenfluss-Architektur

```
localStorage ('prepwell_calendar_blocks')
    ↓
calendar-context.jsx: blocksByDate (State)
    ↓
calendar-context.jsx: visibleBlocksByDate (gefiltert nach archivierten Content Plans)
    ↓
calendar-view.jsx: displayBlocksByDate
    ↓
UI: Plus-Button ja/nein
```

### 13.2 Der eigentliche Bug: `deleteBlock()` bereinigt nicht

**Datei:** `src/contexts/calendar-context.jsx` (Zeilen 1202-1213)

```jsx
const deleteBlock = useCallback((dateKey, blockId) => {
  const currentBlocks = blocksByDate[dateKey] || [];
  const filteredBlocks = currentBlocks.filter(block => block.id !== blockId);

  const updatedBlocks = {
    ...blocksByDate,
    [dateKey]: filteredBlocks,  // ← BUG: Setzt [] wenn letzter Block gelöscht
  };

  setBlocksByDate(updatedBlocks);
  saveToStorage(STORAGE_KEY_BLOCKS, updatedBlocks);  // ← Persistiert leeres Array!
}, [blocksByDate]);
```

**Problem:** Wenn der letzte Block eines Tages gelöscht wird, bleibt ein leeres Array `[]` im localStorage.

### 13.3 Inkonsistente Bereinigung

| Funktion | Datei | Bereinigt leere Tage? |
|----------|-------|----------------------|
| `deleteBlock` | calendar-context.jsx | ❌ **NEIN** - Bug! |
| `deleteSeriesBlocks` | calendar-context.jsx | ✅ JA |
| `deletePrivateBlock` | calendar-context.jsx | ✅ JA |
| `saveDaySlots` | use-supabase-sync.js | ✅ JA |

### 13.4 Wie leere Arrays entstehen

```
User löscht letzten Block von 2026-01-14
    ↓
deleteBlock() wird aufgerufen
    ↓
filteredBlocks = [] (leeres Array)
    ↓
updatedBlocks = { ..., "2026-01-14": [] }
    ↓
saveToStorage() speichert {"2026-01-14":[]}
    ↓
Nach Seiten-Refresh:
  blocksByDate = { "2026-01-14": [], ... }
    ↓
calendar-view.jsx: displayBlocksByDate["2026-01-14"] = []
    ↓
dayBlocks = [] (truthy, daher kein Fallback zu createDayBlocks)
    ↓
freeBlocks = [].filter(s => s.status === 'empty').length = 0
    ↓
Plus-Button wird NICHT angezeigt
```

### 13.5 Versuchter Fix und warum er nicht funktionierte

**Versuchter Fix in calendar-view.jsx:**
```jsx
const existingBlocks = displayBlocksByDate[dateKey];
const dayBlocks = (existingBlocks && existingBlocks.length > 0)
  ? existingBlocks
  : createDayBlocks(date);
```

**Warum verschlimmert:** Der Fix erstellt neue leere Blöcke für Tage die bereits Daten hatten (aber die Daten waren eben leere Arrays). Das führte zu Inkonsistenzen.

---

## 14. KORREKTER FIX

### Option A: Fix in `deleteBlock()` (Empfohlen)

**Datei:** `src/contexts/calendar-context.jsx`

```jsx
const deleteBlock = useCallback((dateKey, blockId) => {
  const currentBlocks = blocksByDate[dateKey] || [];
  const filteredBlocks = currentBlocks.filter(block => block.id !== blockId);

  const updatedBlocks = { ...blocksByDate };

  if (filteredBlocks.length > 0) {
    updatedBlocks[dateKey] = filteredBlocks;
  } else {
    delete updatedBlocks[dateKey];  // ← FIX: Entferne leeren Tag komplett
  }

  setBlocksByDate(updatedBlocks);
  saveToStorage(STORAGE_KEY_BLOCKS, updatedBlocks);
}, [blocksByDate]);
```

### Option B: localStorage bereinigen (Einmalig)

Browser Console:
```javascript
const data = JSON.parse(localStorage.getItem('prepwell_calendar_blocks') || '{}');
const cleaned = Object.fromEntries(
  Object.entries(data).filter(([k, v]) => Array.isArray(v) && v.length > 0)
);
localStorage.setItem('prepwell_calendar_blocks', JSON.stringify(cleaned));
location.reload();
```

### Option C: Fix in calendar-view.jsx RÜCKGÄNGIG machen

Der Fix in `calendar-view.jsx` behandelt nur das Symptom, nicht die Ursache. Er sollte rückgängig gemacht werden, da er unerwartete Nebenwirkungen hat.

---

## 15. TODO (Erledigt)

- [x] Fix in `calendar-view.jsx` rückgängig machen ✅
- [x] `deleteBlock()` in `calendar-context.jsx` fixen (Option A) ✅
- [x] Bestehende leere Arrays in localStorage bereinigen - **AUTOMATISCH** via `cleanupEmptyArrays()` beim Laden ✅
- [x] Terminology Refactoring: slot → block in `use-supabase-sync.js` ✅
- [x] Fix `visibleBlocksByDate` memo um leere Arrays zu filtern (auch ohne archived plans) ✅
- [ ] Testen ob Plus-Buttons wieder erscheinen (User muss Seite neu laden)

### Automatische Bereinigung (neu hinzugefügt)

**Datei:** `src/hooks/use-supabase-sync.js`

Die Funktion `cleanupEmptyArrays()` entfernt automatisch leere Arrays beim Laden:

```jsx
const cleanupEmptyArrays = (data) => {
  if (!data || typeof data !== 'object') return data;
  const cleaned = {};
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};
```

Diese Funktion wird beim Initialisieren von `useCalendarBlocksSync()` aufgerufen und persistiert die bereinigten Daten automatisch zurück in localStorage.

### Fix in visibleBlocksByDate (2026-01-16)

**Datei:** `src/contexts/calendar-context.jsx`

**Problem:** Wenn `archivedContentPlanIds.size === 0`, wurde `blocksByDate` direkt zurückgegeben ohne leere Arrays zu filtern.

**Fix:**
```jsx
if (archivedContentPlanIds.size === 0) {
  // KA-002 FIX: Still need to filter out empty arrays from blocksByDate
  const cleaned = {};
  Object.entries(blocksByDate).forEach(([dateKey, blocks]) => {
    if (Array.isArray(blocks) && blocks.length > 0) {
      cleaned[dateKey] = blocks;
    }
  });
  return cleaned;
}
```

---

## 16. Terminology Refactoring: slot → block

### Problem

Der Begriff "slot" wird noch an **276 Stellen in 34 Dateien** verwendet, obwohl die offizielle Terminologie "block" ist.

### Betroffene Dateien (Top 10)

| Datei | Anzahl |
|-------|--------|
| `src/hooks/use-supabase-sync.js` | 67 |
| `src/hooks/useStatistics.js` | 46 |
| `src/features/calendar/components/week-grid.jsx` | 16 |
| `src/pages/dashboard.jsx` | 14 |
| `src/services/api.ts` | 11 |
| `src/utils/blockUtils.ts` | 8 |
| `src/features/calendar/components/week-view.jsx` | 8 |
| `src/utils/calendarDataUtils.ts` | 6 |
| `src/types/index.js` | 5 |
| `src/data/templates.js` | 5 |

### Zu ersetzende Begriffe

| Alt | Neu |
|-----|-----|
| `slot` | `block` |
| `Slot` | `Block` |
| `slots` | `blocks` |
| `Slots` | `Blocks` |
| `saveDaySlots` | `saveDayBlocks` |
| `saveAllSlots` | `saveAllBlocks` |
| `clearAllSlots` | `clearAllBlocks` |

### Legacy Aliase behalten

Für Abwärtskompatibilität sollten Legacy-Aliase am Ende der Dateien erhalten bleiben:
```jsx
// Legacy aliases for backwards compatibility
export const saveDaySlots = saveDayBlocks;
export const saveAllSlots = saveAllBlocks;
```
