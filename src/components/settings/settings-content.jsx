import React from 'react';

/**
 * SettingsContent component
 * Settings and preferences management
 *
 * Status: 🚧 Placeholder - to be implemented from Figma
 */
const SettingsContent = ({ className = '' }) => {
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

  return (
    <div className={`space-y-6 ${className}`}>
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
