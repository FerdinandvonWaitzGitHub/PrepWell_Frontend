# Ticket 30: Serien-Informationen werden nicht vollständig angezeigt

## Problem-Beschreibung

Wenn ein Benutzer einen Termin öffnet, der Teil einer Serie ist, wird nur angezeigt:
- "Dieser Termin ist Teil einer Serie"

Es fehlt jedoch die Information:
- **Welcher Termin in der Serie** (z.B. "Termin 3 von 10")
- **Gesamtanzahl der Termine** in der Serie
- **Verbleibende Termine** nach diesem Termin

---

## Hinweis: Terminologie-Inkonsistenz

**Architektur laut CLAUDE.md:**
| Entity | Ansicht | Merkmale |
|--------|---------|----------|
| **BlockAllocation** | Monatsansicht | `date`, `size (1-4)`, KEINE Uhrzeiten |
| **Session** | Wochenansicht | `start_at`, `end_at`, MIT Uhrzeiten |

**Problem im Code:**
- Funktionen heißen `addTimeBlock`, `addPrivateBlock` - sollten `addTimeSession`, `addPrivateSession` heißen
- Variablen `timeSessions`, `privateSessionsByDate` sind korrekt benannt
- Supabase-Tabellen heißen korrekt `time_sessions`, `private_sessions`

**Empfehlung:** Bei der Implementierung dieses Tickets auch die Funktionsnamen refactoren:
- `addTimeBlock` → `addTimeSession`
- `addPrivateBlock` → `addPrivateSession`
- `deletePrivateBlock` → `deletePrivateSession`

---

## Analyse: Aktuelle Datenstruktur

### Was wird gespeichert?

Bei der Erstellung einer Serie werden folgende Daten gespeichert:

#### Auf der ORIGINAL-Session (erster Termin):
```javascript
{
  id: "uuid-1",
  seriesId: "series-uuid",
  repeatEnabled: true,
  repeatType: "weekly",        // weekly | biweekly | custom
  repeatCount: 10,             // Anzahl Wiederholungen
  repeatEndMode: "count",      // count | date
  repeatEndDate: null,         // oder "2025-06-30"
  customDays: [],              // bei repeatType: "custom"
  // ... andere Session-Daten
}
```

#### Auf allen FOLGE-Sessions:
```javascript
{
  id: "uuid-2",
  seriesId: "series-uuid",     // NUR die seriesId!
  // ... andere Session-Daten (KEINE repeat-Informationen!)
}
```

### Was FEHLT?

| Information | Aktuell | Benötigt |
|-------------|---------|----------|
| Position in Serie | ❌ Nicht vorhanden | `seriesIndex: 3` |
| Gesamtanzahl | ❌ Nicht vorhanden | `seriesTotal: 10` |
| Original-Session-ID | ❌ Nicht vorhanden | `seriesOriginId: "uuid-1"` |

---

## Betroffene Dateien

### 1. Serien-Erstellung

**Datei:** [calendar-context.jsx](../src/contexts/calendar-context.jsx)

**Funktion:** `addTimeBlock` (sollte `addTimeSession` heißen, Zeilen ~380-450)
```javascript
// Aktuelle Implementierung - NUR seriesId wird auf Folge-Sessions kopiert
const newSessions = repeatDates.map(dateKey => ({
  ...newSession,
  id: uuidv4(),
  date: dateKey,
  seriesId: seriesId,
  // FEHLT: seriesIndex, seriesTotal, seriesOriginId
}));
```

**Funktion:** `addPrivateBlock` (sollte `addPrivateSession` heißen, Zeilen ~470-540)
```javascript
// Gleiche Problematik wie addTimeBlock/addTimeSession
```

### 2. Serien-Anzeige in Dialogen

**Datei:** [manage-theme-session-dialog.jsx](../src/features/calendar/dialogs/manage-theme-session-dialog.jsx)

**Aktuelle Anzeige (Zeilen ~744-751):**
```jsx
{isSeriesBlock && (
  <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
    <p className="text-sm text-violet-700">
      Dieser Lernblock ist Teil einer Serie. Beim Löschen kannst du wählen...
    </p>
  </div>
)}
```

**Gewünschte Anzeige:**
```jsx
{session?.seriesId && (
  <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
    <div className="flex items-center gap-2 mb-1">
      <RepeatIcon size={14} className="text-violet-600" />
      <span className="text-sm font-medium text-violet-800">
        Serientermin {session.seriesIndex || '?'} von {session.seriesTotal || '?'}
      </span>
    </div>
    <p className="text-xs text-violet-600">
      {session.seriesTotal - session.seriesIndex} weitere Termine folgen
    </p>
  </div>
)}
```

**Weitere betroffene Dialoge:**
- [manage-private-session-dialog.jsx](../src/features/calendar/dialogs/manage-private-session-dialog.jsx)
- [manage-exam-session-dialog.jsx](../src/features/calendar/dialogs/manage-exam-session-dialog.jsx)
- [manage-repetition-session-dialog.jsx](../src/features/calendar/dialogs/manage-repetition-session-dialog.jsx)

---

## Lösung

### Option A: Serien-Metadaten auf jeder Session speichern (Empfohlen)

#### Schritt 1: Datenstruktur erweitern

Bei der Serien-Erstellung alle Sessions mit Index und Total versehen:

```javascript
// In calendar-context.jsx - addTimeSession (aktuell: addTimeBlock)
const totalSessions = repeatDates.length;
const newSessions = repeatDates.map((dateKey, index) => ({
  ...newSession,
  id: uuidv4(),
  date: dateKey,
  seriesId: seriesId,
  seriesIndex: index + 1,          // NEU: Position (1-basiert)
  seriesTotal: totalSessions,      // NEU: Gesamtanzahl
  seriesOriginId: newSession.id,   // NEU: ID der Original-Session
}));
```

#### Schritt 2: Dialoge aktualisieren

```jsx
{session?.seriesId && (
  <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
    <div className="flex items-center gap-2 mb-1">
      <RepeatIcon size={14} className="text-violet-600" />
      <span className="text-sm font-medium text-violet-800">
        Serientermin {session.seriesIndex || '?'} von {session.seriesTotal || '?'}
      </span>
    </div>
    {session.seriesTotal && session.seriesIndex && (
      <p className="text-xs text-violet-600">
        {session.seriesTotal - session.seriesIndex} weitere Termine folgen
      </p>
    )}
  </div>
)}
```

#### Schritt 3: Supabase-Schema erweitern

```sql
-- In supabase/schema.sql
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS series_index INTEGER;
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS series_total INTEGER;
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS series_origin_id UUID;

ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS series_index INTEGER;
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS series_total INTEGER;
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS series_origin_id UUID;
```

### Option B: Serien-Info dynamisch berechnen (Alternative)

Statt die Daten zu speichern, bei jedem Dialog-Öffnen berechnen:

```javascript
// Neue Funktion in calendar-context.jsx
const getSeriesInfo = useCallback((session) => {
  if (!session?.seriesId) return null;

  const seriesSessions = timeSessions
    .filter(s => s.seriesId === session.seriesId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const index = seriesSessions.findIndex(s => s.id === session.id);

  return {
    index: index + 1,
    total: seriesSessions.length,
    isFirst: index === 0,
    isLast: index === seriesSessions.length - 1,
  };
}, [timeSessions]);
```

**Nachteile:**
- Performance-Overhead bei jedem Dialog-Öffnen
- Bei gelöschten Sessions stimmt die Zählung nicht mehr

---

## Empfehlung

**Option A** ist zu bevorzugen, da:
1. Die Serien-Info bei der Erstellung bekannt ist
2. Kein Performance-Overhead bei jedem Dialog-Öffnen
3. Konsistente Anzeige auch wenn Sessions gelöscht werden
4. Einfachere Implementierung in den Dialogen

---

## Implementierungs-Checkliste

### Phase 1: Schema & Backend

**Problem:** Das Supabase-Schema hat nur diese Serien-Felder:
```sql
-- VORHANDEN:
repeat_enabled BOOLEAN
repeat_type TEXT
repeat_count INT
series_id UUID

-- FEHLT KOMPLETT:
series_index INT         -- Position in Serie
series_total INT         -- Gesamtanzahl
series_origin_id UUID    -- Referenz zur Original-Session
repeat_end_mode TEXT     -- 'count' oder 'date'
repeat_end_date DATE     -- Enddatum bei Modus 'date'
```

**Tasks:**
- [x] Schema-Migration: Neue Spalten zu `time_sessions` hinzufügen (in supabase/schema.sql)
- [x] Schema-Migration: Neue Spalten zu `private_sessions` hinzufügen (in supabase/schema.sql)
- [x] `useSupabaseSync` - Transformationen für neue Felder (camelCase ↔ snake_case):
  - `seriesIndex` ↔ `series_index`
  - `seriesTotal` ↔ `series_total`
  - `seriesOriginId` ↔ `series_origin_id`
  - `repeatEndMode` ↔ `repeat_end_mode`
  - `repeatEndDate` ↔ `repeat_end_date`

### Phase 2: Terminologie-Refactoring ✅
- [x] `addTimeBlock` → `addTimeSession` umbenennen
- [x] `addPrivateBlock` → `addPrivateSession` umbenennen
- [x] `deletePrivateBlock` → `deletePrivateSession` umbenennen
- [x] Alle Aufrufe dieser Funktionen aktualisiert in:
  - calendar-context.jsx
  - week-view.jsx
  - calendar-view.jsx
  - dashboard.jsx
  - semesterleistungen-content.jsx

### Phase 3: Serien-Logik ✅
- [x] `addTimeSession` - seriesIndex/seriesTotal/seriesOriginId hinzugefügt
- [x] `addPrivateSession` - seriesIndex/seriesTotal/seriesOriginId hinzugefügt

### Phase 4: Dialog-Updates ✅
- [x] manage-theme-session-dialog.jsx - Serien-Info anzeigen ("Serientermin X von Y")
- [x] manage-private-session-dialog.jsx - Serien-Info anzeigen
- [N/A] manage-exam-session-dialog.jsx - Hat keine Serien-Funktionalität
- [N/A] manage-repetition-session-dialog.jsx - Hat keine Serien-Funktionalität

### Phase 5: Testen
- [ ] Neue Serie erstellen → Jeden Termin öffnen → Index prüfen
- [ ] Serie löschen (einzeln vs. alle) → Korrekte Löschung prüfen
- [x] Bestehende Serien ohne Index → Graceful Fallback ("?" anzeigen)

---

## Zusätzliche Verbesserungen (Optional)

### Serien-Übersicht

Ein Button "Alle Termine dieser Serie anzeigen" im Dialog:
```jsx
<Button variant="ghost" size="sm" onClick={() => showSeriesOverview(session.seriesId)}>
  <ListIcon size={14} className="mr-1" />
  Alle {session.seriesTotal} Termine anzeigen
</Button>
```

### Serien-Bearbeitung

Bei Änderungen an einem Serientermin fragen:
- "Nur diesen Termin ändern"
- "Alle zukünftigen Termine ändern"
- "Alle Termine der Serie ändern"

### Serien-Löschen Verbesserung

Aktuell gibt es bereits die Option "Nur diesen Termin" vs "Gesamte Serie".
Zusätzlich könnte man anbieten:
- "Diesen und alle folgenden Termine löschen"

---

## Priorität

**Hoch** - Die fehlende Serien-Information verwirrt Benutzer und macht die Serien-Funktion weniger nützlich.

---

## Referenz: Block vs. Session Architektur

Aus CLAUDE.md - **NIEMALS verwechseln:**

```
┌─────────────────────────┐     ┌─────────────────────────┐
│     BlockAllocation     │     │        Session          │
│      (Kapazität)        │     │      (Zeiträume)        │
├─────────────────────────┤     ├─────────────────────────┤
│ Ansicht: Monatsansicht  │     │ Ansicht: Wochenansicht  │
│ Felder: date, size(1-4) │     │ Felder: start_at,end_at │
│ KEINE Uhrzeiten!        │     │ KEIN block_size!        │
│ Tabelle: calendar_blocks│     │ Tabelle: time_sessions  │
│                         │     │          private_sessions│
└─────────────────────────┘     └─────────────────────────┘
```

Die Serien-Funktionalität betrifft NUR **Sessions** (Wochenansicht), NICHT BlockAllocations (Monatsansicht).
