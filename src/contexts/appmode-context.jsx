import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { useCalendar } from './calendar-context';
import { useAppModeSync } from '../hooks/use-supabase-sync';

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
 *
 * Now syncs to Supabase via useAppModeSync hook
 */

export const APP_MODES = {
  EXAM: 'exam',
  NORMAL: 'normal',
};

export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  SUBSCRIBED: 'subscribed',
};

const STORAGE_KEY_SEMESTER = 'prepwell_semester';
const STORAGE_KEY_SUBSCRIPTION = 'prepwell_subscription_status';
const STORAGE_KEY_TRIAL_START = 'prepwell_trial_start';
const STORAGE_KEY_MODE_PREFERENCE = 'prepwell_mode_preference';

const TRIAL_DURATION_DAYS = 30; // Trial period length

const AppModeContext = createContext(null);

export const AppModeProvider = ({ children }) => {
  const { getContentPlansByType } = useCalendar();

  // Use Supabase sync hook for app mode state
  const {
    appModeState,
    updateAppModeState,
    loading: syncLoading,
    isAuthenticated,
    isSupabaseEnabled,
  } = useAppModeSync();

  // Semester state (1-10) for normal mode
  const [currentSemester, setCurrentSemesterState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SEMESTER);
      return stored ? parseInt(stored, 10) : 3; // Default: 3. Semester
    } catch {
      return 3;
    }
  });

  // Subscription status (UI only, no real functionality yet)
  const [subscriptionStatus, setSubscriptionStatusState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      return stored || SUBSCRIPTION_STATUS.TRIAL;
    } catch {
      return SUBSCRIPTION_STATUS.TRIAL;
    }
  });

  // Trial start date (for calculating remaining trial days)
  const [trialStartDate, setTrialStartDate] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TRIAL_START);
      if (stored) {
        return new Date(stored);
      }
      // If not set, initialize with today's date
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(STORAGE_KEY_TRIAL_START, today);
      return new Date(today);
    } catch {
      return new Date();
    }
  });

  // User mode preference (null = automatic, 'normal' = force normal mode)
  // Note: 'exam' preference only works if there's an active Lernplan
  const [userModePreference, setUserModePreferenceState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MODE_PREFERENCE);
      return stored || null;
    } catch {
      return null;
    }
  });

  // Sync state from hook when it loads from Supabase
  useEffect(() => {
    if (appModeState && isAuthenticated && isSupabaseEnabled) {
      if (appModeState.currentSemester !== undefined && appModeState.currentSemester !== null) {
        setCurrentSemesterState(appModeState.currentSemester);
      }
      if (appModeState.modePreference !== undefined) {
        setUserModePreferenceState(appModeState.modePreference === 'auto' ? null : appModeState.modePreference);
      }
      if (appModeState.isSubscribed !== undefined) {
        setSubscriptionStatusState(appModeState.isSubscribed ? SUBSCRIPTION_STATUS.SUBSCRIBED : SUBSCRIPTION_STATUS.TRIAL);
      }
      if (appModeState.trialStartDate !== undefined && appModeState.trialStartDate !== null) {
        setTrialStartDate(new Date(appModeState.trialStartDate));
      }
    }
  }, [appModeState, isAuthenticated, isSupabaseEnabled]);

  // Persist semester to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SEMESTER, currentSemester.toString());
  }, [currentSemester]);

  // Persist subscription status to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, subscriptionStatus);
  }, [subscriptionStatus]);

  // Persist mode preference to localStorage
  useEffect(() => {
    if (userModePreference) {
      localStorage.setItem(STORAGE_KEY_MODE_PREFERENCE, userModePreference);
    } else {
      localStorage.removeItem(STORAGE_KEY_MODE_PREFERENCE);
    }
  }, [userModePreference]);

  // Update semester with Supabase sync
  const setSemester = useCallback((semester) => {
    const value = Math.max(1, Math.min(10, semester));
    setCurrentSemesterState(value);
    updateAppModeState({ currentSemester: value });
  }, [updateAppModeState]);

  // Update subscription status with Supabase sync
  const setSubscriptionStatus = useCallback((status) => {
    setSubscriptionStatusState(status);
    updateAppModeState({ isSubscribed: status === SUBSCRIPTION_STATUS.SUBSCRIBED });
  }, [updateAppModeState]);

  // Check if there's at least one active (non-archived) Lernplan
  const activeLernplaene = useMemo(() => {
    return getContentPlansByType('lernplan', false);
  }, [getContentPlansByType]);

  // Determine current app mode (respects user preference)
  const appMode = useMemo(() => {
    const hasActiveLernplan = activeLernplaene.length > 0;

    // User can always switch to normal mode
    if (userModePreference === 'normal') return APP_MODES.NORMAL;

    // User can manually switch to exam mode (even without Lernplan)
    if (userModePreference === 'exam') return APP_MODES.EXAM;

    // Default: automatic based on Lernplan existence
    return hasActiveLernplan ? APP_MODES.EXAM : APP_MODES.NORMAL;
  }, [activeLernplaene, userModePreference]);

  // Toggle between exam and normal mode (always available)
  const toggleMode = useCallback(() => {
    // Toggle: if currently exam → normal, if currently normal → exam
    const newPreference = appMode === APP_MODES.EXAM ? 'normal' : 'exam';
    setUserModePreferenceState(newPreference);
    updateAppModeState({ modePreference: newPreference });
  }, [appMode, updateAppModeState]);

  // Reset mode preference to automatic
  const resetModePreference = useCallback(() => {
    setUserModePreferenceState(null);
    updateAppModeState({ modePreference: 'auto' });
  }, [updateAppModeState]);

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

  // FEAT-002: Navigation items that should be hidden in normal mode
  // These are completely hidden, not just disabled
  const hiddenInNormalMode = useMemo(() => {
    return ['uebungsklausuren']; // Übungsklausuren only in Exam mode
  }, []);

  // FEAT-002: Navigation items that should be hidden in exam mode
  const hiddenInExamMode = useMemo(() => {
    return ['leistungen-noten']; // Semester-Noten only in Normal mode (coming soon)
  }, []);

  // FEAT-002: Check if a specific nav item should be hidden
  const isNavItemHidden = useCallback((navKey) => {
    if (isNormalMode && hiddenInNormalMode.includes(navKey)) return true;
    if (isExamMode && hiddenInExamMode.includes(navKey)) return true;
    return false;
  }, [isNormalMode, isExamMode, hiddenInNormalMode, hiddenInExamMode]);

  // FEAT-002: Check if Lernplan Wizard should be available (only in Exam mode)
  const isWizardAvailable = isExamMode;

  // Default calendar view based on mode
  const defaultCalendarView = isExamMode ? 'monat' : 'woche';

  // Subscription convenience values
  const isTrialMode = subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL;
  const isSubscribed = subscriptionStatus === SUBSCRIPTION_STATUS.SUBSCRIBED;

  // Calculate remaining trial days
  const trialDaysRemaining = useMemo(() => {
    if (!isTrialMode) return 0;
    const today = new Date();
    const trialEnd = new Date(trialStartDate);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
    const diffTime = trialEnd - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [isTrialMode, trialStartDate]);

  // Get display text for current mode
  const modeDisplayText = isExamMode ? 'Examensmodus' : `${currentSemester}. Semester`;

  // Check if mode toggle is available (always available)
  const canToggleMode = true;

  // Check if user has manually overridden the mode
  const isModeManuallySet = userModePreference !== null;

  const value = {
    appMode,
    isExamMode,
    isNormalMode,
    activeLernplan,
    activeLernplaene,
    disabledInNormalMode,
    isNavItemDisabled,
    // FEAT-002: Dynamic navigation based on mode
    isNavItemHidden,
    isWizardAvailable,
    defaultCalendarView,
    // Mode Toggle
    toggleMode,
    resetModePreference,
    canToggleMode,
    isModeManuallySet,
    userModePreference,
    // Semester
    currentSemester,
    setSemester,
    // Subscription
    subscriptionStatus,
    setSubscriptionStatus,
    isTrialMode,
    isSubscribed,
    trialDaysRemaining,
    // Display
    modeDisplayText,
    // Sync status
    isSyncing: syncLoading,
    isSupabaseEnabled,
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
