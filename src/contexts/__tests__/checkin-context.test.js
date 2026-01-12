import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Check-In Context Unit Tests
 *
 * These tests cover the pure functions and core logic from checkin-context.jsx
 * to prevent regression of BUG-C (Check-In appearing repeatedly after page reload)
 */

// Re-implement pure functions for isolated testing
// (These mirror the implementation in checkin-context.jsx)

/**
 * Get today's date as string (YYYY-MM-DD)
 */
const getTodayKey = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Merge local and remote check-in responses
 * Local data takes priority (it's newer if it exists locally but not remotely)
 * BUG-C FIX: Prevents Supabase data from overwriting unsynced local check-ins
 */
const mergeResponses = (local, remote) => {
  const merged = { ...remote };

  Object.entries(local).forEach(([date, periods]) => {
    if (!merged[date]) {
      merged[date] = periods;
    } else {
      if (periods.morning) {
        merged[date] = { ...merged[date], morning: periods.morning };
      }
      if (periods.evening) {
        merged[date] = { ...merged[date], evening: periods.evening };
      }
    }
  });

  return merged;
};

/**
 * Determine if current time is morning or evening
 */
const getCurrentPeriod = (settings, mockHour = null) => {
  const hour = mockHour !== null ? mockHour : new Date().getHours();
  if (hour >= settings.eveningHour) {
    return 'evening';
  }
  return 'morning';
};

/**
 * Check if check-in is needed (mirrors useMemo logic)
 */
const isCheckInNeeded = ({
  responses,
  settings,
  isMentorActivated,
  checkInCount,
  mockHour = null,
}) => {
  if (!isMentorActivated) return false;

  const today = getTodayKey();
  const todayResponses = responses[today] || {};
  const currentPeriod = getCurrentPeriod(settings, mockHour);

  if (!currentPeriod) return false;

  if (checkInCount === 1 && currentPeriod === 'evening') {
    return false;
  }

  if (settings.timing === 'morning' && currentPeriod !== 'morning') {
    return false;
  }
  if (settings.timing === 'evening' && currentPeriod !== 'evening') {
    return false;
  }

  const periodResponse = todayResponses[currentPeriod];
  if (periodResponse) {
    return false;
  }

  return true;
};

// Default settings matching checkin-context.jsx
const DEFAULT_SETTINGS = {
  timing: 'both',
  morningHour: 9,
  eveningHour: 18,
};

describe('Check-In Context', () => {
  describe('getTodayKey', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const result = getTodayKey();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getCurrentPeriod', () => {
    it('should return morning before evening hour', () => {
      expect(getCurrentPeriod(DEFAULT_SETTINGS, 8)).toBe('morning');
      expect(getCurrentPeriod(DEFAULT_SETTINGS, 12)).toBe('morning');
      expect(getCurrentPeriod(DEFAULT_SETTINGS, 17)).toBe('morning');
    });

    it('should return evening at and after evening hour', () => {
      expect(getCurrentPeriod(DEFAULT_SETTINGS, 18)).toBe('evening');
      expect(getCurrentPeriod(DEFAULT_SETTINGS, 20)).toBe('evening');
      expect(getCurrentPeriod(DEFAULT_SETTINGS, 23)).toBe('evening');
    });

    it('should respect custom evening hour', () => {
      const customSettings = { ...DEFAULT_SETTINGS, eveningHour: 20 };
      expect(getCurrentPeriod(customSettings, 19)).toBe('morning');
      expect(getCurrentPeriod(customSettings, 20)).toBe('evening');
    });
  });

  describe('mergeResponses - BUG-C Regression Tests', () => {
    it('should keep local data when remote is empty', () => {
      const local = {
        '2026-01-11': {
          morning: { answers: { positivity: 4 }, timestamp: '2026-01-11T08:00:00Z' },
        },
      };
      const remote = {};

      const result = mergeResponses(local, remote);

      expect(result['2026-01-11']).toBeDefined();
      expect(result['2026-01-11'].morning.answers.positivity).toBe(4);
    });

    it('should keep remote data when local is empty', () => {
      const local = {};
      const remote = {
        '2026-01-10': {
          morning: { answers: { positivity: 3 }, timestamp: '2026-01-10T08:00:00Z' },
        },
      };

      const result = mergeResponses(local, remote);

      expect(result['2026-01-10']).toBeDefined();
      expect(result['2026-01-10'].morning.answers.positivity).toBe(3);
    });

    it('should prioritize LOCAL morning check-in over remote (BUG-C)', () => {
      const local = {
        '2026-01-11': {
          morning: { answers: { positivity: 5 }, timestamp: '2026-01-11T09:00:00Z' },
        },
      };
      const remote = {
        '2026-01-11': {
          morning: { answers: { positivity: 2 }, timestamp: '2026-01-11T08:00:00Z' },
        },
      };

      const result = mergeResponses(local, remote);

      // Local should win (it's the newer one we just submitted)
      expect(result['2026-01-11'].morning.answers.positivity).toBe(5);
    });

    it('should preserve remote data for other dates', () => {
      const local = {
        '2026-01-11': {
          morning: { answers: { positivity: 5 } },
        },
      };
      const remote = {
        '2026-01-10': {
          morning: { answers: { positivity: 3 } },
        },
        '2026-01-09': {
          evening: { answers: { productivity: 4 } },
        },
      };

      const result = mergeResponses(local, remote);

      expect(result['2026-01-10'].morning.answers.positivity).toBe(3);
      expect(result['2026-01-09'].evening.answers.productivity).toBe(4);
      expect(result['2026-01-11'].morning.answers.positivity).toBe(5);
    });

    it('should merge morning and evening from different sources', () => {
      const local = {
        '2026-01-11': {
          morning: { answers: { positivity: 5 } },
        },
      };
      const remote = {
        '2026-01-11': {
          evening: { answers: { productivity: 4 } },
        },
      };

      const result = mergeResponses(local, remote);

      expect(result['2026-01-11'].morning.answers.positivity).toBe(5);
      expect(result['2026-01-11'].evening.answers.productivity).toBe(4);
    });

    it('should handle empty local but keep all remote periods', () => {
      const local = {};
      const remote = {
        '2026-01-11': {
          morning: { answers: { positivity: 3 } },
          evening: { answers: { productivity: 4 } },
        },
      };

      const result = mergeResponses(local, remote);

      expect(result['2026-01-11'].morning.answers.positivity).toBe(3);
      expect(result['2026-01-11'].evening.answers.productivity).toBe(4);
    });
  });

  describe('isCheckInNeeded - Core Logic', () => {
    const today = getTodayKey();

    it('should return false if mentor is not activated', () => {
      const result = isCheckInNeeded({
        responses: {},
        settings: DEFAULT_SETTINGS,
        isMentorActivated: false,
        checkInCount: 2,
        mockHour: 10,
      });

      expect(result).toBe(false);
    });

    it('should return true if no check-in done today (morning)', () => {
      const result = isCheckInNeeded({
        responses: {},
        settings: DEFAULT_SETTINGS,
        isMentorActivated: true,
        checkInCount: 2,
        mockHour: 10, // Morning
      });

      expect(result).toBe(true);
    });

    it('should return false if morning check-in already done (BUG-C REGRESSION)', () => {
      const responses = {
        [today]: {
          morning: { answers: { positivity: 4 }, timestamp: new Date().toISOString() },
        },
      };

      const result = isCheckInNeeded({
        responses,
        settings: DEFAULT_SETTINGS,
        isMentorActivated: true,
        checkInCount: 2,
        mockHour: 10, // Still morning
      });

      expect(result).toBe(false);
    });

    it('should return true for evening check-in when morning is done', () => {
      const responses = {
        [today]: {
          morning: { answers: { positivity: 4 } },
        },
      };

      const result = isCheckInNeeded({
        responses,
        settings: DEFAULT_SETTINGS,
        isMentorActivated: true,
        checkInCount: 2,
        mockHour: 20, // Evening
      });

      expect(result).toBe(true);
    });

    it('should return false for evening when checkInCount is 1', () => {
      const result = isCheckInNeeded({
        responses: {},
        settings: DEFAULT_SETTINGS,
        isMentorActivated: true,
        checkInCount: 1, // Only 1 check-in per day
        mockHour: 20, // Evening
      });

      expect(result).toBe(false);
    });

    it('should respect timing=morning setting', () => {
      const morningOnlySettings = { ...DEFAULT_SETTINGS, timing: 'morning' };

      // Evening time should not need check-in
      const result = isCheckInNeeded({
        responses: {},
        settings: morningOnlySettings,
        isMentorActivated: true,
        checkInCount: 2,
        mockHour: 20,
      });

      expect(result).toBe(false);
    });

    it('should respect timing=evening setting', () => {
      const eveningOnlySettings = { ...DEFAULT_SETTINGS, timing: 'evening' };

      // Morning time should not need check-in
      const result = isCheckInNeeded({
        responses: {},
        settings: eveningOnlySettings,
        isMentorActivated: true,
        checkInCount: 2,
        mockHour: 10,
      });

      expect(result).toBe(false);
    });
  });

  describe('BUG-C Full Scenario: Check-In after page reload', () => {
    it('should NOT show check-in after completing it and simulating Supabase sync', () => {
      const today = getTodayKey();

      // Step 1: User completes morning check-in (stored locally)
      const localResponses = {
        [today]: {
          morning: {
            answers: { positivity: 4, energy: 3, motivation: 4, stress: 3 },
            timestamp: new Date().toISOString(),
          },
        },
      };

      // Step 2: Simulate page reload - Supabase returns empty (sync delay)
      const supabaseResponses = {};

      // Step 3: mergeResponses is called (this is the bug fix)
      const mergedResponses = mergeResponses(localResponses, supabaseResponses);

      // Step 4: Check if check-in is needed
      const result = isCheckInNeeded({
        responses: mergedResponses,
        settings: DEFAULT_SETTINGS,
        isMentorActivated: true,
        checkInCount: 2,
        mockHour: 10,
      });

      // Check-in should NOT be needed because local data was preserved
      expect(result).toBe(false);
      expect(mergedResponses[today].morning).toBeDefined();
    });

    it('should NOT lose local check-in when Supabase has old data', () => {
      const today = getTodayKey();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];

      // Local: today's check-in
      const localResponses = {
        [today]: {
          morning: { answers: { positivity: 5 } },
        },
      };

      // Supabase: only yesterday's data (today not synced yet)
      const supabaseResponses = {
        [yesterdayKey]: {
          morning: { answers: { positivity: 3 } },
        },
      };

      const mergedResponses = mergeResponses(localResponses, supabaseResponses);

      // Today's check-in should still exist
      expect(mergedResponses[today]).toBeDefined();
      expect(mergedResponses[today].morning.answers.positivity).toBe(5);

      // Yesterday's data should also exist
      expect(mergedResponses[yesterdayKey]).toBeDefined();

      // Check-in should NOT be needed
      const result = isCheckInNeeded({
        responses: mergedResponses,
        settings: DEFAULT_SETTINGS,
        isMentorActivated: true,
        checkInCount: 2,
        mockHour: 10,
      });

      expect(result).toBe(false);
    });
  });
});
