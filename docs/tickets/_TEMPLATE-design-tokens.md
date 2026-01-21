# 🎨 Standard Design-Token-Mapping Template

Für alle Design-Tickets im PrepWell-Frontend sollte diese Sektion nach der Beschreibung eingefügt werden:

## 🎨 Design-Token-Mapping (Standard)

### **✅ Bestehende tailwind.config.js bereits Figma-aligned:**

```js
// Verfügbare Design-Tokens (KEINE Änderungen nötig):
colors: {
  gray: {
    200: '#E5E5E5',  // Border/Input (Figma)
    500: '#737373',  // Muted Text (Figma)
    900: '#171717',  // Primary Black (Figma)
    950: '#0A0A0A',  // Main Text (Figma)
  },
  neutral: {
    50: '#FAFAFA',   // White Text on Black (Figma)
  }
}

// [COMPONENT]-spezifische Klassen:
// bg-gray-900 text-neutral-50  → Primary Buttons/Active States
// text-gray-950               → Main Text/Headlines  
// text-gray-500               → Muted Text/Descriptions
// border-gray-200             → Input Fields/Borders
// shadow-xs                   → Subtle Shadows (bereits definiert)
```

## Warum diese Sektion?

1. **Konsistenz:** Alle Tickets verwenden dieselben Design-Tokens
2. **Effizienz:** Keine redundanten tailwind.config.js-Änderungen
3. **Figma-Alignment:** Zeigt, dass Config bereits korrekt ist
4. **Aufwands-Reduktion:** Implementierungszeit wird realistischer geschätzt
5. **Standard-Vorgehen:** Verhindert "neue Klassen definieren" Ansätze

## Verwendung:

1. **Nach der Beschreibung einfügen**
2. **[COMPONENT] durch den spezifischen Komponentennamen ersetzen**
3. **Komponent-spezifische Klassen-Beispiele anpassen**
4. **Bei Phase 4 "Styling-System Integration" auf diese Sektion verweisen**

## Beispiele für verschiedene Komponenten:

### Navigation:
```js
// Navigation-spezifische Klassen:
// bg-gray-900 text-neutral-50  → Active Nav Items
// text-gray-500               → Inactive Nav Items  
// border-gray-200             → Dividers/Borders
```

### Buttons:
```js
// Button-spezifische Klassen:
// bg-gray-900 text-neutral-50  → Primary Buttons
// border-gray-200 text-gray-950 → Outline Buttons
// text-gray-500               → Ghost/Link Buttons
// shadow-xs                   → Button Shadow
```

### Forms/Auth:
```js
// Auth-spezifische Klassen:
// bg-gray-900 text-neutral-50  → CTA Buttons ("Anmelden")
// border-gray-200             → Input Fields
// text-gray-500               → Placeholder Text
// text-gray-950               → Labels/Main Text
```

### Widgets/Cards:
```js
// Widget-spezifische Klassen:
// text-gray-950              → Widget Titles
// text-gray-500              → Widget Meta-Info
// border-gray-200            → Card Borders
// bg-gray-900                → Progress Indicators
```