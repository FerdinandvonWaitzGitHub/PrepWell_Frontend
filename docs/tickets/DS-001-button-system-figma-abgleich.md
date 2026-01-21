# TICKET DS-001: Button-System Figma-Abgleich

**Typ:** Design-System (NUR Styling)
**Priorität:** Hoch
**Status:** ✅ Implementiert
**Erstellt:** 2026-01-15
**Aktualisiert:** 2026-01-16
**Aufwand:** 2-3h

---

## 1. Scope-Definition

**WICHTIG:** Dieses Ticket betrifft **NUR die zentrale Button-Komponente**. Die Button-Varianten werden an Figma angeglichen - keine neuen Funktionen.

### Was geändert wird (Design-Sprache):
- Border-Radius: `rounded` → `rounded-md` (8px)
- Ghost-Variante Text-Farbe
- Default-Variante Shadow hinzufügen
- Size-Definitions anpassen
- Secondary-Variante entfernen (nicht in Figma) + Migration
- Outline-Variante hinzufügen (wird bereits verwendet, fehlt in button.jsx)

### Was NICHT geändert wird:
- Button-Logik (onClick, disabled, type)
- Bestehende Button-Verwendungen in Komponenten
- Keine neuen Varianten hinzufügen

---

## 2. Figma-Referenz

| Button-Typ | Node-ID | Verwendung |
|------------|---------|------------|
| **Ghost** | `2607:3158` | "Neue Aufgabe" Button |
| **Outline (Pill)** | `2405:7368` | "Mentor Quiz überspringen" |
| **Icon (Secondary)** | `2398:4509` | Nav-Buttons (Prev/Next) |
| **Outline (sm)** | `2398:4530` | "Themenliste auswählen" |

---

## 3. Figma Button-Spezifikationen

### 3.1 Ghost Button (Figma: 2607:3158)

```
Background: transparent (white)
Border: none
Text: #737373 (neutral-500), 12px medium
Gap: 8px
Hover: bg-neutral-100
```

### 3.2 Outline/Default Button (Figma: 2398:4530)

```
Background: white
Border: 1px solid #E5E5E5 (neutral-200)
Border-Radius: 8px (rounded-md)
Shadow: shadow-xs (0 1px 2px rgba(0,0,0,0.05))
Text: #0A0A0A (neutral-950), 12px medium
Padding: 8px (py-2 px-2)
```

### 3.3 Icon Button (Figma: 2398:4509)

```
Background: rgba(255,255,255,0.2) OR white
Border: 1px solid #E5E5E5 (neutral-200)
Border-Radius: 8px (rounded-md)
Size: 32x32px (size-8)
```

### 3.4 Primary Button (abgeleitet)

```
Background: #171717 (neutral-900)
Text: #FAFAFA (neutral-50)
Border-Radius: 8px (rounded-md)
Shadow: shadow-xs
```

---

## 4. Design-Token Mapping

### 4.1 Bereits korrekt

| Element | Figma | Tailwind | Status |
|---------|-------|----------|--------|
| Primary BG | `#171717` | `bg-neutral-900` | ✅ |
| Primary Text | `#FAFAFA` | `text-neutral-50` | ✅ |
| Border Color | `#E5E5E5` | `border-neutral-200` | ✅ |
| Default BG | `#FFFFFF` | `bg-white` | ✅ |

### 4.2 Zu ändernde Werte

| Element | Aktuell | Figma | Neue Tailwind-Klasse |
|---------|---------|-------|---------------------|
| Border-Radius (Base) | `rounded` (6px) | 8px | `rounded-md` |
| Ghost Text | `text-neutral-900` | #737373 | `text-neutral-500` |
| Default Shadow | keine | shadow-xs | `shadow-xs` |
| Size sm Text | `text-sm` (14px) | 12px | `text-xs` |
| Size sm Padding | `px-3 py-1.5` | 8px | `px-2 py-2` |

### 4.3 Referenz tailwind.config.js

```js
// Verfügbare Tokens:
borderRadius: {
  'md': '8px',      // Figma Button-Radius
}
boxShadow: {
  'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',  // Figma shadow-xs
}
```

---

## 5. Konkrete Code-Änderungen

**Datei:** `src/components/ui/button.jsx`

### 5.1 Base Styles (Zeile 15)

```jsx
// ALT:
const baseStyles = 'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

// NEU (rounded → rounded-md):
const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
```

### 5.2 Variants (Zeilen 17-23)

```jsx
// ALT:
const variants = {
  default: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50',
  primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
  secondary: 'bg-primary-300 text-neutral-900 hover:bg-primary-400',
  ghost: 'text-neutral-900 hover:bg-neutral-100',
  icon: 'text-neutral-900 hover:bg-neutral-100 p-2',
};

// NEU (Figma-aligned + outline für Kompatibilität):
const variants = {
  default: 'bg-white text-neutral-950 border border-neutral-200 shadow-xs hover:bg-neutral-50',
  primary: 'bg-neutral-900 text-neutral-50 shadow-xs hover:bg-neutral-800',
  outline: 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50',
  ghost: 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100',
  icon: 'text-neutral-700 border border-neutral-200 hover:bg-neutral-100',
};
```

**Änderungen:**
- `default`: `shadow-xs` hinzugefügt, `text-neutral-900` → `text-neutral-950`
- `primary`: `text-white` → `text-neutral-50`, `shadow-xs` hinzugefügt
- `outline`: **NEU** (wie `default` aber ohne `shadow-xs`, für Wizard-Buttons)
- `secondary`: **ENTFERNT** (nicht in Figma) - siehe Migration Section 7
- `ghost`: `text-neutral-900` → `text-neutral-500`
- `icon`: Border hinzugefügt für Konsistenz

### 5.3 Sizes (Zeilen 25-30)

```jsx
// ALT:
const sizes = {
  sm: 'px-3 py-1.5 text-sm h-8',
  default: 'px-4 py-2 text-sm h-10',
  lg: 'px-6 py-3 text-base h-12',
  icon: 'h-8 w-8 p-2',
};

// NEU (Figma-aligned):
const sizes = {
  sm: 'px-2 py-2 text-xs h-8',
  default: 'px-4 py-2 text-sm h-10',
  lg: 'px-5 py-2.5 text-sm h-11',
  icon: 'size-8 p-2',
};
```

**Änderungen:**
- `sm`: `px-3 py-1.5 text-sm` → `px-2 py-2 text-xs` (Figma: 8px padding, 12px text)
- `lg`: `px-6 py-3 text-base h-12` → `px-5 py-2.5 text-sm h-11` (weniger groß)
- `icon`: `h-8 w-8` → `size-8` (modernere Syntax)

---

## 6. Vollständiger neuer Code

```jsx
/**
 * Button component with multiple variants and sizes
 * Figma-aligned design tokens
 */
const Button = ({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    default: 'bg-white text-neutral-950 border border-neutral-200 shadow-xs hover:bg-neutral-50',
    primary: 'bg-neutral-900 text-neutral-50 shadow-xs hover:bg-neutral-800',
    outline: 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50',
    ghost: 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100',
    icon: 'text-neutral-700 border border-neutral-200 hover:bg-neutral-100',
  };

  const sizes = {
    sm: 'px-2 py-2 text-xs h-8',
    default: 'px-4 py-2 text-sm h-10',
    lg: 'px-5 py-2.5 text-sm h-11',
    icon: 'size-8 p-2',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
```

---

## 7. Migration: Varianten-Bereinigung

### 7.1 secondary-Variante entfernen

Die `secondary` Variante wird entfernt. **Gefundene Verwendung:**

| Datei | Zeile | Migration |
|-------|-------|-----------|
| `src/features/lernplan-wizard/components/error-screen.jsx` | 72 | → `default` |

**Konkrete Migration:**

```jsx
// ALT (Zeile 72):
<Button variant="secondary" onClick={onGoBackToMethodSelection} className="w-full">

// NEU:
<Button variant="default" onClick={onGoBackToMethodSelection} className="w-full">
```

### 7.2 outline-Variante hinzufügen (NICHT entfernen!)

Die `outline` Variante wird in **4 Stellen** verwendet, existiert aber NICHT in `button.jsx`:

| Datei | Zeile |
|-------|-------|
| `src/features/lernplan-wizard/components/wizard-layout.jsx` | 152 |
| `src/features/lernplan-wizard/components/success-screen.jsx` | 48 |
| `src/features/lernplan-wizard/components/exit-dialog.jsx` | 60 |
| `src/features/lernplan-wizard/components/error-screen.jsx` | 76 |

**Lösung:** `outline` Variante zur Button-Komponente hinzufügen (wie `default` aber ohne `shadow-xs`).

---

## 8. Visuelle Vergleichstabelle

| Variante | Vorher | Nachher |
|----------|--------|---------|
| **Base** | `rounded` (6px) | `rounded-md` (8px) |
| **default** | Kein Shadow | `shadow-xs` |
| **default Text** | `text-neutral-900` | `text-neutral-950` |
| **primary Text** | `text-white` | `text-neutral-50` |
| **ghost Text** | `text-neutral-900` | `text-neutral-500` |
| **outline** | ❌ Fehlt | `border border-neutral-200` (ohne shadow) |
| **icon** | Kein Border | `border border-neutral-200` |
| **sm Padding** | `px-3 py-1.5` | `px-2 py-2` |
| **sm Text** | `text-sm` (14px) | `text-xs` (12px) |

---

## 9. Akzeptanzkriterien

- [ ] Border-Radius ist `rounded-md` (8px) für alle Buttons
- [ ] Default-Variante hat `shadow-xs`
- [ ] Ghost-Variante hat `text-neutral-500`
- [ ] Primary-Variante hat `text-neutral-50`
- [ ] Icon-Variante hat Border
- [ ] Size `sm` hat `text-xs` und `px-2 py-2`
- [ ] `secondary` Variante ist entfernt
- [ ] `secondary` Verwendung in error-screen.jsx migriert zu `default`
- [ ] `outline` Variante hinzugefügt
- [ ] Keine Regressionen in bestehenden Komponenten (Wizard-Buttons funktionieren)

---

## 10. Test-Checkliste

### 10.1 Button-Komponente
- [ ] Default Button rendert korrekt
- [ ] Primary Button rendert korrekt
- [ ] Outline Button rendert korrekt
- [ ] Ghost Button rendert korrekt
- [ ] Icon Button rendert korrekt
- [ ] Disabled-State funktioniert
- [ ] Hover-States funktionieren

### 10.2 Verwendungsstellen prüfen
- [ ] Dashboard Widgets
- [ ] Wizard Steps
- [ ] Timer Dialogs
- [ ] Navigation Buttons
- [ ] Forms

---

## 11. Hinweise

### Was NICHT in diesem Ticket:

| Figma-Feature | Grund für Nicht-Implementierung |
|---------------|--------------------------------|
| Pill-Shape Button (rounded-full) | Spezialfall, kann per className überschrieben werden |
| Button mit Icon links/rechts | Bereits möglich durch children |
| Destructive/Danger Variante | Nicht in aktuellen Figma-Designs |

### Abweichungen die bleiben:

| App-Feature | Grund für Beibehaltung |
|-------------|----------------------|
| `lg` Size | Wird in einigen Formularen verwendet |
| Focus-Ring | Accessibility-Feature |
| disabled:opacity-50 | Bereits Figma-konform |

---

## 12. Abhängigkeiten

| Abhängigkeit | Status |
|--------------|--------|
| `shadow-xs` | ✅ In tailwind.config.js definiert |
| `rounded-md` | ✅ In tailwind.config.js definiert (8px) |
| `text-neutral-500` | ✅ Tailwind Standard |
| `size-8` | ✅ Tailwind Standard (32px) - siehe Hinweis |

**Hinweis zu `size-8`:** Falls `size-8` nicht funktioniert, alternativ `h-8 w-8` verwenden.

---

## 13. Risiken

| Risiko | Mitigation |
|--------|------------|
| Breaking Change bei secondary | Vorher Suche durchführen, migrieren |
| Ghost zu hell | neutral-500 ist Figma-Vorgabe |
| Buttons zu klein (sm) | Figma-konform, kann per className überschrieben werden |

---

## 14. Korrektur zum alten Ticket

Das ursprüngliche Ticket war **zu breit gefasst**:

> ❌ "Timer-Dialogs verwenden eigene Button-Komponenten"
> ❌ "Wizard-Steps haben eigene Button-Styles"
> ❌ "Custom Button-Komponenten ersetzen"

**Korrektur:** Dieses Ticket fokussiert NUR auf die zentrale `button.jsx`. Die Migration von Custom-Buttons in anderen Komponenten ist ein separates Refactoring-Ticket.
