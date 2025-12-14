import React from 'react';
import { useWizard } from '../context/wizard-context';
import { Button } from '../../../components/ui';
import ExitDialog from './exit-dialog';

/**
 * WizardLayout - Main layout wrapper for the wizard
 * Based on Figma: Lernplan_Prozess_Base
 */
const WizardLayout = ({ children }) => {
  const {
    currentStep,
    totalSteps,
    showExitDialog,
    handleCancel,
    prevStep,
    nextStep,
    validateCurrentStep,
    isLoading,
  } = useWizard();

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const isValid = validateCurrentStep();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - Simplified without main navigation */}
      <header className="h-[72px] px-8 flex items-center justify-between border-b border-gray-100">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-gray-900">PrepWell</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Schritt</span>
          <span className="text-sm font-semibold text-gray-900">
            {currentStep} / {totalSteps}
          </span>
        </div>

        {/* Cancel button */}
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          Abbrechen
        </Button>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-primary-600 transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 max-w-4xl mx-auto w-full px-8 py-12">
          {children}
        </div>
      </main>

      {/* Footer with navigation buttons */}
      <footer className="border-t border-gray-100 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Back button */}
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={isFirstStep || isLoading}
            className={isFirstStep ? 'invisible' : ''}
          >
            Zurück
          </Button>

          {/* Next/Complete button */}
          <Button
            onClick={nextStep}
            disabled={!isValid || isLoading}
          >
            {isLastStep ? 'Lernplan erstellen' : 'Weiter'}
          </Button>
        </div>
      </footer>

      {/* Exit confirmation dialog */}
      <ExitDialog open={showExitDialog} />
    </div>
  );
};

export default WizardLayout;
