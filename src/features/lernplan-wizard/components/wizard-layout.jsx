import { useWizard } from '../context/wizard-context';
import { Button } from '../../../components/ui';
import ExitDialog from './exit-dialog';
import { RECHTSGEBIET_LABELS } from '../../../data/unterrechtsgebiete-data';

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
    goNext, // Use goNext instead of nextStep to support Step 12 confirmation
    validateCurrentStep,
    completeWizard,
    completeManualCalendar,
    completeAutomaticLernplan,
    createLernplanFromTemplate,
    creationMethod,
    isLoading,
    selectedTemplate,
    selectedRechtsgebiete,
    currentRechtsgebietIndex,
  } = useWizard();

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const isValid = validateCurrentStep();
  const isManualCalendarPath = creationMethod === 'manual';
  const isAutomaticPath = creationMethod === 'automatic';
  // Only template path goes directly to creation after step 7
  const isTemplateSelectionStep = currentStep === 7 && creationMethod === 'template';
  // BUG-P4 FIX: Step 12 has its own navigation buttons (RG cycling)
  const hasCustomNavigation = currentStep === 12 && creationMethod === 'manual';

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
      goNext(); // Use goNext to support Step 12 confirmation dialog
    }
  };

  // Check if we're on Step 12 and there are more RGs to configure
  const isStep12WithMoreRgs = currentStep === 12 &&
    creationMethod === 'manual' &&
    selectedRechtsgebiete.length > 0 &&
    currentRechtsgebietIndex < selectedRechtsgebiete.length - 1;

  // Get the next RG name for Step 12 button text
  const nextRgName = isStep12WithMoreRgs
    ? RECHTSGEBIET_LABELS[selectedRechtsgebiete[currentRechtsgebietIndex + 1]] || selectedRechtsgebiete[currentRechtsgebietIndex + 1]
    : null;

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
    // Step 12: Show "Nächstes Rechtsgebiet" when there are more RGs
    if (isStep12WithMoreRgs) {
      return `Weiter zu ${nextRgName}`;
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
    // PW-025 Bug 2 FIX: Changed min-h-screen to h-screen to force content to scroll within viewport
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header - Simplified without main navigation */}
      <header className="h-[72px] px-8 flex items-center justify-between border-b border-neutral-200">
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
      {/* PW-025 Bug 2 FIX: Added min-h-0 to allow flex children to shrink and respect overflow */}
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12">
          {children}
        </div>
      </main>

      {/* Footer with navigation buttons */}
      {/* BUG-P4 FIX: Hide footer for Step 12 (has own navigation) */}
      {!hasCustomNavigation && (
        <footer className="border-t border-neutral-200 px-4 sm:px-8 py-4">
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
      )}

      {/* Exit confirmation dialog */}
      <ExitDialog open={showExitDialog} />
    </div>
  );
};

export default WizardLayout;
