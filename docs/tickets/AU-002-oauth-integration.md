# TICKET AU-002: OAuth-Integration (Google + Apple)

**Typ:** Feature
**Priorität:** Mittel
**Status:** Offen
**Erstellt:** 2026-01-16
**Aufwand:** 4-6h
**Abhängigkeit:** AU-001 (OAuth-Buttons visuell vorhanden)

---

## 1. Zusammenfassung

Aktivierung der OAuth-Anmeldung mit Google und Apple. Die Buttons sind nach AU-001 bereits visuell vorhanden (disabled). Dieses Ticket aktiviert die tatsächliche Funktionalität.

---

## 2. Voraussetzungen

### 2.1 Supabase Dashboard Konfiguration

| Provider | Console | Erforderliche Schritte |
|----------|---------|------------------------|
| **Google** | [Google Cloud Console](https://console.cloud.google.com/) | OAuth 2.0 Client erstellen |
| **Apple** | [Apple Developer](https://developer.apple.com/) | Sign in with Apple konfigurieren |

### 2.2 Supabase Auth Provider Setup

1. Supabase Dashboard → Authentication → Providers
2. Google aktivieren + Client ID/Secret eintragen
3. Apple aktivieren + Service ID/Secret eintragen

---

## 3. Offene Fragen (VOR Implementierung klären)

| # | Frage | Antwort |
|---|-------|---------|
| 1 | Haben wir einen Google Cloud Account? | |
| 2 | Haben wir einen Apple Developer Account ($99/Jahr)? | |
| 3 | Welche Redirect-URLs sollen konfiguriert werden? (localhost + production) | |
| 4 | Sollen beide Provider gleichzeitig oder nacheinander aktiviert werden? | |
| 5 | Brauchen wir spezielle Scopes (z.B. Profilbild, Name)? | |

---

## 4. Implementierungsplan

### Phase 1: Supabase Konfiguration (1-2h)

**Schritt 1.1: Google OAuth Setup**
```
1. Google Cloud Console → APIs & Services → Credentials
2. OAuth 2.0 Client ID erstellen (Web Application)
3. Authorized redirect URIs:
   - https://<project-ref>.supabase.co/auth/v1/callback
   - http://localhost:5173/auth/callback (Development)
4. Client ID + Secret in Supabase Dashboard eintragen
```

**Schritt 1.2: Apple Sign In Setup**
```
1. Apple Developer → Certificates, Identifiers & Profiles
2. Services ID erstellen
3. Sign in with Apple aktivieren
4. Return URLs konfigurieren
5. Service ID + Key in Supabase Dashboard eintragen
```

### Phase 2: Frontend Integration (2-3h)

**Schritt 2.1: auth-context.jsx erweitern**
```jsx
// Neue Funktionen hinzufügen:
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'email profile'
    }
  });
  return { error };
};

const signInWithApple = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  return { error };
};

// Im Context-Value exportieren:
signInWithGoogle,
signInWithApple,
```

**Schritt 2.2: OAuthButtons.jsx aktivieren**
```jsx
// Entfernen:
disabled={true}
title="Bald verfügbar"
className="... cursor-not-allowed opacity-60"
<span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Bald</span>

// Hinzufügen:
onClick={onGoogleClick}  // bzw. onAppleClick
disabled={loading}
className="... hover:bg-gray-50"
```

**Schritt 2.3: Callback-Route (optional)**
```jsx
// Falls separate Callback-Seite benötigt:
// src/pages/auth-callback.jsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

### Phase 3: Testing (1h)

- [ ] Google Login testen (localhost)
- [ ] Apple Login testen (localhost)
- [ ] Google Login testen (production)
- [ ] Apple Login testen (production)
- [ ] Fehlerbehandlung testen (Abbruch, Netzwerkfehler)
- [ ] Bestehende Email/Password-Anmeldung weiterhin funktional
- [ ] User-Metadata (Name, Avatar) korrekt übernommen

---

## 5. Akzeptanzkriterien

- [ ] Google-Anmeldung funktioniert
- [ ] Apple-Anmeldung funktioniert
- [ ] OAuth-User werden korrekt in Supabase Auth angelegt
- [ ] Profildaten (Name) werden aus OAuth übernommen
- [ ] Approval-System funktioniert auch für OAuth-User
- [ ] Fehler werden benutzerfreundlich angezeigt
- [ ] "Bald verfügbar" Badge entfernt

---

## 6. Sicherheitshinweise

- OAuth Secrets NIEMALS im Frontend-Code
- Redirect-URLs exakt konfigurieren (keine Wildcards)
- PKCE Flow verwenden (Supabase Standard)
- Production-URLs vor Go-Live testen

---

## 7. Abhängigkeiten

| Ticket | Status | Beschreibung |
|--------|--------|--------------|
| **AU-001** | Muss abgeschlossen sein | OAuth-Buttons visuell vorhanden |

---

## 8. Notizen

_Platz für Notizen während der Implementierung_
