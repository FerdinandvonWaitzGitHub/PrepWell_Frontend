# Ticket 23: Themenliste Editor - Bug Fixes & UX Verbesserungen

**Datum:** 19.01.2026
**Status:** Offen
**Priorität:** Hoch
**Abhängigkeiten:** T22 (Themenliste Editor Grundgerüst)

---

## Zusammenfassung der Probleme

Der Themenliste Editor aus T22 hat mehrere kritische Bugs und UX-Probleme:

| # | Problem | Typ | Schwere |
|---|---------|-----|---------|
| 1 | Rechtsgebiete/Unterrechtsgebiete können nicht gelöscht werden | Feature fehlt | Hoch |
| 2 | Hierarchieebenen klappen nicht automatisch auf | UX | Hoch |
| 3 | "Fehler beim Speichern" - `saveContentPlanToSupabase is not a function` | Bug | Kritisch |
| 4 | Kein "Fertig"-Button zum Abschließen | Feature fehlt | Hoch |
| 5 | Themenlisten akkumulieren sich endlos in Lernpläne | Bug | Kritisch |
| 6 | React setState-during-render Warning | Bug | Mittel |

---

## Problem 1: Rechtsgebiete/Unterrechtsgebiete nicht löschbar

### Ist-Zustand

Der Delete-Handler in `themenliste-editor.jsx` behandelt nur:
- `thema` (Zeilen 286-320)
- `aufgabe` (Zeilen 321-364)

Es gibt **keine** Löschmöglichkeit für:
- Rechtsgebiete
- Unterrechtsgebiete
- Kapitel (falls aktiviert)

### Auswirkung

Einmal hinzugefügte Rechtsgebiete/Unterrechtsgebiete können nicht mehr entfernt werden.

### Lösungsvorschlag

Delete-Handler erweitern um folgende Typen:

```javascript
// In handleConfirmDelete erweitern:
if (deleteTarget.type === 'rechtsgebiet') {
  const updatedRechtsgebiete = contentPlan.rechtsgebiete.filter(
    rg => rg.id !== deleteTarget.id
  );
  updatePlan({ rechtsgebiete: updatedRechtsgebiete });

} else if (deleteTarget.type === 'unterrechtsgebiet') {
  const updatedRechtsgebiete = contentPlan.rechtsgebiete.map(rg => {
    if (rg.id !== deleteTarget.rgId) return rg;
    return {
      ...rg,
      unterrechtsgebiete: (rg.unterrechtsgebiete || []).filter(
        urg => urg.id !== deleteTarget.id
      ),
    };
  });
  updatePlan({ rechtsgebiete: updatedRechtsgebiete });

} else if (deleteTarget.type === 'kapitel') {
  // ... analog für Kapitel
}
```

### UI-Änderungen in ThemenNavigation

Jedes Rechtsgebiet und Unterrechtsgebiet braucht einen Delete-Button:

```jsx
// In themen-navigation.jsx
<button
  onClick={(e) => {
    e.stopPropagation();
    onDeleteRechtsgebiet(rg.id);
  }}
  className="p-1 hover:bg-red-100 rounded text-red-500"
>
  <Trash2 className="w-4 h-4" />
</button>
```

---

## Problem 2: Hierarchieebenen klappen nicht automatisch auf

### Ist-Zustand

Wenn der User ein neues Rechtsgebiet erstellt:
1. Rechtsgebiet wird hinzugefügt (eingeklappt)
2. User muss auf "+" klicken um die nächste Ebene freizuschalten
3. User muss jede Ebene manuell aufklappen

Das "+" Icon ist **nicht offensichtlich** und führt zu schlechter UX.

### Screenshot-Analyse

Das "+" neben jedem Rechtsgebiet ist zu subtil. User erwarten:
- Dass alles automatisch aufklappt
- Dass leere Eingabefelder erscheinen

### Lösungsvorschlag A: Auto-Expand mit leeren Feldern

Bei Erstellen eines neuen Rechtsgebiets:

```javascript
const handleAddRechtsgebiet = (rechtsgebietId) => {
  // ... existing code ...

  // Automatisch aufklappen
  setExpandedRechtsgebiete(prev => new Set([...prev, newRg.id]));

  // Leeres Unterrechtsgebiet-Dropdown anzeigen
  setPendingUntergebiet({ rgId: newRg.id, isNew: true });
};
```

**Pending State für leere Eingaben:**

```javascript
const [pendingItems, setPendingItems] = useState({
  untergebiet: null,  // { rgId }
  kapitel: null,      // { rgId, urgId }
  thema: null,        // { rgId, urgId, kapitelId? }
});
```

**UI mit Pending-Items:**

```jsx
{/* Zeige leeres Dropdown wenn pending */}
{pendingItems.untergebiet?.rgId === rg.id && (
  <div className="ml-4 p-2 bg-blue-50 border border-blue-200 rounded">
    <select
      autoFocus
      onChange={(e) => handleSelectUntergebiet(rg.id, e.target.value)}
      className="w-full"
    >
      <option value="">Unterrechtsgebiet auswählen...</option>
      {availableUnterrechtsgebiete.map(urg => (
        <option key={urg.id} value={urg.id}>{urg.name}</option>
      ))}
    </select>
  </div>
)}
```

### Lösungsvorschlag B: Geführter Wizard-Flow

Alternative: Statt alles aufzuklappen, einen geführten Prozess:

1. User wählt Rechtsgebiet → Modal öffnet sich
2. Modal: Unterrechtsgebiet auswählen (Dropdown)
3. Modal: Kapitel eingeben (optional)
4. Modal: Erstes Thema eingeben
5. Alles wird in einem Schritt erstellt

**Vorteil:** Weniger Komplexität in der Navigation
**Nachteil:** Mehr Klicks für erfahrene User

### Empfehlung

**Lösungsvorschlag A** mit zusätzlichen visuellen Hinweisen:

- Größeres, farbiges "+" Icon mit Tooltip
- Pulsierender/hervorgehobener Zustand für neue leere Elemente
- Optional: Onboarding-Overlay beim ersten Mal

---

## Problem 3: Fehler beim Speichern

### Console Error

```
Auto-save failed: TypeError: saveContentPlanToSupabase is not a function
    at themenliste-editor.jsx:122:15
```

### Ursache

In `themenliste-editor.jsx` Zeile 34:

```javascript
const { createContentPlan, saveContentPlanToSupabase } = useCalendar();
```

Aber `saveContentPlanToSupabase` wird **nicht** vom CalendarContext exportiert!

**Exportierte Funktionen (calendar-context.jsx Zeilen 2854-2858):**
- `createContentPlan` ✓
- `updateContentPlan` ✓
- `deleteContentPlan` ✓
- `archiveContentPlan` ✓
- `getContentPlansByType` ✓
- `getContentPlanById` ✓

**NICHT exportiert:**
- `saveContentPlanToSupabase` ✗ (interne Funktion)

### Lösung

Auto-Save muss `updateContentPlan` verwenden statt `saveContentPlanToSupabase`:

```javascript
// Zeile 34 ändern:
const { createContentPlan, updateContentPlan } = useCalendar();

// Zeile 122 ändern:
useEffect(() => {
  if (!hasChanges || !draftLoaded) return;

  const timeoutId = setTimeout(async () => {
    setAutoSaveStatus('saving');
    try {
      await updateContentPlan(contentPlan.id, contentPlan);
      setAutoSaveStatus('saved');
      setHasChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
    }
  }, 500);

  return () => clearTimeout(timeoutId);
}, [contentPlan, hasChanges, updateContentPlan, draftLoaded]);
```

---

## Problem 4: Kein "Fertig"-Button

### Ist-Zustand

Der Footer (`themenliste-footer.jsx`) hat nur:
- "Archivieren" Button
- "Abbrechen" Button

Es fehlt ein **"Fertig"** oder **"Speichern & Schließen"** Button.

### Auswirkung

User wissen nicht wie sie den Erstellungsprozess abschließen sollen.

### Lösung

Neuen Button hinzufügen:

```jsx
// In themenliste-footer.jsx
<Button
  onClick={onFinish}
  className="rounded-3xl bg-blue-600 text-white hover:bg-blue-700"
>
  <Check className="w-4 h-4 mr-2" />
  Fertig
</Button>
```

**Handler in themenliste-editor.jsx:**

```javascript
const handleFinish = useCallback(async () => {
  // Validierung: Name erforderlich
  if (!contentPlan.name.trim()) {
    // Zeige Fehler
    return;
  }

  // Final speichern
  await updateContentPlan(contentPlan.id, {
    ...contentPlan,
    status: 'active', // oder 'published'
  });

  // Draft löschen
  localStorage.removeItem(DRAFT_KEY);

  // Zur Übersicht navigieren
  navigate('/lernplan');
}, [contentPlan, updateContentPlan, navigate]);
```

---

## Problem 5: Themenlisten akkumulieren sich endlos

### Ist-Zustand

Jedes Mal wenn der Editor geladen wird, wird eine neue Themenliste erstellt:

```javascript
// Zeile 46-54
const [contentPlan, setContentPlan] = useState(() => {
  const newPlan = createContentPlan({ type: 'themenliste', name: '' });
  return {
    ...newPlan,
    name: '',
    description: '',
    rechtsgebiete: [],
  };
});
```

### Ursache

`createContentPlan` ist eine **async Funktion** die:
1. Einen neuen Plan erstellt
2. Ihn zu Supabase speichert
3. Ihn zu contentPlans hinzufügt

Aber hier wird sie **synchron** während der State-Initialisierung aufgerufen!

### Lösung

**Nicht** `createContentPlan` während der Initialisierung aufrufen. Stattdessen:

```javascript
// State initialisieren ohne createContentPlan
const [contentPlan, setContentPlan] = useState({
  id: `draft-${Date.now()}`,
  type: 'themenliste',
  name: '',
  description: '',
  rechtsgebiete: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Erst beim ERSTEN Speichern den Plan erstellen
const handleFirstSave = useCallback(async () => {
  const savedPlan = await createContentPlan({
    ...contentPlan,
    id: undefined, // Server generiert ID
  });
  setContentPlan(savedPlan);
}, [contentPlan, createContentPlan]);
```

**Oder**: Lazy Creation Pattern

```javascript
const [isNewPlan, setIsNewPlan] = useState(true);

// In Auto-Save:
if (isNewPlan) {
  const savedPlan = await createContentPlan(contentPlan);
  setContentPlan(prev => ({ ...prev, id: savedPlan.id }));
  setIsNewPlan(false);
} else {
  await updateContentPlan(contentPlan.id, contentPlan);
}
```

---

## Problem 6: React setState-during-render Warning

### Console Warning

```
Warning: Cannot update a component (`CalendarProvider`) while rendering
a different component (`ThemenlisteEditorPage`).
```

### Ursache

Stack Trace zeigt: `at ThemenlisteEditorPage (themenliste-editor.jsx:34:20)`

Zeile 34:
```javascript
const { createContentPlan, saveContentPlanToSupabase } = useCalendar();
```

Und Zeile 47:
```javascript
const newPlan = createContentPlan({ type: 'themenliste', name: '' });
```

`createContentPlan` ruft intern `setState` auf während der Render-Phase von `ThemenlisteEditorPage`.

### Lösung

State-Initialisierung **ohne** Context-Funktionen:

```javascript
const [contentPlan, setContentPlan] = useState({
  id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type: 'themenliste',
  name: '',
  description: '',
  rechtsgebiete: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
```

Context-Funktionen erst in `useEffect` oder Event-Handlern verwenden.

---

## Implementierungsplan

### Phase 1: Kritische Bugs (Sofort)

1. **Fix setState-during-render** (Problem 6)
   - State ohne createContentPlan initialisieren

2. **Fix Auto-Save** (Problem 3)
   - `saveContentPlanToSupabase` → `updateContentPlan`

3. **Fix Akkumulation** (Problem 5)
   - Lazy Creation Pattern implementieren

### Phase 2: Fehlende Features (Bald)

4. **Fertig-Button** (Problem 4)
   - Button zu Footer hinzufügen
   - handleFinish implementieren

5. **Delete für alle Ebenen** (Problem 1)
   - Delete-Handler erweitern
   - UI-Buttons hinzufügen

### Phase 3: UX Verbesserungen (Später)

6. **Auto-Expand** (Problem 2)
   - Expanded-State tracken
   - Pending-Items für leere Eingaben
   - Visuelle Hinweise verbessern

---

## Betroffene Dateien

| Datei | Änderungen |
|-------|------------|
| `src/pages/themenliste-editor.jsx` | State-Init, Auto-Save, Delete-Handler, handleFinish |
| `src/features/themenliste/components/themen-navigation.jsx` | Delete-Buttons, Auto-Expand, Pending-Items |
| `src/features/themenliste/components/themenliste-footer.jsx` | Fertig-Button |
| `src/features/themenliste/components/delete-confirm-dialog.jsx` | Neue Typen (rechtsgebiet, unterrechtsgebiet, kapitel) |

---

## Testplan

- [ ] Neuer Editor öffnen → keine setState Warning
- [ ] Rechtsgebiet hinzufügen → keine neue Themenliste in DB
- [ ] Änderungen machen → Auto-Save funktioniert ohne Fehler
- [ ] "Fertig" klicken → Draft gelöscht, Navigation zu /lernplan
- [ ] Rechtsgebiet löschen → funktioniert
- [ ] Unterrechtsgebiet löschen → funktioniert
- [ ] Auto-Expand bei neuem Rechtsgebiet → leere Felder erscheinen

---

## Referenzen

- T22: Themenliste Editor Grundgerüst
- calendar-context.jsx: ContentPlan CRUD Funktionen
- React Docs: [setState in Render](https://reactjs.org/link/setstate-in-render)
