# Ticket-Analyse: Vollständige Übersicht und Implementierungspläne

**Erstellt:** 2026-01-12
**Analysierte Tickets:** tickets4.md - tickets8.md
**Status:** Analyse komplett

---

## Inhaltsverzeichnis

1. [Übersicht nach Priorität](#übersicht-nach-priorität)
2. [Kategorie A: Kritische Bugs](#kategorie-a-kritische-bugs)
3. [Kategorie B: UX-Verbesserungen](#kategorie-b-ux-verbesserungen)
4. [Kategorie C: Feature-Erweiterungen](#kategorie-c-feature-erweiterungen)
5. [Kategorie D: Architektur-Änderungen](#kategorie-d-architektur-änderungen)

---

## Übersicht nach Priorität

| Prio | Ticket | Problem | Kategorie | Aufwand |
|------|--------|---------|-----------|---------|
| ✅ | T8 | TypeError 'aufgaben'/'name' | Bug | ERLEDIGT |
| ✅ | T6.1 | Klausurensession: Block-Eingabe ENTFERNEN | Architektur-Fix | ERLEDIGT (2026-01-12) |
| ✅ | T5.7 | Themen nicht abhakbar im Normal-Modus | Bug | ERLEDIGT (2026-01-12) |
| ✅ | T6.5 | Zeitplan-Klick → Wochenansicht statt Session | Bug | ERLEDIGT (2026-01-12) |
| ✅ | TNEU | Normal-Modus: Funktionen prüfen vs PRD | Investigation | ERLEDIGT (2026-01-12) |
| ✅ | T5.1 | Fortschrittsberechnung + Abhakbarkeits-Logik | Feature | ERLEDIGT |
| ✅ | T5.3 | Themenlisten nicht einklappbar | UX | ERLEDIGT |
| ✅ | T5.4 | Themenlisten nicht archivierbar | UX | ERLEDIGT |
| ✅ | T6.3 | Drag & Drop auf Startseite fehlt | UX | ERLEDIGT |
| ✅ | T4.1 | Session per Zeitbereich-Markierung (Google Cal) | UX | ERLEDIGT |
| 🟡 | T4.2 | Wiederholung Enddatum fehlt | Feature | Mittel |
| 🟡 | T-SET-1 | Zusätzliche Rechtsgebiete in Einstellungen | Feature | Mittel |
| 🟡 | T-DASH-1 | Dashboard: Aufgaben erstellen + Themen→Session kopieren | Feature | Groß |
| 🟢 | T6.2 | Kalender als klassischer Terminkalender | Feature | Groß |
| 🟢 | T6.4 | Wizard: Themen-Block-Verteilung | Feature | Groß |
| 🔵 | T7 | Fächerauswahl für Nicht-Jura | Architektur | Groß |
| 🔵 | T5.6 | Themenliste Download → Lernplan möglich | Bug | Klein |

**Legende:** ✅ Erledigt | 🔴 Kritisch | 🟡 Wichtig | 🟢 Normal | 🔵 Langfristig

---

## Kategorie A: Kritische Bugs

### T8: TypeError 'aufgaben' / 'name' [ERLEDIGT ✅]

**Status:** Bereits behoben durch Commits `2e6e147`, `5058d7d`, `db785d5`

**Problem:**
- `Cannot read properties of undefined (reading 'aufgaben')`
- `Cannot read properties of undefined (reading 'name')`

**Ursache:** Arrays mit undefined-Elementen ("Löcher") führten zu Crashes bei `.forEach()` / `.map()`

**Lösung:** Optional Chaining (`?.`) und Array-Filter (`filter(a => a)`) an 58+ Stellen hinzugefügt.

---

### T5.1: Fortschrittsberechnung - Einstellung + Abhakbarkeits-Logik

**Quelle:** tickets5.md

**Problem:**
1. Der Fortschritt wird aktuell nur nach **Aufgaben** berechnet
2. User soll in den **Einstellungen** wählen können: Themen vs. Aufgaben
3. **Abhakbarkeit muss an Einstellung gekoppelt sein:**
   - Fortschritt nach **Themen** → Themen UND Aufgaben abhakbar
   - Fortschritt nach **Aufgaben** → NUR Aufgaben abhakbar

**Argumentation für beide Varianten:**
- **Nach Aufgaben:** Granularerer Fortschritt, nur Aufgaben abhakbar
- **Nach Themen:** Thema als Einheit, Themen direkt abhakbar (markiert alle Aufgaben als erledigt)

**Betroffene Dateien:**
- `src/hooks/useStatistics.js` - Haupt-Fortschrittsberechnung
- `src/components/settings/settings-content.jsx` - Neue Einstellung
- `src/contexts/user-settings-context.jsx` - Setting speichern
- `src/components/lernplan/lernplan-content.jsx` - Fortschrittsanzeige
- `src/components/lernplan/content-plan-edit-card.jsx` - Checkbox-Rendering

**Lösung:**

```javascript
// 1. In user-settings-context.jsx
// Neue Einstellung: progressCalculation = 'aufgaben' | 'themen'

// 2. In useStatistics.js - BEIDE Berechnungsmethoden
const calculateProgress = (contentPlan, method = 'aufgaben') => {
  if (method === 'themen') {
    return calculateThemenProgress(contentPlan);
  }
  return calculateAufgabenProgress(contentPlan);
};

// 3. In content-plan-edit-card.jsx - Abhakbarkeit basierend auf Setting
const { progressCalculation } = useUserSettings();

// Thema-Checkbox nur anzeigen wenn Fortschritt nach Themen
const showThemaCheckbox = progressCalculation === 'themen';

// Thema abhaken = alle Aufgaben als erledigt markieren
const handleThemaToggle = (themaId, completed) => {
  // Alle Aufgaben des Themas auf completed setzen
  const thema = findThema(themaId);
  thema.aufgaben.forEach(aufgabe => {
    aufgabe.completed = completed;
  });
  // Thema selbst als completed markieren
  thema.completed = completed;
  updateContentPlan();
};

return (
  <div className="thema-row">
    {/* Thema-Checkbox nur wenn Fortschritt nach Themen */}
    {showThemaCheckbox && (
      <Checkbox
        checked={thema.completed}
        onChange={(e) => handleThemaToggle(thema.id, e.target.checked)}
      />
    )}
    <span>{thema.name}</span>

    {/* Aufgaben sind IMMER abhakbar */}
    {thema.aufgaben.map(aufgabe => (
      <div key={aufgabe.id} className="aufgabe-row">
        <Checkbox
          checked={aufgabe.completed}
          onChange={(e) => handleAufgabeToggle(aufgabe.id, e.target.checked)}
        />
        <span>{aufgabe.name}</span>
      </div>
    ))}
  </div>
);

// 4. In settings-content.jsx - Toggle mit Erklärung
<div className="setting-row">
  <label>Fortschrittsberechnung</label>
  <select
    value={progressCalculation}
    onChange={(e) => setProgressCalculation(e.target.value)}
  >
    <option value="aufgaben">Nach Aufgaben (nur Aufgaben abhakbar)</option>
    <option value="themen">Nach Themen (Themen + Aufgaben abhakbar)</option>
  </select>
  <p className="text-sm text-neutral-500">
    Bei "Nach Themen" kannst du ganze Themen auf einmal abhaken.
  </p>
</div>
```

**Implementierungsplan:**
1. `user-settings-context.jsx` - Neues Setting `progressCalculation` hinzufügen
2. `settings-content.jsx` - Dropdown mit Erklärung der Auswirkungen
3. `useStatistics.js` - Beide Berechnungsmethoden implementieren
4. `content-plan-edit-card.jsx` - Konditionales Thema-Checkbox Rendering
5. Logik: Thema abhaken → alle Aufgaben abhaken
6. Supabase `user_settings` erweitern
7. Tests für beide Modi

**Aufwand:** Mittel (4-5h)

---

### T6.5: Zeitplan-Klick führt zur Wochenansicht statt Session-Planung

**Quelle:** tickets6.md

**Problem:**
Wenn man auf der Startseite auf das Zeitplan-Div klickt, wird man direkt zur Wochenansicht geleitet. Erwartet wird jedoch ein Dialog zum Planen einer Session.

**Betroffene Dateien:**
- `src/components/dashboard/zeitplan-widget.jsx` - Klick-Handler
- `src/pages/dashboard.jsx` - Routing-Logik

**Analyse:**
Das Zeitplan-Widget hat wahrscheinlich einen `onClick` der zu `/kalender` oder `/wochenplan` navigiert.

**Lösung:**

```javascript
// In zeitplan-widget.jsx
const ZeitplanWidget = () => {
  const [showSessionDialog, setShowSessionDialog] = useState(false);

  const handleWidgetClick = () => {
    // Statt Navigation: Dialog öffnen
    setShowSessionDialog(true);
  };

  return (
    <>
      <div onClick={handleWidgetClick} className="...">
        {/* Widget-Inhalt */}
      </div>

      {/* Session-Erstellungs-Dialog */}
      <CreateSessionDialog
        open={showSessionDialog}
        onClose={() => setShowSessionDialog(false)}
      />
    </>
  );
};
```

**Implementierungsplan:**
1. `zeitplan-widget.jsx` lesen und Klick-Verhalten analysieren
2. Navigation durch Dialog-Öffnung ersetzen
3. Passenden Session-Dialog einbinden (evtl. existiert schon)
4. Optional: Langklick/Rechtsklick für direkte Navigation zur Wochenansicht

**Aufwand:** Klein (1-2h)

---

### T5.6: Themenliste-Download ermöglicht Lernplan-Erstellung im Normal-Modus

**Quelle:** tickets5.md

**Problem:**
Wenn man eine Themenliste aus der Datenbank herunterlädt, wird es plötzlich möglich einen Lernplan zu erstellen, obwohl man im normalen Modus ist (nicht Examen-Modus).

**Betroffene Dateien:**
- `src/components/lernplan/lernplan-content.jsx`
- `src/contexts/app-mode-context.jsx`

**Analyse:**
Die Bedingung für "Lernplan erstellen" Button prüft wahrscheinlich nur das Vorhandensein einer Themenliste, nicht den App-Modus.

**Lösung:**

```javascript
// In lernplan-content.jsx
const { appMode } = useAppMode();

// Button nur anzeigen wenn:
// 1. Examen-Modus ODER
// 2. Themenliste vorhanden UND Examen-Modus
const canCreateLernplan = appMode === 'examen';

return (
  <>
    {canCreateLernplan && (
      <Button onClick={handleCreateLernplan}>
        Lernplan erstellen
      </Button>
    )}
  </>
);
```

**Implementierungsplan:**
1. Bestehende Button-Logik identifizieren
2. App-Modus-Check hinzufügen
3. Testen in beiden Modi

**Aufwand:** Klein (30min)

---

### T5.7: Themen nicht abhakbar nach Themenliste-Download im Normal-Modus [BUG]

**Quelle:** User-Feedback

**Problem:**
Wenn man im **Normal-Modus** eine Themenliste aus der Datenbank herunterlädt, kann man die **Themen nicht abhaken**, obwohl ein Kreis/Checkbox dafür angezeigt wird. Der Klick auf den Kreis hat keine Funktion.

**Analyse:**
- Die Checkbox wird visuell gerendert, aber der `onClick`-Handler fehlt oder ist deaktiviert
- Möglicherweise ist die Toggle-Funktion nur für den Examen-Modus implementiert
- Das Problem hängt mit T5.1 zusammen (Abhakbarkeits-Logik)

**Betroffene Dateien:**
- `src/components/lernplan/content-plan-edit-card.jsx` - Thema-Checkbox
- `src/components/lernplan/lernplan-content.jsx` - Event-Handler
- `src/contexts/calendar-context.jsx` - `toggleThemaCompleted` Funktion

**Lösung:**

```javascript
// In content-plan-edit-card.jsx
// Prüfen ob onClick-Handler existiert und im Normal-Modus funktioniert

const handleThemaClick = (themaId) => {
  // Handler muss unabhängig vom App-Modus funktionieren!
  toggleThemaCompleted(planId, themaId);
};

// Checkbox muss klickbar sein
<div
  className="thema-checkbox cursor-pointer"
  onClick={() => handleThemaClick(thema.id)}
>
  {thema.completed ? <CheckedIcon /> : <UncheckedCircle />}
</div>
```

**Implementierungsplan:**
1. `content-plan-edit-card.jsx` analysieren - wo wird Thema-Checkbox gerendert?
2. Prüfen ob `onClick` existiert
3. Prüfen ob Handler im Normal-Modus aufgerufen wird
4. Falls Handler fehlt: hinzufügen
5. Falls Handler existiert aber nicht ausgeführt wird: Bedingung finden und fixen
6. Testen: Normal-Modus + Themenliste-Download + Thema abhaken

**Aufwand:** Klein (1-2h)

---

### TNEU: Normal-Modus - Funktionalität vs. PRD prüfen [INVESTIGATION] ✅ ERLEDIGT

**Status:** Investigation abgeschlossen (2026-01-12)

**Quelle:** tickets5.md ("im normalen modus funktioniert eine menge nicht")

---

#### Investigation Ergebnisse

**PRD-Spezifikation (§3.3):**

| Aspekt | Examensmodus | Normalmodus |
|--------|--------------|-------------|
| Aktivierung | Automatisch bei aktivem Lernplan | Automatisch ohne Lernplan |
| Kalender-Default | Monatsansicht | Wochenansicht |
| Dashboard-Widget | Lernplan / To-Dos Toggle | To-Dos / Themenliste Toggle |
| Navigation | Alle Menüpunkte | "Übungsklausuren" ausgeblendet |
| Wizard | ✅ Verfügbar | ❌ Nicht verfügbar |

**Implementierter Ist-Zustand (analysierte Dateien):**

1. **`src/contexts/appmode-context.jsx`:**
   - `isWizardAvailable = isExamMode` (Zeile 246)
   - Wizard nur in Examen-Modus verfügbar ✅ korrekt

2. **`src/pages/lernplaene.jsx`:**
   - Wizard-Button nur wenn `isWizardAvailable` (Zeile 63) ✅
   - Themenliste erstellen: ✅ funktioniert in beiden Modi
   - Datenbank-Import: ✅ funktioniert in beiden Modi

3. **`src/components/lernplan/content-plan-edit-card.jsx`:**
   - Themen abhaken: 🔧 GEFIXT (T5.7) - Checkbox war nicht vorhanden
   - Aufgaben abhaken: ✅ funktioniert

---

#### Vergleich: PRD vs. Implementierung

| Feature | PRD | Implementiert | Status |
|---------|-----|---------------|--------|
| Themenliste erstellen | ✅ | ✅ | OK |
| Themenliste bearbeiten | ✅ | ✅ | OK |
| Themenliste löschen | ✅ | ✅ | OK |
| Themenliste archivieren | ✅ | ❌ | **T5.4** |
| Themenliste einklappen | ✅ | ❌ (nicht klickbar) | **T5.3** |
| Themen abhaken | ✅ | 🔧 | **GEFIXT (T5.7)** |
| Aufgaben abhaken | ✅ | ✅ | OK |
| Datenbank-Import | ✅ | ✅ | OK |
| Wizard | ❌ (nur Examen) | ❌ | OK (korrekt) |
| Lernplan erstellen | ❌ (nur Examen) | ❌ | OK (korrekt) |
| Zeitplan-Klick → Dialog | ✅ | 🔧 | **GEFIXT (T6.5)** |

---

#### Bekannte Probleme im Normal-Modus

1. **T5.3** - Themenlisten nicht einklappbar (Icon reagiert nicht)
2. **T5.4** - Themenlisten nicht archivierbar (Funktion fehlt)
3. ~~**T5.7** - Themen nicht abhakbar~~ → **GEFIXT**
4. ~~**T6.5** - Zeitplan-Klick navigiert statt Dialog~~ → **GEFIXT**

---

#### Erkenntnisse

- **Modus-Unterscheidung funktioniert korrekt** gem. PRD §3.3
- **Wizard-Sperre im Normal-Modus ist beabsichtigt** (nicht ein Bug)
- **Hauptprobleme:** UX-Bugs (Einklappen, Archivieren) + fehlende Checkbox
- **Keine strukturellen Architektur-Probleme** im Normal-Modus gefunden

**Aufwand:** Mittel (2-3h Investigation)

---

## Kategorie B: UX-Verbesserungen

### T5.3: Themenlisten sind nicht einklappbar

**Quelle:** tickets5.md

**Problem:**
Das Icon zum Einklappen von Themenlisten auf der Lernplan-Seite reagiert nicht auf Klicks.

**Betroffene Dateien:**
- `src/components/lernplan/lernplan-content.jsx`
- `src/components/lernplan/content-plan-edit-card.jsx`

**Analyse:**
Das Collapse-Icon existiert visuell, hat aber keinen funktionalen `onClick`-Handler.

**Lösung:**

```javascript
// In content-plan-edit-card.jsx
const [isCollapsed, setIsCollapsed] = useState(false);

const handleToggleCollapse = (e) => {
  e.stopPropagation();
  setIsCollapsed(!isCollapsed);
};

return (
  <div className="...">
    <div className="flex items-center justify-between">
      <h3>{title}</h3>
      <button onClick={handleToggleCollapse}>
        <ChevronIcon className={isCollapsed ? 'rotate-180' : ''} />
      </button>
    </div>

    {!isCollapsed && (
      <div className="content">
        {/* Themenlisten-Inhalt */}
      </div>
    )}
  </div>
);
```

**Implementierungsplan:**
1. Collapse-Icon in `content-plan-edit-card.jsx` lokalisieren
2. State und Handler hinzufügen
3. Content mit bedingtem Rendering versehen
4. Animation für smooth collapse (optional)

**Aufwand:** Klein (1h)

---

### T5.4: Themenlisten sind nicht archivierbar

**Quelle:** tickets5.md

**Problem:**
Es gibt keine Möglichkeit, Themenlisten zu archivieren.

**Betroffene Dateien:**
- `src/components/lernplan/lernplan-content.jsx`
- `src/contexts/calendar-context.jsx` (State)
- `supabase/schema.sql` (DB-Schema)

**Analyse:**
Benötigt:
1. `is_archived` Boolean-Feld in der Datenbank
2. UI-Button zum Archivieren
3. Filter für archivierte Themenlisten

**Lösung:**

```sql
-- DB-Migration
ALTER TABLE content_plans ADD COLUMN is_archived BOOLEAN DEFAULT false;
```

```javascript
// In calendar-context.jsx
const archiveContentPlan = async (planId) => {
  await supabase
    .from('content_plans')
    .update({ is_archived: true })
    .eq('id', planId);

  // State aktualisieren
  setContentPlans(prev =>
    prev.map(p => p.id === planId ? { ...p, is_archived: true } : p)
  );
};

// In lernplan-content.jsx
const { archiveContentPlan } = useCalendar();
const [showArchived, setShowArchived] = useState(false);

const visiblePlans = contentPlans.filter(p =>
  showArchived ? p.is_archived : !p.is_archived
);
```

**Implementierungsplan:**
1. DB-Schema erweitern (`is_archived` Spalte)
2. `calendar-context.jsx` um `archiveContentPlan` erweitern
3. UI-Button "Archivieren" in Dropdown-Menü
4. Toggle "Archivierte anzeigen" in Header
5. Migration für bestehende Daten

**Aufwand:** Mittel (3-4h)

---

### T6.3: Drag & Drop auf Startseite fehlt

**Quelle:** tickets6.md

**Problem:**
Termine auf der Startseite lassen sich nicht per Drag & Drop verschieben.

**Betroffene Dateien:**
- `src/pages/dashboard.jsx`
- `src/components/dashboard/session-widget.jsx`

**Analyse:**
Die Kalender-Komponente hat bereits Drag & Drop für die Wochenansicht. Diese Logik muss auf das Dashboard übertragen werden.

**Lösung:**

```javascript
// In dashboard.jsx oder session-widget.jsx
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const SessionList = ({ sessions }) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    // Session-Zeit basierend auf Drop-Position aktualisieren
    updateSessionTime(draggableId, destination);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="dashboard-sessions">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {sessions.map((session, index) => (
              <Draggable key={session.id} draggableId={session.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <SessionCard session={session} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
```

**Implementierungsplan:**
1. `@hello-pangea/dnd` (oder bestehende DnD-Lib) verwenden
2. Dashboard-Sessions in Draggable wrapper
3. Drop-Handler implementiert Session-Zeit-Update
4. Visuelles Feedback während Drag

**Aufwand:** Mittel (4-5h)

---

### T4.1: Session per Zeitbereich-Markierung erstellen (Google Calendar Style)

**Quelle:** tickets4.md

**Problem:**
Im Zeitplan sollte man wie in Google Calendar einen **Zeitbereich durch Ziehen markieren** können, woraufhin direkt der Session-Dialog mit den vorausgefüllten Von-Bis-Zeiten öffnet. Die **Kategorie-Auswahl ist ein Pflicht-Dropdown** im Dialog selbst.

**Verhalten wie Google Calendar:**
1. User klickt auf Startzeit und zieht zur Endzeit
2. Dialog öffnet mit markiertem Zeitbereich vorausgefüllt
3. Kategorie ist ein Pflicht-Dropdown im Dialog (nicht separater Picker)

**Betroffene Dateien:**
- `src/features/calendar/components/week-grid.jsx` - Drag-Selektion
- `src/features/calendar/components/create-session-dialog.jsx` - Einheitlicher Dialog mit Kategorie-Dropdown

**Lösung:**

```javascript
// In week-grid.jsx - Drag-Selektion für Zeitbereich
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState(null);
const [dragEnd, setDragEnd] = useState(null);

const handleMouseDown = (date, hour) => {
  setIsDragging(true);
  setDragStart({ date, hour });
  setDragEnd({ date, hour });
};

const handleMouseMove = (date, hour) => {
  if (!isDragging) return;
  setDragEnd({ date, hour });
};

const handleMouseUp = () => {
  if (!isDragging || !dragStart) return;
  setIsDragging(false);

  // Berechne Start- und Endzeit aus Drag-Bereich
  const startHour = Math.min(dragStart.hour, dragEnd.hour);
  const endHour = Math.max(dragStart.hour, dragEnd.hour) + 1;

  const startAt = new Date(dragStart.date);
  startAt.setHours(startHour, 0, 0, 0);

  const endAt = new Date(dragStart.date);
  endAt.setHours(endHour, 0, 0, 0);

  // Dialog öffnen mit vorausgefüllten Zeiten
  setNewSessionData({ startAt, endAt });
  setShowCreateDialog(true);

  setDragStart(null);
  setDragEnd(null);
};

// In create-session-dialog.jsx - EINHEITLICHER Dialog mit Pflicht-Kategorie
const CreateSessionDialog = ({ open, initialData, onClose }) => {
  const [category, setCategory] = useState(''); // PFLICHTFELD
  const [startAt, setStartAt] = useState(initialData?.startAt || '');
  const [endAt, setEndAt] = useState(initialData?.endAt || '');
  const [title, setTitle] = useState('');

  const isValid = category && startAt && endAt;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Neue Session erstellen</DialogTitle>

      {/* PFLICHT: Kategorie-Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Kategorie <span className="text-red-500">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        >
          <option value="">Bitte wählen...</option>
          <option value="theme">Themen-Session</option>
          <option value="exam">Klausur-Session</option>
          <option value="repetition">Wiederholung</option>
          <option value="private">Privat</option>
        </select>
      </div>

      {/* Zeit-Inputs (vorausgefüllt aus Drag) */}
      <div className="grid grid-cols-2 gap-4">
        <TimePicker label="Von" value={startAt} onChange={setStartAt} />
        <TimePicker label="Bis" value={endAt} onChange={setEndAt} />
      </div>

      {/* Kategorie-spezifische Felder werden dynamisch angezeigt */}
      {category === 'theme' && <ThemeFields />}
      {category === 'exam' && <ExamFields />}
      {/* ... */}

      <Button disabled={!isValid} onClick={handleSubmit}>
        Session erstellen
      </Button>
    </Dialog>
  );
};
```

**Implementierungsplan:**
1. `week-grid.jsx` - Mouse-Events für Drag-Selektion (mousedown, mousemove, mouseup)
2. Visuelles Feedback: Markierter Bereich während Drag hervorheben
3. Neuer/angepasster `create-session-dialog.jsx` mit Pflicht-Kategorie-Dropdown
4. Dynamische Felder basierend auf gewählter Kategorie
5. Vorausgefüllte Zeiten aus Drag-Selektion

**Aufwand:** Mittel (4-5h)

**Status:** ✅ ERLEDIGT

**Implementiert:**
- `zeitplan-widget.jsx`: Drag-to-select mit Mouse-Events (mousedown, mousemove, mouseup)
- Helper-Funktionen: `yToTime()` (15min Snap), `hasCollision()`, `findMaxEndWithoutCollision()`
- Visuelles Feedback: Selection Overlay mit Zeitanzeige, Kollisionswarnung (rot)
- `dashboard.jsx`: `handleTimeRangeSelect` Callback öffnet AddThemeDialog mit vorausgefüllten Zeiten
- Alle Create-Dialogs akzeptieren `initialStartTime` / `initialEndTime` Props

---

### T-DASH-1: Dashboard - Aufgaben erstellen & Themen in Sessions kopieren

**Quelle:** User-Feedback

**Problem:**
Auf der Startseite/Dashboard kann man im linken Div (offene Themenliste) aktuell:
1. **Keine Aufgaben direkt erstellen** - nur anzeigen
2. **Keine Themen in Sessions verschieben** - fehlt komplett

**Gewünschtes Verhalten:**

1. **Aufgaben in Themenliste erstellen:**
   - Im geöffneten Thema einen "+ Aufgabe hinzufügen" Button
   - Aufgabe wird direkt in der Themenliste gespeichert

2. **Themen/Aufgaben in Sessions KOPIEREN (nicht verschieben!):**
   - Thema oder Aufgabe per Drag & Drop auf Session ziehen
   - Element wird in Session **kopiert**, nicht verschoben
   - Original bleibt in Themenliste erhalten

3. **Ausgrau-Logik nach Kopieren:**
   - Nach Kopieren in Session: Element wird **1 Tag ausgegraut** in Themenliste
   - Nach 1 Tag: Element wird wieder normal angezeigt (außer abgehakt)
   - Wenn Element **abgehakt** wird: **permanent ausgegraut**

**Betroffene Dateien:**
- `src/pages/dashboard.jsx` - Hauptseite
- `src/components/dashboard/session-widget.jsx` - Session-Bereich
- `src/components/lernplan/content-plan-edit-card.jsx` - Themenliste-Komponente
- `src/contexts/calendar-context.jsx` - State für copied/grayed items

**Lösung:**

```javascript
// 1. Datenstruktur für Ausgrau-Status
// In content_plans oder separater Tabelle
{
  aufgabeId: 'abc123',
  copiedToSessionAt: '2026-01-12T10:00:00Z', // Zeitpunkt des Kopierens
  completedAt: null, // null = nicht abgehakt, sonst Zeitpunkt
}

// 2. In content-plan-edit-card.jsx - Aufgabe hinzufügen Button
const ThemaItem = ({ thema }) => {
  const [showAddAufgabe, setShowAddAufgabe] = useState(false);
  const [newAufgabeName, setNewAufgabeName] = useState('');

  const handleAddAufgabe = () => {
    addAufgabeToThema(thema.id, {
      id: generateId(),
      name: newAufgabeName,
      completed: false,
    });
    setNewAufgabeName('');
    setShowAddAufgabe(false);
  };

  return (
    <div className="thema-item">
      {/* Bestehende Aufgaben */}
      {thema.aufgaben.map(aufgabe => (
        <AufgabeItem
          key={aufgabe.id}
          aufgabe={aufgabe}
          isGrayed={isGrayedOut(aufgabe)}
        />
      ))}

      {/* Aufgabe hinzufügen */}
      {showAddAufgabe ? (
        <div className="flex gap-2">
          <input
            value={newAufgabeName}
            onChange={(e) => setNewAufgabeName(e.target.value)}
            placeholder="Neue Aufgabe..."
            className="flex-1 border rounded px-2 py-1 text-sm"
            autoFocus
          />
          <Button size="sm" onClick={handleAddAufgabe}>+</Button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddAufgabe(true)}
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          + Aufgabe hinzufügen
        </button>
      )}
    </div>
  );
};

// 3. Ausgrau-Logik
const isGrayedOut = (item) => {
  // Permanent ausgegraut wenn abgehakt
  if (item.completed) return true;

  // Temporär ausgegraut wenn in letzten 24h kopiert
  if (item.copiedToSessionAt) {
    const copiedDate = new Date(item.copiedToSessionAt);
    const now = new Date();
    const hoursSinceCopy = (now - copiedDate) / (1000 * 60 * 60);
    return hoursSinceCopy < 24;
  }

  return false;
};

// 4. Drag & Drop - Thema/Aufgabe auf Session
const handleDropOnSession = (item, sessionId) => {
  // KOPIEREN, nicht verschieben!
  copyItemToSession(item, sessionId);

  // Ausgrau-Status setzen
  markAsCopied(item.id, new Date().toISOString());
};

// 5. UI für ausgegraute Items
<div className={`aufgabe-item ${isGrayed ? 'opacity-50' : ''}`}>
  {aufgabe.name}
  {isGrayed && !aufgabe.completed && (
    <span className="text-xs text-neutral-400 ml-2">
      (in Session)
    </span>
  )}
</div>
```

**Implementierungsplan:**
1. `content-plan-edit-card.jsx` - "+ Aufgabe hinzufügen" UI implementieren
2. `calendar-context.jsx` - `addAufgabeToThema` Funktion
3. Drag & Drop für Themen/Aufgaben → Session
4. `copyItemToSession` Funktion (kopiert, verschiebt nicht)
5. `copiedToSessionAt` Feld in Datenstruktur
6. `isGrayedOut` Logik implementieren
7. UI-Styling für ausgegraute Items
8. 24h Timer-Logik (bei nächstem Laden prüfen)
9. Supabase-Sync für copied-Status

**Aufwand:** Groß (6-8h)

---

## Kategorie C: Feature-Erweiterungen

### T-SETTINGS-1: Zusätzliche Rechtsgebiete für Juristen in Einstellungen

**Quelle:** User-Feedback

**Problem:**
Juristen können aktuell nur die 3 Standard-Rechtsgebiete (Öffentliches Recht, Zivilrecht, Strafrecht) + Querschnitt verwenden. Es soll möglich sein, in den **Einstellungen** weitere/eigene Rechtsgebiete hinzuzufügen (z.B. Europarecht, Arbeitsrecht, Familienrecht als separate Kategorien).

**Use Case:**
- Jurastudent möchte "Europarecht" als eigenes Rechtsgebiet hinzufügen
- Student möchte eigene Farbzuordnung für das neue Rechtsgebiet
- Neue Rechtsgebiete erscheinen dann in Themenlisten-Erstellung und Lernplan-Wizard

**Betroffene Dateien:**
- `src/components/settings/settings-content.jsx` - Neue Einstellungs-Sektion
- `src/data/unterrechtsgebiete-data.js` - Dynamische Erweiterung
- `src/contexts/user-settings-context.jsx` - Custom Rechtsgebiete speichern
- `supabase/schema.sql` - `user_custom_rechtsgebiete` Tabelle

**Lösung:**

```javascript
// 1. Neue DB-Tabelle für User-spezifische Rechtsgebiete
// supabase/schema.sql
CREATE TABLE user_custom_rechtsgebiete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280', -- Gray default
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

// 2. In settings-content.jsx - Neue Sektion
<section className="settings-section">
  <h3>Eigene Rechtsgebiete</h3>
  <p className="text-sm text-neutral-500 mb-4">
    Füge zusätzliche Rechtsgebiete hinzu, die in deinen Themenlisten erscheinen.
  </p>

  {/* Liste bestehender Custom-Rechtsgebiete */}
  {customRechtsgebiete.map(rg => (
    <div key={rg.id} className="flex items-center gap-3 py-2">
      <input
        type="color"
        value={rg.color}
        onChange={(e) => updateRgColor(rg.id, e.target.value)}
        className="w-8 h-8 rounded"
      />
      <span className="flex-1">{rg.name}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => deleteCustomRg(rg.id)}
      >
        <TrashIcon />
      </Button>
    </div>
  ))}

  {/* Neues Rechtsgebiet hinzufügen */}
  <div className="flex gap-2 mt-4">
    <input
      type="text"
      placeholder="z.B. Europarecht"
      value={newRgName}
      onChange={(e) => setNewRgName(e.target.value)}
      className="flex-1 border rounded px-3 py-2"
    />
    <Button onClick={handleAddCustomRg}>Hinzufügen</Button>
  </div>
</section>

// 3. In unterrechtsgebiete-data.js - Zusammenführen mit Custom-RGs
export const getAllRechtsgebiete = (customRechtsgebiete = []) => {
  const standard = Object.entries(RECHTSGEBIET_LABELS).map(([id, name]) => ({
    id,
    name,
    color: RECHTSGEBIET_COLORS[id],
    isCustom: false,
  }));

  const custom = customRechtsgebiete.map(rg => ({
    ...rg,
    isCustom: true,
  }));

  return [...standard, ...custom];
};
```

**Implementierungsplan:**
1. DB-Tabelle `user_custom_rechtsgebiete` erstellen
2. `user-settings-context.jsx` - CRUD für Custom-Rechtsgebiete
3. `settings-content.jsx` - UI-Sektion für Rechtsgebiete-Verwaltung
4. `unterrechtsgebiete-data.js` - Funktion zum Zusammenführen
5. Picker-Komponenten anpassen um Custom-RGs anzuzeigen
6. Lernplan-Wizard anpassen
7. Farbauswahl-Palette bereitstellen

**Aufwand:** Mittel (4-5h)

---

### T4.2: Wiederholung Enddatum fehlt

**Quelle:** tickets4.md

**Problem:**
Beim Wiederholen im Tageszeitplan fehlt eine optionale Angabe, wann die Wiederholung endet (Enddatum oder Anzahl der Wiederholungen).

**Betroffene Dateien:**
- `src/features/calendar/components/create-repetition-session-dialog.jsx`
- `src/features/calendar/components/manage-repetition-session-dialog.jsx`

**Analyse:**
Der Wiederholungs-Dialog erstellt aktuell Sessions ohne definiertes Ende.

**Lösung:**

```jsx
// In create-repetition-session-dialog.jsx
const [repeatEndType, setRepeatEndType] = useState('never'); // 'never', 'date', 'count'
const [repeatEndDate, setRepeatEndDate] = useState('');
const [repeatCount, setRepeatCount] = useState(10);

// UI für Wiederholungs-Ende
<div className="space-y-4">
  <label className="text-sm font-medium">Wiederholung endet</label>

  <RadioGroup value={repeatEndType} onChange={setRepeatEndType}>
    <RadioOption value="never">Nie</RadioOption>
    <RadioOption value="date">Am Datum</RadioOption>
    <RadioOption value="count">Nach X Wiederholungen</RadioOption>
  </RadioGroup>

  {repeatEndType === 'date' && (
    <input
      type="date"
      value={repeatEndDate}
      onChange={(e) => setRepeatEndDate(e.target.value)}
      min={startDate}
    />
  )}

  {repeatEndType === 'count' && (
    <input
      type="number"
      value={repeatCount}
      onChange={(e) => setRepeatCount(parseInt(e.target.value))}
      min={1}
      max={365}
    />
  )}
</div>

// Bei Session-Erstellung
const createRepetitions = () => {
  let sessions = [];
  let currentDate = new Date(startDate);
  let count = 0;

  while (true) {
    // Abbruchbedingungen
    if (repeatEndType === 'date' && currentDate > new Date(repeatEndDate)) break;
    if (repeatEndType === 'count' && count >= repeatCount) break;
    if (repeatEndType === 'never' && count >= 365) break; // Safety limit

    sessions.push(createSessionForDate(currentDate));
    currentDate = addInterval(currentDate, repeatInterval);
    count++;
  }

  return sessions;
};
```

**Implementierungsplan:**
1. State für Wiederholungs-Ende hinzufügen
2. UI mit Radio-Buttons und konditionalen Inputs
3. Session-Erstellungslogik anpassen
4. Validierung (Enddatum nach Startdatum, Count > 0)
5. Tests für Edge Cases

**Aufwand:** Mittel (3-4h)

---

### T6.1: Klausurensession - Block-Eingabe ENTFERNEN [ARCHITEKTUR-FIX]

**Quelle:** tickets6.md

**Problem:**
Der Dialog für Klausurensession-Erstellung zeigt ein Eingabefeld für "Blockanzahl". **Das ist architektonisch falsch!**

**Architektur-Regel (siehe PRD.md §3.1):**
```
┌─────────────────────┐     ┌─────────────────────┐
│   BlockAllocation   │     │      Session        │
│   (Kapazität)       │     │   (Zeiträume)       │
├─────────────────────┤     ├─────────────────────┤
│ Monatsansicht       │     │ Wochenansicht       │
│ date + size (1-4)   │     │ start_at + end_at   │
│ KEINE Uhrzeiten!    │     │ KEINE block_size!   │  ← !!!
└─────────────────────┘     └─────────────────────┘
```

**Sessions haben NIEMALS einen block_size Wert!** Die Eingabe muss komplett entfernt werden.

**Betroffene Dateien:**
- `src/features/calendar/components/create-exam-session-dialog.jsx`
- `src/features/calendar/components/manage-exam-session-dialog.jsx`

**Lösung:**

```jsx
// In create-exam-session-dialog.jsx
// KOMPLETT ENTFERNEN (nicht optional machen!):
// - block_size Input
// - Jegliche Block-bezogene Felder
// - block_size aus handleSubmit

const CreateExamSessionDialog = () => {
  // NUR Session-Felder - KEINE Block-Felder!
  const [title, setTitle] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    // Session erstellen - OHNE block_size!
    await createExamSession({
      title,
      start_at: startAt,
      end_at: endAt,
      kind: 'exam',
      location,
      notes,
      // KEIN block_size hier!
    });
  };

  return (
    <Dialog>
      <Input label="Titel" value={title} onChange={setTitle} />
      <DateTimePicker label="Start" value={startAt} onChange={setStartAt} />
      <DateTimePicker label="Ende" value={endAt} onChange={setEndAt} />
      <Input label="Ort (optional)" value={location} onChange={setLocation} />
      <Textarea label="Notizen (optional)" value={notes} onChange={setNotes} />

      {/* KEIN block_size Input! */}
    </Dialog>
  );
};
```

**Implementierungsplan:**
1. `create-exam-session-dialog.jsx` öffnen
2. Block-size Input **komplett löschen** (Zeile finden und entfernen)
3. State-Variable für block_size entfernen
4. handleSubmit anpassen - kein block_size übergeben
5. Dasselbe für `manage-exam-session-dialog.jsx`
6. Testen: Dialog sollte nur noch Zeit-Felder zeigen

**Aufwand:** Klein (30min-1h)

---

### T6.2: Kalender als klassischer Terminkalender

**Quelle:** tickets6.md

**Problem:**
Der Kalender sollte sich wie ein klassischer Terminkalender verhalten (ohne Blöcke).

**Betroffene Dateien:**
- `src/features/calendar/components/week-grid.jsx`
- `src/features/calendar/components/month-view.jsx`

**Analyse:**
Dies erfordert eine Unterscheidung zwischen:
- **Monatsansicht (Lernplan):** Mit Blöcken (BlockAllocations)
- **Wochenansicht (Zeitplan):** Nur Sessions (wie Google Calendar)

**Lösung:**

Die Architektur ist bereits so konzipiert (siehe PRD.md):
- `BlockAllocation` = Monatsansicht (Kapazität, keine Uhrzeiten)
- `Session` = Wochenansicht (Zeiträume mit start_at/end_at)

Das Problem ist vermutlich, dass in der Wochenansicht noch Block-bezogene UI-Elemente angezeigt werden.

```jsx
// In week-grid.jsx
// ENTFERNEN:
// - Block-Visualisierung
// - Block-Erstellung via Klick
// - Block-size Anzeige

// NUR ANZEIGEN:
// - Sessions als Zeitblöcke (wie in Google Calendar)
// - Session-Details on hover/click
// - Drag & Drop für Sessions

const WeekGrid = () => {
  const { sessions } = useCalendar(); // Nur Sessions, keine Blöcke

  return (
    <div className="week-grid">
      {hours.map(hour => (
        <div key={hour} className="hour-row">
          <span className="hour-label">{hour}:00</span>
          {days.map(day => (
            <TimeSlot key={day} date={day} hour={hour}>
              {getSessionsForSlot(sessions, day, hour).map(session => (
                <SessionBlock key={session.id} session={session} />
              ))}
            </TimeSlot>
          ))}
        </div>
      ))}
    </div>
  );
};
```

**Implementierungsplan:**
1. Analyse: Welche Block-UI existiert in Wochenansicht?
2. Block-bezogene Elemente aus Wochenansicht entfernen
3. Session-Darstellung verbessern (Farben, Hover, Resize-Handles)
4. Klare visuelle Trennung: Monatsansicht ≠ Wochenansicht

**Aufwand:** Groß (8-12h) - abhängig vom aktuellen Zustand

---

### T6.4: Wizard - Themen-Block-Verteilung auf Unterrechtsgebiet-Ebene

**Quelle:** tickets6.md

**Problem:**
Im Lernplan-Wizard soll die Themen-auf-Block-Verteilung auf Unterrechtsgebiet-Ebene erfolgen. Wenn ein Thema auf einen Block verschoben ist, soll man einzelne Aufgaben herausnehmen und auf andere Blöcke verschieben können.

**Betroffene Dateien:**
- `src/features/lernplan-wizard/steps/step-12-themen-edit.jsx`
- `src/features/lernplan-wizard/steps/step-15-lernbloecke.jsx`

**Analyse:**
Aktuell werden Themen als Ganzes auf Blöcke verteilt. Gewünscht:
1. Gruppierung nach Unterrechtsgebiet
2. Aufgaben-Level Drag & Drop

**Lösung:**

```jsx
// Hierarchische Struktur:
// Unterrechtsgebiet → Themen → Aufgaben

const BlockDistribution = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Linke Seite: Verfügbare Aufgaben nach URG gruppiert */}
      <div className="available-tasks">
        {unterrechtsgebiete.map(urg => (
          <Collapsible key={urg.id} title={urg.name}>
            {urg.themen.map(thema => (
              <div key={thema.id} className="thema-group">
                <h4>{thema.name}</h4>
                {thema.aufgaben.map(aufgabe => (
                  <Draggable key={aufgabe.id}>
                    <AufgabeChip aufgabe={aufgabe} />
                  </Draggable>
                ))}
              </div>
            ))}
          </Collapsible>
        ))}
      </div>

      {/* Rechte Seite: Blöcke zum Droppen */}
      <div className="blocks">
        {blocks.map(block => (
          <Droppable key={block.id}>
            <BlockCard block={block}>
              {block.aufgaben.map(aufgabe => (
                <AufgabeChip key={aufgabe.id} aufgabe={aufgabe} />
              ))}
            </BlockCard>
          </Droppable>
        ))}
      </div>
    </div>
  );
};
```

**Implementierungsplan:**
1. Step-12/15 refactoren für URG-Gruppierung
2. Aufgaben-Level Drag & Drop implementieren
3. State-Management anpassen (Aufgaben statt Themen auf Blöcke)
4. Validierung: Alle Aufgaben eines Themas müssen zugewiesen sein
5. UI: Collapsible URG-Gruppen

**Aufwand:** Groß (12-16h)

---

## Kategorie D: Architektur-Änderungen

### T7: Fächerauswahl für Nicht-Jura-Studiengänge

**Quelle:** tickets7.md

**Problem:**
Im Normal-Modus können nur Jura-Rechtsgebiete ausgewählt werden. Dies verhindert die Nutzung durch Studierende anderer Fachrichtungen.

**Betroffene Dateien:**
- `src/data/unterrechtsgebiete-data.js` - Hardcoded Jura-Daten
- `src/components/lernplan/unterrechtsgebiet-picker.jsx`
- `src/contexts/studiengang-context.jsx`
- `supabase/schema.sql` - Neue Tabellen nötig

**Analyse:**
`RECHTSGEBIET_LABELS` und alle Unterrechtsgebiete sind 100% auf Jura hardcoded.

**Kurzfristige Lösung (Quick Fix):**

```jsx
// In unterrechtsgebiet-picker.jsx
const { appMode } = useAppMode();

// Im Normal-Modus: Freitext-Option
{appMode === 'normal' && (
  <div className="mt-4">
    <label>Eigenes Fach erstellen</label>
    <input
      type="text"
      placeholder="z.B. Marketing, Anatomie, ..."
      value={customSubject}
      onChange={(e) => setCustomSubject(e.target.value)}
    />
    <Button onClick={handleAddCustomSubject}>Hinzufügen</Button>
  </div>
)}
```

**Langfristige Lösung (siehe tickets7.md):**

1. **Neue DB-Tabellen:**
```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE study_program_subjects (
  study_program TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  is_default BOOLEAN DEFAULT true
);
```

2. **Studiengang-spezifische Fächerlisten:**
- Jura: Öffentliches Recht, Zivilrecht, Strafrecht, ...
- BWL: Rechnungswesen, Marketing, Finanzierung, ...
- Medizin: Anatomie, Physiologie, Biochemie, ...
- Informatik: Algorithmen, Datenbanken, Softwareentwicklung, ...

3. **Benutzerdefinierte Fächer:**
- User können eigene Fächer hinzufügen
- Farbzuordnung
- CRUD-Operationen

**Implementierungsplan (Langfristig):**
1. DB-Schema erweitern
2. Seed-Daten für verschiedene Studiengänge
3. API-Endpoints für Fächer-Management
4. UI für Fächer-Auswahl und -Erstellung
5. Migration bestehender Themenlisten
6. Studiengang-Auswahl bei Registrierung

**Aufwand:** Groß (20-30h)

---

## Zusammenfassung: Empfohlene Reihenfolge

### Phase 1: Kritische Fixes (Sofort)
1. ✅ T8 - TypeError aufgaben/name [ERLEDIGT]
2. **T6.1** - Block-Eingabe aus Klausurensession ENTFERNEN (30min)
3. **T5.7** - Themen nicht abhakbar im Normal-Modus fixen (1-2h)
4. T6.5 - Zeitplan-Klick Verhalten (1-2h)
5. T5.6 - Lernplan-Button im Normal-Modus (30min)
6. **TNEU** - Normal-Modus Investigation durchführen (2-3h)

### Phase 2: Features & Quick Wins (Nächste Woche)
7. T5.1 - Fortschrittsberechnung + Abhakbarkeits-Logik (4-5h)
8. T5.3 - Themenlisten einklappbar (1h)
9. T5.4 - Themenlisten archivierbar (3-4h)

### Phase 3: UX-Verbesserungen & Settings (Nächster Sprint)
10. T4.1 - Session per Zeitbereich-Markierung (Google Calendar Style)
11. T4.2 - Wiederholung Enddatum
12. T6.3 - Drag & Drop Dashboard
13. **T-SET-1** - Zusätzliche Rechtsgebiete in Einstellungen
14. **T-DASH-1** - Dashboard: Aufgaben erstellen + Themen→Session kopieren (6-8h)

### Phase 4: Größere Änderungen (Roadmap)
15. T6.2 - Klassischer Terminkalender
16. T6.4 - Aufgaben-Level Block-Verteilung
17. T7 - Fächerauswahl Multi-Studiengang

---

## Nächste Schritte

1. **Sofort:** T6.1 fixen (Block-Eingabe entfernen) - 30min
2. **Sofort:** T5.7 fixen (Themen abhakbar machen) - 1-2h
3. **Investigation:** TNEU durchführen (Normal-Modus vs PRD)
4. **Code-Review:** Betroffene Dateien lesen für genaue Implementierung
5. **Implementierung:** Mit Phase 1 fortfahren
