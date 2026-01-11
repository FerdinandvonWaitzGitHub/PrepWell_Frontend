# Ticket 8: TypeError - Cannot read properties of undefined (reading 'aufgaben')

**Status: OFFEN**
**Priorität: KRITISCH**
**Erstellt: 2026-01-11**

## Fehlerbeschreibung

Beim Klicken auf "Neuer Lernplan" tritt folgender Fehler auf:

```
TypeError: Cannot read properties of undefined (reading 'aufgaben')
    at Bn (index-DPdBxtVe.js:129:1475)
    at ru (vendor-react-CUbn0OJn.js:30:16996)
    at wd (vendor-react-CUbn0OJn.js:32:43918)
    ...
```

Der Fehler tritt in einem minifizierten Bundle auf (`index-DPdBxtVe.js`), was auf eine Komponente im Hauptindex-Bundle hinweist (nicht calendar-week).

## Bisherige Fixes (nicht erfolgreich)

### Commit 2eb5bf3 - timeBlocksByDate Null-Checks
```javascript
// Geändert in week-view.jsx, dashboard.jsx, use-dashboard.js
const dayTimeBlocks = (timeBlocksByDate || {})[dateKey] || [];
```

### Commit 712b560 - Weitere *ByDate Null-Checks
```javascript
// visibleSlotsByDate, slotsByDate, privateBlocksByDate, blocksByDate, tasksByDate
const dayBlocks = (visibleSlotsByDate || {})[dateKey] || [];
```

### Commit 0e7776d - aufgaben Null-Checks in calendar-context.jsx
```javascript
// 6 Stellen geändert
aufgaben: [...(t.aufgaben || []), newAufgabe],
aufgaben: (t.aufgaben || []).map(a => ...),
aufgaben: (t.aufgaben || []).filter(a => ...),
```

## Tiefgehende Analyse

### Potenzielle Fehlerquellen

Der Fehler `Cannot read properties of undefined (reading 'aufgaben')` bedeutet:
- Ein Objekt (z.B. `thema`, `block`, `content`) ist `undefined`
- Auf diesem undefined Objekt wird `.aufgaben` aufgerufen

### Verdächtige Code-Stellen

#### 1. `src/features/lernplan-wizard/steps/step-7-automatic.jsx`

**Zeile 114 - KRITISCH:**
```javascript
const addAufgabe = (lerntagIndex, themaIndex) => {
  const thema = newLernplan.rechtsgebiete[selectedRechtsgebiet]
    .unterrechtsgebiete[selectedUnterrechtsgebiet]
    .lerntage[lerntagIndex]
    .themen[themaIndex];
  thema.aufgaben.push({...}); // ← Kein Check ob aufgaben existiert!
};
```

**Zeile 302 - KRITISCH:**
```javascript
{thema.aufgaben.map((aufgabe, aufgabeIndex) => (
  // ← Kein Check ob aufgaben existiert!
))}
```

**Problem:** `thema.aufgaben` wird NIEMALS auf Existenz geprüft.

#### 2. `src/features/lernplan-wizard/steps/step-15-lernbloecke.jsx`

**Zeile 300:**
```javascript
{hasAufgaben && (
  <div className="space-y-1">
    {block.aufgaben.map(aufgabe => (
```

**Problem:** `hasAufgaben` Check ist vorhanden, aber wenn sich `block.aufgaben` zwischen Check und Render ändert (Race Condition), kann der Fehler auftreten.

#### 3. `src/features/lernplan-wizard/steps/step-21-kalender-vorschau.jsx`

**Zeilen 161-165:**
```javascript
} else if (hasAufgaben) {
  pool.push({
    aufgaben: block.aufgaben,
    displayName: block.aufgaben.length === 1
      ? block.aufgaben[0].name
      : `${block.aufgaben.length} Aufgaben`,
    aufgabenCount: block.aufgaben.length,
  });
}
```

**Zeile 273:**
```javascript
count += block.aufgaben.length; // ← Kein null-Check!
```

#### 4. `src/features/lernplan-wizard/steps/step-22-bestaetigung.jsx`

**Zeile 193:**
```javascript
? block.aufgaben[0].name // ← Kein null-Check für aufgaben oder [0]
```

#### 5. `src/features/lernplan-wizard/context/wizard-context.jsx`

**Zeilen 223-225:**
```javascript
} else if (block.aufgaben && block.aufgaben.length > 0) {
  tasks = block.aufgaben.map(a => ({ // Check vorhanden, aber...
```

**Zeilen 983-996:**
```javascript
} else if (content.aufgaben && content.aufgaben.length > 0) {
  topicTitle = content.aufgaben.length === 1
    ? content.aufgaben[0].name
    : `${content.aufgaben.length} Aufgaben`;
  tasks = content.aufgaben.map(a => ({
```

### Kategorisierung der Probleme

| Datei | Zeile | Risiko | Check vorhanden? |
|-------|-------|--------|------------------|
| step-7-automatic.jsx | 114 | KRITISCH | Nein |
| step-7-automatic.jsx | 302 | KRITISCH | Nein |
| step-15-lernbloecke.jsx | 300 | MITTEL | Ja, aber Race Condition möglich |
| step-21-kalender-vorschau.jsx | 161-165 | MITTEL | Ja, aber innerhalb else-if |
| step-21-kalender-vorschau.jsx | 273 | HOCH | Nein |
| step-22-bestaetigung.jsx | 193 | HOCH | Teilweise |
| content-plan-edit-card.jsx | 873 | NIEDRIG | Ja (?.length Check) |

## Vermutete Hauptursache

**Der wahrscheinlichste Kandidat ist `step-7-automatic.jsx`:**

1. Diese Datei wird beim Wizard "Neuer Lernplan" verwendet
2. Sie hat KEINE null-Checks für `thema.aufgaben`
3. Wenn ein Thema ohne initialisiertes `aufgaben`-Array existiert, crasht die App

### Warum tritt der Fehler jetzt auf?

Mögliche Gründe:
1. **Daten-Migration:** LocalStorage-Daten haben inkonsistentes Format
2. **Wizard-State:** Initialer State hat keine `aufgaben`-Arrays
3. **Race Condition:** Daten werden geladen bevor sie vollständig initialisiert sind

## Empfohlene Fixes

### Fix 1: step-7-automatic.jsx (PRIORITÄT 1)

```javascript
// Zeile 114: Sicherstellen dass aufgaben Array existiert
const addAufgabe = (lerntagIndex, themaIndex) => {
  if (!selectedUnterrechtsgebiet) return;
  const newLernplan = { ...lernplan };
  const thema = newLernplan.rechtsgebiete[selectedRechtsgebiet]
    .unterrechtsgebiete[selectedUnterrechtsgebiet]
    .lerntage[lerntagIndex]
    .themen[themaIndex];

  // FIX: Initialisiere aufgaben wenn nicht vorhanden
  if (!thema.aufgaben) {
    thema.aufgaben = [];
  }

  thema.aufgaben.push({...});
  updateLernplan(newLernplan);
};

// Zeile 302: Optional Chaining + Fallback
{(thema.aufgaben || []).map((aufgabe, aufgabeIndex) => (
```

### Fix 2: step-21-kalender-vorschau.jsx (PRIORITÄT 2)

```javascript
// Zeile 273
count += (block.aufgaben || []).length;

// Zeilen 161-165: Defensive Checks
const aufgabenArray = block.aufgaben || [];
pool.push({
  aufgaben: aufgabenArray,
  displayName: aufgabenArray.length === 1
    ? aufgabenArray[0]?.name || 'Aufgabe'
    : `${aufgabenArray.length} Aufgaben`,
  aufgabenCount: aufgabenArray.length,
});
```

### Fix 3: step-22-bestaetigung.jsx (PRIORITÄT 2)

```javascript
// Zeile 193
? (block.aufgaben?.[0]?.name || 'Aufgabe')
```

### Fix 4: step-15-lernbloecke.jsx (PRIORITÄT 3)

```javascript
// Zeile 300
{(block.aufgaben || []).map(aufgabe => (
```

## Systemische Lösung

Langfristig sollte ein **Zod-Schema** für alle Wizard-Datenstrukturen implementiert werden:

```typescript
const ThemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  aufgaben: z.array(AufgabeSchema).default([]), // ← Immer Array
});

const BlockSchema = z.object({
  id: z.string(),
  thema: ThemaSchema.optional(),
  aufgaben: z.array(AufgabeSchema).default([]), // ← Immer Array
});
```

## Test-Szenario

1. LocalStorage leeren (`localStorage.clear()`)
2. App neu laden
3. Auf "Neuer Lernplan" klicken
4. Wizard durchlaufen bis Schritt 7 (Automatische Aufteilung)
5. Prüfen ob Fehler auftritt

## Betroffene Dateien (zur Überprüfung)

- [ ] `src/features/lernplan-wizard/steps/step-7-automatic.jsx`
- [ ] `src/features/lernplan-wizard/steps/step-15-lernbloecke.jsx`
- [ ] `src/features/lernplan-wizard/steps/step-21-kalender-vorschau.jsx`
- [ ] `src/features/lernplan-wizard/steps/step-22-bestaetigung.jsx`
- [ ] `src/features/lernplan-wizard/context/wizard-context.jsx`
- [ ] `src/components/lernplan/content-plan-edit-card.jsx`
- [ ] `src/components/dashboard/session-widget.jsx`
