import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import { useMentor } from './mentor-context';
import { supabase } from '../services/supabase';

const CheckInContext = createContext(null);

// LocalStorage keys
const STORAGE_KEY_RESPONSES = 'prepwell_checkin_responses';
const STORAGE_KEY_SETTINGS = 'prepwell_checkin_settings';
const STORAGE_KEY_APP_SETTINGS = 'prepwell_settings'; // TICKET-3: App settings for checkInCount

// Check-in questions (Morning)
export const CHECKIN_QUESTIONS = [
  {
    id: 'positivity',
    question: 'Wie positiv fühlst du dich?',
    options: [
      { value: 1, label: 'sehr negativ' },
      { value: 2, label: 'eher negativ' },
      { value: 3, label: 'mittelmäßig' },
      { value: 4, label: 'eher positiv' },
      { value: 5, label: 'sehr positiv' }
    ]
  },
  {
    id: 'energy',
    question: 'Wie energiegeladen bist du?',
    options: [
      { value: 1, label: 'sehr müde' },
      { value: 2, label: 'eher träge' },
      { value: 3, label: 'mittelmäßig' },
      { value: 4, label: 'aktiviert' },
      { value: 5, label: 'voller Energie' }
    ]
  },
  {
    id: 'motivation',
    question: 'Wie motiviert bist du?',
    options: [
      { value: 1, label: 'demotiviert' },
      { value: 2, label: 'eher demotiviert' },
      { value: 3, label: 'mittelmäßig' },
      { value: 4, label: 'motiviert' },
      { value: 5, label: 'sehr motiviert' }
    ]
  },
  {
    id: 'stress',
    question: 'Wie gestresst fühlst du dich?',
    options: [
      { value: 5, label: 'gar nicht' },
      { value: 4, label: 'wenig' },
      { value: 3, label: 'mittelmäßig' },
      { value: 2, label: 'eher gestresst' },
      { value: 1, label: 'sehr gestresst' }
    ]
  }
];

// TICKET-2: Abend-Check-in questions (Evening)
export const CHECKOUT_QUESTIONS = [
  {
    id: 'productivity',
    question: 'Bist du mit deiner Produktivität zufrieden?',
    options: [
      { value: 1, label: 'unzufrieden' },
      { value: 2, label: 'eher nicht' },
      { value: 3, label: 'mittelmäßig' },
      { value: 4, label: 'eher ja' },
      { value: 5, label: 'sehr zufrieden' }
    ]
  },
  {
    id: 'concentration',
    question: 'Wie gut konntest du dich konzentrieren?',
    options: [
      { value: 1, label: 'sehr schlecht' },
      { value: 2, label: 'eher schlecht' },
      { value: 3, label: 'mittelmäßig' },
      { value: 4, label: 'gut' },
      { value: 5, label: 'sehr gut' }
    ]
  },
  {
    id: 'stress',
    question: 'Wie gestresst fühlst du dich?',
    options: [
      { value: 1, label: 'sehr gestresst' },
      { value: 2, label: 'gestresst' },
      { value: 3, label: 'mittelmäßig' },
      { value: 4, label: 'entspannt' },
      { value: 5, label: 'sehr entspannt' }
    ]
  }
];

// Timing options
export const CHECKIN_TIMING = {
  MORNING_ONLY: 'morning',
  EVENING_ONLY: 'evening',
  BOTH: 'both'
};

// Default settings
const DEFAULT_SETTINGS = {
  timing: CHECKIN_TIMING.BOTH,
  morningHour: 9,  // Before 9am = morning
  eveningHour: 18  // After 6pm = evening
};

/**
 * Get today's date as string (YYYY-MM-DD)
 */
const getTodayKey = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Merge local and remote check-in responses
 * Local data takes priority (it's newer if it exists locally but not remotely)
 * BUG-C FIX: Prevents Supabase data from overwriting unsynced local check-ins
 */
const mergeResponses = (local, remote) => {
  const merged = { ...remote };

  Object.entries(local).forEach(([date, periods]) => {
    if (!merged[date]) {
      // Date doesn't exist in remote, use local entirely
      merged[date] = periods;
    } else {
      // Merge morning/evening separately - local takes priority
      if (periods.morning) {
        merged[date] = { ...merged[date], morning: periods.morning };
      }
      if (periods.evening) {
        merged[date] = { ...merged[date], evening: periods.evening };
      }
    }
  });

  return merged;
};

/**
 * Determine if current time is morning or evening
 * Morning: before eveningHour (default 18:00)
 * Evening: from eveningHour onwards
 */
const getCurrentPeriod = (settings) => {
  const hour = new Date().getHours();
  if (hour >= settings.eveningHour) {
    return 'evening';
  }
  // Before evening = morning period (all day until evening)
  return 'morning';
};

/**
 * CheckInProvider
 *
 * Now uses Supabase for persistence when authenticated,
 * with LocalStorage fallback for offline/unauthenticated use.
 */
export const CheckInProvider = ({ children }) => {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  // BUG-003 FIX: Get mentor activation status to control check-in visibility
  const { isActivated: isMentorActivated } = useMentor();
  const syncedRef = useRef(false);
  const userIdRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Reset syncedRef when user changes (logout/login)
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      userIdRef.current = user?.id || null;
    }
  }, [user?.id]);

  // Check-in responses history: { [date]: { morning?: {...}, evening?: {...} } }
  const [responses, setResponses] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RESPONSES);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Settings: timing preference
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // TICKET-3: Get checkInCount from app settings (1 or 2)
  const getCheckInCount = useCallback(() => {
    try {
      const appSettings = localStorage.getItem(STORAGE_KEY_APP_SETTINGS);
      if (appSettings) {
        const parsed = JSON.parse(appSettings);
        return parsed.checkin?.checkInCount || 2;
      }
    } catch {
      // Ignore errors
    }
    return 2; // Default: 2 check-ins per day
  }, []);

  const checkInCount = getCheckInCount();

  // Fetch responses from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseEnabled || !isAuthenticated || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('checkin_responses')
        .select('*')
        .order('response_date', { ascending: false });

      if (error) throw error;

      // Convert array to object format { [date]: { period: { answers, timestamp } } }
      const responsesObj = {};
      data?.forEach(row => {
        const date = row.response_date;
        if (!responsesObj[date]) {
          responsesObj[date] = {};
        }
        // Determine period based on stored data or default to morning
        const period = row.period || 'morning';
        responsesObj[date][period] = {
          answers: {
            positivity: row.mood,
            energy: row.energy,
            motivation: row.focus,
            stress: row.stress || 3, // Default if not stored
          },
          timestamp: row.created_at,
          notes: row.notes,
        };
      });

      return responsesObj;
    } catch (err) {
      console.error('Error fetching check-in responses:', err);
      return null;
    }
  }, [isSupabaseEnabled, isAuthenticated]);

  // Sync LocalStorage to Supabase on first login
  const syncToSupabase = useCallback(async (localResponses) => {
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return;
    }

    try {
      // Check if user already has data
      const { data: existingData } = await supabase
        .from('checkin_responses')
        .select('id')
        .limit(1);

      if (existingData && existingData.length > 0) {
        return; // User has data, don't overwrite
      }

      // Migrate local data
      const toInsert = [];
      Object.entries(localResponses).forEach(([date, periods]) => {
        Object.entries(periods).forEach(([period, data]) => {
          if (data.answers && !data.skipped) {
            toInsert.push({
              user_id: user.id,
              response_date: date,
              period,
              mood: data.answers.positivity,
              energy: data.answers.energy,
              focus: data.answers.motivation,
              stress: data.answers.stress,
              notes: data.notes || null,
            });
          }
        });
      });

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('checkin_responses')
          .insert(toInsert);

        if (error) {
          console.error('Error syncing check-in responses:', error);
        }
      }
    } catch (err) {
      console.error('Error in syncToSupabase:', err);
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  // Initial load and sync
  // BUG-C FIX: Merge local and remote data instead of overwriting
  useEffect(() => {
    const initData = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || syncedRef.current) {
        return;
      }

      setLoading(true);
      try {
        // BUG-C FIX: Keep reference to local data BEFORE any async operations
        const localData = { ...responses };

        // Try to sync local data to Supabase first
        await syncToSupabase(localData);

        const supabaseData = await fetchFromSupabase();
        if (supabaseData !== null) {
          // BUG-C FIX: Merge instead of overwrite - local data takes priority
          // This ensures unsynced local check-ins are not lost
          const mergedData = mergeResponses(localData, supabaseData);
          setResponses(mergedData);
          localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(mergedData));
          syncedRef.current = true;
        }
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [isSupabaseEnabled, isAuthenticated, fetchFromSupabase, syncToSupabase]);

  // Persist responses to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(responses));
  }, [responses]);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Save check-in to Supabase
  const saveToSupabase = useCallback(async (date, period, data) => {
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return;
    }

    try {
      if (data.skipped) {
        // Don't save skipped entries to Supabase
        return;
      }

      const { error } = await supabase
        .from('checkin_responses')
        .upsert({
          user_id: user.id,
          response_date: date,
          period,
          mood: data.answers?.positivity,
          energy: data.answers?.energy,
          focus: data.answers?.motivation,
          stress: data.answers?.stress,
          notes: data.notes || null,
        }, { onConflict: 'user_id,response_date,period' });

      if (error) {
        console.error('Error saving check-in:', error);
      }
    } catch (err) {
      console.error('Error saving check-in to Supabase:', err);
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  /**
   * Submit check-in responses
   * Now syncs to Supabase when authenticated
   * BUG-A FIX: Returns Promise to allow awaiting before navigation
   */
  const submitCheckIn = useCallback(async (answers, period = null) => {
    const today = getTodayKey();
    const currentPeriod = period || getCurrentPeriod(settings) || 'morning';

    const checkInData = {
      answers,
      timestamp: new Date().toISOString()
    };

    // BUG-A FIX: Use Promise to ensure state is updated before returning
    return new Promise((resolve) => {
      setResponses(prev => {
        const newState = {
          ...prev,
          [today]: {
            ...prev[today],
            [currentPeriod]: checkInData
          }
        };
        // BUG-A FIX: Immediately persist to localStorage to prevent data loss on navigation
        localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(newState));
        return newState;
      });

      // Sync to Supabase (fire and forget, but wait a tick for state to propagate)
      saveToSupabase(today, currentPeriod, checkInData);

      // BUG-A FIX: Small delay to ensure React state update propagates
      setTimeout(resolve, 50);
    });
  }, [settings, saveToSupabase]);

  /**
   * Skip today's check-in (mark as skipped)
   */
  const skipCheckIn = useCallback((period = null) => {
    const today = getTodayKey();
    const currentPeriod = period || getCurrentPeriod(settings) || 'morning';

    setResponses(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        [currentPeriod]: {
          skipped: true,
          timestamp: new Date().toISOString()
        }
      }
    }));
    // Skipped entries are not synced to Supabase
  }, [settings]);

  /**
   * Check if check-in is needed now
   * BUG-003 FIX: Only show check-in if mentor is activated
   * TICKET-3: Respect checkInCount setting (1 or 2 check-ins per day)
   */
  const isCheckInNeeded = useMemo(() => {
    // BUG-003 FIX: Check-in requires mentor to be activated
    if (!isMentorActivated) return false;

    const today = getTodayKey();
    const todayResponses = responses[today] || {};
    const currentPeriod = getCurrentPeriod(settings);

    // If not in a check-in period (midday), no check-in needed
    if (!currentPeriod) return false;

    // TICKET-3: If only 1 check-in is configured, skip evening check-in
    if (checkInCount === 1 && currentPeriod === 'evening') {
      return false;
    }

    // Check timing settings
    if (settings.timing === CHECKIN_TIMING.MORNING_ONLY && currentPeriod !== 'morning') {
      return false;
    }
    if (settings.timing === CHECKIN_TIMING.EVENING_ONLY && currentPeriod !== 'evening') {
      return false;
    }

    // Check if already completed or skipped for this period
    const periodResponse = todayResponses[currentPeriod];
    if (periodResponse) {
      return false; // Already done (completed or skipped)
    }

    return true;
  }, [responses, settings, isMentorActivated, checkInCount]);

  /**
   * Check if morning check-in was skipped (for Check-in button state)
   */
  const wasMorningSkipped = useMemo(() => {
    const today = getTodayKey();
    const todayResponses = responses[today] || {};
    return todayResponses.morning?.skipped === true;
  }, [responses]);

  /**
   * Check if check-in button should be enabled
   * Button is enabled if:
   * 1. Mentor is activated, AND
   * 2. Check-in is needed (not done yet for current period), OR morning was skipped
   * BUG-003 FIX: Also check mentor activation status
   */
  const isCheckInButtonEnabled = useMemo(() => {
    // BUG-003 FIX: Button disabled if mentor is not activated
    if (!isMentorActivated) return false;
    // Button is enabled if check-in is still needed
    return isCheckInNeeded || wasMorningSkipped;
  }, [isCheckInNeeded, wasMorningSkipped, isMentorActivated]);

  /**
   * Get today's check-in data
   */
  const todayCheckIn = useMemo(() => {
    const today = getTodayKey();
    return responses[today] || {};
  }, [responses]);

  /**
   * Calculate Well Score from recent check-ins
   * Returns a score from 0-100 based on last 7 days of responses
   */
  const wellScore = useMemo(() => {
    const days = 7;
    const today = new Date();
    let totalScore = 0;
    let responseCount = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayResponses = responses[dateKey];

      if (dayResponses) {
        // Check morning responses
        if (dayResponses.morning?.answers) {
          const answers = dayResponses.morning.answers;
          const dayScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
          const maxScore = CHECKIN_QUESTIONS.length * 5;
          totalScore += (dayScore / maxScore) * 100;
          responseCount++;
        }

        // Check evening responses
        if (dayResponses.evening?.answers) {
          const answers = dayResponses.evening.answers;
          const dayScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
          const maxScore = CHECKIN_QUESTIONS.length * 5;
          totalScore += (dayScore / maxScore) * 100;
          responseCount++;
        }
      }
    }

    if (responseCount === 0) {
      return null; // No data available
    }

    return Math.round(totalScore / responseCount);
  }, [responses]);

  /**
   * Calculate Well Score trend (compared to previous week)
   */
  const wellScoreTrend = useMemo(() => {
    const calculateWeekScore = (startDaysAgo) => {
      const today = new Date();
      let totalScore = 0;
      let responseCount = 0;

      for (let i = startDaysAgo; i < startDaysAgo + 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const dayResponses = responses[dateKey];

        if (dayResponses) {
          ['morning', 'evening'].forEach(period => {
            if (dayResponses[period]?.answers) {
              const answers = dayResponses[period].answers;
              const dayScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
              const maxScore = CHECKIN_QUESTIONS.length * 5;
              totalScore += (dayScore / maxScore) * 100;
              responseCount++;
            }
          });
        }
      }

      return responseCount > 0 ? totalScore / responseCount : null;
    };

    const thisWeek = calculateWeekScore(0);
    const lastWeek = calculateWeekScore(7);

    if (thisWeek === null || lastWeek === null) {
      return 0;
    }

    return Math.round(thisWeek - lastWeek);
  }, [responses]);

  /**
   * Update check-in settings
   */
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Memoize getCurrentPeriod callback to avoid recreating it on every render
  const getCurrentPeriodCallback = useCallback(() => getCurrentPeriod(settings), [settings]);

  // PERF FIX: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // Data
    responses,
    settings,
    todayCheckIn,
    wellScore,
    wellScoreTrend,

    // State checks
    isCheckInNeeded,
    wasMorningSkipped,
    isCheckInButtonEnabled,
    isMentorActivated, // BUG-003 FIX: Expose mentor status
    checkInCount, // TICKET-3: Number of check-ins per day (1 or 2)
    loading,
    isAuthenticated,

    // Actions
    submitCheckIn,
    skipCheckIn,
    updateSettings,

    // Constants
    questions: CHECKIN_QUESTIONS,
    getCurrentPeriod: getCurrentPeriodCallback,
  }), [
    responses, settings, todayCheckIn, wellScore, wellScoreTrend,
    isCheckInNeeded, wasMorningSkipped, isCheckInButtonEnabled,
    isMentorActivated, checkInCount, loading, isAuthenticated,
    submitCheckIn, skipCheckIn, updateSettings, getCurrentPeriodCallback,
  ]);

  return (
    <CheckInContext.Provider value={value}>
      {children}
    </CheckInContext.Provider>
  );
};

export const useCheckIn = () => {
  const context = useContext(CheckInContext);
  if (!context) {
    throw new Error('useCheckIn must be used within a CheckInProvider');
  }
  return context;
};

export default CheckInContext;
