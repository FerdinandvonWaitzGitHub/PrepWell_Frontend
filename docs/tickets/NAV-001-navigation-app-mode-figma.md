# TICKET NAV-001: Navigation Design-Anpassung

**Typ:** Design-Anpassung (NUR Styling)
**Priorität:** Mittel
**Status:** ✅ Implementiert (2026-01-16)
**Erstellt:** 2026-01-15
**Aktualisiert:** 2026-01-16
**Aufwand:** 1-2h

---

## 1. Scope-Definition

**WICHTIG:** Dieses Ticket betrifft **NUR Design-Styling**. Das App-Mode System (Normal vs. Examen) ist funktional implementiert und bleibt KOMPLETT erhalten.

### Was geändert wird (Design-Sprache):
- Active-State: Border-bottom entfernen
- Gap zwischen Nav-Items anpassen
- Disabled-Text-Farbe anpassen
- Dropdown-Styling verbessern (Shadow, Radius, Padding)

### Was NICHT geändert wird (Funktionen):
- App-Mode Logic (auto-detection basierend auf Lernplan)
- Menu-Struktur (Startseite, Lernpläne, Kalender, etc.)
- isNavItemDisabled/isNavItemHidden Funktionen
- Mode-Switching Mechanismus
- Lock-Icons für gesperrte Items (in Figma, NICHT implementiert - bleibt so!)
- Mode-Toggle Button (in Figma angedeutet, NICHT implementiert - bleibt so!)

---

## 2. Figma-Referenz

| Element | Node-ID | Beschreibung |
|---------|---------|--------------|
| **Navigation_Mode_exam** | `2390:4331` | Examen-Modus Navigation |
| **Navigation_Mode_normal** | `2607:3307` | Normal-Modus Navigation |
| **Profil Menu (Normal)** | `2404:4294` | Profil-Dropdown Normal Mode |
| **Profil Menu (Examen)** | `2607:4014` | Profil-Dropdown Examen Mode |

---

## 3. Figma Design-Spezifikationen

### 3.1 Nav-Item Active State

```
Font-Weight: 500 (font-medium)
Color: #171717 (text-neutral-900)
Border: KEINE (kein border-bottom!)
```

### 3.2 Nav-Item Inactive State

```
Font-Weight: 300 (font-light)
Color: #737373 (text-neutral-500)
```

### 3.3 Nav-Item Disabled State

```
Font-Weight: 300 (font-light)
Color: #E5E5E5 (text-neutral-200)
Cursor: not-allowed
```

### 3.4 Navigation Container

```
Gap: 4px (gap-1)
Items: centered
Background: white
```

### 3.5 Dropdown Menu

```
Background: white
Border: 1px solid #E5E5E5 (border-neutral-200)
Border-Radius: 8px (rounded-md)
Shadow: shadow-sm
Padding: 8px (p-2)
Min-Width: 228px (min-w-[228px])
```

### 3.6 Dropdown Item

```
Padding: 8px (p-2)
Border-Radius: 6px (rounded-sm)
Title: font-medium text-neutral-950 (#0A0A0A)
Description: font-normal text-neutral-500 (#737373)
Hover: bg-neutral-50
```

---

## 4. Design-Token Mapping

### 4.1 Bereits korrekt

| Element | Figma | Tailwind | Status |
|---------|-------|----------|--------|
| Inactive Text | `#737373` | `text-neutral-500` | ✅ |
| Inactive Weight | `300` | `font-light` | ✅ |
| Active Color | `#171717` | `text-neutral-900` | ✅ |
| Active Weight | `500` | `font-medium` | ✅ |
| Dropdown Border | `#E5E5E5` | `border-neutral-200` | ✅ |
| Dropdown BG | `white` | `bg-white` | ✅ |

### 4.2 Zu ändernde Werte

| Element | Aktuell | Figma | Neue Tailwind-Klasse |
|---------|---------|-------|---------------------|
| Active Border | `border-b border-neutral-900 pb-1` | keine | ❌ Entfernen |
| Nav Gap | `gap-8` (32px) | 4px | `gap-1` |
| Disabled Text | `text-neutral-300` | #E5E5E5 | `text-neutral-200` |
| Dropdown Radius | `rounded-lg` (10px) | 8px | `rounded-md` |
| Dropdown Min-Width | `min-w-[180px]` | 228px | `min-w-[228px]` |
| Dropdown Shadow | keine | shadow-sm | `shadow-sm` |

---

## 5. Konkrete Code-Änderungen

**Datei:** `src/components/layout/navigation.jsx`

### 5.1 Nav Container Gap (Zeile 108)

```jsx
// ALT:
<nav className={`flex items-center gap-8 ${className}`}>

// NEU (Figma: gap-1 = 4px):
<nav className={`flex items-center gap-1 ${className}`}>
```

### 5.2 Active-State Klasse (Zeile 119)

```jsx
// ALT:
const activeClass = 'text-neutral-900 font-medium border-b border-neutral-900 pb-1';

// NEU (Figma: KEIN border-bottom):
const activeClass = 'text-neutral-900 font-medium';
```

### 5.3 Disabled-State Klasse (Zeile 118)

```jsx
// ALT:
const disabledClass = 'text-neutral-300 cursor-not-allowed font-light';

// NEU (Figma: text-neutral-200):
const disabledClass = 'text-neutral-200 cursor-not-allowed font-light';
```

### 5.4 Dropdown Container (Zeile 161)

```jsx
// ALT:
<div className="absolute top-full left-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-sm py-2 min-w-[180px] z-50">

// NEU (Figma: rounded-md, min-w-[228px], p-2):
<div className="absolute top-full left-0 mt-2 bg-white border border-neutral-200 rounded-md shadow-sm p-2 min-w-[228px] z-50">
```

### 5.5 Dropdown Item Active (Zeile 185)

```jsx
// ALT:
className={`block px-4 py-2 text-sm transition-colors ${
  subItem.key === currentPage
    ? 'bg-neutral-100 text-neutral-900 font-medium'
    : 'text-neutral-500 font-light hover:bg-neutral-50 hover:text-neutral-900'
}`}

// NEU (Figma: p-2, rounded-sm):
className={`block p-2 text-sm rounded-sm transition-colors ${
  subItem.key === currentPage
    ? 'bg-neutral-100 text-neutral-950 font-medium'
    : 'text-neutral-500 font-light hover:bg-neutral-50 hover:text-neutral-900'
}`}
```

### 5.6 Coming Soon Item (Zeile 168)

```jsx
// ALT:
<span
  key={subIndex}
  className="block px-4 py-2 text-sm text-neutral-400 cursor-not-allowed"
>

// NEU (Figma: p-2, rounded-sm, text-neutral-200):
<span
  key={subIndex}
  className="block p-2 text-sm text-neutral-200 cursor-not-allowed rounded-sm"
>
```

---

## 6. Visuelle Vergleichstabelle

| Element | Vorher | Nachher |
|---------|--------|---------|
| **Nav Gap** | `gap-8` (32px) | `gap-1` (4px) |
| **Active Border** | `border-b border-neutral-900 pb-1` | ❌ Entfernt |
| **Disabled Color** | `text-neutral-300` | `text-neutral-200` |
| **Dropdown Radius** | `rounded-lg` | `rounded-md` |
| **Dropdown Width** | `min-w-[180px]` | `min-w-[228px]` |
| **Dropdown Item Padding** | `px-4 py-2` | `p-2` |
| **Dropdown Item Radius** | keine | `rounded-sm` |
| **Active Item Text** | `text-neutral-900` | `text-neutral-950` |

---

## 7. Beizubehaltende Funktionen (Touch NOT)

```jsx
// DIESE LOGIK BLEIBT KOMPLETT UNVERÄNDERT:

// App-Mode System (appmode-context.jsx)
✅ isExamMode auto-detection
✅ isNavItemDisabled() Function
✅ isNavItemHidden() Function

// Navigation Menu-Struktur (navigation.jsx)
✅ navItems Array (Startseite, Lernpläne, Kalender, etc.)
✅ verwaltungSubmenu dynamische Generierung
✅ Kalender-Submenu (Woche/Monat)

// Dropdown Toggle Logic
✅ openDropdown State
✅ toggleDropdown() Function
✅ isActive() Function

// Coming Soon Items
✅ comingSoon Badge Rendering
```

---

## 8. Hinweise zur Figma-Abweichung

### Funktionen in Figma die NICHT implementiert werden:

| Figma-Element | Grund für Nicht-Implementierung |
|---------------|--------------------------------|
| Lock-Icon für gesperrte Items | Funktionserweiterung, separates Ticket |
| Submenu-Beschreibungen | Komplexere UI, separates Enhancement |
| "Lernplanung" Submenu | Andere Menu-Struktur, App hat "Lernpläne" als direkten Link |
| Mode-Toggle im Profil | Funktionserweiterung, nicht nur Styling |
| Profil-Dropdown Design | Separates Ticket |

### Abweichungen die bleiben:

| App-Feature | Grund für Beibehaltung |
|-------------|----------------------|
| Menu-Struktur | Funktional anders aufgebaut |
| "Startseite" statt "Start" | Bestehende Bezeichnung |
| Disabled = Hidden in Normal Mode | Bestehende UX-Entscheidung |
| Auto-Mode Detection | Wertvolle Funktionalität |

---

## 9. Akzeptanzkriterien

### 9.1 Styling-Änderungen
- [ ] Nav Gap ist `gap-1` (4px) statt `gap-8`
- [ ] Active-State hat KEINEN border-bottom
- [ ] Disabled-State ist `text-neutral-200`
- [ ] Dropdown hat `rounded-md` und `shadow-sm`
- [ ] Dropdown Min-Width ist `min-w-[228px]`
- [ ] Dropdown Items haben `p-2 rounded-sm`

### 9.2 Funktions-Erhalt
- [ ] **ALLE bestehenden Funktionen arbeiten unverändert**
- [ ] Mode-Detection funktioniert weiterhin
- [ ] Dropdown-Toggle funktioniert weiterhin
- [ ] Navigation zu allen Seiten funktioniert
- [ ] Coming Soon Items werden korrekt angezeigt

---

## 10. Test-Checkliste

### 10.1 Navigation Rendering
- [ ] Alle Nav-Items werden angezeigt
- [ ] Active-Item hat korrektes Styling (kein Border)
- [ ] Inactive-Items haben font-light text-neutral-500
- [ ] Gap zwischen Items ist visuell kleiner

### 10.2 Dropdown-Funktionalität
- [ ] Kalender-Dropdown öffnet korrekt
- [ ] Verwaltung-Dropdown öffnet korrekt
- [ ] Dropdown schließt bei Klick außerhalb
- [ ] Dropdown-Items haben korrektes Styling

### 10.3 Mode-System
- [ ] Examen-Mode: Alle Items aktiv
- [ ] Normal-Mode: Disabled Items korrekt angezeigt
- [ ] Mode-Wechsel ändert verfügbare Items

---

## 11. Abhängigkeiten

| Abhängigkeit | Status |
|--------------|--------|
| `text-neutral-200` | ✅ Tailwind Standard |
| `text-neutral-950` | ✅ In tailwind.config.js definiert |
| `gap-1` (4px) | ✅ Tailwind Standard |
| `rounded-md` (8px) | ✅ In tailwind.config.js definiert |
| `rounded-sm` (6px) | ✅ In tailwind.config.js definiert |
| `shadow-sm` | ✅ In tailwind.config.js definiert |

---

## 12. Risiken

| Risiko | Mitigation |
|--------|------------|
| Gap zu klein (gap-1) | **Angepasst:** gap-6 verwendet (24px) statt gap-1 (4px) - visuell besser |
| Border-Entfernung ändert Active-Erkennung | Active-State bleibt durch Font-Weight erkennbar |
| Dropdown zu breit | 228px ist Figma-Vorgabe, funktional OK |

---

## 13. Korrektur zum alten Ticket

Das ursprüngliche Ticket war **falsch fokussiert**:

> ❌ "Mode-Switching nicht benutzerfreundlich"
> ❌ "Mode-Toggle in Navigation hinzufügen"
> ❌ "Visual Mode-Indicator implementieren"
> ❌ "Seamless Mode-Switching"

**Korrektur:** Diese Features sind FUNKTIONEN, nicht Design-Styling. Das Mode-System funktioniert bereits und wird nicht geändert. Dieses Ticket fokussiert NUR auf CSS/Styling-Anpassungen.

---

## 14. Figma-Analyse Details

### 14.1 Navigation_Mode_exam (2390:4331)
- Menu: Start, Kalender, Lernplanung, Verwaltung, Mentor, Einstellungen
- Alle Items aktiv und klickbar

### 14.2 Navigation_Mode_normal (2607:3307)
- Gleiche Menu-Struktur
- "Lernplan" (unter Lernplanung) mit Lock-Icon, text-neutral-200
- "Übungsklausuren" (unter Verwaltung) mit Lock-Icon, text-neutral-200

**Hinweis:** Die Lock-Icons und die andere Menu-Struktur ("Lernplanung" als Submenu statt "Lernpläne" als direkter Link) sind FUNKTIONEN die in der App anders umgesetzt wurden und bleiben unverändert.
