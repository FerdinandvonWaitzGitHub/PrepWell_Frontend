import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUserSettingsSync } from '../hooks/use-supabase-sync';

const STORAGE_KEY = 'prepwell_mentor_activated';

/**
 * MentorContext - Manages mentor activation state
 *
 * The mentor feature requires explicit activation by the user.
 * Once activated, statistics and analytics become available.
 *
 * Now uses Supabase for persistence when authenticated,
 * with LocalStorage fallback for offline/unauthenticated use.
 */
const MentorContext = createContext(null);

/**
 * Load mentor state from localStorage
 */
const loadMentorState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading mentor state:', error);
  }
  return { isActivated: false, activatedAt: null };
};

/**
 * Save mentor state to localStorage
 */
const saveMentorState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving mentor state:', error);
  }
};

/**
 * MentorProvider component
 */
export const MentorProvider = ({ children }) => {
  // Use Supabase sync hook for user settings
  const { settings, updateSettings, loading } = useUserSettingsSync();

  // Local state as fallback for activatedAt (not in user_settings table)
  const [activatedAt, setActivatedAt] = useState(() => loadMentorState().activatedAt);

  // Get isActivated from settings (synced) or fallback to localStorage
  const isActivated = settings.mentorActivated ?? loadMentorState().isActivated;

  // Persist activatedAt to localStorage (not synced to Supabase)
  useEffect(() => {
    saveMentorState({ isActivated, activatedAt });
  }, [isActivated, activatedAt]);

  /**
   * Activate the mentor feature
   * Now syncs to Supabase when authenticated
   */
  const activateMentor = useCallback(() => {
    const now = new Date().toISOString();
    setActivatedAt(now);
    updateSettings({ mentorActivated: true });
  }, [updateSettings]);

  /**
   * Deactivate the mentor feature (reset)
   * Now syncs to Supabase when authenticated
   */
  const deactivateMentor = useCallback(() => {
    setActivatedAt(null);
    updateSettings({ mentorActivated: false });
  }, [updateSettings]);

  const value = {
    isActivated,
    activatedAt,
    activateMentor,
    deactivateMentor,
    loading,
  };

  return (
    <MentorContext.Provider value={value}>
      {children}
    </MentorContext.Provider>
  );
};

/**
 * useMentor hook - Access mentor context
 */
export const useMentor = () => {
  const context = useContext(MentorContext);
  if (!context) {
    throw new Error('useMentor must be used within a MentorProvider');
  }
  return context;
};

export default MentorContext;
