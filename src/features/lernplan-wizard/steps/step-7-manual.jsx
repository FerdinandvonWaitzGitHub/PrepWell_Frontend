import React from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 7 - Manual Path: Instructions for manual creation
 * User learns how to create their learning plan manually in the calendar
 * Based on Figma: Schritt_7_Alt_1_body
 */
const Step7Manual = () => {
  const steps = [
    {
      number: 1,
      title: 'Öffne den Kalender',
      description: 'Nach Abschluss des Wizards wirst du automatisch zum Kalender weitergeleitet.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      number: 2,
      title: 'Klicke auf einen Tag',
      description: 'Wähle einen Tag aus, um Lernblöcke hinzuzufügen oder zu bearbeiten.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Füge Themen hinzu',
      description: 'Wähle aus deinen Themen und ordne sie den Blöcken zu. Du kannst auch Wiederholungen und Klausuren planen.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <StepHeader
        step={7}
        title="So erstellst du deinen eigenen Lernplan."
        description="Im nächsten Schritt wirst du zum Kalender weitergeleitet, wo du deinen Lernplan manuell erstellen kannst."
      />

      <div className="space-y-6">
        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {step.number}. {step.title}
                </h4>
                <p className="text-sm text-gray-500">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Preview illustration */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-8 border border-primary-200">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary-600">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Bereit zum Erstellen
            </h4>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Klicke auf "Weiter", um zum Kalender zu gelangen und deinen Lernplan zu erstellen.
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-600 flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-sm text-blue-700">
            Du kannst jederzeit zum Wizard zurückkehren, um die Grundeinstellungen anzupassen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step7Manual;
