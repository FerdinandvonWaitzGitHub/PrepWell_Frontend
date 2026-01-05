/**
 * Central Type Exports
 */

// Calendar Types
export type {
  BlockKind,
  SessionKind,
  BlockSource,
  BlockSize,
  BlockAllocation,
  CreateBlockAllocationDTO,
  UpdateBlockAllocationDTO,
  Session,
  RepeatConfig,
  CreateSessionDTO,
  UpdateSessionDTO,
  BlockToSessionLink,
  TaskStatus,
  TaskPriority,
  Task,
  CreateTaskDTO,
  UpdateTaskDTO,
  ContentPlan,
  CalendarView,
  DayData,
  // Legacy
  Block,
  LearningSession,
  BlockType,
  SessionType,
} from './calendar';

// User Types
export type {
  User,
  UserSettings,
  UpdateUserSettingsDTO,
} from './user';

// Studiengang Types
export type {
  StudiengangCategory,
  Studiengang,
  HierarchyLabels,
  Subject,
  Topic,
  RechtsgebietId,
  Rechtsgebiet,
} from './studiengang';

export {
  JURA_HIERARCHY,
  DEFAULT_HIERARCHY,
  RECHTSGEBIETE,
} from './studiengang';

// Timer Types
export type {
  TimerMode,
  TimerStatus,
  TimerState,
  TimerSettings,
  TimerSession,
  CreateTimerSessionDTO,
  UpdateTimerSessionDTO,
  LogbuchEntry,
  CreateLogbuchEntryDTO,
} from './timer';

// API Types
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  QueryParams,
  SupabaseConfig,
  SupabaseUser,
  SupabaseSession,
  AuthState,
  SyncStatus,
  SyncState,
  SyncQueueItem,
  CheckInType,
  CheckInResponse,
  CheckInAnswers,
  CreateCheckInDTO,
  ExamType,
  ExamStatus,
  Exam,
  CreateExamDTO,
  UpdateExamDTO,
  Uebungsklausur,
  CreateUebungsklausurDTO,
  UpdateUebungsklausurDTO,
} from './api';
