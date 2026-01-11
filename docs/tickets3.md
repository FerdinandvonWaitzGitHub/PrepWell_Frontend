# Zeiterfassung

**Status: BEHOBEN**

## Probleme (ursprünglich)

### 1. Timer-Auswahl in separatem Dialog (Design-Inkonsistenz)
Wenn man zwischen Pomodoro Timer, Stoppuhr und Timer auswählte, öffnete sich ein separater Dialog.

### 2. Einstellungs-Button inkonsistentes Styling
- Nicht konfiguriert: roter Button (`bg-red-500`)
- Konfiguriert: Outline Button

### 3. SettingsIcon war kein Zahnrad
Das Icon zeigte ein Rechteck statt ein Zahnrad.

### 4. Timer-Konfiguration wurde nicht gespeichert (Bug)
- Countdown-Einstellungen wurden nicht korrekt gespeichert (`countdownSettings` statt `settings`)
- Stoppuhr speicherte keine Konfiguration, was zum Zurücksetzen der Ansicht führte

## Lösung

### Implementierte Dateien:
- `src/components/dashboard/timer/timer-main-dialog.jsx`
- `src/components/dashboard/timer/timer-button.jsx`

### Änderungen:

1. **Timer-Auswahl inline im Haupt-Dialog**
   - Neuer `viewMode` State: 'timer' | 'selection' | 'pomodoro-settings' | 'countdown-settings'
   - Timer-Auswahl, Pomodoro-Settings und Countdown-Settings werden jetzt im `slotFrTimerFunktion` Bereich angezeigt
   - Separate Dialoge werden nicht mehr aus `timer-button.jsx` aufgerufen

2. **Einheitlicher Outline-Button für Einstellungen**
   - Alle Footer-Buttons verwenden jetzt den gleichen `OutlineButton` Style

3. **Korrektes Zahnrad-Icon**
   - `SettingsIcon` zeigt jetzt ein echtes Zahnrad mit Strahlen

4. **Bug-Fix: Timer-Konfiguration korrekt speichern**
   - `handleCountdownSave` übergibt jetzt `settings` statt `countdownSettings`
   - `handleSelectType` für Stoppuhr (countup) speichert jetzt auch die Konfiguration

### Struktur nach Figma-Design:
```
ZeiterfassungPopUp
├── dialogHeader (Title + Description) ← dynamisch je nach viewMode
├── slotFrTimerFunktion ← Timer/Auswahl/Settings je nach viewMode
└── Footer (Einstellungen, Logbuch, Fertig) ← nur im Timer-View
```

## Figma-Referenz
- Link: https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2607-3440
