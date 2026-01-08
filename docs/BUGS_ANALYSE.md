# PrepWell Frontend - Bug-Analyse & Lösungsoptionen

> **Verwendung:** Sage "Problem X, Option Y" um ein Problem mit der gewählten Lösung zu beheben.
> Beispiel: "Problem 1, Option A" oder "P3, B"

---

## Problem 1: Timer läuft über Mitternacht/Tageswechsel weiter

**Status:** ✅ GELÖST (Option D implementiert)

**Dateien:**
- [timer-context.jsx](../src/contexts/timer-context.jsx) (Zeilen 102-210, 488-544)
- [dashboard.jsx](../src/pages/dashboard.jsx) (Zeilen 600-612)

**Behobene Probleme:**

1. ✅ **Timer läuft über Mitternacht:** `loadFromStorage()` prüft jetzt Tageswechsel
2. ✅ **Kein Tagesreset:** Neuer `useEffect` Mitternachts-Watcher (prüft jede Minute)
3. ✅ **Browser-Schließen:** Session wird bei Tageswechsel automatisch gespeichert
4. ✅ **Tagesziel:** Dashboard-Anzeige zeigt korrekt gelernte Zeit / Ziel

**Implementierte Änderungen:**
- `isSameDay()` Hilfsfunktion
- `savePreviousDaySession()` speichert alte Session mit `autoSaved: true` Flag
- `loadFromStorage()` mit Tageswechsel-Check
- Mitternachts-Watcher `useEffect` im TimerProvider

**Aktueller Bug-Code (timer-context.jsx:105-122):**
```javascript
const loadFromStorage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const data = JSON.parse(stored);

  // BUG: Berechnet verstrichene Zeit seit lastUpdated - auch über Tage hinweg!
  if (data.state === TIMER_STATES.RUNNING && data.lastUpdated) {
    const elapsed = Math.floor((Date.now() - data.lastUpdated) / 1000);
    data.elapsedSeconds = (data.elapsedSeconds || 0) + elapsed; // <-- Addiert ALLES
  }
  return data;
};
```

**Erwartetes Verhalten:**
- Timer-Session gehört zu EINEM Tag
- Bei Mitternacht: Session automatisch beenden und speichern
- Bei Browser-Schließen: Session als "abgebrochen" speichern
- Tagesziel = Inverse des Timers (Countdown) ODER Progress (Stoppuhr)

### Lösungsoptionen:

**Option A: Tageswechsel-Check beim Laden (Empfohlen)**
- Prüfe ob `startTime` und `Date.now()` verschiedene Tage sind
- Wenn ja: Berechne nur Zeit bis Mitternacht, speichere Session, starte neu
- Bei Countup: Zeige nur heutige Zeit
- Aufwand: 30-45 min

```javascript
const loadFromStorage = () => {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (!data || data.state !== TIMER_STATES.RUNNING) return data;

  const startDate = new Date(data.startTime).toDateString();
  const todayDate = new Date().toDateString();

  if (startDate !== todayDate) {
    // Session von gestern - automatisch beenden
    saveYesterdaySession(data);
    return null; // Timer zurücksetzen
  }

  // Gleicher Tag - normal fortfahren
  const elapsed = Math.floor((Date.now() - data.lastUpdated) / 1000);
  data.elapsedSeconds = (data.elapsedSeconds || 0) + elapsed;
  return data;
};
```

**Option B: Session an Datum binden + Mitternachts-Check**
- `useEffect` der bei Mitternacht triggert (via setTimeout)
- Session wird automatisch gespeichert und Timer gestoppt
- Neue Session startet automatisch wenn Timer aktiv war
- Aufwand: 45 min

**Option C: Tagesziel direkt an Timer koppeln**
- Tagesziel = Settings ODER Summe geplanter Lern-Sessions ODER kein Ziel
- Progress = aktuelle Timer-Zeit + heute gespeicherte Sessions
- Zeige:
  - **Stoppuhr**: "2h 15min / 6h" (gelernt / Ziel)
  - **Countdown**: "3h 45min verbleibend" (Ziel minus gelernt)
  - **Kein Ziel**: "2h 15min gelernt" (nur Progress)
- Aufwand: 1 Stunde

**Option D: Komplett-Lösung (A + C kombiniert) - EMPFOHLEN**
- Tageswechsel-Check implementieren
- Tagesziel an Timer koppeln
- Beide Probleme gleichzeitig beheben
- Aufwand: 1.5-2 Stunden

---

## Problem 2: Modi-Wechsel Dropdown auf Lernpläne-Seite

**Status:** ✅ GELÖST (Option A implementiert)

**Datei:** [lernplan-content.jsx](../src/components/lernplan/lernplan-content.jsx)

**Entfernte Elemente:**
- `viewMode` State (Zeile 18)
- Filter-Logik nach Modus (Zeilen 60-63)
- Dropdown JSX-Element (Zeilen 156-171)
- `ChevronDownIcon` Import

**Ergebnis:** Alle Lernpläne werden jetzt immer angezeigt, unabhängig vom Modus.

---

## Problem 3: Zielgewichtung - Weiter ohne Einstellung möglich

**Status:** ✅ GELÖST (Option C implementiert)

**Dateien:**
- [wizard-context.jsx](../src/features/lernplan-wizard/context/wizard-context.jsx) (Zeilen 619-629)
- [step-14-gewichtung.jsx](../src/features/lernplan-wizard/steps/step-14-gewichtung.jsx)

**Implementierte Änderungen:**
1. **Validierung geändert:** Gewichtung muss jetzt immer 100% sein (kein Überspringen mehr)
2. **Toggle entfernt:** Gewichtung ist immer aktiv (kein An/Aus mehr)
3. **Auto-Initialisierung:** Gleichmäßige Verteilung wird automatisch gesetzt
4. **Visueller Hinweis:** "Weiter" Button ist grau wenn Summe ≠ 100%
5. **Roter Fehlertext:** Zeigt "Aktuell: X%" wenn nicht 100%

**Verhalten jetzt:**
- Beim Betreten von Step 14: Gewichtungen werden automatisch gleichmäßig verteilt
- Benutzer muss auf 100% anpassen um weiterzukommen
- Grüner Hinweis erscheint wenn 100% erreicht

---

## Problem 4: Mehrere "Weiter"-Tasten in Step 12 (Rote Taste)

**Status:** ✅ GELÖST (Option A implementiert mit Erweiterungen)

**Dateien:**
- [step-12-themen-edit.jsx](../src/features/lernplan-wizard/steps/step-12-themen-edit.jsx)
- [wizard-layout.jsx](../src/features/lernplan-wizard/components/wizard-layout.jsx)

**Behobene Probleme:**

1. ✅ **Status-Banner entfernt:** Der grün/amber Banner (Zeilen 684-725) wurde gelöscht
2. ✅ **Doppelte Buttons entfernt:** wizard-layout.jsx Footer wird für Step 12 ausgeblendet
3. ✅ **RG-Navigation funktioniert:** "Weiter" Button navigiert durch alle Rechtsgebiete
4. ✅ **URG-Validierung:** Prüft ob ALLE Unterrechtsgebiete Themen haben
5. ✅ **Bestätigungs-Dialog:** Bei unvollständigen URGs erscheint Warning mit "Trotzdem weiter" Option

**Implementierte Änderungen:**
- Status-Banner in step-12-themen-edit.jsx entfernt
- `hasCustomNavigation` Flag in wizard-layout.jsx für Step 12
- Footer-Bereich wird für Step 12 ausgeblendet (eigene Navigation vorhanden)

**Navigation in Step 12:**
- "Weiter" → Nächstes Rechtsgebiet (oder Validierung beim letzten RG)
- "Zurück" → Vorheriges Rechtsgebiet (oder Step 11 beim ersten RG)
- RG-Tabs sind klickbar für direkten Wechsel
- Bei letztem RG: Validierung aller URGs, ggf. Warning-Dialog

---

## Problem 5: Step 15 - Unterschiedliche Anzeige Themen vs. Aufgaben

**Status:** ✅ GELÖST (Option B implementiert)

**Datei:** [step-15-lernbloecke.jsx](../src/features/lernplan-wizard/steps/step-15-lernbloecke.jsx)

**Behobene Probleme:**

1. ✅ **Einheitliche Anzeige:** Beide Fälle zeigen jetzt Aufgaben als Liste
2. ✅ **Thema im Block:** Zeigt Thema-Name + alle Aufgaben des Themas als Liste
3. ✅ **Aufgaben im Block:** Zeigt Aufgaben als Liste (wie vorher)

**Implementierte Änderungen:**
- `handleDropOnBlock`: Speichert jetzt vollständige `aufgaben` Array in `block.thema.aufgaben`
- `LernblockCard`: Verwendet direkt `block.thema.aufgaben` statt Lookup
- Stats-Berechnung: Verwendet `b.thema?.aufgaben?.length` statt `aufgabenCount`
- Aufgaben werden mit Checkbox-Icon und Namen angezeigt
- Konsistentes Layout für beide Fälle

**Neuer Code (handleDropOnBlock):**
```javascript
return {
  ...block,
  thema: {
    id: dragData.thema.id,
    name: dragData.thema.name,
    aufgaben: dragData.thema.aufgaben || [], // Full aufgaben array!
    urgId: dragData.thema.urgId
  },
  aufgaben: []
};
```

**Vorher vs. Nachher:**
```
VORHER:                          NACHHER:
┌─────────────────┐              ┌─────────────────┐
│ Thema XYZ       │              │ Thema XYZ       │
│ 3 Aufgaben      │              │ ☐ Aufgabe 1     │
└─────────────────┘              │ ☐ Aufgabe 2     │
                                 │ ☐ Aufgabe 3     │
                                 └─────────────────┘
```

---

## Problem 6: Step 15 - Weiter ohne alles verteilt

**Status:** ✅ GELÖST (Option A implementiert)

**Datei:** [wizard-context.jsx](../src/features/lernplan-wizard/context/wizard-context.jsx) (Zeilen 631-669)

**Behobene Probleme:**

1. ✅ **Strikte Validierung:** ALLE Themen müssen verteilt sein
2. ✅ **Ganzes Thema ODER Aufgaben:** Beide Wege werden akzeptiert
3. ✅ **Button grau:** "Weiter" ist deaktiviert bis alles verteilt ist

**Implementierte Änderungen:**
- Neue Validierungslogik prüft für jedes Rechtsgebiet:
  - Alle Themen sammeln (über URGs)
  - Prüfen ob Thema als Ganzes einem Block zugewiesen ist
  - ODER alle Aufgaben des Themas einzeln verteilt sind
- Button "Weiter" bleibt grau bis Bedingung erfüllt

**Neuer Code:**
```javascript
case 15: {
  // BUG-P6 FIX: Option A - Strikte Validierung
  // ALLE Themen müssen verteilt sein

  for (const rgId of selectedRechtsgebiete) {
    const urgsForRg = unterrechtsgebieteDraft[rgId] || [];
    const rgBlocks = lernbloeckeDraft[rgId] || [];

    const assignedThemeIds = new Set(
      rgBlocks.filter(b => b.thema).map(b => b.thema.id)
    );
    const assignedAufgabeIds = new Set(
      rgBlocks.flatMap(b => (b.aufgaben || []).map(a => a.id))
    );

    for (const urg of urgsForRg) {
      for (const thema of (themenDraft[urg.id] || [])) {
        if (assignedThemeIds.has(thema.id)) continue;
        const aufgaben = thema.aufgaben || [];
        if (aufgaben.length === 0) continue;
        if (!aufgaben.every(a => assignedAufgabeIds.has(a.id))) {
          return false; // Nicht alles verteilt
        }
      }
    }
  }
  return true;
}
```

---

## Problem 7: Wizard-Daten werden nicht in Kalender übertragen

**Status:** ✅ GELÖST (Option B implementiert)

**Datei:** [wizard-context.jsx](../src/features/lernplan-wizard/context/wizard-context.jsx) (Zeilen 719-929)

**Behobene Probleme:**

1. ✅ **Themen werden übertragen:** `generateBlocksFromWizardState()` verteilt jetzt Inhalte
2. ✅ **Aufgaben als Tasks:** Werden in `tasks` JSONB-Feld gespeichert
3. ✅ **Metadaten:** Thema-ID, RG-ID und Herkunft in `metadata` JSONB-Feld

**Implementierte Änderungen:**

- `contentQueue` sammelt alle Blöcke aus `lernbloeckeDraft` (nach RG-Reihenfolge)
- Jeder generierte Kalender-Block erhält den nächsten Content aus der Queue
- `tasks` Array enthält Aufgaben mit `id`, `name`, `completed`, `priority`
- `metadata` enthält `themaId`, `themaName`, `rgId`, `source`
- Kein Schema-Update nötig: `tasks JSONB` und `metadata JSONB` existierten bereits

**Neuer Datenfluss:**
```
Step 15: lernbloeckeDraft enthält Themen + Aufgaben
    ↓
generateBlocksFromWizardState() baut contentQueue
    ↓
Verteilt Inhalte sequentiell auf Lern-Blöcke
    ↓
Kalender zeigt Blöcke MIT Inhalten ✅
```

### Lösungsoptionen (zur Referenz):

**Option A: Themen als ContentPlan speichern**
- Konvertiere `lernbloeckeDraft` zu `ContentPlan` Struktur
- Speichere als `type: 'lernplan'` in Supabase `content_plans`
- Verknüpfe BlockAllocations mit ContentPlan-ID
- Aufwand: 2-3 Stunden

**Option B: Themen direkt in Blöcken speichern (IMPLEMENTIERT)**
- Nutzt bestehende `tasks` und `metadata` JSONB-Felder
- Speichere Aufgaben und Thema-Info direkt im Block
- Aufwand: 1 Stunde

**Option C: Separate Mapping-Tabelle**
- Neue Tabelle `block_content_mappings` (block_id, content_type, content_id)
- Flexibler, aber komplexer
- Aufwand: 3 Stunden

---

## Problem 8: Lernpläne vs. Themenlisten Unterscheidung

**Datei:** [lernplan-content.jsx](../src/components/lernplan/lernplan-content.jsx) (Zeilen 54-70)

**Status:** ✅ Bereits korrekt implementiert

**Beschreibung:**
Die Unterscheidung funktioniert über das `type` Feld in `content_plans`:
- `type: 'lernplan'` → Lernplan (mit Kalender-Verknüpfung, Modi)
- `type: 'themenliste'` → Themenliste (statische Sammlung)

**Aktueller Code:**
```javascript
const lernplaeneOnly = plans.filter(p => p.type === 'lernplan');
const themenlistenOnly = plans.filter(p => p.type === 'themenliste');
```

**Keine Aktion erforderlich** - Unterscheidung ist klar implementiert.

---

## Prioritäts-Übersicht

| Problem | Beschreibung | Schwere | Empfehlung |
|---------|--------------|---------|------------|
| **P1** | Timer über Mitternacht / Tagesziel | ✅ GELÖST | Option D |
| **P2** | Modi-Dropdown entfernen | ✅ GELÖST | Option A |
| **P3** | Zielgewichtung Validierung | ✅ GELÖST | Option C |
| **P4** | Rote Weiter-Taste / Step 12 Nav | ✅ GELÖST | Option A+ |
| **P5** | Step 15 Anzeige uneinheitlich | ✅ GELÖST | Option B |
| **P6** | Step 15 Validierung fehlt | ✅ GELÖST | Option A |
| **P7** | Wizard-Daten nicht übertragen | ✅ GELÖST | Option B |
| **P8** | Lernplan/Themenliste | ✅ OK | - |

---

## Quick Reference

```
🎉 Alle Probleme gelöst!

P1 ✅ Timer über Mitternacht (Option D)
P2 ✅ Modi-Dropdown entfernt (Option A)
P3 ✅ Zielgewichtung Validierung (Option C)
P4 ✅ Step 12 Navigation (Option A+)
P5 ✅ Step 15 Aufgaben-Anzeige (Option B)
P6 ✅ Step 15 Validierung (Option A)
P7 ✅ Wizard-Daten Übertragung (Option B)
P8 ✅ Lernplan/Themenliste OK
```
