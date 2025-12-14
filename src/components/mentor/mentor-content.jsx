import React from 'react';

/**
 * MentorContent component
 * AI Mentor dashboard with scores, statistics, and check-in functionality
 *
 * Status: 🚧 Placeholder - to be implemented from Figma
 */
const MentorContent = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Stats Row - PrepScore, WellScore, Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PrepScore Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">PrepScore</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">--</div>
          <p className="text-xs text-gray-500">Platzhalter für PrepScore-Berechnung</p>
        </div>

        {/* WellScore Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">WellScore</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">--</div>
          <p className="text-xs text-gray-500">Platzhalter für WellScore-Berechnung</p>
        </div>

        {/* Streaks Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Streaks & Jahresübersicht</h3>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2">
            Übersicht öffnen →
          </button>
          <p className="text-xs text-gray-500 mt-2">Platzhalter für Streaks-Daten</p>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Statistics Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ausgewählte Statistiken</h3>

          {/* Chart Placeholder */}
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Diagramm</p>
              <p className="text-xs text-gray-400">Platzhalter für Statistik-Diagramm</p>
            </div>
          </div>
        </div>

        {/* Right Column - Learning Period Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lernzeitraum bestimmen</h3>

          {/* Stats Grid */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded p-4">
              <p className="text-sm text-gray-500 mb-2">Durchschnittliche Lernzeit pro Woche</p>
              <p className="text-2xl font-semibold text-gray-900">35h 20min</p>
            </div>

            <div className="border border-gray-200 rounded p-4">
              <p className="text-sm text-gray-500 mb-2">Durchschnittliche Lernzeit pro Woche</p>
              <p className="text-2xl font-semibold text-gray-900">35h 20min</p>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              <p>Platzhalter für weitere Lernzeitraum-Statistiken</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Mentor Interaction Area */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI Mentor Chat</h3>
        <div className="bg-gray-50 rounded p-4 mb-4 min-h-[200px] flex items-center justify-center">
          <p className="text-sm text-gray-500">Platzhalter für AI Mentor Chat-Interface</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Frage den Mentor..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          />
          <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" disabled>
            Senden
          </button>
        </div>
      </div>

      {/* Placeholder message */}
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Detaillierte Mentor-Funktionen werden aus Figma implementiert</p>
        <p className="text-xs mt-2">Score-Berechnungen, Diagramme, Chat-Interface, Check-In-Logik, etc.</p>
      </div>
    </div>
  );
};

export default MentorContent;
