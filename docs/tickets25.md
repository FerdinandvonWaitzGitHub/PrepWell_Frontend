# Ticket 25: Console Warnings & Sync-Analyse

**Datum:** 19.01.2026
**Status:** Offen
**Priorität:** Mittel
**Abhängigkeiten:** -

---

## Zusammenfassung

Die Browser-Console zeigt mehrere Warnungen und Hinweise, die analysiert und ggf. behoben werden sollten.

| # | Problem | Typ | Schwere | Status |
|---|---------|-----|---------|--------|
| 1 | React Router Future Flag Warning | Warnung | Niedrig | ✅ Behoben |
| 2 | Null date keys in Sync | Warnung | Mittel | ✅ Behoben |
| 3 | 6850 timer_sessions local-only | Hinweis | Hoch | ⏳ Ursache gefunden |
| 4 | Doppeltes AUTH STATE CHANGE Event | Info | Niedrig | ✅ Erwartet (StrictMode) |
| 5 | Dialog onOpenChange is not a function | Bug | Hoch | ✅ Behoben |
| 6 | Drafts erscheinen in Lernpläne-Seite | Bug | Kritisch | ⏳ In Arbeit |

---

## Problem 1: React Router Future Flag Warning

### Console-Ausgabe

```
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates
in `React.startTransition` in v7. You can use the `v7_startTransition` future flag
to opt-in early.
```

### Ursache

React Router v6 bereitet auf v7 vor. Die App sollte das `v7_startTransition` Flag setzen.

### Betroffene Datei

`src/router.jsx` - verwendet `createBrowserRouter` (Zeile 139)

### Aktuelle Konfiguration

```jsx
const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  // ... weitere Routen
]);
```

### Lösung

```jsx
const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  // ... weitere Routen
], {
  future: {
    v7_startTransition: true,
  },
});
```

Alternativ/zusätzlich in `RouterProvider` (Zeile 213):

```jsx
<RouterProvider
  router={router}
  future={{ v7_startTransition: true }}
/>
```

### Auswirkung wenn nicht behoben

- Bei Upgrade auf React Router v7 könnte es Breaking Changes geben
- Aktuell nur kosmetisch (Warnung)

---

## Problem 2: Null date keys in Sync

### Console-Ausgabe

```
[filterValidDateKeys] Removing invalid date key: null
[useSupabaseSync] Skipping invalid date key: null
```

### Ursache

Es gibt Einträge in den Kalenderdaten mit `null` als Datum-Schlüssel. Das deutet auf:
1. Defekte/alte Daten
2. Bug bei der Datenerstellung
3. Migration die nicht korrekt durchgeführt wurde

### Betroffene Datei

`src/hooks/use-supabase-sync.js` (Zeilen 1714, 1820)

### Analyse erforderlich

```javascript
// In use-supabase-sync.js prüfen:
// 1. Wo werden diese null-keys erzeugt?
// 2. Welche Datenstruktur hat diese null-keys?
```

### Mögliche Quellen

1. `calendar_blocks` mit `block_date: null`
2. `private_sessions` mit `date: null`
3. `time_sessions` mit ungültigen Timestamps

### Nächste Schritte

1. Supabase-Tabellen nach `null`-Werten durchsuchen
2. Code analysieren wo Daten mit Datum erstellt werden
3. Validierung bei Datenerstellung hinzufügen

---

## Problem 3: 3850 local-only items syncing

### Console-Ausgabe

```
[useSupabaseSync] Syncing 3850 local-only items in 39 chunk(s)...
[useSupabaseSync] Successfully synced all 3850 items
```

### Ursache

Es gibt 3850 Einträge die nur lokal existieren und zu Supabase synchronisiert werden müssen. Das ist eine ungewöhnlich hohe Anzahl.

### Mögliche Gründe

| Grund | Wahrscheinlichkeit | Beschreibung |
|-------|-------------------|--------------|
| Offline-Nutzung | Mittel | App wurde lange offline genutzt |
| Sync-Fehler | Hoch | Items werden nicht korrekt als "synced" markiert |
| Duplikate | Mittel | Gleiche Items werden mehrfach erstellt |
| Test-Daten | Niedrig | Viele Test-Einträge während Entwicklung |

### Betroffene Datei

`src/hooks/use-supabase-sync.js` (Zeilen 350, 394)

### Analyse erforderlich

```javascript
// Prüfen:
// 1. Welche Tabellen haben die meisten local-only items?
// 2. Werden Items nach erfolgreichem Sync als "synced" markiert?
// 3. Gibt es Duplikate?
```

### LocalStorage Keys (use-supabase-sync.js Z. 17-27)

```javascript
const STORAGE_KEYS = {
  contentPlans: 'prepwell_content_plans',
  publishedThemenlisten: 'prepwell_published_themenlisten',
  blocks: 'prepwell_calendar_blocks',
  contents: 'prepwell_contents',
  tasks: 'prepwell_tasks',
  privateSessions: 'prepwell_private_sessions',
  timeSessions: 'prepwell_time_sessions',
  lernplanMetadata: 'prepwell_lernplan_metadata',
  archivedLernplaene: 'prepwell_archived_lernplaene',
  exams: 'prepwell_exams',
};
```

### Quick-Debug in Browser Console

```javascript
// Im Browser ausführen um Größen zu sehen:
Object.entries({
  'prepwell_content_plans': localStorage.getItem('prepwell_content_plans'),
  'prepwell_calendar_blocks': localStorage.getItem('prepwell_calendar_blocks'),
  'prepwell_tasks': localStorage.getItem('prepwell_tasks'),
  'prepwell_private_sessions': localStorage.getItem('prepwell_private_sessions'),
  'prepwell_time_sessions': localStorage.getItem('prepwell_time_sessions'),
}).forEach(([key, val]) => {
  const parsed = val ? JSON.parse(val) : [];
  console.log(`${key}: ${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length} items`);
});
```

### Debug-Code in Code (temporär)

```javascript
// In use-supabase-sync.js Zeile 336, vor "if (localOnlyItems.length > 0)":
console.log(`[DEBUG] ${tableName}: ${localOnlyItems.length} local-only items`);
```

### Ergebnis der Analyse (19.01.2026)

**Quelle identifiziert:** `timer_sessions` Tabelle mit 6850 lokalen Einträgen

```
[useSupabaseSync] timer_sessions: 6850 local-only items to sync
[useSupabaseSync] Syncing 6850 local-only items in 69 chunk(s)...
[useSupabaseSync] Successfully synced all 6850 items
```

**localStorage Key:** `prepwell_timer_history`

**Mögliche Ursachen:**
1. Timer wurde häufig genutzt (Pomodoro-Sessions)
2. Sync war zuvor deaktiviert/nicht implementiert
3. Offline-Nutzung akkumulierte Sessions

**Status:** Sync erfolgreich abgeschlossen. Bei zukünftigen Page Loads sollte die Zahl bei 0 sein.

### Nächste Schritte

1. ✅ Debug-Logging hinzugefügt (zeigt welche Tabelle wie viele Items hat)
2. ⏳ Nach Reload prüfen ob sync weiterhin viele Items zeigt
3. ⏳ Falls ja: Duplikat-Check in timer_sessions implementieren

---

## Problem 4: Doppeltes AUTH STATE CHANGE Event

### Console-Ausgabe

```
🔐 [AUTH STATE CHANGE] Event: INITIAL_SESSION
Event Type: INITIAL_SESSION
Has Session: true
User ID: d72ef73c-84e8-4aaa-a1b7-a557d8178a7a
Session expires_at: 2026-01-19T17:33:49.000Z
Access Token (first 20 chars): eyJhbGciOiJFUzI1NiIs

🔐 [AUTH STATE CHANGE] Event: INITIAL_SESSION (zweites Mal)
```

### Ursache

**Erwartet:** React StrictMode führt in Development doppeltes Rendering aus um Fehler zu finden.

### Betroffene Datei

`src/contexts/auth-context.jsx` (Zeilen 233-238)

### Keine Aktion erforderlich

Dies ist normales Verhalten in Development. In Production (ohne StrictMode) erscheint das Event nur einmal.

### Verifizierung

```jsx
// In main.jsx prüfen:
<React.StrictMode>
  <App />
</React.StrictMode>
```

---

## Problem 6: Drafts erscheinen in Lernpläne-Seite (KRITISCH)

### Symptom

Wenn ein User eine neue Themenliste beginnt (Editor öffnen, Rechtsgebiet hinzufügen), aber NICHT auf "Fertig" klickt, erscheint die Themenliste trotzdem auf der Lernpläne-Seite.

**Erwartetes Verhalten:** Drafts (status='draft') sollten NICHT in Lernpläne sichtbar sein bis "Fertig" geklickt wird.

### Root Cause Analyse (19.01.2026)

Es gibt **zwei Bugs** die zusammen das Problem verursachen:

#### Bug A: `createContentPlan` ignoriert `status`-Feld

**Datei:** `src/contexts/calendar-context.jsx` (Zeilen 1550-1567)

```javascript
const createContentPlan = useCallback(async (planData) => {
  const newPlan = {
    id: generateId(),
    name: planData.name || '',
    type: planData.type || 'themenliste',
    description: planData.description || '',
    mode: planData.mode || 'standard',
    examDate: planData.examDate || null,
    archived: false,
    rechtsgebiete: [],    // ← HIER: rechtsgebiete aus planData wird ignoriert!
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // ← status FEHLT! planData.status wird komplett ignoriert!
  };
  // ...
}, []);
```

**Problem:** Wenn der Editor `status: 'draft'` übergibt:
```javascript
// In themenliste-editor.jsx Zeile 146:
const savedPlan = await createContentPlan({
  ...contentPlan,
  id: undefined,
  status: 'draft',  // ← WIRD IGNORIERT!
});
```

Das `status`-Feld wird nicht in das neue Plan-Objekt übernommen. Der Plan hat also `status: undefined`.

#### Bug B: `LernplanContent` filtert Drafts nicht

**Datei:** `src/components/lernplan/lernplan-content.jsx` (Zeilen 69-80)

```javascript
const { filteredLernplaene, filteredThemenlisten } = useMemo(() => {
  let plans = contentPlans || [];

  // Filter by archived status only
  plans = plans.filter(p => p.archived === showArchived);

  // ← HIER: KEIN Filter für status !== 'draft'!

  // Separate by type
  const lernplaeneOnly = plans.filter(p => p.type === 'lernplan');
  const themenlistenOnly = plans.filter(p => p.type === 'themenliste');

  return { filteredLernplaene: lernplaeneOnly, filteredThemenlisten: themenlistenOnly };
}, [contentPlans, showArchived]);
```

**Problem:** Die Komponente greift direkt auf `contentPlans` zu und verwendet NICHT die `getContentPlansByType()`-Funktion, welche Drafts bereits ausfiltert.

### Datenfluss-Diagramm

```
┌─────────────────────────────────────────────────────────────────────────┐
│ themenliste-editor.jsx                                                  │
│                                                                         │
│   createContentPlan({                                                   │
│     ...contentPlan,                                                     │
│     status: 'draft'  ← übergeben                                        │
│   })                                                                    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ calendar-context.jsx :: createContentPlan()                             │
│                                                                         │
│   newPlan = {                                                           │
│     name, type, description, mode, ...                                  │
│     // status: FEHLT! ← Bug A                                           │
│   }                                                                     │
│                                                                         │
│   contentPlans = [...contentPlans, newPlan]                             │
│     ↑ Plan hat status: undefined                                        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ lernplan-content.jsx :: Filter                                          │
│                                                                         │
│   plans.filter(p => p.archived === false)                               │
│     ↓                                                                   │
│   // KEIN Filter für p.status !== 'draft' ← Bug B                       │
│     ↓                                                                   │
│   ALLE Plans werden angezeigt (inkl. Drafts)                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Warum der bisherige Fix nicht funktioniert hat

In T23 Problem 8 wurde `getContentPlansByType()` erweitert um Drafts zu filtern:

```javascript
// calendar-context.jsx Zeile 1618-1631
const getContentPlansByType = useCallback((type, includeArchived, includeDrafts = false) => {
  // ...
  if (!includeDrafts) {
    plans = plans.filter(p => p.status !== 'draft');
  }
  // ...
}, [contentPlans]);
```

**Aber:** `LernplanContent` verwendet diese Funktion gar nicht! Sie greift direkt auf `contentPlans` zu.

### Lösung (zwei Fixes erforderlich)

#### Fix A: `createContentPlan` muss alle Felder übernehmen

```javascript
const createContentPlan = useCallback(async (planData) => {
  const newPlan = {
    id: generateId(),
    name: planData.name || '',
    type: planData.type || 'themenliste',
    description: planData.description || '',
    mode: planData.mode || 'standard',
    examDate: planData.examDate || null,
    archived: false,
    rechtsgebiete: planData.rechtsgebiete || [],  // ← FIX: aus planData
    status: planData.status || 'active',           // ← FIX: status übernehmen
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // ...
}, []);
```

#### Fix B: `LernplanContent` muss Drafts filtern

```javascript
const { filteredLernplaene, filteredThemenlisten } = useMemo(() => {
  let plans = contentPlans || [];

  // Filter by archived status
  plans = plans.filter(p => p.archived === showArchived);

  // T25 FIX: Filter out drafts - they should not appear until "Fertig" is clicked
  plans = plans.filter(p => p.status !== 'draft');

  // Separate by type
  const lernplaeneOnly = plans.filter(p => p.type === 'lernplan');
  const themenlistenOnly = plans.filter(p => p.type === 'themenliste');

  return { filteredLernplaene: lernplaeneOnly, filteredThemenlisten: themenlistenOnly };
}, [contentPlans, showArchived]);
```

---

## Debugging-Plan

### Phase 1: Informationen sammeln

1. **Null date keys analysieren**
   ```sql
   -- In Supabase SQL Editor:
   SELECT * FROM calendar_blocks WHERE block_date IS NULL;
   SELECT * FROM private_sessions WHERE date IS NULL;
   SELECT * FROM time_sessions WHERE start_at IS NULL;
   ```

2. **Local-only items Breakdown**
   - Debug-Code in `use-supabase-sync.js` hinzufügen
   - App neu laden und Console prüfen

### Phase 2: Fixes implementieren

1. **React Router Flag** (einfach)
   - `v7_startTransition` Flag hinzufügen

2. **Null date keys** (mittel)
   - Defekte Daten bereinigen
   - Validierung bei Erstellung hinzufügen

3. **Sync-Problem** (komplex)
   - Ursache der 3850 Items finden
   - Duplikate entfernen falls vorhanden
   - Sync-Logik prüfen

---

## Betroffene Dateien

| Datei | Problem |
|-------|---------|
| `src/router.jsx` | React Router Future Flag (Zeile 139, 213) |
| `src/hooks/use-supabase-sync.js` | Null keys (Z. 1714), Sync-Logik (Z. 350) |
| `src/contexts/auth-context.jsx` | Doppeltes Event (erwartet, StrictMode) |
| `src/components/ui/dialog.jsx` | onOpenChange/onClose Kompatibilität |
| `src/contexts/calendar-context.jsx` | createContentPlan ignoriert status (Z. 1550-1567) |
| `src/components/lernplan/lernplan-content.jsx` | Filter fehlt für status!='draft' (Z. 69-80) |

---

## Referenzen

- [React Router v7 Migration](https://reactrouter.com/v6/upgrading/future#v7_starttransition)
- [React StrictMode](https://react.dev/reference/react/StrictMode)
- Supabase Dashboard für Datenanalyse

---

## Implementierte Fixes

### Fix 1: React Router Future Flag (19.01.2026)

**Datei:** `src/router.jsx`

```jsx
// Zeile 202-206: Future flag in createBrowserRouter
], {
  future: {
    v7_startTransition: true,
  },
});

// Zeile 218: Future flag in RouterProvider
<RouterProvider router={router} future={{ v7_startTransition: true }} />
```

### Fix 2: Null date keys Auto-Cleanup (19.01.2026)

**Datei:** `src/hooks/use-supabase-sync.js`

- `filterValidDateKeys()` speichert jetzt bereinigte Daten automatisch zurück in localStorage
- Warnung erscheint nur einmal, danach sind die Daten bereinigt
- Zeile 1709-1729

### Fix 3: Debug-Logging für Sync (19.01.2026)

**Datei:** `src/hooks/use-supabase-sync.js`

- Zeile 337-338: Zeigt jetzt welche Tabelle wie viele Items synct
- Beispiel-Output: `[useSupabaseSync] calendar_tasks: 150 local-only items to sync`

### Fix 4: Dialog onOpenChange Error (19.01.2026)

**Datei:** `src/components/ui/dialog.jsx`

**Fehler:**
```
dialog.jsx:27 Uncaught TypeError: onOpenChange is not a function
```

**Ursache:**
- Dialog-Komponente erwartete nur `onOpenChange` Prop
- Andere Komponenten (delete-confirm-dialog, draft-dialog) übergaben `onClose`
- Beim Klick auf Overlay wurde `onOpenChange(false)` aufgerufen, aber `onOpenChange` war `undefined`

**Lösung:**
```jsx
export const Dialog = ({ open, onOpenChange, onClose, children }) => {
  // Support both onOpenChange (new) and onClose (legacy) props
  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else if (onClose) {
      onClose();
    }
  };
  // ...
  onClick={handleClose}
```

Die Dialog-Komponente akzeptiert jetzt beide Props für Backwards-Compatibility.

