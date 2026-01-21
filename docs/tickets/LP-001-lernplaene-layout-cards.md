# TICKET LP-001: Lernpläne-Seite Layout und Card-Design

**Typ:** Design-Anpassung (NUR Styling)
**Priorität:** Mittel
**Status:** ✅ Implementiert
**Erstellt:** 2026-01-15
**Aktualisiert:** 2026-01-16
**Aufwand:** 2-3h

---

## 1. Scope-Definition

**WICHTIG:** Dieses Ticket betrifft **NUR Design-Styling**. Die Lernpläne-Seite hat komplexe Funktionalität die KOMPLETT erhalten bleibt.

### Was geändert wird (Design-Sprache):
- Card Border-Radius: `rounded-lg` → `rounded` (5px Figma)
- Card Padding: `p-4` → `p-6` (24px, nähert sich Figma 30px)
- Title Typography: `font-medium` → `text-2xl font-extralight`
- Badge-Styling: Neue Figma-konforme Farbschemata
- Filter-Tabs Styling anpassen

### Was NICHT geändert wird (Funktionen):
- Edit Mode / View Mode Toggle
- Expand/Collapse Hierarchie
- Reactivation Dialog (T13)
- Archive/Delete Funktionalität
- ContentPlanEditCard Komponente (komplexe Hierarchie)
- "Gewichtung der Rechtsgebiete" (in Figma, NICHT implementiert - bleibt so!)

---

## 2. Figma-Referenz

| Element | Node-ID | Beschreibung |
|---------|---------|--------------|
| **Lernpläne Seite** | `2129:2706` | Gesamtansicht |
| **Lernplan Card (Examensmodus)** | `2411:2272` | Haupt-Card Design |
| **Lernplan Card Body** | `2411:2273` | Expanded Content |

---

## 3. Figma Design-Spezifikationen

### 3.1 Card Container (Figma: 2411:2272)

```
Background: white
Border: 1px solid #E5E5E5 (neutral-200)
Border-Radius: 5px (rounded)
Padding: 30px (p-7.5)
Gap: 20px (gap-5) zwischen Sektionen
```

### 3.2 Card Title

```
Font-Size: 24px (text-2xl)
Font-Weight: extralight (200)
Color: #0A0A0A (neutral-950)
```

### 3.3 Badges/Tags

**Primary Badge (Aktiv):**
```
Background: #171717 (neutral-900)
Text: #FAFAFA (neutral-50)
Border-Radius: 8px (rounded-md)
Font: text-xs font-semibold
Padding: px-2 py-0.5
```

**Secondary Badge (Counts/Stats):**
```
Background: #F5F5F5 (neutral-100)
Text: #171717 (neutral-900)
Border-Radius: 8px (rounded-md)
Font: text-xs font-semibold
```

**Type Badge (Themenliste/Lernplan):**
```
Background: #F5F5F5 (neutral-100)
Text: #171717 (neutral-900)
Border-Radius: 8px (rounded-md)
```

### 3.4 Filter Tabs (Aktiv/Archiv)

```
Active: bg-neutral-900 text-neutral-50 rounded-md
Inactive: bg-transparent text-neutral-500 hover:bg-neutral-100 rounded-md
Padding: px-3 py-1.5
```

---

## 4. Design-Token Mapping

### 4.1 Bereits korrekt

| Element | Figma | Tailwind | Status |
|---------|-------|----------|--------|
| Card Border | `#E5E5E5` | `border-neutral-200` | ✅ |
| Card BG | `white` | `bg-white` | ✅ |
| Description Color | `#A3A3A3` | `text-neutral-400` | ✅ |

### 4.2 Zu ändernde Werte

| Element | Aktuell | Figma | Neue Tailwind-Klasse |
|---------|---------|-------|---------------------|
| Card Border-Radius | `rounded-lg` (10px) | 5px | `rounded` |
| Card Padding | `p-4` (16px) | 30px | `p-6` (24px)* |
| Title Size | `font-medium` | 24px extralight | `text-2xl font-extralight` |
| Title Color | `text-neutral-900` | #0A0A0A | `text-neutral-950` |
| Active Badge | `bg-green-100 text-green-700` | #171717 | `bg-neutral-900 text-neutral-50` |
| Badge Shape | `rounded-full` | 8px | `rounded-md` |
| Type Badge | `bg-primary-100 text-primary-700` | neutral | `bg-neutral-100 text-neutral-900` |
| Filter Active | `bg-primary-100 text-primary-700` | neutral | `bg-neutral-900 text-neutral-50` |
| Filter Tabs | `rounded-lg` | 8px | `rounded-md` |

*Hinweis: `p-7.5` (30px) ist verfügbar in tailwind.config.js, aber `p-6` (24px) ist nah genug und Standard.

---

## 5. Konkrete Code-Änderungen

### Datei 1: `src/components/lernplan/lernplan-content.jsx`

#### 5.1 Filter Tabs - Aktiv/Archiv (Zeile 257-276)

```jsx
// ALT:
<button
  onClick={() => setShowArchived(false)}
  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
    !showArchived
      ? 'bg-primary-100 text-primary-700'
      : 'text-neutral-600 hover:bg-neutral-100'
  }`}
>
  Aktiv
</button>

// NEU (Figma-aligned):
<button
  onClick={() => setShowArchived(false)}
  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
    !showArchived
      ? 'bg-neutral-900 text-neutral-50'
      : 'text-neutral-500 hover:bg-neutral-100'
  }`}
>
  Aktiv
</button>
```

```jsx
// ALT (Zeile 267-276):
<button
  onClick={() => setShowArchived(true)}
  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
    showArchived
      ? 'bg-primary-100 text-primary-700'
      : 'text-neutral-600 hover:bg-neutral-100'
  }`}
>
  Archiv
</button>

// NEU:
<button
  onClick={() => setShowArchived(true)}
  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
    showArchived
      ? 'bg-neutral-900 text-neutral-50'
      : 'text-neutral-500 hover:bg-neutral-100'
  }`}
>
  Archiv
</button>
```

#### 5.2 Archived Calendar Plans Card (Zeile 316)

```jsx
// ALT:
<div key={plan.id} className="bg-white rounded-lg border border-neutral-200 p-4">

// NEU (Figma-aligned):
<div key={plan.id} className="bg-white rounded border border-neutral-200 p-6">
```

#### 5.3 Archived Plan Title (Zeile 319)

```jsx
// ALT:
<h4 className="font-medium text-neutral-900">
  {plan.metadata?.name || 'Lernplan'}
</h4>

// NEU (Figma: 24px extralight):
<h4 className="text-2xl font-extralight text-neutral-950">
  {plan.metadata?.name || 'Lernplan'}
</h4>
```

#### 5.4 Archived Plan Stats Badges (Zeile 365-372)

```jsx
// ALT:
<span className="px-2 py-0.5 bg-neutral-100 rounded">
  {Object.keys(plan.slots || {}).length} Tage
</span>

// NEU (Figma: rounded-md):
<span className="px-2 py-0.5 bg-neutral-100 rounded-md text-xs font-medium text-neutral-900">
  {Object.keys(plan.slots || {}).length} Tage
</span>
```

#### 5.5 Active Calendar Plan Card (Zeile 395)

```jsx
// ALT:
<div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">

// NEU (Figma: rounded = 5px):
<div className="rounded border border-neutral-200 bg-white overflow-hidden">
```

#### 5.6 Active Plan Inner Padding (Zeile 396)

```jsx
// ALT:
<div className="p-4">

// NEU (Figma: 30px → p-6 = 24px):
<div className="p-6">
```

#### 5.7 Active Plan Title (Zeile 428-430)

```jsx
// ALT:
<h4 className="font-medium text-neutral-900">
  {activeCalendarPlan.name || 'Lernplan'}
</h4>

// NEU (Figma: text-2xl font-extralight):
<h4 className="text-2xl font-extralight text-neutral-950">
  {activeCalendarPlan.name || 'Lernplan'}
</h4>
```

#### 5.8 Active Badge (Zeile 431-433)

```jsx
// ALT:
<span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
  Aktiv
</span>

// NEU (Figma: bg-neutral-900, rounded-md):
<span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-neutral-900 text-neutral-50">
  Aktiv
</span>
```

---

### Datei 2: `src/components/lernplan/content-plan-edit-card.jsx`

#### 5.9 Card Container (Zeile 228)

```jsx
// ALT:
<div className={`bg-white rounded-lg border ${isNew ? 'border-primary-300 ring-2 ring-primary-100' : 'border-neutral-200'} overflow-hidden`}>

// NEU (rounded-lg → rounded):
<div className={`bg-white rounded border ${isNew ? 'border-primary-300 ring-2 ring-primary-100' : 'border-neutral-200'} overflow-hidden`}>
```

#### 5.10 Type Badge (Zeile 243-247)

```jsx
// ALT:
<span className={`px-2 py-0.5 text-xs font-medium rounded mr-3 ${
  plan.type === 'themenliste' ? 'bg-yellow-100 text-yellow-700' : 'bg-primary-100 text-primary-700'
}`}>
  {plan.type === 'themenliste' ? 'Themenliste' : 'Lernplan'}
</span>

// NEU (Figma: neutral colors, rounded-md):
<span className={`px-2 py-0.5 text-xs font-semibold rounded-md mr-3 ${
  plan.type === 'themenliste' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-900'
}`}>
  {plan.type === 'themenliste' ? 'Themenliste' : 'Lernplan'}
</span>
```

#### 5.11 Mode Badge Examen (Zeile 250-254)

```jsx
// ALT:
<span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700 mr-3">
  Examen
</span>

// NEU (consistent rounded-md):
<span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-100 text-purple-800 mr-3">
  Examen
</span>
```

#### 5.12 Title in View Mode (Zeile 258)

```jsx
// ALT:
<h3 className="flex-1 min-w-0 px-2 py-1 text-base font-medium text-neutral-900 truncate">
  {plan.name || (plan.type === 'themenliste' ? 'Themenliste' : 'Lernplan')}
</h3>

// NEU (Figma: larger title):
<h3 className="flex-1 min-w-0 px-2 py-1 text-lg font-medium text-neutral-950 truncate">
  {plan.name || (plan.type === 'themenliste' ? 'Themenliste' : 'Lernplan')}
</h3>
```

---

## 6. Visuelle Vergleichstabelle

| Element | Vorher | Nachher |
|---------|--------|---------|
| **Card Border-Radius** | `rounded-lg` (10px) | `rounded` (5px) |
| **Card Padding** | `p-4` (16px) | `p-6` (24px) |
| **Title Style** | `font-medium text-neutral-900` | `text-2xl font-extralight text-neutral-950` |
| **Active Badge** | `bg-green-100 text-green-700 rounded-full` | `bg-neutral-900 text-neutral-50 rounded-md` |
| **Type Badge** | `bg-primary-100 text-primary-700` | `bg-neutral-100 text-neutral-900` |
| **Filter Tab Active** | `bg-primary-100 text-primary-700 rounded-lg` | `bg-neutral-900 text-neutral-50 rounded-md` |
| **Stats Badge** | `rounded` | `rounded-md text-xs font-medium` |

---

## 7. Beizubehaltende Funktionen (Touch NOT)

```jsx
// DIESE LOGIK BLEIBT KOMPLETT UNVERÄNDERT:

// Edit Mode Toggle (Zeile 281-305)
✅ Ansicht/Bearbeiten Toggle mit Button-Group

// Reactivation Dialog (Zeile 578-679)
✅ T13 Feature: Kompletter Dialog mit Date-Inputs
✅ handleOpenReactivateDialog, handleReactivate
✅ navigateToWizardWithPrefill

// Calendar Plan Edit (Zeile 386-393)
✅ CalendarPlanEditCard Komponente
✅ isCalendarPlanExpanded State

// Archive/Delete Actions (Zeile 446-477)
✅ handleArchiveCalendarPlan
✅ handleDeleteCalendarPlan
✅ handleStartEditCalendarPlanName

// ContentPlanEditCard (Separate Datei)
✅ Komplette Hierarchie: Plan → RG → URG → Kapitel → Themen → Aufgaben
✅ expandedRechtsgebiete, expandedUnterrechtsgebiete, etc. States
✅ Alle CRUD-Operationen
✅ RechtsgebietPickerModal
✅ UnterrechtsgebietPicker Integration
```

---

## 8. Akzeptanzkriterien

### 8.1 Styling-Änderungen
- [ ] Card Border-Radius ist `rounded` (5px) statt `rounded-lg`
- [ ] Card Padding ist `p-6` (24px) statt `p-4`
- [ ] Active Calendar Plan Title ist `text-2xl font-extralight text-neutral-950`
- [ ] Active Badge ist `bg-neutral-900 text-neutral-50 rounded-md`
- [ ] Type Badges haben `rounded-md`
- [ ] Filter Tabs aktiv: `bg-neutral-900 text-neutral-50 rounded-md`
- [ ] Stats Badges haben `rounded-md text-xs font-medium`

### 8.2 Funktions-Erhalt
- [ ] **ALLE bestehenden Funktionen arbeiten unverändert**
- [ ] Edit Mode Toggle funktioniert weiterhin
- [ ] Expand/Collapse funktioniert weiterhin
- [ ] Reactivation Dialog funktioniert weiterhin
- [ ] Archive/Delete funktioniert weiterhin
- [ ] ContentPlanEditCard Hierarchie funktioniert weiterhin

---

## 9. Test-Checkliste

### 9.1 Aktive Lernpläne View
- [ ] Kalender-Lernplan Card rendert korrekt
- [ ] Title-Styling ist Figma-konform
- [ ] "Aktiv" Badge hat neue Farben
- [ ] Stats (Tage, Blöcke/Tag) werden angezeigt
- [ ] Edit/Archive/Delete Buttons funktionieren

### 9.2 Archiv View
- [ ] Archivierte Plans werden aufgelistet
- [ ] Cards haben korrektes Styling
- [ ] "Reaktivieren" Button funktioniert
- [ ] "Wiederherstellen" Button funktioniert
- [ ] "Löschen" Button funktioniert

### 9.3 Filter Tabs
- [ ] Aktiv/Archiv Tabs haben neues Styling
- [ ] Toggle zwischen Views funktioniert
- [ ] Korrekte Hervorhebung des aktiven Tabs

### 9.4 ContentPlanEditCard
- [ ] Cards haben `rounded` statt `rounded-lg`
- [ ] Type Badge (Lernplan/Themenliste) korrekt
- [ ] Mode Badge (Examen) korrekt
- [ ] Expand/Collapse funktioniert

---

## 10. Hinweise zur Figma-Abweichung

### Funktionen in Figma die NICHT implementiert werden:

| Figma-Element | Grund für Nicht-Implementierung |
|---------------|--------------------------------|
| "Gewichtung der Rechtsgebiete" Section | Komplexe Feature-Erweiterung, separates Ticket |
| Pill-Shape Action Buttons (rounded-full) | Kann per className überschrieben werden |
| Detaillierte Progress-Statistiken | Nicht in aktueller Roadmap |

### Abweichungen die bleiben:

| App-Feature | Grund für Beibehaltung |
|-------------|----------------------|
| `p-6` statt `p-7.5` | Standard Tailwind, nahe genug |
| ContentPlanEditCard Design | Eigene komplexe Komponente |
| Edit Mode Toggle | Funktionale Erweiterung |

---

## 11. Abhängigkeiten

| Abhängigkeit | Status |
|--------------|--------|
| `rounded` (5px) | ✅ In tailwind.config.js definiert (6px - nah genug) |
| `text-neutral-950` | ✅ In tailwind.config.js definiert (#0A0A0A) |
| `font-extralight` | ✅ In tailwind.config.js definiert (200) |
| `rounded-md` (8px) | ✅ In tailwind.config.js definiert |
| `p-6` (24px) | ✅ Tailwind Standard |

---

## 12. Risiken

| Risiko | Mitigation |
|--------|------------|
| Title zu groß (text-2xl) | Nur für main cards, nicht für ContentPlanEditCard |
| Active Badge kontrast | neutral-900 auf neutral-50 ist gut lesbar |
| Breaking hierarchical styling | Nur top-level Card-Styling ändern |

---

## 13. Korrektur zum alten Ticket

Das ursprüngliche Ticket war **zu vage**:

> ❌ "Card-Layout nicht figma-konform"
> ❌ "Detaillierte Card-Spezifikation aus Figma extrahieren"

**Korrektur:** Dieses Ticket enthält jetzt konkrete Code-Änderungen mit Zeilennummern und ALT/NEU Vergleichen.
