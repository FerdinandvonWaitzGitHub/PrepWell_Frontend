# TICKET SE-001: Einstellungen-Seite Design-Anpassung

**Typ:** Design-Anpassung (NUR Styling)
**Priorität:** Niedrig
**Status:** ✅ Implementiert
**Erstellt:** 2026-01-15
**Aktualisiert:** 2026-01-16
**Aufwand:** 1-2h

---

## 1. Scope-Definition

**WICHTIG:** Dieses Ticket betrifft **NUR Design-Styling**. Die Einstellungen-Seite ist bereits **VOLLSTÄNDIG implementiert** mit 9 Settings-Sektionen und über 1100 Zeilen Code.

### Was geändert wird (Design-Sprache):
- Section-Header Typography: `text-lg font-medium` → `text-2xl font-extralight`
- Section-Header Color: `text-neutral-900` → `text-neutral-950`

### Was NICHT geändert wird (Funktionen):
- Sidebar Navigation (in Figma, NICHT implementiert - bleibt so!)
- Neue Settings-Kategorien wie "Abonnement", "Zeiterfassung" (in Figma, NICHT implementiert - bleibt so!)
- Bestehende Settings-Struktur (Lernmodus, Studium, Jura, Profil, Benachrichtigungen, etc.)
- Form-Handling und LocalStorage-Persistierung
- Alle Toggle-Buttons, Select-Dropdowns, Input-Felder
- Passwort-Ändern Dialog
- Mode-Switch Confirmation Modal

---

## 2. Figma-Referenz

| Element | Node-ID | Beschreibung |
|---------|---------|--------------|
| **Einstellungen Seite** | `2439:2920` | Gesamtansicht |
| **Kapitelüberschrift** | `2439:4075` | Section Header Styling |
| **NavigationMenu Popover** | `2439:3290` | Sidebar (NICHT implementieren!) |

---

## 3. Figma Design-Spezifikationen

### 3.1 Section Header (Figma: 2439:4078)

```
Font-Size: 24px (text-2xl)
Font-Weight: extralight (200)
Color: #0A0A0A (neutral-950)
```

### 3.2 Section Description

```
Font-Size: 14px (text-sm)
Font-Weight: normal (400)
Color: #A3A3A3 (neutral-400) ← bereits korrekt!
```

---

## 4. Design-Token Mapping

### 4.1 Bereits korrekt

| Element | Figma | Tailwind | Status |
|---------|-------|----------|--------|
| Card Background | `white` | `bg-white` | ✅ |
| Card Border | `#E5E5E5` | `border-neutral-200` | ✅ |
| Card Border-Radius | `8px` | `rounded-lg` | ✅ |
| Card Padding | `24px` | `p-6` | ✅ |
| Description Color | `#A3A3A3` | `text-neutral-400` | ✅ |
| Description Size | `14px` | `text-sm` | ✅ |
| Toggle Active | blue | `bg-blue-600` | ✅ |
| Toggle Inactive | gray | `bg-neutral-300` | ✅ |

### 4.2 Zu ändernde Werte

| Element | Aktuell | Figma | Neue Tailwind-Klasse |
|---------|---------|-------|---------------------|
| Section Header Size | `text-lg` (18px) | 24px | `text-2xl` |
| Section Header Weight | `font-medium` (500) | extralight (200) | `font-extralight` |
| Section Header Color | `text-neutral-900` | #0A0A0A | `text-neutral-950` |

---

## 5. Konkrete Code-Änderungen

**Datei:** `src/components/settings/settings-content.jsx`

### 5.1 Section Headers (mehrere Stellen)

Es gibt 9 Section Headers die alle das gleiche Pattern haben:

```jsx
// ALT (Zeilen 275, 344, 389, 481, 561, 644, 814, 891):
<h3 className="text-lg font-medium text-neutral-900 mb-4">

// NEU (Figma-aligned):
<h3 className="text-2xl font-extralight text-neutral-950 mb-4">
```

**Betroffene Sektionen:**
1. Zeile 275: "Lernmodus"
2. Zeile 344: "Studium"
3. Zeile 378: "Fächer"
4. Zeile 389: "Jura"
5. Zeile 481: "Profil"
6. Zeile 561: "Benachrichtigungen"
7. Zeile 644: "Lerneinstellungen"
8. Zeile 814: "Mentor"
9. Zeile 891: "Darstellung"

**Hinweis:** Einige Headers haben zusätzlich `flex items-center gap-2` für Icons - diese bleiben erhalten, nur die Typography-Klassen ändern sich.

---

## 6. Visuelle Vergleichstabelle

| Element | Vorher | Nachher |
|---------|--------|---------|
| **Section Header Size** | `text-lg` (18px) | `text-2xl` (24px) |
| **Section Header Weight** | `font-medium` (500) | `font-extralight` (200) |
| **Section Header Color** | `text-neutral-900` | `text-neutral-950` |

---

## 7. Beizubehaltende Funktionen (Touch NOT)

```jsx
// DIESE LOGIK BLEIBT KOMPLETT UNVERÄNDERT:

// Settings State Management (Zeile 122-125)
✅ useState für settings
✅ hasChanges Tracking
✅ saveSuccess Feedback

// LocalStorage Persistierung (Zeile 129-166)
✅ Load from localStorage on mount
✅ handleSettingChange für alle Sections
✅ handleSave und handleCancel

// Alle 9 Settings-Sektionen mit ihren Features:
✅ Lernmodus: Mode Toggle, Semester-Auswahl
✅ Studium: Studiengang-Auswahl
✅ Fächer: CustomSubjectsSection für Nicht-Juristen
✅ Jura: Rechtsgebiete-Auswahl, Kapitel-Ebene Toggle
✅ Profil: Name (read-only), Email (read-only), Passwort ändern
✅ Benachrichtigungen: Email, Push, Erinnerungen Toggles
✅ Lerneinstellungen: Tägliches Ziel, Startzeit, Pausen, Pomodoro
✅ Mentor: Toggle, Check-in Anzahl
✅ Darstellung: Theme, Sprache, Zeitzone

// Dialoge (Zeile 983-1126)
✅ Password Change Dialog
✅ Mode Switch Confirmation Modal
```

---

## 8. Hinweise zur Figma-Abweichung

### Funktionen in Figma die NICHT implementiert werden:

| Figma-Element | Grund für Nicht-Implementierung |
|---------------|--------------------------------|
| Sidebar Navigation | Layout-Änderung, nicht Styling - App hat scrollbare Single-Page |
| "Abonnement" Kategorie | Neue Funktion, separates Feature-Ticket |
| "Zeiterfassung" Kategorie | Neue Funktion, separates Feature-Ticket |
| "Kalender" Kategorie | Neue Funktion, separates Feature-Ticket |
| Menu Link Descriptions | App verwendet andere Struktur |

### Abweichungen die bleiben:

| App-Feature | Grund für Beibehaltung |
|-------------|----------------------|
| Single-Page Layout | Funktioniert gut, keine Sidebar nötig |
| 9 Settings-Sektionen | Mehr Features als Figma zeigt |
| Blue Accent Color | Konsistent mit App-Theme |
| LocalStorage Persistierung | Funktional implementiert |

---

## 9. Akzeptanzkriterien

### 9.1 Styling-Änderungen
- [ ] Alle Section Headers haben `text-2xl font-extralight text-neutral-950`
- [ ] Headers mit Icons behalten `flex items-center gap-2`

### 9.2 Funktions-Erhalt
- [ ] **ALLE bestehenden Funktionen arbeiten unverändert**
- [ ] Settings speichern/laden funktioniert
- [ ] Alle Toggles funktionieren
- [ ] Alle Dropdowns funktionieren
- [ ] Passwort-Dialog funktioniert
- [ ] Mode-Switch Modal funktioniert

---

## 10. Test-Checkliste

### 10.1 Visual Check
- [ ] Section Headers sind größer (24px statt 18px)
- [ ] Section Headers sind leichter (extralight statt medium)
- [ ] Headers mit Icons sind korrekt ausgerichtet

### 10.2 Funktions-Check
- [ ] Einstellung ändern → "Änderungen speichern" erscheint
- [ ] Speichern → Success-Meldung erscheint
- [ ] Page Refresh → Einstellungen bleiben erhalten
- [ ] Alle Toggles funktionieren (an/aus)
- [ ] Alle Dropdowns funktionieren (Auswahl ändern)

---

## 11. Abhängigkeiten

| Abhängigkeit | Status |
|--------------|--------|
| `text-2xl` | ✅ In tailwind.config.js definiert (24px) |
| `font-extralight` | ✅ In tailwind.config.js definiert (200) |
| `text-neutral-950` | ✅ In tailwind.config.js definiert (#0A0A0A) |

---

## 12. Risiken

| Risiko | Mitigation |
|--------|------------|
| Headers zu groß mit Icons | Icons sind 20px (w-5 h-5), passt zu 24px Text |
| Text zu leicht lesbar | extralight (200) mit #0A0A0A hat guten Kontrast |

---

## 13. Korrektur zum alten Ticket

Das ursprüngliche Ticket war **KOMPLETT FALSCH**:

> ❌ "Die Einstellungen-Seite ist aktuell nur als Placeholder implementiert"

**KORREKTUR:** Die Seite hat **1100+ Zeilen Code** mit:
- 9 vollständig implementierten Settings-Sektionen
- LocalStorage Persistierung
- 2 Modal-Dialoge
- Über 20 verschiedene Einstellungsmöglichkeiten

> ❌ "Sidebar Navigation implementieren"
> ❌ "Neue Settings-Kategorien hinzufügen"
> ❌ "Neue Dateien erstellen"

**KORREKTUR:** Das sind FUNKTIONEN, nicht Styling. Die App verwendet bewusst ein Single-Page Layout ohne Sidebar - das ist eine Design-Entscheidung die bleibt.

---

## 14. Bestehende Settings-Sektionen (Referenz)

| Sektion | Zeile | Features |
|---------|-------|----------|
| Lernmodus | 273 | Mode Toggle (Examen/Normal), Semester-Auswahl |
| Studium | 342 | Studiengang-Dropdown |
| Fächer | 376 | CustomSubjectsSection (nur für Nicht-Juristen) |
| Jura | 387 | Rechtsgebiete-Checkboxen, Kapitel-Ebene Toggle |
| Profil | 479 | Name, Email (read-only), Passwort ändern |
| Benachrichtigungen | 559 | Email, Push, Erinnerungen Toggles |
| Lerneinstellungen | 642 | Tägliches Ziel, Startzeit, Pausen, Pomodoro, Fortschrittsberechnung |
| Mentor | 812 | Mentor Toggle, Check-in Anzahl |
| Darstellung | 889 | Theme, Sprache, Zeitzone |
