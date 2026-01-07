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
    case 'calendar':
      return 7; // "Im Kalender erstellen" flow: Steps 1-6 + Step 7 (calendar editor)
    case 'manual':
      return 22; // "Als Liste erstellen" flow: Steps 1-6 + Steps 7-22
    case 'template':
      return 9; // Steps 1-7 + Lerntage + Anpassungen (skip Unterrechtsgebiete)
    case 'ai':
      return 8; // Steps 1-7 (AI config) + Anpassungen (AI generates the rest)
    case 'automatic':
    default:
      return 10; // Standard automatic flow
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

  // === "Als Liste erstellen" Path (Steps 7-15) ===
  // Step 7: URG creation mode
  urgCreationMode: null, // 'manual' | 'prefilled'
  // Selected Rechtsgebiete from user settings
  selectedRechtsgebiete: [], // ['zivilrecht', 'strafrecht', 'oeffentliches-recht']
  // Step 8/9: Current Rechtsgebiet being edited (index in selectedRechtsgebiete)
  currentRechtsgebietIndex: 0,
  // Track which Rechtsgebiete have their URGs configured
  rechtsgebieteProgress: {}, // { 'zivilrecht': true, 'strafrecht': false, ... }
  // URGs per Rechtsgebiet (draft during editing)
  unterrechtsgebieteDraft: {}, // { 'zivilrecht': [{ id, name, kategorie }], ... }
  // Step 12: Themen per URG
  themenDraft: {}, // { 'bgb-at': [{ id, name, aufgaben: [] }], ... }
  // Track which Rechtsgebiete have their Themen configured
  themenProgress: {}, // { 'zivilrecht': true, ... }
  // Step 14: Zielgewichtung (must sum to 100)
  rechtsgebieteGewichtung: {}, // { 'zivilrecht': 40, 'strafrecht': 30, 'oeffentliches-recht': 30 }

  // === Steps 16-19: Lernblöcke ===
  // Step 17: Current Rechtsgebiet for block creation (index)
  currentBlockRgIndex: 0,
  // Track which Rechtsgebiete have their blocks configured
  blockRgProgress: {}, // { 'zivilrecht': true, ... }
  // Step 18: Lernblöcke per Rechtsgebiet
  lernbloeckeDraft: {}, // { 'zivilrecht': [{ id, size, themen: [] }], ... }
  // Step 19: Lernplanblöcke per URG
  lernplanBloecke: {}, // { 'bgb-at': [{ id, size }], ... }

  // === Steps 20-22: Verteilung & Abschluss ===
  // Step 20: Verteilungsmodus
  verteilungsmodus: null, // 'gemischt' | 'fokussiert' | 'themenweise'
  // Step 21: Generated calendar preview
  generatedCalendar: [], // [{ date, blocks: [{ id, rechtsgebiet, size }] }]

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
      setWizardState(_prev => ({ ...initialWizardState, ...syncedDraft }));
      initialSyncDone.current = true;
    }
  }, [syncedDraft]);

  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 12 confirmation handler - allows step component to intercept navigation
  const step12ConfirmationHandlerRef = useRef(null);
  const setStep12ConfirmationHandler = useCallback((handler) => {
    step12ConfirmationHandlerRef.current = handler;
  }, []);

  // Calendar creation flow state (for manual path)
  const [calendarCreationStatus, setCalendarCreationStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [calendarCreationErrors, setCalendarCreationErrors] = useState([]);

  // Set return path when entering wizard
  useEffect(() => {
    const referrer = location.state?.from || '/lernplan';
    if (wizardState.returnPath !== referrer && location.state?.from) {
      setWizardState(prev => ({ ...prev, returnPath: referrer }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Update totalSteps when creationMethod changes
  useEffect(() => {
    if (wizardState.creationMethod) {
      const newTotalSteps = getTotalStepsForMethod(wizardState.creationMethod);
      if (wizardState.totalSteps !== newTotalSteps) {
        setWizardState(prev => ({ ...prev, totalSteps: newTotalSteps }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Go to next step (with loop logic for manual path)
  const nextStep = useCallback(() => {
    setWizardState(prev => {
      const {
        currentStep,
        totalSteps,
        creationMethod,
        selectedRechtsgebiete,
        currentRechtsgebietIndex,
        rechtsgebieteProgress,
        themenProgress,
        currentBlockRgIndex,
        blockRgProgress,
      } = prev;

      // Default: just increment
      let nextStepNum = Math.min(currentStep + 1, totalSteps);
      const updates = { currentStep: nextStepNum };

      // Manual path loop logic
      if (creationMethod === 'manual') {
        // === URG Loop (Steps 8-10) ===
        if (currentStep === 10) {
          // Step 10: URG Success - mark current RG as complete and check for more
          const currentRg = selectedRechtsgebiete[currentRechtsgebietIndex];
          const newProgress = { ...rechtsgebieteProgress, [currentRg]: true };
          updates.rechtsgebieteProgress = newProgress;

          // Check if all RGs are configured
          const allRgsConfigured = selectedRechtsgebiete.every(rgId => newProgress[rgId]);

          if (!allRgsConfigured) {
            // Find next unconfigured RG
            const nextUnconfiguredIndex = selectedRechtsgebiete.findIndex(
              rgId => !newProgress[rgId]
            );
            if (nextUnconfiguredIndex !== -1) {
              updates.currentRechtsgebietIndex = nextUnconfiguredIndex;
              updates.currentStep = 8; // Go back to RG selection
              return { ...prev, ...updates };
            }
          }
          // All RGs configured - proceed to Step 11 (Themen intro)
          updates.currentStep = 11;
          return { ...prev, ...updates };
        }

        // === Themen Loop (Step 12 cycles through all RGs) ===
        if (currentStep === 12) {
          // Step 12: Themen Edit - mark current RG themes as complete and check for more
          const currentRg = selectedRechtsgebiete[currentRechtsgebietIndex];
          const newThemenProgress = { ...themenProgress, [currentRg]: true };
          updates.themenProgress = newThemenProgress;

          // Check if this is the last RG
          const nextRgIndex = currentRechtsgebietIndex + 1;
          const hasMoreRgs = nextRgIndex < selectedRechtsgebiete.length;

          if (hasMoreRgs) {
            // Move to next RG, stay on Step 12
            updates.currentRechtsgebietIndex = nextRgIndex;
            updates.currentStep = 12; // Stay on Step 12
            return { ...prev, ...updates };
          }

          // All RGs done - skip Step 13 (not needed anymore), go directly to Step 14
          updates.currentStep = 14;
          // Reset index for potential future use
          updates.currentRechtsgebietIndex = 0;
          return { ...prev, ...updates };
        }

        // Step 13 is now skipped (legacy - kept for backwards compatibility)
        if (currentStep === 13) {
          // Go directly to Step 14
          updates.currentStep = 14;
          return { ...prev, ...updates };
        }

        // === Blocks Loop (Steps 17-19) ===
        if (currentStep === 19) {
          // Step 19: Lernplanblöcke complete - mark current RG blocks as complete
          const currentRg = selectedRechtsgebiete[currentBlockRgIndex];
          const newBlockProgress = { ...blockRgProgress, [currentRg]: true };
          updates.blockRgProgress = newBlockProgress;

          // Check if all RGs have blocks configured
          const allBlocksConfigured = selectedRechtsgebiete.every(rgId => newBlockProgress[rgId]);

          if (!allBlocksConfigured) {
            // Find next RG without blocks
            const nextUnconfiguredIndex = selectedRechtsgebiete.findIndex(
              rgId => !newBlockProgress[rgId]
            );
            if (nextUnconfiguredIndex !== -1) {
              updates.currentBlockRgIndex = nextUnconfiguredIndex;
              updates.currentStep = 17; // Go back to RG selection for blocks
              return { ...prev, ...updates };
            }
          }
          // All RGs have blocks - proceed to Step 20 (Verteilungsmodus)
          updates.currentStep = 20;
          return { ...prev, ...updates };
        }
      }

      return { ...prev, ...updates };
    });
  }, []);

  // Wrapper for nextStep that checks Step 12 confirmation handler
  const goNext = useCallback(() => {
    const { currentStep } = wizardState;

    // Check Step 12 confirmation handler
    if (currentStep === 12 && step12ConfirmationHandlerRef.current) {
      const shouldProceed = step12ConfirmationHandlerRef.current(() => {
        // This callback is called when user confirms in the dialog
        nextStep();
      });

      if (!shouldProceed) {
        // Handler returned false - it will show a dialog and call the callback later
        return;
      }
    }

    // Normal navigation
    nextStep();
  }, [wizardState, nextStep]);

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
      // Non-manual paths: steps 7-10
      case 7:
      case 8:
      case 9:
      case 10:
        if (creationMethod !== 'manual') {
          return true; // Non-manual paths have their own validation in components
        }
        // Manual path validation for steps 7-10
        return validateManualStep(currentStep);
      // Manual path only: steps 11-22
      case 11:
      case 12:
      case 13:
      case 14:
      case 15:
      case 16:
      case 17:
      case 18:
      case 19:
      case 20:
      case 21:
      case 22:
        if (creationMethod === 'manual') {
          return validateManualStep(currentStep);
        }
        return true;
      default:
        return true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardState]); // validateManualStep depends on same wizardState

  // Validation for manual path steps (7-22)
  const validateManualStep = useCallback((step) => {
    const {
      urgCreationMode,
      selectedRechtsgebiete,
      currentRechtsgebietIndex,
      unterrechtsgebieteDraft,
      themenDraft,
      rechtsgebieteGewichtung,
      currentBlockRgIndex,
      lernbloeckeDraft,
      // Note: lernplanBloecke removed - see WIZARD_DATA_ISSUES.md P1
      verteilungsmodus,
    } = wizardState;

    switch (step) {
      case 7:
        // Step 7: URG mode must be selected
        return urgCreationMode !== null;

      case 8:
        // Step 8: A Rechtsgebiet must be selected
        return selectedRechtsgebiete.length > 0 && currentRechtsgebietIndex >= 0;

      case 9: {
        // Step 9: Current RG must have at least one URG
        const currentRg = selectedRechtsgebiete[currentRechtsgebietIndex];
        const urgs = unterrechtsgebieteDraft[currentRg] || [];
        return urgs.length > 0;
      }

      case 10:
        // Step 10: Success screen - always valid (confirmation step)
        return true;

      case 11:
        // Step 11: Themen intro - always valid
        return true;

      case 12: {
        // Step 12: At least one URG (across ALL RGs) must have at least one theme
        // Step 12 is a unified editor with tabs, so we check all RGs
        for (const rgId of selectedRechtsgebiete) {
          const urgsForRg = unterrechtsgebieteDraft[rgId] || [];
          for (const urg of urgsForRg) {
            const themes = themenDraft[urg.id] || [];
            if (themes.length > 0) {
              return true; // Found at least one URG with themes
            }
          }
        }
        return false; // No URG has any themes
      }

      case 13:
        // Step 13: Themen success - always valid (confirmation step)
        return true;

      case 14: {
        // Step 14: Gewichtung - OPTIONAL (informational only)
        // If weights are set, they must sum to 100
        // If no weights are set (disabled), that's also valid
        if (selectedRechtsgebiete.length === 0) return false;
        const hasAnyWeights = Object.keys(rechtsgebieteGewichtung).length > 0;
        if (!hasAnyWeights) return true; // Gewichtung disabled - valid

        const allHaveWeight = selectedRechtsgebiete.every(
          rgId => rechtsgebieteGewichtung[rgId] !== undefined && rechtsgebieteGewichtung[rgId] >= 0
        );
        const totalWeight = Object.values(rechtsgebieteGewichtung).reduce((sum, w) => sum + (w || 0), 0);
        return allHaveWeight && totalWeight === 100;
      }

      case 15: {
        // Step 15: Lernblöcke erstellen - at least one block must exist
        // Users should create blocks and assign themes before proceeding
        const hasAnyBlocks = Object.values(lernbloeckeDraft).some(
          blocks => blocks && blocks.length > 0
        );
        return hasAnyBlocks;
      }

      case 16:
        // Step 16: Blöcke intro - always valid
        return true;

      case 17:
        // Step 17: RG selection for blocks - must have valid selection
        return selectedRechtsgebiete.length > 0 && currentBlockRgIndex >= 0;

      case 18: {
        // Step 18: Lernblöcke edit - current RG must have at least one block
        const currentRgForBlocks = selectedRechtsgebiete[currentBlockRgIndex];
        const blocks = lernbloeckeDraft[currentRgForBlocks] || [];
        return blocks.length > 0;
      }

      case 19: {
        // Step 19: Lernplanblöcke
        // NOTE: Using lernbloeckeDraft for validation (same as Step 21 calendar generation)
        // lernplanBloecke is currently not used by Step 21 - see WIZARD_DATA_ISSUES.md P1
        const currentRgForLpBlocks = selectedRechtsgebiete[currentBlockRgIndex];
        const blocks = lernbloeckeDraft[currentRgForLpBlocks] || [];
        return blocks.length > 0;
      }

      case 20:
        // Step 20: Verteilungsmodus must be selected
        return verteilungsmodus !== null;

      case 21:
        // Step 21: Calendar preview - always valid (preview step)
        return true;

      case 22:
        // Step 22: Final confirmation - always valid (confirmation step)
        return true;

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
          // Core settings (Steps 1-5)
          startDate: wizardState.startDate,
          endDate: wizardState.endDate,
          bufferDays: wizardState.bufferDays ?? 0,
          vacationDays: wizardState.vacationDays ?? 0,
          blocksPerDay: wizardState.blocksPerDay,
          weekStructure: wizardState.weekStructure,
          // Step 6: Creation method
          creationMethod: wizardState.creationMethod,
          // Template/AI paths
          selectedTemplate: wizardState.selectedTemplate,
          aiSettings: wizardState.aiSettings,
          unterrechtsgebieteOrder: wizardState.unterrechtsgebieteOrder,
          learningDaysOrder: wizardState.learningDaysOrder,
          adjustments: wizardState.adjustments,
          // === Manual Path Data (Steps 7-22) ===
          // Step 7: URG mode and selected Rechtsgebiete
          urgCreationMode: wizardState.urgCreationMode,
          selectedRechtsgebiete: wizardState.selectedRechtsgebiete,
          // Step 9: URGs per Rechtsgebiet
          unterrechtsgebieteDraft: wizardState.unterrechtsgebieteDraft,
          // Step 12: Themen & Aufgaben per URG
          themenDraft: wizardState.themenDraft,
          // Step 14: Gewichtung (optional)
          rechtsgebieteGewichtung: wizardState.rechtsgebieteGewichtung,
          // Steps 15-19: Lernblöcke
          lernbloeckeDraft: wizardState.lernbloeckeDraft,
          lernplanBloecke: wizardState.lernplanBloecke,
          // Step 20: Distribution mode
          verteilungsmodus: wizardState.verteilungsmodus,
          // Step 21: Generated calendar preview
          generatedCalendar: wizardState.generatedCalendar,
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
    goNext, // Use this instead of nextStep for navigation buttons (handles Step 12 confirmation)
    prevStep,
    goToStep,
    setStep12ConfirmationHandler, // For Step 12 to register its confirmation handler
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
// eslint-disable-next-line react-refresh/only-export-components
export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};

export default WizardContext;
