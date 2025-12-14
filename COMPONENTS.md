# PrepWell WebApp - Component Documentation

## Übersicht

Diese Dokumentation beschreibt die React-Komponenten, die aus dem Figma-Design "PrepWell WebApp - Kalender_Examensmodus" generiert wurden.

## Design Tokens

Alle Design-Tokens (Farben, Schriftarten, Abstände) wurden aus Figma extrahiert und in folgenden Dateien definiert:

- **[src/design-tokens.js](src/design-tokens.js)** - JavaScript Design Tokens Export
- **[tailwind.config.js](tailwind.config.js)** - Tailwind CSS Konfiguration

### Farben

```javascript
// Primärfarben (Pink/Red variants)
primary: {
  50: '#FFE7E7',
  100: '#FFD7D7',
  200: '#FFCECE',
  300: '#FFC3C3',
  400: '#FFC4C4',
}

// Grautöne
gray: {
  50: '#F5F5F5',
  100: '#EFEFEF',
  200: '#E5E5E5',
  400: '#9CA3AF',
  500: '#737373',
  600: '#777777',
  900: '#171717',
  950: '#0A0A0A',
}

// Blautöne
blue: {
  50: '#DBEAFE',
  100: '#EBEAFF',
  900: '#1E3A8A',
}
```

### Schriftart

- **Font Family:** DM Sans
- **Gewichte:** 300 (light), 400 (normal), 500 (medium), 600 (semibold)
- **Größen:** xs (12px), sm (14px), base (16px), lg (18px)

### Spacing

Custom Spacing-Werte: 0.5, 1.25, 2.25, 2.75, 3.75, 4.25, 4.5, 7.5, 12.5, 27, 41.25, 50

## Ordnerstruktur

```
src/
├── features/
│   └── calendar/              # Kalender Feature
│       ├── components/        # Kalender-spezifische Komponenten
│       │   ├── calendar-view.jsx
│       │   ├── calendar-header.jsx
│       │   ├── calendar-grid.jsx
│       │   ├── day-tile.jsx
│       │   └── learning-block.jsx
│       ├── hooks/             # Feature-spezifische Hooks
│       ├── utils/             # Feature-spezifische Utils
│       └── calendar-page.jsx  # Hauptseite
│
├── components/
│   ├── ui/                    # Wiederverwendbare UI-Komponenten
│   │   ├── badge.jsx
│   │   ├── button.jsx
│   │   └── icon.jsx
│   │
│   └── layout/                # Layout-Komponenten
│       ├── header.jsx
│       ├── logo.jsx
│       ├── navigation.jsx
│       └── profile-icon.jsx
│
├── hooks/                     # Globale Hooks
├── utils/                     # Globale Utilities
├── styles/
│   └── globals.css           # Globale Styles + Tailwind
│
├── design-tokens.js          # Design Tokens Export
└── app.jsx                   # Haupt-App-Komponente
```

## UI Komponenten

### Badge

Anzeige von Tags, Kategorien und Status-Indikatoren.

```jsx
import { Badge } from './components/ui';

<Badge variant="default" size="default">
  Vertragsrecht
</Badge>
```

**Props:**
- `variant`: 'default' | 'primary' | 'outline'
- `size`: 'sm' | 'default'
- `className`: Custom CSS classes

### Button

Button-Komponente mit verschiedenen Varianten.

```jsx
import { Button } from './components/ui';

<Button variant="primary" size="default" onClick={handleClick}>
  Heute
</Button>
```

**Props:**
- `variant`: 'default' | 'primary' | 'ghost' | 'icon'
- `size`: 'sm' | 'default' | 'lg' | 'icon'
- `onClick`: Click Handler
- `disabled`: Boolean
- `type`: 'button' | 'submit' | 'reset'

### Icons

Verschiedene Icon-Komponenten.

```jsx
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from './components/ui';

<ChevronLeftIcon size={16} />
<CalendarIcon size={16} />
```

Verfügbare Icons:
- `ChevronLeftIcon`
- `ChevronRightIcon`
- `CalendarIcon`
- `CheckIcon`
- `ArrowRightIcon`
- `PlusIcon`

## Layout Komponenten

### Header

Haupt-Header mit Logo, Navigation und Profil-Icon.

```jsx
import { Header } from './components/layout';

<Header userInitials="CN" />
```

### Navigation

Navigationsmenü für die Hauptbereiche.

```jsx
import { Navigation } from './components/layout';

<Navigation />
```

### ProfileIcon

Benutzer-Profil-Icon mit Initialen.

```jsx
import { ProfileIcon } from './components/layout';

<ProfileIcon initials="CN" />
```

## Kalender Feature Komponenten

### CalendarView

Haupt-Kalenderansicht für den Examensmodus.

```jsx
import { CalendarView } from './features/calendar/components';

<CalendarView initialDate={new Date(2025, 7, 1)} />
```

**Props:**
- `initialDate`: Initial anzuzeigende Datum (Date object)
- `className`: Custom CSS classes

### CalendarHeader

Kalender-Header mit Monatsanzeige und Navigation.

```jsx
import { CalendarHeader } from './features/calendar/components';

<CalendarHeader
  title="August 2025"
  onPrevMonth={handlePrevMonth}
  onNextMonth={handleNextMonth}
  onToday={handleToday}
/>
```

**Props:**
- `title`: Monat und Jahr String
- `onPrevMonth`: Handler für vorherigen Monat
- `onNextMonth`: Handler für nächsten Monat
- `onToday`: Handler für "Heute" Button

### CalendarGrid

Kalender-Grid mit Wochentagen und Tag-Kacheln.

```jsx
import { CalendarGrid } from './features/calendar/components';

<CalendarGrid
  days={calendarDays}
  currentDay={12}
/>
```

**Props:**
- `days`: Array von Tag-Objekten
- `currentDay`: Aktueller Tag (für Highlighting)

### DayTile

Einzelne Tag-Kachel im Kalender.

```jsx
import { DayTile } from './features/calendar/components';

<DayTile
  day={5}
  learningBlocks={[
    { title: 'Titel', blockType: 'Klausur', progress: '2/3' }
  ]}
  isToday={false}
  isCurrentMonth={true}
/>
```

**Props:**
- `day`: Tag-Nummer (1-31)
- `learningBlocks`: Array von Lernblock-Objekten
- `isToday`: Boolean - ob heute
- `isCurrentMonth`: Boolean - ob aktueller Monat

### LearningBlock

Lernblock innerhalb einer Tag-Kachel.

```jsx
import { LearningBlock } from './features/calendar/components';

<LearningBlock
  title="Tagesthema"
  blockType="Vertragsrecht"
  progress="3/3"
/>
```

**Props:**
- `title`: Block-Titel
- `blockType`: Typ (z.B. "Vertragsrecht", "Klausur", "Wiederholung", "Frei")
- `progress`: Fortschritt (z.B. "1/3", "2/3", "3/3")
- `isAddButton`: Boolean - ob Add-Button
- `isOutOfRange`: Boolean - außerhalb Lernzeitraum

## Datenstruktur

### Learning Block Object

```javascript
{
  title: string,           // "Tagesthema", "Titel", etc.
  blockType: string,       // "Vertragsrecht", "Klausur", "Wiederholung", "Frei"
  progress: string,        // "1/3", "2/3", "3/3"
  isAddButton: boolean,    // true für Add-Button
  isOutOfRange: boolean    // true wenn außerhalb Lernzeitraum
}
```

### Day Object

```javascript
{
  day: number,                    // 1-31
  isCurrentMonth: boolean,        // true wenn aktueller Monat
  learningBlocks: LearningBlock[] // Array von Learning Blocks
}
```

## Verwendung

### Komplette Kalender-Seite

```jsx
import React from 'react';
import CalendarPage from './features/calendar/calendar-page';

function App() {
  return <CalendarPage />;
}
```

### Custom Integration

```jsx
import React from 'react';
import { Header } from './components/layout';
import { CalendarView } from './features/calendar/components';

function MyCustomPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header userInitials="AB" />
      <main className="p-12.5">
        <CalendarView initialDate={new Date()} />
      </main>
    </div>
  );
}
```

## Anpassung

### Farben anpassen

Bearbeiten Sie [tailwind.config.js](tailwind.config.js):

```javascript
colors: {
  primary: {
    50: '#YOUR_COLOR',
    // ...
  }
}
```

### Komponenten erweitern

Alle Komponenten akzeptieren `className` Props für custom Styling:

```jsx
<Button className="your-custom-class">
  Click me
</Button>
```

## Nächste Schritte

1. **Backend-Integration:** Ersetzen Sie die Sample-Daten in `calendar-view.jsx` mit echten API-Aufrufen
2. **Weitere Seiten:** Nutzen Sie die gleiche Struktur für die anderen 6 Seiten
3. **State Management:** Implementieren Sie Redux/Zustand für globalen State
4. **Routing:** Fügen Sie React Router für Navigation hinzu
5. **Authentifizierung:** Implementieren Sie die Auth-Feature

## Support

Bei Fragen zur Komponentenstruktur oder Verwendung, siehe:
- Design Tokens: [src/design-tokens.js](src/design-tokens.js)
- Tailwind Config: [tailwind.config.js](tailwind.config.js)
- Figma Design: [PrepWell WebApp - Kalender_Examensmodus](https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2405-6508)
