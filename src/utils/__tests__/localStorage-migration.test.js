import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  runLocalStorageMigration,
  clearOldKeys,
  getMigrationStatus,
} from '../localStorage-migration';

// Mock localStorage
const createMockLocalStorage = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _getStore: () => store,
    _setStore: (newStore) => { store = newStore; },
  };
};

describe('localStorage-migration', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    vi.stubGlobal('localStorage', mockStorage);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('runLocalStorageMigration', () => {
    it('should skip migration if already at current version', () => {
      mockStorage._setStore({
        'prepwell_storage_migration_version': '1',
      });

      runLocalStorageMigration();

      // Should not set any new keys
      expect(mockStorage.setItem).not.toHaveBeenCalledWith(
        'prepwell_calendar_blocks',
        expect.anything()
      );
    });

    it('should migrate calendar_slots to calendar_blocks', () => {
      const testData = JSON.stringify({ '2026-01-15': { blocks: [] } });
      mockStorage._setStore({
        'prepwell_calendar_slots': testData,
      });

      runLocalStorageMigration();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'prepwell_calendar_blocks',
        testData
      );
    });

    it('should migrate private_blocks to private_sessions', () => {
      const testData = JSON.stringify([{ id: '1', title: 'Test' }]);
      mockStorage._setStore({
        'prepwell_private_blocks': testData,
      });

      runLocalStorageMigration();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'prepwell_private_sessions',
        testData
      );
    });

    it('should migrate time_blocks to time_sessions', () => {
      const testData = JSON.stringify([{ id: '1', duration: 60 }]);
      mockStorage._setStore({
        'prepwell_time_blocks': testData,
      });

      runLocalStorageMigration();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'prepwell_time_sessions',
        testData
      );
    });

    it('should NOT overwrite existing new keys', () => {
      const oldData = JSON.stringify({ old: true });
      const newData = JSON.stringify({ new: true });
      mockStorage._setStore({
        'prepwell_calendar_slots': oldData,
        'prepwell_calendar_blocks': newData,
      });

      runLocalStorageMigration();

      // Should not overwrite existing new data
      const store = mockStorage._getStore();
      expect(store['prepwell_calendar_blocks']).toBe(newData);
    });

    it('should mark migration as complete', () => {
      mockStorage._setStore({
        'prepwell_calendar_slots': JSON.stringify({}),
      });

      runLocalStorageMigration();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'prepwell_storage_migration_version',
        '1'
      );
    });

    it('should migrate multiple keys at once', () => {
      mockStorage._setStore({
        'prepwell_calendar_slots': JSON.stringify({ cal: true }),
        'prepwell_private_blocks': JSON.stringify({ priv: true }),
        'prepwell_time_blocks': JSON.stringify({ time: true }),
      });

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
      mockStorage._setStore({
        'prepwell_calendar_slots': JSON.stringify({}),
        'prepwell_private_blocks': JSON.stringify({}),
      });

      clearOldKeys();

      expect(mockStorage.removeItem).toHaveBeenCalledWith('prepwell_calendar_slots');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('prepwell_private_blocks');
    });

    it('should not fail if old keys do not exist', () => {
      mockStorage._setStore({});

      expect(() => clearOldKeys()).not.toThrow();
    });
  });

  describe('getMigrationStatus', () => {
    it('should return "not run" if migration never ran', () => {
      mockStorage._setStore({});

      const status = getMigrationStatus();

      expect(status.migrationVersion).toBe('not run');
    });

    it('should return current version if migration ran', () => {
      mockStorage._setStore({
        'prepwell_storage_migration_version': '1',
      });

      const status = getMigrationStatus();

      expect(status.migrationVersion).toBe('1');
    });

    it('should correctly identify migrated keys', () => {
      mockStorage._setStore({
        'prepwell_storage_migration_version': '1',
        'prepwell_calendar_blocks': JSON.stringify({}), // new key exists
        // old key doesn't exist = migrated
      });

      const status = getMigrationStatus();

      expect(status.keys['prepwell_calendar_slots']).toEqual({
        oldKeyExists: false,
        newKeyExists: true,
        migrated: true,
      });
    });

    it('should identify when both old and new keys exist', () => {
      mockStorage._setStore({
        'prepwell_calendar_slots': JSON.stringify({ old: true }),
        'prepwell_calendar_blocks': JSON.stringify({ new: true }),
      });

      const status = getMigrationStatus();

      expect(status.keys['prepwell_calendar_slots']).toEqual({
        oldKeyExists: true,
        newKeyExists: true,
        migrated: false,
      });
    });

    it('should identify when only old key exists (not migrated)', () => {
      mockStorage._setStore({
        'prepwell_calendar_slots': JSON.stringify({ old: true }),
      });

      const status = getMigrationStatus();

      expect(status.keys['prepwell_calendar_slots']).toEqual({
        oldKeyExists: true,
        newKeyExists: false,
        migrated: false,
      });
    });
  });
});
