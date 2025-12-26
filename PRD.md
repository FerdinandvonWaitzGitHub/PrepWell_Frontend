# Product Requirements Document (PRD)
# PrepWell WebApp

**Version:** 1.2
**Datum:** 26. Dezember 2025
**Status:** MVP Development

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
| Backend (Dev) | Express | 5.2.1 |
| KI-Integration | OpenAI API | - |
| Deployment | Vercel | - |

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

**Persistenz:** LocalStorage für alle Daten (offline-fähig)

**LocalStorage-Keys:**
| Key | Inhalt |
|-----|--------|
| `prepwell_calendar_slots` | Kalender-Slots |
| `prepwell_contents` | Content-Objekte |
| `prepwell_tasks` | Aufgaben |
| `prepwell_content_plans` | Lernpläne/Themenlisten |
| `prepwell_published_themenlisten` | Veröffentlichte Community-Themenlisten |
| `prepwell_timer_settings` | Timer-Einstellungen |
| `prepwell_timer_history` | Timer-Session-Historie |
| `prepwell_mentor_activated` | Mentor-Aktivierungsstatus |
| `prepwell_checkin_responses` | Check-In Antworten |
| `prepwell_exams` | Klausuren (Normal-Modus) |
| `prepwell_uebungsklausuren` | Übungsklausuren (Examen-Modus) |
| `prepwell_custom_subjects` | Benutzerdefinierte Fächer |
| `prepwell_grade_system` | Bevorzugtes Notensystem |

### 3.3 Projektstruktur

```
src/
├── pages/              # Seitenkomponenten
├── components/         # UI-Komponenten
│   ├── layout/         # Header, Navigation, Layout
│   ├── ui/             # Wiederverwendbare UI-Elemente
│   ├── dashboard/      # Dashboard-spezifisch
│   ├── lernplan/       # Lernplan-Komponenten
│   └── verwaltung/     # Verwaltungs-Komponenten
├── features/           # Feature-Module
│   ├── calendar/       # Kalender-Feature
│   └── lernplan-wizard/# Wizard-Feature
├── contexts/           # React Context
├── hooks/              # Custom Hooks
├── services/           # API-Services
├── data/               # Statische Daten
└── utils/              # Hilfsfunktionen
```

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

### 7.1 Lokaler Entwicklungsserver

**Base URL:** `http://localhost:3010`

### 7.2 Endpoints

**Lernpläne:**
```
GET    /api/lernplaene         # Alle Lernpläne
GET    /api/lernplaene/:id     # Einzelner Lernplan
POST   /api/lernplaene         # Neuer Lernplan
PUT    /api/lernplaene/:id     # Lernplan aktualisieren
DELETE /api/lernplaene/:id     # Lernplan löschen
```

**Kalender:**
```
GET    /api/kalender/:lernplanId/slots     # Alle Slots
PUT    /api/kalender/:lernplanId/slots     # Slots aktualisieren
PATCH  /api/kalender/:lernplanId/slot/:id  # Einzelner Slot
```

**Aufgaben:**
```
GET    /api/aufgaben           # Alle Aufgaben
POST   /api/aufgaben           # Neue Aufgabe
PUT    /api/aufgaben/:id       # Aufgabe aktualisieren
DELETE /api/aufgaben/:id       # Aufgabe löschen
```

**KI-Generierung:**
```
POST   /api/generate-plan      # KI-Lernplan generieren
```

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

### 9.2 In Entwicklung (🔄)
- [ ] Backend-API-Integration
- [ ] Benutzerauthentifizierung
- [ ] Echte OpenAI-Integration
- [ ] Mobile Optimierung

### 9.3 Geplant (📋)
- [ ] Echtzeit-Synchronisation
- [ ] Offline-Modus mit Sync
- [ ] Erweiterte Analytik
- [ ] Lerngruppen-Feature
- [ ] Integration mit Rechtsdatenbanken
- [ ] Mobile App (React Native)

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
