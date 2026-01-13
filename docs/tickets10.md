# T10: Lernplan-Blöcke-Leiste in Wochenansicht

## Übersicht

**Ziel:** Eine neue Leiste in der Wochenansicht einfügen, die die Lernplan-Blöcke aus der Monatsansicht anzeigt (position-basierte Blöcke vom Wizard).

**Position:** Lernplan-Leiste als Zeile 2 (direkt unter dem Wochentag-Header), Multi-Day-Events bleiben Zeile 3.

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

Struktur eines Blocks in `blocksByDate` (vormals `slotsByDate`):

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
  blocksByDate,
  visibleBlocksByDate,  // Gefiltert nach aktiven ContentPlans
  // ...
} = useCalendar();
```

---

## Unterschied: blocksByDate vs. timeBlocksByDate

| Eigenschaft | blocksByDate (Monatsansicht) | timeBlocksByDate (Wochenansicht) |
|-------------|----------------------------|----------------------------------|
| **Erstellung** | Lernplan-Wizard | Manuell vom User |
| **Zeitbasis** | Position (1-4) | Uhrzeit (HH:MM) |
| **Felder** | `position`, `blockSize` | `startTime`, `endTime` |
| **Ansicht** | Monatsansicht Hauptinhalt | Wochenansicht Zeitraster |
| **Typen** | thema, repetition, exam, buffer, vacation, free | theme, lernblock, repetition, exam, private |

---

## Implementierungsplan

### Phase 0: Umbenennung "slots" -> "blocks"

**Ziel:** Alle `slots`-Begriffe in diesem Ticket auf `blocks` umstellen (Code + Doku).

**Betroffen:**
- `slotsByDate` -> `blocksByDate`
- `visibleSlotsByDate` -> `visibleBlocksByDate`
- `lernplanSlots` -> `lernplanBlocks` (für die Monatsansicht-Leiste)
- Variable/Komponenten-Namen: `SlotChip` -> `BlockChip` (oder `LernplanBlockChip`)

**Hinweis:** Im Code bereits umbenannt? Falls ja, Doku/Plan nur anpassen.

---

### Phase 1: Daten in WeekGrid verfügbar machen

**Datei:** `src/features/calendar/components/week-view.jsx`

```javascript
// Bereits vorhanden:
const { blocksByDate, visibleBlocksByDate } = useCalendar();

// NEU: An WeekGrid übergeben
<WeekGrid
  // ... bestehende Props
  lernplanBlocks={visibleBlocksByDate}  // Position-basierte Blöcke
/>
```

**Datei:** `src/features/calendar/components/week-grid.jsx`

```javascript
const WeekGrid = memo(function WeekGrid({
  // ... bestehende Props
  lernplanBlocks = {},  // NEU: Position-basierte Blöcke aus Monatsansicht
}) {
```

---

### Phase 2: Neue Header-Zeile erstellen

**Position:** Zeile 2 direkt nach dem Weekday-Header, Multi-Day-Events sind Zeile 3

```jsx
{/* NEU: Lernplan-Blöcke Leiste (Monatsansicht-Blöcke) */}
{hasLernplanBlocks && (
  <tr className="bg-neutral-50 border-b border-neutral-200">
    {/* Label */}
    <th className="w-10 px-1 border-r border-neutral-200 bg-neutral-50">
      <span className="text-xs text-neutral-600 font-medium">Lernplan</span>
    </th>

    {/* Blöcke pro Tag */}
    {weekDates.map((date, dayIndex) => {
      const dateKey = formatDateKey(date);
      const blocksForDay = lernplanBlocksByDate[dateKey] || [];

      return (
        <th
          key={`slots-${dayIndex}`}
          className="border-r border-neutral-100 last:border-r-0 p-1 font-normal bg-neutral-50 align-top"
        >
          <div className="flex flex-col gap-1">
            {blocksForDay.map(block => (
              <LernplanBlockChip
                key={block.id}
                block={block}
                onClick={() => onLernplanBlockClick?.(block, date)}
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

### Phase 3: LernplanBlockChip Komponente

**Darstellung eines einzelnen Lernplan-Blocks:**

```jsx
const LernplanBlockChip = ({ block, onClick }) => {
  // Farbe basierend auf Rechtsgebiet oder Block-Typ
  const getSlotColor = () => {
    if (block.rechtsgebietId) {
      const colors = getRechtsgebietColor(block.rechtsgebietId);
      return `${colors.bg} ${colors.border} ${colors.text}`;
    }

    const typeColors = {
      repetition: 'bg-purple-100 border-purple-200 text-purple-800',
      exam: 'bg-amber-100 border-amber-200 text-amber-800',
      buffer: 'bg-orange-100 border-orange-200 text-orange-800',
      vacation: 'bg-green-100 border-green-200 text-green-800',
      free: 'bg-neutral-100 border-neutral-200 text-neutral-700',
    };
    return typeColors[block.kind] || 'bg-primary-100 border-primary-200 text-primary-800';
  };

  // Block-Größen-Indikator (1-4 Slots)
  const sizeIndicator = block.blockSize > 1 ? `(${block.blockSize})` : '';

  return (
    <button
      onClick={onClick}
      className={`w-full px-2 py-1 rounded border text-left text-xs truncate
                  hover:opacity-80 transition-opacity cursor-pointer ${getSlotColor()}`}
      title={`${block.unterrechtsgebietLabel || block.kind} ${sizeIndicator}`}
    >
      <div className="flex items-center gap-1">
        <span className="truncate font-medium">
          {block.unterrechtsgebietLabel || BLOCK_TYPE_NAMES[block.kind] || 'Block'}
        </span>
        {block.blockSize > 1 && (
          <span className="text-[10px] opacity-70 flex-shrink-0">
            ({block.blockSize})
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
const lernplanBlocksByDate = useMemo(() => {
  const result = {};

  Object.entries(lernplanBlocks || {}).forEach(([dateKey, blocks]) => {
    // Sortiere nach Position (1, 2, 3, 4)
    result[dateKey] = [...blocks].sort((a, b) =>
      (a.position || 0) - (b.position || 0)
    );
  });

  return result;
}, [lernplanBlocks]);
```

---

### Phase 5: Klick-Interaktion

**Status:** Offen. Soll nur bei vorhandenen Blöcken in der Leiste funktionieren. Detaillierte Analyse nötig, wie man das Monatsansicht-Edit-Dialog sicher öffnet.

```javascript
const handleLernplanBlockClick = (block, date) => {
  // TODO: Analyse, ob Monatsansicht-Dialog hier wiederverwendbar ist
  // Nur ausführen, wenn block existiert (Leiste zeigt nur gefüllte Spalten)
  setSelectedBlock(block);
  setSelectedDate(date);
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

**Entscheidung:** Getrennt lassen.
- Bestehende BUG-023 Leiste bleibt (Exam-Mode, Lernplan-Blöcke als Header-Bar)
- Neue Leiste zusätzlich (immer sichtbar) oberhalb der Multi-Day-Leiste
- Neue Leiste zeigt `visibleBlocksByDate` (Monatsansicht-Blöcke)

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
- CalendarContext mit `visibleBlocksByDate`
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
   - [ ] Leiste erscheint wenn `visibleBlocksByDate` Daten hat
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

1. Wie öffnen wir sicher das Monatsansicht-Edit-Dialog aus der Wochenansicht (Datenmapping, Dialog-Komponente, Context)?
2. Soll die Leiste zusammenklappbar sein?
3. Sollen archivierte ContentPlans ausgeblendet werden? (wahrscheinlich ja → `visibleBlocksByDate`)

---

## Referenzen

- [week-grid.jsx](../src/features/calendar/components/week-grid.jsx) - Ziel-Komponente
- [week-view.jsx](../src/features/calendar/components/week-view.jsx) - Container & Daten
- [calendar-view.jsx](../src/features/calendar/components/calendar-view.jsx) - Monatsansicht Referenz
- [rechtsgebiet-colors.js](../src/utils/rechtsgebiet-colors.js) - Farb-Utility
