import React from 'react';
import { useAppMode } from '../../contexts/appmode-context';
import { GraduationCap, BookOpen } from 'lucide-react';

/**
 * SettingsContent component
 * Settings and preferences management
 *
 * Status: 🚧 Partially implemented - Lernmodus section active
 */
const SettingsContent = ({ className = '' }) => {
  const {
    isExamMode,
    isNormalMode,
    currentSemester,
    setSemester,
    modeDisplayText,
  } = useAppMode();

  const settingsSections = [
    {
      title: 'Profil',
      items: ['Name', 'E-Mail', 'Passwort', 'Profilbild']
    },
    {
      title: 'Benachrichtigungen',
      items: ['E-Mail Benachrichtigungen', 'Push Benachrichtigungen', 'Erinnerungen']
    },
    {
      title: 'Lerneinstellungen',
      items: ['Lernziele', 'Zeitplan', 'Pausen', 'Fortschritt']
    },
    {
      title: 'Darstellung',
      items: ['Design', 'Sprache', 'Zeitzone']
    }
  ];

  const semesters = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Lernmodus Section - Active */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Lernmodus</h3>

        <div className="space-y-4">
          {/* Current Mode Display */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {isExamMode ? (
                <GraduationCap className="w-5 h-5 text-red-500" />
              ) : (
                <BookOpen className="w-5 h-5 text-blue-500" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Aktueller Modus</p>
                <p className="text-xs text-gray-500 mt-1">{modeDisplayText}</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              isExamMode
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {isExamMode ? 'Examen' : 'Normal'}
            </span>
          </div>

          {/* Semester Selection (only in Normal Mode) */}
          {isNormalMode && (
            <div className="py-3">
              <p className="text-sm font-medium text-gray-900 mb-3">Semester auswählen</p>
              <div className="flex flex-wrap gap-2">
                {semesters.map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSemester(sem)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                      currentSemester === sem
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {sem}. Semester
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Exam Mode Info */}
          {isExamMode && (
            <div className="py-3 bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Du befindest dich im Examensmodus. Der Modus wird automatisch aktiviert,
                wenn ein aktiver Lernplan existiert.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Um in den normalen Modus zu wechseln, archiviere oder lösche alle aktiven Lernpläne.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Other Settings Sections (Placeholders) */}
      {settingsSections.map((section, idx) => (
        <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{section.title}</h3>

          <div className="space-y-4">
            {section.items.map((item, itemIdx) => (
              <div
                key={itemIdx}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item}</p>
                  <p className="text-xs text-gray-500 mt-1">Platzhalter für {item}-Einstellung</p>
                </div>
                <button className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Bearbeiten
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4">
        <button className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
          Abbrechen
        </button>
        <button className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors">
          Änderungen speichern
        </button>
      </div>

      {/* Placeholder message */}
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Detaillierte Einstellungen werden aus Figma implementiert</p>
        <p className="text-xs mt-2">Formulare, Toggles, Dropdowns, Validierung, etc.</p>
      </div>
    </div>
  );
};

export default SettingsContent;
