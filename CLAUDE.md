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

### Architektur: BlockAllocation vs. Session

**Kernprinzip:** Blöcke und Sessions sind zwei komplett getrennte Entitäten!

| Entity | Ansicht | Felder | NIEMALS |
|--------|---------|--------|---------|
| **BlockAllocation** | Monatsansicht | `date`, `kind`, `size (1-4)` | Uhrzeiten |
| **Session** | Woche/Startseite | `start_at`, `end_at`, `kind` | block_size |

```
┌─────────────────────┐     ┌─────────────────────┐
│   BlockAllocation   │     │      Session        │
│   (Kapazität)       │     │   (Zeiträume)       │
├─────────────────────┤     ├─────────────────────┤
│ Monatsansicht       │     │ Wochenansicht       │
│ date + size (1-4)   │     │ start_at + end_at   │
│ KEINE Uhrzeiten!    │     │ KEINE block_size!   │
└─────────────────────┘     └─────────────────────┘
```

Siehe PRD.md §3.1 für vollständige Spezifikation inkl. Guard Rules und Edge Cases.

### State Management

10+ React Context Provider (wichtigste):
1. `CalendarProvider` - SSOT für Kalender, Blöcke, Aufgaben, ContentPlans
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
| `calendar_blocks` | Kalender-Blöcke (ehem. calendar_slots) |
| `calendar_tasks` | Aufgaben |
| `private_sessions` | Private Sessions (ehem. private_blocks) |
| `time_sessions` | Zeit-Sessions (ehem. time_blocks) |
| `content_plans` | Lernpläne & Themenlisten |
| `timer_sessions` | Timer-History |
| `logbuch_entries` | Manuelle Zeiterfassung |
| `checkin_responses` | Check-In Daten |
| `user_settings` | Benutzereinstellungen |

Schema: `supabase/schema.sql` (idempotent)
