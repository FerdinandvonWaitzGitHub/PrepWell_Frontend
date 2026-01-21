# TICKET AU-001: Login/Registration Screens Figma-Anpassung

**Typ:** Design-Anpassung
**Priorität:** Hoch
**Status:** Implementierung-bereit
**Erstellt:** 2026-01-15
**Aktualisiert:** 2026-01-16
**Aufwand:** 12-16h

---

## 1. Zusammenfassung

Komplette Neugestaltung der Auth-Screens (`src/pages/Auth.jsx`) entsprechend Figma-Design. Die bestehende Supabase-Auth-Logik bleibt vollständig erhalten.

**Hauptänderungen:**
- Single-Card Layout → Split-Screen (50/50)
- Blue-Theme → Black/Neutral-Theme
- Tab-System → Separate Formulare mit Navigation-Links
- OAuth-Buttons (Google + Apple) hinzufügen

---

## 2. Figma-Referenz

| Screen | Node-ID | Beschreibung |
|--------|---------|--------------|
| **Login** | `2071:7520` | E-Mail + Passwort |
| **Registration Step 1** | `2071:7011` | Vorname + Nachname |
| **Template** | `2396:4802` | Split-Screen Layout |
| **Password Reset** | `2071:7571` | E-Mail eingeben |
| **E-Mail Bestätigung** | `2071:7189` | Confirmation Screen |

**Figma-URL:** https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2071-95

---

## 3. Design-Spezifikationen

### 3.1 Layout-Struktur

```
┌──────────────────────────────────────────────────────────────┐
│                    1512px (100vw)                            │
├─────────────────────────┬────────────────────────────────────┤
│     Left Panel          │         Right Panel                │
│     756px (50%)         │         756px (50%)                │
│                         │                                    │
│  ┌─────────────────┐    │    ┌────────────────────────┐      │
│  │  PrepWell Logo  │    │    │   Form Container       │      │
│  │                 │    │    │   500px × 650px        │      │
│  │  "Struktur.     │    │    │                        │      │
│  │   Klarheit.     │    │    │   [Form Content]       │      │
│  │   Wohlbefinden."│    │    │                        │      │
│  │                 │    │    └────────────────────────┘      │
│  │  Beschreibung   │    │                                    │
│  └─────────────────┘    │                                    │
│                         │                                    │
├─────────────────────────┴────────────────────────────────────┤
│  Footer: "© 2026 PrepWell GmbH - Impressum & Datenschutz"    │
└──────────────────────────────────────────────────────────────┘
```

**Mobile (< 768px):** Stack-Layout (Logo oben, Form unten)

### 3.2 Design Tokens → Tailwind Mapping

| Figma Token | Wert | Tailwind Class |
|-------------|------|----------------|
| `--base/primary` | `#171717` | `bg-gray-900` |
| `--base/foreground` | `#0A0A0A` | `text-gray-950` |
| `--base/muted-foreground` | `#737373` | `text-gray-500` |
| `--base/input` | `#E5E5E5` | `border-gray-200` |
| `--base/primary-foreground` | `#FAFAFA` | `text-neutral-50` |
| `--base/background` | `#FFFFFF` | `bg-white` |
| `--error-color` | `#EC221F` | `text-red-600` / `border-red-500` |
| `--rounded-md` | `8px` | `rounded-lg` |
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-xs` |

### 3.3 Typography

| Element | Figma | Tailwind |
|---------|-------|----------|
| Form Title | DM Sans 24px/32px Medium | `text-2xl font-medium` |
| Labels | DM Sans 14px/20px Medium | `text-sm font-medium` |
| Body/Placeholder | DM Sans 14px/20px Normal | `text-sm text-gray-500` |
| Helper Text | DM Sans 12px/16px Normal | `text-xs text-gray-500` |

---

## 4. Komponenten-Architektur

### 4.1 Neue Dateistruktur

```
src/
├── pages/
│   └── Auth.jsx                    # Behalten (Router-Entry)
│
├── features/
│   └── auth/
│       ├── components/
│       │   ├── AuthLayout.jsx      # NEU: Split-Screen Template
│       │   ├── LoginForm.jsx       # NEU: Login-Formular
│       │   ├── RegisterForm.jsx    # NEU: Registration-Formular
│       │   ├── ForgotPasswordForm.jsx  # NEU: Passwort-Reset
│       │   ├── AuthInput.jsx       # NEU: Styled Input-Component
│       │   └── OAuthButtons.jsx    # NEU: Google + Apple Buttons
│       │
│       └── index.js                # Exports
```

### 4.2 Komponenten-Details

#### AuthLayout.jsx
```jsx
// Props: children, title, subtitle
// - Split-Screen Container (lg:grid-cols-2)
// - Left: Logo + Branding
// - Right: children (Form Slot)
// - Footer
```

#### AuthInput.jsx
```jsx
// Props: label, type, value, onChange, error, placeholder, required
// Styling:
// - Container: relative
// - Input: w-full px-3 py-3 border border-gray-200 rounded-lg shadow-xs
//          text-gray-950 placeholder:text-gray-500
//          focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900
// - Error: border-red-500 focus:ring-red-500
// - Label: text-sm font-medium text-gray-950 mb-1.5
```

#### OAuthButtons.jsx
```jsx
// - Separator: "Oder" mit Linien
// - Google Button: Outline mit Icon
// - Apple Button: Outline mit Icon
// Styling:
// - Button: w-full px-4 py-3 border border-gray-200 rounded-lg
//           bg-white hover:bg-gray-50 flex items-center justify-center gap-2
//           text-sm font-medium text-gray-950
```

---

## 5. Implementierungsplan

### Phase 1: Komponenten-Setup (3-4h)

**Schritt 1.1: AuthLayout erstellen**
```jsx
// src/features/auth/components/AuthLayout.jsx
export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Panel - Branding */}
        <div className="lg:w-1/2 bg-neutral-50 p-8 lg:p-12 flex items-center justify-center">
          <div className="max-w-md">
            <img src="/logo.svg" alt="PrepWell" className="h-10 mb-8" />
            <h1 className="text-3xl font-light text-gray-950 mb-4">
              Struktur. Klarheit. Wohlbefinden.
            </h1>
            <p className="text-gray-500">
              Dein Lernbegleiter für die Vorbereitung auf das Staatsexamen.
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-[500px]">
            {title && <h2 className="text-2xl font-medium text-gray-950 mb-2">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 mb-8">{subtitle}</p>}
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 w-full py-4 text-center text-xs text-gray-500 bg-white border-t">
        © 2026 PrepWell GmbH - Impressum & Datenschutzerklärung
      </div>
    </div>
  );
}
```

**Schritt 1.2: AuthInput erstellen**
```jsx
// src/features/auth/components/AuthInput.jsx
export default function AuthInput({
  label, type = 'text', value, onChange, error, placeholder, required,
  rightElement // Für "Passwort vergessen?" Link
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-sm font-medium text-gray-950">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {rightElement}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full px-3 py-3 rounded-lg shadow-xs text-sm
          border ${error ? 'border-red-500' : 'border-gray-200'}
          text-gray-950 placeholder:text-gray-500
          focus:outline-none focus:ring-2
          ${error ? 'focus:ring-red-500' : 'focus:ring-gray-900 focus:border-gray-900'}
        `}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

**Schritt 1.3: OAuthButtons erstellen**
```jsx
// src/features/auth/components/OAuthButtons.jsx
export default function OAuthButtons({ mode = 'login', onGoogleClick, onAppleClick, loading }) {
  const googleText = mode === 'login' ? 'Anmelden mit Google' : 'Registriere dich mit Google';
  const appleText = mode === 'login' ? 'Anmelden mit Apple' : 'Registriere dich mit Apple';

  return (
    <div className="mt-6">
      {/* Separator */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-500">Oder</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <button
          onClick={onGoogleClick}
          disabled={loading}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white
                     hover:bg-gray-50 flex items-center justify-center gap-2
                     text-sm font-medium text-gray-950 disabled:opacity-50"
        >
          <GoogleIcon className="w-5 h-5" />
          {googleText}
        </button>

        <button
          onClick={onAppleClick}
          disabled={loading}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white
                     hover:bg-gray-50 flex items-center justify-center gap-2
                     text-sm font-medium text-gray-950 disabled:opacity-50"
        >
          <AppleIcon className="w-5 h-5" />
          {appleText}
        </button>
      </div>
    </div>
  );
}
```

### Phase 2: Form-Komponenten (3-4h)

**Schritt 2.1: LoginForm erstellen**
- E-Mail Input
- Passwort Input mit "Passwort vergessen?" rechts oben
- "Anmelden" Button (black, full-width)
- OAuthButtons
- "Du hast noch kein Konto? Jetzt registrieren!" Link unten

**Schritt 2.2: RegisterForm erstellen**
- Vorname Input (required)
- Nachname Input (optional)
- E-Mail Input
- Passwort + Passwort bestätigen
- "Konto erstellen" Button
- OAuthButtons
- "Du hast bereits ein Konto? Anmelden" Link

**Schritt 2.3: ForgotPasswordForm erstellen**
- E-Mail Input
- "Link senden" Button
- "Zurück zur Anmeldung" Link

### Phase 3: Auth.jsx Refactoring (2-3h)

**Schritt 3.1: Auth.jsx als Router umbauen**
```jsx
// src/pages/Auth.jsx
import { useState } from 'react';
import AuthLayout from '../features/auth/components/AuthLayout';
import LoginForm from '../features/auth/components/LoginForm';
import RegisterForm from '../features/auth/components/RegisterForm';
import ForgotPasswordForm from '../features/auth/components/ForgotPasswordForm';

export default function Auth() {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'

  // Bestehende Auth-Logik hier behalten (useAuth, useNavigate, etc.)

  const renderForm = () => {
    switch (view) {
      case 'register':
        return <RegisterForm onSwitchToLogin={() => setView('login')} />;
      case 'forgot':
        return <ForgotPasswordForm onSwitchToLogin={() => setView('login')} />;
      default:
        return (
          <LoginForm
            onSwitchToRegister={() => setView('register')}
            onSwitchToForgot={() => setView('forgot')}
          />
        );
    }
  };

  return (
    <AuthLayout>
      {renderForm()}
    </AuthLayout>
  );
}
```

### Phase 4: OAuth Buttons (nur visuell) (1h)

> **Hinweis:** Supabase OAuth-Konfiguration erfolgt in Ticket AU-002

**Schritt 4.1: OAuthButtons.jsx mit disabled State**
```jsx
// Buttons sind sichtbar aber deaktiviert
// Zeigen "Bald verfügbar" Badge
// Werden in AU-002 aktiviert
```

**Schritt 4.2: Google/Apple Icons**
- Google: `react-icons` → `FcGoogle`
- Apple: Custom SVG (schwarz, 20x20)

### Phase 5: Testing & Polish (2h)

- [ ] Login-Flow testen
- [ ] Register-Flow testen
- [ ] Password-Reset testen
- [ ] OAuth-Buttons testen (falls Supabase OAuth konfiguriert)
- [ ] Error-States visuell prüfen
- [ ] Mobile Responsive testen (sm, md, lg breakpoints)
- [ ] Loading-States prüfen

---

## 6. Logik-Änderungen

### 6.1 Beizubehaltende Logik
```jsx
// Diese bestehende Logik muss 1:1 erhalten bleiben:
✅ useAuth() Hook Integration
✅ Supabase signIn(), signUp(), resetPassword()
✅ isAuthenticated Redirect-Logic
✅ Form Validation (Password length, confirm match)
✅ Error/Success Message Handling
✅ Loading States
```

### 6.2 Zu entfernende Funktionen
```jsx
// Diese Funktionen werden ENTFERNT:
❌ "Weiter ohne Anmeldung" Offline-Mode Option (Auth.jsx Zeilen 288-295)
❌ "Supabase nicht konfiguriert" Screen (Auth.jsx Zeilen 82-102)
```

### 6.3 Zusätzliche Änderungen (router.jsx)
```jsx
// Loading-Spinner Farbe ändern:
// ALT:  border-blue-600
// NEU:  border-gray-900

// Betroffene Stellen:
// - router.jsx Zeile 69 (ProtectedRoute loading)
// - router.jsx Zeile 83 (ProtectedRoute approvalLoading)
// - router.jsx Zeile 107 (HomePage loading)
// - router.jsx Zeile 118 (HomePage approvalLoading)
```

---

## 7. Akzeptanzkriterien

- [ ] Split-Screen Layout wie Figma (Desktop)
- [ ] Stack-Layout auf Mobile
- [ ] Black Primary Button (`bg-gray-900`)
- [ ] Neutral Input-Styling (`border-gray-200`)
- [ ] OAuth-Buttons (Google + Apple) sichtbar
- [ ] "Passwort vergessen?" Link rechts vom Passwort-Label
- [ ] Alle bestehenden Auth-Flows funktionieren
- [ ] Error-States rot dargestellt
- [ ] Loading-Spinner in Buttons
- [ ] PrepWell Logo im Left Panel
- [ ] Footer mit Copyright

---

## 8. Abhängigkeiten

| Ticket | Status | Auswirkung |
|--------|--------|------------|
| DS-001 | Offen | Button-Styles (kann parallel arbeiten, gleiche Styles) |
| **AU-002** | Offen | OAuth-Aktivierung (Folge-Ticket, nicht blockierend) |

---

## 9. Assets

| Asset | Quelle | Empfehlung |
|-------|--------|------------|
| PrepWell Logo | `/public/logo.svg` | Bereits vorhanden prüfen |
| Google Icon | Figma oder `react-icons` | `FcGoogle` von react-icons |
| Apple Icon | Figma oder `lucide-react` | Custom SVG |

---

## 10. Risiken & Mitigations

| Risiko | Mitigation |
|--------|------------|
| OAuth nicht konfiguriert | Buttons visuell anzeigen, aber disabled mit Tooltip "Bald verfügbar" |
| Logo nicht vorhanden | Text-Fallback "PrepWell" als `<span className="text-2xl font-bold text-gray-950">PrepWell</span>` |
| Breaking Changes | Bestehende Logik in separate Hooks extrahieren |

---

## 11. Pending-Approval Screen Redesign

**Datei:** `src/pages/pending-approval.jsx`

### 11.1 Änderungen

| Element | Alt | Neu |
|---------|-----|-----|
| **Email** | `support@prepwell.de` | `team@prepwell.de` |
| **Background** | `bg-gradient-to-br from-amber-50 to-orange-100` | `bg-neutral-50` |
| **Logo** | `text-blue-600` | `text-gray-950` |
| **Primary Button** | `bg-blue-600 hover:bg-blue-700` | `bg-gray-900 hover:bg-gray-800` |
| **Spinner** | `border-blue-600` | `border-gray-900` |

### 11.2 Layout-Entscheidung

**Option A: AuthLayout wiederverwenden**
- Konsistentes Split-Screen Design
- Weniger Code-Duplizierung

**Option B: Eigenständiges Card-Layout (EMPFOHLEN)**
- Pending-Screen ist Sonderfall (kein Formular)
- Card-centered Layout passt besser zum Inhalt
- Amber-Styling für Status-Icon beibehalten (visuelle Unterscheidung)

### 11.3 Code-Änderungen

```jsx
// src/pages/pending-approval.jsx - Zeile 35
// ALT:
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">

// NEU:
<div className="min-h-screen flex items-center justify-center bg-neutral-50">

// Zeile 39 - Logo
// ALT:
<h1 className="text-3xl font-bold text-blue-600">PrepWell</h1>

// NEU:
<h1 className="text-3xl font-bold text-gray-950">PrepWell</h1>

// Zeile 88 - Primary Button
// ALT:
className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 ..."

// NEU:
className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 ..."

// Zeile 113 - Email
// ALT:
<a href="mailto:support@prepwell.de" className="text-blue-600 hover:underline">
  support@prepwell.de
</a>

// NEU:
<a href="mailto:team@prepwell.de" className="text-gray-900 hover:underline">
  team@prepwell.de
</a>
```

---

## 12. Assets - Status

| Asset | Status | Aktion |
|-------|--------|--------|
| PrepWell Logo (`/public/logo.svg`) | **FEHLT** | Text-Fallback verwenden oder Logo aus Figma exportieren |
| Google Icon | Verfügbar | `react-icons` → `FcGoogle` |
| Apple Icon | Verfügbar | Custom SVG oder `lucide-react` |

### 12.1 Logo-Fallback Code

```jsx
// In AuthLayout.jsx - falls Logo nicht existiert:
{logoExists ? (
  <img src="/logo.svg" alt="PrepWell" className="h-10 mb-8" />
) : (
  <span className="text-2xl font-bold text-gray-950 mb-8 block">PrepWell</span>
)}
```

---

## 13. OAuth-Buttons (nur visuell)

> **WICHTIG:** Die OAuth-Buttons werden in diesem Ticket nur **visuell** implementiert.
> Die tatsächliche Supabase OAuth-Konfiguration erfolgt in **Ticket AU-002**.

### 13.1 Implementierung in OAuthButtons.jsx

```jsx
// OAuth-Buttons sind disabled und zeigen Tooltip
<button
  disabled={true}
  title="Bald verfügbar"
  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white
             flex items-center justify-center gap-2
             text-sm font-medium text-gray-400 cursor-not-allowed opacity-60"
>
  <GoogleIcon className="w-5 h-5 grayscale" />
  Anmelden mit Google
  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Bald</span>
</button>
```

### 13.2 Abhängigkeit

| Ticket | Beschreibung |
|--------|--------------|
| **AU-002** | OAuth-Integration (Google + Apple) - Supabase-Konfiguration + Aktivierung |
