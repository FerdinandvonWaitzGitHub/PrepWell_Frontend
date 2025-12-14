import React from 'react';
import { useWizard } from '../context/wizard-context';
import { Button } from '../../../components/ui';
import { Dialog } from '../../../components/ui';

/**
 * ExitDialog - Confirmation dialog when user tries to cancel wizard
 * Options: Save and exit, Discard and exit, Continue editing
 */
const ExitDialog = ({ open }) => {
  const { setShowExitDialog, saveAndExit, discardAndExit } = useWizard();

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setShowExitDialog}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setShowExitDialog(false)}
        />

        {/* Dialog content */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-amber-600"
            >
              <path d="M12 9v4" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
              <path d="M12 2L2 20h20L12 2z" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Lernplan-Erstellung beenden?
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-500 text-center mb-6">
            Möchtest du deinen Fortschritt speichern, um später weiterzumachen,
            oder die Eingaben verwerfen?
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button onClick={saveAndExit} className="w-full">
              Speichern & Beenden
            </Button>

            <Button
              variant="outline"
              onClick={discardAndExit}
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              Verwerfen & Beenden
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowExitDialog(false)}
              className="w-full"
            >
              Weiter bearbeiten
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ExitDialog;
