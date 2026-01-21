# Ticket 28: Figma-Design-Analyse - Semesterleistungen (Normal Mode)

**Datum:** 21.01.2026
**Status:** Offen
**Priorität:** Hoch
**Figma-Link:** https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2119-851&m=dev
**Figma-Titel:** "Verwaltung -> Semesterleistungen & Übungsklausuren"

---

## Ziel

**Neue Implementierung** der Semesterleistungen-Verwaltung für den **normalen Modus**.

### Wichtige Abgrenzung

| Modus | Feature | Beschreibung | Status |
|-------|---------|--------------|--------|
| **Normal Mode** | Semesterleistungen | Universitätsklausuren, Hausarbeiten, mündliche Prüfungen | **Nicht implementiert** |
| **Examen Mode** | Übungsklausuren | Probeexamen für Staatsexamen-Vorbereitung | Implementiert |

Diese beiden Features sind **komplett getrennt**:
- Unterschiedliche Datenmodelle
- Unterschiedliche Contexts
- Unterschiedliche Supabase-Tabellen
- Kein geteilter State

Die aktuelle `LeistungenContent`-Komponente verwendet fälschlicherweise den `useExams`-Context (Examen-Modus) und muss **komplett neu implementiert** werden.

---

## Neue Dateien (zu erstellen)

```
src/
├── contexts/
│   └── semester-leistungen-context.jsx    # NEU: Eigener Context
├── components/
│   └── semesterleistungen/                # NEU: Eigenes Feature-Verzeichnis
│       ├── index.js
│       ├── semesterleistungen-content.jsx
│       └── dialogs/
│           ├── neue-leistung-dialog.jsx
│           ├── leistung-bearbeiten-dialog.jsx
│           ├── filter-sortieren-dialog.jsx
│           └── auswertung-dialog.jsx
├── hooks/
│   └── use-semester-leistungen-sync.js    # NEU: Supabase-Sync
```

**Zu modifizierende Dateien:**
- `src/pages/verwaltung-leistungen.jsx` - Neue Komponente einbinden
- `supabase/schema.sql` - Neue Tabelle `semester_leistungen`
- `tailwind.config.js` - Ggf. Trend-Farben ergänzen (optional)

**Bestehende Dateien (wiederverwenden, NICHT modifizieren):**
- `src/utils/rechtsgebiet-colors.js` - Farbsystem für Rechtsgebiete (benutzerdefiniert)

---

## Figma-Design Screenshots

### 1. Dialog: Neue Leistung eintragen

![Neue Leistung eintragen](https://www.figma.com/api/mcp/asset/neue-leistung-dialog)

**Figma Node-ID:** `2122:1899`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| Rechtsgebiet | Dropdown | Fach-Auswahl mit Dropdown-Button |
| Titel | Input | Titel der Leistung |
| Beschreibung | Textarea | Referenz, Raum, etc. |
| Datum | Date Picker | Mit "Klausur im Kalender eintragen" Checkbox |
| ECTS / Gewichtung | Input | ECTS-Punkte |
| Note | Input | Noteneingabe |
| Status Anmeldung | Toggle/Switch | An/Aus-Schalter |

---

### 2. Dialog: Leistungen Filtern & Sortieren

![Filtern & Sortieren](https://www.figma.com/api/mcp/asset/filter-sortieren-dialog)

**Figma Node-ID:** `2126:2095`

**Preset-Optionen (Radio Buttons):**
1. **Standard:** Alles anzeigen, Neuste zuletzt
2. **Klausurenphase:** Angemeldet, nächste zuerst, alle Fächer
3. **Benutzerdefiniert:** Mit erweiterten Filter-Optionen

**Benutzerdefinierte Filter:**
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| Fächer filtern | Dropdown | Multi-Select für Rechtsgebiete |
| Semester filtern | Dropdown | Multi-Select für Semester |
| Zeitrahmen festlegen | Date Range | Beginn & Ende auswählen |
| Sortierung primär | Dropdown | Spalte für primäre Sortierung |
| Sortierung sekundär | Dropdown | Spalte für sekundäre Sortierung |

---

### 3. Dialog: Auswertung deiner Leistungen

![Auswertung](https://www.figma.com/api/mcp/asset/auswertung-dialog)

**Figma Node-ID:** `2585:4447`

**Linke Spalte: Durchschnittsnoten der Rechtsgebiete**
| Rechtsgebiet | Note | Info | Trend |
|--------------|------|------|-------|
| Zivilrecht | 12.1 | aus 8 Leistungen | Tendenzangabe |
| Öffentliches Recht | 9.7 | aus 5 Leistungen | Tendenzangabe |
| Strafrecht | 10.3 | aus 3 Leistungen | Tendenzangabe |

**Gewichtung der Rechtsgebiete (Prozent):**
- Öffentliches Recht: 35%
- Zivilrecht: 45%
- Strafrecht: 20%

**Rechte Spalte: Durchschnittsnoten der Semester**
| Semester | Note | Info | Trend |
|----------|------|------|-------|
| 1. Semester | 12.1 | aus 5 Leistungen | Tendenzangabe |
| 2. Semester | 9.7 | aus 4 Leistungen | Tendenzangabe |
| 3. Semester | 10.3 | aus 6 Leistungen | Tendenzangabe |

**Gesamtdurchschnitt:** 10.7 (aus 15 Leistungen)

---

### 4. Hauptansicht: Leistungstabelle

![Hauptansicht](https://www.figma.com/api/mcp/asset/hauptansicht-tabelle)

**Figma Node-ID:** `2585:4916`

**Header-Bereich:**
- Titel: "Übungsklausuren" (links)
- Buttons (rechts):
  - "Neue Leistung +" (Primary Button)
  - "Filtern" (Outline Button)
  - "Auswertung" (Outline Button mit Chart-Icon)

**Tabellen-Spalten:**
| Spalte | Breite (ca.) | Inhalt |
|--------|--------------|--------|
| Fach | 85px | Badge mit Rechtsgebiet-Farbe |
| Thema | flex | Titel + Beschreibung |
| Datum | 258px | Datum und optional Uhrzeit |
| Note | 109px | Notenwert |

---

## Datenmodell: Semesterleistung

### Supabase-Tabelle: `semester_leistungen`

```sql
CREATE TABLE semester_leistungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pflichtfelder
  rechtsgebiet TEXT NOT NULL,  -- 'zivilrecht', 'strafrecht', 'oeffentliches-recht', etc.
  titel TEXT NOT NULL,

  -- Optionale Felder
  beschreibung TEXT,
  semester TEXT,               -- '1. Semester', '2. Semester', etc.
  datum DATE,
  uhrzeit TEXT,                -- z.B. '09:00 - 12:00'
  ects INTEGER,
  note DECIMAL(3,1),           -- Notenwert (Punkte 0-18 oder Note 1.0-5.0)
  noten_system TEXT DEFAULT 'punkte',  -- 'punkte' oder 'noten'
  status TEXT DEFAULT 'ausstehend',    -- 'angemeldet', 'ausstehend', 'bestanden', 'nicht_bestanden'

  -- Kalender-Integration
  in_kalender BOOLEAN DEFAULT FALSE,
  kalender_block_id UUID REFERENCES calendar_blocks(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE semester_leistungen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own semester_leistungen"
  ON semester_leistungen FOR ALL
  USING (auth.uid() = user_id);
```

### TypeScript Interface

```typescript
interface SemesterLeistung {
  id: string;
  userId: string;

  // Pflichtfelder
  rechtsgebiet: 'zivilrecht' | 'strafrecht' | 'oeffentliches-recht' | 'querschnitt' | string;
  titel: string;

  // Optionale Felder
  beschreibung?: string;
  semester?: string;
  datum?: string;        // ISO date string
  uhrzeit?: string;
  ects?: number;
  note?: number;
  notenSystem: 'punkte' | 'noten';
  status: 'angemeldet' | 'ausstehend' | 'bestanden' | 'nicht_bestanden';

  // Kalender
  inKalender: boolean;
  kalenderBlockId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

---

## Detailanalyse der Dialoge (zu implementieren)

### 1. Neue Leistung Dialog

| Feld | Figma-Element | Typ | Pflicht |
|------|---------------|-----|---------|
| Rechtsgebiet | Dropdown "Fach auswählen" | Select | ✅ Ja |
| Titel | Input "Titel eintragen" | Text Input | ✅ Ja |
| Beschreibung | Textarea "Referenz, Raum, etc." | Textarea | Nein |
| Datum | Date Picker "Datum & Uhrzeit auswählen" | Date Input | Nein |
| "Klausur im Kalender" | Checkbox | Checkbox | Nein |
| ECTS / Gewichtung | Input "ECTS-Punkte eintragen" | Number Input | Nein |
| Note | Input "Note eintragen" | Number Input | Nein |
| Status Anmeldung | Toggle Switch | Toggle | Nein |

**Footer:** "Abbrechen" (Outline) + "Speichern" (Primary)

### 2. Filter & Sortieren Dialog

**Radio-Button Presets:**
1. **Standard:** Alles anzeigen, Neuste zuletzt
2. **Klausurenphase:** Angemeldet, nächste zuerst, alle Fächer
3. **Benutzerdefiniert:** Erweiterte Optionen

**Benutzerdefinierte Filter (nur bei Preset 3 sichtbar):**
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| Fächer filtern | Multi-Select Dropdown | Rechtsgebiete auswählen |
| Semester filtern | Multi-Select Dropdown | Semester auswählen |
| Zeitrahmen: Beginn | Date Picker | Start-Datum |
| Zeitrahmen: Ende | Date Picker | End-Datum |
| Sortierung primär | Dropdown | Spalte für Sortierung |
| Sortierung sekundär | Dropdown | Zweite Sortierspalte |

**Footer:** "Abbrechen" (Outline) + "Speichern" (Primary)

### 3. Auswertung Dialog (großes Popup)

**Linke Spalte: "Durchschnittsnoten der Rechtsgebiete"**
- Pro Rechtsgebiet: Note, "aus X Leistungen", Tendenzpfeil
- Trennlinien zwischen Einträgen
- Unten: "Gewichtung der Rechtsgebiete" als Prozent-Chips

**Rechte Spalte: "Durchschnittsnoten der Semester"**
- Pro Semester: Note, "aus X Leistungen", Tendenzpfeil
- Trennlinien zwischen Einträgen
- Unten: "Gesamtdurchschnitt" mit Gesamtnote

**Footer:** "Fertig" (Primary) - nur zum Schließen

---

## Implementierungsplan

### Phase 0: Design-Standardisierung

**Bestehendes Farbsystem nutzen (KEINE hardcoded Farben!):**

Die Rechtsgebiet-Farben sind **benutzerdefiniert** und werden über das bestehende System verwaltet:

```
src/utils/rechtsgebiet-colors.js
├── getRechtsgebietColor(subjectId)  → Gibt { bg, border, text, badge, solid } zurück
├── getColorForSubject(subjectId)    → Gibt Tailwind-Farbnamen zurück
├── getAllSubjects()                  → Liste aller Fächer mit Farben
└── AVAILABLE_COLORS                  → 12 wählbare Farben für Einstellungen
```

**Verwendung in Komponenten:**
```jsx
import { getRechtsgebietColor } from '../../utils/rechtsgebiet-colors';

// Badge für Rechtsgebiet
const colors = getRechtsgebietColor(leistung.rechtsgebiet);
<span className={`${colors.bg} ${colors.text} ${colors.border} ...`}>
  {rechtsgebietName}
</span>
```

**Ggf. in tailwind.config.js ergänzen (nur Trend-Farben):**

```javascript
// tailwind.config.js - nur falls nicht vorhanden
colors: {
  // Trend-Farben für Auswertung-Dialog (Tendenzpfeile)
  trend: {
    up: '#16A34A',        // green-600 (Verbesserung)
    down: '#DC2626',      // red-600 (Verschlechterung)
    stable: '#737373',    // neutral-500 (Gleichbleibend)
  },
}
```

**Bereits vorhandene Design Tokens (wiederverwendbar):**
- `brand.primary: '#3e596b'` - Primary Button Farbe
- `neutral-*` Scale - Text/Background
- `rounded-md (8px)` - Card/Dialog Radius
- `text-sm (14px)` - Body Text
- `text-xs (12px)` - Badge/Label Text
- `font-medium (500)` - Hervorhebungen
- `font-semibold (600)` - Badge Text

**Safelist in tailwind.config.js (bereits vorhanden):**
```javascript
safelist: [
  { pattern: /bg-(blue|green|red|purple|amber|...)-(50|100|200|500)/ },
  { pattern: /text-(blue|green|red|purple|...)-(700|800)/ },
  { pattern: /border-(blue|green|red|purple|...)-(200|500)/ },
]
```
Diese Safelist ermöglicht die dynamischen Farb-Klassen aus `rechtsgebiet-colors.js`.

---

### Phase 1: Infrastruktur (Grundlage)

**1.1 Supabase-Tabelle erstellen**
```sql
-- In supabase/schema.sql hinzufügen
CREATE TABLE IF NOT EXISTS semester_leistungen (
  -- siehe Datenmodell oben
);
```

**1.2 Context erstellen: `semester-leistungen-context.jsx`**
```jsx
// Eigener Context - NICHT useExams verwenden!
const SemesterLeistungenContext = createContext();

export const SemesterLeistungenProvider = ({ children }) => {
  const [leistungen, setLeistungen] = useState([]);
  const [loading, setLoading] = useState(true);

  // CRUD Operations
  const addLeistung = async (data) => { /* ... */ };
  const updateLeistung = async (id, data) => { /* ... */ };
  const deleteLeistung = async (id) => { /* ... */ };

  // Statistik-Berechnungen
  const getStatsByRechtsgebiet = () => { /* ... */ };
  const getStatsBySemester = () => { /* ... */ };
  const getGesamtdurchschnitt = () => { /* ... */ };

  return (
    <SemesterLeistungenContext.Provider value={{
      leistungen,
      loading,
      addLeistung,
      updateLeistung,
      deleteLeistung,
      getStatsByRechtsgebiet,
      getStatsBySemester,
      getGesamtdurchschnitt
    }}>
      {children}
    </SemesterLeistungenContext.Provider>
  );
};

export const useSemesterLeistungen = () => useContext(SemesterLeistungenContext);
```

**1.3 Supabase-Sync Hook: `use-semester-leistungen-sync.js`**
- Analog zu bestehenden Sync-Hooks
- Real-time Subscriptions für `semester_leistungen` Tabelle

### Phase 2: Hauptkomponente

**2.1 `semesterleistungen-content.jsx` erstellen**

```jsx
const SemesterleistungenContent = ({ className = '' }) => {
  const { leistungen, loading } = useSemesterLeistungen();

  // Dialog States
  const [isNeueLeistungOpen, setIsNeueLeistungOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAuswertungOpen, setIsAuswertungOpen] = useState(false);

  // Filter State
  const [activePreset, setActivePreset] = useState('standard');
  const [customFilters, setCustomFilters] = useState({...});

  return (
    <div className="bg-white rounded-lg border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h2 className="text-sm font-medium">Semesterleistungen</h2>
        <div className="flex gap-2">
          <Button onClick={() => setIsNeueLeistungOpen(true)}>
            <PlusIcon /> Neue Leistung
          </Button>
          <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
            Filtern
          </Button>
          <Button variant="outline" onClick={() => setIsAuswertungOpen(true)}>
            <ChartIcon /> Auswertung
          </Button>
        </div>
      </div>

      {/* Tabelle */}
      <LeistungenTable leistungen={filteredLeistungen} />

      {/* Dialoge */}
      <NeueLeistungDialog open={isNeueLeistungOpen} ... />
      <FilterSortierenDialog open={isFilterOpen} ... />
      <AuswertungDialog open={isAuswertungOpen} ... />
    </div>
  );
};
```

### Phase 3: Dialoge implementieren

**3.1 Neue Leistung Dialog**
- Formular gemäß Figma-Spezifikation
- Validierung: Rechtsgebiet + Titel Pflicht
- Kalender-Integration optional

**3.2 Filter & Sortieren Dialog**
- 3 Radio-Button Presets
- Conditional Rendering für benutzerdefinierte Filter
- State-Management für Filter-Werte

**3.3 Auswertung Dialog**
- Zwei-Spalten-Layout
- Statistik-Berechnungen aus Context
- Trend-Berechnung (optional)

### Phase 4: Integration

**4.1 Page-Komponente aktualisieren**
```jsx
// verwaltung-leistungen.jsx
const VerwaltungLeistungenPage = () => {
  const { isExamMode } = useAppMode();

  return (
    <div>
      <Header />
      <SubHeader title={isExamMode ? 'Übungsklausuren' : 'Semesterleistungen'} />

      {isExamMode ? (
        <UebungsklausurenContent />  // Examen-Modus (bereits implementiert)
      ) : (
        <SemesterLeistungenProvider>
          <SemesterleistungenContent />  // Normal-Modus (NEU)
        </SemesterLeistungenProvider>
      )}
    </div>
  );
};
```

**4.2 Provider in App-Struktur einbinden**
- `SemesterLeistungenProvider` nur im Normal-Modus laden
- Lazy Loading für Performance

---

## Akzeptanzkriterien

### Design-Standardisierung (Phase 0)
- [ ] Rechtsgebiet-Farben über `getRechtsgebietColor()` aus `rechtsgebiet-colors.js` verwenden
- [ ] Keine hardcoded Farben für Rechtsgebiete (benutzerdefiniert via Einstellungen!)
- [ ] Trend-Farben (up/down/stable) ggf. in `tailwind.config.js` ergänzen
- [ ] Alle UI-Farben verwenden Design Tokens aus `tailwind.config.js`

### Infrastruktur (Phase 1)
- [ ] Neue Supabase-Tabelle `semester_leistungen` erstellt
- [ ] RLS Policies korrekt konfiguriert
- [ ] Eigener Context `SemesterLeistungenContext` (NICHT useExams!)
- [ ] Supabase-Sync funktioniert (CRUD + Realtime)

### Hauptansicht
- [ ] Tabelle mit Spalten: Fach, Thema, Datum, Note
- [ ] Header mit 3 Buttons: "Neue Leistung +", "Filtern", "Auswertung"
- [ ] Leere State bei keinen Einträgen
- [ ] Klickbare Zeilen zum Bearbeiten

### Neue Leistung Dialog
- [ ] Alle Formularfelder gemäß Figma
- [ ] Validierung: Rechtsgebiet + Titel Pflicht
- [ ] Speichern erstellt neuen Eintrag in Supabase
- [ ] Kalender-Integration funktioniert (wenn aktiviert)

### Filter & Sortieren Dialog
- [ ] 3 Radio-Button-Presets funktionieren
- [ ] Benutzerdefinierte Filter nur bei Preset 3 sichtbar
- [ ] Alle Filter-Optionen funktionieren
- [ ] Filter-State wird korrekt angewendet

### Auswertung Dialog
- [ ] Zwei-Spalten-Layout (Rechtsgebiet | Semester)
- [ ] Durchschnitte korrekt berechnet
- [ ] Anzahl Leistungen pro Gruppe angezeigt
- [ ] Gesamtdurchschnitt prominent dargestellt
- [ ] Prozent-Gewichtung der Rechtsgebiete

### Abgrenzung zum Examen-Modus
- [ ] Komplett separater Datenbestand
- [ ] Kein geteilter State mit `useExams`
- [ ] Eigene Supabase-Tabelle
- [ ] Modus-Switch funktioniert korrekt

---

## Risikobewertung

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|--------|-------------------|------------|------------|
| Daten-Migration bestehender Einträge | Mittel | Hoch | Migrations-Script erstellen |
| Verwechslung Normal/Examen-Modus | Mittel | Mittel | Klare UI-Unterscheidung |
| Kalender-Integration komplex | Mittel | Mittel | Optional implementieren |
| Performance bei vielen Einträgen | Niedrig | Niedrig | useMemo + Pagination |

---

## Testplan

### Unit Tests
1. Context CRUD-Operationen
2. Statistik-Berechnungen
3. Filter-Logik

### Integrationstests
1. Supabase-Sync (Create, Read, Update, Delete)
2. Realtime-Updates bei Änderungen
3. Kalender-Integration (wenn aktiviert)

### Manuelle Tests

1. **Leistung erstellen:**
   - Dialog öffnen → Formular angezeigt
   - Pflichtfelder leer → "Speichern" deaktiviert
   - Alle Felder ausfüllen → Speichern erfolgreich
   - Eintrag erscheint in Tabelle

2. **Leistung bearbeiten:**
   - Zeile klicken → Bearbeiten-Dialog öffnet
   - Werte ändern → Speichern aktualisiert Eintrag
   - Löschen → Bestätigungs-Dialog → Eintrag entfernt

3. **Filter-Presets:**
   - Standard auswählen → Alle Einträge, neueste zuerst
   - Klausurenphase → Nur angemeldete, nächste zuerst
   - Benutzerdefiniert → Erweiterte Filter sichtbar

4. **Auswertung:**
   - Dialog öffnen → Statistiken korrekt
   - Leere Daten → Sinnvolle Anzeige
   - Prozent-Gewichtung stimmt (Summe = 100%)

5. **Modus-Switch:**
   - Normal-Modus → Semesterleistungen angezeigt
   - Examen-Modus → Übungsklausuren angezeigt
   - Daten sind komplett getrennt

---

## Abhängigkeiten

### Bestehende Komponenten (wiederverwendbar)
- `Dialog`, `DialogContent`, etc. aus `ui/dialog`
- `Button` aus `ui/button`
- Icons aus `ui/icon`
- Supabase-Client aus `lib/supabase`

### Neue Abhängigkeiten
- Keine externen Dependencies erforderlich

---

## Notizen

- **WICHTIG:** Komplett neue Implementierung, NICHT die bestehende `LeistungenContent` anpassen
- Die bestehende `LeistungenContent` verwendet fälschlicherweise `useExams` und muss ersetzt werden
- Kalender-Integration ist "Nice-to-have", kann in Phase 2 nachgeliefert werden
- Trend-Berechnung (Pfeile) ist optional

---

## Differenzen: Figma-Design vs. Aktuelle Implementierung

**Status:** Grundfunktionalität implementiert, Design-Anpassungen ausstehend

### Figma-Screenshots (Referenz)

| Bereich | Figma Node-ID | Link |
|---------|---------------|------|
| Hauptansicht | `2585:1844` | [Figma](https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2585-1844&m=dev) |
| Auswertung Dialog | `2585:4447` | [Figma](https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2585-4447&m=dev) |
| Neue Leistung Dialog | `2122:1899` | [Figma](https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2122-1899&m=dev) |
| Filter Dialog (Benutzerdefiniert) | `2126:2095` | [Figma](https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2126-2095&m=dev) |
| Leistung Bearbeiten Dialog | `2122:7308` | [Figma](https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2122-7308&m=dev) |

---

### 1. Hauptansicht (Tabelle)

| Aspekt | Figma-Design | Aktuelle Implementierung | Priorität |
|--------|--------------|--------------------------|-----------|
| **Layout** | Tabelle ohne rechtes Stats-Panel | Zwei-Spalten (Tabelle + 400px Stats-Panel) | Mittel |
| **Tabellen-Spalten** | Fach, Semester, Thema, Datum, Note | Fach, Thema, Datum, Note (ohne Semester) | Hoch |
| **Header-Buttons** | Pill-Style (rounded-full) | Standard Button-Style | Niedrig |
| **Button-Reihenfolge** | "Neue Leistung +", "Filtern", "Auswertung" | Gleich | ✅ OK |
| **Button-Icons** | Auswertung hat Chart-Icon | Auswertung hat ChevronDown-Icon | Niedrig |

**Zu ändern:**
- [ ] Semester-Spalte in Tabelle hinzufügen
- [ ] Stats-Panel entfernen (Figma zeigt keine rechte Spalte auf Hauptseite)
- [ ] Button-Style anpassen (rounded-full, outline)

---

### 2. Neue Leistung Dialog

| Aspekt | Figma-Design | Aktuelle Implementierung | Priorität |
|--------|--------------|--------------------------|-----------|
| **Layout** | Zwei-Spalten (links: Rechtsgebiet/Titel/Beschreibung/Status, rechts: Datum/Kalender/ECTS/Note) | Eine Spalte (vertikal) | Hoch |
| **Datum-Feld** | "Datum & Uhrzeit auswählen" (ein kombiniertes Feld) | Separate Felder: Datum + Uhrzeit | Mittel |
| **Kalender-Checkbox** | Checkbox mit "Klausur im Kalender eintragen" | Toggle-Switch | Mittel |
| **Status-Feld** | Toggle-Switch "Status Anmeldung zur Klausur" | Dropdown mit 4 Optionen | Mittel |
| **Semester-Feld** | NICHT im Dialog (wird berechnet?) | Dropdown vorhanden | Klären |
| **Notensystem-Toggle** | NICHT im Dialog | Punkte/Noten Toggle vorhanden | Klären |

**Zu ändern:**
- [ ] Zwei-Spalten-Layout implementieren
- [ ] Datum & Uhrzeit in ein Feld kombinieren (oder DateTime-Picker)
- [ ] Kalender-Toggle zu Checkbox ändern
- [ ] Status-Logik klären (Toggle vs. Dropdown)
- [ ] Semester-Feld entfernen oder verstecken?
- [ ] Notensystem-Toggle entfernen?

---

### 3. Leistung Bearbeiten Dialog

| Aspekt | Figma-Design | Aktuelle Implementierung | Priorität |
|--------|--------------|--------------------------|-----------|
| **Layout** | Identisch zu "Neue Leistung" (zwei Spalten) | Eine Spalte | Hoch |
| **Löschen-Button** | Links unten "Leistung löschen" mit Icon | Links unten "Löschen" | Niedrig |
| **Ausgefüllte Werte** | Beispiel: "Zivilrecht", "Vertragsrecht & Handelsrecht" | Daten aus State | ✅ OK |

**Zu ändern:**
- [ ] Gleiche Layout-Änderungen wie "Neue Leistung"
- [ ] Button-Text zu "Leistung löschen" ändern

---

### 4. Filter & Sortieren Dialog

| Aspekt | Figma-Design | Aktuelle Implementierung | Priorität |
|--------|--------------|--------------------------|-----------|
| **Preset-Labels** | "Standard: Alles anzeigen, Neuste zuletzt" | "Standard - Alle Leistungen, neueste zuerst" | Niedrig |
| **Preset 2** | "Klausurenphase: Angemeldet, nächste zuerst, alle Fächer" | "Klausurenphase - Anstehende Prüfungen zuerst" | Niedrig |
| **Benutzerdefiniert-Bereich** | Rahmen mit Titel "Benutzerdefinierte Sortierung & Filter" | Ohne Rahmen, einfache Liste | Mittel |
| **Filter-Felder** | Fächer, Semester, Zeitrahmen (Beginn/Ende), Sortierung primär/sekundär | Rechtsgebiete (Chips), Sortierung (2 Dropdowns) | Hoch |
| **Semester-Filter** | Dropdown "Semester auswählen" | FEHLT | Hoch |
| **Zeitrahmen-Filter** | Zwei Date-Picker (Beginn/Ende) | FEHLT | Mittel |
| **Sortierung sekundär** | Dropdown vorhanden | FEHLT | Niedrig |

**Zu ändern:**
- [ ] Semester-Filter hinzufügen (Dropdown)
- [ ] Zeitrahmen-Filter hinzufügen (Beginn/Ende Date-Picker)
- [ ] Sekundäre Sortierung hinzufügen
- [ ] Benutzerdefiniert-Bereich mit Rahmen versehen
- [ ] Preset-Texte anpassen

---

### 5. Auswertung Dialog

| Aspekt | Figma-Design | Aktuelle Implementierung | Priorität |
|--------|--------------|--------------------------|-----------|
| **Noten-Darstellung** | Große Zahlen (z.B. "12.1") mit "aus X Leistungen" daneben | Kleine Tabelle mit Spalten | Hoch |
| **Tendenzangabe** | Grünes Icon + "Tendenzangabe" Text pro Eintrag | FEHLT (nur in Trend-Spalte, nicht bei jedem Eintrag) | Mittel |
| **Gewichtung** | Separate Sektion "Gewichtung der Rechtsgebiete" mit Prozent-Chips (35%, 45%, 20%) | Prozent-Spalte in Tabelle | Mittel |
| **Gesamtdurchschnitt** | Große Zahl "10.7" mit "aus 15 Leistungen" + Tendenz | Kleines Card-Element | Mittel |
| **Layout** | Zwei große Boxen nebeneinander mit Trennlinien | Zwei schmale Tabellen | Hoch |
| **Status-Cards** | NICHT vorhanden | 3 Karten (Bestanden/Ausstehend/N. Bestanden) | Entfernen? |
| **ECTS-Card** | NICHT vorhanden | Eigene Karte | Entfernen? |

**Zu ändern:**
- [ ] Layout komplett überarbeiten (große Boxen statt Tabellen)
- [ ] Noten groß darstellen mit "aus X Leistungen" inline
- [ ] Tendenzangabe mit grünem Icon pro Eintrag
- [ ] Gewichtung als separate Sektion mit Prozent-Chips
- [ ] Status-Cards und ECTS-Card entfernen (nicht im Figma)
- [ ] Gesamtdurchschnitt prominent mit großer Zahl

---

### Zusammenfassung: Priorisierte Änderungen

#### Hohe Priorität
1. **Neue Leistung / Bearbeiten Dialog:** Zwei-Spalten-Layout
2. **Hauptansicht:** Semester-Spalte hinzufügen
3. **Filter Dialog:** Semester-Filter hinzufügen
4. **Auswertung Dialog:** Layout komplett überarbeiten

#### Mittlere Priorität
5. Hauptansicht: Stats-Panel entfernen
6. Datum-Feld kombinieren (Datum & Uhrzeit)
7. Kalender-Toggle zu Checkbox
8. Zeitrahmen-Filter im Filter-Dialog
9. Tendenzangabe im Auswertung-Dialog

#### Niedrige Priorität
10. Button-Styles (rounded-full)
11. Icon-Änderungen
12. Text-Anpassungen (Preset-Labels)
13. Sekundäre Sortierung
