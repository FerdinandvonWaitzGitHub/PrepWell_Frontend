# To-Dos & Aufgaben

**Status: BEHOBEN**

## Problem (ursprünglich)
- To-Dos sollten bearbeitbar sein.
- Aufgabenpriorisierung (Nice-to-have):
  Klick-Zyklus zur Priorität:
  - Klick → !
  - Klick → !!
  - Klick → Standard (keine Priorität)

## Lösung

### Implementierte Datei:
- `src/components/dashboard/session-widget.jsx`

### 1. To-Dos bearbeitbar (TICKET-5, Zeilen 228-265)
- **Doppelklick** auf eine Aufgabe startet den Bearbeitungsmodus
- **Enter** zum Speichern, **Escape** zum Abbrechen
- Inline-Editing direkt in der Aufgabenliste

### 2. Aufgabenpriorisierung (Zeilen 156-210)
- **Klick-Zyklus** auf das `!`-Symbol:
  - Standard → Mittel (!) → Hoch (!!) → Standard
