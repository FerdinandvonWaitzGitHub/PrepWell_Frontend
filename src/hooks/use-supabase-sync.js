/**
 * useSupabaseSync - Data synchronization layer
 *
 * Provides a unified interface for data persistence:
 * - Uses Supabase when authenticated
 * - Falls back to LocalStorage when not authenticated
 * - Syncs LocalStorage data to Supabase on login
 *
 * @module hooks/use-supabase-sync
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/auth-context';
import { supabase } from '../services/supabase';

// LocalStorage keys (same as existing contexts)
const STORAGE_KEYS = {
  contentPlans: 'prepwell_content_plans',
  publishedThemenlisten: 'prepwell_published_themenlisten',
  blocks: 'prepwell_calendar_blocks',
  contents: 'prepwell_contents',
  tasks: 'prepwell_tasks',
  privateSessions: 'prepwell_private_sessions',
  timeSessions: 'prepwell_time_sessions',
  lernplanMetadata: 'prepwell_lernplan_metadata',
  archivedLernplaene: 'prepwell_archived_lernplaene',
  exams: 'prepwell_exams',
  uebungsklausuren: 'prepwell_uebungsklausuren',
  timerHistory: 'prepwell_timer_history',
  timerConfig: 'prepwell_timer_config',
  checkinResponses: 'prepwell_checkin_responses',
  mentorActivated: 'prepwell_mentor_activated',
  customUnterrechtsgebiete: 'prepwell_custom_unterrechtsgebiete',
  wizardDraft: 'prepwell_lernplan_wizard_draft',
  // T35: 'settings' key entfernt - wird nur von settings-content.jsx verwaltet (Single-Writer)
  gradeSystem: 'prepwell_grade_system',
  customSubjects: 'prepwell_custom_subjects',
  subjectSettings: 'prepwell_subject_settings',
  studiengang: 'prepwell_studiengang',
  logbuchEntries: 'prepwell_logbuch_entries',
  semesterLeistungen: 'prepwell_semester_leistungen',
  themenlisteKapitelDefault: 'prepwell_themenliste_kapitel_default', // T27
  kapitelEbeneAktiviert: 'prepwell_kapitel_ebene', // T22
};

/**
 * Load data from localStorage
 * Handles both JSON and plain string values for backwards compatibility
 */
const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;

    // Try to parse as JSON first
    try {
      return JSON.parse(stored);
    } catch {
      // If JSON.parse fails, return the raw string value
      // This handles legacy values stored without JSON.stringify
      return stored;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Save data to localStorage with quota handling
 * If quota exceeded, attempts to clean up old data for timer_history
 */
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    // Handle QuotaExceededError
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.warn(`[useSupabaseSync] localStorage quota exceeded for ${key}`);

      // For timer_history, try to reduce data by keeping only recent entries
      if (key === STORAGE_KEYS.timerHistory && Array.isArray(data)) {
        const maxEntries = 1000; // Keep only last 1000 entries
        if (data.length > maxEntries) {
          const reducedData = data.slice(-maxEntries);
          console.log(`[useSupabaseSync] Reducing timer_history from ${data.length} to ${reducedData.length} entries`);
          try {
            localStorage.setItem(key, JSON.stringify(reducedData));
            return; // Success after reduction
          } catch {
            console.error(`[useSupabaseSync] Still can't save ${key} after reduction`);
          }
        }
      }

      // Try to clear old/large entries to make space
      console.warn(`[useSupabaseSync] Skipping localStorage save for ${key} due to quota`);
    } else {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }
};

/**
 * KA-002 Fix: Clean up invalid data from blocksByDate
 * Removes:
 * - Date keys that have empty arrays (caused by deleteBlock bug)
 * - Invalid date keys (null, undefined, non-YYYY-MM-DD format)
 * @param {Object} data - The blocksByDate object
 * @returns {Object} Cleaned object without invalid entries
 */
const cleanupEmptyArrays = (data) => {
  if (!data || typeof data !== 'object') return data;

  const cleaned = {};
  let hadIssues = false;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  Object.entries(data).forEach(([key, value]) => {
    // Skip invalid date keys
    if (!key || key === 'null' || key === 'undefined' || !datePattern.test(key)) {
      hadIssues = true;
      console.log(`[KA-002] Removing invalid date key: ${key}`);
      return;
    }

    // Skip empty arrays
    if (Array.isArray(value) && value.length === 0) {
      hadIssues = true;
      console.log(`[KA-002] Removing empty array for date: ${key}`);
      return;
    }

    // Keep valid entries, but ensure all blocks have a status field
    if (Array.isArray(value) && value.length > 0) {
      // KA-002 FIX: Ensure all blocks have a status field
      let blocks = value.map(block => {
        if (block.status) return block;
        // Set status based on whether block has content (also check topicTitle and rechtsgebiet)
        const hasContent = !!(block.title || block.topicTitle || block.contentId || block.rechtsgebiet);
        return { ...block, status: hasContent ? 'occupied' : 'empty' };
      });

      // KA-002 FIX: Deduplicate blocks by position (max 4 per day)
      if (blocks.length > 4) {
        hadIssues = true;
        console.log(`[KA-002] Deduplicating ${blocks.length} blocks for date: ${key}`);
        const seenPositions = new Set();
        blocks = blocks.filter(block => {
          const pos = block.position;
          if (pos && !seenPositions.has(pos)) {
            seenPositions.add(pos);
            return true;
          }
          return false;
        }).slice(0, 4);
      }

      cleaned[key] = blocks;
    }
  });

  if (hadIssues) {
    console.log('[KA-002] Cleaned up invalid data from blocksByDate');
  }

  return cleaned;
};

/**
 * T18 Fix: Deduplicate array by importedFrom field
 * Keeps the oldest item (first by createdAt) for each unique importedFrom value.
 * Items without importedFrom are kept as-is.
 *
 * @param {Array} items - Array of items with potential duplicates
 * @returns {Array} Deduplicated array
 */
const deduplicateByImportedFrom = (items) => {
  if (!Array.isArray(items)) return items;

  const seen = new Map(); // importedFrom -> oldest item
  const result = [];

  // Sort by createdAt (oldest first) to ensure we keep the oldest
  const sorted = [...items].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateA - dateB;
  });

  for (const item of sorted) {
    if (!item.importedFrom) {
      // No importedFrom - keep all (no deduplication key)
      result.push(item);
    } else if (!seen.has(item.importedFrom)) {
      // First occurrence of this importedFrom - keep it
      seen.set(item.importedFrom, item);
      result.push(item);
    }
    // Else: duplicate importedFrom - skip
  }

  return result;
};

/**
 * Generic hook for data that syncs between Supabase and LocalStorage
 *
 * @param {string} tableName - Supabase table name
 * @param {string} storageKey - LocalStorage key
 * @param {any} defaultValue - Default value if no data exists
 * @param {Object} options - Additional options
 * @returns {Object} { data, loading, error, save, remove, refresh }
 */
export function useSupabaseSync(tableName, storageKey, defaultValue = [], options = {}) {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [data, setData] = useState(() => loadFromStorage(storageKey, defaultValue));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const syncedRef = useRef(false);
  const userIdRef = useRef(null);
  // T31 FIX: Store defaultValue in ref to avoid infinite loop in useEffect
  const defaultValueRef = useRef(defaultValue);

  // Reset syncedRef when user changes (logout/login)
  // Fix: Explicitly handle logout to null
  // T31 FIX: Also clear in-memory state immediately to prevent UI flash of old data
  useEffect(() => {
    if (user?.id === undefined || user?.id === null) {
      syncedRef.current = false;
      userIdRef.current = null;
      setData(defaultValueRef.current); // T31: Clear state on logout
    } else if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      userIdRef.current = user?.id;
      setData(defaultValueRef.current); // T31: Clear state on user change to prevent UI flash
    }
  }, [user?.id]); // T31 FIX: Remove defaultValue from deps, use ref instead

  const {
    orderBy = 'created_at',
    orderDirection = 'desc',
    transformToSupabase = (d) => d,
    transformFromSupabase = (d) => d,
    onConflict = 'id', // Default onConflict column, can be overridden
    enabled = true, // Set to false to disable Supabase sync (localStorage only)
    limit = null, // Limit number of rows fetched (null = no limit)
  } = options;

  // Use refs to store transform functions to avoid infinite loops
  // (inline arrow functions in options create new references every render)
  const transformToSupabaseRef = useRef(transformToSupabase);
  const transformFromSupabaseRef = useRef(transformFromSupabase);

  // Update refs on every render (refs don't trigger re-renders)
  transformToSupabaseRef.current = transformToSupabase;
  transformFromSupabaseRef.current = transformFromSupabase;

  // Fetch data from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!enabled || !isSupabaseEnabled || !isAuthenticated || !supabase || !user?.id) {
      return null;
    }

    try {
      let query = supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)  // T31 FIX: Always filter by user_id (defense-in-depth)
        .order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply limit if specified (prevents timeout on large tables)
      if (limit) {
        query = query.limit(limit);
      }

      const { data: supabaseData, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      return supabaseData?.map(transformFromSupabaseRef.current) || [];
    } catch (err) {
      console.error(`Error fetching from ${tableName}:`, err);
      return null;
    }
  }, [enabled, isSupabaseEnabled, isAuthenticated, user?.id, tableName, orderBy, orderDirection, limit]);

  // Sync LocalStorage data to Supabase (on first login)
  const syncToSupabase = useCallback(async (localData) => {
    if (!enabled || !isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return;
    }

    try {
      // T31 FIX: Check if LocalStorage data belongs to a different user
      // This prevents migrating another user's data into the current user's Supabase
      const lastSyncedUserId = localStorage.getItem('prepwell_last_user_id');
      if (lastSyncedUserId && lastSyncedUserId !== user.id) {
        console.warn(`[T31] LocalStorage contains data from different user (${lastSyncedUserId}), skipping migration for ${tableName}`);
        // Clear the local storage for this table to prevent future issues
        localStorage.removeItem(storageKey);
        return;
      }

      // Check if user already has data in Supabase
      const { data: existingData } = await supabase
        .from(tableName)
        .select('id')
        .eq('user_id', user.id)  // T31 FIX: Filter by user_id
        .limit(1);

      if (existingData && existingData.length > 0) {
        // User has Supabase data, use that instead
        return;
      }

      // User has no Supabase data, migrate LocalStorage data
      if (Array.isArray(localData) && localData.length > 0) {
        const dataToInsert = localData.map(item => ({
          ...transformToSupabaseRef.current(item),
          user_id: user.id,
        }));

        const { error: insertError } = await supabase
          .from(tableName)
          .insert(dataToInsert);

        if (insertError) {
          console.error(`Error syncing to ${tableName}:`, insertError);
        } else {
          console.log(`Synced ${dataToInsert.length} items to ${tableName}`);
          // T31 FIX: Update last_user_id after successful sync
          localStorage.setItem('prepwell_last_user_id', user.id);
        }
      }
    } catch (err) {
      console.error(`Error in syncToSupabase for ${tableName}:`, err);
    }
  }, [enabled, isSupabaseEnabled, isAuthenticated, user, tableName, storageKey]);

  // Initial load and sync
  useEffect(() => {
    const initData = async () => {
      if (!isSupabaseEnabled || !isAuthenticated) {
        // Not authenticated - use LocalStorage
        return;
      }

      if (syncedRef.current) {
        return; // Already synced
      }

      setLoading(true);

      try {
        // Get local data first
        const localData = loadFromStorage(storageKey, defaultValue);

        // Try to sync local data to Supabase (for new users)
        await syncToSupabase(localData);

        // Then fetch from Supabase
        const supabaseData = await fetchFromSupabase();

        if (supabaseData !== null) {
          // BUGFIX: Merge local and Supabase data instead of overwriting
          // This prevents data loss when Supabase save hasn't completed yet
          if (Array.isArray(supabaseData) && Array.isArray(localData)) {
            const supabaseIds = new Set(supabaseData.map(item => item.id));

            // T18 Fix 2: Also deduplicate by importedFrom to prevent template duplicates
            const supabaseImportedFroms = new Set(
              supabaseData
                .filter(item => item.importedFrom)
                .map(item => item.importedFrom)
            );

            // Find local items that are NOT in Supabase (pending saves)
            // Skip items that already exist by ID OR by importedFrom (semantic duplicate)
            const localOnlyItems = localData.filter(item => {
              // Skip if ID already exists in Supabase
              if (supabaseIds.has(item.id)) return false;
              // Skip if importedFrom matches (prevents template duplicates)
              if (item.importedFrom && supabaseImportedFroms.has(item.importedFrom)) {
                console.log(`[useSupabaseSync] Skipping duplicate by importedFrom: ${item.importedFrom}`);
                return false;
              }
              return true;
            });

            if (localOnlyItems.length > 0) {
              // T25: Debug logging to identify sync bottlenecks
              console.log(`[useSupabaseSync] ${tableName}: ${localOnlyItems.length} local-only items to sync`);

              // Robust batch sync with chunking and fallback (T12 Fix 4)
              const CHUNK_SIZE = 100;
              const itemsToSync = localOnlyItems.map(item => ({
                ...transformToSupabaseRef.current(item),
                user_id: user.id,
              }));

              const totalItems = itemsToSync.length;
              const chunks = [];
              for (let i = 0; i < totalItems; i += CHUNK_SIZE) {
                chunks.push(itemsToSync.slice(i, i + CHUNK_SIZE));
              }

              console.log(`[useSupabaseSync] Syncing ${totalItems} local-only items in ${chunks.length} chunk(s)...`);

              let successCount = 0;
              let failedItems = [];

              for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
                const chunk = chunks[chunkIndex];
                try {
                  const { error: chunkError } = await supabase
                    .from(tableName)
                    .upsert(chunk, { onConflict });

                  if (chunkError) {
                    console.warn(`[useSupabaseSync] Chunk ${chunkIndex + 1}/${chunks.length} failed, trying individual inserts...`, chunkError.message);
                    // Fallback: try individual inserts for this chunk
                    for (const item of chunk) {
                      try {
                        const { error: itemError } = await supabase
                          .from(tableName)
                          .upsert(item, { onConflict });
                        if (itemError) {
                          console.error(`[useSupabaseSync] Item failed:`, { id: item.id, error: itemError.message });
                          failedItems.push({ id: item.id, error: itemError.message });
                        } else {
                          successCount++;
                        }
                      } catch (itemErr) {
                        console.error(`[useSupabaseSync] Item exception:`, { id: item.id, error: itemErr.message });
                        failedItems.push({ id: item.id, error: itemErr.message });
                      }
                    }
                  } else {
                    successCount += chunk.length;
                  }
                } catch (chunkErr) {
                  console.error(`[useSupabaseSync] Chunk ${chunkIndex + 1} exception:`, chunkErr.message);
                  failedItems.push(...chunk.map(item => ({ id: item.id, error: chunkErr.message })));
                }
              }

              // Summary log
              if (failedItems.length > 0) {
                console.warn(`[useSupabaseSync] Sync complete: ${successCount}/${totalItems} succeeded, ${failedItems.length} failed`);
              } else {
                console.log(`[useSupabaseSync] Successfully synced all ${totalItems} items`);
              }
              // Merge: Supabase data + local-only items
              const mergedData = [...supabaseData, ...localOnlyItems];

              // T18 Fix 4: Deduplicate merged data by importedFrom (keep oldest)
              // This cleans up any existing duplicates from Supabase
              const deduplicatedData = deduplicateByImportedFrom(mergedData);
              if (deduplicatedData.length < mergedData.length) {
                console.log(`[useSupabaseSync] Deduplicated ${mergedData.length - deduplicatedData.length} items by importedFrom`);
              }

              setData(deduplicatedData);
              saveToStorage(storageKey, deduplicatedData);
            } else {
              // T18 Fix 4: Also deduplicate when no local-only items
              const deduplicatedSupabase = deduplicateByImportedFrom(supabaseData);
              setData(deduplicatedSupabase);
              saveToStorage(storageKey, deduplicatedSupabase);
            }
          } else {
            // T18 Fix 4: Also deduplicate non-array or single Supabase data
            const deduplicatedSupabase = Array.isArray(supabaseData)
              ? deduplicateByImportedFrom(supabaseData)
              : supabaseData;
            setData(deduplicatedSupabase);
            saveToStorage(storageKey, deduplicatedSupabase);
          }
          syncedRef.current = true;
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    initData();
    // Note: defaultValue intentionally excluded - it's only for initial state and shouldn't trigger re-syncs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupabaseEnabled, isAuthenticated, fetchFromSupabase, syncToSupabase, storageKey, tableName, user?.id]);

  // Save data (to Supabase if authenticated, always to LocalStorage)
  const save = useCallback(async (newData, operation = 'upsert') => {
    // Always update local state and storage
    setData(newData);
    saveToStorage(storageKey, newData);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      if (operation === 'upsert' && Array.isArray(newData)) {
        // Batch upsert
        const dataToUpsert = newData.map(item => ({
          ...transformToSupabaseRef.current(item),
          user_id: user.id,
        }));

        const { error: upsertError } = await supabase
          .from(tableName)
          .upsert(dataToUpsert, { onConflict });

        if (upsertError) throw upsertError;
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error(`Error saving to ${tableName}:`, err);
      setError(err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [isSupabaseEnabled, isAuthenticated, user, tableName, storageKey, onConflict]);

  // Save single item
  const saveItem = useCallback(async (item) => {
    const itemWithId = {
      ...item,
      id: item.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    // Update local state
    const updatedData = Array.isArray(data)
      ? [...data.filter(d => d.id !== itemWithId.id), itemWithId]
      : itemWithId;

    setData(updatedData);
    saveToStorage(storageKey, updatedData);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, data: itemWithId, source: 'localStorage' };
    }

    try {
      const { data: savedData, error: saveError } = await supabase
        .from(tableName)
        .upsert({
          ...transformToSupabaseRef.current(itemWithId),
          user_id: user.id,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Update local with Supabase-generated ID if it was a local ID
      // T18 Fix: Check ALL local ID prefixes (local-, id-, content-, block-, etc.)
      const isLocalId = itemWithId.id && (
        itemWithId.id.startsWith('local-') ||
        itemWithId.id.startsWith('id-') ||
        itemWithId.id.startsWith('content-') ||
        itemWithId.id.startsWith('block-')
      );
      if (savedData && isLocalId) {
        const transformedData = transformFromSupabaseRef.current(savedData);
        const finalData = Array.isArray(data)
          ? [...data.filter(d => d.id !== itemWithId.id), transformedData]
          : transformedData;
        setData(finalData);
        saveToStorage(storageKey, finalData);
        return { success: true, data: transformedData, source: 'supabase' };
      }

      return { success: true, data: savedData, source: 'supabase' };
    } catch (err) {
      console.error(`Error saving item to ${tableName}:`, err);
      return { success: false, error: err, data: itemWithId, source: 'localStorage' };
    }
  }, [data, isSupabaseEnabled, isAuthenticated, user, tableName, storageKey]);

  // Remove item
  const removeItem = useCallback(async (itemId) => {
    // Update local state
    const updatedData = Array.isArray(data)
      ? data.filter(d => d.id !== itemId)
      : defaultValue;

    setData(updatedData);
    saveToStorage(storageKey, updatedData);

    // T31 FIX: Check user.id before Supabase operation
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user?.id) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // T31 FIX: Add user_id filter to DELETE query for defense-in-depth
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('user_id', user.id)
        .eq('id', itemId);

      if (deleteError) throw deleteError;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error(`Error deleting from ${tableName}:`, err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [data, isSupabaseEnabled, isAuthenticated, user?.id, tableName, storageKey, defaultValue]);

  // Refresh data from Supabase
  const refresh = useCallback(async () => {
    if (!isSupabaseEnabled || !isAuthenticated) {
      return;
    }

    setLoading(true);
    try {
      const supabaseData = await fetchFromSupabase();
      if (supabaseData !== null) {
        setData(supabaseData);
        saveToStorage(storageKey, supabaseData);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isSupabaseEnabled, isAuthenticated, fetchFromSupabase, storageKey]);

  return {
    data,
    setData, // For direct state updates (legacy compatibility)
    loading,
    error,
    save,
    saveItem,
    removeItem,
    refresh,
    isAuthenticated,
    isSupabaseEnabled,
  };
}

/**
 * Hook specifically for Content Plans (Lernpläne & Themenlisten)
 */
export function useContentPlansSync() {
  return useSupabaseSync('content_plans', STORAGE_KEYS.contentPlans, [], {
    enabled: true, // Supabase sync enabled
    orderBy: 'created_at',
    orderDirection: 'desc',
    transformToSupabase: (plan) => {
      // Filter out local IDs (various prefixes used) - let Supabase generate UUID
      const isLocalId = !plan.id || plan.id.startsWith('local-') || plan.id.startsWith('id-');
      // Map app mode values to database enum ('standard' | 'exam')
      // App uses 'examen' (German) but DB uses 'exam' (English)
      const dbMode = plan.mode === 'examen' ? 'exam' : (plan.mode || 'standard');
      return {
        id: isLocalId ? undefined : plan.id,
        name: plan.name,
        type: plan.type || 'themenliste',
        description: plan.description || '',
        mode: dbMode,
        exam_date: plan.examDate || null,
        archived: plan.archived || false,
        is_published: plan.isPublished || false,
        // PW-021: rechtsgebiete DEPRECATED - always empty, use T27 flat structure
        rechtsgebiete: [],
        imported_from: plan.importedFrom || null,
        // T27/T32: Flat structure is now the ONLY structure for Themenlisten
        status: plan.status || 'draft',
        selected_areas: plan.selectedAreas || [],
        themen: plan.themen || [],
        kapitel: plan.kapitel || [],
        use_kapitel: plan.useKapitel || false,
      };
    },
    transformFromSupabase: (row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      // Map DB enum back to app value ('exam' -> 'examen')
      mode: row.mode === 'exam' ? 'examen' : row.mode,
      examDate: row.exam_date,
      archived: row.archived,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      // PW-021: rechtsgebiete DEPRECATED - not read anymore, migration converts to T27
      importedFrom: row.imported_from,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // T27/T32: Flat structure is now the ONLY structure for Themenlisten
      status: row.status || 'draft',
      selectedAreas: row.selected_areas || [],
      themen: row.themen || [],
      kapitel: row.kapitel || [],
      useKapitel: row.use_kapitel || false,
    }),
  });
}

/**
 * Hook for Published Themenlisten (Community)
 */
export function usePublishedThemenlistenSync() {
  return useSupabaseSync('published_themenlisten', STORAGE_KEYS.publishedThemenlisten, [], {
    enabled: true, // Supabase sync enabled
    orderBy: 'published_at',
    orderDirection: 'desc',
    transformToSupabase: (plan) => ({
      id: plan.id?.startsWith('local-') || plan.id?.startsWith('id-') ? undefined : plan.id,
      source_plan_id: plan.sourceId,
      name: plan.name,
      description: plan.description || '',
      mode: plan.mode || 'standard',
      stats: plan.stats || {},
      gewichtung: plan.gewichtung || {},
      rechtsgebiete: plan.rechtsgebiete || [],
      tags: plan.tags || [],
      published_at: plan.publishedAt || new Date().toISOString(),
    }),
    transformFromSupabase: (row) => ({
      id: row.id,
      sourceId: row.source_plan_id,
      name: row.name,
      description: row.description,
      mode: row.mode,
      stats: row.stats,
      gewichtung: row.gewichtung,
      rechtsgebiete: row.rechtsgebiete || [],
      tags: row.tags || [],
      publishedAt: row.published_at,
    }),
  });
}

/**
 * Hook for Exams (Leistungen)
 */
export function useExamsSync() {
  return useSupabaseSync('leistungen', STORAGE_KEYS.exams, [], {
    orderBy: 'exam_date',
    orderDirection: 'desc',
    transformToSupabase: (exam) => ({
      id: exam.id?.startsWith('local-') ? undefined : exam.id,
      subject: exam.subject,
      title: exam.title || exam.topic,
      description: exam.description,
      exam_date: exam.date || exam.examDate,
      exam_time: exam.time,
      grade: exam.grade,
      grade_system: exam.gradeSystem || 'punkte',
      ects: exam.ects,
      semester: exam.semester,
      status: exam.status || 'ausstehend',
    }),
    transformFromSupabase: (row) => ({
      id: row.id,
      subject: row.subject,
      topic: row.title,
      description: row.description,
      date: row.exam_date,
      time: row.exam_time,
      grade: row.grade,
      gradeSystem: row.grade_system,
      ects: row.ects,
      semester: row.semester,
      status: row.status,
      createdAt: row.created_at,
    }),
  });
}

/**
 * Hook for Semester-Leistungen (T28 - Normal Mode)
 * Completely separate from Übungsklausuren (Exam Mode)
 */
export function useSemesterLeistungenSync() {
  return useSupabaseSync('semester_leistungen', STORAGE_KEYS.semesterLeistungen, [], {
    orderBy: 'datum',
    orderDirection: 'desc',
    transformToSupabase: (leistung) => ({
      id: leistung.id?.startsWith('local-') ? undefined : leistung.id,
      rechtsgebiet: leistung.rechtsgebiet,
      titel: leistung.titel,
      beschreibung: leistung.beschreibung,
      semester: leistung.semester,
      datum: leistung.datum,
      uhrzeit: leistung.uhrzeit,
      ects: leistung.ects,
      note: leistung.note,
      noten_system: leistung.notenSystem || 'punkte',
      status: leistung.status || 'ausstehend',
      in_kalender: leistung.inKalender || false,
    }),
    transformFromSupabase: (row) => ({
      id: row.id,
      rechtsgebiet: row.rechtsgebiet,
      titel: row.titel,
      beschreibung: row.beschreibung,
      semester: row.semester,
      datum: row.datum,
      uhrzeit: row.uhrzeit,
      ects: row.ects,
      note: row.note,
      notenSystem: row.noten_system,
      status: row.status,
      inKalender: row.in_kalender,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  });
}

/**
 * Hook for Übungsklausuren
 */
export function useUebungsklausurenSync() {
  return useSupabaseSync('uebungsklausuren', STORAGE_KEYS.uebungsklausuren, [], {
    orderBy: 'exam_date',
    orderDirection: 'desc',
    transformToSupabase: (klausur) => ({
      id: klausur.id?.startsWith('local-') ? undefined : klausur.id,
      title: klausur.title || klausur.topic,
      rechtsgebiet: klausur.rechtsgebiet || klausur.subject,
      description: klausur.description,
      exam_date: klausur.date || klausur.examDate,
      punkte: klausur.punkte || klausur.grade,
    }),
    transformFromSupabase: (row) => ({
      id: row.id,
      topic: row.title,
      subject: row.rechtsgebiet,
      description: row.description,
      date: row.exam_date,
      grade: row.punkte,
      createdAt: row.created_at,
    }),
  });
}

/**
 * Hook for Check-In Responses
 * Note: checkin_responses has UNIQUE(user_id, response_date, period) constraint
 * Uses correct onConflict for proper upsert behavior.
 */
export function useCheckInSync() {
  return useSupabaseSync('checkin_responses', STORAGE_KEYS.checkinResponses, [], {
    orderBy: 'response_date',
    orderDirection: 'desc',
    // Fix: Use correct onConflict for checkin_responses table
    onConflict: 'user_id,response_date,period',
    transformToSupabase: (response) => ({
      response_date: response.date || response.responseDate,
      period: response.period || 'morning',
      mood: response.mood,
      energy: response.energy,
      focus: response.focus,
      stress: response.stress,
      notes: response.notes,
    }),
    transformFromSupabase: (row) => ({
      id: row.id,
      date: row.response_date,
      period: row.period || 'morning',
      mood: row.mood,
      energy: row.energy,
      focus: row.focus,
      stress: row.stress,
      notes: row.notes,
      createdAt: row.created_at,
    }),
  });
}

/**
 * Hook for Timer Sessions (History)
 * PW-035: DISABLED - Timer sessions are now managed directly in timer-context.jsx
 * with the new schema (started_at, ended_at, duration_ms, status).
 * This prevents duplicate sessions caused by bidirectional sync with ID mismatch.
 */
export function useTimerHistorySync() {
  // Return no-op interface - timer-context.jsx handles everything directly
  return {
    data: [],
    loading: false,
    error: null,
    sync: () => Promise.resolve(),
    saveItem: () => Promise.resolve(),
    deleteItem: () => Promise.resolve(),
    isAuthenticated: false,
    isInitialized: true
  };
}

/**
 * Hook for Logbuch Entries (manual time tracking)
 */
export function useLogbuchSync() {
  return useSupabaseSync('logbuch_entries', STORAGE_KEYS.logbuchEntries, [], {
    orderBy: 'entry_date',
    orderDirection: 'desc',
    transformToSupabase: (entry) => ({
      id: entry.id?.startsWith('logbuch-') || entry.id?.startsWith('local-') ? undefined : entry.id,
      entry_date: entry.date,
      start_time: entry.startTime,
      end_time: entry.endTime,
      rechtsgebiet: entry.rechtsgebiet,
      duration_minutes: entry.durationMinutes,
      notes: entry.notes,
    }),
    transformFromSupabase: (row) => ({
      id: row.id,
      date: row.entry_date,
      startTime: row.start_time,
      endTime: row.end_time,
      rechtsgebiet: row.rechtsgebiet,
      durationMinutes: row.duration_minutes,
      notes: row.notes,
      createdAt: row.created_at,
    }),
  });
}

/**
 * Hook for User Settings (includes mentor_activated, grade_system, timer_settings)
 */
export function useUserSettingsSync() {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [settings, setSettings] = useState(() => ({
    mentorActivated: loadFromStorage(STORAGE_KEYS.mentorActivated, false),
    gradeSystem: loadFromStorage(STORAGE_KEYS.gradeSystem, 'punkte'),
    timerConfig: loadFromStorage(STORAGE_KEYS.timerConfig, {}),
    subjectSettings: loadFromStorage(STORAGE_KEYS.subjectSettings, { colorOverrides: {}, customSubjects: [] }),
    studiengang: loadFromStorage(STORAGE_KEYS.studiengang, null), // T7
    themenlisteKapitelDefault: loadFromStorage(STORAGE_KEYS.themenlisteKapitelDefault, false), // T27
    kapitelEbeneAktiviert: loadFromStorage(STORAGE_KEYS.kapitelEbeneAktiviert, false), // T22
  }));
  const [loading, setLoading] = useState(false);

  // Fetch settings from Supabase
  useEffect(() => {
    const fetchSettings = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          console.error('Error fetching settings:', error);
          return;
        }

        if (data) {
          const newSettings = {
            mentorActivated: data.mentor_activated,
            gradeSystem: data.preferred_grade_system,
            timerConfig: data.timer_settings || {},
            subjectSettings: data.subject_settings || { colorOverrides: {}, customSubjects: [] },
            studiengang: data.studiengang || null, // T7
            themenlisteKapitelDefault: data.themenliste_kapitel_default ?? false, // T27
            kapitelEbeneAktiviert: data.kapitel_ebene_aktiviert ?? false, // T22
          };
          setSettings(newSettings);
          // Update local storage
          saveToStorage(STORAGE_KEYS.mentorActivated, newSettings.mentorActivated);
          saveToStorage(STORAGE_KEYS.gradeSystem, newSettings.gradeSystem);
          saveToStorage(STORAGE_KEYS.timerConfig, newSettings.timerConfig);
          saveToStorage(STORAGE_KEYS.subjectSettings, newSettings.subjectSettings);
          saveToStorage(STORAGE_KEYS.studiengang, newSettings.studiengang); // T7
          saveToStorage(STORAGE_KEYS.themenlisteKapitelDefault, newSettings.themenlisteKapitelDefault); // T27
          saveToStorage(STORAGE_KEYS.kapitelEbeneAktiviert, newSettings.kapitelEbeneAktiviert); // T22
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  // Update settings
  const updateSettings = useCallback(async (updates) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    // Always update localStorage
    if (updates.mentorActivated !== undefined) {
      saveToStorage(STORAGE_KEYS.mentorActivated, updates.mentorActivated);
    }
    if (updates.gradeSystem !== undefined) {
      saveToStorage(STORAGE_KEYS.gradeSystem, updates.gradeSystem);
    }
    if (updates.timerConfig !== undefined) {
      saveToStorage(STORAGE_KEYS.timerConfig, updates.timerConfig);
    }
    if (updates.subjectSettings !== undefined) {
      saveToStorage(STORAGE_KEYS.subjectSettings, updates.subjectSettings);
    }
    if (updates.studiengang !== undefined) {
      saveToStorage(STORAGE_KEYS.studiengang, updates.studiengang); // T7
    }
    if (updates.themenlisteKapitelDefault !== undefined) {
      saveToStorage(STORAGE_KEYS.themenlisteKapitelDefault, updates.themenlisteKapitelDefault); // T27
    }
    if (updates.kapitelEbeneAktiviert !== undefined) {
      saveToStorage(STORAGE_KEYS.kapitelEbeneAktiviert, updates.kapitelEbeneAktiviert); // T22
    }

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Read current timer_settings to preserve lernplanMetadata (avoid race condition)
      const { data: currentData } = await supabase
        .from('user_settings')
        .select('timer_settings')
        .eq('user_id', user.id)
        .single();

      // Merge timerConfig with existing timer_settings (preserve lernplanMetadata)
      const currentTimerSettings = currentData?.timer_settings || {};
      const mergedTimerSettings = {
        ...currentTimerSettings,
        ...newSettings.timerConfig,
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          mentor_activated: newSettings.mentorActivated,
          preferred_grade_system: newSettings.gradeSystem,
          timer_settings: mergedTimerSettings,
          subject_settings: newSettings.subjectSettings,
          studiengang: newSettings.studiengang, // T7
          themenliste_kapitel_default: newSettings.themenlisteKapitelDefault, // T27
          kapitel_ebene_aktiviert: newSettings.kapitelEbeneAktiviert, // T22
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error updating settings:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [settings, isSupabaseEnabled, isAuthenticated, user?.id]);

  return {
    settings,
    loading,
    updateSettings,
  };
}

/**
 * Hook for Wizard Draft (single object per user)
 * Uses wizard_drafts table with UNIQUE(user_id)
 */
export function useWizardDraftSync() {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [draft, setDraft] = useState(() => loadFromStorage(STORAGE_KEYS.wizardDraft, null));
  const [loading, setLoading] = useState(false);
  const syncedRef = useRef(false);
  const userIdRef = useRef(null);

  // Reset syncedRef when user changes (logout/login)
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      userIdRef.current = user?.id || null;
    }
  }, [user?.id]);

  // Fetch draft from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('wizard_drafts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (no draft exists)
        console.error('Error fetching wizard draft:', error);
        return null;
      }

      if (data) {
        // Reconstruct draft from Supabase data
        return {
          ...data.wizard_data,
          currentStep: data.current_step,
          lastModified: data.updated_at,
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching wizard draft:', err);
      return null;
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  // Initial sync on login
  useEffect(() => {
    const initDraft = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || syncedRef.current) {
        return;
      }

      setLoading(true);
      try {
        // Check if user has Supabase draft
        const supabaseDraft = await fetchFromSupabase();
        const localDraft = loadFromStorage(STORAGE_KEYS.wizardDraft, null);

        if (supabaseDraft) {
          // Supabase draft exists - use it (cloud is source of truth)
          setDraft(supabaseDraft);
          saveToStorage(STORAGE_KEYS.wizardDraft, supabaseDraft);
        } else if (localDraft && localDraft.currentStep > 1) {
          // No Supabase draft but local draft exists - sync to Supabase
          await saveDraft(localDraft);
        }

        syncedRef.current = true;
      } finally {
        setLoading(false);
      }
    };

    initDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupabaseEnabled, isAuthenticated, fetchFromSupabase]);

  // Save draft (to both localStorage and Supabase)
  const saveDraft = useCallback(async (draftData) => {
    const draftWithTimestamp = {
      ...draftData,
      lastModified: new Date().toISOString(),
    };

    // Always update local state and storage
    setDraft(draftWithTimestamp);
    saveToStorage(STORAGE_KEYS.wizardDraft, draftWithTimestamp);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Extract currentStep for separate column
      const { currentStep, ...wizardData } = draftWithTimestamp;

      const { error } = await supabase
        .from('wizard_drafts')
        .upsert({
          user_id: user.id,
          current_step: currentStep || 1,
          wizard_data: wizardData,
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error saving wizard draft:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  // Clear draft (from both localStorage and Supabase)
  const clearDraft = useCallback(async () => {
    setDraft(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.wizardDraft);
    } catch (e) {
      console.error('Error removing wizard draft from localStorage:', e);
    }

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      const { error } = await supabase
        .from('wizard_drafts')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error clearing wizard draft:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  // Check if draft exists
  const hasDraft = useCallback(() => {
    return draft && draft.currentStep > 1;
  }, [draft]);

  return {
    draft,
    loading,
    saveDraft,
    clearDraft,
    hasDraft,
    isAuthenticated,
    isSupabaseEnabled,
  };
}

/**
 * Hook for Calendar Blocks (blocksByDate)
 * Transforms between date-keyed object format and flat array
 */
export function useCalendarBlocksSync() {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [blocksByDate, setBlocksByDate] = useState(() => {
    // KA-002 FIX: Load and cleanup empty arrays from localStorage
    const rawData = loadFromStorage(STORAGE_KEYS.blocks, {});
    const cleanedData = cleanupEmptyArrays(rawData);

    // Persist cleaned data back to localStorage if there were changes
    if (Object.keys(rawData).length !== Object.keys(cleanedData).length) {
      saveToStorage(STORAGE_KEYS.blocks, cleanedData);
    }

    return cleanedData;
  });
  const [loading, setLoading] = useState(false);
  const syncedRef = useRef(false);
  const userIdRef = useRef(null);

  // Reset syncedRef when user changes (logout/login)
  // T31 FIX: Also clear in-memory state immediately to prevent UI flash of old data
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      userIdRef.current = user?.id || null;
      // T31: Clear state immediately on user change
      if (user?.id === null || user?.id === undefined) {
        setBlocksByDate({});
      } else if (userIdRef.current !== null) {
        // Different user logged in - clear old data
        setBlocksByDate({});
      }
    }
  }, [user?.id]);

  // Transform flat array from Supabase to date-keyed object
  const transformFromSupabase = useCallback((rows) => {
    const result = {};
    rows.forEach(row => {
      const dateKey = row.block_date;
      if (!result[dateKey]) {
        result[dateKey] = [];
      }
      // KA-002 FIX: Set status based on whether block has content
      // A block is 'empty' if it has no title, no content_id, and no rechtsgebiet
      // Also consider rechtsgebiet since wizard blocks often have it even without title
      const hasContent = !!(row.title || row.content_id || row.rechtsgebiet);
      const status = hasContent ? 'occupied' : 'empty';

      result[dateKey].push({
        id: row.id,
        contentId: row.content_id,
        contentPlanId: row.content_plan_id,
        position: row.position,
        title: row.title,
        // KA-002 FIX: Also map to topicTitle for backwards compatibility with frontend code
        topicTitle: row.title,
        status, // KA-002 FIX: Add status field for freeBlocks counting
        rechtsgebiet: row.rechtsgebiet,
        unterrechtsgebiet: row.unterrechtsgebiet,
        blockType: row.block_type,
        isLocked: row.is_locked,
        isFromLernplan: row.is_from_lernplan,
        // PRD: BlockAllocation hat KEINE Zeit-Felder (nur position 1-4)
        // Zeit-basierte Sessions gehören in time_sessions, nicht hier
        repeatEnabled: row.repeat_enabled,
        repeatType: row.repeat_type,
        repeatCount: row.repeat_count,
        seriesId: row.series_id,
        customDays: row.custom_days,
        tasks: row.tasks || [],
        metadata: row.metadata || {},
        createdAt: row.created_at,
      });
    });
    return result;
  }, []);

  // Transform date-keyed object to flat array for Supabase
  const transformToSupabase = useCallback((blocksByDateObj, userId) => {
    const result = [];
    // Guard against null/undefined blocksByDateObj
    if (!blocksByDateObj || typeof blocksByDateObj !== 'object') {
      return result;
    }
    Object.entries(blocksByDateObj).forEach(([dateKey, blocks]) => {
      // Guard against null/undefined blocks array
      if (!blocks || !Array.isArray(blocks)) return;
      blocks.forEach(block => {
        // UUID validation regex (standard UUID format: 8-4-4-4-12 hex chars)
        const isValidUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        // Check if ID should be auto-generated: null, undefined, local prefixes, or invalid UUID format
        // T19 FIX: Also catch IDs like "2026-01-14-1" (date-position format) that aren't valid UUIDs
        const needsNewId = !block.id ||
          block.id?.startsWith('block-') ||
          block.id?.startsWith('local-') ||
          block.id?.startsWith('private-') ||
          !isValidUuid(block.id);
        // Generate a new UUID if needed (prevents "invalid input syntax for type uuid" error)
        const blockId = needsNewId ? crypto.randomUUID() : block.id;
        // Ensure position is an integer within valid range (DB: CHECK position >= 1 AND position <= 4)
        const rawPos = block.position != null ? Math.floor(Number(block.position)) : null;
        const positionInt = (rawPos !== null && rawPos >= 1 && rawPos <= 4) ? rawPos : null;
        result.push({
          id: blockId,
          user_id: userId,
          block_date: dateKey,
          content_id: block.contentId,
          content_plan_id: block.contentPlanId || null,
          position: positionInt,
          // KA-002 FIX: Map both title and topicTitle (wizard uses topicTitle)
          title: block.title || block.topicTitle,
          rechtsgebiet: block.rechtsgebiet,
          unterrechtsgebiet: block.unterrechtsgebiet,
          block_type: block.blockType || 'lernblock',
          is_locked: block.isLocked || false,
          is_from_lernplan: block.isFromLernplan || false,
          // PRD: BlockAllocation hat KEINE Zeit-Felder (nur position 1-4)
          // Zeit-basierte Sessions gehören in time_sessions, nicht hier
          repeat_enabled: block.repeatEnabled || false,
          repeat_type: block.repeatType,
          repeat_count: block.repeatCount,
          series_id: block.seriesId,
          custom_days: block.customDays,
          tasks: block.tasks || [],
          metadata: block.metadata || {},
        });
      });
    });
    return result;
  }, []);

  // Fetch from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user?.id) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('calendar_blocks')
        .select('*')
        .eq('user_id', user.id)  // T31 FIX: Always filter by user_id
        .order('block_date', { ascending: true });

      if (error) throw error;
      return transformFromSupabase(data || []);
    } catch (err) {
      console.error('Error fetching calendar blocks:', err);
      return null;
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id, transformFromSupabase]);

  // Initial sync on login
  useEffect(() => {
    const initSync = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || !user?.id || syncedRef.current) {
        return;
      }

      setLoading(true);
      try {
        // T31 FIX: Check if LocalStorage data belongs to a different user
        const lastSyncedUserId = localStorage.getItem('prepwell_last_user_id');
        const isLocalDataFromDifferentUser = lastSyncedUserId && lastSyncedUserId !== user.id;

        if (isLocalDataFromDifferentUser) {
          console.warn('[T31] calendar_blocks: LocalStorage contains data from different user, clearing...');
          localStorage.removeItem(STORAGE_KEYS.blocks);
          setBlocksByDate({});
        }

        // Check if user has Supabase data
        const { data: existingData } = await supabase
          .from('calendar_blocks')
          .select('id')
          .eq('user_id', user.id)  // T31 FIX: Filter by user_id
          .limit(1);

        if (existingData && existingData.length > 0) {
          // User has Supabase data - use it
          const supabaseData = await fetchFromSupabase();
          if (supabaseData) {
            // KA-002 FIX: Also cleanup Supabase data (might have old empty arrays)
            const cleanedSupabaseData = cleanupEmptyArrays(supabaseData);
            setBlocksByDate(cleanedSupabaseData);
            saveToStorage(STORAGE_KEYS.blocks, cleanedSupabaseData);
          }
        } else if (!isLocalDataFromDifferentUser) {
          // No Supabase data AND local data is from same user - migrate from localStorage
          const localData = loadFromStorage(STORAGE_KEYS.blocks, {});
          if (Object.keys(localData).length > 0) {
            const dataToInsert = transformToSupabase(localData, user.id);
            if (dataToInsert.length > 0) {
              // Use upsert to handle duplicates (prevents 400 error on existing IDs)
              const { error } = await supabase.from('calendar_blocks').upsert(dataToInsert, { onConflict: 'id' });
              if (error) {
                console.error('[initSync] Migration failed:', {
                  message: error.message,
                  details: error.details,
                  hint: error.hint,
                  code: error.code,
                  sampleData: dataToInsert.slice(0, 3)
                });
              } else {
                console.log(`Migrated ${dataToInsert.length} blocks to Supabase`);
              }
            }
          }
        }

        // T31 FIX: Update last_user_id after successful sync
        localStorage.setItem('prepwell_last_user_id', user.id);
        syncedRef.current = true;
      } catch (err) {
        console.error('Error syncing calendar blocks:', err);
      } finally {
        setLoading(false);
      }
    };

    initSync();
  }, [isSupabaseEnabled, isAuthenticated, user?.id, fetchFromSupabase, transformToSupabase]);

  // Save blocks for a specific date
  const saveDayBlocks = useCallback(async (dateKey, blocks) => {
    const updated = { ...blocksByDate, [dateKey]: blocks };
    if (blocks.length === 0) {
      delete updated[dateKey];
    }
    setBlocksByDate(updated);
    saveToStorage(STORAGE_KEYS.blocks, updated);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Delete existing blocks for this date, then insert new ones
      // T31 FIX: Also filter by user_id for defense-in-depth
      await supabase
        .from('calendar_blocks')
        .delete()
        .eq('user_id', user.id)
        .eq('block_date', dateKey);

      if (blocks.length > 0) {
        const dataToInsert = blocks.map(block => {
          // UUID validation regex (standard UUID format: 8-4-4-4-12 hex chars)
          const isValidUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
          // Check if ID should be auto-generated: null, undefined, local prefixes, or invalid UUID format
          // T19 FIX: Also catch IDs like "2026-01-14-1" (date-position format) that aren't valid UUIDs
          const needsNewId = !block.id ||
            block.id?.startsWith('block-') ||
            block.id?.startsWith('local-') ||
            block.id?.startsWith('private-') ||
            !isValidUuid(block.id);
          // Generate a new UUID if needed (prevents "invalid input syntax for type uuid" error)
          const blockId = needsNewId ? crypto.randomUUID() : block.id;
          // Ensure position is an integer within valid range (DB: CHECK position >= 1 AND position <= 4)
          const rawPos = block.position != null ? Math.floor(Number(block.position)) : null;
          const positionInt = (rawPos !== null && rawPos >= 1 && rawPos <= 4) ? rawPos : null;
          return {
            id: blockId,
            user_id: user.id,
            block_date: dateKey,
            content_id: block.contentId,
            content_plan_id: block.contentPlanId || null,
            position: positionInt,
            title: block.title,
            rechtsgebiet: block.rechtsgebiet,
            unterrechtsgebiet: block.unterrechtsgebiet,
            block_type: block.blockType || 'lernblock',
            is_locked: block.isLocked || false,
            is_from_lernplan: block.isFromLernplan || false,
            // PRD: BlockAllocation hat KEINE Zeit-Felder
            repeat_enabled: block.repeatEnabled || false,
            repeat_type: block.repeatType,
            repeat_count: block.repeatCount,
            series_id: block.seriesId,
            custom_days: block.customDays,
            tasks: block.tasks || [],
            metadata: block.metadata || {},
          };
        });

        // Use upsert to handle any edge case duplicates
        const { error, data } = await supabase
          .from('calendar_blocks')
          .upsert(dataToInsert, { onConflict: 'id' })
          .select();

        if (error) {
          console.error('[saveDayBlocks] Supabase error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            dataToInsert: dataToInsert
          });
          throw error;
        }
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error saving calendar blocks:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [blocksByDate, isSupabaseEnabled, isAuthenticated, user?.id]);

  // Save all blocks (for bulk operations like wizard)
  const saveAllBlocks = useCallback(async (newBlocksByDate) => {
    setBlocksByDate(newBlocksByDate);
    saveToStorage(STORAGE_KEYS.blocks, newBlocksByDate);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Delete all existing blocks
      // T31 FIX: Also filter by user_id for defense-in-depth
      await supabase
        .from('calendar_blocks')
        .delete()
        .eq('user_id', user.id)
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all for this user

      // Insert new blocks (use upsert for safety)
      const dataToInsert = transformToSupabase(newBlocksByDate, user.id);
      if (dataToInsert.length > 0) {
        const { error, data } = await supabase
          .from('calendar_blocks')
          .upsert(dataToInsert, { onConflict: 'id' })
          .select();

        if (error) {
          console.error('[saveAllBlocks] Supabase error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            sampleData: dataToInsert.slice(0, 3)
          });
          throw error;
        }
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error saving all calendar blocks:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [isSupabaseEnabled, isAuthenticated, user, transformToSupabase]);

  // Clear all blocks
  const clearAllBlocks = useCallback(async () => {
    setBlocksByDate({});
    saveToStorage(STORAGE_KEYS.blocks, {});

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user?.id) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // T31 FIX: Also filter by user_id for defense-in-depth
      await supabase
        .from('calendar_blocks')
        .delete()
        .eq('user_id', user.id)
        .neq('id', '00000000-0000-0000-0000-000000000000');

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error clearing calendar blocks:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  return {
    blocksByDate,
    setBlocksByDate: saveAllBlocks,
    saveDayBlocks,
    clearAllBlocks,
    loading,
    isAuthenticated,
    isSupabaseEnabled,
  };
}

/**
 * Hook for Calendar Tasks (tasksByDate)
 * Transforms between date-keyed object format and flat array
 */
export function useCalendarTasksSync() {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [tasksByDate, setTasksByDate] = useState(() =>
    loadFromStorage(STORAGE_KEYS.tasks, {})
  );
  const [loading, setLoading] = useState(false);
  const syncedRef = useRef(false);
  const userIdRef = useRef(null);

  // Reset syncedRef when user changes (logout/login)
  // T31 FIX: Also clear in-memory state immediately to prevent UI flash of old data
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      const previousUserId = userIdRef.current;
      userIdRef.current = user?.id || null;
      // T31: Clear state immediately on user change
      if (previousUserId !== null && user?.id !== previousUserId) {
        setTasksByDate({});
      }
    }
  }, [user?.id]);

  // Transform flat array from Supabase to date-keyed object
  const transformFromSupabase = useCallback((rows) => {
    // T17 FIX: Map DB priorities back to app values
    // DB stores: 'low', 'medium', 'high'
    // App uses: 'none' (no !), 'medium' (1x !), 'high' (2x !!)
    const mapPriorityFromDb = (p) => {
      if (p === 'low') return 'none';
      if (p === 'medium') return 'medium';
      if (p === 'high') return 'high';
      return 'none'; // default
    };

    const result = {};
    rows.forEach(row => {
      const dateKey = row.task_date;
      if (!result[dateKey]) {
        result[dateKey] = [];
      }
      result[dateKey].push({
        id: row.id,
        title: row.title,
        description: row.description,
        priority: mapPriorityFromDb(row.priority),
        completed: row.completed,
        linkedBlockId: row.linked_block_id,
        metadata: row.metadata || {},
        createdAt: row.created_at,
      });
    });
    return result;
  }, []);

  // Fetch from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user?.id) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('calendar_tasks')
        .select('*')
        .eq('user_id', user.id)  // T31 FIX: Always filter by user_id
        .order('task_date', { ascending: true });

      if (error) throw error;
      return transformFromSupabase(data || []);
    } catch (err) {
      console.error('Error fetching calendar tasks:', err);
      return null;
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id, transformFromSupabase]);

  // Initial sync on login
  useEffect(() => {
    const initSync = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || !user?.id || syncedRef.current) {
        return;
      }

      setLoading(true);
      try {
        // T31 FIX: Check if LocalStorage data belongs to a different user
        const lastSyncedUserId = localStorage.getItem('prepwell_last_user_id');
        const isLocalDataFromDifferentUser = lastSyncedUserId && lastSyncedUserId !== user.id;

        if (isLocalDataFromDifferentUser) {
          console.warn('[T31] calendar_tasks: LocalStorage contains data from different user, clearing...');
          localStorage.removeItem(STORAGE_KEYS.tasks);
          setTasksByDate({});
        }

        const { data: existingData } = await supabase
          .from('calendar_tasks')
          .select('id')
          .eq('user_id', user.id)  // T31 FIX: Filter by user_id
          .limit(1);

        if (existingData && existingData.length > 0) {
          const supabaseData = await fetchFromSupabase();
          if (supabaseData) {
            setTasksByDate(supabaseData);
            saveToStorage(STORAGE_KEYS.tasks, supabaseData);
          }
        } else if (!isLocalDataFromDifferentUser) {
          // Migrate from localStorage only if data is from same user
          const localData = loadFromStorage(STORAGE_KEYS.tasks, {});
          const dataToInsert = [];
          // T17 FIX: Map app priorities to DB values
          // App uses: 'none' (no !), 'medium' (1x !), 'high' (2x !!)
          // DB expects: 'low', 'medium', 'high'
          const mapPriorityToDb = (p) => {
            if (p === 'none' || p === 'low') return 'low';
            if (p === 'medium') return 'medium';
            if (p === 'high') return 'high';
            return 'low'; // default for null/undefined/invalid
          };
          Object.entries(localData).forEach(([dateKey, tasks]) => {
            tasks.forEach(task => {
              const validPriority = mapPriorityToDb(task.priority);
              dataToInsert.push({
                user_id: user.id,
                task_date: dateKey,
                title: task.title,
                description: task.description,
                priority: validPriority,
                completed: task.completed || false,
                linked_block_id: task.linkedBlockId || null,
                metadata: task.metadata || {},
              });
            });
          });

          if (dataToInsert.length > 0) {
            await supabase.from('calendar_tasks').insert(dataToInsert);
            console.log(`Migrated ${dataToInsert.length} tasks to Supabase`);
          }
        }

        // T31 FIX: Update last_user_id after successful sync
        localStorage.setItem('prepwell_last_user_id', user.id);
        syncedRef.current = true;
      } catch (err) {
        console.error('Error syncing calendar tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    initSync();
  }, [isSupabaseEnabled, isAuthenticated, user?.id, fetchFromSupabase]);

  // Save tasks for a specific date
  const saveDayTasks = useCallback(async (dateKey, tasks) => {
    const updated = { ...tasksByDate, [dateKey]: tasks };
    if (tasks.length === 0) {
      delete updated[dateKey];
    }
    setTasksByDate(updated);
    saveToStorage(STORAGE_KEYS.tasks, updated);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Delete existing tasks for this date
      // T31 FIX: Also filter by user_id for defense-in-depth
      await supabase
        .from('calendar_tasks')
        .delete()
        .eq('user_id', user.id)
        .eq('task_date', dateKey);

      // Insert new tasks
      if (tasks.length > 0) {
        // T17 FIX: Map app priorities to DB values
        // App uses: 'none' (no !), 'medium' (1x !), 'high' (2x !!)
        // DB expects: 'low', 'medium', 'high'
        const mapPriorityToDb = (p) => {
          if (p === 'none' || p === 'low') return 'low';
          if (p === 'medium') return 'medium';
          if (p === 'high') return 'high';
          return 'low'; // default for null/undefined/invalid
        };

        const dataToInsert = tasks.map(task => {
          // T17 FIX: Only include id if it's a valid UUID (not null/undefined/local prefix)
          const isValidId = task.id &&
            !task.id.startsWith('task-') &&
            !task.id.startsWith('local-');

          const validPriority = mapPriorityToDb(task.priority);

          return {
            ...(isValidId && { id: task.id }),
            user_id: user.id,
            task_date: dateKey,
            title: task.title,
            description: task.description,
            priority: validPriority,
            completed: task.completed || false,
            linked_block_id: task.linkedBlockId || null,
            metadata: task.metadata || {},
          };
        });

        const { error } = await supabase
          .from('calendar_tasks')
          .insert(dataToInsert);

        if (error) throw error;
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error saving calendar tasks:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [tasksByDate, isSupabaseEnabled, isAuthenticated, user?.id]);

  // Update a single task
  const updateTask = useCallback(async (dateKey, taskId, updates) => {
    const currentTasks = tasksByDate[dateKey] || [];
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
    );
    return saveDayTasks(dateKey, updatedTasks);
  }, [tasksByDate, saveDayTasks]);

  return {
    tasksByDate,
    setTasksByDate,
    saveDayTasks,
    updateTask,
    loading,
    isAuthenticated,
    isSupabaseEnabled,
  };
}

/**
 * Hook for Private Blocks (privateSessionsByDate)
 */
// Helper to filter out invalid date keys from date-keyed objects
// T25: Also saves cleaned data back to storage to prevent repeated warnings
const filterValidDateKeys = (dateKeyedObj, storageKey = null) => {
  if (!dateKeyedObj || typeof dateKeyedObj !== 'object') return {};
  const result = {};
  let hadInvalidKeys = false;
  Object.entries(dateKeyedObj).forEach(([key, value]) => {
    // Only include valid YYYY-MM-DD date keys
    if (key && key !== 'null' && key !== 'undefined' && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
      result[key] = value;
    } else if (key) {
      console.warn(`[filterValidDateKeys] Removing invalid date key: "${key}"`);
      hadInvalidKeys = true;
    }
  });
  // T25: Save cleaned data back to storage to prevent repeated warnings
  if (hadInvalidKeys && storageKey) {
    saveToStorage(storageKey, result);
    console.log(`[filterValidDateKeys] Cleaned invalid keys from ${storageKey}`);
  }
  return result;
};

export function usePrivateSessionsSync() {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [privateSessionsByDate, setPrivateSessionsByDate] = useState(() =>
    filterValidDateKeys(loadFromStorage(STORAGE_KEYS.privateSessions, {}), STORAGE_KEYS.privateSessions)
  );
  const [loading, setLoading] = useState(false);
  const syncedRef = useRef(false);
  const userIdRef = useRef(null);

  // Reset syncedRef when user changes (logout/login)
  // T31 FIX: Also clear in-memory state immediately to prevent UI flash of old data
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      const previousUserId = userIdRef.current;
      userIdRef.current = user?.id || null;
      // T31: Clear state immediately on user change
      if (previousUserId !== null && user?.id !== previousUserId) {
        setPrivateSessionsByDate({});
      }
    }
  }, [user?.id]);

  // Transform flat array from Supabase to date-keyed object
  const transformFromSupabase = useCallback((rows) => {
    const result = {};
    rows.forEach(row => {
      const dateKey = row.session_date;
      // Skip invalid date keys
      if (!dateKey || dateKey === 'null' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        console.warn(`[useSupabaseSync] Skipping private session with invalid date:`, dateKey);
        return;
      }
      if (!result[dateKey]) {
        result[dateKey] = [];
      }
      result[dateKey].push({
        id: row.id,
        title: row.title,
        description: row.description,
        startDate: row.session_date, // BUG-012 FIX: Include startDate
        endDate: row.end_date || row.session_date, // BUG-012 FIX: Include endDate
        startTime: row.start_time,
        endTime: row.end_time,
        allDay: row.all_day,
        isMultiDay: row.is_multi_day || false, // BUG-012 FIX: Include isMultiDay
        repeatEnabled: row.repeat_enabled,
        repeatType: row.repeat_type,
        repeatCount: row.repeat_count,
        seriesId: row.series_id,
        // T30: Series metadata
        seriesIndex: row.series_index,
        seriesTotal: row.series_total,
        seriesOriginId: row.series_origin_id,
        repeatEndMode: row.repeat_end_mode,
        repeatEndDate: row.repeat_end_date,
        customDays: row.custom_days,
        blockType: 'private',
        metadata: row.metadata || {},
        createdAt: row.created_at,
      });
    });
    return result;
  }, []);

  // Fetch from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user?.id) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('private_sessions')
        .select('*')
        .eq('user_id', user.id)  // T31 FIX: Always filter by user_id
        .order('session_date', { ascending: true });

      if (error) throw error;
      return transformFromSupabase(data || []);
    } catch (err) {
      console.error('Error fetching private blocks:', err);
      return null;
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id, transformFromSupabase]);

  // Initial sync on login
  useEffect(() => {
    const initSync = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || !user?.id || syncedRef.current) {
        return;
      }

      setLoading(true);
      try {
        // T31 FIX: Check if LocalStorage data belongs to a different user
        const lastSyncedUserId = localStorage.getItem('prepwell_last_user_id');
        const isLocalDataFromDifferentUser = lastSyncedUserId && lastSyncedUserId !== user.id;

        if (isLocalDataFromDifferentUser) {
          console.warn('[T31] private_sessions: LocalStorage contains data from different user, clearing...');
          localStorage.removeItem(STORAGE_KEYS.privateSessions);
          setPrivateSessionsByDate({});
        }

        const { data: existingData } = await supabase
          .from('private_sessions')
          .select('id')
          .eq('user_id', user.id)  // T31 FIX: Filter by user_id
          .limit(1);

        if (existingData && existingData.length > 0) {
          const supabaseData = await fetchFromSupabase();
          if (supabaseData) {
            setPrivateSessionsByDate(supabaseData);
            saveToStorage(STORAGE_KEYS.privateSessions, supabaseData);
          }
        } else if (!isLocalDataFromDifferentUser) {
          // Migrate from localStorage only if data is from same user
          const localData = loadFromStorage(STORAGE_KEYS.privateSessions, {});
          const dataToInsert = [];
          Object.entries(localData).forEach(([dateKey, blocks]) => {
            // Skip invalid date keys (e.g., "null", "undefined", empty)
            if (!dateKey || dateKey === 'null' || dateKey === 'undefined' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
              console.warn(`[useSupabaseSync] Skipping invalid date key:`, dateKey);
              return;
            }
            if (!Array.isArray(blocks)) return; // Skip invalid entries
            blocks.forEach(block => {
              // Skip blocks without required fields (title is NOT NULL)
              if (!block || !block.title) {
                console.warn(`[useSupabaseSync] Skipping private session without title:`, block);
                return;
              }
              // Helper to convert "null" strings to actual null
              const nullSafe = (v) => (v === 'null' || v === '' || v === undefined) ? null : v;
              dataToInsert.push({
                user_id: user.id,
                session_date: dateKey, // T17 FIX: was block_date
                end_date: nullSafe(block.endDate) || dateKey, // BUG-012 FIX
                title: block.title, // Required: NOT NULL
                description: nullSafe(block.description),
                start_time: nullSafe(block.startTime),
                end_time: nullSafe(block.endTime),
                all_day: block.allDay || false,
                is_multi_day: block.isMultiDay || false, // BUG-012 FIX
                repeat_enabled: block.repeatEnabled || false,
                repeat_type: nullSafe(block.repeatType),
                repeat_count: nullSafe(block.repeatCount),
                series_id: nullSafe(block.seriesId),
                // T30: Series metadata
                series_index: typeof block.seriesIndex === 'number' ? block.seriesIndex : null,
                series_total: typeof block.seriesTotal === 'number' ? block.seriesTotal : null,
                series_origin_id: nullSafe(block.seriesOriginId),
                repeat_end_mode: nullSafe(block.repeatEndMode),
                repeat_end_date: nullSafe(block.repeatEndDate),
                custom_days: nullSafe(block.customDays),
                metadata: block.metadata || {},
              });
            });
          });

          if (dataToInsert.length > 0) {
            const { error: insertError } = await supabase.from('private_sessions').insert(dataToInsert);
            if (insertError) {
              console.error(`[useSupabaseSync] Error migrating private sessions:`, insertError);
            } else {
              console.log(`[useSupabaseSync] Migrated ${dataToInsert.length} private sessions to Supabase`);
            }
          }
        }

        // T31 FIX: Update last_user_id after successful sync
        localStorage.setItem('prepwell_last_user_id', user.id);
        syncedRef.current = true;
      } catch (err) {
        console.error('Error syncing private blocks:', err);
      } finally {
        setLoading(false);
      }
    };

    initSync();
  }, [isSupabaseEnabled, isAuthenticated, user?.id, fetchFromSupabase]);

  // Save private blocks for a specific date
  const saveDayBlocks = useCallback(async (dateKey, blocks) => {
    const updated = { ...privateSessionsByDate, [dateKey]: blocks };
    if (blocks.length === 0) {
      delete updated[dateKey];
    }
    setPrivateSessionsByDate(updated);
    saveToStorage(STORAGE_KEYS.privateSessions, updated);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Delete existing sessions for this date
      // T31 FIX: Also filter by user_id for defense-in-depth
      await supabase
        .from('private_sessions')
        .delete()
        .eq('user_id', user.id)
        .eq('session_date', dateKey); // T17 FIX: was block_date

      // Insert new sessions
      if (blocks.length > 0) {
        // Filter out blocks without required title field
        const validBlocks = blocks.filter(block => block && block.title);
        if (validBlocks.length < blocks.length) {
          console.warn(`[saveDayBlocks] Skipped ${blocks.length - validBlocks.length} blocks without title`);
        }

        const dataToInsert = validBlocks.map(block => {
          // Check if ID should be auto-generated: null, undefined, or local prefixes
          const isLocalId = !block.id || block.id?.startsWith('private-') || block.id?.startsWith('local-') || block.id?.startsWith('block-');
          // Generate a new UUID if this is a local ID (prevents null constraint violation in batch inserts)
          const blockId = isLocalId ? crypto.randomUUID() : block.id;
          return {
            id: blockId,
            user_id: user.id,
            session_date: dateKey, // T17 FIX: was block_date
            end_date: (block.endDate === 'null' || !block.endDate) ? dateKey : block.endDate, // BUG-012 FIX + null string fix
            title: block.title, // Required: NOT NULL
            description: block.description === 'null' ? null : (block.description || null),
            start_time: block.startTime === 'null' ? null : (block.startTime || null),
            end_time: block.endTime === 'null' ? null : (block.endTime || null),
            all_day: block.allDay || false,
            is_multi_day: block.isMultiDay || false, // BUG-012 FIX
            repeat_enabled: block.repeatEnabled || false,
            repeat_type: block.repeatType === 'null' ? null : (block.repeatType || null),
            repeat_count: block.repeatCount === 'null' ? null : (block.repeatCount || null),
            series_id: block.seriesId === 'null' ? null : (block.seriesId || null),
            custom_days: block.customDays === 'null' ? null : (block.customDays || null),
            metadata: block.metadata || {},
          };
        });

        const { error } = await supabase
          .from('private_sessions')
          .insert(dataToInsert);

        if (error) throw error;
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error saving private blocks:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [privateSessionsByDate, isSupabaseEnabled, isAuthenticated, user?.id]);

  // FIX BUG-005: Batch save private blocks for multiple dates at once
  // This avoids stale closure issues when creating series appointments
  const saveDayBlocksBatch = useCallback(async (updatesMap) => {
    console.log('[saveDayBlocksBatch] Called with', Object.keys(updatesMap).length, 'dates:', Object.keys(updatesMap));
    console.log('[saveDayBlocksBatch] Current privateSessionsByDate has', Object.keys(privateSessionsByDate).length, 'dates');

    // Merge all updates with current state
    const updated = { ...privateSessionsByDate };
    Object.entries(updatesMap).forEach(([dateKey, blocks]) => {
      if (blocks.length === 0) {
        delete updated[dateKey];
      } else {
        updated[dateKey] = blocks;
      }
    });

    console.log('[saveDayBlocksBatch] After merge:', Object.keys(updated).length, 'dates total:', Object.keys(updated));
    console.log('[saveDayBlocksBatch] Updated data:', JSON.stringify(updated, null, 2));

    setPrivateSessionsByDate(updated);
    saveToStorage(STORAGE_KEYS.privateSessions, updated);
    console.log('[saveDayBlocksBatch] State updated and saved to localStorage');

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Process each date
      for (const [dateKey, blocks] of Object.entries(updatesMap)) {
        // Delete existing sessions for this date
        // T31 FIX: Also filter by user_id for defense-in-depth
        await supabase
          .from('private_sessions')
          .delete()
          .eq('user_id', user.id)
          .eq('session_date', dateKey); // T17 FIX: was block_date

        // Insert new sessions
        if (blocks.length > 0) {
          // Filter out blocks without required title field
          const validBlocks = blocks.filter(block => block && block.title);
          if (validBlocks.length < blocks.length) {
            console.warn(`[saveDayBlocksBatch] Skipped ${blocks.length - validBlocks.length} blocks without title for ${dateKey}`);
          }

          const dataToInsert = validBlocks.map(block => {
            // Check if ID should be auto-generated: null, undefined, or local prefixes
            const isLocalId = !block.id || block.id?.startsWith('private-') || block.id?.startsWith('local-') || block.id?.startsWith('block-');
            // Generate a new UUID if this is a local ID (prevents null constraint violation in batch inserts)
            const blockId = isLocalId ? crypto.randomUUID() : block.id;
            return {
              id: blockId,
              user_id: user.id,
              session_date: dateKey, // T17 FIX: was block_date
              end_date: (block.endDate === 'null' || !block.endDate) ? dateKey : block.endDate, // BUG-012 FIX + null string fix
              title: block.title, // Required: NOT NULL
              description: block.description === 'null' ? null : (block.description || null),
              start_time: block.startTime === 'null' ? null : (block.startTime || null),
              end_time: block.endTime === 'null' ? null : (block.endTime || null),
              all_day: block.allDay || false,
              is_multi_day: block.isMultiDay || false, // BUG-012 FIX
              repeat_enabled: block.repeatEnabled || false,
              repeat_type: block.repeatType === 'null' ? null : (block.repeatType || null),
              repeat_count: block.repeatCount === 'null' ? null : (block.repeatCount || null),
              series_id: block.seriesId === 'null' ? null : (block.seriesId || null),
              custom_days: block.customDays === 'null' ? null : (block.customDays || null),
              metadata: block.metadata || {},
            };
          });

          if (dataToInsert.length > 0) {
            const { error } = await supabase
              .from('private_sessions')
              .insert(dataToInsert);

            if (error) throw error;
          }
        }
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('[saveDayBlocksBatch] Error:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [privateSessionsByDate, isSupabaseEnabled, isAuthenticated, user?.id]);

  return {
    privateSessionsByDate,
    setPrivateSessionsByDate,
    saveDayBlocks,
    saveDayBlocksBatch,
    loading,
    isAuthenticated,
    isSupabaseEnabled,
  };
}

/**
 * Hook for Time Blocks (timeSessionsByDate)
 * BUG-023 FIX: Strictly separated from calendar_blocks (Month view)
 * Time blocks are time-based (start_time, end_time) for Week/Dashboard views
 */
export function useTimeSessionsSync() {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [timeSessionsByDate, setTimeSessionsByDate] = useState(() =>
    loadFromStorage(STORAGE_KEYS.timeSessions, {})
  );
  const [loading, setLoading] = useState(false);
  const syncedRef = useRef(false);
  const userIdRef = useRef(null);

  // Reset syncedRef when user changes (logout/login)
  // T31 FIX: Also clear in-memory state immediately to prevent UI flash of old data
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      const previousUserId = userIdRef.current;
      userIdRef.current = user?.id || null;
      // T31: Clear state immediately on user change
      if (previousUserId !== null && user?.id !== previousUserId) {
        setTimeSessionsByDate({});
      }
    }
  }, [user?.id]);

  // Transform flat array from Supabase to date-keyed object
  const transformFromSupabase = useCallback((rows) => {
    const result = {};
    rows.forEach(row => {
      const dateKey = row.session_date;
      if (!result[dateKey]) {
        result[dateKey] = [];
      }
      result[dateKey].push({
        id: row.id,
        title: row.title,
        description: row.description,
        blockType: row.block_type || 'lernblock',
        startTime: row.start_time,
        endTime: row.end_time,
        rechtsgebiet: row.rechtsgebiet,
        unterrechtsgebiet: row.unterrechtsgebiet,
        repeatEnabled: row.repeat_enabled,
        repeatType: row.repeat_type,
        repeatCount: row.repeat_count,
        seriesId: row.series_id,
        // T30: Series metadata
        seriesIndex: row.series_index,
        seriesTotal: row.series_total,
        seriesOriginId: row.series_origin_id,
        repeatEndMode: row.repeat_end_mode,
        repeatEndDate: row.repeat_end_date,
        customDays: row.custom_days,
        tasks: row.tasks || [],
        metadata: row.metadata || {},
        createdAt: row.created_at,
      });
    });
    return result;
  }, []);

  // Fetch from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user?.id) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('user_id', user.id)  // T31 FIX: Always filter by user_id
        .order('session_date', { ascending: true });

      if (error) throw error;
      return transformFromSupabase(data || []);
    } catch (err) {
      console.error('Error fetching time blocks:', err);
      return null;
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id, transformFromSupabase]);

  // Initial sync on login
  useEffect(() => {
    const initSync = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || syncedRef.current) {
        return;
      }

      // Skip if user is not properly authenticated
      if (!user?.id) {
        console.warn('[TimeSessionsSync] Skipping sync - no authenticated user');
        return;
      }

      setLoading(true);
      try {
        // T31 FIX: Check if LocalStorage data belongs to a different user
        const lastSyncedUserId = localStorage.getItem('prepwell_last_user_id');
        const isLocalDataFromDifferentUser = lastSyncedUserId && lastSyncedUserId !== user.id;

        if (isLocalDataFromDifferentUser) {
          console.warn('[T31] time_sessions: LocalStorage contains data from different user, clearing...');
          localStorage.removeItem(STORAGE_KEYS.timeSessions);
          setTimeSessionsByDate({});
        }

        const { data: existingData, error: selectError } = await supabase
          .from('time_sessions')
          .select('id')
          .eq('user_id', user.id)  // T31 FIX: Filter by user_id
          .limit(1);

        // If we can't even query, skip the migration (likely auth issue)
        if (selectError) {
          console.error('[TimeSessionsSync] Cannot query time_sessions, skipping sync:', selectError);
          syncedRef.current = true; // Mark as synced to prevent retry loops
          return;
        }

        if (existingData && existingData.length > 0) {
          const supabaseData = await fetchFromSupabase();
          if (supabaseData) {
            setTimeSessionsByDate(supabaseData);
            saveToStorage(STORAGE_KEYS.timeSessions, supabaseData);
          }
        } else if (!isLocalDataFromDifferentUser) {
          // Migrate from localStorage only if data is from same user
          const localData = loadFromStorage(STORAGE_KEYS.timeSessions, {});
          const dataToInsert = [];

          // Valid block types per schema CHECK constraint
          const VALID_BLOCK_TYPES = ['lernblock', 'repetition', 'exam', 'private'];

          Object.entries(localData).forEach(([dateKey, blocks]) => {
            if (!Array.isArray(blocks)) return;

            blocks.forEach(block => {
              // Only insert if we have required fields (start_time, end_time, title are NOT NULL)
              if (!block.startTime || !block.endTime || !block.title) {
                console.warn('Skipping block without required fields:', block);
                return;
              }

              // Validate and normalize block_type
              let blockType = block.blockType || 'lernblock';
              if (!VALID_BLOCK_TYPES.includes(blockType)) {
                console.warn(`Invalid block_type "${blockType}", defaulting to "lernblock"`);
                blockType = 'lernblock';
              }

              // T30: series_id is now TEXT (not UUID), so accept any string
              const seriesId = block.seriesId || null;

              dataToInsert.push({
                user_id: user.id,
                session_date: dateKey,
                title: block.title,
                description: block.description || null,
                block_type: blockType,
                start_time: block.startTime,
                end_time: block.endTime,
                rechtsgebiet: block.rechtsgebiet || null,
                unterrechtsgebiet: block.unterrechtsgebiet || null,
                repeat_enabled: block.repeatEnabled || false,
                repeat_type: block.repeatType || null,
                repeat_count: typeof block.repeatCount === 'number' ? block.repeatCount : null,
                series_id: seriesId,
                // T30: Series metadata
                series_index: typeof block.seriesIndex === 'number' ? block.seriesIndex : null,
                series_total: typeof block.seriesTotal === 'number' ? block.seriesTotal : null,
                series_origin_id: block.seriesOriginId || null,
                repeat_end_mode: block.repeatEndMode || null,
                repeat_end_date: block.repeatEndDate || null,
                custom_days: block.customDays || null,
                tasks: Array.isArray(block.tasks) ? block.tasks : [],
                metadata: block.metadata && typeof block.metadata === 'object' ? block.metadata : {},
              });
            });
          });

          if (dataToInsert.length > 0) {
            console.log(`[TimeSessionsSync] Attempting to insert ${dataToInsert.length} blocks`);
            const { error } = await supabase.from('time_sessions').insert(dataToInsert);
            if (error) {
              console.error('[TimeSessionsSync] Insert error:', error.message, error.details, error.hint);
              // Don't throw - mark as synced to prevent endless retry
              console.warn('[TimeSessionsSync] Migration failed, will use localStorage only');
            } else {
              console.log(`[TimeSessionsSync] Successfully migrated ${dataToInsert.length} time blocks`);
            }
          } else {
            console.log('[TimeSessionsSync] No valid blocks to migrate from localStorage');
          }
        }

        // T31 FIX: Update last_user_id after successful sync
        localStorage.setItem('prepwell_last_user_id', user.id);
        syncedRef.current = true;
      } catch (err) {
        console.error('Error syncing time blocks:', err);
      } finally {
        setLoading(false);
      }
    };

    initSync();
  }, [isSupabaseEnabled, isAuthenticated, user?.id, fetchFromSupabase]);

  // Save time blocks for a specific date
  const saveDayBlocks = useCallback(async (dateKey, blocks) => {
    const updated = { ...timeSessionsByDate, [dateKey]: blocks };
    if (blocks.length === 0) {
      delete updated[dateKey];
    }
    setTimeSessionsByDate(updated);
    saveToStorage(STORAGE_KEYS.timeSessions, updated);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    // Valid block types per schema CHECK constraint
    const VALID_BLOCK_TYPES = ['lernblock', 'repetition', 'exam', 'private'];

    try {
      // Delete existing blocks for this date
      // T31 FIX: Also filter by user_id for defense-in-depth
      await supabase
        .from('time_sessions')
        .delete()
        .eq('user_id', user.id)
        .eq('session_date', dateKey);

      // Insert new blocks (only valid ones with required fields)
      const validBlocks = blocks.filter(block => block.startTime && block.endTime && block.title);
      if (validBlocks.length > 0) {
        const dataToInsert = validBlocks.map(block => {
          const isLocalId = !block.id || block.id?.startsWith('block-') || block.id?.startsWith('local-') || block.id?.startsWith('timeblock-');
          const blockId = isLocalId ? crypto.randomUUID() : block.id;

          // Validate block_type
          let blockType = block.blockType || 'lernblock';
          if (!VALID_BLOCK_TYPES.includes(blockType)) {
            blockType = 'lernblock';
          }

          // T30: series_id is now TEXT (not UUID), so accept any string
          const seriesId = block.seriesId || null;

          return {
            id: blockId,
            user_id: user.id,
            session_date: dateKey,
            title: block.title,
            description: block.description || null,
            block_type: blockType,
            start_time: block.startTime,
            end_time: block.endTime,
            rechtsgebiet: block.rechtsgebiet || null,
            unterrechtsgebiet: block.unterrechtsgebiet || null,
            repeat_enabled: block.repeatEnabled || false,
            repeat_type: block.repeatType || null,
            repeat_count: typeof block.repeatCount === 'number' ? block.repeatCount : null,
            series_id: seriesId,
            // T30: Series metadata
            series_index: typeof block.seriesIndex === 'number' ? block.seriesIndex : null,
            series_total: typeof block.seriesTotal === 'number' ? block.seriesTotal : null,
            series_origin_id: block.seriesOriginId || null,
            repeat_end_mode: block.repeatEndMode || null,
            repeat_end_date: block.repeatEndDate || null,
            custom_days: block.customDays || null,
            tasks: Array.isArray(block.tasks) ? block.tasks : [],
            metadata: block.metadata && typeof block.metadata === 'object' ? block.metadata : {},
          };
        });

        const { error } = await supabase
          .from('time_sessions')
          .insert(dataToInsert);

        if (error) throw error;
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error saving time blocks:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [timeSessionsByDate, isSupabaseEnabled, isAuthenticated, user?.id]);

  // Batch save time blocks for multiple dates at once
  const saveDayBlocksBatch = useCallback(async (updatesMap) => {
    console.log('[saveTimeBlocksBatch] Called with', Object.keys(updatesMap).length, 'dates');

    const updated = { ...timeSessionsByDate };
    Object.entries(updatesMap).forEach(([dateKey, blocks]) => {
      if (blocks.length === 0) {
        delete updated[dateKey];
      } else {
        updated[dateKey] = blocks;
      }
    });

    setTimeSessionsByDate(updated);
    saveToStorage(STORAGE_KEYS.timeSessions, updated);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    // Valid block types per schema CHECK constraint
    const VALID_BLOCK_TYPES = ['lernblock', 'repetition', 'exam', 'private'];

    try {
      for (const [dateKey, blocks] of Object.entries(updatesMap)) {
        // T31 FIX: Also filter by user_id for defense-in-depth
        await supabase
          .from('time_sessions')
          .delete()
          .eq('user_id', user.id)
          .eq('session_date', dateKey);

        // Only insert valid blocks with required fields
        const validBlocks = blocks.filter(block => block.startTime && block.endTime && block.title);
        if (validBlocks.length > 0) {
          const dataToInsert = validBlocks.map(block => {
            const isLocalId = !block.id || block.id?.startsWith('block-') || block.id?.startsWith('local-') || block.id?.startsWith('timeblock-');
            const blockId = isLocalId ? crypto.randomUUID() : block.id;

            // Validate block_type
            let blockType = block.blockType || 'lernblock';
            if (!VALID_BLOCK_TYPES.includes(blockType)) {
              blockType = 'lernblock';
            }

            // T30: series_id is now TEXT (not UUID), so accept any string
            const seriesId = block.seriesId || null;

            return {
              id: blockId,
              user_id: user.id,
              session_date: dateKey,
              title: block.title,
              description: block.description || null,
              block_type: blockType,
              start_time: block.startTime,
              end_time: block.endTime,
              rechtsgebiet: block.rechtsgebiet || null,
              unterrechtsgebiet: block.unterrechtsgebiet || null,
              repeat_enabled: block.repeatEnabled || false,
              repeat_type: block.repeatType || null,
              repeat_count: typeof block.repeatCount === 'number' ? block.repeatCount : null,
              series_id: seriesId,
              // T30: Series metadata
              series_index: typeof block.seriesIndex === 'number' ? block.seriesIndex : null,
              series_total: typeof block.seriesTotal === 'number' ? block.seriesTotal : null,
              series_origin_id: block.seriesOriginId || null,
              repeat_end_mode: block.repeatEndMode || null,
              repeat_end_date: block.repeatEndDate || null,
              custom_days: block.customDays || null,
              tasks: Array.isArray(block.tasks) ? block.tasks : [],
              metadata: block.metadata && typeof block.metadata === 'object' ? block.metadata : {},
            };
          });

          const { error } = await supabase
            .from('time_sessions')
            .insert(dataToInsert);

          if (error) throw error;
        }
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error batch saving time blocks:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [timeSessionsByDate, isSupabaseEnabled, isAuthenticated, user?.id]);

  // Clear all time blocks
  const clearAllBlocks = useCallback(async () => {
    setTimeSessionsByDate({});
    saveToStorage(STORAGE_KEYS.timeSessions, {});

    // T31 FIX: Check user.id before Supabase operation
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user?.id) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // T31 FIX: Add user_id filter to DELETE query
      await supabase
        .from('time_sessions')
        .delete()
        .eq('user_id', user.id)
        .neq('id', '00000000-0000-0000-0000-000000000000');

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error clearing time blocks:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  return {
    timeSessionsByDate,
    setTimeSessionsByDate,
    saveDayBlocks,
    saveDayBlocksBatch,
    clearAllBlocks,
    loading,
    isAuthenticated,
    isSupabaseEnabled,
  };
}

/**
 * Hook for Archived Lernpläne
 */
export function useArchivedLernplaeneSync() {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [archivedLernplaene, setArchivedLernplaene] = useState(() =>
    loadFromStorage(STORAGE_KEYS.archivedLernplaene, [])
  );
  const [loading, setLoading] = useState(false);
  const syncedRef = useRef(false);
  const userIdRef = useRef(null);

  // Reset syncedRef when user changes (logout/login)
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      userIdRef.current = user?.id || null;
    }
  }, [user?.id]);

  // Fetch from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('archived_lernplaene')
        .select('*')
        .order('archived_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        blocks: row.blocks_data || {},
        metadata: {
          name: row.name,
          description: row.description,
          startDate: row.start_date,
          endDate: row.end_date,
          archivedAt: row.archived_at,
          ...row.metadata,
        },
      }));
    } catch (err) {
      console.error('Error fetching archived lernplaene:', err);
      return null;
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  // Initial sync on login
  useEffect(() => {
    const initSync = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || syncedRef.current) {
        return;
      }

      setLoading(true);
      try {
        const { data: existingData } = await supabase
          .from('archived_lernplaene')
          .select('id')
          .limit(1);

        if (existingData && existingData.length > 0) {
          const supabaseData = await fetchFromSupabase();
          if (supabaseData) {
            setArchivedLernplaene(supabaseData);
            saveToStorage(STORAGE_KEYS.archivedLernplaene, supabaseData);
          }
        } else {
          // Migrate from localStorage
          const localData = loadFromStorage(STORAGE_KEYS.archivedLernplaene, []);
          if (localData.length > 0) {
            const dataToInsert = localData.map(plan => ({
              user_id: user.id,
              name: plan.metadata?.name || 'Archived Plan',
              description: plan.metadata?.description,
              start_date: plan.metadata?.startDate,
              end_date: plan.metadata?.endDate,
              blocks_data: plan.blocks || {},
              metadata: plan.metadata || {},
              archived_at: plan.metadata?.archivedAt || new Date().toISOString(),
            }));

            await supabase.from('archived_lernplaene').insert(dataToInsert);
            console.log(`Migrated ${dataToInsert.length} archived lernplaene to Supabase`);
          }
        }

        syncedRef.current = true;
      } catch (err) {
        console.error('Error syncing archived lernplaene:', err);
      } finally {
        setLoading(false);
      }
    };

    initSync();
  }, [isSupabaseEnabled, isAuthenticated, user, fetchFromSupabase]);

  // Archive a plan
  const archivePlan = useCallback(async (planData) => {
    const newPlan = {
      id: planData.id || `archive_${Date.now()}`,
      blocks: planData.blocks || {},
      metadata: planData.metadata,
    };

    const updated = [newPlan, ...archivedLernplaene];
    setArchivedLernplaene(updated);
    saveToStorage(STORAGE_KEYS.archivedLernplaene, updated);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      const { error } = await supabase
        .from('archived_lernplaene')
        .insert({
          user_id: user.id,
          name: planData.metadata?.name || 'Archived Plan',
          description: planData.metadata?.description,
          start_date: planData.metadata?.startDate,
          end_date: planData.metadata?.endDate,
          blocks_data: planData.blocks || {},
          metadata: planData.metadata || {},
          archived_at: planData.metadata?.archivedAt || new Date().toISOString(),
        });

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error archiving plan:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [archivedLernplaene, isSupabaseEnabled, isAuthenticated, user?.id]);

  // Delete an archived plan
  const deleteArchivedPlan = useCallback(async (planId) => {
    const updated = archivedLernplaene.filter(p => p.id !== planId);
    setArchivedLernplaene(updated);
    saveToStorage(STORAGE_KEYS.archivedLernplaene, updated);

    // T31 FIX: Check user.id before Supabase operation
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user?.id) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // T31 FIX: Add user_id filter to DELETE query for defense-in-depth
      const { error } = await supabase
        .from('archived_lernplaene')
        .delete()
        .eq('user_id', user.id)
        .eq('id', planId);

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error deleting archived plan:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [archivedLernplaene, isSupabaseEnabled, isAuthenticated, user?.id]);

  return {
    archivedLernplaene,
    setArchivedLernplaene,
    archivePlan,
    deleteArchivedPlan,
    loading,
    isAuthenticated,
    isSupabaseEnabled,
  };
}

/**
 * Hook for Lernplan Metadata (current active plan)
 */
export function useLernplanMetadataSync() {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [lernplanMetadata, setLernplanMetadata] = useState(() =>
    loadFromStorage(STORAGE_KEYS.lernplanMetadata, null)
  );
  const [loading, setLoading] = useState(false);
  const syncedRef = useRef(false);
  const userIdRef = useRef(null);

  // Reset syncedRef when user changes (logout/login)
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      userIdRef.current = user?.id || null;
    }
  }, [user?.id]);

  // Fetch from Supabase (stored in user_settings)
  useEffect(() => {
    const initSync = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user || syncedRef.current) {
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('timer_settings')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching lernplan metadata:', error);
          return;
        }

        // Lernplan metadata is stored in timer_settings.lernplanMetadata
        if (data?.timer_settings?.lernplanMetadata) {
          setLernplanMetadata(data.timer_settings.lernplanMetadata);
          saveToStorage(STORAGE_KEYS.lernplanMetadata, data.timer_settings.lernplanMetadata);
        } else {
          // Migrate from localStorage if exists
          const localData = loadFromStorage(STORAGE_KEYS.lernplanMetadata, null);
          if (localData) {
            await updateMetadata(localData);
          }
        }

        syncedRef.current = true;
      } catch (err) {
        console.error('Error syncing lernplan metadata:', err);
      } finally {
        setLoading(false);
      }
    };

    initSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  // Update metadata
  // Fix: Read ALL user_settings fields to avoid race condition with useUserSettingsSync
  const updateMetadata = useCallback(async (newMetadata) => {
    setLernplanMetadata(newMetadata);
    saveToStorage(STORAGE_KEYS.lernplanMetadata, newMetadata);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Get ALL current settings (not just timer_settings) to avoid overwriting other fields
      const { data: currentSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const timerSettings = currentSettings?.timer_settings || {};

      // Update with lernplan metadata, preserving ALL other user_settings fields
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          mentor_activated: currentSettings?.mentor_activated ?? false,
          preferred_grade_system: currentSettings?.preferred_grade_system ?? 'punkte',
          subject_settings: currentSettings?.subject_settings ?? { colorOverrides: {}, customSubjects: [] },
          timer_settings: {
            ...timerSettings,
            lernplanMetadata: newMetadata,
          },
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error updating lernplan metadata:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  // Clear metadata
  // Fix: Read ALL user_settings fields to avoid race condition
  const clearMetadata = useCallback(async () => {
    setLernplanMetadata(null);
    saveToStorage(STORAGE_KEYS.lernplanMetadata, null);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Get ALL current settings to preserve other fields
      const { data: currentSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const timerSettings = currentSettings?.timer_settings || {};
      delete timerSettings.lernplanMetadata;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          mentor_activated: currentSettings?.mentor_activated ?? false,
          preferred_grade_system: currentSettings?.preferred_grade_system ?? 'punkte',
          subject_settings: currentSettings?.subject_settings ?? { colorOverrides: {}, customSubjects: [] },
          timer_settings: timerSettings,
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error clearing lernplan metadata:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  return {
    lernplanMetadata,
    updateMetadata,
    clearMetadata,
    loading,
    isAuthenticated,
    isSupabaseEnabled,
  };
}

/**
 * Hook for Custom Unterrechtsgebiete
 * Syncs custom unterrechtsgebiete to Supabase
 */
export function useCustomUnterrechtsgebieteSync() {
  return useSupabaseSync('custom_unterrechtsgebiete', STORAGE_KEYS.customUnterrechtsgebiete, [], {
    orderBy: 'created_at',
    orderDirection: 'desc',
    transformToSupabase: (item) => ({
      id: item.id?.startsWith('local-') || item.id?.startsWith('custom-') ? undefined : item.id,
      name: item.name,
      rechtsgebiet: item.rechtsgebiet,
    }),
    transformFromSupabase: (row) => ({
      id: row.id,
      name: row.name,
      rechtsgebiet: row.rechtsgebiet,
      createdAt: row.created_at,
    }),
  });
}

/**
 * Hook for Onboarding Status
 * Stores onboarding state in user_settings.timer_settings.onboarding
 */
export function useOnboardingSync() {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [onboardingState, setOnboardingState] = useState(() => ({
    isCompleted: loadFromStorage('prepwell_onboarding_complete', false),
    currentStep: loadFromStorage('prepwell_onboarding_step', 1),
    selectedMode: loadFromStorage('prepwell_onboarding_mode', null),
  }));
  const [loading, setLoading] = useState(false);
  const syncedRef = useRef(false);
  const userIdRef = useRef(null);

  // Reset syncedRef when user changes
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      userIdRef.current = user?.id || null;
    }
  }, [user?.id]);

  // Initial sync from Supabase
  useEffect(() => {
    const initSync = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user || syncedRef.current) {
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('timer_settings')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching onboarding state:', error);
          return;
        }

        if (data?.timer_settings?.onboarding) {
          const onboarding = data.timer_settings.onboarding;
          setOnboardingState(onboarding);
          // Update localStorage
          saveToStorage('prepwell_onboarding_complete', onboarding.isCompleted);
          saveToStorage('prepwell_onboarding_step', onboarding.currentStep);
          saveToStorage('prepwell_onboarding_mode', onboarding.selectedMode);
        } else {
          // Migrate from localStorage if exists
          const localState = {
            isCompleted: loadFromStorage('prepwell_onboarding_complete', false),
            currentStep: loadFromStorage('prepwell_onboarding_step', 1),
            selectedMode: loadFromStorage('prepwell_onboarding_mode', null),
          };
          if (localState.isCompleted || localState.currentStep > 1) {
            await updateOnboardingState(localState);
          }
        }

        syncedRef.current = true;
      } finally {
        setLoading(false);
      }
    };

    initSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  // Update onboarding state
  const updateOnboardingState = useCallback(async (updates) => {
    const newState = { ...onboardingState, ...updates };
    setOnboardingState(newState);

    // Always update localStorage
    if (updates.isCompleted !== undefined) {
      saveToStorage('prepwell_onboarding_complete', updates.isCompleted);
    }
    if (updates.currentStep !== undefined) {
      saveToStorage('prepwell_onboarding_step', updates.currentStep);
    }
    if (updates.selectedMode !== undefined) {
      saveToStorage('prepwell_onboarding_mode', updates.selectedMode);
    }

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Get current settings to preserve other fields
      const { data: currentSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const timerSettings = currentSettings?.timer_settings || {};

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          mentor_activated: currentSettings?.mentor_activated ?? false,
          preferred_grade_system: currentSettings?.preferred_grade_system ?? 'punkte',
          subject_settings: currentSettings?.subject_settings ?? { colorOverrides: {}, customSubjects: [] },
          timer_settings: {
            ...timerSettings,
            onboarding: newState,
          },
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error updating onboarding state:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [onboardingState, isSupabaseEnabled, isAuthenticated, user?.id]);

  return {
    onboardingState,
    updateOnboardingState,
    loading,
    isAuthenticated,
    isSupabaseEnabled,
  };
}

/**
 * Hook for App Mode Preferences
 * Stores app mode state in user_settings.timer_settings.appMode
 */
export function useAppModeSync() {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [appModeState, setAppModeState] = useState(() => ({
    currentSemester: loadFromStorage('prepwell_semester', null),
    modePreference: loadFromStorage('prepwell_mode_preference', 'auto'),
    isSubscribed: loadFromStorage('prepwell_is_subscribed', false),
    subscriptionPlan: loadFromStorage('prepwell_subscription_plan', null),
    trialStartDate: loadFromStorage('prepwell_trial_start', null),
  }));
  const [loading, setLoading] = useState(false);
  const syncedRef = useRef(false);
  const userIdRef = useRef(null);

  // Reset syncedRef when user changes
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      userIdRef.current = user?.id || null;
    }
  }, [user?.id]);

  // Initial sync from Supabase
  useEffect(() => {
    const initSync = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user || syncedRef.current) {
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('timer_settings')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching app mode state:', error);
          return;
        }

        if (data?.timer_settings?.appMode) {
          const appMode = data.timer_settings.appMode;
          setAppModeState(appMode);
          // Update localStorage
          saveToStorage('prepwell_semester', appMode.currentSemester);
          saveToStorage('prepwell_mode_preference', appMode.modePreference);
          saveToStorage('prepwell_is_subscribed', appMode.isSubscribed);
          saveToStorage('prepwell_subscription_plan', appMode.subscriptionPlan);
          saveToStorage('prepwell_trial_start', appMode.trialStartDate);
        } else {
          // Migrate from localStorage if exists
          const localState = {
            currentSemester: loadFromStorage('prepwell_semester', null),
            modePreference: loadFromStorage('prepwell_mode_preference', 'auto'),
            isSubscribed: loadFromStorage('prepwell_is_subscribed', false),
            subscriptionPlan: loadFromStorage('prepwell_subscription_plan', null),
            trialStartDate: loadFromStorage('prepwell_trial_start', null),
          };
          if (localState.currentSemester || localState.modePreference !== 'auto') {
            await updateAppModeState(localState);
          }
        }

        syncedRef.current = true;
      } finally {
        setLoading(false);
      }
    };

    initSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupabaseEnabled, isAuthenticated, user?.id]);

  // Update app mode state
  const updateAppModeState = useCallback(async (updates) => {
    const newState = { ...appModeState, ...updates };
    setAppModeState(newState);

    // Always update localStorage
    if (updates.currentSemester !== undefined) {
      saveToStorage('prepwell_semester', updates.currentSemester);
    }
    if (updates.modePreference !== undefined) {
      saveToStorage('prepwell_mode_preference', updates.modePreference);
    }
    if (updates.isSubscribed !== undefined) {
      saveToStorage('prepwell_is_subscribed', updates.isSubscribed);
    }
    if (updates.subscriptionPlan !== undefined) {
      saveToStorage('prepwell_subscription_plan', updates.subscriptionPlan);
    }
    if (updates.trialStartDate !== undefined) {
      saveToStorage('prepwell_trial_start', updates.trialStartDate);
    }

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Get current settings to preserve other fields
      const { data: currentSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const timerSettings = currentSettings?.timer_settings || {};

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          mentor_activated: currentSettings?.mentor_activated ?? false,
          preferred_grade_system: currentSettings?.preferred_grade_system ?? 'punkte',
          subject_settings: currentSettings?.subject_settings ?? { colorOverrides: {}, customSubjects: [] },
          timer_settings: {
            ...timerSettings,
            appMode: newState,
          },
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error updating app mode state:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [appModeState, isSupabaseEnabled, isAuthenticated, user?.id]);

  return {
    appModeState,
    updateAppModeState,
    loading,
    isAuthenticated,
    isSupabaseEnabled,
  };
}

export { STORAGE_KEYS };
