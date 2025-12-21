import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// LocalStorage keys
const STORAGE_KEY = 'prepwell_timer_state';
const HISTORY_STORAGE_KEY = 'prepwell_timer_history';

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
 * Load timer state from localStorage
 */
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Check if timer was running and calculate elapsed time
      if (data.state === TIMER_STATES.RUNNING && data.lastUpdated) {
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
 * Save timer session to history
 */
const saveSessionToHistory = (session) => {
  try {
    const history = loadHistoryFromStorage();
    history.push({
      ...session,
      id: `session-${Date.now()}`,
      savedAt: new Date().toISOString()
    });
    // Keep last 1000 sessions max
    const trimmedHistory = history.slice(-1000);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error saving timer session to history:', error);
  }
};

/**
 * Play notification sound
 */
const playNotificationSound = () => {
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
  const secs = seconds % 60;

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
 */
export const TimerProvider = ({ children }) => {
  // Load initial state from localStorage
  const savedState = loadFromStorage();

  const [timerType, setTimerType] = useState(savedState?.timerType || null);
  const [timerState, setTimerState] = useState(savedState?.state || TIMER_STATES.IDLE);
  const [remainingSeconds, setRemainingSeconds] = useState(savedState?.remainingSeconds || 0);
  const [elapsedSeconds, setElapsedSeconds] = useState(savedState?.elapsedSeconds || 0);
  const [startTime, setStartTime] = useState(savedState?.startTime ? new Date(savedState.startTime) : null);
  const [endTime, setEndTime] = useState(savedState?.endTime ? new Date(savedState.endTime) : null);

  // Pomodoro specific state
  const [pomodoroSettings, setPomodoroSettings] = useState(
    savedState?.pomodoroSettings || DEFAULT_POMODORO_SETTINGS
  );
  const [currentSession, setCurrentSession] = useState(savedState?.currentSession || 1);
  const [totalSessions, setTotalSessions] = useState(savedState?.totalSessions || 4);
  const [isBreak, setIsBreak] = useState(savedState?.isBreak || false);

  // Countdown specific state
  const [countdownSettings, setCountdownSettings] = useState(
    savedState?.countdownSettings || DEFAULT_COUNTDOWN_SETTINGS
  );

  // Interval ref
  const intervalRef = useRef(null);

  // Visual notification state
  const [showNotification, setShowNotification] = useState(false);

  // Timer history
  const [timerHistory, setTimerHistory] = useState(loadHistoryFromStorage);

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
      });
    }
  }, [timerType, timerState, remainingSeconds, elapsedSeconds, startTime, endTime,
      pomodoroSettings, countdownSettings, currentSession, totalSessions, isBreak]);

  // Timer tick effect
  useEffect(() => {
    if (timerState === TIMER_STATES.RUNNING) {
      intervalRef.current = setInterval(() => {
        if (timerType === TIMER_TYPES.COUNTUP) {
          setElapsedSeconds(prev => prev + 1);
        } else {
          setRemainingSeconds(prev => {
            if (prev <= 1) {
              // Timer finished
              handleTimerComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
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
  }, [timerState, timerType]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    // Play sound
    playNotificationSound();

    // Show visual notification
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);

    // Save completed session to history
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
      saveSessionToHistory(session);
      setTimerHistory(loadHistoryFromStorage());
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
      saveSessionToHistory(session);
      setTimerHistory(loadHistoryFromStorage());
    }

    if (timerType === TIMER_TYPES.POMODORO) {
      if (isBreak) {
        // Break finished, start next session or complete
        setIsBreak(false);
        if (currentSession < totalSessions) {
          setCurrentSession(prev => prev + 1);
          setRemainingSeconds(pomodoroSettings.sessionDuration * 60);
          setEndTime(new Date(Date.now() + pomodoroSettings.sessionDuration * 60 * 1000));
          if (!pomodoroSettings.autoStartBreak) {
            setTimerState(TIMER_STATES.PAUSED);
          }
        } else {
          // All sessions complete
          setTimerState(TIMER_STATES.IDLE);
        }
      } else {
        // Session finished, start break
        setIsBreak(true);
        const isLongBreak = currentSession % pomodoroSettings.sessionsBeforeLongBreak === 0;
        const breakDuration = isLongBreak
          ? pomodoroSettings.longBreakDuration
          : pomodoroSettings.breakDuration;
        setRemainingSeconds(breakDuration * 60);
        setEndTime(new Date(Date.now() + breakDuration * 60 * 1000));
        setTimerState(TIMER_STATES.BREAK);
        if (!pomodoroSettings.autoStartBreak) {
          setTimerState(TIMER_STATES.PAUSED);
        }
      }
    } else {
      // Countdown finished
      setTimerState(TIMER_STATES.IDLE);
    }
  }, [timerType, isBreak, currentSession, totalSessions, pomodoroSettings]);

  // Start Pomodoro timer
  const startPomodoro = useCallback((settings = pomodoroSettings, sessions = 4) => {
    const mergedSettings = { ...DEFAULT_POMODORO_SETTINGS, ...settings };
    setPomodoroSettings(mergedSettings);
    setTotalSessions(sessions);
    setCurrentSession(1);
    setIsBreak(false);
    setTimerType(TIMER_TYPES.POMODORO);
    setRemainingSeconds(mergedSettings.sessionDuration * 60);
    setElapsedSeconds(0);
    setStartTime(new Date());
    setEndTime(new Date(Date.now() + mergedSettings.sessionDuration * 60 * 1000));
    setTimerState(TIMER_STATES.RUNNING);
  }, [pomodoroSettings]);

  // Start Countdown timer
  const startCountdown = useCallback((durationMinutes) => {
    setCountdownSettings({ duration: durationMinutes });
    setTimerType(TIMER_TYPES.COUNTDOWN);
    setRemainingSeconds(durationMinutes * 60);
    setElapsedSeconds(0);
    setStartTime(new Date());
    setEndTime(new Date(Date.now() + durationMinutes * 60 * 1000));
    setTimerState(TIMER_STATES.RUNNING);
  }, []);

  // Start Count-up timer
  const startCountup = useCallback(() => {
    setTimerType(TIMER_TYPES.COUNTUP);
    setRemainingSeconds(0);
    setElapsedSeconds(0);
    setStartTime(new Date());
    setEndTime(null);
    setTimerState(TIMER_STATES.RUNNING);
  }, []);

  // Pause timer
  const pauseTimer = useCallback(() => {
    setTimerState(TIMER_STATES.PAUSED);
  }, []);

  // Resume timer
  const resumeTimer = useCallback(() => {
    // Recalculate end time
    if (timerType !== TIMER_TYPES.COUNTUP) {
      setEndTime(new Date(Date.now() + remainingSeconds * 1000));
    }
    setTimerState(timerState === TIMER_STATES.BREAK ? TIMER_STATES.BREAK : TIMER_STATES.RUNNING);
  }, [timerType, remainingSeconds, timerState]);

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
        saveSessionToHistory(session);
        setTimerHistory(loadHistoryFromStorage());
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
    localStorage.removeItem(STORAGE_KEY);
  }, [timerType, timerState, elapsedSeconds, remainingSeconds, startTime,
      pomodoroSettings, countdownSettings]);

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

  const value = {
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
    stopTimer,

    // Display
    getDisplayInfo,

    // Settings
    setPomodoroSettings,
    setCountdownSettings,

    // History
    timerHistory,
    getTimerStats: () => {
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
    }
  };

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
