# Figma vs. Frontend - Implementation Gap Analyse

> Vergleich zwischen Figma-Designs und aktuellem Frontend-Implementierungsstand
> Erstellt: 2025-12-31
> **Aktualisiert: 2025-12-31** (Sync-Layer Analyse hinzugefügt)

---

## Zusammenfassung

| Kategorie | Figma | Frontend | Gap |
|-----------|-------|----------|-----|
| **Seiten (Pages)** | ~8-10 | 10 | ~0-2 |
| **Haupt-Features** | 15+ | 12 | ~3 |
| **UI-Komponenten** | 50+ | 40+ | ~10 |
| **Design-Genauigkeit** | 100% | ~70% | ~30% |
| **Code-Qualität/Sync** | - | - | 🔴 5 Issues |

**Geschätzte Gesamtlücke: ~25-30%** der Figma-Designs sind nicht oder nur teilweise implementiert.

**⚠️ Technische Schulden:** 5 Sync-Layer Probleme identifiziert (siehe Abschnitt 8).

---

## 1. Figma-Seiten (Canvases) Identifiziert

Basierend auf der Figma-Analyse:

| # | Canvas Name | Status | Beschreibung |
|---|-------------|--------|--------------|
| 1 | `Startseite` | Teilweise | Dashboard mit Lernplan, Zeitplan, Timer |
| 2 | `Check-In & Check-Out` | Teilweise | Tägliche Reflexion (Check-In implementiert) |
| 3 | `Kalender` | Implementiert | Monats-/Wochenansicht |
| 4 | `Lernpläne` | Implementiert | Lernplan-Übersicht |
| 5 | `Wizard` | Implementiert | 10-Schritte Wizard |
| 6 | `Verwaltung` | Implementiert | Leistungen/Aufgaben |
| 7 | `Mentor` | Implementiert | Statistik-Dashboard |
| 8 | `Einstellungen` | Implementiert | Benutzereinstellungen |
| 9 | `Profil` | **FEHLT** | Benutzerprofilseite |
| 10 | `Onboarding` | **FEHLT** | Erstnutzer-Einführung |

---

## 2. Detaillierte Gap-Analyse nach Bereich

### 2.1 Startseite / Dashboard

| Feature | Figma | Frontend | Status | Priorität |
|---------|-------|----------|--------|-----------|
| Lernplan-Panel | Ja | Ja | Teilweise | Hoch |
| Zeitplan-Widget | Ja | Ja | Teilweise | Hoch |
| Timer-Button (Header) | Ja | Ja | Implementiert | - |
| Timer-Modi (Pomodoro/Countdown/Stoppuhr) | Ja | Ja | Implementiert | - |
| Check-In Button | Ja | Ja | Implementiert | - |
| Check-Out Button (Abend) | Ja | **Nein** | **FEHLT** | Mittel |
| Tagesfortschritts-Bar | Ja | Ja | Teilweise | Mittel |
| Profil-Dropdown (4 Varianten) | Ja | Teilweise | **UI fehlt** | Hoch |
| Tabs (Lernplan/To-Dos) | Ja | Ja | Implementiert | - |

**Lücken im Detail:**

1. **Lernplan-Panel Styling:**
   - Titel: Soll `font-extralight 24px`, ist `font-semibold`
   - Beschreibung: Soll `#a3a3a3`, ist `#6b7280`
   - Task-Items: Unterschiedliche Varianten (expanded/collapsed) nicht 1:1

2. **Profil-Dropdown:**
   - 4 Varianten im Figma: Normal/Examen × Testphase/Abonniert
   - Frontend: Nur einfaches Dropdown ohne Modus-Anzeige

3. **Check-Out am Abend:**
   - Figma zeigt: Ab 18 Uhr + 80% Aufgaben erledigt
   - Frontend: Nicht implementiert

---

### 2.2 Check-In & Check-Out System

| Feature | Figma | Frontend | Status |
|---------|-------|----------|--------|
| Check-In Fragebogen (3 Fragen) | Ja | Ja | Implementiert |
| Check-Out Fragebogen (3 Fragen) | Ja | **Nein** | **FEHLT** |
| Likert-Skala (5 Optionen) | Ja | Ja | Implementiert |
| Loading Screen | Ja | **Nein** | **FEHLT** |
| Good Night Screen | Ja | Ja | Implementiert |

**Check-Out Fragen (Figma):**
1. "Bist du mit deiner Produktivität zufrieden?"
2. "Wie gut konntest du dich konzentrieren?"
3. "Wie gestresst fühlst du dich?"

---

### 2.3 Navigation & Header

| Feature | Figma | Frontend | Status |
|---------|-------|----------|--------|
| Logo | Ja | Ja | Implementiert |
| Navigation Menu | Ja | Ja | Implementiert |
| Dropdown Popovers | Ja | Ja | Implementiert |
| Examen-Modus Navigation | Ja | Ja | Implementiert |
| Normal-Modus Navigation | Ja | Ja | Implementiert |
| Gesperrte Items (Lock Icon) | Ja | Ja | Teilweise |
| Avatar/Profil-Icon | Ja | Ja | Implementiert |
| Navigation Hover-States | Ja | Teilweise | **Styling** |

**Styling-Unterschiede:**
- Figma: `font-light 300` für inaktive Nav-Items
- Frontend: `font-normal 400`

---

### 2.4 Kalender

| Feature | Figma | Frontend | Status |
|---------|-------|----------|--------|
| Monatsansicht | Ja | Ja | Implementiert |
| Wochenansicht | Ja | Ja | Implementiert |
| Zeitplan-Widget (Tagesansicht) | Ja | Ja | Implementiert |
| Lernblock-Karten | Ja | Ja | Teilweise |
| "Lernzeitraum blockiert" Block | Ja | **Nein** | **FEHLT** |
| Timeline-Linien (8-16 Uhr) | Ja | Ja | Implementiert |
| Aktueller Zeitpunkt (Dot) | Ja | **Nein** | **FEHLT** |
| Scrollbar (Custom) | Ja | **Nein** | **FEHLT** |

---

### 2.5 Profil & Benutzer

| Feature | Figma | Frontend | Status |
|---------|-------|----------|--------|
| Profil-Seite | Ja | **Nein** | **FEHLT** |
| Mein Profil Link | Ja | **Nein** | **FEHLT** |
| Abmelden Button | Ja | Ja | Implementiert |
| Modus-Anzeige im Dropdown | Ja | **Nein** | **FEHLT** |
| Semester/Modus wechseln | Ja | **Nein** | **FEHLT** |
| Probemonat-Anzeige | Ja | **Nein** | **FEHLT** |
| Abonnement verwalten | Ja | **Nein** | **FEHLT** |

---

### 2.6 Timer & Lernzeit

| Feature | Figma | Frontend | Status |
|---------|-------|----------|--------|
| Pomodoro-Timer | Ja | Ja | Implementiert |
| Countdown-Timer | Ja | Ja | Implementiert |
| Stoppuhr (Count-up) | Ja | Ja | Implementiert |
| Timer-Info Anzeige | Ja | Ja | Teilweise |
| Spinner Animation | Ja | Ja | Implementiert |
| Timer-Dialog | Ja | Ja | Implementiert |

**Styling-Unterschiede:**
- Timer-Info Box: Unterschiedliche Layouts je nach Modus

---

### 2.7 Aufgaben (Tasks)

| Feature | Figma | Frontend | Status |
|---------|-------|----------|--------|
| Task mit Beschreibung (expanded) | Ja | Ja | Teilweise |
| Task ohne Beschreibung (collapsed) | Ja | Ja | Teilweise |
| Checkbox | Ja | Ja | Implementiert |
| Prioritäts-Buttons (2x "!") | Ja | Ja | Implementiert |
| Trash-Button (Hover) | Ja | Ja | Implementiert |
| Edit-Button (Hover) | **Nein** | Ja | Extra |
| Drag-Handle | **Nein** | Ja | Extra |
| "Neue Aufgabe" Button | Ja | Ja | Teilweise |

**Styling-Unterschiede:**
- Figma: Expanded Task hat `bg-#f5f5f5` ohne Border
- Frontend: Hat Border + anderen Background

---

## 3. Fehlende Features (Komplett)

### 3.1 Hohe Priorität

| Feature | Beschreibung | Aufwand |
|---------|--------------|---------|
| **Check-Out System** | Abend-Fragebogen mit 3 Fragen | 1-2 Tage |
| **Profil-Seite** | Eigene Seite mit Benutzerinfos | 2-3 Tage |
| **Profil-Dropdown (erweitert)** | 4 Varianten mit Modus-Anzeige | 1 Tag |
| **"Lernzeitraum blockiert" Block** | Grauer Block im Zeitplan | 0.5 Tage |

### 3.2 Mittlere Priorität

| Feature | Beschreibung | Aufwand |
|---------|--------------|---------|
| **Aktueller Zeitpunkt Indikator** | Roter Dot in Timeline | 0.5 Tage |
| **Custom Scrollbar** | Styled Scrollbar wie Figma | 0.5 Tage |
| **Loading Screen** | Spinner beim Laden | 0.5 Tage |
| **Abonnement-Management** | Abo verwalten im Profil | 2-3 Tage |

### 3.3 Niedrige Priorität (Nice-to-have)

| Feature | Beschreibung | Aufwand |
|---------|--------------|---------|
| **Onboarding Flow** | Erstnutzer-Einführung | 3-5 Tage |
| **Semester wechseln** | UI zum Modus-Wechsel | 1-2 Tage |
| **Charts (WellScore etc.)** | Radial/Line Charts | 2-3 Tage |

---

## 4. Styling-Abweichungen (Design Fidelity)

### 4.1 Typografie

| Element | Figma | Frontend | Fix |
|---------|-------|----------|-----|
| H1 (Titel) | `font-extralight 24px` | `font-semibold 18-20px` | CSS ändern |
| Navigation (inaktiv) | `font-light 300` | `font-normal 400` | CSS ändern |
| Beschreibungen | `#a3a3a3` | `#6b7280` | Farbe ändern |
| Tags | `font-semibold 12px` | `font-medium 12px` | CSS ändern |

### 4.2 Farben

| Token | Figma | Frontend | Fix |
|-------|-------|----------|-----|
| Muted Text | `#a3a3a3` | `#737373` / `#6b7280` | Vereinheitlichen |
| Secondary BG | `#f5f5f5` | `#f3f4f6` | Anpassen |
| Border | `#e5e5e5` | `#e5e7eb` | Anpassen |

### 4.3 Spacing & Radius

| Element | Figma | Frontend | Fix |
|---------|-------|----------|-----|
| Card Radius | `8px` | `8px` / `12px` | Vereinheitlichen |
| Task Padding | `10px` | `8px` / `12px` | Anpassen |
| Container Padding | `25px` | `20px` / `24px` | Anpassen |

---

## 5. Aufwandsschätzung

### Gesamt-Aufwand für 100% Design-Treue:

| Kategorie | Aufwand |
|-----------|---------|
| Fehlende Features (Hoch) | ~5-7 Tage |
| Fehlende Features (Mittel) | ~3-4 Tage |
| Fehlende Features (Niedrig) | ~6-10 Tage |
| Styling-Fixes | ~2-3 Tage |
| **GESAMT** | **~16-24 Tage** |

### Empfohlene Priorisierung:

1. **Phase 1 (1 Woche):** Styling-Fixes + Check-Out System
2. **Phase 2 (1 Woche):** Profil-Seite + Dropdown-Erweiterung
3. **Phase 3 (Optional):** Onboarding, Charts, Nice-to-haves

---

## 6. Implementierte Features (Vollständig)

Diese Features sind bereits korrekt implementiert:

- [x] 10-Schritte Lernplan-Wizard
- [x] Kalender Monats-/Wochenansicht
- [x] Timer (3 Modi)
- [x] Check-In System
- [x] Themenlisten mit Hierarchie
- [x] Aufgabenverwaltung
- [x] Drag & Drop für Aufgaben
- [x] Leistungen/Übungsklausuren
- [x] Mentor Statistik-Dashboard
- [x] App-Modus System (Examen/Normal)
- [x] Navigation mit Dropdowns
- [x] Einstellungen-Seite
- [x] LocalStorage Persistenz
- [x] Supabase Auth Integration

---

## 7. Nächste Schritte

1. **Design-System synchronisieren:** `DESIGN_SYSTEM.md` als Referenz nutzen
2. **Styling-Fixes priorisieren:** Schnelle Wins für bessere Design-Treue
3. **Check-Out implementieren:** Komplettes Check-In/Out System
4. **Profil-Feature planen:** Neue Seite + erweitertes Dropdown

---

## 8. Technische Schulden: Sync-Layer Analyse

> Analyse des Supabase-Sync-Layers auf Inkonsistenzen und potenzielle Bugs
> Analysiert: 2025-12-31

### 8.1 Übersicht der Probleme

| # | Problem | Schwere | Status | Datei |
|---|---------|---------|--------|-------|
| 1 | `supabaseService.js` ungenutzt | ⚠️ Mittel | Offen | `src/services/supabaseService.js` |
| 2 | `useCheckInSync` fehlt `period` | 🔴 Hoch | Offen | `src/hooks/use-supabase-sync.js:474-495` |
| 3 | `onConflict: 'id'` für Check-In falsch | 🔴 Hoch | Offen | `src/hooks/use-supabase-sync.js:212` |
| 4 | `timer_settings` Race Condition | ⚠️ Mittel | Offen | `use-supabase-sync.js:602-633, 1706-1724` |
| 5 | `syncedRef` Logout Edge-Case | ⚠️ Mittel | Offen | `use-supabase-sync.js:80-86` |
| 6 | PRD/Kommentare inkonsistent | ℹ️ Niedrig | Offen | `PRD.md`, `calendar-context.jsx` |
| 7 | Kein Realtime-Code | ℹ️ Info | Dokumentiert | - |

---

### 8.2 Problem 1: `supabaseService.js` - Legacy/Ungenutzt

**Datei:** `src/services/supabaseService.js`

**Beschreibung:**
Die Datei enthält einen vollständigen CRUD-Layer mit Service-Objekten für alle Entitäten, ist aber **nicht im aktiven Code eingebunden**. Sie verwendet veraltete Tabellennamen (`slots` statt `calendar_slots`).

**Status:** Bereits als `@deprecated` markiert (Zeile 2-12)

**Beweis:**
```javascript
/**
 * @deprecated This file is LEGACY and UNUSED.
 *
 * The active Supabase integration is in:
 * - src/hooks/use-supabase-sync.js (data layer with React hooks)
 */
```

**Empfehlung:**
- [ ] Datei löschen nach Bestätigung, dass keine Referenzen existieren
- [ ] `git grep supabaseService` ausführen zur Verifizierung

---

### 8.3 Problem 2 & 3: `useCheckInSync` - Fehlende `period` & falscher `onConflict`

**Datei:** `src/hooks/use-supabase-sync.js:474-495`

**Problem A - Fehlendes `period` Feld:**
```javascript
// AKTUELL (fehlerhaft):
transformToSupabase: (response) => ({
  response_date: response.date || response.responseDate,
  mood: response.mood,
  energy: response.energy,
  focus: response.focus,
  notes: response.notes,
  // ❌ FEHLT: period wird nicht gesetzt!
}),
```

**Problem B - Falscher `onConflict`:**
Die generische `save()` Funktion (Zeile 212) nutzt:
```javascript
.upsert(dataToUpsert, { onConflict: 'id' });
```

Die `checkin_responses` Tabelle hat aber vermutlich einen UNIQUE Constraint auf `(user_id, response_date, period)`.

**Auswirkung:**
- Check-In Daten werden möglicherweise nicht korrekt gespeichert/aktualisiert
- Duplikate oder fehlgeschlagene Upserts möglich

**Fix:**
```javascript
// SOLL:
transformToSupabase: (response) => ({
  response_date: response.date || response.responseDate,
  period: response.period || 'morning', // ✅ Hinzufügen
  mood: response.mood,
  energy: response.energy,
  focus: response.focus,
  notes: response.notes,
}),
```

Und spezieller Save mit korrektem `onConflict`:
```javascript
.upsert(data, { onConflict: 'user_id,response_date,period' });
```

---

### 8.4 Problem 4: `timer_settings` Race Condition

**Dateien:**
- `src/hooks/use-supabase-sync.js:602-633` (`useUserSettingsSync`)
- `src/hooks/use-supabase-sync.js:1706-1724` (`useLernplanMetadataSync`)

**Beschreibung:**
Beide Hooks schreiben in `user_settings.timer_settings`. Jeder liest erst den aktuellen Wert und merged dann:

```javascript
// useUserSettingsSync (Zeile 604-615):
const { data: currentData } = await supabase
  .from('user_settings')
  .select('timer_settings')
  .eq('user_id', user.id)
  .single();

const mergedTimerSettings = {
  ...currentTimerSettings,
  ...newSettings.timerConfig,
};

// useLernplanMetadataSync (Zeile 1707-1724):
const { data: currentSettings } = await supabase
  .from('user_settings')
  .select('timer_settings')
  .eq('user_id', user.id)
  .single();

timer_settings: {
  ...timerSettings,
  lernplanMetadata: newMetadata,
},
```

**Race Condition Szenario:**
1. Hook A liest `timer_settings = { foo: 1 }`
2. Hook B liest `timer_settings = { foo: 1 }`
3. Hook A schreibt `{ foo: 1, bar: 2 }`
4. Hook B schreibt `{ foo: 1, baz: 3 }` → `bar: 2` geht verloren!

**Risikobewertung:** Mittel (tritt nur bei gleichzeitigen Updates auf)

**Mögliche Fixes:**
- [ ] Atomic Update mit JSONB-Merge auf DB-Ebene
- [ ] Optimistic Locking mit `updated_at` Check
- [ ] Separates Feld für `lernplan_metadata` statt in `timer_settings`

---

### 8.5 Problem 5: `syncedRef` Reset bei Logout

**Datei:** `src/hooks/use-supabase-sync.js:80-86`

**Aktueller Code:**
```javascript
useEffect(() => {
  if (user?.id !== userIdRef.current) {
    syncedRef.current = false;
    userIdRef.current = user?.id || null;
  }
}, [user?.id]);
```

**Edge Case:**
Bei schnellem Logout → Re-Login mit demselben User in derselben Session:
1. Logout: `user` wird `null`, aber Component bleibt gemounted
2. `userIdRef.current` bleibt auf `'user-123'`
3. Re-Login: `user?.id` ist wieder `'user-123'`
4. Bedingung `user?.id !== userIdRef.current` ist **false**!
5. `syncedRef.current` bleibt **true** → Initial-Sync wird übersprungen

**Normaler Flow (funktioniert):**
1. Logout: `user` wird `null`
2. `user?.id` ist `undefined` ≠ `'user-123'` → Reset erfolgt

**Risikobewertung:** Mittel (seltener Edge Case)

**Fix:**
```javascript
useEffect(() => {
  // Explizit auf null prüfen für Logout
  if (user === null) {
    syncedRef.current = false;
    userIdRef.current = null;
  } else if (user?.id !== userIdRef.current) {
    syncedRef.current = false;
    userIdRef.current = user?.id;
  }
}, [user]);
```

---

### 8.6 Problem 6: Dokumentation inkonsistent

**Betroffene Dateien:**
- `PRD.md` - Sagt "LocalStorage-Only für Slots/Tasks"
- `src/contexts/calendar-context.jsx` - Kommentar sagt LocalStorage
- Aktiver Code nutzt aber Supabase-Sync

**Auszug PRD.md (veraltet):**
> "Daten werden lokal in LocalStorage persistiert..."

**Realität:**
Der Code in `use-supabase-sync.js` synchronisiert aktiv mit Supabase:
- `useCalendarSlotsSync()` - Slots nach Supabase
- `useCalendarTasksSync()` - Tasks nach Supabase
- usw.

**Fix:**
- [ ] PRD.md aktualisieren mit aktuellem Sync-Verhalten
- [ ] Kommentare in Context-Dateien aktualisieren

---

### 8.7 Info: Kein Realtime-Code

**Beschreibung:**
Es gibt keinen `supabase.channel()` oder Realtime-Subscription Code im Frontend.

**Status:** ✅ Korrekt dokumentiert in PRD.md als "offen"

**Kein Bug** - Feature ist als zukünftige Erweiterung geplant.

---

### 8.8 Priorisierte Fix-Liste

| Priorität | Problem | Aufwand | Empfehlung |
|-----------|---------|---------|------------|
| 🔴 P0 | Check-In `period` fehlt | 0.5h | Sofort fixen |
| 🔴 P0 | Check-In `onConflict` falsch | 0.5h | Sofort fixen |
| ⚠️ P1 | `supabaseService.js` löschen | 0.5h | Nach Verifizierung |
| ⚠️ P1 | `syncedRef` Logout-Fix | 1h | Nächster Sprint |
| ⚠️ P2 | `timer_settings` Race Condition | 2-3h | Refactoring planen |
| ℹ️ P3 | Dokumentation aktualisieren | 1h | Bei Gelegenheit |

---

### 8.9 Verifizierungs-Checkliste

Nach den Fixes sollten folgende Tests durchgeführt werden:

- [ ] Check-In speichern und in Supabase prüfen (`period` vorhanden?)
- [ ] Check-Out speichern (wenn implementiert)
- [ ] Logout → Re-Login → Daten werden korrekt geladen
- [ ] Gleichzeitig Timer-Settings und Lernplan-Metadata speichern
- [ ] `git grep supabaseService` zeigt keine Verwendung

---

## 9. Nächste Schritte (Aktualisiert)

1. **🔴 KRITISCH:** Check-In Sync Bugs fixen (Problem 2 & 3)
2. **Design-System synchronisieren:** `DESIGN_SYSTEM.md` als Referenz nutzen
3. **Styling-Fixes priorisieren:** Schnelle Wins für bessere Design-Treue
4. **Check-Out implementieren:** Komplettes Check-In/Out System
5. **Profil-Feature planen:** Neue Seite + erweitertes Dropdown
6. **Legacy-Code aufräumen:** `supabaseService.js` löschen
7. **Dokumentation aktualisieren:** PRD.md mit aktuellem Sync-Verhalten

---

*Dieser Report basiert auf der Analyse vom 2025-12-31 und sollte bei größeren Figma-Updates aktualisiert werden.*

*Sync-Layer Analyse hinzugefügt am 2025-12-31.*
