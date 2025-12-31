# Product Requirements Document (PRD)
# PrepWell WebApp

**Version:** 1.7
**Datum:** 31. Dezember 2025
**Status:** MVP Development - Supabase Integration

---

## 1. Produktübersicht

### 1.1 Vision
PrepWell ist eine webbasierte Lernmanagement-Plattform, die Jurastudierenden bei der strukturierten Vorbereitung auf das deutsche Staatsexamen unterstützt. Die App ermöglicht es Nutzern, personalisierte Lernpläne zu erstellen, ihren Lernfortschritt zu verfolgen und ihre Prüfungsvorbereitung effizient zu organisieren.

### 1.2 Problem Statement
Jurastudierende stehen vor der Herausforderung, ein umfangreiches Stoffgebiet systematisch zu erlernen. Bestehende Lösungen bieten keine spezialisierte Unterstützung für die Strukturierung des juristischen Lernstoffs nach Rechtsgebieten und Unterrechtsgebieten. Viele Studierende verlieren den Überblick über ihren Lernfortschritt und kämpfen mit ineffizienter Zeitplanung.

### 1.3 Lösung
PrepWell bietet:
- Einen geführten Wizard zur Erstellung individueller Lernpläne
- Eine hierarchische Struktur für juristische Inhalte (Fach → Kapitel → Themen → Aufgaben)
- Einen integrierten Kalender zur Visualisierung und Verwaltung von Lernblöcken
- Aufgabenmanagement mit Verknüpfung zu Lernblöcken
- Timer-Funktionalität für fokussiertes Lernen (Pomodoro, Countdown)

### 1.4 Zielgruppe
- **Primär:** Jurastudierende in der Examensvorbereitung (1. und 2. Staatsexamen)
- **Sekundär:** Referendare, Studierende anderer Fachrichtungen mit strukturiertem Lernbedarf

---

## 2. Technischer Stack

| Komponente | Technologie | Version |
|------------|-------------|---------|
| Frontend Framework | React | 18.3.1 |
| Build Tool | Vite | 5.4.11 |
| Routing | React Router | 6.22.0 |
| Styling | Tailwind CSS | 3.4.15 |
| Icons | Lucide React | 0.561.0 |
| Charts | Recharts | 3.6.0 |
| Validierung | Zod | 4.2.1 |
| Backend | Vercel Serverless Functions | @vercel/node |
| Datenbank (Legacy) | Vercel KV (Redis) | @vercel/kv |
| **Datenbank (Neu)** | **Supabase (PostgreSQL)** | **@supabase/supabase-js 2.x** |
| **Auth** | **Supabase Auth** | **eingebaut** |
| KI-Integration | OpenAI API | gpt-4o-mini |
| Deployment | Vercel | - |
| Pre-Commit Hooks | Husky + lint-staged | 9.x / 16.x |
| Linting | ESLint | 8.57.1 |

### 2.1 Entwicklungswerkzeuge

**Pre-Commit Hooks:**
Automatische Code-Qualitätsprüfung vor jedem Commit.

```bash
# Konfiguration in package.json
"lint-staged": {
  "src/**/*.{js,jsx}": ["eslint --fix --max-warnings 0"],
  "api/**/*.ts": ["eslint --fix --max-warnings 0"]
}
```

**Was passiert bei `git commit`:**
1. Husky aktiviert den Pre-Commit Hook
2. lint-staged führt ESLint nur auf geänderten Dateien aus
3. Bei Fehlern wird der Commit abgebrochen
4. `--fix` behebt automatisch behebbare Probleme

### 2.2 Supabase Integration

**Datenbank-Migration von Vercel KV zu Supabase:**

| Aspekt | Vercel KV (Alt) | Supabase (Neu) |
|--------|-----------------|----------------|
| Datenbank | Redis (Key-Value) | PostgreSQL (relational) |
| Auth | Keine | Email, OAuth, Magic Link |
| Realtime | Nein | WebSocket-Subscriptions |
| Row Level Security | Nein | Ja (Policies) |

**Konfiguration (.env.local):**
```bash
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Services:**
```javascript
import {
  lernplaeneService,
  slotsService,
  aufgabenService,
  leistungenService,
  wizardService,
  // ... weitere Services
} from './services/supabaseService';
```

### 2.3 Supabase-Integrationsstatus

**Aktueller Stand (Dezember 2025):**

| Context | Supabase-Tabelle | Status | Beschreibung |
|---------|------------------|--------|--------------|
| ExamsContext | `leistungen` | ✅ Integriert | Klausuren & Noten sync |
| UebungsklausurenContext | `uebungsklausuren` | ✅ Integriert | Übungsklausuren sync |
| CheckInContext | `checkin_responses` | ✅ Integriert | Check-in Daten (morgens/abends) |
| MentorContext | `user_settings` | ✅ Integriert | Mentor-Aktivierung |
| TimerContext | `timer_sessions` | ✅ Integriert | Timer-History (Config lokal) |
| WizardContext | `wizard_drafts` | ✅ Integriert | Lernplan-Wizard Draft |
| CalendarContext (contentPlans) | `content_plans` | ✅ Integriert | Lernpläne & Themenlisten |
| CalendarContext (customUnterrechtsgebiete) | `user_settings` | ✅ Integriert | Eigene Rechtsgebiete |
| CalendarContext (slotsByDate) | `calendar_slots` | ✅ Integriert | Kalender-Slots |
| CalendarContext (tasksByDate) | `calendar_tasks` | ✅ Integriert | Tagesaufgaben |
| CalendarContext (privateBlocksByDate) | `private_blocks` | ✅ Integriert | Private Termine |
| CalendarContext (archivedLernplaene) | `archived_lernplaene` | ✅ Integriert | Archivierte Pläne |
| CalendarContext (lernplanMetadata) | `user_settings` | ✅ Integriert | Aktiver Lernplan Metadaten |
| CalendarContext (publishedThemenlisten) | `published_themenlisten` | ✅ Integriert | Community Themenlisten |
| CalendarContext (themeLists) | - | 📦 LocalStorage | LEGACY - durch contentPlans ersetzt |
| CalendarContext (contentsById) | - | 📦 LocalStorage | Content-Objekte (lokal) |

**Synchronisations-Logik:**
- Bei Authentifizierung: LocalStorage-Daten werden automatisch zu Supabase migriert
- Danach: Supabase ist die primäre Datenquelle (Source of Truth)
- Offline: LocalStorage-Fallback mit automatischem Sync beim Reconnect
- Debouncing: Wizard Draft wird mit 500ms Debounce gespeichert
- Date-keyed Transformationen: `slotsByDate`, `tasksByDate`, `privateBlocksByDate` werden zwischen Object-Format (lokal) und flachen Arrays (Supabase) transformiert

**Data Layer:** `src/hooks/use-supabase-sync.js` bietet wiederverwendbare Hooks:
- `useSupabaseSync` - Generischer Sync-Hook
- `useExamsSync`, `useUebungsklausurenSync` - Leistungs-Hooks
- `useContentPlansSync`, `useWizardDraftSync` - Content-Hooks
- `useUserSettingsSync` - Settings-Hook
- `useCalendarSlotsSync`, `useCalendarTasksSync` - Kalender-Hooks
- `usePrivateBlocksSync`, `useArchivedLernplaeneSync` - Block/Archiv-Hooks
- `useLernplanMetadataSync`, `usePublishedThemenlistenSync` - Metadata/Community-Hooks

**Migration SQL:** Siehe `supabase/migrations/002_add_calendar_tables.sql` für die neuen Tabellen.

**Hinweis:** Die Supabase-Integration dient als Zwischenlösung. Geplant ist die Migration auf ein eigenes TypeScript-Backend.

**Auth-Nutzung:**
```javascript
import { useAuth } from './contexts/auth-context';

const { user, signIn, signOut, isAuthenticated } = useAuth();
```

**Schema:** Siehe `supabase/schema.sql` für die komplette Datenbankstruktur.

---

## 3. Architektur

### 3.1 Datenmodell (Content-Slot-Block)

PrepWell verwendet ein Datenmodell mit drei Konzepten und zeitlicher Hierarchie:

```
┌─────────────────────────────────────────────────────────────┐
│                    ZEITLICHE HIERARCHIE                     │
│              Lernplan → Monat → Woche → Tag                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         TAG                                 │
│                    (z.B. 2025-01-15)                        │
│  Bis zu 4 Slots pro Tag:                                    │
│  08:00-10:00 │ 10:00-12:00 │ 14:00-16:00 │ 16:00-18:00      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────┐
                    │   CONTENT   │
                    │(Schuldrecht)│
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        ┌──────────┐              ┌──────────┐
        │   SLOT   │              │  BLOCK   │
        │ (Monat)  │              │ (Woche)  │
        └──────────┘              └──────────┘
```

**Beziehung Content : Slots (1:n)**
- 1 Content kann mehrere Slots am gleichen Tag belegen
- Beispiel: "Schuldrecht" belegt 3 Slots (08:00-16:00)

**CONTENT (Was):**
- Zeitlose Lerninhalte
- Hierarchie: Fach → Kapitel → Themen → Aufgaben
- Speicherung: `contentsById` (CalendarContext)

**SLOT (Monatskalender):**
- Kompakte Darstellung (Titel, Farbe)
- Zeitliche Zuordnung (Datum + Slot 1-4)
- Speicherung: `slotsByDate` (CalendarContext)

**BLOCK (Wochenkalender/Startseite):**
- Detaillierte Darstellung (Themen, Aufgaben, Timer)
- UI-Komponente für interaktive Bearbeitung
- Teile von Content können aus Slots in Blocks übernommen werden

### 3.2 State Management

**React Context Provider:**
1. `CalendarProvider` - SSOT für Kalender, Slots, Aufgaben, ContentPlans, Themenlisten
2. `AppModeProvider` - Examen-Modus vs Normal-Modus Erkennung
3. `TimerProvider` - Timer-Zustand, Einstellungen, Session-Historie
4. `UnterrechtsgebieteProvider` - Verwaltung der Rechtsgebiete-Auswahl
5. `MentorProvider` - Aktivierungsstatus des Mentors
6. `CheckInProvider` - Tägliches Check-In System
7. `ExamsProvider` - Klausuren und Leistungen (Normal-Modus)
8. `UebungsklausurenProvider` - Übungsklausuren (Examen-Modus)

**Persistenz:** Supabase (primär) mit LocalStorage-Fallback (offline-fähig)

**LocalStorage-Keys (dienen als Fallback/Cache für Supabase-Daten):**
| Key | Supabase-Tabelle | Inhalt |
|-----|------------------|--------|
| `prepwell_calendar_slots` | `calendar_slots` | Kalender-Slots |
| `prepwell_contents` | - | Content-Objekte (nur lokal) |
| `prepwell_tasks` | `calendar_tasks` | Tagesaufgaben |
| `prepwell_private_blocks` | `private_blocks` | Private Termine |
| `prepwell_content_plans` | `content_plans` | Lernpläne/Themenlisten |
| `prepwell_published_themenlisten` | `published_themenlisten` | Community-Themenlisten |
| `prepwell_lernplan_metadata` | `user_settings` | Aktiver Lernplan Metadaten |
| `prepwell_archived_lernplaene` | `archived_lernplaene` | Archivierte Pläne |
| `prepwell_timer_settings` | - | Timer-Einstellungen (nur lokal) |
| `prepwell_timer_history` | `timer_sessions` | Timer-Session-Historie |
| `prepwell_mentor_activated` | `user_settings` | Mentor-Aktivierungsstatus |
| `prepwell_checkin_responses` | `checkin_responses` | Check-In Antworten |
| `prepwell_exams` | `leistungen` | Klausuren (Normal-Modus) |
| `prepwell_uebungsklausuren` | `uebungsklausuren` | Übungsklausuren (Examen-Modus) |
| `prepwell_custom_subjects` | `user_settings` | Benutzerdefinierte Fächer |
| `prepwell_grade_system` | `user_settings` | Bevorzugtes Notensystem |
| `prepwell_lernplan_wizard_draft` | `wizard_drafts` | Wizard-Zwischenspeicher |

### 3.3 Projektstruktur

#### Root-Verzeichnis
```
PrepWell_Frontend/
├── api/                    # Vercel Serverless Functions (Produktion)
├── data/                   # Lokale JSON-Daten (Entwicklung, gitignored)
├── node_modules/           # Dependencies (gitignored)
├── public/                 # Statische Assets
├── src/                    # Frontend-Quellcode
│
├── .env.local              # Umgebungsvariablen (gitignored)
├── .eslintrc.cjs           # ESLint-Konfiguration
├── .gitignore              # Git-Ausschlüsse
├── CLAUDE.md               # AI-Kontext für Claude Code
├── index.html              # HTML-Einstiegspunkt
├── package.json            # Projektdefinition & Scripts
├── postcss.config.js       # PostCSS (für Tailwind)
├── PRD.md                  # Produktdokumentation
├── server.js               # Lokaler Express-Server
├── tailwind.config.js      # Tailwind CSS Konfiguration
├── vercel.json             # Vercel Deployment-Konfiguration
└── vite.config.js          # Vite Build-Konfiguration
```

#### Frontend (src/)
```
src/
├── app.jsx                 # Root-Komponente
├── main.jsx                # React-Einstiegspunkt
├── router.jsx              # React Router Konfiguration
├── index.css               # Globale Styles
├── design-tokens.js        # Design-System Tokens
│
├── pages/                  # Seitenkomponenten (1 pro Route)
│   ├── Dashboard.jsx
│   ├── Kalender.jsx
│   ├── Lernplaene.jsx
│   ├── Leistungen.jsx
│   ├── Aufgaben.jsx
│   ├── Einstellungen.jsx
│   └── Mentor.jsx
│
├── components/             # UI-Komponenten
│   ├── layout/             # Header, Navigation, Sidebar
│   ├── ui/                 # Wiederverwendbare UI (Button, Modal, etc.)
│   ├── dashboard/          # Dashboard-spezifisch
│   │   └── timer/          # Timer-Komponenten
│   ├── lernplan/           # Lernplan-Karten, Listen
│   ├── mentor/             # Mentor-Feature
│   │   ├── dashboard/
│   │   └── stats/
│   ├── settings/           # Einstellungs-Komponenten
│   ├── uebungsklausuren/   # Übungsklausuren (Examen-Modus)
│   │   └── dialogs/
│   └── verwaltung/         # Verwaltungs-Komponenten
│       └── dialogs/
│
├── features/               # Feature-Module (in sich geschlossen)
│   ├── calendar/           # Kalender-Feature
│   │   ├── components/     # Kalender-UI
│   │   ├── hooks/          # Kalender-Hooks
│   │   └── utils/          # Kalender-Hilfsfunktionen
│   └── lernplan-wizard/    # Wizard-Feature
│       ├── components/     # Wizard-UI
│       ├── context/        # Wizard-State
│       └── steps/          # Wizard-Schritte (1-10)
│
├── contexts/               # React Context Provider
│   ├── CalendarContext.jsx # SSOT für Kalender, Slots, Aufgaben
│   ├── TimerContext.jsx    # Timer-State
│   ├── AppModeContext.jsx  # Normal/Examen-Modus
│   └── ...
│
├── hooks/                  # Custom React Hooks
├── services/               # API-Service Layer
├── data/                   # Statische Daten (Rechtsgebiete, etc.)
├── types/                  # TypeScript/JSDoc Typen
├── utils/                  # Allgemeine Hilfsfunktionen
└── styles/                 # Zusätzliche CSS-Dateien
```

#### Backend (api/)
```
api/
├── lib/
│   ├── kv.ts               # Vercel KV Datenbankoperationen
│   └── utils.ts            # CORS, Validierung, Hilfsfunktionen
├── types.ts                # Shared TypeScript Types
│
├── lernplaene/
│   ├── index.ts            # GET/POST /api/lernplaene
│   └── [id].ts             # GET/PUT/DELETE /api/lernplaene/:id
├── kalender/
│   └── [lernplanId]/
│       ├── slots.ts        # GET/PUT/POST /api/kalender/:id/slots
│       └── slots/
│           └── bulk.ts     # POST /api/kalender/:id/slots/bulk
├── aufgaben/
│   ├── index.ts            # GET/POST /api/aufgaben
│   └── [id].ts             # GET/PUT/DELETE /api/aufgaben/:id
├── leistungen/
│   ├── index.ts            # GET/POST /api/leistungen
│   └── [id].ts             # GET/PUT/DELETE /api/leistungen/:id
├── wizard/
│   ├── draft.ts            # GET/PUT/DELETE /api/wizard/draft
│   └── complete.ts         # POST /api/wizard/complete
├── unterrechtsgebiete/
│   ├── index.ts            # GET/POST /api/unterrechtsgebiete
│   └── [id].ts             # DELETE /api/unterrechtsgebiete/:id
└── generate-plan.ts        # POST /api/generate-plan
```

#### Konventionen

| Regel | Beschreibung |
|-------|--------------|
| **Keine neuen Root-Ordner** | Neue Funktionalität gehört in `src/features/` |
| **Komponenten-Struktur** | `components/` = wiederverwendbar, `features/` = feature-spezifisch |
| **Keine tiefen Imports** | Max. 3 Ebenen: `../../components/ui/Button` |
| **Feature-Isolation** | Features importieren nur aus `components/`, `hooks/`, `utils/` |
| **Datei-Benennung** | PascalCase für Komponenten, camelCase für Utilities |

---

## 4. Funktionale Anforderungen

### 4.1 Seitenstruktur

| # | Seite | Route | Status | Beschreibung |
|---|-------|-------|--------|--------------|
| 1 | Startseite | `/` | ✅ | Dashboard mit Tagesübersicht |
| 2 | Lernpläne | `/lernplan` | ✅ | Übersicht aller Lernpläne |
| 3 | Kalender (Woche) | `/kalender/woche` | ✅ | Wochenansicht |
| 4 | Kalender (Monat) | `/kalender/monat` | ✅ | Monatsansicht |
| 5 | Verwaltung > Leistungen | `/verwaltung/leistungen` | ✅ | Klausurverwaltung |
| 6 | Verwaltung > Aufgaben | `/verwaltung/aufgaben` | ✅ | Aufgabenverwaltung |
| 7 | Einstellungen | `/einstellungen` | ✅ | Benutzereinstellungen |
| 8 | Mentor | `/mentor` | ✅ | KI-Mentor |
| 9 | Wizard | `/lernplan/erstellen` | ✅ | 10-Schritte Wizard |

### 4.2 Lernplan-Wizard (10 Schritte)

Der Wizard führt Nutzer durch die Erstellung eines personalisierten Lernplans:

| Schritt | Name | Beschreibung |
|---------|------|--------------|
| 1 | Lernzeitraum | Start- und Enddatum festlegen |
| 2 | Puffertage | Anzahl unverplanter Tage |
| 3 | Urlaubstage | Freie Tage markieren |
| 4 | Tagesblöcke | Anzahl Lernblöcke pro Tag (1-4) |
| 5 | Wochenstruktur | Aktive Lerntage auswählen |
| 6 | Erstellungsmethode | Manual/Automatisch/Vorlage/KI |
| 7a | Manual | Manuelle Themenverteilung |
| 7b | Automatisch | Automatische Generierung |
| 7c | Vorlage | Vordefinierte Vorlagen |
| 7d | KI | KI-gestützte Erstellung |
| 8 | Unterrechtsgebiete | Rechtsgebiete auswählen |
| 9 | Lerntage | Feinabstimmung der Tage |
| 10 | Anpassungen | Finale Überprüfung |

**Erstellungsmethoden:**
- **Manual:** Nutzer verteilt Themen selbst auf Tage
- **Automatisch:** System verteilt Themen gleichmäßig
- **Vorlage:** Vordefinierte Lernpläne (z.B. "6-Monats-Intensivkurs")
- **KI:** OpenAI-basierte intelligente Planerstellung

### 4.3 Kalender-Feature

**Blocktypen:**
| Typ | Farbe | Beschreibung |
|-----|-------|--------------|
| Tagesthema | Rechtsgebiet-Farbe | Hauptlernblock |
| Wiederholung | Orange | Wiederholungseinheit |
| Klausur | Rot | Prüfungstermin |
| Privat | Grau | Persönlicher Termin |
| Freizeit | Grün | Freizeitaktivität |

**Funktionen:**
- Drag & Drop für Aufgaben in Blöcke
- Wiederholungsfunktion (täglich/wöchentlich/monatlich)
- Zeitangaben (Start/Ende)
- Fortschrittstracking pro Block
- Sperren/Entsperren von Blöcken

### 4.4 Dashboard (Startseite)

**Widgets:**
- **Lernblock-Widget:** Aktueller/nächster Lernblock
- **Zeitplan-Widget:** Tagesübersicht mit Stunden
- **Aufgaben-Widget:** Heutige Aufgaben
- **Timer-Widget:** Pomodoro/Countdown/Count-up
- **Fortschritts-Widget:** Täglicher Fortschritt

**Timer-Modi:**
| Modus | Beschreibung |
|-------|--------------|
| Pomodoro | 25 Min Arbeit + 5 Min Pause |
| Countdown | Individuelle Zeit |
| Count-up | Unbegrenzt aufwärts |

### 4.5 Aufgabenverwaltung

**Aufgaben-Eigenschaften:**
- Titel und Beschreibung
- Priorität (mittel/hoch)
- Verknüpfung mit Lernblock
- Fälligkeitsdatum
- Status (offen/erledigt)

**Ansichten:**
- Kanban-Board
- Listenansicht
- Filter nach Rechtsgebiet, Priorität, Status

### 4.6 Themenlisten (Hierarchie)

```
Lernplan
└── Fach (z.B. Zivilrecht)
    └── Kapitel (z.B. Schuldrecht)
        └── Themen (z.B. Kaufvertrag)
            └── Aufgaben (z.B. Fall 1 lösen)
```

**Terminologie-Mapping:**
| Synonym | Primärer Begriff |
|---------|------------------|
| Rechtsgebiet | Fach |
| Unterrechtsgebiet | Kapitel |

**Funktionen:**
- Aufklappbare Hierarchie
- Fortschrittsanzeige pro Ebene
- Aufgaben in Kalenderblöcke ziehen
- Themen bearbeiten/löschen

### 4.7 Themenlistendatenbank

Die Themenlistendatenbank ermöglicht Nutzern, vorgefertigte Themenlisten zu importieren oder eigene Themenlisten mit der Community zu teilen.

**Zugriff:**
- Button "Themenlistendatenbank" auf der Lernpläne-Seite (neben "Neue Themenliste")
- Öffnet Full-Screen-Dialog mit Datenbank-Übersicht

**Tabs:**
| Tab | Beschreibung |
|-----|--------------|
| Vorlagen | Vordefinierte Templates (z.B. Examensvorbereitung, Zivilrecht Intensiv) |
| Community | Vom Nutzer veröffentlichte Themenlisten |

**Template-Informationen:**
- Name und Beschreibung
- Statistiken: Anzahl Unterrechtsgebiete, Anzahl Themen
- Gewichtung der Rechtsgebiete (in %)
- Modus: Examen/Standard
- Tags für Filterung

**Filter & Suche:**
- Volltextsuche nach Name, Beschreibung, Tags
- Filter nach Rechtsgebiet (Zivilrecht, Öffentliches Recht, Strafrecht)
- Filter nach Modus (Examen, Standard)

**Import/Export-Funktionen:**

| Funktion | Beschreibung |
|----------|--------------|
| Template importieren | Vordefiniertes Template als neue Themenliste übernehmen |
| JSON importieren | Themenliste aus JSON-Datei importieren |
| JSON exportieren | Eigene Themenliste als JSON-Datei herunterladen |
| Veröffentlichen | Eigene Themenliste zur Community hinzufügen |
| Veröffentlichung aufheben | Aus Community entfernen |

**JSON-Export Format:**
```json
{
  "id": "export-...",
  "name": "Themenliste Name",
  "description": "Beschreibung",
  "exportedAt": "2025-12-21T...",
  "stats": {
    "unterrechtsgebiete": 12,
    "themen": 156
  },
  "gewichtung": {
    "zivilrecht": 45,
    "oeffentliches-recht": 35,
    "strafrecht": 20
  },
  "rechtsgebiete": [...]
}
```

**LocalStorage-Keys:**
- `prepwell_published_themenlisten` - Vom Nutzer veröffentlichte Themenlisten

### 4.8 Mentor & Check-In

Der Mentor bietet Statistiken und Auswertungen zum Lernfortschritt.

**Aktivierung:**
- Erster Besuch zeigt "Mentor aktivieren" Dialog
- Nach Aktivierung: Vollständiges Statistik-Dashboard

**Check-In System:**
- Täglicher Check-In beim ersten Besuch
- Erfasst: Stimmung, Energielevel, Fokus-Level
- Optionale Notiz
- Ergebnisse fließen in Statistiken ein

**Statistik-Kategorien:**

| Kategorie | Metriken |
|-----------|----------|
| Lernzeit | Ø pro Tag/Woche, längste Session, Gesamt |
| Zeitpunkte | Produktivste Tageszeit, Ø Start/Ende |
| Fächer | Verteilung nach Rechtsgebiet |
| Aufgaben | Erledigungsrate, Kapitel-Fortschritt |
| Planung | Planerfüllung, On-Track-Score |
| Konsistenz | Streaks, Lerntage/Woche |
| Wiederholungen | Rep-Blöcke, Überfällige |
| Timer | Sessions/Tag, Abschlussrate |

**Visualisierungen:**
- Performance-Heatmap (letzte 30 Tage)
- Jahresansicht (12 Monate als Heatmap-Grid)
- Liniendiagramme für Trends
- Score-Cards für Einzelwerte

**LocalStorage-Keys:**
- `prepwell_mentor_activated` - Aktivierungsstatus
- `prepwell_checkin_responses` - Check-In Historie
- `prepwell_timer_history` - Timer-Session-Historie

### 4.9 App-Modus (Examen vs Normal)

Die WebApp unterscheidet zwei grundlegende Betriebsmodi, die das Nutzererlebnis beeinflussen:

**Modi:**
| Modus | Aktivierung | Beschreibung |
|-------|-------------|--------------|
| Examen-Modus | Automatisch wenn Lernplan existiert | Voller Funktionsumfang, Lernplan steuert alles |
| Normal-Modus | Standard (kein aktiver Lernplan) | Reduzierter Funktionsumfang, Themenlisten-basiert |

**Modus-Erkennung:**
- Automatisch basierend auf `contentPlans` mit `type: 'lernplan'`
- Ein aktiver (nicht archivierter) Lernplan → Examen-Modus
- Kein aktiver Lernplan → Normal-Modus

**Unterschiede:**

| Feature | Examen-Modus | Normal-Modus |
|---------|--------------|--------------|
| Navigation "Lernpläne" | Aktiv | Deaktiviert (ausgegraut) |
| Standard-Kalenderansicht | Monatsansicht | Wochenansicht |
| Lernplan-Features | Vollständig | Nicht verfügbar |
| Themenlisten | Via Lernplan | Direkt nutzbar |

**UI-Anpassungen im Normal-Modus:**
- Deaktivierte Navigation-Items werden grau dargestellt (`text-gray-300`)
- Cursor zeigt `not-allowed` bei Hover
- Tooltip: "Nur im Examen-Modus verfügbar"

**Context:**
```javascript
const {
  appMode,           // 'exam' | 'normal'
  isExamMode,        // boolean
  isNormalMode,      // boolean
  activeLernplan,    // aktueller Lernplan oder null
  isNavItemDisabled, // (key) => boolean
  defaultCalendarView // 'monat' | 'woche'
} = useAppMode();
```

### 4.10 Leistungen & Übungsklausuren

Die Seite `/verwaltung/leistungen` zeigt unterschiedliche Inhalte je nach App-Modus:

**Normal-Modus: Leistungsübersicht**

Verwaltung von Semester-Klausuren und Leistungsnachweisen.

| Feature | Beschreibung |
|---------|--------------|
| Notensystem | Dual: Punkte (0-18) ODER Noten (1.0-5.0) |
| Tabellen-Spalten | Fach, Semester, Thema, Datum (Zeit), Note |
| Fächer | Vordefiniert + benutzerdefinierte Fächer |
| Gewichtung | ECTS-basiert für Durchschnittsberechnung |
| Semester | Auswählbar (WS/SS 2021-2025) |

**Examen-Modus: Übungsklausuren**

Verwaltung von Übungsklausuren zur Staatsexamensvorbereitung.

| Feature | Beschreibung |
|---------|--------------|
| Notensystem | Nur Punkte (0-18) |
| Tabellen-Spalten | Fach, Thema, Datum, Note |
| Rechtsgebiete | Zivilrecht, Strafrecht, Öffentliches Recht |
| Auswertung | Popup-Dialog mit Recharts-Diagrammen |

**Auswertungs-Dialog (Examen-Modus):**

| Tab | Visualisierung |
|-----|----------------|
| Entwicklung | Liniendiagramm mit Notentrend + laufender Durchschnitt |
| Gewichtung | Balkendiagramm zur Verteilung nach Rechtsgebiet |

**Statistiken:**
- Durchschnittsnoten pro Rechtsgebiet
- Trend-Indikatoren (Verbesserung/Verschlechterung)
- Beste/niedrigste Note
- Empfehlungen basierend auf Verteilung

**Dialoge:**
- Neue Klausur erstellen
- Klausur bearbeiten/löschen
- Filtern & Sortieren
- Auswertung (nur Examen-Modus)

---

## 5. Nicht-funktionale Anforderungen

### 5.1 Performance
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- LocalStorage-Operationen: < 50ms

### 5.2 Kompatibilität
- Browser: Chrome, Firefox, Safari, Edge (aktuelle Versionen)
- Viewport: Desktop-first (≥1024px), Tablet-Support (≥768px)

### 5.3 Barrierefreiheit
- Tastaturnavigation
- ARIA-Labels
- Kontrastverhältnis ≥ 4.5:1

### 5.4 Datensicherheit
- Alle Daten lokal im Browser (MVP)
- Keine sensiblen Daten in URLs
- HTTPS-only in Produktion

---

## 6. Design System

### 6.1 Farbpalette

**Primärfarben (Brand):**
- Primary-50: #FFE7E7
- Primary-100: #FFD7D7
- Primary-200: #FFCECE
- Primary-300: #FFC3C3
- Primary-400: #FFC4C4

**Rechtsgebiete:**
| Rechtsgebiet | Farbe |
|--------------|-------|
| Öffentliches Recht | Grün (#10B981) |
| Zivilrecht | Blau (#3B82F6) |
| Strafrecht | Rot (#EF4444) |
| Querschnittsrecht | Violett (#8B5CF6) |

**Graustufen:**
- Gray-50 bis Gray-950

### 6.2 Typografie

**Schriftart:** DM Sans (Google Fonts)

| Verwendung | Größe | Gewicht |
|------------|-------|---------|
| H1 | 24px | Semibold (600) |
| H2 | 20px | Semibold (600) |
| H3 | 18px | Medium (500) |
| Body | 16px | Normal (400) |
| Small | 14px | Normal (400) |
| XSmall | 12px | Normal (400) |

### 6.3 Komponenten

**Button-Varianten:**
- `primary` - Hauptaktion
- `default` - Sekundäraktion
- `ghost` - Tertiäraktion
- `icon` - Nur Icon

**Badge-Varianten:**
- `default` - Standard
- `primary` - Hervorgehoben
- `outline` - Umrandet

**Dialog:**
- Modal mit Overlay
- Schließbar via X oder Escape
- Responsive Breite

---

## 7. API-Spezifikation

### 7.1 Backend-Architektur

Das Backend unterstützt zwei Umgebungen mit identischen Endpoints:

| Umgebung | Technologie | Datenbank | Port |
|----------|-------------|-----------|------|
| **Produktion** | Vercel Serverless Functions | Vercel KV (Redis) | - |
| **Lokale Entwicklung** | Express.js | JSON-Dateien | 3010 |

**Base URLs:**
- Produktion: `https://[projekt].vercel.app/api`
- Lokale Entwicklung: `http://localhost:3010/api`

#### 7.1.1 Produktion (Vercel Serverless)

**Projektstruktur:**
```
api/
├── lib/
│   ├── kv.ts              # Vercel KV Datenbankoperationen
│   └── utils.ts           # CORS, Validierung, Hilfsfunktionen
├── types.ts               # Shared TypeScript Types
├── lernplaene/
│   ├── index.ts           # GET/POST /api/lernplaene
│   └── [id].ts            # GET/PUT/DELETE /api/lernplaene/:id
├── kalender/
│   └── [lernplanId]/
│       ├── slots.ts       # GET/PUT/POST /api/kalender/:lernplanId/slots
│       └── slots/
│           └── bulk.ts    # POST /api/kalender/:lernplanId/slots/bulk
├── aufgaben/
│   ├── index.ts           # GET/POST /api/aufgaben
│   └── [id].ts            # GET/PUT/DELETE /api/aufgaben/:id
├── leistungen/
│   ├── index.ts           # GET/POST /api/leistungen
│   └── [id].ts            # GET/PUT/DELETE /api/leistungen/:id
├── wizard/
│   ├── draft.ts           # GET/PUT/DELETE /api/wizard/draft
│   └── complete.ts        # POST /api/wizard/complete
├── unterrechtsgebiete/
│   ├── index.ts           # GET/POST /api/unterrechtsgebiete
│   └── [id].ts            # DELETE /api/unterrechtsgebiete/:id
└── generate-plan.ts       # POST /api/generate-plan
```

#### 7.1.2 Lokale Entwicklung (Express Server)

Für Entwicklung ohne Vercel CLI steht ein lokaler Express-Server zur Verfügung.

**Datei:** `server.js`

**Starten:**
```bash
# Nur API-Server
npm run dev:api

# Frontend + API parallel
npm run dev:full
```

**Lokale Datenspeicherung:**
```
data/
├── lernplaene.json        # Lernpläne
├── slots.json             # Kalender-Slots
├── aufgaben.json          # Aufgaben
├── leistungen.json        # Leistungen/Klausuren
├── wizard-draft.json      # Wizard-Zwischenspeicher
└── unterrechtsgebiete.json # Unterrechtsgebiete
```

**Hinweise:**
- Daten werden persistent in JSON-Dateien gespeichert
- `data/*.json` ist in `.gitignore` (wird nicht committet)
- Unterstützt OpenAI-Integration via `.env.local`

### 7.2 Endpoints

**Lernpläne:**
```
GET    /api/lernplaene         # Alle Lernpläne abrufen
GET    /api/lernplaene/:id     # Einzelnen Lernplan abrufen
POST   /api/lernplaene         # Neuen Lernplan erstellen
PUT    /api/lernplaene/:id     # Lernplan aktualisieren
DELETE /api/lernplaene/:id     # Lernplan löschen
```

**Kalender/Slots:**
```
GET    /api/kalender/:lernplanId/slots       # Alle Slots eines Lernplans
PUT    /api/kalender/:lernplanId/slots       # Alle Slots ersetzen
POST   /api/kalender/:lernplanId/slots       # Einzelnen Slot hinzufügen/aktualisieren
POST   /api/kalender/:lernplanId/slots/bulk  # Mehrere Slots in einer Anfrage
```

**Aufgaben:**
```
GET    /api/aufgaben           # Alle Aufgaben abrufen
GET    /api/aufgaben/:id       # Einzelne Aufgabe abrufen
POST   /api/aufgaben           # Neue Aufgabe erstellen
PUT    /api/aufgaben/:id       # Aufgabe aktualisieren
DELETE /api/aufgaben/:id       # Aufgabe löschen
```

**Leistungen/Klausuren:**
```
GET    /api/leistungen         # Alle Leistungen abrufen
GET    /api/leistungen/:id     # Einzelne Leistung abrufen
POST   /api/leistungen         # Neue Leistung erstellen
PUT    /api/leistungen/:id     # Leistung aktualisieren
DELETE /api/leistungen/:id     # Leistung löschen
```

**Wizard (Zwischenspeicherung):**
```
GET    /api/wizard/draft       # Wizard-Entwurf abrufen
PUT    /api/wizard/draft       # Wizard-Entwurf speichern
DELETE /api/wizard/draft       # Wizard-Entwurf löschen
POST   /api/wizard/complete    # Wizard abschließen & Lernplan erstellen
```

**Unterrechtsgebiete:**
```
GET    /api/unterrechtsgebiete      # Alle Unterrechtsgebiete abrufen
POST   /api/unterrechtsgebiete      # Neues Unterrechtsgebiet hinzufügen
DELETE /api/unterrechtsgebiete/:id  # Unterrechtsgebiet löschen
```

**KI-Generierung:**
```
POST   /api/generate-plan      # KI-gestützten Lernplan generieren
```

### 7.3 Datenbank-Schema (Vercel KV)

**Key-Struktur:**
| Key-Pattern | Datentyp | Beschreibung |
|-------------|----------|--------------|
| `lernplaene` | Set | IDs aller Lernpläne |
| `lernplan:{id}` | JSON | Einzelner Lernplan |
| `slots:{lernplanId}` | JSON Array | Slots eines Lernplans |
| `aufgaben` | Set | IDs aller Aufgaben |
| `aufgabe:{id}` | JSON | Einzelne Aufgabe |
| `leistungen` | Set | IDs aller Leistungen |
| `leistung:{id}` | JSON | Einzelne Leistung |
| `wizard:draft` | JSON | Aktueller Wizard-Entwurf |
| `unterrechtsgebiete` | JSON Array | Alle Unterrechtsgebiete |

### 7.4 Response-Format

Alle Endpoints verwenden ein einheitliches Response-Format:

**Erfolg:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Fehler:**
```json
{
  "success": false,
  "error": "Fehlermeldung"
}
```

**HTTP Status Codes:**
| Code | Bedeutung |
|------|-----------|
| 200 | Erfolg |
| 201 | Erfolgreich erstellt |
| 400 | Ungültige Anfrage |
| 404 | Nicht gefunden |
| 405 | Methode nicht erlaubt |
| 500 | Serverfehler |

---

## 8. Datenbank (Rechtsgebiete)

Das System enthält 100+ vordefinierte deutsche Rechtsgebiete:

### 8.1 Öffentliches Recht
- Staatsorganisationsrecht
- Grundrechte
- Allgemeines Verwaltungsrecht
- Besonderes Verwaltungsrecht
- Polizei- und Ordnungsrecht
- Kommunalrecht
- Baurecht
- Umweltrecht
- Europarecht
- Steuerrecht
- Sozialrecht

### 8.2 Zivilrecht
- BGB Allgemeiner Teil
- Schuldrecht Allgemeiner Teil
- Schuldrecht Besonderer Teil
- Sachenrecht
- Familienrecht
- Erbrecht
- Handelsrecht
- Gesellschaftsrecht
- Arbeitsrecht

### 8.3 Strafrecht
- StGB Allgemeiner Teil
- StGB Besonderer Teil
- Strafprozessrecht

### 8.4 Querschnittsrecht
- Zivilprozessrecht
- Zwangsvollstreckungsrecht
- Insolvenzrecht

---

## 9. Implementierungsstatus

### 9.1 Abgeschlossen (✅)
- [x] Alle 9 Hauptseiten mit Navigation
- [x] 10-Schritte Lernplan-Wizard
- [x] Kalender Monats-/Wochenansicht
- [x] Dashboard mit Lernblöcken
- [x] Timer-Feature (3 Modi)
- [x] Aufgabenverwaltung
- [x] Themenlisten mit Hierarchie
- [x] Aufgaben-Scheduling in Blöcke
- [x] Context-basiertes State Management
- [x] LocalStorage-Persistenz
- [x] Responsive Routing
- [x] Themenlistendatenbank mit Templates
- [x] Themenlisten Export/Import (JSON)
- [x] Community-Veröffentlichung von Themenlisten
- [x] Mentor-Aktivierung mit Dialog
- [x] Tägliches Check-In System
- [x] Statistik-Dashboard mit Heatmaps
- [x] Jahresansicht für Produktivität
- [x] Timer-Historie für Statistiken
- [x] App-Modus System (Examen vs Normal)
- [x] Modus-basierte Navigation
- [x] Leistungsübersicht (Normal-Modus)
- [x] Duales Notensystem (Punkte/Noten)
- [x] ECTS-gewichtete Durchschnitte
- [x] Benutzerdefinierte Fächer
- [x] Übungsklausuren (Examen-Modus)
- [x] Auswertungs-Dialog mit Recharts
- [x] Notenentwicklungs-Diagramm
- [x] Rechtsgebiete-Verteilungs-Diagramm
- [x] Backend-API (Vercel Serverless Functions)
- [x] Vercel KV Datenbank-Integration
- [x] OpenAI-Integration mit Fallback
- [x] Lokaler Express-Server für Entwicklung
- [x] Persistente JSON-Datenspeicherung (lokal)

### 9.2 In Entwicklung (🔄)
- [x] **Supabase-Integration (Backend)** - Schema, Services, Contexts umgestellt
- [x] **Benutzerauthentifizierung** - Supabase Auth integriert
- [x] **CalendarContext Supabase-Sync** - Vollständig integriert (slots, tasks, private blocks, archived plans, metadata, published themenlisten)
- [ ] Mobile Optimierung

### 9.3 Geplant (📋)
- [ ] Echtzeit-Synchronisation (Supabase Realtime)
- [ ] Offline-Modus mit Sync
- [ ] Erweiterte Analytik
- [ ] Lerngruppen-Feature
- [ ] Integration mit Rechtsdatenbanken
- [ ] Mobile App (React Native)
- [ ] Migration auf TypeScript-Backend (ersetzt Supabase)

---

## 10. Metriken & KPIs

### 10.1 Engagement-Metriken
- Täglich aktive Nutzer (DAU)
- Durchschnittliche Sitzungsdauer
- Wizard-Abschlussrate
- Timer-Nutzungsrate

### 10.2 Lern-Metriken
- Abgeschlossene Lernblöcke pro Woche
- Aufgaben-Erledigungsrate
- Fortschritt pro Rechtsgebiet
- Konsistenz (Streak-Tage)

### 10.3 Technische Metriken
- Seitenladezzeit
- Fehlerrate
- LocalStorage-Nutzung

---

## 11. Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|--------|-------------------|------------|------------|
| LocalStorage-Limit erreicht | Niedrig | Hoch | Komprimierung, Backend-Migration |
| Browser-Inkompatibilität | Niedrig | Mittel | Progressive Enhancement |
| OpenAI-API Ausfälle | Mittel | Mittel | Fallback zu manueller Erstellung |
| Datenverlust | Mittel | Hoch | Export-Funktion, Cloud-Backup |

---

## 12. Glossar

| Begriff | Definition |
|---------|------------|
| Lernplan | Strukturierter Zeitplan für die Examensvorbereitung |
| Themenliste | Hierarchische Sammlung von Lerninhalten |
| Themenlistendatenbank | Repository für vorgefertigte und geteilte Themenlisten |
| Slot | Kompakte Kalenderansicht (Monatskalender) - Zeitfenster im Tag (1-4) |
| Block | Detaillierte Kalenderansicht (Wochenkalender/Startseite) - interaktiv |
| Fach | Hauptkategorie (= Rechtsgebiet: Öffentl. Recht, Zivilrecht, Strafrecht) |
| Kapitel | Unterkategorie (= Unterrechtsgebiet: z.B. BGB AT, StGB BT) |
| Themen | Spezifische Lerninhalte innerhalb eines Kapitels |
| Aufgaben | Konkrete Lernaktivitäten (z.B. Fall lösen, Klausur) |
| Pomodoro | Zeitmanagement-Methode (25 Min Arbeit, 5 Min Pause) |
| SSOT | Single Source of Truth - zentrale Datenquelle |
| Check-In | Tägliche Erfassung von Stimmung/Energie/Fokus |
| Mentor | KI-gestütztes Statistik- und Auswertungs-Dashboard |
| Community | Lokal gespeicherte, vom Nutzer geteilte Themenlisten |
| Heatmap | Farbcodierte Visualisierung von Aktivität/Produktivität |
| Examen-Modus | App-Modus bei aktivem Lernplan - voller Funktionsumfang |
| Normal-Modus | App-Modus ohne Lernplan - reduzierte Navigation |
| Übungsklausuren | Probeklausuren zur Examensvorbereitung (nur Examen-Modus) |
| Leistungsübersicht | Semester-Klausuren und Noten (nur Normal-Modus) |
| Punkte | Jura-Notensystem 0-18 (Staatsexamen) |
| ECTS | European Credit Transfer System - Gewichtung für Durchschnitt |

---

## 13. Anhänge

### 13.1 Design-Ressourcen
- **Figma:** [PrepWell WebApp Design](https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp)

### 13.2 Dokumentation
- [README.md](README.md) - Schnellstart
- [COMPONENTS.md](COMPONENTS.md) - Komponentendokumentation
- [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) - Einrichtungsanleitung

### 13.3 Kontakt
- **Repository:** PrepWell_Frontend
- **Deployment:** Vercel

---

*Dieses Dokument wird kontinuierlich aktualisiert, um den aktuellen Entwicklungsstand widerzuspiegeln.*
