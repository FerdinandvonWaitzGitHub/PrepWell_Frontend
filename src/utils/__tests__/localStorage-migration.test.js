import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock storage
let mockStore = {};
const mockStorage = {
  getItem: vi.fn((key) => mockStore[key] || null),
  setItem: vi.fn((key, value) => { mockStore[key] = value; }),
  removeItem: vi.fn((key) => { delete mockStore[key]; }),
  clear: vi.fn(() => { mockStore = {}; }),
};

// Mock safeLocalStorage module (used by localStorage-migration.js)
vi.mock('../safe-storage', () => ({
  safeLocalStorage: {
    getItem: (key) => mockStore[key] || null,
    setItem: (key, value) => { mockStore[key] = value; mockStorage.setItem(key, value); },
    removeItem: (key) => { delete mockStore[key]; mockStorage.removeItem(key); },
  },
}));

// Import AFTER mocking
import {
  runLocalStorageMigration,
  clearOldKeys,
  getMigrationStatus,
} from '../localStorage-migration';

describe('localStorage-migration', () => {
  beforeEach(() => {
    // Reset the store before each test
    mockStore = {};
    mockStorage.getItem.mockClear();
    mockStorage.setItem.mockClear();
    mockStorage.removeItem.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('runLocalStorageMigration', () => {
    it('should skip migration if already at current version', () => {
      mockStore['prepwell_storage_migration_version'] = '1';

      runLocalStorageMigration();

      // Should not set any new keys (except possibly the version)
      expect(mockStorage.setItem).not.toHaveBeenCalledWith(
        'prepwell_calendar_blocks',
        expect.anything()
      );
    });

    it('should migrate calendar_slots to calendar_blocks', () => {
      const testData = JSON.stringify({ '2026-01-15': { blocks: [] } });
      mockStore['prepwell_calendar_slots'] = testData;

      runLocalStorageMigration();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'prepwell_calendar_blocks',
        testData
      );
    });

    it('should migrate private_blocks to private_sessions', () => {
      const testData = JSON.stringify([{ id: '1', title: 'Test' }]);
      mockStore['prepwell_private_blocks'] = testData;

      runLocalStorageMigration();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'prepwell_private_sessions',
        testData
      );
    });

    it('should migrate time_blocks to time_sessions', () => {
      const testData = JSON.stringify([{ id: '1', duration: 60 }]);
      mockStore['prepwell_time_blocks'] = testData;

      runLocalStorageMigration();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'prepwell_time_sessions',
        testData
      );
    });

    it('should NOT overwrite existing new keys', () => {
      const oldData = JSON.stringify({ old: true });
      const newData = JSON.stringify({ new: true });
      mockStore['prepwell_calendar_slots'] = oldData;
      mockStore['prepwell_calendar_blocks'] = newData;

      runLocalStorageMigration();

      // Should not overwrite existing new data
      expect(mockStore['prepwell_calendar_blocks']).toBe(newData);
    });

    it('should mark migration as complete', () => {
      mockStore['prepwell_calendar_slots'] = JSON.stringify({});

      runLocalStorageMigration();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'prepwell_storage_migration_version',
        '1'
      );
    });

    it('should migrate multiple keys at once', () => {
      mockStore['prepwell_calendar_slots'] = JSON.stringify({ cal: true });
      mockStore['prepwell_private_blocks'] = JSON.stringify({ priv: true });
      mockStore['prepwell_time_blocks'] = JSON.stringify({ time: true });

      runLocalStorageMigration();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'prepwell_calendar_blocks',
        expect.any(String)
      );
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'prepwell_private_sessions',
        expect.any(String)
      );
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'prepwell_time_sessions',
        expect.any(String)
      );
    });
  });

  describe('clearOldKeys', () => {
    it('should remove old keys that exist', () => {
      mockStore['prepwell_calendar_slots'] = JSON.stringify({});
      mockStore['prepwell_private_blocks'] = JSON.stringify({});

      clearOldKeys();

      expect(mockStorage.removeItem).toHaveBeenCalledWith('prepwell_calendar_slots');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('prepwell_private_blocks');
    });

    it('should not fail if old keys do not exist', () => {
      mockStore = {};

      expect(() => clearOldKeys()).not.toThrow();
    });
  });

  describe('getMigrationStatus', () => {
    it('should return "not run" if migration never ran', () => {
      mockStore = {};

      const status = getMigrationStatus();

      expect(status.migrationVersion).toBe('not run');
    });

    it('should return current version if migration ran', () => {
      mockStore['prepwell_storage_migration_version'] = '1';

      const status = getMigrationStatus();

      expect(status.migrationVersion).toBe('1');
    });

    it('should correctly identify migrated keys', () => {
      mockStore['prepwell_storage_migration_version'] = '1';
      mockStore['prepwell_calendar_blocks'] = JSON.stringify({}); // new key exists
      // old key doesn't exist = migrated

      const status = getMigrationStatus();

      expect(status.keys['prepwell_calendar_slots']).toEqual({
        oldKeyExists: false,
        newKeyExists: true,
        migrated: true,
      });
    });

    it('should identify when both old and new keys exist', () => {
      mockStore['prepwell_calendar_slots'] = JSON.stringify({ old: true });
      mockStore['prepwell_calendar_blocks'] = JSON.stringify({ new: true });

      const status = getMigrationStatus();

      expect(status.keys['prepwell_calendar_slots']).toEqual({
        oldKeyExists: true,
        newKeyExists: true,
        migrated: false,
      });
    });

    it('should identify when only old key exists (not migrated)', () => {
      mockStore['prepwell_calendar_slots'] = JSON.stringify({ old: true });

      const status = getMigrationStatus();

      expect(status.keys['prepwell_calendar_slots']).toEqual({
        oldKeyExists: true,
        newKeyExists: false,
        migrated: false,
      });
    });
  });
});
