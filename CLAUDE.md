# PrepWell Frontend - Projektkontext

## Projektdokumentation

Vor Änderungen am Projekt bitte [PRD.md](PRD.md) lesen für vollständige Details zu:
- Produktübersicht und Vision
- Funktionale Anforderungen
- Design System und UI-Komponenten
- API-Spezifikation
- Implementierungsstatus

---

## Kurzübersicht

**PrepWell** ist eine Lernmanagement-App für Jurastudierende zur Vorbereitung auf das deutsche Staatsexamen.

### Tech Stack
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Zod (Validierung)
- LocalStorage (Persistenz)

### Architektur: Content-Slot-Block Modell

```
Zeitliche Hierarchie: Lernplan → Monat → Woche → Tag → Position (1-4)

Position 1 ─┐
Position 2 ─┼─► CONTENT (1:n) ─┬─► SLOT (Monat)
Position 3 ─┘                  └─► BLOCK (Woche/Tag)
```

- **CONTENT**: Zeitlose Lerninhalte (Fach → Kapitel → Themen → Aufgaben)
- **SLOT**: Kompakte Ansicht im Monatskalender
- **BLOCK**: Detaillierte Ansicht im Wochenkalender/Startseite
- **1:n Beziehung**: 1 Content kann mehrere Positionen pro Tag belegen

### State Management

3 React Context Provider:
1. `CalendarProvider` - SSOT für Kalender, Slots, Aufgaben, ContentPlans
2. `TimerProvider` - Timer-Zustand (Pomodoro/Countdown/Countup)
3. `UnterrechtsgebieteProvider` - Rechtsgebiete-Auswahl

### Wichtige Konventionen

- **Sprache**: Deutsche UI-Texte, englischer Code
- **Persistenz**: Alles in LocalStorage (`prepwell_*` Keys)
- **Komponenten**: Funktionale Komponenten mit Hooks
- **Styling**: Tailwind utility classes, Design Tokens in `design-tokens.js`

### Projektstruktur

```
src/
├── pages/           # Seitenkomponenten
├── components/      # UI-Komponenten
├── features/        # Feature-Module (calendar, wizard)
├── contexts/        # React Context
├── hooks/           # Custom Hooks
├── services/        # API-Services
├── data/            # Statische Daten (Rechtsgebiete, Templates)
└── utils/           # Hilfsfunktionen
```

### Inhaltliche Hierarchie

```
Fach → Kapitel → Themen → Aufgaben
```

**Terminologie-Mapping:**
| Im Code | UI-Begriff | Beispiel |
|---------|------------|----------|
| Rechtsgebiet | Fach | Zivilrecht |
| Unterrechtsgebiet | Kapitel | BGB AT, Schuldrecht |

### Fächer (4 Hauptkategorien)

| ID | Name | Farbe |
|----|------|-------|
| `oeffentliches-recht` | Öffentliches Recht | Grün |
| `zivilrecht` | Zivilrecht | Blau |
| `strafrecht` | Strafrecht | Rot |
| `querschnitt` | Querschnittsrecht | Violett |
