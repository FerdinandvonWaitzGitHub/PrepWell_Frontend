# Setup Instructions - PrepWell Frontend

## 1. Installation

Installieren Sie zuerst die benötigten Dependencies:

```bash
npm install react-router-dom
```

Falls noch nicht vorhanden:
```bash
npm install react react-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

## 2. Package.json Scripts

Fügen Sie folgende Scripts zu Ihrer `package.json` hinzu:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## 3. Vite Config (falls noch nicht vorhanden)

Erstellen Sie `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

## 4. PostCSS Config

Erstellen Sie `postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## 5. Index HTML

Erstellen Sie `index.html` im Root:

```html
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PrepWell WebApp</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## 6. Main Entry Point

Erstellen Sie `src/main.jsx`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## 7. Starten

```bash
npm run dev
```

Die App läuft dann auf `http://localhost:5173`

## Projektstruktur

```
PrepWell_Frontend/
├── index.html
├── package.json
├── vite.config.js
├── postcss.config.js
├── tailwind.config.js
├── src/
│   ├── main.jsx           # Entry point
│   ├── app.jsx            # Main App mit Router
│   ├── pages/             # Alle Seiten
│   ├── features/          # Feature-spezifische Komponenten
│   ├── components/        # Shared Components
│   │   ├── ui/           # UI Components
│   │   └── layout/       # Layout Components
│   ├── styles/
│   │   └── globals.css   # Tailwind imports
│   └── design-tokens.js
└── ...
```

## Nächste Schritte

Nach der Installation können alle Seiten implementiert werden.
