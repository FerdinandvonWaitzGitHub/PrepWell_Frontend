# PrepWell Frontend - Projektkontext

## Projektdokumentation

Vor Änderungen am Projekt bitte [PRD.md](PRD.md) lesen - die **Single Source of Truth** mit:
- **Teil 1:** Aktueller Stand (Architektur, Features, Supabase-Integration)
- **Teil 2:** Bugs & Funktionstest-Checkliste
- **Teil 3:** Roadmap (Backend-Migration, Mobile, Premium)

---

## Kurzübersicht

**PrepWell** ist eine Lernmanagement-App für Jurastudierende zur Vorbereitung auf das deutsche Staatsexamen.

### Tech Stack
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Supabase (PostgreSQL + Auth)
- Zod (Validierung)

### Architektur: Content-Slot-Block Modell

```
Zeitliche Hierarchie: Lernplan → Monat → Woche → Tag

Pro Tag: bis zu 4 Slots (08:00-10:00, 10:00-12:00, 14:00-16:00, 16:00-18:00)

CONTENT ─────► SLOT ─────► BLOCK
(Was)         (Wann)       (Wie anzeigen)
```

- **CONTENT**: Zeitlose Lerninhalte (Fach → Kapitel → Themen → Aufgaben)
- **SLOT**: Wann gelernt wird (Datum + Position im Tag)
- **BLOCK**: Visuelle Darstellung im Kalender mit Uhrzeiten
- **1:n Beziehung**: 1 Content kann mehrere Slots belegen

### State Management

10+ React Context Provider (wichtigste):
1. `CalendarProvider` - SSOT für Kalender, Slots, Aufgaben, ContentPlans
2. `TimerProvider` - Timer-Zustand (Pomodoro/Countdown/Countup)
3. `AuthProvider` - Supabase Authentifizierung
4. `AppModeProvider` - Examen vs Normal Modus

### Wichtige Konventionen

- **Sprache**: Deutsche UI-Texte, englischer Code
- **Persistenz**: Supabase (primär) + LocalStorage (Fallback)
- **Komponenten**: Funktionale Komponenten mit Hooks
- **Styling**: Tailwind utility classes, Design Tokens in `tailwind.config.js`

### Projektstruktur

```
src/
├── pages/           # Seitenkomponenten (11)
├── components/      # UI-Komponenten
├── features/        # Feature-Module (calendar, wizard)
├── contexts/        # React Context (10+)
├── hooks/           # Custom Hooks (inkl. use-supabase-sync.js)
├── services/        # API-Services
├── data/            # Statische Daten (Rechtsgebiete, Templates)
└── utils/           # Hilfsfunktionen
```

### Fächer (4 Hauptkategorien)

| ID | Name | Farbe |
|----|------|-------|
| `oeffentliches-recht` | Öffentliches Recht | Grün |
| `zivilrecht` | Zivilrecht | Blau |
| `strafrecht` | Strafrecht | Rot |
| `querschnitt` | Querschnittsrecht | Violett |

### Supabase-Tabellen

| Tabelle | Beschreibung |
|---------|--------------|
| `calendar_slots` | Kalender-Slots |
| `calendar_tasks` | Aufgaben |
| `private_blocks` | Private Termine (mit Serientermine) |
| `content_plans` | Lernpläne & Themenlisten |
| `timer_sessions` | Timer-History |
| `logbuch_entries` | Manuelle Zeiterfassung |
| `checkin_responses` | Check-In Daten |
| `user_settings` | Benutzereinstellungen |

Schema: `supabase/schema.sql` (idempotent)
