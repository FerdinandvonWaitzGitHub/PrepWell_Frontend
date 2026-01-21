# Ticket 21: Bug-Analyse Wochenansicht - Drag-to-Select & Zeit-Validierung

**Erstellt:** 2026-01-19
**Priorität:** HOCH
**Status:** Abgeschlossen ✅
**Komponente:** Wochenansicht (Week View)

---

## Zusammenfassung

In der Wochenansicht gibt es kritische Bugs bei der Session-Erstellung:
1. **Die Endzeit kann vor der Startzeit liegen** - keine Validierung verhindert dies
2. **Drag-to-Select** funktioniert grundsätzlich, aber die erzeugten Daten werden in den Dialogen nicht validiert
3. **Negative Dauer** wird durch `Math.max(0.5, ...)` maskiert statt abgelehnt
4. **Zeit-Auswahl ohne 15-Min-Schritte** - Time-Inputs haben kein `step`-Attribut

---

## Betroffene Dateien

| Datei | Funktion | Bug-Relevanz |
|-------|----------|--------------|
| [week-view.jsx](../src/features/calendar/components/week-view.jsx) | State Manager & Dialoge | Controller |
| [week-grid.jsx](../src/features/calendar/components/week-grid.jsx) | Rendering & Drag-to-Select | Drag-Logik |
| [create-private-session-dialog.jsx](../src/features/calendar/components/create-private-session-dialog.jsx) | Private Session erstellen | **Hauptbug** |
| [create-theme-session-dialog.jsx](../src/features/calendar/components/create-theme-session-dialog.jsx) | Lernblock erstellen | **Hauptbug** |
| [manage-private-session-dialog.jsx](../src/features/calendar/components/manage-private-session-dialog.jsx) | Private Session bearbeiten | **Hauptbug** |
| [manage-theme-session-dialog.jsx](../src/features/calendar/components/manage-theme-session-dialog.jsx) | Lernblock bearbeiten | **Hauptbug** |

---

## Architektur-Übersicht

```
CalendarWeekPage (pages/calendar-week.jsx)
  └─ WeekView (controller/state manager)
       ├─ WeekGrid (rendering, drag-to-select)
       │    └─ handleDragEnd() → onTimeRangeSelect()
       │
       └─ Dialoge (Session-Erstellung)
            ├─ CreatePrivateSessionDialog
            ├─ CreateThemeSessionDialog
            ├─ ManagePrivateSessionDialog
            └─ ManageThemeSessionDialog
```

---

## Bug #1: Keine Zeit-Validierung in `calculateDuration()`

### Problem

In allen Session-Dialogen wird die Dauer wie folgt berechnet:

**create-private-session-dialog.jsx:114-120**
```javascript
const calculateDuration = () => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return Math.max(0.5, (endMinutes - startMinutes) / 60);  // ❌ BUG
};
```

### Reproduktion

1. Öffne die Wochenansicht
2. Klicke auf einen Zeitslot um eine neue Session zu erstellen
3. Setze Startzeit auf **14:00**
4. Setze Endzeit auf **10:00** (VOR der Startzeit!)
5. Speichere → Die Session wird mit **0.5h Dauer** erstellt statt abgelehnt zu werden

### Erwartetes Verhalten

- Fehlermeldung: "Die Endzeit muss nach der Startzeit liegen"
- Save-Button deaktiviert bis die Zeiten korrigiert sind

### Betroffene Dateien

| Datei | Zeile | Code |
|-------|-------|------|
| create-private-session-dialog.jsx | 114-120 | `calculateDuration()` |
| create-theme-session-dialog.jsx | 261-267 | `calculateDuration()` |
| manage-private-session-dialog.jsx | 156-162 | `calculateDuration()` |
| manage-theme-session-dialog.jsx | ~150-160 | `calculateDuration()` |

---

## Bug #2: `handleSave()` validiert Zeiten nicht

### Problem

In der `handleSave()`-Funktion wird nicht geprüft, ob `startTime < endTime`:

**create-private-session-dialog.jsx:167-209**
```javascript
const handleSave = () => {
  if (!date || !onSave) return;
  // ❌ KEINE VALIDIERUNG: startTime vs endTime!

  const baseData = {
    id: `private-${Date.now()}`,
    title: title || 'Privater Termin',
    startTime,  // z.B. "14:00"
    endTime,    // z.B. "10:00" - MÖGLICH UND FALSCH!
    duration: calculateDuration(),
    // ...
  };
  onSave(date, baseData);  // Ungültige Daten werden gespeichert!
};
```

### Lösung

```javascript
const handleSave = () => {
  if (!date || !onSave) return;

  // ✅ Zeit-Validierung hinzufügen
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    setError('Die Endzeit muss nach der Startzeit liegen');
    return;
  }

  // ... rest of function
};
```

---

## Bug #3: Mehrtägige Events - nur Datum validiert, nicht Uhrzeit

### Problem

Bei mehrtägigen Events (Wiederholungen) wird nur das Enddatum validiert:

**create-private-session-dialog.jsx:307-310**
```html
<input
  type="date"
  value={endDate}
  onChange={(e) => setEndDate(e.target.value)}
  min={startDate}  <!-- ✅ Validiert nur Datum! -->
  <!-- ❌ KEINE Uhrzeit-Validierung wenn selber Tag! -->
/>
```

### Szenario

1. User wählt Startdatum: **2026-01-19**, Startzeit: **14:00**
2. User wählt Enddatum: **2026-01-19** (selber Tag), Endzeit: **10:00**
3. → `startDate === endDate`, aber `endTime < startTime` wird nicht erkannt!

---

## Bug #4: Time-Inputs erlauben ungültige Kombinationen

### Problem

Die Time-Inputs (`<input type="time">`) haben keine dynamischen Constraints:

**create-theme-session-dialog.jsx:443-449**
```html
<input
  type="time"
  value={startTime}
  onChange={(e) => setStartTime(e.target.value)}
/>
<!-- ❌ endTime Input hat keine min={startTime} Validierung -->
<input
  type="time"
  value={endTime}
  onChange={(e) => setEndTime(e.target.value)}
/>
```

### Lösung

```html
<input
  type="time"
  value={endTime}
  onChange={(e) => setEndTime(e.target.value)}
  min={startTime}  <!-- ✅ HTML5 Validierung -->
  step="900"
/>
```

**Hinweis:** HTML5 `min` bei `type="time"` funktioniert nicht in allen Browsern zuverlässig. Eine JavaScript-Validierung ist zusätzlich erforderlich.

---

## Anforderung #5: Zeit-Auswahl in 15-Minuten-Schritten

### Anforderung

Die Zeitauswahl (Start- und Endzeit) soll nur in **15-Minuten-Schritten** möglich sein (z.B. 08:00, 08:15, 08:30, 08:45).

### Aktueller Zustand

Die Time-Inputs haben aktuell **kein `step`-Attribut**, was bedeutet, dass jede beliebige Minute ausgewählt werden kann (z.B. 08:07, 14:23).

### Lösung

Allen `<input type="time">` das Attribut `step="900"` hinzufügen (900 Sekunden = 15 Minuten):

```html
<input
  type="time"
  value={startTime}
  onChange={(e) => setStartTime(e.target.value)}
  step="900"  <!-- ✅ 15-Minuten-Schritte -->
  className="..."
/>
```

### Betroffene Dateien

| Datei | Zeilen | Inputs |
|-------|--------|--------|
| create-exam-session-dialog.jsx | 294, 303 | startTime, endTime |
| create-theme-session-dialog.jsx | 436, 445 | startTime, endTime |
| create-repetition-session-dialog.jsx | 391, 400 | startTime, endTime |
| manage-exam-session-dialog.jsx | 264, 273 | startTime, endTime |
| manage-theme-session-dialog.jsx | 436, 445 | startTime, endTime |
| manage-repetition-session-dialog.jsx | 379, 388 | startTime, endTime |

**Hinweis:** `create-private-session-dialog.jsx` und `manage-private-session-dialog.jsx` verwenden kein `<input type="time">` - diese müssen separat geprüft werden.

### Konsistenz mit Drag-to-Select

Die Drag-to-Select Funktion in `week-grid.jsx` snapped bereits auf 15-Minuten-Intervalle:

```javascript
// week-grid.jsx:190-195
const yToTime = useCallback((y) => {
  const rawHour = y / hourHeight;
  const snapped = Math.round(rawHour * 4) / 4; // ✅ 15min intervals
  return Math.max(0, Math.min(24, snapped));
}, []);
```

Die Time-Inputs sollten dieselbe Einschränkung haben, um Konsistenz zu gewährleisten.

---

## Drag-to-Select Analyse

### Implementierung

Die Drag-to-Select Funktionalität ist in `week-grid.jsx` implementiert:

**week-grid.jsx:176-181 - State**
```javascript
const [dragState, setDragState] = useState({
  isDragging: false,
  dayIndex: null,
  startY: null,
  currentY: null,
});
```

**week-grid.jsx:479-494 - handleDragStart**
```javascript
const handleDragStart = useCallback((dayIndex, y) => {
  setDragState({
    isDragging: true,
    dayIndex,
    startY: y,
    currentY: y,
  });
}, []);
```

**week-grid.jsx:506-535 - handleDragEnd**
```javascript
const handleDragEnd = useCallback((dayIndex) => {
  if (!dragState.isDragging || dragState.dayIndex !== dayIndex) return;

  // ✅ Math.min/max korrigiert Richtung
  const startTime = yToTime(Math.min(dragState.startY, dragState.currentY));
  const endTime = yToTime(Math.max(dragState.startY, dragState.currentY));

  setDragState({ isDragging: false, dayIndex: null, startY: null, currentY: null });

  // Minimum 15 minutes
  if (endTime - startTime < 0.25) return;

  // ... collision check ...

  onTimeRangeSelect(date, finalStart, finalEnd);
}, [/* deps */]);
```

### Bewertung

Die Drag-to-Select Logik selbst ist **korrekt implementiert**:
- `Math.min/max` stellt sicher, dass Start immer vor End liegt
- Minimum-Dauer von 15 Minuten wird geprüft
- Kollisionserkennung funktioniert

**Das Problem liegt NICHT im Drag-to-Select**, sondern in den **Dialogen**, die die übergebenen Zeiten nicht validieren, wenn der User sie manuell ändert.

---

## Y-zu-Zeit Konvertierung

**week-grid.jsx:190-195**
```javascript
const yToTime = useCallback((y) => {
  const rawHour = y / hourHeight;
  const snapped = Math.round(rawHour * 4) / 4; // 15min intervals
  return Math.max(0, Math.min(24, snapped));
}, []);
```

Diese Funktion ist korrekt und snapped auf 15-Minuten-Intervalle.

---

## Lösungsvorschlag

### 1. Zentrale Validierungsfunktion erstellen

**Neue Datei: `src/utils/time-validation.js`**
```javascript
/**
 * Validiert, dass endTime nach startTime liegt
 * @param {string} startTime - Format "HH:MM"
 * @param {string} endTime - Format "HH:MM"
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTimeRange(startTime, endTime) {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    return {
      valid: false,
      error: 'Die Endzeit muss nach der Startzeit liegen'
    };
  }

  if (endMinutes - startMinutes < 15) {
    return {
      valid: false,
      error: 'Die minimale Dauer beträgt 15 Minuten'
    };
  }

  return { valid: true };
}

/**
 * Berechnet die Dauer in Stunden
 * @throws {Error} wenn endTime <= startTime
 */
export function calculateDuration(startTime, endTime) {
  const validation = validateTimeRange(startTime, endTime);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM - startH * 60 - startM) / 60;
}
```

### 2. In allen Dialogen verwenden

```javascript
import { validateTimeRange, calculateDuration } from '@/utils/time-validation';

// In der Komponente:
const [timeError, setTimeError] = useState(null);

useEffect(() => {
  const validation = validateTimeRange(startTime, endTime);
  setTimeError(validation.valid ? null : validation.error);
}, [startTime, endTime]);

const handleSave = () => {
  const validation = validateTimeRange(startTime, endTime);
  if (!validation.valid) {
    setTimeError(validation.error);
    return;
  }
  // ... proceed with save
};
```

### 3. UI-Feedback hinzufügen

```jsx
{timeError && (
  <div className="text-red-500 text-sm mt-1">
    {timeError}
  </div>
)}

<button
  onClick={handleSave}
  disabled={!!timeError}  // Button deaktivieren bei Fehler
  className={cn(
    "...",
    timeError && "opacity-50 cursor-not-allowed"
  )}
>
  Speichern
</button>
```

---

## Akzeptanzkriterien

### Zeit-Validierung (Bugs #1-4)
- [x] User kann keine Session erstellen, bei der Endzeit <= Startzeit
- [x] Fehlermeldung wird angezeigt, wenn Endzeit <= Startzeit
- [x] Save-Button ist deaktiviert bei ungültiger Zeitkombination
- [x] Validierung funktioniert in allen Dialog-Komponenten:
  - [x] CreatePrivateSessionDialog
  - [x] CreateThemeSessionDialog
  - [x] CreateExamSessionDialog
  - [x] CreateRepetitionSessionDialog
  - [x] ManagePrivateSessionDialog
  - [x] ManageThemeSessionDialog
  - [x] ManageExamSessionDialog
  - [x] ManageRepetitionSessionDialog
- [x] Bei mehrtägigen Events: Validierung berücksichtigt Datum + Uhrzeit
- [x] Minimum-Dauer von 15 Minuten wird eingehalten

### 15-Minuten-Schritte (Anforderung #5)
- [x] Time-Inputs erlauben nur 15-Minuten-Schritte (00, 15, 30, 45)
- [x] `step="900"` in allen 6 Dialog-Dateien mit `<input type="time">`:
  - [x] create-exam-session-dialog.jsx
  - [x] create-theme-session-dialog.jsx
  - [x] create-repetition-session-dialog.jsx
  - [x] manage-exam-session-dialog.jsx
  - [x] manage-theme-session-dialog.jsx
  - [x] manage-repetition-session-dialog.jsx
- [x] Konsistenz mit Drag-to-Select (bereits 15-min snapping)

---

## Geschätzter Aufwand

- Zentrale Validierungsfunktion: Klein
- Integration in 4 Dialoge: Mittel
- UI-Feedback: Klein
- Tests: Mittel

---

## Referenzen

- [PRD.md §3.1](../PRD.md) - Session vs. BlockAllocation Architektur
- [week-view.jsx](../src/features/calendar/components/week-view.jsx)
- [week-grid.jsx](../src/features/calendar/components/week-grid.jsx)

---

## Implementierte Änderungen (2026-01-19)

### Neue Dateien
- [src/utils/time-validation.js](../src/utils/time-validation.js) - Zentrale Validierungsfunktion

### Geänderte Dateien

| Datei | Änderungen |
|-------|------------|
| create-exam-session-dialog.jsx | `step="900"`, timeError State, Validierungs-useEffect, UI-Fehlermeldung |
| create-theme-session-dialog.jsx | `step="900"`, timeError State, Validierungs-useEffect, UI-Fehlermeldung |
| create-repetition-session-dialog.jsx | `step="900"`, timeError State, Validierungs-useEffect, UI-Fehlermeldung |
| manage-exam-session-dialog.jsx | `step="900"`, timeError State, Validierungs-useEffect, UI-Fehlermeldung |
| manage-theme-session-dialog.jsx | `step="900"`, timeError State, Validierungs-useEffect, UI-Fehlermeldung |
| manage-repetition-session-dialog.jsx | `step="900"`, timeError State, Validierungs-useEffect, UI-Fehlermeldung |

### Private-Session-Dialoge (2026-01-19 - Abgeschlossen)

| Datei | Änderungen |
|-------|------------|
| create-private-session-dialog.jsx | validateTimeRange Import, timeError State, Validierungs-useEffect mit Multi-Day-Support, 15-min Intervalle in generateTimeOptions(), UI-Fehlermeldung, disabled Button |
| manage-private-session-dialog.jsx | validateTimeRange Import, timeError State, Validierungs-useEffect mit Multi-Day-Support, 15-min Intervalle in generateTimeOptions(), UI-Fehlermeldung, disabled Button |

**Besonderheit:** Diese Dialoge verwenden `<select>` statt `<input type="time">`, daher wurde `generateTimeOptions()` von 5-min auf 15-min Intervalle umgestellt.

### Mehrtägige Events Validierung (2026-01-19 - Abgeschlossen)

Die Validierung prüft nun beide Fälle:

1. **Selber Tag:** Endzeit muss nach Startzeit liegen (mit 15-min Minimum)
2. **Verschiedene Tage:** Enddatum muss nach Startdatum liegen

```javascript
// Validierungs-Logik:
if (startDate === endDate) {
  // Selber Tag → Zeit-Validierung
  const validation = validateTimeRange(startTime, endTime);
  setTimeError(validation.valid ? null : validation.error);
} else if (startDate < endDate) {
  // Verschiedene Tage, End > Start → OK
  setTimeError(null);
} else {
  // Enddatum vor Startdatum → Fehler
  setTimeError('Das Enddatum muss nach dem Startdatum liegen');
}
```

---

## Bug #6: Startzeit wird nicht vom Drag-Select übernommen (BEHOBEN)

**Status:** BEHOBEN ✅
**Gemeldet:** 2026-01-19
**Behoben:** 2026-01-19

### Problem

Beim Drag-to-Select in der Wochenansicht wurde die **Startzeit** (nicht Startdatum) nicht korrekt übernommen. Stattdessen wurde immer `09:00` als Default verwendet.

### Ursache: Prop-Name-Mismatch

Die Dialoge erwarteten unterschiedliche Prop-Namen:

| Dialog | Erwartet | Übergeben | Status |
|--------|----------|-----------|--------|
| create-private-session-dialog.jsx | `initialTime` | `initialTime` | ✅ OK |
| create-theme-session-dialog.jsx | `initialStartTime` | `initialTime` | ❌ Bug |
| create-exam-session-dialog.jsx | `initialStartTime` | `initialTime` | ❌ Bug |
| create-repetition-session-dialog.jsx | `initialStartTime` | `initialTime` | ❌ Bug |

**Konsequenz:** Da `initialTime` übergeben wurde, aber `initialStartTime` erwartet war, war der Wert `undefined` und der Fallback `'09:00'` wurde verwendet:

```javascript
// create-theme-session-dialog.jsx:92
setStartTime(initialStartTime || '09:00');  // initialStartTime war undefined!
```

### Lösung

In `week-view.jsx` wurden die Prop-Namen korrigiert:

```diff
// week-view.jsx - CreateThemeSessionDialog
- initialTime={selectedTime}
+ initialStartTime={selectedTime}

// week-view.jsx - CreateRepetitionSessionDialog
- initialTime={selectedTime}
+ initialStartTime={selectedTime}

// week-view.jsx - CreateExamSessionDialog
- initialTime={selectedTime}
+ initialStartTime={selectedTime}
```

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| week-view.jsx:703 | `initialTime` → `initialStartTime` für CreateThemeSessionDialog |
| week-view.jsx:714 | `initialTime` → `initialStartTime` für CreateRepetitionSessionDialog |
| week-view.jsx:725 | `initialTime` → `initialStartTime` für CreateExamSessionDialog |

### Ursprüngliche Analyse (archiviert)

### Datenfluss-Analyse

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ SCHRITT 1: week-grid.jsx - handleDragEnd (Zeile 517-533)                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ const date = weekDates[dayIndex];  // ✓ Date-Object vom Grid                 │
│ onTimeRangeSelect(date, finalStart, finalEnd);  // ✓ Korrekt übergeben       │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ SCHRITT 2: week-view.jsx - handleTimeRangeSelect (Zeile 553-563)             │
├──────────────────────────────────────────────────────────────────────────────┤
│ setSelectedDate(date);         // State-Update                               │
│ setSelectedTime(startTime);    // "09:15" Format                             │
│ setSelectedEndTime(endTime);   // "11:30" Format                             │
│ setIsAddDialogOpen(true);      // Öffnet Block-Typ-Auswahl                   │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ SCHRITT 3: AddThemeDialog - User wählt "Privat"                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ handleSelectBlockType('private') wird aufgerufen (Zeile 318-336)             │
│   → setIsAddDialogOpen(false);                                               │
│   → setIsCreatePrivateOpen(true);                                            │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ SCHRITT 4: CreatePrivateSessionDialog - Props (Zeile 731-738)                │
├──────────────────────────────────────────────────────────────────────────────┤
│ <CreatePrivateSessionDialog                                                  │
│   date={selectedDate}           // Date-Object                               │
│   initialTime={selectedTime}    // "09:15"                                   │
│   initialEndTime={selectedEndTime}  // "11:30"                               │
│ />                                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ SCHRITT 5: create-private-session-dialog.jsx - useEffect (Zeile 74-98)       │
├──────────────────────────────────────────────────────────────────────────────┤
│ useEffect(() => {                                                            │
│   if (open && date) {                                                        │
│     setStartDate(formatDateForInput(date));  // ⚠️ HIER KÖNNTE BUG SEIN     │
│     setStartTime(initialTime || '09:00');                                    │
│     setEndDate(formatDateForInput(date));                                    │
│     if (initialEndTime) {                                                    │
│       setEndTime(initialEndTime);                                            │
│     } // ...                                                                 │
│   }                                                                          │
│ }, [open, date, initialTime, initialEndTime]);                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mögliche Ursachen

#### Hypothese 1: Timing-Problem bei State-Batching

```javascript
// week-view.jsx:318-335 - handleSelectBlockType
const handleSelectBlockType = (type) => {
  setIsAddDialogOpen(false);  // State 1
  switch (type) {
    case 'private':
      setIsCreatePrivateOpen(true);  // State 2
      break;
  }
};
```

React batcht diese State-Updates. Der Dialog könnte geöffnet werden, bevor `selectedDate` aus dem vorherigen `handleTimeRangeSelect` vollständig propagiert ist.

#### Hypothese 2: useEffect Dependency Timing

```javascript
// create-private-session-dialog.jsx:74-98
useEffect(() => {
  if (open && date) {
    setStartDate(formatDateForInput(date));
    // ...
  }
}, [open, date, initialTime, initialEndTime]);
```

Wenn `open` auf `true` wechselt, aber `date` noch den alten Wert hat (oder `null`), wird das Datum nicht korrekt gesetzt.

#### Hypothese 3: weekDates Berechnung

```javascript
// week-grid.jsx:230-241
const weekDates = useMemo(() => {
  const date = new Date(currentDate);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));  // ⚠️ Mutiert 'date'

  return Array.from({ length: 7 }, (_, i) => {
    const weekDate = new Date(monday);
    weekDate.setDate(monday.getDate() + i);
    return weekDate;
  });
}, [currentDate]);
```

Die Zeile `new Date(date.setDate(diff))` mutiert das ursprüngliche `date`-Objekt. Das könnte zu unerwarteten Nebenwirkungen führen.

### Stellen die `setSelectedDate` aufrufen

| Zeile | Funktion | Kontext |
|-------|----------|---------|
| 290 | `handleBlockClick` | Klick auf existierenden Block |
| 312 | `handleTimeBlockClick` | Klick auf leeren Zeitslot |
| 554 | `handleTimeRangeSelect` | Drag-to-Select |

### Zu prüfende Stellen

1. **week-grid.jsx:517** - Wird `weekDates[dayIndex]` korrekt aufgelöst?
2. **week-view.jsx:554** - Ist `date` zum Zeitpunkt des Aufrufs das richtige Date-Object?
3. **week-view.jsx:734** - Hat `selectedDate` den korrekten Wert, wenn der Dialog öffnet?
4. **create-private-session-dialog.jsx:79** - Verarbeitet `formatDateForInput(date)` das Datum korrekt?

### Reproduktionsschritte

1. Öffne Wochenansicht
2. Drag-to-Select auf einem Tag (z.B. Mittwoch, 09:00-11:00)
3. Wähle "Privater Termin" im Auswahldialog
4. **Erwartung:** Startdatum = Mittwoch
5. **Tatsächlich:** Startdatum ist ein anderer Tag (oder heute?)

### Nächste Schritte

1. Console-Logs hinzufügen um den Datenfluss zu tracen:
   ```javascript
   // week-grid.jsx
   console.log('[handleDragEnd] date:', date, 'dayIndex:', dayIndex);

   // week-view.jsx
   console.log('[handleTimeRangeSelect] received date:', date);
   console.log('[handleSelectBlockType] selectedDate:', selectedDate);

   // create-private-session-dialog.jsx
   console.log('[useEffect] open:', open, 'date:', date);
   ```

2. Prüfen ob das Problem nur bei "Privat" oder bei allen Block-Typen auftritt

3. Testen ob das Problem auch bei direktem Klick (ohne Drag) auftritt

---

## Status: VOLLSTÄNDIG IMPLEMENTIERT ✅

- ✅ Zeit-Validierung (Bugs #1-4)
- ✅ 15-Minuten-Schritte (Anforderung #5)
- ✅ Startzeit bei Drag-to-Select (Bug #6) - BEHOBEN

Alle Akzeptanzkriterien sind erfüllt. Das Ticket kann geschlossen werden.
