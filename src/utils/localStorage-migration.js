/**
 * LocalStorage Migration Script
 *
 * Migrates old LocalStorage keys to new naming convention:
 * - prepwell_calendar_slots → prepwell_calendar_blocks
 * - prepwell_private_blocks → prepwell_private_sessions
 * - prepwell_time_blocks → prepwell_time_sessions
 *
 * This script runs once when the app starts and only migrates
 * data if the old keys exist and new keys don't.
 *
 * T17 P2 FIX: Uses safeLocalStorage for robust storage access
 */

import { safeLocalStorage } from './safe-storage';

// Migration version - increment if new migrations are added
const MIGRATION_VERSION = 1;
const MIGRATION_KEY = 'prepwell_storage_migration_version';

/**
 * Key migrations: old key → new key
 */
const KEY_MIGRATIONS = {
  'prepwell_calendar_slots': 'prepwell_calendar_blocks',
  'prepwell_private_blocks': 'prepwell_private_sessions',
  'prepwell_time_blocks': 'prepwell_time_sessions',
};

/**
 * Check if migration has already been performed
 */
const shouldMigrate = () => {
  const currentVersion = safeLocalStorage.getItem(MIGRATION_KEY);
  return !currentVersion || parseInt(currentVersion, 10) < MIGRATION_VERSION;
};

/**
 * Mark migration as complete
 */
const markMigrationComplete = () => {
  safeLocalStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION.toString());
};

/**
 * Migrate a single key from old to new name
 * @param {string} oldKey - The old safeLocalStorage key
 * @param {string} newKey - The new safeLocalStorage key
 * @returns {boolean} - Whether migration was performed
 */
const migrateKey = (oldKey, newKey) => {
  try {
    const oldData = safeLocalStorage.getItem(oldKey);
    const newData = safeLocalStorage.getItem(newKey);

    // Only migrate if old data exists and new data doesn't
    if (oldData && !newData) {
      safeLocalStorage.setItem(newKey, oldData);
      console.log(`[Migration] Migrated ${oldKey} → ${newKey}`);

      // Optionally remove old key after successful migration
      // Uncomment the line below to remove old keys:
      // safeLocalStorage.removeItem(oldKey);

      return true;
    }

    // If both exist, keep both (no data loss)
    if (oldData && newData) {
      console.log(`[Migration] Both ${oldKey} and ${newKey} exist, keeping both`);
    }

    return false;
  } catch (error) {
    console.error(`[Migration] Error migrating ${oldKey} → ${newKey}:`, error);
    return false;
  }
};

/**
 * Run all safeLocalStorage migrations
 * Call this function at app startup (e.g., in main.jsx or App.jsx)
 */
export const runLocalStorageMigration = () => {
  // Skip if already migrated
  if (!shouldMigrate()) {
    console.log('[Migration] LocalStorage already migrated to version', MIGRATION_VERSION);
    return;
  }

  console.log('[Migration] Running LocalStorage migration...');

  let migratedCount = 0;

  // Run all migrations
  for (const [oldKey, newKey] of Object.entries(KEY_MIGRATIONS)) {
    if (migrateKey(oldKey, newKey)) {
      migratedCount++;
    }
  }

  // Mark as complete
  markMigrationComplete();

  if (migratedCount > 0) {
    console.log(`[Migration] Completed: ${migratedCount} keys migrated`);
  } else {
    console.log('[Migration] No data to migrate');
  }
};

/**
 * Clear old keys after confirming new keys are working
 * Only call this after the app has been stable for a while
 */
export const clearOldKeys = () => {
  console.log('[Migration] Clearing old safeLocalStorage keys...');

  for (const oldKey of Object.keys(KEY_MIGRATIONS)) {
    const data = safeLocalStorage.getItem(oldKey);
    if (data) {
      safeLocalStorage.removeItem(oldKey);
      console.log(`[Migration] Removed old key: ${oldKey}`);
    }
  }

  console.log('[Migration] Old keys cleared');
};

/**
 * Get migration status for debugging
 */
export const getMigrationStatus = () => {
  const status = {
    migrationVersion: safeLocalStorage.getItem(MIGRATION_KEY) || 'not run',
    keys: {},
  };

  for (const [oldKey, newKey] of Object.entries(KEY_MIGRATIONS)) {
    const oldExists = !!safeLocalStorage.getItem(oldKey);
    const newExists = !!safeLocalStorage.getItem(newKey);

    status.keys[oldKey] = {
      oldKeyExists: oldExists,
      newKeyExists: newExists,
      migrated: !oldExists && newExists,
    };
  }

  return status;
};

export default runLocalStorageMigration;
