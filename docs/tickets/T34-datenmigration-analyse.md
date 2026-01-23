# T34: Datenmigrations-Analyse - Themenliste Datenfluss

## Problem-Zusammenfassung

Beim Erstellen einer Themenliste mit mehreren Fächern (z.B. Mikroökonomie + Makroökonomie) wird nur das erste Fach und dessen Themen gespeichert. Die restlichen Daten gehen verloren.

**Beobachtete Symptome:**
- `selectedAreas: Array(1)` statt Array(2)
- `themen: Array(1)` statt mehrere
- `planName` zeigt nur erstes Fach
- Beim Neu-Erstellen wird altes Draft geladen ("Mikroökonomie hardcoded")

---

## Datenfluss-Analyse

### 1. Datenstruktur (T27 Flat Structure)

```typescript
interface ContentPlan {
  id: string;
  name: string;                    // Auto-generiert aus selectedAreas
  type: 'themenliste' | 'lernplan';
  status: 'draft' | 'active';

  // T27 Flat Structure
  selectedAreas: Area[];           // Ausgewählte Fächer
  themen: Thema[];                 // Flache Liste aller Themen
  kapitel: Kapitel[];              // Optional: Kapitel-Gruppierung
  useKapitel: boolean;
}

interface Area {
  id: string;
  name: string;
  rechtsgebietId: string;
  color: string;                   // Tailwind class, z.B. "bg-blue-500"
}

interface Thema {
  id: string;
  name: string;
  description: string;
  areaId: string;                  // Referenz auf Area.id
  kapitelId: string | null;
  order: number;
  aufgaben: Aufgabe[];
}
```

### 2. Komponenten-Kette

```
User Input
    ↓
AreaAutocompleteInput (handleSelectArea)
    ↓
ThemenlisteHeader (onAreasChange prop)
    ↓
ThemenlisteEditorPage (handleAreasChange)
    ↓
updatePlan({ selectedAreas: newAreas })
    ↓
setContentPlan(prev => {
  const newPlan = { ...prev, ...updates };
  currentPlanRef.current = newPlan;  // T34 Fix 4: SYNCHRON!
  return newPlan;
})
    ↓
performSave() → saveToSupabase()
    ↓
CalendarContext.createContentPlan() oder updateContentPlan()
    ↓
useContentPlansSync.saveContentPlanToSupabase()
    ↓
Supabase content_plans table
```

### 3. Speicher-Orte

| Ort | Zweck | Key/Table |
|-----|-------|-----------|
| React State | Live UI | `contentPlan` in ThemenlisteEditorPage |
| Ref | Race Condition Prevention | `currentPlanRef.current` |
| LocalStorage | Offline/Draft | `prepwell_themenliste_draft` |
| LocalStorage | Sync Cache | `prepwell_content_plans` |
| Supabase | Persistent | `content_plans` table |

---

## Potenzielle Fehlerquellen

### A. Draft-Loading Problem

**Datei:** `src/pages/themenliste-editor.jsx` (Zeilen 149-228)

```javascript
// Check for existing draft on mount
useEffect(() => {
  if (draftLoaded || showDraftDialog || conflictInfo) return;

  const draftJson = localStorage.getItem(DRAFT_KEY);
  // ...
}, [contentPlans, draftLoaded, showDraftDialog, conflictInfo]);
```

**Problem:** Wenn ein altes Draft existiert, wird es geladen und überschreibt den neuen leeren Plan.

**Symptom:** "Mikroökonomie hardcoded" - User sieht altes Draft statt neuen leeren Editor.

### B. Race Condition bei State Updates

**Datei:** `src/pages/themenliste-editor.jsx`

```javascript
const updatePlan = useCallback((updates) => {
  setContentPlan(prev => {
    const newPlan = { ...prev, ...updates, updatedAt: ... };

    // Problem: Wenn isSavingRef.current = true, wird nur pending gesetzt
    if (isSavingRef.current) {
      pendingChangesRef.current = newPlan;
    }

    return newPlan;
  });
  setHasChanges(true);
}, [autoSaveStatus]);
```

**Problem:** Wenn User schnell zweites Fach hinzufügt während Auto-Save läuft:
1. Erstes Fach wird gespeichert
2. Zweites Fach wird zu `pendingChangesRef` gequeued
3. Aber `pendingChangesRef` wird nach Save nicht richtig verarbeitet

**Zeilen 376-383:**
```javascript
if (pendingChangesRef.current) {
  const pendingPlan = pendingChangesRef.current;
  pendingChangesRef.current = null;
  isSavingRef.current = false;
  setHasChanges(true);  // Nur Flag gesetzt, pendingPlan wird NICHT verwendet!
}
```

### C. Ref-Sync Timing

**Datei:** `src/pages/themenliste-editor.jsx` (Zeilen 87-89)

```javascript
useEffect(() => {
  currentPlanRef.current = contentPlan;
}, [contentPlan]);
```

**Problem:** useEffect läuft NACH dem Render. Wenn `performSave()` zu früh aufgerufen wird, könnte `currentPlanRef` noch den alten Wert haben.

### D. handleFinish Closure

**Datei:** `src/pages/themenliste-editor.jsx` (Zeilen 667-704)

```javascript
const handleFinish = useCallback(async () => {
  const planName = getDisplayName(contentPlan.selectedAreas);

  // contentPlan aus Closure - könnte veraltet sein!
  await createContentPlan({
    ...contentPlan,
    name: planName,
    status: 'active',
  });
}, [contentPlan, isSavedToDb, ...]);
```

**Problem:** Wenn User "Fertig" klickt bevor useCallback neu erstellt wird, hat `contentPlan` in der Closure noch alte Daten.

### E. Supabase Transform

**Datei:** `src/hooks/use-supabase-sync.js` (Zeilen 655-678)

```javascript
transformToSupabase: (plan) => {
  return {
    // ...
    selected_areas: plan.selectedAreas || [],
    themen: plan.themen || [],
    // ...
  };
}
```

**Prüfen:** Werden Arrays korrekt als JSONB serialisiert?

### F. LocalStorage Draft Persistence

**Problem:** Draft wird bei `/lernplan/themenliste/neu` nicht immer gelöscht.

**Erwartetes Verhalten:**
- `/lernplan/themenliste/neu` → Neuer leerer Plan, kein Draft laden
- `/lernplan/themenliste/:planId` → Existierenden Plan laden

**Aktuelles Verhalten:**
- Beide Routen laden Draft wenn vorhanden

---

## Debug-Logs (bereits implementiert)

```javascript
// AreaAutocompleteInput
console.log('T33 DEBUG handleSelectArea:', { ... });

// ThemenlisteEditorPage
console.log('T33 DEBUG handleAreasChange:', { ... });
console.log('T33 DEBUG updatePlan:', { ... });
console.log('T33 DEBUG updatePlan result:', { ... });
console.log('T33 DEBUG performSave: STARTING', { ... });
console.log('T33 DEBUG handleFinish:', { ... });

// ThemenlisteT27Card
console.log('T33 DEBUG ThemenlisteT27Card:', { ... });
```

---

## Fix-Vorschläge

### Fix 1: Draft nur bei Edit-Route laden

```javascript
// In useEffect für Draft-Loading
useEffect(() => {
  // Wenn planId vorhanden → Edit-Mode, Draft laden erlaubt
  // Wenn kein planId → New-Mode, KEIN Draft laden
  if (!planId) {
    localStorage.removeItem(DRAFT_KEY);
    setDraftLoaded(true);
    return;
  }

  // Rest des Draft-Loading Codes...
}, [...]);
```

### Fix 2: pendingChangesRef korrekt verarbeiten

```javascript
if (pendingChangesRef.current) {
  const pendingPlan = pendingChangesRef.current;
  pendingChangesRef.current = null;

  // FIX: Pending Plan auch wirklich speichern!
  currentPlanRef.current = pendingPlan;

  isSavingRef.current = false;
  setHasChanges(true);
}
```

### Fix 3: handleFinish mit Ref statt State

```javascript
const handleFinish = useCallback(async () => {
  // Ref statt State verwenden für aktuelle Daten
  const currentPlan = currentPlanRef.current;
  const planName = getDisplayName(currentPlan.selectedAreas);

  await createContentPlan({
    ...currentPlan,
    name: planName,
    status: 'active',
  });
}, [isSavedToDb, createContentPlan, updateContentPlan, navigate]);
```

### Fix 4: Synchroner Ref-Update

```javascript
const updatePlan = useCallback((updates) => {
  setContentPlan(prev => {
    const newPlan = { ...prev, ...updates, updatedAt: ... };

    // SYNC: Ref sofort aktualisieren, nicht via useEffect
    currentPlanRef.current = newPlan;

    if (isSavingRef.current) {
      pendingChangesRef.current = newPlan;
    }

    return newPlan;
  });
  setHasChanges(true);
}, []);
```

---

## Test-Szenario

1. LocalStorage leeren: `localStorage.removeItem('prepwell_themenliste_draft')`
2. Navigiere zu `/lernplan/themenliste/neu`
3. Füge erstes Fach hinzu (z.B. "Mikroökonomie")
4. Warte 1 Sekunde
5. Füge zweites Fach hinzu (z.B. "Makroökonomie")
6. Füge ein Thema für jedes Fach hinzu
7. Klicke "Fertig"
8. Prüfe Console-Logs auf allen Stufen
9. Prüfe `/lernplan` - werden beide Fächer angezeigt?

---

## Priorität

**Hoch** - Datenverlust ist ein kritischer Bug der die Kernfunktionalität betrifft.

## Betroffene Dateien

- `src/pages/themenliste-editor.jsx`
- `src/features/themenliste/components/area-autocomplete-input.jsx`
- `src/hooks/use-supabase-sync.js`
- `src/contexts/calendar-context.jsx`
- `src/components/lernplan/themenliste-t27-card.jsx`

## Abhängigkeiten

- T27 (Themenliste Redesign)
- T32 (Bug Fixes)
- T33 (ThemenlisteT27Card + Edit Route)

---

## Implementation Status

**Status: ABGESCHLOSSEN ✅**

### Implementierte Fixes (2024-01-23)

| Fix | Beschreibung | Datei | Zeile |
|-----|--------------|-------|-------|
| Fix 1 | Draft bei `/neu` löschen | `themenliste-editor.jsx` | ~155 |
| Fix 2 | pendingChangesRef korrekt verarbeiten | `themenliste-editor.jsx` | ~405 |
| Fix 3 | handleFinish mit Ref statt Closure | `themenliste-editor.jsx` | ~735 |
| Fix 4 | Synchroner Ref-Update in updatePlan | `themenliste-editor.jsx` | ~470 |
| **Fix 5** | **KRITISCH: currentPlanRef ID-Sync nach createContentPlan** | `themenliste-editor.jsx` | ~325 |
| **Fix 6** | **KRITISCH: createContentPlan muss Supabase UUID zurückgeben** | `calendar-context.jsx` | ~1661 |

### Code-Änderungen

**Fix 1:** Bei `/lernplan/themenliste/neu` (kein planId) wird Draft sofort gelöscht:
```javascript
if (!planId) {
  localStorage.removeItem(DRAFT_KEY);
  setDraftLoaded(true);
  return;
}
```

**Fix 2:** pendingChangesRef wird nach Save zu currentPlanRef synchronisiert:
```javascript
if (pendingChangesRef.current) {
  currentPlanRef.current = pendingPlan; // T34 FIX
  // ...
}
```

**Fix 3:** handleFinish verwendet jetzt `currentPlanRef.current`:
```javascript
const currentPlan = currentPlanRef.current; // T34 FIX
const planName = getDisplayName(currentPlan.selectedAreas);
```

**Fix 4:** Ref wird synchron in updatePlan aktualisiert:
```javascript
setContentPlan(prev => {
  const newPlan = { ...prev, ...updates };
  currentPlanRef.current = newPlan; // T34 FIX - synchronous
  return newPlan;
});
```

**Fix 5 (KRITISCH):** Nach createContentPlan wird die Supabase-ID auch im Ref aktualisiert:
```javascript
// In saveToSupabase nach createContentPlan:
setContentPlan(prev => ({ ...prev, id: savedPlan.id }));
// T34 FIX: OHNE diesen Zeile verwenden nachfolgende Updates die FALSCHE ID!
currentPlanRef.current = { ...currentPlanRef.current, id: savedPlan.id };
```

**Root Cause für Fix 5:**
- Plan wird erstellt → Supabase gibt UUID zurück (z.B. `c08e835d-...`)
- `setContentPlan` aktualisiert State mit neuer ID
- ABER `currentPlanRef.current` behielt alte lokale ID (`id-...`)
- Nachfolgende `updateContentPlan` Aufrufe verwendeten die falsche ID
- → Daten wurden nie richtig in Supabase aktualisiert!

**Fix 6 (KRITISCH):** `createContentPlan` gibt jetzt das Ergebnis von Supabase zurück:
```javascript
// In calendar-context.jsx createContentPlan:
// ALT (BUG):
await saveContentPlanToSupabase(newPlan);
return newPlan;  // Lokale ID!

// NEU (FIX):
const result = await saveContentPlanToSupabase(newPlan);
return result?.data || newPlan;  // Supabase UUID!
```

**Root Cause für Fix 6:**
- `saveContentPlanToSupabase` (alias `saveItem`) gibt `{ data: planWithUUID }` zurück
- Aber `createContentPlan` hat den Rückgabewert IGNORIERT
- Stattdessen wurde `newPlan` mit lokaler ID (`id-...`) zurückgegeben
- → Selbst mit Fix 5 wurde die lokale ID in den Ref geschrieben, nicht die UUID!

### Abgeschlossen

- [x] Debug console.logs entfernt (2024-01-23)
- [x] User-Test erfolgreich - beide Fächer und Themen werden korrekt gespeichert

### Test-Logs (Fix 5 Verifizierung)

Nach dem Test sollten diese Logs erscheinen:
```
T34 DEBUG: Created new plan with Supabase ID: {
  localId: 'id-...',
  supabaseId: 'uuid-...',
  refUpdated: true  // MUSS true sein!
}
T34 DEBUG: Updating existing plan: {
  planId: 'uuid-...',  // MUSS die Supabase-UUID sein, NICHT 'id-...'
  selectedAreasCount: 2,
  themenCount: 2,
}

