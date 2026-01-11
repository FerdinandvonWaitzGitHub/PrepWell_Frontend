# Themenlisten: Fächerauswahl für Nicht-Jura-Studiengänge

**Status: OFFEN**

## Problem

Auf der Seite "Lernpläne" können bei der Erstellung neuer Themenlisten im **Normal-Modus** (nicht Examen-Modus) nur die drei Jura-Rechtsgebiete ausgewählt werden:
- Öffentliches Recht
- Zivilrecht
- Strafrecht

Dies ist problematisch für Studierende anderer Fachrichtungen (z.B. BWL, Medizin, Informatik), die PrepWell nutzen möchten.

## Analyse

### Betroffene Dateien:
- `src/data/unterrechtsgebiete-data.js` - **Hauptproblem**: Hardcoded Jura-Rechtsgebiete
- `src/components/lernplan/lernplan-content.jsx` - Verwendet rechtsgebiete für Themenlisten
- `src/components/lernplan/unterrechtsgebiet-picker.jsx` - Picker für Unterrechtsgebiete
- `src/contexts/studiengang-context.jsx` - Studiengang-Kontext (nicht genutzt für Fächer)

### Aktueller Zustand (Code-Analyse):

**`src/data/unterrechtsgebiete-data.js`:**
```javascript
export const RECHTSGEBIET_LABELS = {
  'oeffentliches-recht': 'Öffentliches Recht',
  'zivilrecht': 'Zivilrecht',
  'strafrecht': 'Strafrecht',
  'querschnitt': 'Querschnitts- und Sonderrechtsgebiete'
};
```

- **100% hardcoded** auf Jura-Fächer
- Über 200 Unterrechtsgebiete definiert, alle juristisch
- Keine Unterstützung für andere Studiengänge
- Normal-Modus nutzt dieselben Daten wie Examen-Modus

## Lösungsvorschlag (Langfristig)

### 1. Datenbank-Struktur für Fächer
```sql
-- Neue Tabelle: subjects (Fächer)
CREATE TABLE subjects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Neue Tabelle: study_program_subjects (Studiengang-Fächer Zuordnung)
CREATE TABLE study_program_subjects (
  id UUID PRIMARY KEY,
  study_program TEXT NOT NULL,  -- z.B. 'jura', 'bwl', 'medizin'
  subject_id UUID REFERENCES subjects(id),
  is_default BOOLEAN DEFAULT true
);
```

### 2. Standard-Fächerlisten pro Studiengang
Jeder Studiengang erhält 10-20 vordefinierte Fächer:

**Jura:**
- Öffentliches Recht, Zivilrecht, Strafrecht, Europarecht, etc.

**BWL:**
- Rechnungswesen, Marketing, Finanzierung, Controlling, etc.

**Medizin:**
- Anatomie, Physiologie, Biochemie, Pathologie, etc.

**Informatik:**
- Algorithmen, Datenbanken, Softwareentwicklung, Netzwerke, etc.

### 3. Benutzerdefinierte Fächer
- User können eigene Fächer hinzufügen
- Fächer können bearbeitet/gelöscht werden
- Farbzuordnung für visuelle Unterscheidung

## Kurzfristige Lösung (Quick Fix)

1. Im Normal-Modus ein Freitext-Feld für Fachbezeichnung anbieten
2. Oder: Dropdown mit "Sonstiges" Option + Freitext

## Priorität

**Mittel** - Wichtig für Expansion auf andere Studiengänge, aber Jura-Fokus hat aktuell Priorität.

## Offene Fragen

1. Welche Studiengänge sollen initial unterstützt werden?
2. Sollen Fächer global (für alle User eines Studiengangs) oder pro User verwaltet werden?
3. Wie wird die Migration bestehender Themenlisten gehandhabt?
