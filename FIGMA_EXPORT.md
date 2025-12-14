# Figma Design Export - PrepWell WebApp

## Übersicht

Dieses Dokument beschreibt den Export des Figma-Designs "PrepWell WebApp - Kalender_Examensmodus" zu React-Komponenten mit Tailwind CSS.

## Exportierte Seite

**Figma URL:** https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2405-6508

**Seitenname:** Kalender_Examensmodus

**Beschreibung:** Kalenderansicht im Examensmodus mit monatlicher Übersicht von Lernblöcken, Klausuren und freien Tagen.

## Extrahierte Design Tokens

### Farben (18 Farben)

**Primärfarben (Pink/Red):**
- `#FFE7E7` - primary-50
- `#FFD7D7` - primary-100
- `#FFCECE` - primary-200
- `#FFC3C3` - primary-300
- `#FFC4C4` - primary-400

**Grautöne:**
- `#F5F5F5` - gray-50
- `#EFEFEF` - gray-100
- `#E5E5E5` - gray-200
- `#9CA3AF` - gray-400
- `#737373` - gray-500
- `#777777` - gray-600
- `#171717` - gray-900
- `#0A0A0A` - gray-950

**Blautöne:**
- `#DBEAFE` - blue-50
- `#EBEAFF` - blue-100
- `#1E3A8A` - blue-900

**Basis:**
- `#FFFFFF` - white
- `#000000` - black

### Schriftarten

**Font Family:** DM Sans

**Verfügbare Gewichte:**
- 300 (Light)
- 400 (Normal)
- 500 (Medium)
- 600 (Semibold)

**Schriftgrößen:**
- 12px (text-xs)
- 14px (text-sm)
- 18px (text-lg)

### Spacing-Werte (18 Werte)

```
2px, 4px, 5px, 8px, 9px, 10px, 11px, 12px,
15px, 16px, 17px, 18px, 20px, 30px, 50px,
108px, 165px, 200px
```

Entsprechende Tailwind-Klassen:
```
0.5, 1, 1.25, 2, 2.25, 2.5, 2.75, 3,
3.75, 4, 4.25, 4.5, 5, 7.5, 12.5,
27, 41.25, 50
```

## Komponenten-Hierarchie

```
Kalender_Examensmodus (Hauptseite)
├── header_start
│   ├── Logo Container
│   │   └── Logo_SVG 1
│   ├── NavigationMenu
│   └── Profile_Icon
│       └── User_Initials (Text: "CN")
│
└── Body_start
    └── Body_elements
        └── Block_rechts
            └── Monatsansicht
                ├── Container_Header
                │   ├── Title_Container (Text: "August 2025")
                │   └── Button_Container
                │       ├── Button (Text: "Heute")
                │       ├── Button (ChevronLeft)
                │       └── Button (ChevronRight)
                │
                └── Wochenplan Body
                    └── Week_Column
                        ├── Kalender_Days_Container
                        │   ├── Montag
                        │   ├── Dienstag
                        │   ├── Mittwoch
                        │   ├── Donnerstag
                        │   ├── Freitag
                        │   ├── Samstag
                        │   └── Sonntag
                        │
                        └── Kalender_Tagesthemen_Container
                            └── Tagesthemen_Row (mehrere Reihen)
                                └── Tag Kachel (7 pro Reihe)
                                    ├── Tag_Kachel_Header
                                    │   └── Datum Tag (1-31)
                                    │
                                    └── Lernblock (0-n pro Tag)
                                        ├── Lernblock Titel
                                        └── Tags Container
                                            ├── Blocktyp Badge
                                            └── Progress Badge
```

## Generierte Komponenten

### UI-Komponenten (Shared)

1. **Badge** (`src/components/ui/badge.jsx`)
   - Variants: default, primary, outline
   - Sizes: sm, default

2. **Button** (`src/components/ui/button.jsx`)
   - Variants: default, primary, ghost, icon
   - Sizes: sm, default, lg, icon

3. **Icons** (`src/components/ui/icon.jsx`)
   - ChevronLeft, ChevronRight
   - Calendar, Check, ArrowRight, Plus

### Layout-Komponenten

1. **Header** (`src/components/layout/header.jsx`)
2. **Logo** (`src/components/layout/logo.jsx`)
3. **Navigation** (`src/components/layout/navigation.jsx`)
4. **ProfileIcon** (`src/components/layout/profile-icon.jsx`)

### Kalender-Feature-Komponenten

1. **CalendarView** (`src/features/calendar/components/calendar-view.jsx`)
   - Haupt-Kalender-Komponente
   - State Management für Monatswechsel
   - Generierung der Kalendertage

2. **CalendarHeader** (`src/features/calendar/components/calendar-header.jsx`)
   - Monatsanzeige (z.B. "August 2025")
   - Navigation (Prev/Next/Today)

3. **CalendarGrid** (`src/features/calendar/components/calendar-grid.jsx`)
   - Wochentagszeile (Mo-So)
   - Grid-Layout für Tage

4. **DayTile** (`src/features/calendar/components/day-tile.jsx`)
   - Tag-Nummer
   - Lernblöcke für den Tag
   - Highlighting für heute

5. **LearningBlock** (`src/features/calendar/components/learning-block.jsx`)
   - Titel des Lernblocks
   - Blocktyp (Vertragsrecht, Klausur, etc.)
   - Fortschrittsanzeige (1/3, 2/3, 3/3)
   - Spezialzustände (Add Button, Außerhalb Lernzeitraum)

## Lernblock-Typen

Basierend auf dem Figma-Design wurden folgende Lernblock-Typen identifiziert:

1. **Vertragsrecht** (Standard-Lernthema)
   - Farbe: primary-50 background
   - Verwendet für reguläre Lernthemen

2. **Klausur**
   - Farbe: blue-50 background
   - Für Prüfungstermine

3. **Wiederholung**
   - Farbe: primary-50 background
   - Für Wiederholungs-Sessions

4. **Frei**
   - Farbe: gray-50 background
   - Für freie Tage

5. **Nicht im Lernzeitraum**
   - Farbe: primary-100 background
   - Für Tage außerhalb des Lernzeitraums

6. **Add Button (+)**
   - Grauer Border-Button
   - Zum Hinzufügen neuer Lernblöcke

## Measurements & Specs

### Kalender-Grid

- **Gesamtbreite:** 1390px
- **Spalten:** 7 (eine pro Wochentag)
- **Spaltenbreite:** ~199px
- **Zeilenhöhe:** Min. 143px (auto-expandierend)

### Tag-Kachel (DayTile)

- **Breite:** 199px
- **Min-Höhe:** 143px
- **Padding:** 8px (p-2)
- **Gap zwischen Lernblöcken:** 10px (gap-2.5)

### Lernblock

- **Breite:** 182px (innerhalb 199px Kachel mit Padding)
- **Padding:** 18px horizontal, 10px vertical (px-4.5 py-2.5)
- **Border Radius:** Rounded (standard Tailwind)
- **Gap zwischen Tags:** 8px (gap-2)

### Header

- **Höhe:** 83px
- **Padding:** 50px horizontal, 20px vertical (px-12.5 py-5)

### Kalender-Header

- **Höhe:** 77px
- **Padding:** 50px horizontal, 30px vertical (px-12.5 py-7.5)

## Tailwind Configuration

Alle Design Tokens wurden in `tailwind.config.js` konfiguriert:

```javascript
extend: {
  colors: { /* Farben */ },
  fontFamily: { /* DM Sans */ },
  fontWeight: { /* 300, 400, 500, 600 */ },
  spacing: { /* Custom Spacing */ },
  boxShadow: { xs: '...' }
}
```

## Verwendete Figma-Text-Styles

Die folgenden Text-Styles wurden identifiziert (Tailwind-Namenskonvention):

- `text-xs/leading-normal/normal`
- `text-xs/leading-normal/medium`
- `text-sm/leading-normal/normal`
- `text-sm/leading-normal/medium`
- `text-2xl/leading-normal/light`
- etc.

Diese entsprechen den Tailwind-Klassen:
- `text-xs font-normal`
- `text-xs font-medium`
- `text-sm font-normal`
- `text-2xl font-light`

## Sample Data Structure

```javascript
// Beispiel Tag-Daten
{
  day: 5,
  isCurrentMonth: true,
  learningBlocks: [
    {
      title: 'Titel',
      blockType: 'Klausur',
      progress: '2/3'
    },
    {
      title: '',
      blockType: 'Wiederholung',
      progress: '1/3'
    }
  ]
}
```

## Nächste Schritte für vollständige Integration

1. **Backend-API Integration**
   - Ersetzen Sie Sample-Daten durch echte API-Calls
   - Implementieren Sie CRUD-Operationen für Lernblöcke

2. **State Management**
   - Redux oder Zustand für globalen State
   - Context API für User-Daten

3. **Weitere Seiten**
   - Nutzen Sie das gleiche Pattern für die restlichen 6 Seiten
   - Verwenden Sie die existierenden UI-Komponenten

4. **Responsive Design**
   - Fügen Sie Mobile-Breakpoints hinzu
   - Tablet-optimierte Layouts

5. **Interaktivität**
   - Drag & Drop für Lernblöcke
   - Modal für Lernblock-Details
   - Editing-Funktionalität

## Dateien

### Konfiguration
- `tailwind.config.js` - Tailwind-Konfiguration mit Design Tokens
- `src/design-tokens.js` - JavaScript Export der Design Tokens

### Extraktion Scripts
- `extract-figma.js` - Basis Figma-Extraktion
- `extract-figma-detailed.js` - Detaillierte Token-Extraktion
- `analyze-components.js` - Komponenten-Hierarchie-Analyse

### Daten-Exports
- `figma-data.json` - Rohdaten vom Figma API
- `figma-design-tokens.json` - Extrahierte Design Tokens und Komponenten

### Styles
- `src/styles/globals.css` - Globale Styles und Tailwind Imports

### Dokumentation
- `COMPONENTS.md` - Komponenten-Dokumentation
- `FIGMA_EXPORT.md` - Dieses Dokument

## Technologie-Stack

- **Framework:** React
- **Styling:** Tailwind CSS
- **Design Source:** Figma
- **Font:** DM Sans (Google Fonts)
- **Icons:** Custom SVG Icons

## Figma-API-Zugriff

Der Export wurde mit dem Figma REST API durchgeführt:
- **File Key:** vVbrqavbI9IKnC1KInXg3H
- **Node ID:** 2405:6508
- **Authentication:** Personal Access Token

## Lizenz & Credits

Design erstellt in Figma für PrepWell WebApp.
Export und Code-Generierung: 2025-12-11
