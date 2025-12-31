# Figma Design Changelog

> Tracking von Figma-Design-Änderungen und deren Implementierungsstatus
> Figma-File: [PrepWell WebApp](https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp)

---

## Wie dieses Changelog funktioniert

1. **Bei Figma-Änderungen:** Neuen Eintrag unter "Ausstehende Änderungen" hinzufügen
2. **Funktionsbeschreibung:** Den Fragebogen ausfüllen für jede Komponente
3. **Bei Implementierung:** Eintrag nach "Implementiert" verschieben mit Datum
4. **Review-Zyklus:** Regelmäßig Figma mit Frontend vergleichen

---

## Ausstehende Änderungen

> Diese Figma-Designs wurden geändert/hinzugefügt, aber noch nicht im Frontend implementiert.

### Hohe Priorität

| Datum | Canvas/Bereich | Komponente | Beschreibung | Node-ID |
|-------|----------------|------------|--------------|---------|
| 2025-12-31 | Startseite | Check-Out System | Abend-Fragebogen mit 3 Fragen fehlt komplett | `2406:3436` |
| 2025-12-31 | Startseite | Profil-Dropdown | 4 Varianten (Normal/Examen × Test/Abo) | `2404:4294`, `2607:4014`, `2607:4042`, `2607:3986` |
| 2025-12-31 | Startseite | Lernplan-Panel Styling | Titel font-extralight, Beschreibung #a3a3a3 | `2398:3619` |
| 2025-12-31 | Zeitplan | "Lernzeitraum blockiert" | Grauer Block für blockierte Zeiten | `2398:4524` |
| 2025-12-31 | Zeitplan | Aktueller Zeitpunkt | Roter Dot als Zeitindikator | `2398:4523` |

### Mittlere Priorität

| Datum | Canvas/Bereich | Komponente | Beschreibung | Node-ID |
|-------|----------------|------------|--------------|---------|
| 2025-12-31 | Global | Custom Scrollbar | Styled Scrollbar (8px, rounded-full) | `2399:2010` |
| 2025-12-31 | Navigation | Nav-Item Styling | Inaktiv: font-light statt font-normal | `2390:4331` |
| 2025-12-31 | Tasks | Task-Item Varianten | Expanded (bg-#f5f5f5) vs Collapsed (border) | `2398:3629`, `2398:3638` |

### Niedrige Priorität

| Datum | Canvas/Bereich | Komponente | Beschreibung | Node-ID |
|-------|----------------|------------|--------------|---------|
| 2025-12-31 | - | Profil-Seite | Eigene Seite für Benutzerinfos | - |
| 2025-12-31 | - | Onboarding Flow | Erstnutzer-Einführung | - |
| 2025-12-31 | Mentor | WellScore Chart | Radial Chart für Score | `2165:1220` |

---

## Funktionsbeschreibungen

> Detaillierte Beschreibung der Funktionsweise jeder Komponente.
> Nutze den Fragebogen-Template unten für neue Einträge.

---

### FUNC-001: Check-Out System

**Basis-Informationen:**
| Feld | Wert |
|------|------|
| Komponente | Check-Out System |
| Node-ID | `2406:3436` |
| Status | Ausstehend |
| Priorität | Hoch |
| Erstellt | 2025-12-31 |

**1. Zweck & Kontext**
| Frage | Antwort |
|-------|---------|
| Was ist der Hauptzweck dieser Komponente? | Tägliche Abend-Reflexion zum Lernfortschritt |
| Welches Problem löst sie für den Nutzer? | Selbstreflexion und Tracking der Lernqualität |
| In welchem Kontext/Screen erscheint sie? | Dashboard (Startseite) - erscheint abends |

**2. Trigger & Anzeige**
| Frage | Antwort | Optionen |
|-------|---------|----------|
| Wann wird die Komponente angezeigt? | Automatisch ab 18 Uhr wenn 80% der Aufgaben erledigt | `[ ] Beim Seitenaufruf` `[x] Zu bestimmter Uhrzeit` `[ ] Nach User-Aktion` `[ ] Immer sichtbar` |
| Gibt es Bedingungen für die Anzeige? | Ja - ab 18 Uhr UND 80% Tageslernziel erreicht | `[x] Zeitbasiert` `[x] Fortschrittsbasiert` `[ ] Nutzer-Einstellung` `[ ] Keine` |
| Kann der Nutzer sie ausblenden/überspringen? | Ja, mit "Später" Button | `[x] Ja, temporär` `[ ] Ja, permanent` `[ ] Nein` |

**3. Interaktionen**
| Frage | Antwort |
|-------|---------|
| Welche Aktionen kann der Nutzer ausführen? | 3 Fragen beantworten (Likert 1-5), Absenden, Überspringen |
| Was passiert bei Klick/Tap auf...? | Frage 1-3: Auswahl einer Option (Radio), Submit: Speichern + Good Night Screen |
| Gibt es Hover/Focus-States? | Ja, Options-Highlighting |

**4. Daten & State**
| Frage | Antwort | Optionen |
|-------|---------|----------|
| Welche Daten werden angezeigt? | 3 Fragen mit je 5 Antwortoptionen | |
| Woher kommen die Daten? | Statisch (Fragen) + LocalStorage (Antworten) | `[ ] API` `[x] LocalStorage` `[ ] Context` `[x] Statisch` |
| Werden Daten gespeichert? Wo? | Ja, in `prepwell_checkin_responses` | `[ ] API` `[x] LocalStorage` `[ ] Nur Session` |

**5. Fragen-Inhalt**
| # | Frage | Antwortoptionen (1-5) |
|---|-------|----------------------|
| 1 | Bist du mit deiner Produktivität zufrieden? | unzufrieden → eher nicht → mittelmäßig → eher ja → sehr zufrieden |
| 2 | Wie gut konntest du dich konzentrieren? | sehr schlecht → eher schlecht → mittelmäßig → gut → sehr gut |
| 3 | Wie gestresst fühlst du dich? | sehr gestresst → gestresst → mittelmäßig → entspannt → sehr entspannt |

**6. Varianten & States**
| State | Beschreibung |
|-------|--------------|
| Default | Fragen noch nicht beantwortet |
| Teilweise | 1-2 Fragen beantwortet |
| Komplett | Alle 3 Fragen beantwortet, Submit aktiv |
| Submitted | Nach Absenden → Good Night Screen |

**7. Verbindungen**
| Frage | Antwort |
|-------|---------|
| Mit welchen anderen Komponenten interagiert sie? | Check-In Button (deaktiviert Check-Out wenn nicht erledigt), Good Night Screen (Folge-Screen) |
| Beeinflusst sie andere Bereiche der App? | Ja, Mentor-Statistiken werden aktualisiert |

**8. Edge Cases**
| Szenario | Verhalten |
|----------|-----------|
| Nutzer schließt Browser vor Submit | Daten gehen verloren, nächster Tag neu |
| Bereits heute Check-Out gemacht | Nicht erneut anzeigen |
| Weniger als 80% Aufgaben erledigt | Check-Out Button bleibt deaktiviert |

**9. Notizen**
```
- Check-Out ist das Gegenstück zum Check-In (morgens)
- Beide zusammen bilden das "Daily Reflection" System
- Daten fließen in Mentor-Statistiken ein
```

---

### FUNC-002: Profil-Dropdown

**Basis-Informationen:**
| Feld | Wert |
|------|------|
| Komponente | Profil-Dropdown |
| Node-ID | `2404:4294`, `2607:4014`, `2607:4042`, `2607:3986` |
| Status | Teilweise implementiert |
| Priorität | Hoch |
| Erstellt | 2025-12-31 |

**1. Zweck & Kontext**
| Frage | Antwort |
|-------|---------|
| Was ist der Hauptzweck dieser Komponente? | Schnellzugriff auf Profil, Abmeldung, Modus-Info |
| Welches Problem löst sie für den Nutzer? | Zentrale Stelle für Account-Verwaltung |
| In welchem Kontext/Screen erscheint sie? | Header (alle Seiten) - Avatar-Klick |

**2. Trigger & Anzeige**
| Frage | Antwort | Optionen |
|-------|---------|----------|
| Wann wird die Komponente angezeigt? | Bei Klick auf Avatar | `[ ] Beim Seitenaufruf` `[ ] Zu bestimmter Uhrzeit` `[x] Nach User-Aktion` `[ ] Immer sichtbar` |
| Gibt es Bedingungen für die Anzeige? | Nutzer muss eingeloggt sein | `[ ] Zeitbasiert` `[ ] Fortschrittsbasiert` `[x] Auth-Status` `[ ] Keine` |
| Kann der Nutzer sie ausblenden? | Ja, Klick außerhalb schließt | `[x] Ja, temporär` `[ ] Ja, permanent` `[ ] Nein` |

**3. Varianten (4 Stück)**
| Variante | Modus | Abo-Status | Besonderheiten |
|----------|-------|------------|----------------|
| 1 | Normal | Testphase | Zeigt Semester + "Probemonat" + "Alle Funktionen freischalten" |
| 2 | Normal | Abonniert | Zeigt Semester, kein Upgrade-Hinweis |
| 3 | Examen | Testphase | Zeigt "Examensmodus" + "Probemonat" + "Abonnement verwalten" |
| 4 | Examen | Abonniert | Zeigt "Examensmodus", kein Upgrade-Hinweis |

**4. Menu-Items**
| Item | Icon | Aktion | In allen Varianten? |
|------|------|--------|---------------------|
| Mein Profil | User | → Profil-Seite | Ja |
| Abmelden | LogOut | Logout + Redirect | Ja |
| Modus-Anzeige | Pencil | → Modus wechseln | Ja |
| Probemonat-Info | - | Info-Text | Nur Testphase |
| Alle Funktionen freischalten | LockOpen | → Pricing | Nur Normal+Test |
| Abonnement verwalten | LockOpen | → Abo-Verwaltung | Nur Examen+Test |

**5. Daten & State**
| Frage | Antwort |
|-------|---------|
| Welche Daten werden angezeigt? | User-Name, Modus (Normal/Examen), Semester, Abo-Status |
| Woher kommen die Daten? | Auth Context + AppMode Context |

**6. Notizen**
```
- Aktuell nur einfaches Dropdown mit Abmelden implementiert
- Modus-Anzeige und Varianten fehlen komplett
- Profil-Seite existiert noch nicht
```

---

### FUNC-003: Lernplan-Panel

**Basis-Informationen:**
| Feld | Wert |
|------|------|
| Komponente | Lernplan-Panel |
| Node-ID | `2398:3619` |
| Status | Teilweise implementiert |
| Priorität | Hoch |
| Erstellt | 2025-12-31 |

**1. Zweck & Kontext**
| Frage | Antwort |
|-------|---------|
| Was ist der Hauptzweck dieser Komponente? | Anzeige des aktuellen Tagesthemas mit Aufgaben |
| Welches Problem löst sie für den Nutzer? | Fokus auf heutiges Lernpensum |
| In welchem Kontext/Screen erscheint sie? | Dashboard - linke Spalte |

**2. Struktur**
| Bereich | Inhalt |
|---------|--------|
| Header | Rechtsgebiet-Tag |
| Titel | Tagesthema (max 3 Zeilen, dann overflow hidden) |
| Beschreibung | Max 10 Zeilen, Farbe #a3a3a3 |
| Aufgaben | Liste mit Checkboxen + Priorität |
| Footer | "Neue Aufgabe" Button |

**3. Task-Item Varianten**
| Variante | Styling | Wann |
|----------|---------|------|
| Expanded | bg-#f5f5f5, kein Border, Titel + Beschreibung | Task hat Beschreibung |
| Collapsed | Border #e5e5e5, nur Titel | Task ohne Beschreibung |

**4. Interaktionen**
| Element | Aktion | Ergebnis |
|---------|--------|----------|
| Checkbox | Klick | Toggle completed |
| Priorität "!" | Klick | Toggle high/normal |
| Trash (Hover) | Klick | Task löschen |
| Neue Aufgabe | Klick | Inline-Input erscheint |

**5. Styling-Unterschiede (Figma vs. Aktuell)**
| Element | Figma | Aktuell | Fix nötig |
|---------|-------|---------|-----------|
| Titel Font | font-extralight 24px | font-semibold 18px | Ja |
| Beschreibung Farbe | #a3a3a3 | #6b7280 | Ja |
| Task Expanded BG | #f5f5f5 | #f3f4f6 + Border | Ja |
| Priorität Icons | 2x "!" nebeneinander | 1x "!" Toggle | Ja |

**6. Notizen**
```
- Grundfunktion implementiert, Styling abweichend
- Drag-Handle im Frontend vorhanden, nicht in Figma
- Edit-Button im Frontend vorhanden, nicht in Figma
```

---

## Fragebogen-Template (Kopiervorlage)

```markdown
### FUNC-XXX: [Komponenten-Name]

**Basis-Informationen:**
| Feld | Wert |
|------|------|
| Komponente | [Name] |
| Node-ID | `[ID]` |
| Status | [Ausstehend / In Arbeit / Implementiert] |
| Priorität | [Hoch / Mittel / Niedrig] |
| Erstellt | [YYYY-MM-DD] |

**1. Zweck & Kontext**
| Frage | Antwort |
|-------|---------|
| Was ist der Hauptzweck dieser Komponente? | [Antwort] |
| Welches Problem löst sie für den Nutzer? | [Antwort] |
| In welchem Kontext/Screen erscheint sie? | [Antwort] |

**2. Trigger & Anzeige**
| Frage | Antwort | Optionen |
|-------|---------|----------|
| Wann wird die Komponente angezeigt? | [Antwort] | `[ ] Beim Seitenaufruf` `[ ] Zu bestimmter Uhrzeit` `[ ] Nach User-Aktion` `[ ] Immer sichtbar` |
| Gibt es Bedingungen für die Anzeige? | [Antwort] | `[ ] Zeitbasiert` `[ ] Fortschrittsbasiert` `[ ] Nutzer-Einstellung` `[ ] Keine` |
| Kann der Nutzer sie ausblenden/überspringen? | [Antwort] | `[ ] Ja, temporär` `[ ] Ja, permanent` `[ ] Nein` |

**3. Interaktionen**
| Frage | Antwort |
|-------|---------|
| Welche Aktionen kann der Nutzer ausführen? | [Antwort] |
| Was passiert bei Klick/Tap auf...? | [Antwort] |
| Gibt es Hover/Focus-States? | [Antwort] |

**4. Daten & State**
| Frage | Antwort | Optionen |
|-------|---------|----------|
| Welche Daten werden angezeigt? | [Antwort] | |
| Woher kommen die Daten? | [Antwort] | `[ ] API` `[ ] LocalStorage` `[ ] Context` `[ ] Statisch` |
| Werden Daten gespeichert? Wo? | [Antwort] | `[ ] API` `[ ] LocalStorage` `[ ] Nur Session` |

**5. Varianten & States**
| State/Variante | Beschreibung |
|----------------|--------------|
| [State 1] | [Beschreibung] |
| [State 2] | [Beschreibung] |

**6. Verbindungen**
| Frage | Antwort |
|-------|---------|
| Mit welchen anderen Komponenten interagiert sie? | [Antwort] |
| Beeinflusst sie andere Bereiche der App? | [Antwort] |

**7. Edge Cases**
| Szenario | Verhalten |
|----------|-----------|
| [Edge Case 1] | [Verhalten] |
| [Edge Case 2] | [Verhalten] |

**8. Notizen**
```
[Freie Notizen]
```
```

---

## Quick-Fragen für neue Komponenten

> Schnelle Fragen zum Ausfüllen bei neuen Figma-Designs.

### Allgemein
- [ ] Was macht diese Komponente?
- [ ] Wo erscheint sie (welche Seite/Screen)?
- [ ] Ist sie immer sichtbar oder wird sie getriggert?

### Interaktion
- [ ] Kann der Nutzer damit interagieren?
- [ ] Was passiert bei Klick?
- [ ] Gibt es verschiedene Zustände (hover, active, disabled)?

### Daten
- [ ] Zeigt sie dynamische Daten an?
- [ ] Werden Nutzereingaben gespeichert?
- [ ] Wo werden Daten gespeichert (LocalStorage, API)?

### Varianten
- [ ] Gibt es verschiedene Varianten (z.B. für Modi)?
- [ ] Sieht sie auf Mobile anders aus?

### Verbindungen
- [ ] Beeinflusst sie andere Komponenten?
- [ ] Wird sie von anderen Komponenten beeinflusst?

---

## Implementiert

> Diese Figma-Designs wurden erfolgreich im Frontend umgesetzt.

### Dezember 2025

| Impl.-Datum | Canvas/Bereich | Komponente | Beschreibung | Commit/PR |
|-------------|----------------|------------|--------------|-----------|
| 2025-12-XX | Check-In | Fragebogen | 3 Fragen mit Likert-Skala | - |
| 2025-12-XX | Check-In | Good Night Screen | Abschluss-Screen | - |
| 2025-12-XX | Startseite | Timer-Button | 3 Modi (Pomodoro/Countdown/Stoppuhr) | - |
| 2025-12-XX | Startseite | Lernplan-Panel | Grundstruktur mit Tasks | - |
| 2025-12-XX | Startseite | Zeitplan-Widget | Timeline 8-16 Uhr | - |
| 2025-12-XX | Navigation | Header | Logo + Nav + Avatar | - |
| 2025-12-XX | Navigation | Dropdowns | Kalender/Lernplanung/Verwaltung | - |
| 2025-12-XX | Kalender | Monatsansicht | Slot-basierte Ansicht | - |
| 2025-12-XX | Kalender | Wochenansicht | Block-basierte Ansicht | - |
| 2025-12-XX | Wizard | 10 Schritte | Kompletter Lernplan-Wizard | - |
| 2025-12-XX | Verwaltung | Leistungen | Klausur-Verwaltung | - |
| 2025-12-XX | Verwaltung | Aufgaben | Aufgaben-Übersicht | - |
| 2025-12-XX | Mentor | Dashboard | Statistiken + Heatmap | - |
| 2025-12-XX | Einstellungen | Seite | Benutzereinstellungen | - |

---

## Figma-Snapshot Register

> Dokumentiert den Stand der Figma-Designs zu bestimmten Zeitpunkten für spätere Vergleiche.

### Snapshot: 2025-12-31 (Baseline)

**Erfasste Canvases:**
- `Startseite` (Node: 2175:1761)
- `Check-In & Check-Out` (Node: 0:1)

**Haupt-Frames auf Startseite:**
| Frame | Node-ID | Größe | Beschreibung |
|-------|---------|-------|--------------|
| Lernplan | 2398:3619 | 680×730 | Lernplan-Panel links |
| Zeitplan_Heute | 2398:4504 | 680×730 | Zeitplan-Widget rechts |
| Themenliste | 2398:4526 | 680×730 | Alternative Ansicht |
| To-Dos | 2398:4610 | 680×718 | To-Do Ansicht |
| Navigation_Mode_exam | 2390:4331 | 922×67 | Nav für Examen-Modus |
| Navigation_Mode_normal | 2607:3307 | 922×67 | Nav für Normal-Modus |
| Profil - normal - testphase | 2404:4294 | 300×228 | Profil-Dropdown |
| Profil - examen - testphase | 2607:4014 | 270×228 | Profil-Dropdown |
| Profil - examen - abonniert | 2607:4042 | 270×148 | Profil-Dropdown |
| Profil - normal - abonniert | 2607:3986 | 270×148 | Profil-Dropdown |

---

## Änderungsprotokoll

> Chronologische Liste aller Figma-Änderungen (manuell gepflegt).

### 2025-12-31

- **INITIAL:** Baseline-Snapshot erstellt
- **ANALYSE:** Gap-Analyse durchgeführt (siehe `FIGMA_IMPLEMENTATION_GAP.md`)
- **DOKUMENTIERT:** Design-System erstellt (siehe `DESIGN_SYSTEM.md`)
- **FUNC-001:** Check-Out System dokumentiert
- **FUNC-002:** Profil-Dropdown dokumentiert
- **FUNC-003:** Lernplan-Panel dokumentiert

---

## Workflow für Updates

### Bei Figma-Änderungen:

1. Datum notieren
2. Betroffene Node-ID aus Figma-URL extrahieren
3. Neuen Eintrag unter "Ausstehende Änderungen" hinzufügen
4. **NEU:** Funktionsbeschreibung mit Fragebogen ausfüllen

### Figma-URL zu Node-ID:

```
URL: https://figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2175-1761
                                                                              ^^^^^^^^
Node-ID: 2175:1761 (Bindestrich wird zu Doppelpunkt)
```

---

## Nächster Review

- **Geplant:** 2025-01-15
- **Fokus:** Check-Out System, Profil-Dropdown
- **Verantwortlich:** -

---

*Zuletzt aktualisiert: 2025-12-31*
