# Ticket 27: Themenliste-Editor Redesign - "Klausur"-Konzept

**Datum:** 21.01.2026 (aktualisiert: 22.01.2026)
**Status:** Analyse / Offene Fragen
**Priorität:** Hoch
**Figma-Link:** https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2771-964&m=dev

---

## Konzeptuelle Änderung: Themenliste = Klausur

Eine Themenliste soll konzeptionell einer **Klausur** entsprechen. Das bedeutet:
- Fokussiert auf **ein spezifisches Rechtsgebiet/Fach** (oder wenige URGs)
- **Reduzierte Hierarchie** (3 statt 4 Ebenen)
- **Klausur-orientierte Struktur** für Prüfungsvorbereitung

---

## Strukturvergleich: Aktuell vs. Neu

### Aktuelle Struktur (4 Ebenen)

```
JURISTEN:                              NICHT-JURISTEN:
┌─────────────────────────────┐        ┌─────────────────────────────┐
│ Rechtsgebiet (Fach)         │        │ Fach                        │
│ └─ Unterrechtsgebiet        │        │ └─ Kapitel                  │
│    └─ Kapitel (optional)    │        │    └─ Thema                 │
│       └─ Thema              │        │       └─ Aufgabe            │
│          └─ Aufgabe         │        │                             │
└─────────────────────────────┘        └─────────────────────────────┘
```

### Neue Struktur (3 Ebenen, Kapitel optional)

```
JURISTEN (ohne Kapitel):               JURISTEN (mit Kapitel):
┌─────────────────────────────┐        ┌─────────────────────────────┐
│ URG(s) als Titel            │        │ URG(s) als Titel            │
│ ─────────────────────────── │        │ ─────────────────────────── │
│ Thema 1                     │        │ Kapitel 1                   │
│ Thema 2                     │        │ └─ Thema 1                  │
│ Thema 3                     │        │ └─ Thema 2                  │
│ └─ Aufgaben                 │        │    └─ Aufgaben              │
└─────────────────────────────┘        └─────────────────────────────┘

NICHT-JURISTEN (ohne Kapitel):         NICHT-JURISTEN (mit Kapitel):
┌─────────────────────────────┐        ┌─────────────────────────────┐
│ Fach/Fächer als Titel       │        │ Fach/Fächer als Titel       │
│ ─────────────────────────── │        │ ─────────────────────────── │
│ Thema 1                     │        │ Kapitel 1                   │
│ Thema 2                     │        │ └─ Thema 1                  │
│ Thema 3                     │        │ └─ Thema 2                  │
│ └─ Aufgaben                 │        │    └─ Aufgaben              │
└─────────────────────────────┘        └─────────────────────────────┘
```

---

## Figma-Design Analyse

![Figma Screenshot](https://www.figma.com/api/mcp/asset/03884545-0e00-4376-8ed7-43b7e4183e35)

### Schlüsselelemente im Figma-Design:

| Element | Figma-Design | Unsere Anpassung |
|---------|--------------|------------------|
| **Titel-Zeile** | "Titel der Themenliste" | Wird zum **URG/Fach-Eingabefeld** (komma-separiert) |
| **Navigation** | Flache Liste (Thema 1, 2, 3...) | Keine verschachtelte Hierarchie |
| **Beschreibung** | "Beschreibung des Lernplans" | Bleibt als optionales Feld |

**Wichtig:** Das Badge "Zivilrecht" aus dem Figma-Design wird NICHT übernommen. Stattdessen wird der Titel selbst zur URG/Fach-Anzeige mit Autocomplete.

---

## Detaillierte Anforderungen

### 1. Juristen: URG → Themen → Aufgaben

- **URG wird Hauptebene**: Direkt im Header (komma-separiert, Autocomplete)
- **Kapitel-Ebene optional**: Standardmäßig AUS, aber in Settings aktivierbar
- **Themen sind flach**: Direkt unter dem URG (oder unter Kapitel, wenn aktiviert)

**Beispiel Jura-Klausur (ohne Kapitel):**
```
Polizei- und Ordnungsrecht ✏️          ← URG als Titel (48px extralight)
─────────────────────────────────────
Thema: Gefahrenabwehr
  └─ Aufgabe: Definition Gefahr
  └─ Aufgabe: Ermächtigungsgrundlagen

Thema: Vollstreckungsrecht
  └─ Aufgabe: Sofortvollzug
```

**Beispiel Jura-Klausur (mit Kapitel aktiviert):**
```
Polizei- und Ordnungsrecht ✏️          ← URG als Titel (48px extralight)
─────────────────────────────────────
Kapitel: Gefahrenabwehr
  └─ Thema: Gefährliche Situationen
     └─ Aufgabe: Definition Gefahr
     └─ Aufgabe: Ermächtigungsgrundlagen

  └─ Thema: Vollstreckung
     └─ Aufgabe: Sofortvollzug
```

### 2. Nicht-Juristen: Fach → (Kapitel) → Themen → Aufgaben

- **Kapitel-Ebene optional**: In User Settings aktivierbar (Standard: AUS)
- **Fach wird Hauptebene**: Im Header als Titel (48px extralight)

**Beispiel BWL ohne Kapitel:**
```
Marketing ✏️                           ← Fach als Titel (48px extralight)
─────────────────────────────────────
Thema: 4Ps
  └─ Aufgabe: Product erklären
```

**Beispiel BWL mit Kapitel (wenn aktiviert):**
```
Marketing ✏️                           ← Fach als Titel (48px extralight)
─────────────────────────────────────
Kapitel: Grundlagen
  └─ Thema: 4Ps
     └─ Aufgabe: Product erklären
```

### 3. Header-Transformation

| Vorher | Nachher |
|--------|---------|
| Titel-Eingabefeld ("Titel der Themenliste") | **URG/Fach-Eingabe** mit Autocomplete (komma-separiert) |
| Pencil-Icon zum Bearbeiten | Pencil-Icon aktiviert Bearbeitungsmodus für URG/Fach-Eingabe |

---

## Entscheidungen (Stand: 22.01.2026)

### ✅ Entscheidung 1: Mehrere URGs/Fächer - Komma-separiert mit Autocomplete

**Gewählt:** Komma-getrennte Eingabe im Titel-Feld mit Autocomplete

```
┌─────────────────────────────────────────────────────┐
│  Polizeirecht, Kommunalrecht, |                     │  ← Cursor nach Komma
│  ┌─────────────────────────┐                        │
│  │ Baurecht öffentlich     │  ← Autocomplete        │
│  │ Beamtenrecht            │     Vorschläge         │
│  │ Gewerberecht            │                        │
│  └─────────────────────────┘                        │
└─────────────────────────────────────────────────────┘
```

**Verhalten:**
- Eingabe startet Autocomplete-Suche
- Nach Auswahl wird URG/Fach hinzugefügt + Komma
- Weitertippen nach Komma zeigt neue Vorschläge
- Backspace löscht letztes URG/Fach
- **Kein separates Badge** - der Titel selbst zeigt die URGs/Fächer an (48px extralight)

---

### ✅ Entscheidung 2: Themen-Gruppierung - Farbcodiert (TODO: Ausarbeiten)

**Gewählt:** Farbbalken zeigt URG-Zugehörigkeit

```
Navigation (links):              Detail (rechts):
┌────────────────────┐          ┌─────────────────────────────┐
│ ▌ Thema 1          │  ←──────→│ ▌ Thema 1                   │
│ ▌ Thema 2          │          │   Beschreibung...           │
│ ▌ Thema 3          │          │   ┌─────────────────────┐   │
│ + Neues Thema      │          │   │ ▌ Aufgabe 1         │   │
└────────────────────┘          │   │ ▌ Aufgabe 2         │   │
                                │   └─────────────────────┘   │
Legende:                        └─────────────────────────────┘
▌ = Blau  → Polizeirecht
▌ = Grün  → Kommunalrecht
▌ = Rot   → Strafrecht AT
```

**TODO - Ausarbeiten:**
- [ ] Farbzuordnung: Wie werden URGs Farben zugewiesen?
  - Option A: Farbe des übergeordneten Rechtsgebiets (Zivilrecht=Blau, Strafrecht=Rot...)
  - Option B: Eigene Farbe pro URG (aus Palette)
- [ ] Legende anzeigen? Wenn ja, wo?
- [ ] Balkenbreite und -position festlegen

---

### ✅ Entscheidung 3: URG-Auswahl UI - Autocomplete-Input

**Gewählt:** Autocomplete mit Tippen-und-Suchen

**Verhalten:**
1. Klick in Titel-Feld aktiviert Eingabe
2. Tippen filtert alle verfügbaren URGs/Fächer
3. Dropdown zeigt Treffer (max. 5-8 Einträge)
4. Enter oder Klick wählt aus
5. Komma wird automatisch hinzugefügt
6. Weitertippen für nächstes URG/Fach

**Suchlogik:**
- Suche in URG-Name UND Kategorie
- z.B. "Schuld" findet "Allgemeines Schuldrecht", "Besonderes Schuldrecht"
- z.B. "Polizei" findet "Polizei- und Ordnungsrecht"

---

### ✅ Entscheidung 4: UI-Labels - "Themenliste" bleibt

**Gewählt:** Label "Themenliste" wird beibehalten

| Element | Label |
|---------|-------|
| Navigation | "Themenlisten" |
| Button | "Neue Themenliste" |
| Editor | "Themenliste erstellen" |

**Konzeptionell:** Eine Themenliste entspricht einer Klausur, aber das UI-Label bleibt "Themenliste".

---

### ✅ Entscheidung 5: Kapitel-Ebene Setting - Beides

**Gewählt:** Einstellung an zwei Stellen

**A) Beim Erstellen (Initial-Wert):**
```
┌─────────────────────────────────────────┐
│ Neue Themenliste                        │
│                                         │
│ [Fach eingeben...]                      │
│                                         │
│ ☐ Mit Kapitel-Ebene                     │  ← Toggle
│   (Fach → Kapitel → Themen)             │
│                                         │
│ [Erstellen]                             │
└─────────────────────────────────────────┘
```

**B) In User Settings (Standard-Wert):**
```
Einstellungen → Themenlisten
─────────────────────────────
☐ Kapitel-Ebene standardmäßig aktivieren
  Neue Themenlisten haben automatisch eine
  zusätzliche Kapitel-Ebene zwischen Fach und Themen.

  Standard: Aus
```

**Logik:**
- User Setting definiert den **Standardwert** für neue Themenlisten
- Beim Erstellen kann der Wert für **diese Themenliste** überschrieben werden
- Änderung in Settings wirkt nur auf **neue** Themenlisten

---

## Betroffene Dateien

| Datei | Änderungen |
|-------|------------|
| `src/pages/themenliste-editor.jsx` | State-Struktur, Hierarchie-Logik |
| `src/features/themenliste/components/themenliste-header.jsx` | URG/Fach-Badge statt Titel |
| `src/features/themenliste/components/themen-navigation.jsx` | Flache Liste statt Akkordeon |
| `src/features/themenliste/components/thema-detail.jsx` | Anpassung Farbbalken |
| `src/contexts/studiengang-context.jsx` | Kapitel-Setting für Nicht-Juristen |
| `src/components/settings/settings-content.jsx` | Neues Setting: Kapitel-Ebene |

---

## Datenstruktur-Änderung

### Aktuell:
```javascript
contentPlan = {
  id: '...',
  type: 'themenliste',
  name: 'Meine Themenliste',        // Titel
  description: '...',
  rechtsgebiete: [                   // 4 Ebenen
    {
      rechtsgebietId: 'zivilrecht',
      unterrechtsgebiete: [
        {
          unterrechtsgebietId: 'kaufr',
          kapitel: [                 // Optional
            {
              title: 'Kapitel 1',
              themen: [...]
            }
          ]
        }
      ]
    }
  ]
}
```

### Neu (Finalisiert):
```javascript
contentPlan = {
  id: '...',
  type: 'themenliste',
  description: '...',                          // Optional, bleibt erhalten

  // URGs/Fächer als Array (ersetzt 'name' und 'rechtsgebiete')
  // Juristen: URG-IDs, Nicht-Juristen: Fach-IDs
  selectedAreas: [
    {
      id: 'polr',                              // URG/Fach-ID
      name: 'Polizei- und Ordnungsrecht',      // Display-Name
      rechtsgebietId: 'oeffentliches-recht',   // Für Farbzuordnung
      color: 'bg-green-500'                    // Farbe des übergeordneten RG
    },
    {
      id: 'kommunalr',
      name: 'Kommunalrecht',
      rechtsgebietId: 'oeffentliches-recht',
      color: 'bg-green-500'
    }
  ],

  // Kapitel-Ebene (nur Nicht-Juristen, wenn aktiviert)
  useKapitel: false,                           // Toggle aus Erstellung/Settings
  kapitel: [                                   // Nur wenn useKapitel=true
    { id: '...', name: 'Grundlagen', order: 0 }
  ],

  // Themen flach
  themen: [
    {
      id: '...',
      name: 'Gefahrenabwehr',
      description: '...',
      areaId: 'polr',                          // Zuordnung zum URG/Fach → Farbbalken
      kapitelId: null,                         // Nur wenn useKapitel=true
      order: 0,
      aufgaben: [
        {
          id: '...',
          name: 'Definition Gefahr',
          priority: 'low',                     // low | medium | high
          completed: false,
          order: 0
        }
      ]
    }
  ],

  // Metadaten
  status: 'draft' | 'active' | 'archived',
  createdAt: '...',
  updatedAt: '...'
}
```

### Abgeleiteter Anzeigename (automatisch generiert):
```javascript
// Der "Titel" wird aus selectedAreas generiert:
const displayName = contentPlan.selectedAreas
  .map(area => area.name)
  .join(', ');

// Beispiel: "Polizei- und Ordnungsrecht, Kommunalrecht"
```

---

## Implementierungsplan (Hierarchie + Figma-Styling kombiniert)

### Phase 0: Tailwind-Config erweitern
```javascript
// tailwind.config.js - In theme.extend hinzufügen:

colors: {
  brand: {
    primary: '#3e596b',  // Figma Primary Button
  },
},
```

---

### Phase 1: Datenstruktur & Settings

**Dateien:** `themenliste-editor.jsx`, `studiengang-context.jsx`, `settings-content.jsx`

| Task | Beschreibung |
|------|-------------|
| [ ] 1.1 | Neue `contentPlan` Datenstruktur implementieren (siehe oben) |
| [ ] 1.2 | Kapitel-Setting in `studiengang-context.jsx` hinzufügen |
| [ ] 1.3 | User Settings UI für "Kapitel-Ebene standardmäßig aktivieren" |
| [ ] 1.4 | Migration bestehender Themenlisten (Mapping alte → neue Struktur) |

---

### Phase 2: Header-Komponente (`themenliste-header.jsx`)

**Hierarchie-Änderungen:**

| Task | Beschreibung |
|------|-------------|
| [ ] 2.1 | Titel-Eingabefeld → URG/Fach-Autocomplete-Input ersetzen |
| [ ] 2.2 | Komma-separierte Mehrfachauswahl implementieren |
| [ ] ~~2.3~~ | ~~Badge-Darstellung~~ → **ENTFÄLLT** (Titel IST die URG-Anzeige) |
| [ ] 2.4 | Pencil-Icon aktiviert Bearbeitungsmodus |

**Figma-Styling:**

| Task | Aktuell | Figma-Ziel | Tailwind-Klassen |
|------|---------|------------|------------------|
| [ ] 2.5 | Links-ausgerichtet | **Zentriert** | `text-center` |
| [ ] 2.6 | Titel 24px | **48px extralight** | `text-5xl font-extralight` |
| [ ] ~~2.7~~ | ~~Badge~~ | **ENTFÄLLT** | - |
| [ ] 2.8 | Beschreibung links | **Zentriert, max-width** | `text-center max-w-3xl mx-auto` |
| [ ] 2.9 | - | **Pencil-Icon neutral-400** | `text-neutral-400` |

```
NEUER HEADER (ohne Badge):
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│     Polizeirecht, Kommunalrecht ✏️     ← URGs als Titel (48px)  │
│                                        ← Autocomplete bei Klick │
│                                                                 │
│    Beschreibung des Lernplans          ← 14px light, neutral-500│
│         (max-width: 900px)                                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ─────────────────────────────────────  ← Trennlinie             │
└─────────────────────────────────────────────────────────────────┘

Bearbeitungsmodus (nach Klick auf ✏️):
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│     [Polizeirecht, Kommunalrecht, |  ] ← Input mit Cursor       │
│     ┌─────────────────────────┐                                 │
│     │ Baurecht öffentlich     │   ← Autocomplete-Dropdown       │
│     │ Beamtenrecht            │                                 │
│     └─────────────────────────┘                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 3: Navigation-Komponente (`themen-navigation.jsx`)

**Hierarchie-Änderungen:**

| Task | Beschreibung |
|------|-------------|
| [ ] 3.1 | Akkordeon-Hierarchie (RG→URG→Kap→Thema) entfernen |
| [ ] 3.2 | Flache Themenliste implementieren |
| [ ] 3.3 | Farbbalken pro Thema (basierend auf `areaId`) |
| [ ] 3.4 | Kapitel-Gruppierung (nur Nicht-Juristen mit `useKapitel=true`) |

**Figma-Styling:**

| Task | Aktuell | Figma-Ziel | Tailwind-Klassen |
|------|---------|------------|------------------|
| [ ] 3.5 | border-r | **Card mit border + shadow** | `border border-neutral-200 rounded-md shadow-sm` |
| [ ] 3.6 | 40% Breite | **max-w-[350px]** | `max-w-sm` (~384px) |
| [ ] 3.7 | Selektiert: bg-blue-50 | **bg-neutral-100** | `bg-neutral-100` |
| [ ] 3.8 | - | **Thema + Beschreibung** | Zweizeilig pro Item |

```
FIGMA NAVIGATION:
┌─────────────────────────────────────┐
│  ▌ Thema 1                          │  ← Farbbalken links
│    Beschreibung                     │  ← text-neutral-500
├─────────────────────────────────────┤
│  ▌ Thema 2                          │  ← bg-neutral-100 wenn selektiert
│    Beschreibung                     │
├─────────────────────────────────────┤
│  ▌ Thema 3                    🗑️   │  ← Trash-Icon bei Hover
│    Beschreibung                     │
├─────────────────────────────────────┤
│  + Neues Thema                      │  ← font-medium 14px
└─────────────────────────────────────┘
```

---

### Phase 4: Detail-Komponente (`thema-detail.jsx`)

**Hierarchie-Änderungen:**

| Task | Beschreibung |
|------|-------------|
| [ ] 4.1 | URG-Zuordnung (`areaId`) für Farbbalken nutzen |
| [ ] 4.2 | Thema gehört direkt zur Themenliste (nicht zu URG-Hierarchie) |

**Figma-Styling:**

| Task | Aktuell | Figma-Ziel | Tailwind-Klassen |
|------|---------|------------|------------------|
| [ ] 4.3 | Titel 20px medium | **24px extralight** | `text-2xl font-extralight` |
| [ ] 4.4 | Kein Farbbalken | **5px Balken links** | `border-l-4 border-{color}` |
| [ ] 4.5 | Checkbox 20x20 | **16x16** | `w-4 h-4` |
| [ ] 4.6 | Aufgabe p-3 | **px-10 py-5** | `px-10 py-5` |
| [ ] 4.7 | + dashed border | **Nur Text + Icon** | `text-neutral-500 text-xs font-medium` |

```
FIGMA DETAIL:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Thema 1                            ← 24px extralight       │
│  Beschreibung                       ← 14px neutral-400      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▌ ☐ Aufgabe 1                           !! 🗑️      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▌ ☐ Aufgabe 2                           !! 🗑️      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  + Neue Aufgabe                     ← 12px medium           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

▌ = Farbbalken (Farbe des übergeordneten Rechtsgebiets)
!! = Prioritäts-Buttons (neutral-200)
```

---

### Phase 5: Footer-Komponente (`themenliste-footer.jsx`)

**Figma-Styling:**

| Task | Aktuell | Figma-Ziel | Tailwind-Klassen |
|------|---------|------------|------------------|
| [ ] 5.1 | "Archivieren" | **"Lernplan archivieren"** | Text ändern |
| [ ] 5.2 | "Fertig" | **"Speichern"** | Text ändern |
| [ ] 5.3 | bg-blue-600 | **bg-brand-primary (#3e596b)** | `bg-brand-primary` |
| [ ] 5.4 | font-medium | **font-light** | `font-light` |
| [ ] 5.5 | rounded-3xl | **rounded-[28px] / rounded-[22px]** | `rounded-full` |

```
FIGMA FOOTER:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Lernplan archivieren 📦]            [Abbrechen] [Speichern ✓] │
│  └─ border, font-light                 └─ bg-brand-primary      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 6: Integration & Test

| Task | Beschreibung |
|------|-------------|
| [ ] 6.1 | Juristen-Flow: URG-Auswahl → Thema → Aufgaben |
| [ ] 6.2 | Nicht-Juristen-Flow ohne Kapitel: Fach → Thema → Aufgaben |
| [ ] 6.3 | Nicht-Juristen-Flow mit Kapitel: Fach → Kapitel → Thema → Aufgaben |
| [ ] 6.4 | Kapitel-Toggle beim Erstellen testen |
| [ ] 6.5 | User Settings: Kapitel-Standard ändern |
| [ ] 6.6 | Draft-Handling mit neuer Struktur |
| [ ] 6.7 | Auto-Save funktioniert |
| [ ] 6.8 | Delete/Cancel-Dialoge funktionieren |
| [ ] 6.9 | Visuelle Prüfung gegen Figma-Design |

---

## Zusammenfassung: Was ändert sich wo?

| Komponente | Hierarchie-Änderung | Figma-Styling |
|------------|---------------------|---------------|
| **Header** | URG/Fach-Autocomplete statt Titel, **kein Badge** | Zentriert, 48px extralight |
| **Navigation** | Flache Liste statt Akkordeon | Card-Style, Farbbalken, Selection-Color |
| **Detail** | areaId für Farbzuordnung | 24px Titel, Farbbalken, Checkbox-Größe |
| **Footer** | - | Texte, Button-Farbe, Font-weight |
| **Editor** | Neue Datenstruktur | - |
| **Settings** | Kapitel-Toggle | - |

---

## Referenz: Figma-Design Details (aus vorheriger Analyse)

### Tailwind-Config Mapping

| Figma-Wert | Tailwind | Verfügbar? | Verwendung |
|------------|----------|------------|------------|
| ~~`#1E3A8A` (Badge bg)~~ | ~~`blue-900`~~ | ~~✅~~ | **ENTFÄLLT** (kein Badge) |
| ~~`#DBEAFE` (Badge text)~~ | ~~`blue-50`~~ | ~~✅~~ | **ENTFÄLLT** (kein Badge) |
| `#3e596b` (Primary Button) | `brand-primary` | ❌ Hinzufügen | Footer-Button |
| `48px` (Titel/URG-Anzeige) | `text-5xl` | ✅ | Header |
| `24px` (Thema-Titel) | `text-2xl` | ✅ | Detail-Panel |

### Zu behaltende Funktionen

- Auto-Save mit Status-Anzeige
- Draft-Persistenz (localStorage + Supabase)
- Delete/Cancel-Confirmation-Dialoge
- Prioritäts-Toggle (low/medium/high)
- Inline-Editing

---

## IGNORIEREN - Debug-Elemente im Figma

- `border border-[red]` auf `Main_Content_Wrapper` (node 2771:970)
- `border border-[red]` auf `Thema_und_Aufgaben` (node 2619:6022)
