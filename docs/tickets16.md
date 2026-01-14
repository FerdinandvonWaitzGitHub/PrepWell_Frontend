# T16: Feedback Januar 2026 - Wuensche (UX/Features)

## Status: W1, W2, W3, W4, W6 ERLEDIGT - W5 offen

**Priorität:** W3 ✅ > W6 ✅ > W1 ✅ > W2 ✅ > Rest

---

## Ueberblick

1. **Check-In und Tagesziel bedingt anzeigen** - Nur bei Mentor aktiviert / Tagesziel gesetzt. ✅ ERLEDIGT
2. **Sekundenanzeige** - Sekunden in der Uhrzeit des Tagesplaners sind unnoetig. ✅ ERLEDIGT
3. **Timer im Hintergrund** - Timer laeuft bei Bildschirmsperre/Sync nicht weiter. ✅ ERLEDIGT
4. **Termin-Erstellung** - Uhrzeit soll aus dem geklickten Slot vorbefuellt werden. ✅ BEREITS IMPLEMENTIERT
5. **Rechtsgebiete bei Lernblock** - Lernblock am Tag soll Rechtsgebiet/Farbe zuordnen koennen.
6. **Schnellsteuerung Stoppuhr** - Play/Pause ohne Timer-Ansicht oeffnen. ✅ ERLEDIGT

---

## Wunsch 1: Check-In und Tagesziel nur bei Bedarf anzeigen ✅ ERLEDIGT

### Beschreibung
Das Check-In-Feld und die Tagesziel-Fortschrittsanzeige werden immer angezeigt, auch wenn:
- Der Mentor nicht aktiviert ist (Check-In ist ohne Mentor sinnlos)
- Kein Tagesziel eingestellt ist (Fortschrittsbalken ohne Ziel ist verwirrend)

### Akzeptanzkriterien
- [x] Check-In-Button wird NUR angezeigt, wenn Mentor aktiviert ist
- [x] Tagesziel-Fortschrittsanzeige wird NUR angezeigt, wenn ein Tagesziel > 0 eingestellt ist
- [x] Kompaktere Darstellung wenn beide Elemente ausgeblendet sind

---

## Wunsch 2: Sekundenanzeige im Tagesplaner entfernen ✅ ERLEDIGT

### Beschreibung
Sekunden in der Uhrzeit sind ueberfluessig und wirken unruhig.

### Akzeptanzkriterien
- [x] Uhrzeit im Tagesplaner zeigt nur Stunden und Minuten.

---

## Wunsch 3: Timer im Hintergrund weiterlaufen lassen ✅ ERLEDIGT

### Beschreibung
Bei Bildschirmsperre bzw. Sync im Hintergrund laeuft der Timer nicht weiter.

### Akzeptanzkriterien
- [x] Timer ist robust gegen Hintergrund/Foreground-Wechsel.
- [x] Beim Zurueckkehren wird die korrekte Restzeit angezeigt.

---

## Wunsch 4: Uhrzeit aus geklicktem Slot uebernehmen ✅ BEREITS IMPLEMENTIERT

### Beschreibung
Beim Anlegen eines neuen Termins soll die Uhrzeit automatisch aus dem geklickten Zeit-Slot uebernommen werden.

### Akzeptanzkriterien
- [x] Klick auf Zeit-Slot oeffnet Termin-Dialog mit vorbefuellter Startzeit.
- [x] Dauer/Endzeit folgt dem Standard oder zuletzt genutzten Wert.

### Implementierung (bereits vorhanden)

**Flow:**
1. User klickt auf Zeit-Slot in Wochenansicht
2. `handleSlotClick(date, time)` speichert Zeit in `selectedTime` State
3. Dialog erhaelt `initialTime={selectedTime}` Prop
4. Dialog nutzt: `setStartTime(initialTime || '09:00')`

**Dateien:**
- `week-view.jsx:307-311` - `handleSlotClick(date, time)` setzt `selectedTime`
- `week-view.jsx:725` - `initialTime={selectedTime}` wird an Dialog uebergeben
- `create-private-session-dialog.jsx:80` - `setStartTime(initialTime || '09:00')`

---

## Wunsch 5: Rechtsgebiet bei Lernblock am Tag zuordnen

### Beschreibung
Beim Erstellen eines Lernblocks an einem konkreten Tag kann kein Rechtsgebiet zugeordnet werden, alle Bloecke haben die gleiche Farbe.

### Akzeptanzkriterien
- [ ] Lernblock-Dialog bietet Auswahl eines Rechtsgebiets/Fachs.
- [ ] Farbe des Lernblocks orientiert sich am Rechtsgebiet.
- [ ] Fach-Auswahl nutzt `getAllSubjects(isJura)` - funktioniert fuer alle Studiengaenge.

### Begriffsklaerung: "Lernblock"

Der Begriff wird inkonsistent verwendet. Hier die klare Definition:

| Entitaet | Ansicht | DB-Tabelle | Uhrzeit? |
|----------|---------|------------|----------|
| **BlockAllocation** | Monatsansicht | `calendar_blocks` | Nein (nur size 1-4) |
| **Session** | Wochenansicht | `time_sessions` | Ja (start_time, end_time) |

Der **CreateThemeBlockDialog** hat zwei Modi:
- `mode="block"` → erstellt BlockAllocation (Monat)
- `mode="session"` → erstellt Session (Woche)

### Analyse: Was bereits existiert

| Komponente | Status | Details |
|------------|--------|---------|
| **DB-Schema** | ✅ Fertig | `calendar_blocks` UND `time_sessions` haben bereits `rechtsgebiet` TEXT Feld |
| **Farblogik** | ✅ Fertig | `rechtsgebiet-colors.js` mit `getRechtsgebietColor()`, `getAllSubjects(isJura)` |
| **Wizard → Kalender** | ✅ Fertig | Lernplan-Bloecke bekommen `rechtsgebiet` beim Uebertragen (wizard-context.jsx:262) |
| **week-grid.jsx** | ✅ Fertig | `getLernplanBlockColorClass()` faerbt Lernplan-Bloecke nach Rechtsgebiet |
| **Studiengang-System** | ✅ Fertig | `useStudiengang()` liefert `isJura` Flag |

### Analyse: Was fehlt (manuelle Bloecke UND Sessions)

**Beide Modi betroffen:** Der `CreateThemeBlockDialog` setzt `rechtsgebiet` weder fuer
`mode="block"` (Monatsansicht → `calendar_blocks`) noch fuer `mode="session"`
(Wochenansicht → `time_sessions`). Das Feld existiert in beiden DB-Tabellen, wird aber nicht befuellt.

#### 1. Create-Dialoge (2 Dateien)

**a) `create-theme-session-dialog.jsx`** - Lernblock erstellen
- **Problem:** Kein Dropdown fuer Rechtsgebiet/Fach-Auswahl
- **Loesung:**
  ```javascript
  const { isJura } = useStudiengang();
  const subjects = getAllSubjects(isJura);
  // Dropdown mit subjects rendern
  // In baseData speichern: rechtsgebiet: selectedSubject
  ```

**b) `create-repetition-session-dialog.jsx`** - Wiederholungsblock erstellen
- **Problem:** Gleiches Problem wie oben
- **Loesung:** Analog zu theme-dialog

#### 2. calendar-context.jsx `createBlock()`
- **Problem:** `rechtsgebiet: blockData.rechtsgebiet` fehlt in Zeile 799-819
- **Loesung:** Feld hinzufuegen:
  ```javascript
  const createBlock = () => ({
    ...
    rechtsgebiet: blockData.rechtsgebiet || null,  // <-- hinzufuegen
  });
  ```

#### 3. Anzeige-Komponente (`learning-session.jsx`)
- **Problem:** `getBackgroundColor()` faerbt nur nach `blockType`, ignoriert `rechtsgebiet`
- **Loesung:**
  ```javascript
  const getBackgroundColor = () => {
    // NEU: Wenn rechtsgebiet gesetzt, danach faerben
    if (rechtsgebiet) {
      const colors = getRechtsgebietColor(rechtsgebiet);
      return `${colors.bg} ${colors.border}`;
    }
    // Fallback: nach blockType
    switch (blockType) { ... }
  };
  ```

#### 4. Props-Weitergabe (`day-tile.jsx`)
- **Problem:** `rechtsgebiet` wird nicht an LearningBlock weitergegeben
- **Loesung:** `rechtsgebiet={block.rechtsgebiet}` als Prop hinzufuegen

#### 5. Manage-Dialoge (2 Dateien)

**a) `manage-theme-session-dialog.jsx`** - Lernblock bearbeiten
- **Problem:** Beim Bearbeiten keine Fach-Aenderung moeglich
- **Loesung:** Dropdown wie in Create-Dialog, vorausgefuellt mit aktuellem Wert

**b) `manage-repetition-session-dialog.jsx`** - Wiederholungsblock bearbeiten
- **Problem:** Gleiches Problem
- **Loesung:** Analog

### Implementierungsreihenfolge

1. **Create-Dialoge** (2 Dateien) - Fach-Dropdown UI + Speicherung in baseData
   - `create-theme-session-dialog.jsx`
   - `create-repetition-session-dialog.jsx`
2. **calendar-context** - `rechtsgebiet` in createBlock()
3. **learning-session** - Faerbung nach `rechtsgebiet`
4. **day-tile** - Props weitergeben
5. **Manage-Dialoge** (2 Dateien) - Fach beim Bearbeiten aenderbar
   - `manage-theme-session-dialog.jsx`
   - `manage-repetition-session-dialog.jsx`

**Gesamt: 6 Dateien zu aendern**

### Hinweis: Studiengang-Unterstuetzung

- **Jura:** `getAllSubjects(true)` → OeR, ZR, StR, Querschnitt + Custom Subjects
- **Andere:** `getAllSubjects(false)` → Nur Custom Subjects (aus Einstellungen)
- **Edge Case:** Wenn keine Subjects definiert → Hinweis "Keine Faecher definiert"

---

## Wunsch 6: Play/Pause Stoppuhr direkt im Header ✅ ERLEDIGT

### Beschreibung
Play/Pause fuer die Stoppuhr soll direkt erreichbar sein, ohne die Timer-Ansicht zu oeffnen.

### Akzeptanzkriterien
- [x] Header oder Subheader hat Play/Pause-Button fuer die Stoppuhr (erscheint bei Hover).
- [x] Status (laeuft/pausiert) ist im UI sichtbar (⏸ Emoji + grauer Text).

---

# IMPLEMENTIERUNGSPLAN

## Analyse des aktuellen Timer-Systems

### Das Problem (W3)

```
AKTUELL:
┌─────────────────────────────────────────────────────────┐
│ setInterval(() => setElapsedSeconds(prev => prev + 1)) │
│                          ↓                              │
│   Browser throttled/pausiert Interval bei:              │
│   - Tab-Wechsel (nach ~1min auf 1x/min)                │
│   - Bildschirmsperre                                    │
│   - Device Sleep                                        │
│                          ↓                              │
│   Timer zeigt falsche Zeit nach Rückkehr!              │
└─────────────────────────────────────────────────────────┘
```

### Die Lösung

```
NEU:
┌─────────────────────────────────────────────────────────┐
│ 1. Speichere startTime (Unix timestamp)                 │
│ 2. Berechne: elapsed = Date.now() - startTime           │
│ 3. Interval nur für UI-Update (nicht für Zählung)       │
│ 4. Supabase: active_timer_sessions für Persistenz       │
│                          ↓                              │
│   Timer zeigt IMMER korrekte Zeit, auch nach:           │
│   - Tab-Wechsel ✓                                       │
│   - Bildschirmsperre ✓                                  │
│   - Browser-Neustart ✓                                  │
└─────────────────────────────────────────────────────────┘
```

---

## W3: Persistenter Timer - Implementierungsplan

### Phase 1: Zeitbasierte Berechnung (statt Intervall-Zählung)

**Datei:** `src/contexts/timer-context.jsx`

**Änderungen:**

1. **Neue State-Variablen:**
```javascript
// NEU: Zeitpunkt-basierte Berechnung
const [timerStartedAt, setTimerStartedAt] = useState(null);     // Unix timestamp
const [pausedAt, setPausedAt] = useState(null);                  // Unix timestamp wenn pausiert
const [accumulatedPauseTime, setAccumulatedPauseTime] = useState(0); // Gesamte Pausenzeit
```

2. **Berechnungsfunktion (ersetzt Interval-Zählung):**
```javascript
const calculateElapsedSeconds = useCallback(() => {
  if (!timerStartedAt) return 0;

  const now = pausedAt || Date.now();
  const totalElapsed = Math.floor((now - timerStartedAt) / 1000);
  const actualElapsed = totalElapsed - Math.floor(accumulatedPauseTime / 1000);

  return Math.max(0, actualElapsed);
}, [timerStartedAt, pausedAt, accumulatedPauseTime]);

const calculateRemainingSeconds = useCallback(() => {
  if (!timerStartedAt) return 0;

  const totalDuration = timerType === TIMER_TYPES.POMODORO
    ? (isBreak ? pomodoroSettings.breakDuration : pomodoroSettings.sessionDuration) * 60
    : countdownSettings.duration * 60;

  const elapsed = calculateElapsedSeconds();
  return Math.max(0, totalDuration - elapsed);
}, [timerStartedAt, timerType, isBreak, pomodoroSettings, countdownSettings, calculateElapsedSeconds]);
```

3. **Interval nur für UI-Refresh:**
```javascript
useEffect(() => {
  if (timerState !== TIMER_STATES.RUNNING) return;

  // Interval nur für UI-Update, nicht für Zählung!
  const updateUI = () => {
    if (timerType === TIMER_TYPES.COUNTUP) {
      setElapsedSeconds(calculateElapsedSeconds());
    } else {
      const remaining = calculateRemainingSeconds();
      setRemainingSeconds(remaining);

      // Timer abgelaufen?
      if (remaining <= 0) {
        handleTimerComplete();
      }
    }
  };

  // Sofort und dann jede Sekunde
  updateUI();
  const intervalId = setInterval(updateUI, 1000);

  return () => clearInterval(intervalId);
}, [timerState, timerType, calculateElapsedSeconds, calculateRemainingSeconds]);
```

4. **Visibility Change Handler (Tab-Wechsel):**
```javascript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && timerState === TIMER_STATES.RUNNING) {
      // Sofort UI aktualisieren wenn Tab wieder aktiv
      if (timerType === TIMER_TYPES.COUNTUP) {
        setElapsedSeconds(calculateElapsedSeconds());
      } else {
        setRemainingSeconds(calculateRemainingSeconds());
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [timerState, timerType, calculateElapsedSeconds, calculateRemainingSeconds]);
```

### Phase 2: Supabase-Persistenz (Browser-Neustart)

**Neue Tabelle:** `active_timer_sessions`

```sql
-- Migration: 20260114_active_timer_sessions.sql
CREATE TABLE IF NOT EXISTS active_timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  timer_type TEXT NOT NULL CHECK (timer_type IN ('pomodoro', 'countdown', 'countup')),
  timer_state TEXT NOT NULL CHECK (timer_state IN ('running', 'paused', 'break')),
  started_at TIMESTAMPTZ NOT NULL,
  paused_at TIMESTAMPTZ,
  accumulated_pause_ms BIGINT DEFAULT 0,

  -- Timer-spezifische Settings
  pomodoro_settings JSONB,
  countdown_settings JSONB,
  current_session INT DEFAULT 1,
  total_sessions INT DEFAULT 1,
  is_break BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nur ein aktiver Timer pro User
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_timer_user ON active_timer_sessions(user_id);

-- RLS
ALTER TABLE active_timer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own active timer"
  ON active_timer_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Sync-Logik:**

```javascript
// In timer-context.jsx

// Aktiven Timer beim Start speichern
const saveActiveTimerToSupabase = useCallback(async () => {
  if (!user) return;

  const activeTimer = {
    user_id: user.id,
    timer_type: timerType,
    timer_state: timerState,
    started_at: new Date(timerStartedAt).toISOString(),
    paused_at: pausedAt ? new Date(pausedAt).toISOString() : null,
    accumulated_pause_ms: accumulatedPauseTime,
    pomodoro_settings: pomodoroSettings,
    countdown_settings: countdownSettings,
    current_session: currentSession,
    total_sessions: totalSessions,
    is_break: isBreak,
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from('active_timer_sessions')
    .upsert(activeTimer, { onConflict: 'user_id' });
}, [user, timerType, timerState, timerStartedAt, pausedAt, accumulatedPauseTime, ...]);

// Aktiven Timer beim App-Start laden
const loadActiveTimerFromSupabase = useCallback(async () => {
  if (!user) return null;

  const { data, error } = await supabase
    .from('active_timer_sessions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;

  // Timer wiederherstellen
  setTimerType(data.timer_type);
  setTimerState(data.timer_state);
  setTimerStartedAt(new Date(data.started_at).getTime());
  setPausedAt(data.paused_at ? new Date(data.paused_at).getTime() : null);
  setAccumulatedPauseTime(data.accumulated_pause_ms || 0);
  // ... weitere State-Wiederherstellung

  return data;
}, [user]);

// Timer löschen wenn beendet
const clearActiveTimerFromSupabase = useCallback(async () => {
  if (!user) return;
  await supabase
    .from('active_timer_sessions')
    .delete()
    .eq('user_id', user.id);
}, [user]);
```

### Phase 3: Start/Pause/Stop Funktionen anpassen

```javascript
// startPomodoro anpassen
const startPomodoro = useCallback((settings, sessions = 1) => {
  const now = Date.now();
  setTimerStartedAt(now);
  setPausedAt(null);
  setAccumulatedPauseTime(0);
  setTimerState(TIMER_STATES.RUNNING);
  // ... rest

  // Speichern zu Supabase (async)
  saveActiveTimerToSupabase();
}, [...]);

// togglePause anpassen
const togglePause = useCallback(() => {
  if (timerState === TIMER_STATES.RUNNING) {
    // Pausieren
    setPausedAt(Date.now());
    setTimerState(TIMER_STATES.PAUSED);
  } else if (timerState === TIMER_STATES.PAUSED) {
    // Fortsetzen
    const pauseDuration = Date.now() - pausedAt;
    setAccumulatedPauseTime(prev => prev + pauseDuration);
    setPausedAt(null);
    setTimerState(TIMER_STATES.RUNNING);
  }

  saveActiveTimerToSupabase();
}, [timerState, pausedAt, saveActiveTimerToSupabase]);

// stopTimer anpassen
const stopTimer = useCallback(() => {
  // Session speichern
  saveSession();

  // State zurücksetzen
  setTimerStartedAt(null);
  setPausedAt(null);
  setAccumulatedPauseTime(0);
  setTimerState(TIMER_STATES.IDLE);

  // Aus Supabase löschen
  clearActiveTimerFromSupabase();
}, [...]);
```

---

## W6: Hover Play/Pause - Implementierungsplan

**Datei:** `src/components/dashboard/timer/timer-display.jsx`

**Änderung:** Hover-State mit Play/Pause Overlay

```jsx
const TimerDisplay = ({ onClick }) => {
  const { timerType, isActive, getDisplayInfo, togglePause } = useTimer();
  const [isHovered, setIsHovered] = useState(false);

  // ... existing code ...

  const { primaryText, secondaryText, progress, isBreak, isPaused } = displayInfo;

  const handlePlayPause = (e) => {
    e.stopPropagation(); // Verhindere Dialog-Öffnung
    togglePause();
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        className={`
          inline-flex justify-end items-center gap-4 px-3 py-1 rounded-lg
          transition-colors cursor-pointer hover:opacity-90
          ${getBgColor()}
        `}
      >
        {/* Existing content */}
        <div className="py-1 rounded-md flex flex-col items-end gap-0.5">
          <div className={`text-sm font-medium leading-5 text-right ${...}`}>
            {isPaused && '⏸ '}{primaryText}
          </div>
          <div className="text-sm font-normal leading-5 text-neutral-500 text-right">
            {secondaryText}
          </div>
        </div>

        {/* Progress Circle - wird bei Hover zum Play/Pause Button */}
        <div className="p-2 bg-white rounded-lg shadow-sm border border-neutral-100 flex justify-center items-center">
          {isHovered ? (
            <button
              onClick={handlePlayPause}
              className="w-6 h-6 flex items-center justify-center text-primary-600 hover:text-primary-700"
              title={isPaused ? 'Fortsetzen' : 'Pausieren'}
            >
              {isPaused ? (
                // Play Icon
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                // Pause Icon
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>
          ) : (
            <CircularProgress
              progress={progress}
              size={24}
              strokeWidth={2.5}
              isBreak={isBreak}
            />
          )}
        </div>
      </button>
    </div>
  );
};
```

---

## Zusammenfassung: Implementierungs-Reihenfolge

| Schritt | Beschreibung | Dateien | Aufwand |
|---------|-------------|---------|---------|
| **1** | Zeitbasierte Berechnung (Phase 1) | `timer-context.jsx` | Mittel |
| **2** | Visibility Change Handler | `timer-context.jsx` | Klein |
| **3** | SQL Migration erstellen | `migrations/` | Klein |
| **4** | Supabase-Sync (Phase 2) | `timer-context.jsx` | Mittel |
| **5** | Start/Pause/Stop anpassen (Phase 3) | `timer-context.jsx` | Mittel |
| **6** | Hover Play/Pause (W6) | `timer-display.jsx` | Klein |
| **7** | Tests & Bugfixes | Diverse | Klein |

---

## Akzeptanzkriterien (Komplett)

### W3: Persistenter Timer
- [ ] Timer zeigt korrekte Zeit nach Tab-Wechsel
- [ ] Timer zeigt korrekte Zeit nach Bildschirmsperre
- [ ] Timer zeigt korrekte Zeit nach Browser-Neustart
- [ ] Pause-Zeit wird korrekt abgezogen
- [ ] Pomodoro-Pausen funktionieren korrekt
- [ ] Timer-History wird weiterhin gespeichert

### W6: Hover Play/Pause
- [ ] Bei Hover über Timer erscheint Play/Pause Button
- [ ] Play/Pause funktioniert ohne Dialog zu öffnen
- [ ] Klick auf Rest des Timers öffnet weiterhin Dialog
- [ ] Status (läuft/pausiert) ist visuell erkennbar

---

## Implementierte Änderungen (2026-01-14)

### W3: Persistenter Timer - IMPLEMENTIERT

**Dateien:**
- `src/contexts/timer-context.jsx` - Hauptlogik
- `supabase/migrations/20260114_t16_active_timer_sessions.sql` - DB Migration

**Neue State-Variablen:**
```javascript
const [timerStartedAt, setTimerStartedAt] = useState(null);     // Unix timestamp
const [pausedAt, setPausedAt] = useState(null);                  // Pause timestamp
const [accumulatedPauseTime, setAccumulatedPauseTime] = useState(0); // Total pause ms
```

**Änderungen:**
1. ✅ Zeitbasierte Berechnung statt Interval-Zählung (`calculateElapsedSeconds`, `calculateRemainingSeconds`)
2. ✅ Visibility Change Handler für sofortige UI-Updates bei Tab-Wechsel
3. ✅ Supabase `active_timer_sessions` Tabelle für Browser-Neustart-Persistenz
4. ✅ Auto-Save bei State-Änderungen, Auto-Load bei App-Start
5. ✅ Start/Pause/Stop Funktionen angepasst für Timestamp-Tracking

### W6: Hover Play/Pause - IMPLEMENTIERT

**Dateien:**
- `src/components/dashboard/dashboard-sub-header.jsx` - TimerWidget mit Hover Play/Pause
- `src/components/dashboard/timer/timer-display.jsx` - Alternative TimerDisplay Komponente

**Änderungen:**
1. ✅ Hover-State in TimerWidget hinzugefügt
2. ✅ Play/Pause Button erscheint bei Hover rechts neben dem Timer-Circle
3. ✅ `e.stopPropagation()` verhindert Dialog-Öffnung bei Klick auf Play/Pause
4. ✅ Graue Icons für beide Zustände (text-neutral-600)

### W1: Check-In und Tagesziel bedingt anzeigen - IMPLEMENTIERT

**Dateien:**
- `src/pages/dashboard.jsx` - Übergibt `isMentorActivated` prop
- `src/components/dashboard/dashboard-sub-header.jsx` - Bedingte Anzeige

**Änderungen:**
1. ✅ Neue prop `isMentorActivated` zu DashboardSubHeader hinzugefügt
2. ✅ Check-In Button wird NUR angezeigt wenn Mentor aktiviert ist
3. ✅ Tagesziel-Fortschrittsanzeige wird NUR angezeigt wenn `learningMinutesGoal > 0`
4. ✅ Kompaktere Header-Darstellung wenn Elemente ausgeblendet sind

---

### W2: Sekundenanzeige entfernen - IMPLEMENTIERT

**Dateien:**
- `src/components/dashboard/timer/timer-main-dialog.jsx` - Timer-Kreisanzeige
- `src/components/dashboard/timer/timer-controls-dialog.jsx` - Timer-Kontroll-Dialog

**Änderungen:**
1. ✅ `formatTime()` in timer-main-dialog.jsx: Von `MM:SS` zu `MM min` bzw. `H:MM h`
2. ✅ `CountupTimerView` timeDisplay: Von `M:SS` zu `M min` bzw. `H:MM h`
3. ✅ `formatTimeDisplay()` in timer-controls-dialog.jsx: Von `MM:SS` zu `MM min` bzw. `H:MM h`

**Neues Format:**
- Unter 1 Stunde: `25 min` (statt `25:00`)
- Ab 1 Stunde: `1:30 h` (statt `1:30:00`)

---

## Nächste Schritte

1. **W3 Testen:** Timer starten, Tab wechseln, zurückkommen - Zeit sollte korrekt sein
2. **W3 Browser-Neustart testen:** Timer starten, Browser schließen, neu öffnen - Timer sollte fortfahren (erfordert SQL-Migration)
3. **W1 Testen:** Mentor deaktivieren → Check-In Button verschwindet
4. **W1 Testen:** Tagesziel auf 0 setzen → Fortschrittsanzeige verschwindet
5. **W2 Testen:** Timer-Dialog öffnen → Zeigt Minuten ohne Sekunden (z.B. "25 min" statt "25:00")
6. **Verbleibende Wünsche:** W4 (Termin-Erstellung), W5 (Rechtsgebiete)
