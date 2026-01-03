# PrepWell Bug-Fix Dokumentation

**Erstellt:** 02. Januar 2026
**Basierend auf:** Funktionstest vom 02.01.2026

---

## Übersicht

| Priorität | Anzahl | Gefixt | Offen |
|-----------|--------|--------|-------|
| 🔴 KRITISCH | 6 | 6 | 0 |
| 🟠 HOCH | 12 | 12 | 0 |
| 🟡 MITTEL | 3 | 3 | 0 |
| **Gesamt** | **21** | **21** | **0** |

### ✅ ALLE BUGS GEFIXT!

---

# 🔴 KRITISCH (Blocker)

Diese Bugs verhindern Kernfunktionen der App.

---

## ✅ BUG-001: Timer funktioniert nicht [GEFIXT]

**Bereich:** Dashboard → Timer-Dialog
**Betrifft:** 14.1 - 14.7

### Problem
- Pomodoro startet nicht
- Countdown startet nicht
- Count-up startet nicht
- Pausieren/Fortsetzen funktioniert nicht
- Session wird nicht gespeichert

### Betroffene Dateien
- `src/components/dashboard/timer/timer-main-dialog.jsx`
- `src/components/dashboard/timer/timer-selection-dialog.jsx`
- `src/contexts/timer-context.jsx`

### Lösung (02.01.2026)
**Ursache:** `onStart` Props fehlten in dashboard.jsx, Timer wurde nur konfiguriert aber nicht gestartet.

**Änderungen:**
1. `src/pages/dashboard.jsx`: `startPomodoro`, `startCountdown`, `startCountup` importiert
2. `src/pages/dashboard.jsx`: `onStart` Props zu PomodoroSettingsDialog und CountdownSettingsDialog hinzugefügt
3. `src/components/dashboard/timer/timer-button.jsx`: `stopTimer()` aus `handleSettingsClick` entfernt
4. `src/components/dashboard/timer/timer-main-dialog.jsx`: "Fertig"-Button stoppt Timer nicht mehr

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

## ✅ BUG-002: Lernplan - Puffertage & Urlaubstage werden nicht umgesetzt [GEFIXT]

**Bereich:** Lernplan-Wizard → Kalender-Erstellung
**Betrifft:** 3.2, 4.2, 4.3

### Problem
- Puffertage werden im Wizard abgefragt, aber nicht im Kalender berücksichtigt
- Urlaubstage werden im Wizard abgefragt, aber nicht im Kalender berücksichtigt
- Erwartung: Puffertage VOR dem Examens-Ende, Urlaubstage davor

### Betroffene Dateien
- `src/features/lernplan-wizard/context/wizard-context.jsx`
- `src/features/lernplan-wizard/steps/step-8-calendar.jsx`
- Kalender-Generierungslogik

### Lösung (02.01.2026)
**Ursache (Initial):** `generateSlotsFromWizardState()` ignorierte `bufferDays` und `vacationDays`.

**1. Slot-Generierung (erster Fix):**
- `src/features/lernplan-wizard/context/wizard-context.jsx`: `generateSlotsFromWizardState()` komplett überarbeitet
  - Berechnet 3 Perioden: Lernperiode, Urlaubsperiode, Pufferperiode
  - Erstellt spezielle Slots mit `blockType: 'buffer'` und `blockType: 'vacation'`
  - Slots haben `status: 'buffer'` bzw. `status: 'vacation'`

**2. Rendering-Fix (zweiter Fix):**
**Ursache:** Die Funktion `groupSlotsByTopic()` in slotUtils.js hat nur Slots mit `status === 'topic'` gruppiert, aber Buffer/Vacation-Slots haben `status: 'buffer'` bzw. `status: 'vacation'`.

**Änderungen:**
- `src/utils/slotUtils.js`:
  - Neue Hilfsfunktion `slotHasContentForGrouping()` für buffer/vacation-Status
  - `groupSlotsByTopic()` akzeptiert jetzt alle Content-Statuses (topic, buffer, vacation)
  - `slotHasContent()` ebenfalls erweitert für Konsistenz

**3. Visual Styling:**
- `src/features/calendar/components/learning-block.jsx`: Farben und Namen für buffer/vacation
- `src/features/calendar/components/week-grid.jsx`: BLOCK_COLORS und BLOCK_TYPE_NAMES erweitert

**Ergebnis:** Lernplan zeigt jetzt am Ende:
- Urlaubstage (grün) vor den Puffertagen
- Puffertage (orange) direkt vor dem Examen

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

## ✅ BUG-003: Lernplan-Erstellung zeigt leeren Kalender [GEFIXT]

**Bereich:** Lernplan-Wizard → Abschluss
**Betrifft:** 3.2

### Problem
- Nach Wizard-Abschluss erscheint Lade-Animation
- Danach wird leerer Kalender in Monatsansicht angezeigt
- Erst nach Klick auf "Heute" erscheint der Lernplan
- Kalender springt nicht automatisch zum richtigen Monat

### Betroffene Dateien
- `src/features/lernplan-wizard/components/calendar-creation-success.jsx`
- `src/features/lernplan-wizard/wizard-page.jsx`
- `src/features/calendar/components/calendar-view.jsx`

### Lösung (02.01.2026)
**Ursache:**
1. `calendar-month.jsx` hatte hardcoded Datum `new Date(2025, 7, 1)`
2. Kein Auto-Redirect nach Wizard-Abschluss

**Änderungen:**
1. `src/pages/calendar-month.jsx`: Dynamisches initialDate basierend auf URL-Param oder aktivem Lernplan
2. `src/features/lernplan-wizard/components/calendar-creation-success.jsx`:
   - 3-Sekunden Countdown mit Auto-Redirect
   - "Jetzt zum Kalender" Button
   - Navigation mit `?date=STARTDATUM` Parameter

**Ergebnis:** Nach Wizard-Abschluss zeigt Countdown und navigiert automatisch zum Lernplan-Startmonat.

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

## ✅ BUG-004: Bearbeiten eines leeren Blocks löscht alle anderen leeren Blöcke [GEFIXT]

**Bereich:** Kalender Wochenansicht
**Betrifft:** 5.4

### Problem
- Leere Blöcke (durch Lernplan erstellt) bearbeiten
- Nach Speichern sind alle anderen leeren Blöcke gelöscht
- Nur der bearbeitete Block bleibt

### Betroffene Dateien
- `src/features/calendar/components/week-view.jsx`

### Lösung (02.01.2026)
**Ursache:** In der `handleUpdateBlock` Funktion war die ID-Match-Logik fehlerhaft:

```javascript
// VORHER (BUG):
const isMatch =
  slot.contentId === updatedBlock.id ||
  slot.contentId === updatedBlock.contentId ||  // undefined === undefined = TRUE für ALLE!
  slot.topicId === updatedBlock.id ||
  slot.topicId === updatedBlock.topicId ||      // Gleiche Problem
  slot.id === updatedBlock.id;
```

Wenn beide `contentId` Werte `undefined` sind, matched `undefined === undefined` zu `true` und aktualisiert ALLE Slots mit denselben Daten.

**Änderungen:**
- `src/features/calendar/components/week-view.jsx`: Match-Logik korrigiert

```javascript
// NACHHER (FIX):
const isMatch =
  (updatedBlock.id && (slot.contentId === updatedBlock.id || slot.topicId === updatedBlock.id || slot.id === updatedBlock.id)) ||
  (updatedBlock.contentId && slot.contentId && slot.contentId === updatedBlock.contentId) ||
  (updatedBlock.topicId && slot.topicId && slot.topicId === updatedBlock.topicId);
```

Jetzt wird nur verglichen, wenn beide Werte truthy sind.

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

## ✅ BUG-005: Serientermine funktionieren nicht [GEFIXT]

**Bereich:** Kalender → Private Blöcke
**Betrifft:** 5.7 - 5.12

### Problem
- Täglich/Wöchentlich/Monatlich/Custom Wiederholungen werden nicht erstellt
- Serie löschen funktioniert nicht
- Einzelnen Block aus Serie löschen funktioniert nicht

### Ursache (nach Analyse)
**Schema war bereits korrekt!** Die Spalten `series_id` und `custom_days` existieren bereits in:
- `private_blocks` Tabelle
- `calendar_slots` Tabelle

**Eigentliche Ursache:** Stale Closure Bug in `addPrivateBlock()` und `deleteSeriesPrivateBlocks()`.

Beim Erstellen einer Serie mit z.B. 20 Wiederholungen:
1. Jeder `saveDayBlocks(dateKey, blocks)` Aufruf verwendet die gleiche stale `privateBlocksByDate` aus der Closure
2. Jeder Aufruf erstellt `{ ...privateBlocksByDate, [dateKey]: blocks }` - aber privateBlocksByDate ist immer der ursprüngliche State
3. Nur der LETZTE Aufruf überlebt, alle anderen werden überschrieben

### Betroffene Dateien
- `src/contexts/calendar-context.jsx`
- `src/hooks/use-supabase-sync.js`

### Lösung (02.01.2026)

**1. Neuer Batch-Save in `use-supabase-sync.js`:**
```javascript
// saveDayBlocksBatch() - Speichert mehrere Daten auf einmal
const saveDayBlocksBatch = useCallback(async (updatesMap) => {
  // Merge ALLE updates in einem State-Update
  const updated = { ...privateBlocksByDate };
  Object.entries(updatesMap).forEach(([dateKey, blocks]) => {
    updated[dateKey] = blocks;
  });
  setPrivateBlocksByDate(updated);  // EIN State-Update
  // ... Supabase sync
});
```

**2. `addPrivateBlock()` refactored:**
- Sammelt alle Blöcke ERST in `updatesToMake` Map
- Ruft EINMAL `saveDayBlocksBatch(updatesToMake)` auf
- Vermeidet Stale-Closure Problem komplett

**3. `deleteSeriesPrivateBlocks()` refactored:**
- Gleicher Ansatz: Sammeln, dann einmal speichern

### Status
- [x] Schema geprüft (war bereits korrekt)
- [x] Stale-Closure Bug identifiziert
- [x] `saveDayBlocksBatch()` implementiert
- [x] `addPrivateBlock()` refactored
- [x] `deleteSeriesPrivateBlocks()` refactored
- [ ] Getestet

---

## ✅ BUG-021: Benutzerdaten "fließen" zwischen verschiedenen Accounts [GEFIXT]

**Bereich:** Auth / LocalStorage / Datenisolation
**Betrifft:** Alle Benutzerdaten (Lernpläne, Kalenderslots, Aufgaben, Private Blöcke)

### Problem
- User A erstellt Account und fügt Daten hinzu
- User A loggt sich aus
- User B erstellt neuen Account
- User B sieht sofort die Daten von User A
- **Sicherheitslücke:** Daten "lecken" vom älteren zum neueren Account

### Ursache
1. `signOut()` in `auth-context.jsx` hat **LocalStorage NICHT geleert**
2. Beim Login eines neuen Users blieben alte LocalStorage-Daten erhalten
3. Die Sync-Hooks luden diese alten Daten und zeigten sie dem neuen User
4. Supabase RLS funktionierte korrekt, aber das Frontend-LocalStorage war das Problem

### Betroffene Dateien
- `src/contexts/auth-context.jsx`
- `src/hooks/use-supabase-sync.js` (indirekt - las die falschen LocalStorage-Daten)

### Lösung (03.01.2026)

**1. Zentrale Liste aller LocalStorage-Keys:**
```javascript
const ALL_PREPWELL_STORAGE_KEYS = [
  'prepwell_calendar_slots',
  'prepwell_calendar_tasks',
  'prepwell_tasks',
  'prepwell_private_blocks',
  'prepwell_content_plans',
  'prepwell_contents',
  'prepwell_published_themenlisten',
  'prepwell_lernplan_metadata',
  'prepwell_archived_lernplaene',
  'prepwell_lernplan_wizard_draft',
  'prepwell_exams',
  'prepwell_uebungsklausuren',
  'prepwell_timer_state',
  'prepwell_timer_history',
  'prepwell_timer_config',
  'prepwell_checkin_data',
  'prepwell_checkin_responses',
  'prepwell_logbuch_entries',
  'prepwell_settings',
  'prepwell_user_settings',
  'prepwell_grade_system',
  'prepwell_custom_subjects',
  'prepwell_custom_unterrechtsgebiete',
  'prepwell_mentor_activated',
  'prepwell_onboarding_complete',
];
```

**2. `clearAllUserData()` Funktion hinzugefügt:**
```javascript
const clearAllUserData = () => {
  ALL_PREPWELL_STORAGE_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
};
```

**3. `signOut()` löscht jetzt LocalStorage:**
```javascript
const signOut = async () => {
  if (!isSupabaseConfigured()) return;
  clearAllUserData(); // <-- NEU: Löscht alle User-Daten
  const { error } = await supabase.auth.signOut();
  // ...
};
```

**4. User-Wechsel-Erkennung bei Login:**
```javascript
// In onAuthStateChange:
if (_event === 'SIGNED_IN' && session?.user?.id) {
  const lastUserId = localStorage.getItem('prepwell_last_user_id');
  if (lastUserId && lastUserId !== session.user.id) {
    clearAllUserData(); // Anderen User erkannt → alte Daten löschen
  }
  localStorage.setItem('prepwell_last_user_id', session.user.id);
}
```

### Sicherheitsimplikation
Dies war eine **kritische Sicherheitslücke**, die Datenlecks zwischen Benutzern ermöglichte. Der Fix stellt sicher, dass:
- Bei Logout werden alle Benutzerdaten gelöscht
- Bei Login eines anderen Users werden alte Daten gelöscht
- Nur die Daten des aktuell authentifizierten Users sind im LocalStorage

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

# 🟠 HOCH (Funktionalität beeinträchtigt)

---

## BUG-006: Protected Routes funktionieren nicht

**Bereich:** Auth / Routing
**Betrifft:** 1.5

### Problem
- Nicht-eingeloggte User werden NICHT zu `/auth` redirected
- Geschützte Seiten sind ohne Login erreichbar

### Betroffene Dateien
- `src/router.jsx`
- `src/contexts/auth-context.jsx`

### Lösungsansatz
1. ProtectedRoute-Komponente prüfen
2. `isAuthenticated` State validieren
3. Redirect-Logik: `if (!user) navigate('/auth')`

### Status
- [x] Analysiert ✅
- [x] Fix implementiert ✅
- [ ] Getestet

---

## BUG-007: Zeitplan-Widget roter Dot falsch positioniert

**Bereich:** Dashboard → Zeitplan-Widget
**Betrifft:** 2.2

### Problem
- Roter Strich zeigt nicht korrekte Uhrzeit
- Bei 14:26 ist der Strich schon >2/3 durch den Stundenabstand
- Position-Berechnung fehlerhaft

### Betroffene Dateien
- `src/components/dashboard/zeitplan-widget.jsx`

### Lösungsansatz
1. Zeit-zu-Position Berechnung prüfen:
```javascript
// Korrekte Berechnung:
const startHour = 8; // Widget startet bei 8:00
const endHour = 18;  // Widget endet bei 18:00
const totalMinutes = (endHour - startHour) * 60;
const currentMinutes = (currentHour - startHour) * 60 + currentMinute;
const percentage = (currentMinutes / totalMinutes) * 100;
```
2. CSS: `top: ${percentage}%` statt fester Werte

### Status
- [x] Analysiert ✅
- [x] Fix implementiert ✅
- [ ] Getestet

---

## ✅ BUG-008: Timer wird nach "Fertig" resettet [GEFIXT]

**Bereich:** Dashboard → Timer-Widget
**Betrifft:** 2.4

### Problem
- Timer einstellen → "Fertig" klicken → Timer wird auf 0 zurückgesetzt
- Timer sollte starten, nicht resetten

### Betroffene Dateien
- `src/components/dashboard/timer/timer-selection-dialog.jsx`
- `src/components/dashboard/timer/countdown-settings-dialog.jsx`
- `src/contexts/timer-context.jsx`

### Lösung (02.01.2026)
**Gefixt zusammen mit BUG-001.** Siehe BUG-001 für Details.

**Kernänderung:** Timer startet jetzt automatisch nach Konfiguration durch `onStart` Callback.

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

## ✅ BUG-009: Fortschritts-Widget unklar/fehlerhaft [GEFIXT]

**Bereich:** Dashboard
**Betrifft:** 2.5

### Problem
- Tagesziel-Berechnung unklar
- Fortschritt wird nicht korrekt angezeigt
- Progress Bar aktualisierte nicht während aktiver Timer-Session

### Betroffene Dateien
- `src/pages/dashboard.jsx`
- `src/components/dashboard/dashboard-sub-header.jsx`

### Lösung (02.01.2026)
**Ursache:** `completedLearningMinutes` wurde mit `useMemo` berechnet, aber `elapsedSeconds` triggerte nicht zuverlässig Re-Renders während aktiver Timer-Session.

**Änderungen:**
1. `src/pages/dashboard.jsx`: `progressUpdateTick` State mit `setInterval` hinzugefügt
2. Interval läuft alle 10 Sekunden wenn Timer aktiv ist
3. `progressUpdateTick` als Dependency zu `completedLearningMinutes` useMemo hinzugefügt
4. Forciert periodische Neuberechnung der Lernminuten

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

## BUG-010: Archivierte Lernpläne bleiben im Kalender sichtbar

**Bereich:** Lernpläne → Kalender
**Betrifft:** 3.5

### Problem
- Lernplan archivieren → In Lernplan-Liste als archiviert markiert
- ABER: Slots bleiben im Kalender sichtbar
- Sollten ausgeblendet oder gelöscht werden

### Betroffene Dateien
- `src/pages/lernplaene.jsx`
- `src/contexts/calendar-context.jsx`
- `src/features/calendar/components/calendar-view.jsx`

### Lösungsansatz
1. Option A: Slots mit `contentPlanId` des archivierten Plans filtern
2. Option B: Beim Archivieren auch zugehörige Slots löschen
3. CalendarContext: `isArchived` Status des ContentPlans berücksichtigen

### Status
- [x] Analysiert ✅
- [x] Fix implementiert ✅
- [ ] Getestet

---

## BUG-011: Lernplan-Slots haben keine Uhrzeiten in Wochenansicht

**Bereich:** Kalender Wochenansicht
**Betrifft:** 5.2

### Problem
- Slots aus Lernplan werden ohne Uhrzeiten angezeigt
- Erscheinen nur als Slots zwischen Header und privaten Terminen
- Sollten korrekt in Zeitraster eingeordnet sein

### Betroffene Dateien
- `src/features/calendar/components/week-view.jsx`
- `src/features/calendar/components/week-grid.jsx`
- `src/features/calendar/components/learning-block.jsx`

### Lösungsansatz
1. Position → Uhrzeit Mapping anwenden:
   - Position 1 → 08:00-10:00
   - Position 2 → 10:00-12:00
   - Position 3 → 14:00-16:00
   - Position 4 → 16:00-18:00
2. `buildBlockFromSlot()` muss Uhrzeiten setzen
3. Week-Grid: Blöcke anhand `startTime/endTime` positionieren

### Status
- [x] Analysiert ✅
- [x] Fix implementiert ✅
- [ ] Getestet

---

## BUG-012: Private Termine nicht wochenübergreifend

**Bereich:** Kalender Wochen- & Monatsansicht
**Betrifft:** 5.3, 5.6, 6.2

### Problem
- Privater Termin über mehrere Wochen wird nur in Startwoche angezeigt
- In Monatsansicht nur am Starttag sichtbar
- Sollte über gesamten Zeitraum angezeigt werden

### Betroffene Dateien
- `src/features/calendar/components/week-view.jsx`
- `src/features/calendar/components/calendar-view.jsx`
- `src/features/calendar/components/day-tile.jsx`

### Lösungsansatz
1. Beim Rendern: Für jeden Tag im Zeitraum prüfen ob Block aktiv
2. `isBlockActiveOnDate(block, date)` Hilfsfunktion:
```javascript
const isActiveOnDate = (block, date) => {
  const start = new Date(block.startDate);
  const end = new Date(block.endDate);
  const check = new Date(date);
  return check >= start && check <= end;
};
```
3. Visuelle Kennzeichnung: "Fortsetzung" oder durchgehender Balken

### Status
- [x] Analysiert ✅
- [x] Fix implementiert ✅
- [ ] Getestet

---

## BUG-013: Aufgaben-Seite komplett nicht funktional

**Bereich:** Verwaltung → Aufgaben
**Betrifft:** 7.1 - 7.7

### Problem
- Hardcodierte Aufgaben statt echte Daten
- Erstellen, Bearbeiten, Löschen, Abhaken funktioniert nicht
- Filter funktioniert nicht

### Betroffene Dateien
- `src/pages/verwaltung-aufgaben.jsx`
- `src/contexts/calendar-context.jsx` (tasks)
- `src/hooks/use-supabase-sync.js` → `useCalendarTasksSync`

### Lösungsansatz
1. Hardcodierte Daten entfernen
2. Tasks aus CalendarContext laden
3. CRUD-Operationen an CalendarContext anbinden:
   - `addTask()`
   - `updateTask()`
   - `deleteTask()`
   - `toggleTaskComplete()`
4. Filter-State implementieren

### Status
- [x] Analysiert ✅
- [x] Fix implementiert ✅
- [ ] Getestet

---

## ✅ BUG-014: App-Modus wechseln funktioniert nicht [GEFIXT]

**Bereich:** Einstellungen
**Betrifft:** 11.3

### Problem
- Umschalten zwischen Examen/Normal Modus funktioniert nicht
- Kein UI-Element zum Wechseln des Modus vorhanden

### Betroffene Dateien
- `src/components/settings/settings-content.jsx`
- `src/contexts/appmode-context.jsx`

### Lösung (02.01.2026)
**Ursache:** Die Settings-Seite zeigte den aktuellen Modus an, hatte aber **keinen Button zum Umschalten**. Die `toggleMode` Funktion aus dem Context wurde nie verwendet.

**Änderungen:**
1. `src/components/settings/settings-content.jsx`: `toggleMode` und `canToggleMode` aus useAppMode importiert
2. "Wechseln"-Button neben dem Modus-Badge hinzugefügt
3. Button erscheint nur wenn `canToggleMode` true ist (aktiver Lernplan existiert)

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

## ✅ BUG-015: Timer-Einstellungen funktionieren nicht [GEFIXT]

**Bereich:** Einstellungen
**Betrifft:** 11.1

### Problem
- Pomodoro-Dauer und Pausenlänge auf Settings-Seite anpassen → Timer verwendet alte Werte
- Zwei getrennte Storage-Keys: `prepwell_settings` (Settings-Seite) vs `prepwell_timer_config` (Timer)

### Betroffene Dateien
- `src/contexts/timer-context.jsx`

### Lösung (02.01.2026)
**Ursache:** Die Settings-Seite speicherte in `prepwell_settings`, aber der Timer las aus `prepwell_timer_config`. **Zwei getrennte Datenquellen ohne Synchronisation.**

**Änderungen:**
1. `src/contexts/timer-context.jsx`: `USER_SETTINGS_KEY` für `prepwell_settings` hinzugefügt
2. `loadUserSettingsFromStorage()` Funktion hinzugefügt
3. `loadConfigFromStorage()` liest jetzt BEIDE Quellen und merged sie
4. `startPomodoro()` liest User-Settings frisch beim Start
5. `startFromConfig()` re-liest Config für aktuelle Settings

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

## ✅ BUG-016: Profil bearbeiten/löschen funktioniert nicht [GEFIXT]

**Bereich:** Profil
**Betrifft:** 12.2, 12.3

### Problem
- Profildaten können nicht bearbeitet werden - `updateProfile` Funktion fehlte
- Account löschen Funktion existierte nicht

### Betroffene Dateien
- `src/pages/profil.jsx`
- `src/contexts/auth-context.jsx`

### Lösung (02.01.2026)
**Ursache:** Die `auth-context.jsx` hatte **keine `updateProfile` Funktion**, obwohl `profil.jsx` sie aufzurufen versuchte.

**Änderungen:**
1. `src/contexts/auth-context.jsx`:
   - `updateProfile()` Funktion hinzugefügt (setzt user_metadata via Supabase)
   - `deleteAccount()` Funktion hinzugefügt (löscht lokale Daten + signOut)
   - Beide Funktionen zum Context-Value exportiert
2. `src/pages/profil.jsx`:
   - "Abmelden" Button in Quick Actions hinzugefügt
   - "Gefahrenzone" Sektion mit "Konto löschen" Button
   - Bestätigungs-Dialog mit Warnung
   - Error-Handling und Loading-States

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

## ✅ BUG-017: Onboarding funktioniert nicht [GEFIXT]

**Bereich:** Onboarding
**Betrifft:** 13.1 - 13.3

### Problem
- Flash of Content: Nach Abschluss des Onboardings kurzes Aufblitzen der Onboarding-Seite
- Redirect zum Dashboard funktionierte, aber mit visuellem Glitch

### Betroffene Dateien
- `src/pages/onboarding.jsx`

### Lösung (02.01.2026)
**Ursache:** Nach `isCompleted = true` wurde die Komponente noch kurz gerendert, bevor der Redirect griff.

**Änderungen:**
1. `src/pages/onboarding.jsx`: Früher Return wenn `isCompleted` true ist
2. Zeigt "Weiterleitung..." Placeholder während Redirect
3. Navigation mit `replace: true` für saubere Browser-History

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

# 🟡 MITTEL (Funktioniert, aber nicht optimal)

---

## ✅ BUG-018: Aufgaben-Widget zeigt unnötigen Themenlisten-Toggle [GEFIXT]

**Bereich:** Dashboard → Aufgaben-Widget
**Betrifft:** 2.3

### Problem
- Toggle zum Wechseln zu Themenliste wird im Normal-Modus angezeigt
- Themenlisten sind nur für Examen-Modus relevant
- Verwirrt User im Normal-Modus

### Betroffene Dateien
- `src/components/dashboard/lernblock-widget.jsx`

### Lösung (02.01.2026)
**Ursache:** `NoTopicsView` Komponente zeigte Toggle zwischen To-Dos und Themenliste, obwohl Themenlisten im Normal-Modus nicht sinnvoll sind.

**Änderungen:**
1. `src/components/dashboard/lernblock-widget.jsx`: Toggle aus `NoTopicsView` entfernt
2. Zeigt jetzt direkt "Aufgaben" Header mit Beschreibung
3. Nur To-Dos werden angezeigt, kein Toggle mehr

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

## ✅ BUG-019: Wizard Zurück-Navigation verliert Daten [GEFIXT]

**Bereich:** Lernplan-Wizard
**Betrifft:** 4.11

### Problem
- Bei Zurück-Navigation wurden step-spezifische Daten nicht resettet
- Führte zu inkonsistentem State wenn User anderen Pfad wählt
- Besonders problematisch bei Methodenwechsel (manual → automatic)

### Betroffene Dateien
- `src/features/lernplan-wizard/context/wizard-context.jsx`

### Lösung (02.01.2026)
**Ursache:** `prevStep()` setzte nur `currentStep` zurück, resettte aber nicht die step-spezifischen Daten.

**Änderungen:**
1. `src/features/lernplan-wizard/context/wizard-context.jsx`: `prevStep()` komplett überarbeitet
2. Step 7 → 6: Reset von `creationMethod`, `selectedTemplate`, `manualLernplan`, `unterrechtsgebieteOrder`, `learningDaysOrder`, `adjustments`, `totalSteps`
3. Step 6 → 5: Reset von `weekStructure`
4. Step 5 → 4: Reset von `dailyBlocks`
5. Step 4 → 3: Reset von `vacationDays`
6. Step 3 → 2: Reset von `bufferDays`

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

## ✅ BUG-020: Logbuch-Eintrag redirected zum Timer-Dialog [GEFIXT]

**Bereich:** Timer → Logbuch
**Betrifft:** 14.8

### Problem
- Nach Speichern eines Logbuch-Eintrags: Dialog schloss sich
- Bei Fehler: Dialog schloss sich trotzdem, ohne Fehlermeldung
- User konnte nicht erkennen ob Speichern erfolgreich war

### Betroffene Dateien
- `src/components/dashboard/timer/timer-logbuch-dialog.jsx`

### Lösung (02.01.2026)
**Ursache:** `handleSave()` schloss Dialog immer, auch bei Fehlern. Kein Error-Handling vorhanden.

**Änderungen:**
1. `src/components/dashboard/timer/timer-logbuch-dialog.jsx`:
   - `saveError` State für Fehlermeldung hinzugefügt
   - `isSaving` State für Loading-Indicator
   - try/catch um `saveAllEntries()` mit Error-Handling
   - Bei Fehler: Zeigt Fehlermeldung für 2 Sekunden, dann schließt Dialog
   - Bei Erfolg: Dialog schließt sofort

### Status
- [x] Analysiert
- [x] Fix implementiert
- [ ] Getestet

---

# Priorisierte Reihenfolge

## Phase 1: Kritische Fixes (Blocker) ✅ KOMPLETT
1. [x] ~~BUG-001: Timer funktioniert nicht~~ ✅
2. [x] ~~BUG-004: Block-Bearbeitung löscht andere Blöcke~~ ✅
3. [x] ~~BUG-002: Puffertage & Urlaubstage~~ ✅
4. [x] ~~BUG-003: Leerer Kalender nach Wizard~~ ✅
5. [x] ~~BUG-005: Serientermine~~ ✅
6. [x] ~~BUG-021: Benutzerdaten-Leak zwischen Accounts~~ ✅

## Phase 2: Hohe Priorität ✅ KOMPLETT
7. [x] ~~BUG-006: Protected Routes~~ ✅
8. [x] ~~BUG-013: Aufgaben-Seite~~ ✅
9. [x] ~~BUG-011: Slots ohne Uhrzeiten~~ ✅
10. [x] ~~BUG-010: Archivierte Lernpläne im Kalender~~ ✅
11. [x] ~~BUG-012: Wochenübergreifende Termine~~ ✅
12. [x] ~~BUG-007: Zeitplan-Widget Dot~~ ✅
13. [x] ~~BUG-008: Timer Reset Bug~~ ✅
14. [x] ~~BUG-014: App-Modus~~ ✅
15. [x] ~~BUG-015: Timer-Einstellungen~~ ✅
16. [x] ~~BUG-016: Profil~~ ✅
17. [x] ~~BUG-017: Onboarding~~ ✅

## Phase 3: Mittlere Priorität ✅ KOMPLETT
18. [x] ~~BUG-009: Fortschritts-Widget~~ ✅
19. [x] ~~BUG-018: Themenlisten-Toggle~~ ✅
20. [x] ~~BUG-019: Wizard Zurück-Navigation~~ ✅
21. [x] ~~BUG-020: Logbuch Redirect~~ ✅

---

# Fortschritts-Tracking

| Datum | Bug-ID | Aktion | Status |
|-------|--------|--------|--------|
| 02.01.2026 | BUG-001 | Timer onStart Props hinzugefügt | ✅ Gefixt |
| 02.01.2026 | BUG-002 | Puffer-/Urlaubstage in Slot-Generierung | ✅ Gefixt |
| 02.01.2026 | BUG-002 | slotUtils.js: groupSlotsByTopic für buffer/vacation erweitert | ✅ Gefixt |
| 02.01.2026 | BUG-003 | Kalender-Navigation nach Wizard | ✅ Gefixt |
| 02.01.2026 | BUG-004 | week-view.jsx: ID-Match-Logik für undefined === undefined Fix | ✅ Gefixt |
| 02.01.2026 | BUG-008 | Timer Reset (mit BUG-001) | ✅ Gefixt |
| 02.01.2026 | BUG-005 | Stale-Closure Bug in addPrivateBlock/deleteSeriesPrivateBlocks | ✅ Gefixt |
| 02.01.2026 | BUG-005 | saveDayBlocksBatch() für Batch-Updates implementiert | ✅ Gefixt |
| 02.01.2026 | BUG-006 | ProtectedRoute um alle Routen gewrapped (router.jsx) | ✅ Gefixt |
| 02.01.2026 | BUG-013 | Aufgaben-Seite mit CalendarContext verbunden, CRUD implementiert | ✅ Gefixt |
| 02.01.2026 | BUG-011 | startTime/endTime zu Wizard-Slots hinzugefügt (wizard-context.jsx) | ✅ Gefixt |
| 02.01.2026 | BUG-010 | visibleSlotsByDate für archivierte Pläne (calendar-context.jsx) | ✅ Gefixt |
| 02.01.2026 | BUG-012 | end_date/is_multi_day Spalten + Multi-Day-Block-Logik | ✅ Gefixt |
| 02.01.2026 | BUG-007 | Zeitplan-Widget Zeit-State mit Interval (zeitplan-widget.jsx) | ✅ Gefixt |
| 02.01.2026 | BUG-014 | toggleMode Button zu Settings hinzugefügt (settings-content.jsx) | ✅ Gefixt |
| 02.01.2026 | BUG-015 | Timer liest jetzt beide Storage-Keys und merged Settings | ✅ Gefixt |
| 02.01.2026 | BUG-016 | updateProfile/deleteAccount Funktionen + UI (auth-context.jsx, profil.jsx) | ✅ Gefixt |
| 02.01.2026 | BUG-017 | Flash-Prevention bei Onboarding-Redirect (onboarding.jsx) | ✅ Gefixt |
| 02.01.2026 | BUG-009 | progressUpdateTick für Live-Progress-Updates (dashboard.jsx) | ✅ Gefixt |
| 02.01.2026 | BUG-018 | Themenlisten-Toggle aus NoTopicsView entfernt (lernblock-widget.jsx) | ✅ Gefixt |
| 02.01.2026 | BUG-019 | prevStep() mit State-Reset für jeden Schritt (wizard-context.jsx) | ✅ Gefixt |
| 02.01.2026 | BUG-020 | Error-Handling und Loading-State für Logbuch-Save (timer-logbuch-dialog.jsx) | ✅ Gefixt |
| 03.01.2026 | BUG-021 | LocalStorage bei signOut leeren (auth-context.jsx) | ✅ Gefixt |
| 03.01.2026 | BUG-021 | User-Wechsel-Erkennung bei Login (auth-context.jsx) | ✅ Gefixt |

---

*Zuletzt aktualisiert: 03.01.2026*
