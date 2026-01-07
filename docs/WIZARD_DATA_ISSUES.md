# Wizard Daten-Handling: Identifizierte Probleme & KPIs

**Erstellt:** 2026-01-07
**Betroffener Pfad:** Manual Path (Steps 6-22)

---

## Zusammenfassung

Nach umfassender Analyse des Lernplan-Wizard wurden **10 kritische Probleme** im Daten-Handling identifiziert.

---

## Problem 1: Doppelte Block-Datenstrukturen

### Beschreibung
Zwei separate Datenstrukturen für Blöcke existieren parallel:
- `lernbloeckeDraft`: `{ 'zivilrecht': [{ id, size, themen: [] }] }` (keyed by RG)
- `lernplanBloecke`: `{ 'bgb-at': [{ id, size }] }` (keyed by URG)

### Betroffene Dateien
- `wizard-context.jsx:125-127` (State Definition)
- `step-15-lernbloecke.jsx` (verwendet `lernbloeckeDraft`)
- `step-18-bloecke-edit.jsx` (verwendet `lernbloeckeDraft`)
- `step-19-lernplan-bloecke.jsx` (verwendet `lernplanBloecke`)
- `step-21-kalender-vorschau.jsx` (verwendet NUR `lernbloeckeDraft`)

### Problem-Auswirkung
- **Dateninkonsistenz**: Step 21 ignoriert `lernplanBloecke` komplett
- **Verwirrung**: Welche Struktur ist die "echte" für die Kalender-Generierung?
- **Speicherverschwendung**: Redundante Daten

### KPI zur Messung der Behebung
```
KPI-1.1: Anzahl der Block-Datenstrukturen im State = 1 (aktuell: 2)
KPI-1.2: Step 21 verwendet dieselbe Struktur wie Step 18/19 = true (aktuell: false)
KPI-1.3: Unit-Test: Blöcke aus Step 18 erscheinen in Step 21 Vorschau = PASS
```

---

## Problem 2: Step 15 vs Step 18/19 Funktionsüberlappung

### Beschreibung
- **Step 15**: "Lernblöcke erstellen" - erstellt Blöcke und weist Themen zu
- **Step 18**: "Blöcke bearbeiten" - erstellt/bearbeitet dieselben Blöcke
- **Step 19**: "Lernplanblöcke" - erstellt ANDERE Blöcke pro URG

Drei Steps machen im Grunde dasselbe mit unterschiedlichen Datenstrukturen.

### Betroffene Dateien
- `step-15-lernbloecke.jsx`
- `step-18-bloecke-edit.jsx`
- `step-19-lernplan-bloecke.jsx`

### Problem-Auswirkung
- Benutzer erstellt Blöcke in Step 15, dann nochmal in Step 18
- Unklar welche Blöcke "gewinnen"
- UX-Verwirrung

### KPI zur Messung der Behebung
```
KPI-2.1: Klare Trennung der Step-Verantwortlichkeiten dokumentiert = true (aktuell: false)
KPI-2.2: PRD.md enthält Datenfluss-Diagramm für Blöcke = true (aktuell: false)
KPI-2.3: End-to-End Test: Blöcke aus Step 15 → Step 21 ohne Datenverlust = PASS
```

---

## Problem 3: Verwaiste Themen-Daten (Orphaned Themes)

### Beschreibung
`themenDraft` ist nach URG-ID geKeyT:
```javascript
themenDraft = { 'bgb-at': [{ id, name, aufgaben }] }
```

Wenn Benutzer in Step 9 eine URG entfernt NACHDEM in Step 12 Themen hinzugefügt wurden, bleiben die Themen im State aber werden nie angezeigt.

### Betroffene Dateien
- `wizard-context.jsx:113` (themenDraft Definition)
- `step-9-urgs-edit.jsx` (URG Entfernung)
- `step-12-themen-edit.jsx` (Themen hinzufügen)

### Problem-Auswirkung
- Speicherleck (orphaned data)
- Falsche Statistiken (Themen-Count inkorrekt)
- Potentieller Datenverlust wenn Benutzer zurückgeht

### KPI zur Messung der Behebung
```
KPI-3.1: Beim Entfernen einer URG werden zugehörige Themen gelöscht = true (aktuell: false)
KPI-3.2: Regression-Test: URG entfernen nach Themen-Erstellung = PASS
KPI-3.3: State-Größe nach URG-Entfernung reduziert sich = true
```

---

## Problem 4: Inkonsistente Index-Navigation

### Beschreibung
Verschiedene Steps verwenden unterschiedliche Index-Strategien:
- **Step 12**: `currentRechtsgebietIndex` (global, aus Context)
- **Step 15**: `activeRgIndex` (lokal, useState)
- **Step 17-19**: `currentBlockRgIndex` (global, aus Context)

### Betroffene Dateien
- `wizard-context.jsx:107,121` (Index Definitionen)
- `step-12-themen-edit.jsx:369` (verwendet currentRechtsgebietIndex)
- `step-15-lernbloecke.jsx:256` (verwendet lokalen activeRgIndex)
- `step-17-rg-bloecke-select.jsx` (verwendet currentBlockRgIndex)

### Problem-Auswirkung
- Step 15 zeigt möglicherweise andere RG als erwartet
- Verwirrung beim Debugging
- Inkonsistente UX (Step 12 zeigt RG 2, Step 15 zeigt RG 1 nach Navigation)

### KPI zur Messung der Behebung
```
KPI-4.1: Alle RG-bezogenen Steps verwenden konsistente Index-Strategie = true (aktuell: false)
KPI-4.2: Dokumentation erklärt Index-Unterschiede = true (aktuell: false)
KPI-4.3: E2E-Test: RG-Auswahl bleibt konsistent über Steps = PASS
```

---

## Problem 5: Keine Datenbereinigung bei Zurück-Navigation

### Beschreibung
Wenn Benutzer von Step 15 zurück zu Step 9 geht und URGs ändert, werden:
- Themen in `themenDraft` NICHT aktualisiert
- Blöcke in `lernbloeckeDraft` NICHT aktualisiert
- Gewichtungen in `rechtsgebieteGewichtung` NICHT aktualisiert

### Betroffene Dateien
- `wizard-context.jsx:396-429` (prevStep Funktion)

### Problem-Auswirkung
- Inkonsistenter State nach Zurück-Navigation
- Benutzer sieht möglicherweise alte/invalide Daten
- Blöcke referenzieren nicht-existierende URGs

### KPI zur Messung der Behebung
```
KPI-5.1: prevStep-Funktion bereinigt abhängige Daten = true (aktuell: false)
KPI-5.2: Test: Nach Zurück+URG-Änderung sind Themen konsistent = PASS
KPI-5.3: Cascade-Delete für abhängige Daten implementiert = true
```

---

## Problem 6: API-Call sendet unvollständige Daten

### Beschreibung
`completeWizard()` sendet an `/api/wizard/complete`:
```javascript
body: JSON.stringify({
  title, startDate, endDate, bufferDays, vacationDays,
  blocksPerDay, weekStructure, creationMethod,
  selectedTemplate, aiSettings, unterrechtsgebieteOrder,
  learningDaysOrder, adjustments
})
```

**FEHLT:**
- `themenDraft` (alle Themen und Aufgaben)
- `lernbloeckeDraft` (alle Blöcke)
- `selectedRechtsgebiete`
- `rechtsgebieteGewichtung`
- `verteilungsmodus`

### Betroffene Dateien
- `wizard-context.jsx:660-695` (completeWizard)

### Problem-Auswirkung
- Backend erhält nicht die manuell erstellten Daten
- Lernplan wird ohne Themen/Aufgaben erstellt
- Wizard-Arbeit geht verloren

### KPI zur Messung der Behebung
```
KPI-6.1: API-Payload enthält themenDraft = true (aktuell: false)
KPI-6.2: API-Payload enthält lernbloeckeDraft = true (aktuell: false)
KPI-6.3: API-Payload enthält alle Manual-Path Felder = true (aktuell: false)
KPI-6.4: Integration-Test: Erstellter Lernplan enthält alle Themen = PASS
```

---

## Problem 7: Step 13 wird übersprungen aber existiert noch

### Beschreibung
In `wizard-context.jsx:341-346`:
```javascript
// Step 13 is now skipped (legacy - kept for backwards compatibility)
if (currentStep === 13) {
  updates.currentStep = 14;
  return { ...prev, ...updates };
}
```

Aber `step-13-themen-success.jsx` existiert noch und wird in `wizard-page.jsx:184` importiert.

### Betroffene Dateien
- `wizard-context.jsx:341-346`
- `wizard-page.jsx:35,184`
- `step-13-themen-success.jsx`

### Problem-Auswirkung
- Toter Code im Bundle
- Verwirrung bei Wartung
- Bundle-Größe unnötig erhöht

### KPI zur Messung der Behebung
```
KPI-7.1: step-13-themen-success.jsx gelöscht oder reaktiviert = true (aktuell: false)
KPI-7.2: Kein toter Import in wizard-page.jsx = true (aktuell: false)
KPI-7.3: Bundle-Größe reduziert nach Bereinigung = Messung erforderlich
```

---

## Problem 8: Validierungs-Lücke in Step 15

### Beschreibung
Step 15 Validierung in `wizard-context.jsx:583-585`:
```javascript
case 15:
  // Step 15: Themen/URGs overview - always valid (review step)
  return true;
```

Aber Step 15 ist jetzt ein **Block-Erstellungs-Step**, nicht nur ein Review-Step.

### Betroffene Dateien
- `wizard-context.jsx:583-585`
- `step-15-lernbloecke.jsx`

### Problem-Auswirkung
- Benutzer kann Step 15 ohne Blöcke verlassen
- Inkonsistente Validierung mit Step 18 (das Blöcke erfordert)

### KPI zur Messung der Behebung
```
KPI-8.1: Step 15 Validierung prüft auf mindestens einen Block = true (aktuell: false)
KPI-8.2: Validierungslogik konsistent mit Step 18 = true
KPI-8.3: Test: "Weiter" Button disabled ohne Blöcke = PASS
```

---

## Problem 9: Kalender-Generierung ignoriert lernplanBloecke

### Beschreibung
`step-21-kalender-vorschau.jsx` verwendet nur `lernbloeckeDraft`:
```javascript
const blockPool = flattenBlocksToPool(lernbloeckeDraft, selectedRechtsgebiete);
```

`lernplanBloecke` (erstellt in Step 19) wird komplett ignoriert.

### Betroffene Dateien
- `step-21-kalender-vorschau.jsx:17-45,132`

### Problem-Auswirkung
- Step 19 Arbeit ist effektiv nutzlos
- Benutzer denkt ihre Block-Konfiguration wird verwendet, aber wird ignoriert
- Kalender-Vorschau entspricht nicht den Erwartungen

### KPI zur Messung der Behebung
```
KPI-9.1: Step 21 verwendet lernplanBloecke ODER lernbloeckeDraft ist konsolidiert = true (aktuell: false)
KPI-9.2: Dokumentation klärt welche Daten für Kalender verwendet werden = true
KPI-9.3: E2E-Test: Step 19 Blöcke erscheinen in Step 21 = PASS
```

---

## Problem 10: Fehlende Themen-Validierung vor Block-Zuweisung

### Beschreibung
Benutzer kann Step 12 (Themen) mit Warnung überspringen und trotzdem in Step 15/18 Blöcke erstellen. Die Blöcke haben dann keine Themen zum Zuweisen.

### Betroffene Dateien
- `wizard-context.jsx:549-562` (Step 12 Validierung)
- `step-15-lernbloecke.jsx` (zeigt leere Themen-Liste)

### Problem-Auswirkung
- Benutzer erstellt leere Blöcke
- Kalender enthält Blöcke ohne Inhalt
- Schlechte UX

### KPI zur Messung der Behebung
```
KPI-10.1: Step 15/18 zeigt Warnung wenn keine Themen existieren = true (aktuell: false)
KPI-10.2: Mindestens ein Thema erforderlich für Block-Erstellung = Entscheidung erforderlich
KPI-10.3: UX-Test: Benutzer versteht warum Blöcke leer sind = Messung erforderlich
```

---

## Prioritäts-Matrix

| Problem | Schweregrad | Aufwand | Priorität |
|---------|-------------|---------|-----------|
| P6: API unvollständig | KRITISCH | Mittel | **P0** |
| P1: Doppelte Strukturen | HOCH | Hoch | **P1** |
| P9: Kalender ignoriert Daten | HOCH | Mittel | **P1** |
| P3: Orphaned Themes | MITTEL | Mittel | **P2** |
| P5: Keine Daten-Cleanup | MITTEL | Hoch | **P2** |
| P8: Validierungs-Lücke | MITTEL | Niedrig | **P2** |
| P2: Step-Überlappung | MITTEL | Hoch | **P3** |
| P4: Index-Inkonsistenz | NIEDRIG | Mittel | **P3** |
| P7: Toter Code | NIEDRIG | Niedrig | **P4** |
| P10: Themen-Validierung | NIEDRIG | Niedrig | **P4** |

---

## Nächste Schritte

1. [ ] **P0: API-Payload korrigieren** - `completeWizard()` muss alle Manual-Path Daten senden
2. [ ] **P1: Datenstruktur konsolidieren** - Entscheiden: `lernbloeckeDraft` ODER `lernplanBloecke`
3. [ ] **P1: Step 21 Kalender-Logik fixen** - Korrekte Datenquelle verwenden
4. [ ] **PRD.md aktualisieren** - Datenfluss dokumentieren

---

## Test-Szenario für Gesamtvalidierung

```
Schritte:
1. Wizard starten (fresh)
2. Steps 1-6 ausfüllen, "Manual" wählen
3. Step 7-9: URGs hinzufügen
4. Step 12: 3 Themen mit je 2 Aufgaben erstellen
5. Step 14: Gewichtung 40/30/30 setzen
6. Step 15: 5 Lernblöcke erstellen, Themen zuweisen
7. Step 20: Verteilungsmodus "gemischt" wählen
8. Step 21: Kalender-Vorschau prüfen
9. Step 22: Lernplan erstellen

Erwartetes Ergebnis:
- API erhält alle 3 Themen mit 6 Aufgaben
- API erhält alle 5 Lernblöcke
- Kalender zeigt korrekte Verteilung
- Erstellter Lernplan enthält alle Daten
```

---

*Dokumentation erstellt durch Claude Code Wizard-Analyse*
