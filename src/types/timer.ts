/**
 * Timer Types
 */

export type TimerMode = 'pomodoro' | 'countdown' | 'countup';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  // Zeit in Sekunden
  elapsed: number;        // Vergangene Zeit
  remaining: number;      // Verbleibende Zeit (nur bei countdown/pomodoro)
  duration: number;       // Gesamtdauer (nur bei countdown/pomodoro)
  // Pomodoro-spezifisch
  pomodoroPhase: 'work' | 'break' | 'longBreak';
  pomodoroCount: number;  // Anzahl abgeschlossener Pomodoros
  // Session-Tracking
  sessionId?: string;
  startedAt?: string;     // ISO DateTime
}

export interface TimerSettings {
  // Pomodoro
  workDuration: number;         // Minuten
  breakDuration: number;        // Minuten
  longBreakDuration: number;    // Minuten
  sessionsUntilLongBreak: number;
  autoStartBreak: boolean;
  autoStartWork: boolean;
  // Countdown
  defaultCountdownDuration: number;  // Minuten
  // Sound
  soundEnabled: boolean;
  soundVolume: number;          // 0-1
  tickingSound: boolean;
  // Notifications
  notificationsEnabled: boolean;
}

// =============================================================================
// TIMER SESSIONS (Supabase)
// =============================================================================

export interface TimerSession {
  id: string;
  user_id: string;
  mode: TimerMode;
  duration: number;       // Sekunden
  started_at: string;     // ISO DateTime
  ended_at?: string;      // ISO DateTime
  completed: boolean;
  // Verknüpfungen
  block_id?: string;
  session_id?: string;
  task_id?: string;
  subject_id?: string;
  topic_id?: string;
  // Pomodoro-spezifisch
  pomodoro_phase?: 'work' | 'break' | 'longBreak';
  pomodoro_count?: number;
  // Timestamps
  created_at: string;
}

export interface CreateTimerSessionDTO {
  mode: TimerMode;
  duration: number;
  started_at: string;
  block_id?: string;
  session_id?: string;
  task_id?: string;
  subject_id?: string;
  topic_id?: string;
  pomodoro_phase?: 'work' | 'break' | 'longBreak';
  pomodoro_count?: number;
}

export interface UpdateTimerSessionDTO {
  ended_at?: string;
  completed?: boolean;
  duration?: number;
}

// =============================================================================
// LOGBUCH (Manuelle Zeiterfassung)
// =============================================================================

export interface LogbuchEntry {
  id: string;
  user_id: string;
  date: string;           // ISO Date
  duration: number;       // Minuten
  subject_id?: string;
  topic_id?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLogbuchEntryDTO {
  date: string;
  duration: number;
  subject_id?: string;
  topic_id?: string;
  description?: string;
}
