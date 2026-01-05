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
    completeWizard,
    completeManualCalendar,
    completeAutomaticLernplan,
    createLernplanFromTemplate,
    creationMethod,
    isLoading,
    selectedTemplate,
  } = useWizard();

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const isValid = validateCurrentStep();
  const isManualCalendarPath = creationMethod === 'manual';
  const isAutomaticPath = creationMethod === 'automatic';
  // Only template path goes directly to creation after step 7
  const isTemplateSelectionStep = currentStep === 7 && creationMethod === 'template';

  // Handle complete button click - use different function based on path
  const handleComplete = () => {
    if (isManualCalendarPath) {
      completeManualCalendar();
    } else if (isAutomaticPath) {
      completeAutomaticLernplan();
    } else {
      completeWizard();
    }
  };

  // Handle next button click
  const handleNext = () => {
    if (isTemplateSelectionStep && selectedTemplate) {
      // For automatic/template path at step 7, create Lernplan from template
      createLernplanFromTemplate();
    } else if (isLastStep) {
      handleComplete();
    } else {
      nextStep();
    }
  };

  // Get button text based on path and step
  const getButtonText = () => {
    if (isLoading) return 'Wird erstellt...';
    if (isTemplateSelectionStep && selectedTemplate) {
      return 'Lernplan erstellen';
    }
    if (isLastStep) {
      if (isManualCalendarPath) return 'Fertig';
      if (isAutomaticPath) return 'Lernplan erstellen';
      return 'Lernplan erstellen';
    }
    return 'Weiter';
  };

  // Check if button should be disabled
  const isButtonDisabled = () => {
    if (isLoading) return true;
    if (!isValid) return true;
    if (isTemplateSelectionStep && !selectedTemplate) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - Simplified without main navigation */}
      <header className="h-[72px] px-8 flex items-center justify-between border-b border-neutral-100">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-neutral-900">PrepWell</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Schritt</span>
          <span className="text-sm font-semibold text-neutral-900">
            {currentStep} / {totalSteps}
          </span>
        </div>

        {/* Cancel button */}
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="text-neutral-500 hover:text-neutral-700"
        >
          Abbrechen
        </Button>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-neutral-100">
        <div
          className="h-full bg-primary-600 transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12">
          {children}
        </div>
      </main>

      {/* Footer with navigation buttons */}
      <footer className="border-t border-neutral-100 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
            onClick={handleNext}
            disabled={isButtonDisabled()}
          >
            {getButtonText()}
          </Button>
        </div>
      </footer>

      {/* Exit confirmation dialog */}
      <ExitDialog open={showExitDialog} />
    </div>
  );
};

export default WizardLayout;
