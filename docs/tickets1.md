# Check-in / Check-out

**Status: BEHOBEN**

## Problem (ursprünglich)
- Wenn nur ein Check-in durchgeführt wird, erscheint fälschlicherweise die Meldung „Check-ins erledigt" mit Doppelhaken.

**Erwartetes Verhalten:**
- Check-in erledigt → ein Haken
- Abend-Check-out erledigt → eigener Status

## Lösung (TICKET-1 FIX)

### Implementierte Dateien:
- `src/hooks/use-dashboard.js` (Zeilen 202-244)
- `src/components/dashboard/dashboard-sub-header.jsx` (Zeilen 217-256)

### Logik:
1. **Status-Berechnung** (`use-dashboard.js`):
   - `count` zählt erledigte Check-ins (0, 1, oder 2)
   - `allDone` ist nur `true` wenn beide Check-ins erledigt sind

2. **Icon-Anzeige** (`dashboard-sub-header.jsx`):
   - `count === 1` → Einzelner Haken
   - `allDone && count >= 2` → Doppelhaken

3. **Label-Anzeige**:
   - 1 Check-in → "Morgen-Check-in erledigt" oder "Abend-Check-in erledigt"
   - 2 Check-ins → "Check-Ins erledigt"
