# TICKET DA-001: Dashboard Sub-Header Design-Anpassung

**Typ:** Design-Anpassung (NUR Styling)
**Priorität:** Mittel
**Status:** Implementierung-bereit
**Erstellt:** 2026-01-15
**Aktualisiert:** 2026-01-16
**Aufwand:** 1-2h

---

## 1. Scope-Definition

**WICHTIG:** Dieses Ticket betrifft **NUR Design-Styling**. Alle Funktionen sind bereits vollständig implementiert und dürfen NICHT verändert werden.

### Was geändert wird (Design-Sprache):
- Abstände (Gap, Padding)
- Border-Radius
- Shadows
- Font-Sizes
- Farben

### Was NICHT geändert wird (Funktionen):
- Check-In Button Logik (Morgen/Abend/Disabled/Completed/Skipped)
- Timer Widget Funktionalität (Pomodoro/Countdown/Countup)
- Progress Bar Berechnung
- Play/Pause Hover-Verhalten
- Responsive Verhalten

---

## 2. Figma-Referenz

| Element | Node-ID | Beschreibung |
|---------|---------|--------------|
| Sub-Header Left (aktiv) | `2391:2161` | Check-In am Abend |
| Sub-Header Left (erledigt) | `2391:2176` | Check-Ins erledigt |
| Timer - Pomodoro | `2388:3955` | 6min verbleibend |
| Timer - Countdown | `2391:2329` | Timer mit Zeitspanne |
| Timer - Stoppuhr | `2391:2348` | Countup Modus |

**Figma-URL:** https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2175-1761

---

## 3. Design-Token Mapping

### 3.1 Bereits korrekt (keine Änderung)

| Element | Wert | Tailwind |
|---------|------|----------|
| Container Border | `#E5E5E5` | `border-neutral-200` |
| Primary Text | `#0A0A0A` | `text-neutral-900` |
| Muted Text | `#737373` | `text-neutral-500` |
| Progress Track | `#171717` | `bg-neutral-900` |

### 3.2 Zu ändernde Werte

| Element | Aktuell | Figma | Neue Tailwind-Klasse |
|---------|---------|-------|---------------------|
| "Dashboard" Text | `text-xs` | 14px | `text-sm` |
| Element-Gap | `gap-6` | 30px | `gap-7.5` (30px exakt, in spacing definiert) |
| Check-In Border-Radius | `rounded-full` | 8px | `rounded-md` (8px lt. config) |
| Check-In Shadow | - | shadow-xs | `shadow-xs` (definiert in config) |
| Progress Bar Höhe | `h-1.5` | 4px | `h-1` |
| Timer Button BG | `bg-neutral-50` | border | `bg-white border border-neutral-200` |
| Timer Button Shadow | - | shadow-xs | `shadow-xs` |

### 3.3 Referenz: tailwind.config.js Design-Tokens

```js
// Relevante Definitionen aus tailwind.config.js:
borderRadius: {
  'md': '8px',      // Figma card radius → für Check-In Button
  'lg': '10px',     // NICHT 8px!
}

boxShadow: {
  'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',  // ✅ Figma shadow-xs
}

spacing: {
  '7.5': '30px',    // ✅ Figma gap zwischen Elementen
}

fontSize: {
  'xs': ['12px', { lineHeight: '16px' }],  // Check-In Button Text
  'sm': ['14px', { lineHeight: '20px' }],  // Dashboard Text, Progress Text
}

colors: {
  neutral: {
    200: '#E5E5E5',  // Border
    500: '#737373',  // Muted Text
    900: '#171717',  // Primary Text / Progress Track
  }
}
```

---

## 4. Konkrete Code-Änderungen

**Datei:** `src/components/dashboard/dashboard-sub-header.jsx`

### 4.1 Container (Zeile ~367)

```jsx
// ALT:
<div className="flex flex-wrap items-center gap-6">

// NEU:
<div className="flex flex-wrap items-center gap-7.5">
// gap-7.5 = 30px (exakt wie Figma, definiert in tailwind.config.js spacing)
```

### 4.2 "Dashboard" Text (Zeile ~371)

```jsx
// ALT:
<p className="text-xs text-neutral-500">Dashboard</p>

// NEU:
<p className="text-sm text-neutral-500">Dashboard</p>
```

### 4.3 Check-In Button - Alle States (Zeilen ~316-357)

```jsx
// ALT (completed state, Zeile ~330):
<div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-neutral-200 bg-white text-neutral-500 text-sm">

// NEU:
<div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-200 bg-white shadow-xs text-neutral-500 text-xs">
// rounded-md = 8px (Figma), shadow-xs = Figma shadow
```

```jsx
// ALT (disabled state, Zeile ~340):
<div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-400 text-sm cursor-not-allowed">

// NEU:
<div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-200 bg-neutral-50 text-neutral-400 text-xs cursor-not-allowed">
// KEINE opacity-50: text-neutral-400 + bg-neutral-50 reichen für disabled-Effekt
```

```jsx
// ALT (active state, Zeile ~350):
<button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 text-sm transition-colors">

// NEU:
<button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-200 bg-white shadow-xs text-neutral-800 hover:bg-neutral-50 text-xs transition-colors">
```

```jsx
// ALT (skipped state, Zeile ~316):
<div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-500 text-sm">

// NEU:
<div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-200 bg-neutral-50 shadow-xs text-neutral-500 text-xs">
```

### 4.4 Progress Bar (Zeile ~384)

```jsx
// ALT:
<div className="flex-1 bg-neutral-200 rounded-full h-1.5">
  <div className="h-1.5 rounded-full transition-all bg-neutral-900" ...>

// NEU:
<div className="flex-1 bg-neutral-200 rounded-full h-1">
  <div className="h-1 rounded-full transition-all bg-neutral-900" ...>
```

### 4.4.1 Zweiter Progress-Track (Zeile ~390) - ENTFERNEN

```jsx
// AKTUELL (Zeile 390):
<div className="w-16 bg-neutral-100 rounded-full h-1.5" />

// AKTION: Diese Zeile komplett entfernen
// Grund: Existiert NICHT in Figma, hat keine funktionale Bedeutung
```

### 4.5 Timer Widget - Inactive State (Zeile ~98)

```jsx
// ALT:
<button className="inline-flex justify-end items-center gap-4 px-3 py-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors">

// NEU:
<button className="inline-flex justify-end items-center gap-4 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 shadow-xs hover:bg-neutral-50 transition-colors">
```

### 4.6 Timer Widget - Active State (Zeile ~156)

```jsx
// ALT:
<button className="inline-flex justify-end items-center gap-4 px-3 py-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors">

// NEU:
<button className="inline-flex justify-end items-center gap-4 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 shadow-xs hover:bg-neutral-50 transition-colors">
```

### 4.7 Timer Open Button (Zeile ~104, ~164)

```jsx
// ALT:
<div className="p-2 bg-white rounded-lg shadow-sm border border-neutral-100">

// NEU:
<div className="p-2 bg-white rounded-lg border border-neutral-200 shadow-xs">
```

### 4.8 Play/Pause Button on Hover (Zeile ~173)

```jsx
// ALT:
<button className="p-2 bg-white rounded-lg shadow-sm border border-neutral-100 hover:bg-neutral-50 transition-colors">

// NEU:
<button className="p-2 bg-white rounded-lg shadow-xs border border-neutral-200 hover:bg-neutral-50 transition-colors">
```

---

## 5. Visuelle Vergleichstabelle

| Element | Vorher | Nachher |
|---------|--------|---------|
| Check-In Button | Pill (`rounded-full`) | Rechteck (`rounded-md` = 8px) |
| Check-In Text | 14px (`text-sm`) | 12px (`text-xs`) |
| Progress Bar | 6px Höhe (`h-1.5`) | 4px Höhe (`h-1`) |
| Zweiter Progress-Track | Vorhanden (`w-16`) | **ENTFERNT** |
| Timer Button | Grauer Hintergrund | Weißer Hintergrund mit Border |
| Timer Shadow | `shadow-sm` | `shadow-xs` |
| Timer Border | `border-neutral-100` | `border-neutral-200` |
| Element-Abstand | 24px (`gap-6`) | 30px (`gap-7.5`) |

---

## 6. Beizubehaltende Funktionen (Touch NOT)

```jsx
// DIESE LOGIK BLEIBT UNVERÄNDERT:
✅ checkInEnabled Berechnung (18 Uhr + 80% Regel)
✅ getCheckInButton() - alle State-Varianten
✅ renderCheckIcon() - single/double checkmark
✅ TimerWidget - alle Timer-Typen
✅ CircularProgress SVG - Progress-Anzeige
✅ handlePlayPause() - Hover-Interaktion
✅ getCurrentTimeString() - Uhrzeit-Anzeige
✅ formatHoursMinutes() - Zeitformatierung
```

---

## 7. Akzeptanzkriterien

- [ ] "Dashboard" Text ist 14px (`text-sm`)
- [ ] Check-In Button (alle States) hat `rounded-md` (8px) statt `rounded-full`
- [ ] Check-In Button (active/completed) hat `shadow-xs`
- [ ] Check-In Button Text ist 12px (`text-xs`)
- [ ] Progress Bar ist 4px hoch (`h-1`)
- [ ] Zweiter Progress-Track (graue Leiste rechts) ist **ENTFERNT**
- [ ] Timer Button hat weißen Hintergrund mit Border (`bg-white border border-neutral-200`)
- [ ] Timer Button hat `shadow-xs` statt `shadow-sm`
- [ ] Timer Button Border ist `border-neutral-200` statt `border-neutral-100`
- [ ] Play/Pause Button hat `shadow-xs` und `border-neutral-200`
- [ ] Element-Gap ist 30px (`gap-7.5`)
- [ ] **ALLE bestehenden Funktionen arbeiten unverändert**

---

## 8. Test-Checkliste (nach Änderungen)

- [ ] Check-In Button erscheint korrekt in allen States:
  - [ ] Morgen-Check-in (aktiv)
  - [ ] Abend-Check-in (disabled vor 18 Uhr)
  - [ ] Abend-Check-in (aktiv nach 18 Uhr + 80%)
  - [ ] Check-In erledigt (single ✓)
  - [ ] Check-Ins erledigt (double ✓✓)
  - [ ] Übersprungen (Info-Icon)
- [ ] Timer Widget funktioniert:
  - [ ] "Timer starten" Button klickbar
  - [ ] Pomodoro-Anzeige korrekt
  - [ ] Countdown-Anzeige korrekt
  - [ ] Countup-Anzeige korrekt
  - [ ] Play/Pause on hover funktioniert
- [ ] Progress Bar:
  - [ ] Zeigt korrekten Prozentsatz
  - [ ] Animiert bei Timer-Updates

---

## 9. Hinweise zur Figma-Abweichung

### Funktionen in Figma, die NICHT implementiert werden:
Diese Funktionen existieren in Figma, sind aber in der App nicht vorgesehen:

| Figma-Element | Grund für Nicht-Implementierung |
|---------------|--------------------------------|
| Statischer "Day, Date" Text | App zeigt dynamisches Datum |
| Fester Timer-Zeitraum | App berechnet dynamisch |

### Funktionen in App, die NICHT in Figma sind:
Diese Funktionen wurden bewusst hinzugefügt und bleiben erhalten:

| App-Feature | Grund für Beibehaltung |
|-------------|----------------------|
| Skipped Check-In State | UX-Verbesserung |
| Play/Pause Button on Hover | Schnellzugriff |
| Morgen-/Abend-Unterscheidung | Logik-Anforderung |
| Single/Double Checkmark | Visualisierung der Completion |

---

## 10. Abhängigkeiten

| Abhängigkeit | Status | Auswirkung |
|--------------|--------|------------|
| `shadow-xs` | ✅ Definiert | `tailwind.config.js` Zeile 103 |
| `gap-7.5` | ✅ Definiert | `tailwind.config.js` Zeile 89 (30px) |
| `rounded-md` | ✅ Definiert | `tailwind.config.js` Zeile 98 (8px) |
| `text-xs/text-sm` | ✅ Definiert | `tailwind.config.js` Zeilen 71-72 |

**Alle benötigten Klassen sind bereits in der Projekt-Config definiert.**

---

## 11. Risiken

| Risiko | Mitigation |
|--------|------------|
| Button-Click-Area ändert sich | Padding beibehalten |
| Visuelle Regression | Screenshot-Vergleich vor/nach |
| Funktions-Regression | Manuelle Test-Checkliste durchführen |
