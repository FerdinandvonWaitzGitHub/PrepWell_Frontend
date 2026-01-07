# Step "Zielgewichtung der Rechtsgebiete" - Implementation Plan

> **Figma Node:** 2681:5983 (Lernplan_Prozess_Base)
> **Wizard Step:** Step 14 - Zielgewichtung der Rechtsgebiete (Manual Path)
> **Erstellt:** 2026-01-07
> **Status:** ✅ RESTYLED - Figma-Design umgesetzt

## Änderungshistorie

| Datum | Änderung |
|-------|----------|
| 2026-01-07 | Initial: Step existierte bereits als `step-14-gewichtung.jsx` |
| 2026-01-07 | Restyling nach Figma-Design durchgeführt |

---

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Chunks](#chunks)
3. [Umsetzungsplan](#umsetzungsplan)
4. [KPIs & Erfolgskriterien](#kpis--erfolgskriterien)
5. [Technische Details](#technische-details)

---

## Übersicht

### Zweck
Dieser Wizard-Step ermöglicht es dem Benutzer, eine Zielgewichtung für die drei Hauptrechtsgebiete (Öffentliches Recht, Zivilrecht, Strafrecht) festzulegen. Die Summe muss 100% ergeben.

### Funktionalität
- Prozentuale Gewichtung pro Rechtsgebiet (0-100%)
- +/- Steuerung in 5%-Schritten
- Validierung: Summe muss 100% ergeben
- Optional: "Zielgewichtung entfernen" zum Überspringen

---

## Chunks

### CHUNK 1: Asset-Konstanten

**Datei:** Keine separate Datei nötig - Icons aus bestehendem Icon-System nutzen

```javascript
// Benötigte Icons (aus lucide-react oder eigenem Icon-Set):
// - Network (Spinner/Header Icon)
// - Minus (Decrement Button)
// - Plus (Increment Button)
// - TriangleAlert (Fehler-Hinweis)
// - ArrowRight (Weiter Button)

// Figma Asset URLs (7 Tage gültig - für Referenz):
const FIGMA_ASSETS = {
  networkIcon: "https://www.figma.com/api/mcp/asset/60716787-0c98-4b03-bd53-2aca19e6b6b2",
  minusIcon: "https://www.figma.com/api/mcp/asset/a35f1286-f7d0-4eea-b637-46084ac15cb5",
  plusIcon: "https://www.figma.com/api/mcp/asset/b8d61161-b88d-4029-8dd5-8d945b217617",
  alertIcon: "https://www.figma.com/api/mcp/asset/ce7edaa5-556f-40bb-9b42-ffc46259dacc",
  arrowRightIcon: "https://www.figma.com/api/mcp/asset/42cae52d-94cf-4c9a-9b79-989f47cee07c",
};
```

**Umsetzung:** Bestehende Lucide-Icons verwenden (bereits im Projekt)

---

### CHUNK 2: Header (SKIP)

**Status:** ✅ Bereits vorhanden in Wizard-Layout

Der Header mit Logo und Avatar wird vom übergeordneten Wizard-Layout bereitgestellt.
Keine Implementierung nötig.

---

### CHUNK 3: Seitentitel & Beschreibung

**Figma Node-IDs:** 2681:5988 - 2681:5993

```jsx
// Struktur:
<div className="flex flex-col gap-5 items-center text-center">
  {/* Icon */}
  <Network className="w-12 h-12 text-foreground" />

  {/* Titel */}
  <h1 className="text-4xl font-extralight text-foreground max-w-[1000px]">
    Zielgewichtung der Rechtsgebiete
  </h1>

  {/* Beschreibung */}
  <p className="text-sm font-light text-muted-foreground max-w-[900px]">
    Damit du während der folgenden Schritte deine grobe Zielgewichtung der
    Rechtsgebiete nicht aus dem Blick verlierst, hast du jetzt die Möglichkeit
    eine Zielverteilung anzugeben. Du musst diese beim Erstellen nicht zwingend
    einhalten, allerdings verschafft sie dir ein Gefühl dafür, wie viel Zeit
    du für deine URGs und Themen hast.
  </p>

  {/* Optional: Zielgewichtung entfernen */}
  <button className="border border-input rounded-full px-5 py-2.5 text-sm font-light
                     hover:bg-accent transition-colors">
    Zielgewichtung entfernen
  </button>
</div>
```

---

### CHUNK 4: RechtsgebietCard Komponente

**Figma Node-IDs:** 2681:5995, 2681:6004, 2681:6013

**Wiederverwendbare Komponente:**

```jsx
/**
 * RechtsgebietCard - Prozent-Steuerung für ein Rechtsgebiet
 *
 * @param {string} name - Name des Rechtsgebiets
 * @param {number} percentage - Aktuelle Gewichtung (0-100)
 * @param {function} onIncrease - Callback für +5%
 * @param {function} onDecrease - Callback für -5%
 * @param {string} color - Farbe des Rechtsgebiets (optional)
 */
function RechtsgebietCard({ name, percentage, onIncrease, onDecrease, color }) {
  return (
    <div className="border border-border rounded-lg p-4 flex flex-col gap-4 min-w-[160px]">
      {/* Titel mit optionalem Farbindikator */}
      <div className="flex items-center gap-2">
        {color && <div className={`w-3 h-3 rounded-full ${color}`} />}
        <p className="font-medium text-sm text-foreground">{name}</p>
      </div>

      {/* ButtonGroup: Minus | Prozent | Plus */}
      <div className="flex items-center">
        {/* Minus Button */}
        <button
          onClick={onDecrease}
          disabled={percentage <= 0}
          className="bg-white border border-input rounded-l-lg h-9 w-9
                     flex items-center justify-center shadow-sm
                     hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Prozent-Anzeige */}
        <div className="bg-white border-y border-input h-9 px-4 min-w-[60px]
                        flex items-center justify-center shadow-sm">
          <span className="font-medium text-sm">{percentage} %</span>
        </div>

        {/* Plus Button */}
        <button
          onClick={onIncrease}
          disabled={percentage >= 100}
          className="bg-white border border-input rounded-r-lg h-9 w-9
                     flex items-center justify-center shadow-sm
                     hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

---

### CHUNK 5: Rechtsgebiete-Container

**Figma Node-ID:** 2681:5994

```jsx
// State für Gewichtungen
const [gewichtungen, setGewichtungen] = useState({
  'oeffentliches-recht': 33,
  'zivilrecht': 34,
  'strafrecht': 33,
});

// Rechtsgebiete-Konfiguration
const rechtsgebiete = [
  { id: 'oeffentliches-recht', name: 'Öffentliches Recht', color: 'bg-green-500' },
  { id: 'zivilrecht', name: 'Zivilrecht', color: 'bg-blue-500' },
  { id: 'strafrecht', name: 'Strafrecht', color: 'bg-red-500' },
];

// Handler
const handleIncrease = (id) => {
  setGewichtungen(prev => ({
    ...prev,
    [id]: Math.min(100, prev[id] + 5)
  }));
};

const handleDecrease = (id) => {
  setGewichtungen(prev => ({
    ...prev,
    [id]: Math.max(0, prev[id] - 5)
  }));
};

// Render
<div className="flex gap-3 items-start flex-wrap justify-center">
  {rechtsgebiete.map(rg => (
    <RechtsgebietCard
      key={rg.id}
      name={rg.name}
      percentage={gewichtungen[rg.id]}
      color={rg.color}
      onIncrease={() => handleIncrease(rg.id)}
      onDecrease={() => handleDecrease(rg.id)}
    />
  ))}
</div>
```

---

### CHUNK 6: Problemhinweise/Alert

**Figma Node-ID:** 2681:6022

```jsx
// Validierung
const totalPercentage = Object.values(gewichtungen).reduce((a, b) => a + b, 0);
const isValid = totalPercentage === 100;
const errors = [];

if (totalPercentage !== 100) {
  errors.push(`Deine Gewichtungen müssen insgesamt 100% ergeben. (Aktuell: ${totalPercentage}%)`);
}

// Alert-Komponente (nur wenn Fehler vorhanden)
{errors.length > 0 && (
  <div className="bg-card rounded-lg px-4 py-3 flex gap-3 items-start max-w-[700px]
                  border border-destructive/20">
    {/* Alert Icon */}
    <TriangleAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />

    {/* Fehlertext */}
    <div className="flex flex-col gap-1 text-destructive">
      <p className="font-medium text-sm">Probleme</p>
      <ul className="text-sm list-disc ml-5 space-y-1">
        {errors.map((error, i) => (
          <li key={i}>{error}</li>
        ))}
      </ul>
    </div>
  </div>
)}
```

---

### CHUNK 7: Footer mit Navigation-Buttons

**Figma Node-ID:** 2681:6025

```jsx
// Footer (bereits im Wizard-System vorhanden - anpassen)
<div className="flex items-center justify-between px-8 py-4 w-full">
  {/* Links: Zurück */}
  <button
    onClick={goToPreviousStep}
    className="border border-input rounded-full px-5 py-2.5 text-sm font-light
               hover:bg-accent transition-colors"
  >
    Zurück
  </button>

  {/* Rechts: Aktionen */}
  <div className="flex gap-2 items-center">
    <button
      onClick={saveAndClose}
      className="border border-input rounded-full px-5 py-2.5 text-sm font-light
                 hover:bg-accent transition-colors"
    >
      Speichern & Schließen
    </button>

    <button
      onClick={goToNextStep}
      disabled={!isValid}
      className="bg-[#3e596b] rounded-full px-5 py-2.5 flex gap-2 items-center
                 text-white text-sm font-light hover:bg-[#4a6a7d] transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span>Weiter</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
</div>
```

---

## Umsetzungsplan

### Phase 1: Vorbereitung (Research)
| # | Task | Status |
|---|------|--------|
| 1.1 | Bestehende Wizard-Steps analysieren (Struktur, Patterns) | ⬜ |
| 1.2 | WizardContext prüfen - wie werden Daten gespeichert? | ⬜ |
| 1.3 | Bestehende Komponenten identifizieren (Button, Alert, etc.) | ⬜ |

### Phase 2: Komponenten erstellen
| # | Task | Status |
|---|------|--------|
| 2.1 | `RechtsgebietCard` Komponente erstellen | ⬜ |
| 2.2 | Unit Tests für RechtsgebietCard | ⬜ |

### Phase 3: Step implementieren
| # | Task | Status |
|---|------|--------|
| 3.1 | Step-Datei erstellen: `step-10-zielgewichtung.jsx` | ⬜ |
| 3.2 | State-Management für Gewichtungen | ⬜ |
| 3.3 | Validierungslogik (Summe = 100%) | ⬜ |
| 3.4 | Error-Alert integrieren | ⬜ |
| 3.5 | In WizardContext integrieren (zielgewichtung Feld) | ⬜ |

### Phase 4: Integration
| # | Task | Status |
|---|------|--------|
| 4.1 | Step in wizard-page.jsx registrieren | ⬜ |
| 4.2 | Navigation (prev/next Step) konfigurieren | ⬜ |
| 4.3 | "Zielgewichtung entfernen" Funktion | ⬜ |

### Phase 5: Testing & Polish
| # | Task | Status |
|---|------|--------|
| 5.1 | Manueller Test im Browser | ⬜ |
| 5.2 | Responsive Design prüfen | ⬜ |
| 5.3 | Edge Cases testen (0%, 100%, etc.) | ⬜ |

---

## KPIs & Erfolgskriterien

### Funktionale KPIs

| KPI-ID | Beschreibung | Ziel | Status |
|--------|--------------|------|--------|
| **F-1** | Step wird korrekt angezeigt | Step 14 rendert ohne Fehler | ✅ Build OK |
| **F-2** | +/- Buttons funktionieren | Klick ändert Prozent um ±5% | ✅ Implementiert |
| **F-3** | Validierung funktioniert | Alert erscheint bei Summe ≠ 100% | ✅ Implementiert |
| **F-4** | Weiter-Button disabled bei Fehler | Button nur klickbar wenn valid | ✅ In WizardContext |
| **F-5** | Daten werden gespeichert | `rechtsgebieteGewichtung` im WizardContext | ✅ Implementiert |
| **F-6** | Navigation funktioniert | Zurück/Weiter wechselt Steps | ✅ WizardLayout |
| **F-7** | "Entfernen" setzt auf null | Gewichtung kann übersprungen werden | ✅ Toggle Button |

### Visuelle KPIs

| KPI-ID | Beschreibung | Ziel | Status |
|--------|--------------|------|--------|
| **V-1** | Layout entspricht Figma | Horizontale Karten + Header | ✅ Umgesetzt |
| **V-2** | Responsive auf Mobile | `flex-wrap` für Karten | ✅ Implementiert |
| **V-3** | Hover-States vorhanden | `hover:bg-neutral-50` | ✅ Implementiert |
| **V-4** | Disabled-States korrekt | `disabled:opacity-50 disabled:cursor-not-allowed` | ✅ Implementiert |

### Technische KPIs

| KPI-ID | Beschreibung | Ziel | Status |
|--------|--------------|------|--------|
| **T-1** | Keine Console Errors | 0 Errors in DevTools | ⏳ Browser-Test ausstehend |
| **T-2** | TypeScript/PropTypes | Keine Type-Fehler | ✅ `npm run typecheck` OK |
| **T-3** | Build erfolgreich | `npm run build` ohne Fehler | ✅ Build OK (9.00s) |
| **T-4** | Tests bestehen | Alle Unit Tests grün | ⏳ Ausstehend |

### Akzeptanzkriterien (Definition of Done)

- [x] **F-1 bis F-7** alle erfüllt
- [x] **V-1 bis V-4** alle erfüllt
- [x] **T-2, T-3** erfüllt (TypeCheck + Build)
- [ ] **T-1, T-4** Browser-Test + Unit Tests ausstehend
- [ ] Code Review bestanden

---

## Technische Details

### Datei-Struktur

```
src/features/lernplan-wizard/
├── components/
│   └── rechtsgebiet-card.jsx          # NEU: Wiederverwendbare Karte
├── steps/
│   └── step-10-zielgewichtung.jsx     # NEU: Step-Komponente
└── context/
    └── wizard-context.jsx              # UPDATE: zielgewichtung Feld
```

### WizardContext Erweiterung

```javascript
// In wizard-context.jsx - initialWizardState erweitern:
const initialWizardState = {
  // ... bestehende Felder

  // NEU: Zielgewichtung (kann null sein wenn übersprungen)
  zielgewichtung: {
    'oeffentliches-recht': 33,
    'zivilrecht': 34,
    'strafrecht': 33,
  },
  // oder null wenn "Zielgewichtung entfernen" geklickt
};
```

### Props Interface

```typescript
// RechtsgebietCard Props
interface RechtsgebietCardProps {
  name: string;
  percentage: number;
  onIncrease: () => void;
  onDecrease: () => void;
  color?: string;  // Tailwind bg-color class
}

// Step Props (falls benötigt)
interface Step10Props {
  // Wird aus WizardContext bezogen
}
```

---

## Referenzen

- **Figma Design:** Node 2681:5983
- **Bestehende Steps:** `step-8-rechtsgebiete.jsx`, `step-9-unterrechtsgebiete.jsx`
- **Design System:** Tailwind + Custom Design Tokens in `tailwind.config.js`
- **Icons:** Lucide React (bereits installiert)
