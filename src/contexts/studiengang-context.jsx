import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  STUDIENGAENGE,
  getHierarchyLabels,
  isJuraStudiengang,
  getStudiengangName,
} from '../data/studiengaenge';
import { useAuth } from './auth-context';
import { supabase } from '../services/supabase';

const STORAGE_KEY = 'prepwell_studiengang'; // T7: Dedicated key for studiengang

const StudiengangContext = createContext(null);

/**
 * StudiengangProvider - Verwaltet den gewählten Studiengang und stellt
 * dynamische Hierarchie-Labels für die gesamte App bereit.
 *
 * T7: Supabase-Sync ist LAZY (nur beim Speichern).
 * localStorage ist die primäre Quelle für schnelles Laden.
 */
export const StudiengangProvider = ({ children }) => {
  // State aus localStorage laden (instant, no API calls)
  const [studiengang, setStudiengangState] = useState(() => {
    try {
      // Check new key first, then fall back to old structure
      const direct = localStorage.getItem(STORAGE_KEY);
      if (direct) {
        return JSON.parse(direct);
      }
      // Legacy fallback
      const settings = JSON.parse(localStorage.getItem('prepwell_settings') || '{}');
      return settings.studium?.studiengang || null;
    } catch {
      return null;
    }
  });

  // Auth for Supabase sync (lazy - only used when saving)
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();

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

  // Studiengang setzen und in Settings speichern (+ lazy Supabase sync)
  const setStudiengang = useCallback(async (newStudiengang) => {
    setStudiengangState(newStudiengang);

    // Save to localStorage (instant)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStudiengang));
    } catch (e) {
      console.error('[StudiengangContext] Error saving to localStorage:', e);
    }

    // T7: Lazy sync to Supabase (non-blocking, fire-and-forget)
    if (isSupabaseEnabled && isAuthenticated && user?.id && supabase) {
      try {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            studiengang: newStudiengang,
          }, { onConflict: 'user_id' });
      } catch (e) {
        // Silent fail - localStorage is the source of truth
        console.warn('[StudiengangContext] Supabase sync failed:', e);
      }
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  // Auf localStorage-Änderungen hören (für Sync zwischen Tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const direct = localStorage.getItem(STORAGE_KEY);
        if (direct) {
          setStudiengangState(JSON.parse(direct));
        }
      } catch {
        // Ignorieren
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // PERF FIX: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
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
  }), [studiengang, setStudiengang, studiengangName, hierarchyLabels, isJura]);

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
