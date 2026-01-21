# TICKET WZ-001: Lernplan-Wizard Design-Token-Alignment

**Typ:** Design-Anpassung (NUR Styling)
**Priorität:** Niedrig
**Status:** Implementierung-bereit
**Erstellt:** 2026-01-15
**Aktualisiert:** 2026-01-16
**Aufwand:** 30min-1h

---

## 1. Scope-Definition

**WICHTIG:** Dieses Ticket betrifft **NUR Design-Token-Alignment**. Der Lernplan-Wizard ist funktional sehr umfangreich implementiert (22 Schritte, Multi-Path System) - alle Funktionen bleiben KOMPLETT erhalten.

### Was geändert wird (Design-Tokens):
- Title Color: `text-neutral-900` → `text-neutral-950`
- Border Color: `border-neutral-100` → `border-neutral-200`
- Outline Color: `outline-slate-600` → `outline-neutral-900` (slate nicht in tailwind.config.js!)

### Was NICHT geändert wird (Funktionen):
- Mobile-Optimierung (NEW FEATURE, nicht Styling!)
- Tablet-Layout (NEW FEATURE, nicht Styling!)
- Multi-Path System (Manual, Template, Automatic, AI)
- 22 Schritte funktional
- Wizard-Context State Management
- Calendar-Integration
- LocalStorage Draft-Speicherung

---

## 2. Figma-Referenz & Analyse-Ergebnisse

### 2.1 Gefundene Figma-Screens (Lernplanerstellung Canvas)

| Element | Node-ID | Beschreibung |
|---------|---------|--------------|
| **Lernplan_Prozess_Base** (Manual) | `2660:1445` | URG-Auswahl Screen (Manual Path) |
| **Lernplan_Prozess_Base** (Template) | `2659:9807` | Öffentliche Lernpläne Browser |
| **Schritt_7_Alt_2_header** | `2434:5276` | Header-Fragment innerhalb Themenliste |
| **Themenliste** | `2398:4526` | Dashboard-Widget mit Wizard-Fragmenten |

### 2.2 Extrahierte Design-Spezifikationen aus Lernplan_Prozess_Base

**Title (H1) - Wizard Step Header:**
```
Font-Size: 48px (text-5xl)
Font-Weight: extralight (200)
Color: #0A0A0A (neutral-950)
Line-Height: 48px
Text-Align: center
```

**Description:**
```
Font-Size: 14px (text-sm)
Font-Weight: light (300)
Color: #737373 (neutral-500)
Line-Height: 20px
Text-Align: center
```

**Card/Dialog Borders:**
```
Border-Color: #E5E5E5 (neutral-200)
Border-Radius: 10px (rounded-lg)
```

**Buttons:**
```
Outline Button: rounded-[28px], border #E5E5E5
Primary Button: bg-[#3e596b], text-white, rounded-[22px]
```

**Badges (Rechtsgebiete):**
```
Blue (Zivilrecht): bg-blue-900 (#1E3A8A), text-blue-100 (#DBEAFE)
Green (Öff. Recht): bg-green-900 (#14532D), text-green-100 (#DCFCE7)
Red (Strafrecht): bg-red-900 (#7F1D1D), text-red-50 (#FEF2F2)
Primary (Default): bg-neutral-900 (#171717), text-neutral-50 (#FAFAFA)
Secondary: bg-neutral-100 (#F5F5F5), text-neutral-900 (#171717)
Border-Radius: 8px (rounded-md)
Font: text-xs (12px), semibold (600)
```

### 2.3 Erkenntnisse

Die Wizard-Screens **existieren in Figma** unter der Lernplanerstellung Canvas. Die wichtigsten Design-Token-Abweichungen:
- Title Color sollte `text-neutral-950` sein (nicht `text-neutral-900`)
- Borders sollten `border-neutral-200` sein (nicht `border-neutral-100`)
- Button-Radius im Wizard: `rounded-[28px]` (nicht `rounded-full`)

---

## 3. Extrahierte Figma-Spezifikationen

### 3.1 Aus "Schritt_7_Alt_2_header" (Node 2434:5276)

```jsx
// Title (H1)
Font-Size: 24px (text-2xl)
Font-Weight: extralight (200)
Color: #0A0A0A (neutral-950)
Line-Height: 1

// Description
Font-Size: 12px (text-xs)
Font-Weight: light (300)
Color: #737373 (neutral-500)
Line-Height: 1

// Badge (Rechtsgebiet)
Background: #1E3A8A (blue-900)
Text: #DBEAFE (blue-100)
Border-Radius: 8px (rounded-md)
Font-Size: 12px (text-xs)
Font-Weight: semibold (600)
Padding: 8px horizontal, 2px vertical (px-2 py-0.5)
```

### 3.2 Design-Token Mapping

| Element | Aktuell im Code | Figma-Spezifikation | Status |
|---------|-----------------|---------------------|--------|
| Step Header Title | `text-neutral-900` | `text-neutral-950` (#0A0A0A) | ⚠️ Ändern |
| Step Header Weight | `font-extralight` | `font-extralight` (200) | ✅ Korrekt |
| Step Header Size | `text-3xl md:text-5xl` | `text-2xl` (24px) | ⚠️ Größer als Figma |
| Description Color | `text-neutral-500` | `text-neutral-500` (#737373) | ✅ Korrekt |
| Description Weight | `font-light` | `font-light` (300) | ✅ Korrekt |
| Layout Borders | `border-neutral-100` | Standard: `border-neutral-200` | ⚠️ Ändern |

---

## 4. Konkrete Code-Änderungen

### 4.1 step-header.jsx (Zeile 18)

```jsx
// ALT:
<h1 className="text-center text-3xl md:text-5xl font-extralight text-neutral-900 leading-tight md:leading-[48px]">

// NEU (Figma: text-neutral-950):
<h1 className="text-center text-3xl md:text-5xl font-extralight text-neutral-950 leading-tight md:leading-[48px]">
```

**Hinweis:** Die Größe `text-3xl md:text-5xl` bleibt, da sie für den Wizard-Kontext (Vollbild) passend ist. Figma zeigt nur 24px für ein Widget-Fragment.

### 4.2 wizard-layout.jsx - Header Border (Zeile 103)

```jsx
// ALT:
<header className="h-[72px] px-8 flex items-center justify-between border-b border-neutral-100">

// NEU (Konsistenz mit App):
<header className="h-[72px] px-8 flex items-center justify-between border-b border-neutral-200">
```

### 4.3 wizard-layout.jsx - Footer Border (Zeile 148)

```jsx
// ALT:
<footer className="border-t border-neutral-100 px-4 sm:px-8 py-4">

// NEU (Konsistenz mit App):
<footer className="border-t border-neutral-200 px-4 sm:px-8 py-4">
```

### 4.4 step-6-erstellungsmethode.jsx - Card Selected State (Zeile 44)

```jsx
// ALT (FEHLER: slate ist nicht in tailwind.config.js definiert!):
? 'outline outline-2 outline-offset-[-2px] outline-slate-600 cursor-pointer'

// NEU (Korrigiert auf definierte Farbe):
? 'outline outline-2 outline-offset-[-2px] outline-neutral-900 cursor-pointer'
```

### 4.5 step-6-erstellungsmethode.jsx - Button Selected Background (Zeile 83)

```jsx
// ALT (FEHLER: slate ist nicht in tailwind.config.js definiert!):
? 'bg-slate-600 text-white'

// NEU (Korrigiert auf definierte Farbe):
? 'bg-neutral-900 text-white'
```

---

## 5. Pfade nach Schritt 6 - Figma-Analyse

### 5.1 Manual Path (Steps 7-22)

**Figma-Status:** ✅ Lernplan_Prozess_Base gefunden (Node `2660:1445`)

| Step | Komponente | Figma-Design |
|------|------------|--------------|
| 7 | step-7-manual.jsx | ✅ `2660:1445` (URG-Modus Auswahl) |
| 8 | step-8-rg-select.jsx | Basis-Layout aus `2660:1445` |
| 9 | step-9-urgs-edit.jsx | Basis-Layout aus `2660:1445` |
| 12 | step-12-themen-edit.jsx | Fragment: `2434:5276` |

### 5.2 Template Path (Step 7)

**Figma-Status:** ✅ Lernplan_Prozess_Base gefunden (Node `2659:9807`)

| Step | Komponente | Figma-Design |
|------|------------|--------------|
| 7 | step-7-template.jsx | ✅ `2659:9807` (Öffentliche Lernpläne Browser) |

### 5.3 Calendar Path (Steps 7-8)

**Figma-Status:** Nutzt gleiche Basis-Layouts

| Step | Komponente | Figma-Design |
|------|------------|--------------|
| 7 | step-7-urg-mode.jsx | Basis-Layout aus `2660:1445` |
| 8 | step-8-calendar.jsx | Basis-Layout aus `2660:1445` |

### 5.4 Automatic Path (Steps 7-10)

**Figma-Status:** Nutzt gleiche Basis-Layouts

| Step | Komponente | Figma-Design |
|------|------------|--------------|
| 7 | step-7-automatic.jsx | Basis-Layout aus `2660:1445` |
| 9 | step-9-lerntage.jsx | Basis-Layout aus `2660:1445` |
| 10 | step-10-anpassungen.jsx | Basis-Layout aus `2660:1445` |

---

## 6. Visuelle Vergleichstabelle

| Element | Vorher | Nachher | Grund |
|---------|--------|---------|-------|
| **Title Color** | `text-neutral-900` | `text-neutral-950` | Figma: #0A0A0A |
| **Header Border** | `border-neutral-100` | `border-neutral-200` | App-Konsistenz |
| **Footer Border** | `border-neutral-100` | `border-neutral-200` | App-Konsistenz |
| **Card Selected** | `outline-slate-600` | `outline-neutral-900` | slate nicht definiert |
| **Button Selected** | `bg-slate-600` | `bg-neutral-900` | slate nicht definiert |

---

## 7. Beizubehaltende Funktionen (Touch NOT)

```jsx
// DIESE LOGIK BLEIBT KOMPLETT UNVERÄNDERT:

// Multi-Path System
✅ creationMethod: 'calendar' | 'manual' | 'automatic' | 'template' | 'ai'
✅ Unterschiedliche Step-Flows je nach Methode
✅ Template-Selection und AI-Settings

// Wizard State Management (wizard-context.jsx)
✅ 22 Schritte mit komplexer Navigation
✅ validateCurrentStep() für jeden Schritt
✅ LocalStorage Draft-Speicherung
✅ completeWizard() / completeManualCalendar() / completeAutomaticLernplan()

// Responsive Design (bereits implementiert)
✅ Mobile-responsive Grid-Layouts (grid-cols-1 md:grid-cols-2)
✅ Responsive Padding (px-4 sm:px-8)
✅ Responsive Typography (text-3xl md:text-5xl)

// Alle Step-Komponenten (22+ Steps)
✅ Alle step-*.jsx Dateien funktional unverändert
✅ StepHeader Component Logik
✅ Form-Handling und Validierung
```

---

## 8. Hinweise zur Figma-Referenz

### 8.1 Verfügbare Figma-Screens

| Screen | Node-ID | Pfad |
|--------|---------|------|
| Lernplan_Prozess_Base (Manual) | `2660:1445` | Manual Path - URG Auswahl |
| Lernplan_Prozess_Base (Template) | `2659:9807` | Template Path - Lernplan Browser |

### 8.2 Design-Token Bestätigung aus Figma

Die folgenden Design-Tokens wurden direkt aus den Figma-Screens extrahiert und bestätigen die geplanten Änderungen:

| Token | Figma-Wert | Tailwind | Status |
|-------|------------|----------|--------|
| Title Color | `#0A0A0A` | `text-neutral-950` | ✅ Bestätigt |
| Border Color | `#E5E5E5` | `border-neutral-200` | ✅ Bestätigt |
| Card Radius | `10px` | `rounded-lg` | ✅ Bereits korrekt |
| Button Radius | `28px` | `rounded-[28px]` | ⚠️ App nutzt `rounded-full` |

### 8.3 Empfehlung

Die aktuellen Änderungen beschränken sich auf **Design-Token-Alignment**:
- Title Color: `text-neutral-900` → `text-neutral-950`
- Borders: `border-neutral-100` → `border-neutral-200`
- slate-600 Bug-Fix: → `outline-neutral-900`

**Hinweis:** Button-Radius (`rounded-[28px]` vs `rounded-full`) ist eine bewusste App-Entscheidung und wird nicht geändert.

---

## 9. Akzeptanzkriterien

### 9.1 Styling-Änderungen
- [ ] Title ist `text-neutral-950` statt `text-neutral-900`
- [ ] Header-Border ist `border-neutral-200` statt `border-neutral-100`
- [ ] Footer-Border ist `border-neutral-200` statt `border-neutral-100`
- [ ] Card-Selected verwendet `outline-neutral-900` statt `outline-slate-600`
- [ ] Button-Selected verwendet `bg-neutral-900` statt `bg-slate-600`

### 9.2 Funktions-Erhalt
- [ ] **ALLE bestehenden Funktionen arbeiten unverändert**
- [ ] Manual Path: Steps 7-22 navigierbar
- [ ] Template Path: Steps 7 → Lernplan erstellen
- [ ] Calendar Path: Steps 7-8 → Kalender erstellen
- [ ] Automatic Path: Steps 7-10 → Lernplan erstellen
- [ ] LocalStorage Draft funktioniert
- [ ] Wizard kann erfolgreich abgeschlossen werden

---

## 10. Test-Checkliste

### 10.1 Visual Check
- [ ] Title-Text hat korrekten Kontrast (neutral-950)
- [ ] Borders sind sichtbar (neutral-200)
- [ ] Selected Card-State ist korrekt (neutral-900)

### 10.2 Pfad-Tests
- [ ] Manual Path durchklicken (vollständig)
- [ ] Template Path testen (Step 7 → Erstellung)
- [ ] Calendar Path testen (Step 7-8)
- [ ] Automatic Path testen (Step 7-10)
- [ ] Wizard abbrechen und Draft prüfen

---

## 11. Abhängigkeiten

| Abhängigkeit | Status |
|--------------|--------|
| `text-neutral-950` | ✅ In tailwind.config.js definiert (#0A0A0A) |
| `border-neutral-200` | ✅ Tailwind Standard (#E5E5E5) |
| `outline-neutral-900` | ✅ Tailwind Standard (#171717) |

---

## 12. Risiken

| Risiko | Mitigation |
|--------|------------|
| slate-600 nicht definiert | Korrektur auf definierte neutral-900 |
| Kontrast zu stark | neutral-950 vs neutral-900 minimal |
| Keine Figma-Designs | Nur Design-Token-Alignment, keine Layout-Änderungen |

---

## 13. Korrektur zum alten Ticket

Das ursprüngliche Ticket war **FALSCH fokussiert**:

> ❌ "Mobile-Optimierung der Wizard-Schritte"
> ❌ "Tablet-Layout Anpassungen"
> ❌ "Progress-Bar exakt nach Figma implementieren"
> ❌ "Multi-Path Visual Differentiation"
> ❌ "Responsive Wizard"
> ❌ Geschätzter Aufwand: 2-3 Tage

**KORREKTUR:**
1. Das sind FUNKTIONEN und NEUE FEATURES, nicht Styling
2. Die Mobile/Tablet-Responsiveness ist bereits implementiert
3. **Figma-Screens existieren:** `2660:1445` (Manual), `2659:9807` (Template)
4. Dieses Ticket fokussiert NUR auf Design-Token-Alignment

**Figma-Screens gefunden unter:**
- Canvas: "Lernplanerstellung"
- Node: `2660:1445` → Manual Path (URG-Auswahl)
- Node: `2659:9807` → Template Path (Öffentliche Lernpläne)

---

## 14. Wizard-Komponenten (Referenz)

| Datei | Funktion |
|-------|----------|
| `wizard-layout.jsx` | Haupt-Layout mit Header, Progress, Footer |
| `step-header.jsx` | Einheitlicher Step-Header |
| `wizard-context.jsx` | State Management für alle Schritte |
| `exit-dialog.jsx` | Abbrechen-Bestätigung |
| `success-screen.jsx` | Erfolgs-Anzeige nach Erstellung |
| `error-screen.jsx` | Fehler-Anzeige |
| `steps/*.jsx` | 25 individuelle Step-Komponenten |

### Step-Dateien nach Pfad:

**Alle Pfade (Steps 1-6):**
- step-1-lernzeitraum.jsx
- step-2-puffertage.jsx
- step-3-urlaubstage.jsx
- step-4-tagesbloecke.jsx
- step-5-wochenstruktur.jsx
- step-6-erstellungsmethode.jsx

**Manual Path (Steps 7-22):**
- step-7-manual.jsx, step-7-urg-mode.jsx
- step-8-rg-select.jsx, step-8-unterrechtsgebiete.jsx, step-8-calendar.jsx
- step-9-urgs-edit.jsx, step-9-lerntage.jsx
- step-10-urgs-success.jsx, step-10-anpassungen.jsx
- step-11-themen-intro.jsx
- step-12-themen-edit.jsx
- step-14-gewichtung.jsx
- step-15-lernbloecke.jsx
- step-20-verteilungsmodus.jsx
- step-21-kalender-vorschau.jsx
- step-22-bestaetigung.jsx

**Template Path:**
- step-7-template.jsx

**Automatic Path:**
- step-7-automatic.jsx
- step-7-ai.jsx
