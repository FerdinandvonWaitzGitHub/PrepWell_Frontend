# TICKET KA-002: Wochenansicht Block-Überlappung

**Typ:** Feature (Funktionserweiterung)
**Priorität:** Mittel
**Status:** Offen
**Erstellt:** 2026-01-16
**Aufwand:** 3-4h

---

## 1. Problem-Beschreibung

Aktuell werden Sessions/Blöcke in der Wochenansicht immer mit voller Breite gerendert (`left-2 right-2`). Wenn zwei Blöcke sich zeitlich überlappen, werden sie übereinander gestapelt und verdecken sich gegenseitig.

**Gewünschtes Verhalten:** Überlappende Blöcke sollen nebeneinander angezeigt werden (wie in Google Calendar, Outlook, etc.).

---

## 2. Aktueller Code (week-grid.jsx)

```jsx
// Zeile 957-968: Block wird immer mit voller Breite gerendert
<div
  key={block.id}
  className={`absolute left-2 right-2 rounded-[5px] ...`}
  style={{
    top: `${blockTopPx + 4}px`,
    height: `${blockHeight}px`,
  }}
>
```

**Problem:** `left-2 right-2` bedeutet volle Breite minus 8px Padding auf jeder Seite.

---

## 3. Lösungsansatz: Column-Based Layout

### 3.1 Konzept

```
VORHER (Überlappung):          NACHHER (Nebeneinander):
┌─────────────────────┐        ┌──────────┬──────────┐
│ Block A (09-11)     │        │ Block A  │ Block B  │
│                     │        │ (09-11)  │ (10-12)  │
├─────────────────────┤        │          │          │
│ Block B (10-12)     │        │          │          │
│ (verdeckt Block A!) │        └──────────┤          │
└─────────────────────┘                   └──────────┘
```

### 3.2 Algorithmus (Google Calendar Style)

1. **Sortiere** alle Blöcke eines Tages nach Startzeit
2. **Erkenne Cluster** - Gruppen von überlappenden Blöcken
3. **Weise Spalten zu** - Greedy Column Assignment
4. **Berechne Layout** - width und left Position pro Block

---

## 4. Implementierungsplan

### Phase 1: Überlappungs-Erkennung

**Neue Helper-Funktion in week-grid.jsx:**

```jsx
/**
 * Prüft ob zwei Blöcke sich zeitlich überlappen
 */
const blocksOverlap = (blockA, blockB) => {
  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const startA = parseTime(blockA.startTime);
  const endA = parseTime(blockA.endTime);
  const startB = parseTime(blockB.startTime);
  const endB = parseTime(blockB.endTime);

  // Überlappung: A startet vor B endet UND B startet vor A endet
  return startA < endB && startB < endA;
};
```

### Phase 2: Cluster-Bildung

**Funktion zum Gruppieren überlappender Blöcke:**

```jsx
/**
 * Gruppiert Blöcke in überlappende Cluster
 * @returns Array von Clustern, jeder Cluster ist ein Array von Blöcken
 */
const groupOverlappingBlocks = (blocks) => {
  if (blocks.length === 0) return [];

  // Sortiere nach Startzeit
  const sorted = [...blocks].sort((a, b) => {
    const parseTime = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    return parseTime(a.startTime) - parseTime(b.startTime);
  });

  const clusters = [];
  let currentCluster = [sorted[0]];
  let clusterEnd = parseTimeToMinutes(sorted[0].endTime);

  for (let i = 1; i < sorted.length; i++) {
    const block = sorted[i];
    const blockStart = parseTimeToMinutes(block.startTime);

    if (blockStart < clusterEnd) {
      // Block überlappt mit aktuellem Cluster
      currentCluster.push(block);
      clusterEnd = Math.max(clusterEnd, parseTimeToMinutes(block.endTime));
    } else {
      // Neuer Cluster beginnt
      clusters.push(currentCluster);
      currentCluster = [block];
      clusterEnd = parseTimeToMinutes(block.endTime);
    }
  }
  clusters.push(currentCluster);

  return clusters;
};
```

### Phase 3: Spalten-Zuweisung (Greedy)

**Funktion zum Zuweisen von Spalten innerhalb eines Clusters:**

```jsx
/**
 * Weist jedem Block in einem Cluster eine Spalte zu
 * @returns Map von blockId → { columnIndex, totalColumns }
 */
const assignColumns = (cluster) => {
  const parseTime = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  // Sortiere nach Startzeit, dann nach Endzeit (längste zuerst)
  const sorted = [...cluster].sort((a, b) => {
    const startDiff = parseTime(a.startTime) - parseTime(b.startTime);
    if (startDiff !== 0) return startDiff;
    return parseTime(b.endTime) - parseTime(a.endTime); // Längere zuerst
  });

  const columns = []; // Array von { endTime: number }
  const assignments = new Map();

  for (const block of sorted) {
    const blockStart = parseTime(block.startTime);
    const blockEnd = parseTime(block.endTime);

    // Finde erste verfügbare Spalte
    let columnIndex = columns.findIndex(col => col.endTime <= blockStart);

    if (columnIndex === -1) {
      // Neue Spalte erstellen
      columnIndex = columns.length;
      columns.push({ endTime: blockEnd });
    } else {
      // Existierende Spalte aktualisieren
      columns[columnIndex].endTime = blockEnd;
    }

    assignments.set(block.id, { columnIndex });
  }

  // Setze totalColumns für alle Blöcke im Cluster
  const totalColumns = columns.length;
  for (const [blockId, assignment] of assignments) {
    assignment.totalColumns = totalColumns;
  }

  return assignments;
};
```

### Phase 4: Layout-Berechnung

**Neue Funktion zum Berechnen der Block-Layouts:**

```jsx
/**
 * Berechnet Layout-Informationen für alle Blöcke eines Tages
 * @returns Map von blockId → { left, width, columnIndex, totalColumns }
 */
const calculateBlockLayouts = useMemo(() => {
  const layoutMap = new Map();

  weekDates.forEach((date) => {
    const dateKey = formatDateKey(date);
    const dayBlocks = regularBlocks.filter(block => {
      const blockDate = block.startDate || block.date;
      return blockDate === dateKey && block.startTime;
    });

    if (dayBlocks.length === 0) return;

    // Gruppiere in Cluster
    const clusters = groupOverlappingBlocks(dayBlocks);

    // Weise Spalten zu für jeden Cluster
    for (const cluster of clusters) {
      const assignments = assignColumns(cluster);

      for (const [blockId, { columnIndex, totalColumns }] of assignments) {
        const gap = 4; // px zwischen Blöcken
        const containerPadding = 8; // px (left-2 = 8px)

        // Berechne Breite und Position
        const availableWidth = 100; // Prozent
        const columnWidth = availableWidth / totalColumns;

        layoutMap.set(blockId, {
          columnIndex,
          totalColumns,
          // CSS-Werte für Style
          left: `calc(${columnIndex * columnWidth}% + ${containerPadding}px + ${columnIndex > 0 ? gap/2 : 0}px)`,
          width: `calc(${columnWidth}% - ${containerPadding * 2 / totalColumns}px - ${gap}px)`,
        });
      }
    }
  });

  return layoutMap;
}, [regularBlocks, weekDates]);
```

### Phase 5: Block-Rendering aktualisieren

**Änderung in der Block-Render-Loop (Zeile 957-968):**

```jsx
// VORHER:
<div
  key={block.id}
  className={`absolute left-2 right-2 rounded-[5px] ...`}
  style={{
    top: `${blockTopPx + 4}px`,
    height: `${blockHeight}px`,
  }}
>

// NACHHER:
const layout = calculateBlockLayouts.get(block.id) || {
  left: '8px',
  width: 'calc(100% - 16px)',
};

<div
  key={block.id}
  className={`absolute rounded-[5px] ...`}  // Kein left-2 right-2 mehr!
  style={{
    top: `${blockTopPx + 4}px`,
    height: `${blockHeight}px`,
    left: layout.left,
    width: layout.width,
  }}
>
```

---

## 5. Visuelle Beispiele

### 5.1 Keine Überlappung (1 Spalte)

```
│ 09:00 ├────────────────────────┤
│       │ Meeting (09:00-10:00)  │
│ 10:00 ├────────────────────────┤
│       │                        │
│ 11:00 ├────────────────────────┤
│       │ Lernen (11:00-12:00)   │
│ 12:00 └────────────────────────┘
```

### 5.2 Zwei überlappende Blöcke (2 Spalten, je 50%)

```
│ 09:00 ├───────────┬────────────┤
│       │ Meeting   │ Call       │
│       │ (09-11)   │ (09:30-10) │
│ 10:00 │           ├────────────┤
│       │           │            │
│ 11:00 └───────────┴────────────┘
```

### 5.3 Drei überlappende Blöcke (3 Spalten, je 33%)

```
│ 09:00 ├───────┬───────┬────────┤
│       │ A     │ B     │ C      │
│       │(09-11)│(09-10)│(09:30) │
│ 10:00 │       ├───────┼────────┤
│       │       │       │        │
│ 11:00 └───────┴───────┴────────┘
```

### 5.4 Komplexer Fall (unterschiedliche Spaltenanzahl)

```
│ 09:00 ├───────────┬────────────┤
│       │ A (09-11) │ B (09-10)  │
│ 10:00 │           ├────────────┤
│       │           │            │
│ 11:00 ├───────────┴────────────┤
│       │ C (11-12) - volle Breite
│ 12:00 └────────────────────────┘
```

---

## 6. Code-Struktur nach Implementierung

```
week-grid.jsx
├── Helper Functions (NEU)
│   ├── parseTimeToMinutes(timeStr)
│   ├── blocksOverlap(blockA, blockB)
│   ├── groupOverlappingBlocks(blocks)
│   └── assignColumns(cluster)
│
├── useMemo Hooks
│   ├── weekDates (existiert)
│   ├── allBlocks (existiert)
│   ├── regularBlocks (existiert)
│   └── calculateBlockLayouts (NEU)
│
└── Render
    └── dayBlocks.map() mit layout.left/width statt left-2 right-2
```

---

## 7. Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Keine Überlappung | Block erhält volle Breite (wie bisher) |
| Block ohne endTime | Fallback auf 1h Dauer |
| Viele Überlappungen (>4) | Blöcke werden sehr schmal - Mindestbreite beachten |
| Gleiche Start- und Endzeit | Als überlappend behandeln |
| Multi-Day Blöcke | Werden separat in Multi-Day Row gehandelt (nicht betroffen) |
| Blocked Time Slots | Erhalten ebenfalls Layout-Berechnung |

---

## 8. Performance-Überlegungen

| Aspekt | Lösung |
|--------|--------|
| Neuberechnung bei jedem Render | `useMemo` mit `regularBlocks` und `weekDates` als Dependencies |
| Viele Blöcke | O(n log n) durch Sortierung, O(n) für Cluster-Bildung |
| Häufige Updates | Layout nur neu berechnet wenn Blöcke sich ändern |

---

## 9. Akzeptanzkriterien

### 9.1 Funktionale Anforderungen
- [ ] Zwei überlappende Blöcke werden nebeneinander (je 50%) angezeigt
- [ ] Drei überlappende Blöcke werden nebeneinander (je 33%) angezeigt
- [ ] Nicht-überlappende Blöcke haben volle Breite
- [ ] Komplexe Überlappungen (A überlappt B, B überlappt C, aber A überlappt nicht C) werden korrekt behandelt
- [ ] Blocked Time Slots werden ebenfalls korrekt layoutet

### 9.2 Keine Regression
- [ ] Drag-to-Select funktioniert weiterhin
- [ ] Block Click öffnet weiterhin Dialog
- [ ] Task Toggle/Remove funktioniert weiterhin
- [ ] Current Time Indicator ist korrekt positioniert
- [ ] Multi-Day Events sind nicht betroffen

### 9.3 Visuelle Anforderungen
- [ ] Mindestens 2px Gap zwischen nebeneinander liegenden Blöcken
- [ ] Blöcke sind nicht zu schmal (min-width bei vielen Überlappungen)
- [ ] Responsive bei verschiedenen Bildschirmbreiten

---

## 10. Test-Szenarien

### 10.1 Manuelle Tests

| Test | Erwartetes Ergebnis |
|------|---------------------|
| 1 Block erstellen | Volle Breite |
| 2 überlappende Blöcke erstellen | Je 50% Breite, nebeneinander |
| 3 überlappende Blöcke erstellen | Je 33% Breite, nebeneinander |
| Block A (09-11), Block B (11-12) erstellen | Beide volle Breite (keine Überlappung) |
| Block verschieben sodass Überlappung entsteht | Layout passt sich an |
| Block löschen aus Überlappung | Verbleibende Blöcke erhalten mehr Breite |

### 10.2 Automatisierte Tests (optional)

```javascript
// Test: groupOverlappingBlocks
test('erkennt überlappende Blöcke', () => {
  const blocks = [
    { id: 'a', startTime: '09:00', endTime: '11:00' },
    { id: 'b', startTime: '10:00', endTime: '12:00' },
    { id: 'c', startTime: '14:00', endTime: '15:00' },
  ];
  const clusters = groupOverlappingBlocks(blocks);
  expect(clusters.length).toBe(2);
  expect(clusters[0].length).toBe(2); // a und b
  expect(clusters[1].length).toBe(1); // c
});

// Test: assignColumns
test('weist Spalten korrekt zu', () => {
  const cluster = [
    { id: 'a', startTime: '09:00', endTime: '11:00' },
    { id: 'b', startTime: '10:00', endTime: '12:00' },
  ];
  const assignments = assignColumns(cluster);
  expect(assignments.get('a').columnIndex).toBe(0);
  expect(assignments.get('b').columnIndex).toBe(1);
  expect(assignments.get('a').totalColumns).toBe(2);
});
```

---

## 11. Abhängigkeiten

| Abhängigkeit | Status |
|--------------|--------|
| `useMemo` | ✅ Bereits importiert |
| `regularBlocks` | ✅ Existiert |
| `weekDates` | ✅ Existiert |
| Neue Helper-Functions | ⏳ Zu implementieren |

---

## 12. Risiken

| Risiko | Mitigation |
|--------|------------|
| Performance bei vielen Blöcken | useMemo + O(n log n) Algorithmus |
| Blöcke zu schmal bei vielen Überlappungen | Mindestbreite (min-width: 60px) einführen |
| Drag-to-Select interferiert | Layout-Berechnung nur für existierende Blöcke |
| Mobile Ansicht | Responsive Mindestbreite testen |

---

## 13. Optionale Erweiterungen (Future)

| Erweiterung | Beschreibung |
|-------------|--------------|
| Expand on Hover | Schmale Blöcke bei Hover auf volle Breite expandieren |
| Smart Column Assignment | Blöcke gleicher Kategorie in gleicher Spalte |
| Drag to Resize | Block-Breite per Drag anpassen |
| Collision Warning | Warnung beim Erstellen überlappender Blöcke |

---

## 14. Dateien-Übersicht

| Datei | Änderungen |
|-------|------------|
| `week-grid.jsx` | Helper-Functions, useMemo, Block-Rendering |

---

## 15. Implementierungs-Reihenfolge

1. **Helper-Functions hinzufügen** (parseTimeToMinutes, blocksOverlap, groupOverlappingBlocks, assignColumns)
2. **useMemo calculateBlockLayouts** implementieren
3. **Block-Rendering anpassen** (left/width aus Layout-Map)
4. **Blocked State Rendering** anpassen
5. **Testen** mit verschiedenen Überlappungs-Szenarien
6. **Edge Cases** behandeln (min-width, viele Überlappungen)
