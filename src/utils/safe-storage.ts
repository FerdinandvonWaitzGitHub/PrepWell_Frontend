/**
 * Safe Storage Utility - T17 P2 Fix
 *
 * Provides safe access to localStorage and sessionStorage with:
 * - try/catch wrapping for all operations
 * - In-memory fallback when storage is unavailable (private mode, storage blocked, etc.)
 * - Consistent API matching Web Storage interface
 *
 * Usage:
 * import { safeLocalStorage, safeSessionStorage } from './safe-storage';
 * safeLocalStorage.setItem('key', 'value');
 * const value = safeLocalStorage.getItem('key');
 */

// In-memory fallback storage
class MemoryStorage implements Storage {
  private data: Map<string, string> = new Map();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

// Check if storage is available
function isStorageAvailable(storage: Storage): boolean {
  try {
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Create safe storage wrapper
function createSafeStorage(storageType: 'localStorage' | 'sessionStorage'): Storage {
  let storage: Storage;
  let usingFallback = false;

  // Try to use the native storage
  try {
    const nativeStorage = storageType === 'localStorage' ? localStorage : sessionStorage;
    if (isStorageAvailable(nativeStorage)) {
      storage = nativeStorage;
    } else {
      throw new Error('Storage not available');
    }
  } catch {
    // Fallback to in-memory storage
    console.warn(`[SafeStorage] ${storageType} not available, using in-memory fallback`);
    storage = new MemoryStorage();
    usingFallback = true;
  }

  // Return wrapped storage with safe operations
  return {
    get length(): number {
      try {
        return storage.length;
      } catch {
        return 0;
      }
    },

    clear(): void {
      try {
        storage.clear();
      } catch (error) {
        console.warn(`[SafeStorage] Error clearing ${storageType}:`, error);
      }
    },

    getItem(key: string): string | null {
      try {
        return storage.getItem(key);
      } catch (error) {
        console.warn(`[SafeStorage] Error reading ${key} from ${storageType}:`, error);
        return null;
      }
    },

    key(index: number): string | null {
      try {
        return storage.key(index);
      } catch {
        return null;
      }
    },

    removeItem(key: string): void {
      try {
        storage.removeItem(key);
      } catch (error) {
        console.warn(`[SafeStorage] Error removing ${key} from ${storageType}:`, error);
      }
    },

    setItem(key: string, value: string): void {
      try {
        storage.setItem(key, value);
      } catch (error) {
        console.warn(`[SafeStorage] Error writing ${key} to ${storageType}:`, error);
        // If native storage fails, switch to fallback
        if (!usingFallback) {
          console.warn(`[SafeStorage] Switching ${storageType} to in-memory fallback`);
          storage = new MemoryStorage();
          usingFallback = true;
          try {
            storage.setItem(key, value);
          } catch {
            // Even fallback failed, give up silently
          }
        }
      }
    },
  };
}

// Export safe storage instances
export const safeLocalStorage = createSafeStorage('localStorage');
export const safeSessionStorage = createSafeStorage('sessionStorage');

// Export the MemoryStorage class for Supabase auth config
export { MemoryStorage };

// Helper to check if using fallback (for debugging)
export function isUsingFallbackStorage(storageType: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const testKey = '__fallback_check__';
    const nativeStorage = storageType === 'localStorage' ? localStorage : sessionStorage;
    nativeStorage.setItem(testKey, 'test');
    nativeStorage.removeItem(testKey);
    return false;
  } catch {
    return true;
  }
}
