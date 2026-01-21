# Ticket 22 - Themenlisten-Erstellung

**Datum:** 19.01.2026
**Status:** Offen

---

## Beschreibung

aktuell ist es so, dass wenn man auf "+ neue themenliste" klickt, dass ein ganz hässliches leere themenlsite aufgeht die nicht schön bearbeitbar ist und das möchte ich ändern. ab jetzt soll eine komplett neue seite aufgehen woe man die rechtsgebiete/fächer, Unterrechtsgebiete/Kapitel, Themen und aufgaben einfügen kann. 
bitte analysiere den code. ich möchte das bei einer implementierung immer die tailwind.config.js datei beachtet, bei allen visuellen merkmalen. 
---

## Code zur Analyse

es folgt zuerst der tsx code


import { FunctionComponent } from 'react';
import styles from './LernplanProzessBase.module.css';


const LernplanProzessBase: FunctionComponent = () => {
  	return (
    		<div className={styles.lernplanProzessBase}>
      			<div className={styles.pageBody}>
        				<div className={styles.contentBody}>
          					<div className={styles.content}>
            						<div className={styles.contentHeader}>
              							<div className={styles.contentHeader2}>
                								<div className={styles.schritt7Alt2Header}>
                  									<div className={styles.tagsContainer}>
                    										<div className={styles.tagsContainerWrapper}>
                      											<div className={styles.tagsContainer2}>
                        												<div className={styles.tagesthemenAmount}>
                          													<div className={styles.tagsContainer2}>
                            														<div className={styles.blocktyp}>
                              															<div className={styles.badge}>Zivilrecht</div>
                            														</div>
                          													</div>
                        												</div>
                      											</div>
                    										</div>
                    										<div className={styles.button}>
                      											<img className={styles.iconPencil} alt="" />
                    										</div>
                  									</div>
                  									<div className={styles.typographyH1}>
                    										<div className={styles.thisIsHeading}>Titel der Themenliste</div>
                  									</div>
                  									<div className={styles.beschreibungDesLernplans}>Beschreibung des Lernplans</div>
                								</div>
              							</div>
            						</div>
            						<img className={styles.lineIcon} alt="" />
            						<div className={styles.mainContentWrapper}>
              							<div className={styles.mainContentWrapper2}>
                								<div className={styles.navigationmenuPopover}>
                  									<div className={styles.navigationmenuMenuLink}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.titleText}>Thema 1</div>
                      											<div className={styles.thisIsA}>Beschreibung</div>
                    										</div>
                    										<div className={styles.button2}>
                      											<img className={styles.iconTrash} alt="" />
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.titleText}>Thema 2</div>
                      											<div className={styles.thisIsA}>Beschreibung</div>
                    										</div>
                    										<div className={styles.button2} />
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.titleText}>Thema 3</div>
                      											<div className={styles.thisIsA}>Beschreibung</div>
                    										</div>
                    										<div className={styles.button2}>
                      											<div className={styles.iconTrash2} />
                    										</div>
                  									</div>
                  									<div className={styles.navigationmenuMenuLink2}>
                    										<div className={styles.elementLeft}>
                      											<div className={styles.titleText}>Thema 4</div>
                      											<div className={styles.thisIsA}>Beschreibung</div>
                    										</div>
                    										<div className={styles.button2} />
                  									</div>
                  									<div className={styles.navigationmenuMenuLink5}>
                    										<div className={styles.menuItemHolder}>
                      											<img className={styles.iconPencil} alt="" />
                      											<div className={styles.neuesThema}>Neues Thema</div>
                    										</div>
                  									</div>
                								</div>
                								<div className={styles.themaUndAufgaben}>
                  									<div className={styles.kapitelberschrift}>
                    										<div className={styles.lernplanKapitelMasterHeader}>
                      											<div className={styles.lernblockTitel}>
                        												<div className={styles.thema12}>Thema 1</div>
                      											</div>
                      											<div className={styles.beschreibung}>{`Beschreibung `}</div>
                    										</div>
                  									</div>
                  									<div className={styles.frameParent}>
                    										<img className={styles.frameChild} alt="" />
                    										<div className={styles.aufgabenContainer}>
                      											<div className={styles.itemParent}>
                        												<div className={styles.item}>
                          													<div className={styles.checkbox}>
                            														<div className={styles.checkbox2} />
                            														<div className={styles.fieldContent}>
                              															<div className={styles.label}>Aufgabe</div>
                            														</div>
                          													</div>
                          													<div className={styles.buttonParent}>
                            														<div className={styles.button6}>
                              															<div className={styles.button7}>!</div>
                            														</div>
                            														<div className={styles.button6}>
                              															<div className={styles.button7}>!</div>
                            														</div>
                          													</div>
                        												</div>
                        												<div className={styles.button10}>
                          													<img className={styles.iconTrash} alt="" />
                        												</div>
                      											</div>
                      											<div className={styles.button11}>
                        												<img className={styles.iconPencil} alt="" />
                        												<div className={styles.neueAufgabe}>Neue Aufgabe</div>
                      											</div>
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.scrollBarContainer}>
            						<img className={styles.progressIcon} alt="" />
          					</div>
        				</div>
        				<div className={styles.buttonRowFooter}>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button12}>
              							<div className={styles.button13}>Lernplan archivieren</div>
              							<img className={styles.iconPencil} alt="" />
            						</div>
          					</div>
          					<div className={styles.alertdialogfooter2}>
            						<div className={styles.button14}>
              							<div className={styles.button13}>Abbrechen</div>
            						</div>
            						<div className={styles.button16}>
              							<div className={styles.button13}>Speichern</div>
              							<img className={styles.iconPencil} alt="" />
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className={styles.headerNoMenu}>
        				<img className={styles.logoContainerIcon} alt="" />
        				<div className={styles.navigationmenu} />
        				<div className={styles.avatar}>
          					<div className={styles.cn}>CN</div>
        				</div>
      			</div>
      			<img className={styles.lernplanProzessBaseChild} alt="" />
      			<img className={styles.lernplanProzessBaseItem} alt="" />
    		</div>);
};

export default LernplanProzessBase ;



hier ist das feld was kommen soll wenn man ein thema löschen möchte:

import { FunctionComponent } from 'react';
import styles from './AlertDialog.module.css';


const AlertDialog: FunctionComponent = () => {
  	return (
    		<div className={styles.alertDialog}>
      			<div className={styles.alertdialogheader}>
        				<div className={styles.titleText}>Thema endgültig löschen?</div>
          					<div className={styles.thisIsAn}>Das Thema und die dazu gehörenden Aufgaben werden endgültig gelöscht und können nicht mehr wiederhergestellt werden.</div>
          					</div>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>Abbrechen</div>
            						</div>
            						<div className={styles.button3}>
              							<div className={styles.button2}>Thema löschen</div>
              							<img className={styles.iconTrash} alt="" />
            						</div>
          					</div>
          					</div>);
        				};
        				
        				export default AlertDialog ;


jetzt folgt das dialogfenster was kommen soll, wenn eine aufgabe gelsöcht werden soll: 


import { FunctionComponent } from 'react';
import styles from './AlertDialog.module.css';


const AlertDialog: FunctionComponent = () => {
  	return (
    		<div className={styles.alertDialog}>
      			<div className={styles.alertdialogheader}>
        				<div className={styles.titleText}>Aufgabe endgültig löschen?</div>
          					<div className={styles.thisIsAn}>Die Aufgabe wird endgültig gelöscht und können nicht mehr wiederhergestellt werden.</div>
          					</div>
          					<div className={styles.alertdialogfooter}>
            						<div className={styles.button}>
              							<div className={styles.button2}>Abbrechen</div>
            						</div>
            						<div className={styles.button3}>
              							<div className={styles.button2}>Aufgabe löschen</div>
              							<img className={styles.iconTrash} alt="" />
            						</div>
          					</div>
          					</div>);
        				};
        				
        				export default AlertDialog ;
        				
---

## Analyse

### Aktueller Stand

**Aktueller Flow:** "+ Neue Themenliste" → `createContentPlan()` → `ContentPlanEditCard` (inline bearbeitbar in der Liste)

**Gewünschter Flow:** "+ Neue Themenliste" → **Neue eigene Seite** (`/lernplaene/neu` oder `/lernplaene/:id/bearbeiten`)

### Code-Herkunft

Der bereitgestellte Code stammt aus einem **Figma-Export** (Locofy/Anima):
- CSS Module-Klassen (generisch: `styles.button`, `styles.content`)
- Keine Interaktivität (statischer TSX)
- Muss in React-Komponenten mit Tailwind umgewandelt werden

### Bestehende Datenstruktur

Die `content_plans.rechtsgebiete` JSONB Struktur:

```javascript
rechtsgebiete: [
  {
    id: "uuid",
    rechtsgebietId: "zivilrecht",  // aus subjects.js
    unterrechtsgebiete: [
      {
        id: "uuid",
        unterrechtsgebietId: "bgb-at",
        name: "BGB AT",
        kapitel: [  // ← OPTIONAL: nur für Juristen
          {
            id: "uuid",
            title: "Rechtsgeschäftslehre",
            themen: [
              {
                id: "uuid",
                name: "Willenserklärung",
                completed: false
              }
            ]
          }
        ]
      }
    ]
  }
]
```

### Layout-Analyse aus Figma

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | (leer) | Avatar                                       │
├─────────────────────────────────────────────────────────────────────┤
│ CONTENT HEADER                                                       │
│   [Badge: Rechtsgebiet] [✏️ Bearbeiten]                              │
│   Titel der Themenliste (editierbar)                                │
│   Beschreibung (editierbar)                                         │
├───────────────────────────────┬─────────────────────────────────────┤
│ THEMEN-NAVIGATION (links)     │ THEMA-DETAIL (rechts)               │
│ ┌───────────────────────────┐ │ ┌─────────────────────────────────┐ │
│ │ Thema 1          [🗑️]    │ │ │ Thema 1                         │ │
│ │ Beschreibung              │ │ │ Beschreibung                    │ │
│ ├───────────────────────────┤ │ ├─────────────────────────────────┤ │
│ │ Thema 2                   │ │ │ ☐ Aufgabe   [!][!!] [🗑️]       │ │
│ │ Thema 3          [🗑️]    │ │ │                                 │ │
│ │ Thema 4                   │ │ │ [+] Neue Aufgabe                │ │
│ ├───────────────────────────┤ │ └─────────────────────────────────┘ │
│ │ [+] Neues Thema           │ │                                     │
│ └───────────────────────────┘ │                                     │
├─────────────────────────────────────────────────────────────────────┤
│ FOOTER: [Archivieren]                     [Abbrechen] [Speichern]   │
└─────────────────────────────────────────────────────────────────────┘
```

### Prioritätssystem (bestehend)

| Anzeige | Wert | Bedeutung |
|---------|------|-----------|
| (keine) | `low` | Standard-Priorität |
| `!` | `medium` | Mittlere Priorität |
| `!!` | `high` | Hohe Priorität |

### Hierarchie-Vorschlag

Du hast gefragt, wie man **Rechtsgebiete** und **Unterrechtsgebiete** (und optional **Kapitel**) in das Design integrieren kann.

**Vorschlag: Akkordeon-Navigation mit Ebenen**

```
┌─────────────────────────────────────────────────────────────────────┐
│ NAVIGATION (links)                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ ▼ Zivilrecht                     [+ Untergebiet] [🗑️]              │
│   ▼ BGB AT                       [+ Thema] [🗑️]                    │
│     │ Thema 1                                                       │
│     │ Thema 2                                                       │
│     └ [+ Neues Thema]                                              │
│   ▶ Schuldrecht AT                                                  │
│   └ [+ Neues Untergebiet]                                          │
│                                                                     │
│ ▶ Strafrecht                                                        │
│                                                                     │
│ [+ Neues Rechtsgebiet]                                              │
└─────────────────────────────────────────────────────────────────────┘
```

**Für Juristen mit Kapitel:**

```
│ ▼ Zivilrecht                                                        │
│   ▼ BGB AT                                                          │
│     ▼ Kapitel 1: Rechtsgeschäftslehre    [+ Thema] [🗑️]            │
│       │ Thema 1                                                     │
│       │ Thema 2                                                     │
│     ▶ Kapitel 2: Stellvertretung                                    │
│     └ [+ Neues Kapitel]                                            │
```

---

## Entscheidungen (geklärt am 19.01.2026)

| Frage | Entscheidung |
|-------|--------------|
| **Kapitel-Ebene** | Automatisch für Juristen (`studiengang === 'jura'`) |
| **Abbrechen-Verhalten** | Bestätigungsdialog bei ungespeicherten Änderungen |
| **Speicher-Modus** | **Auto-Save** bei jeder Änderung (kein Speichern-Button nötig) |
| **Rechtsgebiete-Auswahl** | Aus `user_settings` - für Juristen die ausgewählten Rechtsgebiete, für Mediziner/VWLer die erstellten Fächer |
| **Routing** | Nur für **neue** Themenlisten: `/lernplaene/themenliste/neu` - bestehende werden weiterhin inline bearbeitet |

---

## Lösung

### Technischer Implementierungsplan

#### 1. Neue Route

```javascript
// src/App.jsx - neue Route hinzufügen
<Route path="/lernplaene/themenliste/neu" element={<ThemenlisteEditorPage />} />
```

#### 2. Neue Seite: `src/pages/themenliste-editor.jsx`

**Layout-Struktur:**

```jsx
<div className="min-h-screen flex flex-col">
  {/* Header ohne Navigation (wie im Figma) */}
  <Header hideNav />

  {/* Content Area */}
  <div className="flex-1 flex flex-col">
    {/* Content Header: Badge, Titel, Beschreibung */}
    <ThemenlisteHeader
      rechtsgebiet={selectedRechtsgebiet}
      title={title}
      description={description}
      onTitleChange={...}
      onDescriptionChange={...}
    />

    {/* Trennlinie */}
    <hr className="border-neutral-200" />

    {/* Main Content: Split View */}
    <div className="flex-1 flex">
      {/* Linke Navigation (Akkordeon) */}
      <ThemenNavigation
        rechtsgebiete={rechtsgebiete}
        selectedThemaId={selectedThemaId}
        onSelectThema={...}
        onAddRechtsgebiet={...}
        onAddUntergebiet={...}
        onAddKapitel={...}  // nur für Juristen
        onAddThema={...}
        onDeleteThema={...}
        showKapitelLevel={studiengang === 'jura'}
      />

      {/* Rechte Detailansicht */}
      <ThemaDetail
        thema={selectedThema}
        onAddAufgabe={...}
        onDeleteAufgabe={...}
        onTogglePriority={...}
      />
    </div>

    {/* Footer */}
    <ThemenlisteFooter
      onArchive={...}
      onCancel={handleCancel}  // → Bestätigungsdialog
      autoSaveStatus={...}     // "Gespeichert" / "Speichern..."
    />
  </div>
</div>
```

#### 3. Komponenten

| Komponente | Pfad | Beschreibung |
|------------|------|--------------|
| `ThemenlisteEditorPage` | `src/pages/themenliste-editor.jsx` | Hauptseite |
| `ThemenlisteHeader` | `src/features/themenliste/components/` | Badge + Titel + Beschreibung |
| `ThemenNavigation` | `src/features/themenliste/components/` | Akkordeon-Navigation links |
| `ThemaDetail` | `src/features/themenliste/components/` | Aufgaben-Liste rechts |
| `ThemenlisteFooter` | `src/features/themenliste/components/` | Archivieren / Abbrechen / Status |
| `DeleteConfirmDialog` | `src/components/ui/` | Wiederverwendbar für Thema/Aufgabe |

#### 4. Auto-Save Logik

```javascript
// Debounced auto-save (500ms nach letzter Änderung)
const debouncedSave = useMemo(
  () => debounce((data) => {
    saveContentPlanToSupabase(data);
    setAutoSaveStatus('saved');
  }, 500),
  [saveContentPlanToSupabase]
);

// Bei jeder Änderung
useEffect(() => {
  setAutoSaveStatus('saving');
  debouncedSave(contentPlan);
}, [contentPlan]);
```

#### 5. Abbrechen-Dialog

```jsx
const handleCancel = () => {
  if (hasUnsavedChanges) {
    setShowCancelDialog(true);
  } else {
    navigate('/lernplaene');
  }
};

// Dialog-Text:
// "Ungespeicherte Änderungen"
// "Möchtest du die Seite wirklich verlassen? Nicht gespeicherte Änderungen gehen verloren."
// [Bleiben] [Verwerfen]
```

#### 6. Tailwind-Klassen (gemäß tailwind.config.js)

| Element | Klassen |
|---------|---------|
| Badge | `px-2 py-0.5 text-xs font-medium rounded-md bg-{color}-100 text-{color}-700` |
| Titel | `text-2xl font-extralight text-neutral-950` |
| Beschreibung | `text-sm text-neutral-400` |
| Nav-Item | `px-3 py-2 rounded-lg hover:bg-neutral-100` |
| Nav-Item aktiv | `bg-neutral-100 border-l-2 border-neutral-900` |
| Button Primary | `bg-neutral-900 text-neutral-50 rounded-3xl` |
| Button Secondary | `border border-neutral-200 rounded-3xl` |
| Priorität ! | `text-amber-600` |
| Priorität !! | `text-red-600` |

#### 7. Änderung in lernplan-content.jsx

```javascript
// Vorher:
const handleCreateNew = (type = 'lernplan') => {
  const newPlan = createContentPlan({ type, name: '' });
  setExpandedIds(prev => new Set([...prev, newPlan.id]));
  setNewPlanId(newPlan.id);
  setIsEditMode(true);
};

// Nachher:
const handleCreateNew = (type = 'lernplan') => {
  if (type === 'themenliste') {
    // Navigiere zur neuen Editor-Seite
    navigate('/lernplaene/themenliste/neu');
  } else {
    const newPlan = createContentPlan({ type, name: '' });
    setExpandedIds(prev => new Set([...prev, newPlan.id]));
    setNewPlanId(newPlan.id);
    setIsEditMode(true);
  }
};
```

---

## Status

- [x] Route in App.jsx hinzufügen
- [x] ThemenlisteEditorPage erstellen
- [x] ThemenlisteHeader Komponente
- [x] ThemenNavigation Komponente (Akkordeon)
- [x] ThemaDetail Komponente (Aufgaben)
- [x] ThemenlisteFooter Komponente
- [x] DeleteConfirmDialog (wiederverwendbar)
- [x] CancelConfirmDialog erstellen
- [x] Auto-Save Logik implementieren
- [x] Abbrechen-Dialog implementieren
- [x] lernplan-content.jsx anpassen (Navigation statt inline)

### Erstellte Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/router.jsx` | Route `/lernplan/themenliste/neu` hinzugefügt |
| `src/pages/themenliste-editor.jsx` | Hauptseite mit State-Management und Auto-Save |
| `src/features/themenliste/components/themenliste-header.jsx` | Header mit Badge, Titel, Beschreibung |
| `src/features/themenliste/components/themen-navigation.jsx` | Akkordeon-Navigation links |
| `src/features/themenliste/components/thema-detail.jsx` | Aufgaben-Liste rechts |
| `src/features/themenliste/components/themenliste-footer.jsx` | Footer mit Status |
| `src/features/themenliste/components/delete-confirm-dialog.jsx` | Lösch-Bestätigung |
| `src/features/themenliste/components/cancel-confirm-dialog.jsx` | Abbrechen-Bestätigung |
| `src/features/themenliste/index.js` | Feature-Exports |

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/lernplan/lernplan-content.jsx` | `handleCreateNew('themenliste')` navigiert jetzt zu `/lernplan/themenliste/neu` |

---

## Phase 2: UX-Verbesserungen (geplant)

**Datum:** 19.01.2026
**Status:** Offen

### Identifizierte Probleme

1. **Breitenverhältnis:** Linke Seite ist zu klein im Verhältnis zur rechten Seite
2. **Unübersichtlicher Erstellungsprozess:** Aktuell muss man jede Ebene einzeln aufklappen und erstellen (zu viele Klicks)
3. **Keine Draft-Persistenz:** Beim Verlassen der Seite gehen alle Änderungen verloren

### Geplante Änderungen

#### 1. Breitenverhältnis anpassen

**Aktuell:** Nicht definiert (flex-grow)
**Neu:** 40/60 (links/rechts)

```jsx
{/* Linke Navigation */}
<div className="w-2/5 ...">  {/* 40% */}
  <ThemenNavigation ... />
</div>

{/* Rechte Detailansicht */}
<div className="w-3/5 ...">  {/* 60% */}
  <ThemaDetail ... />
</div>
```

#### 2. Automatisches Aufklappen bei neuem Rechtsgebiet

**Aktuelles Verhalten:**
1. User klickt "Neues Rechtsgebiet" → Rechtsgebiet wird hinzugefügt (eingeklappt)
2. User muss Rechtsgebiet aufklappen
3. User klickt "Neues Unterrechtsgebiet" → muss Namen eingeben
4. User muss Unterrechtsgebiet aufklappen
5. User klickt "Neues Kapitel" (falls Jura) → muss Namen eingeben
6. User muss Kapitel aufklappen
7. User klickt "Neues Thema" → muss Namen eingeben

**Gewünschtes Verhalten:**
1. User wählt Rechtsgebiet aus Dropdown → **Alles klappt automatisch auf mit leeren Feldern**
2. Leeres Unterrechtsgebiet-Dropdown erscheint (zum Auswählen)
3. Leeres Kapitel-Feld erscheint (falls Kapitel-Ebene aktiviert)
4. Leeres Thema-Eingabefeld erscheint
5. User füllt einfach von oben nach unten aus

**Buttons für weitere Einträge:**
- "Neues Unterrechtsgebiet" Button → Fügt weiteres Unterrechtsgebiet-Dropdown hinzu
- "+ Neues Thema" Button → Fügt weiteres Thema-Eingabefeld hinzu
- "+ Neues Kapitel" Button (falls Kapitel aktiviert) → Fügt weiteres Kapitel-Feld hinzu

#### 3. Dropdown für Unterrechtsgebiete

**Aktuell:** Texteingabe für Unterrechtsgebiet-Namen
**Neu:** Dropdown-Menü mit vordefinierten Unterrechtsgebieten

```jsx
// Dropdown zeigt nur Unterrechtsgebiete des ausgewählten Rechtsgebiets
const unterrechtsgebieteOptions = ALL_UNTERRECHTSGEBIETE.filter(
  urg => urg.rechtsgebietId === selectedRechtsgebiet.rechtsgebietId
);

<select onChange={handleSelectUnterrechtsgebiet}>
  <option value="">Unterrechtsgebiet auswählen...</option>
  {unterrechtsgebieteOptions.map(urg => (
    <option key={urg.id} value={urg.id}>{urg.name}</option>
  ))}
</select>
```

**Datenquelle:** `src/data/unterrechtsgebiete-data.js` → `ALL_UNTERRECHTSGEBIETE`

#### 4. Kapitel-Ebene als Einstellung

**Aktuelles Verhalten:** Kapitel-Ebene ist automatisch aktiviert für `isJuraStudiengang(studiengang)`
**Neues Verhalten:** Kapitel-Ebene wird durch eine explizite Einstellung gesteuert

**Neue Einstellung in `user_settings`:**

```javascript
// user_settings Tabelle
{
  user_id: "uuid",
  studiengang: "rechtswissenschaften",
  kapitel_ebene_aktiviert: false,  // NEU: Default = false
  // ... andere Einstellungen
}
```

**Sichtbarkeit der Einstellung:**
- Nur für Juristen sichtbar (`isJuraStudiengang(studiengang) === true`)
- Nicht-Juristen sehen diese Option gar nicht

**Einstellungsseite (src/pages/einstellungen.jsx):**

```jsx
{isJura && (
  <div className="flex items-center justify-between">
    <div>
      <label className="text-sm font-medium">Kapitel-Ebene aktivieren</label>
      <p className="text-xs text-neutral-400">
        Ermöglicht eine zusätzliche Hierarchieebene zwischen Unterrechtsgebiet und Thema
      </p>
    </div>
    <Switch
      checked={settings.kapitelEbeneAktiviert}
      onChange={(value) => updateSettings({ kapitelEbeneAktiviert: value })}
    />
  </div>
)}
```

**ThemenlisteEditor verwendet jetzt:**

```javascript
// Vorher:
const { isJura, hierarchyLabels } = useStudiengang();
const showKapitelLevel = isJura;

// Nachher:
const { isJura, hierarchyLabels } = useStudiengang();
const { settings } = useUserSettings();
const showKapitelLevel = isJura && settings.kapitelEbeneAktiviert;
```

#### 5. Draft-Persistenz (Entwurf speichern)

**Problem:** Wenn User die Seite verlässt (Navigation, Browser schließen, etc.) gehen alle Änderungen verloren.

**Lösung:** Draft wird automatisch in localStorage gespeichert und beim nächsten Öffnen wiederhergestellt.

**localStorage Key:** `prepwell_themenliste_draft`

**Draft-Struktur:**

```javascript
{
  contentPlan: {
    id: "draft-uuid",
    type: "themenliste",
    name: "...",
    description: "...",
    rechtsgebiete: [...],
    createdAt: "2026-01-19T...",
    updatedAt: "2026-01-19T..."
  },
  lastModified: "2026-01-19T..."
}
```

**Lifecycle:**

1. **Beim Laden der Seite:**
   ```javascript
   useEffect(() => {
     const draft = localStorage.getItem('prepwell_themenliste_draft');
     if (draft) {
       const parsed = JSON.parse(draft);
       // Zeige Dialog: "Möchtest du den vorherigen Entwurf fortsetzen?"
       setShowDraftDialog(true);
       setPendingDraft(parsed);
     }
   }, []);
   ```

2. **Bei jeder Änderung (zusammen mit Auto-Save zu Supabase):**
   ```javascript
   useEffect(() => {
     if (hasChanges) {
       localStorage.setItem('prepwell_themenliste_draft', JSON.stringify({
         contentPlan,
         lastModified: new Date().toISOString()
       }));
     }
   }, [contentPlan, hasChanges]);
   ```

3. **Nach erfolgreichem Speichern (wenn User fertig ist):**
   ```javascript
   const handleFinish = async () => {
     await saveContentPlanToSupabase(contentPlan);
     localStorage.removeItem('prepwell_themenliste_draft');  // Draft löschen
     navigate('/lernplan');
   };
   ```

4. **Wenn User "Neu beginnen" wählt:**
   ```javascript
   const handleDiscardDraft = () => {
     localStorage.removeItem('prepwell_themenliste_draft');
     setShowDraftDialog(false);
     // Starte mit leerem ContentPlan
   };
   ```

**Draft-Dialog:**

```jsx
<Dialog open={showDraftDialog}>
  <DialogTitle>Unvollständiger Entwurf gefunden</DialogTitle>
  <DialogDescription>
    Du hast einen unvollständigen Entwurf vom {formatDate(draft.lastModified)}.
    Möchtest du diesen fortsetzen oder neu beginnen?
  </DialogDescription>
  <DialogFooter>
    <Button variant="secondary" onClick={handleDiscardDraft}>
      Neu beginnen
    </Button>
    <Button onClick={handleResumeDraft}>
      Entwurf fortsetzen
    </Button>
  </DialogFooter>
</Dialog>
```

---

### Implementierungsplan Phase 2

#### Schritt 1: Breitenverhältnis (40/60)

**Datei:** `src/pages/themenliste-editor.jsx`

Änderung im JSX:
```jsx
<div className="flex-1 flex overflow-hidden">
  {/* Left Navigation - 40% */}
  <div className="w-2/5 border-r border-neutral-200 overflow-y-auto">
    <ThemenNavigation ... />
  </div>

  {/* Right Detail View - 60% */}
  <div className="w-3/5 overflow-y-auto">
    <ThemaDetail ... />
  </div>
</div>
```

#### Schritt 2: Kapitel-Einstellung in user_settings

**Dateien:**
- `src/contexts/studiengang-context.jsx` - `kapitelEbeneAktiviert` State hinzufügen
- `src/pages/einstellungen.jsx` - Toggle für Kapitel-Ebene (nur für Juristen)
- `supabase/schema.sql` - `kapitel_ebene_aktiviert` Spalte (default: false)

**Migration:**
```sql
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS kapitel_ebene_aktiviert BOOLEAN DEFAULT FALSE;
```

#### Schritt 3: Dropdown für Unterrechtsgebiete

**Datei:** `src/features/themenliste/components/themen-navigation.jsx`

Ersetze Texteingabe durch Select-Komponente:
```jsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const availableUnterrechtsgebiete = ALL_UNTERRECHTSGEBIETE.filter(
  urg => urg.rechtsgebietId === rechtsgebiet.rechtsgebietId
);

<Select onValueChange={(value) => handleAddUntergebiet(rg.id, value)}>
  <SelectTrigger>
    <SelectValue placeholder="Unterrechtsgebiet wählen..." />
  </SelectTrigger>
  <SelectContent>
    {availableUnterrechtsgebiete.map(urg => (
      <SelectItem key={urg.id} value={urg.id}>
        {urg.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Schritt 4: Automatisches Aufklappen

**Datei:** `src/features/themenliste/components/themen-navigation.jsx`

State für "expanded" Items und automatisches Aufklappen bei Erstellung:

```javascript
const [expandedRechtsgebiete, setExpandedRechtsgebiete] = useState(new Set());
const [expandedUntergebiete, setExpandedUntergebiete] = useState(new Set());
const [expandedKapitel, setExpandedKapitel] = useState(new Set());

// Bei Hinzufügen eines Rechtsgebiets: alles aufklappen
const handleAddRechtsgebiet = (rechtsgebietId) => {
  const newRg = onAddRechtsgebiet(rechtsgebietId);

  // Automatisch aufklappen
  setExpandedRechtsgebiete(prev => new Set([...prev, newRg.id]));

  // Leeres Unterrechtsgebiet-Dropdown anzeigen (als "pending")
  setPendingUntergebiet({ rgId: newRg.id });
};
```

**"Pending" Items für leere Eingabefelder:**

```javascript
const [pendingUntergebiet, setPendingUntergebiet] = useState(null); // { rgId }
const [pendingKapitel, setPendingKapitel] = useState(null); // { rgId, urgId }
const [pendingThema, setPendingThema] = useState(null); // { rgId, urgId, kapitelId? }
```

#### Schritt 5: Draft-Persistenz

**Datei:** `src/pages/themenliste-editor.jsx`

```javascript
const DRAFT_KEY = 'prepwell_themenliste_draft';

// State für Draft-Dialog
const [showDraftDialog, setShowDraftDialog] = useState(false);
const [pendingDraft, setPendingDraft] = useState(null);

// Beim Laden prüfen ob Draft existiert
useEffect(() => {
  try {
    const draftJson = localStorage.getItem(DRAFT_KEY);
    if (draftJson) {
      const draft = JSON.parse(draftJson);
      setPendingDraft(draft);
      setShowDraftDialog(true);
    }
  } catch (e) {
    console.error('Error loading draft:', e);
  }
}, []);

// Draft bei jeder Änderung speichern
useEffect(() => {
  if (hasChanges) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      contentPlan,
      lastModified: new Date().toISOString()
    }));
  }
}, [contentPlan, hasChanges]);

// Draft fortsetzen
const handleResumeDraft = () => {
  setContentPlan(pendingDraft.contentPlan);
  setShowDraftDialog(false);
  setPendingDraft(null);
};

// Neu beginnen (Draft verwerfen)
const handleDiscardDraft = () => {
  localStorage.removeItem(DRAFT_KEY);
  setShowDraftDialog(false);
  setPendingDraft(null);
};

// Nach erfolgreichem Speichern: Draft löschen
const handleFinish = async () => {
  await saveContentPlanToSupabase(contentPlan);
  localStorage.removeItem(DRAFT_KEY);
  navigate('/lernplan');
};
```

**Neue Komponente:** `src/features/themenliste/components/draft-dialog.jsx`

```jsx
const DraftDialog = ({ open, draft, onResume, onDiscard }) => {
  const formattedDate = draft?.lastModified
    ? new Date(draft.lastModified).toLocaleString('de-DE')
    : '';

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogTitle>Unvollständiger Entwurf gefunden</DialogTitle>
        <DialogDescription>
          Du hast einen unvollständigen Entwurf vom {formattedDate}.
          Möchtest du diesen fortsetzen oder neu beginnen?
        </DialogDescription>
        <DialogFooter>
          <Button variant="secondary" onClick={onDiscard}>
            Neu beginnen
          </Button>
          <Button onClick={onResume}>
            Entwurf fortsetzen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

### Checkliste Phase 2

- [ ] Breitenverhältnis auf 40/60 ändern
- [ ] Kapitel-Einstellung in Supabase hinzufügen (Migration)
- [ ] Kapitel-Toggle in Einstellungen (nur für Juristen)
- [ ] StudiengangContext um `kapitelEbeneAktiviert` erweitern
- [ ] ThemenlisteEditor: `showKapitelLevel` aus Settings lesen
- [ ] Dropdown für Unterrechtsgebiete implementieren
- [ ] Automatisches Aufklappen bei neuem Rechtsgebiet
- [ ] "Pending" State für leere Eingabefelder
- [ ] Draft-Persistenz in localStorage
- [ ] DraftDialog Komponente erstellen
- [ ] Draft beim Speichern/Fertigstellen löschen

---

### Betroffene Dateien Phase 2

| Datei | Änderung |
|-------|----------|
| `src/pages/themenliste-editor.jsx` | Breitenverhältnis, Draft-Logik, showKapitelLevel aus Settings |
| `src/features/themenliste/components/themen-navigation.jsx` | Dropdown, auto-expand, pending states |
| `src/features/themenliste/components/draft-dialog.jsx` | NEU: Dialog für Draft-Wiederherstellung |
| `src/contexts/studiengang-context.jsx` | `kapitelEbeneAktiviert` State hinzufügen |
| `src/pages/einstellungen.jsx` | Toggle für Kapitel-Ebene (nur Juristen) |
| `supabase/migrations/YYYYMMDD_add_kapitel_ebene.sql` | NEU: Migration für Spalte |
