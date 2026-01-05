import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './router.jsx';
import './index.css';

// Run LocalStorage migrations on app startup
import { runLocalStorageMigration } from './utils/localStorage-migration.js';
runLocalStorageMigration();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
