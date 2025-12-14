import React from 'react';

/**
 * LoadingScreen - Shown while creating the learning plan
 * Based on Figma: Loading_Screen
 */
const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        {/* Spinner */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Dein Lernplan wird erstellt...
        </h2>

        {/* Description */}
        <p className="text-gray-500">
          Wir generieren deinen personalisierten Lernplan basierend auf deinen Einstellungen.
          Dies kann einen Moment dauern.
        </p>

        {/* Progress steps */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3 text-left">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">Einstellungen übernommen</span>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">Struktur erstellt</span>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="w-5 h-5 rounded-full border-2 border-primary-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            </div>
            <span className="text-sm text-gray-900 font-medium">Kalender wird befüllt...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
