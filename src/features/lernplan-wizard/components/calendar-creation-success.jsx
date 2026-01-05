import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizard } from '../context/wizard-context';

/**
 * CalendarCreationSuccess - Shown when the calendar learning plan was created successfully
 * Based on Figma: Success screen with checkmark icon
 * Auto-redirects to calendar after countdown
 */

const CheckmarkIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
  >
    <polyline
      points="12 24 20 32 36 16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-neutral-900"
    />
  </svg>
);

const CalendarCreationSuccess = () => {
  const navigate = useNavigate();
  const { wizardState, resetCalendarCreationStatus } = useWizard();
  const [countdown, setCountdown] = useState(3);

  // Navigate to calendar with the lernplan start date
  const navigateToCalendar = () => {
    const startDate = wizardState?.startDate;
    const url = startDate
      ? `/kalender/monat?date=${startDate}`
      : '/kalender/monat';

    // Reset calendar creation status before navigating
    resetCalendarCreationStatus?.();
    navigate(url);
  };

  // Auto-redirect after countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigateToCalendar();
    }
  }, [countdown]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center items-center gap-8 px-12">
      {/* Success Icon */}
      <div className="flex justify-center items-center">
        <div className="w-12 h-12 relative">
          <CheckmarkIcon />
        </div>
      </div>

      {/* Text */}
      <div className="w-full flex flex-col items-center gap-4">
        <h1 className="text-center text-neutral-900 text-5xl font-extralight leading-[48px]">
          Dein Lernplan wurde erfolgreich erstellt!
        </h1>
        <p className="text-center text-neutral-500 text-lg font-light">
          Du wirst in {countdown} Sekunde{countdown !== 1 ? 'n' : ''} zum Kalender weitergeleitet...
        </p>
      </div>

      {/* Manual navigation button */}
      <button
        onClick={navigateToCalendar}
        className="px-6 py-3 bg-slate-600 text-white rounded-3xl text-sm font-light hover:bg-slate-700 transition-colors"
      >
        Jetzt zum Kalender
      </button>
    </div>
  );
};

export default CalendarCreationSuccess;
