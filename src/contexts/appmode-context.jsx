import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { useCalendar } from './calendar-context';

/**
 * App Mode Context
 *
 * Determines whether the app is in "Examen-Modus" or "Normal-Modus"
 *
 * Examen-Modus: Active when a Lernplan exists and is not archived
 *   - Uses Monatsansicht in calendar
 *   - Lernplan controls everything
 *   - All navigation options available
 *
 * Normal-Modus: Active when no active Lernplan exists
 *   - Uses Themenlisten and Wochenansicht
 *   - Certain navigation options are disabled/grayed out
 *   - Shows current semester (1-10)
 */

export const APP_MODES = {
  EXAM: 'exam',
  NORMAL: 'normal',
};

export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  SUBSCRIBED: 'subscribed',
};

const STORAGE_KEY_SEMESTER = 'prepwell_current_semester';
const STORAGE_KEY_SUBSCRIPTION = 'prepwell_subscription_status';

const AppModeContext = createContext(null);

export const AppModeProvider = ({ children }) => {
  const { getContentPlansByType } = useCalendar();

  // Semester state (1-10) for normal mode
  const [currentSemester, setCurrentSemester] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SEMESTER);
      return stored ? parseInt(stored, 10) : 3; // Default: 3. Semester
    } catch {
      return 3;
    }
  });

  // Subscription status (UI only, no real functionality yet)
  const [subscriptionStatus, setSubscriptionStatus] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      return stored || SUBSCRIPTION_STATUS.TRIAL;
    } catch {
      return SUBSCRIPTION_STATUS.TRIAL;
    }
  });

  // Persist semester to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SEMESTER, currentSemester.toString());
  }, [currentSemester]);

  // Persist subscription status to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, subscriptionStatus);
  }, [subscriptionStatus]);

  // Update semester
  const setSemester = useCallback((semester) => {
    const value = Math.max(1, Math.min(10, semester));
    setCurrentSemester(value);
  }, []);

  // Check if there's at least one active (non-archived) Lernplan
  const activeLernplaene = useMemo(() => {
    return getContentPlansByType('lernplan', false);
  }, [getContentPlansByType]);

  // Determine current app mode
  const appMode = useMemo(() => {
    return activeLernplaene.length > 0 ? APP_MODES.EXAM : APP_MODES.NORMAL;
  }, [activeLernplaene]);

  // Convenience booleans
  const isExamMode = appMode === APP_MODES.EXAM;
  const isNormalMode = appMode === APP_MODES.NORMAL;

  // Get the current active Lernplan (first non-archived one)
  const activeLernplan = useMemo(() => {
    return activeLernplaene.length > 0 ? activeLernplaene[0] : null;
  }, [activeLernplaene]);

  // Navigation items that should be disabled in normal mode
  // Note: 'lernplan' page is accessible in both modes (for Themenlisten in normal mode)
  // Only 'uebungsklausuren' is disabled in normal mode
  const disabledInNormalMode = useMemo(() => {
    return isNormalMode ? ['uebungsklausuren'] : [];
  }, [isNormalMode]);

  // Check if a specific nav item is disabled
  const isNavItemDisabled = (navKey) => {
    return disabledInNormalMode.includes(navKey);
  };

  // Default calendar view based on mode
  const defaultCalendarView = isExamMode ? 'monat' : 'woche';

  // Subscription convenience values
  const isTrialMode = subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL;
  const isSubscribed = subscriptionStatus === SUBSCRIPTION_STATUS.SUBSCRIBED;

  // Get display text for current mode
  const modeDisplayText = isExamMode ? 'Examensmodus' : `${currentSemester}. Semester`;

  const value = {
    appMode,
    isExamMode,
    isNormalMode,
    activeLernplan,
    activeLernplaene,
    disabledInNormalMode,
    isNavItemDisabled,
    defaultCalendarView,
    // Semester
    currentSemester,
    setSemester,
    // Subscription
    subscriptionStatus,
    setSubscriptionStatus,
    isTrialMode,
    isSubscribed,
    // Display
    modeDisplayText,
  };

  return (
    <AppModeContext.Provider value={value}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
};

export default AppModeContext;
