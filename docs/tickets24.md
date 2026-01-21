# Ticket 24: Themenliste Navigation - UI-Änderungen werden nicht angezeigt

**Datum:** 19.01.2026
**Status:** Offen
**Priorität:** Hoch
**Abhängigkeiten:** T23 (Themenliste Editor Bug Fixes)

---

## Zusammenfassung

Die Code-Änderungen in `themen-navigation.jsx` wurden korrekt implementiert, aber der Browser zeigt teilweise die alte UI an.

| Änderung | Code-Status | Browser-Status |
|----------|-------------|----------------|
| Schwarzer Rand bei ausgewähltem Thema entfernen | ✅ Implementiert | ✅ Funktioniert |
| "+" Button aus Rechtsgebiet-Header entfernen | ✅ Implementiert | ❌ Zeigt noch "+" |
| "+" Button aus Unterrechtsgebiet-Header entfernen | ✅ Implementiert | ❌ Zeigt noch "+" |
| "+ Neues Unterrechtsgebiet" Button hinzufügen | ✅ Implementiert | ❌ Nicht sichtbar |
| "+ Neues Thema" Button hinzufügen | ✅ Implementiert | ❌ Nicht sichtbar |

---

## Ist-Zustand im Code

### 1. Rechtsgebiet-Header (Zeilen 151-163)

```jsx
<div className="flex items-center gap-1">
  {/* T23: Delete Rechtsgebiet */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      onDeleteRechtsgebiet?.(rg.id);
    }}
    className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
    title={`${hierarchyLabels?.level1 || 'Rechtsgebiet'} löschen`}
  >
    <Trash2 size={14} />
  </button>
</div>
```

**Erwartetes Verhalten:** Nur Delete-Button (unsichtbar bis Hover), KEIN Plus-Button
**Aktuelles Browser-Verhalten:** Plus-Button sichtbar

### 2. Unterrechtsgebiet-Header (Zeilen 223-235)

```jsx
<div className="flex items-center gap-1">
  {/* T23: Delete Unterrechtsgebiet */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      onDeleteUnterrechtsgebiet?.(urg.id, rg.id);
    }}
    className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
    title={`${hierarchyLabels?.level2 || 'Untergebiet'} löschen`}
  >
    <Trash2 size={12} />
  </button>
</div>
```

**Erwartetes Verhalten:** Nur Delete-Button (unsichtbar bis Hover), KEIN Plus-Button
**Aktuelles Browser-Verhalten:** Plus-Button sichtbar

### 3. Plus-Icons im Code (nur 4 Stellen)

```bash
$ grep -n "<Plus" themen-navigation.jsx
324:  <Plus size={10} />   # "+ Neues Thema" Button (Jura/Kapitel)
406:  <Plus size={12} />   # "+ Neues Thema" Button (non-Jura)
421:  <Plus size={12} />   # "+ Neues Unterrechtsgebiet" Button
473:  <Plus size={16} />   # "+ Neues Rechtsgebiet" Button (unten)
```

Alle 4 Plus-Icons sind in den NEUEN Buttons, nicht in den Headers.

---

## Soll-Zustand im Browser

### Navigation-Struktur

```
▼ Öffentliches Recht                    [🗑️ nur bei Hover]
  ▼ Staatsorganisationsrecht            [🗑️ nur bei Hover]
      tester                            [🗑️ nur bei Hover]
      + Neues Thema                     ← NEU
    + Neues Unterrechtsgebiet           ← NEU
+ Neues Rechtsgebiet
```

### Aktueller Browser-Zustand (falsch)

```
▼ Öffentliches Recht                    [+]  ← SOLLTE WEG SEIN
  ▼ Staatsorganisationsrecht            [+]  ← SOLLTE WEG SEIN
      tester
+ Neues Rechtsgebiet
```

---

## Mögliche Ursachen

### 1. Browser-Cache (Wahrscheinlichkeit: HOCH)

**Problem:** Der Browser cached JavaScript-Bundles und liefert alte Versionen aus.

**Symptome:**
- Manche Änderungen funktionieren (schwarzer Rand weg)
- Andere Änderungen nicht (Plus-Buttons noch da)

**Lösungen:**
```bash
# Option A: Hard Refresh
Ctrl+Shift+R (Windows) oder Cmd+Shift+R (Mac)

# Option B: DevTools Cache deaktivieren
F12 → Network Tab → "Disable cache" aktivieren → Seite neu laden

# Option C: Inkognito/Private Fenster
Neues Inkognito-Fenster öffnen → URL eingeben
```

### 2. Vite HMR (Hot Module Replacement) fehlgeschlagen (Wahrscheinlichkeit: MITTEL)

**Problem:** Vite's Hot Module Replacement hat die Änderungen nicht korrekt übernommen.

**Symptome:**
- Teilweise Updates (CSS funktioniert, JSX nicht)
- Keine Fehlermeldung im Terminal

**Lösungen:**
```bash
# Option A: Dev-Server neu starten
Ctrl+C im Terminal
npm run dev

# Option B: Vite Cache löschen
rmdir /s /q node_modules\.vite   # Windows
rm -rf node_modules/.vite        # Mac/Linux
npm run dev
```

### 3. Service Worker cached alte Version (Wahrscheinlichkeit: NIEDRIG)

**Problem:** Falls ein Service Worker registriert ist, cached er möglicherweise alte Assets.

**Prüfen:**
```
F12 → Application → Service Workers → Alle unregistrieren
```

**Lösungen:**
```javascript
// In DevTools Console:
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```

### 4. Falscher Import/Export (Wahrscheinlichkeit: SEHR NIEDRIG)

**Problem:** Die Komponente könnte von einem anderen Ort importiert werden.

**Prüfen:**
```bash
grep -r "ThemenNavigation" src/ --include="*.jsx" --include="*.js"
```

**Erwarteter Import in themenliste-editor.jsx:**
```jsx
import ThemenNavigation from '../features/themenliste/components/themen-navigation';
```

### 5. Build-Cache bei Production Build (Wahrscheinlichkeit: NIEDRIG für Dev)

**Problem:** Bei `npm run build` könnte ein alter Build gecached sein.

**Lösungen:**
```bash
# Dist-Ordner löschen und neu bauen
rmdir /s /q dist   # Windows
rm -rf dist        # Mac/Linux
npm run build
```

### 6. ESLint/Prettier Auto-Fix hat Code geändert (Wahrscheinlichkeit: SEHR NIEDRIG)

**Problem:** Ein Linter könnte den Code automatisch zurückgeändert haben.

**Prüfen:**
```bash
# Aktuellen Datei-Inhalt prüfen
cat src/features/themenliste/components/themen-navigation.jsx | grep -A5 "flex items-center gap-1"
```

---

## Debugging-Schritte

### Schritt 1: Code verifizieren

```bash
# Prüfen ob Plus in Headers vorkommt
grep -n "Plus" src/features/themenliste/components/themen-navigation.jsx

# Erwartete Ausgabe: NUR Zeilen 324, 406, 421, 473
# NICHT in den Header-Bereichen (150-165, 220-240)
```

### Schritt 2: Browser-Cache leeren

```
1. F12 öffnen (DevTools)
2. Rechtsklick auf Refresh-Button
3. "Empty Cache and Hard Reload" wählen
```

### Schritt 3: Dev-Server neu starten

```bash
# Terminal 1
Ctrl+C
npm run dev

# Browser: Seite neu laden
```

### Schritt 4: Vite Cache löschen

```bash
# Windows
rmdir /s /q node_modules\.vite

# Mac/Linux
rm -rf node_modules/.vite

# Dann
npm run dev
```

### Schritt 5: Anderer Browser testen

```
Chrome → Firefox oder umgekehrt
Oder: Inkognito-Modus
```

### Schritt 6: Console-Log hinzufügen (temporär)

```jsx
// In themen-navigation.jsx, Zeile 137 nach dem map:
console.log('ThemenNavigation rendered, rechtsgebiete:', rechtsgebiete.length);
```

Wenn dieser Log NICHT erscheint, wird eine andere Version der Komponente verwendet.

---

## Schnell-Fix Checkliste

- [ ] `Ctrl+Shift+R` (Hard Refresh)
- [ ] DevTools → Network → "Disable cache" → Refresh
- [ ] Dev-Server stoppen (`Ctrl+C`) und neu starten (`npm run dev`)
- [ ] Vite Cache löschen: `rmdir /s /q node_modules\.vite`
- [ ] Inkognito-Fenster testen
- [ ] Anderen Browser testen

---

## Falls nichts funktioniert

### Option A: Komponente umbenennen (Force Re-Import)

```bash
# Temporär umbenennen
mv themen-navigation.jsx themen-navigation-v2.jsx

# Import in themenliste-editor.jsx ändern
# von: import ThemenNavigation from '...themen-navigation'
# zu:  import ThemenNavigation from '...themen-navigation-v2'

# Nach Test zurück umbenennen
```

### Option B: Node Modules komplett neu installieren

```bash
rmdir /s /q node_modules   # Windows
rm -rf node_modules        # Mac/Linux
npm install
npm run dev
```

### Option C: Unique Key hinzufügen um Re-Render zu erzwingen

```jsx
// In themenliste-editor.jsx, ThemenNavigation Aufruf:
<ThemenNavigation
  key={`nav-${Date.now()}`}  // Force re-render
  rechtsgebiete={...}
  ...
/>
```

---

## Betroffene Dateien

| Datei | Status |
|-------|--------|
| `src/features/themenliste/components/themen-navigation.jsx` | Code korrekt |
| `src/pages/themenliste-editor.jsx` | Importiert ThemenNavigation |

---

## Nächste Schritte

1. Debugging-Schritte 1-6 durchführen
2. Ergebnis dokumentieren
3. Falls Problem weiterhin besteht: Option A, B oder C versuchen
4. Ticket schließen wenn UI korrekt angezeigt wird
