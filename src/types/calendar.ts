/**
 * Calendar Types
 * WICHTIG: BlockAllocation und Session sind KOMPLETT GETRENNTE Entitäten!
 * Siehe PRD.md §3.1 für vollständige Spezifikation.
 */

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export type BlockKind = 'theme' | 'repetition' | 'exam' | 'private' | 'freetime';
export type SessionKind = 'theme' | 'repetition' | 'exam' | 'private' | 'freetime';
export type BlockSource = 'wizard' | 'manual';
export type BlockSize = 1 | 2 | 3 | 4;

// =============================================================================
// ENTITY A: BlockAllocation (Monatsansicht)
// =============================================================================

/**
 * BlockAllocation - Kapazitätsplanung auf Tagesebene
 * VERWENDUNG: Monatsansicht
 * VERBOTEN: start_time, end_time, duration (NIEMALS Uhrzeiten!)
 */
export interface BlockAllocation {
  id: string;
  date: string;           // ISO Datum "YYYY-MM-DD"
  kind: BlockKind;
  size: BlockSize;        // Anzahl Blöcke an diesem Tag (1-4)
  content_id?: string;    // Optional: Verknüpfung zu Lerninhalt
  subject_id?: string;    // Fach/Rechtsgebiet ID
  topic_id?: string;      // Thema ID
  source: BlockSource;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBlockAllocationDTO {
  date: string;
  kind: BlockKind;
  size: BlockSize;
  content_id?: string;
  subject_id?: string;
  topic_id?: string;
  source?: BlockSource;
}

export interface UpdateBlockAllocationDTO {
  kind?: BlockKind;
  size?: BlockSize;
  content_id?: string;
  subject_id?: string;
  topic_id?: string;
}

// =============================================================================
// ENTITY B: Session (Wochenansicht/Startseite)
// =============================================================================

/**
 * Session - Zeitraum-basierte Planung
 * VERWENDUNG: Wochenansicht, Startseite
 * VERBOTEN: block_size, block_position (NIEMALS Block-Felder!)
 */
export interface Session {
  id: string;
  start_at: string;       // ISO DateTime "YYYY-MM-DDTHH:mm:ss"
  end_at: string;         // ISO DateTime "YYYY-MM-DDTHH:mm:ss"
  kind: SessionKind;
  title: string;
  description?: string;
  subject_id?: string;
  topic_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Serientermine
  repeat?: RepeatConfig;
  series_id?: string;
}

export interface RepeatConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;       // z.B. alle 2 Wochen
  end_date?: string;      // Wann endet die Serie
  count?: number;         // Alternativ: Anzahl Wiederholungen
  weekdays?: number[];    // 0-6 für Wochentage (nur bei weekly)
}

export interface CreateSessionDTO {
  start_at: string;
  end_at: string;
  kind: SessionKind;
  title: string;
  description?: string;
  subject_id?: string;
  topic_id?: string;
  repeat?: RepeatConfig;
}

export interface UpdateSessionDTO {
  start_at?: string;
  end_at?: string;
  kind?: SessionKind;
  title?: string;
  description?: string;
  subject_id?: string;
  topic_id?: string;
}

// =============================================================================
// ENTITY C: BlockToSessionLink (Optional)
// =============================================================================

export interface BlockToSessionLink {
  id: string;
  block_id: string;
  session_id: string;
  created_at: string;
}

// =============================================================================
// TASKS
// =============================================================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  block_id?: string;      // Optional: Verknüpfung zu Block
  session_id?: string;    // Optional: Verknüpfung zu Session
  subject_id?: string;
  topic_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  block_id?: string;
  session_id?: string;
  subject_id?: string;
  topic_id?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  block_id?: string;
  session_id?: string;
  subject_id?: string;
  topic_id?: string;
}

// =============================================================================
// CONTENT PLANS
// =============================================================================

export interface ContentPlan {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// VIEW HELPERS (für UI)
// =============================================================================

export type CalendarView = 'month' | 'week' | 'day';

export interface DayData {
  date: string;
  blocks: BlockAllocation[];
  sessions: Session[];
  tasks: Task[];
}

// =============================================================================
// LEGACY EXPORTS (für Backwards-Kompatibilität während Migration)
// =============================================================================

/** @deprecated Use BlockAllocation instead */
export type Block = BlockAllocation;

/** @deprecated Use Session instead */
export type LearningSession = Session;

/** @deprecated Use BlockKind instead */
export type BlockType = BlockKind;

/** @deprecated Use SessionKind instead */
export type SessionType = SessionKind;
