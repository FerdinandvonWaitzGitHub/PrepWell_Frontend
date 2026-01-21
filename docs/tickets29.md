# Ticket 29: Semesterleistungen - Funktionale Anpassungen

## Status: Offen

## Kontext

T28 hat die Grundimplementierung der Semesterleistungen für den Normal Mode abgeschlossen. Dieses Ticket behandelt funktionale Anpassungen und Erweiterungen.

---

## Bug: Lernblöcke löschen funktioniert nicht korrekt

**Problem:** Lernblöcke im Wochenplan lassen sich nicht korrekt löschen. Es funktioniert erst wenn man den Titel entfernt, und dann verschwindet nur der individuelle Termin, nicht die ganze Serie.

**Betroffene Ansicht:** Wochenplan (Wochenansicht)

### Root Cause Analyse

#### Bug #1: seriesId wird nicht an Dialog übergeben

**Datei:** `src/features/calendar/components/week-view.jsx` (Zeilen 129-149)

Die Time Blocks werden ohne `seriesId` an das UI transformiert:

```javascript
weekBlocks.push({
  id: block.id,
  title: block.title,
  blockType: block.blockType || 'lernblock',
  // ... andere Properties ...
  repeatEnabled: block.repeatEnabled || false,
  // ❌ FEHLT: seriesId wird NICHT inkludiert
  isTimeBlock: true,
});
```

**Auswirkung:** Der Dialog weiß nicht, dass es sich um eine Serie handelt.

---

#### Bug #2: Fehlende Serien-UI im ManageThemeSessionDialog

**Datei:** `src/features/calendar/components/manage-theme-session-dialog.jsx`

Im Vergleich zu `manage-private-session-dialog.jsx` fehlt:
- Keine `seriesId` in den Props
- Kein `onDeleteSeries` Callback
- Keine "Nur diesen / Gesamte Serie" Option
- Keine Serien-Erkennung (`isSeriesBlock`)

**Bei privaten Sessions funktioniert es:**
```javascript
// manage-private-session-dialog.jsx zeigt:
{isSeriesBlock && (
  <div className="p-3 bg-violet-50 rounded-lg">
    🔄 Dieser Termin ist Teil einer Serie...
  </div>
)}
// + Buttons: "Nur diesen" / "Gesamte Serie"
```

---

#### Bug #3: deleteSeriesTimeBlocks nicht verfügbar

**Datei:** `src/features/calendar/components/week-view.jsx` (Zeilen 40-48)

Die Funktion `deleteSeriesTimeBlocks` aus dem CalendarContext wird:
- ❌ Nicht aus dem Context destrukturiert
- ❌ Nicht an ManageThemeSessionDialog übergeben

Nur `deleteTimeBlock` (einzelne Löschung) ist verfügbar.

---

#### Bug #4: Titel-Validierung blockiert UX

**Datei:** `src/features/calendar/components/manage-theme-session-dialog.jsx` (Zeilen 265-270)

```javascript
const isFormValid = () => {
  if (title.trim().length === 0) return false; // ❌ Titel erforderlich
  // ...
};
```

Der "Fertig" Button ist `disabled={!isFormValid()}`, was zu Verwirrung führt.

---

### Datenfluss-Vergleich

| Schritt | Private Sessions (✅) | Time Blocks (❌) |
|---------|----------------------|------------------|
| seriesId in Daten | ✓ vorhanden | ✓ vorhanden |
| seriesId an Dialog | ✓ übergeben | ❌ fehlt |
| Serien-Erkennung | ✓ isSeriesBlock | ❌ nicht implementiert |
| Serie-Lösch-Option | ✓ "Nur diesen / Gesamte Serie" | ❌ fehlt |
| deleteSeriesTimeBlocks | ✓ verfügbar | ❌ nicht verfügbar |

---

### Zu ändernde Dateien

| Datei | Änderung |
|-------|----------|
| `week-view.jsx` | `seriesId: block.seriesId` hinzufügen, `deleteSeriesTimeBlocks` destrukturieren und übergeben |
| `manage-theme-session-dialog.jsx` | Serien-UI implementieren (wie bei manage-private-session-dialog) |

---

### Priorität: KRITISCH

Dieser Bug verhindert das korrekte Löschen von wiederkehrenden Lernblöcken.

---

## Anpassung 1: Kalender-Integration

### Aktuelle Situation
- Checkbox "Klausur im Kalender eintragen" speichert nur `in_kalender: true/false`
- KEINE Verbindung zum CalendarProvider
- Datum/Uhrzeit wird gespeichert, aber kein Kalendereintrag erstellt

### Gewünschtes Verhalten

**Wenn Checkbox aktiviert UND Datum gesetzt:**

1. **Monatsansicht:** 2 Blöcke "Klausur" (size: 2) für das Datum erstellen
2. **Wochenansicht:**
   - Wenn Start-/Endzeit bekannt → Klausursession erstellen
   - Wenn Zeit NICHT bekannt → Nur Blöcke erstellen (keine Session)

**Typ:** Klausursession (nicht privater Termin, nicht Task)

### Technische Umsetzung

```
Beim Speichern mit inKalender: true && datum:
1. calendar_blocks erstellen:
   - date: datum
   - kind: 'klausur'
   - size: 2

2. Wenn uhrzeit vorhanden → time_sessions erstellen:
   - start_at: datum + startzeit
   - end_at: datum + endzeit
   - kind: 'klausur'
   - title: leistung.titel
   - subject: leistung.rechtsgebiet
```

### Betroffene Dateien
- `src/components/semesterleistungen/dialogs/neue-leistung-dialog.jsx`
- `src/components/semesterleistungen/dialogs/leistung-bearbeiten-dialog.jsx`
- `src/contexts/semester-leistungen-context.jsx`
- `src/contexts/calendar-context.jsx` (CalendarProvider)

---

## Anpassung 2: Status-Toggle & Erinnerungsfunktion

### Aktuelle Situation
- Toggle "Status Anmeldung zur Klausur" setzt `status: 'angemeldet'` oder `status: 'ausstehend'`
- Nur ein Flag, keine weitere Funktion

### Gewünschtes Verhalten

**Wenn Status = "nicht angemeldet" (ausstehend):**
- User kann Erinnerung setzen
- Erinnerung erscheint als **privater Termin** im Wochenplan
- **KEIN Block** in der Monatsansicht für Erinnerungen

**Erinnerungs-Datum:**
- Standardmäßig: **3 Wochen vor dem Klausurtermin**
- User kann das Datum manuell anpassen/bearbeiten
- Neues Feld im Dialog: "Erinnerung am" (Date-Picker)

**Erinnerungs-Zeitslot-Logik:**

| Situation | Startzeit |
|-----------|-----------|
| Keine Sessions an dem Tag | 08:00 Uhr |
| Sessions vorhanden, aber 08:00-08:15 frei | 08:00 Uhr |
| 08:00-08:15 besetzt | Früheste Session - 15min |

**Beispiel:** Früheste Session um 06:15 → Erinnerung um 06:00-06:15

**Erinnerungs-Details:**
- Dauer: 15 Minuten
- Typ: Privater Termin (private_session)
- Titel: `"Klausuranmeldung: [Titel]"`
- Beschreibung: "Anmeldung zur Klausur in [Rechtsgebiet]"
- **Bonus:** Link in Beschreibung → direkt zum Leistungsbearbeitungs-Dialog

### Auto-Löschen bei Status-Änderung

**WICHTIG:** Wenn der Status im Bearbeitungsdialog auf "angemeldet" geändert wird:
- Der Erinnerungs-Termin (privater Termin) wird **automatisch gelöscht**
- Dies passiert sofort beim Umschalten des Toggles

### UI-Änderungen

```
Neue Leistung Dialog / Bearbeiten Dialog:
┌──────────────────────────────────────────────────────────┐
│ [Toggle] Status Anmeldung zur Klausur                    │
│                                                          │
│ Wenn Toggle = OFF (nicht angemeldet):                    │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [Checkbox] Erinnerung zur Anmeldung setzen           │ │
│ │ [Date-Picker] Erinnerung am: [DD.MM.YYYY]            │ │
│ │             (Default: 3 Wochen vor Klausur)          │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Technische Umsetzung

```javascript
// Beim Speichern mit Erinnerung
if (status === 'ausstehend' && erinnerungEnabled && erinnerungDatum) {
  // Zeitslot finden
  const startTime = findEarliestSlot(erinnerungDatum); // 08:00 oder früher
  const endTime = addMinutes(startTime, 15);

  // Private Session erstellen
  createPrivateSession({
    title: `Klausuranmeldung: ${titel}`,
    description: `Anmeldung zur Klausur in ${rechtsgebiet}`,
    date: erinnerungDatum,
    start_at: `${erinnerungDatum}T${startTime}`,
    end_at: `${erinnerungDatum}T${endTime}`,
    leistung_id: leistung.id, // Referenz für Auto-Löschen
  });
}

// Beim Status-Wechsel zu "angemeldet"
if (status === 'angemeldet' && previousStatus === 'ausstehend') {
  // Erinnerungs-Termin finden und löschen
  deletePrivateSessionByLeistungId(leistung.id);
}
```

### Datenmodell-Erweiterung

```sql
-- In semester_leistungen hinzufügen:
erinnerung_datum DATE,
erinnerung_session_id UUID REFERENCES private_sessions(id)
```

### Betroffene Dateien
- `src/components/semesterleistungen/dialogs/neue-leistung-dialog.jsx`
- `src/components/semesterleistungen/dialogs/leistung-bearbeiten-dialog.jsx`
- `src/contexts/semester-leistungen-context.jsx`
- `src/contexts/calendar-context.jsx` (für private_sessions)
- `supabase/schema.sql` (neue Felder)

---

## Anpassung 3: Dynamische Beschriftung (Jura vs. Nicht-Jura)

### Aktuelle Situation
- Einstellung existiert bereits in `user_settings`
- Labels sind aktuell hardcoded

### Gewünschtes Verhalten

| Jura-Modus | Nicht-Jura-Modus |
|------------|------------------|
| Rechtsgebiet | Fach |
| Unterrechtsgebiet | Kapitel |
| Thema | Thema |
| Aufgaben | Aufgabe |

**Scope:** Gesamte App (nicht nur Semesterleistungen)
- Kalender
- Themenliste
- Semesterleistungen
- etc.

**Art:** Nur Label-Änderungen, keine strukturellen Unterschiede

### Technische Umsetzung

```javascript
// Neuer Hook oder Context
const useLabels = () => {
  const { isJuraMode } = useSettings();

  return {
    subject: isJuraMode ? 'Rechtsgebiet' : 'Fach',
    subSubject: isJuraMode ? 'Unterrechtsgebiet' : 'Kapitel',
    topic: 'Thema', // gleich
    task: isJuraMode ? 'Aufgaben' : 'Aufgabe',
  };
};
```

### Betroffene Dateien
- `src/contexts/settings-context.jsx` oder neuer `labels-context.jsx`
- Alle Komponenten die diese Labels verwenden

---

## Technische Referenz

### Relevante Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/contexts/semester-leistungen-context.jsx` | State Management & CRUD |
| `src/contexts/calendar-context.jsx` | Kalender-Blöcke & Sessions |
| `src/components/semesterleistungen/` | UI-Komponenten |
| `src/hooks/use-supabase-sync.js` | Supabase Synchronisation |
| `supabase/schema.sql` | Datenbank-Schema |

### Datenmodell (semester_leistungen)

```sql
id UUID PRIMARY KEY
user_id UUID
rechtsgebiet TEXT NOT NULL
titel TEXT NOT NULL
beschreibung TEXT
semester TEXT
datum DATE
uhrzeit TEXT
ects INTEGER
note DECIMAL(3,1)
noten_system TEXT ('punkte' | 'noten')
status TEXT ('angemeldet' | 'ausstehend' | 'bestanden' | 'nicht bestanden')
in_kalender BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

---

## Priorität

1. **Bug:** Lernblöcke löschen (KRITISCH - blockiert Benutzer)
2. **Anpassung 1:** Kalender-Integration (Kernfunktion)
3. **Anpassung 3:** Dynamische Labels (betrifft gesamte App)
4. **Anpassung 2:** Erinnerungsfunktion (Nice-to-have)

---

## Checkliste

- [x] **Bug:** Lernblöcke löschen (KRITISCH - Root Cause analysiert)
  - [x] `week-view.jsx`: seriesId hinzufügen + deleteSeriesTimeBlocks
  - [x] `manage-theme-session-dialog.jsx`: Serien-UI implementieren
- [x] **Anpassung 1:** Kalender-Integration implementieren
  - [x] calendar_blocks erstellen (Monatsansicht)
  - [x] time_sessions erstellen (Wochenansicht, wenn Uhrzeit bekannt)
- [x] **Anpassung 2:** Erinnerungsfunktion (✅ Alle Fragen geklärt)
  - [x] Erinnerungs-Datum-Feld hinzufügen (Default: 3 Wochen vor Klausur)
  - [x] Private Session erstellen mit Titel "Klausuranmeldung: [Titel]"
  - [x] Auto-Löschen bei Status → "angemeldet"
  - [ ] Schema-Migration: erinnerung_datum, erinnerung_session_id (Optional - derzeit nur Frontend-Logik)
- [x] **Anpassung 3:** Dynamische Labels implementieren
  - [x] useLabels Hook erstellen (`src/hooks/use-labels.js`)
  - [x] Labels in Semesterleistungen-Komponenten ersetzen
- [ ] Testen im Browser
- [ ] Supabase-Sync prüfen
