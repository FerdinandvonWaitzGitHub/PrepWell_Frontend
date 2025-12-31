import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWizardDraftSync } from '../../../hooks/use-supabase-sync';

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
export const WizardProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
  const prevStep = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
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
        return wizardState.blocksPerDay >= 1 && wizardState.blocksPerDay <= 6;
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

  // Complete manual calendar wizard - shows loading/success flow
  const completeManualCalendar = useCallback(async () => {
    setCalendarCreationStatus('loading');
    setCalendarCreationErrors([]);

    try {
      // Simulate a brief delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Note: The calendar data is saved by Step8Calendar on unmount
      // Here we just clear the draft and set success status

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
  }, [navigate, clearDraftFromSupabase]);

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
