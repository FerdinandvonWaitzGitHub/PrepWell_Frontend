# PrepWell - Product Requirements Document

**Version:** 3.1
**Stand:** 23. Januar 2026
**Status:** MVP mit Supabase-Integration, T27 Themenliste Redesign abgeschlossen

---

# Teil 1: Aktueller Stand

---

## 1. Produktbeschreibung

PrepWell ist eine webbasierte Lernmanagement-Plattform für Studierende zur strukturierten Prüfungsvorbereitung. Die App unterstützt 20 verschiedene Studiengänge mit dynamischen Bezeichnungen, wobei Jurastudierende zusätzliche Features für die Staatsexamensvorbereitung erhalten.

### Kernfunktionen
- Personalisierte Lernpläne mit Wizard (5 Pfade, bis zu 22 Schritte)
- Kalender mit Monats- und Wochenansicht
- Timer-System (Pomodoro, Countdown, Count-up)
- Aufgabenverwaltung mit Block-Zuordnung
- Themenlisten mit hierarchischer Struktur
- Statistik-Dashboard (Mentor)
- Check-In System (Morgens/Abends)
- **App-Modus:** Examen vs. Normal mit automatischer Archivierung
- **Dashboard-Toggle:** To-Dos / Themenliste Umschaltung

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

### 2.1 Development & Deployment Prozess

**Ziel:** Aktive Nutzer vor schlechter User Experience schützen, während iterative Entwicklung ermöglicht wird.

#### Branch-Strategie

```
main (Production)     ← Nur stabile, getestete Features
  ↑
develop (Staging)     ← Aktive Entwicklung, Tests
  ↑
feature/xyz           ← Einzelne Features/Fixes
```

| Branch | Zweck | Auto-Deploy |
|--------|-------|-------------|
| `main` | Production (Vercel) - Nutzer sehen nur das | Ja → prepwell.vercel.app |
| `develop` | Staging/Testing - Entwickler testen hier | Optional → prepwell-dev.vercel.app |
| `feature/*` | Feature-Branches für größere Änderungen | Nein |

#### Deployment-Regeln

| Kategorie | Beispiel | Push zu main? |
|-----------|----------|---------------|
| **Hotfix** | Kritischer Bug, App unbenutzbar | ✅ Sofort |
| **Bugfix** | Kleiner Bug, App funktioniert | ⚠️ Nach Test auf develop |
| **Feature** | Neue Funktion | ❌ Erst auf develop testen |
| **Refactoring** | Code-Cleanup, kein UI-Change | ⚠️ Nach Test auf develop |
| **DB-Migration** | Schema-Änderung | ❌ Koordiniert mit Nutzer |

#### Checkliste vor Production-Push

```
□ Feature auf localhost getestet
□ Keine Console-Errors
□ Alle Unit-Tests grün (npm run test:run)
□ DB-Migration vorbereitet (falls nötig)
□ Rollback-Plan vorhanden (falls nötig)
□ Bei Breaking Changes: Nutzer informiert
```

#### Database Migration Protocol

**KRITISCH:** Schema-Änderungen können Nutzer-Daten zerstören!

1. **Vor der Migration:**
   - Backup-Hinweis an Nutzer (Export-Funktion nutzen)
   - Migration-SQL in `supabase/` Ordner dokumentieren
   - Rollback-SQL bereitstellen

2. **Migration durchführen:**
   - Zeitpunkt mit Nutzer abstimmen (z.B. Abends)
   - Frontend-Code ERST deployen NACHDEM DB-Migration läuft
   - Oder: Frontend abwärtskompatibel machen

3. **Nach der Migration:**
   - App testen
   - Nutzer informieren dass Update live ist

#### Kommunikation mit aktiven Nutzern

| Situation | Aktion |
|-----------|--------|
| Kleines Update (UI-Polish) | Keine Ankündigung nötig |
| Neues Feature | Kurze Info nach Release |
| Breaking Change | **VOR** Release ankündigen + Zeitpunkt abstimmen |
| Wartungsarbeiten | 24h vorher ankündigen |

#### Rollback-Prozedur

Falls ein Deploy Probleme verursacht:

```bash
# 1. Letzten stabilen Commit finden
git log --oneline -10

# 2. Revert erstellen
git revert <problematic-commit>

# 3. Sofort pushen
git push

# 4. DB-Rollback falls nötig
# → Rollback-SQL in Supabase ausführen
```

#### Backend-Strategie (Supabase)

**Aktueller Stand:** Ein Supabase-Projekt für alle Environments

```
┌─────────────────────────────────────────────────────┐
│                 Supabase Production                 │
│            (vitvxwfcutysuifuqnqi)                   │
├─────────────────────────────────────────────────────┤
│  main (Production)  ←──────┐                        │
│  develop (Staging)  ←──────┴── Gleiche Datenbank    │
│  localhost          ←──────────────────────────────│
└─────────────────────────────────────────────────────┘
```

| Änderungstyp | Vorgehen |
|--------------|----------|
| Frontend-only (UI, Styling) | Frei auf develop testen, dann main |
| Neue Tabelle/Spalte (additiv) | Migration vorbereiten, mit Nutzer absprechen |
| Spalte löschen/umbenennen | **KRITISCH** - Zeitpunkt mit Nutzer koordinieren |
| RLS Policy ändern | Testen auf localhost, dann direkt main |

**Regeln für DB-Änderungen:**

1. **Immer Migration-SQL dokumentieren** in `supabase/migration-*.sql`
2. **Immer Rollback-SQL bereitstellen** in `supabase/rollback-*.sql`
3. **Additive Änderungen** (neue Spalte) sind sicher → können jederzeit deployed werden
4. **Destruktive Änderungen** (Spalte löschen) → Zeitpunkt mit Nutzer absprechen

**Zukunft (bei mehr Nutzern):**

```
┌─────────────────────┐     ┌─────────────────────┐
│ Supabase Production │     │ Supabase Development│
│   (main branch)     │     │  (develop branch)   │
└─────────────────────┘     └─────────────────────┘
         ↑                           ↑
    Echte Nutzer              Entwickler-Tests
```

Umstellung wenn: >5 aktive Nutzer ODER komplexe DB-Migrationen geplant

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

#### Guard Rules für KI und Validierung

| # | Regel | Prüfung |
|---|-------|---------|
| 1 | View-Context prüfen | Vor Datenzugriff: "Bin ich in Monats- oder Wochenansicht?" |
| 2 | Falsche Felder erkennen | Block mit Uhrzeiten → STOP. Session mit block_size → STOP. |
| 3 | Eigene Aktionen validieren | Nach Code-Generierung: "Habe ich das richtige Entity verwendet?" |
| 4 | Conversion = neue Objekt-Erstellung | Block→Session erzeugt NEUE Session, löscht NICHT den Block |
| 5 | Keine Live-Kopplung | Änderungen an Session aktualisieren NICHT den verlinkten Block |

---

### 3.2 State Management (React Context)

| Context | Beschreibung | Supabase-Sync |
|---------|--------------|---------------|
| `CalendarProvider` | Blöcke, Tasks, Private Sessions, ContentPlans, Archivierung | Ja |
| `TimerProvider` | Timer-Zustand, Sessions | Ja (History) |
| `AuthProvider` | Authentifizierung | Ja |
| `StudiengangProvider` | Studiengang & Hierarchie-Labels | Lokal |
| `AppModeProvider` | Examen vs Normal Modus, activeLernplaene | Ja |
| `MentorProvider` | Mentor-Aktivierung | Ja |
| `CheckInProvider` | Check-In Responses | Ja |
| `ExamsProvider` | Leistungen (Normal) | Ja |
| `UebungsklausurenProvider` | Klausuren (Examen) | Ja |
| `OnboardingProvider` | Onboarding-Status | Lokal |
| `WizardProvider` | Lernplan-Wizard State & Draft | Ja |

### 3.3 App-Modus System

#### Examensmodus vs. Normalmodus

| Aspekt | Examensmodus | Normalmodus |
|--------|--------------|-------------|
| Aktivierung | Automatisch bei aktivem Lernplan | Automatisch ohne Lernplan |
| Kalender-Default | Monatsansicht | Wochenansicht |
| Dashboard-Widget | Lernplan / To-Dos Toggle | To-Dos / Themenliste Toggle |
| Navigation | Alle Menüpunkte | "Übungsklausuren" ausgeblendet |
| Wechsel | Profil-Seite oder Einstellungen | Profil-Seite oder Einstellungen |

#### Moduswechsel mit Lernplan-Archivierung

**Implementiert (09.01.2026):**

```
Examensmodus → Normalmodus wechseln (mit aktivem Lernplan)
                    ↓
        Dialog: "Modus wechseln?"
        - Lernplan wird aus Kalender entfernt
        - Lernplan wird als Themenliste archiviert
        - Themenliste später in "Lernpläne" wiederzufinden
                    ↓
              [Wechseln & Archivieren]
                    ↓
        archiveAndConvertToThemenliste()
                    ↓
        → ContentPlan mit type='themenliste', archived=true
        → blocksByDate geleert
        → lernplanMetadata geleert
        → Modus wechselt zu Normal
```

**Wichtig:** `activeLernplaene` in AppModeContext prüft BEIDE Datenquellen:
1. `contentPlans` mit `type='lernplan'` und `archived=false`
2. `lernplanMetadata` + `blocksByDate` (Wizard-erstellte Lernpläne)

---

### 3.4 Studiengang-System & Dynamische Hierarchie-Bezeichnungen

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

---

### 3.5 Persistenz-Strategie

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
| `/lernplan` | Lernpläne | Übersicht aller Pläne & Themenlisten |
| `/lernplan/erstellen` | Wizard | Lernplan-Erstellung (5 Pfade) |
| `/kalender/woche` | Wochenansicht | Detaillierte Wochenplanung |
| `/kalender/monat` | Monatsansicht | Übersichtskalender |
| `/verwaltung/leistungen` | Leistungen | Klausuren & Noten |
| `/verwaltung/aufgaben` | Aufgaben | Aufgabenverwaltung |
| `/einstellungen` | Einstellungen | App-Konfiguration |
| `/mentor` | Mentor | Statistik-Dashboard |
| `/profil` | Profil | Benutzerprofil & Moduswechsel |

---

## 5. Features im Detail

### 5.1 Lernplan-Wizard

#### Übersicht: Pfade und Steps

| Pfad | totalSteps | Beschreibung |
|------|------------|--------------|
| Manual | 22 | "Als Liste erstellen" - Vollständige manuelle Konfiguration |
| Automatic | 10 | Automatische Generierung basierend auf hochgeladenem Lernplan |
| Template | 9 | Vorlage-basiert |
| AI | 8 | KI-generierter Lernplan |
| Calendar | 7 | "Im Kalender erstellen" - Direkte Kalender-Bearbeitung |

**Wizard-Draft:** Automatisches Speichern alle 500ms zu Supabase (wenn authentifiziert) + localStorage.

---

#### 5.1.1 Basis-Schritte (alle Pfade: Steps 1-6)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          GEMEINSAME SCHRITTE (1-6)                           │
└──────────────────────────────────────────────────────────────────────────────┘

Step 1: Lernzeitraum
├── INPUT:  (keine)
├── OUTPUT: startDate, endDate
└── SPEICHERT: wizardState.startDate, wizardState.endDate

        ↓

Step 2: Puffertage
├── INPUT:  startDate, endDate (aus Step 1)
├── BERECHNET: Empfohlene Puffertage basierend auf Zeitraum
├── OUTPUT: bufferDays
└── SPEICHERT: wizardState.bufferDays

        ↓

Step 3: Urlaubstage
├── INPUT:  startDate, endDate
├── BERECHNET: Empfohlene Urlaubstage (1 Woche pro 6 Lernwochen)
│             NUR beim ersten Betreten (wenn vacationDays === null)
├── OUTPUT: vacationDays
└── SPEICHERT: wizardState.vacationDays

        ↓

Step 4: Tagesblöcke
├── INPUT:  (keine direkt, aber blocksPerDay default = 3)
├── OUTPUT: blocksPerDay (1-4)
└── SPEICHERT: wizardState.blocksPerDay
└── TRIGGER: Passt weekStructure an

        ↓

Step 5: Wochenstruktur
├── INPUT:  blocksPerDay (aus Step 4)
├── OUTPUT: weekStructure { montag: ['lernblock', ...], ... }
└── SPEICHERT: wizardState.weekStructure

        ↓

Step 6: Erstellungsmethode  ←── VERZWEIGUNGSPUNKT
├── INPUT:  (keine)
├── OUTPUT: creationMethod ('manual' | 'automatic' | 'template' | 'ai')
└── SPEICHERT: wizardState.creationMethod
└── TRIGGER: totalSteps wird basierend auf creationMethod angepasst
```

---

#### 5.1.2 Step 6: Verzweigung der Pfade

```
                            ┌─────────────────┐
                            │    Step 6:      │
                            │ Erstellungs-    │
                            │   methode       │
                            └────────┬────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │   'manual'   │         │ 'automatic'  │         │  'template'  │
    │ Als Liste    │         │  Automatisch │         │   Vorlage    │
    │  erstellen   │         │   erstellen  │         │   wählen     │
    └──────┬───────┘         └──────┬───────┘         └──────┬───────┘
           │                        │                        │
    totalSteps = 22          totalSteps = 10          totalSteps = 9
           │                        │                        │
           ▼                        ▼                        ▼
    Steps 7-22               Steps 7-10                Steps 7-9
    (Manual Path)            (Automatic Path)          (Template Path)
```

---

#### 5.1.3 Manual Path: Detaillierter Datenfluss (Steps 7-22)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          MANUAL PATH (Steps 7-22)                            │
└──────────────────────────────────────────────────────────────────────────────┘

Step 7: URG-Erstellungsmodus
├── INPUT:  (keine)
├── OUTPUT: urgCreationMode ('manual' | 'prefilled')
└── SPEICHERT: wizardState.urgCreationMode

        ↓

Step 8: Rechtsgebiete auswählen
├── INPUT:  urgCreationMode (bestimmt ob vorgefüllte URGs geladen werden)
├── OUTPUT: selectedRechtsgebiete ['zivilrecht', 'strafrecht', ...]
├── SPEICHERT: wizardState.selectedRechtsgebiete
└── INITIALISIERT: rechtsgebieteProgress = { [rgId]: false, ... }

        ↓

Step 9: Unterrechtsgebiete bearbeiten  ←── LOOP über alle RGs
├── INPUT:  selectedRechtsgebiete, currentRechtsgebietIndex
├── OUTPUT: unterrechtsgebieteDraft { [rgId]: [{ id, name, kategorie }] }
├── SPEICHERT: wizardState.unterrechtsgebieteDraft
└── LOOP: Wenn alle RGs fertig → Step 11, sonst → zurück zu Step 8

Step 10: URG-Erfolg (Bestätigung)
├── INPUT:  (Anzeige der erstellten URGs)
├── OUTPUT: rechtsgebieteProgress[currentRg] = true
└── NAVIGATION: Nächster RG → Step 8, Alle fertig → Step 11

        ↓

Step 11: Themen-Intro
├── INPUT:  (keine, nur Erklärungstext)
├── OUTPUT: (keine)
└── NAVIGATION: → Step 12

        ↓

Step 12: Themen & Aufgaben bearbeiten  ←── MIT RG-TABS
├── INPUT:  selectedRechtsgebiete, unterrechtsgebieteDraft
├── OUTPUT: themenDraft { [urgId]: [{ id, name, aufgaben: [...] }] }
├── SPEICHERT: wizardState.themenDraft
├── DATENSTRUKTUR:
│   themenDraft = {
│     'bgb-at': [
│       { id: 'thema-1', name: 'Vertrag', aufgaben: [
│         { id: 'aufg-1', name: 'Vertragsschluss', priority: 'hoch' },
│         { id: 'aufg-2', name: 'Anfechtung', priority: 'normal' }
│       ]}
│     ]
│   }
├── UI: Klickbare RG-Tabs + Inline-Input für Themen
└── NAVIGATION: → Step 14 (Step 13 entfernt)

        ↓

Step 14: Zielgewichtung
├── INPUT:  selectedRechtsgebiete
├── OUTPUT: rechtsgebieteGewichtung { [rgId]: number }
├── VALIDIERUNG: Summe muss 100% ergeben
├── SPEICHERT: wizardState.rechtsgebieteGewichtung
└── BEISPIEL: { 'zivilrecht': 40, 'strafrecht': 30, 'oeffentliches-recht': 30 }

        ↓

Step 15: Lernblöcke erstellen
├── INPUT:  themenDraft, unterrechtsgebieteDraft, selectedRechtsgebiete
├── OUTPUT: lernbloeckeDraft { [rgId]: [{ id, thema, aufgaben }] }
├── SPEICHERT: wizardState.lernbloeckeDraft
├── DATENSTRUKTUR:
│   lernbloeckeDraft = {
│     'zivilrecht': [
│       { id: 'block-1', thema: { id, name, aufgaben, urgId }, aufgaben: [] }
│     ]
│   }
├── UI: RG-Tabs, URG-Tabs, Block-Budget pro RG
└── NAVIGATION: → Step 20 (Steps 16-19 entfernt)

        ↓

Step 20: Verteilungsmodus
├── INPUT:  (keine)
├── OUTPUT: verteilungsmodus ('gemischt' | 'fokussiert' | 'themenweise')
├── SPEICHERT: wizardState.verteilungsmodus
├── ERKLÄRT:
│   - gemischt: Block-weise Verteilung, gute Abwechslung
│   - fokussiert: Tag-weise, ein RG pro Tag
│   - themenweise: Themenpakete zusammenhängend
└── NAVIGATION: → Step 21

        ↓

Step 21: Kalender-Vorschau  ←── KRITISCHER SCHRITT
├── INPUT:  ALLE vorherigen Daten:
│   - startDate, endDate, weekStructure, bufferDays, vacationDays
│   - lernbloeckeDraft, selectedRechtsgebiete
│   - rechtsgebieteGewichtung, verteilungsmodus
│
├── GENERIERT: generatedCalendar (Array von Tagen mit Blöcken)
├── SPEICHERT: wizardState.generatedCalendar
│
├── BENUTZER-AKTIONEN:
│   - Blöcke tauschen (Swap mit Validierung)
│   - Blöcke sperren (Lock)
│   - Undo/Redo
│
├── DATENSTRUKTUR:
│   generatedCalendar = [
│     {
│       date: Date,
│       blocks: [
│         {
│           id: 'block-2024-01-15-0',
│           rechtsgebiet: 'zivilrecht',
│           displayName: 'BGB AT - Vertrag',
│           thema: { id, name, aufgaben, urgId },
│           aufgaben: [],
│           isLocked: false
│         }
│       ]
│     }
│   ]
│
└── NAVIGATION: → Step 22

        ↓

Step 22: Bestätigung & Erstellung
├── INPUT:  generatedCalendar (aus Step 21 mit allen User-Änderungen)
├── AKTION: completeManualCalendar()
│
├── KONVERTIERUNG:
│   generatedCalendar → CalendarContext Format
│   via convertGeneratedCalendarToBlocks()
│
├── OUTPUT FORMAT (für CalendarContext):
│   {
│     '2024-01-15': [
│       {
│         id: '2024-01-15-block-0',
│         date: '2024-01-15',
│         position: 1,
│         blockType: 'lernblock',
│         topicTitle: 'BGB AT - Vertrag',
│         tasks: [{ id, name, completed, priority }],
│         metadata: { themaId, rgId, urgId, source: 'wizard-thema' },
│         rechtsgebiet: 'zivilrecht',
│         thema: { id, name, aufgaben, urgId },
│         startTime: '08:00',
│         endTime: '10:00'
│       }
│     ]
│   }
│
├── SPEICHERT:
│   → CalendarContext.setCalendarData(blocks, metadata)
│   → localStorage (sofort)
│   → Supabase (wenn authentifiziert)
│
├── HINWEIS: Wizard erstellt KEINE ContentPlan!
│            Nur blocksByDate + lernplanMetadata werden gespeichert.
│
└── NAVIGATION: → /kalender/monat
```

---

#### 5.1.4 Datenfluss-Diagramm

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              WIZARD STATE                                   │
│  (wizardState im WizardContext - wird bei jedem Schritt aktualisiert)      │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│  ZEITRAUM-DATEN   │    │   STRUKTUR-DATEN  │    │   INHALT-DATEN    │
├───────────────────┤    ├───────────────────┤    ├───────────────────┤
│ • startDate       │    │ • blocksPerDay    │    │ • themenDraft     │
│ • endDate         │    │ • weekStructure   │    │ • lernbloeckeDraft│
│ • bufferDays      │    │ • selectedRechts- │    │ • rechtsgebiete-  │
│ • vacationDays    │    │   gebiete         │    │   Gewichtung      │
│                   │    │ • unterrechts-    │    │ • verteilungsmodus│
│                   │    │   gebieteDraft    │    │                   │
└─────────┬─────────┘    └─────────┬─────────┘    └─────────┬─────────┘
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │        STEP 21:          │
                    │  generateCalendarFrom-   │
                    │       Blocks()           │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │    generatedCalendar     │
                    │  (mit User-Änderungen)   │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │        STEP 22:          │
                    │  convertGeneratedCalen-  │
                    │      darToBlocks()       │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │    CalendarContext       │
                    │   setCalendarData()      │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          ┌─────────────────┐       ┌─────────────────┐
          │   localStorage  │       │    Supabase     │
          │   (immer)       │       │ (wenn auth)     │
          └─────────────────┘       └─────────────────┘
```

---

#### 5.1.5 Kritische Datenübergaben

| Von | Nach | Daten | Transformation |
|-----|------|-------|----------------|
| Step 12 | Step 15 | `themenDraft` | User zieht Themen in `lernbloeckeDraft` |
| Step 15 | Step 21 | `lernbloeckeDraft` | `generateCalendarFromBlocks()` erstellt `generatedCalendar` |
| Step 21 | Step 22 | `generatedCalendar` | `convertGeneratedCalendarToBlocks()` konvertiert zu CalendarContext |
| Step 22 | Kalender | CalendarContext-Blöcke | `setCalendarData()` speichert zu localStorage + Supabase |

**Wichtig:** Step 22 verwendet `generatedCalendar` **direkt** (nicht neu generieren!), damit alle User-Änderungen aus Step 21 (Swaps, Locks) erhalten bleiben.

---

#### 5.1.6 Zurück-Navigation: Daten-Reset

Bei Zurück-Navigation werden abhängige Daten automatisch zurückgesetzt:

| Navigation | Gelöschte Daten | Grund |
|------------|-----------------|-------|
| Step 8 → 7 | `selectedRechtsgebiete`, alle URG/Themen/Block-Daten | RG-Auswahl ändert sich |
| Step 9 → 8 | `unterrechtsgebieteDraft`, `themenDraft`, `lernbloeckeDraft` | URGs ändern sich |
| Step 14 → 12 | Setzt `currentRechtsgebietIndex` auf letzten Index | Zurück zu Themen-Edit |
| Step 20 → 15 | `generatedCalendar` | Blöcke ändern sich |
| Step 21+ → <20 | `generatedCalendar` | Muss neu generiert werden |

---

#### 5.1.7 Index-Strategie

| Index | Verwendung | Scope | Grund |
|-------|------------|-------|-------|
| `currentRechtsgebietIndex` | Step 12 (Themen) | Global, Wizard-weit | Sequentielles Durcharbeiten |
| `localRgIndex` | Step 12 intern | Lokal (useState) | RG-Tabs innerhalb Step 12 |
| `activeRgIndex` | Step 15 (Blöcke) | Lokal (useState) | Freie RG-Navigation |

---

#### 5.1.8 Automatic Path (Steps 7-10)

| Schritt | Funktion | Datenfeld |
|---------|----------|-----------|
| 7 | Lernplan auswählen/hochladen | `manualLernplan` |
| 8 | Unterrechtsgebiete-Reihenfolge | `unterrechtsgebieteOrder` |
| 9 | Lerntage-Reihenfolge | `learningDaysOrder` |
| 10 | Anpassungen & Erstellung | → `completeAutomaticLernplan()` |

---

#### 5.1.9 Template Path (Steps 7-9)

| Schritt | Funktion | Datenfeld |
|---------|----------|-----------|
| 7 | Template auswählen | `selectedTemplate` |
| 8 | Lerntage konfigurieren | `learningDaysOrder` |
| 9 | Anpassungen & Bestätigung | → Erstellung |

---

### 5.2 Dashboard-Widget: To-Dos / Themenliste Toggle

**Implementiert (09.01.2026):**

Im Normalmodus zeigt das Dashboard einen Toggle zwischen:
- **To-Dos:** Einfache Aufgabenliste
- **Themenliste:** Hierarchische Ansicht (Unterrechtsgebiet → Kapitel → Themen → Aufgaben)

```jsx
// NoTopicsView in session-widget.jsx
<Toggle>
  <Button active={viewMode === 'todos'}>To-Dos</Button>
  <Button active={viewMode === 'themenliste'}>Themenliste</Button>
</Toggle>

{viewMode === 'themenliste' && (
  <Select value={selectedThemeListId}>
    {themeLists.map(tl => <Option>{tl.name}</Option>)}
  </Select>
)}
```

Im Examensmodus zeigt das Dashboard einen Toggle zwischen:
- **Lernplan:** Aktuelle Topics/Sessions
- **To-Dos:** Aufgabenliste

---

### 5.2.1 Themenliste-Editor Draft-Handling (T27)

**Draft-Lifecycle:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    THEMENLISTE DRAFT-FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ERSTELLEN: "+ Neue Themenliste" Button                      │
│     ↓                                                           │
│  2. PRÜFUNG: Existiert Draft?                                   │
│     • Zuerst: localStorage (prepwell_themenliste_draft)         │
│     • Dann: DB (content_plans mit status='draft')               │
│     ↓                                                           │
│  3a. DRAFT GEFUNDEN → Dialog: "Fortsetzen / Verwerfen"          │
│      • Fortsetzen: Draft laden, weiterarbeiten                  │
│      • Verwerfen: localStorage + DB-Draft LÖSCHEN               │
│     ↓                                                           │
│  3b. KEIN DRAFT → Neuer leerer Editor                           │
│     ↓                                                           │
│  4. AUTO-SAVE (alle 500ms bei Änderungen):                      │
│     • localStorage: Sofort                                      │
│     • DB: Mit status='draft'                                    │
│     ↓                                                           │
│  5. ABSCHLUSS:                                                  │
│     • "Speichern": status → 'active', localStorage löschen      │
│     • "Abbrechen": DB-Draft + localStorage LÖSCHEN              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Wichtig:**
- Drafts (`status='draft'`) werden NICHT in der Lernpläne-Übersicht angezeigt
- Drafts sind NUR über "+ Neue Themenliste" erreichbar
- Bei Abbruch wird der DB-Draft gelöscht (kein verwaister Draft)

**Datenstruktur:**
```javascript
// localStorage Key: prepwell_themenliste_draft
{
  contentPlan: {
    id: 'supabase-uuid',        // Nach erstem Auto-Save
    type: 'themenliste',
    status: 'draft',            // → 'active' bei Speichern
    selectedAreas: [{id, name, rechtsgebietId, color}],
    useKapitel: false,
    kapitel: [],
    themen: [{id, name, description, areaId, kapitelId?, aufgaben[]}],
    description: '',
    archived: false
  },
  lastModified: '2026-01-22T...'
}
```

---

### 5.2.2 T27 Flat Structure (Themenliste Redesign)

**Implementiert:** 23. Januar 2026

Die Themenlisten wurden von einer hierarchischen Struktur auf eine flache Struktur umgestellt:

#### Alte Struktur (vor T27)
```javascript
{
  rechtsgebiete: [
    {
      id: 'zivilrecht',
      unterrechtsgebiete: [
        {
          id: 'bgb-at',
          themen: [{ id, name, aufgaben }]
        }
      ]
    }
  ]
}
```

#### Neue Flat Structure (T27)
```javascript
{
  // Ausgewählte Fächer/URGs
  selectedAreas: [
    {
      id: 'bgb-at',
      name: 'BGB AT',
      rechtsgebietId: 'zivilrecht',
      color: 'bg-blue-500'
    }
  ],

  // Flache Liste aller Themen mit Area-Referenz
  themen: [
    {
      id: 'thema-1',
      name: 'Vertragsschluss',
      description: '',
      areaId: 'bgb-at',       // Referenz auf selectedAreas[].id
      kapitelId: null,         // Optional: Kapitel-Gruppierung
      order: 0,
      aufgaben: [
        { id: 'aufg-1', name: 'Definition', completed: false }
      ]
    }
  ],

  // Optional: Kapitel-Gruppierung
  useKapitel: false,
  kapitel: [
    { id: 'kap-1', name: 'Allgemeiner Teil', areaId: 'bgb-at', order: 0 }
  ]
}
```

#### Vorteile der Flat Structure

| Aspekt | Hierarchisch | Flat (T27) |
|--------|--------------|------------|
| Themen verschieben | Komplex (Nested Updates) | Einfach (`areaId` ändern) |
| Suche/Filter | Tiefe Iteration | Flache Iteration |
| Supabase JSONB | Tiefe Verschachtelung | Flache Arrays |
| React Performance | Re-Render Kaskaden | Gezielte Updates |

#### Komponenten-Architektur (T27)

```
┌─────────────────────────────────────────────────────────────────┐
│                    THEMENLISTE EDITOR (T27)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ThemenlisteEditorPage                                          │
│  └── contentPlan State + currentPlanRef (T34 Fix)              │
│      │                                                          │
│      ├── ThemenlisteHeader                                      │
│      │   └── AreaAutocompleteInput                             │
│      │       • Fach-Suche (URGs für Jura, Custom für andere)   │
│      │       • Comma-separated Display                          │
│      │       • Inline Edit Mode                                 │
│      │                                                          │
│      ├── ThemenNavigation                                       │
│      │   • Area-Tabs (farbig nach Rechtsgebiet)                │
│      │   • Kapitel-Gruppierung (optional)                       │
│      │   • Themen-Liste mit Drag & Drop                        │
│      │                                                          │
│      └── ThemaDetail                                            │
│          • Thema-Name editierbar                               │
│          • Aufgaben-Liste mit Checkboxes                       │
│          • Aufgaben hinzufügen/entfernen                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Dateien (T27)

| Datei | Zweck |
|-------|-------|
| `src/pages/themenliste-editor.jsx` | Haupt-Editor mit State Management |
| `src/features/themenliste/components/area-autocomplete-input.jsx` | Fach-Auswahl mit Autocomplete |
| `src/features/themenliste/components/themenliste-header.jsx` | Header mit Area-Input + Description |
| `src/features/themenliste/components/themen-navigation.jsx` | Area-Tabs + Themen-Liste |
| `src/features/themenliste/components/thema-detail.jsx` | Thema + Aufgaben Bearbeitung |
| `src/components/lernplan/themenliste-t27-card.jsx` | Card-Ansicht für /lernplan |

---

### 5.3 Kalender-Feature

**Blocktypen:**
| Typ | Farbe | Wiederholung |
|-----|-------|--------------|
| Tagesthema | Rechtsgebiet-Farbe | Ja |
| Wiederholung | Orange | Ja |
| Klausur | Rot | Ja |
| Privat | Grau | Ja |
| Freizeit | Grün | Ja |

**Serientermine:** Täglich, Wöchentlich, Monatlich, Benutzerdefiniert (Wochentage)

---

### 5.4 Timer-System

| Modus | Beschreibung |
|-------|--------------|
| Pomodoro | 25 Min Arbeit + 5 Min Pause (konfigurierbar) |
| Countdown | Individuelle Zeit |
| Count-up | Stoppuhr ohne Limit |

**Logbuch:** Manuelle Zeiterfassung für vergangene Aktivitäten.

---

### 5.5 Mentor & Statistiken

**Aktivierung:** Dialog beim ersten Besuch

**Metriken:**
- Lernzeit (Ø pro Tag/Woche, Gesamt)
- Produktivste Tageszeit
- Fächer-Verteilung
- Aufgaben-Erledigungsrate
- Streak-Tage

---

### 5.6 Check-In System

| Zeitpunkt | Erfassung |
|-----------|-----------|
| Morgens | Stimmung, Energielevel, Fokus, Tagesziele |
| Abends | Reflexion, Erfolge, Herausforderungen |

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
- `useAppModeSync`

### 6.3 User Approval System (T14)

**Zweck:** Neue Benutzer müssen von einem Administrator freigeschaltet werden, bevor sie die App nutzen können. Dies ermöglicht eine kontrollierte Beta-Phase.

#### Datenbank-Schema

```sql
-- profiles Tabelle (Supabase)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger erstellt automatisch Profil bei Registrierung
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, approved)
  VALUES (NEW.id, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### State-Variablen in AuthContext

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `isApproved` | `boolean \| null` | `null` = unbekannt, `true` = freigeschaltet, `false` = nicht freigeschaltet |
| `approvalLoading` | `boolean` | `true` während Approval-Status geprüft wird |

#### Ablauf

```
┌────────────────────────────────────────────────────────────────┐
│                    USER APPROVAL FLOW                           │
└────────────────────────────────────────────────────────────────┘

1. Registrierung
   └── Trigger erstellt profiles-Eintrag mit approved=false

2. Login
   └── checkApprovalStatus() prüft profiles.approved
       ├── approved=true  → App normal nutzbar
       └── approved=false → Wartungsseite angezeigt

3. Admin-Freischaltung (Supabase Dashboard)
   └── UPDATE profiles SET approved = true WHERE id = 'user-id'

4. Nächster Login
   └── User kann App nutzen
```

#### Implementierung in auth-context.jsx

```javascript
// checkApprovalStatus() - Prüft Approval-Status
const checkApprovalStatus = useCallback(async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('approved')
    .eq('id', userId)
    .single();

  if (error?.code === 'PGRST116') {
    // Profil nicht gefunden
    setIsApproved(false);
    return false;
  }

  const approved = data?.approved ?? false;
  setIsApproved(approved);
  return approved;
}, []);
```

#### Fallback-Verhalten

| Szenario | Verhalten |
|----------|-----------|
| Supabase nicht konfiguriert | `isApproved = true` (Offline-Modus) |
| profiles-Tabelle existiert nicht | `isApproved = true` (Migration noch nicht ausgeführt) |
| Profil nicht gefunden | `isApproved = false` |
| Netzwerkfehler | `isApproved = true` (App nicht blockieren) |

#### E-Mail-Benachrichtigungen (Supabase Edge Functions)

Zwei Edge Functions senden automatisch E-Mails:

1. **notify-admin** - Bei neuer Registrierung an Admin
2. **notify-approval** - Bei Freischaltung an User

```
supabase/functions/
├── notify-admin/      # Benachrichtigt Admin bei neuer Registrierung
└── notify-approval/   # Benachrichtigt User bei Freischaltung
```

#### Migration

SQL-Migration: `supabase/migration-user-approval.sql`

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
│   ├── lernplan/       # Lernplan-Bearbeitung
│   ├── mentor/         # Mentor-Dashboard
│   └── settings/       # Einstellungen
├── features/           # Feature-Module
│   ├── calendar/       # Kalender-Feature
│   └── lernplan-wizard/# Wizard-Feature
│       ├── context/    # wizard-context.jsx
│       └── steps/      # Step-Komponenten (1-22)
├── contexts/           # 11+ React Contexts
├── hooks/              # Custom Hooks
├── services/           # API-Services
├── data/               # Statische Daten
│   ├── unterrechtsgebiete-data.js
│   ├── studiengaenge.js
│   └── templates/
└── utils/              # Hilfsfunktionen
```

---

## 8. Design System

### Farben (Rechtsgebiete)
| Rechtsgebiet | Farbe |
|--------------|-------|
| Öffentliches Recht | Grün (#10B981) |
| Zivilrecht | Blau (#3B82F6) |
| Strafrecht | Rot (#EF4444) |
| Querschnittsrecht | Violett (#8B5CF6) |

### Typografie
- **Font:** DM Sans
- **H1:** 24px, Extralight (200)
- **Body:** 16px, Normal (400)

---

# Teil 2: Bugs & Funktionstest

---

## 9. Bekannte Bugs

### 9.1 Kritisch (Blocker)

| ID | Bug | Bereich | Status |
|----|-----|---------|--------|
| - | Keine kritischen Bugs bekannt | - | - |

### 9.2 Behoben (Januar 2026)

| ID | Bug | Bereich | Status |
|----|-----|---------|--------|
| BUG-MSW-001 | Moduswechsel zeigt keinen Dialog | AppMode | ✅ Behoben |
| BUG-MSW-002 | activeLernplaene erkennt Wizard-Lernpläne nicht | AppMode | ✅ Behoben |
| BUG-P1 | Step 22 ignoriert User-Änderungen aus Step 21 | Wizard | ✅ Behoben |
| BUG-2c | Page Refresh hängt unendlich (getSession Deadlock) | Auth | ✅ Behoben (Workaround) |
| **T34** | **Themenliste Datenverlust bei mehreren Fächern** | Themenliste | ✅ Behoben |

#### T34 Details: Kritischer Datenverlust-Bug

**Problem:** Beim Erstellen einer Themenliste mit mehreren Fächern wurde nur das erste Fach gespeichert. Ursache war eine ID-Synchronisations-Kette die fehlschlug.

**Root Cause:**
1. `createContentPlan()` ignorierte Supabase-UUID und gab lokale ID zurück
2. `currentPlanRef` wurde nicht mit Supabase-UUID synchronisiert
3. Nachfolgende `updateContentPlan()` Aufrufe verwendeten falsche ID

**Fixes (6 Stück):**
```
Fix 1: Draft bei /neu löschen
Fix 2: pendingChangesRef korrekt verarbeiten
Fix 3: handleFinish mit Ref statt Closure
Fix 4: Synchroner Ref-Update in updatePlan
Fix 5: currentPlanRef ID-Sync nach createContentPlan (KRITISCH)
Fix 6: createContentPlan gibt Supabase UUID zurück (KRITISCH)
```

**Betroffene Dateien:**
- `src/pages/themenliste-editor.jsx` (Fix 1-5)
- `src/contexts/calendar-context.jsx` (Fix 6)

**Ticket:** `docs/tickets/T34-datenmigration-analyse.md`

#### BUG-2c Details: Supabase Web Locks Deadlock

**Problem:** `supabase.auth.getSession()` hängt unendlich und löst nie auf. Ursache ist ein bekannter Bug im Supabase SDK ([Issue #1594](https://github.com/supabase/supabase-js/issues/1594)).

**Workaround implementiert in:**
- `src/services/supabase.ts`: `noOpLock` Funktion umgeht Web Locks
- `src/contexts/auth-context.jsx`: 3-Sekunden-Timeout als Fallback

```typescript
// supabase.ts - Web Locks Workaround
const noOpLock = async <T>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> => {
  return await fn();
};

export const supabase = createClient(url, key, {
  auth: {
    lock: noOpLock, // Bypass Web Locks deadlock bug
    // ...
  }
});
```

**Mögliche Nachteile:**
- Parallele Token-Refresh-Requests möglich (selten)
- Potenzielle Race Conditions bei lokalem State (in Praxis kein Problem)

### 9.3 Mittel (Funktioniert, aber nicht optimal)

| ID | Bug | Bereich | Status |
|----|-----|---------|--------|
| BUG-010 | React Hook Dependency Warnings | Performance | Offen |
| BUG-011 | Fast refresh Warnungen bei Context-Exporten | DevExp | Offen |
| BUG-012 | Chunk size > 500kb Warnung beim Build | Bundle | Offen |

---

## 10. Funktionstest-Checkliste

### 10.1 Moduswechsel (NEU)

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Examen → Normal (mit Lernplan) auf Profil-Seite | Dialog erscheint | [ ] | - |
| Examen → Normal (mit Lernplan) in Einstellungen | Dialog erscheint | [ ] | - |
| Nach Bestätigung: ContentPlan archiviert | Themenliste erstellt | [ ] | - |
| Nach Bestätigung: Kalender leer | blocksByDate geleert | [ ] | - |
| Normal → Examen (ohne Lernplan) | Modus wechselt direkt | [ ] | - |

### 10.2 Dashboard Themenliste-Toggle (NEU)

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Toggle erscheint im Normalmodus | Sichtbar | [ ] | - |
| Wechsel zu "Themenliste" | Dropdown erscheint | [ ] | - |
| Themenliste auswählen | Hierarchie wird angezeigt | [ ] | - |
| Aufgabe abhaken in Themenliste | Status ändert sich | [ ] | - |

### 10.3 Lernplan-Wizard

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Schritt 1-22 durchlaufen (Manual Path) | Alle Schritte erreichbar | [ ] | - |
| Draft wird automatisch gespeichert | Nach 500ms zu Supabase | [ ] | - |
| Zurück-Navigation | Abhängige Daten werden zurückgesetzt | [ ] | - |
| Step 12: RG-Tabs klickbar | Freie Navigation zwischen RGs | [ ] | - |
| Step 15: Block-Budget korrekt | Pro RG nach Gewichtung | [ ] | - |
| Step 21: Swaps erhalten in Step 22 | User-Änderungen nicht verloren | [ ] | - |

### 10.4 Kalender

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Monatsansicht Navigation | Vor/Zurück funktioniert | [ ] | - |
| Wochenansicht Navigation | Vor/Zurück funktioniert | [ ] | - |
| Block erstellen (Tagesthema) | Block erscheint im Kalender | [ ] | - |
| Serientermin erstellen | Mehrere Blöcke erstellt | [ ] | - |
| Block bearbeiten | Änderungen gespeichert | [ ] | - |
| Block löschen | Block entfernt | [ ] | - |

### 10.5 Supabase Sync

| Test | Erwartung | Getestet | Status |
|------|-----------|----------|--------|
| Daten laden bei Login | Supabase-Daten erscheinen | [ ] | - |
| Änderungen speichern | Zu Supabase synchronisiert | [ ] | - |
| Offline-Fallback | LocalStorage funktioniert | [ ] | - |

---

# Teil 3: Roadmap

---

## 11. Strategische Ziele

1. **Phase 2 Moduswechsel** - Wizard erstellt ContentPlan bei Abschluss
2. **Eigenes Backend** - Migration von Supabase zu eigenem TypeScript-Backend
3. **Mobile App** - React Native Version für iOS/Android
4. **Community Features** - Lerngruppen, geteilte Inhalte
5. **Premium-Modell** - Monetarisierung

---

## 12. Phasen-Übersicht

```
Q1 2026: Stabilisierung & Backend-Planung
Q2 2026: Backend-Migration Phase 1
Q3 2026: Backend-Migration Phase 2 + Mobile
Q4 2026: Community & Premium Features
```

---

## 13. Nächste Schritte

### Sofort (Phase 2 Moduswechsel)

| Task | Beschreibung | Aufwand |
|------|--------------|---------|
| Wizard erstellt ContentPlan | Bei `completeWizard()` zusätzlich ContentPlan erstellen | 3-4h |
| Migration bestehender Lernpläne | `blocksByDate` → ContentPlan konvertieren | 2h |
| ContentPlan-basierte Archivierung | `archived: true` statt Neukonvertierung | 1h |

### Diese Woche

| Task | Beschreibung |
|------|--------------|
| Funktionstests durchführen | Alle Checklisten-Items testen |
| CalendarPlanEditCard fertigstellen | Hierarchische Bearbeitung auf /lernplan |
| Rule-Validation implementieren | Gewichtung + Verteilungsmodus prüfen |

### Später

| Task | Beschreibung |
|------|--------------|
| Bundle-Größe optimieren | < 500 kB |
| TypeScript Migration | Schrittweise Umstellung |
| E2E Tests | Playwright/Cypress |

---

## 14. Technische Schulden

| Task | Priorität | Aufwand |
|------|-----------|---------|
| ESLint-Fehler komplett beheben | Hoch | 2-3h |
| Bundle-Größe optimieren (< 500kb) | Mittel | 4-6h |
| React Hook Dependency Warnings fixen | Mittel | 2-3h |
| TypeScript Migration starten | Niedrig | 20-40h |

---

# Teil 4: Architektur-Dokumentation

---

## 15. Wizard vs. ContentPlan Architektur

### Aktueller Zustand (Problem)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AKTUELLE ARCHITEKTUR                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WIZARD PATH (Lernplan erstellen):                             │
│  ═══════════════════════════════════                           │
│  wizardState → generateBlocks() → blocksByDate + metadata      │
│                                                                 │
│  KEINE ContentPlan-Erstellung!                                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  THEMENLISTEN PATH (Manuell erstellen):                        │
│  ═══════════════════════════════════════                       │
│  createContentPlan() → contentPlans Array                      │
│                                                                 │
│  Hat hierarchische Struktur:                                   │
│  Plan → Rechtsgebiete → URGs → Kapitel → Themen → Aufgaben    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Workaround (Implementiert)

`archiveAndConvertToThemenliste()` extrahiert Themen-Struktur aus `blocksByDate` und erstellt eine ContentPlan nachträglich.

### Ziel-Architektur (Phase 2)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZIEL-ARCHITEKTUR                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WIZARD PATH:                                                  │
│  wizardState → completeWizard() →                              │
│    ├── ContentPlan (type: 'lernplan', archived: false)        │
│    └── blocksByDate (mit contentPlanId)                       │
│                                                                 │
│  ARCHIVIERUNG:                                                 │
│  contentPlan.archived = true                                   │
│  blocksByDate gefiltert nach contentPlanId                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 16. Block-Datenstruktur

### CalendarContext blocksByDate

```javascript
blocksByDate = {
  '2026-01-15': [
    {
      id: '2026-01-15-block-0',
      date: '2026-01-15',
      position: 1,                    // 1-4
      blockType: 'lernblock',         // 'lernblock' | 'repetition' | 'exam'
      topicTitle: 'BGB AT - Vertrag',
      rechtsgebiet: 'zivilrecht',
      unterrechtsgebiet: 'bgb-at',    // URG-ID
      thema: {
        id: 'thema-123',
        name: 'Vertragsschluss',
        aufgaben: [...],
        urgId: 'bgb-at'               // WICHTIG: urgId im thema-Objekt
      },
      tasks: [
        { id: 't1', name: 'Definition', completed: false, priority: 'hoch' }
      ],
      metadata: {
        themaId: 'thema-123',
        rgId: 'zivilrecht',
        urgId: 'bgb-at',              // BACKUP: urgId auch in metadata
        source: 'wizard-thema'
      },
      startTime: '08:00',
      endTime: '10:00',
      isLocked: false,
      isFromLernplan: true            // Unterscheidung zu manuell erstellten
    }
  ]
}
```

### lernplanMetadata

```javascript
lernplanMetadata = {
  name: 'Lernplan 01.01.2026 - 01.06.2026',
  startDate: '2026-01-01',
  endDate: '2026-06-01',
  blocksPerDay: 3,
  weekStructure: {
    montag: ['lernblock', 'lernblock', 'lernblock'],
    dienstag: ['lernblock', 'lernblock', 'lernblock'],
    // ...
  },
  selectedRechtsgebiete: ['zivilrecht', 'strafrecht', 'oeffentliches-recht'],
  rechtsgebieteGewichtung: {
    'zivilrecht': 40,
    'strafrecht': 30,
    'oeffentliches-recht': 30
  },
  verteilungsmodus: 'gemischt',
  creationMethod: 'manual',
  createdAt: '2026-01-01T10:00:00Z'
}
```

---

## 17. URG-ID Lookup

URG-IDs werden an mehreren Stellen gespeichert. Die Priorität für Lookup ist:

1. `block.thema?.urgId` (Wizard Step 12/15)
2. `block.metadata?.urgId` (Migrierte Daten)
3. `block.unterrechtsgebiet` (Legacy/Alternative)

```javascript
// Korrekter URG-Lookup
const urgId = block.thema?.urgId || block.metadata?.urgId || block.unterrechtsgebiet;
```

---

# Anhang

## A. Dateien-Referenz

| Datei | Zweck |
|-------|-------|
| `src/contexts/calendar-context.jsx` | Kalender-State, blocksByDate, ContentPlans, archiveAndConvertToThemenliste |
| `src/contexts/appmode-context.jsx` | App-Modus, activeLernplaene |
| `src/contexts/wizard-context.jsx` | Wizard-State, completeWizard |
| `src/features/lernplan-wizard/steps/*.jsx` | Wizard-Steps |
| `src/components/dashboard/session-widget.jsx` | Dashboard To-Dos/Themenliste |
| `src/components/lernplan/calendar-plan-edit-card.jsx` | Lernplan-Bearbeitung |
| `src/components/lernplan/themenliste-t27-card.jsx` | T27 Themenliste Card für /lernplan |
| `src/pages/profil.jsx` | Profil mit Moduswechsel |
| `src/pages/themenliste-editor.jsx` | T27 Themenliste Editor |
| `src/features/themenliste/components/area-autocomplete-input.jsx` | Fach-Autocomplete (T27) |
| `src/features/themenliste/components/themenliste-header.jsx` | Themenliste Header (T27) |
| `src/features/themenliste/components/themen-navigation.jsx` | Area-Tabs + Themen (T27) |
| `src/features/themenliste/components/thema-detail.jsx` | Thema + Aufgaben Editor (T27) |
| `src/hooks/use-supabase-sync.js` | Supabase-Synchronisation |
| `src/utils/themenliste-migration.js` | getDisplayName() für T27 |

## B. Glossar

| Begriff | Bedeutung |
|---------|-----------|
| BlockAllocation | Kapazitätsplanung auf Tagesebene (Monatsansicht) |
| Session | Zeitraum-basierter Termin (Woche/Startseite) |
| ContentPlan | Themenliste oder Lernplan (T27: mit Flat Structure) |
| selectedAreas | T27: Ausgewählte Fächer/URGs in einer Themenliste |
| themen | T27: Flache Liste aller Themen mit areaId-Referenz |
| areaId | T27: Referenz von Thema auf selectedAreas[].id |
| wizardState | Temporärer Zustand während Wizard-Durchlauf |
| lernplanMetadata | Permanente Lernplan-Konfiguration nach Wizard |
| blocksByDate | Kalender-Blöcke gruppiert nach Datum |
| themenDraft | Themen mit Aufgaben pro URG (Wizard Step 12) |
| lernbloeckeDraft | Blöcke mit zugewiesenen Themen (Wizard Step 15) |
| generatedCalendar | Verteilte Blöcke mit Daten (Wizard Step 21) |
| currentPlanRef | T34: Synchroner Ref für ContentPlan ID (Race Condition Fix) |

---

**Dokument-Ende**
