import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding, ONBOARDING_STEPS } from '../contexts/onboarding-context';
import { useAppMode } from '../contexts/appmode-context';
import { useStudiengang } from '../contexts/studiengang-context';
import { BookOpen, Calendar, Target, ArrowRight, Check } from 'lucide-react';

/**
 * OnboardingPage - Erstnutzer-Einführung
 *
 * Figma Canvas: Onboarding
 * Steps:
 * 1. Welcome Screen
 * 2. Mode Selection (Exam/Normal)
 * 3. Feature Tour
 */

// Step 1: Welcome Screen
const WelcomeStep = ({ onNext, onSkip }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-primary-200 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-neutral-900" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extralight text-neutral-900 mb-4">
          Willkommen bei PrepWell
        </h1>

        {/* Description */}
        <p className="text-neutral-500 text-lg mb-8">
          Deine Lernmanagement-App für die optimale Vorbereitung auf das Staatsexamen.
        </p>

        {/* Features List */}
        <div className="text-left space-y-4 mb-10">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="w-4 h-4 text-neutral-700" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">Strukturierte Lernpläne</p>
              <p className="text-sm text-neutral-500">Erstelle individuelle Lernpläne, die zu deinem Zeitplan passen.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Target className="w-4 h-4 text-neutral-700" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">Fortschritt tracken</p>
              <p className="text-sm text-neutral-500">Behalte den Überblick über deine Lernfortschritte und Ziele.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-neutral-700" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">Mentor-System</p>
              <p className="text-sm text-neutral-500">Tägliche Check-ins und personalisierte Empfehlungen.</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={onNext}
          className="w-full bg-neutral-900 text-white py-3.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
        >
          Los geht&apos;s
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={onSkip}
          className="w-full mt-3 text-neutral-500 py-2 text-sm hover:text-neutral-700 transition-colors"
        >
          Überspringen
        </button>
      </div>
    </div>
  );
};

// Step 2: Semester Selection (Normal mode only - exam mode disabled)
const ModeSelectionStep = ({ onNext, onBack, setSelectedMode }) => {
  const { setSemester } = useAppMode();
  const [semester, setSemesterLocal] = React.useState(3);

  // Auto-select normal mode
  React.useEffect(() => {
    setSelectedMode('normal');
  }, [setSelectedMode]);

  const handleContinue = () => {
    setSemester(semester);
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
      <div className="max-w-lg w-full">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 text-neutral-500 hover:text-neutral-700 transition-colors flex items-center gap-1"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Zurück
        </button>

        {/* Title */}
        <h1 className="text-3xl font-extralight text-neutral-900 mb-2">
          In welchem Semester bist du?
        </h1>
        <p className="text-neutral-500 mb-8">
          Wähle dein aktuelles Semester aus.
        </p>

        {/* Semester Selection */}
        <div className="bg-neutral-50 rounded-xl p-6 mb-8">
          <div className="flex gap-2 flex-wrap justify-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
              <button
                key={sem}
                onClick={() => setSemesterLocal(sem)}
                className={`w-12 h-12 rounded-lg text-sm font-medium transition-colors ${
                  semester === sem
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                }`}
              >
                {sem}
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-neutral-500 mt-4">
            {semester}. Semester ausgewählt
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
        >
          Weiter
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Step 3: Feature Tour
const FeatureTourStep = ({ onComplete, onBack }) => {
  const navigate = useNavigate();
  const { hasStudiengang } = useStudiengang();

  // Helper: Navigate to settings if no studiengang, otherwise to target
  const navigateWithStudiengangCheck = (targetPath) => {
    onComplete();
    if (!hasStudiengang) {
      // Redirect to settings with hint to select studiengang first
      navigate('/einstellungen?setup=studiengang');
    } else {
      navigate(targetPath);
    }
  };

  const handleStartLernplan = () => {
    navigateWithStudiengangCheck('/lernplan/erstellen');
  };

  const handleGoToDashboard = () => {
    navigateWithStudiengangCheck('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
      <div className="max-w-lg w-full">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 text-neutral-500 hover:text-neutral-700 transition-colors flex items-center gap-1"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Zurück
        </button>

        {/* Title */}
        <h1 className="text-3xl font-extralight text-neutral-900 mb-2">
          Du bist bereit!
        </h1>
        <p className="text-neutral-500 mb-8">
          Wie möchtest du starten?
        </p>

        {/* Action Cards */}
        <div className="space-y-4">
          {/* Create Lernplan */}
          <button
            onClick={handleStartLernplan}
            className="w-full p-5 rounded-xl border-2 border-neutral-900 bg-neutral-900 text-left transition-all hover:bg-neutral-800"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-0.5">Lernplan erstellen</h3>
                <p className="text-sm text-white/70">
                  Starte mit dem Wizard und erstelle deinen ersten Lernplan.
                </p>
              </div>
            </div>
          </button>

          {/* Go to Dashboard */}
          <button
            onClick={handleGoToDashboard}
            className="w-full p-5 rounded-xl border-2 border-neutral-200 text-left transition-all hover:border-neutral-300 hover:bg-neutral-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-neutral-700" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-900 mb-0.5">Erstmal umsehen</h3>
                <p className="text-sm text-neutral-500">
                  Erkunde die App und starte später mit dem Lernplan.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-10">
          <div className="w-2 h-2 rounded-full bg-neutral-300" />
          <div className="w-2 h-2 rounded-full bg-neutral-300" />
          <div className="w-2 h-2 rounded-full bg-neutral-900" />
        </div>
      </div>
    </div>
  );
};

/**
 * Main Onboarding Page Component
 * BUG-017 FIX: Prevent showing already-seen steps and handle completed state properly
 */
const OnboardingPage = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    nextStep,
    prevStep,
    completeOnboarding,
    skipOnboarding,
    selectedMode,
    setSelectedMode,
    isCompleted,
  } = useOnboarding();

  // BUG-017 FIX: Redirect immediately if onboarding is completed - using useLayoutEffect-like behavior
  useEffect(() => {
    if (isCompleted) {
      navigate('/', { replace: true });
    }
  }, [isCompleted, navigate]);

  const handleSkip = () => {
    skipOnboarding();
    navigate('/', { replace: true });
  };

  // BUG-017 FIX: Don't render anything if onboarding is completed (prevents flash of content)
  if (isCompleted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-neutral-500">Weiterleitung...</div>
      </div>
    );
  }

  switch (currentStep) {
    case ONBOARDING_STEPS.WELCOME:
      return <WelcomeStep onNext={nextStep} onSkip={handleSkip} />;

    case ONBOARDING_STEPS.MODE_SELECTION:
      return (
        <ModeSelectionStep
          onNext={nextStep}
          onBack={prevStep}
          setSelectedMode={setSelectedMode}
        />
      );

    case ONBOARDING_STEPS.FEATURE_TOUR:
    case ONBOARDING_STEPS.COMPLETE:
      return <FeatureTourStep onComplete={completeOnboarding} onBack={prevStep} />;

    default:
      return <WelcomeStep onNext={nextStep} onSkip={handleSkip} />;
  }
};

export default OnboardingPage;
