# Figma Implementation - Todo Liste

> Basierend auf FIGMA_IMPLEMENTATION_GAP.md
> Erstellt: 2025-12-31

---

## Phase 1: Styling-Fixes (2-3 Tage)

### 1.1 Typografie-Fixes
- [x] Navigation: `font-normal` → `font-light` für inaktive Items
- [x] Lernplan-Panel: Titel zu `font-extralight 24px`
- [x] Beschreibungen: Farbe zu `#a3a3a3` (neutral-400)
- [x] Gray → Neutral: Alle `gray-*` Klassen zu `neutral-*` konvertieren (Dashboard, Header, Navigation)
- [x] Gray → Neutral: Restliche ~100 Dateien konvertiert

### 1.2 Farben-Fixes
- [x] Muted Text: Vereinheitlichen auf `text-neutral-400` (#a3a3a3)
- [x] Progress Bars: `slate-600` → `neutral-900`
- [x] Borders: `gray-200` → `neutral-200`
- [ ] Secondary BG: Überprüfen ob `neutral-100` (#f5f5f5) korrekt

### 1.3 Spacing & Radius
- [ ] Card Radius: Vereinheitlichen auf `rounded-lg` (8px)
- [ ] Task Padding: Auf `p-2.5` (10px) anpassen
- [ ] Container Padding: Auf `p-5` (20px) / `p-6` (24px) prüfen

---

## Phase 2: Fehlende Features - Hohe Priorität (5-7 Tage)

### 2.1 Check-Out System (1-2 Tage)
- [x] Check-Out Button im Dashboard (ab 18 Uhr + 80% Aufgaben)
- [x] Check-Out Fragebogen mit 3 Fragen:
  - "Bist du mit deiner Produktivität zufrieden?"
  - "Wie gut konntest du dich konzentrieren?"
  - "Wie gestresst fühlst du dich?"
- [x] Likert-Skala (5 Optionen) wiederverwenden
- [x] Loading Screen während Verarbeitung
- [x] Good Night Screen nach Abschluss

### 2.2 Profil-Dropdown Erweiterung (1 Tag)
- [x] Basis-Dropdown mit Mein Profil, Abmelden
- [x] 4 Varianten implementieren:
  - Normal-Modus + Testphase
  - Normal-Modus + Abonniert
  - Examen-Modus + Testphase
  - Examen-Modus + Abonniert
- [x] Modus-Anzeige im Dropdown ("Du befindest dich im...")
- [x] Probemonat-Anzeige mit verbleibenden Tagen
- [x] "Abonnement verwalten" Link

### 2.3 Profil-Seite (2-3 Tage)
- [ ] Neue Route `/profil` erstellen
- [ ] Benutzerinformationen anzeigen (Name, E-Mail)
- [ ] Avatar-Upload (optional)
- [ ] Modus-Wechsel Möglichkeit
- [ ] Abo-Status anzeigen
- [ ] Konto löschen Option

### 2.4 "Lernzeitraum blockiert" Block (0.5 Tage)
- [x] Block im Zeitplan-Widget mit gestreiftem Muster
- [x] Lock-Icon und Text "Lernzeitraum blockiert"
- [ ] Editierbar machen (Klick → Dialog)

---

## Phase 3: Fehlende Features - Mittlere Priorität (3-4 Tage)

### 3.1 Zeitindikator (0.5 Tage)
- [x] Aktuelle Uhrzeit-Linie im Zeitplan (rote Linie)
- [ ] Roter Dot/Kreis als Marker (optional)
- [ ] Auto-Update jede Minute

### 3.2 Custom Scrollbar (0.5 Tage)
- [ ] Tailwind Scrollbar-Styling hinzufügen
- [ ] Scrollbar-thumb: `bg-neutral-300`
- [ ] Scrollbar-track: `bg-neutral-100`
- [ ] Nur bei Hover sichtbar

### 3.3 Loading Screens (0.5 Tage)
- [ ] Generische Loading-Komponente
- [ ] Spinner Animation
- [ ] Skeleton-Loader für Listen

### 3.4 Abonnement-Management (2-3 Tage)
- [ ] Abo-Übersicht Seite
- [ ] Zahlungshistorie
- [ ] Plan upgraden/downgraden
- [ ] Kündigung

---

## Phase 4: Nice-to-have Features (6-10 Tage)

### 4.1 Onboarding Flow (3-5 Tage)
- [ ] Willkommens-Screen
- [ ] Modus-Auswahl (Examen/Normal)
- [ ] Feature-Tour
- [ ] Erste Lernplan-Erstellung

### 4.2 Semester wechseln (1-2 Tage)
- [ ] Modal zum Modus-Wechsel
- [ ] Bestätigungs-Dialog
- [ ] Daten-Migration zwischen Modi

### 4.3 Charts & Visualisierungen (2-3 Tage)
- [ ] WellScore Radial Chart
- [ ] Lernzeit Line Chart
- [ ] Fortschritts-Heatmap
- [ ] Statistik-Vergleiche

---

## Kalender-spezifische Todos

### Monatsansicht
- [ ] Styling für Tage mit Lernblöcken prüfen
- [ ] Hover-States verbessern
- [ ] Rechtsgebiet-Farben konsistent

### Wochenansicht
- [ ] Grid-Linien Styling
- [ ] Block-Karten Styling angleichen
- [ ] Drag & Drop für Zeitslots

### Dialoge
- [x] Create Theme Block Dialog Styling
- [x] Manage Block Dialog Styling
- [x] Alle Dialoge: `gray-*` → `neutral-*`

---

## Komponenten-spezifische Todos

### Button.jsx
- [x] Primary: `bg-neutral-900 hover:bg-neutral-800`
- [x] Secondary: `border-neutral-200`
- [x] Ghost: `text-neutral-500 hover:text-neutral-900`

### Dialog.jsx
- [x] Overlay: `bg-black/50`
- [x] Content: `rounded-xl shadow-md`
- [x] Header: `text-lg font-semibold text-neutral-900`

### Input-Felder
- [x] Border: `border-neutral-200`
- [x] Focus: `ring-neutral-500`
- [x] Placeholder: `text-neutral-400`

---

## Fortschritt

| Phase | Status | Fortschritt |
|-------|--------|-------------|
| 1. Styling-Fixes | ✅ Fertig | 100% |
| 2. Hohe Priorität | In Arbeit | 75% |
| 3. Mittlere Priorität | Ausstehend | 10% |
| 4. Nice-to-have | Ausstehend | 0% |

---

## Notizen

### Erledigt (2025-12-31):
1. ✅ Navigation font-weight korrigiert (font-light für inaktiv)
2. ✅ Dashboard Widgets auf neutral-* umgestellt
3. ✅ Header und Profile-Icon auf neutral-* umgestellt
4. ✅ DragHandleIcon hinzugefügt
5. ✅ Progress-Bars Farbe korrigiert
6. ✅ Komplette gray-* → neutral-* Migration (~100 Dateien)
7. ✅ Check-Out System vollständig implementiert
8. ✅ Profil-Dropdown mit 4 Varianten erweitert
9. ✅ Probemonat-Anzeige mit verbleibenden Tagen
10. ✅ Button, Dialog, Badge Komponenten aktualisiert

### Nächste Schritte:
1. Profil-Seite (/profil) erstellen
2. Abonnement-Management Seite
3. Custom Scrollbar Styling
4. Loading Screens

---

*Letzte Aktualisierung: 2025-12-31*
