/**
 * Repository Types
 * Generic interfaces for data access layer
 */

import type {
  BlockAllocation,
  CreateBlockAllocationDTO,
  UpdateBlockAllocationDTO,
  Session,
  CreateSessionDTO,
  UpdateSessionDTO,
  Task,
  CreateTaskDTO,
  UpdateTaskDTO,
} from '../types/calendar';

// =============================================================================
// GENERIC REPOSITORY INTERFACE
// =============================================================================

export interface Repository<T, CreateDTO, UpdateDTO> {
  getAll(userId: string): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: CreateDTO, userId: string): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
}

// =============================================================================
// SPECIFIC REPOSITORY INTERFACES
// =============================================================================

export interface BlockRepository
  extends Repository<BlockAllocation, CreateBlockAllocationDTO, UpdateBlockAllocationDTO> {
  getByDate(userId: string, date: string): Promise<BlockAllocation[]>;
  getByDateRange(userId: string, startDate: string, endDate: string): Promise<BlockAllocation[]>;
}

export interface SessionRepository
  extends Repository<Session, CreateSessionDTO, UpdateSessionDTO> {
  getByDate(userId: string, date: string): Promise<Session[]>;
  getByDateRange(userId: string, startDate: string, endDate: string): Promise<Session[]>;
  getBySeries(seriesId: string): Promise<Session[]>;
}

export interface TaskRepository extends Repository<Task, CreateTaskDTO, UpdateTaskDTO> {
  getByStatus(userId: string, status: Task['status']): Promise<Task[]>;
  getByBlock(blockId: string): Promise<Task[]>;
  getBySession(sessionId: string): Promise<Task[]>;
}

// =============================================================================
// REPOSITORY RESULT TYPES
// =============================================================================

export interface RepositoryResult<T> {
  data: T | null;
  error: RepositoryError | null;
}

export interface RepositoryListResult<T> {
  data: T[];
  error: RepositoryError | null;
}

export interface RepositoryError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// REPOSITORY FACTORY
// =============================================================================

export interface RepositoryFactory {
  createBlockRepository(): BlockRepository;
  createSessionRepository(): SessionRepository;
  createTaskRepository(): TaskRepository;
}
