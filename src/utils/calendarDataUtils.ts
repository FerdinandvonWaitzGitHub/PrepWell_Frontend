/**
 * Calendar Data Utilities
 *
 * Provides helper functions for the Content -> Block -> Session data model
 */

import type { BlockKind } from '../types/calendar';

// =============================================================================
// CONSTANTS
// =============================================================================

export interface PositionTimeInfo {
  startHour: number;
  endHour: number;
  startTime: string;
  endTime: string;
}

/**
 * Position zu Zeitblock Mapping
 * Position 1: 08:00 - 10:00
 * Position 2: 10:00 - 12:00
 * Position 3: 14:00 - 16:00
 * Position 4: 16:00 - 18:00
 */
export const POSITION_TIME_MAP: Record<1 | 2 | 3 | 4, PositionTimeInfo> = {
  1: { startHour: 8, endHour: 10, startTime: '08:00', endTime: '10:00' },
  2: { startHour: 10, endHour: 12, startTime: '10:00', endTime: '12:00' },
  3: { startHour: 14, endHour: 16, startTime: '14:00', endTime: '16:00' },
  4: { startHour: 16, endHour: 18, startTime: '16:00', endTime: '18:00' },
};

// =============================================================================
// TYPES
// =============================================================================

export interface ContentTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Content {
  id: string;
  title: string;
  description?: string;
  rechtsgebiet?: string;
  unterrechtsgebiet?: string;
  kapitel?: string;
  blockType: BlockKind;
  aufgaben?: ContentTask[];
  createdAt?: string;
}

export interface BlockTask {
  id: string;
  sourceId?: string;
  text: string;
  completed: boolean;
  source?: 'todos' | 'themenliste' | 'content';
}

export interface CalendarBlock {
  id: string;
  date: string;
  position: 1 | 2 | 3 | 4;
  contentId?: string;
  blockType: BlockKind;
  isLocked?: boolean;
  tasks?: BlockTask[];
  createdAt?: string;
}

export interface TimeOverride {
  startHour?: number;
  duration?: number;
  startTime?: string;
  endTime?: string;
}

export interface CalendarSession {
  id: string;
  contentId?: string;
  date: string;
  startHour: number;
  duration: number;
  startTime: string;
  endTime: string;
  blockType: BlockKind;
  title: string;
  description?: string;
  rechtsgebiet?: string;
  unterrechtsgebiet?: string;
  position: 1 | 2 | 3 | 4;
  isLocked: boolean;
  tasks: BlockTask[];
}

export interface DisplaySession extends CalendarSession {
  blockId: string;
  hasTime: boolean;
}

// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Generiert eine eindeutige ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a new Content item
 */
export function createContent(data: Partial<Content> & { title?: string }): Content {
  return {
    id: data.id || generateId('content'),
    title: data.title || 'Neue Session',
    description: data.description || '',
    rechtsgebiet: data.rechtsgebiet || '',
    unterrechtsgebiet: data.unterrechtsgebiet || '',
    kapitel: data.kapitel || '',
    blockType: data.blockType || 'theme',
    aufgaben: data.aufgaben || [],
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

/**
 * Create a new Block
 */
export function createBlock(
  data: Partial<CalendarBlock> & { date: string }
): CalendarBlock {
  return {
    id: data.id || generateId('block'),
    date: data.date,
    position: data.position || 1,
    contentId: data.contentId,
    blockType: data.blockType || 'theme',
    isLocked: data.isLocked || false,
    tasks: data.tasks || [],
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

/** @deprecated Use createBlock */
export const createSlot = createBlock;

// =============================================================================
// TIME UTILITIES
// =============================================================================

/**
 * Get time info for a block position
 */
export function getTimeForPosition(position: 1 | 2 | 3 | 4): PositionTimeInfo {
  return POSITION_TIME_MAP[position] || POSITION_TIME_MAP[1];
}

// =============================================================================
// SESSION BUILDING
// =============================================================================

/**
 * Erzeugt eine Session aus Block und Content
 */
export function createSessionFromBlockAndContent(
  block: CalendarBlock,
  content: Content,
  timeOverride: TimeOverride | null = null
): CalendarSession {
  const positionTime = POSITION_TIME_MAP[block.position] || POSITION_TIME_MAP[1];

  return {
    id: block.id,
    contentId: block.contentId,
    date: block.date,
    startHour: timeOverride?.startHour ?? positionTime.startHour,
    duration: timeOverride?.duration ?? positionTime.endHour - positionTime.startHour,
    startTime: timeOverride?.startTime ?? positionTime.startTime,
    endTime: timeOverride?.endTime ?? positionTime.endTime,
    blockType: block.blockType || content.blockType || 'theme',
    title: content.title,
    description: content.description,
    rechtsgebiet: content.rechtsgebiet,
    unterrechtsgebiet: content.unterrechtsgebiet,
    position: block.position,
    isLocked: block.isLocked || false,
    tasks: block.tasks || [],
  };
}

/** @deprecated Use createSessionFromBlockAndContent */
export const createBlockFromSlotAndContent = createSessionFromBlockAndContent;

/**
 * Build a Session from Block and Content
 */
export function buildSession(
  block: CalendarBlock,
  content: Content,
  timeOverride: TimeOverride | null = null
): CalendarSession {
  return createSessionFromBlockAndContent(block, content, timeOverride);
}

/** @deprecated Use buildSession */
export const buildBlock = buildSession;

/**
 * Build sessions for a day from blocks and contents
 */
export function buildSessionsForDay(
  blocks: CalendarBlock[],
  contentsById: Record<string, Content>
): CalendarSession[] {
  return blocks
    .filter((block) => block.contentId && contentsById[block.contentId])
    .map((block) => {
      const content = contentsById[block.contentId!];
      return buildSession(block, content);
    })
    .sort((a, b) => a.startHour - b.startHour);
}

/** @deprecated Use buildSessionsForDay */
export const buildBlocksForDay = buildSessionsForDay;

// =============================================================================
// MIGRATION UTILITIES
// =============================================================================

interface LegacyBlockData {
  id?: string;
  date?: string;
  position?: 1 | 2 | 3 | 4;
  topicId?: string;
  topicTitle?: string;
  title?: string;
  description?: string;
  rechtsgebiet?: string;
  unterrechtsgebiet?: string;
  blockType?: BlockKind;
  aufgaben?: ContentTask[];
  isLocked?: boolean;
  tasks?: BlockTask[];
}

/**
 * Migrate legacy block data to new format
 */
export function migrateLegacyBlock(legacyBlock: LegacyBlockData): {
  block: CalendarBlock;
  content: Content;
} {
  const contentId = legacyBlock.topicId || generateId('content');

  const content = createContent({
    id: contentId,
    title: legacyBlock.topicTitle || legacyBlock.title || 'Session',
    description: legacyBlock.description || '',
    rechtsgebiet: legacyBlock.rechtsgebiet || '',
    unterrechtsgebiet: legacyBlock.unterrechtsgebiet || '',
    blockType: legacyBlock.blockType || 'theme',
    aufgaben: legacyBlock.aufgaben || [],
  });

  const block = createBlock({
    id: legacyBlock.id || generateId('block'),
    date: legacyBlock.date || '',
    position: legacyBlock.position || 1,
    contentId,
    blockType: legacyBlock.blockType || 'theme',
    isLocked: legacyBlock.isLocked || false,
    tasks: legacyBlock.tasks || [],
  });

  return { block, content };
}

/** @deprecated Use migrateLegacyBlock */
export const migrateLegacySlot = migrateLegacyBlock;

/**
 * Migrate all legacy blocks by date
 */
export function migrateLegacyData(legacyBlocksByDate: Record<string, LegacyBlockData[]>): {
  blocksByDate: Record<string, CalendarBlock[]>;
  contentsById: Record<string, Content>;
} {
  const blocksByDate: Record<string, CalendarBlock[]> = {};
  const contentsById: Record<string, Content> = {};

  Object.entries(legacyBlocksByDate).forEach(([date, legacyBlocks]) => {
    blocksByDate[date] = [];

    legacyBlocks.forEach((legacyBlock) => {
      const { block, content } = migrateLegacyBlock({ ...legacyBlock, date });
      blocksByDate[date].push(block);
      contentsById[content.id] = content;
    });
  });

  return { blocksByDate, contentsById };
}

// =============================================================================
// DISPLAY UTILITIES
// =============================================================================

/**
 * Build session data for display (ZeitplanWidget format)
 */
export function buildDisplaySession(
  block: CalendarBlock,
  content: Content,
  customTime: TimeOverride | null = null
): DisplaySession {
  const positionTime = getTimeForPosition(block.position);

  const startHour = customTime?.startHour ?? positionTime.startHour;
  const duration = customTime?.duration ?? positionTime.endHour - positionTime.startHour;
  const startTime = customTime?.startTime ?? positionTime.startTime;
  const endTime = customTime?.endTime ?? positionTime.endTime;

  return {
    id: content.id,
    blockId: block.id,
    contentId: content.id,
    date: block.date,
    startHour,
    duration,
    startTime,
    endTime,
    hasTime: !!customTime,
    title: content.title,
    description: content.description,
    rechtsgebiet: content.rechtsgebiet,
    unterrechtsgebiet: content.unterrechtsgebiet,
    blockType: block.blockType || content.blockType,
    position: block.position,
    isLocked: block.isLocked || false,
    tasks: block.tasks || [],
  };
}

/** @deprecated Use buildDisplaySession */
export const buildDisplayBlock = buildDisplaySession;

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  POSITION_TIME_MAP,
  generateId,
  createContent,
  createBlock,
  createSlot,
  getTimeForPosition,
  createSessionFromBlockAndContent,
  createBlockFromSlotAndContent,
  buildSession,
  buildBlock,
  buildSessionsForDay,
  buildBlocksForDay,
  migrateLegacyBlock,
  migrateLegacySlot,
  migrateLegacyData,
  buildDisplaySession,
  buildDisplayBlock,
};
