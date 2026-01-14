# T17: Supabase SDK - Crash bei Tabwechsel/Hard Refresh

## Status: ✅ COMPLETE (P0/P1/P2/P3 alle umgesetzt)

---

## Ueberblick

### Symptom
- Bei Tabwechsel (Tab verlassen/zurueck) oder Hard Refresh stuerzt die App komplett ab.
- Auftreten ist sporadisch, aber reproduzierbar in bestimmten Zustandskombinationen.
- Neues Verhalten: **Tab wechseln → Crash**, danach **Hard Refresh → App funktioniert wieder**.

### Erwartetes Verhalten
- App darf bei Refresh/Tabwechsel nicht crashen.
- Auth/State Restore soll robust sein (auch bei Storage-Problemen oder Partial State).

---

## Analyse (aktueller Stand)

### Neue Beobachtung: Crash nur nach Tabwechsel, Hard Refresh stabilisiert
Interpretation:
- Beim Tabwechsel wird der JS‑State in einen inkonsistenten Zustand gebracht (Suspend/BFCache/Visibility Change).
- Der anschliessende Hard Refresh setzt State/Storage neu auf und umgeht die inkonsistente Session.
- Das deutet eher auf **Restore/Resume‑Pfad** als auf ein dauerhaft korruptes Persisted State hin.

Moegliche Ursachen (priorisiert):
1. **Session/Storage Restore Timing**: Auth/Context liest Storage waehrend der Tab im Hintergrund ist oder reaktiviert wird → teilweise Daten (`undefined`) → TypeError.
2. **Supabase SDK State**: `getSession()` oder `onAuthStateChange()` feuert in einem ungünstigen Moment, waehrend Contexts bereits rendern.
3. **LocalStorage/sessionStorage temporarily unavailable**: Hintergrundtab/Browser Policy wirft Exceptions beim Zugriff.

### Neue Erkenntnisse aus Konsolen-Logs (400 Fehler)
Aus den Requests/Fehlern ist sehr wahrscheinlich, dass **Spaltennamen nicht zum aktuellen Schema passen**:

1. **calendar_tasks**
   - Request sendet `linked_slot_id`, DB-Column ist aber `linked_block_id`.
   - Ergebnis: `400 Bad Request` auf `/rest/v1/calendar_tasks?...linked_slot_id...`.
   - Betroffene Stellen: `use-supabase-sync.js` (Migration + saveDayTasks).

2. **private_sessions**
   - Requests nutzen `block_date`, DB-Column heisst `session_date`.
   - Ergebnis: `400 Bad Request` auf `/rest/v1/private_sessions?...block_date...`.
   - Betroffene Stellen: `use-supabase-sync.js` (Migration + saveDayBlocks + Batch).

Diese 400er verhindern Sync/Migration und koennen Folgestate (z.B. fehlende Daten) ausloesen.

### Beobachtete Risikostellen
1. **Storage Zugriff ohne Guard**
   - `src/utils/localStorage-migration.js` liest/schreibt `localStorage` direkt beim App-Start.
   - Wenn `localStorage` blockiert ist (Privacy Mode, Browser Policy, Tab suspend), kann der Boot crashen.

2. **Supabase Auth Storage**
   - `src/services/supabase.ts` nutzt `sessionStorage` direkt in `createClient`.
   - Falls `sessionStorage` in dem Moment nicht verfuegbar ist (Tab Restore/BFCache), kann ein Error vor React/ErrorBoundary entstehen.

3. **Teilweise Restores / Race Conditions**
   - Beim Refresh werden Context-Daten geladen (Supabase + localStorage). Wenn einzelne Werte `undefined` sind, knallen `.map/.filter/.forEach/Object.entries`.
   - In `docs/tickets15.md` sind bereits mehrere Crash-Pfade dokumentiert (Bug 2c), aber nicht alle Callsites sind sauber guarded.

### Wahrscheinliche Root Causes
- Storage Zugriff wirft Exception beim App-Start.
- Supabase Auth Restore haengt oder wirft (z.B. ungueltiges Token, Storage Lock Bug).
- Data Race beim State Restore: UI rendert bevor komplette Datenstruktur vorhanden ist.
- **Schema-Mismatch in Supabase-Requests** (veraltete Column-Namen).

---

## Hypothesen (geordnet nach Wahrscheinlichkeit)
1. **Storage Access Error** (localStorage/sessionStorage nicht verfuegbar) → Crash direkt beim Boot.
2. **Auth Restore Error** (Supabase SDK) → ungefangene Exception vor ErrorBoundary.
3. **Ungueltige/korrupt gespeicherte Daten** → TypeError bei array ops.

---

## Repro / Test Checkliste
- [ ] Hard Refresh (Ctrl+F5) im eingeloggten Zustand.
- [ ] Tab verlassen → Tab nach 1-5 Min wieder oeffnen.
- [ ] App im Incognito/Private Mode testen.
- [ ] Mehrere Tabs offen, in einem Tab sign-out/sign-in.
- [ ] Mit/ohne bestehender Session (sessionStorage leer vs. voll).

---

## Technische Hinweise / Hotspots

| Stelle | Datei | Risiko |
|---|---|---|
| LocalStorage Migration | `src/utils/localStorage-migration.js` | unguarded storage access beim Boot |
| Supabase Client | `src/services/supabase.ts` | sessionStorage direkt in createClient |
| Auth Restore | `src/contexts/auth-context.jsx` | getSession timeout, onAuthStateChange async |
| Calendar Restore | `src/contexts/calendar-context.jsx` | Object.values(blocksByDate).flat() ohne guard |
| Month View | `src/features/calendar/components/calendar-view.jsx` | learningBlocks.filter ohne guard |
| Tasks Sync | `src/hooks/use-supabase-sync.js` | linked_slot_id vs linked_block_id |
| Private Sessions Sync | `src/hooks/use-supabase-sync.js` | block_date vs session_date |

---

## Fix-Strategie (Vorschlag)

### 1) Safe Storage Wrapper
- Utility fuer `safeLocalStorage`/`safeSessionStorage` mit try/catch.
- Fallback auf in-memory storage, wenn Storage blocked.

### 2) Supabase Auth Storage Guard
- `createClient` mit safe storage injizieren.
- Bei Fehler: fallback auf in-memory storage + warn log.

### 3) Defensive Guards beim Restore
- Bei allen `.map/.filter/.forEach/Object.entries` guards setzen.
- `learningBlocks || []` im MonthView.

### 4) Schema-Alignment (Supabase)
- `calendar_tasks`: `linked_slot_id` → `linked_block_id` (Read + Write).
- `private_sessions`: `block_date` → `session_date` (Read + Write + Delete).
- `calendar_blocks`: `slot_date` → `block_date` (Read + Write + Delete).
- Konsistenten Alias im Frontend halten (z.B. `linkedBlockId`).

### 5) Minimal Logging
- Nur dev: logge Storage availability, auth restore errors, getSession timing.

---

## Offene Fragen
- Tritt der Crash eher sofort beim Refresh auf oder nach Tab Suspend?
- Browser/OS? Private Mode aktiv?
- Welche Fehlermeldung zeigt die Konsole?

---

## Akzeptanzkriterien
- [ ] Kein Crash bei Hard Refresh.
- [ ] Kein Crash bei Tabwechsel (inkl. Tab suspend/restore).
- [ ] Supabase Auth Restore stabil, auch bei fehlendem/korruptem Token.
- [ ] Keine TypeErrors durch undefined State.
- [ ] Keine 400er durch Schema-Mismatch (calendar_blocks/calendar_tasks/private_sessions).

---

## Notizen
- In `docs/tickets15.md` ist Bug 2c bereits dokumentiert; T17 fokussiert auf Supabase/Storage-Risiken und die Crash-Symptome bei Tabwechsel/Refresh.

---

## Konkrete Aenderungen (Vorschlag)

### A) calendar_blocks auf `block_date` vereinheitlichen
**Ziel:** keine Mischverwendung von `slot_date` und `block_date`.

**Aktuelle Stellen (mismatch):**
- `src/hooks/use-supabase-sync.js:998` → `row.slot_date` (Read)
- `src/hooks/use-supabase-sync.js:1156` → `.eq('slot_date', dateKey)` (Delete)
- `src/hooks/use-supabase-sync.js:1169` → `slot_date: dateKey` (Insert)

**Vorschlag (Code):**
- Read: `const dateKey = row.block_date ?? row.slot_date;`
- Delete: `.eq('block_date', dateKey)`
- Insert: `block_date: dateKey`

**Bonus (Migration Safety):**
- Solange alte Daten existieren, read‑Fallback (`block_date ?? slot_date`) lassen.
- Write immer nur `block_date`.

### B) calendar_tasks Alias sauber halten
**Ziel:** Frontend benutzt nur `linkedBlockId`, aber alte Daten bleiben lesbar.

**Vorschlag (Code):**
- Read: `linkedBlockId: row.linked_block_id ?? row.linked_slot_id`
- Write: `linked_block_id: task.linkedBlockId ?? task.linkedSlotId ?? null`
- Optional: `linkedSlotId` in App‑State perspektivisch entfernen.

### C) private_sessions nur `session_date`
**Ziel:** Konsistenz im Sync.

**Vorschlag (Code):**
- Migration: `session_date` in allen Insert/Delete/Filter Pfaden.
- Read bleibt `row.session_date`.

---

## Offene Punkte / Risiken
- DB‑Schema muss die Spalten bereits haben (`block_date`, `linked_block_id`, `session_date`).
- Falls produktiv noch alte Spalten genutzt werden: Read‑Fallback behalten, Write aber auf neue Spalten.

---

## Schwaechen der Fixes (mit neuen Aenderungen)

### 1) Schema-Fixes loesen den Tabwechsel-Crash nicht direkt
Die neuen Spalten-Fixes verhindern 400er und Sync-Ausfaelle,
aber sie adressieren **nicht** die Resume/Visibility-Probleme beim Tabwechsel.
Ein Crash beim Zurueckkehren ist weiter moeglich, wenn Contexts auf `undefined` treffen.

### 2) Guards sind nicht flaeckendeckend
Einzelne Hotspots sind geschuetzt, aber es gibt weiterhin direkte Aufrufe wie
`.map/.filter/.forEach/Object.entries` in Restore-Pfaden.
Das macht den Crash selten, aber nicht ausgeschlossen.

### 3) Storage bleibt ein Single-Point-of-Failure
`localStorage`/`sessionStorage` werden immer noch direkt genutzt.
Wenn Storage beim Resume blockiert/inkonsistent ist, kann der Boot crashen
oder den Auth-State in einen falschen Zustand bringen.

### 4) Supabase Auth Restore bleibt race-anfaellig
`getSession()` und `onAuthStateChange()` feuern auch beim Tab-Resume.
Ohne "auth ready" Gate koennen Contexts vorzeitig rendern.

### 5) Hard Refresh ist nur Workaround
Dass Hard Refresh hilft, bestaetigt, dass der Resume-Pfad kaputt ist,
nicht dass das Problem behoben wurde.

---

## Was passiert beim Tabwechsel (Background/Resume)?

### Kurzfassung
- Tab geht in `hidden` → Browser drosselt Timers und Netzwerk.
- Manche Browser frieren den JS-State ein (BFCache).
- Beim Zurueckkehren laeuft der JS-State weiter, aber async Restores laufen parallel.

### Typischer Crash-Pfad
1. Tab geht in den Hintergrund → laufende Promises/Timings pausieren.
2. Tab kommt zurueck → Auth/Storage wird gelesen, Contexts rendern parallel.
3. Teilwerte fehlen (`undefined`), ein `.map/.filter` knallt → Crash.
4. Hard Refresh baut State sauber neu auf → App laeuft wieder.

---

## Wie stellt man sicher, dass ein Programm im Hintergrund laeuft?

### Wichtig: Im Browser gibt es keine Garantie
Man kann **nicht** garantieren, dass ein Tab dauerhaft laeuft.
Browser drosseln oder pausieren Hintergrundtabs.

### Was man stattdessen tun kann
1. **Visibility-Aware Sync**
   - Bei `document.hidden` Sync pausieren, bei `visible` kontrolliert neu laden.
2. **Resilient Restore**
   - Beim Resume alle kritischen States validieren (z.B. `Array.isArray`),
     bei Fehlern re-fetch aus Supabase.
3. **Safe Storage**
   - Storage-Zugriffe mit try/catch und Fallback (in-memory).
4. **Auth Ready Gate**
   - UI erst rendern, wenn Auth + Storage stabil sind.
5. **Service Worker (optional)**
   - Fuer Hintergrundaufgaben nur begrenzt geeignet (Push/Sync), nicht fuer UI-State.

---

## Crashlog-Analyse (2026-01-14)

### Bestaetigt: Schema-Mismatch verursacht 400 Errors

**Konkrete Zeilen in `use-supabase-sync.js`:**

| Problem | Zeilen | Falsch | Richtig (DB) |
|---------|--------|--------|--------------|
| private_sessions | 1048, 1083, 1559, 1612, 1624, 1689, 1701 | `block_date` | `session_date` |
| calendar_tasks | 1369, 1422 | `linked_slot_id` | `linked_block_id` |

**Request-URLs aus Crashlog:**
```
private_sessions?columns=..."block_date"...  → 400 Bad Request
calendar_tasks?columns=..."linked_slot_id"... → 400 Bad Request
```

### Neues Problem: Context Provider Crash bei HMR

**Error:**
```
Uncaught Error: useMentor must be used within a MentorProvider
    at useMentor (mentor-context.jsx:102:11)
    at CheckInProvider (checkin-context.jsx:168:46)
```

**Ursache:**
- `CheckInProvider` (Zeile 168) ruft `useMentor()` auf
- Bei Hot Module Reload wird `MentorContext` neu erstellt
- `CheckInProvider` referenziert noch den alten Context → `null` → Error

**Fix:** Defensive Guard in `useMentor()` oder Context-Referenz stabilisieren.

### Auth Timeout bestaetigt

```
[AuthContext] getSession() timed out, clearing session storage and continuing
```

Der `noOpLock` Workaround in `supabase.ts` ist vorhanden, aber Auth Restore haengt trotzdem gelegentlich.

---

## Priorisierter Fix-Plan

| Prio | Fix | Aufwand | Datei | Status |
|------|-----|---------|-------|--------|
| **P0** | `block_date` → `session_date` (private_sessions) | 10 min | use-supabase-sync.js | ✅ DONE |
| **P0** | `linked_slot_id` → `linked_block_id` (calendar_tasks) | 5 min | use-supabase-sync.js | ✅ DONE |
| **P0** | `slot_date` → `block_date` (calendar_blocks) | 5 min | use-supabase-sync.js | ✅ DONE |
| **P1** | Defensive Guard fuer HMR in useMentor | 5 min | mentor-context.jsx | ✅ DONE |
| **P1** | Tab-Visibility-Guard fuer Loading-State | 10 min | auth-context.jsx | ✅ DONE (verbessert) |
| **P1** | Unnoetige Approval-Checks verhindern | 5 min | auth-context.jsx | ✅ DONE |
| **P2** | Safe Storage Wrapper | 15 min | safe-storage.ts, supabase.ts, localStorage-migration.js | ✅ DONE |
| **P3** | Null-ID Bug bei calendar_tasks Insert | 5 min | use-supabase-sync.js | ✅ DONE |
| **P3** | Priority Check Constraint Validierung | 5 min | use-supabase-sync.js | ✅ DONE |

---

## Umgesetzte Fixes (2026-01-14)

### Fix 1: Schema-Alignment private_sessions (P0)

**Datei:** `src/hooks/use-supabase-sync.js`

`block_date` → `session_date` an 5 Stellen:
- Zeile 1559: Migration Insert
- Zeile 1612: Delete Query (`.eq('session_date', dateKey)`)
- Zeile 1624: saveDayBlocks Insert
- Zeile 1689: Batch Delete Query
- Zeile 1701: Batch Insert

**Kommentar im Code:** `// T17 FIX: was block_date`

### Fix 2: Schema-Alignment calendar_tasks (P0)

**Datei:** `src/hooks/use-supabase-sync.js`

`linked_slot_id` → `linked_block_id` an 2 Stellen:
- Zeile 1369: Migration Insert
- Zeile 1422: saveDayTasks Insert

**Kommentar im Code:** `// T17 FIX: was linked_slot_id`

### Fix 3: Schema-Alignment calendar_blocks (P0)

**Datei:** `src/hooks/use-supabase-sync.js`

`slot_date` → `block_date` an 3 Stellen:
- Zeile 998: Read Transform (mit Fallback `row.block_date ?? row.slot_date`)
- Zeile 1156: Delete Query (`.eq('block_date', dateKey)`)
- Zeile 1169: Insert (`block_date: dateKey`)

**Kommentar im Code:** `// T17 FIX: was slot_date`

### Fix 4: HMR-Guard fuer useMentor (P1)

**Datei:** `src/contexts/mentor-context.jsx`

```javascript
export const useMentor = () => {
  const context = useContext(MentorContext);
  if (!context) {
    // During HMR, context can be null temporarily - return safe defaults
    if (import.meta.hot) {
      console.warn('[useMentor] Context unavailable during HMR, returning defaults');
      return {
        isActivated: false,
        activatedAt: null,
        activateMentor: () => {},
        deactivateMentor: () => {},
        loading: true,
      };
    }
    throw new Error('useMentor must be used within a MentorProvider');
  }
  return context;
};
```

**Effekt:** Bei HMR wird statt Crash ein sicherer Default-State zurueckgegeben.

### Fix 5: Tab-Visibility-Guard (P1) - VERBESSERT

**Datei:** `src/contexts/auth-context.jsx`

**Problem:** App bleibt im Loading-State stecken nach Tab-Wechsel (Spinner-Loop).

**Ursache:** `getSession()` oder Token-Refresh haengt, wenn Tab aus Hintergrund zurueckkehrt.

**Urspruengliche Loesung (hatte Bugs):**
- Cleanup-Funktion wurde aus falscher Funktion zurueckgegeben
- Nur `loading` wurde geprueft, nicht `approvalLoading`
- `loading`-Wert in Timeout war veraltet (Closure)

**Verbesserte Loesung:**
```javascript
// T17 FIX: Use ref to track timeout and properly clean up
const visibilityTimeoutRef = useRef(null);

useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Clear any existing timeout
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }

      // Only set timeout if either loading state is true
      if (loading || approvalLoading) {
        console.log('[AuthContext] Tab became visible while loading, setting safety timeout');
        visibilityTimeoutRef.current = setTimeout(() => {
          // Check current values via functional updates
          setLoading(prev => {
            if (prev) {
              console.warn('[AuthContext] Loading stuck after tab return, forcing loading=false');
            }
            return false;
          });
          setApprovalLoading(prev => {
            if (prev) {
              console.warn('[AuthContext] ApprovalLoading stuck after tab return, forcing approvalLoading=false');
            }
            return false;
          });
        }, 2000);
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (visibilityTimeoutRef.current) {
      clearTimeout(visibilityTimeoutRef.current);
    }
  };
}, [loading, approvalLoading]);
```

**Effekt:**
- Sauberes Cleanup des Timeouts
- Beide Loading-States werden geprueft und zurueckgesetzt
- Functional Updates stellen sicher, dass aktuelle Werte verwendet werden

### Fix 6: Unnoetige Approval-Checks verhindern (P1)

**Datei:** `src/contexts/auth-context.jsx`

**Problem:** Bei Tab-Rueckkehr feuert Supabase `onAuthStateChange` mit `TOKEN_REFRESHED` oder `SIGNED_IN` Event. Dies loest `checkApprovalStatus()` aus, welches `approvalLoading=true` setzt → Spinner erscheint.

**Loesung:**
1. Ref hinzugefuegt um aktuellen Approval-Status zu tracken:
```javascript
const isApprovedRef = useRef(null);

useEffect(() => {
  isApprovedRef.current = isApproved;
}, [isApproved]);
```

2. In `onAuthStateChange` wird Approval-Check uebersprungen wenn bereits approved:
```javascript
const skipApprovalCheck = _event === 'TOKEN_REFRESHED' ||
                          _event === 'INITIAL_SESSION' ||
                          isApprovedRef.current === true;

if (_event === 'SIGNED_IN' && session?.user?.id) {
  // ...
  if (!skipApprovalCheck) {
    await checkApprovalStatus(session.user.id);
  }
}
```

**Effekt:** Wenn User bereits approved ist, wird kein erneuter Approval-Check durchgefuehrt bei Tab-Rueckkehr → Kein Spinner.

### Fix 7: Safe Storage Wrapper (P2)

**Neue Datei:** `src/utils/safe-storage.ts`

**Problem:** Direkte Nutzung von `localStorage`/`sessionStorage` kann crashen wenn:
- Browser im Private Mode ist
- Storage-Quota erschoepft
- Browser-Policy Storage blockiert
- Tab im Hintergrund (suspend/BFCache)

**Loesung:**
1. Neue Utility-Datei `safe-storage.ts` erstellt mit:
   - `safeLocalStorage` - sicherer localStorage-Wrapper
   - `safeSessionStorage` - sicherer sessionStorage-Wrapper
   - In-memory Fallback (`MemoryStorage` Klasse)
   - Alle Operationen mit try/catch umschlossen

2. `supabase.ts` aktualisiert:
   - `storage: safeSessionStorage` statt `storage: sessionStorage`

3. `localStorage-migration.js` aktualisiert:
   - Alle `localStorage`-Aufrufe durch `safeLocalStorage` ersetzt

**Code-Auszug (safe-storage.ts):**
```typescript
class MemoryStorage implements Storage {
  private data: Map<string, string> = new Map();
  // ... Storage interface implementation
}

function createSafeStorage(storageType: 'localStorage' | 'sessionStorage'): Storage {
  // Try native storage, fallback to MemoryStorage on error
  // All operations wrapped in try/catch
}

export const safeLocalStorage = createSafeStorage('localStorage');
export const safeSessionStorage = createSafeStorage('sessionStorage');
```

**Effekt:**
- App crasht nicht mehr wenn Storage blockiert ist
- Automatischer Fallback auf in-memory storage
- Warnung im Console bei Storage-Problemen
- Keine Code-Aenderungen in Consumer-Dateien noetig (gleiche API)

### Fix 8: Null-ID Bug bei calendar_tasks Insert (P3)

**Datei:** `src/hooks/use-supabase-sync.js`

**Problem:** Beim Erstellen neuer Tasks und Drag&Drop in Sessions:
```
null value in column "id" of relation "calendar_tasks" violates not-null constraint
```

**Ursache:** Die Logik zum Filtern lokaler IDs war fehlerhaft:
```javascript
// VORHER (fehlerhaft):
id: task.id?.startsWith('task-') || task.id?.startsWith('local-') ? undefined : task.id,
```

Wenn `task.id` `null` ist:
- `null?.startsWith('task-')` → `undefined` (falsy)
- Ternary-Condition ist falsy → gibt `task.id` zurueck, also `null`
- `{ id: null }` wird an Supabase gesendet → NOT NULL Constraint Verletzung

**Loesung:**
```javascript
// NACHHER (korrekt):
const isValidId = task.id &&
  !task.id.startsWith('task-') &&
  !task.id.startsWith('local-');

return {
  ...(isValidId && { id: task.id }),
  // ... andere Felder
};
```

**Erklaerung:**
- `isValidId` ist `false` wenn `task.id` null/undefined ist
- Spread-Operator `...(isValidId && { id: task.id })` fuegt `id` nur hinzu wenn es ein gueltiges UUID ist
- Bei neuen Tasks wird kein `id`-Feld gesendet → Supabase generiert automatisch UUID

**Effekt:**
- Neue Tasks koennen ohne Fehler erstellt werden
- Bestehende Tasks mit gueltigem UUID behalten ihre ID
- Lokale IDs (`task-...`, `local-...`) werden nicht an die DB gesendet

### Fix 9: Priority Check Constraint Validierung (P3)

**Datei:** `src/hooks/use-supabase-sync.js`

**Problem:** Beim Speichern von Tasks:
```
new row for relation "calendar_tasks" violates check constraint "calendar_tasks_priority_check"
```

**Ursache:** Die DB erlaubt nur `'low'`, `'medium'`, `'high'` als Priority-Werte. Der Code verwendete:
```javascript
priority: task.priority || 'medium'
```
Das laesst ungueltige Werte wie `'normal'`, `'wichtig'`, etc. durch, weil nur falsy Werte (`null`, `undefined`, `''`) ersetzt werden.

**Loesung:**
```javascript
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const validPriority = VALID_PRIORITIES.includes(task.priority) ? task.priority : 'medium';
```

**Geaenderte Stellen:**
- Migration (Zeile 1360-1364)
- saveDayTasks (Zeile 1414, 1421-1422)

**Effekt:**
- Ungueltige Priority-Werte werden automatisch auf `'medium'` korrigiert
- Keine Check Constraint Verletzungen mehr

---

## Alle T17-Fixes abgeschlossen

T17 ist vollstaendig umgesetzt. Die App sollte jetzt:
- Keine 400er durch Schema-Mismatch mehr haben
- Bei Tab-Wechsel stabil bleiben (kein Spinner-Loop)
- Bei blockiertem Storage nicht crashen
- Bei HMR keine Context-Fehler werfen
- Keine NOT NULL Constraint Fehler bei Task-Erstellung
- Keine Check Constraint Fehler bei Priority-Werten

---

## Implementierungsplan: Verbleibende T15-Bugs

### Bug-Uebersicht

| ID | Bug | Status | Prio |
|----|-----|--------|------|
| 1a | Themenliste: Eingabe nur 1 Zeichen ab 2. Rechtsgebiet | OFFEN | Hoch |
| 2a | Monatsansicht-Block nicht in Wochenansicht | OFFEN | Hoch |
| 2b | Falscher Dialog beim Block-Klick | OFFEN | Mittel |
| FR2 | Dritte Toggle-Position fuer Bloecke | OFFEN | Niedrig |

---

### Bug 1a: Themenliste Input-Problem

**Symptom:** Ab dem zweiten Rechtsgebiet kann man keine Aufgaben laenger als 1 Zeichen eingeben.

**Root Cause (analysiert):**
1. `ThemeListUnterrechtsgebietRow` (Zeile 365) ist **NICHT memoized** (`React.memo`)
2. Jeder Aufruf von `onUpdateAufgabe` loest ein State-Update im Parent (`SessionWidget`) aus
3. Parent re-rendert → alle `ThemeListUnterrechtsgebietRow`-Instanzen werden neu erstellt
4. `ThemeListThemaRow` hat lokalen State (`editingAufgabeId`, `editingTitle`)
5. Bei Re-Mount wird dieser State zurueckgesetzt → Input verliert Focus und Inhalt

**Fix-Strategie:**

| Schritt | Datei:Zeile | Aenderung |
|---------|-------------|-----------|
| 1 | `session-widget.jsx:365` | `ThemeListUnterrechtsgebietRow` mit `React.memo()` wrappen |
| 2 | `session-widget.jsx:540` | `ThemeListThemaRow` mit `React.memo()` wrappen |
| 3 | `session-widget.jsx` | Alle callback Props (`onToggleAufgabe`, `onAddAufgabe`, etc.) mit `useCallback` stabilisieren |
| 4 | Test | Aufgaben im 2. und 3. Rechtsgebiet eingeben |

**Code-Beispiel:**

```javascript
// VORHER (Zeile 365):
const ThemeListUnterrechtsgebietRow = ({
  unterrechtsgebiet,
  // ...
}) => {
  // ...
};

// NACHHER:
const ThemeListUnterrechtsgebietRow = memo(function ThemeListUnterrechtsgebietRow({
  unterrechtsgebiet,
  // ...
}) {
  // ...
});
```

**Wichtig:** Die Callbacks im Parent (`ThemeListView`) muessen mit `useCallback` stabilisiert werden:

```javascript
// In ThemeListView (ab Zeile 850):
const handleToggleAufgabe = useCallback((unterrechtsgebietId, kapitelId, themaId, aufgabeId, rgId) => {
  // ... bestehende Logik
}, [toggleAufgabeInPlan]); // stable dependency
```

---

### Bug 2a: Monatsansicht-Block nicht in Wochenansicht

**Symptom:** Block in Monatsansicht erstellt erscheint nicht in Wochenansicht.

**Root Cause (analysiert):**
- **Monatsansicht** speichert in `calendar_blocks` via `blocksByDate`
- **Wochenansicht** liest aus `time_sessions` via `timeBlocksByDate`
- Das sind **zwei separate Tabellen** ohne automatische Synchronisation!

| Ansicht | Datenquelle | Supabase-Tabelle | Felder |
|---------|-------------|------------------|--------|
| Monat | `blocksByDate` | `calendar_blocks` | `block_date`, `kind`, `size (1-4)` |
| Woche | `timeBlocksByDate` | `time_sessions` | `session_date`, `start_at`, `end_at` |

**Fix-Optionen:**

**Option A: Beim Erstellen in Monatsansicht auch TimeSession anlegen (empfohlen)**

| Schritt | Datei:Zeile | Aenderung |
|---------|-------------|-----------|
| 1 | `calendar-view.jsx:213` | Nach `updateContextDayBlocks()` auch `addTimeBlock()` aufrufen |
| 2 | `calendar-context.jsx` | Mapping-Funktion `blockToTimeSession()` hinzufuegen |
| 3 | Test | Block in Monat erstellen → in Woche pruefen |

**Code-Beispiel:**

```javascript
// In calendar-view.jsx, nach Zeile 216:
const handleAddBlock = async (block) => {
  // Bestehend: In calendar_blocks speichern
  await updateContextDayBlocks(formatDateKey(date), updatedBlocks);

  // NEU: Auch time_session anlegen
  const timeSession = {
    id: block.id || `timeblock-${Date.now()}`,
    date: formatDateKey(date),
    startTime: getDefaultStartTime(block.position), // z.B. 08:00 fuer Position 1
    endTime: getDefaultEndTime(block.position),     // z.B. 10:00 fuer Position 1
    kind: block.kind,
    title: block.title,
    contentId: block.contentId,
    linkedBlockId: block.id, // Referenz zum calendar_block
  };
  await addTimeBlock(formatDateKey(date), timeSession);
};
```

**Option B: Einheitliches Datenmodell (aufwaendiger)**
- Nur `time_sessions` verwenden
- Monatsansicht aggregiert aus `time_sessions`
- Groesserer Umbau, mehr Risiko

**Empfehlung:** Option A - minimal invasiv, schnell umsetzbar.

---

### Bug 2b: Falscher Dialog beim Block-Klick

**Symptom:** Klick auf Block in Monatsansicht oeffnet DayManagementDialog statt ManageThemeSessionDialog.

**Root Cause (analysiert):**
1. `LearningSession` (Zeile 93-99) hat bereits `handleClick` mit `e.stopPropagation()`
2. **ABER:** `CalendarGrid` akzeptiert kein `onBlockClick` Prop
3. Daher wird `onClick` nie an `LearningSession` weitergegeben
4. Event bubbelt zu `DayTile.onClick` → DayManagementDialog oeffnet

**Fix-Strategie:**

| Schritt | Datei:Zeile | Aenderung |
|---------|-------------|-----------|
| 1 | `calendar-grid.jsx:17` | `onBlockClick` Prop hinzufuegen |
| 2 | `calendar-grid.jsx:~60` | `onBlockClick` an `DayTile` weitergeben |
| 3 | `calendar-view.jsx:438-443` | `onBlockClick={handleBlockClick}` an CalendarGrid |
| 4 | `calendar-view.jsx` | `handleBlockClick` Funktion implementieren |
| 5 | Test | Auf Block in Monat klicken → ManageThemeSessionDialog |

**Code-Aenderungen:**

**1. calendar-grid.jsx:**
```javascript
// Zeile 17:
const CalendarGrid = memo(function CalendarGrid({
  days = [],
  currentDay = null,
  onDayClick,
  onAddClick,
  onBlockClick,  // NEU
  className = ''
}) {

// Zeile ~60 (bei DayTile):
<DayTile
  // ... bestehende props
  onBlockClick={onBlockClick}  // NEU
/>
```

**2. calendar-view.jsx:**
```javascript
// Neue Funktion (vor return):
const handleBlockClick = useCallback((block) => {
  // Block-Dialog oeffnen statt Day-Dialog
  setSelectedBlock(block);
  setIsBlockDialogOpen(true);
}, []);

// In CalendarGrid (Zeile 438):
<CalendarGrid
  days={generateCalendarDays()}
  currentDay={isCurrentMonth ? today : null}
  onDayClick={handleDayClick}
  onAddClick={handleAddClick}
  onBlockClick={handleBlockClick}  // NEU
/>
```

**3. State und Dialog hinzufuegen:**
```javascript
// State:
const [selectedBlock, setSelectedBlock] = useState(null);
const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);

// Dialog (nach DayManagementDialog):
<ManageThemeSessionDialog
  open={isBlockDialogOpen}
  onOpenChange={setIsBlockDialogOpen}
  block={selectedBlock}
  // ... weitere Props
/>
```

---

### FR2: Dritte Toggle-Position fuer Bloecke (Optional)

**Wunsch:** Toggle im linken Bereich soll eine dritte Position haben: "Bloecke"

**Aktueller Zustand:**
- Toggle hat 2 Positionen: `todos` | `themenliste`
- Position gespeichert in `leftPanelView` State

**Implementierung:**

| Schritt | Datei | Aenderung |
|---------|-------|-----------|
| 1 | `session-widget.jsx` | Toggle auf 3 Positionen erweitern: `todos` | `themenliste` | `bloecke` |
| 2 | `session-widget.jsx` | Neue View-Komponente `BlocksListView` hinzufuegen |
| 3 | `dashboard.jsx` | Tages-Bloecke an SessionWidget uebergeben |
| 4 | `session-widget.jsx` | Nur Bloecke fuer aktuelles Datum anzeigen |

**Hinweis:** Dieses Feature hat niedrigere Prioritaet als die Bug-Fixes.

---

### Zusammenfassung: Reihenfolge der Umsetzung

| Prio | Bug/Feature | Aufwand | Risiko |
|------|-------------|---------|--------|
| 1 | Bug 1a (Memoization) | 30 min | Niedrig |
| 2 | Bug 2b (Block-Klick Dialog) | 20 min | Niedrig |
| 3 | Bug 2a (Monat→Woche Sync) | 45 min | Mittel |
| 4 | FR2 (Toggle 3 Positionen) | 60 min | Niedrig |

**Empfehlung:** Bug 1a zuerst, da es die taegliche Nutzung am meisten beeintraechtigt.
