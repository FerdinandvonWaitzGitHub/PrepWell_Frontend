# PrepWell - Product Requirements Document

**Version:** 2.0
**Stand:** Januar 2026
**Status:** MVP mit Supabase-Integration

---

# Teil 1: Aktueller Stand

---

## 1. Produktbeschreibung

PrepWell ist eine webbasierte Lernmanagement-Plattform für Studierende zur strukturierten Prüfungsvorbereitung. Die App unterstützt 20 verschiedene Studiengänge mit dynamischen Bezeichnungen, wobei Jurastudierende zusätzliche Features für die Staatsexamensvorbereitung erhalten.

### Kernfunktionen
- Personalisierte Lernpläne mit 10-Schritte-Wizard
- Kalender mit Monats- und Wochenansicht
- Timer-System (Pomodoro, Countdown, Count-up)
- Aufgabenverwaltung mit Block-Zuordnung
- Statistik-Dashboard (Mentor)
- Check-In System (Morgens/Abends)
- **NEU:** Studiengang-Auswahl mit dynamischen Hierarchie-Bezeichnungen

---

## 2. Technischer Stack

| Komponente | Technologie | Version |
|------------|-------------|---------|
| Frontend | React | 18.3.1 |
| Build Tool | Vite | 5.4.21 |
| Routing | React Router | 6.22.0 |
| Styling | Tailwind CSS | 3.4.15 |
| Icons | Lucide React | 0.561.0 |
| Charts | Recharts | 3.6.0 |
| Validierung | Zod | 4.2.1 |
| Datenbank | Supabase (PostgreSQL) | 2.x |
| Auth | Supabase Auth | eingebaut |
| Deployment | Vercel | - |

---

## 3. Architektur

### 3.1 BlockAllocation vs. Session - Strikte Trennung

**Kernprinzip:** Blöcke und Sessions sind zwei komplett getrennte Entitäten mit unterschiedlichen Datenmodellen. Sie werden NIEMALS gemischt.

---

#### Entity A: BlockAllocation (Monatsansicht)

**Zweck:** Kapazitätsplanung auf Tagesebene - "Wie viel Zeit reserviere ich für welche Kategorie?"

```
BlockAllocation {
  id:           UUID
  date:         DATE              // z.B. "2026-01-15"
  kind:         ENUM              // theme | repetition | exam | private
  size:         INT [1-4]         // Anzahl Blöcke an diesem Tag
  content_id?:  UUID              // Optional: Verknüpfung zu Lerninhalt
  source:       ENUM              // wizard | manual
  // ❌ VERBOTEN: start_time, end_time, duration (NIEMALS Uhrzeiten!)
}
```

**Anzeige:** Monatsansicht zeigt pro Tag farbige Balken/Segmente entsprechend der Block-Größe.

---

#### Entity B: Session (Startseite/Wochenansicht)

**Zweck:** Zeitraum-basierte Planung - "Wann genau lerne ich was?"

```
Session {
  id:           UUID
  start_at:     DATETIME          // z.B. "2026-01-15T09:00:00"
  end_at:       DATETIME          // z.B. "2026-01-15T11:30:00"
  kind:         ENUM              // theme | repetition | exam | private
  title:        STRING
  description?: STRING
  repeat?:      RepeatConfig      // Für Serientermine
  // ❌ VERBOTEN: block_size, block_position (NIEMALS Block-Felder!)
}
```

**Anzeige:** Wochenansicht/Startseite zeigen Sessions im Zeitraster mit exakten Uhrzeiten.

---

#### Entity C: BlockToSessionLink (Optional, für spätere Verbindungen)

```
BlockToSessionLink {
  id:           UUID
  block_id:     UUID → BlockAllocation
  session_id:   UUID → Session
  created_at:   DATETIME
}
```

**Hinweis:** Diese Verbindungstabelle ist optional und wird nur bei expliziter "Umwandlung" angelegt.

---

#### Guard Rules für KI und Validierung

| # | Regel | Prüfung |
|---|-------|---------|
| 1 | View-Context prüfen | Vor Datenzugriff: "Bin ich in Monats- oder Wochenansicht?" |
| 2 | Falsche Felder erkennen | Block mit Uhrzeiten → STOP. Session mit block_size → STOP. |
| 3 | Eigene Aktionen validieren | Nach Code-Generierung: "Habe ich das richtige Entity verwendet?" |
| 4 | Conversion = neue Objekt-Erstellung | Block→Session erzeugt NEUE Session, löscht NICHT den Block |
| 5 | Keine Live-Kopplung | Änderungen an Session aktualisieren NICHT den verlinkten Block |

**API-Validierung:**
```javascript
// Block-Endpoint lehnt Uhrzeiten ab
POST /blocks { date, kind, size, start_time } → 400 Bad Request

// Session-Endpoint lehnt block_size ab
POST /sessions { start_at, end_at, kind, block_size } → 400 Bad Request
```

---

#### Edge Cases und Workarounds

| Case | Problem | Lösung |
|------|---------|--------|
| **EC-1** | User klickt Block in Monatsansicht → will Uhrzeit eintragen | "Details bearbeiten" öffnet neues Session-Formular, Block bleibt unverändert |
| **EC-2** | Block-Größe 2 = 4 Stunden → welche genau? | Default: 09:00-13:00 beim Umwandeln. User kann anpassen. |
| **EC-3** | User löscht Session, die aus Block entstanden ist | Session wird gelöscht. Link wird gelöscht. Block bleibt bestehen. |
| **EC-4** | User ändert Block-Größe 2→3 nachträglich | Nur Block-size ändern. Evtl. existierende Session bleibt unverändert (kein Auto-Resize). |
| **EC-5** | Kalender-Export (iCal) | Nur Sessions exportieren (haben echte Zeiten). Blöcke sind intern. |
| **EC-6** | Statistik/Analytics | Beide separat auswerten: "Geplante Kapazität" (Blöcke) vs. "Tatsächlich geblockt" (Sessions) |
| **EC-7** | Wizard erstellt "08:00-10:00" Vorgabe | Wizard erstellt primär Blöcke (size=1 pro 2h). Vorgabe-Zeiten sind Defaults für spätere Session-Erstellung. |
| **EC-8** | Offline-Sync Konflikt Block vs. Session | Getrennte Sync-Queues. Block-Änderungen ≠ Session-Änderungen. Kein Cross-Entity-Merge. |

---

#### Dialog-Verhalten (mode-Prop)

| Ansicht | Dialog-Mode | UI-Element | Entity | Gespeicherte Daten |
|---------|-------------|------------|--------|-------------------|
| Monatsansicht | `mode="block"` | Block-Größe Selector (1-4) | BlockAllocation | `date`, `kind`, `size` |
| Wochenansicht | `mode="session"` | Uhrzeit-Inputs (Von-Bis) | Session | `start_at`, `end_at`, `kind` |
| Startseite | `mode="session"` | Uhrzeit-Inputs (Von-Bis) | Session | `start_at`, `end_at`, `kind` |

---

#### Prompt-Pattern für KI-Aktionen

```
Vor jeder Kalender-Aktion prüfen:
1. Welche View ist aktiv? → month | week | home
2. month → BlockAllocation (date + kind + size, KEINE Uhrzeiten)
3. week/home → Session (start_at + end_at, KEINE block_size)
4. Conversion explizit? → BlockToSessionLink + neue Session
```

### 3.2 State Management (React Context)

| Context | Beschreibung | Supabase-Sync |
|---------|--------------|---------------|
| `CalendarProvider` | Blöcke, Tasks, Private Sessions, ContentPlans | Ja |
| `TimerProvider` | Timer-Zustand, Sessions | Ja (History) |
| `AuthProvider` | Authentifizierung | Ja |
| `StudiengangProvider` | Studiengang & Hierarchie-Labels | Lokal |
| `AppModeProvider` | Examen vs Normal Modus | Lokal |
| `MentorProvider` | Mentor-Aktivierung | Ja |
| `CheckInProvider` | Check-In Responses | Ja |
| `ExamsProvider` | Leistungen (Normal) | Ja |
| `UebungsklausurenProvider` | Klausuren (Examen) | Ja |
| `OnboardingProvider` | Onboarding-Status | Lokal |

### 3.3 Studiengang-System & Dynamische Hierarchie-Bezeichnungen

**Kernkonzept:** Die App-Bezeichnungen passen sich dynamisch an den gewählten Studiengang an.

#### Unterstützte Studiengänge (20)

| Kategorie | Studiengänge |
|-----------|--------------|
| Recht | Rechtswissenschaften (Jura) |
| Medizin | Medizin, Zahnmedizin, Pharmazie |
| Sozialwiss. | Psychologie, BWL, VWL |
| Informatik | Informatik, Wirtschaftsinformatik |
| Ingenieur | Maschinenbau, Elektrotechnik, Bauingenieurwesen, Architektur |
| Naturwiss. | Physik, Chemie, Biologie, Mathematik |
| Geisteswiss. | Germanistik, Geschichte |
| Pädagogik | Lehramt |

#### Hierarchie-Struktur

| Ebene | Jura (5-stufig) | Andere Studiengänge (4-stufig) |
|-------|-----------------|-------------------------------|
| Level 1 | Rechtsgebiet | Fach |
| Level 2 | Unterrechtsgebiet | Kapitel |
| Level 3 | Kapitel (optional) | Thema |
| Level 4 | Thema | Aufgabe |
| Level 5 | Aufgabe | - |

**Hinweis:** Die Kapitel-Ebene (Level 3) ist nur für Jura-Studierende verfügbar und kann in den Einstellungen aktiviert/deaktiviert werden.

#### Implementierung

```javascript
// src/data/studiengaenge.js
export const JURA_HIERARCHY = {
  level1: 'Rechtsgebiet', level1Plural: 'Rechtsgebiete',
  level2: 'Unterrechtsgebiet', level2Plural: 'Unterrechtsgebiete',
  level3: 'Kapitel', level3Plural: 'Kapitel',
  level4: 'Thema', level4Plural: 'Themen',
  level5: 'Aufgabe', level5Plural: 'Aufgaben',
};

export const DEFAULT_HIERARCHY = {
  level1: 'Fach', level1Plural: 'Fächer',
  level2: 'Kapitel', level2Plural: 'Kapitel',
  level3: 'Thema', level3Plural: 'Themen',
  level4: 'Aufgabe', level4Plural: 'Aufgaben',
};

// Hook-Verwendung in Komponenten:
const { level1, level2, level3, level4, isJura } = useHierarchyLabels();
```

#### Dateien

| Datei | Zweck |
|-------|-------|
| `src/data/studiengaenge.js` | Studiengänge-Daten & Hierarchie-Definitionen |
| `src/contexts/studiengang-context.jsx` | React Context für Studiengang-State |
| `src/hooks/use-hierarchy-labels.js` | Hook für einfachen Label-Zugriff |

#### Onboarding-Flow

1. Neuer Benutzer startet Onboarding
2. Nach Feature-Tour → Weiterleitung zu `/einstellungen?setup=studiengang`
3. Info-Banner zeigt "Studiengang auswählen"
4. Nach Auswahl: Normale App-Nutzung mit angepassten Labels

### 3.4 Persistenz-Strategie

```
Supabase (Primary) ←→ LocalStorage (Fallback/Cache)
                   ↓
              Offline-fähig
```

---

## 4. Seitenstruktur

| Route | Seite | Beschreibung |
|-------|-------|--------------|
| `/` | Dashboard | Tagesübersicht mit Widgets |
| `/onboarding` | Onboarding | Willkommens-Flow für neue User |
| `/lernplan` | Lernpläne | Übersicht aller Pläne |
| `/lernplan/erstellen` | Wizard | 10-Schritte Lernplan-Erstellung |
| `/kalender/woche` | Wochenansicht | Detaillierte Wochenplanung |
| `/kalender/monat` | Monatsansicht | Übersichtskalender |
| `/verwaltung/leistungen` | Leistungen | Klausuren & Noten |
| `/verwaltung/aufgaben` | Aufgaben | Aufgabenverwaltung |
| `/einstellungen` | Einstellungen | App-Konfiguration (inkl. Studiengang-Auswahl) |
| `/mentor` | Mentor | Statistik-Dashboard |
| `/profil` | Profil | Benutzerprofil |

---

## 5. Features im Detail

### 5.1 Lernplan-Wizard (10 Schritte)

| Schritt | Funktion |
|---------|----------|
| 1 | Lernzeitraum (Start/Ende) |
| 2 | Puffertage |
| 3 | Urlaubstage markieren |
| 4 | Tagesblöcke (1-4) |
| 5 | Wochenstruktur |
| 6 | Erstellungsmethode (Manual/Auto/Vorlage/KI) |
| 7 | Themenverteilung |
| 8 | Kalendervorschau |
| 9 | Feinabstimmung |
| 10 | Abschluss |

**Wizard-Draft:** Automatisches Speichern alle 500ms zu Supabase.

### 5.2 Kalender-Feature

**Blocktypen:**
| Typ | Farbe | Wiederholung |
|-----|-------|--------------|
| Tagesthema | Rechtsgebiet-Farbe | Ja |
| Wiederholung | Orange | Ja |
| Klausur | Rot | Ja |
| Privat | Grau | Ja |
| Freizeit | Grün | Ja |

**Serientermine:** Täglich, Wöchentlich, Monatlich, Benutzerdefiniert (Wochentage)

### 5.3 Timer-System

| Modus | Beschreibung |
|-------|--------------|
| Pomodoro | 25 Min Arbeit + 5 Min Pause (konfigurierbar) |
| Countdown | Individuelle Zeit |
| Count-up | Stoppuhr ohne Limit |

**Logbuch:** Manuelle Zeiterfassung für vergangene Aktivitäten.

### 5.4 Dashboard Widgets

- **Session-Widget:** Aktuelle/nächste Session
- **Zeitplan-Widget:** Stunden-Übersicht mit rotem Zeitpunkt-Dot
- **Aufgaben-Widget:** Tagesaufgaben mit Prioritäten
- **Timer-Widget:** Schnellzugriff auf Timer
- **Fortschritts-Widget:** Tagesziel-Anzeige

### 5.5 Mentor & Statistiken

**Aktivierung:** Dialog beim ersten Besuch

**Metriken:**
- Lernzeit (Ø pro Tag/Woche, Gesamt)
- Produktivste Tageszeit
- Fächer-Verteilung
- Aufgaben-Erledigungsrate
- Streak-Tage
- Timer-Sessions

**Visualisierungen:**
- Performance-Heatmap (30 Tage)
- Jahresansicht (12 Monate)
- WellScore (Radial Chart)
- Liniendiagramme für Trends

### 5.6 Check-In System

| Zeitpunkt | Erfassung |
|-----------|-----------|
| Morgens | Stimmung, Energielevel, Fokus, Tagesziele |
| Abends | Reflexion, Erfolge, Herausforderungen |

### 5.7 App-Modus

| Modus | Aktivierung | Features |
|-------|-------------|----------|
| Examen | Aktiver Lernplan vorhanden | Voller Umfang |
| Normal | Kein Lernplan | Reduziert (keine Lernpläne-Nav) |

---

## 6. Supabase-Integration

### 6.1 Tabellen-Status

| Tabelle | Context | Status |
|---------|---------|--------|
| `users` | AuthContext | Aktiv |
| `user_settings` | Mehrere | Aktiv |
| `content_plans` | CalendarContext | Aktiv |
| `calendar_blocks` | CalendarContext | Aktiv |
| `calendar_tasks` | CalendarContext | Aktiv |
| `private_sessions` | CalendarContext | Aktiv |
| `time_sessions` | CalendarContext | Aktiv |
| `archived_lernplaene` | CalendarContext | Aktiv |
| `published_themenlisten` | CalendarContext | Aktiv |
| `wizard_drafts` | WizardContext | Aktiv |
| `timer_sessions` | TimerContext | Aktiv |
| `checkin_responses` | CheckInContext | Aktiv |
| `leistungen` | ExamsContext | Aktiv |
| `uebungsklausuren` | UebungsklausurenContext | Aktiv |
| `logbuch_entries` | LogbuchContext | Aktiv |

### 6.2 Sync-Hooks

Alle in `src/hooks/use-supabase-sync.js`:
- `useSupabaseSync` - Generischer Hook
- `useContentPlansSync`
- `useCalendarBlocksSync`
- `useCalendarTasksSync`
- `usePrivateSessionsSync`
- `useTimeSessionsSync`
- `useTimerHistorySync`
- `useCheckInSync`
- `useLogbuchSync`
- ... und weitere

### 6.3 Schema

Idempotentes Schema in `supabase/schema.sql`:
- Kann mehrfach ausgeführt werden ohne Fehler
- Row Level Security (RLS) für alle Tabellen
- Trigger für `updated_at` Timestamps

---

## 7. Projektstruktur

```
src/
├── pages/              # 11 Seitenkomponenten
├── components/         # UI-Komponenten
│   ├── layout/         # Header, Nav, Sidebar
│   ├── ui/             # Button, Dialog, Badge, etc.
│   ├── dashboard/      # Dashboard-Widgets
│   │   └── timer/      # Timer-Dialoge
│   ├── charts/         # RadialChart, LineChart
│   ├── mentor/         # Mentor-Dashboard
│   └── ...
├── features/           # Feature-Module
│   ├── calendar/       # Kalender-Feature
│   └── lernplan-wizard/# Wizard-Feature
├── contexts/           # 11+ React Contexts
│   ├── studiengang-context.jsx  # NEU: Studiengang & Labels
│   └── ...
├── hooks/              # Custom Hooks
│   ├── use-supabase-sync.js     # Supabase-Sync
│   ├── use-hierarchy-labels.js  # NEU: Dynamische Labels
│   └── ...
├── services/           # API-Services
├── data/               # Statische Daten
│   ├── unterrechtsgebiete-data.js  # Rechtsgebiete
│   ├── studiengaenge.js            # NEU: 20 Studiengänge
│   └── ...
└── utils/              # Hilfsfunktionen
```

---

## 8. Design System

### Farben (Rechtsgebiete/Fächer)
| Rechtsgebiet (Jura) / Fach (Andere) | Farbe |
|-------------------------------------|-------|
| Öffentliches Recht / Fach 1 | Grün (#10B981) |
| Zivilrecht / Fach 2 | Blau (#3B82F6) |
| Strafrecht / Fach 3 | Rot (#EF4444) |
| Querschnittsrecht / Fach 4 | Violett (#8B5CF6) |

### Dynamische Bezeichnungen

Die UI-Texte werden über den `useHierarchyLabels()` Hook dynamisch generiert:

```jsx
// Beispiel: Button-Text
<button>+ {level1}</button>
// Jura: "+ Rechtsgebiet"
// BWL:  "+ Fach"

// Beispiel: Überschrift
<h4>{level2Plural} & Inhalte</h4>
// Jura: "Unterrechtsgebiete & Inhalte"
// BWL:  "Kapitel & Inhalte"
```

### Typografie
- **Font:** DM Sans
- **H1:** 24px, Extralight (200)
- **Body:** 16px, Normal (400)

### Komponenten
- Buttons: primary, default, ghost, icon
- Dialoge: Modal mit Overlay
- Badges: default, primary, outline

---

## 9. Externe Abhängigkeiten

- **Supabase:** Datenbank & Auth
- **Vercel:** Hosting & Serverless Functions
- **OpenAI:** KI-Lernplan-Generierung (optional)

---

## 10. Bekannte Limitierungen

1. **Offline:** LocalStorage-Fallback vorhanden, aber kein vollständiger Offline-Modus
2. **Mobile:** Desktop-first, Tablet-Support, Mobile eingeschränkt
3. **Realtime:** Kein Echtzeit-Sync zwischen Tabs/Geräten
4. **Backend:** Supabase als Zwischenlösung (Migration geplant)

---

# Teil 2: Bugs & Funktionstest

---

## 11. Bekannte Bugs

### 11.1 Kritisch (Blocker)

| ID | Bug | Bereich | Status |
|----|-----|---------|--------|
| - | Keine kritischen Bugs bekannt | - | - |

### 11.2 Hoch (Funktionalität beeinträchtigt)

| ID | Bug | Bereich | Status |
|----|-----|---------|--------|
| BUG-001 | ESLint-Fehler blockieren Commits | Build | Offen |
| BUG-002 | Unused imports in vielen Dateien | Code Quality | Offen |

### 11.3 Mittel (Funktioniert, aber nicht optimal)

| ID | Bug | Bereich | Status |
|----|-----|---------|--------|
| BUG-010 | React Hook Dependency Warnings | Performance | Offen |
| BUG-011 | Fast refresh Warnungen bei Context-Exporten | DevExp | Offen |
| BUG-012 | Chunk size > 500kb Warnung beim Build | Bundle | Offen |

### 11.4 Niedrig (Kosmetisch/Minor)

| ID | Bug | Bereich | Status |
|----|-----|---------|--------|
| BUG-020 | LF/CRLF Git Warnungen (Windows) | Git | Offen |

---

## 12. Funktionstest-Checkliste

### 12.1 Authentifizierung

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Login mit Email/Passwort | Erfolgreich einloggen | [ ] | - |
| Registrierung | Account erstellen | [ ] | - |
| Logout | Session beenden, Redirect | [ ] | - |
| Session Persistenz | Nach Reload eingeloggt bleiben | [ ] | - |
| Protected Routes | Redirect zu Login wenn nicht auth | [ ] | - |

### 12.2 Dashboard

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Session-Widget zeigt aktuelle Session | Korrekte Session für aktuelle Zeit | [ ] | - |
| Zeitplan-Widget mit rotem Dot | Dot bewegt sich mit Uhrzeit | [ ] | - |
| Aufgaben-Widget zeigt Tagesaufgaben | Aufgaben für heute sichtbar | [ ] | - |
| Timer-Widget funktioniert | Alle 3 Modi starten | [ ] | - |
| Tagesziel berechnet korrekt | Basiert auf Blöcken des Tages | [ ] | - |

### 12.3 Lernplan-Wizard

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Schritt 1-10 durchlaufen | Alle Schritte erreichbar | [ ] | - |
| Draft wird automatisch gespeichert | Nach 500ms zu Supabase | [ ] | - |
| Zurück-Navigation | Vorherige Schritte behalten Daten | [ ] | - |
| Wizard abschließen | Lernplan wird erstellt | [ ] | - |
| KI-Generierung | OpenAI generiert Plan | [ ] | - |

### 12.4 Kalender

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Monatsansicht Navigation | Vor/Zurück funktioniert | [ ] | - |
| Wochenansicht Navigation | Vor/Zurück funktioniert | [ ] | - |
| Block erstellen (Tagesthema) | Block erscheint im Kalender | [ ] | - |
| Block erstellen (Privat) | Privater Block erscheint | [ ] | - |
| Serientermin erstellen (täglich) | Mehrere Blöcke erstellt | [ ] | - |
| Serientermin erstellen (wöchentlich) | Blöcke im Wochenrhythmus | [ ] | - |
| Serientermin erstellen (monatlich) | Blöcke im Monatsrhythmus | [ ] | - |
| Serientermin erstellen (custom) | Blöcke an gewählten Tagen | [ ] | - |
| Block bearbeiten | Änderungen gespeichert | [ ] | - |
| Block löschen | Block entfernt | [ ] | - |
| Serie löschen | Alle Blöcke der Serie entfernt | [ ] | - |

### 12.5 Aufgaben

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Aufgabe erstellen | Neue Aufgabe erscheint | [ ] | - |
| Aufgabe abhaken | Status ändert sich | [ ] | - |
| Priorität ändern | Priorität aktualisiert | [ ] | - |
| Aufgabe löschen | Aufgabe entfernt | [ ] | - |
| Aufgabe zu Block zuordnen | Verknüpfung funktioniert | [ ] | - |

### 12.6 Timer

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Pomodoro starten | 25 Min Timer läuft | [ ] | - |
| Pomodoro Pause | 5 Min Pause startet | [ ] | - |
| Countdown starten | Gewählte Zeit läuft ab | [ ] | - |
| Count-up starten | Zeit zählt hoch | [ ] | - |
| Timer pausieren | Timer hält an | [ ] | - |
| Timer fortsetzen | Timer läuft weiter | [ ] | - |
| Timer beenden | Session wird gespeichert | [ ] | - |
| Logbuch Eintrag | Manuelle Zeit erfasst | [ ] | - |

### 12.7 Mentor & Check-In

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Mentor aktivieren | Dialog erscheint, Aktivierung | [ ] | - |
| Check-In morgens | Formular ausfüllbar | [ ] | - |
| Check-In abends | Formular ausfüllbar | [ ] | - |
| Statistiken anzeigen | Daten korrekt berechnet | [ ] | - |
| Heatmap funktioniert | Farben korrekt | [ ] | - |

### 12.8 Leistungen/Übungsklausuren

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Klausur hinzufügen | Eintrag erscheint | [ ] | - |
| Klausur bearbeiten | Änderungen gespeichert | [ ] | - |
| Klausur löschen | Eintrag entfernt | [ ] | - |
| Notensystem Punkte | 0-18 Punkte funktioniert | [ ] | - |
| Notensystem Noten | 1.0-5.0 funktioniert | [ ] | - |
| Auswertung (Examen) | Diagramme anzeigen | [ ] | - |

### 12.9 Supabase Sync

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Daten laden bei Login | Supabase-Daten erscheinen | [ ] | - |
| Änderungen speichern | Zu Supabase synchronisiert | [ ] | - |
| Offline-Fallback | LocalStorage funktioniert | [ ] | - |
| Migration LocalStorage → Supabase | Alte Daten übernommen | [ ] | - |

### 12.10 Themenlisten

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Themenliste erstellen | Neue Liste erscheint | [ ] | - |
| Themen hinzufügen | Themen in Liste | [ ] | - |
| Template importieren | Vordefinierte Liste | [ ] | - |
| JSON exportieren | Datei heruntergeladen | [ ] | - |
| JSON importieren | Liste importiert | [ ] | - |
| Community veröffentlichen | Liste in Community | [ ] | - |

---

## 13. Code Quality Tasks

### 13.1 ESLint Fixes (Priorität: Hoch)

```bash
# Betroffene Dateien (49 Errors, 27 Warnings):
src/components/common/loading-screen.jsx
src/components/dashboard/timer/countdown-settings-dialog.jsx
src/components/dashboard/timer/pomodoro-settings-dialog.jsx
src/components/dashboard/timer/timer-logbuch-dialog.jsx
src/components/dashboard/timer/timer-main-dialog.jsx
src/components/dashboard/timer/timer-selection-dialog.jsx
src/components/dashboard/zeitplan-widget.jsx
src/components/layout/profile-icon.jsx
src/contexts/calendar-context.jsx
src/contexts/onboarding-context.jsx
src/features/calendar/components/calendar-view.jsx
src/hooks/use-dashboard.js
src/hooks/use-supabase-sync.js
src/pages/dashboard.jsx
src/pages/onboarding.jsx
src/pages/profil.jsx
```

**Häufigste Fehler:**
- `'React' is defined but never used` - React 17+ JSX Transform
- `'X' is assigned a value but never used` - Unused destructuring
- React Hook dependency warnings

### 13.2 Bundle Optimierung (Priorität: Mittel)

Aktuell: 1,466 kB (gzip: 368 kB)
Ziel: < 500 kB

**Optionen:**
- [ ] Code-Splitting mit dynamic imports
- [ ] Tree-shaking verbessern
- [ ] Große Dependencies analysieren

---

## 14. Priorisierte Aufgabenliste

### Sofort

1. [ ] ESLint-Fehler in geänderten Dateien fixen
2. [ ] Unused imports entfernen (React, etc.)
3. [ ] Serientermine testen (neues Feature)

### Diese Woche

4. [ ] Alle Funktionstests durchführen
5. [ ] React Hook Dependency Warnungen fixen
6. [ ] Supabase Sync validieren

### Später

7. [ ] Bundle-Größe optimieren
8. [ ] Performance-Profiling
9. [ ] Accessibility-Audit

---

## 15. Test-Protokoll

| Datum | Tester | Bereich | Ergebnis | Notizen |
|-------|--------|---------|----------|---------|
| - | - | - | - | - |

---

# Teil 3: Roadmap

---

## 16. Strategische Ziele

1. **Eigenes Backend** - Migration von Supabase zu eigenem TypeScript-Backend
2. **Mobile App** - React Native Version für iOS/Android
3. **Community Features** - Lerngruppen, geteilte Inhalte
4. **Premium-Modell** - Monetarisierung durch erweiterte Features

---

## 17. Phasen-Übersicht

```
Q1 2026: Stabilisierung & Backend-Planung
Q2 2026: Backend-Migration Phase 1
Q3 2026: Backend-Migration Phase 2 + Mobile
Q4 2026: Community & Premium Features
```

---

## 18. Phase 1: Stabilisierung (Q1 2026)

### 18.1 Technische Schulden

| Task | Priorität | Aufwand |
|------|-----------|---------|
| ESLint-Fehler komplett beheben | Hoch | 2-3h |
| Bundle-Größe optimieren (< 500kb) | Mittel | 4-6h |
| TypeScript Migration starten | Mittel | 20-40h |
| Test-Suite aufbauen (Jest/Vitest) | Mittel | 10-20h |
| E2E Tests (Playwright/Cypress) | Niedrig | 10-15h |

### 18.2 UX-Verbesserungen

| Feature | Beschreibung | Aufwand |
|---------|--------------|---------|
| Mobile Optimierung | Responsive für < 768px | 10-15h |
| Keyboard Shortcuts | Schnellnavigation | 4-6h |
| Dark Mode | Dunkles Farbschema | 6-8h |
| Loading States | Skeleton Screens | 4-6h |
| Error Boundaries | Bessere Fehlerbehandlung | 3-4h |

### 18.3 Backend-Vorbereitung

| Task | Beschreibung |
|------|--------------|
| API-Spezifikation | OpenAPI/Swagger Schema definieren |
| Datenmodell finalisieren | ERD für eigenes Backend |
| Auth-Strategie | JWT vs Session-based |
| Hosting evaluieren | Railway, Render, Fly.io, etc. |

---

## 19. Phase 2: Eigenes Backend (Q2-Q3 2026)

### 19.1 Technologie-Stack (Vorschlag)

| Komponente | Option A | Option B |
|------------|----------|----------|
| Runtime | Node.js | Bun |
| Framework | Express.js | Hono |
| ORM | Prisma | Drizzle |
| Datenbank | PostgreSQL | PostgreSQL |
| Auth | Passport.js | Lucia |
| Validation | Zod | Zod |
| API Style | REST | tRPC |

### 19.2 Migration von Supabase

**Phase 2a: Parallelbetrieb**
1. Eigenes Backend aufsetzen
2. Doppelte Schreibvorgänge (Supabase + Eigenes)
3. Lesevorgänge noch von Supabase
4. Datenintegrität validieren

**Phase 2b: Umstellung**
1. Lesevorgänge auf eigenes Backend
2. Supabase nur noch Backup
3. Supabase-Hooks entfernen
4. Auth-Migration (eigene User-Tabelle)

**Phase 2c: Cleanup**
1. Supabase komplett entfernen
2. LocalStorage-Fallback anpassen
3. Dokumentation aktualisieren

### 19.3 Neue API-Struktur

```
/api/v1/
├── auth/
│   ├── login
│   ├── register
│   ├── logout
│   └── refresh
├── users/
│   ├── me
│   └── settings
├── lernplaene/
│   ├── [id]
│   └── [id]/blocks
├── calendar/
│   ├── blocks
│   ├── tasks
│   └── private-sessions
├── timer/
│   ├── sessions
│   └── logbuch
├── leistungen/
└── community/
    └── themenlisten
```

---

## 20. Phase 3: Mobile App (Q3-Q4 2026)

### 20.1 Optionen

| Option | Vorteile | Nachteile |
|--------|----------|-----------|
| React Native | Code-Sharing, bekanntes Ökosystem | Performance |
| Expo | Schneller Start, OTA Updates | Limitierungen |
| PWA | Kein App Store, Web-Codebase | Weniger native Features |
| Flutter | Performance, eine Codebase | Neues Framework lernen |

**Empfehlung:** Expo (React Native) für maximales Code-Sharing

### 20.2 Mobile-First Features

| Feature | Beschreibung |
|---------|--------------|
| Push Notifications | Timer-Erinnerungen, Check-In |
| Offline-First | Vollständiger Offline-Modus |
| Quick Actions | Widgets, App Shortcuts |
| Biometric Auth | Face ID, Fingerprint |
| Apple Watch/WearOS | Timer auf Smartwatch |

---

## 21. Phase 4: Community & Premium (Q4 2026)

### 21.1 Community Features

| Feature | Beschreibung | Aufwand |
|---------|--------------|---------|
| Lerngruppen | Gemeinsame Lernpläne | 40-60h |
| Geteilte Themenlisten | Cloud-basierte Bibliothek | 20-30h |
| Leaderboards | Gamification (opt-in) | 15-20h |
| Chat/Nachrichten | Kommunikation in Gruppen | 30-40h |
| Mentoring | Erfahrene helfen Anfängern | 20-30h |

### 21.2 Premium Features (Monetarisierung)

| Tier | Features | Preis |
|------|----------|-------|
| Free | Basis-Features, 1 Lernplan | 0€ |
| Pro | Unbegrenzte Pläne, Statistiken | 5€/Monat |
| Team | Lerngruppen, Shared Plans | 10€/Monat |

**Premium-exklusive Features:**
- Erweiterte Statistiken & Trends
- KI-Lernplan-Generierung (unbegrenzt)
- Cloud-Sync über Geräte
- Prioritäts-Support
- Früher Zugang zu neuen Features

### 21.3 Rechtsdatenbank-Integration

| Integration | Beschreibung |
|-------------|--------------|
| Beck Online | Direkte Links zu Kommentaren |
| Juris | Rechtsprechungssuche |
| Alpmann Schmidt | Lernmaterial-Verknüpfung |

---

## 22. Technische Roadmap

### 22.1 Infrastruktur

```
Aktuell:
[Vercel CDN] → [React SPA] → [Supabase]



### 22.2 CI/CD Pipeline

| Phase | Tool | Beschreibung |
|-------|------|--------------|
| Lint | ESLint | Code-Qualität |
| Type Check | TypeScript | Typ-Sicherheit |
| Unit Tests | Vitest | Komponenten-Tests |
| E2E Tests | Playwright | User-Flow Tests |
| Build | Vite | Production Build |
| Deploy | Vercel/Railway | Automatisches Deployment |

### 22.3 Monitoring & Analytics

| Tool | Zweck |
|------|-------|
| Sentry | Error Tracking |
| PostHog | Product Analytics |
| Uptime Robot | Availability Monitoring |
| Grafana | Backend Metrics |

---

## 23. Risiken & Mitigationen


---

# Teil 4: Architektur-Analyse (Januar 2026)

---

## 24. Analyse-Übersicht

Diese Analyse wurde durchgeführt um die Ursachen für wiederkehrende Bugs zu identifizieren.
Die meisten Bugs in der To-Do-Liste sind **Symptome tieferliegender Architektur-Probleme**.

### Analysierte Bereiche

| Bereich | Status | Kritische Probleme |
|---------|--------|-------------------|
| Slot/Block-Modell | ⚠️ Unklar | Konzepte vermischt |
| Serientermine | 🔴 Kritisch | Datenverlust nach Reload |
| Kalender-Views | 🟠 Inkonsistent | Monat ≠ Woche |
| Examenmodus | ⚠️ Unvollständig | Keine manuelle Kontrolle |

---

## 25. Block/Session/Content-Modell

### 25.1 Aktuelle Struktur

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DATENMODELL                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  calendar_blocks (Supabase)         private_sessions (Supabase)     │
│  ─────────────────────────          ────────────────────────        │
│  • 4 Positionen pro Tag             • Freie Uhrzeiten               │
│  • position: 1-4                    • start_time / end_time         │
│  • session_type: lernblock|exam|rep • session_type: immer 'private' │
│  • content_id → verweist auf        • Eigenständig (kein Content)   │
│    Themenlisten-Inhalt              • Wiederholung möglich          │
│  • Wiederholung möglich                                              │
│           │                                    │                     │
│           ▼                                    ▼                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   CalendarContext                            │    │
│  │  • blocksByDate: { "2026-01-02": [block1, block2, ...] }    │    │
│  │  • privateSessionsByDate: { "2026-01-02": [session1, ...] } │    │
│  │  • contentsById: { "content-123": { title, ... } }          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                         │                                            │
│                         ▼                                            │
│               buildSessionFromBlock()                                │
│               ─────────────────────                                  │
│               Block + Content = Display-Session                      │
│                         │                                            │
│                         ▼                                            │
│  ┌─────────────┐              ┌─────────────┐                       │
│  │ Monatsansicht│              │ Wochenansicht│                       │
│  │ (Positionen) │              │ (Uhrzeiten)  │                       │
│  └─────────────┘              └─────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 25.2 Position → Uhrzeit Mapping

| Position | Startzeit | Endzeit | Dauer |
|----------|-----------|---------|-------|
| 1 | 08:00 | 10:00 | 2h |
| 2 | 10:00 | 12:00 | 2h |
| 3 | 14:00 | 16:00 | 2h |
| 4 | 16:00 | 18:00 | 2h |

**Problem:** Wenn `hasTime: true`, können Blöcke benutzerdefinierte Zeiten haben, die von Positionen abweichen.

### 25.3 Identifizierte Probleme

| Problem | Schweregrad | Auswirkung |
|---------|-------------|------------|
| `topicId` vs `contentId` vs `id` | 🟠 Hoch | Inkonsistentes ID-Matching |
| `title` vs `topicTitle` | 🟡 Mittel | Doppelte Felder |
| Block ≠ Session nicht klar definiert | 🟠 Hoch | Verwirrende Begriffe im Code |
| Private Sessions haben kein `position` | 🟡 Mittel | Unterschiedliche Zeitlogik |

### 25.4 Empfohlene Lösung

**Einheitliches Session-Interface:**

```typescript
interface CalendarSession {
  id: string;
  type: 'lernblock' | 'repetition' | 'exam' | 'private';

  // Zeit
  date: string;              // YYYY-MM-DD
  startTime: string;         // HH:MM
  endTime: string;           // HH:MM
  position?: 1 | 2 | 3 | 4;  // Optional für Lern-Sessions

  // Inhalt
  title: string;
  contentId?: string;        // Nur für Lern-Sessions
  rechtsgebiet?: string;
  unterrechtsgebiet?: string;

  // Serie
  seriesId?: string;
  repeatEnabled: boolean;
  repeatType?: 'daily' | 'weekly' | 'monthly' | 'custom';
  repeatCount?: number;
  customDays?: number[];

  // Meta
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 26. Serientermine - KRITISCH

### 26.1 Aktueller Zustand

**Implementierungsmodell:** "Explosions-Modell"
- Jede Wiederholung wird als **separate Datenbankzeile** gespeichert
- Alle Einträge einer Serie teilen sich eine `seriesId`
- Original-Block hat `repeatEnabled: true`, Kopien haben `repeatEnabled: false`

### 26.2 Kritische Datenlücken

| Feld | Frontend | Supabase Schema | Status |
|------|----------|-----------------|--------|
| `series_id` | ✅ Verwendet | ❌ FEHLT | 🔴 Datenverlust |
| `custom_days` | ✅ Verwendet | ❌ FEHLT | 🔴 Datenverlust |
| `repeat_enabled` | ✅ | ✅ | OK |
| `repeat_type` | ✅ | ✅ | OK |
| `repeat_count` | ✅ | ✅ | OK |

**Auswirkung:** Nach Browser-Reload sind Serien-Verbindungen verloren!

### 26.3 Datenverlust-Szenarien

```
Szenario 1: Benutzer erstellt Serientermin
├─ Frontend: Erstellt 20 Sessions mit seriesId
├─ Supabase-Sync: Speichert OHNE seriesId (Feld fehlt!)
├─ Browser-Reload: Sessions geladen, aber Serie-Info verloren
└─ Ergebnis: 20 einzelne Sessions statt 1 Serie ❌

Szenario 2: Benutzer löscht eine Session
├─ handleDelete() löscht nur DIESE Session
├─ Die anderen 19 Sessions der Serie bleiben
└─ Ergebnis: Verwaiste Sessions ohne Zusammenhang ❌
```

### 26.4 Fehlende UI-Logik

| Feature | Status | Impact |
|---------|--------|--------|
| "Nur diese" vs. "Ganze Serie" Dialog | ❌ Fehlt | User kann Serie nicht steuern |
| Visuelle Kennzeichnung von Serien | ❌ Fehlt | User erkennt Wiederholungen nicht |
| `deleteSeriesPrivateSessions()` | ⚠️ Dead Code | Existiert, wird nie aufgerufen |
| Update-Logik für Serien | ❌ Fehlt | Keine Massen-Änderung möglich |

### 26.5 Erforderliche Schema-Erweiterung

```sql
-- SOFORT erforderlich:
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS series_id UUID;
ALTER TABLE private_sessions ADD COLUMN IF NOT EXISTS custom_days JSONB;

ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS series_id UUID;
ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS custom_days JSONB;

-- Indizes für Performance:
CREATE INDEX IF NOT EXISTS idx_private_sessions_series_id ON private_sessions(series_id);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_series_id ON calendar_blocks(series_id);
```
