import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWizard, WizardProvider } from './context/wizard-context';
import { useAppMode } from '../../contexts/appmode-context';
import WizardLayout from './components/wizard-layout';
import LoadingScreen from './components/loading-screen';
import ErrorScreen from './components/error-screen';
import CalendarCreationLoading from './components/calendar-creation-loading';
import CalendarCreationSuccess from './components/calendar-creation-success';
import CalendarCreationError from './components/calendar-creation-error';

// Step components
import Step1Lernzeitraum from './steps/step-1-lernzeitraum';
import Step2Puffertage from './steps/step-2-puffertage';
import Step3Urlaubstage from './steps/step-3-urlaubstage';
import Step4Tagesbloecke from './steps/step-4-tagesbloecke';
import Step5Wochenstruktur from './steps/step-5-wochenstruktur';
import Step6Erstellungsmethode from './steps/step-6-erstellungsmethode';
import Step7Automatic from './steps/step-7-automatic';
import Step7Template from './steps/step-7-template';
import Step7AI from './steps/step-7-ai';
import Step8Unterrechtsgebiete from './steps/step-8-unterrechtsgebiete';
import Step9Lerntage from './steps/step-9-lerntage';
import Step10Anpassungen from './steps/step-10-anpassungen';

// "Im Kalender erstellen" path (calendar) - Step 7 only
import Step7Calendar from './steps/step-8-calendar';

// "Als Liste erstellen" path (manual) - Steps 7-22
import Step7UrgMode from './steps/step-7-urg-mode';
import Step8RgSelect from './steps/step-8-rg-select';
import Step9UrgsEdit from './steps/step-9-urgs-edit';
import Step10UrgsSuccess from './steps/step-10-urgs-success';
import Step11ThemenIntro from './steps/step-11-themen-intro';
// PW-027: Using V2 with new sidebar layout
import Step12ThemenEdit from './steps/step-12-themen-edit-v2';
// Step 13 removed - skipped in wizard flow (see wizard-context.jsx)
import Step14Gewichtung from './steps/step-14-gewichtung';
import Step15Lernbloecke from './steps/step-15-lernbloecke';
// Steps 16-19 removed - block editing now happens in Step 15
import Step20Verteilungsmodus from './steps/step-20-verteilungsmodus';
import Step21KalenderVorschau from './steps/step-21-kalender-vorschau';
import Step22Bestaetigung from './steps/step-22-bestaetigung';

/**
 * WizardContent - Renders the current step based on wizard state
 */
const WizardContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isWizardAvailable } = useAppMode();
  const {
    currentStep,
    creationMethod,
    isLoading,
    error,
    completeWizard,
    discardAndExit,
    setError,
    startFresh,
    calendarCreationStatus,
    calendarCreationErrors,
    resetCalendarCreationStatus,
    goToStep,
    updateWizardData,
  } = useWizard();

  // T5.6 FIX: Redirect to /lernplan if wizard is not available (Normal mode)
  useEffect(() => {
    if (!isWizardAvailable) {
      navigate('/lernplan', { replace: true });
    }
  }, [isWizardAvailable, navigate]);

  // Check for fresh=true query parameter to start fresh
  useEffect(() => {
    if (searchParams.get('fresh') === 'true') {
      startFresh();
      // Remove the query parameter after starting fresh
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, startFresh]);

  // T5.6 FIX: Don't render wizard content if not available (after all hooks)
  if (!isWizardAvailable) {
    return null;
  }

  // Show calendar creation loading screen
  if (calendarCreationStatus === 'loading') {
    return <CalendarCreationLoading />;
  }

  // Show calendar creation success screen
  if (calendarCreationStatus === 'success') {
    return <CalendarCreationSuccess />;
  }

  // Show calendar creation error screen
  if (calendarCreationStatus === 'error') {
    // Handler to go back to method selection (step 6)
    const handleGoBackToMethodSelection = () => {
      resetCalendarCreationStatus();
      updateWizardData({ creationMethod: null }); // Reset method so user can choose again
      goToStep(6);
    };

    return (
      <CalendarCreationError
        problems={calendarCreationErrors}
        onRetry={resetCalendarCreationStatus}
        onCancel={discardAndExit}
        onGoBackToMethodSelection={handleGoBackToMethodSelection}
      />
    );
  }

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show error screen
  if (error) {
    // Handler to go back to method selection (step 6)
    const handleGoBackFromError = () => {
      setError(null);
      updateWizardData({ creationMethod: null });
      goToStep(6);
    };

    return (
      <ErrorScreen
        error={error}
        onRetry={() => {
          setError(null);
          completeWizard();
        }}
        onCancel={discardAndExit}
        onGoBackToMethodSelection={handleGoBackFromError}
      />
    );
  }

  // Render step based on current step and creation method
  const renderStep = () => {
    // "Im Kalender erstellen" (calendar) path - Step 7 only
    if (creationMethod === 'calendar') {
      switch (currentStep) {
        case 1:
          return <Step1Lernzeitraum />;
        case 2:
          return <Step2Puffertage />;
        case 3:
          return <Step3Urlaubstage />;
        case 4:
          return <Step4Tagesbloecke />;
        case 5:
          return <Step5Wochenstruktur />;
        case 6:
          return <Step6Erstellungsmethode />;
        case 7:
          return <Step7Calendar />;
        default:
          return <Step1Lernzeitraum />;
      }
    }

    // "Als Liste erstellen" (manual) path - Steps 7-22
    if (creationMethod === 'manual') {
      switch (currentStep) {
        case 1:
          return <Step1Lernzeitraum />;
        case 2:
          return <Step2Puffertage />;
        case 3:
          return <Step3Urlaubstage />;
        case 4:
          return <Step4Tagesbloecke />;
        case 5:
          return <Step5Wochenstruktur />;
        case 6:
          return <Step6Erstellungsmethode />;
        case 7:
          return <Step7UrgMode />;
        case 8:
          return <Step8RgSelect />;
        case 9:
          return <Step9UrgsEdit />;
        case 10:
          return <Step10UrgsSuccess />;
        case 11:
          return <Step11ThemenIntro />;
        case 12:
          return <Step12ThemenEdit />;
        // case 13 removed - step is skipped in wizard flow
        case 14:
          return <Step14Gewichtung />;
        case 15:
          return <Step15Lernbloecke />;
        // Steps 16-19 removed - block editing now consolidated in Step 15
        case 20:
          return <Step20Verteilungsmodus />;
        case 21:
          return <Step21KalenderVorschau />;
        case 22:
          return <Step22Bestaetigung />;
        default:
          return <Step1Lernzeitraum />;
      }
    }

    // Other paths (automatic, template, ai)
    switch (currentStep) {
      case 1:
        return <Step1Lernzeitraum />;
      case 2:
        return <Step2Puffertage />;
      case 3:
        return <Step3Urlaubstage />;
      case 4:
        return <Step4Tagesbloecke />;
      case 5:
        return <Step5Wochenstruktur />;
      case 6:
        return <Step6Erstellungsmethode />;
      case 7:
        // Different step 7 based on creation method
        switch (creationMethod) {
          case 'automatic':
            return <Step7Automatic />;
          case 'template':
            return <Step7Template />;
          case 'ai':
            return <Step7AI />;
          default:
            return <Step7Automatic />;
        }
      case 8:
        // For AI path, go directly to Anpassungen (AI generates the plan)
        if (creationMethod === 'ai') {
          return <Step10Anpassungen />;
        }
        // For template path, skip Unterrechtsgebiete and go directly to Lerntage
        if (creationMethod === 'template') {
          return <Step9Lerntage />;
        }
        return <Step8Unterrechtsgebiete />;
      case 9:
        // For AI path, this shouldn't be reached (total steps = 8)
        if (creationMethod === 'ai') {
          return <Step10Anpassungen />;
        }
        // For template path, show Anpassungen (since step 8 showed Lerntage)
        if (creationMethod === 'template') {
          return <Step10Anpassungen />;
        }
        return <Step9Lerntage />;
      case 10:
        return <Step10Anpassungen />;
      default:
        return <Step1Lernzeitraum />;
    }
  };

  return (
    <WizardLayout>
      {renderStep()}
    </WizardLayout>
  );
};

/**
 * LernplanWizardPage - Main wizard page with provider
 * Checks for ?fresh=true to clear draft before mounting
 */
const LernplanWizardPage = () => {
  // Clear draft before provider mounts if fresh=true
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('fresh') === 'true') {
    localStorage.removeItem('prepwell_lernplan_wizard_draft');
    // Remove query param from URL
    window.history.replaceState({}, '', window.location.pathname);
  }

  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
};

export default LernplanWizardPage;
