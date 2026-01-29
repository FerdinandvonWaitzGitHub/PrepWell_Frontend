import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './router.jsx';
import './index.css';

// Run LocalStorage migrations on app startup
import { runLocalStorageMigration } from './utils/localStorage-migration.js';
runLocalStorageMigration();

// Handle chunk loading errors after new deployments
// When Vercel deploys a new version, old chunk files are deleted.
// Users with stale HTML will get 404s when navigating - auto-reload fixes this.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
