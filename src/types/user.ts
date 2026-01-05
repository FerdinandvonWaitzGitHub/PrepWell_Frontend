/**
 * User Types
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  // App Mode
  app_mode: 'examen' | 'normal';
  // Studiengang
  studiengang_id?: string;
  use_kapitel_ebene?: boolean;  // Nur für Jura
  // Timer Settings
  pomodoro_work_duration: number;      // Minuten
  pomodoro_break_duration: number;     // Minuten
  pomodoro_long_break_duration: number;
  pomodoro_sessions_until_long_break: number;
  // Notifications
  notifications_enabled: boolean;
  sound_enabled: boolean;
  // Mentor
  mentor_enabled: boolean;
  // Check-In
  checkin_morning_enabled: boolean;
  checkin_morning_time: string;        // "HH:mm"
  checkin_evening_enabled: boolean;
  checkin_evening_time: string;        // "HH:mm"
  // Theme
  theme: 'light' | 'dark' | 'system';
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface UpdateUserSettingsDTO {
  app_mode?: 'examen' | 'normal';
  studiengang_id?: string;
  use_kapitel_ebene?: boolean;
  pomodoro_work_duration?: number;
  pomodoro_break_duration?: number;
  pomodoro_long_break_duration?: number;
  pomodoro_sessions_until_long_break?: number;
  notifications_enabled?: boolean;
  sound_enabled?: boolean;
  mentor_enabled?: boolean;
  checkin_morning_enabled?: boolean;
  checkin_morning_time?: string;
  checkin_evening_enabled?: boolean;
  checkin_evening_time?: string;
  theme?: 'light' | 'dark' | 'system';
}
