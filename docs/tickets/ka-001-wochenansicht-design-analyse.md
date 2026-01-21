# KA-001: Wochenansicht Design-Analyse

**Ticket-ID:** KA-001
**Typ:** Design-Anpassung
**Status:** Offen
**Figma-Referenz:** [Node 2196:1528 - Wochenplan_Examensmodus](https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2136-3140)
**Betroffene Dateien:**
- `src/features/calendar/components/week-view.jsx`
- `src/features/calendar/components/week-view-header.jsx`
- `src/features/calendar/components/week-grid.jsx`

---

## 1. Zusammenfassung

Die aktuelle Implementierung der Wochenansicht weicht in mehreren visuellen Aspekten von der Figma-Vorlage ab. Dieses Dokument analysiert die Unterschiede und bietet einen Implementierungsplan, um das Design anzugleichen - **ohne funktionale Änderungen**.

---

## 1.1 KRITISCH: Header-Body Alignment Bug

**Problem:** Die Wochentags-Header und die Zeitspalten im Body sind nicht korrekt ausgerichtet und verrutschen.

**Ursache:**
```
HEADER (table-basiert):
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│  w-14    │  auto    │  auto    │  auto    │  auto    │  auto    │  auto    │  auto    │ + pr-[17px]
│ (56px)   │ (table-fixed verteilt gleichmäßig)                                         │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

BODY (flex-basiert):
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│  w-14    │  flex-1  │  flex-1  │  flex-1  │  flex-1  │  flex-1  │  flex-1  │  flex-1  │ + scrollbar
│ (56px)   │ (flex verteilt anders als table!)                                          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Konkrete Probleme:**
1. `pr-[17px]` ist hardcoded - Scrollbar-Breite variiert je nach Browser/OS (Windows ~17px, macOS ~0-15px)
2. `table-fixed` verteilt Spaltenbreiten anders als `flex-1`
3. Header verwendet `<table>`, Body verwendet `<div className="flex">`

**Lösung:** ✅ **IMPLEMENTIERT** - Sticky Header Pattern

Die Lösung wurde implementiert:
- Header und Body sind jetzt in einem einzigen Scroll-Container
- Header hat `sticky top-0 z-20` für festes Positionieren
- `pr-[17px]` Hack wurde entfernt
- Beide verwenden dasselbe CSS Grid Template

---

## 2. Figma Design-Spezifikation (mit Tailwind-Klassen)

> **Hinweis:** Alle Werte sind auf die `tailwind.config.js` Design Tokens gemappt.

### 2.1 Container (Wochenplan_Examensmodus)
```
Figma:                          Tailwind:
─────────────────────────────────────────────────────
Border: 1px solid #e5e5e5   →   border border-neutral-200
Border-Radius: 5px          →   rounded-[5px]
Background: white           →   bg-white
Overflow: clip              →   overflow-clip
```

### 2.2 Header (Container_Header)
```
Layout:                     →   flex items-center justify-between
Padding: px-20px pb-15px    →   px-5 pb-[15px] pt-0

Titel "Kalenderwoche 12":
─────────────────────────────────────────────────────
Font-Size: 14px             →   text-sm
Font-Weight: 500            →   font-medium
Color: #0a0a0a              →   text-neutral-950

Button "Infos" / "Heute":
─────────────────────────────────────────────────────
Border: 1px solid #e5e5e5   →   border border-neutral-200
Border-Radius: 28px         →   rounded-full
Padding: px-20px py-10px    →   px-5 py-2.5
Font-Weight: 300            →   font-light
Font-Size: 14px             →   text-sm
Icon-Size: 16x16px          →   size-4 (w-4 h-4)
Gap Text-Icon: 8px          →   gap-2

Navigation Chevrons (< >):
─────────────────────────────────────────────────────
Border: 1px solid #e5e5e5   →   border border-neutral-200
Border-Radius: 28px         →   rounded-full
Padding: 10px               →   p-2.5
Icon-Size: 16x16px          →   size-4
Gap zwischen Buttons: 8px   →   gap-2
```

### 2.3 Tages-Header (Kalender_Days_Container)
```
Layout:                     →   flex items-center
Height: 58px                →   h-[58px]

Jede Tages-Zelle:
─────────────────────────────────────────────────────
Border-Right: #e5e5e5       →   border-r border-neutral-200 last:border-r-0
Padding-Left: 20px          →   pl-5
Padding-Y: 8px              →   py-2
Gap Tag/Datum: 2px          →   gap-0.5

Tagename (Montag, etc.):
─────────────────────────────────────────────────────
Font-Size: 14px             →   text-sm
Font-Weight: 500            →   font-medium
Color: #0a0a0a              →   text-neutral-950

Datum (13. Mai, etc.):
─────────────────────────────────────────────────────
Font-Size: 14px             →   text-sm
Font-Weight: 400            →   font-normal
Color: #737373              →   text-neutral-500

Heute-Indikator:
─────────────────────────────────────────────────────
Size: 7x7px                 →   w-[7px] h-[7px]
Color: #3b82f6              →   bg-blue-500
Shape: circle               →   rounded-full
Gap to text: 10px           →   mr-2.5
```

### 2.4 Seitliche Zeit-Spalte (Side_Column)
```
Width: 30px                 →   w-[30px]  (aktuell w-14 = 56px!)
Background: transparent     →   bg-transparent

Zeit-Labels:
─────────────────────────────────────────────────────
Font-Size: 12px             →   text-xs
Font-Weight: 300            →   font-light
Color: #a3a3a3              →   text-neutral-400
Text-Align: right           →   text-right
Format: "8" nicht "08:00"   →   {hour} statt {hour.toString().padStart(2,'0')}:00
```

### 2.5 Lernblock-Karten
```
Zellen-Container:
─────────────────────────────────────────────────────
Border-Top: #e5e5e5         →   border-t border-neutral-200
Border-Right: #e5e5e5       →   border-r border-neutral-200
Padding: px-5px py-10px     →   px-1.25 py-2.5
Min-Height: 74px            →   min-h-[74px]

Block-Karte:
─────────────────────────────────────────────────────
Border: 1px solid #e5e5e5   →   border border-neutral-200
Border-Radius: 5px          →   rounded-[5px]
Padding: 10px               →   p-2.5
Background: white           →   bg-white
Gap Tags/Titel: 10px        →   gap-2.5

Tags (Lernblocktyp/Lernblockfach):
─────────────────────────────────────────────────────
Background: #171717         →   bg-neutral-900
Text-Color: #fafafa         →   text-neutral-50
Border-Radius: 8px          →   rounded-md
Padding: px-8px py-2px      →   px-2 py-0.5
Font-Size: 12px             →   text-xs
Font-Weight: 600            →   font-semibold

Block-Titel:
─────────────────────────────────────────────────────
Font-Size: 14px             →   text-sm
Font-Weight: 300            →   font-light
Color: #0a0a0a              →   text-neutral-950
```

### 2.6 Multi-Day Events / Private Zeile
```
Height: 69px                →   h-[69px]
Border-Top: #e5e5e5         →   border-t border-neutral-200
```

### 2.7 Design Token Mapping (tailwind.config.js)
```
Figma Variable              →   Tailwind Class
─────────────────────────────────────────────────────
#e5e5e5 (border)            →   neutral-200 ✓
#a3a3a3 (muted/ring)        →   neutral-400 ✓
#737373 (muted-foreground)  →   neutral-500 ✓
#0a0a0a (foreground)        →   neutral-950 ✓
#171717 (primary dark)      →   neutral-900 ✓
#fafafa (primary-fg)        →   neutral-50 ✓
#3b82f6 (blue indicator)    →   blue-500 (Standard Tailwind)
DM Sans                     →   font-sans ✓
```

---

## 3. Aktuelle Implementierung - Analyse

### 3.1 week-view-header.jsx
**Aktueller Stand:**
- Titel: `text-sm font-medium` ✓
- Button "Heute": vorhanden, aber unterschiedliches Styling
- **Fehlt:** "Infos" Button mit BarChart2-Icon
- Navigation: `variant="icon"` - Styling prüfen

**Probleme:**
1. ~~Fehlender "Infos" Button~~ → ❌ NICHT implementieren (aus Plan entfernt)
2. Button-Styling: `variant="default"` statt pill-shaped mit border
3. "Heute"-Button Icon ist CalendarIcon statt Undo2-Icon

### 3.2 week-grid.jsx
**Aktueller Stand:**

**Tages-Header:**
- `h-16` (64px) vs Figma 58px
- Tag: `text-sm font-semibold` statt `font-medium`
- Datum: `text-xs font-medium` statt `text-sm font-normal`
- Datumsformat: "13. Dez" statt "13. Mai" (Format korrekt, nur Beispielmonat)
- Heute-Indikator: Hintergrund-Highlight statt blauer Punkt

**Zeit-Labels:**
- Format: "08:00" statt "8"
- Width: `w-14` (56px) statt 30px
- Styling: `text-sm text-neutral-400` statt `text-xs text-[#a3a3a3] font-light`

**Session-Karten:**
- Komplexe Farbcodierung pro Session-Typ
- NEU: Grau (Standard) oder Rechtsgebiet-Farbe aus Einstellungen
- Zeit in Session: ✅ Beibehalten
- Aufgaben: ❌ Entfernen (nur im Dialog sichtbar)
- Aktuell: Rounded-[5px] ✓
- Aktuell: Shadow und Hover-Effekte vorhanden

**Grid-Struktur:**
- Verwendet `<table>` für Header, `<div>` für Body
- Figma: Alles Flex-basiert

---

## 4. Detaillierte Unterschiede

| Element | Figma | Aktuell | Priorität |
|---------|-------|---------|-----------|
| **Header** |
| ~~Infos-Button~~ | ~~Vorhanden mit BarChart-Icon~~ | ~~Fehlt~~ | ❌ Entfernt |
| Heute-Button Icon | Undo2-Icon | CalendarIcon | Mittel |
| Button-Styling | Pill (rounded-[28px]), border | Standard Button | Hoch |
| **Tages-Header** |
| Höhe | 58px | 64px (h-16) | Mittel |
| Tag Font-Weight | medium (500) | semibold (600) | Mittel |
| Datum Font-Weight | normal (400) | medium (500) | Mittel |
| Datum Font-Size | 14px | 12px (text-xs) | Mittel |
| Heute-Indikator | Blauer Punkt vor Text | Hintergrund-Highlight | Hoch |
| **Zeit-Spalte** |
| Breite | 30px | 56px (w-14) | Mittel |
| Format | "8", "9", "10" | "08:00", "09:00" | Mittel |
| Font | text-xs light #a3a3a3 | text-sm normal #a3a3a3 | Niedrig |
| **Session-Karten** |
| Background | Grau (Standard) oder Rechtsgebiet-Farbe | Farbcodiert per Typ | Hoch |
| Tags | Dunkle Badges (bg-[#171717]) | Keine dunklen Badges | Hoch |
| Zeit-Anzeige | ✅ Beibehalten | Im Widget angezeigt | - |
| Aufgaben | ❌ Nur im Dialog | Im Widget angezeigt | Hoch |
| **Container** |
| Border-Radius | 5px | Vorhanden ✓ | - |
| Border | 1px #e5e5e5 | Vorhanden ✓ | - |

---

## 5. Implementierungsplan

### Phase 0: Layout-Alignment Fix (KRITISCH) - week-grid.jsx

**Ziel:** Header und Body verwenden dasselbe Layout-System für perfekte Ausrichtung.

**Option A: CSS Grid (Empfohlen)**
```jsx
// Container mit CSS Grid - garantiert identische Spaltenbreiten
<div className="grid" style={{ gridTemplateColumns: '30px repeat(7, 1fr)' }}>
  {/* Header Row */}
  <div className="contents"> {/* contents = kein eigenes Grid-Element */}
    <div className="..." /> {/* Zeit-Spalte */}
    {WEEK_DAYS.map(...)} {/* 7 Tages-Spalten */}
  </div>
</div>

// Scrollable Body mit identischem Grid
<div className="overflow-y-auto">
  <div className="grid" style={{ gridTemplateColumns: '30px repeat(7, 1fr)' }}>
    ...
  </div>
</div>
```

**Option B: Einheitliches Flex-Layout**
```jsx
// Header als Flex (kein Table mehr)
<div className="flex">
  <div className="w-[30px] flex-shrink-0" /> {/* Zeit-Spalte Header */}
  {WEEK_DAYS.map((day) => (
    <div className="flex-1 min-w-0" key={day}>...</div>
  ))}
</div>

// Body bleibt Flex
<div className="flex-1 overflow-y-auto">
  <div className="flex">
    <div className="w-[30px] flex-shrink-0">...</div>
    {weekDates.map(() => (
      <div className="flex-1 min-w-0">...</div>
    ))}
  </div>
</div>
```

**Option C: Scrollbar-Width CSS Variable (Quick Fix)**
```jsx
// Dynamische Scrollbar-Breite ermitteln
const [scrollbarWidth, setScrollbarWidth] = useState(0);
useEffect(() => {
  const outer = document.createElement('div');
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);
  const width = outer.offsetWidth - outer.clientWidth;
  document.body.removeChild(outer);
  setScrollbarWidth(width);
}, []);

// Header mit dynamischem Padding
<div style={{ paddingRight: `${scrollbarWidth}px` }}>
```

**Empfehlung:** Option A (CSS Grid) ist am robustesten und entspricht auch der Figma-Struktur besser.

---

### Phase 1: Header-Anpassungen (week-view-header.jsx)

**1.1 Button-Styling aktualisieren (Tailwind-Config konform)**
```jsx
// Vorher
<Button variant="default" size="sm">

// Nachher - Pill-shaped mit Border (nutzt Design Tokens)
<button className="flex items-center gap-2 px-5 py-2.5 border border-neutral-200 rounded-full text-sm font-light text-neutral-950 hover:bg-neutral-100 transition-colors">
  {/* neutral-100 = #F5F5F5 aus tailwind.config.js */}
```

**~~1.2 Infos-Button hinzufügen~~ - ENTFERNT**
> ❌ Dieser Punkt wurde aus dem Implementierungsplan entfernt.

**1.2 Heute-Button Icon ändern**
```jsx
import { Undo2 } from 'lucide-react';

<button className="flex items-center gap-2 px-5 py-2.5 border border-neutral-200 rounded-full text-sm font-light text-neutral-950 hover:bg-neutral-100 transition-colors">
  <span>Heute</span>
  <Undo2 className="w-4 h-4" />
</button>
```

**1.3 Navigation Buttons anpassen**
```jsx
<button className="p-2.5 border border-neutral-200 rounded-full hover:bg-neutral-100 transition-colors">
  <ChevronLeft className="w-4 h-4 text-neutral-950" />
</button>
```

### Phase 2: Tages-Header (week-grid.jsx)

**2.1 Header-Höhe und Styling (Tailwind-Config konform)**
```jsx
// Höhe: 58px (Figma) statt h-16 (64px)
<div className="h-[58px] border-r border-neutral-200 last:border-r-0 pl-5 py-2 flex flex-col gap-0.5 justify-center">

  {/* Tag-Name: text-sm font-medium text-neutral-950 */}
  <span className="text-sm font-medium text-neutral-950">
    {day}
  </span>

  {/* Datum: text-sm font-normal text-neutral-500 (#737373) */}
  <span className="text-sm font-normal text-neutral-500">
    {formatDateDisplay(date)}
  </span>
</div>
```

**2.2 Heute-Indikator (Blauer Punkt statt Hintergrund)**
```jsx
// Vorher: bg-primary-100/50 auf der Zelle
// Nachher: Blauer Punkt (7x7px) vor dem Tagesnamen

<div className="flex items-center gap-2.5">
  {isToday(date) && (
    <span className="w-[7px] h-[7px] rounded-full bg-blue-500 flex-shrink-0" />
  )}
  <span className="text-sm font-medium text-neutral-950">
    {day}
  </span>
</div>
```

### Phase 3: Zeit-Spalte (week-grid.jsx)

**3.1 Breite und Format (Tailwind-Config konform)**
```jsx
// Spaltenbreite: 30px (Figma) statt w-14 (56px)
<div className="w-[30px] flex-shrink-0 border-r border-neutral-200">

  {/* Zeit-Label: text-xs font-light text-neutral-400 (#a3a3a3) */}
  <div className="text-right pr-1 text-xs font-light text-neutral-400">
    {hour} {/* Nur "8", "9", "10" - NICHT "08:00" */}
  </div>
</div>
```

### Phase 4: Session-Karten (week-grid.jsx)

> **WICHTIG:** In der Wochenansicht werden Sessions angezeigt, KEINE Blocks!

**4.1 Session-Farblogik (NEU)**
```jsx
// Farblogik für Session-Karten:
// 1. Kein Rechtsgebiet → Grau (neutral-200 border, neutral-50 bg)
// 2. Mit Rechtsgebiet → Farbe aus user_settings.subject_colors

const getSessionColor = (session, subjectColors) => {
  if (!session.rechtsgebiet) {
    // Standard: Grau
    return {
      background: 'bg-neutral-50',
      border: 'border-neutral-300',
      text: 'text-neutral-700'
    };
  }

  // Rechtsgebiet-Farbe aus Einstellungen
  const color = subjectColors?.[session.rechtsgebiet];
  if (color) {
    return {
      background: `bg-[${color}]/10`,
      border: `border-[${color}]`,
      text: 'text-neutral-950'
    };
  }

  // Fallback: Grau
  return { background: 'bg-neutral-50', border: 'border-neutral-300', text: 'text-neutral-700' };
};
```

**4.2 Session-Karten Styling (Tailwind-Config konform)**
```jsx
// Zellen-Container
<div className="px-1.25 py-2.5 min-h-[74px] border-t border-r border-neutral-200">

  {/* Session-Karte - Farbe dynamisch basierend auf Rechtsgebiet */}
  <div className={cn(
    "rounded-[5px] p-2.5 flex flex-col gap-2.5 border",
    getSessionColor(session, subjectColors)
  )}>

    {/* Tags Container */}
    <div className="flex flex-col gap-2.25">
      {session.rechtsgebiet && (
        <span className="inline-flex self-start px-2 py-0.5 bg-neutral-900 text-neutral-50 text-xs font-semibold rounded-md">
          {session.rechtsgebietLabel || session.rechtsgebiet}
        </span>
      )}
      {session.kind && (
        <span className="inline-flex self-start px-2 py-0.5 bg-neutral-900 text-neutral-50 text-xs font-semibold rounded-md">
          {SESSION_TYPE_NAMES[session.kind]}
        </span>
      )}
    </div>

    {/* Zeit-Anzeige: BEIBEHALTEN */}
    <p className="text-xs text-neutral-500">
      {formatTime(session.start_at)} - {formatTime(session.end_at)}
    </p>

    {/* Titel: text-sm font-light text-neutral-950 */}
    <p className="text-sm font-light text-neutral-950">
      {session.title}
    </p>

    {/* ❌ AUFGABEN ENTFERNT - nur im Dialog sichtbar */}
  </div>
</div>
```

**4.3 Aufgaben-Anzeige (ENTFERNT)**
> ❌ Aufgaben werden **NICHT** mehr im Session-Widget angezeigt.
> Aufgaben sind nur sichtbar, wenn der Session-Dialog geöffnet wird.

### Phase 5: Feinabstimmung

**5.1 Grid-Linien (Tailwind-Config konform)**
```jsx
// Zellen-Borders: neutral-200 = #E5E5E5
className="border-t border-r border-neutral-200"

// Letzte Zelle ohne border-right
className="border-t border-neutral-200 last:border-r-0"
```

**5.2 Container-Styling**
```jsx
// Äußerer Container: rounded-[5px] (Figma) statt rounded-lg (10px)
<div className="rounded-[5px] border border-neutral-200 bg-white overflow-clip">
```

### Tailwind-Klassen Referenz (aus tailwind.config.js)

| Verwendung | Tailwind-Klasse | Wert |
|------------|-----------------|------|
| Border | `border-neutral-200` | #E5E5E5 |
| Muted Text | `text-neutral-400` | #A3A3A3 |
| Secondary Text | `text-neutral-500` | #737373 |
| Primary Text | `text-neutral-950` | #0A0A0A |
| Dark Background | `bg-neutral-900` | #171717 |
| Light Text | `text-neutral-50` | #FAFAFA |
| Hover Background | `bg-neutral-100` | #F5F5F5 |
| Today Indicator | `bg-blue-500` | #3B82F6 |
| Font Light | `font-light` | 300 |
| Font Normal | `font-normal` | 400 |
| Font Medium | `font-medium` | 500 |
| Font Semibold | `font-semibold` | 600 |

---

## 6. Nicht-funktionale Änderungen (Bestätigt)

Die folgenden Änderungen sind rein visuell und beeinflussen keine Funktionalität:

1. Button-Styling (Form und Farben)
2. Font-Weights und Font-Sizes
3. Zeit-Label-Format
4. Heute-Indikator-Darstellung
5. Block-Karten-Styling (Farben, Badges)
6. Spaltenbreiten und Höhen

**Funktionalität bleibt unverändert:**
- Klick-Handler
- Drag & Drop
- Navigation (Vor/Zurück/Heute)
- Block-Erstellung und -Bearbeitung
- Multi-Day Events
- Current Time Indicator

---

## 7. Geschätzter Aufwand

| Phase | Beschreibung | Komplexität |
|-------|--------------|-------------|
| **0** | **Layout-Alignment Fix (KRITISCH)** | **Mittel-Hoch** |
| 1 | Header-Anpassungen | Niedrig |
| 2 | Tages-Header | Niedrig |
| 3 | Zeit-Spalte | Niedrig |
| 4 | Block-Karten | Mittel |
| 5 | Feinabstimmung | Niedrig |

**Gesamtaufwand:** Mittel

**Empfohlene Reihenfolge:**
1. Zuerst Phase 0 (Layout-Fix) - behebt das Verrutschen
2. Dann die visuellen Anpassungen (Phase 1-5)

---

## 8. Geklärte Fragen

| Frage | Entscheidung |
|-------|--------------|
| **Infos-Button** | ❌ **NICHT implementieren** - aus Plan entfernt |
| **Zeit in Session** | ✅ **Beibehalten** - Zeit-Anzeige bleibt sichtbar |
| **Session-Farben** | ✅ **Dynamisch:** Grau (Standard) oder Rechtsgebiet-Farbe aus Einstellungen |
| **Aufgaben im Widget** | ❌ **Entfernen** - nur im Dialog-Fenster sichtbar |

---

## 9. Wichtige Terminologie

> **ACHTUNG:** In der Wochenansicht werden **Sessions** angezeigt, KEINE Blocks!

| Ansicht | Entity | Felder |
|---------|--------|--------|
| **Monatsansicht** | BlockAllocation | `date`, `kind`, `size (1-4)` |
| **Wochenansicht** | Session | `start_at`, `end_at`, `kind`, `rechtsgebiet` |

Die Session-Karten in der Wochenansicht zeigen Zeiträume an, keine Block-Kapazitäten.

---

## 10. Referenzen

- **Figma Node:** 2196:1528 (Wochenplan_Examensmodus)
- **Figma File:** vVbrqavbI9IKnC1KInXg3H
- **Design Tokens:** DM Sans Font Family, Neutral/Primary Color Palette
