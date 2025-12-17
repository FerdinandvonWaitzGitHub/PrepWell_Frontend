/**
 * PrepWell Backend Types
 * Shared types for API and Frontend
 */

// ============================================
// LERNPLAN TYPES
// ============================================

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface Theme {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Chapter {
  id: string;
  title: string;
  themes: Theme[];
}

export type LernplanMode = 'standard' | 'examen';
export type Rechtsgebiet = 'zivilrecht' | 'strafrecht' | 'oeffentliches-recht';

export interface Lernplan {
  id: string;
  title: string;
  description: string;
  tags: string[];
  rechtsgebiet: Rechtsgebiet | string;
  mode: LernplanMode;
  examDate?: string;
  archived: boolean;
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// KALENDER / SLOT TYPES
// ============================================

export type SlotStatus = 'empty' | 'topic' | 'free';
export type BlockType = 'theme' | 'repetition' | 'exam' | 'free' | 'private';

export interface Slot {
  id: string;
  date: string;
  position: 1 | 2 | 3;
  status: SlotStatus;
  topicId?: string;
  topicTitle?: string;
  blockType?: BlockType;
  groupId?: string;
  groupSize?: number;
  groupIndex?: number;
  progress?: string;
  description?: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Day {
  date: string;
  slots: Slot[];
}

export interface LearningBlock {
  id: string;
  title: string;
  blockType: BlockType;
  blockSize: number;
  description?: string;
  progress?: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  isMultiDay?: boolean;
}

// ============================================
// AUFGABEN TYPES
// ============================================

export type Priority = 'low' | 'medium' | 'high';
export type AufgabeStatus = 'unerledigt' | 'erledigt';

export interface Aufgabe {
  id: string;
  subject: string;
  title: string;
  description: string;
  lernplanthema?: string;
  lernblock?: string;
  priority: Priority;
  status: AufgabeStatus;
  date: string;
  lernplanId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// LEISTUNGEN / PRÜFUNGEN TYPES
// ============================================

export type LeistungStatus = 'angemeldet' | 'bestanden' | 'nicht bestanden' | 'ausstehend';

export interface Leistung {
  id: string;
  title: string;
  subject: string;
  description?: string;
  date: string;
  time?: string;
  ects: number;
  grade: number | null;
  status: LeistungStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// WIZARD TYPES
// ============================================

export type CreationMethod = 'manual' | 'automatic' | 'template';

export interface WeekStructure {
  montag: boolean;
  dienstag: boolean;
  mittwoch: boolean;
  donnerstag: boolean;
  freitag: boolean;
  samstag: boolean;
  sonntag: boolean;
}

export interface WizardDraft {
  currentStep: number;
  totalSteps: number;
  startDate: string | null;
  endDate: string | null;
  bufferDays: number;
  vacationDays: number;
  blocksPerDay: number;
  weekStructure: WeekStructure;
  creationMethod: CreationMethod | null;
  selectedTemplate: string | null;
  unterrechtsgebieteOrder: string[];
  learningDaysOrder: string[];
  adjustments: Record<string, unknown>;
  lastModified: string | null;
  returnPath: string;
}

// ============================================
// UNTERRECHTSGEBIETE TYPES
// ============================================

export interface Unterrechtsgebiet {
  id: string;
  name: string;
  rechtsgebiet: Rechtsgebiet;
  createdAt: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
