# T9: Wochenansicht Funktionen von Startseite übernehmen

## Übersicht

**Ziel:** Die Wochenansicht (WeekGrid) soll die fortschrittlichen Funktionen vom Zeitplan-Widget der Startseite übernehmen - mit einer Ausnahme: Es bleibt eine 7-Tage-Ansicht.

**Status:** ✅ Hauptfeatures implementiert, 6 kleinere Punkte offen

---

## Ist-Zustand Vergleich (Verifiziert am 13.01.2026)

### Dateien

| Komponente | Datei | Zeilen |
|------------|-------|--------|
| Startseite Zeitplan (Quelle) | `src/components/dashboard/zeitplan-widget.jsx` | 588 |
| Wochenansicht Grid (Ziel) | `src/features/calendar/components/week-grid.jsx` | 943 |
| Wochenansicht Container | `src/features/calendar/components/week-view.jsx` | ~635 |

---

### Feature-Vergleich (VERIFIZIERT)

| Feature | ZeitplanWidget | WeekGrid | Status |
|---------|----------------|----------|--------|
| **Zeitraum** | 1 Tag (24h) | 7 Tage (Mo-So) | ✅ OK |
| **Tasks in Blöcken anzeigen** | Checkbox + Liste | Statuspunkt + Liste | ⚠️ Checkbox fehlt |
| **Task-Fortschritt/Progress** | Progress Bar | Progress Bar + Count | ✅ Umgesetzt |
| **Drag-to-Select Zeitraum** | Ja | Ja (15-Min Raster, Kollision) | ⚠️ Endzeit nicht vorbelegt |
| **Drag & Drop Tasks** | react-dnd | HTML5 `dataTransfer` | ✅ Umgesetzt |
| **Task aus Block entfernen** | X-Button | X-Button | ✅ Umgesetzt |
| **Aktuelle Zeit Anzeige** | Roter Strich | Roter Strich (nur heute) | ✅ Umgesetzt |
| **Auto-Scroll** | Zu aktueller Zeit | Zu 08:00 | ✅ Geändert (08:00 default) |
| **Geblockte Zeiträume** | Gestreift + Tooltip | Gestreift + Lock | ⚠️ Tooltip fehlt |
| **Block-Farben** | Neutral | Typ-spezifisch | ✅ Beibehalten |
| **Lernplan-Header** | Nein | Ja (Exam-Mode) | ✅ Beibehalten |
| **Multi-Day Blöcke** | Nein | Ja | ✅ Beibehalten |

---

## Offene Punkte (6 Items)

### 1. Task-Checkbox fehlt (Priorität: MITTEL)

**Problem:** Tasks werden mit Statuspunkt angezeigt, aber es gibt keine klickbare Checkbox zum Togglen des Completion-Status.

**Code-Location:** `week-grid.jsx:896-907`

**Aktuell:**
```jsx
<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
  task.completed ? 'bg-green-500' : 'bg-neutral-400'
}`} />
```

**Soll:**
```jsx
<input
  type="checkbox"
  checked={task.completed}
  onChange={(e) => {
    e.stopPropagation();
    onTaskToggle?.(block, task);
  }}
  className="w-3.5 h-3.5 rounded border-neutral-300 cursor-pointer"
/>
```

---

### 2. "+X weitere" Counter fehlerhaft (Priorität: NIEDRIG)

**Problem:** Der Counter zeigt immer `tasks.length - 3`, auch wenn weniger Tasks wegen Blockhöhe angezeigt werden.

**Code-Location:** `week-grid.jsx:923-926`

**Aktuell:**
```jsx
{block.tasks.length > 3 && (
  <span className="text-xs text-neutral-400">
    +{block.tasks.length - 3} weitere
  </span>
)}
```

**Soll:**
```jsx
{(() => {
  const maxVisible = Math.min(3, Math.floor((blockHeight - 50) / 18));
  const hiddenCount = block.tasks.length - maxVisible;
  return hiddenCount > 0 && (
    <span className="text-xs text-neutral-400">
      +{hiddenCount} weitere
    </span>
  );
})()}
```

---

### 3. Drag-to-Select Endzeit nicht vorbelegt (Priorität: MITTEL)

**Problem:** Nach Drag-to-Select wird nur die Startzeit vorbelegt, nicht die Endzeit.

**Code-Location:** `week-view.jsx:548-557`

**Aktuell:**
```jsx
const handleTimeRangeSelect = (date, startHour, endHour) => {
  setSelectedDate(date);
  const startTime = `${String(Math.floor(startHour)).padStart(2, '0')}:...`;
  const endTime = `${String(Math.floor(endHour)).padStart(2, '0')}:...`; // Berechnet aber nicht gesetzt!
  setSelectedTime(startTime);
  setIsAddDialogOpen(true);
};
```

**Soll:**
```jsx
const handleTimeRangeSelect = (date, startHour, endHour) => {
  setSelectedDate(date);
  const startTime = formatTime(startHour);
  const endTime = formatTime(endHour);
  setSelectedTime(startTime);
  setSelectedEndTime(endTime);  // NEU: Endzeit speichern
  setIsAddDialogOpen(true);
};
```

**Zusätzlich:** `CreatePrivateSessionDialog` muss `initialEndTime` prop unterstützen.

---

### 4. Upward-Clamp fehlt (Priorität: NIEDRIG)

**Problem:** Bei Drag nach oben wird keine minimale Startzeit gefunden, die nicht kollidiert.

**Code-Location:** `week-grid.jsx` - fehlt komplett

**Aktuell:** Nur `findMaxEndWithoutCollision` vorhanden (Zeilen 270-286)

**Soll:** Zusätzlich `findMinStartWithoutCollision` implementieren:
```jsx
const findMinStartWithoutCollision = useCallback((date, endHour) => {
  const dateKey = formatDateKey(date);
  let minStart = 0;
  regularBlocks.forEach(block => {
    if ((block.startDate || block.date) !== dateKey) return;
    if (!block.endTime) return;

    const [endH, endM] = block.endTime.split(':').map(Number);
    const blockEnd = endH + endM / 60;

    if (blockEnd < endHour && blockEnd > minStart) {
      minStart = blockEnd;
    }
  });
  return minStart;
}, [regularBlocks]);
```

---

### 5. Auto-Scroll nur wenn heute in Woche (Priorität: NIEDRIG)

**Problem:** Auto-scroll zu 08:00 läuft auch wenn die angezeigte Woche "heute" nicht enthält.

**Code-Location:** `week-grid.jsx:103-111`

**Aktuell:**
```jsx
useEffect(() => {
  if (scrollContainerRef.current) {
    const scrollToHour = 8;
    const scrollPosition = scrollToHour * hourHeight;
    scrollContainerRef.current.scrollTop = scrollPosition;
  }
}, []);
```

**Soll:**
```jsx
useEffect(() => {
  if (scrollContainerRef.current && getTodayColumnIndex >= 0) {
    // Nur scrollen wenn "heute" in der angezeigten Woche ist
    const scrollToHour = 8;
    const scrollPosition = scrollToHour * hourHeight;
    scrollContainerRef.current.scrollTop = scrollPosition;
  }
}, [getTodayColumnIndex]);
```

---

### 6. Tooltip für blockierte Blöcke fehlt (Priorität: NIEDRIG)

**Problem:** Blockierte Blöcke zeigen nur "Blockiert" Text, kein Hover-Tooltip.

**Code-Location:** `week-grid.jsx:802-827`

**Aktuell:**
```jsx
<span className="text-xs font-medium text-neutral-500">Blockiert</span>
```

**Soll:**
```jsx
<div className="group relative">
  <span className="text-xs font-medium text-neutral-500">Blockiert</span>
  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1
                   bg-neutral-800 text-white text-xs rounded whitespace-nowrap
                   opacity-0 group-hover:opacity-100 transition-opacity z-50">
    Lernzeitraum blockiert
  </span>
</div>
```

---

## Implementierungsplan

### Phase 1: Quick Fixes (30 min)

| # | Task | Datei | Aufwand |
|---|------|-------|---------|
| 1 | "+X weitere" Counter fixen | week-grid.jsx:923 | 5 min |
| 2 | Auto-Scroll Bedingung | week-grid.jsx:103 | 5 min |
| 3 | Blockierte Blöcke Tooltip | week-grid.jsx:818 | 10 min |

### Phase 2: Task-Checkbox (45 min)

| # | Task | Datei | Aufwand |
|---|------|-------|---------|
| 1 | Checkbox statt Statuspunkt | week-grid.jsx:896 | 15 min |
| 2 | `onTaskToggle` callback aufrufen | week-grid.jsx | 10 min |
| 3 | Styling anpassen | week-grid.jsx | 10 min |
| 4 | Testen | - | 10 min |

### Phase 3: Endzeit vorbelegen (1 Stunde)

| # | Task | Datei | Aufwand |
|---|------|-------|---------|
| 1 | `selectedEndTime` State | week-view.jsx | 10 min |
| 2 | `handleTimeRangeSelect` erweitern | week-view.jsx:548 | 10 min |
| 3 | `initialEndTime` prop zu Dialog | create-private-session-dialog.jsx | 20 min |
| 4 | Endzeit im Dialog vorbelegen | create-private-session-dialog.jsx | 15 min |
| 5 | Testen | - | 5 min |

### Phase 4: Upward-Clamp (Optional, 30 min)

| # | Task | Datei | Aufwand |
|---|------|-------|---------|
| 1 | `findMinStartWithoutCollision` | week-grid.jsx | 15 min |
| 2 | In `handleDragEnd` nutzen | week-grid.jsx:315 | 10 min |
| 3 | Testen | - | 5 min |

---

## Geschätzter Gesamtaufwand

| Phase | Aufwand |
|-------|---------|
| Phase 1: Quick Fixes | 30 min |
| Phase 2: Task-Checkbox | 45 min |
| Phase 3: Endzeit vorbelegen | 1 Stunde |
| Phase 4: Upward-Clamp (Optional) | 30 min |
| **Gesamt** | **~2,5 Stunden** |

---

## Abgeschlossene Features

- ✅ Tasks in Blöcken anzeigen (Basis)
- ✅ Progress Bar + Count
- ✅ Task aus Block entfernen (X-Button)
- ✅ Aktuelle Zeit Indikator (roter Strich)
- ✅ Auto-Scroll zu 08:00
- ✅ Drag-to-Select Zeitraum (Basis)
- ✅ Drag & Drop Tasks in Blöcke
- ✅ Geblockte Zeiträume (Gestreift + Lock)
- ✅ Multi-Day Blöcke
- ✅ Lernplan-Header (Exam-Mode)
- ✅ Fixed Header (scrollt nicht mit)

---

## Referenzen

- [week-grid.jsx](../src/features/calendar/components/week-grid.jsx) - Ziel-Komponente
- [week-view.jsx](../src/features/calendar/components/week-view.jsx) - Container
- [zeitplan-widget.jsx](../src/components/dashboard/zeitplan-widget.jsx) - Quell-Implementation
