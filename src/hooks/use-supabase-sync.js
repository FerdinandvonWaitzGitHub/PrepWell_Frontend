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

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';
import { supabase } from '../services/supabase';

// LocalStorage keys (same as existing contexts)
const STORAGE_KEYS = {
  contentPlans: 'prepwell_content_plans',
  publishedThemenlisten: 'prepwell_published_themenlisten',
  slots: 'prepwell_calendar_slots',
  contents: 'prepwell_contents',
  tasks: 'prepwell_tasks',
  privateBlocks: 'prepwell_private_blocks',
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
  settings: 'prepwell_settings',
  gradeSystem: 'prepwell_grade_system',
  customSubjects: 'prepwell_custom_subjects',
  logbuchEntries: 'prepwell_logbuch_entries',
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

  // Reset syncedRef when user changes (logout/login)
  // Fix: Explicitly handle logout to null
  useEffect(() => {
    if (user === null) {
      syncedRef.current = false;
      userIdRef.current = null;
    } else if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      userIdRef.current = user?.id;
    }
  }, [user]);

  const {
    orderBy = 'created_at',
    orderDirection = 'desc',
    transformToSupabase = (d) => d,
    transformFromSupabase = (d) => d,
    onConflict = 'id', // Default onConflict column, can be overridden
    enabled = true, // Set to false to disable Supabase sync (localStorage only)
  } = options;

  // Fetch data from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!enabled || !isSupabaseEnabled || !isAuthenticated || !supabase) {
      return null;
    }

    try {
      const { data: supabaseData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .order(orderBy, { ascending: orderDirection === 'asc' });

      if (fetchError) throw fetchError;
      return supabaseData?.map(transformFromSupabase) || [];
    } catch (err) {
      console.error(`Error fetching from ${tableName}:`, err);
      return null;
    }
  }, [enabled, isSupabaseEnabled, isAuthenticated, tableName, orderBy, orderDirection, transformFromSupabase]);

  // Sync LocalStorage data to Supabase (on first login)
  const syncToSupabase = useCallback(async (localData) => {
    if (!enabled || !isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return;
    }

    try {
      // Check if user already has data in Supabase
      const { data: existingData } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (existingData && existingData.length > 0) {
        // User has Supabase data, use that instead
        return;
      }

      // User has no Supabase data, migrate LocalStorage data
      if (Array.isArray(localData) && localData.length > 0) {
        const dataToInsert = localData.map(item => ({
          ...transformToSupabase(item),
          user_id: user.id,
        }));

        const { error: insertError } = await supabase
          .from(tableName)
          .insert(dataToInsert);

        if (insertError) {
          console.error(`Error syncing to ${tableName}:`, insertError);
        } else {
          console.log(`Synced ${dataToInsert.length} items to ${tableName}`);
        }
      }
    } catch (err) {
      console.error(`Error in syncToSupabase for ${tableName}:`, err);
    }
  }, [enabled, isSupabaseEnabled, isAuthenticated, user, tableName, transformToSupabase]);

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
        // Try to sync local data first (for new users)
        const localData = loadFromStorage(storageKey, defaultValue);
        await syncToSupabase(localData);

        // Then fetch from Supabase
        const supabaseData = await fetchFromSupabase();

        if (supabaseData !== null) {
          setData(supabaseData);
          saveToStorage(storageKey, supabaseData); // Keep local cache
          syncedRef.current = true;
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [isSupabaseEnabled, isAuthenticated, fetchFromSupabase, syncToSupabase, storageKey, defaultValue]);

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
          ...transformToSupabase(item),
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
  }, [isSupabaseEnabled, isAuthenticated, user, tableName, storageKey, transformToSupabase, onConflict]);

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
          ...transformToSupabase(itemWithId),
          user_id: user.id,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Update local with Supabase-generated ID if it was a local ID
      if (savedData && itemWithId.id.startsWith('local-')) {
        const transformedData = transformFromSupabase(savedData);
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
  }, [data, isSupabaseEnabled, isAuthenticated, user, tableName, storageKey, transformToSupabase, transformFromSupabase]);

  // Remove item
  const removeItem = useCallback(async (itemId) => {
    // Update local state
    const updatedData = Array.isArray(data)
      ? data.filter(d => d.id !== itemId)
      : defaultValue;

    setData(updatedData);
    saveToStorage(storageKey, updatedData);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase) {
      return { success: true, source: 'localStorage' };
    }

    try {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error(`Error deleting from ${tableName}:`, err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [data, isSupabaseEnabled, isAuthenticated, tableName, storageKey, defaultValue]);

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
 * NOTE: Supabase sync disabled - table does not exist yet
 */
export function useContentPlansSync() {
  return useSupabaseSync('content_plans', STORAGE_KEYS.contentPlans, [], {
    enabled: false, // Table does not exist in Supabase yet
    orderBy: 'created_at',
    orderDirection: 'desc',
    transformToSupabase: (plan) => ({
      id: plan.id?.startsWith('local-') ? undefined : plan.id,
      name: plan.name,
      type: plan.type || 'themenliste',
      description: plan.description || '',
      mode: plan.mode || 'standard',
      exam_date: plan.examDate || null,
      archived: plan.archived || false,
      is_published: plan.isPublished || false,
      rechtsgebiete: plan.rechtsgebiete || [],
      imported_from: plan.importedFrom || null,
    }),
    transformFromSupabase: (row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      mode: row.mode,
      examDate: row.exam_date,
      archived: row.archived,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      rechtsgebiete: row.rechtsgebiete || [],
      importedFrom: row.imported_from,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  });
}

/**
 * Hook for Published Themenlisten (Community)
 * NOTE: Supabase sync disabled - table does not exist yet
 */
export function usePublishedThemenlistenSync() {
  return useSupabaseSync('published_themenlisten', STORAGE_KEYS.publishedThemenlisten, [], {
    enabled: false, // Table does not exist in Supabase yet
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
 */
export function useTimerHistorySync() {
  return useSupabaseSync('timer_sessions', STORAGE_KEYS.timerHistory, [], {
    orderBy: 'created_at',
    orderDirection: 'desc',
    transformToSupabase: (session) => ({
      session_type: session.type || 'pomodoro',
      duration_seconds: session.duration,
      completed: session.completed || false,
      session_date: session.date,
      session_time: session.time,
    }),
    transformFromSupabase: (row) => ({
      id: row.id,
      type: row.session_type,
      duration: row.duration_seconds,
      completed: row.completed,
      date: row.session_date,
      time: row.session_time,
      createdAt: row.created_at,
    }),
  });
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
    customSubjects: loadFromStorage(STORAGE_KEYS.customSubjects, []),
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
            customSubjects: data.custom_subjects || [],
          };
          setSettings(newSettings);
          // Update local storage
          saveToStorage(STORAGE_KEYS.mentorActivated, newSettings.mentorActivated);
          saveToStorage(STORAGE_KEYS.gradeSystem, newSettings.gradeSystem);
          saveToStorage(STORAGE_KEYS.timerConfig, newSettings.timerConfig);
          saveToStorage(STORAGE_KEYS.customSubjects, newSettings.customSubjects);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isSupabaseEnabled, isAuthenticated, user]);

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
    if (updates.customSubjects !== undefined) {
      saveToStorage(STORAGE_KEYS.customSubjects, updates.customSubjects);
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
          custom_subjects: newSettings.customSubjects,
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error updating settings:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [settings, isSupabaseEnabled, isAuthenticated, user]);

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
  }, [isSupabaseEnabled, isAuthenticated, user]);

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
  }, [isSupabaseEnabled, isAuthenticated, user]);

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
  }, [isSupabaseEnabled, isAuthenticated, user]);

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
 * Hook for Calendar Slots (slotsByDate)
 * Transforms between date-keyed object format and flat array
 */
export function useCalendarSlotsSync() {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [slotsByDate, setSlotsByDate] = useState(() =>
    loadFromStorage(STORAGE_KEYS.slots, {})
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

  // Transform flat array from Supabase to date-keyed object
  const transformFromSupabase = useCallback((rows) => {
    const result = {};
    rows.forEach(row => {
      const dateKey = row.slot_date;
      if (!result[dateKey]) {
        result[dateKey] = [];
      }
      result[dateKey].push({
        id: row.id,
        contentId: row.content_id,
        contentPlanId: row.content_plan_id,
        position: row.position,
        title: row.title,
        rechtsgebiet: row.rechtsgebiet,
        unterrechtsgebiet: row.unterrechtsgebiet,
        blockType: row.block_type,
        isLocked: row.is_locked,
        isFromLernplan: row.is_from_lernplan,
        hasTime: row.has_time,
        startHour: row.start_hour,
        duration: row.duration,
        startTime: row.start_time,
        endTime: row.end_time,
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
  const transformToSupabase = useCallback((slotsByDateObj, userId) => {
    const result = [];
    Object.entries(slotsByDateObj).forEach(([dateKey, slots]) => {
      slots.forEach(slot => {
        result.push({
          id: slot.id?.startsWith('slot-') || slot.id?.startsWith('local-') ? undefined : slot.id,
          user_id: userId,
          slot_date: dateKey,
          content_id: slot.contentId,
          content_plan_id: slot.contentPlanId || null,
          position: slot.position,
          title: slot.title,
          rechtsgebiet: slot.rechtsgebiet,
          unterrechtsgebiet: slot.unterrechtsgebiet,
          block_type: slot.blockType || 'lernblock',
          is_locked: slot.isLocked || false,
          is_from_lernplan: slot.isFromLernplan || false,
          has_time: slot.hasTime || false,
          start_hour: slot.startHour,
          duration: slot.duration,
          start_time: slot.startTime,
          end_time: slot.endTime,
          repeat_enabled: slot.repeatEnabled || false,
          repeat_type: slot.repeatType,
          repeat_count: slot.repeatCount,
          series_id: slot.seriesId,
          custom_days: slot.customDays,
          tasks: slot.tasks || [],
          metadata: slot.metadata || {},
        });
      });
    });
    return result;
  }, []);

  // Fetch from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('calendar_slots')
        .select('*')
        .order('slot_date', { ascending: true });

      if (error) throw error;
      return transformFromSupabase(data || []);
    } catch (err) {
      console.error('Error fetching calendar slots:', err);
      return null;
    }
  }, [isSupabaseEnabled, isAuthenticated, user, transformFromSupabase]);

  // Initial sync on login
  useEffect(() => {
    const initSync = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || syncedRef.current) {
        return;
      }

      setLoading(true);
      try {
        // Check if user has Supabase data
        const { data: existingData } = await supabase
          .from('calendar_slots')
          .select('id')
          .limit(1);

        if (existingData && existingData.length > 0) {
          // User has Supabase data - use it
          const supabaseData = await fetchFromSupabase();
          if (supabaseData) {
            setSlotsByDate(supabaseData);
            saveToStorage(STORAGE_KEYS.slots, supabaseData);
          }
        } else {
          // No Supabase data - migrate from localStorage
          const localData = loadFromStorage(STORAGE_KEYS.slots, {});
          if (Object.keys(localData).length > 0) {
            const dataToInsert = transformToSupabase(localData, user.id);
            if (dataToInsert.length > 0) {
              await supabase.from('calendar_slots').insert(dataToInsert);
              console.log(`Migrated ${dataToInsert.length} slots to Supabase`);
            }
          }
        }

        syncedRef.current = true;
      } catch (err) {
        console.error('Error syncing calendar slots:', err);
      } finally {
        setLoading(false);
      }
    };

    initSync();
  }, [isSupabaseEnabled, isAuthenticated, user, fetchFromSupabase, transformToSupabase]);

  // Save slots for a specific date
  const saveDaySlots = useCallback(async (dateKey, slots) => {
    const updated = { ...slotsByDate, [dateKey]: slots };
    if (slots.length === 0) {
      delete updated[dateKey];
    }
    setSlotsByDate(updated);
    saveToStorage(STORAGE_KEYS.slots, updated);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Delete existing slots for this date, then insert new ones
      await supabase
        .from('calendar_slots')
        .delete()
        .eq('slot_date', dateKey);

      if (slots.length > 0) {
        const dataToInsert = slots.map(slot => ({
          id: slot.id?.startsWith('slot-') || slot.id?.startsWith('local-') ? undefined : slot.id,
          user_id: user.id,
          slot_date: dateKey,
          content_id: slot.contentId,
          content_plan_id: slot.contentPlanId || null,
          position: slot.position,
          title: slot.title,
          rechtsgebiet: slot.rechtsgebiet,
          unterrechtsgebiet: slot.unterrechtsgebiet,
          block_type: slot.blockType || 'lernblock',
          is_locked: slot.isLocked || false,
          is_from_lernplan: slot.isFromLernplan || false,
          has_time: slot.hasTime || false,
          start_hour: slot.startHour,
          duration: slot.duration,
          start_time: slot.startTime,
          end_time: slot.endTime,
          repeat_enabled: slot.repeatEnabled || false,
          repeat_type: slot.repeatType,
          repeat_count: slot.repeatCount,
          series_id: slot.seriesId,
          custom_days: slot.customDays,
          tasks: slot.tasks || [],
          metadata: slot.metadata || {},
        }));

        const { error } = await supabase
          .from('calendar_slots')
          .insert(dataToInsert);

        if (error) throw error;
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error saving calendar slots:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [slotsByDate, isSupabaseEnabled, isAuthenticated, user]);

  // Save all slots (for bulk operations like wizard)
  const saveAllSlots = useCallback(async (newSlotsByDate) => {
    setSlotsByDate(newSlotsByDate);
    saveToStorage(STORAGE_KEYS.slots, newSlotsByDate);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Delete all existing slots
      await supabase
        .from('calendar_slots')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      // Insert new slots
      const dataToInsert = transformToSupabase(newSlotsByDate, user.id);
      if (dataToInsert.length > 0) {
        const { error } = await supabase
          .from('calendar_slots')
          .insert(dataToInsert);

        if (error) throw error;
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error saving all calendar slots:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [isSupabaseEnabled, isAuthenticated, user, transformToSupabase]);

  // Clear all slots
  const clearAllSlots = useCallback(async () => {
    setSlotsByDate({});
    saveToStorage(STORAGE_KEYS.slots, {});

    if (!isSupabaseEnabled || !isAuthenticated || !supabase) {
      return { success: true, source: 'localStorage' };
    }

    try {
      await supabase
        .from('calendar_slots')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error clearing calendar slots:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [isSupabaseEnabled, isAuthenticated]);

  return {
    slotsByDate,
    setSlotsByDate: saveAllSlots,
    saveDaySlots,
    clearAllSlots,
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
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      syncedRef.current = false;
      userIdRef.current = user?.id || null;
    }
  }, [user?.id]);

  // Transform flat array from Supabase to date-keyed object
  const transformFromSupabase = useCallback((rows) => {
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
        priority: row.priority,
        completed: row.completed,
        linkedSlotId: row.linked_slot_id,
        metadata: row.metadata || {},
        createdAt: row.created_at,
      });
    });
    return result;
  }, []);

  // Fetch from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('calendar_tasks')
        .select('*')
        .order('task_date', { ascending: true });

      if (error) throw error;
      return transformFromSupabase(data || []);
    } catch (err) {
      console.error('Error fetching calendar tasks:', err);
      return null;
    }
  }, [isSupabaseEnabled, isAuthenticated, user, transformFromSupabase]);

  // Initial sync on login
  useEffect(() => {
    const initSync = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || syncedRef.current) {
        return;
      }

      setLoading(true);
      try {
        const { data: existingData } = await supabase
          .from('calendar_tasks')
          .select('id')
          .limit(1);

        if (existingData && existingData.length > 0) {
          const supabaseData = await fetchFromSupabase();
          if (supabaseData) {
            setTasksByDate(supabaseData);
            saveToStorage(STORAGE_KEYS.tasks, supabaseData);
          }
        } else {
          // Migrate from localStorage
          const localData = loadFromStorage(STORAGE_KEYS.tasks, {});
          const dataToInsert = [];
          Object.entries(localData).forEach(([dateKey, tasks]) => {
            tasks.forEach(task => {
              dataToInsert.push({
                user_id: user.id,
                task_date: dateKey,
                title: task.title,
                description: task.description,
                priority: task.priority || 'medium',
                completed: task.completed || false,
                linked_slot_id: task.linkedSlotId || null,
                metadata: task.metadata || {},
              });
            });
          });

          if (dataToInsert.length > 0) {
            await supabase.from('calendar_tasks').insert(dataToInsert);
            console.log(`Migrated ${dataToInsert.length} tasks to Supabase`);
          }
        }

        syncedRef.current = true;
      } catch (err) {
        console.error('Error syncing calendar tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    initSync();
  }, [isSupabaseEnabled, isAuthenticated, user, fetchFromSupabase]);

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
      await supabase
        .from('calendar_tasks')
        .delete()
        .eq('task_date', dateKey);

      // Insert new tasks
      if (tasks.length > 0) {
        const dataToInsert = tasks.map(task => ({
          id: task.id?.startsWith('task-') || task.id?.startsWith('local-') ? undefined : task.id,
          user_id: user.id,
          task_date: dateKey,
          title: task.title,
          description: task.description,
          priority: task.priority || 'medium',
          completed: task.completed || false,
          linked_slot_id: task.linkedSlotId || null,
          metadata: task.metadata || {},
        }));

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
  }, [tasksByDate, isSupabaseEnabled, isAuthenticated, user]);

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
 * Hook for Private Blocks (privateBlocksByDate)
 */
export function usePrivateBlocksSync() {
  const { user, isAuthenticated, isSupabaseEnabled } = useAuth();
  const [privateBlocksByDate, setPrivateBlocksByDate] = useState(() =>
    loadFromStorage(STORAGE_KEYS.privateBlocks, {})
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

  // Transform flat array from Supabase to date-keyed object
  const transformFromSupabase = useCallback((rows) => {
    const result = {};
    rows.forEach(row => {
      const dateKey = row.block_date;
      if (!result[dateKey]) {
        result[dateKey] = [];
      }
      result[dateKey].push({
        id: row.id,
        title: row.title,
        description: row.description,
        startTime: row.start_time,
        endTime: row.end_time,
        allDay: row.all_day,
        repeatEnabled: row.repeat_enabled,
        repeatType: row.repeat_type,
        repeatCount: row.repeat_count,
        seriesId: row.series_id,
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
    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('private_blocks')
        .select('*')
        .order('block_date', { ascending: true });

      if (error) throw error;
      return transformFromSupabase(data || []);
    } catch (err) {
      console.error('Error fetching private blocks:', err);
      return null;
    }
  }, [isSupabaseEnabled, isAuthenticated, user, transformFromSupabase]);

  // Initial sync on login
  useEffect(() => {
    const initSync = async () => {
      if (!isSupabaseEnabled || !isAuthenticated || syncedRef.current) {
        return;
      }

      setLoading(true);
      try {
        const { data: existingData } = await supabase
          .from('private_blocks')
          .select('id')
          .limit(1);

        if (existingData && existingData.length > 0) {
          const supabaseData = await fetchFromSupabase();
          if (supabaseData) {
            setPrivateBlocksByDate(supabaseData);
            saveToStorage(STORAGE_KEYS.privateBlocks, supabaseData);
          }
        } else {
          // Migrate from localStorage
          const localData = loadFromStorage(STORAGE_KEYS.privateBlocks, {});
          const dataToInsert = [];
          Object.entries(localData).forEach(([dateKey, blocks]) => {
            blocks.forEach(block => {
              dataToInsert.push({
                user_id: user.id,
                block_date: dateKey,
                title: block.title,
                description: block.description,
                start_time: block.startTime,
                end_time: block.endTime,
                all_day: block.allDay || false,
                repeat_enabled: block.repeatEnabled || false,
                repeat_type: block.repeatType,
                repeat_count: block.repeatCount,
                series_id: block.seriesId,
                custom_days: block.customDays,
                metadata: block.metadata || {},
              });
            });
          });

          if (dataToInsert.length > 0) {
            await supabase.from('private_blocks').insert(dataToInsert);
            console.log(`Migrated ${dataToInsert.length} private blocks to Supabase`);
          }
        }

        syncedRef.current = true;
      } catch (err) {
        console.error('Error syncing private blocks:', err);
      } finally {
        setLoading(false);
      }
    };

    initSync();
  }, [isSupabaseEnabled, isAuthenticated, user, fetchFromSupabase]);

  // Save private blocks for a specific date
  const saveDayBlocks = useCallback(async (dateKey, blocks) => {
    const updated = { ...privateBlocksByDate, [dateKey]: blocks };
    if (blocks.length === 0) {
      delete updated[dateKey];
    }
    setPrivateBlocksByDate(updated);
    saveToStorage(STORAGE_KEYS.privateBlocks, updated);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase || !user) {
      return { success: true, source: 'localStorage' };
    }

    try {
      // Delete existing blocks for this date
      await supabase
        .from('private_blocks')
        .delete()
        .eq('block_date', dateKey);

      // Insert new blocks
      if (blocks.length > 0) {
        const dataToInsert = blocks.map(block => ({
          id: block.id?.startsWith('private-') || block.id?.startsWith('local-') ? undefined : block.id,
          user_id: user.id,
          block_date: dateKey,
          title: block.title,
          description: block.description,
          start_time: block.startTime,
          end_time: block.endTime,
          all_day: block.allDay || false,
          repeat_enabled: block.repeatEnabled || false,
          repeat_type: block.repeatType,
          repeat_count: block.repeatCount,
          series_id: block.seriesId,
          custom_days: block.customDays,
          metadata: block.metadata || {},
        }));

        const { error } = await supabase
          .from('private_blocks')
          .insert(dataToInsert);

        if (error) throw error;
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error saving private blocks:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [privateBlocksByDate, isSupabaseEnabled, isAuthenticated, user]);

  return {
    privateBlocksByDate,
    setPrivateBlocksByDate,
    saveDayBlocks,
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
        slots: row.slots_data || {},
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
  }, [isSupabaseEnabled, isAuthenticated, user]);

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
              slots_data: plan.slots || {},
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
      slots: planData.slots,
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
          slots_data: planData.slots || {},
          metadata: planData.metadata || {},
          archived_at: planData.metadata?.archivedAt || new Date().toISOString(),
        });

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error archiving plan:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [archivedLernplaene, isSupabaseEnabled, isAuthenticated, user]);

  // Delete an archived plan
  const deleteArchivedPlan = useCallback(async (planId) => {
    const updated = archivedLernplaene.filter(p => p.id !== planId);
    setArchivedLernplaene(updated);
    saveToStorage(STORAGE_KEYS.archivedLernplaene, updated);

    if (!isSupabaseEnabled || !isAuthenticated || !supabase) {
      return { success: true, source: 'localStorage' };
    }

    try {
      const { error } = await supabase
        .from('archived_lernplaene')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error deleting archived plan:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [archivedLernplaene, isSupabaseEnabled, isAuthenticated]);

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
  }, [isSupabaseEnabled, isAuthenticated, user]);

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
          custom_subjects: currentSettings?.custom_subjects ?? [],
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
  }, [isSupabaseEnabled, isAuthenticated, user]);

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
          custom_subjects: currentSettings?.custom_subjects ?? [],
          timer_settings: timerSettings,
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error clearing lernplan metadata:', err);
      return { success: false, error: err, source: 'localStorage' };
    }
  }, [isSupabaseEnabled, isAuthenticated, user]);

  return {
    lernplanMetadata,
    updateMetadata,
    clearMetadata,
    loading,
    isAuthenticated,
    isSupabaseEnabled,
  };
}

export { STORAGE_KEYS };
