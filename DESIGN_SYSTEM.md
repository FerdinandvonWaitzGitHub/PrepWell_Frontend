# PrepWell Design System

> Umfassende Design-Dokumentation basierend auf dem Figma-Design (PrepWell WebApp)
> Zuletzt aktualisiert: 2025-12-27

---

## 1. Design-Philosophie

### 1.1 Grundprinzipien

**Minimalismus & Klarheit**
- Reduziertes, cleanes Interface ohne visuelle Ablenkungen
- Fokus auf Inhalt und Funktionalität
- Großzügiger Weißraum für bessere Lesbarkeit

**Neutrales Farbschema**
- Primär Graustufen (Schwarz, Weiß, Neutraltöne)
- Farbe wird gezielt für Kategorisierung eingesetzt (Rechtsgebiete)
- Keine grellen oder ablenkenden Akzentfarben

**Typografische Hierarchie**
- Klare Unterscheidung zwischen Überschriften und Fließtext
- Kontrastreiche Font-Weights (ExtraLight für Titel, Medium/SemiBold für Labels)
- Konsistente Schriftgrößen über alle Komponenten

**Subtile Interaktionen**
- Sanfte Hover-Effekte
- Dezente Schatten für Tiefe
- Keine aggressiven Animationen

---

## 2. Farbsystem

### 2.1 Basis-Farben (Semantic Tokens)

| Token | Hex-Wert | RGB | Verwendung |
|-------|----------|-----|------------|
| `base/primary` | `#171717` | rgb(23, 23, 23) | Primäre Aktionen, aktive Elemente, Checkboxen |
| `base/foreground` | `#0a0a0a` | rgb(10, 10, 10) | Haupttext, Titel |
| `base/secondary` | `#f5f5f5` | rgb(245, 245, 245) | Sekundärer Hintergrund, Tags, expanded Tasks |
| `base/secondary-foreground` | `#171717` | rgb(23, 23, 23) | Text auf sekundärem Hintergrund |
| `base/muted-foreground` | `#737373` | rgb(115, 115, 115) | Sekundärtext, Beschreibungen, Placeholder |
| `base/ring` | `#a3a3a3` | rgb(163, 163, 163) | Sehr heller Text (Beschreibungen) |
| `base/input` | `#e5e5e5` | rgb(229, 229, 229) | Input-Borders, inaktive Elemente |
| `base/border` | `#e5e5e5` | rgb(229, 229, 229) | Rahmen, Trennlinien |
| `base/popover` | `#ffffff` | rgb(255, 255, 255) | Popover/Dropdown-Hintergrund |
| `base/popover-foreground` | `#0a0a0a` | rgb(10, 10, 10) | Popover-Text |
| `base/accent-foreground` | `#171717` | rgb(23, 23, 23) | Aktiver Navigation-Text |

### 2.2 Graustufen-Skala

```
#ffffff  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Weiß (Hintergrund)
#f5f5f5  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Gray-50 (Sekundärer BG)
#efefef  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Gray-100
#e5e5e5  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Gray-200 (Borders)
#a3a3a3  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Gray-400 (Ring/Light Text)
#737373  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Gray-500 (Muted Text)
#171717  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Gray-900 (Primary)
#0a0a0a  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Gray-950 (Foreground)
```

### 2.3 Rechtsgebiet-Farben (Kategorisierung)

| Rechtsgebiet | Hintergrund | Text | Tailwind-Klassen |
|--------------|-------------|------|------------------|
| Öffentliches Recht | `#d1fae5` | `#065f46` | `bg-emerald-100 text-emerald-800` |
| Zivilrecht | `#dbeafe` | `#1e40af` | `bg-blue-100 text-blue-800` |
| Strafrecht | `#fee2e2` | `#991b1b` | `bg-red-100 text-red-800` |
| Querschnittsrecht | `#ede9fe` | `#5b21b6` | `bg-violet-100 text-violet-800` |

---

## 3. Typografie

### 3.1 Schriftfamilie

**Primäre Schrift:** `DM Sans`
- Google Font: https://fonts.google.com/specimen/DM+Sans
- Fallback: `sans-serif`
- Variable Font mit optischer Größenanpassung (`fontVariationSettings: "'opsz' 14"`)

### 3.2 Font-Weights

| Weight | Wert | CSS | Verwendung |
|--------|------|-----|------------|
| ExtraLight | 200 | `font-extralight` | Große Überschriften (H1) |
| Light | 300 | `font-light` | Navigation (inaktiv) |
| Regular | 400 | `font-normal` | Fließtext, Beschreibungen |
| Medium | 500 | `font-medium` | Labels, Buttons, Navigation (aktiv) |
| SemiBold | 600 | `font-semibold` | Tags, Badges, Prioritäts-Indikatoren |

### 3.3 Schriftgrößen & Line-Heights

| Name | Größe | Line-Height | Verwendung |
|------|-------|-------------|------------|
| `text-xs` | 12px | 16px (1.33) | Tags, Badges, kleine Labels |
| `text-sm` | 14px | 20px (1.43) | Fließtext, Aufgaben, Beschreibungen |
| `text-base` | 16px | 24px (1.5) | Standard-Body-Text |
| `text-lg` | 18px | 28px (1.56) | Sekundäre Überschriften |
| `text-xl` | 20px | 28px (1.4) | Prioritäts-Indikatoren ("!") |
| `text-2xl` | 24px | 1 (24px) | Hauptüberschriften (Titel) |

### 3.4 Typografie-Stile (Kombinationen)

```css
/* H1 - Große Überschrift */
.heading-1 {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200; /* ExtraLight */
  font-size: 24px;
  line-height: 1;
  color: #0a0a0a;
}

/* H2 - Sekundäre Überschrift */
.heading-2 {
  font-family: 'DM Sans', sans-serif;
  font-weight: 500; /* Medium */
  font-size: 14px;
  line-height: 20px;
  color: #0a0a0a;
}

/* Body - Fließtext */
.body-text {
  font-family: 'DM Sans', sans-serif;
  font-weight: 400; /* Regular */
  font-size: 14px;
  line-height: 20px;
  color: #737373;
}

/* Muted - Beschreibungen */
.muted-text {
  font-family: 'DM Sans', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #a3a3a3;
}

/* Label - Tags/Badges */
.label-text {
  font-family: 'DM Sans', sans-serif;
  font-weight: 600; /* SemiBold */
  font-size: 12px;
  line-height: 16px;
  color: #171717;
}

/* Navigation - Aktiv */
.nav-active {
  font-family: 'DM Sans', sans-serif;
  font-weight: 500; /* Medium */
  font-size: 14px;
  line-height: 20px;
  color: #171717;
}

/* Navigation - Inaktiv */
.nav-inactive {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300; /* Light */
  font-size: 14px;
  line-height: 20px;
  color: #737373;
}
```

---

## 4. Spacing-System

### 4.1 Basis-Einheiten

Das Spacing basiert auf einem **4px Raster**:

| Token | Wert | Tailwind |
|-------|------|----------|
| `spacing-0.5` | 2px | `p-0.5` |
| `spacing-1` | 4px | `p-1` |
| `spacing-1.5` | 6px | `p-1.5` |
| `spacing-2` | 8px | `p-2` |
| `spacing-2.5` | 10px | `p-2.5` |
| `spacing-3` | 12px | `p-3` |
| `spacing-4` | 16px | `p-4` |
| `spacing-5` | 20px | `p-5` |
| `spacing-6` | 24px | `p-6` |

### 4.2 Komponenten-Spacing

| Kontext | Wert | Beschreibung |
|---------|------|--------------|
| Container Padding | 25px | Seitlicher Abstand in Panels |
| Container Padding (vertikal) | 23px | Oberer/unterer Abstand |
| Element Gap (klein) | 4px | Zwischen Icon und Text |
| Element Gap (mittel) | 8-10px | Zwischen Elementen in einer Zeile |
| Element Gap (groß) | 13-18px | Zwischen Sections |
| Task-Item Padding | 10px | Innenabstand von Task-Boxen |
| Button Padding | 16px horizontal, 8px vertikal | Standard-Button |

---

## 5. Border-Radius (Rundungen)

### 5.1 Radius-Skala

| Token | Wert | Tailwind | Verwendung |
|-------|------|----------|------------|
| `rounded-sm` | 6px | `rounded-md` | Menu-Links, kleine Elemente |
| `rounded-md` | 8px | `rounded-lg` | Buttons, Inputs, Cards, Tags |
| `rounded-lg` | 12px | `rounded-xl` | Große Cards, Panels |
| `rounded-full` | 9999px | `rounded-full` | Scrollbar, Pills, Avatare |

### 5.2 Anwendungsbeispiele

```
┌─────────────────────────────────────┐
│  Container (rounded-lg / 12px)      │
│  ┌───────────────────────────────┐  │
│  │  Card (rounded-md / 8px)      │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Button (rounded-md/8px) │  │  │
│  │  └─────────────────────────┘  │  │
│  │  ┌────┐                       │  │
│  │  │Tag │ (rounded-md / 8px)    │  │
│  │  └────┘                       │  │
│  └───────────────────────────────┘  │
│                           ████████  │  ← Scrollbar (rounded-full)
└─────────────────────────────────────┘
```

---

## 6. Schatten (Shadows)

### 6.1 Shadow-Tokens

| Name | CSS | Verwendung |
|------|-----|------------|
| `shadow-xs` | `0px 1px 2px 0px rgba(0,0,0,0.05)` | Checkboxen, kleine Elemente |
| `shadow-sm` | `0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)` | Dropdowns, Popovers |
| `shadow-md` | `0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)` | Cards (hover) |

### 6.2 Anwendung

- **Dropdowns/Popovers:** `shadow-sm` + Border
- **Checkboxen:** `shadow-xs`
- **Cards (default):** Kein Schatten oder `shadow-sm`
- **Cards (hover):** `shadow-md`

---

## 7. Borders

### 7.1 Border-Stile

| Kontext | Breite | Farbe | Stil |
|---------|--------|-------|------|
| Standard | 1px | `#e5e5e5` | solid |
| Input-Fokus | 2px | `#171717` | solid |
| Divider | 1px | `#e5e5e5` | solid |

### 7.2 Border-Anwendung

```css
/* Standard Border */
border: 1px solid #e5e5e5;

/* Kein Border (filled Background) */
background: #f5f5f5;
border: none;

/* Fokus-State */
border: 2px solid #171717;
```

---

## 8. Komponenten-Spezifikationen

### 8.1 Buttons

**Ghost Button (Text only)**
```css
.button-ghost {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #737373;
  background: transparent;
}
.button-ghost:hover {
  background: #f5f5f5;
  color: #171717;
}
```

**Icon Button**
```css
.button-icon {
  width: 32px;
  height: 32px;
  padding: 2px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Text + Icon Button**
```css
.button-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  font-size: 12px;
  font-weight: 500;
  color: #737373;
}
```

### 8.2 Tags/Badges

```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 8px;
  background: #f5f5f5;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: #171717;
}
```

### 8.3 Checkbox

```css
.checkbox {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #e5e5e5;
  background: white;
  box-shadow: 0px 1px 2px 0px rgba(0,0,0,0.05);
}

.checkbox:checked {
  background: #171717;
  border-color: #171717;
}

.checkbox:checked::after {
  /* Weißer Checkmark */
  color: white;
}
```

### 8.4 Task-Item

**Variante 1: Mit Beschreibung (Expanded)**
```css
.task-expanded {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  max-width: 548px;
}
```

**Variante 2: Ohne Beschreibung (Collapsed)**
```css
.task-collapsed {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
}
```

### 8.5 Navigation

**Nav Item - Aktiv**
```css
.nav-item-active {
  padding: 8px 16px;
  height: 36px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #171717;
}
```

**Nav Item - Inaktiv**
```css
.nav-item-inactive {
  padding: 8px 16px;
  height: 36px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 300;
  color: #737373;
}
```

**Dropdown/Popover**
```css
.popover {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0px 1px 3px 0px rgba(0,0,0,0.1),
              0px 1px 2px -1px rgba(0,0,0,0.1);
}
```

### 8.6 Input Fields

```css
.input {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  color: #0a0a0a;
  background: white;
}

.input:focus {
  outline: none;
  border-color: #171717;
  box-shadow: 0 0 0 1px #171717;
}

.input::placeholder {
  color: #a3a3a3;
}
```

---

## 9. Icons

### 9.1 Icon-Größen

| Größe | Wert | Verwendung |
|-------|------|------------|
| xs | 12px | Chevrons in Navigation |
| sm | 14px | Inline-Icons |
| md | 16px | Standard-Icons in Buttons |
| lg | 20px | Größere Icons |
| xl | 24px | Header-Icons |

### 9.2 Icon-Farben

| State | Farbe | Hex |
|-------|-------|-----|
| Default | Muted | `#737373` |
| Inactive | Light | `#e5e5e5` |
| Active | Primary | `#171717` |
| Hover | Foreground | `#0a0a0a` |
| Destructive | Red | `#dc2626` |

### 9.3 Icon-Stroke

- Stroke-Width: `2px` (Standard)
- Stroke-Linecap: `round`
- Stroke-Linejoin: `round`

---

## 10. Layout-Patterns

### 10.1 Dashboard-Grid

```
┌─────────────────────────────────────────────────────────┐
│  Header (67px)                                          │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│  Lernplan-Panel      │  Zeitplan-Panel                  │
│  (680px)             │  (680px)                         │
│                      │                                  │
│  - Tags              │  - Header + Badge                │
│  - Titel             │  - Day Navigation                │
│  - Beschreibung      │  - Timeline (8-16 Uhr)           │
│  - Aufgaben          │  - Lernblöcke                    │
│                      │                                  │
│  [730px max-height]  │  [730px max-height]              │
│                      │                                  │
└──────────────────────┴──────────────────────────────────┘
```

### 10.2 Panel-Struktur

```
┌─────────────────────────────────────────────┐
│  Content Area (648px)           │ Scrollbar │
│                                 │   (30px)  │
│  ┌───────────────────────────┐  │     │     │
│  │ Section Header            │  │     █     │
│  ├───────────────────────────┤  │     █     │
│  │ Content                   │  │     █     │
│  │                           │  │           │
│  │                           │  │           │
│  └───────────────────────────┘  │           │
│                                 │           │
└─────────────────────────────────────────────┘
```

---

## 11. Interaktions-States

### 11.1 State-Übersicht

| Element | Default | Hover | Active | Disabled |
|---------|---------|-------|--------|----------|
| Button (Ghost) | `#737373` | `bg:#f5f5f5` `#171717` | `bg:#e5e5e5` | `opacity:0.5` |
| Link | `#737373` | `#171717` | `#0a0a0a` | `#a3a3a3` |
| Checkbox | `border:#e5e5e5` | `border:#a3a3a3` | `bg:#171717` | `opacity:0.5` |
| Task | `bg:white` | `bg:#fafafa` | - | `opacity:0.5` |

### 11.2 Transitions

```css
.transition-default {
  transition: all 150ms ease-in-out;
}

.transition-colors {
  transition: color 150ms, background-color 150ms, border-color 150ms;
}

.transition-opacity {
  transition: opacity 150ms ease-in-out;
}
```

---

## 12. Responsive Breakpoints

| Name | Min-Width | Verwendung |
|------|-----------|------------|
| `sm` | 640px | Mobile Landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large Desktop |
| `2xl` | 1536px | Extra Large |

---

## 13. Tailwind-Konfiguration

```javascript
// tailwind.config.js (empfohlen)
module.exports = {
  theme: {
    extend: {
      colors: {
        base: {
          primary: '#171717',
          foreground: '#0a0a0a',
          secondary: '#f5f5f5',
          'secondary-foreground': '#171717',
          'muted-foreground': '#737373',
          ring: '#a3a3a3',
          input: '#e5e5e5',
          border: '#e5e5e5',
          popover: '#ffffff',
          'popover-foreground': '#0a0a0a',
          'accent-foreground': '#171717',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      fontWeight: {
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '1' }],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
      },
      spacing: {
        '4.5': '18px',
        '6.25': '25px',
        '5.75': '23px',
      },
      boxShadow: {
        xs: '0px 1px 2px 0px rgba(0,0,0,0.05)',
        sm: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
      },
    },
  },
};
```

---

## 14. Quick Reference - Häufige Patterns

### Titel
```jsx
<h1 className="text-2xl font-extralight text-neutral-950 leading-none">
  Titel
</h1>
```

### Beschreibung
```jsx
<p className="text-sm font-normal text-neutral-400 leading-5">
  Beschreibung
</p>
```

### Tag/Badge
```jsx
<span className="inline-flex px-2 py-0.5 bg-neutral-100 text-neutral-900 text-xs font-semibold rounded-lg">
  Tag
</span>
```

### Button (Ghost)
```jsx
<button className="flex items-center gap-2 h-8 px-4 text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
  Button
</button>
```

### Task-Item (Collapsed)
```jsx
<div className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg">
  <div className="flex items-center gap-2">
    <input type="checkbox" className="w-4 h-4 rounded border-neutral-200" />
    <span className="text-sm font-medium text-neutral-900">Task</span>
  </div>
</div>
```

---

## Changelog

| Datum | Version | Änderungen |
|-------|---------|------------|
| 2025-12-27 | 1.0.0 | Initiale Design-System Dokumentation |
