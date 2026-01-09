import { useState } from 'react';

/**
 * RuleViolationDialog - Dialog for handling rule violations when saving Lernplan changes
 *
 * Shows violations and offers options:
 * - "Neu sortieren" - Redistribute blocks to fix violations
 * - "Ignorieren" - Save anyway without fixing
 * - "Abbrechen" - Cancel the save operation
 */
const RuleViolationDialog = ({
  isOpen,
  violations = [],
  onRedistribute,
  onIgnore,
  onCancel,
}) => {
  const [isRedistributing, setIsRedistributing] = useState(false);

  if (!isOpen) return null;

  const handleRedistribute = async () => {
    setIsRedistributing(true);
    try {
      await onRedistribute?.();
    } finally {
      setIsRedistributing(false);
    }
  };

  // Group violations by type
  const gewichtungViolations = violations.filter(v => v.type === 'gewichtung');
  const modusViolations = violations.filter(v => v.type === 'verteilungsmodus');

  // Determine severity (worst case)
  const hasErrors = violations.some(v => v.severity === 'error');
  const hasWarnings = violations.some(v => v.severity === 'warning');

  const severityColors = {
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' },
  };

  const mainSeverity = hasErrors ? 'error' : hasWarnings ? 'warning' : 'info';
  const colors = severityColors[mainSeverity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-4 ${colors.bg} border-b ${colors.border}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${colors.bg}`}>
              {mainSeverity === 'error' ? (
                <ErrorIcon className={colors.icon} />
              ) : mainSeverity === 'warning' ? (
                <WarningIcon className={colors.icon} />
              ) : (
                <InfoIcon className={colors.icon} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Regelbrüche erkannt
              </h3>
              <p className="text-sm text-neutral-600">
                {violations.length === 1
                  ? '1 Regelbruch gefunden'
                  : `${violations.length} Regelbrüche gefunden`}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 max-h-[60vh] overflow-auto">
          {/* Gewichtung Violations */}
          {gewichtungViolations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                <ScaleIcon className="w-4 h-4 text-neutral-400" />
                Zielgewichtung
              </h4>
              <div className="space-y-2">
                {gewichtungViolations.map((v, i) => (
                  <ViolationItem key={i} violation={v} />
                ))}
              </div>
            </div>
          )}

          {/* Modus Violations */}
          {modusViolations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                <LayoutIcon className="w-4 h-4 text-neutral-400" />
                Verteilungsmodus
              </h4>
              <div className="space-y-2">
                {modusViolations.map((v, i) => (
                  <ViolationItem key={i} violation={v} />
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
            <p className="text-xs text-neutral-600 leading-relaxed">
              <strong>Neu sortieren:</strong> Blöcke werden ab heute nach den Regeln neu verteilt.
              Vergangene und abgeschlossene Blöcke bleiben unverändert.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onIgnore}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors"
          >
            Ignorieren
          </button>
          <button
            onClick={handleRedistribute}
            disabled={isRedistributing}
            className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isRedistributing ? (
              <>
                <LoadingSpinner />
                Sortiere...
              </>
            ) : (
              <>
                <RefreshIcon className="w-4 h-4" />
                Neu sortieren
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * ViolationItem - Single violation display
 */
const ViolationItem = ({ violation }) => {
  const severityColors = {
    error: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const colorClass = severityColors[violation.severity] || severityColors.info;

  return (
    <div className={`px-3 py-2 rounded-lg border ${colorClass}`}>
      <p className="text-sm">{violation.message}</p>
      {violation.deviation && (
        <p className="text-xs mt-1 opacity-75">
          Abweichung: {violation.deviation > 0 ? '+' : ''}{violation.deviation} Blöcke
        </p>
      )}
      {violation.days && (
        <p className="text-xs mt-1 opacity-75">
          Betroffene Tage: {violation.days.length}
        </p>
      )}
    </div>
  );
};

// Icons
const ErrorIcon = ({ className }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const WarningIcon = ({ className }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon = ({ className }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ScaleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v18m-9-9l9-9 9 9" />
    <path d="M3 12a9 9 0 0 0 9 9 9 9 0 0 0 9-9" />
  </svg>
);

const LayoutIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default RuleViolationDialog;
