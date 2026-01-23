# TICKET T32: Themenliste Fach-Eingabe (AreaAutocompleteInput) Bugs

**Typ:** Bug / UX-Verbesserung
**Priorität:** Hoch
**Status:** Offen
**Erstellt:** 2026-01-22
**Aufwand:** 5-6h
**Komponenten:**
- `src/features/themenliste/components/area-autocomplete-input.jsx`
- `src/features/themenliste/components/themen-navigation.jsx`

---

## 1. Problem-Beschreibung

Die Fach-Eingabe (AreaAutocompleteInput) im Themenliste-Editor hat mehrere UX-Probleme:

### Bug 1: Bearbeitung nach Verlassen nicht intuitiv

**Aktuell:** Wenn ein Fach erstellt wurde und der User den Cursor aus der Eingabeleiste bewegt, ist unklar wie man weitere Fächer hinzufügen kann.

**Gewünscht:** Einfacher Klick auf die Fachleiste sollte den Bearbeitungsmodus aktivieren.

### Bug 2: Zweites Fach wird nicht erkannt

**Aktuell:** Nach Eingabe eines Fachs in der Leiste wird ein zweites Fach nicht korrekt erkannt, obwohl es in der Leiste angezeigt wird.

**Vermutete Ursache:** State-Update-Problem oder fehlende Synchronisation zwischen Anzeige und `selectedAreas` Array.

### Bug 3: Fach kann nicht inline erstellt werden

**Aktuell:** Wenn ein Fach nicht in den User Settings existiert, muss der User die Fachleiste verlassen, das Fach in den Einstellungen erstellen und dann zurückkehren.

**Gewünscht:** Möglichkeit, ein neues Fach direkt aus der Fachleiste zu erstellen (inkl. Farbauswahl).

### Bug 4: Fach-Zuordnung bei mehreren Fächern unklar (Thema/Kapitel)

**Aktuell:** Wenn mehrere Fächer in der Themenliste existieren:
- Beim Hinzufügen eines Themas erscheinen kleine Fach-Chips über dem Input (nur wenn >1 Fach)
- Default: Erstes Fach wird automatisch zugeordnet (`selectedAreaId || selectedAreas[0].id`)
- Nachträgliche Änderung nur im Detail-Bereich rechts möglich

**Probleme:**
1. Fach-Auswahl-Chips sind leicht zu übersehen
2. User weiß nicht, dass erstes Fach automatisch zugeordnet wird
3. Nachträgliche Änderung ist versteckt im Detail-Bereich

**Gewünscht:** Klare visuelle Hinweise welches Fach zugeordnet wird + einfache Änderungsmöglichkeit

### Bug 4b: Kapitel-Fach-Bindung (bei useKapitel=true)

**Aktuell:** Kapitel haben KEINE `areaId`. Themen innerhalb eines Kapitels können verschiedene Fächer haben.

**Gewünscht:** Kapitel gehören zu einem Fach. Themen innerhalb eines Kapitels erben automatisch das Fach.

**Hierarchie:**
```
Fach (URG) → Kapitel → Thema
```

**Beispiel:**
```
Polizeirecht (Fach)
├─ Allgemeine Lehren (Kapitel)
│   ├─ Gefahrenabwehr (Thema)       ← Erbt Polizeirecht
│   └─ Verfassungsmäßigkeit (Thema) ← Erbt Polizeirecht
└─ Vollstreckungsrecht (Kapitel)
    └─ Zwangsmittel (Thema)         ← Erbt Polizeirecht
```

---

## 2. Aktueller Code (area-autocomplete-input.jsx)

### 2.1 Bearbeitungsmodus-Toggle (Bug 1)

```jsx
// Zeile 201-240: Editing mode
return (
  <div ref={containerRef} className="relative w-full max-w-3xl mx-auto">
    <div className="flex items-center justify-center">
      <div className="flex items-baseline justify-center flex-wrap">
        {/* Selected areas als Text */}
        {selectedAreas.length > 0 && (
          <span className="text-5xl font-extralight text-neutral-900 whitespace-nowrap">
            {selectedAreas.map(a => a.name).join(', ')}
            {searchQuery.length > 0 && ', '}
          </span>
        )}
        {/* Input field */}
        <input ... />
      </div>
    </div>
  </div>
);
```

**Problem:** Kein onClick-Handler auf dem Container oder Text-Bereich um `isEditing` zu aktivieren.

### 2.2 Area-Erkennung (Bug 2)

```jsx
// Zeile ~160: handleKeyDown
const handleKeyDown = (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    if (highlightedIndex >= 0 && filteredAreas[highlightedIndex]) {
      handleSelectArea(filteredAreas[highlightedIndex]);
    }
  }
  // ...
};
```

**Problem:** Wenn kein Dropdown-Item hervorgehoben ist, wird nichts hinzugefügt.

### 2.3 Fehlendes Fach erstellen (Bug 3)

**Aktuell nicht implementiert.** Es gibt keine Logik zum Erstellen eines neuen Fachs aus dem Autocomplete.

---

## 3. Lösungsvorschläge

### 3.1 Bug 1: Click-to-Edit

**Lösung A: Container onClick**

```jsx
// Display mode (nicht editierend)
if (!isEditing && selectedAreas.length > 0) {
  return (
    <div
      className="cursor-pointer group"
      onClick={() => onEditingChange(true)}  // ← Klick aktiviert Bearbeitung
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-5xl font-extralight text-neutral-900">
          {selectedAreas.map(a => a.name).join(', ')}
        </span>
        <button className="opacity-0 group-hover:opacity-100 ...">
          <Pencil size={20} />
        </button>
      </div>
    </div>
  );
}
```

### 3.2 Bug 2: Zweites Fach erkennen

**Diagnose erforderlich:**
1. Prüfen ob `handleSelectArea` korrekt aufgerufen wird
2. Prüfen ob `selectedAreas` State korrekt aktualisiert wird
3. Prüfen ob Duplikat-Check das Problem verursacht

**Mögliche Fixes:**
- Console.log in `handleSelectArea` zum Debuggen
- Sicherstellen dass `onAreasChange` mit neuem Array aufgerufen wird
- Prüfen ob `filteredAreas` bereits ausgewählte Fächer korrekt filtert

### 3.3 Bug 3: Inline Fach-Erstellung

**Lösung: "Fach erstellen" Option im Dropdown**

```jsx
// Am Ende des Dropdowns, wenn keine exakte Übereinstimmung
{searchQuery.trim() && !exactMatch && (
  <button
    className="w-full px-4 py-3 text-left border-t border-neutral-100 hover:bg-neutral-50"
    onClick={() => setShowCreateDialog(true)}
  >
    <div className="flex items-center gap-3">
      <Plus size={20} className="text-neutral-400" />
      <div>
        <div className="text-sm font-medium text-neutral-700">
          "{searchQuery}" als neues Fach erstellen
        </div>
        <div className="text-xs text-neutral-400">
          Wird zu deinen benutzerdefinierten Fächern hinzugefügt
        </div>
      </div>
    </div>
  </button>
)}
```

**Inline-Dialog für Farbauswahl:**

```jsx
{showCreateDialog && (
  <div className="absolute ... bg-white border rounded-lg shadow-lg p-4">
    <h3 className="font-medium mb-3">Neues Fach erstellen</h3>

    <div className="mb-3">
      <label className="text-sm text-neutral-500">Name</label>
      <input value={searchQuery} disabled className="..." />
    </div>

    <div className="mb-4">
      <label className="text-sm text-neutral-500 mb-2 block">Farbe</label>
      <div className="flex gap-2 flex-wrap">
        {AVAILABLE_COLORS.map(color => (
          <button
            key={color.id}
            onClick={() => setSelectedColor(color.id)}
            className={`w-8 h-8 rounded-full ${color.bgClass} ${
              selectedColor === color.id ? 'ring-2 ring-offset-2' : ''
            }`}
          />
        ))}
      </div>
    </div>

    <div className="flex gap-2 justify-end">
      <button onClick={() => setShowCreateDialog(false)}>Abbrechen</button>
      <button onClick={handleCreateAndSelect}>Erstellen & Auswählen</button>
    </div>
  </div>
)}
```

**Funktion zum Erstellen:**

```javascript
const handleCreateAndSelect = () => {
  // 1. Fach in LocalStorage/Supabase erstellen
  const newSubject = addCustomSubject(searchQuery.trim(), selectedColor);

  // 2. Zum selectedAreas hinzufügen
  const newArea = {
    id: newSubject.id,
    name: newSubject.name,
    color: newSubject.color,
    isCustom: true
  };
  onAreasChange([...selectedAreas, newArea]);

  // 3. Dialog schließen & Input leeren
  setShowCreateDialog(false);
  setSearchQuery('');
  setSelectedColor('blue');
};
```

### 3.4 Bug 4: Fach-Zuordnung verbessern (Lösung E - Hybrid)

**Konzept:** Kombination aus besseren Defaults, visuellen Hinweisen und Inline-Änderung

#### 3.4.1 Smarter Default

```javascript
// In themen-navigation.jsx
const [lastUsedAreaId, setLastUsedAreaId] = useState(null);

const handleAddThema = (kapitelId = null) => {
  if (!newThemaName.trim()) return;

  // Smart Default: Letztes verwendetes Fach oder erstes Fach
  const areaId = selectedAreaId
    || lastUsedAreaId
    || (selectedAreas.length > 0 ? selectedAreas[0].id : null);

  onAddThema(newThemaName.trim(), areaId, kapitelId);

  // Merke letztes Fach für nächstes Thema
  setLastUsedAreaId(areaId);

  setNewThemaName('');
  setSelectedAreaId(null);
  setAddingThemaIn(null);
};
```

#### 3.4.2 Visueller Hinweis über Input

```jsx
// Vor dem Input-Feld anzeigen welches Fach zugeordnet wird
const currentAreaId = selectedAreaId || lastUsedAreaId || selectedAreas[0]?.id;
const currentArea = selectedAreas.find(a => a.id === currentAreaId);

{selectedAreas.length > 1 && (
  <div className="flex items-center justify-between mb-2 px-1">
    <span className="text-xs text-neutral-400">wird zugeordnet zu:</span>
    <button
      onClick={() => setShowAreaPicker(!showAreaPicker)}
      className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-800"
    >
      <span className={`w-2 h-2 rounded-full ${currentArea?.color}`} />
      <span>{currentArea?.name}</span>
      <ChevronDown size={12} />
    </button>
  </div>
)}
```

**UI-Mockup:**

```
┌─────────────────────────────────────────────────┐
│ wird zugeordnet zu: ● Polizeirecht      [▾]    │ ← Info-Zeile mit Dropdown
├─────────────────────────────────────────────────┤
│ Neues Thema...                              [+] │
└─────────────────────────────────────────────────┘
```

#### 3.4.3 Inline-Änderung im Thema-Item (Optional)

```jsx
// In renderThemaItem() - Fach-Badge mit Dropdown
<div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer group">
  {/* Color bar */}
  <span className={`w-1.5 h-8 rounded-full ${getBgColorForThema(thema.areaId)}`} />

  {/* Content */}
  <div className="flex-1 min-w-0">
    <div className="text-sm font-medium text-neutral-900 truncate">
      {thema.name}
    </div>
  </div>

  {/* T32: Quick Area Switcher - nur bei mehreren Fächern */}
  {selectedAreas.length > 1 && (
    <AreaDropdown
      currentAreaId={thema.areaId}
      areas={selectedAreas}
      onChange={(newAreaId) => onUpdateThema(thema.id, { areaId: newAreaId })}
    />
  )}

  {/* Delete button */}
  ...
</div>
```

**UI-Mockup Thema-Item:**

```
│ ▌ Gefahrenabwehr                    [Polizei ▾] │
│ ▌ Kommunalverfassung                [Kommun. ▾] │
```

#### 3.4.4 AreaDropdown Komponente

```jsx
const AreaDropdown = ({ currentAreaId, areas, onChange }) => {
  const [open, setOpen] = useState(false);
  const currentArea = areas.find(a => a.id === currentAreaId);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="flex items-center gap-1 px-2 py-0.5 text-xs text-neutral-500
                   hover:bg-neutral-100 rounded opacity-0 group-hover:opacity-100"
      >
        <span className={`w-2 h-2 rounded-full ${currentArea?.color}`} />
        <span className="truncate max-w-[60px]">{currentArea?.name}</span>
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-lg z-10">
          {areas.map(area => (
            <button
              key={area.id}
              onClick={(e) => {
                e.stopPropagation();
                onChange(area.id);
                setOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-xs text-left flex items-center gap-2
                         hover:bg-neutral-50 ${area.id === currentAreaId ? 'bg-neutral-100' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full ${area.color}`} />
              {area.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3.5 Bug 4b: Kapitel-Fach-Bindung (bei useKapitel=true)

**Konzept:** Kapitel bekommt `areaId`, Themen erben automatisch

#### 3.5.1 Schema-Änderung

```javascript
// Aktuelle Struktur
kapitel = [
  { id: '1', name: 'Allgemeine Lehren', order: 0 },
]

// Neue Struktur
kapitel = [
  { id: '1', name: 'Allgemeine Lehren', order: 0, areaId: 'polizeirecht' },  // NEU
]
```

#### 3.5.2 Kapitel-Erstellung mit Fach-Auswahl

```jsx
// In themen-navigation.jsx - Kapitel Input erweitern
{addingKapitel && (
  <div className="px-3 py-2 space-y-2">
    {/* T32: Fach-Auswahl für Kapitel (Pflicht bei >1 Fach) */}
    {selectedAreas.length > 1 && (
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-neutral-400">Fach:</span>
        {selectedAreas.map(area => (
          <button
            key={area.id}
            type="button"
            onClick={() => setNewKapitelAreaId(area.id)}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-full border ${
              (newKapitelAreaId || selectedAreas[0].id) === area.id
                ? 'border-neutral-400 bg-neutral-100'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${area.color}`} />
            <span>{area.name}</span>
          </button>
        ))}
      </div>
    )}
    <input
      type="text"
      value={newKapitelName}
      placeholder={`Neues ${kapitelLabel || 'Kapitel'}...`}
      ...
    />
  </div>
)}
```

#### 3.5.3 Kapitel-Header mit Farbbalken

```jsx
// Kapitel Header mit Fach-Farbe
<div className="flex items-center justify-between px-3 py-2.5 bg-neutral-50">
  <div className="flex items-center gap-2">
    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
    {/* T32: Farbbalken für Kapitel */}
    <span className={`w-1.5 h-6 rounded-full ${getBgColorForThema(kap.areaId)}`} />
    <span className="text-sm font-semibold text-neutral-700">
      {kap.name}
    </span>
    <span className="text-xs text-neutral-400">({kapitelThemen.length})</span>
  </div>
</div>
```

**UI-Mockup:**

```
┌─────────────────────────────────────────────────┐
│ Neues Kapitel                                   │
├─────────────────────────────────────────────────┤
│ Fach: [● Polizei] [○ Kommunal]                  │ ← Pflicht-Auswahl
│ Name: [Allgemeine Lehren              ]         │
└─────────────────────────────────────────────────┘

Nach Erstellung:

┌─────────────────────────────────────────────────┐
│ ▼ ▌ Allgemeine Lehren                      (2) │ ← Grüner Farbbalken
│   ├─ Gefahrenabwehr                            │ ← Kein Fach-Dropdown nötig
│   ├─ Verfassungsmäßigkeit                      │
│   └─ [+ Neues Thema]                           │ ← Fach = Polizeirecht (auto)
└─────────────────────────────────────────────────┘
```

#### 3.5.4 Thema erbt Fach vom Kapitel

```javascript
// handleAddThema anpassen
const handleAddThema = (kapitelId = null) => {
  if (!newThemaName.trim()) return;

  let areaId;
  if (kapitelId && useKapitel) {
    // T32: Thema erbt Fach vom Kapitel
    const parentKapitel = kapitel.find(k => k.id === kapitelId);
    areaId = parentKapitel?.areaId || selectedAreas[0]?.id;
  } else {
    // Ohne Kapitel: Lösung E (Smart Default)
    areaId = selectedAreaId || lastUsedAreaId || selectedAreas[0]?.id;
  }

  onAddThema(newThemaName.trim(), areaId, kapitelId);
  // ...
};
```

#### 3.5.5 Handler für Kapitel-Erstellung

```javascript
// In themenliste-editor.jsx
const handleAddKapitel = useCallback((name, areaId = null) => {
  const newKapitel = {
    id: genId(),
    name,
    order: contentPlan.kapitel.length,
    areaId: areaId || selectedAreas[0]?.id,  // T32: Fach-Zuordnung
  };

  updatePlan({
    kapitel: [...contentPlan.kapitel, newKapitel],
  });

  return newKapitel.id;
}, [contentPlan.kapitel, contentPlan.selectedAreas, updatePlan]);
```

---

## 4. Abhängigkeiten für Bug 3

**Imports benötigt:**

```javascript
import { addCustomSubject, AVAILABLE_COLORS } from '../../../utils/rechtsgebiet-colors';
```

**Integration mit Supabase Sync:**

```javascript
import { useUserSettingsSync } from '../../../hooks/use-supabase-sync';

// In Komponente:
const { updateSettings } = useUserSettingsSync();

const handleCreateAndSelect = () => {
  const newSubject = addCustomSubject(searchQuery.trim(), selectedColor);

  // Sync zu Supabase
  const currentSettings = getSubjectSettings();
  updateSettings({ subjectSettings: currentSettings });

  // ... Rest wie oben
};
```

---

## 5. Akzeptanzkriterien

### 5.1 Bug 1: Click-to-Edit
- [ ] Klick auf Fachleiste (Text-Bereich) aktiviert Bearbeitungsmodus
- [ ] Cursor erscheint am Ende der Eingabe
- [ ] Visuelles Feedback beim Hover (Cursor: pointer, Edit-Icon)

### 5.2 Bug 2: Zweites Fach erkennen
- [ ] Nach Auswahl eines Fachs kann sofort ein zweites gesucht werden
- [ ] Komma nach erstem Fach erscheint automatisch
- [ ] Dropdown zeigt nur noch nicht ausgewählte Fächer
- [ ] Enter/Klick auf Dropdown-Item fügt Fach korrekt hinzu

### 5.3 Bug 3: Inline Fach-Erstellung
- [ ] "Fach erstellen" Option erscheint wenn Suchbegriff kein Match hat
- [ ] Klick öffnet Mini-Dialog mit Farbauswahl
- [ ] Neues Fach wird in LocalStorage + Supabase gespeichert
- [ ] Neues Fach wird sofort zur Auswahl hinzugefügt
- [ ] Dialog kann abgebrochen werden

### 5.4 Bug 4: Fach-Zuordnung verbessern (ohne Kapitel)
- [ ] Info-Zeile "wird zugeordnet zu: ● [Fachname]" erscheint über Input (bei >1 Fach)
- [ ] Dropdown zum Wechseln des Fachs direkt in Info-Zeile
- [ ] Smarter Default: Letztes verwendetes Fach wird vorausgewählt
- [ ] Quick-Switcher im Thema-Item (Hover) zum direkten Fach-Wechsel
- [ ] Fach-Änderung im Detail-Bereich bleibt als Alternative bestehen

### 5.5 Bug 4b: Kapitel-Fach-Bindung (mit Kapitel)
- [ ] Kapitel-Erstellung zeigt Fach-Auswahl (bei >1 Fach)
- [ ] Kapitel-Header zeigt Farbbalken des zugeordneten Fachs
- [ ] Themen innerhalb eines Kapitels erben automatisch das Kapitel-Fach
- [ ] Keine Fach-Auswahl beim Thema-Erstellen innerhalb eines Kapitels
- [ ] Bei nur 1 Fach: Kapitel bekommt automatisch dieses Fach

---

## 6. Test-Szenarien

| Test | Erwartetes Ergebnis |
|------|---------------------|
| Klick auf "Polizeirecht" Text | Bearbeitungsmodus aktiviert |
| "Zivilrecht" eingeben nach "Polizeirecht" | Dropdown zeigt Zivilrecht |
| Enter auf Dropdown-Item | Zweites Fach hinzugefügt, Anzeige: "Polizeirecht, Zivilrecht" |
| "Mein Fach" eingeben (existiert nicht) | "Mein Fach als neues Fach erstellen" Option |
| Farbe auswählen und erstellen | Fach erstellt, hinzugefügt, in Settings sichtbar |
| Abbrechen im Erstellen-Dialog | Zurück zur Suche, kein Fach erstellt |
| 2 Fächer ausgewählt, "Neues Thema" klicken | Info-Zeile zeigt "wird zugeordnet zu: ● [Fach]" |
| Dropdown in Info-Zeile öffnen | Alle Fächer wählbar |
| Anderes Fach in Dropdown wählen | Info-Zeile aktualisiert, neues Thema bekommt dieses Fach |
| Thema hinzufügen, dann weiteres Thema | Letztes Fach wird als Default vorgeschlagen |
| Hover über Thema-Item | Quick-Switcher Dropdown erscheint |
| Fach im Quick-Switcher ändern | Thema-Farbbalken aktualisiert sofort |
| **Mit Kapitel-Modus:** | |
| Kapitel-Modus AN, "Neues Kapitel" | Fach-Auswahl erscheint über Input (bei >1 Fach) |
| Kapitel mit Fach erstellen | Kapitel-Header zeigt Farbbalken |
| Thema zu Kapitel hinzufügen | Keine Fach-Auswahl, erbt automatisch |
| Neues Thema in Kapitel prüfen | Thema hat gleiche areaId wie Kapitel |

---

## 7. Betroffene Dateien

| Datei | Änderungen |
|-------|------------|
| `area-autocomplete-input.jsx` | Click-to-Edit, State-Fixes, Create-Dialog |
| `themen-navigation.jsx` | Info-Zeile, Smarter Default, Quick-Switcher, AreaDropdown, Kapitel-Fach-Auswahl |
| `themenliste-editor.jsx` | handleAddKapitel mit areaId Parameter |
| `rechtsgebiet-colors.js` | Evtl. Export von AVAILABLE_COLORS prüfen |
| `themenliste-migration.js` | Evtl. Migration für bestehende Kapitel ohne areaId |

---

## 8. Implementierungs-Reihenfolge

1. **Bug 2 debuggen** - Console.logs, State-Flow analysieren
2. **Bug 1 fixen** - onClick auf Container/Text
3. **Bug 4b implementieren** - Kapitel-Fach-Bindung (Schema + UI)
4. **Bug 4 implementieren** - Info-Zeile + Smarter Default (nur für useKapitel=false)
5. **Bug 3 implementieren** - Create-Dialog mit Farbauswahl (optional, niedrigere Prio)

---

## 9. Design-Referenz

**Inline Create Dialog (Vorschlag):**

```
┌────────────────────────────────────────┐
│ Neues Fach erstellen                   │
├────────────────────────────────────────┤
│ Name: [Mein neues Fach        ]        │
│                                        │
│ Farbe:                                 │
│ ● ● ● ● ● ● ● ●  (Farbkreise)          │
│                                        │
│           [Abbrechen] [Erstellen]      │
└────────────────────────────────────────┘
```

---

## 10. Risiken

| Risiko | Mitigation |
|--------|------------|
| Duplikate Fachnamen | Validierung vor Erstellung |
| Sync-Konflikte | Nach Erstellung sofort `syncToSupabase()` |
| Focus-Management | Nach Dialog-Schließen Focus zurück auf Input |
