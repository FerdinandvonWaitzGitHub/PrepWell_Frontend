# T13: UI-Bugs (Modus-Wechsel & Archivierung, Dashboard-Hoehe, Kalender-Linien)

## Status: OFFEN

---

## Ueberblick

Drei UI-Verbesserungen:

1. **Modus-Wechsel & Lernplan-Archivierung** - Konsistentes Verhalten beim Wechsel Examen → Normal
2. **Dashboard Body-Hoehe** - To-Do und Zeitplan-Bereiche nutzen Display-Hoehe nicht aus
3. **Kalender Wochenansicht Linien** - Vertikale Linien zwischen Header und Body sind nicht aligned

---

## Bug 1: Modus-Wechsel & Lernplan-Archivierung

### Symptom
Ein Lernplan wird in der Lernplaene-Seite mit "Aktiv"-Badge angezeigt, obwohl:
- Der User im **normalen Modus** ist (nicht Examen-Modus)
- Der Lernplan nicht in der Monatsansicht erscheint
- Der Lernplan nicht bearbeitbar ist

### Gewuenschtes Verhalten

**Beim Wechsel Examen → Normal (mit aktivem Lernplan):**

1. Dialog erscheint: "Dein aktiver Lernplan wird archiviert"
2. Bei **Bestaetigen**: Lernplan wird archiviert, Kalender geleert, Wechsel zu Normal
3. Bei **Abbrechen**: User bleibt im Examen-Modus

**Archivierung speichert ALLE Wizard-Settings:**

```javascript
archivedLernplan = {
  id: "...",
  name: "Lernplan Maerz 2026",
  archivedAt: "2026-01-13",

  // Themen & Fortschritt
  themen: [...],
  completedThemen: [...],

  // Wizard-Einstellungen (fuer Reaktivierung)
  wizardSettings: {
    creationMethod: 'template',   // WICHTIG: Erstellungsmethode (calendar|manual|ai|template)
    blocksPerDay: 3,
    pufferTage: 5,                // Anzahl, NICHT konkrete Daten
    urlaubsTage: 4,               // Anzahl, NICHT konkrete Daten
    rechtsgebieteGewichtung: {...},
    selectedRechtsgebiete: [...],
    templateId: '...',            // Falls template gewaehlt wurde
  }
}
```

**Wichtig bei Reaktivierung - Schritt 6 (Erstellungsmethode):**

Bei der Reaktivierung wird Schritt 6 uebersprungen oder die Methode ist fixiert:
- Die gespeicherte `creationMethod` wird automatisch verwendet
- User kann NICHT zu einer anderen Methode wechseln
- Grund: Die Themen-Struktur haengt von der Erstellungsmethode ab

| Erstellungsmethode | Bei Reaktivierung |
|--------------------|-------------------|
| `template` | Gleiches Template, User kann Anpassungen machen |
| `manual` | User behaelt seine manuell erstellten Themen |
| `calendar` | User behaelt seine Kalender-Bloecke |

### Reaktivierung aus Archiv

**Ablauf:**

```
┌─────────────────────────────────────┐
│  Archivierter Lernplan auswaehlen   │
│  "Reaktivieren" klicken             │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Dialog: Start-/Enddatum eingeben   │
│  [12.02.2026] - [15.04.2026]        │
│                         [Pruefen]   │
└──────────────┬──────────────────────┘
               ▼
        ┌──────┴──────┐
        │  Passt es?  │
        └──────┬──────┘
          JA   │   NEIN
        ┌──────┴──────┐
        ▼             ▼
  ┌───────────┐  ┌─────────────────────────────┐
  │ Lernplan  │  │ "Zeitraum passt nicht"      │
  │ erstellt  │  │                             │
  │ ✓         │  │ [Abbrechen] [Im Wizard      │
  └───────────┘  │              anpassen]      │
                 └──────────────┬──────────────┘
                                ▼
                 ┌─────────────────────────────┐
                 │ Wizard mit VORAUSGEFUELLTEN │
                 │ Daten aus Archiv:           │
                 │                             │
                 │ • Rechtsgebiete ✓           │
                 │ • Bloecke/Tag: 3 ✓          │
                 │ • Puffertage: 5 ✓           │
                 │ • Urlaubstage: 4 ✓          │
                 │                             │
                 │ User passt nur an was       │
                 │ noetig ist (z.B. weniger    │
                 │ Puffer bei kuerzerem        │
                 │ Zeitraum)                   │
                 └─────────────────────────────┘
```

### Betroffene Dateien

- `src/contexts/appmode-context.jsx` - toggleMode Logik
- `src/contexts/calendar-context.jsx` - Archivierung mit wizardSettings
- `src/components/settings/settings-content.jsx` - Modal bereits vorhanden (Zeile 1068)
- `src/components/lernplan/lernplan-content.jsx` - Reaktivieren-Button im Archiv
- `src/features/wizard/` - Wizard mit vorausgefuellten Daten oeffnen

### Implementierung

**Teil A: Archivierung beim Modus-Wechsel**

1. Modal-Text anpassen (bereits vorhanden in settings-content.jsx)
2. `archiveAndConvertToThemenliste()` ersetzen durch neue `archiveLernplan()` Funktion
3. Neue Funktion speichert wizardSettings mit:
   - `pufferTage` (Anzahl)
   - `urlaubsTage` (Anzahl)
   - `blocksPerDay`
   - `rechtsgebieteGewichtung`
   - `selectedRechtsgebiete`
   - `themen` mit Fortschritt

**Teil B: Reaktivierung**

1. "Reaktivieren"-Button in Archiv-Ansicht (lernplan-content.jsx)
2. Dialog fuer Start-/Enddatum
3. Validierung: Passen Themen + Puffer + Urlaub in den Zeitraum?
4. Falls OK: Lernplan direkt erstellen
5. Falls nicht: Wizard oeffnen mit vorausgefuellten wizardSettings

**Teil C: Wizard mit Prefill**

1. Wizard akzeptiert `initialSettings` prop
2. Alle Felder werden vorausgefuellt
3. User kann anpassen und speichern

---

## Bug 2: Dashboard Body-Hoehe

### Symptom
Die zwei Hauptbereiche auf der Startseite (To-Dos links, Zeitplan rechts) sind zu klein und nutzen die verfuegbare Display-Hoehe nicht optimal aus.

### Betroffene Dateien
- `src/components/layout/dashboard-layout.jsx` (Zeile 11)
- `src/pages/dashboard.jsx` (Zeile 1081)

### Ursache
Die DashboardLayout-Komponente hat:
```javascript
<div className={`grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5 md:gap-6 md:h-[calc(100vh-240px)] ${className}`}>
```

**Probleme:**
1. `240px` Offset ist zu gross - beruecksichtigt Header, SubHeader, Padding nicht korrekt
2. Die Child-Divs haben `md:h-full` aber der Parent hat keine echte Hoehe auf kleineren Screens
3. `py-8` Padding im main-Container wird nicht abgezogen

### Loesung
1. Den Offset korrekt berechnen:
   - Header: ~64px
   - SubHeader (Dashboard-Header): ~80px
   - Padding (py-8 = 32px top + 32px bottom): 64px
   - **Total: ~208px** (nicht 240px)

2. Bessere Hoehen-Berechnung:
```javascript
// Option A: Korrigierter Offset
<div className="md:h-[calc(100vh-200px)]">

// Option B: Flexbox statt fixer Hoehe
<div className="flex-1 min-h-0">
```

3. Die Child-Container sollten `min-h-0` haben fuer korrektes Flex-Verhalten:
```javascript
<div className="flex flex-col md:h-full md:overflow-hidden min-h-0">
```

---

## Bug 3: Kalender Wochenansicht - Linien nicht aligned

### Symptom
Die vertikalen Linien zwischen den Header-Spalten (Mo, Di, Mi...) und dem Kalender-Body darunter liegen nicht uebereinander.

### Betroffene Dateien
- `src/features/calendar/components/week-grid.jsx` (Zeilen 554-862)

### Ursache
Die Spalten-Breiten sind unterschiedlich definiert:

**Header Table (Zeile 554):**
```javascript
<table className="w-full border-collapse table-fixed flex-shrink-0">
  <th className="w-14 ..." /> {/* Zeit-Spalte */}
  <th className="..." />       {/* Tage teilen sich Rest gleichmaessig */}
```

**Body Grid (Zeile 747):**
```javascript
<div className="flex-1 overflow-auto">       {/* Hat ScrollBar! */}
  <div className="w-14 flex-shrink-0 ..." /> {/* Zeit-Spalte */}
  <div className="flex-1 ..." />              {/* Tage mit flex-1 */}
```

**Das Problem:**
- Wenn der Body eine ScrollBar hat (~15-17px), wird der verfuegbare Raum fuer die Tages-Spalten reduziert
- Die Header-Table bekommt keine ScrollBar -> Header-Spalten sind breiter als Body-Spalten
- **Ergebnis:** Vertikale Linien sind verschoben

### Loesung

**Option A:** ScrollBar-Breite kompensieren
```javascript
// Header mit padding-right fuer ScrollBar
<table className="w-full table-fixed" style={{ paddingRight: '17px' }}>
```

**Option B:** ScrollBar immer anzeigen
```javascript
// Body Container immer mit ScrollBar
<div className="flex-1 overflow-y-scroll">
```

**Option C:** CSS Grid statt Table fuer Header
```javascript
// Beide mit gleichem Grid-Template
const gridTemplate = 'w-14 repeat(7, 1fr)';

// Header
<div className={`grid ${gridTemplate}`}>

// Body
<div className={`grid ${gridTemplate}`}>
```

**Option D (Empfohlen):** Feste Spaltenbreiten berechnen
```javascript
// Spaltenbreite berechnen und konsistent verwenden
const dayColumnWidth = `calc((100% - 3.5rem - 17px) / 7)`; // 3.5rem = w-14, 17px = ScrollBar
```

---

## Priorisierung

| Bug | Prioritaet | Aufwand | Auswirkung |
|-----|------------|---------|------------|
| 1. Modus-Wechsel & Archivierung | Hoch | Hoch | Konsistente UX, Reaktivierung |
| 2. Dashboard-Hoehe | Mittel | Gering | Suboptimale Platznutzung |
| 3. Kalender-Linien | Niedrig | Mittel | Visueller Polish |

---

## Checkliste

### Bug 1: Modus-Wechsel & Archivierung
- [ ] Teil A: Archivierung beim Modus-Wechsel
  - [ ] Neue `archiveLernplan()` Funktion in calendar-context.jsx
  - [ ] wizardSettings mitspeichern:
    - [ ] `creationMethod` (calendar|manual|ai|template)
    - [ ] `templateId` (falls template)
    - [ ] `pufferTage` (Anzahl)
    - [ ] `urlaubsTage` (Anzahl)
    - [ ] `blocksPerDay`
    - [ ] `rechtsgebieteGewichtung`
    - [ ] `selectedRechtsgebiete`
    - [ ] `themen` mit Fortschritt
  - [ ] `confirmModeSwitch` in settings-content.jsx anpassen
  - [ ] Modal-Text pruefen
- [ ] Teil B: Reaktivierung
  - [ ] "Reaktivieren"-Button in Archiv-Ansicht
  - [ ] Dialog fuer Start-/Enddatum
  - [ ] Validierung ob Zeitraum passt
  - [ ] Weiterleitung zu Wizard bei Problemen
- [ ] Teil C: Wizard mit Prefill
  - [ ] `initialSettings` prop im Wizard
  - [ ] Alle Felder vorausfuellen
  - [ ] **Schritt 6 (Erstellungsmethode) fixieren** - User muss gleiche Methode verwenden
  - [ ] Testen mit verschiedenen archivierten Lernplaenen (template, manual, calendar)

### Bug 2: Dashboard-Hoehe
- [ ] Dashboard-Layout Hoehe korrigieren
- [ ] Offset auf ~200px anpassen
- [ ] min-h-0 auf Children

### Bug 3: Kalender-Linien
- [ ] Header/Body Spalten-Breiten synchronisieren
- [ ] ScrollBar-Kompensation

### Abschluss
- [ ] Alle Aenderungen testen
- [ ] Keine Regression in anderen Ansichten
