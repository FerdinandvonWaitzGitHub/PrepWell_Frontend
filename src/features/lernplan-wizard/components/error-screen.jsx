import React from 'react';
import { Button } from '../../../components/ui';

/**
 * ErrorScreen - Shown when creation fails
 * Based on Figma: Error_Screen
 */
const ErrorScreen = ({ error, onRetry, onCancel, onGoBackToMethodSelection }) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        {/* Error icon */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-red-600"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
          Etwas ist schiefgelaufen
        </h2>

        {/* Description */}
        <p className="text-neutral-500 mb-2">
          Bei der Erstellung deines Lernplans ist ein Fehler aufgetreten.
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Troubleshooting hints */}
        <div className="bg-neutral-50 rounded-xl p-4 mb-8 text-left">
          <h4 className="text-sm font-semibold text-neutral-900 mb-2">
            Mögliche Lösungen:
          </h4>
          <ul className="text-sm text-neutral-600 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-neutral-400">•</span>
              Überprüfe deine Internetverbindung
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-400">•</span>
              Versuche es in einigen Minuten erneut
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-400">•</span>
              Wähle eine andere Erstellungsmethode (z.B. manuell)
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={onRetry} className="w-full">
            Erneut versuchen
          </Button>
          {onGoBackToMethodSelection && (
            <Button variant="secondary" onClick={onGoBackToMethodSelection} className="w-full">
              Andere Methode wählen
            </Button>
          )}
          <Button variant="outline" onClick={onCancel} className="w-full">
            Abbrechen
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorScreen;
