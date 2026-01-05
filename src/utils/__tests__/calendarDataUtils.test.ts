import { describe, it, expect } from 'vitest';
import {
  POSITION_TIME_MAP,
  generateId,
  createContent,
  createBlock,
  getTimeForPosition,
  createSessionFromBlockAndContent,
  buildSession,
  buildSessionsForDay,
  migrateLegacyBlock,
  migrateLegacyData,
  buildDisplaySession,
  type Content,
  type CalendarBlock,
} from '../calendarDataUtils';

describe('calendarDataUtils', () => {
  describe('POSITION_TIME_MAP', () => {
    it('has correct time mappings for all 4 positions', () => {
      expect(POSITION_TIME_MAP[1]).toEqual({
        startHour: 8,
        endHour: 10,
        startTime: '08:00',
        endTime: '10:00',
      });

      expect(POSITION_TIME_MAP[2]).toEqual({
        startHour: 10,
        endHour: 12,
        startTime: '10:00',
        endTime: '12:00',
      });

      expect(POSITION_TIME_MAP[3]).toEqual({
        startHour: 14,
        endHour: 16,
        startTime: '14:00',
        endTime: '16:00',
      });

      expect(POSITION_TIME_MAP[4]).toEqual({
        startHour: 16,
        endHour: 18,
        startTime: '16:00',
        endTime: '18:00',
      });
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
    });

    it('includes prefix when provided', () => {
      const id = generateId('content');
      expect(id.startsWith('content-')).toBe(true);
    });

    it('generates ID without prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('createContent', () => {
    it('creates content with default values', () => {
      const content = createContent({ title: 'Test Content' });

      expect(content.id).toBeDefined();
      expect(content.title).toBe('Test Content');
      expect(content.description).toBe('');
      expect(content.blockType).toBe('theme');
      expect(content.aufgaben).toEqual([]);
      expect(content.createdAt).toBeDefined();
    });

    it('uses provided values', () => {
      const content = createContent({
        id: 'custom-id',
        title: 'BGB AT',
        description: 'Allgemeiner Teil',
        rechtsgebiet: 'Zivilrecht',
        unterrechtsgebiet: 'BGB',
        blockType: 'repetition',
      });

      expect(content.id).toBe('custom-id');
      expect(content.title).toBe('BGB AT');
      expect(content.description).toBe('Allgemeiner Teil');
      expect(content.rechtsgebiet).toBe('Zivilrecht');
      expect(content.unterrechtsgebiet).toBe('BGB');
      expect(content.blockType).toBe('repetition');
    });

    it('uses default title when not provided', () => {
      const content = createContent({});
      expect(content.title).toBe('Neue Session');
    });
  });

  describe('createBlock', () => {
    it('creates block with required date', () => {
      const block = createBlock({ date: '2026-01-05' });

      expect(block.id).toBeDefined();
      expect(block.date).toBe('2026-01-05');
      expect(block.position).toBe(1);
      expect(block.blockType).toBe('theme');
      expect(block.isLocked).toBe(false);
      expect(block.tasks).toEqual([]);
    });

    it('uses provided values', () => {
      const block = createBlock({
        id: 'block-1',
        date: '2026-01-05',
        position: 3,
        contentId: 'content-1',
        blockType: 'exam',
        isLocked: true,
      });

      expect(block.id).toBe('block-1');
      expect(block.position).toBe(3);
      expect(block.contentId).toBe('content-1');
      expect(block.blockType).toBe('exam');
      expect(block.isLocked).toBe(true);
    });
  });

  describe('getTimeForPosition', () => {
    it('returns correct time for each position', () => {
      expect(getTimeForPosition(1).startHour).toBe(8);
      expect(getTimeForPosition(2).startHour).toBe(10);
      expect(getTimeForPosition(3).startHour).toBe(14);
      expect(getTimeForPosition(4).startHour).toBe(16);
    });

    it('returns default (position 1) for invalid position', () => {
      // @ts-expect-error - testing invalid input
      const time = getTimeForPosition(5);
      expect(time.startHour).toBe(8);
    });
  });

  describe('createSessionFromBlockAndContent', () => {
    const content: Content = {
      id: 'content-1',
      title: 'BGB AT',
      description: 'Test description',
      rechtsgebiet: 'Zivilrecht',
      unterrechtsgebiet: 'BGB',
      blockType: 'theme',
      aufgaben: [],
      createdAt: '2026-01-05T00:00:00Z',
    };

    const block: CalendarBlock = {
      id: 'block-1',
      date: '2026-01-05',
      position: 2,
      contentId: 'content-1',
      blockType: 'theme',
      isLocked: false,
      tasks: [],
      createdAt: '2026-01-05T00:00:00Z',
    };

    it('creates session from block and content', () => {
      const session = createSessionFromBlockAndContent(block, content);

      expect(session.id).toBe('block-1');
      expect(session.contentId).toBe('content-1');
      expect(session.date).toBe('2026-01-05');
      expect(session.title).toBe('BGB AT');
      expect(session.startHour).toBe(10);
      expect(session.duration).toBe(2);
      expect(session.startTime).toBe('10:00');
      expect(session.endTime).toBe('12:00');
      expect(session.position).toBe(2);
    });

    it('uses time override when provided', () => {
      const session = createSessionFromBlockAndContent(block, content, {
        startHour: 9,
        duration: 3,
        startTime: '09:00',
        endTime: '12:00',
      });

      expect(session.startHour).toBe(9);
      expect(session.duration).toBe(3);
      expect(session.startTime).toBe('09:00');
      expect(session.endTime).toBe('12:00');
    });

    it('uses block blockType over content blockType', () => {
      const examBlock: CalendarBlock = {
        ...block,
        blockType: 'exam',
      };

      const session = createSessionFromBlockAndContent(examBlock, content);
      expect(session.blockType).toBe('exam');
    });
  });

  describe('buildSession', () => {
    it('is an alias for createSessionFromBlockAndContent', () => {
      const content = createContent({ title: 'Test' });
      const block = createBlock({ date: '2026-01-05', contentId: content.id });

      const session1 = createSessionFromBlockAndContent(block, content);
      const session2 = buildSession(block, content);

      expect(session1.title).toBe(session2.title);
      expect(session1.startHour).toBe(session2.startHour);
    });
  });

  describe('buildSessionsForDay', () => {
    it('builds sessions for blocks with content', () => {
      const content1 = createContent({ id: 'c1', title: 'Morning Topic' });
      const content2 = createContent({ id: 'c2', title: 'Afternoon Topic' });

      const blocks: CalendarBlock[] = [
        createBlock({ date: '2026-01-05', position: 1, contentId: 'c1' }),
        createBlock({ date: '2026-01-05', position: 3, contentId: 'c2' }),
      ];

      const contentsById = {
        c1: content1,
        c2: content2,
      };

      const sessions = buildSessionsForDay(blocks, contentsById);

      expect(sessions).toHaveLength(2);
      expect(sessions[0].title).toBe('Morning Topic');
      expect(sessions[0].startHour).toBe(8);
      expect(sessions[1].title).toBe('Afternoon Topic');
      expect(sessions[1].startHour).toBe(14);
    });

    it('filters out blocks without content', () => {
      const content = createContent({ id: 'c1', title: 'Topic' });

      const blocks: CalendarBlock[] = [
        createBlock({ date: '2026-01-05', position: 1, contentId: 'c1' }),
        createBlock({ date: '2026-01-05', position: 2 }), // No contentId
      ];

      const sessions = buildSessionsForDay(blocks, { c1: content });

      expect(sessions).toHaveLength(1);
    });

    it('sorts sessions by startHour', () => {
      const content1 = createContent({ id: 'c1', title: 'Later' });
      const content2 = createContent({ id: 'c2', title: 'Earlier' });

      const blocks: CalendarBlock[] = [
        createBlock({ date: '2026-01-05', position: 4, contentId: 'c1' }),
        createBlock({ date: '2026-01-05', position: 1, contentId: 'c2' }),
      ];

      const sessions = buildSessionsForDay(blocks, { c1: content1, c2: content2 });

      expect(sessions[0].title).toBe('Earlier');
      expect(sessions[1].title).toBe('Later');
    });
  });

  describe('migrateLegacyBlock', () => {
    it('migrates legacy block to new format', () => {
      const legacyBlock = {
        id: 'old-block-1',
        date: '2026-01-05',
        position: 2 as const,
        topicId: 'topic-1',
        topicTitle: 'BGB AT',
        description: 'Allgemeiner Teil',
        rechtsgebiet: 'Zivilrecht',
        blockType: 'theme' as const,
        isLocked: true,
      };

      const { block, content } = migrateLegacyBlock(legacyBlock);

      expect(block.id).toBe('old-block-1');
      expect(block.contentId).toBe('topic-1');
      expect(block.position).toBe(2);
      expect(block.isLocked).toBe(true);

      expect(content.id).toBe('topic-1');
      expect(content.title).toBe('BGB AT');
      expect(content.description).toBe('Allgemeiner Teil');
      expect(content.rechtsgebiet).toBe('Zivilrecht');
    });

    it('generates IDs when not provided', () => {
      const legacyBlock = {
        date: '2026-01-05',
        title: 'Test Topic',
      };

      const { block, content } = migrateLegacyBlock(legacyBlock);

      expect(block.id).toBeDefined();
      expect(content.id).toBeDefined();
      expect(block.contentId).toBe(content.id);
    });
  });

  describe('migrateLegacyData', () => {
    it('migrates legacy data structure', () => {
      const legacyData = {
        '2026-01-05': [
          { topicId: 't1', topicTitle: 'Topic 1', position: 1 as const },
          { topicId: 't2', topicTitle: 'Topic 2', position: 2 as const },
        ],
        '2026-01-06': [
          { topicId: 't3', topicTitle: 'Topic 3', position: 1 as const },
        ],
      };

      const { blocksByDate, contentsById } = migrateLegacyData(legacyData);

      expect(Object.keys(blocksByDate)).toHaveLength(2);
      expect(blocksByDate['2026-01-05']).toHaveLength(2);
      expect(blocksByDate['2026-01-06']).toHaveLength(1);

      expect(Object.keys(contentsById)).toHaveLength(3);
      expect(contentsById['t1'].title).toBe('Topic 1');
    });
  });

  describe('buildDisplaySession', () => {
    it('builds display session with position time', () => {
      const content = createContent({ id: 'c1', title: 'Display Test' });
      const block = createBlock({
        date: '2026-01-05',
        position: 3,
        contentId: 'c1',
      });

      const displaySession = buildDisplaySession(block, content);

      expect(displaySession.id).toBe('c1');
      expect(displaySession.blockId).toBe(block.id);
      expect(displaySession.startHour).toBe(14);
      expect(displaySession.startTime).toBe('14:00');
      expect(displaySession.endTime).toBe('16:00');
      expect(displaySession.hasTime).toBe(false);
    });

    it('uses custom time when provided', () => {
      const content = createContent({ id: 'c1', title: 'Custom Time' });
      const block = createBlock({
        date: '2026-01-05',
        position: 1,
        contentId: 'c1',
      });

      const displaySession = buildDisplaySession(block, content, {
        startHour: 9,
        duration: 1.5,
        startTime: '09:00',
        endTime: '10:30',
      });

      expect(displaySession.startHour).toBe(9);
      expect(displaySession.duration).toBe(1.5);
      expect(displaySession.startTime).toBe('09:00');
      expect(displaySession.endTime).toBe('10:30');
      expect(displaySession.hasTime).toBe(true);
    });
  });
});
