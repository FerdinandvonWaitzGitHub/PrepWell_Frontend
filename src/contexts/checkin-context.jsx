import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CheckInContext = createContext(null);

// LocalStorage keys
const STORAGE_KEY_RESPONSES = 'prepwell_checkin_responses';
const STORAGE_KEY_SETTINGS = 'prepwell_checkin_settings';

// Check-in questions
export const CHECKIN_QUESTIONS = [
  {
    id: 'positivity',
    question: 'Wie positiv fühlst du dich?',
    options: [
      { value: 1, label: 'sehr negativ' },
      { value: 2, label: 'eher negativ' },
      { value: 3, label: 'neutral' },
      { value: 4, label: 'eher positiv' },
      { value: 5, label: 'sehr positiv' }
    ]
  },
  {
    id: 'energy',
    question: 'Wie energiegeladen bist du?',
    options: [
      { value: 1, label: 'sehr müde' },
      { value: 2, label: 'eher müde' },
      { value: 3, label: 'neutral' },
      { value: 4, label: 'eher energiegeladen' },
      { value: 5, label: 'sehr energiegeladen' }
    ]
  },
  {
    id: 'motivation',
    question: 'Wie motiviert bist du?',
    options: [
      { value: 1, label: 'sehr unmotiviert' },
      { value: 2, label: 'eher unmotiviert' },
      { value: 3, label: 'neutral' },
      { value: 4, label: 'eher motiviert' },
      { value: 5, label: 'sehr motiviert' }
    ]
  },
  {
    id: 'stress',
    question: 'Wie gestresst fühlst du dich?',
    options: [
      { value: 5, label: 'gar nicht gestresst' },
      { value: 4, label: 'wenig gestresst' },
      { value: 3, label: 'neutral' },
      { value: 2, label: 'eher gestresst' },
      { value: 1, label: 'sehr gestresst' }
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

export const CheckInProvider = ({ children }) => {
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

  // Persist responses
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(responses));
  }, [responses]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  /**
   * Submit check-in responses
   */
  const submitCheckIn = (answers, period = null) => {
    const today = getTodayKey();
    const currentPeriod = period || getCurrentPeriod(settings) || 'morning';

    setResponses(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        [currentPeriod]: {
          answers,
          timestamp: new Date().toISOString()
        }
      }
    }));
  };

  /**
   * Skip today's check-in (mark as skipped)
   */
  const skipCheckIn = (period = null) => {
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
  };

  /**
   * Check if check-in is needed now
   */
  const isCheckInNeeded = useMemo(() => {
    const today = getTodayKey();
    const todayResponses = responses[today] || {};
    const currentPeriod = getCurrentPeriod(settings);

    // If not in a check-in period (midday), no check-in needed
    if (!currentPeriod) return false;

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
  }, [responses, settings]);

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
   * 1. Check-in is needed (not done yet for current period), OR
   * 2. Morning was skipped and we can still do it
   */
  const isCheckInButtonEnabled = useMemo(() => {
    // Button is enabled if check-in is still needed
    return isCheckInNeeded || wasMorningSkipped;
  }, [isCheckInNeeded, wasMorningSkipped]);

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
  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const value = {
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

    // Actions
    submitCheckIn,
    skipCheckIn,
    updateSettings,

    // Constants
    questions: CHECKIN_QUESTIONS,
    getCurrentPeriod: () => getCurrentPeriod(settings)
  };

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
