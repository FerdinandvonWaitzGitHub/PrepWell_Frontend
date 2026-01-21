# TICKET TM-001: Timer-System Design-Anpassung

**Typ:** Design-Anpassung (NUR Styling)
**Priorität:** Niedrig
**Status:** ✅ Implementiert
**Erstellt:** 2026-01-15
**Aktualisiert:** 2026-01-16
**Aufwand:** 1-2h

---

## 1. Scope-Definition

**WICHTIG:** Dieses Ticket betrifft **NUR Design-Styling**. Das Timer-System ist sehr umfangreich und wertvoll implementiert (Pomodoro + Countdown + Countup) - alle Funktionen bleiben KOMPLETT erhalten.

### Was geändert wird (Design-Sprache):
- Timer-Button Border-Radius: `rounded-lg` → `rounded-md`
- Timer-Button Border: `border-neutral-100` → `border-neutral-200`
- Primary Text Color: `text-neutral-900` → `text-neutral-950`

### Was NICHT geändert wird (Funktionen):
- Farbige Hintergründe pro Timer-Typ (red-50, blue-50, green-50) - APP-Feature, bleibt!
- CircularProgress Komponente - APP-Feature, bleibt!
- Play/Pause Button auf Hover - APP-Feature, bleibt!
- Dashboard-Integration/Platzierung - Layout bleibt unverändert
- Timer-Dialoge auslagern (Refactoring) - NICHT in diesem Ticket
- Alle Timer-Funktionen (Pomodoro, Countdown, Countup)
- Timer-Settings und Presets
- Timer-History/Logbuch

---

## 2. Figma-Referenz

| Element | Node-ID | Beschreibung |
|---------|---------|--------------|
| **Timer_example** | `2391:2329` | Countdown Timer Display |
| **Pomodoro_example** | `2388:3955` | Pomodoro Timer Display |
| **Stoppuhr_example** | `2391:2348` | Countup Timer Display |

---

## 3. Figma Design-Spezifikationen

### 3.1 Timer_Info (Text-Bereich)

```
Primary Text:
- Font-Size: 14px (text-sm)
- Font-Weight: medium (500)
- Color: #0A0A0A (neutral-950)
- Line-Height: 20px

Secondary Text:
- Font-Size: 14px (text-sm)
- Font-Weight: normal (400)
- Color: #737373 (neutral-500)
- Line-Height: 20px
```

### 3.2 Open_Timer_Button

```
Background: white
Border: 1px solid #E5E5E5 (neutral-200)
Border-Radius: 8px (rounded-md)
Padding: 8px (p-2)
Shadow: shadow-xs
```

### 3.3 Container

```
Background: white (Figma zeigt KEINE farbigen Hintergründe!)
Gap: 30px zwischen Info und Button
```

---

## 4. Design-Token Mapping

### 4.1 Bereits korrekt

| Element | Figma | Tailwind | Status |
|---------|-------|----------|--------|
| Secondary Text Color | `#737373` | `text-neutral-500` | ✅ |
| Secondary Text Weight | `400` | `font-normal` | ✅ |
| Primary Text Size | `14px` | `text-sm` | ✅ |
| Button Padding | `8px` | `p-2` | ✅ |
| Button Background | `white` | `bg-white` | ✅ |

### 4.2 Zu ändernde Werte

| Element | Aktuell | Figma | Neue Tailwind-Klasse |
|---------|---------|-------|---------------------|
| Primary Text Color | `text-neutral-900` | #0A0A0A | `text-neutral-950` |
| Button Border-Radius | `rounded-lg` (10px) | 8px | `rounded-md` |
| Button Border | `border-neutral-100` | #E5E5E5 | `border-neutral-200` |
| Button Shadow | `shadow-sm` | shadow-xs | `shadow-xs` |

---

## 5. Konkrete Code-Änderungen

**Datei:** `src/components/dashboard/timer/timer-display.jsx`

### 5.1 Primary Text Color (Zeile 103-106)

```jsx
// ALT:
<div className={`
  text-sm font-medium leading-5 text-right
  ${isPaused ? 'text-neutral-600' : isBreak ? 'text-green-700' : 'text-neutral-900'}
`}>

// NEU (Figma: text-neutral-950):
<div className={`
  text-sm font-medium leading-5 text-right
  ${isPaused ? 'text-neutral-600' : isBreak ? 'text-green-700' : 'text-neutral-950'}
`}>
```

### 5.2 Progress Circle Button (Zeile 115)

```jsx
// ALT:
<div className="p-2 bg-white rounded-lg shadow-sm border border-neutral-100 flex justify-center items-center">

// NEU (Figma: rounded-md, border-neutral-200, shadow-xs):
<div className="p-2 bg-white rounded-md shadow-xs border border-neutral-200 flex justify-center items-center">
```

### 5.3 Play/Pause Button (Zeile 127)

```jsx
// ALT:
<div
  onClick={handlePlayPause}
  className="p-2 bg-white rounded-lg shadow-sm border border-neutral-100 flex justify-center items-center hover:bg-neutral-50 transition-colors cursor-pointer"

// NEU (Figma: rounded-md, border-neutral-200, shadow-xs):
<div
  onClick={handlePlayPause}
  className="p-2 bg-white rounded-md shadow-xs border border-neutral-200 flex justify-center items-center hover:bg-neutral-50 transition-colors cursor-pointer"
```

---

## 6. Visuelle Vergleichstabelle

| Element | Vorher | Nachher |
|---------|--------|---------|
| **Primary Text** | `text-neutral-900` | `text-neutral-950` |
| **Button Radius** | `rounded-lg` (10px) | `rounded-md` (8px) |
| **Button Border** | `border-neutral-100` | `border-neutral-200` |
| **Button Shadow** | `shadow-sm` | `shadow-xs` |

---

## 7. Beizubehaltende Funktionen (Touch NOT)

```jsx
// DIESE LOGIK BLEIBT KOMPLETT UNVERÄNDERT:

// Timer-Typen und Logik
✅ TIMER_TYPES.POMODORO, COUNTDOWN, COUNTUP
✅ Pomodoro Cycles (25min/5min/15min)
✅ Countdown mit Presets
✅ Countup (Stoppuhr)

// CircularProgress Komponente (Zeile 7-40)
✅ SVG circular progress indicator
✅ Progress berechnung
✅ Break/Work Farben (green/primary)

// Farbige Hintergründe (Zeile 69-81)
✅ getBgColor() Funktion
✅ Pomodoro: bg-red-50
✅ Countdown: bg-blue-50
✅ Countup: bg-green-50
✅ Break: bg-green-50
✅ Paused: bg-neutral-100

// Play/Pause Hover-Feature (Zeile 124-144)
✅ T16-W6: handlePlayPause
✅ Play/Pause Icons
✅ Hover-State handling

// Timer-Dialoge (separate Dateien)
✅ timer-main-dialog.jsx
✅ timer-controls-dialog.jsx
✅ pomodoro-settings-dialog.jsx
✅ countdown-settings-dialog.jsx
✅ timer-selection-dialog.jsx
✅ timer-logbuch-dialog.jsx

// Timer-Context (timer-context.jsx)
✅ Gesamte Timer-State-Logik
✅ getDisplayInfo()
✅ togglePause()
✅ Timer-History
```

---

## 8. Hinweise zur Figma-Abweichung

### Features in App die NICHT in Figma sind (BEHALTEN):

| App-Feature | Grund für Beibehaltung |
|-------------|----------------------|
| Farbige Hintergründe (red-50, blue-50, etc.) | UX-Verbesserung: Visuelles Feedback zum Timer-Typ |
| CircularProgress statt statischem Spinner | UX-Verbesserung: Zeigt Fortschritt an |
| Play/Pause Button auf Hover | UX-Verbesserung: Schnelle Kontrolle ohne Dialog |
| Break/Work State Farben | UX-Verbesserung: Klare Unterscheidung |

### Figma zeigt NICHT:

| Figma-Element | Status in App |
|---------------|---------------|
| Statischer LoaderCircle Spinner | App hat besseren CircularProgress |
| Nur weißer Hintergrund | App hat kontextuelle Farben |
| Kein Play/Pause Button sichtbar | App zeigt ihn für bessere UX |

---

## 9. Akzeptanzkriterien

### 9.1 Styling-Änderungen
- [ ] Primary Text ist `text-neutral-950` statt `text-neutral-900`
- [ ] Timer-Buttons haben `rounded-md` statt `rounded-lg`
- [ ] Timer-Buttons haben `border-neutral-200` statt `border-neutral-100`
- [ ] Timer-Buttons haben `shadow-xs` statt `shadow-sm`

### 9.2 Funktions-Erhalt
- [ ] **ALLE bestehenden Funktionen arbeiten unverändert**
- [ ] Pomodoro Timer funktioniert (Start, Pause, Stop, Cycles)
- [ ] Countdown Timer funktioniert
- [ ] Countup Timer (Stoppuhr) funktioniert
- [ ] Farbige Hintergründe werden korrekt angezeigt
- [ ] CircularProgress zeigt Fortschritt an
- [ ] Play/Pause Button funktioniert
- [ ] Timer-Dialoge öffnen und funktionieren

---

## 10. Test-Checkliste

### 10.1 Timer-Display
- [ ] Timer-Info Text-Styling korrekt
- [ ] Button-Styling korrekt (rounded-md, border-neutral-200)
- [ ] Farbige Hintergründe bleiben erhalten
- [ ] CircularProgress funktioniert

### 10.2 Timer-Funktionalität
- [ ] Pomodoro: Start → Work → Break → Work Cycle
- [ ] Countdown: Preset auswählen → Start → Ende
- [ ] Countup: Start → Läuft → Stop
- [ ] Pause/Resume bei allen Typen
- [ ] Timer-Settings können geändert werden

---

## 11. Abhängigkeiten

| Abhängigkeit | Status |
|--------------|--------|
| `text-neutral-950` | ✅ In tailwind.config.js definiert (#0A0A0A) |
| `rounded-md` | ✅ In tailwind.config.js definiert (8px) |
| `border-neutral-200` | ✅ Tailwind Standard (#E5E5E5) |
| `shadow-xs` | ✅ In tailwind.config.js definiert |

---

## 12. Risiken

| Risiko | Mitigation |
|--------|------------|
| Kontrast zu gering (neutral-950 vs neutral-900) | Minimal, beide gut lesbar |
| Button-Radius Unterschied sichtbar | Konsistent mit DS-001 Button-System |

---

## 13. Korrektur zum alten Ticket

Das ursprüngliche Ticket war **FALSCH fokussiert**:

> ❌ "Dashboard-Integration optimieren"
> ❌ "Timer weniger dominant im LernblockWidget"
> ❌ "Separate Timer-Access (z.B. über Header/Menu)"
> ❌ "Timer-Dialogs aus Dashboard-Ordner auslagern"
> ❌ "Shared Timer-Components erstellen"
> ❌ "Timer-Context optimieren"

**KORREKTUR:** Das sind FUNKTIONEN und REFACTORING, nicht Styling. Die Timer-Platzierung und -Integration bleibt unverändert.

Das Timer-System ist **sehr gut implementiert** mit:
- 8 Timer-Komponenten
- Pomodoro + Countdown + Countup
- Detaillierte Settings
- History/Logbuch
- Farbcodierte Status-Anzeigen

---

## 14. Timer-Komponenten (Referenz)

| Datei | Funktion |
|-------|----------|
| `timer-button.jsx` | Haupt-Entry-Point (Start-Button oder Display) |
| `timer-display.jsx` | Zeigt laufenden Timer an |
| `timer-main-dialog.jsx` | Unified Timer-Control Dialog |
| `timer-controls-dialog.jsx` | Timer-Steuerung |
| `timer-selection-dialog.jsx` | Timer-Typ Auswahl |
| `pomodoro-settings-dialog.jsx` | Pomodoro-Einstellungen |
| `countdown-settings-dialog.jsx` | Countdown-Einstellungen |
| `timer-logbuch-dialog.jsx` | Timer-History |
