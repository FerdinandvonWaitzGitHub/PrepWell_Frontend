import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTimerHistorySync, useUserSettingsSync } from '../hooks/use-supabase-sync';
import { supabase } from '../services/supabase';
import { useAuth } from './auth-context';

// LocalStorage keys
const STORAGE_KEY = 'prepwell_timer_state';
const HISTORY_STORAGE_KEY = 'prepwell_timer_history';
const CONFIG_STORAGE_KEY = 'prepwell_timer_config';
const USER_SETTINGS_KEY = 'prepwell_settings'; // BUG-015 FIX: Sync with settings page

/**
 * BUG-015 FIX: Load user settings (from settings page) to get pomodoro/break durations
 */
const loadUserSettingsFromStorage = () => {
  try {
    const stored = localStorage.getItem(USER_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user settings from localStorage:', error);
  }
  return null;
};

/**
 * Load timer configuration from localStorage
 * BUG-015 FIX: Merge with user settings from settings page
 */
const loadConfigFromStorage = () => {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    const config = stored ? JSON.parse(stored) : null;

    // BUG-015 FIX: Also load user settings and merge pomodoro settings
    const userSettings = loadUserSettingsFromStorage();
    if (userSettings?.learning) {
      const learning = userSettings.learning;
      // Create merged pomodoro settings using user settings as primary source
      const mergedPomodoroSettings = {
        sessionDuration: learning.pomodoroDuration || config?.pomodoroSettings?.sessionDuration || 25,
        breakDuration: learning.breakDuration || config?.pomodoroSettings?.breakDuration || 5,
        longBreakDuration: config?.pomodoroSettings?.longBreakDuration || 15,
        sessionsBeforeLongBreak: config?.pomodoroSettings?.sessionsBeforeLongBreak || 4,
        autoStartBreak: config?.pomodoroSettings?.autoStartBreak ?? true,
      };

      return {
        ...config,
        pomodoroSettings: mergedPomodoroSettings,
      };
    }

    return config;
  } catch (error) {
    console.error('Error loading timer config from localStorage:', error);
  }
  return null;
};

/**
 * Save timer configuration to localStorage
 */
const saveConfigToStorage = (config) => {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving timer config to localStorage:', error);
  }
};

// Timer types
export const TIMER_TYPES = {
  POMODORO: 'pomodoro',
  COUNTDOWN: 'countdown',
  COUNTUP: 'countup',
};

// Timer states
export const TIMER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  BREAK: 'break', // For Pomodoro
};

// Default settings
const DEFAULT_POMODORO_SETTINGS = {
  sessionDuration: 25, // minutes
  breakDuration: 5, // minutes
  longBreakDuration: 15, // minutes
  sessionsBeforeLongBreak: 4,
  autoStartBreak: true, // Option from 5c
};

const DEFAULT_COUNTDOWN_SETTINGS = {
  duration: 60, // minutes
};

// Create context
const TimerContext = createContext(null);

/**
 * Check if two dates are on the same day
 */
const isSameDay = (date1, date2) => {
  return date1.toDateString() === date2.toDateString();
};

/**
 * Save a session from a previous day to history (called when day changes)
 * Returns the session data for Supabase sync
 */
const savePreviousDaySession = (data) => {
  if (!data || !data.startTime) return null;

  const startDate = new Date(data.startTime);
  const endOfDay = new Date(startDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Calculate duration until end of that day
  let actualDuration = 0;
  if (data.timerType === TIMER_TYPES.COUNTUP) {
    // For countup: use elapsed seconds, but cap at end of day
    const maxSecondsInDay = Math.floor((endOfDay - startDate) / 1000);
    actualDuration = Math.min(data.elapsedSeconds || 0, maxSecondsInDay);
  } else {
    // For countdown/pomodoro: calculate from start to end of day
    const plannedDuration = data.timerType === TIMER_TYPES.POMODORO
      ? (data.pomodoroSettings?.sessionDuration || 25) * 60
      : (data.countdownSettings?.duration || 60) * 60;
    const elapsedBeforeClose = plannedDuration - (data.remainingSeconds || 0);
    actualDuration = Math.max(0, elapsedBeforeClose);
  }

  // Only save if at least 1 minute was tracked
  if (actualDuration < 60) return null;

  const session = {
    type: data.timerType,
    date: startDate.toISOString().split('T')[0],
    startTime: data.startTime,
    endTime: endOfDay.toISOString(),
    duration: actualDuration,
    completed: false,
    autoSaved: true, // Mark as auto-saved due to day change
  };

  // Save to localStorage history
  try {
    const history = loadHistoryFromStorage();
    history.push({
      ...session,
      id: `session-${Date.now()}`,
      savedAt: new Date().toISOString()
    });
    const trimmedHistory = history.slice(-1000);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error saving previous day session:', error);
  }

  return session;
};

/**
 * Load timer state from localStorage
 * BUG-P1 FIX: Check for day change and reset timer if needed
 */
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);

      // Check if timer was running
      if (data.state === TIMER_STATES.RUNNING && data.lastUpdated && data.startTime) {
        const startDate = new Date(data.startTime);
        const now = new Date();

        // BUG-P1 FIX: If started on a different day, save old session and reset
        if (!isSameDay(startDate, now)) {
          console.log('[Timer] Day changed - saving previous session and resetting');
          savePreviousDaySession(data);
          // Clear the stored state so timer resets
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }

        // Same day - calculate elapsed time normally
        const elapsed = Math.floor((Date.now() - data.lastUpdated) / 1000);
        data.remainingSeconds = Math.max(0, (data.remainingSeconds || 0) - elapsed);
        data.elapsedSeconds = (data.elapsedSeconds || 0) + elapsed;
      }
      return data;
    }
  } catch (error) {
    console.error('Error loading timer from localStorage:', error);
  }
  return null;
};

/**
 * Save timer state to localStorage
 */
const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      lastUpdated: Date.now(),
    }));
  } catch (error) {
    console.error('Error saving timer to localStorage:', error);
  }
};

/**
 * Load timer history from localStorage
 */
const loadHistoryFromStorage = () => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading timer history:', error);
  }
  return [];
};

/**
 * Track user interaction for AudioContext permission
 * Browser requires user gesture before allowing audio playback
 */
let userHasInteracted = false;
if (typeof window !== 'undefined') {
  const markInteracted = () => { userHasInteracted = true; };
  window.addEventListener('click', markInteracted, { once: true });
  window.addEventListener('keydown', markInteracted, { once: true });
  window.addEventListener('touchstart', markInteracted, { once: true });
}

/**
 * Play notification sound
 * Only plays if user has interacted with the page (browser requirement)
 */
const playNotificationSound = () => {
  // Skip if user hasn't interacted yet (prevents browser warning)
  if (!userHasInteracted) {
    console.log('[Timer] Skipping notification sound - no user interaction yet');
    return;
  }

  try {
    // Create a gentle bell/gong sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create oscillator for bell tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Bell-like frequency
    oscillator.frequency.setValueAtTime(830, audioContext.currentTime);
    oscillator.type = 'sine';

    // Gentle attack and decay
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.5);

    // Play a second tone for richer sound
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.setValueAtTime(622, audioContext.currentTime);
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0, audioContext.currentTime);
      gain2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 1.2);
    }, 150);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

/**
 * Format seconds to display string
 */
export const formatTime = (seconds, includeHours = false) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (includeHours || hrs > 0) {
    return `${hrs}h ${mins}min`;
  }
  return `${mins}min`;
};

/**
 * Format time for display with remaining indicator
 */
export const formatTimeRemaining = (seconds) => {
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}min verbleibend`;
  }
  return `${mins}min verbleibend`;
};

/**
 * Format time for display with elapsed indicator
 */
export const formatTimeElapsed = (seconds) => {
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}min gelernt`;
  }
  return `${mins}min gelernt`;
};

/**
 * Get time range string (start -> end)
 */
const getTimeRange = (startTime, endTime) => {
  const formatTimeStr = (date) => {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };
  return `${formatTimeStr(startTime)} → ${formatTimeStr(endTime)}`;
};

/**
 * TimerProvider component
 *
 * Timer state is kept local (changes every second).
 * Timer history is synced to Supabase when authenticated.
 * Timer config is synced to Supabase via user_settings.
 */
export const TimerProvider = ({ children }) => {
  // Load initial state from localStorage
  const savedState = loadFromStorage();
  const savedConfig = loadConfigFromStorage();

  // Use Supabase sync for timer history
  const {
    data: supabaseHistory,
    saveItem: saveSessionToSupabase,
    isAuthenticated,
  } = useTimerHistorySync();

  // User settings sync hook (config managed via timerConfig state)
  useUserSettingsSync();

  const [timerType, setTimerType] = useState(savedState?.timerType || null);
  const [timerState, setTimerState] = useState(savedState?.state || TIMER_STATES.IDLE);
  const [remainingSeconds, setRemainingSeconds] = useState(savedState?.remainingSeconds || 0);
  const [elapsedSeconds, setElapsedSeconds] = useState(savedState?.elapsedSeconds || 0);
  const [startTime, setStartTime] = useState(savedState?.startTime ? new Date(savedState.startTime) : null);
  const [endTime, setEndTime] = useState(savedState?.endTime ? new Date(savedState.endTime) : null);

  // Timer configuration (persistent across app restarts)
  const [timerConfig, setTimerConfig] = useState(savedConfig);

  // Pomodoro specific state
  const [pomodoroSettings, setPomodoroSettings] = useState(
    savedConfig?.pomodoroSettings || savedState?.pomodoroSettings || DEFAULT_POMODORO_SETTINGS
  );
  const [currentSession, setCurrentSession] = useState(savedState?.currentSession || 1);
  const [totalSessions, setTotalSessions] = useState(savedConfig?.totalSessions || savedState?.totalSessions || 4);
  const [isBreak, setIsBreak] = useState(savedState?.isBreak || false);

  // Countdown specific state
  const [countdownSettings, setCountdownSettings] = useState(
    savedConfig?.countdownSettings || savedState?.countdownSettings || DEFAULT_COUNTDOWN_SETTINGS
  );

  // T16-W3: Time-based calculation state (instead of interval counting)
  // These track the actual timestamps for accurate time calculation even when browser throttles intervals
  const [timerStartedAt, setTimerStartedAt] = useState(savedState?.timerStartedAt || null);
  const [pausedAt, setPausedAt] = useState(savedState?.pausedAt || null);
  const [accumulatedPauseTime, setAccumulatedPauseTime] = useState(savedState?.accumulatedPauseTime || 0);

  // Interval ref
  const intervalRef = useRef(null);

  // Visual notification state
  const [showNotification, setShowNotification] = useState(false);

  // Timer history - use Supabase data if authenticated, otherwise localStorage
  const [localTimerHistory, setLocalTimerHistory] = useState(loadHistoryFromStorage);
  const timerHistory = isAuthenticated && supabaseHistory?.length > 0
    ? supabaseHistory
    : localTimerHistory;

  // Get auth context for Supabase sync
  const { user } = useAuth();

  // T16-W3: Calculate elapsed seconds from timestamps (accurate even after browser throttling)
  const calculateElapsedSeconds = useCallback(() => {
    if (!timerStartedAt) return 0;

    const now = pausedAt || Date.now();
    const totalElapsed = Math.floor((now - timerStartedAt) / 1000);
    const actualElapsed = totalElapsed - Math.floor(accumulatedPauseTime / 1000);

    return Math.max(0, actualElapsed);
  }, [timerStartedAt, pausedAt, accumulatedPauseTime]);

  // T16-W3: Calculate remaining seconds for countdown/pomodoro timers
  const calculateRemainingSeconds = useCallback(() => {
    if (!timerStartedAt) return remainingSeconds;

    let totalDuration;
    if (timerType === TIMER_TYPES.POMODORO) {
      totalDuration = (isBreak ? pomodoroSettings.breakDuration : pomodoroSettings.sessionDuration) * 60;
    } else if (timerType === TIMER_TYPES.COUNTDOWN) {
      totalDuration = countdownSettings.duration * 60;
    } else {
      return 0; // Countup doesn't have remaining
    }

    const elapsed = calculateElapsedSeconds();
    return Math.max(0, totalDuration - elapsed);
  }, [timerStartedAt, timerType, isBreak, pomodoroSettings, countdownSettings, calculateElapsedSeconds, remainingSeconds]);

  // T16-W3: Save active timer to Supabase for persistence across browser restarts
  const saveActiveTimerToSupabase = useCallback(async () => {
    if (!user || !timerStartedAt) return;

    try {
      const activeTimer = {
        user_id: user.id,
        timer_type: timerType,
        timer_state: timerState,
        started_at: new Date(timerStartedAt).toISOString(),
        paused_at: pausedAt ? new Date(pausedAt).toISOString() : null,
        accumulated_pause_ms: accumulatedPauseTime,
        pomodoro_settings: pomodoroSettings,
        countdown_settings: countdownSettings,
        current_session: currentSession,
        total_sessions: totalSessions,
        is_break: isBreak,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('active_timer_sessions')
        .upsert(activeTimer, { onConflict: 'user_id' });

      if (error) {
        console.error('[Timer] Error saving active timer to Supabase:', error);
      }
    } catch (error) {
      console.error('[Timer] Error saving active timer:', error);
    }
  }, [user, timerType, timerState, timerStartedAt, pausedAt, accumulatedPauseTime,
      pomodoroSettings, countdownSettings, currentSession, totalSessions, isBreak]);

  // T16-W3: Load active timer from Supabase on app start
  const loadActiveTimerFromSupabase = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('active_timer_sessions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return null;

      // Restore timer state from Supabase
      setTimerType(data.timer_type);
      setTimerState(data.timer_state);
      setTimerStartedAt(new Date(data.started_at).getTime());
      setPausedAt(data.paused_at ? new Date(data.paused_at).getTime() : null);
      setAccumulatedPauseTime(data.accumulated_pause_ms || 0);
      setPomodoroSettings(data.pomodoro_settings || DEFAULT_POMODORO_SETTINGS);
      setCountdownSettings(data.countdown_settings || DEFAULT_COUNTDOWN_SETTINGS);
      setCurrentSession(data.current_session || 1);
      setTotalSessions(data.total_sessions || 4);
      setIsBreak(data.is_break || false);

      // Recalculate display values
      const startedAt = new Date(data.started_at).getTime();
      const pausedAtTs = data.paused_at ? new Date(data.paused_at).getTime() : null;
      const now = pausedAtTs || Date.now();
      const totalElapsed = Math.floor((now - startedAt) / 1000);
      const actualElapsed = totalElapsed - Math.floor((data.accumulated_pause_ms || 0) / 1000);

      if (data.timer_type === TIMER_TYPES.COUNTUP) {
        setElapsedSeconds(actualElapsed);
      } else {
        let totalDuration;
        if (data.timer_type === TIMER_TYPES.POMODORO) {
          const settings = data.pomodoro_settings || DEFAULT_POMODORO_SETTINGS;
          totalDuration = (data.is_break ? settings.breakDuration : settings.sessionDuration) * 60;
        } else {
          totalDuration = (data.countdown_settings?.duration || 60) * 60;
        }
        setRemainingSeconds(Math.max(0, totalDuration - actualElapsed));
      }

      setStartTime(new Date(data.started_at));
      console.log('[Timer] Restored active timer from Supabase');
      return data;
    } catch (error) {
      console.error('[Timer] Error loading active timer:', error);
      return null;
    }
  }, [user]);

  // T16-W3: Clear active timer from Supabase when stopped
  const clearActiveTimerFromSupabase = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('active_timer_sessions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('[Timer] Error clearing active timer from Supabase:', error);
      }
    } catch (error) {
      console.error('[Timer] Error clearing active timer:', error);
    }
  }, [user]);

  // T16-W3: Load active timer from Supabase on mount (if authenticated)
  useEffect(() => {
    if (user && !timerStartedAt) {
      loadActiveTimerFromSupabase();
    }
  }, [user]); // Only run when user changes, not on every render

  // T16-W3: Save active timer to Supabase when state changes
  useEffect(() => {
    if (user && timerStartedAt && timerState !== TIMER_STATES.IDLE) {
      // Debounce saves to avoid too many requests
      const timeoutId = setTimeout(() => {
        saveActiveTimerToSupabase();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, timerStartedAt, timerState, pausedAt, accumulatedPauseTime, isBreak, currentSession]);

  // Function to save session to both localStorage and Supabase
  const saveSession = useCallback((session) => {
    const sessionWithId = {
      ...session,
      id: `session-${Date.now()}`,
      savedAt: new Date().toISOString()
    };

    // Save to localStorage
    try {
      const history = loadHistoryFromStorage();
      history.push(sessionWithId);
      const trimmedHistory = history.slice(-1000);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmedHistory));
      setLocalTimerHistory(trimmedHistory);
    } catch (error) {
      console.error('Error saving timer session to localStorage:', error);
    }

    // Save to Supabase if authenticated
    if (isAuthenticated) {
      saveSessionToSupabase(sessionWithId);
    }
  }, [isAuthenticated, saveSessionToSupabase]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (timerType) {
      saveToStorage({
        timerType,
        state: timerState,
        remainingSeconds,
        elapsedSeconds,
        startTime: startTime?.toISOString(),
        endTime: endTime?.toISOString(),
        pomodoroSettings,
        countdownSettings,
        currentSession,
        totalSessions,
        isBreak,
        // T16-W3: Save timestamp-based state for accurate time after browser throttling
        timerStartedAt,
        pausedAt,
        accumulatedPauseTime,
      });
    }
  }, [timerType, timerState, remainingSeconds, elapsedSeconds, startTime, endTime,
      pomodoroSettings, countdownSettings, currentSession, totalSessions, isBreak,
      timerStartedAt, pausedAt, accumulatedPauseTime]);

  // T16-W3: Timer tick effect - uses timestamp-based calculation for accuracy
  // The interval only updates the UI, not the actual time tracking
  useEffect(() => {
    if (timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.BREAK) {
      const updateUI = () => {
        if (timerType === TIMER_TYPES.COUNTUP) {
          // Calculate from timestamps - accurate even after browser throttling
          const calculated = calculateElapsedSeconds();
          setElapsedSeconds(calculated);
        } else {
          // Calculate remaining from timestamps
          const remaining = calculateRemainingSeconds();
          setRemainingSeconds(remaining);

          // Check if timer completed
          if (remaining <= 0) {
            handleTimerComplete();
          }
        }
      };

      // Update immediately and then every second
      updateUI();
      intervalRef.current = setInterval(updateUI, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState, timerType, calculateElapsedSeconds, calculateRemainingSeconds]);

  // T16-W3: Visibility change handler - update UI immediately when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' &&
          (timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.BREAK)) {
        // Immediately recalculate time when tab becomes visible again
        if (timerType === TIMER_TYPES.COUNTUP) {
          setElapsedSeconds(calculateElapsedSeconds());
        } else {
          const remaining = calculateRemainingSeconds();
          setRemainingSeconds(remaining);
          // Check if timer completed while tab was hidden
          if (remaining <= 0) {
            handleTimerComplete();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerState, timerType, calculateElapsedSeconds, calculateRemainingSeconds]);

  // BUG-P1 FIX: Midnight watcher - auto-save session and reset timer at day change
  useEffect(() => {
    if (timerState !== TIMER_STATES.RUNNING || !startTime) return;

    const checkMidnight = () => {
      const now = new Date();
      const start = new Date(startTime);

      if (!isSameDay(start, now)) {
        console.log('[Timer] Midnight passed - saving session and resetting');

        // Save current session to history
        let actualDuration = 0;
        if (timerType === TIMER_TYPES.COUNTUP) {
          actualDuration = elapsedSeconds;
        } else if (timerType === TIMER_TYPES.POMODORO) {
          actualDuration = (pomodoroSettings.sessionDuration * 60) - remainingSeconds;
        } else if (timerType === TIMER_TYPES.COUNTDOWN) {
          actualDuration = (countdownSettings.duration * 60) - remainingSeconds;
        }

        if (actualDuration >= 60) {
          const session = {
            type: timerType,
            date: start.toISOString().split('T')[0],
            startTime: startTime.toISOString(),
            endTime: new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59).toISOString(),
            duration: actualDuration,
            completed: false,
            autoSaved: true,
          };
          saveSession(session);
        }

        // Reset timer for new day
        const now = Date.now();
        setElapsedSeconds(0);
        setStartTime(new Date(now));
        // T16-W3: Reset timestamps for new day
        setTimerStartedAt(now);
        setPausedAt(null);
        setAccumulatedPauseTime(0);
        if (timerType !== TIMER_TYPES.COUNTUP) {
          // Reset countdown/pomodoro to full duration
          if (timerType === TIMER_TYPES.POMODORO) {
            setRemainingSeconds(pomodoroSettings.sessionDuration * 60);
            setEndTime(new Date(now + pomodoroSettings.sessionDuration * 60 * 1000));
          } else {
            setRemainingSeconds(countdownSettings.duration * 60);
            setEndTime(new Date(now + countdownSettings.duration * 60 * 1000));
          }
        }
      }
    };

    // Check immediately and then every minute
    checkMidnight();
    const intervalId = setInterval(checkMidnight, 60000);

    return () => clearInterval(intervalId);
  }, [timerState, timerType, startTime, elapsedSeconds, remainingSeconds,
      pomodoroSettings, countdownSettings, saveSession]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    // Play sound
    playNotificationSound();

    // Show visual notification
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);

    // Save completed session to history (localStorage + Supabase)
    if (timerType === TIMER_TYPES.POMODORO && !isBreak) {
      // Save completed Pomodoro work session
      const session = {
        type: TIMER_TYPES.POMODORO,
        date: new Date().toISOString().split('T')[0],
        startTime: startTime?.toISOString(),
        endTime: new Date().toISOString(),
        duration: pomodoroSettings.sessionDuration * 60,
        sessionNumber: currentSession,
        completed: true
      };
      saveSession(session);
    } else if (timerType === TIMER_TYPES.COUNTDOWN) {
      // Save completed countdown session
      const session = {
        type: TIMER_TYPES.COUNTDOWN,
        date: new Date().toISOString().split('T')[0],
        startTime: startTime?.toISOString(),
        endTime: new Date().toISOString(),
        duration: countdownSettings.duration * 60,
        completed: true
      };
      saveSession(session);
    }

    if (timerType === TIMER_TYPES.POMODORO) {
      const now = Date.now();
      if (isBreak) {
        // Break finished, start next session or complete
        setIsBreak(false);
        if (currentSession < totalSessions) {
          setCurrentSession(prev => prev + 1);
          setRemainingSeconds(pomodoroSettings.sessionDuration * 60);
          setEndTime(new Date(now + pomodoroSettings.sessionDuration * 60 * 1000));
          // T16-W3: Reset timestamps for new phase
          setTimerStartedAt(now);
          setPausedAt(null);
          setAccumulatedPauseTime(0);
          if (!pomodoroSettings.autoStartBreak) {
            setTimerState(TIMER_STATES.PAUSED);
            setPausedAt(now);
          }
        } else {
          // All sessions complete
          setTimerState(TIMER_STATES.IDLE);
          // T16-W3: Reset timestamps
          setTimerStartedAt(null);
          setPausedAt(null);
          setAccumulatedPauseTime(0);
        }
      } else {
        // Session finished, start break
        setIsBreak(true);
        const isLongBreak = currentSession % pomodoroSettings.sessionsBeforeLongBreak === 0;
        const breakDuration = isLongBreak
          ? pomodoroSettings.longBreakDuration
          : pomodoroSettings.breakDuration;
        setRemainingSeconds(breakDuration * 60);
        setEndTime(new Date(now + breakDuration * 60 * 1000));
        // T16-W3: Reset timestamps for break phase
        setTimerStartedAt(now);
        setPausedAt(null);
        setAccumulatedPauseTime(0);
        setTimerState(TIMER_STATES.BREAK);
        if (!pomodoroSettings.autoStartBreak) {
          setTimerState(TIMER_STATES.PAUSED);
          setPausedAt(now);
        }
      }
    } else {
      // Countdown finished
      setTimerState(TIMER_STATES.IDLE);
      // T16-W3: Reset timestamps
      setTimerStartedAt(null);
      setPausedAt(null);
      setAccumulatedPauseTime(0);
    }
  }, [timerType, isBreak, currentSession, totalSessions, pomodoroSettings, saveSession, startTime, countdownSettings.duration]);

  // Start Pomodoro timer
  // BUG-015 FIX: Always read latest user settings before starting
  const startPomodoro = useCallback((settings = null, sessions = 4) => {
    // Re-read user settings to get latest pomodoro/break durations
    const userSettings = loadUserSettingsFromStorage();
    const userLearningSettings = userSettings?.learning || {};

    // Build settings: passed settings > user settings > current pomodoroSettings > defaults
    const mergedSettings = {
      ...DEFAULT_POMODORO_SETTINGS,
      ...pomodoroSettings,
      sessionDuration: userLearningSettings.pomodoroDuration || pomodoroSettings.sessionDuration || DEFAULT_POMODORO_SETTINGS.sessionDuration,
      breakDuration: userLearningSettings.breakDuration || pomodoroSettings.breakDuration || DEFAULT_POMODORO_SETTINGS.breakDuration,
      ...(settings || {}),
    };

    const now = Date.now();
    setPomodoroSettings(mergedSettings);
    setTotalSessions(sessions);
    setCurrentSession(1);
    setIsBreak(false);
    setTimerType(TIMER_TYPES.POMODORO);
    setRemainingSeconds(mergedSettings.sessionDuration * 60);
    setElapsedSeconds(0);
    setStartTime(new Date(now));
    setEndTime(new Date(now + mergedSettings.sessionDuration * 60 * 1000));
    // T16-W3: Set timestamp state for accurate time tracking
    setTimerStartedAt(now);
    setPausedAt(null);
    setAccumulatedPauseTime(0);
    setTimerState(TIMER_STATES.RUNNING);
  }, [pomodoroSettings]);

  // Start Countdown timer
  const startCountdown = useCallback((durationMinutes) => {
    const now = Date.now();
    setCountdownSettings({ duration: durationMinutes });
    setTimerType(TIMER_TYPES.COUNTDOWN);
    setRemainingSeconds(durationMinutes * 60);
    setElapsedSeconds(0);
    setStartTime(new Date(now));
    setEndTime(new Date(now + durationMinutes * 60 * 1000));
    // T16-W3: Set timestamp state for accurate time tracking
    setTimerStartedAt(now);
    setPausedAt(null);
    setAccumulatedPauseTime(0);
    setTimerState(TIMER_STATES.RUNNING);
  }, []);

  // Start Count-up timer
  const startCountup = useCallback(() => {
    const now = Date.now();
    setTimerType(TIMER_TYPES.COUNTUP);
    setRemainingSeconds(0);
    setElapsedSeconds(0);
    setStartTime(new Date(now));
    setEndTime(null);
    // T16-W3: Set timestamp state for accurate time tracking
    setTimerStartedAt(now);
    setPausedAt(null);
    setAccumulatedPauseTime(0);
    setTimerState(TIMER_STATES.RUNNING);
  }, []);

  // Pause timer
  const pauseTimer = useCallback(() => {
    // T16-W3: Record pause timestamp
    setPausedAt(Date.now());
    setTimerState(TIMER_STATES.PAUSED);
  }, []);

  // Resume timer
  const resumeTimer = useCallback(() => {
    // T16-W3: Calculate pause duration and add to accumulated pause time
    if (pausedAt) {
      const pauseDuration = Date.now() - pausedAt;
      setAccumulatedPauseTime(prev => prev + pauseDuration);
      setPausedAt(null);
    }
    // Recalculate end time based on remaining seconds
    if (timerType !== TIMER_TYPES.COUNTUP) {
      const remaining = calculateRemainingSeconds();
      setEndTime(new Date(Date.now() + remaining * 1000));
    }
    setTimerState(isBreak ? TIMER_STATES.BREAK : TIMER_STATES.RUNNING);
  }, [timerType, pausedAt, isBreak, calculateRemainingSeconds]);

  // Toggle pause/resume
  const togglePause = useCallback(() => {
    if (timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.BREAK) {
      pauseTimer();
    } else if (timerState === TIMER_STATES.PAUSED) {
      resumeTimer();
    }
  }, [timerState, pauseTimer, resumeTimer]);

  // Reset current session (for Pomodoro) or timer
  const resetSession = useCallback(() => {
    if (timerType === TIMER_TYPES.POMODORO) {
      if (isBreak) {
        const isLongBreak = currentSession % pomodoroSettings.sessionsBeforeLongBreak === 0;
        const breakDuration = isLongBreak
          ? pomodoroSettings.longBreakDuration
          : pomodoroSettings.breakDuration;
        setRemainingSeconds(breakDuration * 60);
      } else {
        setRemainingSeconds(pomodoroSettings.sessionDuration * 60);
      }
    } else if (timerType === TIMER_TYPES.COUNTDOWN) {
      setRemainingSeconds(countdownSettings.duration * 60);
    } else {
      setElapsedSeconds(0);
    }
    setStartTime(new Date());
    if (timerType !== TIMER_TYPES.COUNTUP) {
      setEndTime(new Date(Date.now() + remainingSeconds * 1000));
    }
  }, [timerType, isBreak, currentSession, pomodoroSettings, countdownSettings, remainingSeconds]);

  // Reset timer and save current progress as cancelled session
  const resetTimerWithSave = useCallback(() => {
    // Calculate actual duration before reset
    let actualDuration = 0;

    if (timerType === TIMER_TYPES.COUNTUP) {
      actualDuration = elapsedSeconds;
    } else if (timerType === TIMER_TYPES.POMODORO) {
      actualDuration = (pomodoroSettings.sessionDuration * 60) - remainingSeconds;
    } else if (timerType === TIMER_TYPES.COUNTDOWN) {
      actualDuration = (countdownSettings.duration * 60) - remainingSeconds;
    }

    // Save as cancelled session if at least 1 minute was spent
    if (actualDuration >= 60) {
      const session = {
        type: timerType,
        date: new Date().toISOString().split('T')[0],
        startTime: startTime?.toISOString(),
        endTime: new Date().toISOString(),
        duration: actualDuration,
        completed: false,
        cancelled: true // Mark as reset/cancelled
      };
      saveSession(session);
    }

    // Reset the timer (keep it active, just reset time)
    if (timerType === TIMER_TYPES.COUNTUP) {
      setElapsedSeconds(0);
      setStartTime(new Date());
    } else if (timerType === TIMER_TYPES.POMODORO) {
      if (isBreak) {
        const isLongBreak = currentSession % pomodoroSettings.sessionsBeforeLongBreak === 0;
        const breakDuration = isLongBreak
          ? pomodoroSettings.longBreakDuration
          : pomodoroSettings.breakDuration;
        setRemainingSeconds(breakDuration * 60);
        setEndTime(new Date(Date.now() + breakDuration * 60 * 1000));
      } else {
        setRemainingSeconds(pomodoroSettings.sessionDuration * 60);
        setEndTime(new Date(Date.now() + pomodoroSettings.sessionDuration * 60 * 1000));
      }
      setStartTime(new Date());
    } else if (timerType === TIMER_TYPES.COUNTDOWN) {
      setRemainingSeconds(countdownSettings.duration * 60);
      setStartTime(new Date());
      setEndTime(new Date(Date.now() + countdownSettings.duration * 60 * 1000));
    }
  }, [timerType, elapsedSeconds, remainingSeconds, startTime, isBreak, currentSession,
      pomodoroSettings, countdownSettings, saveSession]);

  // Stop timer completely
  const stopTimer = useCallback(() => {
    // Save partial session to history if timer was running
    if (timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.PAUSED) {
      let actualDuration = 0;

      if (timerType === TIMER_TYPES.COUNTUP) {
        actualDuration = elapsedSeconds;
      } else if (timerType === TIMER_TYPES.POMODORO) {
        actualDuration = (pomodoroSettings.sessionDuration * 60) - remainingSeconds;
      } else if (timerType === TIMER_TYPES.COUNTDOWN) {
        actualDuration = (countdownSettings.duration * 60) - remainingSeconds;
      }

      // Only save if at least 1 minute was spent
      if (actualDuration >= 60) {
        const session = {
          type: timerType,
          date: new Date().toISOString().split('T')[0],
          startTime: startTime?.toISOString(),
          endTime: new Date().toISOString(),
          duration: actualDuration,
          completed: false // manually stopped
        };
        saveSession(session);
      }
    }

    setTimerType(null);
    setTimerState(TIMER_STATES.IDLE);
    setRemainingSeconds(0);
    setElapsedSeconds(0);
    setStartTime(null);
    setEndTime(null);
    setCurrentSession(1);
    setIsBreak(false);
    // T16-W3: Reset timestamp state
    setTimerStartedAt(null);
    setPausedAt(null);
    setAccumulatedPauseTime(0);
    localStorage.removeItem(STORAGE_KEY);
    // T16-W3: Clear active timer from Supabase
    clearActiveTimerFromSupabase();
  }, [timerType, timerState, elapsedSeconds, remainingSeconds, startTime,
      pomodoroSettings, countdownSettings, saveSession, clearActiveTimerFromSupabase]);

  // Get display info based on timer type
  const getDisplayInfo = useCallback(() => {
    if (!timerType || timerState === TIMER_STATES.IDLE) {
      return null;
    }

    const now = new Date();
    let primaryText = '';
    let secondaryText = '';
    let progress = 0;

    switch (timerType) {
      case TIMER_TYPES.POMODORO:
        if (isBreak) {
          primaryText = `${Math.ceil(remainingSeconds / 60)}min Pause`;
        } else {
          primaryText = formatTimeRemaining(remainingSeconds);
        }
        secondaryText = endTime ? getTimeRange(now, endTime) : '';
        progress = isBreak
          ? 1 - (remainingSeconds / (pomodoroSettings.breakDuration * 60))
          : 1 - (remainingSeconds / (pomodoroSettings.sessionDuration * 60));
        break;

      case TIMER_TYPES.COUNTDOWN:
        primaryText = formatTimeRemaining(remainingSeconds);
        secondaryText = endTime ? `Tagesziel erreicht → ${endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : '';
        progress = 1 - (remainingSeconds / (countdownSettings.duration * 60));
        break;

      case TIMER_TYPES.COUNTUP:
        primaryText = formatTimeElapsed(elapsedSeconds);
        secondaryText = startTime ? `Tagesziel erreicht → ${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : '';
        progress = Math.min(1, elapsedSeconds / (8 * 60 * 60)); // 8 hours max
        break;
    }

    return {
      primaryText,
      secondaryText,
      progress,
      isBreak,
      isPaused: timerState === TIMER_STATES.PAUSED,
    };
  }, [timerType, timerState, remainingSeconds, elapsedSeconds, startTime, endTime,
      isBreak, pomodoroSettings, countdownSettings]);

  // Save timer configuration (persists across app restarts)
  const saveTimerConfig = useCallback((config) => {
    const newConfig = {
      timerType: config.timerType,
      pomodoroSettings: config.timerType === TIMER_TYPES.POMODORO ? config.settings : pomodoroSettings,
      countdownSettings: config.timerType === TIMER_TYPES.COUNTDOWN ? config.settings : countdownSettings,
      totalSessions: config.totalSessions || totalSessions,
    };
    setTimerConfig(newConfig);
    saveConfigToStorage(newConfig);

    // Update the specific settings
    if (config.timerType === TIMER_TYPES.POMODORO) {
      setPomodoroSettings(config.settings);
    } else if (config.timerType === TIMER_TYPES.COUNTDOWN) {
      setCountdownSettings(config.settings);
    }
    if (config.totalSessions) {
      setTotalSessions(config.totalSessions);
    }
  }, [pomodoroSettings, countdownSettings, totalSessions]);

  // Start timer using saved configuration
  // BUG-015 FIX: Re-read config to get latest user settings
  const startFromConfig = useCallback(() => {
    // Re-read config fresh to get latest merged settings
    const freshConfig = loadConfigFromStorage() || timerConfig;
    if (!freshConfig) return;

    switch (freshConfig.timerType) {
      case TIMER_TYPES.POMODORO:
        // startPomodoro will also re-read user settings, ensuring latest values
        startPomodoro(freshConfig.pomodoroSettings, freshConfig.totalSessions);
        break;
      case TIMER_TYPES.COUNTDOWN:
        startCountdown(freshConfig.countdownSettings?.duration || 60);
        break;
      case TIMER_TYPES.COUNTUP:
        startCountup();
        break;
    }
  }, [timerConfig, startPomodoro, startCountdown, startCountup]);

  // PERF FIX: Memoize getTimerStats to prevent recreation
  const getTimerStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todaySessions = timerHistory.filter(s => s.date === today);
    const weekSessions = timerHistory.filter(s => s.date >= weekAgo);
    const monthSessions = timerHistory.filter(s => s.date >= monthAgo);

    const calcStats = (sessions) => ({
      count: sessions.length,
      totalDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      completedCount: sessions.filter(s => s.completed).length,
      pomodoroCount: sessions.filter(s => s.type === TIMER_TYPES.POMODORO).length,
      countdownCount: sessions.filter(s => s.type === TIMER_TYPES.COUNTDOWN).length,
      countupCount: sessions.filter(s => s.type === TIMER_TYPES.COUNTUP).length
    });

    return {
      today: calcStats(todaySessions),
      week: calcStats(weekSessions),
      month: calcStats(monthSessions),
      all: calcStats(timerHistory)
    };
  }, [timerHistory]);

  // PERF FIX: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    timerType,
    timerState,
    remainingSeconds,
    elapsedSeconds,
    startTime,
    endTime,
    isBreak,
    currentSession,
    totalSessions,
    pomodoroSettings,
    countdownSettings,
    showNotification,

    // Configuration (persistent)
    timerConfig,
    isConfigured: timerConfig !== null,

    // Computed
    isActive: timerState !== TIMER_STATES.IDLE,
    isPaused: timerState === TIMER_STATES.PAUSED,
    isRunning: timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.BREAK,

    // Actions
    startPomodoro,
    startCountdown,
    startCountup,
    pauseTimer,
    resumeTimer,
    togglePause,
    resetSession,
    resetTimerWithSave,
    stopTimer,
    saveTimerConfig,
    startFromConfig,

    // Display
    getDisplayInfo,

    // Settings
    setPomodoroSettings,
    setCountdownSettings,

    // History
    timerHistory,
    getTimerStats,
  }), [
    timerType, timerState, remainingSeconds, elapsedSeconds, startTime, endTime,
    isBreak, currentSession, totalSessions, pomodoroSettings, countdownSettings,
    showNotification, timerConfig, timerHistory,
    startPomodoro, startCountdown, startCountup, pauseTimer, resumeTimer,
    togglePause, resetSession, resetTimerWithSave, stopTimer, saveTimerConfig,
    startFromConfig, getDisplayInfo, setPomodoroSettings, setCountdownSettings,
    getTimerStats,
  ]);

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

/**
 * useTimer hook
 */
export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export default TimerContext;
