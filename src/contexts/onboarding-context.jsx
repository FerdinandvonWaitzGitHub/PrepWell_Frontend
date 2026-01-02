import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useOnboardingSync } from '../hooks/use-supabase-sync';

/**
 * Onboarding Context
 *
 * Manages the onboarding flow for new users:
 * - Step 1: Welcome Screen
 * - Step 2: Mode Selection (Exam/Normal)
 * - Step 3: Feature Tour (optional)
 * - Step 4: First Lernplan Creation (redirects to wizard)
 *
 * Now syncs to Supabase via useOnboardingSync hook
 */

const STORAGE_KEY_ONBOARDING_COMPLETED = 'prepwell_onboarding_complete';
const STORAGE_KEY_ONBOARDING_STEP = 'prepwell_onboarding_step';

export const ONBOARDING_STEPS = {
  WELCOME: 1,
  MODE_SELECTION: 2,
  FEATURE_TOUR: 3,
  COMPLETE: 4,
};

const OnboardingContext = createContext(null);

export const OnboardingProvider = ({ children }) => {
  // Use Supabase sync hook for onboarding state
  const {
    onboardingState,
    updateOnboardingState,
    loading: syncLoading,
    isAuthenticated,
    isSupabaseEnabled,
  } = useOnboardingSync();

  // Local state (initialized from sync hook or localStorage)
  const [isCompleted, setIsCompleted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ONBOARDING_COMPLETED) === 'true';
    } catch {
      return false;
    }
  });

  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ONBOARDING_STEP);
      return stored ? parseInt(stored, 10) : ONBOARDING_STEPS.WELCOME;
    } catch {
      return ONBOARDING_STEPS.WELCOME;
    }
  });

  const [selectedMode, setSelectedMode] = useState(null);

  // Sync state from hook when it loads from Supabase
  useEffect(() => {
    if (onboardingState && isAuthenticated && isSupabaseEnabled) {
      if (onboardingState.isCompleted !== undefined) {
        setIsCompleted(onboardingState.isCompleted);
      }
      if (onboardingState.currentStep !== undefined) {
        setCurrentStep(onboardingState.currentStep);
      }
      if (onboardingState.selectedMode !== undefined) {
        setSelectedMode(onboardingState.selectedMode);
      }
    }
  }, [onboardingState, isAuthenticated, isSupabaseEnabled]);

  // Persist step to localStorage and Supabase
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ONBOARDING_STEP, currentStep.toString());
  }, [currentStep]);

  // Go to next step
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const newStep = Math.min(prev + 1, ONBOARDING_STEPS.COMPLETE);
      // Sync to Supabase
      updateOnboardingState({ currentStep: newStep });
      return newStep;
    });
  }, [updateOnboardingState]);

  // Go to previous step
  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      const newStep = Math.max(prev - 1, ONBOARDING_STEPS.WELCOME);
      // Sync to Supabase
      updateOnboardingState({ currentStep: newStep });
      return newStep;
    });
  }, [updateOnboardingState]);

  // Go to specific step
  const goToStep = useCallback((step) => {
    setCurrentStep(step);
    updateOnboardingState({ currentStep: step });
  }, [updateOnboardingState]);

  // Update selected mode and sync
  const handleSetSelectedMode = useCallback((mode) => {
    setSelectedMode(mode);
    updateOnboardingState({ selectedMode: mode });
  }, [updateOnboardingState]);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setIsCompleted(true);
    setCurrentStep(ONBOARDING_STEPS.COMPLETE);
    localStorage.setItem(STORAGE_KEY_ONBOARDING_COMPLETED, 'true');
    // Sync to Supabase
    updateOnboardingState({
      isCompleted: true,
      currentStep: ONBOARDING_STEPS.COMPLETE,
    });
  }, [updateOnboardingState]);

  // Skip onboarding (for users who want to skip)
  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  // Reset onboarding (for testing/debugging)
  const resetOnboarding = useCallback(() => {
    setIsCompleted(false);
    setCurrentStep(ONBOARDING_STEPS.WELCOME);
    setSelectedMode(null);
    localStorage.removeItem(STORAGE_KEY_ONBOARDING_COMPLETED);
    localStorage.removeItem(STORAGE_KEY_ONBOARDING_STEP);
    // Sync to Supabase
    updateOnboardingState({
      isCompleted: false,
      currentStep: ONBOARDING_STEPS.WELCOME,
      selectedMode: null,
    });
  }, [updateOnboardingState]);

  // Check if user needs onboarding
  const needsOnboarding = !isCompleted;

  const value = {
    isCompleted,
    needsOnboarding,
    currentStep,
    selectedMode,
    setSelectedMode: handleSetSelectedMode,
    nextStep,
    prevStep,
    goToStep,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    STEPS: ONBOARDING_STEPS,
    // Sync status
    isSyncing: syncLoading,
    isSupabaseEnabled,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default OnboardingContext;
