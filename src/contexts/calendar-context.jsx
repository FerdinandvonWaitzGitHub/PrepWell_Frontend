import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  useContentPlansSync,
  useUserSettingsSync,
  useCalendarBlocksSync,
  useCalendarTasksSync,
  usePrivateSessionsSync,
  useTimeSessionsSync,
  useArchivedLernplaeneSync,
  useLernplanMetadataSync,
  usePublishedThemenlistenSync,
} from '../hooks/use-supabase-sync';
import { useAuth } from './auth-context';

/**
 * Context for centrally managing Calendar data
 * Single Source of Truth for:
 * - Lernplan blocks (from wizard)
 * - Private blocks (personal appointments)
 * - Tasks (daily tasks)
 * - Content Plans (Lernpläne & Themenlisten)
 *
 * Data flows: Wizard → CalendarContext → Monatsansicht → Wochenansicht → Startseite
 *
 * Supabase Integration (ALL DATA NOW SYNCED):
 * - contentPlans: Synced via useContentPlansSync → content_plans table
 * - blocks: Synced via useCalendarBlocksSync → calendar_blocks table
 * - tasks: Synced via useCalendarTasksSync → calendar_tasks table
 * - privateBlocks: Synced via usePrivateSessionsSync → private_blocks table
 * - archivedLernplaene: Synced via useArchivedLernplaeneSync → archived_lernplaene table
 * - lernplanMetadata: Synced via useLernplanMetadataSync → user_settings.timer_settings
 * - publishedThemenlisten: Synced via usePublishedThemenlistenSync → published_themenlisten table
 * - customUnterrechtsgebiete: Synced via useUserSettingsSync → user_settings.custom_subjects
 *
 * LocalStorage serves as fallback/cache for offline use.
 */

// Create the context
const CalendarContext = createContext(null);

// Local storage keys
const STORAGE_KEY_BLOCKS = 'prepwell_calendar_blocks';
const STORAGE_KEY_CONTENTS = 'prepwell_contents'; // NEW: Separate content storage
const STORAGE_KEY_THEME_LISTS = 'prepwell_theme_lists';
const STORAGE_KEY_CONTENT_PLANS = 'prepwell_content_plans';
const STORAGE_KEY_CUSTOM_UNTERRECHTSGEBIETE = 'prepwell_custom_unterrechtsgebiete';

// Maximum blocks per day (1-4 positions)
const MAX_BLOCKS_PER_DAY = 4;

/**
 * Load data from localStorage
 */
const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Save data to localStorage
 */
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

/**
 * Provider component for Calendar data
 * Now uses Supabase for all data with LocalStorage fallback
 */
export const CalendarProvider = ({ children }) => {
  // Auth context for checking authentication state
  const { isAuthenticated, isSupabaseEnabled } = useAuth();

  // ============================================
  // SUPABASE-SYNCED STATE (ALL DATA NOW SYNCED)
  // ============================================

  // Content Plans - synced with Supabase
  const {
    data: contentPlans,
    setData: setContentPlansLocal,
    saveItem: saveContentPlanToSupabase,
    removeItem: removeContentPlanFromSupabase,
    loading: contentPlansLoading,
  } = useContentPlansSync();

  // User settings (for customUnterrechtsgebiete)
  const { settings: userSettings, updateSettings: updateUserSettings } = useUserSettingsSync();

  // Calendar Blocks - synced with Supabase
  const {
    blocksByDate,
    setBlocksByDate: setBlocksByDateSync,
    saveDayBlocks: saveDayBlocksSync,
    clearAllBlocks: clearAllBlocksSync,
    loading: blocksLoading,
  } = useCalendarBlocksSync();

  // Calendar Tasks - synced with Supabase
  const {
    tasksByDate,
    saveDayTasks,
    loading: tasksLoading,
  } = useCalendarTasksSync();

  // Private Blocks - synced with Supabase
  const {
    privateSessionsByDate,
    saveDayBlocks,
    saveDayBlocksBatch,
    loading: privateSessionsLoading, // T30: Renamed from privateBlocksLoading
  } = usePrivateSessionsSync();

  // Time Blocks - synced with Supabase (BUG-023 FIX: Separate from calendar_blocks)
  // Time blocks are time-based (Week/Dashboard), NOT position-based (Month)
  const {
    timeSessionsByDate,
    saveDayBlocks: saveTimeBlocksDayBlocks,
    saveDayBlocksBatch: saveTimeBlocksDayBlocksBatch,
    clearAllBlocks: clearAllTimeBlocks,
    loading: timeSessionsLoading, // T30: Renamed from timeBlocksLoading
  } = useTimeSessionsSync();

  // Archived Lernpläne - synced with Supabase
  const {
    archivedLernplaene,
    archivePlan,
    deleteArchivedPlan: deleteArchivedPlanSync,
    loading: archivedLoading,
  } = useArchivedLernplaeneSync();

  // Lernplan Metadata - synced with Supabase
  const {
    lernplanMetadata,
    updateMetadata: updateLernplanMetadataSync,
    clearMetadata: clearLernplanMetadataSync,
    loading: metadataLoading,
  } = useLernplanMetadataSync();

  // Custom Unterrechtsgebiete - synced via user_settings.custom_subjects
  const [customUnterrechtsgebiete, setCustomUnterrechtsgebieteLocal] = useState(() =>
    loadFromStorage(STORAGE_KEY_CUSTOM_UNTERRECHTSGEBIETE, {})
  );

  // Sync customUnterrechtsgebiete from user settings
  const syncedCustomSubjects = useRef(false);
  useEffect(() => {
    if (userSettings.customSubjects && !syncedCustomSubjects.current && isAuthenticated) {
      // Convert array to object format if needed
      if (Array.isArray(userSettings.customSubjects) && userSettings.customSubjects.length > 0) {
        // customSubjects is stored as array in Supabase, convert to object
        try {
          const parsed = typeof userSettings.customSubjects === 'string'
            ? JSON.parse(userSettings.customSubjects)
            : userSettings.customSubjects;
          if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            setCustomUnterrechtsgebieteLocal(parsed);
            saveToStorage(STORAGE_KEY_CUSTOM_UNTERRECHTSGEBIETE, parsed);
          }
        } catch (e) {
          console.error('Error parsing custom subjects:', e);
        }
      }
      syncedCustomSubjects.current = true;
    }
  }, [userSettings.customSubjects, isAuthenticated]);

  // Helper to update customUnterrechtsgebiete (syncs to Supabase)
  const setCustomUnterrechtsgebiete = useCallback((newData) => {
    setCustomUnterrechtsgebieteLocal(newData);
    saveToStorage(STORAGE_KEY_CUSTOM_UNTERRECHTSGEBIETE, newData);
    // Sync to Supabase via user_settings
    if (isSupabaseEnabled && isAuthenticated) {
      updateUserSettings({ customSubjects: newData });
    }
  }, [isSupabaseEnabled, isAuthenticated, updateUserSettings]);

  // Helper to update contentPlans locally and to Supabase
  const setContentPlans = useCallback((newData) => {
    setContentPlansLocal(newData);
  }, [setContentPlansLocal]);

  /**
   * Helper to persist contentPlan changes to both localStorage AND Supabase
   * This fixes the critical data loss bug where nested CRUD operations only saved to localStorage
   * @param {Array} updated - The full updated contentPlans array
   * @param {string|null} planId - The ID of the plan that was modified (null for multi-plan updates)
   */
  const persistContentPlans = useCallback((updated, planId) => {
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
    // Sync to Supabase
    if (planId) {
      const updatedPlan = updated.find(p => p.id === planId);
      if (updatedPlan) {
        saveContentPlanToSupabase(updatedPlan);
      }
    }
  }, [setContentPlans, saveContentPlanToSupabase]);

  // Wrapper to set blocksByDate (for compatibility)
  const setBlocksByDate = useCallback((newData) => {
    setBlocksByDateSync(newData);
  }, [setBlocksByDateSync]);

  // Compute archived content plan IDs for filtering
  const archivedContentPlanIds = useMemo(() => {
    // Guard against null/undefined contentPlans
    if (!contentPlans || !Array.isArray(contentPlans)) {
      return new Set();
    }
    return new Set(contentPlans.filter(p => p.archived).map(p => p.id));
  }, [contentPlans]);

  // Compute visible blocks (excludes blocks from archived content plans)
  // BUG-010 FIX: Archived Lernpläne should not show in calendar
  const visibleBlocksByDate = useMemo(() => {
    // Guard against null/undefined blocksByDate
    if (!blocksByDate || typeof blocksByDate !== 'object') {
      return {};
    }

    if (archivedContentPlanIds.size === 0) {
      // KA-002 FIX: Still need to filter out empty arrays from blocksByDate
      // Empty arrays can exist if user deleted all blocks from a day
      const cleaned = {};
      Object.entries(blocksByDate).forEach(([dateKey, blocks]) => {
        if (Array.isArray(blocks) && blocks.length > 0) {
          cleaned[dateKey] = blocks;
        }
      });
      return cleaned;
    }

    const result = {};
    Object.entries(blocksByDate).forEach(([dateKey, blocks]) => {
      const visibleBlocks = blocks.filter(block => {
        // Keep block if it has no contentPlanId or if its contentPlanId is not archived
        if (!block.contentPlanId) return true;
        return !archivedContentPlanIds.has(block.contentPlanId);
      });
      if (visibleBlocks.length > 0) {
        result[dateKey] = visibleBlocks;
      }
    });
    return result;
  }, [blocksByDate, archivedContentPlanIds]);

  // Theme lists (dateless topic lists from Lernpläne) - LEGACY, use contentPlans instead
  const [themeLists, setThemeLists] = useState(() =>
    loadFromStorage(STORAGE_KEY_THEME_LISTS, [])
  );

  // Published Themenlisten (user-shared, for community database) - NOW SYNCED WITH SUPABASE
  const {
    data: publishedThemenlisten,
    saveItem: savePublishedThemenliste,
    removeItem: removePublishedThemenliste,
    loading: publishedThemenlistenLoading,
  } = usePublishedThemenlistenSync();

  // ============================================
  // NEW DATA MODEL: Content (separate from Blocks)
  // Content = What to learn (timeless)
  // BlockAllocation = When to learn (date + position)
  // Session = How to display (derived: Block + Content + time)
  // ============================================

  // Contents by ID (the learning material itself)
  const [contentsById, setContentsById] = useState(() =>
    loadFromStorage(STORAGE_KEY_CONTENTS, {})
  );

  /**
   * Archive the current Lernplan
   * Moves current blocks to archived list
   * Now synced to Supabase
   */
  const archiveCurrentPlan = useCallback(async () => {
    if (Object.keys(blocksByDate).length === 0) {
      return; // Nothing to archive
    }

    const archivedPlanData = {
      id: `archive_${Date.now()}`,
      blocks: { ...blocksByDate },
      metadata: {
        ...lernplanMetadata,
        archivedAt: new Date().toISOString()
      }
    };

    // Use the sync hook to archive
    await archivePlan(archivedPlanData);
  }, [blocksByDate, lernplanMetadata, archivePlan]);

  /**
   * Set calendar data from wizard Step 8
   * Archives the current plan if one exists
   * Now synced to Supabase
   * @param {Object} newBlocks - The blocksByDate object from the wizard
   * @param {Object} metadata - Lernplan metadata (name, startDate, endDate, etc.)
   */
  const setCalendarData = useCallback(async (newBlocks, metadata = {}) => {
    // If there's existing data, archive it first
    if (Object.keys(blocksByDate).length > 0 && lernplanMetadata) {
      await archiveCurrentPlan();
    }

    // Set new data using sync hook
    await setBlocksByDateSync(newBlocks);

    // Set metadata with creation timestamp using sync hook
    const newMetadata = {
      ...metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await updateLernplanMetadataSync(newMetadata);

    console.log('CalendarContext: Saved new calendar data', { blocks: Object.keys(newBlocks).length, metadata: newMetadata });
  }, [blocksByDate, lernplanMetadata, archiveCurrentPlan, setBlocksByDateSync, updateLernplanMetadataSync]);

  /**
   * Get all archived Lernpläne
   * @returns {Array} List of archived plans
   */
  const getArchivedPlans = useCallback(() => {
    return archivedLernplaene;
  }, [archivedLernplaene]);

  /**
   * Restore an archived Lernplan
   * Archives current plan first, then restores selected one
   * Now synced to Supabase
   * @param {string} archiveId - ID of the archived plan to restore
   */
  const restoreArchivedPlan = useCallback(async (archiveId) => {
    const planToRestore = archivedLernplaene.find(p => p.id === archiveId);
    if (!planToRestore) {
      console.error('Archived plan not found:', archiveId);
      return;
    }

    // Archive current plan first
    if (Object.keys(blocksByDate).length > 0) {
      await archiveCurrentPlan();
    }

    // Remove from archive using sync hook
    await deleteArchivedPlanSync(archiveId);

    // Restore blocks using sync hook
    await setBlocksByDateSync(planToRestore.blocks);

    // Restore metadata using sync hook
    const restoredMetadata = {
      ...planToRestore.metadata,
      restoredAt: new Date().toISOString()
    };
    delete restoredMetadata.archivedAt;
    await updateLernplanMetadataSync(restoredMetadata);
  }, [archivedLernplaene, blocksByDate, archiveCurrentPlan, deleteArchivedPlanSync, setBlocksByDateSync, updateLernplanMetadataSync]);

  /**
   * Delete an archived Lernplan permanently
   * Now synced to Supabase
   * @param {string} archiveId - ID of the archived plan to delete
   */
  const deleteArchivedPlan = useCallback(async (archiveId) => {
    await deleteArchivedPlanSync(archiveId);
  }, [deleteArchivedPlanSync]);

  /**
   * Update a single day's blocks
   * Now synced to Supabase
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {Array} blocks - The new blocks array for that day
   */
  const updateDayBlocks = useCallback(async (dateKey, blocks) => {
    // Use the sync hook to save day blocks
    await saveDayBlocksSync(dateKey, blocks);

    // Update metadata timestamp
    if (lernplanMetadata) {
      const updatedMetadata = {
        ...lernplanMetadata,
        updatedAt: new Date().toISOString()
      };
      await updateLernplanMetadataSync(updatedMetadata);
    }
  }, [lernplanMetadata, saveDayBlocksSync, updateLernplanMetadataSync]);

  /**
   * Get blocks for a specific date
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @returns {Array} The blocks for that day, or empty array
   */
  const getDayBlocks = useCallback((dateKey) => {
    return blocksByDate[dateKey] || [];
  }, [blocksByDate]);

  /**
   * Update Lernplan metadata (name, etc.) without changing blocks
   * Now synced to Supabase
   * @param {Object} updates - Partial metadata updates
   */
  const updateLernplanMetadata = useCallback(async (updates) => {
    if (!lernplanMetadata) {
      console.warn('No active Lernplan to update');
      return;
    }

    const updatedMetadata = {
      ...lernplanMetadata,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await updateLernplanMetadataSync(updatedMetadata);
  }, [lernplanMetadata, updateLernplanMetadataSync]);

  /**
   * Delete the current Lernplan (without archiving)
   * Now synced to Supabase
   */
  const deleteCurrentPlan = useCallback(async () => {
    await clearAllBlocksSync();
    await clearLernplanMetadataSync();
  }, [clearAllBlocksSync, clearLernplanMetadataSync]);

  /**
   * Clear all calendar data (for testing/reset)
   * Now synced to Supabase
   */
  const clearAllData = useCallback(async () => {
    await clearAllBlocksSync();
    await clearLernplanMetadataSync();
  }, [clearAllBlocksSync, clearLernplanMetadataSync]);

  /**
   * Check if there's an active Lernplan
   * @returns {boolean}
   */
  const hasActiveLernplan = useCallback(() => {
    return Object.keys(blocksByDate).length > 0;
  }, [blocksByDate]);

  /**
   * Archive Lernplan and convert to Themenliste
   * Extracts themes from calendar blocks and creates a ContentPlan
   * Clears calendar data after conversion
   * @returns {Object} The created ContentPlan
   */
  const archiveAndConvertToThemenliste = useCallback(async () => {
    // Helper to generate unique IDs
    const genId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 1. Collect all unique themes from blocksByDate grouped by RG/URG
    const themesByRgUrg = {};

    Object.values(blocksByDate).flat().forEach(block => {
      const rgId = block.rechtsgebiet || block.metadata?.rgId;
      const urgId = block.thema?.urgId || block.metadata?.urgId || block.unterrechtsgebiet;
      const thema = block.thema;

      if (!rgId) return; // Skip blocks without RG

      if (!themesByRgUrg[rgId]) themesByRgUrg[rgId] = {};

      // Handle blocks with themes
      if (thema) {
        const urgKey = urgId || 'unassigned';
        if (!themesByRgUrg[rgId][urgKey]) themesByRgUrg[rgId][urgKey] = [];

        // Avoid duplicates by checking theme ID
        if (!themesByRgUrg[rgId][urgKey].find(t => t.id === thema.id)) {
          themesByRgUrg[rgId][urgKey].push({
            ...thema,
            aufgaben: block.tasks || thema.aufgaben || []
          });
        }
      }

      // Also handle blocks with only tasks (no theme)
      if (!thema && block.tasks && block.tasks.length > 0) {
        const urgKey = urgId || 'unassigned';
        if (!themesByRgUrg[rgId][urgKey]) themesByRgUrg[rgId][urgKey] = [];

        // Create a pseudo-theme from the block's topic
        const pseudoTheme = {
          id: block.id,
          name: block.topicTitle || 'Unbenanntes Thema',
          aufgaben: block.tasks
        };

        if (!themesByRgUrg[rgId][urgKey].find(t => t.id === pseudoTheme.id)) {
          themesByRgUrg[rgId][urgKey].push(pseudoTheme);
        }
      }
    });

    // 2. Convert to ContentPlan structure
    const rechtsgebiete = Object.entries(themesByRgUrg).map(([rgId, urgs]) => ({
      id: genId(),
      rechtsgebietId: rgId,
      unterrechtsgebiete: Object.entries(urgs).map(([urgId, themes]) => ({
        id: genId(),
        unterrechtsgebietId: urgId === 'unassigned' ? null : urgId,
        name: urgId === 'unassigned' ? 'Nicht zugeordnet' : '',
        kapitel: themes.filter(t => t).map(theme => ({
          id: genId(),
          title: theme?.name || 'Thema',
          themen: (theme?.aufgaben || []).filter(a => a).map(aufgabe => ({
            id: genId(),
            name: aufgabe?.name || aufgabe?.title || 'Aufgabe',
            completed: aufgabe?.completed || false
          }))
        }))
      }))
    }));

    // 3. Create ContentPlan
    const contentPlan = {
      id: genId(),
      name: `${lernplanMetadata?.name || 'Lernplan'} (archiviert)`,
      type: 'themenliste',
      archived: true,
      rechtsgebiete,
      // Store wizard data for potential future restoration
      wizardData: {
        startDate: lernplanMetadata?.startDate,
        endDate: lernplanMetadata?.endDate,
        blocksPerDay: lernplanMetadata?.blocksPerDay,
        weekStructure: lernplanMetadata?.weekStructure,
        rechtsgebieteGewichtung: lernplanMetadata?.rechtsgebieteGewichtung,
        verteilungsmodus: lernplanMetadata?.verteilungsmodus,
        selectedRechtsgebiete: lernplanMetadata?.selectedRechtsgebiete,
      },
      createdAt: lernplanMetadata?.createdAt || new Date().toISOString(),
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 4. Save to Supabase
    await saveContentPlanToSupabase(contentPlan);

    // 5. Clear calendar data
    await clearAllBlocksSync();
    await clearLernplanMetadataSync();

    console.log('CalendarContext: Archived Lernplan and converted to Themenliste', {
      contentPlanId: contentPlan.id,
      rechtsgebieteCount: rechtsgebiete.length,
    });

    return contentPlan;
  }, [blocksByDate, lernplanMetadata, saveContentPlanToSupabase, clearAllBlocksSync, clearLernplanMetadataSync]);

  /**
   * T13: Archive Lernplan for later reactivation
   * Stores ALL wizard settings so the plan can be restored with a new date range
   * Does NOT convert to Themenliste - keeps full structure for Wizard prefill
   */
  const archiveLernplanForReactivation = useCallback(async () => {
    if (Object.keys(blocksByDate).length === 0 && !lernplanMetadata) {
      console.log('CalendarContext: Nothing to archive');
      return null;
    }

    // Helper to generate unique IDs
    const genId = () => `archive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Extract themen from blocks for potential restoration
    const themenFromBlocks = [];
    const completedThemen = [];

    Object.values(blocksByDate).flat().forEach(block => {
      if (block.thema) {
        const themaEntry = {
          id: block.thema.id,
          name: block.thema.name,
          urgId: block.thema.urgId || block.metadata?.urgId,
          rgId: block.rechtsgebiet || block.metadata?.rgId,
          aufgaben: block.thema.aufgaben || block.tasks || [],
        };

        // Check if any tasks are completed
        const hasCompletedTasks = (block.tasks || []).some(t => t.completed);
        if (hasCompletedTasks) {
          completedThemen.push(themaEntry);
        } else {
          themenFromBlocks.push(themaEntry);
        }
      }
    });

    // Build archived plan with ALL wizard settings
    const archivedPlan = {
      id: genId(),
      name: lernplanMetadata?.name || `Lernplan (archiviert ${new Date().toLocaleDateString('de-DE')})`,
      archivedAt: new Date().toISOString(),

      // Original dates (for reference only - will be replaced on reactivation)
      originalStartDate: lernplanMetadata?.startDate,
      originalEndDate: lernplanMetadata?.endDate,

      // Themen & Fortschritt
      themen: themenFromBlocks,
      completedThemen,

      // Full blocks data for potential full restoration
      blocks: { ...blocksByDate },

      // === Wizard Settings for Reactivation ===
      wizardSettings: {
        // Step 6: Erstellungsmethode (CRITICAL - determines wizard flow)
        creationMethod: lernplanMetadata?.creationMethod || 'manual',

        // Template ID (if template was used)
        templateId: lernplanMetadata?.selectedTemplate || lernplanMetadata?.templateId || null,

        // Step 2: Puffertage (Anzahl, nicht Daten)
        pufferTage: lernplanMetadata?.bufferDays ?? lernplanMetadata?.pufferTage ?? 0,

        // Step 3: Urlaubstage (Anzahl, nicht Daten)
        urlaubsTage: lernplanMetadata?.vacationDays ?? lernplanMetadata?.urlaubsTage ?? 0,

        // Step 4: Bloecke pro Tag
        blocksPerDay: lernplanMetadata?.blocksPerDay ?? 3,

        // Step 5: Wochenstruktur
        weekStructure: lernplanMetadata?.weekStructure || {
          montag: ['lernblock', 'lernblock', 'lernblock'],
          dienstag: ['lernblock', 'lernblock', 'lernblock'],
          mittwoch: ['lernblock', 'lernblock', 'lernblock'],
          donnerstag: ['lernblock', 'lernblock', 'lernblock'],
          freitag: ['lernblock', 'lernblock', 'lernblock'],
          samstag: ['free', 'free', 'free'],
          sonntag: ['free', 'free', 'free'],
        },

        // Step 7+: Rechtsgebiete
        selectedRechtsgebiete: lernplanMetadata?.selectedRechtsgebiete || [],

        // Step 14: Gewichtung
        rechtsgebieteGewichtung: lernplanMetadata?.rechtsgebieteGewichtung || {},

        // Step 20: Verteilungsmodus
        verteilungsmodus: lernplanMetadata?.verteilungsmodus || 'gemischt',
      },

      // Creation metadata
      createdAt: lernplanMetadata?.createdAt || new Date().toISOString(),
    };

    // Save to archived plans using sync hook
    await archivePlan(archivedPlan);

    // Clear calendar data
    await clearAllBlocksSync();
    await clearLernplanMetadataSync();

    console.log('CalendarContext: Archived Lernplan for reactivation', {
      id: archivedPlan.id,
      name: archivedPlan.name,
      themenCount: themenFromBlocks.length,
      completedCount: completedThemen.length,
      creationMethod: archivedPlan.wizardSettings.creationMethod,
    });

    return archivedPlan;
  }, [blocksByDate, lernplanMetadata, archivePlan, clearAllBlocksSync, clearLernplanMetadataSync]);

  // ============================================
  // CONTENT CRUD (NEW DATA MODEL)
  // Content = the learning material itself (timeless)
  // ============================================

  /**
   * Add or update a content item
   * @param {Object} content - The content data
   * @returns {Object} The saved content with ID
   */
  const saveContent = useCallback((content) => {
    const contentWithId = {
      ...content,
      id: content.id || `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: content.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = {
      ...contentsById,
      [contentWithId.id]: contentWithId,
    };

    setContentsById(updated);
    saveToStorage(STORAGE_KEY_CONTENTS, updated);
    return contentWithId;
  }, [contentsById]);

  /**
   * Get a content item by ID
   * @param {string} contentId - The content ID
   * @returns {Object|null} The content or null
   */
  const getContent = useCallback((contentId) => {
    return contentsById[contentId] || null;
  }, [contentsById]);

  /**
   * Delete a content item
   * @param {string} contentId - The content ID
   */
  const deleteContent = useCallback((contentId) => {
    const updated = { ...contentsById };
    delete updated[contentId];
    setContentsById(updated);
    saveToStorage(STORAGE_KEY_CONTENTS, updated);
  }, [contentsById]);

  /**
   * Calculate repeat dates based on repeat settings
   * @param {string} startDateKey - Starting date (YYYY-MM-DD)
   * @param {string} repeatType - 'daily', 'weekly', 'monthly', or 'custom'
   * @param {number} repeatCount - Number of repetitions (used when repeatEndMode !== 'date')
   * @param {Array} customDays - For 'custom' type, array of weekday indices (0=Sun, 1=Mon, etc.)
   * @param {string} repeatEndMode - 'count' or 'date' (optional, defaults to 'count')
   * @param {string} repeatEndDate - End date string YYYY-MM-DD (used when repeatEndMode === 'date')
   * @returns {Array} Array of date strings (YYYY-MM-DD)
   */
  const calculateRepeatSession = useCallback((startDateKey, repeatType, repeatCount, customDays = [], repeatEndMode = 'count', repeatEndDate = null) => {
    const dates = [];
    const startDate = new Date(startDateKey + 'T12:00:00'); // Use noon to avoid timezone issues

    // FIX: Support both count-based and date-based repeat endings
    const useEndDate = repeatEndMode === 'date' && repeatEndDate;
    const endDateObj = useEndDate ? new Date(repeatEndDate + 'T23:59:59') : null;
    // T30 FIX: repeatCount is TOTAL sessions (incl. original), so we need repeatCount-1 additional dates
    const maxIterations = useEndDate ? 365 : Math.max(0, repeatCount - 1);

    let iteration = 0;
    let i = 1;

    while (iteration < maxIterations) {
      let nextDate = new Date(startDate);

      switch (repeatType) {
        case 'daily':
          nextDate.setDate(startDate.getDate() + i);
          break;
        case 'weekly':
          nextDate.setDate(startDate.getDate() + (i * 7));
          break;
        case 'monthly':
          nextDate.setMonth(startDate.getMonth() + i);
          break;
        case 'custom': {
          // For custom, find next matching weekday
          // This is more complex - we need to iterate day by day
          let daysAdded = 0;
          let currentDate = new Date(startDate);
          let matchesFound = 0;
          while (matchesFound < i) {
            daysAdded++;
            currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + daysAdded);
            if (customDays.includes(currentDate.getDay())) {
              matchesFound++;
            }
          }
          nextDate = currentDate;
          break;
        }
        default:
          nextDate.setDate(startDate.getDate() + (i * 7)); // Default to weekly
      }

      // FIX: Check if we've passed the end date (for date mode)
      if (useEndDate && nextDate > endDateObj) {
        break;
      }

      // FIX: Check if we've reached the count (for count mode)
      if (!useEndDate && iteration >= repeatCount) {
        break;
      }

      // KA-002 FIX: Verwende lokale Zeit statt UTC
      const year = nextDate.getFullYear();
      const month = String(nextDate.getMonth() + 1).padStart(2, '0');
      const day = String(nextDate.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);

      iteration++;
      i++;
    }

    return dates;
  }, []);

  /**
   * Add a block with automatic content creation
   * Creates content from block data if not exists
   * Handles repeat/series appointments
   * @param {string} dateKey - The date (YYYY-MM-DD)
   * @param {Object} blockData - Block data with embedded content
   * @returns {{ block: Object, content: Object }}
   */
  const addBlockWithContent = useCallback((dateKey, blockData) => {
    // Create or get content ID
    const contentId = blockData.contentId || blockData.topicId || `content-${Date.now()}`;

    // Save content if it has content fields
    const content = saveContent({
      id: contentId,
      title: blockData.title || blockData.topicTitle || 'Lernblock',
      description: blockData.description || '',
      rechtsgebiet: blockData.rechtsgebiet || '',
      unterrechtsgebiet: blockData.unterrechtsgebiet || '',
      blockType: blockData.blockType || 'lernblock',
      aufgaben: blockData.aufgaben || [],
    });

    // Generate a series ID if this is a repeating appointment
    const seriesId = blockData.repeatEnabled ? `series-${Date.now()}` : null;

    // Create base block referencing the content
    const createBlock = (isOriginal = true) => ({
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      contentId: content.id,
      position: blockData.position || 1,
      blockType: blockData.blockType || 'lernblock',
      isLocked: blockData.isLocked || false,
      isFromLernplan: blockData.isFromLernplan || false,
      tasks: blockData.tasks || [],
      // W5: Include rechtsgebiet for coloring
      rechtsgebiet: blockData.rechtsgebiet || null,
      // Time overrides (optional)
      hasTime: blockData.hasTime || false,
      startHour: blockData.startHour,
      duration: blockData.duration,
      startTime: blockData.startTime,
      endTime: blockData.endTime,
      // Repeat settings (only on original)
      repeatEnabled: isOriginal ? (blockData.repeatEnabled || false) : false,
      repeatType: isOriginal ? blockData.repeatType : null,
      repeatCount: isOriginal ? blockData.repeatCount : null,
      seriesId: seriesId, // Links all blocks in a series
      createdAt: new Date().toISOString(),
    });

    // Start with the original block
    const originalBlock = createBlock(true);
    let updatedBlocks = { ...blocksByDate };

    // KA-003 FIX: Validate 4-block limit before adding original block
    const currentBlocks = updatedBlocks[dateKey] || [];
    if (currentBlocks.length >= MAX_BLOCKS_PER_DAY) {
      console.error(`[CalendarContext] Cannot add block: Day ${dateKey} already has ${MAX_BLOCKS_PER_DAY} blocks`);
      return null; // Return null to indicate failure
    }

    // Add original block to the first date
    updatedBlocks[dateKey] = [...currentBlocks, originalBlock];

    // If repeat is enabled, create blocks for all repeat dates
    if (blockData.repeatEnabled && blockData.repeatType && blockData.repeatCount > 0) {
      const repeatDates = calculateRepeatSession(
        dateKey,
        blockData.repeatType,
        blockData.repeatCount,
        blockData.customDays || []
      );

      // KA-003 FIX: Filter out dates that already have 4 blocks
      const skippedDates = [];
      repeatDates.forEach(repeatDateKey => {
        const existingBlocks = updatedBlocks[repeatDateKey] || [];
        if (existingBlocks.length >= MAX_BLOCKS_PER_DAY) {
          skippedDates.push(repeatDateKey);
          return; // Skip this date
        }
        const repeatBlock = createBlock(false);
        updatedBlocks[repeatDateKey] = [...existingBlocks, repeatBlock];
      });

      if (skippedDates.length > 0) {
        console.warn(`[CalendarContext] Skipped ${skippedDates.length} repeat dates due to 4-block limit:`, skippedDates);
      }
    }

    setBlocksByDate(updatedBlocks);
    saveToStorage(STORAGE_KEY_BLOCKS, updatedBlocks);

    return { block: originalBlock, content };
  }, [blocksByDate, contentsById, saveContent, calculateRepeatSession]);

  /**
   * Build a display session from block (merges block + content)
   * @param {Object} block - The block allocation
   * @returns {Object} Session for display
   */
  const buildSessionFromBlock = useCallback((block) => {
    const content = contentsById[block.contentId] || {};

    // Position to time mapping
    const positionTimes = {
      1: { startHour: 8, endHour: 10 },
      2: { startHour: 10, endHour: 12 },
      3: { startHour: 14, endHour: 16 },
      4: { startHour: 16, endHour: 18 },
    };
    const posTime = positionTimes[block.position] || positionTimes[1];

    return {
      // IDs
      id: content.id || block.contentId,
      blockId: block.id,
      contentId: block.contentId,

      // Time (from block override or position default)
      startHour: block.startHour ?? posTime.startHour,
      duration: block.duration ?? (posTime.endHour - posTime.startHour),
      startTime: block.startTime,
      endTime: block.endTime,
      hasTime: block.hasTime || false,

      // From Content
      title: content.title || 'Lernblock',
      description: content.description || '',
      rechtsgebiet: content.rechtsgebiet,
      unterrechtsgebiet: content.unterrechtsgebiet,

      // From Block
      position: block.position,
      blockType: block.blockType || content.blockType || 'lernblock',
      isBlocked: block.isLocked || false,
      isLocked: block.isLocked || false,
      isFromLernplan: block.isFromLernplan || false, // Distinguishes wizard vs manual
      tasks: block.tasks || [],

      // Repeat / Series
      repeatEnabled: block.repeatEnabled || false,
      repeatType: block.repeatType,
      repeatCount: block.repeatCount,
      seriesId: block.seriesId || null, // Links all blocks in a series
    };
  }, [contentsById]);

  /**
   * Get sessions for a date (blocks merged with content)
   * BUG-010 FIX: Uses visibleBlocksByDate to exclude archived content plans
   * @param {string} dateKey - The date (YYYY-MM-DD)
   * @returns {Array} Array of display sessions
   */
  const getSessionsForDate = useCallback((dateKey) => {
    const blocks = visibleBlocksByDate[dateKey] || [];
    return blocks.map(buildSessionFromBlock);
  }, [visibleBlocksByDate, buildSessionFromBlock]);

  // ============================================
  // PRIVATE BLOCKS CRUD
  // ============================================

  /**
   * Add a private block to a specific date
   * Now synced to Supabase with repeat support
   * FIX BUG-005: Use batch update to avoid stale closure issues
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {Object} block - The private block data
   */
  const addPrivateSession = useCallback(async (dateKey, block) => {
    // Generate a series ID if this is a repeating appointment
    const seriesId = block.repeatEnabled ? `private-series-${Date.now()}` : null;

    console.log('[addPrivateSession] Called with:', {
      dateKey,
      repeatEnabled: block.repeatEnabled,
      repeatType: block.repeatType,
      repeatCount: block.repeatCount,
      repeatEndMode: block.repeatEndMode,
      repeatEndDate: block.repeatEndDate,
      seriesId
    });

    // FIX: Support both count-based and date-based repeat endings
    const hasRepeat = block.repeatEnabled && block.repeatType &&
      (block.repeatCount > 0 || (block.repeatEndMode === 'date' && block.repeatEndDate));

    // T30: Calculate repeat dates first to know total count
    let repeatDates = [];
    if (hasRepeat) {
      repeatDates = calculateRepeatSession(
        dateKey,
        block.repeatType,
        block.repeatCount,
        block.customDays || [],
        block.repeatEndMode || 'count',
        block.repeatEndDate
      );
      console.log('[addPrivateSession] Repeat dates calculated:', repeatDates);
    }

    // T30: Total sessions = 1 (original) + repeatDates.length
    const seriesTotal = hasRepeat ? 1 + repeatDates.length : null;

    // Generate the original session ID first (needed for seriesOriginId)
    const originalSessionId = `private-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // T30: Create the base session with ID and series metadata
    const createSession = (isOriginal = true, seriesIndex = null) => ({
      ...block,
      id: isOriginal ? originalSessionId : `private-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blockType: 'private',
      createdAt: new Date().toISOString(),
      // Series linking
      seriesId: seriesId,
      // T30: Series metadata for display (stored on ALL sessions in series)
      seriesIndex: hasRepeat ? seriesIndex : null,
      seriesTotal: hasRepeat ? seriesTotal : null,
      seriesOriginId: hasRepeat ? originalSessionId : null,
      // Only store repeat settings on the original session
      repeatEnabled: isOriginal ? (block.repeatEnabled || false) : false,
      repeatType: isOriginal ? block.repeatType : null,
      repeatCount: isOriginal ? block.repeatCount : null,
      repeatEndMode: isOriginal ? block.repeatEndMode : null,
      repeatEndDate: isOriginal ? block.repeatEndDate : null,
      customDays: isOriginal ? block.customDays : null,
    });

    // T30: Create the original session for the first date (index = 1)
    const originalSession = createSession(true, 1);

    // Collect all updates to avoid stale closure issues
    // Each date gets its own array of sessions
    const updatesToMake = {
      [dateKey]: [...(privateSessionsByDate[dateKey] || []), originalSession],
    };

    // If repeat is enabled, collect sessions for all repeat dates
    if (hasRepeat) {
      // T30: Each repeat date gets an incrementing index (starting at 2)
      repeatDates.forEach((repeatDateKey, idx) => {
        const repeatSession = createSession(false, idx + 2); // Index starts at 2 (original is 1)
        const existingSessions = updatesToMake[repeatDateKey] || privateSessionsByDate[repeatDateKey] || [];
        updatesToMake[repeatDateKey] = [...existingSessions, repeatSession];
      });
    }

    console.log('[addPrivateSession] Updates to make:', Object.keys(updatesToMake).length, 'dates');

    // Use batch save to update all dates in one atomic operation
    await saveDayBlocksBatch(updatesToMake);

    console.log('[addPrivateSession] Batch save completed');

    return originalSession;
  }, [privateSessionsByDate, saveDayBlocksBatch, calculateRepeatSession]);

  /**
   * Update a private block
   * Now synced to Supabase
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} blockId - The block ID to update
   * @param {Object} updates - Partial updates to apply
   */
  const updatePrivateBlock = useCallback(async (dateKey, blockId, updates) => {
    const currentBlocks = privateSessionsByDate[dateKey] || [];
    const updatedBlocks = currentBlocks.map(block =>
      block.id === blockId
        ? { ...block, ...updates, updatedAt: new Date().toISOString() }
        : block
    );

    await saveDayBlocks(dateKey, updatedBlocks);
  }, [privateSessionsByDate, saveDayBlocks]);

  /**
   * Delete a private block
   * Now synced to Supabase
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} blockId - The block ID to delete
   */
  const deletePrivateSession = useCallback(async (dateKey, blockId) => {
    const currentBlocks = privateSessionsByDate[dateKey] || [];
    const filteredBlocks = currentBlocks.filter(block => block.id !== blockId);

    await saveDayBlocks(dateKey, filteredBlocks);
  }, [privateSessionsByDate, saveDayBlocks]);

  /**
   * Delete all private blocks in a series (by seriesId)
   * Useful for deleting all recurring private appointments at once
   * FIX BUG-005: Use batch update to avoid stale closure issues
   * @param {string} seriesId - The series ID
   */
  const deleteSeriesPrivateBlocks = useCallback(async (seriesId) => {
    if (!seriesId) return;

    // Collect all updates to make in one batch
    const updatesToMake = {};

    // Iterate through all dates and collect filtered blocks
    for (const dateKey of Object.keys(privateSessionsByDate)) {
      const dayBlocks = privateSessionsByDate[dateKey] || [];
      const hasSeriesBlocks = dayBlocks.some(block => block.seriesId === seriesId);

      if (hasSeriesBlocks) {
        const filteredBlocks = dayBlocks.filter(block => block.seriesId !== seriesId);
        updatesToMake[dateKey] = filteredBlocks;
      }
    }

    // Use batch save to update all dates in one atomic operation
    if (Object.keys(updatesToMake).length > 0) {
      await saveDayBlocksBatch(updatesToMake);
    }
  }, [privateSessionsByDate, saveDayBlocksBatch]);

  /**
   * Get private blocks for a specific date
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @returns {Array} The private blocks for that day
   */
  const getPrivateBlocks = useCallback((dateKey) => {
    return privateSessionsByDate[dateKey] || [];
  }, [privateSessionsByDate]);

  // ============================================
  // TIME BLOCKS CRUD (BUG-023 FIX)
  // Time-based blocks for Week/Dashboard views
  // NEVER use blocksByDate for Week/Dashboard - use timeSessionsByDate
  // ============================================

  /**
   * Add a time block to a specific date
   * Now synced to Supabase
   * Handles repeat/series appointments
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {Object} block - The time block data (must have startTime, endTime)
   */
  const addTimeSession = useCallback(async (dateKey, block) => {
    // Generate a series ID if this is a repeating session
    const seriesId = block.repeatEnabled ? `timesession-series-${Date.now()}` : null;

    console.log('[addTimeSession] Called with:', {
      dateKey,
      repeatEnabled: block.repeatEnabled,
      repeatType: block.repeatType,
      repeatCount: block.repeatCount,
      repeatEndMode: block.repeatEndMode,
      repeatEndDate: block.repeatEndDate,
      seriesId
    });

    // FIX: Support both count-based and date-based repeat endings
    const hasRepeat = block.repeatEnabled && block.repeatType &&
      (block.repeatCount > 0 || (block.repeatEndMode === 'date' && block.repeatEndDate));

    // T30: Calculate repeat dates first to know total count
    let repeatDates = [];
    if (hasRepeat) {
      repeatDates = calculateRepeatSession(
        dateKey,
        block.repeatType,
        block.repeatCount,
        block.customDays || [],
        block.repeatEndMode || 'count',
        block.repeatEndDate
      );
      console.log('[addTimeSession] Repeat dates calculated:', repeatDates);
    }

    // T30: Total sessions = 1 (original) + repeatDates.length
    const seriesTotal = hasRepeat ? 1 + repeatDates.length : null;

    // Generate the original block ID first (needed for seriesOriginId)
    const originalBlockId = `timeblock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // T30: Create the base block with ID and series metadata
    const createBlock = (isOriginal = true, seriesIndex = null) => ({
      ...block,
      id: isOriginal ? originalBlockId : `timeblock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blockType: block.blockType || 'lernblock',
      createdAt: new Date().toISOString(),
      // Series linking
      seriesId: seriesId,
      // T30: Series metadata for display (stored on ALL blocks in series)
      seriesIndex: hasRepeat ? seriesIndex : null,
      seriesTotal: hasRepeat ? seriesTotal : null,
      seriesOriginId: hasRepeat ? originalBlockId : null,
      // Only store repeat settings on the original block
      repeatEnabled: isOriginal ? (block.repeatEnabled || false) : false,
      repeatType: isOriginal ? block.repeatType : null,
      repeatCount: isOriginal ? block.repeatCount : null,
      repeatEndMode: isOriginal ? block.repeatEndMode : null,
      repeatEndDate: isOriginal ? block.repeatEndDate : null,
      customDays: isOriginal ? block.customDays : null,
    });

    // T30: Create the original block for the first date (index = 1)
    const originalBlock = createBlock(true, 1);

    // Collect all updates to avoid stale closure issues
    const updatesToMake = {
      [dateKey]: [...(timeSessionsByDate[dateKey] || []), originalBlock],
    };

    // If repeat is enabled, collect blocks for all repeat dates
    if (hasRepeat) {
      // T30: Each repeat date gets an incrementing index (starting at 2)
      repeatDates.forEach((repeatDateKey, idx) => {
        const repeatBlock = createBlock(false, idx + 2); // Index starts at 2 (original is 1)
        const existingBlocks = updatesToMake[repeatDateKey] || timeSessionsByDate[repeatDateKey] || [];
        updatesToMake[repeatDateKey] = [...existingBlocks, repeatBlock];
      });
    }

    console.log('[addTimeSession] Updates to make:', Object.keys(updatesToMake).length, 'dates');

    // Use batch save to update all dates in one atomic operation
    await saveTimeBlocksDayBlocksBatch(updatesToMake);

    console.log('[addTimeSession] Batch save completed');

    return originalBlock;
  }, [timeSessionsByDate, saveTimeBlocksDayBlocksBatch, calculateRepeatSession]);

  /**
   * Update a time block
   * Now synced to Supabase
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} blockId - The block ID to update
   * @param {Object} updates - Partial updates to apply
   */
  const updateTimeBlock = useCallback(async (dateKey, blockId, updates) => {
    const currentBlocks = timeSessionsByDate[dateKey] || [];
    const updatedBlocks = currentBlocks.map(block =>
      block.id === blockId
        ? { ...block, ...updates, updatedAt: new Date().toISOString() }
        : block
    );

    await saveTimeBlocksDayBlocks(dateKey, updatedBlocks);
  }, [timeSessionsByDate, saveTimeBlocksDayBlocks]);

  /**
   * Delete a time block
   * Now synced to Supabase
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} blockId - The block ID to delete
   */
  const deleteTimeBlock = useCallback(async (dateKey, blockId) => {
    const currentBlocks = timeSessionsByDate[dateKey] || [];
    const filteredBlocks = currentBlocks.filter(block => block.id !== blockId);

    await saveTimeBlocksDayBlocks(dateKey, filteredBlocks);
  }, [timeSessionsByDate, saveTimeBlocksDayBlocks]);

  /**
   * Delete all time blocks in a series (by seriesId)
   * Useful for deleting all recurring time blocks at once
   * @param {string} seriesId - The series ID
   */
  const deleteSeriesTimeBlocks = useCallback(async (seriesId) => {
    if (!seriesId) return;

    // Collect all updates to make in one batch
    const updatesToMake = {};

    // Iterate through all dates and collect filtered blocks
    for (const dateKey of Object.keys(timeSessionsByDate)) {
      const dayBlocks = timeSessionsByDate[dateKey] || [];
      const hasSeriesBlocks = dayBlocks.some(block => block.seriesId === seriesId);

      if (hasSeriesBlocks) {
        const filteredBlocks = dayBlocks.filter(block => block.seriesId !== seriesId);
        updatesToMake[dateKey] = filteredBlocks;
      }
    }

    // Use batch save to update all dates in one atomic operation
    if (Object.keys(updatesToMake).length > 0) {
      await saveTimeBlocksDayBlocksBatch(updatesToMake);
    }
  }, [timeSessionsByDate, saveTimeBlocksDayBlocksBatch]);

  /**
   * Get time blocks for a specific date
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @returns {Array} The time blocks for that day
   */
  const getTimeBlocks = useCallback((dateKey) => {
    return timeSessionsByDate[dateKey] || [];
  }, [timeSessionsByDate]);

  // ============================================
  // BLOCK DELETE OPERATIONS
  // ============================================

  /**
   * Delete a single block from a specific date
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} blockId - The block ID to delete
   */
  const deleteBlock = useCallback((dateKey, blockId) => {
    const currentBlocks = blocksByDate[dateKey] || [];
    const filteredBlocks = currentBlocks.filter(block => block.id !== blockId);

    const updatedBlocks = { ...blocksByDate };

    // KA-002 FIX: Remove empty date entries to prevent ghost blocks
    if (filteredBlocks.length > 0) {
      updatedBlocks[dateKey] = filteredBlocks;
    } else {
      delete updatedBlocks[dateKey];
    }

    setBlocksByDate(updatedBlocks);
    saveToStorage(STORAGE_KEY_BLOCKS, updatedBlocks);
  }, [blocksByDate]);

  /**
   * Delete all blocks in a series (by seriesId)
   * Useful for deleting all recurring appointments at once
   * @param {string} seriesId - The series ID
   */
  const deleteSeriesBlocks = useCallback((seriesId) => {
    if (!seriesId) return;

    const updatedBlocks = { ...blocksByDate };

    // Iterate through all dates and remove blocks with matching seriesId
    Object.keys(updatedBlocks).forEach(dateKey => {
      const dayBlocks = updatedBlocks[dateKey] || [];
      updatedBlocks[dateKey] = dayBlocks.filter(block => block.seriesId !== seriesId);

      // Clean up empty date entries
      if (updatedBlocks[dateKey].length === 0) {
        delete updatedBlocks[dateKey];
      }
    });

    setBlocksByDate(updatedBlocks);
    saveToStorage(STORAGE_KEY_BLOCKS, updatedBlocks);
  }, [blocksByDate]);

  // ============================================
  // TASKS CRUD
  // ============================================

  /**
   * Add a task to a specific date
   * Now synced to Supabase
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {Object} task - The task data
   */
  const addTask = useCallback(async (dateKey, task) => {
    const taskWithId = {
      ...task,
      id: task.id || `task-${Date.now()}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const currentTasks = tasksByDate[dateKey] || [];
    const newTasks = [...currentTasks, taskWithId];

    await saveDayTasks(dateKey, newTasks);
    return taskWithId;
  }, [tasksByDate, saveDayTasks]);

  /**
   * Update a task
   * Now synced to Supabase
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} taskId - The task ID to update
   * @param {Object} updates - Partial updates to apply
   */
  const updateTask = useCallback(async (dateKey, taskId, updates) => {
    const currentTasks = tasksByDate[dateKey] || [];
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    );

    await saveDayTasks(dateKey, updatedTasks);
  }, [tasksByDate, saveDayTasks]);

  /**
   * Toggle task completion status
   * Now synced to Supabase
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} taskId - The task ID to toggle
   */
  const toggleTaskComplete = useCallback(async (dateKey, taskId) => {
    const currentTasks = tasksByDate[dateKey] || [];
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId
        ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
        : task
    );

    await saveDayTasks(dateKey, updatedTasks);
  }, [tasksByDate, saveDayTasks]);

  /**
   * Delete a task
   * Now synced to Supabase
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} taskId - The task ID to delete
   */
  const deleteTask = useCallback(async (dateKey, taskId) => {
    const currentTasks = tasksByDate[dateKey] || [];
    const filteredTasks = currentTasks.filter(task => task.id !== taskId);

    await saveDayTasks(dateKey, filteredTasks);
  }, [tasksByDate, saveDayTasks]);

  /**
   * Get tasks for a specific date
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @returns {Array} The tasks for that day
   */
  const getTasks = useCallback((dateKey) => {
    return tasksByDate[dateKey] || [];
  }, [tasksByDate]);

  /**
   * FR1: Schedule a To-Do task to a block (soft delete - marks as scheduled instead of deleting)
   * This allows the task to be restored when removed from the block
   * @param {string} taskId - The task ID to schedule
   * @param {Object} blockInfo - { blockId, date, blockTitle }
   */
  const scheduleTaskToBlock = useCallback(async (taskId, blockInfo) => {
    // Search through all dates to find the task
    for (const [dateKey, tasks] of Object.entries(tasksByDate)) {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        const updatedTasks = tasks.map(t =>
          t.id === taskId
            ? { ...t, scheduledInBlock: blockInfo }
            : t
        );
        await saveDayTasks(dateKey, updatedTasks);
        return;
      }
    }
  }, [tasksByDate, saveDayTasks]);

  /**
   * FR1: Unschedule a To-Do task from a block (restore to To-Do list)
   * Removes the scheduledInBlock marker so the task appears in To-Do again
   * @param {string} taskId - The task ID to unschedule
   */
  const unscheduleTaskFromBlock = useCallback(async (taskId) => {
    // Search through all dates to find the task
    for (const [dateKey, tasks] of Object.entries(tasksByDate)) {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        const updatedTasks = tasks.map(t =>
          t.id === taskId
            ? { ...t, scheduledInBlock: null }
            : t
        );
        await saveDayTasks(dateKey, updatedTasks);
        return;
      }
    }
  }, [tasksByDate, saveDayTasks]);

  // ============================================
  // THEME LISTS CRUD (dateless topic lists)
  // ============================================

  /**
   * Create a new theme list
   * @param {Object} listData - { name, topics: [...] }
   * @returns {Object} The created list with ID
   */
  const createThemeList = useCallback((listData) => {
    const newList = {
      id: `themelist-${Date.now()}`,
      name: listData.name || 'Neue Themenliste',
      topics: (listData.topics || []).map((topic, index) => ({
        ...topic,
        id: topic.id || `topic-${Date.now()}-${index}`,
        completed: false,
      })),
      createdAt: new Date().toISOString(),
    };

    const updated = [...themeLists, newList];
    setThemeLists(updated);
    saveToStorage(STORAGE_KEY_THEME_LISTS, updated);
    return newList;
  }, [themeLists]);

  /**
   * Update a theme list
   * @param {string} listId - The list ID
   * @param {Object} updates - Partial updates
   */
  const updateThemeList = useCallback((listId, updates) => {
    const updated = themeLists.map(list =>
      list.id === listId
        ? { ...list, ...updates, updatedAt: new Date().toISOString() }
        : list
    );
    setThemeLists(updated);
    saveToStorage(STORAGE_KEY_THEME_LISTS, updated);
  }, [themeLists]);

  /**
   * Delete a theme list
   * @param {string} listId - The list ID
   */
  const deleteThemeList = useCallback((listId) => {
    const updated = themeLists.filter(list => list.id !== listId);
    setThemeLists(updated);
    saveToStorage(STORAGE_KEY_THEME_LISTS, updated);
  }, [themeLists]);

  /**
   * Toggle a topic's completed status in a theme list
   * @param {string} listId - The list ID
   * @param {string} topicId - The topic ID
   */
  const toggleThemeListTopicComplete = useCallback((listId, topicId) => {
    const updated = themeLists.map(list => {
      if (list.id !== listId) return list;
      return {
        ...list,
        topics: list.topics.map(topic =>
          topic.id === topicId
            ? { ...topic, completed: !topic.completed }
            : topic
        ),
        updatedAt: new Date().toISOString(),
      };
    });
    setThemeLists(updated);
    saveToStorage(STORAGE_KEY_THEME_LISTS, updated);
  }, [themeLists]);

  /**
   * Add a topic to a theme list
   * @param {string} listId - The list ID
   * @param {Object} topicData - The topic data
   */
  const addTopicToThemeList = useCallback((listId, topicData) => {
    const newTopic = {
      ...topicData,
      id: topicData.id || `topic-${Date.now()}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updated = themeLists.map(list => {
      if (list.id !== listId) return list;
      return {
        ...list,
        topics: [...list.topics, newTopic],
        updatedAt: new Date().toISOString(),
      };
    });
    setThemeLists(updated);
    saveToStorage(STORAGE_KEY_THEME_LISTS, updated);
    return newTopic;
  }, [themeLists]);

  /**
   * Remove a topic from a theme list
   * @param {string} listId - The list ID
   * @param {string} topicId - The topic ID
   */
  const removeTopicFromThemeList = useCallback((listId, topicId) => {
    const updated = themeLists.map(list => {
      if (list.id !== listId) return list;
      return {
        ...list,
        topics: list.topics.filter(topic => topic.id !== topicId),
        updatedAt: new Date().toISOString(),
      };
    });
    setThemeLists(updated);
    saveToStorage(STORAGE_KEY_THEME_LISTS, updated);
  }, [themeLists]);

  /**
   * Get all theme lists
   * @returns {Array} All theme lists
   */
  const getThemeLists = useCallback(() => {
    return themeLists;
  }, [themeLists]);

  /**
   * Get a specific theme list by ID
   * @param {string} listId - The list ID
   * @returns {Object|null} The theme list or null
   */
  const getThemeListById = useCallback((listId) => {
    return themeLists.find(list => list.id === listId) || null;
  }, [themeLists]);

  // ============================================
  // CONTENT PLANS CRUD (Lernpläne & Themenlisten)
  // New hierarchical structure: Plan → Rechtsgebiete → Unterrechtsgebiete → Kapitel → Themen → Aufgaben
  // ============================================

  /**
   * Generate unique ID
   */
  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Create a new content plan (Lernplan or Themenliste)
   * @param {Object} planData - { name, type: 'lernplan'|'themenliste', description?, mode?, examDate? }
   * @returns {Object} The created plan
   */
  const createContentPlan = useCallback(async (planData) => {
    const newPlan = {
      id: generateId(),
      name: planData.name || '',
      type: planData.type || 'themenliste',
      description: planData.description || '',
      mode: planData.mode || 'standard',
      examDate: planData.examDate || null,
      archived: false,
      rechtsgebiete: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Supabase (also updates local state)
    await saveContentPlanToSupabase(newPlan);
    return newPlan;
  }, [saveContentPlanToSupabase]);

  /**
   * Update a content plan
   * Now syncs to Supabase when authenticated
   * @param {string} planId - The plan ID
   * @param {Object} updates - Partial updates
   */
  const updateContentPlan = useCallback(async (planId, updates) => {
    const plan = contentPlans.find(p => p.id === planId);
    if (!plan) return;

    const updatedPlan = {
      ...plan,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Save to Supabase (also updates local state)
    await saveContentPlanToSupabase(updatedPlan);
  }, [contentPlans, saveContentPlanToSupabase]);

  /**
   * Delete a content plan
   * Now syncs to Supabase when authenticated
   * @param {string} planId - The plan ID
   */
  const deleteContentPlan = useCallback(async (planId) => {
    // Remove from Supabase (also updates local state)
    await removeContentPlanFromSupabase(planId);
  }, [removeContentPlanFromSupabase]);

  /**
   * Archive/Unarchive a content plan (toggle)
   * Now syncs to Supabase when authenticated
   * @param {string} planId - The plan ID
   */
  const archiveContentPlan = useCallback(async (planId) => {
    const plan = contentPlans.find(p => p.id === planId);
    if (!plan) return;

    // Toggle archived state
    await updateContentPlan(planId, { archived: !plan.archived });
  }, [contentPlans, updateContentPlan]);

  /**
   * Get content plans by type
   * @param {string} type - 'lernplan' | 'themenliste' | 'all'
   * @param {boolean} includeArchived - Include archived plans
   * @returns {Array} Filtered plans
   */
  const getContentPlansByType = useCallback((type = 'all', includeArchived = false, includeDrafts = false) => {
    let plans = contentPlans;
    if (!includeArchived) {
      plans = plans.filter(p => !p.archived);
    }
    // T23 Problem 8: Filter out drafts by default - they should not appear in Lernpläne
    if (!includeDrafts) {
      plans = plans.filter(p => p.status !== 'draft');
    }
    if (type !== 'all') {
      plans = plans.filter(p => p.type === type);
    }
    return plans;
  }, [contentPlans]);

  /**
   * Get a content plan by ID
   * @param {string} planId - The plan ID
   * @returns {Object|null} The plan or null
   */
  const getContentPlanById = useCallback((planId) => {
    return contentPlans.find(p => p.id === planId) || null;
  }, [contentPlans]);

  /**
   * Import a Themenliste from a template
   * Creates a new content plan with copied and re-ID'd structure
   * @param {Object} template - The template data from themenlisten-templates.js
   * @returns {Object} The created plan
   */
  const importThemenlisteTemplate = useCallback((template) => {
    // Guard: template must exist
    if (!template) return null;

    // Helper to regenerate all IDs in the hierarchy
    const regenerateIds = (rechtsgebiete) => {
      return (rechtsgebiete || []).filter(rg => rg).map(rg => ({
        id: generateId(),
        rechtsgebietId: rg.rechtsgebietId,
        name: rg?.name || '',
        unterrechtsgebiete: (rg.unterrechtsgebiete || []).filter(u => u).map(urg => ({
          id: generateId(),
          unterrechtsgebietId: urg?.id || urg?.unterrechtsgebietId,
          name: urg?.name || '',
          kategorie: urg?.kategorie || '',
          kapitel: (urg?.kapitel || []).filter(k => k).map(k => ({
            id: generateId(),
            title: k?.title || '',
            themen: (k?.themen || []).filter(t => t).map(t => ({
              id: generateId(),
              title: t?.title || '',
              aufgaben: (t?.aufgaben || []).filter(a => a).map(a => ({
                id: generateId(),
                title: a?.title || '',
                completed: false,
              })),
            })),
          })),
        })),
      }));
    };

    const newPlan = {
      id: generateId(),
      name: template?.name || 'Themenliste',
      type: 'themenliste',
      description: template.description || '',
      mode: template.mode || 'standard',
      archived: false,
      rechtsgebiete: regenerateIds(template.rechtsgebiete || []),
      importedFrom: template.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newPlan, ...contentPlans];
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
    // Sync new plan to Supabase
    saveContentPlanToSupabase(newPlan);
    return newPlan;
  }, [contentPlans, saveContentPlanToSupabase]);

  /**
   * Export a Themenliste as JSON file for sharing
   * @param {string} planId - The plan ID to export
   */
  const exportThemenlisteAsJson = useCallback((planId) => {
    const plan = contentPlans.find(p => p.id === planId);
    if (!plan) {
      console.error('Plan not found:', planId);
      return;
    }

    // Calculate stats for export
    let unterrechtsgebieteCount = 0;
    let themenCount = 0;
    const gewichtung = {
      'oeffentliches-recht': 0,
      'zivilrecht': 0,
      'strafrecht': 0,
    };

    plan.rechtsgebiete?.forEach(rg => {
      const urgCount = rg.unterrechtsgebiete?.length || 0;
      unterrechtsgebieteCount += urgCount;

      rg.unterrechtsgebiete?.forEach(urg => {
        urg.kapitel?.forEach(k => {
          themenCount += k.themen?.length || 0;
        });
      });

      // Calculate gewichtung based on unterrechtsgebiete count
      if (gewichtung[rg.rechtsgebietId] !== undefined) {
        gewichtung[rg.rechtsgebietId] = urgCount;
      }
    });

    // Convert to percentages
    const totalUrg = unterrechtsgebieteCount || 1;
    Object.keys(gewichtung).forEach(key => {
      gewichtung[key] = Math.round((gewichtung[key] / totalUrg) * 100);
    });

    const exportData = {
      id: `exported-${Date.now()}`,
      name: plan?.name || 'Themenliste',
      description: plan?.description || '',
      mode: plan?.mode || 'standard',
      stats: {
        unterrechtsgebiete: unterrechtsgebieteCount,
        themen: themenCount,
      },
      gewichtung,
      rechtsgebiete: plan?.rechtsgebiete,
      exportedAt: new Date().toISOString(),
      exportedFrom: 'PrepWell',
      version: '1.0',
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(plan?.name || 'themenliste').replace(/[^a-z0-9]/gi, '_')}_themenliste.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [contentPlans]);

  /**
   * Import a Themenliste from JSON data
   * @param {Object} jsonData - The parsed JSON data
   * @returns {Object} The created plan
   */
  const importThemenlisteFromJson = useCallback((jsonData) => {
    // Validate basic structure
    if (!jsonData.name || !jsonData.rechtsgebiete) {
      throw new Error('Ungültiges Dateiformat: Name oder Rechtsgebiete fehlen');
    }

    // Use the existing import function with the JSON data as template
    return importThemenlisteTemplate({
      id: jsonData.id || `imported-${Date.now()}`,
      name: jsonData.name,
      description: jsonData.description || '',
      mode: jsonData.mode || 'standard',
      rechtsgebiete: jsonData.rechtsgebiete,
    });
  }, [importThemenlisteTemplate]);

  /**
   * Publish a Themenliste to the community database
   * Now synced to Supabase
   * @param {string} planId - The plan ID to publish
   */
  const publishThemenliste = useCallback(async (planId) => {
    const plan = contentPlans.find(p => p.id === planId);
    if (!plan) {
      console.error('Plan not found:', planId);
      return;
    }

    // Check if already published
    if (publishedThemenlisten.some(p => p.sourceId === planId)) {
      console.warn('Plan already published');
      return;
    }

    // Calculate stats
    let unterrechtsgebieteCount = 0;
    let themenCount = 0;
    const gewichtung = {
      'oeffentliches-recht': 0,
      'zivilrecht': 0,
      'strafrecht': 0,
    };

    plan.rechtsgebiete?.forEach(rg => {
      const urgCount = rg.unterrechtsgebiete?.length || 0;
      unterrechtsgebieteCount += urgCount;

      rg.unterrechtsgebiete?.forEach(urg => {
        urg.kapitel?.forEach(k => {
          themenCount += k.themen?.length || 0;
        });
      });

      if (gewichtung[rg.rechtsgebietId] !== undefined) {
        gewichtung[rg.rechtsgebietId] = urgCount;
      }
    });

    const totalUrg = unterrechtsgebieteCount || 1;
    Object.keys(gewichtung).forEach(key => {
      gewichtung[key] = Math.round((gewichtung[key] / totalUrg) * 100);
    });

    const publishedPlan = {
      id: generateId(),
      sourceId: planId,
      name: plan?.name || 'Themenliste',
      description: plan?.description || '',
      mode: plan?.mode || 'standard',
      stats: {
        unterrechtsgebiete: unterrechtsgebieteCount,
        themen: themenCount,
      },
      gewichtung,
      rechtsgebiete: plan?.rechtsgebiete,
      publishedAt: new Date().toISOString(),
      tags: ['Benutzer'],
    };

    // Save to Supabase (also updates local state)
    await savePublishedThemenliste(publishedPlan);

    // Mark the original plan as published
    await updateContentPlan(planId, { isPublished: true, publishedId: publishedPlan.id });

    return publishedPlan;
  }, [contentPlans, publishedThemenlisten, savePublishedThemenliste, updateContentPlan]);

  /**
   * Unpublish a Themenliste from the community database
   * Now synced to Supabase
   * @param {string} publishedId - The published plan ID to remove
   */
  const unpublishThemenliste = useCallback(async (publishedId) => {
    const publishedPlan = publishedThemenlisten.find(p => p.id === publishedId);
    if (!publishedPlan) {
      console.error('Published plan not found:', publishedId);
      return;
    }

    // Remove from Supabase (also updates local state)
    await removePublishedThemenliste(publishedId);

    // Update original plan
    if (publishedPlan.sourceId) {
      await updateContentPlan(publishedPlan.sourceId, { isPublished: false, publishedId: null });
    }
  }, [publishedThemenlisten, removePublishedThemenliste, updateContentPlan]);

  /**
   * Get all published Themenlisten
   * @returns {Array} Published Themenlisten
   */
  const getPublishedThemenlisten = useCallback(() => {
    return publishedThemenlisten;
  }, [publishedThemenlisten]);

  // ============================================
  // NESTED CRUD: Rechtsgebiete
  // ============================================

  /**
   * Add a Rechtsgebiet to a plan
   * @param {string} planId - The plan ID
   * @param {Object} rechtsgebiet - { rechtsgebietId, name }
   */
  const addRechtsgebietToPlan = useCallback((planId, rechtsgebiet) => {
    // Guard: rechtsgebiet must exist
    if (!rechtsgebiet) return;
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      const newRg = {
        id: generateId(),
        rechtsgebietId: rechtsgebiet?.rechtsgebietId,
        name: rechtsgebiet?.name || '',
        unterrechtsgebiete: [],
      };
      return {
        ...plan,
        rechtsgebiete: [...(plan.rechtsgebiete || []), newRg],
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  /**
   * Remove a Rechtsgebiet from a plan
   * @param {string} planId - The plan ID
   * @param {string} rechtsgebietId - The Rechtsgebiet ID (internal)
   */
  const removeRechtsgebietFromPlan = useCallback((planId, rechtsgebietId) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.filter(rg => rg.id !== rechtsgebietId),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  // ============================================
  // NESTED CRUD: Unterrechtsgebiete
  // ============================================

  /**
   * Add an Unterrechtsgebiet to a Rechtsgebiet in a plan
   */
  const addUnterrechtsgebietToPlan = useCallback((planId, rechtsgebietId, unterrechtsgebiet) => {
    // Guard: unterrechtsgebiet must exist
    if (!unterrechtsgebiet) return;
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: (plan.rechtsgebiete || []).map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          const newUrg = {
            id: generateId(),
            unterrechtsgebietId: unterrechtsgebiet?.unterrechtsgebietId || unterrechtsgebiet?.id,
            name: unterrechtsgebiet?.name || '',
            kategorie: unterrechtsgebiet?.kategorie || '',
            kapitel: [],
          };
          return {
            ...rg,
            unterrechtsgebiete: [...(rg.unterrechtsgebiete || []), newUrg],
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  /**
   * Remove an Unterrechtsgebiet from a plan
   */
  const removeUnterrechtsgebietFromPlan = useCallback((planId, rechtsgebietId, unterrechtsgebietId) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          return {
            ...rg,
            unterrechtsgebiete: rg.unterrechtsgebiete.filter(urg => urg.id !== unterrechtsgebietId),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  // ============================================
  // NESTED CRUD: Kapitel
  // ============================================

  /**
   * Add a Kapitel to an Unterrechtsgebiet
   */
  const addKapitelToPlan = useCallback((planId, rechtsgebietId, unterrechtsgebietId, kapitelData = {}) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          return {
            ...rg,
            unterrechtsgebiete: rg.unterrechtsgebiete.map(urg => {
              if (urg.id !== unterrechtsgebietId) return urg;
              const newKapitel = {
                id: generateId(),
                title: kapitelData.title || `Kapitel ${urg.kapitel.length + 1}`,
                themen: [],
              };
              return {
                ...urg,
                kapitel: [...urg.kapitel, newKapitel],
              };
            }),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  /**
   * Update a Kapitel
   */
  const updateKapitelInPlan = useCallback((planId, rechtsgebietId, unterrechtsgebietId, kapitelId, updates) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          return {
            ...rg,
            unterrechtsgebiete: rg.unterrechtsgebiete.map(urg => {
              if (urg.id !== unterrechtsgebietId) return urg;
              return {
                ...urg,
                kapitel: urg.kapitel.map(k =>
                  k.id === kapitelId ? { ...k, ...updates } : k
                ),
              };
            }),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  /**
   * Delete a Kapitel
   */
  const deleteKapitelFromPlan = useCallback((planId, rechtsgebietId, unterrechtsgebietId, kapitelId) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          return {
            ...rg,
            unterrechtsgebiete: rg.unterrechtsgebiete.map(urg => {
              if (urg.id !== unterrechtsgebietId) return urg;
              return {
                ...urg,
                kapitel: urg.kapitel.filter(k => k.id !== kapitelId),
              };
            }),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  /**
   * Flatten all Kapitel in all content plans
   * Moves Themen into a single default Kapitel per Unterrechtsgebiet
   * Called when chapter level setting is disabled
   */
  const flattenAllKapitel = useCallback(() => {
    const updated = contentPlans.map(plan => {
      let hasChanges = false;

      const newRechtsgebiete = plan.rechtsgebiete?.map(rg => ({
        ...rg,
        unterrechtsgebiete: rg.unterrechtsgebiete?.map(urg => {
          // Collect all themen from all kapitel
          const allThemen = [];
          urg.kapitel?.forEach(k => {
            if (k.themen && k.themen.length > 0) {
              allThemen.push(...k.themen);
            }
          });

          // If there were kapitel with themen, we need to restructure
          if (allThemen.length > 0 || (urg.kapitel && urg.kapitel.length > 0)) {
            hasChanges = true;
            // Create a single "default" kapitel to hold all themen
            return {
              ...urg,
              kapitel: [{
                id: generateId(),
                title: '', // Empty/hidden kapitel
                themen: allThemen,
                isDefault: true, // Mark as default/hidden
              }],
            };
          }
          return urg;
        }),
      }));

      if (hasChanges) {
        return {
          ...plan,
          rechtsgebiete: newRechtsgebiete,
          updatedAt: new Date().toISOString(),
        };
      }
      return plan;
    });

    // flattenAllKapitel affects all plans, so sync each modified plan to Supabase
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
    // Sync all modified plans to Supabase
    updated.forEach(plan => {
      if (plan.updatedAt) {
        saveContentPlanToSupabase(plan);
      }
    });
  }, [contentPlans, saveContentPlanToSupabase]);

  // ============================================
  // NESTED CRUD: Themen
  // ============================================

  /**
   * Add a Thema to a Kapitel
   */
  const addThemaToPlan = useCallback((planId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaData = {}) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          return {
            ...rg,
            unterrechtsgebiete: rg.unterrechtsgebiete.map(urg => {
              if (urg.id !== unterrechtsgebietId) return urg;
              return {
                ...urg,
                kapitel: urg.kapitel.map(k => {
                  if (k.id !== kapitelId) return k;
                  const newThema = {
                    id: generateId(),
                    title: themaData.title || `Thema ${k.themen.length + 1}`,
                    aufgaben: [],
                  };
                  return {
                    ...k,
                    themen: [...k.themen, newThema],
                  };
                }),
              };
            }),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  /**
   * Update a Thema
   */
  const updateThemaInPlan = useCallback((planId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaId, updates) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          return {
            ...rg,
            unterrechtsgebiete: rg.unterrechtsgebiete.map(urg => {
              if (urg.id !== unterrechtsgebietId) return urg;
              return {
                ...urg,
                kapitel: urg.kapitel.map(k => {
                  if (k.id !== kapitelId) return k;
                  return {
                    ...k,
                    themen: k.themen.map(t =>
                      t.id === themaId ? { ...t, ...updates } : t
                    ),
                  };
                }),
              };
            }),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  /**
   * Delete a Thema
   */
  const deleteThemaFromPlan = useCallback((planId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaId) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          return {
            ...rg,
            unterrechtsgebiete: rg.unterrechtsgebiete.map(urg => {
              if (urg.id !== unterrechtsgebietId) return urg;
              return {
                ...urg,
                kapitel: urg.kapitel.map(k => {
                  if (k.id !== kapitelId) return k;
                  return {
                    ...k,
                    themen: k.themen.filter(t => t.id !== themaId),
                  };
                }),
              };
            }),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  // ============================================
  // NESTED CRUD: Aufgaben
  // ============================================

  /**
   * Add an Aufgabe to a Thema
   */
  const addAufgabeToPlan = useCallback((planId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaId, aufgabeData = {}) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          return {
            ...rg,
            unterrechtsgebiete: rg.unterrechtsgebiete.map(urg => {
              if (urg.id !== unterrechtsgebietId) return urg;
              return {
                ...urg,
                kapitel: urg.kapitel.map(k => {
                  if (k.id !== kapitelId) return k;
                  return {
                    ...k,
                    themen: k.themen.map(t => {
                      if (t.id !== themaId) return t;
                      const newAufgabe = {
                        id: generateId(),
                        title: aufgabeData.title || '',
                        completed: false,
                      };
                      return {
                        ...t,
                        aufgaben: [...(t.aufgaben || []), newAufgabe],
                      };
                    }),
                  };
                }),
              };
            }),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  /**
   * Update an Aufgabe
   */
  const updateAufgabeInPlan = useCallback((planId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaId, aufgabeId, updates) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          return {
            ...rg,
            unterrechtsgebiete: rg.unterrechtsgebiete.map(urg => {
              if (urg.id !== unterrechtsgebietId) return urg;
              return {
                ...urg,
                kapitel: urg.kapitel.map(k => {
                  if (k.id !== kapitelId) return k;
                  return {
                    ...k,
                    themen: k.themen.map(t => {
                      if (t.id !== themaId) return t;
                      return {
                        ...t,
                        aufgaben: (t.aufgaben || []).map(a =>
                          a.id === aufgabeId ? { ...a, ...updates } : a
                        ),
                      };
                    }),
                  };
                }),
              };
            }),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  /**
   * Toggle Aufgabe completion
   */
  const toggleAufgabeInPlan = useCallback((planId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaId, aufgabeId) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          return {
            ...rg,
            unterrechtsgebiete: rg.unterrechtsgebiete.map(urg => {
              if (urg.id !== unterrechtsgebietId) return urg;
              return {
                ...urg,
                kapitel: urg.kapitel.map(k => {
                  if (k.id !== kapitelId) return k;
                  return {
                    ...k,
                    themen: k.themen.map(t => {
                      if (t.id !== themaId) return t;
                      return {
                        ...t,
                        aufgaben: (t.aufgaben || []).map(a =>
                          a.id === aufgabeId ? { ...a, completed: !a.completed } : a
                        ),
                      };
                    }),
                  };
                }),
              };
            }),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  /**
   * Delete an Aufgabe
   */
  const deleteAufgabeFromPlan = useCallback((planId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaId, aufgabeId) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          return {
            ...rg,
            unterrechtsgebiete: rg.unterrechtsgebiete.map(urg => {
              if (urg.id !== unterrechtsgebietId) return urg;
              return {
                ...urg,
                kapitel: urg.kapitel.map(k => {
                  if (k.id !== kapitelId) return k;
                  return {
                    ...k,
                    themen: k.themen.map(t => {
                      if (t.id !== themaId) return t;
                      return {
                        ...t,
                        aufgaben: (t.aufgaben || []).filter(a => a.id !== aufgabeId),
                      };
                    }),
                  };
                }),
              };
            }),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    persistContentPlans(updated, planId);
  }, [contentPlans, persistContentPlans]);

  /**
   * Schedule an Aufgabe to a Block (marks it as scheduled in the themenliste)
   * Used when dragging an Aufgabe from Themenliste to a Calendar Block
   * @param {string} aufgabeId - The Aufgabe ID to schedule
   * @param {Object} blockInfo - { blockId, date, blockTitle }
   */
  const scheduleAufgabeToBlock = useCallback((aufgabeId, blockInfo) => {
    const updated = contentPlans.map(plan => {
      let found = false;
      const updatedPlan = {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => ({
          ...rg,
          unterrechtsgebiete: rg.unterrechtsgebiete.map(urg => ({
            ...urg,
            kapitel: urg.kapitel.map(k => ({
              ...k,
              themen: k.themen.map(t => ({
                ...t,
                aufgaben: (t.aufgaben || []).map(a => {
                  if (a.id === aufgabeId) {
                    found = true;
                    return {
                      ...a,
                      scheduledInBlock: {
                        blockId: blockInfo.blockId,
                        date: blockInfo.date,
                        blockTitle: blockInfo.blockTitle,
                        scheduledAt: new Date().toISOString(),
                      },
                    };
                  }
                  return a;
                }),
              })),
            })),
          })),
        })),
      };
      if (found) {
        updatedPlan.updatedAt = new Date().toISOString();
      }
      return updatedPlan;
    });
    // scheduleAufgabeToBlock affects unknown plan, sync all modified plans
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
    updated.forEach(plan => {
      if (plan.updatedAt) {
        saveContentPlanToSupabase(plan);
      }
    });
  }, [contentPlans, saveContentPlanToSupabase]);

  /**
   * Unschedule an Aufgabe from a Block (removes the scheduledInBlock marker)
   * Used when removing an Aufgabe from a Calendar Block
   * @param {string} aufgabeId - The Aufgabe ID to unschedule
   */
  const unscheduleAufgabeFromBlock = useCallback((aufgabeId) => {
    const updated = contentPlans.map(plan => {
      let found = false;
      const updatedPlan = {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => ({
          ...rg,
          unterrechtsgebiete: rg.unterrechtsgebiete.map(urg => ({
            ...urg,
            kapitel: urg.kapitel.map(k => ({
              ...k,
              themen: k.themen.map(t => ({
                ...t,
                aufgaben: (t.aufgaben || []).map(a => {
                  if (a.id === aufgabeId && a.scheduledInBlock) {
                    found = true;
                    const { scheduledInBlock, ...rest } = a;
                    return rest;
                  }
                  return a;
                }),
              })),
            })),
          })),
        })),
      };
      if (found) {
        updatedPlan.updatedAt = new Date().toISOString();
      }
      return updatedPlan;
    });
    // unscheduleAufgabeFromBlock affects unknown plan, sync all modified plans
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
    updated.forEach(plan => {
      if (plan.updatedAt) {
        saveContentPlanToSupabase(plan);
      }
    });
  }, [contentPlans, saveContentPlanToSupabase]);

  /**
   * Schedule a complete Thema to a Block (marks thema and all aufgaben as scheduled)
   * Used when dragging a Thema from Themenliste to a Calendar Block
   * @param {string} themaId - The Thema ID to schedule
   * @param {Object} blockInfo - { blockId, date, blockTitle }
   */
  const scheduleThemaToBlock = useCallback((themaId, blockInfo) => {
    const scheduledAt = new Date().toISOString();
    const scheduleData = {
      blockId: blockInfo.blockId,
      date: blockInfo.date,
      blockTitle: blockInfo.blockTitle,
      scheduledAt,
    };

    const updated = contentPlans.map(plan => {
      let found = false;
      const updatedPlan = {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => ({
          ...rg,
          unterrechtsgebiete: (rg.unterrechtsgebiete || []).map(urg => ({
            ...urg,
            kapitel: (urg.kapitel || []).map(k => ({
              ...k,
              themen: (k.themen || []).map(t => {
                if (t.id === themaId) {
                  found = true;
                  return {
                    ...t,
                    scheduledInBlock: scheduleData,
                    aufgaben: (t.aufgaben || []).map(a => ({
                      ...a,
                      scheduledInBlock: scheduleData,
                    })),
                  };
                }
                return t;
              }),
            })),
          })),
        })),
      };
      if (found) {
        updatedPlan.updatedAt = new Date().toISOString();
      }
      return updatedPlan;
    });
    // scheduleThemaToBlock affects unknown plan, sync all modified plans
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
    updated.forEach(plan => {
      if (plan.updatedAt) {
        saveContentPlanToSupabase(plan);
      }
    });
  }, [contentPlans, saveContentPlanToSupabase]);

  /**
   * Unschedule a complete Thema from a Block (removes scheduledInBlock from thema and all aufgaben)
   * @param {string} themaId - The Thema ID to unschedule
   */
  const unscheduleThemaFromBlock = useCallback((themaId) => {
    const updated = contentPlans.map(plan => {
      let found = false;
      const updatedPlan = {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => ({
          ...rg,
          unterrechtsgebiete: (rg.unterrechtsgebiete || []).map(urg => ({
            ...urg,
            kapitel: (urg.kapitel || []).map(k => ({
              ...k,
              themen: (k.themen || []).map(t => {
                if (t.id === themaId) {
                  found = true;
                  const { scheduledInBlock, ...themaRest } = t;
                  return {
                    ...themaRest,
                    aufgaben: (t.aufgaben || []).map(a => {
                      const { scheduledInBlock: aufgabeSchedule, ...aufgabeRest } = a;
                      return aufgabeRest;
                    }),
                  };
                }
                return t;
              }),
            })),
          })),
        })),
      };
      if (found) {
        updatedPlan.updatedAt = new Date().toISOString();
      }
      return updatedPlan;
    });
    // unscheduleThemaFromBlock affects unknown plan, sync all modified plans
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
    updated.forEach(plan => {
      if (plan.updatedAt) {
        saveContentPlanToSupabase(plan);
      }
    });
  }, [contentPlans, saveContentPlanToSupabase]);

  /**
   * Cleanup expired schedules - removes scheduledInBlock for items where date < today and not completed
   * Called on app mount to release items that were scheduled but not completed by midnight
   */
  const cleanupExpiredSchedules = useCallback(() => {
    // KA-002 FIX: Verwende lokale Zeit statt UTC
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let hasChanges = false;

    const updated = contentPlans.map(plan => {
      let planChanged = false;
      const updatedPlan = {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => ({
          ...rg,
          unterrechtsgebiete: (rg.unterrechtsgebiete || []).map(urg => ({
            ...urg,
            kapitel: (urg.kapitel || []).map(k => ({
              ...k,
              themen: (k.themen || []).map(t => {
                let themaChanged = false;
                let updatedThema = { ...t };

                // Check thema-level scheduling
                if (t.scheduledInBlock?.date && t.scheduledInBlock.date < today && !t.completed) {
                  const { scheduledInBlock, ...themaRest } = updatedThema;
                  updatedThema = themaRest;
                  themaChanged = true;
                }

                // Check aufgaben-level scheduling
                updatedThema.aufgaben = (t.aufgaben || []).map(a => {
                  if (a.scheduledInBlock?.date && a.scheduledInBlock.date < today && !a.completed) {
                    const { scheduledInBlock, ...aufgabeRest } = a;
                    themaChanged = true;
                    return aufgabeRest;
                  }
                  return a;
                });

                if (themaChanged) {
                  planChanged = true;
                  hasChanges = true;
                }
                return updatedThema;
              }),
            })),
          })),
        })),
      };
      if (planChanged) {
        updatedPlan.updatedAt = new Date().toISOString();
      }
      return updatedPlan;
    });

    if (hasChanges) {
      setContentPlans(updated);
      saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
      updated.forEach(plan => {
        if (plan.updatedAt) {
          saveContentPlanToSupabase(plan);
        }
      });
    }
  }, [contentPlans, saveContentPlanToSupabase]);

  // ============================================
  // CUSTOM UNTERRECHTSGEBIETE (Global)
  // ============================================

  /**
   * Add a custom Unterrechtsgebiet globally
   * Now syncs to Supabase via user_settings when authenticated
   * @param {string} rechtsgebietId - The Rechtsgebiet ID (zivilrecht, etc.)
   * @param {Object} item - { name, kategorie? }
   */
  const addCustomUnterrechtsgebiet = useCallback((rechtsgebietId, item) => {
    // Guard: item must exist
    if (!item) return;
    const newItem = {
      id: `custom-${Date.now()}`,
      name: item?.name || '',
      kategorie: item?.kategorie || 'Benutzerdefiniert',
      isCustom: true,
    };

    const updated = {
      ...customUnterrechtsgebiete,
      [rechtsgebietId]: [...(customUnterrechtsgebiete[rechtsgebietId] || []), newItem],
    };
    // setCustomUnterrechtsgebiete also saves to localStorage and syncs to Supabase
    setCustomUnterrechtsgebiete(updated);
    return newItem;
  }, [customUnterrechtsgebiete, setCustomUnterrechtsgebiete]);

  /**
   * Get all custom Unterrechtsgebiete
   */
  const getCustomUnterrechtsgebiete = useCallback(() => {
    return customUnterrechtsgebiete;
  }, [customUnterrechtsgebiete]);

  // ============================================
  // COMBINED DATA HELPERS
  // ============================================

  /**
   * Get all blocks (allocations + private) for a specific date
   * Used by Wochenansicht and Startseite
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @returns {Object} { blocks: [], privateBlocks: [], tasks: [] }
   */
  const getDayData = useCallback((dateKey) => {
    return {
      blocks: blocksByDate[dateKey] || [],
      privateBlocks: privateSessionsByDate[dateKey] || [],
      tasks: tasksByDate[dateKey] || [],
    };
  }, [blocksByDate, privateSessionsByDate, tasksByDate]);

  /**
   * Get data for a date range (for week view)
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Object} Data keyed by date
   */
  const getDateRangeData = useCallback((startDate, endDate) => {
    const result = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // KA-002 FIX: Verwende lokale Zeit statt UTC
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      result[dateKey] = getDayData(dateKey);
    }

    return result;
  }, [getDayData]);

  // PERF FIX: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    blocksByDate,
    visibleBlocksByDate, // BUG-010 FIX: Filtered blocks (excludes archived plans)
    lernplanMetadata,
    archivedLernplaene,
    privateSessionsByDate, // T30: Renamed from privateBlocksByDate
    timeSessionsByDate, // T30: Renamed from timeBlocksByDate, BUG-023 FIX: Separate time-based sessions for Week/Dashboard
    tasksByDate,
    themeLists,
    contentPlans,
    customUnterrechtsgebiete,
    contentsById, // NEW: Content storage

    // Loading states (for Supabase sync)
    contentPlansLoading,
    blocksLoading,
    tasksLoading,
    privateSessionsLoading, // T30: Renamed from privateBlocksLoading
    timeSessionsLoading, // T30: Renamed from timeBlocksLoading, BUG-023 FIX
    archivedLoading,
    metadataLoading,
    publishedThemenlistenLoading,
    isAuthenticated,

    // Lernplan Block Actions
    setCalendarData,
    updateDayBlocks,
    getDayBlocks,
    updateLernplanMetadata,
    archiveCurrentPlan,
    deleteCurrentPlan,
    restoreArchivedPlan,
    deleteArchivedPlan,
    clearAllData,

    // Content Actions (NEW DATA MODEL)
    saveContent,
    getContent,
    deleteContent,
    addBlockWithContent,
    buildSessionFromBlock,
    getSessionsForDate,

    // Block Delete Actions
    deleteBlock,
    deleteSeriesBlocks,

    // Private Session Actions (T30: Renamed from Block to Session)
    addPrivateSession,
    updatePrivateBlock,
    deletePrivateSession,
    deleteSeriesPrivateBlocks,
    getPrivateBlocks,

    // Time Session Actions (T30: Renamed from Block to Session, BUG-023 FIX: Separate from block allocations)
    addTimeSession,
    updateTimeBlock,
    deleteTimeBlock,
    deleteSeriesTimeBlocks,
    getTimeBlocks,
    clearAllTimeBlocks,

    // Task Actions
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    getTasks,
    // FR1: Task Scheduling (soft delete for drag & drop)
    scheduleTaskToBlock,
    unscheduleTaskFromBlock,

    // Theme List Actions (Legacy)
    createThemeList,
    updateThemeList,
    deleteThemeList,
    toggleThemeListTopicComplete,
    addTopicToThemeList,
    removeTopicFromThemeList,
    getThemeLists,
    getThemeListById,

    // Content Plan Actions (New hierarchical structure)
    createContentPlan,
    updateContentPlan,
    deleteContentPlan,
    archiveContentPlan,
    getContentPlansByType,
    getContentPlanById,
    importThemenlisteTemplate,

    // Export/Import/Publish Themenlisten
    exportThemenlisteAsJson,
    importThemenlisteFromJson,
    publishThemenliste,
    unpublishThemenliste,
    getPublishedThemenlisten,
    publishedThemenlisten,

    // Nested CRUD: Rechtsgebiete
    addRechtsgebietToPlan,
    removeRechtsgebietFromPlan,

    // Nested CRUD: Unterrechtsgebiete
    addUnterrechtsgebietToPlan,
    removeUnterrechtsgebietFromPlan,

    // Nested CRUD: Kapitel
    addKapitelToPlan,
    updateKapitelInPlan,
    deleteKapitelFromPlan,
    flattenAllKapitel,

    // Nested CRUD: Themen
    addThemaToPlan,
    updateThemaInPlan,
    deleteThemaFromPlan,

    // Nested CRUD: Aufgaben
    addAufgabeToPlan,
    updateAufgabeInPlan,
    toggleAufgabeInPlan,
    deleteAufgabeFromPlan,

    // Aufgabe Scheduling (for drag & drop from Themenliste to Block)
    scheduleAufgabeToBlock,
    unscheduleAufgabeFromBlock,

    // Thema Scheduling (for drag & drop complete thema to Block)
    scheduleThemaToBlock,
    unscheduleThemaFromBlock,

    // Expired Schedule Cleanup
    cleanupExpiredSchedules,

    // Custom Unterrechtsgebiete
    addCustomUnterrechtsgebiet,
    getCustomUnterrechtsgebiete,

    // Combined Data Helpers
    getDayData,
    getDateRangeData,

    // Getters
    getArchivedPlans,
    hasActiveLernplan,

    // Archive & Convert
    archiveAndConvertToThemenliste,
    archiveLernplanForReactivation, // T13: Archive with wizardSettings for reactivation
  }), [
    // State dependencies
    blocksByDate, visibleBlocksByDate, lernplanMetadata, archivedLernplaene,
    privateSessionsByDate, timeSessionsByDate, tasksByDate, themeLists,
    contentPlans, customUnterrechtsgebiete, contentsById, publishedThemenlisten,
    // Loading states
    contentPlansLoading, blocksLoading, tasksLoading, privateSessionsLoading,
    timeSessionsLoading, archivedLoading, metadataLoading, publishedThemenlistenLoading,
    isAuthenticated,
    // Functions (useCallback ensures stable references)
    setCalendarData, updateDayBlocks, getDayBlocks, updateLernplanMetadata,
    archiveCurrentPlan, deleteCurrentPlan, restoreArchivedPlan, deleteArchivedPlan,
    clearAllData, saveContent, getContent, deleteContent, addBlockWithContent,
    buildSessionFromBlock, getSessionsForDate, deleteBlock, deleteSeriesBlocks,
    addPrivateSession, updatePrivateBlock, deletePrivateSession, deleteSeriesPrivateBlocks,
    getPrivateBlocks, addTimeSession, updateTimeBlock, deleteTimeBlock,
    deleteSeriesTimeBlocks, getTimeBlocks, clearAllTimeBlocks,
    addTask, updateTask, toggleTaskComplete, deleteTask, getTasks,
    scheduleTaskToBlock, unscheduleTaskFromBlock, // FR1: Task scheduling
    createThemeList, updateThemeList, deleteThemeList, toggleThemeListTopicComplete,
    addTopicToThemeList, removeTopicFromThemeList, getThemeLists, getThemeListById,
    createContentPlan, updateContentPlan, deleteContentPlan, archiveContentPlan,
    getContentPlansByType, getContentPlanById, importThemenlisteTemplate,
    exportThemenlisteAsJson, importThemenlisteFromJson, publishThemenliste,
    unpublishThemenliste, getPublishedThemenlisten,
    addRechtsgebietToPlan, removeRechtsgebietFromPlan,
    addUnterrechtsgebietToPlan, removeUnterrechtsgebietFromPlan,
    addKapitelToPlan, updateKapitelInPlan, deleteKapitelFromPlan, flattenAllKapitel,
    addThemaToPlan, updateThemaInPlan, deleteThemaFromPlan,
    addAufgabeToPlan, updateAufgabeInPlan, toggleAufgabeInPlan, deleteAufgabeFromPlan,
    scheduleAufgabeToBlock, unscheduleAufgabeFromBlock,
    scheduleThemaToBlock, unscheduleThemaFromBlock, cleanupExpiredSchedules,
    addCustomUnterrechtsgebiet, getCustomUnterrechtsgebiete,
    getDayData, getDateRangeData, getArchivedPlans, hasActiveLernplan,
    archiveAndConvertToThemenliste, archiveLernplanForReactivation,
  ]);

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

/**
 * Hook to use the Calendar context
 */
export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

export default CalendarContext;
