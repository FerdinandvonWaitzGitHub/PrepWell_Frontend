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
const KAPITEL_KEY = 'prepwell_kapitel_ebene'; // T22: Key for Kapitel-Ebene setting

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

  // T22: Kapitel-Ebene Einstellung (default: false)
  // Reads from dedicated key first, then falls back to existing settings structure
  const [kapitelEbeneAktiviert, setKapitelEbeneAktiviertState] = useState(() => {
    try {
      // Check dedicated key first
      const stored = localStorage.getItem(KAPITEL_KEY);
      if (stored !== null) {
        return JSON.parse(stored);
      }
      // Fallback to existing settings structure
      const settings = JSON.parse(localStorage.getItem('prepwell_settings') || '{}');
      return settings.jura?.chapterLevelEnabled || false;
    } catch {
      return false;
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

  // T22: Kapitel-Ebene setzen und speichern
  const setKapitelEbeneAktiviert = useCallback(async (enabled) => {
    setKapitelEbeneAktiviertState(enabled);

    // Save to localStorage (instant)
    try {
      localStorage.setItem(KAPITEL_KEY, JSON.stringify(enabled));
    } catch (e) {
      console.error('[StudiengangContext] Error saving kapitel setting to localStorage:', e);
    }

    // Lazy sync to Supabase
    if (isSupabaseEnabled && isAuthenticated && user?.id && supabase) {
      try {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            kapitel_ebene_aktiviert: enabled,
          }, { onConflict: 'user_id' });
      } catch (e) {
        console.warn('[StudiengangContext] Supabase sync for kapitel failed:', e);
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

    // T22: Kapitel-Ebene Einstellung (nur für Juristen relevant)
    kapitelEbeneAktiviert,
    setKapitelEbeneAktiviert,

    // Alle verfügbaren Studiengänge
    studiengaenge: STUDIENGAENGE,
  }), [studiengang, setStudiengang, studiengangName, hierarchyLabels, isJura, kapitelEbeneAktiviert, setKapitelEbeneAktiviert]);

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
