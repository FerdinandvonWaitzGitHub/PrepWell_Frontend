import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatDateKey,
  createEmptyBlock,
  createDayBlocks,
  countFreeBlocks,
  canPlaceTopic,
  getAvailableBlockPositions,
  createTopicBlocks,
  updateDayBlocks,
  groupBlocksByTopic,
  blocksToLearningSessions,
  type LegacyBlock,
  type BlockPosition,
} from '../blockUtils';

describe('blockUtils', () => {
  describe('formatDateKey', () => {
    it('formats date as YYYY-MM-DD', () => {
      const date = new Date(2026, 0, 5); // January 5, 2026
      expect(formatDateKey(date)).toBe('2026-01-05');
    });

    it('pads single digit months and days', () => {
      const date = new Date(2026, 0, 1); // January 1, 2026
      expect(formatDateKey(date)).toBe('2026-01-01');
    });

    it('handles December correctly', () => {
      const date = new Date(2026, 11, 31); // December 31, 2026
      expect(formatDateKey(date)).toBe('2026-12-31');
    });
  });

  describe('createEmptyBlock', () => {
    it('creates an empty block with correct properties', () => {
      const date = new Date(2026, 0, 5);
      const block = createEmptyBlock(date, 1);

      expect(block.id).toBe('2026-01-05-1');
      expect(block.date).toBe('2026-01-05');
      expect(block.position).toBe(1);
      expect(block.status).toBe('empty');
      expect(block.isLocked).toBe(false);
      expect(block.createdAt).toBeDefined();
      expect(block.updatedAt).toBeDefined();
    });

    it('creates blocks with different positions', () => {
      const date = new Date(2026, 0, 5);

      const block1 = createEmptyBlock(date, 1);
      const block2 = createEmptyBlock(date, 2);
      const block3 = createEmptyBlock(date, 3);
      const block4 = createEmptyBlock(date, 4);

      expect(block1.position).toBe(1);
      expect(block2.position).toBe(2);
      expect(block3.position).toBe(3);
      expect(block4.position).toBe(4);
    });
  });

  describe('createDayBlocks', () => {
    it('creates 4 empty blocks for a day', () => {
      const date = new Date(2026, 0, 5);
      const blocks = createDayBlocks(date);

      expect(blocks).toHaveLength(4);
      blocks.forEach((block, index) => {
        expect(block.position).toBe(index + 1);
        expect(block.status).toBe('empty');
      });
    });
  });

  describe('countFreeBlocks', () => {
    it('counts all empty blocks', () => {
      const date = new Date(2026, 0, 5);
      const blocks = createDayBlocks(date);

      expect(countFreeBlocks(blocks)).toBe(4);
    });

    it('returns 0 when no blocks are empty', () => {
      const blocks: LegacyBlock[] = [
        { ...createEmptyBlock(new Date(), 1), status: 'topic' },
        { ...createEmptyBlock(new Date(), 2), status: 'topic' },
        { ...createEmptyBlock(new Date(), 3), status: 'topic' },
        { ...createEmptyBlock(new Date(), 4), status: 'topic' },
      ];

      expect(countFreeBlocks(blocks)).toBe(0);
    });

    it('counts mixed blocks correctly', () => {
      const blocks: LegacyBlock[] = [
        { ...createEmptyBlock(new Date(), 1), status: 'topic' },
        { ...createEmptyBlock(new Date(), 2), status: 'empty' },
        { ...createEmptyBlock(new Date(), 3), status: 'empty' },
        { ...createEmptyBlock(new Date(), 4), status: 'topic' },
      ];

      expect(countFreeBlocks(blocks)).toBe(2);
    });
  });

  describe('canPlaceTopic', () => {
    let emptyBlocks: LegacyBlock[];

    beforeEach(() => {
      emptyBlocks = createDayBlocks(new Date(2026, 0, 5));
    });

    it('returns true when enough blocks are available', () => {
      expect(canPlaceTopic(emptyBlocks, 1)).toBe(true);
      expect(canPlaceTopic(emptyBlocks, 2)).toBe(true);
      expect(canPlaceTopic(emptyBlocks, 3)).toBe(true);
      expect(canPlaceTopic(emptyBlocks, 4)).toBe(true);
    });

    it('returns false when not enough blocks are available', () => {
      expect(canPlaceTopic(emptyBlocks, 5)).toBe(false);
    });

    it('returns false when some blocks are occupied', () => {
      const blocks: LegacyBlock[] = [
        { ...emptyBlocks[0], status: 'topic' },
        { ...emptyBlocks[1], status: 'topic' },
        emptyBlocks[2],
        emptyBlocks[3],
      ];

      expect(canPlaceTopic(blocks, 3)).toBe(false);
      expect(canPlaceTopic(blocks, 2)).toBe(true);
    });
  });

  describe('getAvailableBlockPositions', () => {
    let emptyBlocks: LegacyBlock[];

    beforeEach(() => {
      emptyBlocks = createDayBlocks(new Date(2026, 0, 5));
    });

    it('returns first N available positions', () => {
      const positions = getAvailableBlockPositions(emptyBlocks, 2);
      expect(positions).toEqual([1, 2]);
    });

    it('returns null when not enough positions available', () => {
      const positions = getAvailableBlockPositions(emptyBlocks, 5);
      expect(positions).toBeNull();
    });

    it('skips occupied positions', () => {
      const blocks: LegacyBlock[] = [
        { ...emptyBlocks[0], status: 'topic' },
        emptyBlocks[1],
        { ...emptyBlocks[2], status: 'topic' },
        emptyBlocks[3],
      ];

      const positions = getAvailableBlockPositions(blocks, 2);
      expect(positions).toEqual([2, 4]);
    });
  });

  describe('createTopicBlocks', () => {
    it('creates topic blocks with correct properties', () => {
      const date = new Date(2026, 0, 5);
      const positions: BlockPosition[] = [1, 2];
      const topicData = {
        id: 'topic-1',
        title: 'BGB AT',
        blockType: 'theme' as const,
        rechtsgebiet: 'Zivilrecht',
      };

      const blocks = createTopicBlocks(date, positions, topicData);

      expect(blocks).toHaveLength(2);
      expect(blocks[0].status).toBe('topic');
      expect(blocks[0].topicId).toBe('topic-1');
      expect(blocks[0].topicTitle).toBe('BGB AT');
      expect(blocks[0].groupSize).toBe(2);
      expect(blocks[0].groupIndex).toBe(0);
      expect(blocks[1].groupIndex).toBe(1);
      expect(blocks[0].groupId).toBe(blocks[1].groupId);
    });

    it('creates single block topic', () => {
      const date = new Date(2026, 0, 5);
      const positions: BlockPosition[] = [3];
      const topicData = {
        title: 'Strafrecht AT',
        blockType: 'theme' as const,
      };

      const blocks = createTopicBlocks(date, positions, topicData);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].groupSize).toBe(1);
      expect(blocks[0].groupIndex).toBe(0);
    });
  });

  describe('updateDayBlocks', () => {
    it('replaces blocks at specified positions', () => {
      const date = new Date(2026, 0, 5);
      const currentBlocks = createDayBlocks(date);
      const newBlocks = createTopicBlocks(date, [2], {
        title: 'Test Topic',
        blockType: 'theme',
      });

      const updated = updateDayBlocks(currentBlocks, newBlocks);

      expect(updated[0].status).toBe('empty');
      expect(updated[1].status).toBe('topic');
      expect(updated[1].topicTitle).toBe('Test Topic');
      expect(updated[2].status).toBe('empty');
      expect(updated[3].status).toBe('empty');
    });
  });

  describe('groupBlocksByTopic', () => {
    it('groups blocks by groupId', () => {
      const date = new Date(2026, 0, 5);
      const topicBlocks = createTopicBlocks(date, [1, 2], {
        title: 'Multi-block Topic',
        blockType: 'theme',
      });

      const groups = groupBlocksByTopic(topicBlocks);
      const groupIds = Object.keys(groups);

      expect(groupIds).toHaveLength(1);
      expect(groups[groupIds[0]]).toHaveLength(2);
    });

    it('creates separate groups for different topics', () => {
      const date = new Date(2026, 0, 5);
      // Manually create blocks with different groupIds to avoid timing issues
      const topic1Block: LegacyBlock = {
        ...createEmptyBlock(date, 1),
        status: 'topic',
        topicId: 'topic-1',
        topicTitle: 'Topic 1',
        groupId: 'group-1',
        groupSize: 1,
        groupIndex: 0,
      };
      const topic2Block: LegacyBlock = {
        ...createEmptyBlock(date, 2),
        status: 'topic',
        topicId: 'topic-2',
        topicTitle: 'Topic 2',
        groupId: 'group-2',
        groupSize: 1,
        groupIndex: 0,
      };

      const allBlocks = [topic1Block, topic2Block];
      const groups = groupBlocksByTopic(allBlocks);

      expect(Object.keys(groups)).toHaveLength(2);
    });

    it('ignores empty blocks', () => {
      const emptyBlocks = createDayBlocks(new Date(2026, 0, 5));
      const groups = groupBlocksByTopic(emptyBlocks);

      expect(Object.keys(groups)).toHaveLength(0);
    });
  });

  describe('blocksToLearningSessions', () => {
    it('converts grouped blocks to single session', () => {
      const date = new Date(2026, 0, 5);
      const topicBlocks = createTopicBlocks(date, [1, 2, 3], {
        title: 'Large Topic',
        blockType: 'theme',
        progress: '0/5',
      });

      const sessions = blocksToLearningSessions(topicBlocks);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].title).toBe('Large Topic');
      expect(sessions[0].blockSize).toBe(3);
      expect(sessions[0].progress).toBe('0/5');
    });

    it('converts free blocks to free sessions', () => {
      const date = new Date(2026, 0, 5);
      const blocks: LegacyBlock[] = [
        { ...createEmptyBlock(date, 1), status: 'free' },
      ];

      const sessions = blocksToLearningSessions(blocks);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].blockType).toBe('free');
      expect(sessions[0].title).toBe('Frei');
    });

    it('handles mixed blocks correctly', () => {
      const date = new Date(2026, 0, 5);
      const topicBlocks = createTopicBlocks(date, [1, 2], {
        title: 'Morning Topic',
        blockType: 'theme',
      });
      const freeBlock: LegacyBlock = {
        ...createEmptyBlock(date, 3),
        status: 'free',
      };

      const allBlocks = [...topicBlocks, freeBlock];
      const sessions = blocksToLearningSessions(allBlocks);

      expect(sessions).toHaveLength(2);
      expect(sessions.find(s => s.title === 'Morning Topic')).toBeDefined();
      expect(sessions.find(s => s.blockType === 'free')).toBeDefined();
    });
  });
});
