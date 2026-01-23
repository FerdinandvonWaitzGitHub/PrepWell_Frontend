# T35: prepwell_settings localStorage Key Konflikt

## Status: ABGESCHLOSSEN - KEIN BUG ✅

**Analyse-Ergebnis (2024-01-23):** Der ursprünglich beschriebene Konflikt existiert nicht. Es handelt sich um ein korrektes Single-Writer-Multiple-Reader Pattern.

---

## Original Problem-Beschreibung

Der localStorage Key `prepwell_settings` wird von **4 verschiedenen Contexts** verwendet, was zu unerwarteten Datenüberschreibungen führt.

---

## Betroffene Dateien

| Datei | Verwendung | Liest/Schreibt |
|-------|------------|----------------|
| `src/components/settings/settings-content.jsx` | App-Einstellungen | Schreibt |
| `src/contexts/timer-context.jsx` | Pomodoro-Einstellungen | Liest |
| `src/contexts/checkin-context.jsx` | CheckIn-Counter | Liest/Schreibt |
| `src/hooks/use-supabase-sync.js` | Supabase Sync | Liest/Schreibt |

---

## Code-Analyse

### 1. settings-content.jsx
```javascript
const STORAGE_KEY = 'prepwell_settings';

// Speichert komplette App-Settings
const saveSettings = (settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
```

### 2. timer-context.jsx
```javascript
const USER_SETTINGS_KEY = 'prepwell_settings';

// Liest Pomodoro-Einstellungen
const loadSettings = () => {
  const stored = localStorage.getItem(USER_SETTINGS_KEY);
  // Erwartet: { pomodoroDuration, shortBreak, longBreak, ... }
};
```

### 3. checkin-context.jsx
```javascript
const STORAGE_KEY_APP_SETTINGS = 'prepwell_settings';

// Liest/Schreibt checkInCount
const appSettings = JSON.parse(localStorage.getItem(STORAGE_KEY_APP_SETTINGS));
appSettings.checkInCount = count;
localStorage.setItem(STORAGE_KEY_APP_SETTINGS, JSON.stringify(appSettings));
```

### 4. use-supabase-sync.js
```javascript
export const STORAGE_KEYS = {
  settings: 'prepwell_settings',
  // ...
};
```

---

## Symptome

1. **Timer verliert Pomodoro-Einstellungen** nach Settings-Änderung
2. **CheckIn-Counter wird zurückgesetzt** nach Settings-Sync
3. **Inkonsistente Daten** zwischen Supabase und localStorage
4. **Race Conditions** wenn mehrere Contexts gleichzeitig schreiben

---

## Datenstruktur-Konflikt

```javascript
// settings-content.jsx erwartet:
{
  theme: 'light',
  language: 'de',
  notifications: true,
  // ...
}

// timer-context.jsx erwartet:
{
  pomodoroDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  // ...
}

// checkin-context.jsx erwartet:
{
  checkInCount: 42,
  // ...
}

// Alle schreiben in denselben Key!
```

---

## Fix-Vorschlag

### Phase 1: Separate Keys definieren

```javascript
// Neue Key-Struktur:
const STORAGE_KEYS = {
  // Allgemeine App-Settings
  appSettings: 'prepwell_app_settings',

  // Timer-spezifische Settings
  timerSettings: 'prepwell_timer_settings',

  // CheckIn-spezifische Settings
  checkinSettings: 'prepwell_checkin_settings',

  // Supabase-Sync für user_settings Tabelle
  userSettings: 'prepwell_user_settings_sync',
};
```

### Phase 2: Migration bestehender Daten

```javascript
// src/utils/settings-migration.js
export function migrateSettingsKeys() {
  const oldSettings = localStorage.getItem('prepwell_settings');
  if (!oldSettings) return;

  try {
    const parsed = JSON.parse(oldSettings);

    // Timer-Settings extrahieren
    if (parsed.pomodoroDuration !== undefined) {
      localStorage.setItem('prepwell_timer_settings', JSON.stringify({
        pomodoroDuration: parsed.pomodoroDuration,
        shortBreak: parsed.shortBreak,
        longBreak: parsed.longBreak,
        autoStartBreaks: parsed.autoStartBreaks,
        autoStartPomodoros: parsed.autoStartPomodoros,
      }));
    }

    // CheckIn-Settings extrahieren
    if (parsed.checkInCount !== undefined) {
      localStorage.setItem('prepwell_checkin_settings', JSON.stringify({
        checkInCount: parsed.checkInCount,
      }));
    }

    // App-Settings (Rest)
    const appSettings = { ...parsed };
    delete appSettings.pomodoroDuration;
    delete appSettings.shortBreak;
    delete appSettings.longBreak;
    delete appSettings.autoStartBreaks;
    delete appSettings.autoStartPomodoros;
    delete appSettings.checkInCount;

    localStorage.setItem('prepwell_app_settings', JSON.stringify(appSettings));

    // Alten Key entfernen nach erfolgreicher Migration
    // localStorage.removeItem('prepwell_settings'); // Erst nach Testphase

  } catch (e) {
    console.error('Settings migration failed:', e);
  }
}
```

### Phase 3: Contexts aktualisieren

```javascript
// timer-context.jsx
const TIMER_SETTINGS_KEY = 'prepwell_timer_settings';

// checkin-context.jsx
const CHECKIN_SETTINGS_KEY = 'prepwell_checkin_settings';

// settings-content.jsx
const APP_SETTINGS_KEY = 'prepwell_app_settings';

// use-supabase-sync.js
export const STORAGE_KEYS = {
  userSettings: 'prepwell_user_settings_sync',
  // ...
};
```

---

## Betroffene Supabase-Tabelle

Die `user_settings` Tabelle speichert alle Settings zentral:

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timer Settings
  pomodoro_duration INT DEFAULT 25,
  short_break INT DEFAULT 5,
  long_break INT DEFAULT 15,

  -- App Settings
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'de',

  -- CheckIn Settings
  checkin_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Empfehlung:** Supabase-Sync sollte die separaten localStorage-Keys aggregieren und beim Laden wieder aufteilen.

---

## Test-Szenario

1. Öffne App mit bestehendem `prepwell_settings` Key
2. Migration sollte automatisch laufen
3. Ändere Pomodoro-Dauer in Timer
4. Ändere Theme in Einstellungen
5. Prüfe: Pomodoro-Dauer sollte erhalten bleiben
6. Prüfe: CheckIn-Counter sollte erhalten bleiben

---

## Priorität

**Mittel** - Betrifft User Experience, aber kein Datenverlust bei Kernfunktionen (Themenlisten).

## Abhängigkeiten

- Keine direkten Abhängigkeiten zu T34 (Themenlisten)
- Sollte vor größeren Settings-Erweiterungen gefixt werden

## ~~Geschätzter Aufwand~~

~~- Phase 1 (Keys definieren): 30 Min~~
~~- Phase 2 (Migration): 1-2 Stunden~~
~~- Phase 3 (Contexts aktualisieren): 1-2 Stunden~~
~~- Testing: 1 Stunde~~

~~**Gesamt: ~4-5 Stunden**~~

---

## Analyse-Ergebnis (2024-01-23)

### Tatsächliche Architektur

| Datei | Aktion | Daten |
|-------|--------|-------|
| `settings-content.jsx` | **SCHREIBT** | `{ notifications, learning, display, jura, checkin }` |
| `timer-context.jsx` | **NUR LIEST** | `learning.pomodoroDuration`, `learning.breakDuration` |
| `checkin-context.jsx` | **NUR LIEST** | `checkin.checkInCount` |
| `use-supabase-sync.js` | ~~DEFINIERT~~ | Key entfernt - war ungenutzt |

### Fazit

Dies ist ein **korrektes Single-Writer-Multiple-Reader Pattern**:

1. **Ein Schreiber:** `settings-content.jsx` ist der einzige Context der in `prepwell_settings` schreibt
2. **Mehrere Leser:** `timer-context.jsx` und `checkin-context.jsx` lesen nur spezifische Werte
3. **Kein Konflikt:** Die Datenstruktur ist konsistent, da nur ein Writer existiert

### Durchgeführte Änderung

- Entfernt: Ungenutzter `settings: 'prepwell_settings'` Key aus `STORAGE_KEYS` in `use-supabase-sync.js`
- Kommentar hinzugefügt: "T35: 'settings' key entfernt - wird nur von settings-content.jsx verwaltet (Single-Writer)"

### Mögliche Ursachen der ursprünglichen Symptome

Falls die im Ticket beschriebenen Symptome (Timer verliert Einstellungen, CheckIn-Counter reset) tatsächlich auftreten, sind andere Ursachen wahrscheinlicher:

1. **Browser localStorage Limits:** Zu viele Daten in localStorage
2. **Inkonsistente Defaults:** Unterschiedliche Default-Werte zwischen Contexts
3. **Race Conditions bei App-Start:** Contexts lesen bevor Settings gespeichert wurden
4. **Private/Incognito Mode:** localStorage wird gelöscht

**Status: KEIN BUG - GESCHLOSSEN ✅**
