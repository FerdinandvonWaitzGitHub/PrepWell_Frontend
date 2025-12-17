import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Lernplan Wizard Context
 * Manages multi-step wizard state with localStorage persistence
 */

const STORAGE_KEY = 'prepwell_lernplan_wizard_draft';

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
 * Load draft from localStorage
 */
const loadDraft = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialWizardState, ...parsed };
    }
  } catch (error) {
    console.error('Error loading wizard draft:', error);
  }
  return null;
};

/**
 * Save draft to localStorage
 */
const saveDraft = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      lastModified: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error saving wizard draft:', error);
  }
};

/**
 * Clear draft from localStorage
 */
const clearDraft = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing wizard draft:', error);
  }
};

/**
 * Wizard Provider Component
 */
export const WizardProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize state from localStorage or default
  const [wizardState, setWizardState] = useState(() => {
    const draft = loadDraft();
    return draft || initialWizardState;
  });

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

  // Auto-save on state change
  useEffect(() => {
    if (wizardState.currentStep > 0) {
      saveDraft(wizardState);
    }
  }, [wizardState]);

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
  const saveAndExit = useCallback(() => {
    saveDraft(wizardState);
    setShowExitDialog(false);
    navigate(wizardState.returnPath);
  }, [wizardState, navigate]);

  // Discard and exit
  const discardAndExit = useCallback(() => {
    clearDraft();
    setShowExitDialog(false);
    navigate(wizardState.returnPath);
  }, [wizardState.returnPath, navigate]);

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

      // Clear draft after successful creation
      clearDraft();

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
  }, [wizardState, navigate]);

  // Check if there's a saved draft
  const hasDraft = useCallback(() => {
    const draft = loadDraft();
    return draft && draft.currentStep > 1;
  }, []);

  // Resume from draft
  const resumeDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      setWizardState(draft);
    }
  }, []);

  // Start fresh
  const startFresh = useCallback((returnPath = '/lernplan') => {
    clearDraft();
    setWizardState({ ...initialWizardState, returnPath });
  }, []);

  // Complete manual calendar wizard - shows loading/success flow
  const completeManualCalendar = useCallback(async () => {
    setCalendarCreationStatus('loading');
    setCalendarCreationErrors([]);

    try {
      // Simulate a brief delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Note: The calendar data is saved by Step8Calendar on unmount
      // Here we just clear the draft and set success status

      // Clear the wizard draft
      clearDraft();

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
  }, [navigate]);

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

      // Clear the wizard draft
      clearDraft();

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
  }, [wizardState, navigate]);

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

      // Clear the wizard draft
      clearDraft();

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
  }, [wizardState, navigate]);

  const value = {
    // State
    ...wizardState,
    isLoading,
    error,
    showExitDialog,
    calendarCreationStatus,
    calendarCreationErrors,

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
