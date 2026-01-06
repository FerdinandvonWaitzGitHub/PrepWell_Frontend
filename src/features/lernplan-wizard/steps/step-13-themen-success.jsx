import { useWizard } from '../context/wizard-context';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * Step 13: Themen Success/Error Screen
 * Shows success message if themes were configured correctly,
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
 * Step 13 Component
 */
const Step13ThemenSuccess = () => {
  const { unterrechtsgebieteDraft, themenDraft } = useWizard();

  // Validate themes - check for potential problems
  const problems = [];

  // Check if any URG has no themes (optional warning)
  Object.values(unterrechtsgebieteDraft).flat().forEach(urg => {
    const themen = themenDraft[urg.id] || [];
    if (themen.length === 0) {
      // This is just a warning, not blocking
      // problems.push(`Keine Themen für ${urg.name} definiert.`);
    }
  });

  const hasProblems = problems.length > 0;

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
          ? 'Achtung, beim Übernehmen deiner Themen & Aufgaben sind Probleme aufgetreten.'
          : 'Deine Themen & Aufgaben wurden erfolgreich in deinen Lernplan übernommen.'}
      </h2>

      {/* Problems list if any */}
      {hasProblems && (
        <div className="w-full max-w-md mt-6">
          <ProblemAlert problems={problems} />
        </div>
      )}

      {/* Success details */}
      {!hasProblems && (
        <p className="text-neutral-600 text-center">
          Du kannst nun mit der Zielgewichtung der Rechtsgebiete fortfahren.
        </p>
      )}
    </div>
  );
};

export default Step13ThemenSuccess;
