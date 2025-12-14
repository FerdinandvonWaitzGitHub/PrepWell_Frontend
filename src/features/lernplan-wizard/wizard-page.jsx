import React from 'react';
import { useWizard, WizardProvider } from './context/wizard-context';
import WizardLayout from './components/wizard-layout';
import LoadingScreen from './components/loading-screen';
import ErrorScreen from './components/error-screen';

// Step components
import Step1Lernzeitraum from './steps/step-1-lernzeitraum';
import Step2Puffertage from './steps/step-2-puffertage';
import Step3Urlaubstage from './steps/step-3-urlaubstage';
import Step4Tagesbloecke from './steps/step-4-tagesbloecke';
import Step5Wochenstruktur from './steps/step-5-wochenstruktur';
import Step6Erstellungsmethode from './steps/step-6-erstellungsmethode';
import Step7Manual from './steps/step-7-manual';
import Step7Automatic from './steps/step-7-automatic';
import Step7Template from './steps/step-7-template';
import Step8Unterrechtsgebiete from './steps/step-8-unterrechtsgebiete';
import Step9Lerntage from './steps/step-9-lerntage';
import Step10Anpassungen from './steps/step-10-anpassungen';

/**
 * WizardContent - Renders the current step based on wizard state
 */
const WizardContent = () => {
  const {
    currentStep,
    creationMethod,
    isLoading,
    error,
    completeWizard,
    discardAndExit,
    setError,
  } = useWizard();

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show error screen
  if (error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={() => {
          setError(null);
          completeWizard();
        }}
        onCancel={discardAndExit}
      />
    );
  }

  // Render step based on current step and creation method
  const renderStep = () => {
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
          case 'manual':
            return <Step7Manual />;
          case 'automatic':
            return <Step7Automatic />;
          case 'template':
            return <Step7Template />;
          default:
            return <Step7Automatic />;
        }
      case 8:
        // For manual path, skip to step 10
        if (creationMethod === 'manual') {
          return <Step10Anpassungen />;
        }
        return <Step8Unterrechtsgebiete />;
      case 9:
        // For manual path, this would be reached via goToStep
        if (creationMethod === 'manual') {
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
 */
const LernplanWizardPage = () => {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
};

export default LernplanWizardPage;
