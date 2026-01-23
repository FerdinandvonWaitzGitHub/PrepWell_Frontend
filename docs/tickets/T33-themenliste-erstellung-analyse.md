# TICKET T33: Themenliste-Erstellung - Implementierungs-Analyse

**Typ:** Analyse / Dokumentation
**Priorität:** Mittel
**Status:** Abgeschlossen
**Erstellt:** 2026-01-22
**Komponenten:**
- `src/pages/themenliste-editor.jsx`
- `src/features/themenliste/components/themen-navigation.jsx`
- `src/features/themenliste/components/themenliste-header.jsx`
- `src/features/themenliste/components/area-autocomplete-input.jsx`
- `src/features/themenliste/components/thema-detail.jsx`
- `src/contexts/calendar-context.jsx`
- `src/utils/themenliste-migration.js`

---

## 1. Überblick

Die Themenliste-Erstellung wurde mit T27 komplett redesigned. Die neue Architektur verwendet eine **flache Datenstruktur** statt der alten 4-Level-Hierarchie.

### Alte Struktur (vor T27)
```
Rechtsgebiet → Unterrechtsgebiet → Kapitel → Thema → Aufgabe
```

### Neue Struktur (T27+)
```
selectedAreas[] + themen[] + optional kapitel[]
```

---

## 2. Einstiegspunkte

### 2.1 Route
- **URL:** `/themenliste` (keine ID-Parameter mehr)
- **Immer neue Themenliste** - Es gibt keinen "Bearbeiten"-Modus für existierende Listen via URL
- Existierende Drafts werden via **DraftDialog** beim Mount geprüft

### 2.2 Draft-Erkennung beim Mount (`themenliste-editor.jsx:70-129`)

```javascript
useEffect(() => {
  // 1. Prüfe LocalStorage auf Draft
  const draftJson = localStorage.getItem(DRAFT_KEY);

  // 2. Prüfe DB auf Draft (status='draft')
  const dbDraft = contentPlans?.find(p =>
    p.type === 'themenliste' && p.status === 'draft'
  );

  // 3. Zeige DraftDialog wenn Draft gefunden
  if (localDraft || dbDraft) {
    setShowDraftDialog(true);
  }
}, [contentPlans]);
```

**Draft-Priorität:** LocalStorage > Supabase DB

---

## 3. State-Initialisierung

### 3.1 Initialer State (`themenliste-editor.jsx:55-57`)

```javascript
const [contentPlan, setContentPlan] = useState(() =>
  createEmptyContentPlan({ useKapitel: themenlisteKapitelDefault })
);
```

### 3.2 Leerer ContentPlan (`themenliste-migration.js:131-146`)

```javascript
{
  id: 'local-{timestamp}-{random}',
  type: 'themenliste',
  description: '',
  selectedAreas: [],      // Ausgewählte Fächer/URGs
  useKapitel: false,      // Kapitel-Modus an/aus
  kapitel: [],            // Kapitel (wenn useKapitel=true)
  themen: [],             // Themen (flache Liste)
  status: 'draft',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3.3 Migration alter Struktur (`themenliste-migration.js:37-123`)

Wenn ein alter Plan geladen wird (z.B. aus LocalStorage), wird er automatisch migriert:

```javascript
if (isOldStructure(plan)) {
  plan = migrateOldToNewStructure(plan);
}
```

---

## 4. Komponenten-Hierarchie & Props-Flow

```
ThemenlisteEditorPage
├── Header (Layout)
├── ThemenlisteHeader
│   └── AreaAutocompleteInput
│       Props: selectedAreas, onAreasChange, isEditing, isJura
├── ThemenNavigation (40% links)
│   Props: themen, kapitel, useKapitel, selectedAreas,
│          onAddThema, onAddKapitel, onDeleteThema, onUpdateThema...
├── ThemaDetail (60% rechts)
│   Props: thema, selectedAreas, onAddAufgabe, onUpdateThema...
├── ThemenlisteFooter
│   Props: onArchive, onCancel, onFinish, canFinish
└── Dialogs (Delete, Cancel, Draft)
```

### 4.1 Callback-Chain

```
User Action → Handler in Editor → updatePlan() → setContentPlan() → Auto-Save
```

**Beispiel Add Thema:**
```
ThemenNavigation.handleAddThema()
  → onAddThema(name, areaId, kapitelId)    // Prop vom Editor
  → handleAddThema() im Editor             // Erstellt neues Thema-Objekt
  → updatePlan({ themen: [...] })          // Merged in State
  → setHasChanges(true)                    // Triggert Auto-Save
```

---

## 5. Datenmodell (Vollständig)

### 5.1 ContentPlan

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Eindeutige ID (`local-...` oder Supabase UUID) |
| `type` | string | Immer `'themenliste'` |
| `name` | string | Generiert aus selectedAreas beim Speichern |
| `description` | string | Optionale Beschreibung |
| `selectedAreas` | Area[] | Ausgewählte Fächer/URGs |
| `useKapitel` | boolean | Kapitel-Modus aktiviert? |
| `kapitel` | Kapitel[] | Kapitel-Liste (wenn useKapitel=true) |
| `themen` | Thema[] | Themen-Liste |
| `status` | string | `'draft'` oder `'active'` |
| `archived` | boolean | Archiviert? |
| `createdAt` | string | ISO-Timestamp |
| `updatedAt` | string | ISO-Timestamp |

### 5.2 Area (selectedAreas[])

```javascript
{
  id: 'polizeirecht',           // URG-ID oder Custom Subject ID
  name: 'Polizeirecht',
  rechtsgebietId: 'oeffentliches-recht',  // Parent (nur Jura)
  color: 'bg-green-500'         // Tailwind-Farbklasse
}
```

### 5.3 Kapitel

```javascript
{
  id: '1706012345-abc123',
  name: 'Allgemeine Lehren',
  order: 0,
  areaId: 'polizeirecht'        // T32: Kapitel gehört zu einem Fach
}
```

### 5.4 Thema

```javascript
{
  id: '1706012345-def456',
  name: 'Gefahrenabwehr',
  description: '',
  areaId: 'polizeirecht',       // Zugeordnetes Fach
  kapitelId: '...' | null,      // Optionale Kapitel-Zuordnung
  order: 0,
  aufgaben: Aufgabe[]
}
```

### 5.5 Aufgabe

```javascript
{
  id: '1706012345-ghi789',
  name: 'Definition lernen',
  priority: 'low' | 'medium' | 'high',
  completed: false,
  order: 0
}
```

---

## 6. CRUD-Operationen

### 6.1 Areas (Fächer/URGs)

| Operation | Handler | Location |
|-----------|---------|----------|
| Hinzufügen | `handleSelectArea()` | area-autocomplete-input.jsx:109 |
| Entfernen (Backspace) | `handleRemoveLastArea()` | area-autocomplete-input.jsx:125 |
| Ändern | `handleAreasChange()` | themenliste-editor.jsx:221 |

### 6.2 Kapitel

| Operation | Handler | Location |
|-----------|---------|----------|
| Hinzufügen | `handleAddKapitel()` | themenliste-editor.jsx:250 |
| Löschen | `handleDeleteKapitel()` | themenliste-editor.jsx:277 |
| Aktualisieren | `handleUpdateKapitel()` | themenliste-editor.jsx:289 |

### 6.3 Themen

| Operation | Handler | Location |
|-----------|---------|----------|
| Hinzufügen | `handleAddThema()` | themenliste-editor.jsx:231 |
| Löschen | `handleDeleteThema()` | themenliste-editor.jsx:267 |
| Aktualisieren | `handleUpdateThema()` | themenliste-editor.jsx:371 |

### 6.4 Aufgaben

| Operation | Handler | Location |
|-----------|---------|----------|
| Hinzufügen | `handleAddAufgabe()` | themenliste-editor.jsx:317 |
| Löschen | `handleDeleteAufgabe()` | themenliste-editor.jsx:339 |
| Priorität ändern | `handleTogglePriority()` | themenliste-editor.jsx:351 |

---

## 7. Persistenz

### 7.1 Auto-Save Mechanismus (`themenliste-editor.jsx:167-207`)

```javascript
useEffect(() => {
  if (!hasChanges || !draftLoaded) return;

  const timeoutId = setTimeout(async () => {
    // 1. LocalStorage Backup
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      contentPlan,
      lastModified: new Date().toISOString()
    }));

    // 2. Supabase Save
    if (!isSavedToDb) {
      // Erster Save → createContentPlan
      const savedPlan = await createContentPlan({
        ...contentPlan,
        status: 'draft',
      });
      setIsSavedToDb(true);
    } else {
      // Update → updateContentPlan
      await updateContentPlan(contentPlan.id, {
        ...contentPlan,
        status: 'draft',
      });
    }
  }, 500); // 500ms Debounce

  return () => clearTimeout(timeoutId);
}, [contentPlan, hasChanges]);
```

### 7.2 Speicherorte

| Speicherort | Zweck | Key/Tabelle |
|-------------|-------|-------------|
| LocalStorage | Backup für nicht-authentifizierte User | `prepwell_themenliste_draft` |
| Supabase | Primäre Persistenz | `content_plans` Tabelle |

### 7.3 Finish-Flow (`themenliste-editor.jsx:436-473`)

1. Generiere `name` aus `selectedAreas` (z.B. "Polizeirecht, Kommunalrecht")
2. Setze `status: 'active'`
3. Speichere in Supabase
4. Lösche LocalStorage Draft
5. Navigiere zu `/lernplan`

---

## 8. Validierung

### 8.1 Finish-Button Validierung

```javascript
const canFinish = contentPlan.selectedAreas && contentPlan.selectedAreas.length > 0;
```

**Nur eine Validierung:** Mindestens ein Fach muss ausgewählt sein.

### 8.2 Keine weiteren Validierungen

- Themen können leer sein
- Beschreibung ist optional
- Keine Validierung auf Duplikate

---

## 9. T32 Fach-Zuordnung (Kapitel → Thema)

### 9.1 Mit Kapitel-Modus (`useKapitel=true`)

```
Fach → Kapitel → Thema
       ↓ areaId erbt
```

- Kapitel hat `areaId`
- Themen innerhalb eines Kapitels erben automatisch das Fach
- Keine Fach-Auswahl beim Thema-Erstellen innerhalb eines Kapitels

### 9.2 Ohne Kapitel-Modus (`useKapitel=false`)

- Jedes Thema hat eigene `areaId`
- Smart Default: Letztes verwendetes Fach oder erstes Fach
- AreaDropdown zum schnellen Wechseln (bei >1 Fach)

---

## 10. Code-Referenzen

### 10.1 themenliste-editor.jsx

```javascript
// State
const [contentPlan, setContentPlan] = useState(...)     // :55
const [selectedThemaId, setSelectedThemaId] = useState  // :60
const [hasChanges, setHasChanges] = useState(false)     // :62
const [isSavedToDb, setIsSavedToDb] = useState(false)   // :52

// Wichtige Handler
const updatePlan = useCallback((updates) => {...})      // :210
const handleAreasChange = useCallback(...)              // :221
const handleAddThema = useCallback(...)                 // :231
const handleAddKapitel = useCallback(...)               // :250
const handleFinish = useCallback(...)                   // :436
```

### 10.2 area-autocomplete-input.jsx

```javascript
// Datenquelle basierend auf isJura
const allAreas = useMemo(() => {
  if (isJura) {
    return getAllUnterrechtsgebieteFlat();  // URGs
  } else {
    return getAllSubjects(false);            // Custom Subjects
  }
}, [isJura]);                                // :59-74

// Area-Auswahl
const handleSelectArea = (area) => {         // :109
  const newArea = {...};
  onAreasChange([...selectedAreas, newArea]);
};
```

### 10.3 calendar-context.jsx (Persistenz)

```javascript
const createContentPlan = useCallback(async (planData) => {
  const newPlan = {...defaults, ...planData};
  await saveContentPlanToSupabase(newPlan);
  return newPlan;
}, []);                                      // :1634-1663

const updateContentPlan = useCallback(async (planId, updates) => {
  const updatedPlan = {...plan, ...updates};
  await saveContentPlanToSupabase(updatedPlan);
}, []);                                      // :1671-1683
```

---

## 11. Erkenntnisse

### 11.1 Stärken

- **Klare Trennung:** Editor-Page orchestriert, Komponenten sind präsentational
- **Auto-Save:** Verhindert Datenverlust (500ms Debounce)
- **Dual-Storage:** LocalStorage als Fallback für nicht-authentifizierte User
- **Migration:** Alte Datenstrukturen werden automatisch konvertiert
- **T32 Kapitel-Fach-Bindung:** Saubere Vererbung von Fach zu Themen

### 11.2 Schwächen / Probleme

1. **Keine Bearbeitung existierender Listen via URL**
   - Man kann nur neue Listen erstellen oder Drafts fortsetzen
   - Kein `/themenliste/:id/edit` Route

2. **Draft-Handling komplex**
   - LocalStorage + DB Draft Sync kann zu Konflikten führen
   - Nur ein Draft gleichzeitig möglich

3. **Area-Entfernung nicht vollständig gehandelt**
   - Was passiert mit Themen wenn deren Area entfernt wird?
   - Keine Warnung/Bestätigung

4. **Keine Undo-Funktion**
   - Gelöschte Themen/Kapitel können nicht wiederhergestellt werden

5. **Name wird erst beim Finish generiert**
   - Während Draft-Phase hat Plan keinen Namen
   - Kann in der Lernplan-Übersicht verwirrend sein

### 11.3 Verbesserungsvorschläge

1. **Route für existierende Listen:** `/themenliste/:id/edit`
2. **Area-Entfernung mit Warnung:** "X Themen sind diesem Fach zugeordnet"
3. **Undo-Stack:** Letzte N Aktionen rückgängig machen
4. **Draft-Name:** `selectedAreas` als Name auch im Draft anzeigen
5. **Offline-Support:** Service Worker für besseres LocalStorage Handling

---

## 12. Diagramme

### 12.1 Komponenten-Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   ThemenlisteEditorPage                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ State: contentPlan, selectedThemaId, hasChanges     │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│         ┌──────────────────┼──────────────────┐            │
│         ▼                  ▼                  ▼            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │  Header     │    │ Navigation  │    │   Detail    │    │
│  │  (Areas)    │    │  (Themen)   │    │ (Aufgaben)  │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│         │                  │                  │            │
│         ▼                  ▼                  ▼            │
│  onAreasChange      onAddThema          onUpdateThema     │
│         │                  │                  │            │
│         └──────────────────┴──────────────────┘            │
│                            │                                │
│                            ▼                                │
│                      updatePlan()                          │
│                            │                                │
│                            ▼                                │
│                   ┌────────────────┐                       │
│                   │   Auto-Save    │                       │
│                   │ (500ms debounce)│                       │
│                   └────────────────┘                       │
│                            │                                │
│              ┌─────────────┴─────────────┐                 │
│              ▼                           ▼                 │
│       LocalStorage                   Supabase              │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Datenstruktur

```
contentPlan
├── id: "local-xxx" | "uuid"
├── type: "themenliste"
├── name: "" (bis Finish)
├── description: "..."
├── status: "draft" | "active"
│
├── selectedAreas: [
│   ├── { id, name, color, rechtsgebietId }
│   └── ...
│   ]
│
├── useKapitel: true | false
│
├── kapitel: [                    // Wenn useKapitel=true
│   ├── { id, name, order, areaId }
│   └── ...
│   ]
│
└── themen: [
    ├── {
    │   id, name, description,
    │   areaId,                   // → selectedAreas[].id
    │   kapitelId,                // → kapitel[].id | null
    │   order,
    │   aufgaben: [
    │     { id, name, priority, completed, order }
    │   ]
    │   }
    └── ...
    ]
```

---

## 13. Speicherung - Detailanalyse & Bewertung

### 13.1 Aktueller Zustand

#### Stärken

| Aspekt | Bewertung | Details |
|--------|-----------|---------|
| Auto-Save | ✅ Gut | 500ms Debounce verhindert zu viele Requests |
| Dual-Storage | ✅ Gut | LocalStorage + Supabase als Backup |
| Draft-Status | ✅ Gut | Klare Trennung `draft` vs `active` |
| Code-Struktur | ✅ Gut | useCallback, klare Separation |

#### Schwächen

| Problem | Schweregrad | Auswirkung |
|---------|-------------|------------|
| Keine Fehlerbehandlung | 🔴 Hoch | User sieht nur "error", kein Recovery |
| Race Conditions | 🟡 Mittel | Schnelle Änderungen können sich überschreiben |
| LocalStorage-Priorität | 🔴 Hoch | Multi-Device Sync bricht |
| Kein Optimistic UI | 🟡 Mittel | Träge bei langsamer Verbindung |
| Kein Conflict Resolution | 🟡 Mittel | Multi-Tab = letzter Save gewinnt |

### 13.2 Probleme im Detail

#### Problem 1: Keine Fehlerbehandlung bei Auto-Save

**Aktueller Code (`themenliste-editor.jsx:200-203`):**
```javascript
} catch (error) {
  console.error('Auto-save failed:', error);
  setAutoSaveStatus('error');
  // PROBLEM: Kein Retry, keine User-Benachrichtigung, Daten potentiell verloren
}
```

**Auswirkung:**
- User sieht nur roten "Fehler" Status
- Keine Möglichkeit manuell zu speichern
- Bei Netzwerk-Timeout: Daten nur in LocalStorage

#### Problem 2: Race Condition bei erstem Save

**Aktueller Code (`themenliste-editor.jsx:180-191`):**
```javascript
if (!isSavedToDb) {
  const savedPlan = await createContentPlan({...});  // ← 200-500ms
  setIsSavedToDb(true);
  // PROBLEM: User kann während await weitere Änderungen machen
  // Diese Änderungen werden NICHT gespeichert bis nächster Auto-Save
}
```

**Szenario:**
1. User fügt Thema A hinzu → Auto-Save startet
2. Während Save läuft: User fügt Thema B hinzu
3. Save completed mit nur Thema A
4. `isSavedToDb = true` → nächster Save ist UPDATE
5. Thema B wird erst beim nächsten Debounce-Zyklus gespeichert

#### Problem 3: LocalStorage vs DB Konflikt

**Aktueller Code (`themenliste-editor.jsx:111-124`):**
```javascript
// Prefer localStorage draft (has more recent state), fall back to DB draft
if (localDraft) {
  setPendingDraft(localDraft);
} else if (dbDraft) {
  setPendingDraft({...dbDraft});
}
```

**Szenario:**
1. User arbeitet auf Laptop → LocalStorage + DB haben Stand A
2. User wechselt zu Handy → DB hat Stand A, LocalStorage leer
3. User arbeitet auf Handy → DB hat Stand B
4. User zurück auf Laptop → LocalStorage hat veralteten Stand A
5. **LocalStorage gewinnt → Stand B verloren!**

#### Problem 4: Kein Optimistic Update

**Aktueller Flow:**
```
User Action → State Update → Wait for Debounce → Wait for Supabase → UI bestätigt
              ↑                                                        ↓
              └────────────── 500ms + Netzwerk-Latenz ─────────────────┘
```

**Problem:** Bei langsamer Verbindung fühlt sich Save "hängend" an.

### 13.3 Gesamtbewertung

| Kategorie | Note | Kommentar |
|-----------|------|-----------|
| Datenverlust-Prävention | 6/10 | Auto-Save gut, aber Fehler = Datenverlust |
| Fehlerbehandlung | 3/10 | Nur console.error, kein Recovery |
| Multi-Device Support | 2/10 | LocalStorage-Priorität bricht Sync |
| Performance/UX | 5/10 | Debounce gut, aber kein Optimistic UI |
| Code-Qualität | 7/10 | Klar strukturiert, aber Race Conditions |
| **Gesamt** | **5/10** | Funktioniert für Single-Device, problematisch bei Edge Cases |

---

## 14. Verbesserungs-Implementierungsplan

### 14.1 Priorität 1: Robuste Fehlerbehandlung (2-3h)

#### Ziel
User bekommt klares Feedback bei Fehlern und kann manuell retry.

#### Implementierung

**Neuer State in `themenliste-editor.jsx`:**
```javascript
const [saveError, setSaveError] = useState(null);
const [retryCount, setRetryCount] = useState(0);
const MAX_RETRIES = 3;
```

**Neue Retry-Logik:**
```javascript
const saveWithRetry = useCallback(async (data, attempt = 0) => {
  try {
    setAutoSaveStatus('saving');
    setSaveError(null);

    if (!isSavedToDb) {
      const savedPlan = await createContentPlan({...data, status: 'draft'});
      setContentPlan(prev => ({...prev, id: savedPlan.id}));
      setIsSavedToDb(true);
    } else {
      await updateContentPlan(data.id, {...data, status: 'draft'});
    }

    setAutoSaveStatus('saved');
    setRetryCount(0);
  } catch (error) {
    console.error(`Save failed (attempt ${attempt + 1}):`, error);

    if (attempt < MAX_RETRIES) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, attempt);
      setTimeout(() => saveWithRetry(data, attempt + 1), delay);
      setAutoSaveStatus('retrying');
    } else {
      setAutoSaveStatus('error');
      setSaveError({
        message: 'Speichern fehlgeschlagen. Deine Änderungen sind lokal gesichert.',
        canRetry: true,
        timestamp: Date.now()
      });
    }
  }
}, [isSavedToDb, createContentPlan, updateContentPlan]);
```

**UI-Komponente für Fehleranzeige:**
```jsx
// In ThemenlisteFooter oder als Toast
{saveError && (
  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
    <AlertCircle className="text-red-500" size={16} />
    <span className="text-sm text-red-700">{saveError.message}</span>
    <button
      onClick={() => saveWithRetry(contentPlan, 0)}
      className="ml-2 text-sm font-medium text-red-600 hover:text-red-800"
    >
      Erneut versuchen
    </button>
  </div>
)}
```

#### Betroffene Dateien
- `src/pages/themenliste-editor.jsx`
- `src/features/themenliste/components/themenliste-footer.jsx`

---

### 14.2 Priorität 2: Timestamp-basierte Konflikt-Erkennung (3-4h)

#### Ziel
Bei Multi-Device Nutzung: Neuere Version gewinnt, User wird informiert.

#### Implementierung

**Neuer Check vor dem Laden:**
```javascript
// In useEffect für Draft-Check
const checkForNewerVersion = async (localDraft, dbDraft) => {
  if (!localDraft || !dbDraft) return null;

  const localTime = new Date(localDraft.lastModified).getTime();
  const dbTime = new Date(dbDraft.updatedAt).getTime();

  if (dbTime > localTime) {
    // DB ist neuer - User fragen
    return {
      hasConflict: true,
      localVersion: localDraft,
      dbVersion: dbDraft,
      timeDiff: dbTime - localTime
    };
  }

  return null;
};
```

**Konflikt-Dialog:**
```jsx
<ConflictDialog
  open={conflictInfo !== null}
  localVersion={conflictInfo?.localVersion}
  dbVersion={conflictInfo?.dbVersion}
  onUseLocal={() => {
    setContentPlan(conflictInfo.localVersion.contentPlan);
    setConflictInfo(null);
  }}
  onUseCloud={() => {
    setContentPlan(conflictInfo.dbVersion);
    localStorage.removeItem(DRAFT_KEY); // Lokale Version löschen
    setConflictInfo(null);
  }}
/>
```

**Dialog-Komponente (`conflict-dialog.jsx`):**
```jsx
const ConflictDialog = ({ open, localVersion, dbVersion, onUseLocal, onUseCloud }) => {
  if (!open) return null;

  const formatTime = (iso) => new Date(iso).toLocaleString('de-DE');

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verschiedene Versionen gefunden</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-neutral-600">
            Es gibt eine neuere Version in der Cloud. Welche möchtest du verwenden?
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Lokale Version */}
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium">Dieses Gerät</div>
              <div className="text-xs text-neutral-500">
                {formatTime(localVersion?.lastModified)}
              </div>
              <div className="text-xs mt-1">
                {localVersion?.contentPlan?.themen?.length || 0} Themen
              </div>
            </div>

            {/* Cloud Version */}
            <div className="p-3 border rounded-lg border-blue-200 bg-blue-50">
              <div className="text-sm font-medium">Cloud (neuer)</div>
              <div className="text-xs text-neutral-500">
                {formatTime(dbVersion?.updatedAt)}
              </div>
              <div className="text-xs mt-1">
                {dbVersion?.themen?.length || 0} Themen
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onUseLocal}>
            Lokale Version
          </Button>
          <Button onClick={onUseCloud}>
            Cloud Version (empfohlen)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

#### Betroffene Dateien
- `src/pages/themenliste-editor.jsx`
- `src/features/themenliste/components/conflict-dialog.jsx` (neu)

---

### 14.3 Priorität 3: Race Condition Fix (1-2h)

#### Ziel
Änderungen während laufendem Save werden nicht verloren.

#### Implementierung

**Pending-Changes Queue:**
```javascript
const pendingChangesRef = useRef(null);
const isSavingRef = useRef(false);

const updatePlan = useCallback((updates) => {
  const newPlan = {...contentPlan, ...updates, updatedAt: new Date().toISOString()};
  setContentPlan(newPlan);

  // Wenn gerade gespeichert wird: Queue für nächsten Save
  if (isSavingRef.current) {
    pendingChangesRef.current = newPlan;
  }

  setHasChanges(true);
}, [contentPlan]);

// Im Auto-Save Effect
const performSave = useCallback(async () => {
  if (isSavingRef.current) return;

  isSavingRef.current = true;
  const planToSave = contentPlan;

  try {
    await saveWithRetry(planToSave);

    // Nach Save: Prüfen ob es pending Changes gibt
    if (pendingChangesRef.current) {
      const pending = pendingChangesRef.current;
      pendingChangesRef.current = null;
      // Rekursiv speichern
      await performSave();
    }
  } finally {
    isSavingRef.current = false;
  }
}, [contentPlan, saveWithRetry]);
```

#### Betroffene Dateien
- `src/pages/themenliste-editor.jsx`

---

### 14.4 Priorität 4: Optimistic UI (2-3h)

#### Ziel
UI reagiert sofort, Save läuft im Hintergrund.

#### Implementierung

**Änderung am Auto-Save Status:**
```javascript
// Statt "saving" während Request:
setAutoSaveStatus('saving');

// Sofort nach State-Update:
setAutoSaveStatus('pending'); // Zeigt "Änderungen werden gespeichert..."

// Nach erfolgreichem Save:
setAutoSaveStatus('saved');

// Bei Fehler:
setAutoSaveStatus('error');
```

**Visuelle Indikatoren:**
```jsx
// In Footer
const statusConfig = {
  pending: { icon: Clock, text: 'Speichert...', color: 'text-neutral-400' },
  saving: { icon: Loader2, text: 'Speichert...', color: 'text-blue-500', spin: true },
  saved: { icon: Check, text: 'Gespeichert', color: 'text-green-500' },
  retrying: { icon: RefreshCw, text: 'Erneuter Versuch...', color: 'text-amber-500', spin: true },
  error: { icon: AlertCircle, text: 'Fehler', color: 'text-red-500' }
};
```

#### Betroffene Dateien
- `src/pages/themenliste-editor.jsx`
- `src/features/themenliste/components/themenliste-footer.jsx`

---

### 14.5 Priorität 5: Offline-Indikator (1h)

#### Ziel
User weiß, wenn er offline ist und Änderungen nur lokal gespeichert werden.

#### Implementierung

**Online-Status Hook:**
```javascript
// src/hooks/use-online-status.js
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

**Integration im Editor:**
```javascript
const isOnline = useOnlineStatus();

// Im Auto-Save:
if (!isOnline) {
  // Nur LocalStorage, kein Supabase
  localStorage.setItem(DRAFT_KEY, JSON.stringify({...}));
  setAutoSaveStatus('offline');
  return;
}
```

**Offline-Banner:**
```jsx
{!isOnline && (
  <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
    <span className="text-sm text-amber-700">
      Du bist offline. Änderungen werden lokal gespeichert.
    </span>
  </div>
)}
```

#### Betroffene Dateien
- `src/hooks/use-online-status.js` (neu)
- `src/pages/themenliste-editor.jsx`

---

## 15. Implementierungs-Reihenfolge

| Phase | Feature | Aufwand | Priorität | Abhängigkeiten |
|-------|---------|---------|-----------|----------------|
| 1 | Retry-Logik + Error UI | 2-3h | 🔴 Kritisch | - |
| 2 | Offline-Indikator | 1h | 🟡 Mittel | - |
| 3 | Race Condition Fix | 1-2h | 🟡 Mittel | Phase 1 |
| 4 | Konflikt-Erkennung | 3-4h | 🔴 Kritisch | Phase 1 |
| 5 | Optimistic UI | 2-3h | 🟢 Nice-to-have | Phase 1, 3 |

**Gesamtaufwand:** 9-13h

---

## 16. Akzeptanzkriterien

### Phase 1: Retry-Logik ✅ IMPLEMENTIERT
- [x] Bei Netzwerk-Fehler: Automatisch 3x retry mit exponential backoff
- [x] Fehler-Banner mit "Erneut versuchen" Button sichtbar
- [x] LocalStorage Backup funktioniert auch bei DB-Fehler

### Phase 2: Offline-Indikator ✅ IMPLEMENTIERT
- [x] Banner erscheint wenn offline
- [x] Auto-Save speichert nur in LocalStorage wenn offline
- [x] Nach Reconnect: Automatischer Sync zu Supabase

### Phase 3: Race Condition Fix ✅ IMPLEMENTIERT
- [x] Schnelle aufeinanderfolgende Änderungen gehen nicht verloren
- [x] Kein doppelter Create bei erstem Save

### Phase 4: Konflikt-Erkennung ✅ IMPLEMENTIERT
- [x] Dialog erscheint wenn DB-Version neuer als LocalStorage
- [x] User kann wählen welche Version er behalten will
- [x] Zeitstempel und Themen-Anzahl werden angezeigt

### Phase 5: Optimistic UI ✅ IMPLEMENTIERT
- [x] UI reagiert sofort auf Änderungen ("pending" Status)
- [x] Status-Indikator zeigt "Pending" → "Saving" → "Saved"
- [x] Bei Fehler: Error-State mit Retry-Option

---

## 17. Nächste Schritte

- [x] Analyse abgeschlossen
- [x] Speicher-Bewertung abgeschlossen
- [x] Implementierungsplan erstellt
- [x] Phase 1: Retry-Logik implementiert
- [x] Phase 2: Offline-Indikator implementiert
- [x] Phase 3: Race Condition Fix implementiert
- [x] Phase 4: Konflikt-Erkennung implementiert
- [x] Phase 5: Optimistic UI implementiert
- [ ] T32 Bugs beheben (siehe separates Ticket)

---

## 18. Implementierte Änderungen (2026-01-22)

### Neue Dateien
- `src/hooks/use-online-status.js` - Hook für Online/Offline-Status

### Geänderte Dateien
- `src/pages/themenliste-editor.jsx`
  - Import von `useRef` und `useOnlineStatus`
  - Neue State: `saveError`
  - Neue Refs: `isSavingRef`, `pendingChangesRef`, `currentPlanRef`
  - `saveToSupabase()` - Retry-Logik mit exponential backoff
  - `performSave()` - Race Condition Prevention
  - `handleRetry()` - Manueller Retry-Trigger
  - `updatePlan()` - Pending Changes Tracking
  - Auto-Sync nach Reconnect

- `src/features/themenliste/components/themenliste-footer.jsx`
  - Neue Props: `onRetry`, `saveError`, `isOnline`
  - Neue Status: `retrying`, `offline`
  - Error-Banner mit Retry-Button
  - Offline-Banner

---

## 19. Datenfluss: Editor → Lernplan-Seite (Analyse 2026-01-23)

### 19.1 Übersicht: Zwei verschiedene Datenstrukturen

Es gibt eine **kritische Inkompatibilität** zwischen der neuen T27 Themenliste-Editor-Struktur und der älteren ContentPlanEditCard-Komponente auf der Lernplan-Seite.

#### Neue T27 Struktur (Themenliste-Editor)

```javascript
// themenliste-editor.jsx erstellt diese Struktur:
{
  id: "abc-123",
  type: "themenliste",
  name: "Mikroökonomie, Makroökonomie",  // ← getDisplayName(selectedAreas)
  status: "active",

  // NEUE FLACHE STRUKTUR
  selectedAreas: [
    { id: "mikro", name: "Mikroökonomie", color: "bg-blue-500" },
    { id: "makro", name: "Makroökonomie", color: "bg-green-500" }
  ],
  themen: [
    { id: "t1", name: "Angebot und Nachfrage", areaId: "mikro", aufgaben: [...] },
    { id: "t2", name: "BIP", areaId: "makro", aufgaben: [...] }
  ],
  kapitel: [...],  // Optional
  useKapitel: false,

  // ALTE STRUKTUR LEER!
  rechtsgebiete: []
}
```

#### Alte Struktur (ContentPlanEditCard erwartet)

```javascript
// content-plan-edit-card.jsx erwartet diese Struktur:
{
  id: "abc-123",
  type: "themenliste",
  name: "Meine Themenliste",

  // HIERARCHISCHE STRUKTUR
  rechtsgebiete: [
    {
      id: "rg1",
      rechtsgebietId: "zivilrecht",
      name: "Zivilrecht",
      unterrechtsgebiete: [
        {
          id: "urg1",
          name: "BGB AT",
          kapitel: [
            {
              id: "kap1",
              title: "Kapitel 1",
              themen: [
                {
                  id: "t1",
                  title: "Thema 1",  // ← Achtung: "title" nicht "name"!
                  aufgaben: [...]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### 19.2 Speichervorgang: handleFinish()

```
┌─────────────────────────────────────────────────────────────────────┐
│  THEMENLISTE-EDITOR (themenliste-editor.jsx)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  handleFinish() → Zeile 614-651                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 1. planName = getDisplayName(selectedAreas)                  │   │
│  │    → "Mikroökonomie, Makroökonomie"                          │   │
│  │                                                              │   │
│  │ 2. createContentPlan({                                       │   │
│  │      ...contentPlan,  // selectedAreas, themen, kapitel      │   │
│  │      name: planName,                                         │   │
│  │      status: 'active'                                        │   │
│  │    })                                                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
├─────────────────────────────────────────────────────────────────────┤
│  CALENDAR-CONTEXT (calendar-context.jsx)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  createContentPlan() → Zeile 1634-1663                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ const newPlan = {                                            │   │
│  │   rechtsgebiete: [],     // ← DEFAULT: Leer!                 │   │
│  │   selectedAreas: [],     // ← wird überschrieben             │   │
│  │   themen: [],            // ← wird überschrieben             │   │
│  │   ...planData,           // ← Spreads new structure          │   │
│  │   id: generateId(),      // ← Neue UUID                      │   │
│  │ }                                                            │   │
│  │                                                              │   │
│  │ await saveContentPlanToSupabase(newPlan)                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
├─────────────────────────────────────────────────────────────────────┤
│  SUPABASE (content_plans table)                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Gespeichert als JSON mit BEIDEN Strukturen:                        │
│  - rechtsgebiete: []  (leer)                                        │
│  - selectedAreas: [...] (gefüllt)                                   │
│  - themen: [...] (gefüllt)                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 19.3 Ladevorgang: Lernplan-Seite

```
┌─────────────────────────────────────────────────────────────────────┐
│  LERNPLAN-CONTENT (lernplan-content.jsx)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  const { contentPlans } = useCalendar();                            │
│                                                                     │
│  filteredThemenlisten = contentPlans.filter(p =>                    │
│    p.type === 'themenliste' &&                                      │
│    p.status !== 'draft' &&                                          │
│    p.archived === showArchived                                      │
│  );                                                                 │
│                                                                     │
│  → Zeigt ContentPlanEditCard für jede Themenliste                   │
│                              │                                      │
│                              ▼                                      │
├─────────────────────────────────────────────────────────────────────┤
│  CONTENT-PLAN-EDIT-CARD (content-plan-edit-card.jsx)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  // Titel-Anzeige (Zeile 257-259) ✅ FUNKTIONIERT                  │
│  <h3>{plan.name || 'Themenliste'}</h3>                              │
│  → Zeigt: "Mikroökonomie, Makroökonomie"                            │
│                                                                     │
│  // Progress-Berechnung (Zeile 124-141) ❌ PROBLEM                 │
│  plan.rechtsgebiete?.forEach(rg => {                                │
│    rg.unterrechtsgebiete?.forEach(urg => {                          │
│      urg.kapitel?.forEach(k => {                                    │
│        k.themen?.forEach(t => {                                     │
│          t?.aufgaben?.forEach(a => { total++; ... })                │
│        })                                                           │
│      })                                                             │
│    })                                                               │
│  })                                                                 │
│  → rechtsgebiete ist LEER → total = 0, completed = 0                │
│                                                                     │
│  // Content-Anzeige (Zeile 435-485) ❌ PROBLEM                      │
│  {(!plan.rechtsgebiete || plan.rechtsgebiete.length === 0) ? (      │
│    // ZEIGT EMPTY STATE!                                            │
│  ) : (                                                              │
│    // Wird nie erreicht für T27 Themenlisten                        │
│  )}                                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 19.4 Das Problem: Datenstruktur-Inkompatibilität

| Aspekt | Themenliste-Editor (T27) | ContentPlanEditCard |
|--------|--------------------------|---------------------|
| Fächer-Liste | `selectedAreas[]` | `rechtsgebiete[]` |
| Themen | `themen[]` (flat) | `rechtsgebiete[].unterrechtsgebiete[].kapitel[].themen[]` |
| Thema-Name | `thema.name` | `thema.title` |
| Aufgaben | `thema.aufgaben[]` | `thema.aufgaben[]` (gleich) |
| Fach-Zuordnung | `thema.areaId` → `selectedAreas` | Implizit durch Hierarchie |

### 19.5 Auswirkungen für User

Wenn ein User eine Themenliste im T27-Editor erstellt und speichert:

1. ✅ **Name wird korrekt angezeigt**: `getDisplayName()` setzt `plan.name` korrekt
2. ❌ **Progress zeigt "0/0"**: Da `rechtsgebiete` leer ist
3. ❌ **Keine Inhalte sichtbar**: Empty State wird angezeigt statt Themen/Aufgaben
4. ❌ **Keine Bearbeitung möglich**: Die Hierarchie-basierte Bearbeitung funktioniert nicht

### 19.6 ID-Handling

#### IDs im Editor

```javascript
// themenliste-editor.jsx
const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Plan-ID (vor Supabase-Save)
const [contentPlan, setContentPlan] = useState(() =>
  createEmptyContentPlan()  // → id: "local-1705xxx-abc123"
);
```

#### IDs nach Supabase-Save

```javascript
// calendar-context.jsx → createContentPlan()
const newPlan = {
  ...planData,
  id: generateId(),  // → Überschreibt local-ID mit UUID!
};

// generateId() erzeugt: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

#### ID-Fluss

```
Editor: local-1705xxx-abc123
        ↓ handleFinish()
Calendar: f47ac10b-58cc-4372-a567-0e02b2c3d479  (neue UUID)
        ↓ saveContentPlanToSupabase()
Supabase: f47ac10b-58cc-4372-a567-0e02b2c3d479
        ↓ navigate('/lernplan')
Lernplan-Seite: lädt aus contentPlans mit neuer UUID
```

### 19.7 Lösungsvorschläge

#### Option A: ContentPlanEditCard für T27-Struktur erweitern

```jsx
// content-plan-edit-card.jsx - Erweiterte Logik
const isNewStructure = plan.selectedAreas && plan.selectedAreas.length > 0;

if (isNewStructure) {
  // Render selectedAreas + flat themen
  return <ThemenlisteNewView plan={plan} />;
} else {
  // Render old rechtsgebiete hierarchy
  return <ThemenlisteOldView plan={plan} />;
}
```

#### Option B: Separate Komponente für T27-Themenlisten

```jsx
// lernplan-content.jsx - Unterscheide nach Struktur
{filteredThemenlisten.map((plan) => (
  plan.selectedAreas?.length > 0 ? (
    <ThemenlisteT27Card key={plan.id} plan={plan} />
  ) : (
    <ContentPlanEditCard key={plan.id} plan={plan} />
  )
))}
```

#### Option C: Migration beim Laden

```javascript
// calendar-context.jsx - Beim Laden von Supabase
const loadContentPlans = async () => {
  const plans = await fetchFromSupabase();
  return plans.map(plan => {
    if (plan.selectedAreas?.length > 0 && !plan.rechtsgebiete?.length) {
      // Konvertiere T27 zu alter Struktur für ContentPlanEditCard
      return convertT27ToOldStructure(plan);
    }
    return plan;
  });
};
```

---

## 20. Nächste Schritte (Datenstruktur-Bug)

- [ ] Entscheidung: Option A, B oder C?
- [ ] Implementierung der Lösung
- [ ] Testen der Datenübertragung Editor → Lernplan-Seite
- [ ] Sicherstellen dass Progress-Berechnung funktioniert

---

## 21. Vollständige Migration sicherstellen

### 21.1 Warum die letzte Migration unvollständig war

```
T27 Scope-Definition (zu eng):
┌────────────────────────────────────────────────────────┐
│  "Redesign Themenliste-Editor"                         │
│                                                        │
│  ✅ Neue Datenstruktur definiert                       │
│  ✅ Editor-UI implementiert                            │
│  ✅ Speicherung funktioniert                           │
│  ❌ Anzeige auf Lernplan-Seite vergessen              │
│  ❌ Progress-Berechnung nicht angepasst               │
│  ❌ Keine Komponenten-Abhängigkeitsanalyse            │
└────────────────────────────────────────────────────────┘
```

**Kernproblem**: Es wurde nur der "Happy Path" (Erstellung) betrachtet, nicht der komplette Datenlebenszyklus.

### 21.2 Komponenten-Abhängigkeitsmatrix

Bevor eine Datenstruktur geändert wird, muss diese Matrix ausgefüllt werden:

| Komponente | Liest `rechtsgebiete` | Liest `selectedAreas` | Liest `themen` | Schreibt Daten | Status |
|------------|:---------------------:|:---------------------:|:--------------:|:--------------:|--------|
| **themenliste-editor.jsx** | ❌ | ✅ | ✅ | ✅ | T27 ✅ |
| **content-plan-edit-card.jsx** | ✅ | ❌ | ❌ | ✅ | ❌ Veraltet |
| **lernplan-content.jsx** | ❌ | ❌ | ❌ | ❌ | Nur Routing |
| **calendar-context.jsx** | ✅ | ✅ | ✅ | ✅ | Hybrid |
| **themen-navigation.jsx** | ❌ | ✅ | ✅ | ❌ | T27 ✅ |
| **thema-detail.jsx** | ❌ | ✅ | ✅ | ❌ | T27 ✅ |

### 21.3 Datenfeld-Nutzungsanalyse

Für jedes Feld der alten/neuen Struktur: Wo wird es verwendet?

#### Alte Struktur: `rechtsgebiete[]`

```
rechtsgebiete[]
├── content-plan-edit-card.jsx
│   ├── Zeile 127-140: Progress-Berechnung
│   ├── Zeile 435: Empty-State Check
│   └── Zeile 445-483: Hierarchie-Rendering
│
├── calendar-context.jsx
│   ├── Zeile 1644: Default-Wert in createContentPlan
│   ├── Zeile 1750+: addRechtsgebietToPlan()
│   ├── Zeile 1780+: removeRechtsgebietFromPlan()
│   └── Zeile 1800+: Nested CRUD-Operationen
│
└── themenliste-migration.js
    └── Zeile 15-18: isOldStructure() Detection
```

#### Neue Struktur: `selectedAreas[]` + `themen[]`

```
selectedAreas[]
├── themenliste-editor.jsx
│   ├── Zeile 61: Initial State
│   ├── Zeile 399-401: handleAreasChange()
│   └── Zeile 616: getDisplayName() für plan.name
│
├── themen-navigation.jsx
│   └── Zeile 30+: Farbzuordnung für Themen
│
├── thema-detail.jsx
│   └── Zeile 31-34: getColorBarClass()
│
└── themenliste-migration.js
    └── Zeile 26-29: isNewStructure() Detection

themen[]
├── themenliste-editor.jsx
│   ├── Zeile 409-424: handleAddThema()
│   ├── Zeile 445-452: handleDeleteThema()
│   └── Zeile 504-513: handleAddAufgabe()
│
├── themen-navigation.jsx
│   └── Zeile 50+: Themen-Liste Rendering
│
└── thema-detail.jsx
    └── Zeile 132+: Aufgaben-Liste Rendering
```

### 21.4 Migrations-Checkliste

**VOR der Implementation einer Struktur-Änderung:**

```markdown
## Migrations-Checkliste für [Feature-Name]

### 1. Datenstruktur-Analyse
- [ ] Alte Struktur dokumentiert
- [ ] Neue Struktur dokumentiert
- [ ] Unterschiede explizit aufgelistet
- [ ] Feldnamen-Änderungen notiert (z.B. `title` → `name`)

### 2. Komponenten-Audit
- [ ] Alle Komponenten identifiziert die alte Struktur lesen
- [ ] Alle Komponenten identifiziert die alte Struktur schreiben
- [ ] Für jede Komponente: Entscheidung ob Update oder Deprecation

### 3. Kontext/Provider-Audit
- [ ] Alle Context-Provider geprüft
- [ ] Alle CRUD-Funktionen geprüft
- [ ] LocalStorage-Keys geprüft
- [ ] Supabase-Schema geprüft

### 4. Migrations-Strategie
- [ ] Option gewählt: Parallel | Konvertierung | Breaking Change
- [ ] Rückwärtskompatibilität definiert
- [ ] Migrationsfunktion implementiert (wenn nötig)

### 5. Test-Plan
- [ ] Alle betroffenen User-Flows identifiziert
- [ ] Testfälle für jeden Flow geschrieben
- [ ] Edge Cases definiert (leere Daten, alte Daten, gemischte Daten)

### 6. Rollout-Plan
- [ ] Feature-Flag definiert (wenn nötig)
- [ ] Rollback-Strategie definiert
- [ ] Monitoring-Metriken definiert
```

### 21.5 Test-Matrix für Themenliste

| Test-Szenario | Editor | Lernplan-Seite | Progress | Erwartet |
|---------------|:------:|:--------------:|:--------:|----------|
| Neue Themenliste erstellen | ✅ | ❌ | ❌ | Anzeige mit Themen |
| Alte Themenliste laden | ✅* | ✅ | ✅ | Migration funktioniert |
| Themenliste bearbeiten | ✅ | ❌ | ❌ | Änderungen sichtbar |
| Aufgabe abhaken | ✅ | ❌ | ❌ | Progress aktualisiert |
| Offline → Online | ✅ | ? | ? | Sync funktioniert |

*mit Migration

### 21.6 Empfohlene Lösung: Option B mit Hybrid-Support

```
┌─────────────────────────────────────────────────────────────────┐
│  LERNPLAN-CONTENT.JSX                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  {filteredThemenlisten.map((plan) => {                          │
│    // Strukturerkennung                                          │
│    const isT27Structure = plan.selectedAreas?.length > 0;       │
│                                                                  │
│    if (isT27Structure) {                                        │
│      // NEUE Komponente für flache Struktur                     │
│      return <ThemenlisteT27Card key={plan.id} plan={plan} />;   │
│    } else {                                                      │
│      // ALTE Komponente für hierarchische Struktur              │
│      return <ContentPlanEditCard key={plan.id} plan={plan} />;  │
│    }                                                             │
│  })}                                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Warum Option B?**

| Kriterium | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| Rückwärtskompatibilität | ⚠️ Risiko | ✅ Sicher | ✅ Sicher |
| Code-Komplexität | 🔴 Hoch | 🟢 Niedrig | 🟡 Mittel |
| Wartbarkeit | 🟡 Mittel | 🟢 Gut | 🔴 Schlecht |
| Performance | 🟢 Gut | 🟢 Gut | 🟡 Overhead |
| Testbarkeit | 🟡 Mittel | 🟢 Gut | 🟡 Mittel |

### 21.7 Implementierungsreihenfolge für vollständige Migration

```
Phase 1: Analyse (JETZT)
─────────────────────────
✅ Abhängigkeitsmatrix erstellt
✅ Datenfeld-Nutzung dokumentiert
✅ Test-Matrix erstellt

Phase 2: Neue Komponente erstellen
──────────────────────────────────
□ ThemenlisteT27Card.jsx erstellen
  - Rendert selectedAreas als Fach-Tags
  - Rendert themen[] als flache Liste mit Farbzuordnung
  - Progress-Berechnung für flache Struktur
  - View-Mode und Edit-Mode

Phase 3: Integration
────────────────────
□ lernplan-content.jsx anpassen
  - Strukturerkennung hinzufügen
  - Routing zu richtiger Komponente

Phase 4: Klick zum Bearbeiten
─────────────────────────────
□ Navigation von ThemenlisteT27Card zum Editor
  - Plan-ID übergeben
  - Editor lädt existierenden Plan
  - Änderungen speichern

Phase 5: Tests
──────────────
□ Alle Szenarien aus Test-Matrix durchspielen
□ Edge Cases testen
□ Regressionstests für alte Themenlisten

Phase 6: Cleanup
────────────────
□ Alte Code-Pfade markieren als @deprecated
□ Dokumentation aktualisieren
□ PRD.md aktualisieren
```

### 21.8 Signale für unvollständige Migration

Warnsignale die anzeigen, dass eine Migration nicht vollständig ist:

```javascript
// 🚨 WARNUNG: Diese Patterns deuten auf unvollständige Migration hin

// 1. Leere Arrays bei neuer Struktur
if (plan.rechtsgebiete?.length === 0 && plan.selectedAreas?.length > 0) {
  console.warn('T27 Themenliste wird mit alter Komponente gerendert!');
}

// 2. Fehlende Felder
if (plan.type === 'themenliste' && !plan.selectedAreas && !plan.rechtsgebiete) {
  console.warn('Themenliste hat weder alte noch neue Struktur!');
}

// 3. Progress = 0 bei vorhandenen Daten
if (plan.themen?.length > 0 && progress.total === 0) {
  console.warn('Progress-Berechnung ignoriert themen[]!');
}
```

### 21.9 Dokumentations-Anforderungen

Bei jeder Struktur-Änderung muss dokumentiert werden:

```markdown
## Datenstruktur-Änderung: [Name]

### Alte Struktur
- Felder: ...
- Verwendet von: ...

### Neue Struktur
- Felder: ...
- Verwendet von: ...

### Migration
- Automatisch: ja/nein
- Migrationsfunktion: ...
- Rückwärtskompatibel: ja/nein

### Betroffene Komponenten
| Komponente | Status | PR |
|------------|--------|-----|
| ... | ✅/❌ | #123 |

### Test-Ergebnisse
| Szenario | Ergebnis |
|----------|----------|
| ... | ✅/❌ |
```

---

## 22. Zusammenfassung

### Das Problem
T27 hat den Themenliste-Editor modernisiert, aber vergessen dass `ContentPlanEditCard` die Daten auf der Lernplan-Seite anzeigt. Diese Komponente versteht die neue Struktur nicht.

### Die Lösung
Option B: Neue `ThemenlisteT27Card` Komponente erstellen, die die flache Struktur rendert. Strukturerkennung in `lernplan-content.jsx` routet zur richtigen Komponente.

### Prävention
Migrations-Checkliste und Abhängigkeitsmatrix vor jeder Struktur-Änderung ausfüllen. Alle Komponenten identifizieren die Daten lesen/schreiben, nicht nur die offensichtlichen.

---

## 23. Implementierungsplan

### 23.1 Übersicht der Implementierung

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTIERUNGSPLAN                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Schritt 1: ThemenlisteT27Card.jsx erstellen                   │
│  ──────────────────────────────────────────                    │
│  └─> Neue Komponente in src/components/lernplan/               │
│                                                                 │
│  Schritt 2: lernplan-content.jsx anpassen                      │
│  ─────────────────────────────────────────                     │
│  └─> Strukturerkennung + Routing hinzufügen                    │
│                                                                 │
│  Schritt 3: Navigation zum Editor                              │
│  ────────────────────────────────                              │
│  └─> Klick auf Card → Editor mit plan.id                       │
│                                                                 │
│  Schritt 4: Tests & Cleanup                                    │
│  ────────────────────────                                      │
│  └─> Alle Szenarien testen                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 23.2 Schritt 1: ThemenlisteT27Card.jsx

**Dateipfad:** `src/components/lernplan/themenliste-t27-card.jsx`

#### 23.2.1 Komponenten-Spezifikation

```javascript
/**
 * ThemenlisteT27Card - Anzeige-Komponente für T27-Struktur Themenlisten
 *
 * Props:
 * @param {Object} plan - ContentPlan mit T27-Struktur
 *   - plan.id: string
 *   - plan.selectedAreas: Array<{id, name, rechtsgebietId, color}>
 *   - plan.themen: Array<{id, name, description, areaId, aufgaben}>
 *   - plan.kapitel: Array<{id, name, areaId}> (optional)
 *   - plan.useKapitel: boolean
 *   - plan.status: 'draft' | 'active' | 'completed'
 * @param {Function} onEdit - Callback wenn Bearbeiten geklickt wird
 * @param {Function} onDelete - Callback wenn Löschen geklickt wird
 */
```

#### 23.2.2 Komponenten-Struktur

```jsx
// src/components/lernplan/themenliste-t27-card.jsx

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { getDisplayName, getColorForArea } from '@/utils/themenliste-migration';

export function ThemenlisteT27Card({ plan, onEdit, onDelete }) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // PROGRESS BERECHNUNG FÜR FLACHE STRUKTUR
  // ═══════════════════════════════════════════════════════════
  const progress = useMemo(() => {
    let total = 0;
    let completed = 0;

    // Iteriere über alle Themen
    for (const thema of plan.themen || []) {
      // Zähle Aufgaben
      for (const aufgabe of thema.aufgaben || []) {
        total++;
        if (aufgabe.completed) {
          completed++;
        }
      }
    }

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  }, [plan.themen]);

  // ═══════════════════════════════════════════════════════════
  // THEMEN NACH AREA GRUPPIEREN (für Anzeige)
  // ═══════════════════════════════════════════════════════════
  const themenByArea = useMemo(() => {
    const grouped = {};

    for (const area of plan.selectedAreas || []) {
      grouped[area.id] = {
        area,
        themen: []
      };
    }

    for (const thema of plan.themen || []) {
      if (grouped[thema.areaId]) {
        grouped[thema.areaId].themen.push(thema);
      }
    }

    return grouped;
  }, [plan.selectedAreas, plan.themen]);

  // ═══════════════════════════════════════════════════════════
  // DISPLAY NAME
  // ═══════════════════════════════════════════════════════════
  const displayName = useMemo(() => {
    return getDisplayName(plan.selectedAreas) || 'Themenliste';
  }, [plan.selectedAreas]);

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleEdit = () => {
    if (onEdit) {
      onEdit(plan);
    } else {
      // Fallback: Navigation zum Editor
      navigate(`/themenliste/${plan.id}`);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(plan);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          {/* Title + Areas */}
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              {displayName}
            </CardTitle>

            {/* Area Badges */}
            <div className="flex flex-wrap gap-1 mt-2">
              {(plan.selectedAreas || []).map(area => (
                <Badge
                  key={area.id}
                  className={`${area.color} text-white text-xs`}
                >
                  {area.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              title="Bearbeiten"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              title="Löschen"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Fortschritt</span>
            <span>{progress.completed} / {progress.total} Aufgaben</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-start"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 mr-2" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-2" />
          )}
          {plan.themen?.length || 0} Themen anzeigen
        </Button>

        {/* Expanded Content: Themen nach Area gruppiert */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {Object.values(themenByArea).map(({ area, themen }) => (
              <div key={area.id} className="border-l-4 pl-3" style={{ borderColor: 'var(--' + area.color?.replace('bg-', '') + ')' }}>
                <h4 className="font-medium text-sm mb-2">{area.name}</h4>
                <ul className="space-y-1">
                  {themen.map(thema => {
                    const themaCompleted = thema.aufgaben?.every(a => a.completed);
                    const themaProgress = thema.aufgaben?.length
                      ? thema.aufgaben.filter(a => a.completed).length
                      : 0;

                    return (
                      <li key={thema.id} className="flex items-center gap-2 text-sm">
                        {themaCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-300" />
                        )}
                        <span className={themaCompleted ? 'line-through text-gray-400' : ''}>
                          {thema.name}
                        </span>
                        {thema.aufgaben?.length > 0 && (
                          <span className="text-xs text-gray-400">
                            ({themaProgress}/{thema.aufgaben.length})
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 23.2.3 Wichtige Unterschiede zu ContentPlanEditCard

| Aspekt | ContentPlanEditCard (alt) | ThemenlisteT27Card (neu) |
|--------|---------------------------|--------------------------|
| Datenstruktur | `rechtsgebiete[]` hierarchisch | `selectedAreas[]` + `themen[]` flach |
| Progress-Iteration | 4-fach verschachtelt | 2-fach (themen → aufgaben) |
| Gruppierung | Vorgegeben durch Hierarchie | Dynamisch nach `thema.areaId` |
| Farben | `RECHTSGEBIET_COLORS[rg.id]` | `area.color` direkt |
| Title | `plan.name` | `getDisplayName(selectedAreas)` |

---

### 23.3 Schritt 2: lernplan-content.jsx anpassen

**Dateipfad:** `src/components/lernplan/lernplan-content.jsx`

#### 23.3.1 Import hinzufügen

```javascript
// Am Anfang der Datei, bei den anderen Imports:
import { ThemenlisteT27Card } from './themenliste-t27-card';
import { isNewStructure } from '@/utils/themenliste-migration';
```

#### 23.3.2 Strukturerkennung-Utility

```javascript
/**
 * Erkennt ob ein ContentPlan die T27-Struktur hat
 * @param {Object} plan
 * @returns {boolean}
 */
function isT27Structure(plan) {
  // T27 Struktur hat selectedAreas Array
  return Array.isArray(plan.selectedAreas) && plan.selectedAreas.length > 0;
}

/**
 * Erkennt ob ein ContentPlan die alte hierarchische Struktur hat
 * @param {Object} plan
 * @returns {boolean}
 */
function isLegacyStructure(plan) {
  // Alte Struktur hat rechtsgebiete Array
  return Array.isArray(plan.rechtsgebiete) && plan.rechtsgebiete.length > 0;
}
```

#### 23.3.3 Rendering-Logik anpassen

Finde die Stelle wo Themenlisten gerendert werden (ca. Zeile 516-534) und ersetze:

**VORHER:**
```jsx
{themenlisten.map(plan => (
  <ContentPlanEditCard
    key={plan.id}
    plan={plan}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />
))}
```

**NACHHER:**
```jsx
{themenlisten.map(plan => {
  // Strukturerkennung: T27 vs. Legacy
  if (isT27Structure(plan)) {
    return (
      <ThemenlisteT27Card
        key={plan.id}
        plan={plan}
        onEdit={() => handleEditThemenliste(plan)}
        onDelete={() => handleDeletePlan(plan)}
      />
    );
  }

  // Legacy-Struktur: alte Komponente verwenden
  return (
    <ContentPlanEditCard
      key={plan.id}
      plan={plan}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
})}
```

#### 23.3.4 Edit-Handler für T27 Themenlisten

```javascript
const handleEditThemenliste = useCallback((plan) => {
  // Navigation zum Themenliste-Editor mit Plan-ID
  navigate(`/themenliste/${plan.id}`);
}, [navigate]);
```

---

### 23.4 Schritt 3: Editor für existierende Pläne anpassen

**Dateipfad:** `src/pages/themenliste-editor.jsx`

#### 23.4.1 Route anpassen (falls nicht vorhanden)

In `src/App.jsx` oder Router-Konfiguration:

```jsx
<Route path="/themenliste/:planId?" element={<ThemenlisteEditor />} />
```

#### 23.4.2 Plan aus ID laden

Im `themenliste-editor.jsx`, am Anfang der Komponente:

```javascript
const { planId } = useParams();
const { contentPlans, updateContentPlan } = useCalendar();

// Existierenden Plan laden, falls planId vorhanden
useEffect(() => {
  if (planId && contentPlans) {
    const existingPlan = contentPlans.find(p => p.id === planId);
    if (existingPlan && isNewStructure(existingPlan)) {
      setContentPlan(existingPlan);
      // Direkt zu Step 2 springen (Themen-Bearbeitung)
      setCurrentStep(2);
    }
  }
}, [planId, contentPlans]);
```

#### 23.4.3 handleFinish anpassen für Updates

```javascript
const handleFinish = useCallback(async () => {
  const planName = getDisplayName(contentPlan.selectedAreas);

  const planToSave = {
    ...contentPlan,
    name: planName,
    status: 'active',
    updatedAt: new Date().toISOString()
  };

  // Unterscheide zwischen Create und Update
  if (planId) {
    // UPDATE: Existierenden Plan aktualisieren
    await updateContentPlan(planToSave);
  } else {
    // CREATE: Neuen Plan erstellen
    await createContentPlan(planToSave);
  }

  navigate('/lernplan');
}, [contentPlan, planId, createContentPlan, updateContentPlan, navigate]);
```

---

### 23.5 Schritt 4: Test-Checkliste

#### 23.5.1 Neue Themenliste erstellen

| Test | Erwartetes Ergebnis | ✅/❌ |
|------|---------------------|-------|
| Areas auswählen | Areas werden in selectedAreas[] gespeichert | |
| Themen hinzufügen | Themen haben korrektes areaId | |
| Speichern | Plan erscheint auf Lernplan-Seite | |
| Anzeige | ThemenlisteT27Card wird verwendet | |
| Progress | Progress zeigt korrekte Aufgabenzahl | |
| Expand | Themen nach Area gruppiert angezeigt | |

#### 23.5.2 Existierende T27-Themenliste bearbeiten

| Test | Erwartetes Ergebnis | ✅/❌ |
|------|---------------------|-------|
| Klick auf Edit | Editor öffnet mit geladenem Plan | |
| Daten korrekt | selectedAreas und themen geladen | |
| Änderung speichern | Änderungen persistent | |
| Nach Reload | Änderungen sichtbar | |

#### 23.5.3 Alte Legacy-Themenlisten

| Test | Erwartetes Ergebnis | ✅/❌ |
|------|---------------------|-------|
| Anzeige | ContentPlanEditCard wird verwendet | |
| Progress | Funktioniert wie vorher | |
| Keine Regression | Alte Daten weiterhin korrekt | |

---

### 23.6 Datei-Änderungen Zusammenfassung

```
src/
├── components/
│   └── lernplan/
│       ├── themenliste-t27-card.jsx    ← NEU ERSTELLEN
│       └── lernplan-content.jsx        ← ÄNDERN (Import + Routing)
├── pages/
│   └── themenliste-editor.jsx          ← ÄNDERN (Load by ID)
└── utils/
    └── themenliste-migration.js        ← BEREITS VORHANDEN
```

#### Änderungs-Umfang:

| Datei | Art | Zeilen (geschätzt) |
|-------|-----|-------------------|
| `themenliste-t27-card.jsx` | Neu | ~200 |
| `lernplan-content.jsx` | Änderung | ~30 |
| `themenliste-editor.jsx` | Änderung | ~20 |

---

### 23.7 Implementierungsreihenfolge

```
1. themenliste-t27-card.jsx erstellen
   └─> Kann sofort getestet werden mit Mock-Daten

2. lernplan-content.jsx anpassen
   └─> Import + isT27Structure() + Routing-Logik

3. Testen: Neue Themenliste erstellen
   └─> Sollte jetzt mit T27Card angezeigt werden

4. themenliste-editor.jsx: planId-Support
   └─> Route + useParams + Load existing plan

5. Testen: Bearbeiten einer T27-Themenliste
   └─> Editor öffnet mit korrekten Daten

6. Regressionstests für alte Themenlisten
   └─> Legacy-Struktur weiterhin funktional
```

---

### 23.8 Risiken und Mitigationen

| Risiko | Mitigation |
|--------|------------|
| Styling-Inkonsistenz | T27Card verwendet gleiche UI-Komponenten wie ContentPlanEditCard |
| Fehlende Felder | `area.color` Fallback zu `RECHTSGEBIET_COLORS[rechtsgebietId]` |
| Editor-State verloren | useEffect mit Abhängigkeit auf `planId` für korrektes Laden |
| Race Conditions | Prüfung ob `contentPlans` geladen bevor Plan gesucht wird |

---

### 23.9 Definition of Done

- [x] ThemenlisteT27Card.jsx erstellt und exportiert
- [x] lernplan-content.jsx routet korrekt zu T27Card
- [ ] Neue T27-Themenlisten werden korrekt angezeigt
- [ ] Progress-Berechnung funktioniert für flache Struktur
- [ ] Themen nach Area gruppiert angezeigt
- [x] Klick auf Edit öffnet Editor mit korrekten Daten
- [ ] Änderungen werden gespeichert und sind persistent
- [ ] Alte Legacy-Themenlisten funktionieren weiterhin
- [ ] Keine Konsolenfehler bei beiden Strukturen

---

## 24. Implementierungsstatus (2026-01-23)

### 24.1 Erstellte/Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/lernplan/themenliste-t27-card.jsx` | **NEU** - Anzeige-Komponente für T27-Struktur |
| `src/components/lernplan/lernplan-content.jsx` | Import + `isT27Structure()` + Routing-Logik |
| `src/router.jsx` | Neue Route `/lernplan/themenliste/:planId` |
| `src/pages/themenliste-editor.jsx` | `useParams` + Load existing plan by ID |

### 24.2 Neue Komponenten-Funktionalität

**ThemenlisteT27Card:**
- Progress-Berechnung für flache Struktur (`themen[] → aufgaben[]`)
- Themen nach Area gruppiert angezeigt
- Expand/Collapse für Areas und Themen
- Aufgaben mit Checkbox zum Abhaken
- Edit-Button navigiert zu `/lernplan/themenliste/:planId`

**lernplan-content.jsx:**
- `isT27Structure(plan)` prüft ob `selectedAreas[]` vorhanden ist
- T27-Pläne → ThemenlisteT27Card
- Legacy-Pläne → ContentPlanEditCard (unverändert)

**themenliste-editor.jsx:**
- `planId` aus URL via `useParams()`
- Neuer useEffect lädt existierenden Plan wenn `planId` vorhanden
- `isEditingExisting` State verhindert Draft-Dialog bei Edit-Mode
- Automatische Migration von alter Struktur wenn nötig

### 24.3 Nächste Schritte (Testen)

1. Neue Themenliste erstellen → sollte mit T27Card angezeigt werden
2. Auf Card klicken → Editor sollte Plan laden
3. Änderungen speichern → sollte persistent sein
4. Progress sollte korrekt berechnet werden
5. Alte Legacy-Themenlisten sollten weiterhin funktionieren
