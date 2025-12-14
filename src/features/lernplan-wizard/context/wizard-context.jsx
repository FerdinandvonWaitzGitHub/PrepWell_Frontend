import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Lernplan Wizard Context
 * Manages multi-step wizard state with localStorage persistence
 */

const STORAGE_KEY = 'prepwell_lernplan_wizard_draft';

// Initial wizard state
const initialWizardState = {
  currentStep: 1,
  totalSteps: 10,
  // Step 1: Lernzeitraum
  startDate: null,
  endDate: null,
  // Step 2: Puffertage
  bufferDays: 0,
  // Step 3: Urlaubstage
  vacationDays: 0,
  // Step 4: Tagesblöcke
  blocksPerDay: 3,
  // Step 5: Wochenstruktur
  weekStructure: {
    montag: true,
    dienstag: true,
    mittwoch: true,
    donnerstag: true,
    freitag: true,
    samstag: false,
    sonntag: false,
  },
  // Step 6: Erstellungsmethode
  creationMethod: null, // 'manual' | 'automatic' | 'template'
  // Step 7+: Pfad-spezifische Daten
  selectedTemplate: null,
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

  // Set return path when entering wizard
  useEffect(() => {
    const referrer = location.state?.from || '/lernplan';
    if (wizardState.returnPath !== referrer && location.state?.from) {
      setWizardState(prev => ({ ...prev, returnPath: referrer }));
    }
  }, [location.state]);

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
        return wizardState.bufferDays >= 0;
      case 3:
        return wizardState.vacationDays >= 0;
      case 4:
        return wizardState.blocksPerDay >= 1 && wizardState.blocksPerDay <= 6;
      case 5:
        return Object.values(wizardState.weekStructure).some(v => v);
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

  // Complete wizard
  const completeWizard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Send to API when available
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Clear draft after successful creation
      clearDraft();

      // Reset state
      setWizardState(initialWizardState);

      // Navigate back
      navigate(wizardState.returnPath, {
        state: { lernplanCreated: true }
      });
    } catch (err) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
      setIsLoading(false);
    }
  }, [wizardState.returnPath, navigate]);

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

  const value = {
    // State
    ...wizardState,
    isLoading,
    error,
    showExitDialog,

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
