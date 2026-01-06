# Lernplan-Wizard Analyse & TODO

**Datum:** 2026-01-06
**Status:** ✅ P0/P1/P2 komplett implementiert, nur noch Testing ausstehend

---

## Inhaltsverzeichnis

1. [Architektur-Übersicht](#1-architektur-übersicht)
2. [Geklärte Fragen](#2-geklärte-fragen)
3. [Kritische Probleme](#3-kritische-probleme)
4. [Fehlende Implementierungen](#4-fehlende-implementierungen)
5. [Inkonsistenzen](#5-inkonsistenzen)
6. [Edge Cases](#6-edge-cases)
7. [Prioritäten-Matrix](#7-prioritäten-matrix)

---

## 1. Architektur-Übersicht

### Pfade durch den Wizard

```
Gemeinsame Schritte 1-6 (alle Pfade)
│
├─ Manual Path A: "Im Kalender erstellen" → ~10 Schritte
│  Step 7:  step-8-calendar.jsx (direkte Kalender-Bearbeitung)
│  [Schneller Weg für erfahrene User]
│
├─ Manual Path B: "Als Liste erstellen" → 22 Schritte
│  Step 7:  URG-Modus (manual vs prefilled)
│  Step 8:  RG auswählen ─────────────────┐
│  Step 9:  URGs bearbeiten               │ LOOP für
│  Step 10: URGs Erfolg ──────────────────┘ alle RGs
│  Step 11: Themen Intro
│  Step 12: Themen bearbeiten ────────────┐
│  Step 13: Themen Erfolg ────────────────┘ LOOP für alle RGs
│  Step 14: Gewichtung (informativ, 100%)
│  Step 15: Themen-URGs
│  Step 16: Blöcke Intro
│  Step 17: RG für Blöcke auswählen ──────┐
│  Step 18: Blöcke bearbeiten             │ LOOP für
│  Step 19: Lernplan-Blöcke ──────────────┘ alle RGs
│  Step 20: Verteilungsmodus
│  Step 21: Kalender-Vorschau
│  Step 22: Bestätigung → completeWizard()
│
├─ Automatic Path → 10 Schritte
│  Step 7:  Manueller Lernplan-Editor
│  Step 8:  Unterrechtsgebiete Reihenfolge
│  Step 9:  Lerntage Reihenfolge
│  Step 10: Anpassungen → completeAutomaticLernplan()
│
├─ Template Path → 9 Schritte
│  Step 7:  Template auswählen → createLernplanFromTemplate()
│  Step 8:  Lerntage (überspringt URG-Reihenfolge)
│  Step 9:  Anpassungen
│
└─ AI Path → 8 Schritte
   Step 7:  AI Konfiguration
   Step 8:  Anpassungen (überspringt alles andere)
```

### Dateien-Inventar

| Kategorie | Anzahl | Zeilen (ca.) |
|-----------|--------|--------------|
| Step-Komponenten | 30 | ~6.500 |
| Context | 1 | ~820 |
| Layout/Components | 9 | ~600 |
| **Gesamt** | **40** | **~8.000** |

---

## 2. Geklärte Fragen

### ✅ GEKLÄRT-001: Zwei manuelle Pfade

**Antwort:** JA, es gibt zwei manuelle Pfade:

| Pfad | Datei | Beschreibung |
|------|-------|--------------|
| **Kalender-Pfad** | `step-8-calendar.jsx` | Direkte Bearbeitung im Kalender (schnell) |
| **Themenlisten-Pfad** | Steps 7-22 | Strukturierte Erstellung über Listen (ausführlich) |

**TODO:**
- [ ] Step 6 UI anpassen: Auswahl zwischen beiden manuellen Pfaden
- [ ] `step-8-calendar.jsx` in wizard-page.jsx integrieren
- [ ] Routing-Logik für beide Pfade implementieren

---

### ✅ GEKLÄRT-002: Rechtsgebiete-Quelle

**Antwort:** Rechtsgebiete kommen aus den **Einstellungen** (Settings-Screen).

**Aktueller Zustand:**
- Hardcoded Fallback: `['zivilrecht', 'oeffentliches-recht', 'strafrecht']`
- Settings-Seite für RG-Auswahl existiert noch NICHT

**TODO:**
- [ ] Settings-Seite erstellen: RG-Auswahl (checkboxes für 4 RGs)
- [ ] UserSettings-Context erweitern mit `selectedRechtsgebiete`
- [ ] Step 7 lädt aus UserSettings statt hardcoded
- [ ] Fallback beibehalten für Erstnutzer

---

### ✅ GEKLÄRT-003: Loop-Navigation (Intentional)

**Antwort:** Loops sind ABSICHTLICH für bessere UX:
- Verhindert Fehler bei URG-Zuordnung
- Gibt Zeit für Korrekturen
- Intuitiver als alle RGs auf einer Seite

**Loop-Struktur:**
```
┌─────────────────────────────────────────────┐
│  Step 8: RG auswählen                       │
│  Step 9: URGs bearbeiten für gewähltes RG   │
│  Step 10: Erfolg/Fehler-Screen              │
│     ↓                                       │
│  Noch nicht alle RGs erledigt?              │
│     → Zurück zu Step 8 (nächstes RG)        │
│  Alle RGs erledigt?                         │
│     → Weiter zu Step 11                     │
└─────────────────────────────────────────────┘
```

**TODO:**
- [ ] Loop-Logik in `nextStep()` implementieren
- [ ] Progress-Check: `Object.keys(rechtsgebieteProgress).length === selectedRechtsgebiete.length`
- [ ] Auto-Navigation zum nächsten unerledigten RG

---

### ✅ GEKLÄRT-004: Gewichtung ist INFORMATIV (nicht algorithmisch)

**Antwort:** Die Gewichtung beeinflusst NICHT den Verteilungsalgorithmus!

**Zweck:**
- Hilft Usern zu verstehen, wie viele Aufgaben pro RG nötig sind
- Orientierungshilfe beim Erstellen von Themen/Aufgaben
- Verhindert "den Wald vor lauter Bäumen nicht sehen"

**Konsequenzen:**
- ~~KRITISCH-004~~ → Gewichtung muss NICHT in Algorithmus integriert werden
- Step 21 Statistik zeigt IST vs SOLL nur zur Information
- Verteilungsmodus arbeitet unabhängig von Gewichtung

**TODO:**
- [ ] Step 14 UI-Text anpassen: Klarstellen dass informativ
- [ ] Step 21 Statistik: Hilfsanzeige, kein Fehler wenn abweichend
- [ ] Gewichtung-Validierung (100%) bleibt wichtig für UX

---

### ✅ GEKLÄRT-005: Kalender-Generierung

**Antwort:** Wahrscheinlich aus anderen Wizards übernehmen.

**Referenz:** `generateSlotsFromWizardState()` in wizard-context.jsx

**TODO:**
- [ ] Bestehende Kalender-Generierung prüfen (Automatic Path)
- [ ] Adaptieren für Themenlisten-Pfad
- [ ] Verteilungsmodus-Logik hinzufügen (gemischt/fokussiert/themenweise)

---

## 3. Kritische Probleme

### ✅ KRITISCH-001: State-Felder werden nie befüllt

**Problem:** Die Draft-Felder werden in den Step-Komponenten referenziert aber nie aktualisiert.

**Status:** ✅ ERLEDIGT - Bei Code-Review entdeckt, dass die Handler bereits implementiert sind:
- `step-9-urgs-edit.jsx`: `handleAddUrg()`, `handleRemoveUrg()` vorhanden
- `step-12-themen-edit.jsx`: `handleAddThema()`, `handleRemoveThema()` vorhanden
- `step-18-bloecke-edit.jsx`: `handleAddBlock()`, `handleRemoveBlock()`, `handleChangeBlockSize()` vorhanden

---

### ✅ KRITISCH-002: Keine Validierung für Schritte 6+

**Problem:** `validateCurrentStep()` gibt für alle Schritte ab 6 einfach `true` zurück.

**Status:** ✅ ERLEDIGT - Validierung in `wizard-context.jsx` implementiert:
- [x] Step 6: `creationMethod !== null`
- [x] Step 7 (manual): `urgCreationMode !== null`
- [x] Step 8 (manual): `selectedRechtsgebiete.length > 0`
- [x] Step 9 (manual): Mindestens ein URG für aktuelles RG
- [x] Step 12 (manual): Mindestens ein Thema für ein URG
- [x] Step 14: `summe(rechtsgebieteGewichtung) === 100`
- [x] Step 18 (manual): Mindestens ein Block erstellt
- [x] Step 19 (manual): Mindestens ein URG hat Blöcke zugewiesen
- [x] Step 20: `verteilungsmodus !== null`

---

### ✅ GEKLÄRT-006: Backend für Wizard-Completion

**Entscheidung:** Daten werden ans **Backend** geschickt.

**Gründe:**
- Server erstellt den Kalender
- Zwischenspeicherung schützt vor Datenverlust bei Absturz
- Konsistent mit anderen Wizard-Pfaden

**Implementierung:**
1. **Finale Completion:** `completeWizard()` → Backend API
2. **Zwischenspeicherung:** Draft regelmäßig an Supabase senden

**Aktueller Stand:**
- ✅ `saveDraftToSupabase()` existiert bereits in wizard-context.jsx
- ✅ Auto-Save mit Debounce (500ms) bei State-Änderungen
- ✅ Alle neuen Felder sind in `initialWizardState` (Zeilen 99-131):
  - `urgCreationMode`, `selectedRechtsgebiete`, `currentRechtsgebietIndex`
  - `rechtsgebieteProgress`, `unterrechtsgebieteDraft`
  - `themenDraft`, `themenProgress`, `rechtsgebieteGewichtung`
  - `currentBlockRgIndex`, `blockRgProgress`, `lernbloeckeDraft`, `lernplanBloecke`
  - `verteilungsmodus`, `generatedCalendar`

**TODO:**
- [x] ~~Verifizieren dass neue State-Felder im Draft gespeichert werden~~ ✅ Bereits enthalten
- [ ] Backend-Endpoint `/api/wizard/complete` implementieren (oder prüfen ob vorhanden)
- [ ] Kalender-Generierung im Backend basierend auf Wizard-Daten

**Status:** ✅ GEKLÄRT

---

### ✅ KRITISCH-004: Loop-Navigation fehlt

**Problem:** Keine Implementierung für RG-Loops in Steps 8-10, 12-13, 17-19.

**Status:** ✅ ERLEDIGT - Loop-Logik in `nextStep()` in `wizard-context.jsx` implementiert:

```javascript
// URG Loop (Steps 8-10):
// Nach Step 10: Prüft ob alle RGs konfiguriert sind
// Falls nicht: Zurück zu Step 8 mit nächstem unconfigured RG
// Falls ja: Weiter zu Step 11

// Themen Loop (Steps 12-13):
// Nach Step 13: Prüft ob alle RGs Themen haben
// Falls nicht: Zurück zu Step 12 (überspringt Intro)
// Falls ja: Weiter zu Step 14

// Blocks Loop (Steps 17-19):
// Nach Step 19: Prüft ob alle RGs Blöcke haben
// Falls nicht: Zurück zu Step 17
// Falls ja: Weiter zu Step 20
```

**Features:**
- [x] Auto-Update von `rechtsgebieteProgress` bei URG-Loop-Ende
- [x] Auto-Update von `themenProgress` bei Themen-Loop-Ende
- [x] Auto-Update von `blockRgProgress` bei Block-Loop-Ende
- [x] Auto-Navigation zum nächsten unconfigured RG

---

### ✅ KRITISCH-005: Kalender-Pfad nicht integriert

**Problem:** `step-8-calendar.jsx` (763 Zeilen) war nie in wizard-page.jsx importiert.

**Status:** ✅ ERLEDIGT
- [x] In Step 6 Auswahl hinzugefügt: "Im Kalender erstellen" (id: `calendar`) vs "Als Liste erstellen" (id: `manual`)
- [x] `calendar` Method in `getTotalStepsForMethod()` hinzugefügt (7 Steps)
- [x] Routing für Kalender-Pfad in wizard-page.jsx implementiert
- [x] Step7Calendar Component importiert und in renderStep() integriert

---

## 4. Fehlende Implementierungen

### ✅ IMPL-001: Settings-Seite für Rechtsgebiete

**Datei:** `src/components/settings/settings-content.jsx`

**Status:** ✅ ERLEDIGT
- [x] Checkboxes für 4 Rechtsgebiete in Jura-Section hinzugefügt
- [x] Min. 1 RG muss ausgewählt sein (letztes Checkbox deaktiviert)
- [x] Speichern in localStorage unter `prepwell_settings.jura.selectedRechtsgebiete`
- [x] Step 7 (URG Mode) liest jetzt aus Settings statt hardcoded

---

### 📝 IMPL-002: URG-Bearbeitung speichern

**Datei:** `step-9-urgs-edit.jsx`

**TODO:**
- [ ] `handleAddUrg()` - URG hinzufügen
- [ ] `handleRemoveUrg()` - URG entfernen
- [ ] `handleUpdateUrg()` - URG umbenennen
- [ ] Progress setzen: `rechtsgebieteProgress[activeRg] = true`

---

### 📝 IMPL-003: Themen-Bearbeitung speichern

**Datei:** `step-12-themen-edit.jsx`

**TODO:**
- [ ] `handleAddThema()` - Thema hinzufügen
- [ ] `handleRemoveThema()` - Thema entfernen
- [ ] `handleUpdateThema()` - Thema bearbeiten
- [ ] Progress setzen: `themenProgress[activeRg] = true`

---

### ✅ IMPL-004: Gewichtung-Validierung

**Datei:** `wizard-context.jsx` & `step-14-gewichtung.jsx`

**Status:** ✅ ERLEDIGT
- [x] `validateCurrentStep()` für Step 14 - erlaubt jetzt optionales Überspringen
- [x] Summen-Check: `sum === 100` wenn aktiviert, sonst gültig
- [x] UI-Feedback bei ungültiger Summe (rote Warnung)
- [x] Hinweis-Text bei gültiger Summe und wenn deaktiviert

---

### ✅ IMPL-005: Verteilungsalgorithmus

**Datei:** `step-21-kalender-vorschau.jsx`

**Status:** ✅ ERLEDIGT
- [x] `gemischt`: Täglich verschiedene RGs abwechseln (round-robin durch Block-Pool)
- [x] `fokussiert`: Ein RG pro Tag, nächsten Tag wechseln
- [x] `themenweise`: ~7 Tage pro RG, dann nächstes
- [x] Fallback für leere `lernbloeckeDraft` (simple RG-basierte Verteilung)
- [x] Edge Cases: leere RGs, keine Blöcke, ungültige Daten

**Hinweis:** Gewichtung beeinflusst NICHT die Verteilung!

---

### ✅ IMPL-006: Kalender-Vorschau echte Daten

**Datei:** `step-21-kalender-vorschau.jsx`

**Status:** ✅ ERLEDIGT (zusammen mit IMPL-005)
- [x] Mock-Generierung durch echten Algorithmus ersetzt
- [x] Daten aus `lernbloeckeDraft` laden und flattening
- [x] Verteilungsmodus anwenden
- [x] Statistik zeigt IST-Verteilung (optional: Ziel wenn Gewichtung aktiv)
- [x] Empty-State-Handling für leere Kalender

---

## 5. Inkonsistenzen

### ✅ INK-001: RG-Namen Schreibweise (Manueller Pfad)

**Problem:** Verschiedene Schreibweisen:

| Datei | Schreibweise |
|-------|--------------|
| `step-7-automatic.jsx` | `"Zivilrecht"`, `"Öffentliches Recht"` |
| `wizard-context.jsx` | `"zivilrecht"`, `"oeffentliches-recht"` |

**Status:** ✅ TEILWEISE ERLEDIGT
- [x] Manueller Pfad (Steps 7-22) nutzt jetzt konsistent `RECHTSGEBIET_LABELS`
- [x] `step-20-verteilungsmodus.jsx` importiert Labels aus zentraler Datei
- [ ] AI/Automatic Pfade haben noch lokale Labels (separates Refactoring)

**Lösung:** Konsistent kebab-case IDs verwenden, Labels aus `RECHTSGEBIET_LABELS`.

---

### ⚠️ INK-002: Step-Nummern dynamisch

**Problem:** Step-Header zeigt feste Nummer, aber Loops ändern effektive Position.

**Lösung:** Step-Nummer dynamisch berechnen oder Loop-Steps nicht nummerieren.

---

## 6. Edge Cases

### 🔶 EDGE-001: Lernzeitraum zu kurz

**Validierung in Step 1:**
- Mindestens 7 Tage Lernzeitraum
- Oder: Warnung wenn < 14 Tage

---

### 🔶 EDGE-002: Puffer + Urlaub >= Gesamttage

**Validierung:**
- `totalDays - bufferDays - vacationDays > 0`
- Fehler wenn Lerntage <= 0

---

### 🔶 EDGE-003: BlocksPerDay variabel

**Problem:** UI zeigt `/3` hardcoded.

**Lösung:** `{block.size}/{blocksPerDay}` dynamisch.

---

### 🔶 EDGE-004: Keine Rechtsgebiete

**Fallback:** Wenn Settings leer, hardcoded 3 RGs verwenden.

---

### 🔶 EDGE-005: Gewichtung 0%

**Entscheidung:** 0% ist erlaubt (RG wird in Statistik ignoriert, aber nicht aus Verteilung entfernt).

---

## 7. Prioritäten-Matrix

| Priorität | ID | Problem | Status |
|-----------|-----|---------|--------|
| ✅ P0 | KRITISCH-001 | State-Felder nie befüllt | ✅ ERLEDIGT (bereits vorhanden) |
| ✅ P0 | KRITISCH-002 | Keine Validierung Steps 6+ | ✅ ERLEDIGT |
| ✅ P0 | KRITISCH-004 | Loop-Navigation fehlt | ✅ ERLEDIGT |
| ✅ P1 | IMPL-001 | Settings-Seite für RGs | ✅ ERLEDIGT |
| ✅ P1 | IMPL-004 | Gewichtung-Validierung | ✅ ERLEDIGT |
| ✅ P1 | KRITISCH-005 | Kalender-Pfad integrieren | ✅ ERLEDIGT |
| ✅ P2 | IMPL-005 | Verteilungsalgorithmus | ✅ ERLEDIGT |
| ✅ P2 | INK-001 | RG-Namen Inkonsistenz (manueller Pfad) | ✅ ERLEDIGT |
| ✅ P2 | EDGE-001-005 | Edge Cases | ✅ ERLEDIGT |

---

## Nächste Schritte

1. [x] **KLÄRUNG:** Fragen zu Pfaden, Loops, Gewichtung - ERLEDIGT
2. [x] **P0 Fixes:** State-Speicherung, Validierung, Loop-Navigation - ERLEDIGT
3. [x] **P1 Features:** Settings-Seite für RGs - ERLEDIGT
4. [x] **P1 Features:** Kalender-Pfad Integration (step-8-calendar.jsx) - ERLEDIGT
5. [x] **P2 Polish:** Verteilungsalgorithmus, Edge Cases, Inkonsistenzen - ERLEDIGT
6. [ ] **Testing:** Alle Pfade manuell durchtesten

---

*Letzte Aktualisierung: 2026-01-06 (KRITISCH-005 Kalender-Pfad integriert)*
