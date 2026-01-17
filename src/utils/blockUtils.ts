/**
 * Block Utilities
 * Helper functions for block-based calendar logic
 */

import type { BlockKind, BlockSize } from '../types/calendar';

// =============================================================================
// TYPES
// =============================================================================

export type BlockStatus = 'empty' | 'topic' | 'free' | 'buffer' | 'vacation';
export type BlockPosition = 1 | 2 | 3 | 4;

export interface LegacyBlock {
  id: string;
  date: string;
  position: BlockPosition;
  status: BlockStatus;
  topicId?: string;
  topicTitle?: string;
  title?: string;
  contentId?: string;
  blockType?: BlockKind;
  groupId?: string;
  groupSize?: number;
  groupIndex?: number;
  progress?: string;
  description?: string;
  rechtsgebiet?: string;
  unterrechtsgebiet?: string;
  tasks?: TaskItem[];
  isLocked: boolean;
  isFromLernplan?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  text?: string;
  title?: string;
  completed: boolean;
}

export interface TopicData {
  id?: string;
  title: string;
  blockType?: BlockKind;
  progress?: string;
  description?: string;
  rechtsgebiet?: string;
  unterrechtsgebiet?: string;
  tasks?: TaskItem[];
  isFromLernplan?: boolean;
}

export interface DisplaySession {
  id: string;
  contentId?: string;
  topicId?: string;
  title: string;
  blockType: BlockKind | 'free';
  progress: string;
  description?: string;
  rechtsgebiet?: string;
  unterrechtsgebiet?: string;
  tasks?: TaskItem[];
  blockSize: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format date as 'YYYY-MM-DD'
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Create an empty block for a specific date and position
 */
export function createEmptyBlock(date: Date, position: BlockPosition): LegacyBlock {
  const dateStr = formatDateKey(date);
  const now = new Date().toISOString();

  return {
    id: `${dateStr}-${position}`,
    date: dateStr,
    position,
    status: 'empty',
    isLocked: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create initial 4 empty blocks for a day
 */
export function createDayBlocks(date: Date): LegacyBlock[] {
  return [
    createEmptyBlock(date, 1),
    createEmptyBlock(date, 2),
    createEmptyBlock(date, 3),
    createEmptyBlock(date, 4),
  ];
}

/**
 * Count free (empty) blocks in a day
 */
export function countFreeBlocks(blocks: LegacyBlock[]): number {
  return blocks.filter((block) => block.status === 'empty').length;
}

/**
 * Check if a topic with given size can be placed on this day
 */
export function canPlaceTopic(blocks: LegacyBlock[], sizeInBlocks: number): boolean {
  const freeBlocks = countFreeBlocks(blocks);
  return freeBlocks >= sizeInBlocks;
}

/**
 * Get the next available block positions for placing a topic
 */
export function getAvailableBlockPositions(
  blocks: LegacyBlock[],
  sizeNeeded: number
): BlockPosition[] | null {
  const emptyPositions = blocks
    .filter((block) => block.status === 'empty')
    .map((block) => block.position)
    .sort((a, b) => a - b);

  if (emptyPositions.length < sizeNeeded) {
    return null;
  }

  return emptyPositions.slice(0, sizeNeeded) as BlockPosition[];
}

/**
 * Create blocks for a new learning session
 */
export function createTopicBlocks(
  date: Date,
  positions: BlockPosition[],
  topicData: TopicData
): LegacyBlock[] {
  const dateStr = formatDateKey(date);
  const now = new Date().toISOString();
  const groupId = `group-${dateStr}-${Date.now()}`;

  return positions.map((position, index) => ({
    id: `${dateStr}-${position}`,
    date: dateStr,
    position,
    status: 'topic' as BlockStatus,
    topicId: topicData.id || `topic-${Date.now()}`,
    topicTitle: topicData.title,
    blockType: topicData.blockType,
    groupId,
    groupSize: positions.length,
    groupIndex: index,
    progress: topicData.progress,
    description: topicData.description,
    rechtsgebiet: topicData.rechtsgebiet,
    unterrechtsgebiet: topicData.unterrechtsgebiet,
    tasks: topicData.tasks,
    isLocked: false,
    isFromLernplan: topicData.isFromLernplan || false,
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Update blocks in a day by replacing specific positions
 */
export function updateDayBlocks(
  currentBlocks: LegacyBlock[],
  newBlocks: LegacyBlock[]
): LegacyBlock[] {
  const updatedBlocks = [...currentBlocks];

  newBlocks.forEach((newBlock) => {
    const index = updatedBlocks.findIndex((b) => b.position === newBlock.position);
    if (index !== -1) {
      updatedBlocks[index] = newBlock;
    }
  });

  return updatedBlocks;
}

/**
 * Check if a block has content (supports all content types including buffer/vacation)
 */
function blockHasContentForGrouping(block: LegacyBlock): boolean {
  const contentStatuses: BlockStatus[] = ['topic', 'buffer', 'vacation'];
  return contentStatuses.includes(block.status) || !!block.contentId || !!block.topicId;
}

/**
 * Group blocks by their groupId to render multi-block topics
 */
export function groupBlocksByTopic(blocks: LegacyBlock[]): Record<string, LegacyBlock[]> {
  const groups: Record<string, LegacyBlock[]> = {};

  blocks.forEach((block) => {
    if (blockHasContentForGrouping(block) && block.groupId) {
      if (!groups[block.groupId]) {
        groups[block.groupId] = [];
      }
      groups[block.groupId].push(block);
    }
  });

  // Sort each group by groupIndex
  Object.keys(groups).forEach((groupId) => {
    groups[groupId].sort((a, b) => (a.groupIndex || 0) - (b.groupIndex || 0));
  });

  return groups;
}

/**
 * Get the primary ID for a block
 */
function getBlockId(block: LegacyBlock): string {
  return block.contentId || block.topicId || block.id;
}

/**
 * Get the title for a block
 */
function getBlockTitle(block: LegacyBlock): string {
  return block.title || block.topicTitle || '';
}

/**
 * Check if a block has content
 */
function blockHasContent(block: LegacyBlock): boolean {
  const contentStatuses: BlockStatus[] = ['topic', 'buffer', 'vacation'];
  return contentStatuses.includes(block.status) || !!block.contentId || !!block.topicId;
}

/**
 * Convert blocks to learning sessions for display
 */
export function blocksToLearningSessions(blocks: LegacyBlock[]): DisplaySession[] {
  // Guard against null/undefined blocks
  if (!blocks || !Array.isArray(blocks)) {
    return [];
  }

  const groups = groupBlocksByTopic(blocks);
  const sessions: DisplaySession[] = [];
  const processedGroups = new Set<string>();
  const processedIds = new Set<string>();

  blocks.forEach((block) => {
    const blockId = getBlockId(block);

    if (block.groupId && !processedGroups.has(block.groupId)) {
      const groupBlocks = groups[block.groupId];
      if (groupBlocks && groupBlocks.length > 0) {
        const firstBlock = groupBlocks[0];
        const id = getBlockId(firstBlock);
        sessions.push({
          id,
          contentId: firstBlock.contentId,
          topicId: firstBlock.topicId,
          title: getBlockTitle(firstBlock),
          blockType: firstBlock.blockType || 'theme',
          progress: firstBlock.progress || '0/1',
          description: firstBlock.description,
          rechtsgebiet: firstBlock.rechtsgebiet,
          unterrechtsgebiet: firstBlock.unterrechtsgebiet,
          tasks: firstBlock.tasks,
          blockSize: groupBlocks.length,
        });
        processedGroups.add(block.groupId);
        if (id) processedIds.add(id);
      }
    } else if (!block.groupId && blockHasContent(block) && blockId && !processedIds.has(blockId)) {
      sessions.push({
        id: blockId,
        contentId: block.contentId,
        topicId: block.topicId,
        title: getBlockTitle(block),
        blockType: block.blockType || 'theme',
        progress: block.progress || '1/1',
        description: block.description,
        rechtsgebiet: block.rechtsgebiet,
        unterrechtsgebiet: block.unterrechtsgebiet,
        tasks: block.tasks,
        blockSize: 1,
      });
      processedIds.add(blockId);
    } else if (block.status === 'free') {
      sessions.push({
        id: block.id,
        title: getBlockTitle(block) || 'Frei',
        blockType: 'free',
        progress: '1/1',
        blockSize: 1,
      });
    }
  });

  return sessions;
}

