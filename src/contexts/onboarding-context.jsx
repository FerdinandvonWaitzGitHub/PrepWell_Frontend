import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Onboarding Context
 *
 * Manages the onboarding flow for new users:
 * - Step 1: Welcome Screen
 * - Step 2: Mode Selection (Exam/Normal)
 * - Step 3: Feature Tour (optional)
 * - Step 4: First Lernplan Creation (redirects to wizard)
 */

const STORAGE_KEY_ONBOARDING_COMPLETED = 'prepwell_onboarding_completed';
const STORAGE_KEY_ONBOARDING_STEP = 'prepwell_onboarding_step';

export const ONBOARDING_STEPS = {
  WELCOME: 1,
  MODE_SELECTION: 2,
  FEATURE_TOUR: 3,
  COMPLETE: 4,
};

const OnboardingContext = createContext(null);

export const OnboardingProvider = ({ children }) => {
  // Check if onboarding is completed
  const [isCompleted, setIsCompleted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ONBOARDING_COMPLETED) === 'true';
    } catch {
      return false;
    }
  });

  // Current onboarding step
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ONBOARDING_STEP);
      return stored ? parseInt(stored, 10) : ONBOARDING_STEPS.WELCOME;
    } catch {
      return ONBOARDING_STEPS.WELCOME;
    }
  });

  // Selected mode during onboarding
  const [selectedMode, setSelectedMode] = useState(null);

  // Persist step to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ONBOARDING_STEP, currentStep.toString());
  }, [currentStep]);

  // Go to next step
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.COMPLETE));
  }, []);

  // Go to previous step
  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, ONBOARDING_STEPS.WELCOME));
  }, []);

  // Go to specific step
  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setIsCompleted(true);
    setCurrentStep(ONBOARDING_STEPS.COMPLETE);
    localStorage.setItem(STORAGE_KEY_ONBOARDING_COMPLETED, 'true');
  }, []);

  // Skip onboarding (for users who want to skip)
  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  // Reset onboarding (for testing/debugging)
  const resetOnboarding = useCallback(() => {
    setIsCompleted(false);
    setCurrentStep(ONBOARDING_STEPS.WELCOME);
    localStorage.removeItem(STORAGE_KEY_ONBOARDING_COMPLETED);
    localStorage.removeItem(STORAGE_KEY_ONBOARDING_STEP);
  }, []);

  // Check if user needs onboarding
  const needsOnboarding = !isCompleted;

  const value = {
    isCompleted,
    needsOnboarding,
    currentStep,
    selectedMode,
    setSelectedMode,
    nextStep,
    prevStep,
    goToStep,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    STEPS: ONBOARDING_STEPS,
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
