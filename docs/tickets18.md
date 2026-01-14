# T18: Content Plan Duplikations-Bug

## Status: ✅ CODE-FIXES IMPLEMENTIERT (2026-01-14)

**Verbleibend:** SQL-Migration in Supabase ausführen

---

## Symptom

Der Lernplan "Examenvorbereitung" erscheint ca. 20 Mal in "Meine Lernpläne" (/themen). Bei jedem Login/Neustart scheint eine neue Kopie erstellt zu werden.

## Root Cause Analyse

### Das Problem

Die ID-Synchronisation zwischen localStorage und Supabase ist fehlerhaft:

```
ABLAUF:
1. User importiert Template → Plan mit id: "id-12345" (generateId())
2. localStorage speichert: { id: "id-12345", importedFrom: "examen-vollstaendig", ... }
3. saveContentPlanToSupabase() wird aufgerufen (async)
4. transformToSupabase(): id.startsWith('id-') → id: undefined
5. Supabase INSERT statt UPSERT → generiert UUID: "uuid-aaaaa"
6. Response wird NICHT zurück zum localStorage geschrieben!

NÄCHSTER LOGIN:
7. localStorage hat: id: "id-12345"
8. Supabase hat: id: "uuid-aaaaa" (UNTERSCHIEDLICH!)
9. localData.filter(item => !supabaseIds.has(item.id)) findet "id-12345" nicht in Supabase
10. Also wird "id-12345" als "localOnlyItem" behandelt
11. WIEDER transformiert: id: undefined → NEUER INSERT: "uuid-bbbbb"
12. Merge: ["uuid-aaaaa", "uuid-bbbbb"] + ["id-12345"] = 3 KOPIEN

UND SO WEITER BEI JEDEM LOGIN...
```

### Betroffene Code-Stellen

| Stelle | Datei:Zeile | Problem |
|--------|-------------|---------|
| ID-Transform | `use-supabase-sync.js:465` | `id: isLocalId ? undefined : plan.id` → INSERT statt UPSERT |
| ID-Vergleich | `use-supabase-sync.js:216-218` | Vergleicht nur IDs, nicht semantische Identität |
| Merge-Logik | `use-supabase-sync.js:281` | Keine Deduplizierung bei gleichem `importedFrom` |
| Async Save | `calendar-context.jsx:1656` | ID wird nach Supabase-Save nicht aktualisiert |

---

## Implementierungsplan

### Fix 1: ID nach Supabase-Save aktualisieren (PRIMÄR)

**Problem:** Nach dem Speichern in Supabase wird die generierte UUID nicht zurück in localStorage geschrieben.

**Lösung:** `saveItem` muss die Supabase-Response verarbeiten und die ID updaten.

**Datei:** `src/hooks/use-supabase-sync.js`

```javascript
// VORHER (Zeile 340-386): saveItem aktualisiert lokale ID nicht

// NACHHER:
const saveItem = async (item, operation = 'upsert') => {
  const transformedItem = {
    ...transformToSupabaseRef.current(item),
    user_id: user.id,
  };

  // Speichere zu Supabase
  const { data: savedData, error } = await supabase
    .from(tableName)
    .upsert(transformedItem, { onConflict })
    .select()
    .single();

  if (error) {
    console.error(`[useSupabaseSync] Save error:`, error);
    return item; // Fallback: Original zurück
  }

  // KRITISCH: Transformiere zurück und aktualisiere lokale Daten
  const updatedItem = transformFromSupabaseRef.current(savedData);

  // Update lokale Daten mit der neuen Supabase-ID
  setData(prev => {
    const newData = prev.map(existing =>
      existing.id === item.id ? updatedItem : existing
    );
    saveToStorage(storageKey, newData);
    return newData;
  });

  return updatedItem;
};
```

### Fix 2: Deduplizierung bei Merge (SEKUNDÄR)

**Problem:** Merge-Logik vergleicht nur IDs, nicht semantische Schlüssel.

**Lösung:** Bei `importedFrom`-Match als Duplikat behandeln.

**Datei:** `src/hooks/use-supabase-sync.js` (Zeile 215-282)

```javascript
// In initData(), nach dem Fetch:
if (Array.isArray(supabaseData) && Array.isArray(localData)) {
  const supabaseIds = new Set(supabaseData.map(item => item.id));

  // NEU: Auch nach importedFrom deduplizieren
  const supabaseImportedFroms = new Set(
    supabaseData.filter(item => item.importedFrom).map(item => item.importedFrom)
  );

  // Finde local items die WIRKLICH neu sind (weder ID noch importedFrom in Supabase)
  const localOnlyItems = localData.filter(item => {
    // Skip wenn ID bereits in Supabase
    if (supabaseIds.has(item.id)) return false;
    // Skip wenn importedFrom bereits in Supabase existiert (Duplikat!)
    if (item.importedFrom && supabaseImportedFroms.has(item.importedFrom)) {
      console.log(`[useSupabaseSync] Skipping duplicate: importedFrom=${item.importedFrom}`);
      return false;
    }
    return true;
  });

  // ... rest of sync logic
}
```

### Fix 3: Duplikate in Supabase bereinigen (CLEANUP)

**Problem:** Bereits 20 Duplikate in der Datenbank.

**Lösung:** SQL-Cleanup-Script um Duplikate zu entfernen.

```sql
-- Finde Duplikate basierend auf (user_id, imported_from)
WITH duplicates AS (
  SELECT id, user_id, name, imported_from,
         ROW_NUMBER() OVER (PARTITION BY user_id, imported_from ORDER BY created_at ASC) as rn
  FROM content_plans
  WHERE imported_from IS NOT NULL
)
DELETE FROM content_plans
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Optional: Unique Constraint hinzufügen um zukünftige Duplikate zu verhindern
-- ALTER TABLE content_plans ADD CONSTRAINT unique_user_imported_from
--   UNIQUE NULLS NOT DISTINCT (user_id, imported_from);
```

### Fix 4: localStorage nach Cleanup synchronisieren

Nach dem SQL-Cleanup muss localStorage geleert werden, damit die Duplikate nicht wieder erscheinen:

```javascript
// In Supabase Dashboard oder per Migration:
// Nach DELETE der Duplikate

// User muss localStorage clearen:
// localStorage.removeItem('prep-well-content-plans');
// Oder beim nächsten Login: Supabase-Daten haben Vorrang
```

---

## Implementierungs-Reihenfolge

| Prio | Fix | Aufwand | Risiko |
|------|-----|---------|--------|
| 1 | Fix 1: ID-Sync nach Save | 30 min | Mittel |
| 2 | Fix 3: SQL Cleanup | 10 min | Niedrig |
| 3 | Fix 2: Deduplizierung | 20 min | Niedrig |
| 4 | Fix 4: Unique Constraint | 5 min | Niedrig |

---

## Akzeptanzkriterien

- [ ] Nach Template-Import: Nur 1 Plan in Supabase
- [ ] Nach Login: Keine neuen Duplikate
- [ ] Bestehende Duplikate bereinigt
- [ ] localStorage und Supabase haben gleiche IDs
- [ ] Unique Constraint verhindert zukünftige Duplikate

---

## Test-Szenario

1. SQL-Cleanup ausführen (Fix 3)
2. localStorage clearen: `localStorage.removeItem('prepwell_content_plans')`
3. Login → Supabase-Daten werden geladen (nur 1 Plan)
4. Abmelden, anmelden → Immer noch nur 1 Plan
5. Neues Template importieren → Nur 1 neuer Plan
6. Abmelden, anmelden → Keine Duplikate

---

## Implementierte Änderungen (2026-01-14)

### 1. Fix 1: ID-Sync nach Supabase-Save (`use-supabase-sync.js:371-378`)

**Problem:** Nach dem Speichern in Supabase wurde die generierte UUID nicht zurück in localStorage geschrieben, weil nur `local-` Präfix geprüft wurde.

**Lösung:** Prüfung auf ALLE lokalen ID-Präfixe erweitert:
```javascript
// T18 Fix: Check ALL local ID prefixes (local-, id-, content-, block-, etc.)
const isLocalId = itemWithId.id && (
  itemWithId.id.startsWith('local-') ||
  itemWithId.id.startsWith('id-') ||
  itemWithId.id.startsWith('content-') ||
  itemWithId.id.startsWith('block-')
);
if (savedData && isLocalId) {
  // Update local state with Supabase-generated ID
  const transformedData = transformFromSupabaseRef.current(savedData);
  // ...
}
```

### 2. Fix 2: Deduplizierung bei Merge (`use-supabase-sync.js:218-236`)

**Problem:** Merge-Logik verglich nur IDs, nicht semantische Schlüssel wie `importedFrom`.

**Lösung:** Zusätzliche Deduplizierung nach `importedFrom`:
```javascript
// T18 Fix 2: Also deduplicate by importedFrom to prevent template duplicates
const supabaseImportedFroms = new Set(
  supabaseData
    .filter(item => item.importedFrom)
    .map(item => item.importedFrom)
);

// Skip items that already exist by ID OR by importedFrom
const localOnlyItems = localData.filter(item => {
  if (supabaseIds.has(item.id)) return false;
  if (item.importedFrom && supabaseImportedFroms.has(item.importedFrom)) {
    console.log(`[useSupabaseSync] Skipping duplicate by importedFrom: ${item.importedFrom}`);
    return false;
  }
  return true;
});
```

### 3. Helper-Funktion: `deduplicateByImportedFrom` (`use-supabase-sync.js:81-115`)

**Zweck:** Dedupliziert Arrays nach `importedFrom` Feld, behält den ältesten Eintrag.

```javascript
const deduplicateByImportedFrom = (items) => {
  if (!Array.isArray(items)) return items;
  const seen = new Map();
  const result = [];
  // Sort by createdAt (oldest first)
  const sorted = [...items].sort((a, b) => { /* ... */ });
  for (const item of sorted) {
    if (!item.importedFrom) {
      result.push(item); // No dedup key, keep all
    } else if (!seen.has(item.importedFrom)) {
      seen.set(item.importedFrom, item);
      result.push(item);
    }
  }
  return result;
};
```

### 4. Fix 4: Deduplizierung bei jedem Sync (`use-supabase-sync.js:301-359`)

**Problem:** Bestehende Duplikate in Supabase wurden nicht bereinigt.

**Lösung:** `deduplicateByImportedFrom` wird auf ALLE gemergten Daten angewendet:
```javascript
// T18 Fix 4: Deduplicate merged data by importedFrom (keep oldest)
const deduplicatedData = deduplicateByImportedFrom(mergedData);
if (deduplicatedData.length < mergedData.length) {
  console.log(`[useSupabaseSync] Deduplicated ${mergedData.length - deduplicatedData.length} items`);
}
setData(deduplicatedData);
saveToStorage(storageKey, deduplicatedData);
```

### 5. SQL-Migration erstellt (`supabase/migrations/20260114_t18_cleanup_duplicates.sql`)

- Löscht Duplikate basierend auf `(user_id, imported_from)`
- Behält den ältesten Eintrag pro Template
- Fügt Unique Constraint hinzu

---

## Nächste Schritte

1. **SQL-Migration ausführen:** Im Supabase Dashboard die Migration manuell ausführen
2. **Testen:** Nach Login prüfen, dass nur 1 Lernplan erscheint
3. **User-Kommunikation:** Falls nötig, User bitten localStorage zu clearen
