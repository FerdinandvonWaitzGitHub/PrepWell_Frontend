import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui';

/**
 * SuccessScreen - Shown after successful creation
 * Based on Figma: Success_Screen
 */
const SuccessScreen = ({ returnPath = '/lernplan' }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        {/* Success icon */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-green-600"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Lernplan erfolgreich erstellt!
        </h2>

        {/* Description */}
        <p className="text-gray-500 mb-8">
          Dein personalisierter Lernplan wurde erstellt und ist jetzt in deinem Kalender verfügbar.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/kalender/monat')}
            className="w-full"
          >
            Zum Kalender
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(returnPath)}
            className="w-full"
          >
            Zur Übersicht
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
