# T12: Supabase Sync Fehler (ERR_INSUFFICIENT_RESOURCES + enum app_mode)

## Status: ✅ BEHOBEN (2026-01-13)

**Commits:**
- `415d11e` - useRef für Transform-Funktionen
- `94e88dd` - `id-` Prefix Filter für lokale IDs
- `ba60e32` - Enum-Mapping + Dependency-Array-Fix

---

## Ueberblick

**Ziel:** Analyse der Browser-Fehler bei Supabase Requests (content_plans / published_themenlisten).

**Fehlerauszug (gekuerzt):**
- `POST .../content_plans?select=* net::ERR_INSUFFICIENT_RESOURCES`
- `GET .../content_plans?select=id&limit=1 net::ERR_INSUFFICIENT_RESOURCES`
- `GET .../published_themenlisten?select=id&limit=1 net::ERR_INSUFFICIENT_RESOURCES`
- `TypeError: Failed to fetch` beim Speichern/Lesen
- `400 (Bad Request) invalid input value for enum app_mode: "examen"`

---

## Fehlerbild / Symptome

1. **Request-Sturm**: viele wiederholte GET/POSTs in kurzer Zeit auf die gleichen Endpunkte. ✅ BEHOBEN
2. **Browser bricht Requests ab**: `net::ERR_INSUFFICIENT_RESOURCES` weist auf Ressourcenmangel (zu viele parallele Requests / zu viele offene Verbindungen / Memory) hin. ✅ BEHOBEN
3. **Supabase Insert/Update wird abgelehnt**: `invalid input value for enum app_mode: "examen"` zeigt ein falsches Enum-Value. ✅ BEHOBEN
4. **Folgen**: Content Plans werden nicht gespeichert/geladen, Published Themenlisten nicht geladen.

---

## Erste Einordnung (wahrscheinliche Ursachen)

### A) Request-Flut / Retry-Loop (hohe Wahrscheinlichkeit) ✅ BEHOBEN
- `useSupabaseSync` triggert Refresh/Sync bei Auth-State und Storage-Updates.
- Bei Netzwerkfehlern scheint kein Backoff/Throttle aktiv zu sein -> erneute Versuche erzeugen schnell viele Requests.
- Wiederholte `GET ...select=id&limit=1` deuten auf Health-Checks oder Initial-Sync in mehreren Hooks parallel.

**Risiko:** Browser erreicht Limit fuer parallele Requests -> `ERR_INSUFFICIENT_RESOURCES`.

**Ursache gefunden:** Drei Probleme verursachten den Infinite Loop:
1. **Inline Arrow Functions** in `transformToSupabase`/`transformFromSupabase` → neue Referenzen bei jedem Render → useCallback neu erstellt → useEffect neu getriggert
2. **`defaultValue` als `[]`** im Dependency-Array → neues Array bei jedem Render
3. **`user` Objekt** statt `user?.id` → Objekt-Referenz ändert sich auch wenn User gleich bleibt

**Fix:** `useRef` für Transform-Funktionen, `defaultValue` aus Dependencies entfernt, `user?.id` statt `user`

### B) App-Mode Mapping fuer Supabase (sicherer Fehler) ✅ BEHOBEN
- Der Enum-Fehler `app_mode: "examen"` zeigt, dass irgendwo ein ungefilterter Wert an die DB geht.
- `useContentPlansSync` mappt zwar `examen` -> `exam`, aber der Fehler zeigt: mindestens ein Pfad nutzt dieses Mapping nicht (oder nutzt ein anderes Feld wie `app_mode`).

**Ursache gefunden:** Das Mapping fehlte komplett. Die App verwendet `'examen'` (Deutsch), die DB-Enum ist `('standard', 'exam')` (Englisch).

**Fix:** Mapping hinzugefügt in `transformToSupabase` und `transformFromSupabase`:
```javascript
// transformToSupabase
const dbMode = plan.mode === 'examen' ? 'exam' : (plan.mode || 'standard');

// transformFromSupabase
mode: row.mode === 'exam' ? 'examen' : row.mode,
```

---

## Betroffene Bereiche (Code-Hinweise)

- `src/hooks/use-supabase-sync.js` ✅ GEFIXT
  - Mehrere Sync-Hooks aktiv (content_plans + published_themenlisten).
  - ~~Keine erkennbare Backoff-Strategie bei `fetch`-Fehlern.~~ (War nicht die Ursache)
- `src/contexts/calendar-context.jsx`
  - Mehrere Stellen speichern Content Plans und triggern Supabase Writes.
- Fehlerlog verweist auf gebundelte Dateien (`vendor-supabase-*.js`, `index-*.js`) -> Ursache liegt im Sync/Save Pfad.

---

## Hypothesen fuer Reproduktion

1. ~~App laeuft im Hintergrund oder ist offline / instabile Verbindung.~~ (Nicht die Ursache)
2. ~~Mehrere Sync-Hooks starten gleichzeitig (content_plans + published_themenlisten).~~ (Teilweise - aber Hauptproblem war Dependency-Array)
3. ~~Fehler bei Insert (enum app_mode) fuehrt zu Retry-Loop.~~ (Kein Retry-Loop, sondern Infinite Re-Render)
4. Browser erreicht Request-Limit -> `ERR_INSUFFICIENT_RESOURCES`. ✅ KORREKT

**Tatsächliche Ursache:** React useEffect-Dependency-Array hatte instabile Referenzen (inline functions, `[]`, `user` object), was bei jedem Render den Effect neu triggerte → Infinite Loop.

---

## Auswirkungen

- **Datenverlust-Risiko:** Content Plans werden lokal geaendert, aber nicht gespeichert. ✅ BEHOBEN
- **UI-Instabilitaet:** wiederholte Fehler -> Performance Einbruch. ✅ BEHOBEN
- **Supabase-Quota / Rate-Limits:** moegliche Belastung durch Request-Flut. ✅ BEHOBEN

---

## Empfohlene Debug-Schritte

1. ~~**Netzwerkprofil pruefen:** sind viele Requests pro Sekunde? Gibt es parallele Sync-Hooks?~~ ✅ ERLEDIGT
2. ~~**Guard gegen Retry-Loop:** Logging einbauen fuer `saveItem` / `refresh` / `syncToSupabase`.~~ (War kein Retry-Loop)
3. ~~**Backoff / Circuit Breaker:** bei `TypeError: Failed to fetch` Pausen oder Stop fuer X Sekunden.~~ (Nicht nötig - Root Cause war React)
4. ~~**Enum-Mapping pruefen:** sicherstellen, dass *alle* Insert/Update-Pfade `examen` -> `exam` mappen und korrekte Spalte nutzen (`mode` vs `app_mode`).~~ ✅ ERLEDIGT
5. **Offline-Handling:** bei `navigator.onLine === false` keine Sync-Versuche starten. (Nice-to-have, nicht kritisch)

---

## Offene Fragen (BEANTWORTET)

1. ~~Welche Aktion im UI loest den Storm aus (Login, Editieren, Auto-Save)?~~ **Antwort:** Jeder Re-Render der Komponente die `useContentPlansSync()` nutzt.
2. ~~Gibt es parallele Sync-Hooks im selben Screen?~~ **Antwort:** Ja, aber das war nicht das Hauptproblem.
3. ~~Wird irgendwo direkt `app_mode` gesendet statt `mode`?~~ **Antwort:** Nein, das Feld heißt `mode`, aber der Wert `'examen'` wurde nicht auf `'exam'` gemappt.

---

## Durchgeführte Fixes

### Fix 1: Transform-Funktionen stabilisieren (Commit `415d11e`)
```javascript
// Vorher: inline functions in useCallback dependencies → neue Referenz bei jedem Render
}, [transformFromSupabase, transformToSupabase, ...]);

// Nachher: useRef für stabile Referenzen
const transformToSupabaseRef = useRef(transformToSupabase);
const transformFromSupabaseRef = useRef(transformFromSupabase);
transformToSupabaseRef.current = transformToSupabase; // Update ohne Re-Render
```

### Fix 2: Local ID Filter erweitern (Commit `94e88dd`)
```javascript
// Vorher: nur 'local-' prefix
id: plan.id?.startsWith('local-') ? undefined : plan.id

// Nachher: auch 'id-' prefix (z.B. 'id-1768220580558-g2pefq7nc')
const isLocalId = !plan.id || plan.id.startsWith('local-') || plan.id.startsWith('id-');
```

### Fix 3: Enum-Mapping + Dependency-Array (Commit `ba60e32`)
```javascript
// Enum-Mapping
const dbMode = plan.mode === 'examen' ? 'exam' : (plan.mode || 'standard');
mode: row.mode === 'exam' ? 'examen' : row.mode;

// Dependency-Array stabilisiert
}, [isSupabaseEnabled, isAuthenticated, fetchFromSupabase, syncToSupabase, storageKey, tableName, user?.id]);
// Entfernt: defaultValue (neues [] bei jedem Render), user (Objekt statt primitiv)
```

### Fix 4: Batch-Sync statt One-by-One (2026-01-13)
```javascript
// Vorher: 412 einzelne Requests (langsam)
for (const item of localOnlyItems) {
  await supabase.from(tableName).upsert({...});
}

// Nachher: 1 Batch-Request (schnell)
const itemsToSync = localOnlyItems.map(item => ({
  ...transformToSupabaseRef.current(item),
  user_id: user.id,
}));
await supabase.from(tableName).upsert(itemsToSync, { onConflict });
```

#### Analyse zu Fix 4 (Batch-Sync)

**Vorteile:**
- Drastische Reduktion der Request-Anzahl -> weniger `ERR_INSUFFICIENT_RESOURCES`.
- Deutlich schnellerer Sync bei vielen lokalen Items.

**Risiken / Schwachstellen:**
1. **Payload-Groesse:** Viele/large Items (z.B. grosse `rechtsgebiete` Arrays) koennen zu 413/Timeout fuehren. Dann faellt der gesamte Batch aus.
2. **All-or-Nothing Fehlerbild:** Ein fehlerhafter Datensatz (z.B. falsches Enum) laesst den gesamten Batch fehlschlagen -> kein Teil-Sync.
3. **onConflict muss korrekt sein:** Falscher Conflict-Key fuehrt zu Duplikaten oder unerwarteten Ueberschreibungen.
4. **RLS/Policy**: Eine einzelne Zeile, die RLS verletzt, kann den Batch blocken.
5. **Reihenfolge / Last-Write-Wins:** Bei doppelten IDs im Batch zaehlt nur die letzte Zeile.

**Empfehlung fuer Robustheit:** ✅ UMGESETZT
- ~~Batch groessenbasiert chunking (z.B. 100-300 Items pro Request).~~ ✅ `CHUNK_SIZE = 100`
- ~~Fehlerhandling pro Chunk + Fallback auf Einzel-Insert bei Fehler.~~ ✅ Implementiert
- ~~Logging fuer Payload-Groesse und Fehler-Details, um problematische Items zu identifizieren.~~ ✅ Detailliertes Logging

**Implementierter Code:**
```javascript
// Robust batch sync with chunking and fallback (T12 Fix 4)
const CHUNK_SIZE = 100;
const chunks = []; // Split into 100-item chunks

for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
  const chunk = chunks[chunkIndex];
  const { error: chunkError } = await supabase.from(tableName).upsert(chunk, { onConflict });

  if (chunkError) {
    // Fallback: try individual inserts for failed chunk
    for (const item of chunk) {
      const { error: itemError } = await supabase.from(tableName).upsert(item, { onConflict });
      if (itemError) {
        console.error(`[useSupabaseSync] Item failed:`, { id: item.id, error: itemError.message });
        failedItems.push({ id: item.id, error: itemError.message });
      } else {
        successCount++;
      }
    }
  } else {
    successCount += chunk.length;
  }
}

// Summary log
console.log(`[useSupabaseSync] Sync complete: ${successCount}/${totalItems} succeeded, ${failedItems.length} failed`);
```

#### Bezug zum "Daten weg nach Refresh"

**Vor dem Fix (typisches Problem):**
- Beim Refresh wurden lokale Daten geladen, dann Supabase-GET gemacht.
- Wenn Supabase leer war (weil Inserts fehlten oder nie ankamen), wurde der lokale State mit "leer" ueberschrieben und in LocalStorage gespeichert.
- Ergebnis: Daten wirkten geloescht, obwohl sie vorher lokal vorhanden waren.

**Warum Fix 4 hilft:**
- Local-only Items werden **vor** dem finalen State-Commit in Supabase upserted (jetzt batch/Chunk).
- Danach wird **merged**: `supabaseData + localOnlyItems`.
- Damit bleiben lokale Daten sichtbar, auch wenn Supabase noch hinterherhaengt.

**Zusammenspiel mit Fix 3:**
- Fix 3 stabilisiert die Effects, damit der Sync ueberhaupt durchlaeuft (kein Re-Render Loop).
- Fix 4 reduziert Requests, damit der Sync tatsaechlich erfolgreich abgeschlossen wird.

---

## Naechste Schritte (Vorschlag)

~~1. Logging aktivieren und den Trigger identifizieren.~~ ✅ ERLEDIGT
~~2. Mapping fuer app_mode zentralisieren und testen.~~ ✅ ERLEDIGT
~~3. Backoff / Debounce im Sync einbauen.~~ (Nicht mehr nötig)
~~4. Batch-Sync für lokale Items.~~ ✅ ERLEDIGT
~~5. Chunking + Fallback für robuste Batch-Syncs.~~ ✅ ERLEDIGT

**Verbleibend (optional):**
- Offline-Handling für bessere UX bei instabiler Verbindung
- Monitoring für Supabase-Fehler in Production
