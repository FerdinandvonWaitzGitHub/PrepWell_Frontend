# Ticket 27: Figma-Design-Analyse - Themenliste Editor

**Datum:** 21.01.2026
**Status:** Offen
**Priorität:** Mittel
**Figma-Link:** https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2771-964&m=dev
**Betroffene Dateien:**
- `src/pages/themenliste-editor.jsx`
- `src/features/themenliste/components/themenliste-header.jsx`
- `src/features/themenliste/components/themenliste-footer.jsx`
- `src/features/themenliste/components/themen-navigation.jsx`
- `src/features/themenliste/components/thema-detail.jsx`
- `tailwind.config.js` (ggf. Erweiterung)

---

## Ziel

Vorsichtige Annäherung der implementierten Themenliste-Editor-Seite an das Figma-Design, **ohne bestehende Funktionen zu entfernen**.

**Wichtig:** Alle Styling-Änderungen sollen über `tailwind.config.js` erfolgen, nicht über Hardcoded-Werte.

---

## IGNORIEREN - Debug-Elemente im Figma

Die folgenden Elemente im Figma-Design sind **Debug-Markierungen** und dürfen **NICHT** implementiert werden:

- `border border-[red] border-solid` auf `Main_Content_Wrapper` (node 2771:970)
- `border border-[red] border-solid` auf `Thema_und_Aufgaben` (node 2619:6022)

Diese roten Rahmen sind nur für Design-Zwecke sichtbar.

---

## Figma-Design Screenshot

![Figma Design](https://www.figma.com/api/mcp/asset/c100970e-111a-4469-8f2e-c383fac6ddd0)

---

## Struktur-Vergleich

### Tailwind-Config Mapping

Die `tailwind.config.js` enthält bereits viele Figma-Werte. Hier das Mapping:

| Figma-Wert | Tailwind-Config | Verfügbar? |
|------------|-----------------|------------|
| `#1E3A8A` (Badge bg) | `blue-900` | ✅ Ja |
| `#DBEAFE` (Badge text) | `blue-50` | ✅ Ja |
| `#3e596b` (Primary Button) | - | ❌ **Hinzufügen** |
| `font-weight: 200` | `font-extralight` | ✅ Ja |
| `font-weight: 300` | `font-light` | ✅ Ja |
| `font-weight: 500` | `font-medium` | ✅ Ja |
| `font-weight: 600` | `font-semibold` | ✅ Ja |
| `48px` (H1 Titel) | `text-5xl` | ❌ **Hinzufügen** |
| `24px` (Thema Titel) | `text-2xl` | ✅ Ja |
| `14px` (Body) | `text-sm` | ✅ Ja |
| `12px` (Badge) | `text-xs` | ✅ Ja |
| `#737373` (muted) | `neutral-500` | ✅ Ja |
| `#A3A3A3` (ring/light) | `neutral-400` | ✅ Ja |
| `#E5E5E5` (border) | `neutral-200` | ✅ Ja |
| `#F5F5F5` (selected bg) | `neutral-100` | ✅ Ja |
| `rounded-md (8px)` | `rounded-md` | ✅ Ja |
| `rounded-full (28px)` | `rounded-full` / `rounded-3xl` | ✅ Ja |

**Benötigte Erweiterungen in tailwind.config.js:**

```javascript
// In theme.extend.fontSize hinzufügen:
'5xl': ['48px', { lineHeight: '48px' }],  // Figma H1 Title

// In theme.extend.colors hinzufügen:
'brand': {
  primary: '#3e596b',  // Figma Primary Button
}
```

---

### 1. Gesamtlayout

| Aspekt | Figma-Design | Aktuelle Implementierung | Abweichung |
|--------|--------------|--------------------------|------------|
| **Layout-Typ** | Zwei-Panel (links: Navigation, rechts: Detail) | Zwei-Panel (40%/60%) | Ähnlich |
| **Breitenverhältnis** | ~30% / ~70% (geschätzt) | 40% / 60% | Leichte Anpassung nötig |
| **Hintergrund** | Weiß | neutral-50 | Anpassung |
| **Scrollbar** | Custom Scrollbar rechts außen | Browser-native | Optional |

---

### 2. Header-Bereich (themenliste-header.jsx)

| Aspekt | Figma-Design | Aktuelle Implementierung | Aktion |
|--------|--------------|--------------------------|--------|
| **Badge-Position** | Zentriert oberhalb Titel | Links oben mit Pencil-Icon daneben | **Anpassen** |
| **Badge-Styling** | `bg-blue-900 text-blue-100 rounded-md` | `bg-blue-100 text-blue-700` (je nach RG) | **Anpassen** |
| **Pencil-Icon** | Neben Badge (neutral-400) | Neben Badge-Row | Beibehalten |
| **Titel** | Zentriert, 48px extralight | Links, 24px font-extralight | **Anpassen** |
| **Titel-Placeholder** | "Titel der Themenliste" | "Titel der Themenliste" | OK |
| **Beschreibung** | Zentriert, 14px light, neutral-400, max-width 900px | Links, 14px, neutral-400 | **Anpassen** |
| **Trennlinie** | 1px horizontal line unter Header | `<hr className="border-neutral-200">` | OK |

**Spezifische Figma-Werte:**
- Titel: `font-extralight (200)`, `48px`, `line-height: 48px`
- Beschreibung: `font-light (300)`, `14px`, `line-height: 20px`, `color: #737373`
- Badge: `font-semibold (600)`, `12px`, `bg: #1e3a8a`, `text: #dbeafe`, `rounded-md (8px)`

---

### 3. Linke Navigation (themen-navigation.jsx)

| Aspekt | Figma-Design | Aktuelle Implementierung | Aktion |
|--------|--------------|--------------------------|--------|
| **Container-Typ** | NavigationMenu/Popover Card | Volle Höhe Sidebar | **Vereinfachen** (optional) |
| **Container-Styling** | `border border-neutral-200 rounded-md shadow-sm` | `border-r border-neutral-200` | **Anpassen** |
| **Max-Breite** | 350px | 40% der Seite | Anpassen |
| **Item-Struktur** | Flache Liste: Thema → Beschreibung | Verschachtelt: RG → URG → (Kap) → Thema | **Beibehalten** (Funktion!) |
| **Selektiertes Item** | `bg-neutral-100` (grauer Hintergrund) | `bg-blue-50` | **Anpassen** |
| **Hover** | Kein expliziter Hover-State | `hover:bg-neutral-50` | OK |
| **Delete-Icon** | Rechts im Item, neutral-400 | Opacity-0, erscheint bei Hover | OK |
| **+ Neues Thema** | Mit Plus-Icon, `font-medium 14px` | Mit Plus-Icon | OK |

**WICHTIG:** Die verschachtelte Hierarchie (RG → URG → Kapitel → Thema) ist eine Kernfunktion und darf NICHT entfernt werden! Das Figma-Design zeigt eine vereinfachte Ansicht.

---

### 4. Rechter Detail-Bereich (thema-detail.jsx)

| Aspekt | Figma-Design | Aktuelle Implementierung | Aktion |
|--------|--------------|--------------------------|--------|
| **Thema-Titel** | 24px extralight | 20px (xl) font-medium | **Anpassen** |
| **Beschreibung** | 14px, neutral-400 | 14px, neutral-500 | OK |
| **Vertikaler Balken** | 5px breit, Rechtsgebiet-Farbe (Frame4) | Nicht vorhanden | **Hinzufügen** |
| **Aufgaben-Container** | Mit linkem Farbbalken verbunden | Ohne Farbbalken | **Hinzufügen** |
| **Aufgabe-Item** | Border, px-10 py-5, Checkbox links | p-3, bg-white rounded-lg border | Anpassen |
| **Checkbox** | 16x16, neutral-200 border, rounded-sm (4px) | 20x20 div, rounded, border-neutral-300 | **Anpassen** |
| **Priorität-Anzeige** | Zwei "!" Buttons nebeneinander | Ein Toggle-Button (cycles) | **Beibehalten** (Funktion!) |
| **Delete-Button** | Icon-only, neutral-200 | Opacity-0, erscheint bei Hover | OK |
| **+ Neue Aufgabe** | `Plus-Icon + "Neue Aufgabe"`, 12px medium, neutral-500 | `Plus-Icon + Text`, dashed border | **Anpassen** |

**Spezifische Figma-Werte für Aufgabe:**
- Aufgabe-Box: `border border-neutral-200 rounded-md (8px)` px-10 py-5
- Checkbox: `16x16`, `border: 1px`, `rounded: 4px`, `shadow-xs`
- Text: `font-medium (500)`, `14px`

---

### 5. Footer-Bereich (themenliste-footer.jsx)

| Aspekt | Figma-Design | Aktuelle Implementierung | Aktion |
|--------|--------------|--------------------------|--------|
| **Layout** | Links: Archivieren | Rechts: Abbrechen, Speichern | Links: Archivieren | Rechts: Status, Abbrechen, Fertig | Anpassen |
| **Archiv-Button** | `"Lernplan archivieren"` + Archive-Icon, rounded-full (28px) | `"Archivieren"` + Icon, rounded-3xl | **Text anpassen** |
| **Abbrechen** | Outline, `font-light (300)`, rounded-full (28px) | Border, font-medium, rounded-3xl | Anpassen |
| **Primary Button** | `"Speichern"` + Check-Icon, `bg-#3e596b`, rounded (22px) | `"Fertig"` + Check-Icon, bg-blue-600, rounded-3xl | **Text + Farbe** |
| **Auto-Save Status** | Nicht sichtbar | Loader/Check/X mit Text | **Beibehalten** (UX!) |

**Spezifische Figma-Werte:**
- Archiv-Button: `border: neutral-200`, `text: neutral-950`, `font-light (300) 14px`, `rounded: 28px`, `px-20 py-10`
- Primary Button: `bg: #3e596b`, `text: white`, `font-light (300) 14px`, `rounded: 22px`

---

## Prioritäten für die Implementierung

### Hohe Priorität (visuelle Nähe ohne Funktionsverlust)

1. **Header zentrieren**
   - Titel auf 48px extralight setzen
   - Badge und Titel zentrieren
   - Beschreibung zentrieren mit max-width

2. **Footer-Texte anpassen**
   - "Archivieren" → "Lernplan archivieren"
   - "Fertig" → "Speichern"
   - Primary-Button-Farbe: `bg-[#3e596b]`

3. **Detail-Panel: Vertikaler Farbbalken**
   - Farbbalken links vom Aufgaben-Container hinzufügen
   - Farbe basierend auf Rechtsgebiet

### Mittlere Priorität (Styling-Feinheiten)

4. **Selektionsstatus in Navigation**
   - `bg-blue-50` → `bg-neutral-100`

5. **Aufgaben-Styling**
   - Checkbox-Größe: 16x16
   - Padding anpassen

6. **Button-Styling**
   - Rounded-Werte anpassen
   - Font-weights anpassen

### Niedrige Priorität (Nice-to-have)

7. **Custom Scrollbar** (optional)
8. **Exakte Spacing-Werte** (px-genau)
9. **Shadow-Effekte**

---

## Zu beachtende Funktionen (NICHT ENTFERNEN!)

Die folgenden Funktionen sind in der aktuellen Implementierung vorhanden und müssen erhalten bleiben:

1. **Verschachtelte Hierarchie** (RG → URG → Kapitel → Thema)
2. **Auto-Save mit Status-Anzeige**
3. **Draft-Persistenz (localStorage + Supabase)**
4. **Delete-Confirmation-Dialoge**
5. **Cancel-Confirmation-Dialog**
6. **Draft-Resume-Dialog**
7. **Kapitel-Ebene-Unterstützung** (Jura)
8. **Prioritäts-Toggle** (low/medium/high)
9. **Inline-Editing** für Titel und Beschreibung

---

## Implementierungsschritte

### Phase 0: Tailwind-Config erweitern
```javascript
// tailwind.config.js
// In theme.extend hinzufügen:

fontSize: {
  // Bestehende Werte...
  '5xl': ['48px', { lineHeight: '48px' }],  // NEU: Figma H1 Title
},

colors: {
  // Bestehende Werte...
  brand: {
    primary: '#3e596b',  // NEU: Figma Primary Button
  },
},
```

### Phase 1: Header-Anpassung
```jsx
// themenliste-header.jsx
// Änderungen (nur Tailwind-Klassen):
// 1. Container: text-center statt text-left
// 2. Titel: text-5xl font-extralight (nutzt neue Config)
// 3. Badge: bg-blue-900 text-blue-50 (existiert bereits in Config)
// 4. Beschreibung: max-w-3xl mx-auto (Tailwind Standard)
```

### Phase 2: Footer-Anpassung
```jsx
// themenliste-footer.jsx
// Änderungen:
// 1. Archiv-Text: "Lernplan archivieren"
// 2. Primary-Button-Text: "Speichern"
// 3. Primary-Button-Farbe: bg-brand-primary (nutzt neue Config)
// 4. Auto-Save-Status: Beibehalten!
```

### Phase 3: Detail-Panel
```jsx
// thema-detail.jsx
// Änderungen:
// 1. Vertikaler Farbbalken hinzufügen (Rechtsgebiet-Farbe aus Context)
// 2. Thema-Titel: text-2xl font-extralight (existiert in Config)
// 3. Checkbox-Größe: w-4 h-4
```

### Phase 4: Navigation-Styling
```jsx
// themen-navigation.jsx
// Änderungen:
// 1. Selektiert: bg-neutral-100 statt bg-blue-50 (existiert in Config)
// 2. Container: max-w-sm (Tailwind Standard ~384px, nah an 350px)
```

---

## Akzeptanzkriterien

- [ ] Header ist zentriert mit korrekter Typografie
- [ ] Badge verwendet Figma-Farben
- [ ] Footer-Buttons haben korrekten Text
- [ ] Primary-Button hat Figma-Farbe #3e596b
- [ ] Vertikaler Farbbalken im Detail-Panel
- [ ] Alle bestehenden Funktionen funktionieren weiterhin
- [ ] Auto-Save-Status bleibt sichtbar
- [ ] Verschachtelte Navigation funktioniert
- [ ] Delete/Cancel-Dialoge funktionieren
- [ ] Draft-Handling funktioniert

---

## Risikobewertung

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|--------|-------------------|------------|------------|
| Funktionsverlust | Niedrig | Hoch | Nur CSS/Styling ändern |
| Layout-Bruch | Mittel | Mittel | Schrittweise Änderungen |
| Mobile-Darstellung | Niedrig | Niedrig | Responsive testen |

---

## Testplan

1. **Vor jeder Änderung:**
   - Themenliste erstellen
   - Thema hinzufügen
   - Aufgabe hinzufügen
   - Speichern testen

2. **Nach jeder Änderung:**
   - Visuelle Prüfung gegen Figma
   - Alle Funktionen erneut testen
   - Browser-Refresh und Draft-Resume testen
