# TICKET KA-001: Wochenansicht (WeekGrid) Design-Anpassung

**Typ:** Design-Anpassung (NUR Styling)
**Priorität:** Mittel
**Status:** ✅ Implementiert
**Erstellt:** 2026-01-16
**Aktualisiert:** 2026-01-16
**Aufwand:** 2-3h

---

## 1. Scope-Definition

**WICHTIG:** Dieses Ticket betrifft **NUR Design-Styling**. Die Wochenansicht ist funktional sehr umfangreich implementiert mit vielen Features - diese bleiben ALLE erhalten.

### Was geändert wird (Design-Sprache):
- Time Labels Typography (font-weight, font-size)
- Session Block Border-Radius und Typography
- Grid Line Colors
- Block Title/Description Font-Weight

### Was NICHT geändert wird (Funktionen):
- Drag-to-Select für Zeitbereiche (T9)
- Drag & Drop Tasks zu Blöcken
- Current Time Indicator
- Multi-Day Events Row
- Lernplan Header Bar (Exam Mode)
- Block Click → Dialog öffnen
- Task Toggle/Remove in Blöcken
- Navigation (Prev/Next Week, Today)
- Alle Dialog-Komponenten

---

## 2. Figma-Referenz

| Element | Node-ID | Beschreibung |
|---------|---------|--------------|
| **Zeitplan_Heute** | `2398:4504` | Tagesansicht Timeline (Basis für Week Grid) |
| **Lernblock** | `2398:4525` | Session Block Komponente |
| **Lernzeitraum blockiert** | `2398:4524` | Blocked Time Komponente |

**Hinweis:** Es gibt keine separate Wochenansicht in Figma. Die Tagesansicht (Zeitplan_Heute) dient als Vorlage für die 7-Tage-Wochenansicht.

---

## 3. Figma Design-Spezifikationen

### 3.1 Timeline Container

```
Border: 1px solid #E5E5E5 (border-neutral-200)
Border-Radius: 5px
Background: white
```

### 3.2 Time Labels (Stunden-Anzeige links)

```
Font-Size: 14px (text-sm)
Font-Weight: 400 (font-normal)
Color: #A3A3A3 (text-neutral-400)
Line-Height: 20px
```

### 3.3 Grid Lines

```
Normal Lines: #D4D4D4 (neutral-300) - App-Konsistenz
Current Time Line: #2C2C2C (dark gray)
Current Time Dot: 6px Ellipse, fill #2C2C2C
```

### 3.4 Session Block (Lernblock)

```
Container:
- Background: white
- Border: 1px solid #E5E5E5 (border-neutral-200)
- Border-Radius: 5px (rounded-[5px])
- Padding: 15px (p-[15px] oder p-4)

Title:
- Font-Size: 16px (text-base)
- Font-Weight: 300 (font-light)
- Color: #0A0A0A (text-neutral-950)
- Line-Height: 24px

Description:
- Font-Size: 14px (text-sm)
- Font-Weight: 300 (font-light)
- Color: #A3A3A3 (text-neutral-400)
- Line-Height: 20px

Tags:
- Background: #0A0A0A (bg-neutral-950)
- Text Color: #FAFAF9 (text-stone-50)
- Border-Radius: 15px (rounded-[15px])
- Padding: 5px 15px
- Font-Size: 12px (text-xs)
- Font-Weight: 400 (font-normal)
```

### 3.5 Checkbox in Blocks

```
Size: 16px x 16px (h-4 w-4)
Checked:
- Background: #171717 (bg-neutral-900)
- Border-Radius: 4px (rounded-sm)
- Shadow: shadow-xs

Unchecked:
- Background: white
- Border: 1px solid #E5E5E5 (border-neutral-200)

Label:
- Font-Size: 14px (text-sm)
- Font-Weight: 300 (font-light) - NICHT medium!
- Gap to Checkbox: 8px (gap-2)
```

### 3.6 Blocked Time

```
Background: #F5F5F5 (bg-neutral-100)
Border: 1px solid #E5E5E5 (border-neutral-200)
Border-Radius: 5px
Text: text-base font-light text-neutral-400
```

### 3.7 Header (Week View Header)

```
Title:
- Font-Size: 14px (text-sm)
- Font-Weight: 500 (font-medium)
- Color: #0A0A0A (text-neutral-950)

Badge:
- Background: #F5F5F5 (bg-neutral-100)
- Border-Radius: 8px (rounded-md)
- Font-Size: 12px (text-xs)
- Font-Weight: 600 (font-semibold)

Navigation Buttons:
- Border: 1px solid #E5E5E5 (border-neutral-200)
- Border-Radius: 8px (rounded-md)
- Size: 32px x 32px
```

---

## 4. Design-Token Mapping

### 4.1 Bereits korrekt

| Element | Figma | Tailwind | Status |
|---------|-------|----------|--------|
| Container Border | `#E5E5E5` | `border-neutral-200` | ✅ |
| Time Label Color | `#A3A3A3` | `text-neutral-400` | ✅ |
| Header Title Color | `#0A0A0A` | `text-neutral-900` | ⚠️ neutral-950 wäre exakter |
| Block Container Border | `#E5E5E5` | `border-neutral-200` | ✅ |
| Checkbox Size | `16px` | `h-4 w-4` | ✅ |

### 4.2 Zu ändernde Werte

| Element | Aktuell | Figma | Neue Tailwind-Klasse |
|---------|---------|-------|---------------------|
| Time Label Size | `text-xs` | 14px | `text-sm` |
| Time Label Weight | `font-medium` | 400 | `font-normal` |
| Block Title Size | `text-xs` | 16px | `text-sm` oder `text-base` |
| Block Title Weight | `font-medium` | 300 | `font-light` |
| Block Border-Radius | `rounded-md` (8px) | 5px | `rounded-[5px]` oder `rounded` (6px) |
| Grid Lines Color | `border-neutral-100/200` | #D4D4D4 | `border-neutral-300` |

---

## 5. Konkrete Code-Änderungen

**Datei:** `src/features/calendar/components/week-grid.jsx`

### 5.1 Time Labels (Zeile 760) ✅ IMPLEMENTIERT

```jsx
// AKTUELL IMPLEMENTIERT (week-grid.jsx:760):
<div
  key={hour}
  className="text-right pr-2 text-sm font-normal text-neutral-400 border-b border-neutral-100"
  style={{ height: `${hourHeight}px`, paddingTop: '4px' }}
>
```

### 5.2 Grid Lines (Zeile 830) ✅ IMPLEMENTIERT

```jsx
// AKTUELL IMPLEMENTIERT (week-grid.jsx:830):
<div
  key={hour}
  className="absolute left-0 right-0 border-b border-neutral-300 pointer-events-none"
  style={{ top: `${hour * hourHeight}px`, height: `${hourHeight}px` }}
/>
```

### 5.3 Block Container (Zeile 960) ✅ IMPLEMENTIERT

```jsx
// AKTUELL IMPLEMENTIERT (week-grid.jsx:960):
className={`absolute left-2 right-2 rounded-[5px] border shadow-xs px-3 py-2.5 text-left overflow-hidden cursor-pointer transition-all z-10 select-none ${...}`}
```

### 5.4 Block Title (Zeile 987) ✅ IMPLEMENTIERT

```jsx
// AKTUELL IMPLEMENTIERT (week-grid.jsx:987):
<div className="text-sm font-light text-neutral-950 truncate flex-1">
  {block.title}
</div>
```

### 5.5 Task Label in Block (Zeile 1046) ✅ IMPLEMENTIERT

```jsx
// AKTUELL IMPLEMENTIERT (week-grid.jsx:1046):
<span className={`text-sm font-light truncate flex-1 ${
  task.completed ? 'text-neutral-400 line-through' : 'text-neutral-950'
}`}>
```

### 5.6 Blocked State Text (Zeile 944)

```jsx
// ALT:
<span className="text-xs font-medium text-neutral-500">Blockiert</span>

// NEU (Figma: text-sm font-light):
<span className="text-sm font-light text-neutral-400">Blockiert</span>
```

---

**Datei:** `src/features/calendar/components/week-view-header.jsx`

### 5.7 Week Title (Zeile 19)

```jsx
// ALT:
<h2 className="text-sm font-medium text-neutral-900">{weekTitle}</h2>

// NEU (Figma: text-neutral-950):
<h2 className="text-sm font-medium text-neutral-950">{weekTitle}</h2>
```

---

## 6. Visuelle Vergleichstabelle

| Element | Vorher | Nachher |
|---------|--------|---------|
| **Time Labels Size** | `text-xs` (12px) | `text-sm` (14px) |
| **Time Labels Weight** | `font-medium` (500) | `font-normal` (400) |
| **Block Border-Radius** | `rounded-md` (8px) | `rounded-[5px]` |
| **Block Title Size** | `text-xs` (12px) | `text-sm` (14px) |
| **Block Title Weight** | `font-medium` (500) | `font-light` (300) |
| **Grid Lines** | `border-neutral-100/200` | `border-neutral-300` |
| **Task Labels** | `text-xs` | `text-sm font-light` |

---

## 7. Beizubehaltende Funktionen (Touch NOT)

```jsx
// DIESE LOGIK BLEIBT KOMPLETT UNVERÄNDERT:

// T9: Drag-to-Select (Zeile 376-431)
✅ handleDragStart, handleDragMove, handleDragEnd
✅ getSelectionOverlay Berechnung
✅ Selection Overlay UI

// T9: Current Time Indicator (Zeile 835-844)
✅ getTodayColumnIndex
✅ currentTimePosition Berechnung
✅ Red dot + line Rendering

// Multi-Day Events (Zeile 510-549, 631-702)
✅ multiDayRows Berechnung
✅ getMultiDayBlockInfo
✅ Colspan Rendering

// Lernplan Header Bar (Zeile 704-744)
✅ BUG-023 FIX: Exam mode header blocks
✅ lernplanHeaderBlocksByDate grouping

// Block Interactions (Zeile 876-1079)
✅ onBlockClick → Dialog öffnen
✅ handleBlockDragOver, handleBlockDrop
✅ onTaskToggle, onRemoveTaskFromBlock

// Block Type Colors (Zeile 27-43)
✅ BLOCK_COLORS object
✅ Type-based coloring (theme, repetition, exam, private)

// Weekday Header (Zeile 556-629)
✅ isToday highlighting
✅ isDayFull warning
✅ formatDateDisplay
```

---

## 8. Hinweise zur Figma-Abweichung

### Funktionen in App die NICHT in Figma sind (BEHALTEN):

| App-Feature | Grund für Beibehaltung |
|-------------|----------------------|
| Drag-to-Select | UX-Feature (T9) |
| Multi-Day Events Row | UX-Feature |
| Lernplan Header Bar | Exam Mode Feature |
| Block Type Coloring | Visuelle Unterscheidung |
| Task Progress Bar | Fortschrittsanzeige |
| "Alle Slots belegt" Warning | UX-Feedback |

### Design in Figma das NICHT 1:1 übernommen wird:

| Figma-Element | Grund |
|---------------|-------|
| Exakte 5px Border-Radius | 6px (`rounded`) ist näher an Design-System |
| Zwei-Spalten Block Layout | App hat kompakteres Layout für Wochenansicht |

---

## 9. Akzeptanzkriterien

### 9.1 Styling-Änderungen
- [x] Time Labels sind `text-sm font-normal text-neutral-400` ✅ Zeile 760
- [x] Grid Lines sind `border-neutral-300` (einheitlich) ✅ Zeile 830
- [x] Block Container haben `rounded-[5px]` ✅ Zeile 960
- [x] Block Titles sind `text-sm font-light text-neutral-950` ✅ Zeile 987
- [x] Task Labels sind `text-sm font-light` ✅ Zeile 1046
- [x] Header Title ist `text-neutral-950` ✅ week-view-header.jsx:19
- [x] Blocked State Text ist `text-sm font-light text-neutral-400` ✅ Zeile 944

### 9.2 Funktions-Erhalt
- [x] **ALLE bestehenden Funktionen arbeiten unverändert**
- [x] Drag-to-Select funktioniert
- [x] Block Click öffnet Dialog
- [x] Task Toggle funktioniert
- [x] Multi-Day Events werden korrekt angezeigt
- [x] Navigation funktioniert (Prev/Next/Today)
- [x] Current Time Indicator wird angezeigt

---

## 10. Test-Checkliste

### 10.1 Visual Check
- [x] Time Labels sind größer und leichter
- [x] Grid Lines sind einheitlich
- [x] Block Titles sind leichter (font-light)
- [x] Block Corners sind etwas runder

### 10.2 Funktions-Check
- [x] Drag-to-Select erstellt neue Session
- [x] Block Click → Dialog öffnet
- [x] Task Checkbox Toggle funktioniert
- [x] Task Remove (X) funktioniert
- [x] Multi-Day Block Rendering
- [x] Current Time Indicator Positionierung
- [x] Navigation zwischen Wochen

---

## 11. Abhängigkeiten

| Abhängigkeit | Status |
|--------------|--------|
| `text-sm` | ✅ In tailwind.config.js definiert (14px) |
| `font-normal` | ✅ In tailwind.config.js definiert (400) |
| `font-light` | ✅ In tailwind.config.js definiert (300) |
| `text-neutral-950` | ✅ In tailwind.config.js definiert (#0A0A0A) |
| `border-neutral-300` | ✅ Tailwind Standard (#D4D4D4) |
| `rounded-[5px]` | ⚠️ Arbitrary value - oder `rounded` (6px) verwenden |

---

## 12. Risiken

| Risiko | Mitigation |
|--------|------------|
| Block Title zu klein bei langen Texten | font-light erhöht Lesbarkeit trotz kleinerer Größe |
| Grid Lines zu hell | neutral-300 ist noch gut sichtbar |
| Funktions-Regression | Umfangreiche Test-Checkliste durchführen |

---

## 13. Dateien-Übersicht

| Datei | Änderungen |
|-------|------------|
| `week-grid.jsx` | Time Labels, Grid Lines, Block Styling, Task Labels |
| `week-view-header.jsx` | Header Title Color |
| `week-view.jsx` | Keine Änderungen (nur Logik) |

---

## 14. Implementierte Komponenten (Referenz)

| Komponente | Zeilen | Funktion |
|------------|--------|----------|
| `WeekGrid` | 127-1087 | Hauptgrid mit allen Features |
| `LernplanBlockChip` | 96-121 | Lernplan Header Blocks |
| `BLOCK_COLORS` | 27-43 | Block Type Color Mapping |
| `BLOCK_TYPE_NAMES` | 45-55 | Block Type Labels |
