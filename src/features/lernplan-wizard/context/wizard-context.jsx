import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWizardDraftSync } from '../../../hooks/use-supabase-sync';
import { useCalendar } from '../../../contexts/calendar-context';

/**
 * Lernplan Wizard Context
 * Manages multi-step wizard state with Supabase persistence
 * Falls back to localStorage when not authenticated
 */

/**
 * Calculate learning days per week from weekStructure
 * Counts days that have at least one 'lernblock'
 */
const getLearningDaysPerWeek = (weekStructure) => {
  if (!weekStructure) return 5; // Default
  return Object.values(weekStructure).filter(blocks =>
    Array.isArray(blocks) && blocks.some(b => b === 'lernblock')
  ).length;
};

/**
 * Calculate recommended vacation days
 * Formula: 1 week off every 6 learning weeks, rounded up
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {number} learningDaysPerWeek - Number of learning days per week (default 5)
 */
const calculateRecommendedVacationDays = (startDate, endDate, learningDaysPerWeek = 5) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const calendarDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const learningWeeks = calendarDays / 7;
  const vacationWeeks = Math.ceil(learningWeeks / 6);
  return vacationWeeks * learningDaysPerWeek;
};

// Calculate total steps based on creation method
const getTotalStepsForMethod = (method) => {
  switch (method) {
    case 'manual':
      return 8; // Steps 1-7 + Calendar (8) - no Anpassungen, goes to calendar view
    case 'template':
      return 9; // Steps 1-7 + Lerntage + Anpassungen (skip Unterrechtsgebiete)
    case 'ai':
      return 8; // Steps 1-7 (AI config) + Anpassungen (AI generates the rest)
    case 'automatic':
    default:
      return 10; // Full flow: Steps 1-10
  }
};

// Initial wizard state
const initialWizardState = {
  currentStep: 1,
  totalSteps: 10, // Will be dynamically updated based on creationMethod
  // Step 1: Lernzeitraum
  startDate: null,
  endDate: null,
  // Step 2: Puffertage (null = needs calculation, number = user has seen/adjusted)
  bufferDays: null,
  // Step 3: Urlaubstage (null = needs calculation, number = user has seen/adjusted)
  vacationDays: null,
  // Step 4: Tagesblöcke
  blocksPerDay: 3,
  // Step 5: Wochenstruktur - each day has array of block types
  // Block types: 'lernblock', 'exam', 'repetition', 'free', 'private'
  weekStructure: {
    montag: ['lernblock', 'lernblock', 'lernblock'],
    dienstag: ['lernblock', 'lernblock', 'lernblock'],
    mittwoch: ['lernblock', 'lernblock', 'lernblock'],
    donnerstag: ['lernblock', 'lernblock', 'lernblock'],
    freitag: ['lernblock', 'lernblock', 'lernblock'],
    samstag: ['free', 'free', 'free'],
    sonntag: ['free', 'free', 'free'],
  },
  // Step 6: Erstellungsmethode
  creationMethod: null, // 'manual' | 'automatic' | 'ai' | 'template'
  // Step 7+: Pfad-spezifische Daten
  selectedTemplate: null,
  // AI-specific settings
  aiSettings: {
    focusAreas: [], // Schwerpunktbereiche
    difficulty: 'medium', // 'easy' | 'medium' | 'hard'
    includeRepetition: true,
    examType: null, // 'staatsexamen' | 'klausur' | 'mündlich'
  },
  // Step 7 Automatic: Manual Lernplan data
  manualLernplan: null,
  // Step 8: Unterrechtsgebiete Reihenfolge
  unterrechtsgebieteOrder: [],
  // Step 9: Lerntage Reihenfolge
  learningDaysOrder: [],
  // Step 10: Anpassungen
  adjustments: {},
  // Meta
  lastModified: null,
  returnPath: '/lernplan',
};

const WizardContext = createContext(null);

/**
 * Wizard Provider Component
 * Now uses Supabase for persistence when authenticated,
 * with LocalStorage fallback for offline/unauthenticated use.
 */
// Weekday keys for slot generation
const WEEKDAY_KEYS = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];

// Position to time mapping (used for wizard-generated slots)
const POSITION_TO_TIME = {
  1: { startTime: '08:00', endTime: '10:00' },
  2: { startTime: '10:00', endTime: '12:00' },
  3: { startTime: '14:00', endTime: '16:00' },
  4: { startTime: '16:00', endTime: '18:00' },
};

export const WizardProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Calendar context for saving slots directly
  const { setCalendarData } = useCalendar();

  // Use Supabase sync hook for wizard drafts
  const {
    draft: syncedDraft,
    loading: draftLoading,
    saveDraft: saveDraftToSupabase,
    clearDraft: clearDraftFromSupabase,
    hasDraft: checkHasDraft,
    isAuthenticated,
  } = useWizardDraftSync();

  // Track if initial sync is complete
  const initialSyncDone = useRef(false);

  // Initialize state from synced draft or default
  const [wizardState, setWizardState] = useState(() => {
    // On first render, use synced draft if available
    if (syncedDraft && syncedDraft.currentStep > 0) {
      return { ...initialWizardState, ...syncedDraft };
    }
    return initialWizardState;
  });

  // Update state when synced draft changes (e.g., after login sync)
  useEffect(() => {
    if (syncedDraft && !initialSyncDone.current && syncedDraft.currentStep > 1) {
      setWizardState(prev => ({ ...initialWizardState, ...syncedDraft }));
      initialSyncDone.current = true;
    }
  }, [syncedDraft]);

  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calendar creation flow state (for manual path)
  const [calendarCreationStatus, setCalendarCreationStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [calendarCreationErrors, setCalendarCreationErrors] = useState([]);

  // Set return path when entering wizard
  useEffect(() => {
    const referrer = location.state?.from || '/lernplan';
    if (wizardState.returnPath !== referrer && location.state?.from) {
      setWizardState(prev => ({ ...prev, returnPath: referrer }));
    }
  }, [location.state]);

  // Update totalSteps when creationMethod changes
  useEffect(() => {
    if (wizardState.creationMethod) {
      const newTotalSteps = getTotalStepsForMethod(wizardState.creationMethod);
      if (wizardState.totalSteps !== newTotalSteps) {
        setWizardState(prev => ({ ...prev, totalSteps: newTotalSteps }));
      }
    }
  }, [wizardState.creationMethod]);

  // Auto-recalculate vacationDays when weekStructure changes (after Step 5)
  const prevWeekStructureRef = React.useRef(JSON.stringify(wizardState.weekStructure));
  useEffect(() => {
    const currentWeekStructure = JSON.stringify(wizardState.weekStructure);
    // Only recalculate if weekStructure actually changed and we have dates
    if (prevWeekStructureRef.current !== currentWeekStructure &&
        wizardState.startDate &&
        wizardState.endDate &&
        wizardState.vacationDays !== null) { // Only if user has already seen Step 3
      const learningDaysPerWeek = getLearningDaysPerWeek(wizardState.weekStructure);
      const newVacationDays = calculateRecommendedVacationDays(
        wizardState.startDate,
        wizardState.endDate,
        learningDaysPerWeek
      );
      setWizardState(prev => ({ ...prev, vacationDays: newVacationDays }));
    }
    prevWeekStructureRef.current = currentWeekStructure;
  }, [wizardState.weekStructure, wizardState.startDate, wizardState.endDate]);

  // Auto-save on state change (debounced to avoid too many Supabase calls)
  const saveTimeoutRef = useRef(null);
  useEffect(() => {
    if (wizardState.currentStep > 0) {
      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Debounce save by 500ms
      saveTimeoutRef.current = setTimeout(() => {
        saveDraftToSupabase(wizardState);
      }, 500);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [wizardState, saveDraftToSupabase]);

  // Update wizard data
  const updateWizardData = useCallback((updates) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  }, []);

  // Go to next step
  const nextStep = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.totalSteps),
    }));
  }, []);

  // Go to previous step
  // BUG-019 FIX: Reset relevant state when going back to allow re-selection
  const prevStep = useCallback(() => {
    setWizardState(prev => {
      const newStep = Math.max(prev.currentStep - 1, 1);
      const updates = { currentStep: newStep };

      // Reset step-specific data when going back from certain steps
      // This allows users to make different choices when navigating back
      if (prev.currentStep === 7 && newStep === 6) {
        // Going back from Step 7 to Step 6 (method selection)
        // Reset creation method and all path-specific data
        updates.creationMethod = null;
        updates.selectedTemplate = null;
        updates.manualLernplan = null;
        updates.unterrechtsgebieteOrder = [];
        updates.learningDaysOrder = [];
        updates.adjustments = {};
        updates.totalSteps = 10; // Reset to default
      }

      if (prev.currentStep === 8 && newStep === 7) {
        // Going back from Step 8 to Step 7
        // Reset data entered in Step 8+
        updates.unterrechtsgebieteOrder = [];
        updates.learningDaysOrder = [];
        updates.adjustments = {};
      }

      if (prev.currentStep === 9 && newStep === 8) {
        // Going back from Step 9 to Step 8
        updates.learningDaysOrder = [];
        updates.adjustments = {};
      }

      if (prev.currentStep === 10 && newStep === 9) {
        // Going back from Step 10 to Step 9
        updates.adjustments = {};
      }

      return { ...prev, ...updates };
    });
  }, []);

  // Go to specific step
  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= wizardState.totalSteps) {
      setWizardState(prev => ({ ...prev, currentStep: step }));
    }
  }, [wizardState.totalSteps]);

  // Check if current step is valid
  const validateCurrentStep = useCallback(() => {
    const { currentStep, startDate, endDate, creationMethod } = wizardState;

    switch (currentStep) {
      case 1:
        return startDate && endDate && new Date(endDate) > new Date(startDate);
      case 2:
        return wizardState.bufferDays === null || wizardState.bufferDays >= 0;
      case 3:
        return wizardState.vacationDays === null || wizardState.vacationDays >= 0;
      case 4:
        return wizardState.blocksPerDay >= 1 && wizardState.blocksPerDay <= 4; // Max 4 slots per day
      case 5:
        // Check that all days have blocks defined (not empty arrays)
        return Object.values(wizardState.weekStructure).every(blocks =>
          Array.isArray(blocks) && blocks.length > 0
        );
      case 6:
        return creationMethod !== null;
      case 7:
      case 8:
      case 9:
      case 10:
        return true; // These steps have different validation based on path
      default:
        return true;
    }
  }, [wizardState]);

  // Handle cancel with confirmation
  const handleCancel = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  // Save and exit
  const saveAndExit = useCallback(async () => {
    await saveDraftToSupabase(wizardState);
    setShowExitDialog(false);
    navigate(wizardState.returnPath);
  }, [wizardState, navigate, saveDraftToSupabase]);

  // Discard and exit
  const discardAndExit = useCallback(async () => {
    await clearDraftFromSupabase();
    setShowExitDialog(false);
    navigate(wizardState.returnPath);
  }, [wizardState.returnPath, navigate, clearDraftFromSupabase]);

  // Complete wizard - sends data to API
  const completeWizard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // API Base URL - lokaler Server in Entwicklung
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3010/api/wizard/complete'
        : '/api/wizard/complete';

      // Sende Wizard-Daten an API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Lernplan ${new Date().toLocaleDateString('de-DE')}`,
          startDate: wizardState.startDate,
          endDate: wizardState.endDate,
          bufferDays: wizardState.bufferDays ?? 0,
          vacationDays: wizardState.vacationDays ?? 0,
          blocksPerDay: wizardState.blocksPerDay,
          weekStructure: wizardState.weekStructure,
          creationMethod: wizardState.creationMethod,
          selectedTemplate: wizardState.selectedTemplate,
          aiSettings: wizardState.aiSettings,
          unterrechtsgebieteOrder: wizardState.unterrechtsgebieteOrder,
          learningDaysOrder: wizardState.learningDaysOrder,
          adjustments: wizardState.adjustments,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Lernplan konnte nicht erstellt werden');
      }

      console.log('✅ Lernplan erstellt:', result.lernplanId);

      // Clear draft after successful creation (from both localStorage and Supabase)
      await clearDraftFromSupabase();

      // Reset state
      setWizardState(initialWizardState);

      // Navigate to the Lernplan overview (detail page not yet implemented)
      navigate('/lernplan', {
        state: {
          lernplanCreated: true,
          lernplanId: result.lernplanId,
          message: result.message,
        }
      });
    } catch (err) {
      console.error('Fehler beim Erstellen:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
      setIsLoading(false);
    }
  }, [wizardState, navigate, clearDraftFromSupabase]);

  // Check if there's a saved draft (uses synced state)
  const hasDraft = useCallback(() => {
    return checkHasDraft();
  }, [checkHasDraft]);

  // Resume from draft (uses synced state)
  const resumeDraft = useCallback(() => {
    if (syncedDraft) {
      setWizardState({ ...initialWizardState, ...syncedDraft });
    }
  }, [syncedDraft]);

  // Start fresh
  const startFresh = useCallback(async (returnPath = '/lernplan') => {
    await clearDraftFromSupabase();
    setWizardState({ ...initialWizardState, returnPath });
  }, [clearDraftFromSupabase]);

  /**
   * Generate full calendar slots from wizard state
   * Creates slots for all days in the learning period based on weekStructure
   * Respects bufferDays and vacationDays:
   * - Learning period: startDate to (endDate - bufferDays - vacationDays)
   * - Vacation period: collected at end before buffer
   * - Buffer period: last days before exam
   */
  const generateSlotsFromWizardState = useCallback(() => {
    const { startDate, endDate, weekStructure, bufferDays, vacationDays } = wizardState;
    if (!startDate || !endDate) return {};

    // Parse dates
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const learningStart = new Date(startYear, startMonth - 1, startDay);
    const examEnd = new Date(endYear, endMonth - 1, endDay);

    // Calculate effective buffer and vacation days (default to 0 if null)
    const effectiveBufferDays = bufferDays ?? 0;
    const effectiveVacationDays = vacationDays ?? 0;

    // Calculate period boundaries (working backwards from examEnd)
    // Buffer period: last X days before exam
    const bufferStart = new Date(examEnd);
    bufferStart.setDate(bufferStart.getDate() - effectiveBufferDays + 1);

    // Vacation period: before buffer period
    const vacationStart = new Date(bufferStart);
    vacationStart.setDate(vacationStart.getDate() - effectiveVacationDays);

    // Learning period ends before vacation
    const learningEnd = new Date(vacationStart);
    learningEnd.setDate(learningEnd.getDate() - 1);

    const slots = {};
    const currentDate = new Date(learningStart);
    const now = new Date().toISOString();

    // Helper to format date key
    const formatDateKey = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    // Iterate through all days from start to exam end
    while (currentDate <= examEnd) {
      const dateKey = formatDateKey(currentDate);

      // Get day of week (convert Sunday=0 to our Monday=0 system)
      const dayOfWeek = currentDate.getDay();
      const adjustedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const dayKey = WEEKDAY_KEYS[adjustedIndex];
      const dayBlocks = weekStructure[dayKey] || [];

      // Determine what type of period this day falls into
      const isBufferPeriod = effectiveBufferDays > 0 && currentDate >= bufferStart;
      const isVacationPeriod = effectiveVacationDays > 0 && currentDate >= vacationStart && currentDate < bufferStart;
      const isLearningPeriod = currentDate <= learningEnd;

      if (isBufferPeriod) {
        // Buffer days: Create special "buffer" slots (for review/catch-up)
        const bufferSlots = [{
          id: `${dateKey}-buffer-0`,
          date: dateKey,
          position: 1,
          status: 'buffer',
          blockType: 'buffer',
          topicId: `${dateKey}-buffer`,
          topicTitle: 'Puffertag',
          groupId: `${dateKey}-buffer-group`,
          groupSize: 1,
          groupIndex: 0,
          isFromTemplate: true,
          isFromLernplan: true,
          isBufferDay: true,
          // Time information (full day representation)
          startTime: '08:00',
          endTime: '18:00',
          hasTime: true,
          createdAt: now,
          updatedAt: now,
        }];
        slots[dateKey] = bufferSlots;
      } else if (isVacationPeriod) {
        // Vacation days: Create special "vacation" slots (no learning)
        const vacationSlots = [{
          id: `${dateKey}-vacation-0`,
          date: dateKey,
          position: 1,
          status: 'vacation',
          blockType: 'vacation',
          topicId: `${dateKey}-vacation`,
          topicTitle: 'Urlaubstag',
          groupId: `${dateKey}-vacation-group`,
          groupSize: 1,
          groupIndex: 0,
          isFromTemplate: true,
          isFromLernplan: true,
          isVacationDay: true,
          // Time information (full day representation)
          startTime: '08:00',
          endTime: '18:00',
          hasTime: true,
          createdAt: now,
          updatedAt: now,
        }];
        slots[dateKey] = vacationSlots;
      } else if (isLearningPeriod) {
        // Normal learning days: Create slots from weekStructure
        const daySlots = dayBlocks.map((blockType, index) => {
          const position = index + 1;
          const timeInfo = POSITION_TO_TIME[position] || POSITION_TO_TIME[1];
          return {
            id: `${dateKey}-slot-${index}`,
            date: dateKey,
            position,
            status: 'topic',
            blockType: blockType,
            topicId: `${dateKey}-block-${index}`,
            topicTitle: '',
            groupId: `${dateKey}-group-${index}`,
            groupSize: 1,
            groupIndex: 0,
            isFromTemplate: true,
            isFromLernplan: true,
            // Time information based on position
            startTime: timeInfo.startTime,
            endTime: timeInfo.endTime,
            hasTime: true,
            createdAt: now,
            updatedAt: now,
          };
        });

        if (daySlots.length > 0) {
          slots[dateKey] = daySlots;
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Wizard: Generated slots - Learning days, Vacation: ${effectiveVacationDays} days, Buffer: ${effectiveBufferDays} days`);

    return slots;
  }, [wizardState]);

  // Complete manual calendar wizard - shows loading/success flow
  const completeManualCalendar = useCallback(async () => {
    setCalendarCreationStatus('loading');
    setCalendarCreationErrors([]);

    try {
      // Generate slots from wizard state BEFORE showing loading
      // This ensures slots are created immediately, not relying on Step8Calendar unmount
      const slots = generateSlotsFromWizardState();
      console.log('Wizard: Generated', Object.keys(slots).length, 'days of slots');

      // Create metadata for this Lernplan
      const metadata = {
        name: `Lernplan ${new Date().toLocaleDateString('de-DE')}`,
        startDate: wizardState.startDate,
        endDate: wizardState.endDate,
        blocksPerDay: wizardState.blocksPerDay,
        weekStructure: wizardState.weekStructure,
      };

      // Save to CalendarContext - wait for this to complete
      await setCalendarData(slots, metadata);
      console.log('Wizard: Calendar data saved to context');

      // Brief delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Clear the wizard draft (from both localStorage and Supabase)
      await clearDraftFromSupabase();

      // Set success status
      setCalendarCreationStatus('success');

      // After a delay, navigate to calendar
      setTimeout(() => {
        navigate('/kalender/monat');
      }, 2000);

    } catch (err) {
      console.error('Error completing manual calendar:', err);
      setCalendarCreationStatus('error');
      setCalendarCreationErrors([err.message || 'Ein Fehler ist aufgetreten']);
    }
  }, [navigate, clearDraftFromSupabase, generateSlotsFromWizardState, wizardState, setCalendarData]);

  // Create Lernplan from template selection (for automatic/template paths)
  const createLernplanFromTemplate = useCallback(async () => {
    setCalendarCreationStatus('loading');
    setCalendarCreationErrors([]);

    try {
      // API Base URL
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3010/api/wizard/complete'
        : '/api/wizard/complete';

      // Send wizard data to API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Lernplan ${new Date().toLocaleDateString('de-DE')}`,
          startDate: wizardState.startDate,
          endDate: wizardState.endDate,
          bufferDays: wizardState.bufferDays ?? 0,
          vacationDays: wizardState.vacationDays ?? 0,
          blocksPerDay: wizardState.blocksPerDay,
          weekStructure: wizardState.weekStructure,
          creationMethod: wizardState.creationMethod,
          selectedTemplate: wizardState.selectedTemplate,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Lernplan konnte nicht erstellt werden');
      }

      console.log('✅ Lernplan erstellt:', result.lernplanId);

      // Clear the wizard draft (from both localStorage and Supabase)
      await clearDraftFromSupabase();

      // Set success status
      setCalendarCreationStatus('success');

      // After a delay, navigate to calendar month view
      setTimeout(() => {
        navigate('/kalender/monat');
      }, 2000);

    } catch (err) {
      console.error('Error creating Lernplan from template:', err);
      setCalendarCreationStatus('error');
      setCalendarCreationErrors([err.message || 'Ein Fehler ist aufgetreten']);
    }
  }, [wizardState, navigate, clearDraftFromSupabase]);

  // Reset calendar creation status
  const resetCalendarCreationStatus = useCallback(() => {
    setCalendarCreationStatus(null);
    setCalendarCreationErrors([]);
  }, []);

  // Complete automatic Lernplan (with Loading → Success → Calendar flow)
  const completeAutomaticLernplan = useCallback(async () => {
    setCalendarCreationStatus('loading');
    setCalendarCreationErrors([]);

    try {
      // API Base URL
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3010/api/wizard/complete'
        : '/api/wizard/complete';

      // Send wizard data to API (including manualLernplan for automatic path)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Lernplan ${new Date().toLocaleDateString('de-DE')}`,
          startDate: wizardState.startDate,
          endDate: wizardState.endDate,
          bufferDays: wizardState.bufferDays ?? 0,
          vacationDays: wizardState.vacationDays ?? 0,
          blocksPerDay: wizardState.blocksPerDay,
          weekStructure: wizardState.weekStructure,
          creationMethod: wizardState.creationMethod,
          manualLernplan: wizardState.manualLernplan,
          unterrechtsgebieteOrder: wizardState.unterrechtsgebieteOrder,
          learningDaysOrder: wizardState.learningDaysOrder,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Lernplan konnte nicht erstellt werden');
      }

      console.log('✅ Lernplan erstellt:', result.lernplanId);

      // Clear the wizard draft (from both localStorage and Supabase)
      await clearDraftFromSupabase();

      // Set success status
      setCalendarCreationStatus('success');

      // After a delay, navigate to calendar month view
      setTimeout(() => {
        navigate('/kalender/monat');
      }, 2000);

    } catch (err) {
      console.error('Error completing automatic Lernplan:', err);
      setCalendarCreationStatus('error');
      setCalendarCreationErrors([err.message || 'Ein Fehler ist aufgetreten']);
    }
  }, [wizardState, navigate, clearDraftFromSupabase]);

  const value = {
    // State
    ...wizardState,
    isLoading,
    draftLoading, // Loading state for Supabase sync
    error,
    showExitDialog,
    calendarCreationStatus,
    calendarCreationErrors,
    isAuthenticated, // Whether user is authenticated (for UI hints)

    // Actions
    updateWizardData,
    nextStep,
    prevStep,
    goToStep,
    validateCurrentStep,
    handleCancel,
    saveAndExit,
    discardAndExit,
    completeWizard,
    completeManualCalendar,
    completeAutomaticLernplan,
    createLernplanFromTemplate,
    resetCalendarCreationStatus,
    hasDraft,
    resumeDraft,
    startFresh,
    setShowExitDialog,
    setError,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
};

/**
 * Hook to use wizard context
 */
export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};

export default WizardContext;
