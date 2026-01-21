# Analyse: Slot/Slots Referenzen im Codebase

**Aktualisiert:** 2026-01-16
**Zweck:** Identifikation aller Legacy "slot/slots" Referenzen für Bereinigung

---

## Zusammenfassung

| Kategorie | Anzahl Dateien | Referenzen | Status |
|-----------|----------------|------------|--------|
| **Legacy Props** | 7 | 16 | ⚠️ Zu bereinigen |
| **Legacy Aliases (Code)** | 2 | 9 | ⚠️ Zu bereinigen |
| **LocalStorage Migration** | 2 | 3 | ✅ Intentional |
| **Tests** | 1 | 12 | ✅ Test-Coverage |
| **Dokumentation** | 5+ | ~20 | 📝 Info only |

### ✅ Bereits migriert
- `slots_data` → `blocks_data` in `schema.sql` ✅
- `slots_data` → `blocks_data` in `use-supabase-sync.js` ✅
- `slots_data` → `blocks_data` in `archived_lernplaene` (Migration vorhanden) ✅

---

## 1. Legacy Props: `availableSlots` (⚠️ ZU BEREINIGEN)

Diese Dialoge akzeptieren noch den alten Prop-Namen `availableSlots`:

| Datei | Zeilen | Pattern |
|-------|--------|---------|
| `create-theme-session-dialog.jsx` | 37, 47 | `availableSlots, // Legacy alias` |
| `create-repetition-session-dialog.jsx` | 48, 55 | `availableSlots, // Legacy alias` |
| `create-exam-session-dialog.jsx` | 56, 72 | `availableSlots, // Legacy alias` |
| `manage-theme-session-dialog.jsx` | 36, 42 | `availableSlots, // Legacy alias` |
| `manage-freetime-session-dialog.jsx` | 27, 30 | `availableSlots, // Legacy alias` |
| `day-management-dialog.jsx` | 43, 46 | `availableSlots, // Legacy alias` |

**Aufrufer mit altem Prop:**

| Datei | Zeilen | Code |
|-------|--------|------|
| `step-8-calendar.jsx` | 732, 741 | `availableSlots={getAvailableBlocksForDate(...)}` |

**Bereinigung:**
1. In Dialogen: `availableSlots` Prop entfernen, nur `availableBlocks` behalten
2. In step-8-calendar.jsx: Prop umbenennen zu `availableBlocks`

---

## 2. Legacy Aliases in Hooks (⚠️ ZU BEREINIGEN)

### 2.1 use-dashboard.js

| Zeile | Code | Zweck |
|-------|------|-------|
| 387 | `todaySlots: todayBlocks` | Legacy alias |
| 401 | `hasRealLernplanSlots: hasRealLernplanBlocks` | Legacy alias |

**Bereinigung:** Prüfen ob `todaySlots`/`hasRealLernplanSlots` noch verwendet werden, dann entfernen.

---

## 3. Legacy Exports in Utils (⚠️ ZU BEREINIGEN)

### 3.1 calendarDataUtils.ts

| Zeile | Export | Alias für |
|-------|--------|-----------|
| 158 | `createSlot` | `createBlock` |
| 205 | `createBlockFromSlotAndContent` | `createSessionFromBlockAndContent` |
| 293 | `migrateLegacySlot` | `migrateLegacyBlock` |
| 370 | `createSlot` (re-export) | |
| 373 | `createBlockFromSlotAndContent` (re-export) | |
| 379 | `migrateLegacySlot` (re-export) | |

**Bereinigung:** Prüfen ob diese Exports noch importiert werden, dann entfernen.

---

## 4. LocalStorage Migration (✅ INTENTIONAL - BEHALTEN)

### 4.1 auth-context.jsx:10

```javascript
'prepwell_calendar_slots',  // Cleanup bei Logout
```

**Zweck:** Alte LocalStorage Keys bei Logout löschen.

### 4.2 localStorage-migration.js

| Zeile | Code |
|-------|------|
| 5 | `// prepwell_calendar_slots → prepwell_calendar_blocks` |
| 25 | `'prepwell_calendar_slots': 'prepwell_calendar_blocks'` |

**Zweck:** Migration alter LocalStorage Daten.

**Status:** ✅ Behalten bis alle User migriert sind.

---

## 5. Tests (✅ INTENTIONAL - BEHALTEN)

### 5.1 localStorage-migration.test.js

12 Referenzen zu `prepwell_calendar_slots` in Test-Cases.

**Zweck:** Test-Coverage für LocalStorage Migration.

**Status:** ✅ Behalten solange Migration-Code existiert.

---

## 6. Dokumentation (📝 INFO ONLY)

| Datei | Kontext |
|-------|---------|
| `docs/db-schema-snapshot.md` | Schema-Historie |
| `docs/tickets17.md` | Migration-Dokumentation |
| `docs/tickets19.md` | slot_date Migration |
| `docs/tickets20.md` | Migration Status |
| `supabase/migrations/20260116_rename_slots_data_to_blocks_data.sql` | Kommentare |

---

## 7. Bereinigungs-Plan

### Phase 1: Props Cleanup (7 Dateien)

```bash
# 1. step-8-calendar.jsx - Prop umbenennen
availableSlots={...}  →  availableBlocks={...}

# 2. In allen 6 Dialog-Dateien - Legacy alias entfernen
- availableSlots, // Legacy alias
- const maxBlocks = availableSlots ?? availableBlocks;
+ const maxBlocks = availableBlocks;
```

**Betroffene Dateien:**
- [ ] `step-8-calendar.jsx` (2 Stellen)
- [ ] `create-theme-session-dialog.jsx`
- [ ] `create-repetition-session-dialog.jsx`
- [ ] `create-exam-session-dialog.jsx`
- [ ] `manage-theme-session-dialog.jsx`
- [ ] `manage-freetime-session-dialog.jsx`
- [ ] `day-management-dialog.jsx`

### Phase 2: Hook Aliases Cleanup (1 Datei)

```bash
# use-dashboard.js - Prüfen und entfernen
- todaySlots: todayBlocks,
- hasRealLernplanSlots: hasRealLernplanBlocks,
```

**Betroffene Dateien:**
- [ ] `use-dashboard.js`

### Phase 3: Utils Exports Cleanup (1 Datei)

```bash
# calendarDataUtils.ts - Legacy exports entfernen
- export const createSlot = createBlock;
- export const createBlockFromSlotAndContent = ...;
- export const migrateLegacySlot = ...;
```

**Betroffene Dateien:**
- [ ] `calendarDataUtils.ts`

### Phase 4: Später (Nach User-Migration)

- [ ] `auth-context.jsx` - LocalStorage Key entfernen
- [ ] `localStorage-migration.js` - Migration-Code entfernen
- [ ] `localStorage-migration.test.js` - Tests entfernen

---

## 8. Statistik (Aktuell)

| Typ | Anzahl | Status |
|-----|--------|--------|
| **Props `availableSlots`** | 14 | ⚠️ Zu bereinigen |
| **Hook Aliases** | 2 | ⚠️ Zu bereinigen |
| **Export Aliases** | 6 | ⚠️ Zu bereinigen |
| **LocalStorage Migration** | 3 | ✅ Intentional |
| **Tests** | 12 | ✅ Intentional |
| **Dokumentation** | ~20 | 📝 Info |
| **TOTAL** | ~57 | |

---

## 9. Dateien-Übersicht

```
src/
├── contexts/
│   └── auth-context.jsx              ✅ Intentional (1)
├── hooks/
│   └── use-dashboard.js              ⚠️ Zu bereinigen (2)
├── utils/
│   ├── calendarDataUtils.ts          ⚠️ Zu bereinigen (6)
│   ├── localStorage-migration.js     ✅ Intentional (2)
│   └── __tests__/
│       └── localStorage-migration.test.js  ✅ Tests (12)
└── features/
    ├── calendar/components/
    │   ├── create-theme-session-dialog.jsx      ⚠️ (2)
    │   ├── create-repetition-session-dialog.jsx ⚠️ (2)
    │   ├── create-exam-session-dialog.jsx       ⚠️ (2)
    │   ├── manage-theme-session-dialog.jsx      ⚠️ (2)
    │   ├── manage-freetime-session-dialog.jsx   ⚠️ (2)
    │   └── day-management-dialog.jsx            ⚠️ (2)
    └── lernplan-wizard/steps/
        └── step-8-calendar.jsx                  ⚠️ (2)
```

**Legende:**
- ✅ = Intentional/Behalten
- ⚠️ = Zu bereinigen
- 📝 = Dokumentation

---

## 10. Bereits erledigt ✅

| Was | Wo | Wann |
|-----|-----|------|
| `slots_data` → `blocks_data` | `schema.sql:161` | ✅ Done |
| `slots_data` → `blocks_data` | `use-supabase-sync.js:2400,2446,2492` | ✅ Done |
| `slots_data` → `blocks_data` | `archived_lernplaene` (Migration) | ✅ Migration erstellt |
| `slot_date` → `block_date` | `calendar_blocks` | ✅ Done (T17) |
