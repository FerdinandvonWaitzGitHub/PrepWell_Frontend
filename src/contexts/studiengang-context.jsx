import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  STUDIENGAENGE,
  getHierarchyLabels,
  isJuraStudiengang,
  getStudiengangName,
} from '../data/studiengaenge';

const STORAGE_KEY = 'prepwell_settings';

const StudiengangContext = createContext(null);

/**
 * StudiengangProvider - Verwaltet den gewählten Studiengang und stellt
 * dynamische Hierarchie-Labels für die gesamte App bereit.
 */
export const StudiengangProvider = ({ children }) => {
  // State aus localStorage laden
  const [studiengang, setStudiengangState] = useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return settings.studium?.studiengang || null;
    } catch {
      return null;
    }
  });

  // Hierarchie-Labels basierend auf Studiengang berechnen
  const hierarchyLabels = useMemo(() => {
    return getHierarchyLabels(studiengang);
  }, [studiengang]);

  // Prüfen ob Jura-Studiengang
  const isJura = useMemo(() => {
    return isJuraStudiengang(studiengang);
  }, [studiengang]);

  // Name des Studiengangs
  const studiengangName = useMemo(() => {
    return getStudiengangName(studiengang);
  }, [studiengang]);

  // Studiengang setzen und in Settings speichern
  const setStudiengang = useCallback((newStudiengang) => {
    setStudiengangState(newStudiengang);
    try {
      const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      settings.studium = { ...settings.studium, studiengang: newStudiengang };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving studiengang:', e);
    }
  }, []);

  // Auf localStorage-Änderungen hören (für Sync zwischen Komponenten)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        setStudiengangState(settings.studium?.studiengang || null);
      } catch {
        // Ignorieren
      }
    };

    // Storage-Event für andere Fenster/Tabs
    window.addEventListener('storage', handleStorageChange);

    // Periodisch prüfen für gleichen Tab (storage event feuert nicht im selben Tab)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const value = {
    // Aktueller Studiengang
    studiengang,
    setStudiengang,
    studiengangName,

    // Hierarchie-Labels
    hierarchyLabels,

    // Flags
    isJura,
    hasStudiengang: !!studiengang,

    // Alle verfügbaren Studiengänge
    studiengaenge: STUDIENGAENGE,
  };

  return (
    <StudiengangContext.Provider value={value}>
      {children}
    </StudiengangContext.Provider>
  );
};

/**
 * Hook um den Studiengang-Context zu verwenden
 * @returns {object} Studiengang-Context
 */
export const useStudiengang = () => {
  const context = useContext(StudiengangContext);
  if (!context) {
    throw new Error('useStudiengang must be used within a StudiengangProvider');
  }
  return context;
};

export default StudiengangContext;
