# PW-215: Priority Toggle - Zwei-Ausrufezeichen Design

## Anforderung

Neues visuelles Design für den Priority-Toggle:

| Zustand | Linkes ! | Rechtes ! | Sichtbarkeit |
|---------|----------|-----------|--------------|
| `none`  | grau     | grau      | nur bei Hover |
| `medium`| schwarz  | grau      | immer sichtbar |
| `high`  | schwarz  | schwarz   | immer sichtbar |

### Klick-Zyklus:
```
none (!! grau, hover) → medium (!● !○) → high (!● !●) → none (!! grau, hover)
```

## Betroffene Dateien

Alle Stellen wo der Priority-Button gerendert wird:

| # | Datei | Zeile | Aktueller Stand |
|---|-------|-------|-----------------|
| 1 | session-widget.jsx | ~830-848 | Ein Button mit `○/!/!!` |
| 2 | thema-detail.jsx | ~148-157 | Ein Button mit `priority.text` |
| 3 | step-12-themen-edit.jsx | ~156-170 | Ein Button mit `○/!/!!` |
| 4 | step-12-themen-edit-v2.jsx | ~184-198 | Ein Button mit `○/!/!!` |

## Implementierungsansatz

### Option A: Inline Zwei-Span Lösung (Empfohlen)
Ersetze den einzelnen Button-Text durch zwei separate `<span>` Elemente:

```jsx
<button onClick={...} className="flex items-center ...">
  <span className={priority === 'medium' || priority === 'high' ? 'text-neutral-900' : 'text-neutral-300'}>!</span>
  <span className={priority === 'high' ? 'text-neutral-900' : 'text-neutral-300'}>!</span>
</button>
```

### Option B: Wiederherstellung der Zwei-Button Lösung
Zwei separate Buttons wie ursprünglich in thema-detail.jsx.

**Empfehlung:** Option A - weniger Code-Änderungen, gleicher visueller Effekt.

## SCOPE-FENCE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ERLAUBT                                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ ✅ Button-Inhalt ändern: von `{text}` zu zwei `<span>` Elementen            │
│ ✅ CSS-Klassen für Farblogik anpassen                                       │
│ ✅ Hover-Verhalten anpassen (opacity-0 → immer sichtbar bei medium/high)    │
├─────────────────────────────────────────────────────────────────────────────┤
│ VERBOTEN                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ❌ Toggle-Logik ändern (Zyklus bleibt: none → medium → high → none)         │
│ ❌ Neue Komponenten erstellen                                               │
│ ❌ Priority-Werte ändern (bleiben 'none', 'medium', 'high')                 │
│ ❌ Andere UI-Elemente modifizieren                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## CHANGE-BUDGET

- Max 4 Dateien
- Max 40 geänderte Zeilen (ca. 10 pro Datei)

## Implementierung pro Datei

### 1. session-widget.jsx (~830-848)

**Vorher:**
```jsx
<button className={`... ${priority === 'none' ? 'opacity-0 group-hover:opacity-100' : ''}`}>
  {priority === 'high' ? '!!' : priority === 'medium' ? '!' : '○'}
</button>
```

**Nachher:**
```jsx
<button className={`... ${priority === 'none' ? 'opacity-0 group-hover:opacity-100' : ''}`}>
  <span className={priority === 'medium' || priority === 'high' ? 'text-neutral-900' : 'text-neutral-300'}>!</span>
  <span className={priority === 'high' ? 'text-neutral-900' : 'text-neutral-300'}>!</span>
</button>
```

### 2. thema-detail.jsx (~148-157)

**Vorher:**
```jsx
<button className={`... ${priority.color || 'text-neutral-200'}`}>
  {priority.text || '○'}
</button>
```

**Nachher:**
```jsx
<button className="...">
  <span className={aufgabe.priority === 'medium' || aufgabe.priority === 'high' ? 'text-amber-600' : 'text-neutral-200'}>!</span>
  <span className={aufgabe.priority === 'high' ? 'text-red-600' : 'text-neutral-200'}>!</span>
</button>
```

### 3. step-12-themen-edit.jsx (~156-170)

**Nachher:**
```jsx
<button className="...">
  <span className={aufgabe.priority === 'medium' || aufgabe.priority === 'high' ? 'text-amber-600' : 'text-neutral-300'}>!</span>
  <span className={aufgabe.priority === 'high' ? 'text-red-600' : 'text-neutral-300'}>!</span>
</button>
```

### 4. step-12-themen-edit-v2.jsx (~184-198)

Gleiche Änderung wie #3.

## Akzeptanzkriterien

- [ ] Bei `none`: Zwei graue `!!` erscheinen beim Hover
- [ ] Bei `medium`: Erstes `!` farbig (amber), zweites grau
- [ ] Bei `high`: Beide `!!` farbig (rot)
- [ ] Klick-Zyklus funktioniert: none → medium → high → none
- [ ] Keine Regression bei bestehenden Aufgaben

## Testplan

1. Dashboard → Themenliste → Aufgabe hovern
   - Erwartung: Zwei graue `!!` erscheinen
2. Klicken (1x)
   - Erwartung: Erstes `!` wird farbig
3. Klicken (2x)
   - Erwartung: Beide `!!` werden farbig
4. Klicken (3x)
   - Erwartung: Beide `!!` werden wieder grau
5. Themenliste-Editor → gleicher Test
6. Wizard Step 12 → gleicher Test
