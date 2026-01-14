# T15: Feedback Januar 2026 - Wichtige Punkte (Bugs)

## Status: ✅ ABGESCHLOSSEN (Bugs 1a, 1b, 2a, 2b, 2c + FR1, FR2)

---

## Ueberblick

### Urspruengliche Bugs
1. **Aufgaben von heute fehlen** - Aufgaben, die fuer den aktuellen Tag erstellt werden, erscheinen nicht in der Aufgabenuebersicht.
2. **Ansichten nicht verknuepft** - Monat-, Wochen- und Tagesansicht sind nicht synchron.
3. **Lernblock-Aufgaben fehlen in To-dos** - Im Lernblock erstellte Aufgaben tauchen nicht in der To-do-Liste auf.
4. **Onboarding nach Registrierung** - User soll nach Freischaltung zur Einstellungsseite geleitet werden (Studiengang, Modus als Pflichtfelder).

### Neu gefundene Bugs (aus Tests)
| ID | Bug | Schweregrad | Status |
|----|-----|-------------|--------|
| 1a | Themenliste: Aufgabeneingabe ab 2. Rechtsgebiet nur 1 Zeichen | Hoch | ✅ Gefixt (Memoization) |
| 1b | Themenliste → Session: Aufgaben verschwinden nach Drag & Drop | Hoch | ✅ Fix angewendet |
| 2a | Monatsansicht-Block erscheint nicht in Wochenansicht | Hoch | ✅ Gefixt (Sync) |
| 2b | Falscher Dialog (Session statt Block) beim Block-Klick | Mittel | ✅ Gefixt (onClick Handler) |
| 2c | Seiten-Refresh verursacht Absturz | Kritisch | ✅ T17 gefixt |

### Feature Requests
| ID | Feature | Status |
|----|---------|--------|
| FR1 | "Entschieben" von Aufgaben aus Sessions zurueck zu To-Dos | ✅ Implementiert |
| FR2 | Dritte Toggle-Position fuer Tages-Bloecke im linken Bereich | ✅ Implementiert |

### Design-Aenderungen
| ID | Aenderung |
|----|-----------|
| DF1 | Klaeren: Soll Drag & Drop im Normalen Modus deaktiviert werden? |

---

## Bug 1: Aufgaben am Tag erscheinen nicht in der Aufgabenuebersicht

### Symptom
Aufgaben, die fuer den aktuellen Tag angelegt werden, sind nicht in der Aufgabenuebersicht sichtbar.

### Erwartetes Verhalten
Neue Aufgaben mit Datum = heute erscheinen sofort in der Aufgabenuebersicht.

### Akzeptanzkriterien
- [ ] Neue Aufgabe mit Datum = heute ist direkt in der Aufgabenuebersicht sichtbar.
- [ ] Reload der Seite zeigt die Aufgabe weiterhin korrekt an.
- [ ] Keine Regression fuer Aufgaben mit zukuenftigem Datum.

### Analyse
Das Problem wirkt wie ein Inkonsistenz-Fehler zwischen Erstellung, Speicherung und Anzeige der Aufgabenliste. Typische Muster:
- **Datums-Normalisierung**: Tasks werden mit Uhrzeit/Timezone gespeichert, die Uebersicht filtert jedoch nur nach lokalem Tagesdatum (startOfDay/endOfDay). Dadurch kann "heute" in UTC als "gestern/morgen" enden.
- **State-Refresh**: Nach dem Erstellen wird die Aufgabenuebersicht nicht neu geladen oder der lokale Store nicht aktualisiert.
- **Filter-Logik**: Die Aufgabenuebersicht filtert evtl. auf ">= heute 00:00" und "< morgen 00:00" in einer anderen Zeitzone oder mit einem falschen Feld (z.B. `created_at` statt `due_date`).

### Moegliche Ursachen (Hypothesen)
1. Datumsvergleich basiert auf UTC, UI auf Local Time.
2. Aufgabenuebersicht bezieht Daten aus einem Cache, der nicht invalidiert wird.
3. Aufgaben-Query verwendet falsches Feld oder falschen Filter.
4. Aufgaben, die am Tag erstellt werden, erhalten kein `due_date` (null) und fallen aus dem Filter.

### Rueckfragen
- Wird in der Aufgabenuebersicht nach `due_date`, `start_time` oder `created_at` gefiltert?
- Welche Zeitzone wird beim Speichern des Datums verwendet?
- Tritt der Fehler bei allen Usern oder nur bei bestimmten Zeitzonen auf?

### Implementierungsplan (v1)
1. **Repro**: Aufgabe fuer heute erstellen, Daten in Storage/DB pruefen (Datum, Uhrzeit, Zeitzone).
2. **Trace**: Datenfluss von Create-Form -> API -> Store -> Aufgabenuebersicht nachverfolgen.
3. **Filter-Fix**: Datumsfilter auf ein gemeinsames Utility umstellen (z.B. `getDayRange(localDate)`).
4. **State-Sync**: Nach Create entweder re-fetch oder optimistisch in den Store einhaengen.
5. **Tests**: Unit-Test fuer Datumsfilter, UI-Test: Create -> sichtbar.

### Schwaechen in Plan v1
- Fokus auf Datum, aber evtl. ist es ein Cache/Invalidation-Problem.
- Keine Pruefung, ob `due_date` optional ist und Tasks ohne Datum bewusst ausgeblendet werden.
- Fehlende Strategie fuer Rueckwaerts-Kompatibilitaet bei alten Tasks mit leerem Datum.

### Implementierungsplan (v2, verbessert)
1. **Datenmodell klaeren**: Festlegen, welches Feld fuer "Aufgaben am Tag" gilt (`due_date` vs. `scheduled_at`).
2. **Zentrale Datumslogik**: Gemeinsame Utility fuer Tages-Range inkl. Zeitzone (Local -> UTC Conversion).
3. **Query/Filter angleichen**: Aufgabenuebersicht und Task-Create verwenden die gleiche Logik.
4. **Cache-Invalidation**: Bei Create und Update gezielt die Aufgabenliste fuer den aktuellen Tag invalidieren.
5. **Backfill/Default**: Tasks ohne Datum auf "heute" setzen oder bewusst ausnehmen (Entscheidung dokumentieren).
6. **Regression-Tests**: Heute, Morgen, Gestern, verschiedene Zeitzonen (mind. UTC+/-).

### Code-Analyse: Aufgaben-Erstellungsorte und Datenfluss

#### Aufgaben-Systeme im Ueberblick

Es gibt **drei getrennte Aufgaben-Speicherorte** mit unterschiedlichen Datenstrukturen:

| System | Supabase-Tabelle | Speicherort im Context | Datum-Feld |
|--------|------------------|------------------------|------------|
| **To-Do Tasks** | `calendar_tasks` | `tasksByDate[dateKey]` | `task_date` (DATE) |
| **Themenlisten-Aufgaben** | `content_plans` | `contentPlans[id].rechtsgebiete...aufgaben` | Kein direktes Datum |
| **Block-Aufgaben** | `time_sessions` | `timeSessions[id].tasks` | Via Block `startTime` |

#### Normaler Modus: 4 Erstellungsorte

**1. Themenliste (Dashboard links - SessionWidget)**
- **Datei:** `src/components/dashboard/session-widget.jsx` (ThemeListThemaRow, Zeile ~545-750)
- **Funktion:** `addAufgabeToPlan()` → CalendarContext (Zeile 2169)
- **Speicherung:** `content_plans` Tabelle, hierarchisch eingebettet
- **Anzeige:** Nur sichtbar wenn `selectedThemeListId` gesetzt ist
- **Verknuepfung:** `planId`, `rechtsgebietId`, `unterrechtsgebietId`, `kapitelId`, `themaId`

**2. To-Do Liste (Dashboard links)**
- **Datei:** `src/components/dashboard/session-widget.jsx` (TaskList, Zeile ~228-358)
- **Funktion:** `addTask()` → CalendarContext (Zeile 1239)
- **Speicherung:** `calendar_tasks` Tabelle
- **Anzeige:** Dashboard "Deine To-Dos" Bereich
- **Verknuepfung:** `date` (YYYY-MM-DD String)

**3. Aufgabenverwaltung (/verwaltung-aufgaben)**
- **Datei:** `src/components/verwaltung/aufgaben-content.jsx` (Zeile 62-537)
- **Funktion:** `addTask()` → CalendarContext
- **Speicherung:** `calendar_tasks` Tabelle
- **Anzeige:** Verwaltungs-Tabelle mit allen Tasks
- **Verknuepfung:** `date`, `subject`, `lernplanthema`, `lernblock`

**4. Manuell erstellte Bloecke (Dialog)**
- **Datei:** `src/features/calendar/components/manage-theme-session-dialog.jsx`
- **Funktion:** Inline in Block.tasks Array
- **Speicherung:** `time_sessions` Tabelle
- **Anzeige:** Block-Details im Zeitplan-Widget
- **Verknuepfung:** `block.id`, via Block-Datum

#### Examensmodus: Zusaetzlich

- Alle 4 obigen Stellen
- Monatsansicht mit Lernplan-Bloecken (Drag & Drop von Themenlisten-Aufgaben)

#### Datenfluss-Diagramm

```
┌─────────────────────────────────────────────────────────────┐
│                 AUFGABEN-ERSTELLUNG                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  THEMENLISTE:                                                │
│  SessionWidget → addAufgabeToPlan() → content_plans         │
│       ↓                                                      │
│  Anzeige: Nur in Themenliste-Hierarchie (Dashboard links)   │
│  NICHT in To-Do-Liste!                                       │
│                                                               │
│  TO-DO LISTE / AUFGABENVERWALTUNG:                          │
│  TaskList/AufgabenContent → addTask() → calendar_tasks      │
│       ↓                                                      │
│  Anzeige: Dashboard "Deine To-Dos" + Verwaltung-Tabelle     │
│                                                               │
│  BLOCK-AUFGABEN:                                             │
│  ManageThemeSessionDialog → Block.tasks → time_sessions     │
│       ↓                                                      │
│  Anzeige: Nur in Block-Details (Zeitplan-Widget)            │
│  NICHT in To-Do-Liste!                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Potenzielle Ursachen fuer Bug 1

Basierend auf der Analyse gibt es mehrere Szenarien:

1. **Themenlisten-Aufgaben erscheinen nicht in To-Do-Liste**
   - Das ist **by design**: Themenlisten-Aufgaben sind in `content_plans` gespeichert
   - Die To-Do-Liste zeigt nur `calendar_tasks`
   - **Loesung:** Entweder Aggregation beider Quellen oder klare UX-Trennung

2. **Block-Aufgaben erscheinen nicht in To-Do-Liste**
   - Ebenfalls **by design**: Block-Tasks sind in `time_sessions.tasks`
   - Nicht synchronisiert mit `calendar_tasks`
   - **Loesung:** Siehe Bug 3

3. **To-Do-Tasks mit Datum-Problem (Timezone)**
   - **Datei:** `aufgaben-content.jsx:77`
   - `new Date().toISOString().split('T')[0]` erzeugt UTC-Datum
   - Kann bei negativen Timezones um 1 Tag abweichen
   - **Datei:** `aufgaben-content.jsx:136-150`
   - `new Date(t.date) < today` vergleicht UTC mit lokaler Zeit
   - **Loesung:** Lokales Datum verwenden: `getLocalDateString(new Date())`

4. **State nicht aktualisiert nach Erstellung**
   - CalendarContext `addTask()` sollte State sofort updaten
   - Supabase-Sync koennte verzoegert sein
   - **Pruefen:** `use-supabase-sync.js` Callback-Reihenfolge

#### Kritische Code-Stellen

| Stelle | Datei:Zeile | Beschreibung |
|--------|-------------|--------------|
| Task-Erstellung UTC | `aufgaben-content.jsx:77` | `toISOString()` statt lokales Datum |
| Datumsfilter | `aufgaben-content.jsx:136-150` | UTC vs. lokaler Vergleich |
| addTask | `calendar-context.jsx:1239` | Task zu State hinzufuegen |
| saveDayTasks | `use-supabase-sync.js:1387-1432` | Speicherung nach Supabase |
| addAufgabeToPlan | `calendar-context.jsx:2169` | Themenlisten-Aufgabe (anderes System!) |

---

### User Stories zum Testen (Checkliste)

Bitte teste jeden Flow und notiere das Ergebnis:

#### US1: Themenliste auf Startseite (Normaler Modus)

**Vorbedingung:** Du bist auf der Startseite, eine Themenliste ist ausgewaehlt (links sichtbar)

| Schritt | Aktion | Erwartetes Ergebnis | OK? |
|---------|--------|---------------------|-----|
| 1 | Oeffne ein Thema in der Themenliste | Thema klappt auf | [ ] |
| 2 | Klicke "Neue Aufgabe hinzufuegen" | Eingabefeld erscheint | [ ] |
| 3 | Gib Aufgabentext ein und bestaetigen | Aufgabe erscheint unter dem Thema | [ ] |
| 4 | Seite neu laden (F5) | Aufgabe ist noch da | [ ] |

**Falls Fehler:** Bei welchem Schritt? Was passiert stattdessen?
```
Notizen:
```
ja es gibt bei den themenlisten ein problem welches ich schonmal aber anscheinend nciht richtig gelöst habe. nämlich kann ab dem zweiten rechtsgebiet keine aufgaben länger als einen buchstaben eingeben, wenn man im ansicht modus ist. 

wenn ich themen von der themenliste in eine session ziehe verschwinden die einfach, also in der themenliste ausgegraut und in der sessio nicht zu finden. 

---

#### US2: To-Do Liste auf Startseite (Normaler Modus)

**Vorbedingung:** Du bist auf der Startseite, links ist "Deine To-Dos" sichtbar

| Schritt | Aktion | Erwartetes Ergebnis | OK? |
|---------|--------|---------------------|-----|
| 1 | Klicke "Neue Aufgabe" im To-Do Bereich | Eingabefeld erscheint | [ ] |
| 2 | Gib Aufgabentext ein und bestaetigen | Aufgabe erscheint in der Liste | [ ] |
| 3 | Seite neu laden (F5) | Aufgabe ist noch da | [ ] |
| 4 | Gehe zu Verwaltung > Aufgaben | Aufgabe erscheint in der Tabelle (Datum = heute) | [ ] |

**Falls Fehler:** Bei welchem Schritt? Was passiert stattdessen?
```
Notizen:
```
also wenn man aufgaben von in der todo erstellt und dann in eine session zieht und dann von da lösht verschwinden die aufgaben komplett vielleicht hier eine option die aufgaben wieder "entschieben" das sie wieder auf der linken seite erscheinen. aber ansonsten kein fehler. 
---

#### US3: Aufgabenverwaltung (/verwaltung-aufgaben)

**Vorbedingung:** Du bist auf der Seite Verwaltung > Aufgaben

| Schritt | Aktion | Erwartetes Ergebnis | OK? |
|---------|--------|---------------------|-----|
| 1 | Klicke "Neue Aufgabe" Button | Formular oeffnet sich | [ ] |
| 2 | Gib Titel ein, Datum = heute, speichern | Aufgabe erscheint in Tabelle | [ ] |
| 3 | Seite neu laden (F5) | Aufgabe ist noch da | [ ] |
| 4 | Gehe zur Startseite | Aufgabe erscheint in "Deine To-Dos" (wenn heute) | [ ] |
| 5 | Filtere nach "Heute" | Aufgabe wird angezeigt | [ ] |
| 6 | Filtere nach "Zukuenftig" | Aufgabe wird NICHT angezeigt | [ ] |

**Falls Fehler:** Bei welchem Schritt? Was passiert stattdessen?
```
Notizen:
```
also ich möchte nicht das hier aufgaben erstellt werden, also das muss aktiv verhindert werden. hier geht es nur um korrektur und verwaltung. also wenn man aufgaben gemacht hat aber nicht abgehakt etc. keine aufgaben erstellen. 
---

#### US4: Block/Session erstellen (Wochenansicht oder Dialog)

**Vorbedingung:** Du bist auf der Startseite oder Wochenansicht

| Schritt | Aktion | Erwartetes Ergebnis | OK? |
|---------|--------|---------------------|-----|
| 1 | Erstelle einen neuen Block (manuell) fuer heute | Block erscheint im Zeitplan | [ ] |
| 2 | Oeffne den Block (Klick oder Bearbeiten) | Dialog oeffnet sich | [ ] |
| 3 | Fuege eine Aufgabe im Block hinzu | Aufgabe erscheint in Block-Details | [ ] |
| 4 | Schliesse Dialog und oeffne erneut | Aufgabe ist noch da | [ ] |
| 5 | Seite neu laden (F5) | Block + Aufgabe sind noch da | [ ] |
| 6 | Pruefe "Deine To-Dos" links | Erscheint die Block-Aufgabe dort? | [ ] |

**Falls Fehler:** Bei welchem Schritt? Was passiert stattdessen?
```
Notizen:
```
also einen block erstellt in der monatsansicht erscheint nciht in der wochenansicht einfach automatisch. 
viel mehr noch wenn man auf einen tag klickt in der monatsansicht und dann auf spezifischen block, dann kann kommt nicht das gleiche block erstellungsdialogfenster wie wenn man einfach auf das plus klickt. es kommt das sessiondialogfenster und das sollte ja wirklich gar nicht so sein. 
hier am rande mit einem refresh der seite kann man das programm abstürzen lassen. lol. dass sollte nicht so sein. 
ich glaube um blöcke und deren aufgaben anzeigen auf der startseite zu lassen, sollte der toggle (der im normalen modus todos, themenliste anzeigt) im linken div eine dritte toggle position zu lassen, dass todos themenlisten und blöcke angezeiegt werden können. es können aber nur die tagesblöcke anzeigen lassen. also wenn für das datum kein blöck erstellt wurde kann man auch keinen anzeigen.  

---

#### US5: Themenliste-Aufgabe in Block planen (Drag & Drop)

**Vorbedingung:** Themenliste ausgewaehlt, Block fuer heute existiert

| Schritt | Aktion | Erwartetes Ergebnis | OK? |
|---------|--------|---------------------|-----|
| 1 | Erstelle Aufgabe in Themenliste (wie US1) | Aufgabe erscheint | [ ] |
| 2 | Ziehe Aufgabe auf einen Block | Aufgabe wird zum Block hinzugefuegt | [ ] |
| 3 | Aufgabe in Themenliste ist ausgegraut | Markiert als "geplant" | [ ] |
| 4 | Oeffne Block | Aufgabe ist dort sichtbar | [ ] |
| 5 | Seite neu laden (F5) | Zustand bleibt erhalten | [ ] |

**Falls Fehler:** Bei welchem Schritt? Was passiert stattdessen?
```
Notizen:
```
auch das sollte nicht möglich sein im normalen modus bzw. ich verstehe gar nicht wie das möglich sein sollte. 
---

#### Zusammenfassung nach Test (Normaler Modus)

| User Story | Status | Gefundene Probleme |
|------------|--------|-------------------|
| US1: Themenliste | BUGS | 1a, 1b |
| US2: To-Do Liste | OK (Feature Request) | FR1 |
| US3: Aufgabenverwaltung | OK | - |
| US4: Block-Aufgaben | BUGS | 2a, 2b, 2c, FR2 |
| US5: Drag & Drop | DESIGN-FRAGE | DF1 |

---

### Gefundene Bugs aus Tests

#### Bug 1a: Themenliste - Aufgabeneingabe ab 2. Rechtsgebiet fehlerhaft
- **Symptom:** Ab dem zweiten Rechtsgebiet kann man keine Aufgaben laenger als einen Buchstaben eingeben (im Ansichtsmodus)
- **Schweregrad:** Hoch
- **Betroffene Datei:** `src/components/dashboard/session-widget.jsx` (ThemeListThemaRow)

**Root Cause:** State-Reset beim Re-Render durch fehlende Memoization

| Stelle | Datei:Zeile | Problem |
|--------|-------------|---------|
| State-Variablen | `session-widget.jsx:562-563` | `editingAufgabeId`, `editingTitle` sind lokaler State |
| isEditing Condition | `session-widget.jsx:738-739` | Wird bei jedem Render neu evaluiert |
| Input-Handler | `session-widget.jsx:780-781` | `onChange` setzt `editingTitle` |
| Map ohne Memo | `session-widget.jsx:734` | `thema.aufgaben.map()` ohne Memoization |

**Ursache im Detail:**
- Beim 1. Rechtsgebiet funktioniert es, weil die Komponenten-Instanz stabil bleibt
- Beim 2. Rechtsgebiet wird eine NEUE `ThemeListUnterrechtsgebietRow`-Instanz erstellt
- Der globale State-Update von `onUpdateAufgabe` interferiert mit dem lokalen State
- Bei jedem Tastendruck wird das gesamte Aufgaben-Array neu gemappt → Input-Reset

**Fix:** Memoization der Aufgaben-Map und State-Isolation zwischen Rechtsgebiet-Instanzen

#### Bug 1b: Themenliste → Session Drag & Drop verliert Aufgaben
- **Symptom:** Wenn Themen von der Themenliste in eine Session gezogen werden, verschwinden sie (ausgegraut in Themenliste, nicht in Session zu finden)
- **Schweregrad:** Hoch
- **Betroffene Funktionen:** `scheduleAufgabeToBlock()`, `unscheduleAufgabeFromBlock()`

**Root Cause:** Asynchrone State-Updates und Dateninkonsistenz

| Schritt | Datei:Zeile | Was passiert |
|---------|-------------|--------------|
| 1. Drag Start | `session-widget.jsx:601-611` | Task mit `type: 'task', source: 'themenliste'` |
| 2. Drop Handler | `zeitplan-widget.jsx:428-431` | Ruft `onDropTaskToBlock()` auf |
| 3. Task erstellen | `dashboard.jsx:754-762` | Neue Task mit `sourceId` und `text` |
| 4. In Block speichern | `dashboard.jsx:778-779` | `updateTimeBlock({ tasks: [...existing, newTask] })` |
| 5. Grau markieren | `dashboard.jsx:836-840` | `scheduleAufgabeToBlock(droppedTask.id, ...)` |
| 6. UI-Check | `session-widget.jsx:569` | `aufgabe.scheduledInBlock` → grau |

**Das Problem:**
1. Task wird in `block.tasks` Array gespeichert (TimeBlocks)
2. Original-Aufgabe in `contentPlans` wird als `scheduledInBlock` markiert
3. ABER: Die Task in `block.tasks` wird NICHT mit Original-Metadaten synchronisiert
4. ManageThemeSessionDialog filtert Aufgaben basierend auf `sourceId` (Zeile 133)
5. Aufgabe erscheint weder in verfuegbarer Liste noch in Block-Ansicht

**Fix angewendet (2 Aenderungen):**

1. **ZeitplanWidget lokale State-Synchronisation** (`zeitplan-widget.jsx:72-83`)
   - Vorher: `useEffect` hatte `[data]` als Dependency (zu breit)
   - Nachher: `[data?.blocks]` mit Deep-Compare um Task-Aenderungen zu erkennen
   ```javascript
   useEffect(() => {
     const newBlocks = data?.blocks || [];
     setBlocks(prevBlocks => {
       const prevJson = JSON.stringify(prevBlocks);
       const newJson = JSON.stringify(newBlocks);
       if (prevJson !== newJson) return newBlocks;
       return prevBlocks;
     });
   }, [data?.blocks]);
   ```

2. **Robusteres Block-ID-Matching** (`dashboard.jsx:660-673`, `858-871`)
   - Vorher: Einfache OR-Verknuepfung mit strikten Gleichheitspruefungen
   - Nachher: Separate If-Pruefungen fuer alle ID-Typen (timeblock-xxx, UUID, contentId, topicId)
   ```javascript
   const isBlockMatch = (blk, targetBlock) => {
     if (blk.id && targetBlock.id && blk.id === targetBlock.id) return true;
     if (blk.contentId && (blk.contentId === targetBlock.id || ...)) return true;
     // Reverse checks fuer bidirektionales Matching
     ...
   };
   ```

**Status:** ✅ Fix angewendet - Tests erforderlich

#### Bug 2a: Monatsansicht-Block erscheint nicht in Wochenansicht
- **Symptom:** Block in Monatsansicht erstellt erscheint nicht automatisch in der Wochenansicht
- **Schweregrad:** Hoch

**Root Cause:** Zwei verschiedene Datenquellen fuer Monats- vs. Wochenansicht

| Ansicht | Datenquelle | Supabase-Tabelle |
|---------|-------------|------------------|
| Monatsansicht | `blocksByDate` | `calendar_blocks` |
| Wochenansicht | `timeBlocksByDate` | `time_sessions` |

**Kritische Code-Stellen:**

| Stelle | Datei:Zeile | Problem |
|--------|-------------|---------|
| Block hinzufuegen | `calendar-view.jsx:213` | Nutzt `updateDayBlocks` aus blockUtils (falsche Funktion) |
| Async ohne await | `calendar-view.jsx:216` | `updateContextDayBlocks()` OHNE `await` aufgerufen |
| Alias verwirrt | `calendar-view.jsx:46` | `updateDayBlocks: updateContextDayBlocks` Alias |
| Monatsansicht speichert | `calendar-context.jsx:369` | In `blocksByDate` (calendar_blocks) |
| Wochenansicht liest | `week-view.jsx:123` | Aus `timeBlocksByDate` (time_sessions) |

**Das Problem:**
1. Monatsansicht speichert in `calendar_blocks` (position-basiert: Block 1-4)
2. Wochenansicht liest aus `time_sessions` (zeit-basiert: start_at/end_at)
3. Diese sind ZWEI VERSCHIEDENE Tabellen - keine automatische Synchronisation!

**Fix-Optionen:**
1. Monatsansicht sollte `addTimeBlock` verwenden (speichert in time_sessions)
2. Oder: Automatische Spiegelung zwischen beiden Tabellen
3. Mindestens: `await` bei Zeile 216 hinzufuegen

#### Bug 2b: Falscher Dialog beim Block-Klick in Monatsansicht
- **Symptom:** Klick auf Tag → Klick auf Block oeffnet Session-Dialog statt Block-Dialog
- **Schweregrad:** Mittel

**Root Cause:** Event Bubbling Problem durch `pointer-events-none`

| Stelle | Datei:Zeile | Problem |
|--------|-------------|---------|
| Block-Div | `learning-session.jsx:93` | `pointer-events-none` auf Block-Container |
| Add-Button | `learning-session.jsx:31-32` | Hat `e.stopPropagation()` (korrekt) |
| DayTile | `day-tile.jsx:29` | Generischer `onClick` ohne Block-Unterscheidung |
| handleDayClick | `calendar-view.jsx:337` | Unterscheidet nicht Block vs. Day |

**Event-Flow (BUG):**
```
Klick auf Block (learning-session.jsx:93)
  ↓ pointer-events-none → Event bubbelt
DayTile onClick (day-tile.jsx:29)
  ↓
handleDayClick (calendar-view.jsx:337)
  ↓
DayManagementDialog oeffnet sich (FALSCH!)
```

**Fix:**
1. `pointer-events-none` von Block-Container entfernen
2. Eigenen onClick-Handler fuer Block mit `e.stopPropagation()`
3. Block-Klick sollte ManageThemeSessionDialog oeffnen, nicht DayManagementDialog

#### Bug 2c: Seiten-Refresh verursacht Absturz
- **Symptom:** Refresh der Seite in bestimmtem Zustand laesst das Programm abstuerzen
- **Schweregrad:** Kritisch

**Root Cause:** Fehlende Null-Checks und Race Conditions beim State-Restore

**Absturzpfade identifiziert:**

| # | Datei:Zeile | Fehler | TypeError |
|---|-------------|--------|-----------|
| 1 | `day-management-dialog.jsx:180` | `learningBlocks.map()` | Cannot read 'map' of undefined |
| 2 | `calendar-context.jsx:225` | `Object.entries(blocksByDate)` | Cannot read Symbol.iterator of undefined |
| 3 | `calendar-context.jsx:214` | `contentPlans.filter()` | Cannot read 'filter' of undefined |
| 4 | `blockUtils.ts:266` | `blocks.forEach()` | Cannot read 'forEach' of undefined |
| 5 | `use-supabase-sync.js:1032` | `blocks.forEach()` | blocks.forEach is not a function |
| 6 | `calendar-view.jsx:422-427` | `selectedDay` null nach Refresh | Race Condition |

**Warum der Absturz passiert:**

1. **State wird nicht korrekt restored:**
   - `selectedDay` = null (useState default)
   - `blocksByDate` = {} oder undefined
   - `visibleBlocksByDate` = undefined (useMemo nicht berechnet)

2. **Fehlende Null-Checks:**
   - `.map()`, `.filter()`, `.forEach()` auf undefined
   - `Object.entries()` auf undefined

3. **Race Condition:**
   - Dialog ist noch "offen" (selectedDay gespeichert)
   - Page Refresh startet
   - Context-Daten werden aus Supabase geladen
   - Dialog versucht auf undefined Daten zuzugreifen

4. **Keine Error Boundaries:**
   - Keine `ErrorBoundary` Komponente vorhanden
   - Fehler propagieren bis zur Root

**Fix-Prioritaeten:**
1. Null-Checks in `blockUtils.ts:266` und `calendar-context.jsx:225`
2. Guard in `day-management-dialog.jsx:180`
3. Error Boundary um CalendarView
4. `selectedDay` State auf Refresh clearen
5. localStorage Validierung beim Load

**Fixes angewendet:**

1. **Null-Checks** (`calendar-context.jsx:213-227`, `blockUtils.ts:266`, `day-management-dialog.jsx:180`, `use-supabase-sync.js:1032`)
   - Guards gegen null/undefined bei `.map()`, `.filter()`, `.forEach()`, `Object.entries()`

2. **Auth Promise Error Handling** (`auth-context.jsx:196-202`)
   - `.catch()` Handler fuer `getSession()` Promise
   - Stellt sicher dass `loading` immer auf `false` gesetzt wird

3. **Auth State Change Error Handling** (`auth-context.jsx:205-237`)
   - `try-catch` um den async Callback
   - Verhindert dass unbehandelte Fehler das Loading blockieren

**Status:** ✅ GEFIXT (siehe auch T17 fuer weitere Fixes: Safe Storage, Auth Timeout, HMR Guards)

---

### Feature Requests aus Tests

#### FR1: "Entschieben" von Aufgaben aus Sessions
- **Wunsch:** Wenn eine To-Do-Aufgabe in eine Session gezogen und dort geloescht wird, soll sie wieder in der To-Do-Liste erscheinen (statt komplett zu verschwinden)
- **Loesung:** Option "Zurueck zu To-Dos" beim Loeschen aus Session

---

### FR1 Implementierungsplan

**Status:** ✅ IMPLEMENTIERT (2026-01-14)

#### Durchgeführte Änderungen:
1. ✅ `calendar-context.jsx`: `scheduleTaskToBlock()` und `unscheduleTaskFromBlock()` hinzugefügt
2. ✅ `dashboard.jsx:840-856`: Drag-Handler verwendet jetzt `scheduleTaskToBlock()` statt `removeTask()`
3. ✅ `dashboard.jsx:86-89`: `availableAufgaben` filtert geplante Tasks aus der To-Do-Liste
4. ✅ `use-dashboard.js:196`: `scheduledInBlock` Property wird jetzt mit übertragen (fehlte ursprünglich)
5. ✅ `zeitplan-widget.jsx:559-576`: Neuer Pfeil-zurück-Button für "Entplanen" (blau)
6. ✅ `dashboard.jsx:921-970`: Neuer `handleUnscheduleTaskFromBlock()` Callback für Entplanen
7. ✅ `dashboard.jsx:911-918`: `handleRemoveTaskFromBlock()` löscht jetzt permanent (ruft `removeTask()`)
8. ✅ `dashboard.jsx:1199`: `onUnscheduleTaskFromBlock` Prop an ZeitplanWidget übergeben

#### Zwei-Button-System (UI):
- **Pfeil-zurück (←)** - Blau, "Zurück zur To-Do-Liste": Entfernt Task aus Block UND setzt ihn zurück in die To-Do-Liste
- **X-Button** - Rot, "Aufgabe löschen": Entfernt Task aus Block UND löscht ihn permanent aus der To-Do-Liste

#### Erwartetes Verhalten:
- **Drag to Session**: Task verschwindet aus To-Do-Liste, erscheint nur in der Session
- **Pfeil-zurück klicken**: Task wird aus Session entfernt und erscheint wieder in der To-Do-Liste
- **X-Button klicken**: Task wird aus Session entfernt und permanent gelöscht

#### Analyse des aktuellen Verhaltens

**Themenliste-Aufgaben (funktioniert bereits):**
```
Drag to Block:
  → scheduleAufgabeToBlock() markiert aufgabe.scheduledInBlock = true
  → Aufgabe bleibt in contentPlans, wird ausgegraut

Delete from Block:
  → unscheduleAufgabeFromBlock() setzt scheduledInBlock = false
  → Aufgabe erscheint wieder in Themenliste
```

**To-Do-Aufgaben (Problem):**
```
Drag to Block:
  → removeTask() LÖSCHT die Aufgabe aus calendar_tasks ❌
  → Task wird zu block.tasks hinzugefügt mit source: 'todos'

Delete from Block:
  → Task wird aus block.tasks entfernt
  → KEINE Wiederherstellung möglich, da Original gelöscht ❌
```

#### Lösungsansatz: "Soft Delete" für To-Do-Tasks

Statt To-Do-Tasks beim Drag komplett zu löschen, markieren wir sie als "geplant" (ähnlich wie Themenliste):

```
calendar_tasks: {
  id: 'task-123',
  text: 'Aufgabe XYZ',
  scheduledInBlock: {        // NEU: Block-Info statt Löschung
    blockId: 'timeblock-456',
    date: '2026-01-15',
    blockTitle: 'Lernblock'
  }
}
```

#### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `calendar-context.jsx` | Neue Funktionen: `scheduleTaskToBlock()`, `unscheduleTaskFromBlock()` |
| `dashboard.jsx:838-840` | `removeTask()` → `scheduleTaskToBlock()` |
| `dashboard.jsx:899-902` | Zusätzlich: `unscheduleTaskFromBlock()` für `source: 'todos'` |
| `session-widget.jsx` | TaskList: Ausgrauen wenn `scheduledInBlock` gesetzt |

#### Implementierungsschritte

**Schritt 1: calendar-context.jsx - Neue Funktionen**

```javascript
// Markiert To-Do-Task als "geplant" (statt Löschen)
const scheduleTaskToBlock = useCallback(async (taskId, blockInfo) => {
  const allTasks = { ...tasksByDate };

  for (const [dateKey, tasks] of Object.entries(allTasks)) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const updatedTasks = tasks.map(t =>
        t.id === taskId
          ? { ...t, scheduledInBlock: blockInfo }
          : t
      );
      await saveDayTasks(dateKey, updatedTasks);
      return;
    }
  }
}, [tasksByDate, saveDayTasks]);

// Entfernt "geplant"-Markierung (Task erscheint wieder in To-Do)
const unscheduleTaskFromBlock = useCallback(async (taskId) => {
  const allTasks = { ...tasksByDate };

  for (const [dateKey, tasks] of Object.entries(allTasks)) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const updatedTasks = tasks.map(t =>
        t.id === taskId
          ? { ...t, scheduledInBlock: null }
          : t
      );
      await saveDayTasks(dateKey, updatedTasks);
      return;
    }
  }
}, [tasksByDate, saveDayTasks]);
```

**Schritt 2: dashboard.jsx - Drag Handler ändern**

```javascript
// Zeile 838-840: VORHER
if (source === 'todos' && itemsWereAdded) {
  removeTask(droppedTask.id);  // ❌ Löscht komplett
}

// NACHHER
if (source === 'todos' && itemsWereAdded) {
  scheduleTaskToBlock(droppedTask.id, {
    blockId: targetBlockId,
    date: dateString,
    blockTitle: block.title || 'Lernblock',
  });
}
```

**Schritt 3: dashboard.jsx - Remove Handler erweitern**

```javascript
// Zeile 899-902: VORHER (nur Themenliste)
if (task.sourceId && unscheduleAufgabeFromBlock) {
  unscheduleAufgabeFromBlock(task.sourceId);
}

// NACHHER (Themenliste UND To-Dos)
if (task.source === 'themenliste' && task.sourceId && unscheduleAufgabeFromBlock) {
  unscheduleAufgabeFromBlock(task.sourceId);
} else if (task.source === 'todos' && task.sourceId && unscheduleTaskFromBlock) {
  unscheduleTaskFromBlock(task.sourceId);
}
```

**Schritt 4: session-widget.jsx - To-Do-Liste filtern**

```javascript
// TaskList Komponente: Geplante Tasks ausgrauen oder ausblenden

// Option A: Ausgrauen (wie Themenliste)
const isScheduled = task.scheduledInBlock != null;
<div className={isScheduled ? 'opacity-50' : ''}>

// Option B: Komplett ausblenden
const visibleTasks = allTasks.filter(t => !t.scheduledInBlock);
```

#### Datenmodell-Erweiterung

**calendar_tasks Tabelle (Supabase):**

```sql
-- Migration hinzufügen
ALTER TABLE calendar_tasks
ADD COLUMN IF NOT EXISTS scheduled_in_block JSONB DEFAULT NULL;

-- scheduled_in_block Format:
-- NULL = nicht geplant (sichtbar in To-Do)
-- { "blockId": "...", "date": "...", "blockTitle": "..." } = geplant
```

#### Edge Cases

| Szenario | Verhalten |
|----------|-----------|
| Task in Block geplant, Block gelöscht | `unscheduleTaskFromBlock()` wird aufgerufen → Task erscheint wieder |
| Task in Block geplant, Block editiert | Task bleibt geplant, blockInfo bleibt erhalten |
| Task aus To-Do gelöscht (nicht geplant) | Normales `deleteTask()`, kein Einfluss auf Blocks |
| Gleiche Task zweimal in Block ziehen | Prüfung: Wenn `scheduledInBlock` gesetzt, Drag verhindern |

#### Aufwandsschätzung

| Schritt | Dateien | Komplexität |
|---------|---------|-------------|
| 1. Context-Funktionen | `calendar-context.jsx` | Mittel |
| 2. Drag Handler | `dashboard.jsx` | Niedrig |
| 3. Remove Handler | `dashboard.jsx` | Niedrig |
| 4. UI Filter | `session-widget.jsx` | Niedrig |
| 5. Supabase Migration | `migration-fr1.sql` | Niedrig |
| 6. Tests | - | Mittel |

**Gesamt:** ~2-3 Stunden

#### Testfälle

- [ ] To-Do erstellen → in Block ziehen → To-Do ausgegraut/ausgeblendet
- [ ] Block mit To-Do öffnen → Task löschen → To-Do erscheint wieder
- [ ] Block mit To-Do löschen → To-Do erscheint wieder
- [ ] Seite neu laden → Zustand bleibt erhalten
- [ ] Supabase Sync funktioniert

#### FR2: Dritte Toggle-Position fuer Bloecke

**Status:** ✅ IMPLEMENTIERT (2026-01-14)

#### Durchgeführte Änderungen:
1. ✅ `session-widget.jsx`: Toggle auf 3 Positionen erweitert (To-Dos, Themen, Blöcke)
2. ✅ `session-widget.jsx`: Responsive Toggle - nur Icons auf kleinen Bildschirmen (`hidden sm:inline`)
3. ✅ `session-widget.jsx`: `BlocksListView` Komponente mit aufklappbaren Blöcken und Aufgaben
4. ✅ `dashboard.jsx`: `todayBlocksForWidget` - verwendet `blocksByDate` (calendar_blocks), NICHT `timeBlocksByDate`
5. ✅ `dashboard.jsx`: Alle FR2 Task-Handler verwenden `updateDayBlocks` statt `updateTimeBlock`

#### Wichtige Design-Entscheidungen:
- **Datenquelle:** `blocksByDate` (calendar_blocks) - Block-Kapazitäten aus Monatsansicht
- **NICHT:** `timeBlocksByDate` (time_sessions) - Sessions mit Uhrzeiten aus Zeitplan
- Multi-Slot-Blöcke werden nach `topicId`/`contentId` gruppiert und zusammengeführt

#### Original-Design:

**Wunsch:** Der Toggle im linken Bereich (Todos/Themenliste) soll eine dritte Position bekommen: "Bloecke"

**Design-Entscheidungen (bestaetigt):**
- **Inhalt:** Bloecke + Aufgaben + Aktionen (aufklappbar)
- **Datum:** Immer heute (nur Tages-Bloecke)
- **Interaktion:** Block aufklappen zeigt Aufgaben inline

**UI-Mockup:**
```
┌─────────────────────────────────────────────────┐
│  ○ To-Dos  ○ Themenliste  ● Bloecke            │  ← Toggle (3 Positionen)
├─────────────────────────────────────────────────┤
│  Heute, 14. Januar 2026                         │  ← Datum-Header
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ▼ Lernblock: Zivilrecht                 │   │  ← Block (aufklappbar)
│  │   08:00 - 10:00                         │   │
│  ├─────────────────────────────────────────┤   │
│  │  ☐ BGB AT Pruefungsschema      !! [X]  │   │  ← Aufgabe
│  │  ☑ Schuldrecht Fälle lesen     !  [X]  │   │
│  │  + Aufgabe hinzufuegen                  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ▶ Pufferblock (zugeklappt)              │   │
│  │   14:00 - 15:00                         │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Aktionen pro Aufgabe:**

| Element | Aktion | Verfuegbar |
|---------|--------|------------|
| Checkbox | Aufgabe als erledigt markieren | ✅ Ja |
| Text | Aufgabe bearbeiten (inline) | ✅ Ja |
| Priority-Icon (!!/!) | Priority aendern | ✅ Ja |
| X Loeschen | Aufgabe aus Block loeschen | ✅ Ja |
| ← Pfeil zurueck | Zurueck zur To-Do-Liste | ❌ Nein* |

*Hinweis: Kein "Zurueck"-Pfeil, da Block-Aufgaben keine To-Do-Aufgaben sind. Die drei Listen (To-Do, Themenliste, Bloecke) sind komplett getrennt aus User-Sicht.

**Farbcodierung nach Rechtsgebiet:**
- Zivilrecht → Blau
- Strafrecht → Rot
- Oeffentliches Recht → Gruen
- Pufferblock → Grau
- Urlaubstag → Gelb

**Implementierung:**

| Schritt | Datei | Aenderung |
|---------|-------|-----------|
| 1 | `session-widget.jsx` | Toggle auf 3 Positionen erweitern |
| 2 | `session-widget.jsx` | Neue Komponente `BlocksListView` |
| 3 | `dashboard.jsx` | Tages-Bloecke an SessionWidget uebergeben |
| 4 | Test | Bloecke fuer heute anzeigen, aufklappen, Aufgaben verwalten |

**Edge Cases:**
- Keine Bloecke fuer heute → Hinweis "Keine Bloecke fuer heute"
- Block ohne Aufgaben → Leerer Block mit "+ Aufgabe hinzufuegen"

---

### Design-Fragen

#### DF1: Drag & Drop im Normalen Modus
- **Frage:** Soll Drag & Drop von Themenliste zu Block im normalen Modus ueberhaupt moeglich sein?
- **Aktueller Stand:** Es scheint moeglich zu sein, aber User erwartet das nicht
- **Entscheidung noetig:** Deaktivieren im normalen Modus?

---

### Neuer Bug 4: Onboarding nach Registrierung

#### Symptom
Der Prozess nach Registrierung und Freischaltung durch Admin ist unklar.

#### Erwartetes Verhalten
1. User registriert sich
2. Admin schaltet User frei
3. Bei erster Anmeldung → automatische Weiterleitung zu Einstellungen
4. User MUSS folgende Einstellungen vornehmen:
   - Studiengang-Auswahl (Pflicht)
   - Modus-Auswahl (Normal/Examen) (Pflicht)
5. Erst nach Abschluss → Zugang zur App

#### Akzeptanzkriterien
- [ ] Neuer User wird nach Freischaltung zu `/einstellungen` geleitet
- [ ] Pflichtfelder sind markiert und validiert
- [ ] Ohne Studiengang kann App nicht genutzt werden
- [ ] Ohne Modus-Auswahl kann App nicht genutzt werden
- [ ] Nach Abschluss → Weiterleitung zur Startseite

#### Analyse erforderlich
- Aktueller Registrierungs-Flow dokumentieren
- Pruefung: Gibt es bereits ein `onboarding_completed` Flag in `user_settings`?
- Welche Einstellungen sind aktuell Pflicht?

---

## Bug 2: Verknuepfung Monat - Wochen - Tagesansicht

### Symptom
Die Kalenderansichten (Monat, Woche, Tag) sind nicht gekoppelt. Aktionen in einer Ansicht aktualisieren die anderen nicht.

### Erwartetes Verhalten
- Die ausgewaehlte Woche/der ausgewaehlte Tag ist in allen Ansichten synchron.
- Ein Klick in der Monatsansicht oeffnet die korrekte Woche/den korrekten Tag.

### Akzeptanzkriterien
- [ ] Wechsel der Ansicht behaelt Datumskontext bei (Monat -> Woche -> Tag).
- [ ] Datumsauswahl in einer Ansicht spiegelt sich in den anderen wider.

### Analyse
Die Kalenderansichten scheinen jeweils ihren eigenen lokalen Datumszustand zu halten. Dadurch verliert die Navigation beim Wechsel der Ansicht den Kontext. Symptome deuten auf fehlenden Single-Source-of-Truth fuer "selectedDate" und fehlende Synchronisierung zwischen Routen, Context und UI-States.

### Moegliche Ursachen (Hypothesen)
1. Monat/Woche/Tag nutzen getrennte States und aktualisieren keinen gemeinsamen Context.
2. Navigation zwischen Views setzt Datum auf "heute" statt den ausgewaehlten Tag zu uebernehmen.
3. Route-Parameter fuer Datum fehlen oder werden ignoriert.
4. Click-Handler in der Monatsansicht feuert Navigation ohne Datumspayload.

### Rueckfragen
- Gibt es bereits einen globalen Calendar-Context mit `selectedDate`?
- Soll das Datum im URL-Query persistiert werden (shareable deep link)?
- Wie soll sich der Wechsel verhalten, wenn ein User in der Monatsansicht eine Woche auswaehlt?

### Implementierungsplan (v1)
1. **Inventur**: Alle Stellen suchen, die Datum/Ansicht verwalten (Context, Router, Komponenten).
2. **Single Source**: Einen zentralen `selectedDate` im Context einfuehren/verwenden.
3. **Sync**: View-Wechsel nutzt `selectedDate`, statt `new Date()`.
4. **Click-Flow**: Monatsklick setzt `selectedDate` und navigiert in die Zielansicht.
5. **Tests**: Klick Monat -> Woche -> Tag behaelt Datum.

### Schwaechen in Plan v1
- Gefahr von Endlosschleifen, wenn Route und Context sich gegenseitig updaten.
- Keine klare Entscheidung, ob URL-Parameter oder Context die Quelle der Wahrheit ist.
- Fehlende Edge-Cases (Kalenderwoche mit Monatswechsel, Sommerzeit).

### Implementierungsplan (v2, verbessert)
1. **Quelle der Wahrheit festlegen**: Entweder Context (state-first) oder URL (route-first) als primaere Quelle.
2. **Sync-Strategie definieren**: Guard gegen doppelte Updates (z.B. compare before set).
3. **Routing mit Datum**: Optional `?date=YYYY-MM-DD` einfuehren, wenn shareable Links gewuenscht.
4. **UI-Handler konsolidieren**: Alle Datumsaenderungen ueber eine Funktion `setSelectedDate(nextDate, origin)` leiten.
5. **Edge-Cases testen**: Monatswechsel, Wochenuebergaenge, unterschiedliche Locale-FirstDay.

---

## Bug 3: Lernblock-Aufgaben erscheinen nicht als To-do

### Symptom
Aufgaben, die im Lernblock erstellt oder editiert werden, erscheinen nicht in der To-do-Liste.

### Erwartetes Verhalten
Aufgaben aus Lernbloecken werden wie normale Aufgaben in der To-do-Uebersicht angezeigt.

### Akzeptanzkriterien
- [ ] Neue Lernblock-Aufgabe erscheint in der To-do-Liste.
- [ ] Aenderungen im Lernblock (Titel/Status) werden in der To-do-Liste reflektiert.

### Analyse
Es gibt vermutlich eine Trennung zwischen Lernblock-Daten und Aufgaben-Daten. Die To-do-Liste scheint nur eine Quelle (Tasks) zu nutzen, waehrend Lernblock-Aufgaben entweder in einer anderen Struktur gespeichert werden oder als Events gelten und dadurch ausgeschlossen sind.

### Moegliche Ursachen (Hypothesen)
1. Lernblock-Aufgaben werden als "Event" gespeichert und die To-do-Liste filtert nur "Task".
2. Lernblock-Tasks existieren in einer separaten Tabelle/Collection, die nicht in der To-do-Liste aggregiert wird.
3. Status/Mapping fehlt (z.B. `status` Feld wird nicht gesetzt), daher werden sie ausgefiltert.
4. Lernblock-Create updated den Task-Store nicht.

### Rueckfragen
- Sollen Lernblock-Aufgaben immer in der To-do-Liste erscheinen oder nur optional (Filter)?
- Wie soll der Status (erledigt/pausiert) zwischen Lernblock und To-do synchronisiert werden?
- Gibt es bereits ein gemeinsames "Task"-Schema fuer Lernblock und regulare Aufgaben?

### Implementierungsplan (v1)
1. **Datenmodell verstehen**: Pruefen, wo Lernblock-Aufgaben gespeichert werden und welche Felder sie haben.
2. **Mapping definieren**: Wenn Lernblock-Aufgaben eigene Struktur haben, Mapping zu Task-Shape definieren.
3. **Aggregation**: To-do-Liste erweitert auf Lernblock-Quelle oder Lernblock-Aufgaben werden als Tasks persistiert.
4. **Sync-Update**: Lernblock-Create/Update invalidiert To-do-Liste.
5. **Tests**: Lernblock-Task erstellen -> erscheint in To-do; Status-Update synchron.

### Schwaechen in Plan v1
- Gefahr von doppelten Eintraegen, falls Tasks bereits teilweise synchronisiert sind.
- Keine Entscheidung, ob Lernblock-Aufgaben in allen To-do-Views oder nur im Tageskontext erscheinen sollen.
- Fehlende Migrationsstrategie fuer existierende Lernblock-Aufgaben.

### Implementierungsplan (v2, verbessert)
1. **Produktentscheidung**: Definieren, ob Lernblock-Aufgaben global oder nur im Tageskontext erscheinen.
2. **Einheitliches Schema**: Gemeinsames Task-Interface mit `source = 'lernblock'` und konsistentem `status`.
3. **Dedup-Logik**: Eindeutige IDs, damit Tasks nicht doppelt gelistet werden.
4. **Migration/Backfill**: Bestehende Lernblock-Aufgaben ins Task-Schema ueberfuehren oder beim Laden mappen.
5. **Performance**: Aggregation so bauen, dass die To-do-Liste nicht langsamer wird.
6. **Tests**: Create/Update/Delete fuer Lernblock-Aufgaben und To-do-Ansicht.

---

## Offene Fragen

- Gilt Bug 2 fuer alle Navigationswege (z.B. Klick auf Datum, Pfeilnavigation, Kalender-Header)?
- Gibt es ein gemeinsames Datums-Store/Context, der konsolidiert werden sollte?
