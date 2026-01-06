import { useWizard } from '../context/wizard-context';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { RECHTSGEBIET_LABELS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 10: URGs Success/Error Screen
 * Shows success message if URGs were configured correctly,
 * or error messages if there are problems.
 */

/**
 * Problem Alert Component
 */
const ProblemAlert = ({ problems }) => {
  return (
    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-red-900">Probleme</h4>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
            {problems.map((problem, index) => (
              <li key={index}>{problem}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * Step 10 Component
 * Shows success for the CURRENT Rechtsgebiet being edited in the loop
 */
const Step10UrgsSuccess = () => {
  const { selectedRechtsgebiete, unterrechtsgebieteDraft, currentRechtsgebietIndex, completedRgUrgs } = useWizard();

  // Get the current RG being edited (the one that was just completed)
  const currentRgId = selectedRechtsgebiete[currentRechtsgebietIndex];
  const currentUrgs = unterrechtsgebieteDraft[currentRgId] || [];

  // Only validate the CURRENT Rechtsgebiet, not all of them
  const problems = [];
  if (currentUrgs.length === 0) {
    problems.push(`Keine Kapitel für dieses Fach definiert.`);
  }

  const hasProblems = problems.length > 0;

  // Count progress
  const completedCount = completedRgUrgs?.length || 0;
  const totalCount = selectedRechtsgebiete.length;
  const remainingCount = totalCount - completedCount - 1; // -1 for current

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Icon */}
      <div className={`mb-6 p-4 rounded-full ${hasProblems ? 'bg-red-100' : 'bg-green-100'}`}>
        {hasProblems ? (
          <AlertTriangle className="w-12 h-12 text-red-600" />
        ) : (
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        )}
      </div>

      {/* Message */}
      <h2 className="text-xl font-semibold text-neutral-900 text-center mb-4">
        {hasProblems
          ? 'Achtung, beim Übernehmen der Kapitel sind Probleme aufgetreten.'
          : `Kapitel für ${RECHTSGEBIET_LABELS[currentRgId] || currentRgId} übernommen!`}
      </h2>

      {/* Problems list if any */}
      {hasProblems && (
        <div className="w-full max-w-md mt-6">
          <ProblemAlert problems={problems} />
        </div>
      )}

      {/* Success details */}
      {!hasProblems && (
        <div className="text-center">
          <p className="text-neutral-600 mb-4">
            {currentUrgs.length} Kapitel wurden hinzugefügt.
          </p>
          {remainingCount > 0 && (
            <p className="text-sm text-neutral-500">
              Noch {remainingCount} {remainingCount === 1 ? 'Fach' : 'Fächer'} zu konfigurieren.
            </p>
          )}
          {remainingCount === 0 && (
            <p className="text-sm text-green-600 font-medium">
              Alle Fächer sind konfiguriert! Weiter zu den Themen.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Step10UrgsSuccess;
