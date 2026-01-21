# TICKET DA-003: ZeitplanWidget Design-Anpassung

**Typ:** Design-Anpassung (NUR Styling)
**Priorität:** Mittel
**Status:** Implementierung-bereit
**Erstellt:** 2026-01-15
**Aktualisiert:** 2026-01-16
**Aufwand:** 3-4h

---

## 1. Scope-Definition

**WICHTIG:** Dieses Ticket betrifft **NUR Design-Styling**. Das ZeitplanWidget ist funktional komplex - diese Funktionen bleiben ALLE erhalten.

### Was geändert wird (Design-Sprache):
- Header-Titel Styling (Font-Size, Weight)
- Badge Styling (Border-Radius)
- Navigation-Buttons (Size, Border-Radius, Border)
- Current-Time-Indicator Farbe (rot → schwarz)
- Block Border-Radius (rounded-xl → rounded)
- Block-Titel Font-Weight
- "Lernzeitraum blockiert" Styling (kein Stripe-Pattern)

### Was NICHT geändert wird (Funktionen):
- T4.1: Drag-to-Select Zeitbereich
- Drop-to-Block Funktionalität
- Aktuelle Zeit-Indikator Logik
- Block-Click Handler
- Navigation (Prev/Next Day)
- Auto-Scroll zu aktueller Zeit
- Selection-Overlay mit Kollisionserkennung

---

## 2. Figma-Referenz

| Element | Node-ID | Beschreibung |
|---------|---------|--------------|
| **Zeitplan_Heute** | `2398:4504` | Hauptcontainer |
| **Lernblock** | `2398:4525` | Block-Card Design |
| **Lernzeitraum blockiert** | `2398:4524` | Blocked-State Design |

**Figma-URL:** https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2398-4504

---

## 3. Design-Token Mapping (tailwind.config.js)

### 3.1 Bereits korrekt verwendete Tokens

| Element | Figma | Tailwind | Status |
|---------|-------|----------|--------|
| Container Background | `#FFFFFF` | `bg-white` | ✅ |
| Container Border | `#E5E5E5` | `border-neutral-200` | ✅ |
| Container Border-Radius | `10px` | `rounded-lg` | ✅ |
| Hour Labels Color | `#A3A3A3` | `text-neutral-400` | ✅ |
| Grid Lines | `#E5E5E5` | `border-neutral-200` | ✅ |
| Badge Background | `#F5F5F5` | `bg-neutral-100` | ✅ |

### 3.2 Zu ändernde Werte

| Element | Aktuell | Figma | Neue Tailwind-Klasse |
|---------|---------|-------|---------------------|
| Header-Titel Font | `text-2xl font-extralight` | 14px medium | `text-sm font-medium` |
| Badge Border-Radius | `rounded-full` | 8px | `rounded-md` |
| Nav-Button Size | `h-9 w-9` | 32x32px | `size-8` |
| Nav-Button Border-Radius | `rounded-full` | 8px | `rounded-md` |
| Nav-Button Border | keine | #E5E5E5 | `border border-neutral-200` |
| Current-Time Dot | `bg-red-500` | #2C2C2C | `bg-neutral-800` |
| Current-Time Line | `border-red-500` | #2C2C2C | `border-neutral-800` |
| Current-Time Label | `text-red-500` | #2C2C2C | `text-neutral-800` |
| Block Border-Radius | `rounded-xl` | 5px | `rounded` |
| Block-Titel Font | `font-semibold` | light | `font-light` |
| Blocked-Pattern | Striped + Lock-Icon | Plain bg | ENTFERNEN |

### 3.3 Referenz tailwind.config.js

```js
// Bereits verfügbare Tokens:
borderRadius: {
  'DEFAULT': '6px',
  'md': '8px',      // Für Badge, Nav-Buttons
  'lg': '10px',     // Container (passt)
}
// size-8 = 32px (Tailwind Standard)
// text-sm = 14px (Figma Header)
```

---

## 4. Konkrete Code-Änderungen

**Datei:** `src/components/dashboard/zeitplan-widget.jsx`

### 4.1 Header-Titel (Zeile 299)

```jsx
// ALT:
<h2 className="text-2xl font-extralight text-neutral-900">Zeitplan für heute</h2>

// NEU:
<h2 className="text-sm font-medium text-neutral-900">Zeitplan für heute</h2>
```

### 4.2 Badge Border-Radius (Zeile 301)

```jsx
// ALT:
<span className="inline-flex items-center px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-900">

// NEU:
<span className="inline-flex items-center px-3 py-1.5 rounded-md bg-neutral-100 text-xs font-semibold text-neutral-900">
```

### 4.3 Navigation-Buttons (Zeilen 307-324)

```jsx
// ALT (Previous Button):
<button
  onClick={handlePreviousDay}
  className="h-9 w-9 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
  aria-label="Vorheriger Tag"
>

// NEU:
<button
  onClick={handlePreviousDay}
  className="size-8 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
  aria-label="Vorheriger Tag"
>

// ALT (Next Button):
<button
  onClick={handleNextDay}
  className="h-9 w-9 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
  aria-label="Nächster Tag"
>

// NEU:
<button
  onClick={handleNextDay}
  className="size-8 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
  aria-label="Nächster Tag"
>
```

### 4.4 Current-Time-Indicator (Zeilen 354-364)

```jsx
// ALT:
<div className="flex items-center">
  {/* Time label */}
  <span className="w-8 text-xs font-bold text-red-500 text-right mr-1">
    {currentHour}:{currentMinute.toString().padStart(2, '0')}
  </span>
  {/* Red Dot (Figma: Ellipse 6x6px) */}
  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
  {/* Line */}
  <div className="flex-1 border-t-2 border-red-500 ml-0.5" />
</div>

// NEU (Figma: Schwarzer Dot + Line):
<div className="flex items-center">
  {/* Time label */}
  <span className="w-8 text-xs font-bold text-neutral-800 text-right mr-1">
    {currentHour}:{currentMinute.toString().padStart(2, '0')}
  </span>
  {/* Black Dot (Figma: Ellipse 6x6px) */}
  <div className="w-1.5 h-1.5 rounded-full bg-neutral-800 shrink-0" />
  {/* Line */}
  <div className="flex-1 border-t-2 border-neutral-800 ml-0.5" />
</div>
```

### 4.5 "Lernzeitraum blockiert" Block (Zeilen 452-476)

```jsx
// ALT (mit Stripe-Pattern und Lock-Icon):
if (isBlocked) {
  return (
    <div
      key={block.id || index}
      className="absolute left-2 right-2 cursor-pointer rounded-xl border-2 border-neutral-300 p-3 flex flex-col overflow-hidden transition-all hover:shadow-md bg-neutral-100"
      style={{
        ...getBlockStyle(block.startHour, block.duration),
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(163, 163, 163, 0.1) 10px, rgba(163, 163, 163, 0.1) 20px)',
      }}
      onClick={() => onBlockClick && onBlockClick(block)}
    >
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-sm font-medium text-neutral-500">Lernzeitraum blockiert</span>
        </div>
        {block.title && (
          <p className="text-xs text-neutral-400 mt-1">{block.title}</p>
        )}
      </div>
    </div>
  );
}

// NEU (Figma: Einfaches Design ohne Stripe/Icon):
if (isBlocked) {
  return (
    <div
      key={block.id || index}
      className="absolute left-2 right-2 cursor-pointer rounded border border-neutral-200 p-3 flex flex-col overflow-hidden transition-all hover:shadow-md bg-neutral-100"
      style={getBlockStyle(block.startHour, block.duration)}
      onClick={() => onBlockClick && onBlockClick(block)}
    >
      <div className="flex-1 flex flex-col justify-center items-center">
        <span className="text-sm font-medium text-neutral-500">Lernzeitraum blockiert</span>
        {block.title && (
          <p className="text-xs text-neutral-400 mt-1">{block.title}</p>
        )}
      </div>
    </div>
  );
}
```

### 4.6 Regular Block Border-Radius (Zeilen 479-485)

```jsx
// ALT:
<div
  key={block.id || index}
  className={`absolute left-2 right-2 cursor-pointer rounded-xl border-2 p-3 flex flex-col overflow-hidden transition-all hover:shadow-lg ${
    isDragOver
      ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300'
      : `${blockColors.bg} ${blockColors.border} hover:shadow-md`
  }`}
  ...
>

// NEU (border-2 → border, rounded-xl → rounded):
<div
  key={block.id || index}
  className={`absolute left-2 right-2 cursor-pointer rounded border p-3 flex flex-col overflow-hidden transition-all hover:shadow-lg ${
    isDragOver
      ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300'
      : `${blockColors.bg} ${blockColors.border} hover:shadow-md`
  }`}
  ...
>
```

### 4.7 Drop-Indicator Overlay Border-Radius (Zeile 495)

```jsx
// ALT:
<div className="absolute inset-0 flex items-center justify-center bg-blue-100/90 rounded-xl z-10 pointer-events-none">

// NEU:
<div className="absolute inset-0 flex items-center justify-center bg-blue-100/90 rounded z-10 pointer-events-none">
```

### 4.8 Block-Titel Font-Weight (Zeile 505)

```jsx
// ALT:
<p className={`font-semibold leading-tight ${blockColors.text}`}>
  {block.title || 'Lernblock'}
</p>

// NEU:
<p className={`font-light leading-tight ${blockColors.text}`}>
  {block.title || 'Lernblock'}
</p>
```

### 4.9 Selection Overlay Border-Radius (Zeile 386)

```jsx
// ALT:
<div
  className={`absolute left-2 right-2 rounded-lg border-2 border-dashed transition-colors pointer-events-none z-20 flex items-center justify-center ${
    selectionOverlay.isValid
      ? 'bg-blue-100/70 border-blue-400'
      : 'bg-red-100/70 border-red-400'
  }`}
  ...
>

// NEU (rounded-lg → rounded für Konsistenz mit Blöcken):
<div
  className={`absolute left-2 right-2 rounded border-2 border-dashed transition-colors pointer-events-none z-20 flex items-center justify-center ${
    selectionOverlay.isValid
      ? 'bg-blue-100/70 border-blue-400'
      : 'bg-red-100/70 border-red-400'
  }`}
  ...
>
```

---

## 5. Visuelle Vergleichstabelle

| Element | Vorher | Nachher |
|---------|--------|---------|
| Header-Titel | `text-2xl font-extralight` | `text-sm font-medium` |
| Badge | `rounded-full` | `rounded-md` |
| Nav-Buttons | `h-9 w-9 rounded-full` | `size-8 rounded-md border` |
| Current-Time | Rot (`red-500`) | Schwarz (`neutral-800`) |
| Block Border-Radius | `rounded-xl` (16px) | `rounded` (6px) |
| Block Border | `border-2` | `border` |
| Block-Titel | `font-semibold` | `font-light` |
| Blocked-Pattern | Stripes + Lock-Icon | Plain bg |
| Selection Overlay | `rounded-lg` | `rounded` |

---

## 6. Beizubehaltende Funktionen (Touch NOT)

```jsx
// DIESE LOGIK BLEIBT KOMPLETT UNVERÄNDERT:

// T4.1: Drag-to-Select (Zeilen 179-291)
✅ handleTimelineMouseDown
✅ handleTimelineMouseMove
✅ handleTimelineMouseUp
✅ handleTimelineMouseLeave
✅ selectionOverlay Berechnung
✅ yToTime, formatTimeFromHour Helper
✅ hasCollision, findMaxEndWithoutCollision Helper

// Drop-Funktionalität (Zeilen 417-449)
✅ handleDragOver, handleDragLeave, handleDrop
✅ onDropTaskToBlock Callback
✅ Task und Thema Drop Support

// Navigation (Zeilen 102-112)
✅ handlePreviousDay, handleNextDay
✅ onPreviousDay, onNextDay Callbacks

// Current-Time Logik (Zeilen 46-128)
✅ currentTime State mit setInterval
✅ currentTimePositionPx Berechnung
✅ isInRange Check

// Block-Click (Zeilen 461, 487)
✅ onBlockClick Callback

// Auto-Scroll (Zeilen 88-97)
✅ scrollTop zu aktueller Zeit
```

---

## 7. Akzeptanzkriterien

- [ ] Header-Titel ist `text-sm font-medium`
- [ ] Badge hat `rounded-md` statt `rounded-full`
- [ ] Nav-Buttons sind `size-8 rounded-md border border-neutral-200`
- [ ] Current-Time-Indicator ist schwarz (`neutral-800`)
- [ ] Blöcke haben `rounded border` statt `rounded-xl border-2`
- [ ] Block-Titel ist `font-light`
- [ ] "Lernzeitraum blockiert" hat kein Stripe-Pattern und kein Lock-Icon
- [ ] Selection Overlay hat `rounded` statt `rounded-lg`
- [ ] **ALLE bestehenden Funktionen arbeiten unverändert**
- [ ] Drag-to-Select funktioniert weiterhin
- [ ] Drop-to-Block funktioniert weiterhin
- [ ] Navigation (Prev/Next) funktioniert weiterhin

---

## 8. Test-Checkliste (nach Änderungen)

### 8.1 Timeline-Anzeige
- [ ] Stunden 0-24 werden korrekt angezeigt
- [ ] Current-Time-Indicator zeigt aktuelle Zeit
- [ ] Auto-Scroll zu aktueller Zeit beim Laden

### 8.2 Block-Interaktion
- [ ] Klick auf Block öffnet Dialog
- [ ] Drag-over zeigt "Hier ablegen" Overlay
- [ ] Drop von Task funktioniert
- [ ] Drop von Thema funktioniert

### 8.3 Drag-to-Select
- [ ] Ziehen in leerer Fläche erstellt Selection
- [ ] Selection-Overlay zeigt Zeitbereich
- [ ] Kollisionserkennung funktioniert
- [ ] Mindestdauer 15 Min. wird geprüft

### 8.4 Navigation
- [ ] "Vorheriger Tag" Button funktioniert
- [ ] "Nächster Tag" Button funktioniert
- [ ] Badge zeigt geplante Stunden

---

## 9. Hinweise zur Figma-Abweichung

### Funktionen in App, die NICHT in Figma sind:
Diese wurden bewusst hinzugefügt und bleiben erhalten:

| App-Feature | Grund für Beibehaltung |
|-------------|----------------------|
| Drag-to-Select Zeitbereich | UX-Verbesserung für schnelle Block-Erstellung |
| Drop-to-Block | Workflow-Optimierung |
| Task-Progress in Blöcken | Fortschritts-Feedback |
| Selection-Overlay | Visuelles Feedback beim Ziehen |
| Kollisionserkennung | Verhindert Überschneidungen |

### Design in Figma, das NICHT implementiert wird:

| Figma-Element | Grund für Nicht-Implementierung |
|---------------|--------------------------------|
| Subject-Color-Coding für Blöcke | App verwendet neutral colors (getBlockColors) |

---

## 10. Abhängigkeiten

| Abhängigkeit | Status | Auswirkung |
|--------------|--------|------------|
| `rounded-md` | ✅ Verfügbar | tailwind.config.js (8px) |
| `size-8` | ✅ Verfügbar | Tailwind Standard (32px) - siehe Hinweis |
| `text-sm font-medium` | ✅ Verfügbar | Tailwind Standard |
| `border-neutral-800` | ✅ Verfügbar | Tailwind Standard |

**Alle benötigten Klassen sind bereits verfügbar.**

**Hinweis zu `size-8`:** Falls `size-8` nicht funktioniert, alternativ `h-8 w-8` verwenden.

---

## 11. Risiken

| Risiko | Mitigation |
|--------|------------|
| Header zu klein | `text-sm` ist 14px, gut lesbar |
| Current-Time weniger auffällig | Schwarz ist neutral, passt zum Design |
| Block-Titel zu dünn | `font-light` ist Figma-konform |
| Funktions-Regression | Umfangreiche Test-Checkliste durchführen |

---

## 12. Korrektur zum alten Ticket

Das ursprüngliche Ticket war **unvollständig**:

> ❌ "Timeline-Styling nicht figma-konform" - ohne konkrete Angaben

**Korrektur:** Dieses Ticket enthält jetzt:
- Konkrete Zeilennummern
- Exakte ALT/NEU Code-Snippets
- Tailwind-Token-Referenzen
- Vollständige Funktionsliste die erhalten bleibt

---

## 13. Scope-Abgrenzung: Dialog-Styling

**Nicht in diesem Ticket enthalten:**

Das Dialog-Fenster (`ManageThemeSessionDialog`) verwendet die generische Dialog-Komponente (`src/components/ui/dialog.jsx`). Das Styling dieser Dialoge ist **nicht Bestandteil von DA-003**.

Für Dialog-Design-Anpassungen sollte ein separates Ticket erstellt werden:
- `dialog.jsx` verwendet `rounded-xl` für `DialogContent`
- Mögliche Anpassung: `rounded-lg` für Figma-Konsistenz
- Form-Felder innerhalb der Dialoge haben eigenes Styling

**Grund:** Dialog-Styling ist global und betrifft alle Dialoge in der App, nicht nur ZeitplanWidget.
