# T10: Lernplan-Blöcke-Leiste in Wochenansicht

## Übersicht

**Ziel:** Eine neue Leiste in der Wochenansicht einfügen, die die Lernplan-Blöcke aus der Monatsansicht anzeigt (position-basierte Blöcke vom Wizard).

**Position:** Zwischen dem Wochentag-Header und der Multi-Day-Events-Zeile (Private Termine).

---

## Aktuelle Struktur (week-grid.jsx)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: Mo | Di | Mi | Do | Fr | Sa | So                               │ ← Zeile 1
├─────────────────────────────────────────────────────────────────────────┤
│ Multi-Day Events (Private Termine über mehrere Tage)                    │ ← Zeile 2
├─────────────────────────────────────────────────────────────────────────┤
│ Lernplan-Leiste (nur Exam-Mode, BUG-023 FIX)                           │ ← Zeile 3 (optional)
├─────────────────────────────────────────────────────────────────────────┤
│ 00:00 │     │     │     │     │     │     │     │                       │
│ 01:00 │     │     │     │     │     │     │     │                       │
│ ...   │ Time-based Blocks                                               │
│ 23:00 │     │     │     │     │     │     │     │                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Ziel-Struktur

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: Mo | Di | Mi | Do | Fr | Sa | So                               │ ← Zeile 1
├─────────────────────────────────────────────────────────────────────────┤
│ LERNPLAN │ [Block1] │ [Block2] │ [Block3] │ ... │                       │ ← NEU: Zeile 2
├─────────────────────────────────────────────────────────────────────────┤
│ Multi-Day Events (Private Termine über mehrere Tage)                    │ ← Zeile 3
├─────────────────────────────────────────────────────────────────────────┤
│ 00:00 │     │     │     │     │     │     │     │                       │
│ ...   │ Time-based Blocks                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Datenquellen

### Monatsansicht (calendar-view.jsx)

Die Monatsansicht nutzt `blocksByDate` / `visibleBlocksByDate`:

```javascript
// calendar-view.jsx:43-53
const allBlocksByDate = blocksByDate;
const displayBlocksByDate = visibleBlocksByDate || blocksByDate || {};
```

### Position-basierte Blöcke (Lernplan-Wizard)

Struktur eines Blocks in `slotsByDate`:

```javascript
{
  id: string,
  date: 'YYYY-MM-DD',
  position: 1-4,              // Slot-Position im Tag
  blockSize: 1-4,             // Anzahl Slots (Größe)
  kind: 'thema' | 'repetition' | 'exam' | 'buffer' | 'vacation' | 'free',
  contentPlanId: string,      // Referenz zum Content Plan

  // Bei Lernblöcken:
  rechtsgebietId: string,
  unterrechtsgebietId: string,
  rechtsgebietLabel: string,
  unterrechtsgebietLabel: string,

  // Optionale Felder:
  themaId: string,
  themaTitle: string,
  tasks: Array<{id, text, completed}>
}
```

### CalendarContext Zugriff

```javascript
// week-view.jsx:36-37
const {
  slotsByDate,
  visibleSlotsByDate,  // Gefiltert nach aktiven ContentPlans
  // ...
} = useCalendar();
```

---

## Unterschied: slotsByDate vs. timeBlocksByDate

| Eigenschaft | slotsByDate (Monatsansicht) | timeBlocksByDate (Wochenansicht) |
|-------------|----------------------------|----------------------------------|
| **Erstellung** | Lernplan-Wizard | Manuell vom User |
| **Zeitbasis** | Position (1-4) | Uhrzeit (HH:MM) |
| **Felder** | `position`, `blockSize` | `startTime`, `endTime` |
| **Ansicht** | Monatsansicht Hauptinhalt | Wochenansicht Zeitraster |
| **Typen** | thema, repetition, exam, buffer, vacation, free | theme, lernblock, repetition, exam, private |

---

## Implementierungsplan

### Phase 1: Daten in WeekGrid verfügbar machen

**Datei:** `src/features/calendar/components/week-view.jsx`

```javascript
// Bereits vorhanden:
const { slotsByDate, visibleSlotsByDate } = useCalendar();

// NEU: An WeekGrid übergeben
<WeekGrid
  // ... bestehende Props
  lernplanSlots={visibleSlotsByDate}  // Position-basierte Blöcke
/>
```

**Datei:** `src/features/calendar/components/week-grid.jsx`

```javascript
const WeekGrid = memo(function WeekGrid({
  // ... bestehende Props
  lernplanSlots = {},  // NEU: Position-basierte Blöcke aus Monatsansicht
}) {
```

---

### Phase 2: Neue Header-Zeile erstellen

**Position:** Nach Weekday-Header, vor Multi-Day Events

```jsx
{/* NEU: Lernplan-Blöcke Leiste (Monatsansicht-Blöcke) */}
{hasLernplanSlots && (
  <tr className="bg-neutral-50 border-b border-neutral-200">
    {/* Label */}
    <th className="w-10 px-1 border-r border-neutral-200 bg-neutral-50">
      <span className="text-xs text-neutral-600 font-medium">Lernplan</span>
    </th>

    {/* Blöcke pro Tag */}
    {weekDates.map((date, dayIndex) => {
      const dateKey = formatDateKey(date);
      const slotsForDay = lernplanSlotsByDate[dateKey] || [];

      return (
        <th
          key={`slots-${dayIndex}`}
          className="border-r border-neutral-100 last:border-r-0 p-1 font-normal bg-neutral-50 align-top"
        >
          <div className="flex flex-col gap-1">
            {slotsForDay.map(slot => (
              <LernplanSlotChip
                key={slot.id}
                slot={slot}
                onClick={() => onSlotClick?.(slot, date)}
              />
            ))}
          </div>
        </th>
      );
    })}
  </tr>
)}
```

---

### Phase 3: LernplanSlotChip Komponente

**Darstellung eines einzelnen Lernplan-Blocks:**

```jsx
const LernplanSlotChip = ({ slot, onClick }) => {
  // Farbe basierend auf Rechtsgebiet oder Block-Typ
  const getSlotColor = () => {
    if (slot.rechtsgebietId) {
      const colors = getRechtsgebietColor(slot.rechtsgebietId);
      return `bg-${colors.color}-100 border-${colors.color}-200 text-${colors.color}-800`;
    }

    const typeColors = {
      repetition: 'bg-purple-100 border-purple-200 text-purple-800',
      exam: 'bg-amber-100 border-amber-200 text-amber-800',
      buffer: 'bg-orange-100 border-orange-200 text-orange-800',
      vacation: 'bg-green-100 border-green-200 text-green-800',
      free: 'bg-neutral-100 border-neutral-200 text-neutral-700',
    };
    return typeColors[slot.kind] || 'bg-primary-100 border-primary-200 text-primary-800';
  };

  // Block-Größen-Indikator (1-4 Slots)
  const sizeIndicator = slot.blockSize > 1 ? `(${slot.blockSize})` : '';

  return (
    <button
      onClick={onClick}
      className={`w-full px-2 py-1 rounded border text-left text-xs truncate
                  hover:opacity-80 transition-opacity cursor-pointer ${getSlotColor()}`}
      title={`${slot.unterrechtsgebietLabel || slot.kind} ${sizeIndicator}`}
    >
      <div className="flex items-center gap-1">
        <span className="truncate font-medium">
          {slot.unterrechtsgebietLabel || BLOCK_TYPE_NAMES[slot.kind] || 'Block'}
        </span>
        {slot.blockSize > 1 && (
          <span className="text-[10px] opacity-70 flex-shrink-0">
            ({slot.blockSize})
          </span>
        )}
      </div>
    </button>
  );
};
```

---

### Phase 4: Sortierung nach Position

Blöcke sollten nach ihrer Position sortiert werden:

```javascript
const lernplanSlotsByDate = useMemo(() => {
  const result = {};

  Object.entries(lernplanSlots || {}).forEach(([dateKey, slots]) => {
    // Sortiere nach Position (1, 2, 3, 4)
    result[dateKey] = [...slots].sort((a, b) =>
      (a.position || 0) - (b.position || 0)
    );
  });

  return result;
}, [lernplanSlots]);
```

---

### Phase 5: Klick-Interaktion

**Option A: Block-Details anzeigen (Modal)**

```javascript
const handleSlotClick = (slot, date) => {
  // Öffne entsprechenden Manage-Dialog basierend auf Block-Typ
  setSelectedBlock(slot);
  setSelectedDate(date);

  switch (slot.kind) {
    case 'thema':
      setIsManageThemeOpen(true);
      break;
    case 'repetition':
      setIsManageRepetitionOpen(true);
      break;
    case 'exam':
      setIsManageExamOpen(true);
      break;
    default:
      // Info-Toast oder einfaches Modal
      break;
  }
};
```

**Option B: Zur Monatsansicht navigieren**

```javascript
const handleSlotClick = (slot, date) => {
  // Navigiere zur Monatsansicht mit dem Datum
  navigate(`/kalender/monat?date=${formatDateKey(date)}`);
};
```

---

## Visuelles Mockup

### Desktop (7-Tage-Ansicht)

```
┌─────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│     │ Montag  │Dienstag │Mittwoch │Donnerst.│ Freitag │ Samstag │ Sonntag │
│     │ 13. Jan │ 14. Jan │ 15. Jan │ 16. Jan │ 17. Jan │ 18. Jan │ 19. Jan │
├─────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│Lern-│🔵BGB AT │🔵BGB AT │🟢VerwR  │🟢VerwR  │🔴StGB   │         │         │
│plan │   (2)   │         │  (2)    │         │  BT     │         │         │
├─────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│     │ 🟣 Urlaub in München (Mo-Fr)                    │         │         │
├─────┼─────────┴─────────┴─────────┴─────────┴─────────┼─────────┼─────────┤
│08:00│         │         │         │         │         │         │         │
│09:00│┌───────┐│         │         │         │         │         │         │
│     ││Lernen ││         │         │         │         │         │         │
│10:00│└───────┘│         │         │         │         │         │         │
│...  │         │         │         │         │         │         │         │
└─────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

---

## Unterschied zu existierender Lernplan-Leiste (BUG-023)

| Aspekt | Bestehende Leiste (BUG-023) | Neue Leiste (T10) |
|--------|----------------------------|-------------------|
| **Sichtbarkeit** | Nur Exam-Mode | Immer (wenn Blöcke vorhanden) |
| **Datenquelle** | `lernplanBlocks` (transformiert) | `visibleSlotsByDate` (original) |
| **Position** | Nach Multi-Day Events | Vor Multi-Day Events |
| **Farbe Hintergrund** | Blau (`bg-blue-50`) | Neutral (`bg-neutral-50`) |
| **Block-Farben** | Nach Block-Typ | Nach Rechtsgebiet |

### Entscheidung: Zusammenführen oder getrennt?

**Option A: Zusammenführen**
- Eine einzige Lernplan-Leiste
- Immer sichtbar (nicht nur Exam-Mode)
- Zeigt `visibleSlotsByDate` Daten

**Option B: Getrennt lassen**
- Bestehende BUG-023 Leiste bleibt (Exam-Mode)
- Neue Leiste zusätzlich (immer sichtbar)
- Potentiell verwirrend für User

**Empfehlung:** Option A - Zusammenführen und immer anzeigen.

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/features/calendar/components/week-grid.jsx` | Neue Leiste hinzufügen |
| `src/features/calendar/components/week-view.jsx` | Props erweitern, Handler |
| `src/utils/rechtsgebiet-colors.js` | Import für Farben |

---

## Abhängigkeiten

- T-SET-1 (Custom Rechtsgebiet-Farben) - bereits implementiert
- CalendarContext mit `visibleSlotsByDate`
- Bestehende Block-Typ-Farben aus `BLOCK_COLORS`

---

## Aufwand-Schätzung

| Phase | Beschreibung | Aufwand |
|-------|--------------|---------|
| 1 | Daten durchreichen | 15 min |
| 2 | Header-Zeile erstellen | 30 min |
| 3 | SlotChip Komponente | 30 min |
| 4 | Sortierung & Logik | 15 min |
| 5 | Klick-Interaktion | 30 min |
| **Gesamt** | | **~2 Stunden** |

---

## Testfälle

1. **Leiste Sichtbarkeit:**
   - [ ] Leiste erscheint wenn `visibleSlotsByDate` Daten hat
   - [ ] Leiste versteckt wenn keine Lernplan-Blöcke
   - [ ] Leiste erscheint in Normal-Mode UND Exam-Mode

2. **Block-Darstellung:**
   - [ ] Rechtsgebiet-Farben korrekt (Zivilrecht=blau, etc.)
   - [ ] Block-Größe (1-4) wird angezeigt
   - [ ] Unterrechtsgebiet-Name wird angezeigt
   - [ ] Truncation bei langen Namen

3. **Interaktion:**
   - [ ] Klick öffnet entsprechenden Dialog
   - [ ] Hover zeigt Tooltip mit Details
   - [ ] Cursor ändert sich zu Pointer

4. **Sortierung:**
   - [ ] Blöcke nach Position sortiert (1, 2, 3, 4)
   - [ ] Mehrere Blöcke pro Tag korrekt gestapelt

5. **Responsive:**
   - [ ] Scrollbar bei vielen Blöcken pro Tag
   - [ ] Leiste scrollt mit Header (sticky)

---

## Offene Fragen

1. Soll die bestehende BUG-023 Leiste (Exam-Mode only) ersetzt oder ergänzt werden?
2. Welche Interaktion bei Klick auf Block? (Dialog öffnen / Zur Monatsansicht navigieren)
3. Soll die Leiste zusammenklappbar sein?
4. Sollen archivierte ContentPlans ausgeblendet werden? (wahrscheinlich ja → `visibleSlotsByDate`)

---

## Referenzen

- [week-grid.jsx](../src/features/calendar/components/week-grid.jsx) - Ziel-Komponente
- [week-view.jsx](../src/features/calendar/components/week-view.jsx) - Container & Daten
- [calendar-view.jsx](../src/features/calendar/components/calendar-view.jsx) - Monatsansicht Referenz
- [rechtsgebiet-colors.js](../src/utils/rechtsgebiet-colors.js) - Farb-Utility
