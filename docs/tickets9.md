# T9: Wochenansicht Funktionen von Startseite übernehmen

## Übersicht

**Ziel:** Die Wochenansicht (WeekGrid) soll die fortschrittlichen Funktionen vom Zeitplan-Widget der Startseite übernehmen - mit einer Ausnahme: Es bleibt eine 7-Tage-Ansicht.

**Status:** Analyse abgeschlossen

---

## Ist-Zustand Vergleich

### Dateien

| Komponente | Datei | Zeilen |
|------------|-------|--------|
| Startseite Zeitplan (Quelle) | `src/components/dashboard/zeitplan-widget.jsx` | 589 |
| Wochenansicht Grid (Ziel) | `src/features/calendar/components/week-grid.jsx` | 539 |
| Wochenansicht Container | `src/features/calendar/components/week-view.jsx` | 637 |

---

### Feature-Vergleich

| Feature | ZeitplanWidget (Startseite) | WeekGrid (Wochenansicht) | In WeekGrid übernehmen? |
|---------|----------------------------|--------------------------|------------------------|
| **Zeitraum** | 1 Tag (24h) | 7 Tage (Mo-So) | Nein - bleibt 7 Tage |
| **Tasks in Blöcken anzeigen** | Ja (bis 3 Tasks) | Nein | **Ja** |
| **Task-Fortschritt/Progress** | Progress Bar | Nein | **Ja** |
| **Drag-to-Select Zeitraum** | Ja (T4.1) | Nein | **Ja** |
| **Drag & Drop Tasks in Blöcke** | Ja (T5.4) | Nein | **Ja** |
| **Task aus Block entfernen** | Ja (X-Button) | Nein | **Ja** |
| **Aktuelle Zeit Anzeige** | Roter Strich + Punkt | Nein | **Ja** |
| **Auto-Scroll zu aktueller Zeit** | Ja | Nein | **Ja** |
| **Geblockte Zeiträume** | Gestreiftes Muster | Nein | **Ja** |
| **Block-Farben** | Neutral | Typ-spezifisch | Beibehalten (WeekGrid) |
| **Lernplan-Header** | Nein | Ja (Exam-Mode) | Beibehalten (WeekGrid) |
| **Multi-Day Blöcke** | Nein | Ja | Beibehalten (WeekGrid) |

---

## Features die WeekGrid von ZeitplanWidget übernehmen soll

### 1. Tasks in Blöcken anzeigen (Priorität: Hoch)

**ZeitplanWidget Implementation:**
```javascript
// zeitplan-widget.jsx:530-569
{block.tasks && block.tasks.length > 0 && (
  <div className="mt-2 space-y-1">
    {block.tasks.slice(0, 3).map((task, taskIndex) => (
      <div key={task.id || taskIndex} className="flex items-center gap-2 group/task">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onTaskToggle?.(block, task)}
          className="w-3.5 h-3.5 rounded border-neutral-300"
        />
        <span className={`text-xs ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-600'}`}>
          {task.text}
        </span>
        {/* X-Button zum Entfernen */}
        <button
          onClick={() => onRemoveTaskFromBlock?.(block, task)}
          className="opacity-0 group-hover/task:opacity-100 ml-auto"
        >
          <X className="w-3 h-3 text-neutral-400 hover:text-red-500" />
        </button>
      </div>
    ))}
    {block.tasks.length > 3 && (
      <span className="text-xs text-neutral-400">
        +{block.tasks.length - 3} weitere
      </span>
    )}
  </div>
)}
```

**Änderung für WeekGrid:**
- Tasks im Block-Inhalt anzeigen
- Checkbox für Completion-Status
- Thema-Titel als Gruppierung
- "+X weitere" wenn mehr als 3 Tasks

---

### 2. Drag-to-Select Zeitraum (Priorität: Hoch)

**ZeitplanWidget Implementation:**
```javascript
// zeitplan-widget.jsx:168-245
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState(null);
const [dragEnd, setDragEnd] = useState(null);

const handleMouseDown = (e, hour) => {
  setIsDragging(true);
  setDragStart(hour);
  setDragEnd(hour);
};

const handleMouseMove = (e, hour) => {
  if (!isDragging) return;
  setDragEnd(hour);
};

const handleMouseUp = () => {
  if (isDragging && dragStart !== null && dragEnd !== null) {
    const startHour = Math.min(dragStart, dragEnd);
    const endHour = Math.max(dragStart, dragEnd);

    // Kollisionsprüfung
    if (!hasCollision(startHour, endHour)) {
      onTimeRangeSelect?.(startHour, endHour);
    }
  }
  setIsDragging(false);
  setDragStart(null);
  setDragEnd(null);
};
```

**Änderung für WeekGrid:**
- Drag-State pro Tag verwalten
- 15-Minuten-Raster (snap to grid)
- Kollisionserkennung mit bestehenden Blöcken
- Visuelles Overlay während des Draggings (blau = valid, rot = invalid)
- `onTimeRangeSelect(date, startHour, endHour)` Callback

---

### 3. Drag & Drop Tasks in Blöcke (Priorität: Hoch)

**ZeitplanWidget Implementation:**
```javascript
// zeitplan-widget.jsx:405-437
const [{ isOver }, drop] = useDrop({
  accept: ['TASK', 'THEMA'],
  drop: (item, monitor) => {
    const itemType = monitor.getItemType();
    onDropTaskToBlock?.(block, item, item.source, itemType);
  },
  collect: (monitor) => ({
    isOver: monitor.isOver(),
  }),
});

// Visuelles Feedback
<div
  ref={drop}
  className={`... ${isOver ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''}`}
>
```

**Änderung für WeekGrid:**
- react-dnd Integration
- Accept: TASK und THEMA Items
- Hover-Highlight wenn über Block
- `onDropTaskToBlock(block, item, source, type)` Callback

---

### 4. Aktuelle Zeit Anzeige (Priorität: Mittel)

**ZeitplanWidget Implementation:**
```javascript
// zeitplan-widget.jsx:45-57
const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(new Date());
  }, 60000); // Update jede Minute
  return () => clearInterval(interval);
}, []);

// Roter Strich
const timePosition = (currentTime.getHours() + currentTime.getMinutes() / 60) * hourHeight;

<div
  className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
  style={{ top: `${timePosition}px` }}
>
  <div className="w-2 h-2 rounded-full bg-red-500" />
  <div className="flex-1 h-0.5 bg-red-500" />
</div>
```

**Änderung für WeekGrid:**
- Nur für "heute" Spalte anzeigen
- Roter horizontaler Strich mit Punkt
- Position basierend auf aktueller Uhrzeit
- Update jede Minute

---

### 5. Auto-Scroll zu aktueller Zeit (Priorität: Mittel)

**ZeitplanWidget Implementation:**
```javascript
// zeitplan-widget.jsx:76-85
useEffect(() => {
  if (timelineRef.current) {
    const now = new Date();
    const currentHour = now.getHours();
    const scrollPosition = Math.max(0, (currentHour - 2) * hourHeight);
    timelineRef.current.scrollTop = scrollPosition;
  }
}, []);
```

**Änderung für WeekGrid:**
- Bei Mount zu aktueller Zeit scrollen
- 2 Stunden Offset (aktuelle Zeit nicht ganz oben)
- Nur wenn "heute" in der Woche ist

---

### 6. Geblockte Zeiträume Darstellung (Priorität: Niedrig)

**ZeitplanWidget Implementation:**
```javascript
// zeitplan-widget.jsx:440-464
{block.isBlocked && (
  <div className="absolute inset-0 bg-striped opacity-50" />
)}

// CSS für gestreiftes Muster
.bg-striped {
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(0,0,0,0.05) 10px,
    rgba(0,0,0,0.05) 20px
  );
}
```

**Änderung für WeekGrid:**
- Gestreiftes Overlay für geblockte Blöcke
- Lock-Icon
- "Lernzeitraum blockiert" Tooltip

---

## Implementierungsplan

### Phase 1: Tasks in Blöcken anzeigen

**Datei:** `src/features/calendar/components/week-grid.jsx`

1. Block-Rendering erweitern um Task-Liste
2. Checkbox für Task-Completion
3. Thema-Gruppierung
4. "+X weitere" Anzeige
5. Callbacks: `onTaskToggle`, `onRemoveTaskFromBlock`

**Aufwand:** 1-2 Stunden

---

### Phase 2: Aktuelle Zeit Indikator

**Datei:** `src/features/calendar/components/week-grid.jsx`

1. `currentTime` State mit Interval
2. "Heute" Spalte identifizieren
3. Roter Strich + Punkt rendern
4. Korrekte Position berechnen

**Aufwand:** 30-45 min

---

### Phase 3: Auto-Scroll

**Datei:** `src/features/calendar/components/week-grid.jsx`

1. `useRef` für scrollbaren Container
2. `useEffect` für initiales Scrollen
3. Nur wenn "heute" sichtbar

**Aufwand:** 15-20 min

---

### Phase 4: Drag-to-Select Zeitraum

**Datei:** `src/features/calendar/components/week-grid.jsx`

1. Drag-State Management (pro Tag)
2. MouseDown/Move/Up Handler
3. 15-Minuten Snap
4. Kollisionserkennung
5. Visuelles Overlay
6. Callback Integration

**Aufwand:** 2-3 Stunden

---

### Phase 5: Drag & Drop Tasks

**Datei:** `src/features/calendar/components/week-grid.jsx`

1. react-dnd Integration (falls nicht vorhanden)
2. `useDrop` für jeden Block
3. Hover-Highlight
4. Drop-Handler
5. Callback Integration

**Aufwand:** 1-2 Stunden

---

### Phase 6: Geblockte Zeiträume

**Datei:** `src/features/calendar/components/week-grid.jsx`

1. `isBlocked` Flag prüfen
2. Gestreiftes CSS Pattern
3. Lock-Icon + Tooltip

**Aufwand:** 30 min

---

## Visuelles Mockup

### Aktuelles WeekGrid Design

```
┌─────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│     │ Montag  │Dienstag │Mittwoch │Donnerst.│ Freitag │ Samstag │ Sonntag │
├─────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│09:00│┌───────┐│         │         │         │         │         │         │
│     ││Lernen ││         │         │         │         │         │         │
│10:00│└───────┘│         │         │         │         │         │         │
└─────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

### Ziel-Design (mit Startseiten-Features)

```
┌─────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│     │ Montag  │Dienstag │Mittwoch │Donnerst.│ Freitag │ Samstag │ Sonntag │
├─────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│09:00│┌───────┐│         │         │┌───────┐│         │         │         │
│     ││BGB AT ││         │         ││VerwR  ││         │         │         │
│     ││───────││         │         ││───────││         │         │         │
│     ││☐ Task1││         │         ││☑ Task1││         │         │         │
│10:00││☐ Task2││         │         ││☐ Task2││         │         │         │
│     │└───────┘│         │         │└───────┘│         │         │         │
│─────│─────────│─────────│─────────│●════════│─────────│─────────│─────────│ ← Aktuelle Zeit (rot)
│11:00│         │         │         │         │         │         │         │
│     │         │░░░░░░░░░│         │         │         │         │         │ ← Drag Selection
│12:00│         │░░░░░░░░░│         │         │         │         │         │
└─────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

---

## Datenfluss-Änderungen

### Neue Props für WeekGrid

```javascript
<WeekGrid
  // Bestehende Props
  currentDate={currentDate}
  blocks={blocks}
  privateBlocks={privateBlocks}
  onBlockClick={handleBlockClick}
  onSlotClick={handleSlotClick}

  // NEUE Props (von Startseite übernommen)
  onTaskToggle={handleTaskToggle}              // Task Completion ändern
  onRemoveTaskFromBlock={handleRemoveTask}     // Task aus Block entfernen
  onTimeRangeSelect={handleTimeRangeSelect}    // Drag-to-Select
  onDropTaskToBlock={handleDropTask}           // Drag & Drop Task
/>
```

### Neue Callbacks in week-view.jsx

```javascript
// Task Completion Toggle
const handleTaskToggle = useCallback((block, task) => {
  // Update task.completed in CalendarContext
}, []);

// Task aus Block entfernen
const handleRemoveTask = useCallback((block, task) => {
  // Remove task from block, update Themenliste
}, []);

// Drag-to-Select neuer Zeitraum
const handleTimeRangeSelect = useCallback((date, startHour, endHour) => {
  setSelectedDate(date);
  setSelectedTime(`${Math.floor(startHour)}:${(startHour % 1) * 60}`);
  setIsAddDialogOpen(true);
}, []);

// Drop Task auf Block
const handleDropTask = useCallback((block, item, source, type) => {
  // Add task to block.tasks
}, []);
```

---

## Aufwand-Schätzung

| Phase | Beschreibung | Aufwand |
|-------|--------------|---------|
| 1 | Tasks in Blöcken anzeigen | 1-2 h |
| 2 | Aktuelle Zeit Indikator | 30-45 min |
| 3 | Auto-Scroll | 15-20 min |
| 4 | Drag-to-Select Zeitraum | 2-3 h |
| 5 | Drag & Drop Tasks | 1-2 h |
| 6 | Geblockte Zeiträume | 30 min |
| **Gesamt** | | **6-9 Stunden** |

---

## Abhängigkeiten

- T4.1 (Drag-to-Select) - bereits in ZeitplanWidget implementiert
- T5.4 (Drag & Drop Tasks) - bereits in ZeitplanWidget implementiert
- react-dnd Library (bereits im Projekt)
- CalendarContext für Task-Updates

---

## Testfälle

1. **Tasks in Blöcken:**
   - [ ] Tasks werden in Blöcken angezeigt
   - [ ] Checkbox ändert Completion-Status
   - [ ] X-Button entfernt Task aus Block
   - [ ] "+X weitere" bei mehr als 3 Tasks

2. **Aktuelle Zeit:**
   - [ ] Roter Strich nur in "heute" Spalte
   - [ ] Position entspricht aktueller Uhrzeit
   - [ ] Update jede Minute

3. **Auto-Scroll:**
   - [ ] Scrollt zu aktueller Zeit bei Mount
   - [ ] Nur wenn "heute" in der Woche

4. **Drag-to-Select:**
   - [ ] Drag startet bei MouseDown
   - [ ] Visuelles Feedback während Drag
   - [ ] 15-Minuten Raster
   - [ ] Kollisionserkennung funktioniert
   - [ ] Dialog öffnet nach Release

5. **Drag & Drop Tasks:**
   - [ ] Tasks können auf Blöcke gezogen werden
   - [ ] Hover-Highlight bei Drag-Over
   - [ ] Task wird zu Block hinzugefügt

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/features/calendar/components/week-grid.jsx` | Alle neuen Features implementieren |
| `src/features/calendar/components/week-view.jsx` | Neue Callbacks, Props durchreichen |
| `src/contexts/calendar-context.jsx` | Task-Update Funktionen (falls nicht vorhanden) |

---

## Referenzen

- [zeitplan-widget.jsx](../src/components/dashboard/zeitplan-widget.jsx) - Quell-Implementation
- [week-grid.jsx](../src/features/calendar/components/week-grid.jsx) - Ziel-Komponente
- [week-view.jsx](../src/features/calendar/components/week-view.jsx) - Container
