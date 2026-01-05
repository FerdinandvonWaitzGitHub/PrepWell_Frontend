/**
 * CalendarCreationError - Shown when there are problems with the learning plan
 * Based on Figma: Error screen with warning icon and problem list
 */

const WarningIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
  >
    <circle
      cx="24"
      cy="24"
      r="20"
      stroke="currentColor"
      strokeWidth="2"
      className="text-neutral-900"
    />
    <line
      x1="24"
      y1="16"
      x2="24"
      y2="26"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="text-neutral-900"
    />
    <circle
      cx="24"
      cy="32"
      r="1.5"
      fill="currentColor"
      className="text-neutral-900"
    />
  </svg>
);

const AlertIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    className="flex-shrink-0"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-red-500"
    />
    <line
      x1="12"
      y1="8"
      x2="12"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="text-red-500"
    />
    <circle
      cx="12"
      cy="16"
      r="0.5"
      fill="currentColor"
      className="text-red-500"
    />
  </svg>
);

const CalendarCreationError = ({ problems = [], onRetry, onCancel, onGoBackToMethodSelection }) => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center items-center gap-5 px-12">
      {/* Warning Icon */}
      <div className="flex justify-center items-center">
        <div className="w-12 h-12 relative">
          <WarningIcon />
        </div>
      </div>

      {/* Title */}
      <div className="max-w-[1000px] py-2.5 flex flex-col items-center">
        <h1 className="text-center text-neutral-900 text-5xl font-extralight leading-[48px]">
          Achtung! Bei deinem Lernplan haben wir folgende Probleme festgestellt.
        </h1>
      </div>

      {/* Problem Box */}
      <div className="max-w-[700px] w-full px-4 py-3 bg-white rounded-[10px] border border-red-100 flex items-start gap-3">
        <div className="pt-0.5">
          <AlertIcon />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-red-500 text-sm font-medium leading-5">
            Probleme
          </h4>
          <div className="text-red-500 text-sm font-normal leading-5">
            {problems.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {problems.map((problem, index) => (
                  <li key={index}>{problem}</li>
                ))}
              </ul>
            ) : (
              <p>Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.</p>
            )}
          </div>
        </div>
      </div>

      {/* Hint for method selection */}
      {onGoBackToMethodSelection && (
        <p className="text-sm text-neutral-500 max-w-[500px] text-center">
          Du kannst eine andere Erstellungsmethode wählen, z.B. den manuellen Modus.
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            Abbrechen
          </button>
        )}
        {onGoBackToMethodSelection && (
          <button
            onClick={onGoBackToMethodSelection}
            className="px-6 py-2.5 rounded-lg border border-primary-300 text-primary-600 text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            Andere Methode wählen
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            Erneut versuchen
          </button>
        )}
      </div>
    </div>
  );
};

export default CalendarCreationError;
