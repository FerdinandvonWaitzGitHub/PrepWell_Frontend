import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Context for centrally managing Calendar data
 * Single Source of Truth for:
 * - Lernplan slots (from wizard)
 * - Private blocks (personal appointments)
 * - Tasks (daily tasks)
 *
 * Data flows: Wizard → CalendarContext → Monatsansicht → Wochenansicht → Startseite
 */

// Create the context
const CalendarContext = createContext(null);

// Local storage keys
const STORAGE_KEY_SLOTS = 'prepwell_calendar_slots';
const STORAGE_KEY_CONTENTS = 'prepwell_contents'; // NEW: Separate content storage
const STORAGE_KEY_ARCHIVED = 'prepwell_archived_lernplaene';
const STORAGE_KEY_METADATA = 'prepwell_lernplan_metadata';
const STORAGE_KEY_PRIVATE_BLOCKS = 'prepwell_private_blocks';
const STORAGE_KEY_TASKS = 'prepwell_tasks';
const STORAGE_KEY_THEME_LISTS = 'prepwell_theme_lists';
const STORAGE_KEY_CONTENT_PLANS = 'prepwell_content_plans';
const STORAGE_KEY_CUSTOM_UNTERRECHTSGEBIETE = 'prepwell_custom_unterrechtsgebiete';
const STORAGE_KEY_PUBLISHED_THEMENLISTEN = 'prepwell_published_themenlisten';

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
 */
export const CalendarProvider = ({ children }) => {
  // Current calendar slots (what's displayed in the main calendar)
  const [slotsByDate, setSlotsByDate] = useState(() =>
    loadFromStorage(STORAGE_KEY_SLOTS, {})
  );

  // Archived Lernpläne (previous plans that were replaced)
  const [archivedLernplaene, setArchivedLernplaene] = useState(() =>
    loadFromStorage(STORAGE_KEY_ARCHIVED, [])
  );

  // Current Lernplan metadata (name, dates, etc.)
  const [lernplanMetadata, setLernplanMetadata] = useState(() =>
    loadFromStorage(STORAGE_KEY_METADATA, null)
  );

  // Private blocks by date (personal appointments, not part of Lernplan)
  const [privateBlocksByDate, setPrivateBlocksByDate] = useState(() =>
    loadFromStorage(STORAGE_KEY_PRIVATE_BLOCKS, {})
  );

  // Tasks by date (daily tasks/aufgaben)
  const [tasksByDate, setTasksByDate] = useState(() =>
    loadFromStorage(STORAGE_KEY_TASKS, {})
  );

  // Theme lists (dateless topic lists from Lernpläne) - LEGACY, use contentPlans instead
  const [themeLists, setThemeLists] = useState(() =>
    loadFromStorage(STORAGE_KEY_THEME_LISTS, [])
  );

  // Content Plans (Lernpläne and Themenlisten with new hierarchical structure)
  const [contentPlans, setContentPlans] = useState(() =>
    loadFromStorage(STORAGE_KEY_CONTENT_PLANS, [])
  );

  // Custom Unterrechtsgebiete (user-created, global)
  const [customUnterrechtsgebiete, setCustomUnterrechtsgebiete] = useState(() =>
    loadFromStorage(STORAGE_KEY_CUSTOM_UNTERRECHTSGEBIETE, {})
  );

  // Published Themenlisten (user-shared, for community database)
  const [publishedThemenlisten, setPublishedThemenlisten] = useState(() =>
    loadFromStorage(STORAGE_KEY_PUBLISHED_THEMENLISTEN, [])
  );

  // ============================================
  // NEW DATA MODEL: Content (separate from Slots)
  // Content = What to learn (timeless)
  // Slot = When to learn (date + position)
  // Block = How to display (derived: Slot + Content + time)
  // ============================================

  // Contents by ID (the learning material itself)
  const [contentsById, setContentsById] = useState(() =>
    loadFromStorage(STORAGE_KEY_CONTENTS, {})
  );

  /**
   * Archive the current Lernplan
   * Moves current slots to archived list
   */
  const archiveCurrentPlan = useCallback(() => {
    if (Object.keys(slotsByDate).length === 0) {
      return; // Nothing to archive
    }

    const archivedPlan = {
      id: `archive_${Date.now()}`,
      slots: { ...slotsByDate },
      metadata: {
        ...lernplanMetadata,
        archivedAt: new Date().toISOString()
      }
    };

    const updatedArchive = [archivedPlan, ...archivedLernplaene];
    setArchivedLernplaene(updatedArchive);
    saveToStorage(STORAGE_KEY_ARCHIVED, updatedArchive);
  }, [slotsByDate, lernplanMetadata, archivedLernplaene]);

  /**
   * Set calendar data from wizard Step 8
   * Archives the current plan if one exists
   * @param {Object} newSlots - The slotsByDate object from the wizard
   * @param {Object} metadata - Lernplan metadata (name, startDate, endDate, etc.)
   */
  const setCalendarData = useCallback((newSlots, metadata = {}) => {
    // If there's existing data, archive it first
    if (Object.keys(slotsByDate).length > 0 && lernplanMetadata) {
      archiveCurrentPlan();
    }

    // Set new data
    setSlotsByDate(newSlots);
    saveToStorage(STORAGE_KEY_SLOTS, newSlots);

    // Set metadata with creation timestamp
    const newMetadata = {
      ...metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLernplanMetadata(newMetadata);
    saveToStorage(STORAGE_KEY_METADATA, newMetadata);

    console.log('CalendarContext: Saved new calendar data', { slots: Object.keys(newSlots).length, metadata: newMetadata });
  }, [slotsByDate, lernplanMetadata, archiveCurrentPlan]);

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
   * @param {string} archiveId - ID of the archived plan to restore
   */
  const restoreArchivedPlan = useCallback((archiveId) => {
    const planToRestore = archivedLernplaene.find(p => p.id === archiveId);
    if (!planToRestore) {
      console.error('Archived plan not found:', archiveId);
      return;
    }

    // Archive current plan first
    if (Object.keys(slotsByDate).length > 0) {
      archiveCurrentPlan();
    }

    // Remove from archive
    const updatedArchive = archivedLernplaene.filter(p => p.id !== archiveId);
    setArchivedLernplaene(updatedArchive);
    saveToStorage(STORAGE_KEY_ARCHIVED, updatedArchive);

    // Restore slots
    setSlotsByDate(planToRestore.slots);
    saveToStorage(STORAGE_KEY_SLOTS, planToRestore.slots);

    // Restore metadata
    const restoredMetadata = {
      ...planToRestore.metadata,
      restoredAt: new Date().toISOString()
    };
    delete restoredMetadata.archivedAt;
    setLernplanMetadata(restoredMetadata);
    saveToStorage(STORAGE_KEY_METADATA, restoredMetadata);
  }, [archivedLernplaene, slotsByDate, archiveCurrentPlan]);

  /**
   * Delete an archived Lernplan permanently
   * @param {string} archiveId - ID of the archived plan to delete
   */
  const deleteArchivedPlan = useCallback((archiveId) => {
    const updatedArchive = archivedLernplaene.filter(p => p.id !== archiveId);
    setArchivedLernplaene(updatedArchive);
    saveToStorage(STORAGE_KEY_ARCHIVED, updatedArchive);
  }, [archivedLernplaene]);

  /**
   * Update a single day's slots
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {Array} slots - The new slots array for that day
   */
  const updateDaySlots = useCallback((dateKey, slots) => {
    const updated = {
      ...slotsByDate,
      [dateKey]: slots
    };
    setSlotsByDate(updated);
    saveToStorage(STORAGE_KEY_SLOTS, updated);

    // Update metadata timestamp
    if (lernplanMetadata) {
      const updatedMetadata = {
        ...lernplanMetadata,
        updatedAt: new Date().toISOString()
      };
      setLernplanMetadata(updatedMetadata);
      saveToStorage(STORAGE_KEY_METADATA, updatedMetadata);
    }
  }, [slotsByDate, lernplanMetadata]);

  /**
   * Get slots for a specific date
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @returns {Array} The slots for that day, or empty array
   */
  const getDaySlots = useCallback((dateKey) => {
    return slotsByDate[dateKey] || [];
  }, [slotsByDate]);

  /**
   * Update Lernplan metadata (name, etc.) without changing slots
   * @param {Object} updates - Partial metadata updates
   */
  const updateLernplanMetadata = useCallback((updates) => {
    if (!lernplanMetadata) {
      console.warn('No active Lernplan to update');
      return;
    }

    const updatedMetadata = {
      ...lernplanMetadata,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    setLernplanMetadata(updatedMetadata);
    saveToStorage(STORAGE_KEY_METADATA, updatedMetadata);
  }, [lernplanMetadata]);

  /**
   * Delete the current Lernplan (without archiving)
   */
  const deleteCurrentPlan = useCallback(() => {
    setSlotsByDate({});
    setLernplanMetadata(null);
    saveToStorage(STORAGE_KEY_SLOTS, {});
    saveToStorage(STORAGE_KEY_METADATA, null);
  }, []);

  /**
   * Clear all calendar data (for testing/reset)
   */
  const clearAllData = useCallback(() => {
    setSlotsByDate({});
    setLernplanMetadata(null);
    saveToStorage(STORAGE_KEY_SLOTS, {});
    saveToStorage(STORAGE_KEY_METADATA, null);
  }, []);

  /**
   * Check if there's an active Lernplan
   * @returns {boolean}
   */
  const hasActiveLernplan = useCallback(() => {
    return Object.keys(slotsByDate).length > 0;
  }, [slotsByDate]);

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
   * Add a slot with automatic content creation
   * Creates content from slot data if not exists
   * @param {string} dateKey - The date (YYYY-MM-DD)
   * @param {Object} slotData - Slot data with embedded content
   * @returns {{ slot: Object, content: Object }}
   */
  const addSlotWithContent = useCallback((dateKey, slotData) => {
    // Create or get content ID
    const contentId = slotData.contentId || slotData.topicId || `content-${Date.now()}`;

    // Save content if it has content fields
    const content = saveContent({
      id: contentId,
      title: slotData.title || slotData.topicTitle || 'Lernblock',
      description: slotData.description || '',
      rechtsgebiet: slotData.rechtsgebiet || '',
      unterrechtsgebiet: slotData.unterrechtsgebiet || '',
      blockType: slotData.blockType || 'lernblock',
      aufgaben: slotData.aufgaben || [],
    });

    // Create slot referencing the content
    const slot = {
      id: slotData.id || `slot-${Date.now()}`,
      contentId: content.id,
      position: slotData.position || 1,
      blockType: slotData.blockType || 'lernblock',
      isLocked: slotData.isLocked || false,
      isFromLernplan: slotData.isFromLernplan || false, // true = wizard-created, false = manual
      tasks: slotData.tasks || [],
      // Time overrides (optional)
      hasTime: slotData.hasTime || false,
      startHour: slotData.startHour,
      duration: slotData.duration,
      startTime: slotData.startTime,
      endTime: slotData.endTime,
      // Repeat settings
      repeatEnabled: slotData.repeatEnabled || false,
      repeatType: slotData.repeatType,
      repeatCount: slotData.repeatCount,
      createdAt: new Date().toISOString(),
    };

    // Add slot to date
    const currentSlots = slotsByDate[dateKey] || [];
    const updatedSlots = {
      ...slotsByDate,
      [dateKey]: [...currentSlots, slot],
    };

    setSlotsByDate(updatedSlots);
    saveToStorage(STORAGE_KEY_SLOTS, updatedSlots);

    return { slot, content };
  }, [slotsByDate, contentsById, saveContent]);

  /**
   * Build a display block from slot (merges slot + content)
   * @param {Object} slot - The slot
   * @returns {Object} Block for display
   */
  const buildBlockFromSlot = useCallback((slot) => {
    const content = contentsById[slot.contentId] || {};

    // Position to time mapping
    const positionTimes = {
      1: { startHour: 8, endHour: 10 },
      2: { startHour: 10, endHour: 12 },
      3: { startHour: 14, endHour: 16 },
    };
    const posTime = positionTimes[slot.position] || positionTimes[1];

    return {
      // IDs
      id: content.id || slot.contentId,
      slotId: slot.id,
      contentId: slot.contentId,

      // Time (from slot override or position default)
      startHour: slot.startHour ?? posTime.startHour,
      duration: slot.duration ?? (posTime.endHour - posTime.startHour),
      startTime: slot.startTime,
      endTime: slot.endTime,
      hasTime: slot.hasTime || false,

      // From Content
      title: content.title || 'Lernblock',
      description: content.description || '',
      rechtsgebiet: content.rechtsgebiet,
      unterrechtsgebiet: content.unterrechtsgebiet,

      // From Slot
      position: slot.position,
      blockType: slot.blockType || content.blockType || 'lernblock',
      isBlocked: slot.isLocked || false,
      isLocked: slot.isLocked || false,
      isFromLernplan: slot.isFromLernplan || false, // Distinguishes wizard vs manual
      tasks: slot.tasks || [],

      // Repeat
      repeatEnabled: slot.repeatEnabled || false,
      repeatType: slot.repeatType,
      repeatCount: slot.repeatCount,
    };
  }, [contentsById]);

  /**
   * Get blocks for a date (slots merged with content)
   * @param {string} dateKey - The date (YYYY-MM-DD)
   * @returns {Array} Array of display blocks
   */
  const getBlocksForDate = useCallback((dateKey) => {
    const slots = slotsByDate[dateKey] || [];
    return slots.map(buildBlockFromSlot);
  }, [slotsByDate, buildBlockFromSlot]);

  // ============================================
  // PRIVATE BLOCKS CRUD
  // ============================================

  /**
   * Add a private block to a specific date
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {Object} block - The private block data
   */
  const addPrivateBlock = useCallback((dateKey, block) => {
    const blockWithId = {
      ...block,
      id: block.id || `private-${Date.now()}`,
      blockType: 'private',
      createdAt: new Date().toISOString(),
    };

    const currentBlocks = privateBlocksByDate[dateKey] || [];
    const updated = {
      ...privateBlocksByDate,
      [dateKey]: [...currentBlocks, blockWithId],
    };

    setPrivateBlocksByDate(updated);
    saveToStorage(STORAGE_KEY_PRIVATE_BLOCKS, updated);
    return blockWithId;
  }, [privateBlocksByDate]);

  /**
   * Update a private block
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} blockId - The block ID to update
   * @param {Object} updates - Partial updates to apply
   */
  const updatePrivateBlock = useCallback((dateKey, blockId, updates) => {
    const currentBlocks = privateBlocksByDate[dateKey] || [];
    const updatedBlocks = currentBlocks.map(block =>
      block.id === blockId
        ? { ...block, ...updates, updatedAt: new Date().toISOString() }
        : block
    );

    const updated = {
      ...privateBlocksByDate,
      [dateKey]: updatedBlocks,
    };

    setPrivateBlocksByDate(updated);
    saveToStorage(STORAGE_KEY_PRIVATE_BLOCKS, updated);
  }, [privateBlocksByDate]);

  /**
   * Delete a private block
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} blockId - The block ID to delete
   */
  const deletePrivateBlock = useCallback((dateKey, blockId) => {
    const currentBlocks = privateBlocksByDate[dateKey] || [];
    const filteredBlocks = currentBlocks.filter(block => block.id !== blockId);

    const updated = {
      ...privateBlocksByDate,
      [dateKey]: filteredBlocks,
    };

    // Remove empty date entries
    if (filteredBlocks.length === 0) {
      delete updated[dateKey];
    }

    setPrivateBlocksByDate(updated);
    saveToStorage(STORAGE_KEY_PRIVATE_BLOCKS, updated);
  }, [privateBlocksByDate]);

  /**
   * Get private blocks for a specific date
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @returns {Array} The private blocks for that day
   */
  const getPrivateBlocks = useCallback((dateKey) => {
    return privateBlocksByDate[dateKey] || [];
  }, [privateBlocksByDate]);

  // ============================================
  // TASKS CRUD
  // ============================================

  /**
   * Add a task to a specific date
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {Object} task - The task data
   */
  const addTask = useCallback((dateKey, task) => {
    const taskWithId = {
      ...task,
      id: task.id || `task-${Date.now()}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const currentTasks = tasksByDate[dateKey] || [];
    const updated = {
      ...tasksByDate,
      [dateKey]: [...currentTasks, taskWithId],
    };

    setTasksByDate(updated);
    saveToStorage(STORAGE_KEY_TASKS, updated);
    return taskWithId;
  }, [tasksByDate]);

  /**
   * Update a task
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} taskId - The task ID to update
   * @param {Object} updates - Partial updates to apply
   */
  const updateTask = useCallback((dateKey, taskId, updates) => {
    const currentTasks = tasksByDate[dateKey] || [];
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    );

    const updated = {
      ...tasksByDate,
      [dateKey]: updatedTasks,
    };

    setTasksByDate(updated);
    saveToStorage(STORAGE_KEY_TASKS, updated);
  }, [tasksByDate]);

  /**
   * Toggle task completion status
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} taskId - The task ID to toggle
   */
  const toggleTaskComplete = useCallback((dateKey, taskId) => {
    const currentTasks = tasksByDate[dateKey] || [];
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId
        ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
        : task
    );

    const updated = {
      ...tasksByDate,
      [dateKey]: updatedTasks,
    };

    setTasksByDate(updated);
    saveToStorage(STORAGE_KEY_TASKS, updated);
  }, [tasksByDate]);

  /**
   * Delete a task
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @param {string} taskId - The task ID to delete
   */
  const deleteTask = useCallback((dateKey, taskId) => {
    const currentTasks = tasksByDate[dateKey] || [];
    const filteredTasks = currentTasks.filter(task => task.id !== taskId);

    const updated = {
      ...tasksByDate,
      [dateKey]: filteredTasks,
    };

    // Remove empty date entries
    if (filteredTasks.length === 0) {
      delete updated[dateKey];
    }

    setTasksByDate(updated);
    saveToStorage(STORAGE_KEY_TASKS, updated);
  }, [tasksByDate]);

  /**
   * Get tasks for a specific date
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @returns {Array} The tasks for that day
   */
  const getTasks = useCallback((dateKey) => {
    return tasksByDate[dateKey] || [];
  }, [tasksByDate]);

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
  const createContentPlan = useCallback((planData) => {
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

    const updated = [newPlan, ...contentPlans];
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
    return newPlan;
  }, [contentPlans]);

  /**
   * Update a content plan
   * @param {string} planId - The plan ID
   * @param {Object} updates - Partial updates
   */
  const updateContentPlan = useCallback((planId, updates) => {
    const updated = contentPlans.map(plan =>
      plan.id === planId
        ? { ...plan, ...updates, updatedAt: new Date().toISOString() }
        : plan
    );
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

  /**
   * Delete a content plan
   * @param {string} planId - The plan ID
   */
  const deleteContentPlan = useCallback((planId) => {
    const updated = contentPlans.filter(plan => plan.id !== planId);
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

  /**
   * Archive/Unarchive a content plan
   * @param {string} planId - The plan ID
   */
  const archiveContentPlan = useCallback((planId) => {
    const updated = contentPlans.map(plan =>
      plan.id === planId
        ? { ...plan, archived: !plan.archived, updatedAt: new Date().toISOString() }
        : plan
    );
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

  /**
   * Get content plans by type
   * @param {string} type - 'lernplan' | 'themenliste' | 'all'
   * @param {boolean} includeArchived - Include archived plans
   * @returns {Array} Filtered plans
   */
  const getContentPlansByType = useCallback((type = 'all', includeArchived = false) => {
    let plans = contentPlans;
    if (!includeArchived) {
      plans = plans.filter(p => !p.archived);
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
    // Helper to regenerate all IDs in the hierarchy
    const regenerateIds = (rechtsgebiete) => {
      return rechtsgebiete.map(rg => ({
        id: generateId(),
        rechtsgebietId: rg.rechtsgebietId,
        name: rg.name,
        unterrechtsgebiete: rg.unterrechtsgebiete?.map(urg => ({
          id: generateId(),
          unterrechtsgebietId: urg.id || urg.unterrechtsgebietId,
          name: urg.name,
          kategorie: urg.kategorie || '',
          kapitel: urg.kapitel?.map(k => ({
            id: generateId(),
            title: k.title,
            themen: k.themen?.map(t => ({
              id: generateId(),
              title: t.title,
              aufgaben: t.aufgaben?.map(a => ({
                id: generateId(),
                title: a.title || '',
                completed: false,
              })) || [],
            })) || [],
          })) || [],
        })) || [],
      }));
    };

    const newPlan = {
      id: generateId(),
      name: template.name,
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
    return newPlan;
  }, [contentPlans]);

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
      name: plan.name,
      description: plan.description || '',
      mode: plan.mode || 'standard',
      stats: {
        unterrechtsgebiete: unterrechtsgebieteCount,
        themen: themenCount,
      },
      gewichtung,
      rechtsgebiete: plan.rechtsgebiete,
      exportedAt: new Date().toISOString(),
      exportedFrom: 'PrepWell',
      version: '1.0',
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.name.replace(/[^a-z0-9]/gi, '_')}_themenliste.json`;
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
   * Publish a Themenliste to the local community database
   * @param {string} planId - The plan ID to publish
   */
  const publishThemenliste = useCallback((planId) => {
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
      name: plan.name,
      description: plan.description || '',
      mode: plan.mode || 'standard',
      stats: {
        unterrechtsgebiete: unterrechtsgebieteCount,
        themen: themenCount,
      },
      gewichtung,
      rechtsgebiete: plan.rechtsgebiete,
      publishedAt: new Date().toISOString(),
      tags: ['Benutzer'],
    };

    const updated = [publishedPlan, ...publishedThemenlisten];
    setPublishedThemenlisten(updated);
    saveToStorage(STORAGE_KEY_PUBLISHED_THEMENLISTEN, updated);

    // Mark the original plan as published
    updateContentPlan(planId, { isPublished: true, publishedId: publishedPlan.id });

    return publishedPlan;
  }, [contentPlans, publishedThemenlisten, updateContentPlan]);

  /**
   * Unpublish a Themenliste from the local community database
   * @param {string} publishedId - The published plan ID to remove
   */
  const unpublishThemenliste = useCallback((publishedId) => {
    const publishedPlan = publishedThemenlisten.find(p => p.id === publishedId);
    if (!publishedPlan) {
      console.error('Published plan not found:', publishedId);
      return;
    }

    // Remove from published list
    const updated = publishedThemenlisten.filter(p => p.id !== publishedId);
    setPublishedThemenlisten(updated);
    saveToStorage(STORAGE_KEY_PUBLISHED_THEMENLISTEN, updated);

    // Update original plan
    if (publishedPlan.sourceId) {
      updateContentPlan(publishedPlan.sourceId, { isPublished: false, publishedId: null });
    }
  }, [publishedThemenlisten, updateContentPlan]);

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
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      const newRg = {
        id: generateId(),
        rechtsgebietId: rechtsgebiet.rechtsgebietId,
        name: rechtsgebiet.name,
        unterrechtsgebiete: [],
      };
      return {
        ...plan,
        rechtsgebiete: [...plan.rechtsgebiete, newRg],
        updatedAt: new Date().toISOString(),
      };
    });
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

  // ============================================
  // NESTED CRUD: Unterrechtsgebiete
  // ============================================

  /**
   * Add an Unterrechtsgebiet to a Rechtsgebiet in a plan
   */
  const addUnterrechtsgebietToPlan = useCallback((planId, rechtsgebietId, unterrechtsgebiet) => {
    const updated = contentPlans.map(plan => {
      if (plan.id !== planId) return plan;
      return {
        ...plan,
        rechtsgebiete: plan.rechtsgebiete.map(rg => {
          if (rg.id !== rechtsgebietId) return rg;
          const newUrg = {
            id: generateId(),
            unterrechtsgebietId: unterrechtsgebiet.unterrechtsgebietId || unterrechtsgebiet.id,
            name: unterrechtsgebiet.name,
            kategorie: unterrechtsgebiet.kategorie || '',
            kapitel: [],
          };
          return {
            ...rg,
            unterrechtsgebiete: [...rg.unterrechtsgebiete, newUrg],
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
                        aufgaben: [...t.aufgaben, newAufgabe],
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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
                        aufgaben: t.aufgaben.map(a =>
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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
                        aufgaben: t.aufgaben.map(a =>
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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
                        aufgaben: t.aufgaben.filter(a => a.id !== aufgabeId),
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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

  /**
   * Schedule an Aufgabe to a Block (marks it as scheduled in the themenliste)
   * Used when dragging an Aufgabe from Themenliste to a Calendar Block
   * @param {string} aufgabeId - The Aufgabe ID to schedule
   * @param {Object} blockInfo - { slotId, date, blockTitle }
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
                aufgaben: t.aufgaben.map(a => {
                  if (a.id === aufgabeId) {
                    found = true;
                    return {
                      ...a,
                      scheduledInBlock: {
                        slotId: blockInfo.slotId,
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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

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
                aufgaben: t.aufgaben.map(a => {
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
    setContentPlans(updated);
    saveToStorage(STORAGE_KEY_CONTENT_PLANS, updated);
  }, [contentPlans]);

  // ============================================
  // CUSTOM UNTERRECHTSGEBIETE (Global)
  // ============================================

  /**
   * Add a custom Unterrechtsgebiet globally
   * @param {string} rechtsgebietId - The Rechtsgebiet ID (zivilrecht, etc.)
   * @param {Object} item - { name, kategorie? }
   */
  const addCustomUnterrechtsgebiet = useCallback((rechtsgebietId, item) => {
    const newItem = {
      id: `custom-${Date.now()}`,
      name: item.name,
      kategorie: item.kategorie || 'Benutzerdefiniert',
      isCustom: true,
    };

    const updated = {
      ...customUnterrechtsgebiete,
      [rechtsgebietId]: [...(customUnterrechtsgebiete[rechtsgebietId] || []), newItem],
    };
    setCustomUnterrechtsgebiete(updated);
    saveToStorage(STORAGE_KEY_CUSTOM_UNTERRECHTSGEBIETE, updated);
    return newItem;
  }, [customUnterrechtsgebiete]);

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
   * Get all blocks (slots + private) for a specific date
   * Used by Wochenansicht and Startseite
   * @param {string} dateKey - The date key (YYYY-MM-DD)
   * @returns {Object} { slots: [], privateBlocks: [], tasks: [] }
   */
  const getDayData = useCallback((dateKey) => {
    return {
      slots: slotsByDate[dateKey] || [],
      privateBlocks: privateBlocksByDate[dateKey] || [],
      tasks: tasksByDate[dateKey] || [],
    };
  }, [slotsByDate, privateBlocksByDate, tasksByDate]);

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
      const dateKey = d.toISOString().split('T')[0];
      result[dateKey] = getDayData(dateKey);
    }

    return result;
  }, [getDayData]);

  const value = {
    // State
    slotsByDate,
    lernplanMetadata,
    archivedLernplaene,
    privateBlocksByDate,
    tasksByDate,
    themeLists,
    contentPlans,
    customUnterrechtsgebiete,
    contentsById, // NEW: Content storage

    // Lernplan Slot Actions
    setCalendarData,
    updateDaySlots,
    getDaySlots,
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
    addSlotWithContent,
    buildBlockFromSlot,
    getBlocksForDate,

    // Private Block Actions
    addPrivateBlock,
    updatePrivateBlock,
    deletePrivateBlock,
    getPrivateBlocks,

    // Task Actions
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    getTasks,

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

    // Custom Unterrechtsgebiete
    addCustomUnterrechtsgebiet,
    getCustomUnterrechtsgebiete,

    // Combined Data Helpers
    getDayData,
    getDateRangeData,

    // Getters
    getArchivedPlans,
    hasActiveLernplan,
  };

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
