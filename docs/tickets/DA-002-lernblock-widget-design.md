# TICKET DA-002: LernblockWidget Design-Anpassung

**Typ:** Design-Anpassung (NUR Styling)
**Priorität:** Mittel
**Status:** ✅ Implementiert
**Erstellt:** 2026-01-15
**Aktualisiert:** 2026-01-16
**Aufwand:** 2-3h

---

## 1. Scope-Definition

**WICHTIG:** Dieses Ticket betrifft **NUR Design-Styling**. Das LernblockWidget (session-widget.jsx) ist funktional komplex mit vielen Features - diese bleiben ALLE erhalten.

### Was geändert wird (Design-Sprache):
- Task-Container Styling (Gap, Checkbox Shadow)
- Priority-Indicator Font-Size
- Badge-Styling vereinheitlichen
- "Neue Aufgabe" Button-Styling

### Was NICHT geändert wird (Funktionen):
- Toggle zwischen To-Dos / Themenliste / Blöcke (FR2)
- Drag & Drop zur Zeitplan-Widget
- ThemeList Hierarchie (URG → Kapitel → Themen → Aufgaben)
- Double-Click Edit (TICKET-5)
- Archive ThemeList (TICKET-12)
- Chapter Level Toggle
- Exam Mode / Normal Mode Unterscheidung

---

## 2. Figma-Referenz

| Element | Node-ID | Beschreibung |
|---------|---------|--------------|
| **Lernplan Container** | `2398:3619` | Hauptcontainer (680x730px) |
| **Tags, Titel, Beschreibung** | `2398:3620` | Header-Bereich |
| **Task_Container** | `2398:3629` | Einzelne Aufgabe |
| **Neue Aufgabe Button** | `2607:3158` | Add-Task Button |

**Figma-URL:** https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2398-3619

---

## 3. Design-Token Mapping (tailwind.config.js)

### 3.1 Bereits korrekt verwendete Tokens

| Element | Figma | Tailwind | Status |
|---------|-------|----------|--------|
| Task-Box Background | `#F5F5F5` | `bg-neutral-100` | ✅ |
| Task-Box Padding | `10px` | `p-2.5` | ✅ |
| Task-Box Border-Radius | `8px` | `rounded-lg` | ✅ |
| Title Font | `24px extralight` | `text-2xl font-extralight` | ✅ |
| Description Color | `#A3A3A3` | `text-neutral-400` | ✅ |
| Task Text | `14px` | `text-sm` | ✅ |

### 3.2 Zu ändernde Werte

| Element | Aktuell | Figma | Neue Tailwind-Klasse |
|---------|---------|-------|---------------------|
| Task-Items Gap | `gap-2` (8px) | 10px | `gap-2.5` |
| Checkbox Shadow | keine | shadow-xs | `shadow-xs` |
| Priority "!" Font-Size | `text-sm` | 20px | `text-xl` |
| Priority Active Color | `text-neutral-700` | #0A0A0A | `text-neutral-900` |
| Priority Inactive Color | `text-neutral-300` | #E5E5E5 | `text-neutral-200` |
| Priority Hover | keine | #0A0A0A | `hover:text-neutral-950` |
| Neue Aufgabe Gap | `gap-1.5` (6px) | 8px | `gap-2` |

---

## 4. Konkrete Code-Änderungen

**Datei:** `src/components/dashboard/session-widget.jsx`

### 4.1 TaskList - Items Gap (Zeile ~310)

```jsx
// ALT:
<div className="flex flex-col gap-2">

// NEU:
<div className="flex flex-col gap-2.5">
```

### 4.2 TaskItem - Checkbox Styling (2 Stellen)

**4.2.1 Edit Mode Checkbox (Zeile ~142)**
```jsx
// ALT:
<input
  type="checkbox"
  checked={task.completed}
  onChange={() => onToggle(task.id)}
  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 flex-shrink-0"
/>

// NEU:
<input
  type="checkbox"
  checked={task.completed}
  onChange={() => onToggle(task.id)}
  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 shadow-xs flex-shrink-0"
/>
```

**4.2.2 Normal Mode Checkbox (Zeile ~189)**
```jsx
// ALT:
<input
  type="checkbox"
  ...
  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 flex-shrink-0"
/>

// NEU:
<input
  type="checkbox"
  ...
  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 shadow-xs flex-shrink-0"
/>
```

### 4.3 TaskItem - Priority Indicator (Zeile ~202-219)

```jsx
// ALT:
<button
  ...
  className={`px-1.5 py-0.5 rounded text-sm font-semibold transition-colors ${
    priorityLevel === 0
      ? 'text-neutral-300 hover:text-neutral-500'
      : 'text-neutral-700 hover:text-neutral-900'
  }`}
>

// NEU (Figma: 20px Schrift, stärkerer Kontrast):
<button
  ...
  className={`px-1.5 py-0.5 rounded text-xl font-semibold transition-colors ${
    priorityLevel === 0
      ? 'text-neutral-200 hover:text-neutral-400'
      : 'text-neutral-900 hover:text-neutral-950'
  }`}
>
```

### 4.4 TaskList - "Neue Aufgabe" Button (Zeile ~361)

```jsx
// ALT:
<button
  ...
  className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-50"
>

// NEU (gap-1.5 → gap-2 für Figma-konform 8px):
<button
  ...
  className="flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-50"
>
```

### 4.5 ThemeListThemaRow - Aufgaben Checkbox (Zeile ~779-787)

```jsx
// ALT:
<input
  type="checkbox"
  ...
  className={`h-4 w-4 rounded border-neutral-300 focus:ring-neutral-500 ${
    isScheduled ? 'text-neutral-400' : 'text-neutral-900'
  }`}
/>

// NEU (shadow-xs hinzufügen):
<input
  type="checkbox"
  ...
  className={`h-4 w-4 rounded border-neutral-300 focus:ring-neutral-500 shadow-xs ${
    isScheduled ? 'text-neutral-400' : 'text-neutral-900'
  }`}
/>
```

### 4.6 ThemeListThemaRow - Priority Indicator (Zeile ~831-848)

```jsx
// ALT:
<button
  ...
  className={`px-1 py-0.5 rounded text-xs font-semibold transition-colors ${
    (aufgabe.priority || 'none') === 'none'
      ? 'text-neutral-300 hover:text-neutral-500 opacity-0 group-hover:opacity-100'
      : 'text-neutral-700 hover:text-neutral-900'
  }`}
>

// NEU (text-xl wie in Figma):
<button
  ...
  className={`px-1 py-0.5 rounded text-xl font-semibold transition-colors ${
    (aufgabe.priority || 'none') === 'none'
      ? 'text-neutral-200 hover:text-neutral-400 opacity-0 group-hover:opacity-100'
      : 'text-neutral-900 hover:text-neutral-950'
  }`}
>
```

---

## 5. Visuelle Vergleichstabelle

| Element | Vorher | Nachher |
|---------|--------|---------|
| Task-Items Abstand | 8px (`gap-2`) | 10px (`gap-2.5`) |
| Checkbox | Ohne Shadow | Mit `shadow-xs` |
| Priority "!" Größe | 14px (`text-sm`/`text-xs`) | 20px (`text-xl`) |
| Priority Active | `text-neutral-700` | `text-neutral-900` |
| Priority Inactive | `text-neutral-300` | `text-neutral-200` |
| Priority Hover | `hover:text-neutral-900` | `hover:text-neutral-950` |
| Neue Aufgabe Gap | 6px (`gap-1.5`) | 8px (`gap-2`) |

---

## 6. Beizubehaltende Funktionen (Touch NOT)

```jsx
// DIESE LOGIK BLEIBT KOMPLETT UNVERÄNDERT:

// NoTopicsView (Zeile 1364-1598)
✅ viewMode Toggle: 'todos' | 'themenliste' | 'blocks'
✅ ThemeList Dropdown-Auswahl
✅ isThemeListCollapsed State
✅ onArchiveThemeList Callback

// ThemeListView (Zeile 897-970)
✅ Hierarchie: URG → Kapitel → Themen → Aufgaben
✅ expandedUnterrechtsgebietId, expandedKapitelId, expandedThemaId States
✅ Progress-Berechnung pro Ebene
✅ chapterLevelEnabled Option

// TaskItem (Zeile 101-231)
✅ Drag & Drop (handleDragStart, handleDragEnd)
✅ Priority Cycling (none → medium → high → none)
✅ Inline Edit Mode
✅ hasDescription Conditional Styling

// ThemeListThemaRow (Zeile 558-890)
✅ scheduledInBlock Handling (grayed out, nicht draggable)
✅ Thema-Level Drag (T5.4)
✅ canDragThema Check
✅ onToggleThemaCompleted (T5.1)

// ExamModeView (Zeile 1604-1705)
✅ Lernplan/To-Dos Toggle
✅ TopicBlock Accordion

// BlocksListView (Zeile 1144-1358)
✅ FR2: Blöcke-Ansicht mit expandierbaren Tasks
```

---

## 7. Akzeptanzkriterien

### 7.1 Styling-Änderungen
- [ ] Task-Items haben `gap-2.5` (10px) statt `gap-2`
- [ ] Alle Checkboxen haben `shadow-xs` (Edit Mode + Normal Mode + ThemaRow)
- [ ] Priority "!" ist `text-xl` (20px) statt `text-sm`/`text-xs`
- [ ] Priority Active ist `text-neutral-900`
- [ ] Priority Inactive ist `text-neutral-200`
- [ ] Priority Hover ist `hover:text-neutral-950`
- [ ] "Neue Aufgabe" Button hat `gap-2` statt `gap-1.5`
- [ ] `neutral-950` ist in `tailwind.config.js` definiert

### 7.2 Funktions-Erhalt
- [ ] **ALLE bestehenden Funktionen arbeiten unverändert**
- [ ] Drag & Drop funktioniert weiterhin
- [ ] ThemeList Hierarchie funktioniert weiterhin
- [ ] Toggle (To-Dos/Themen/Blöcke) funktioniert weiterhin
- [ ] Double-Click Edit funktioniert weiterhin

---

## 8. Test-Checkliste (nach Änderungen)

### 8.1 To-Dos View
- [ ] Aufgaben werden korrekt angezeigt
- [ ] Checkbox-Toggle funktioniert
- [ ] Priority-Click cycled korrekt
- [ ] Drag zu Zeitplan funktioniert
- [ ] "Neue Aufgabe" Button funktioniert
- [ ] Double-Click Edit funktioniert

### 8.2 Themenliste View
- [ ] Dropdown-Auswahl funktioniert
- [ ] URG → Themen Hierarchie expandiert korrekt
- [ ] Aufgaben in Themen werden angezeigt
- [ ] Priority-Toggle in Themen funktioniert
- [ ] Archiv-Button funktioniert

### 8.3 Blöcke View (FR2)
- [ ] Tages-Blöcke werden angezeigt
- [ ] Block-Expand zeigt Tasks
- [ ] Task-Toggle in Blöcken funktioniert

---

## 9. Hinweise zur Figma-Abweichung

### Funktionen in App, die NICHT in Figma sind:
Diese wurden bewusst hinzugefügt und bleiben erhalten:

| App-Feature | Grund für Beibehaltung |
|-------------|----------------------|
| To-Dos/Themen/Blöcke Toggle | Feature-Erweiterung (FR2) |
| ThemeList Hierarchie | Komplexe Lernstruktur |
| Drag & Drop zur Zeitplan | Workflow-Optimierung |
| Double-Click Edit | UX-Verbesserung |
| Archive ThemeList | Aufräum-Funktion |
| scheduledInBlock Graying | Visuelles Feedback |

### Design in Figma, das NICHT implementiert wird:

| Figma-Element | Grund für Nicht-Implementierung |
|---------------|--------------------------------|
| Custom Scrollbar | Browser-Standard reicht |
| "Einklappen" Button-Text | App hat Icon-only |

---

## 10. Abhängigkeiten

| Abhängigkeit | Status | Auswirkung |
|--------------|--------|------------|
| `shadow-xs` | ✅ Definiert | `tailwind.config.js` Zeile 103 |
| `gap-2.5` | ✅ Verfügbar | Tailwind Standard (10px) |
| `gap-2` | ✅ Verfügbar | Tailwind Standard (8px) |
| `text-xl` | ✅ Verfügbar | Tailwind Standard (20px) |
| `text-neutral-950` | ✅ Definiert | `tailwind.config.js` Zeile 45 (#0A0A0A) |

**Hinweis:** `#0A0A0A` (neutral-950) entspricht dem Figma-Wert für stärksten Kontrast und ist bereits in tailwind.config.js definiert.

---

## 11. Risiken

| Risiko | Mitigation |
|--------|------------|
| Priority "!" zu groß | Kann auf `text-lg` (18px) reduziert werden |
| Checkbox-Shadow zu subtil | shadow-xs ist sehr dezent, sollte OK sein |
| Funktions-Regression | Umfangreiche Test-Checkliste durchführen |

---

## 12. Korrektur zum alten Ticket

Das ursprüngliche Ticket war **falsch fokussiert**:

> ❌ "Timer-Integration zu dominant"

**Korrektur:** Das LernblockWidget hat **keinen Timer**. Der Timer ist im:
- `DashboardSubHeader` (Timer-Widget)
- `ZeitplanWidget` (Timeline)

Das LernblockWidget zeigt nur Tasks und Themenlisten - kein Timer-UI.
