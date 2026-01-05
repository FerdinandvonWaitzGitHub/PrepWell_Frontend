/**
 * API Types
 */

// =============================================================================
// GENERIC API TYPES
// =============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// =============================================================================
// SUPABASE TYPES
// =============================================================================

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: SupabaseUser;
}

export interface AuthState {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
  loading: boolean;
  error: ApiError | null;
}

// =============================================================================
// SYNC TYPES
// =============================================================================

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSynced?: string;    // ISO DateTime
  error?: string;
  pendingChanges: number;
}

export interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

// =============================================================================
// CHECK-IN TYPES
// =============================================================================

export type CheckInType = 'morning' | 'evening';

export interface CheckInResponse {
  id: string;
  user_id: string;
  type: CheckInType;
  date: string;           // ISO Date
  responses: CheckInAnswers;
  created_at: string;
}

export interface CheckInAnswers {
  // Morning Check-In
  mood?: number;          // 1-5
  energy?: number;        // 1-5
  goals?: string[];
  blockers?: string;
  // Evening Check-In
  productivity?: number;  // 1-5
  accomplishments?: string[];
  learnings?: string;
  tomorrow_focus?: string;
}

export interface CreateCheckInDTO {
  type: CheckInType;
  date: string;
  responses: CheckInAnswers;
}

// =============================================================================
// EXAMS / LEISTUNGEN
// =============================================================================

export type ExamType = 'klausur' | 'hausarbeit' | 'muendlich' | 'seminar' | 'other';
export type ExamStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Exam {
  id: string;
  user_id: string;
  title: string;
  type: ExamType;
  status: ExamStatus;
  date?: string;          // ISO Date
  grade?: number;         // z.B. 1.3, 2.7, etc.
  points?: number;        // z.B. 12 von 18 Punkten (Jura)
  subject_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExamDTO {
  title: string;
  type: ExamType;
  status?: ExamStatus;
  date?: string;
  subject_id?: string;
  notes?: string;
}

export interface UpdateExamDTO {
  title?: string;
  type?: ExamType;
  status?: ExamStatus;
  date?: string;
  grade?: number;
  points?: number;
  subject_id?: string;
  notes?: string;
}

// =============================================================================
// UEBUNGSKLAUSUREN (Examen-Modus)
// =============================================================================

export interface Uebungsklausur {
  id: string;
  user_id: string;
  title: string;
  subject_id: string;
  date: string;           // ISO Date
  points?: number;        // Erreichte Punkte
  max_points?: number;    // Maximale Punkte
  grade?: string;         // z.B. "befriedigend"
  duration_minutes?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUebungsklausurDTO {
  title: string;
  subject_id: string;
  date: string;
  points?: number;
  max_points?: number;
  duration_minutes?: number;
  notes?: string;
}

export interface UpdateUebungsklausurDTO {
  title?: string;
  subject_id?: string;
  date?: string;
  points?: number;
  max_points?: number;
  grade?: string;
  duration_minutes?: number;
  notes?: string;
}
