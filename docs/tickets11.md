# T11: Dashboard Layout Fix - Viewport Height Constraint

## Problem

Wenn die Themenliste auf der Startseite (Dashboard) viele Einträge hat, wird die linke Seite hässlich gerendert und das Scroll-Verhalten ist problematisch:

- Die linke Seite (LernblockWidget) wächst mit dem Inhalt
- Die rechte Seite (ZeitplanWidget) hat bereits eine Viewport-basierte Höhe
- Es entsteht ein Height-Mismatch zwischen beiden Spalten
- Die Seite scrollt insgesamt statt nur der Inhalt innerhalb der Container

### Aktueller Zustand

```
┌─────────────────────────────────────────────────────────────────┐
│ Header (DashboardSubHeader)                                     │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────────────────────┐ │
│ │ LernblockWidget     │ │ ZeitplanWidget                      │ │
│ │ max-h-[730px]       │ │ calc(100vh - 240px)                 │ │
│ │                     │ │                                     │ │
│ │ Themenliste...      │ │ Timeline 00:00 - 24:00              │ │
│ │ - Item 1            │ │                                     │ │
│ │ - Item 2            │ │ ✓ Viewport-basiert                  │ │
│ │ - Item 3            │ │ ✓ Internes Scrolling                │ │
│ │ ...                 │ │                                     │ │
│ │ (Wächst weiter)     │ │                                     │ │
│ │ ✗ Fixed max-height  │ │                                     │ │
│ │ ✗ Kein Match        │ │                                     │ │
│ └─────────────────────┘ └─────────────────────────────────────┘ │
│                                                                 │
│ Footer                                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Ziel-Zustand

```
┌─────────────────────────────────────────────────────────────────┐
│ Header (DashboardSubHeader)                                     │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────────────────────┐ │
│ │ LernblockWidget     │ │ ZeitplanWidget                      │ │
│ │                     │ │                                     │ │
│ │ ┌─────────────────┐ │ │ ┌─────────────────────────────────┐ │ │
│ │ │ Scrollbarer    ↕│ │ │ │ Scrollbarer Bereich           ↕│ │ │
│ │ │ Bereich         │ │ │ │                                 │ │ │
│ │ │ - Thema 1       │ │ │ │ Timeline                        │ │ │
│ │ │ - Thema 2       │ │ │ │                                 │ │ │
│ │ │ - Thema 3       │ │ │ │                                 │ │ │
│ │ │ ...             │ │ │ │                                 │ │ │
│ │ └─────────────────┘ │ │ └─────────────────────────────────┘ │ │
│ │                     │ │                                     │ │
│ │ ✓ Gleiche Höhe      │ │ ✓ Gleiche Höhe                      │ │
│ │ ✓ Internes Scroll   │ │ ✓ Internes Scroll                   │ │
│ └─────────────────────┘ └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Ziel:** Beide Spalten sollen die gleiche Viewport-basierte Höhe haben mit internem Scrolling.

---

## Analyse

### Betroffene Dateien

| Datei | Problem |
|-------|---------|
| `src/components/dashboard/session-widget.jsx` | `max-h-[730px]` - Fixed max-height |
| `src/components/dashboard/zeitplan-widget.jsx` | `calc(100vh - 240px)` - Bereits viewport-basiert |
| `src/components/layout/dashboard-layout.jsx` | Keine Höhen-Constraints |
| `src/pages/dashboard.jsx` | Container-Struktur |

### Aktuelle Werte

**SessionWidget (LernblockWidget)** - Zeile 1470-1471:
```jsx
<div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden ${className}`}>
  <div className="p-5 overflow-y-auto max-h-[730px]">
```

**ZeitplanWidget** - Zeile 318:
```jsx
<div ref={timelineContainerRef} className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
```

**DashboardLayout** - Zeile 11:
```jsx
<div className={`grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5 md:gap-6 ${className}`}>
```

### Höhen-Berechnung

```
Viewport Höhe: 100vh
- DashboardSubHeader: ~120px (Header + Content Info)
- Main Padding Top: 32px (py-8)
- Main Padding Bottom: 32px (py-8)
- Footer: ~50px (mt-8 pt-8 + Text)
= Verfügbare Höhe für Content: calc(100vh - 234px)

Gerundet: calc(100vh - 240px) für beide Spalten
```

---

## Implementierungsplan

### Phase 1: DashboardLayout anpassen

**Datei:** `src/components/layout/dashboard-layout.jsx`

**Änderung:** Höhen-Constraint für beide Spalten hinzufügen

```jsx
const DashboardLayout = ({ leftColumn, rightColumn, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5 md:gap-6 ${className}`}
         style={{ height: 'calc(100vh - 240px)' }}>
      {/* Left Column */}
      <div className="flex flex-col h-full overflow-hidden">
        {leftColumn}
      </div>

      {/* Right Column */}
      <div className="flex flex-col h-full overflow-hidden">
        {rightColumn}
      </div>
    </div>
  );
};
```

### Phase 2: SessionWidget anpassen

**Datei:** `src/components/dashboard/session-widget.jsx`

**Änderung:** Fixed max-height durch flex-basierte Höhe ersetzen

Vorher (Zeile 1470-1471):
```jsx
<div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden ${className}`}>
  <div className="p-5 overflow-y-auto max-h-[730px]">
```

Nachher:
```jsx
<div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden flex flex-col h-full ${className}`}>
  <div className="p-5 overflow-y-auto flex-1 min-h-0">
```

**Wichtig:** `min-h-0` ist erforderlich, damit `flex-1` korrekt mit `overflow-y-auto` funktioniert.

### Phase 3: ZeitplanWidget anpassen

**Datei:** `src/components/dashboard/zeitplan-widget.jsx`

**Änderung:** Inline style durch flex-basierte Höhe ersetzen

Vorher (Zeile 318):
```jsx
<div ref={timelineContainerRef} className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
```

Nachher:
```jsx
<div ref={timelineContainerRef} className="p-4 overflow-y-auto flex-1 min-h-0">
```

Outer Container (Zeile 282):
```jsx
<div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden flex flex-col h-full ${className}`}>
```

### Phase 4: Mobile Responsiveness

Für Mobile (< md) soll das ursprüngliche Verhalten erhalten bleiben:
- Keine fixe Höhe
- Normale Page-Scrolling

```jsx
// dashboard-layout.jsx
<div className={`grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5 md:gap-6 md:h-[calc(100vh-240px)] ${className}`}>
  <div className="flex flex-col md:h-full md:overflow-hidden">
    {leftColumn}
  </div>
  <div className="flex flex-col md:h-full md:overflow-hidden">
    {rightColumn}
  </div>
</div>
```

---

## Zusammenfassung der Änderungen

| Datei | Vorher | Nachher |
|-------|--------|---------|
| `dashboard-layout.jsx` | Keine Höhe | `md:h-[calc(100vh-240px)]` |
| `session-widget.jsx` | `max-h-[730px]` | `flex-1 min-h-0` + `h-full` auf Container |
| `zeitplan-widget.jsx` | `maxHeight: calc(100vh-240px)` | `flex-1 min-h-0` + `h-full` auf Container |

---

## Testfälle

1. **Desktop (>= md breakpoint):**
   - [ ] Beide Spalten haben gleiche Höhe
   - [ ] Linke Spalte scrollt intern bei vielen Themen
   - [ ] Rechte Spalte scrollt intern (Timeline)
   - [ ] Kein Page-Level Scrolling (außer für Footer)
   - [ ] Footer ist sichtbar nach Scroll zum Ende

2. **Mobile (< md breakpoint):**
   - [ ] Spalten untereinander (1-column)
   - [ ] Normales Page-Scrolling
   - [ ] Keine fixe Höhe

3. **Edge Cases:**
   - [ ] Leere Themenliste - Layout bleibt stabil
   - [ ] Viele Themen (20+) - Scrollbar erscheint
   - [ ] Window Resize - Layout passt sich an

---

## Risiken

| Risiko | Mitigation |
|--------|------------|
| Flex-Layout-Bugs in Safari | Testen + ggf. `-webkit-flex` Prefix |
| Height nicht berechnet | `min-h-0` auf flex children |
| Mobile Layout-Bruch | Responsive-Klassen nur ab `md:` |

---

## Referenzen

- [dashboard.jsx](../src/pages/dashboard.jsx) - Main page
- [dashboard-layout.jsx](../src/components/layout/dashboard-layout.jsx) - Grid layout
- [session-widget.jsx](../src/components/dashboard/session-widget.jsx) - Left column
- [zeitplan-widget.jsx](../src/components/dashboard/zeitplan-widget.jsx) - Right column

---

## Implementierung

**Status:** Implementiert

**Datum:** 2026-01-13

**Änderungen:**

1. **dashboard-layout.jsx:**
   - `md:h-[calc(100vh-240px)]` zum Grid-Container hinzugefügt
   - `md:h-full md:overflow-hidden` zu beiden Spalten hinzugefügt

2. **session-widget.jsx:**
   - Outer Container: `flex flex-col h-full` hinzugefügt
   - Inner Container: `max-h-[730px]` ersetzt durch `flex-1 min-h-0`

3. **zeitplan-widget.jsx:**
   - Outer Container: `flex flex-col h-full` hinzugefügt
   - Timeline Container: `style={{ maxHeight: 'calc(100vh - 240px)' }}` ersetzt durch `flex-1 min-h-0`

**Build:** Erfolgreich
