import React from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 7 - Manual Path: Instructions for manual calendar creation
 * User learns how to create their learning plan manually in the calendar
 * Based on Figma: Schritt_7_Alt_1
 */

/**
 * Calculate learning days from wizard state (inclusive of start and end)
 */
const calculateLearningDays = (startDate, endDate, bufferDays, vacationDays) => {
  if (!startDate || !endDate) return 0;
  // Parse dates in local time to avoid timezone issues
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  const diffTime = end - start;
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both dates
  return Math.max(0, totalDays - bufferDays - vacationDays);
};

/**
 * Instruction card component
 */
const InstructionCard = ({ title, description }) => (
  <div className="flex-1 p-6 bg-white rounded-[10px] outline outline-1 outline-offset-[-1px] outline-gray-200 flex flex-col justify-start items-start gap-10">
    <div className="self-stretch flex justify-start items-start gap-2">
      <div className="flex-1 flex flex-col justify-start items-start gap-2">
        <div className="self-stretch text-gray-900 text-lg font-light leading-5">
          {title}
        </div>
        <div className="self-stretch text-gray-500 text-sm font-light leading-5">
          {description}
        </div>
      </div>
    </div>
  </div>
);

const Step7Manual = () => {
  const { startDate, endDate, bufferDays, vacationDays } = useWizard();

  const learningDays = calculateLearningDays(startDate, endDate, bufferDays, vacationDays);

  const instructions = [
    {
      title: 'Rechtsgebiet & Thema angeben',
      description: 'Ein Lerntag ist dein standardmäßiger Tag, an dem du arbeitest. Was genau du an diesen Tagen lernst, bestimmt dein Lernplan, dazu kommen wir später.\n\nEs ist wichtig, dass PrepWell weiß, an welchen Tagen du routinemäßig arbeitest. So kannst du einfach tageweise Themen nach vorne oder hinten rücken.',
    },
    {
      title: 'Aufgaben hinzufügen',
      description: 'Klausurtage sind Tage, an denen du Übungsklausuren schreibst. Diese Tage werden kein Tagespensum aus dem Lernplan zugeordnet. Was du zusätzlich zur Klausur ggf. machst, kannst du in deinem Wochenplan frei festlegen.\n\nKlausurtage sind fest, werden also bei Veränderungen nicht mitverschoben.',
    },
    {
      title: 'Tage verschieben',
      description: 'Wir empfehlen mind. einen ganzen geplant freien Tag pro Woche einzulegen. Wenn dein Plan sich durch Veränderungen anpasst, bleiben freie Tage davon unberührt, sie sind ebenfalls fest.',
    },
  ];

  return (
    <div>
      <StepHeader
        step={7}
        title="So erstellst du deinen eigenen Lernplan."
        description="Wir bieten dir folgende Optionen, um deinen Lernplan zu erstellen oder auszuwählen."
      />

      <div className="space-y-8">
        {/* Learning days info box */}
        <div className="max-w-[520px] mx-auto p-4 bg-primary-50/50 rounded-lg flex flex-col justify-start items-start gap-4">
          <div className="self-stretch flex justify-between items-start">
            <div className="text-gray-900 text-sm font-medium leading-4">
              Anzahl der Lerntage
            </div>
            <div className="text-right text-gray-900 text-lg font-light leading-4">
              {learningDays} Tage
            </div>
          </div>
        </div>

        {/* Instruction cards - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          {instructions.map((instruction, index) => (
            <InstructionCard
              key={index}
              title={instruction.title}
              description={instruction.description}
            />
          ))}
        </div>

        {/* Info box */}
        <div className="max-w-[550px] mx-auto px-4 py-3 bg-blue-50 rounded-[10px] flex items-start gap-3">
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
            Im nächsten Schritt kannst du deinen Lernplan im Kalender erstellen. Du kannst jederzeit zum Wizard zurückkehren, um die Grundeinstellungen anzupassen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step7Manual;
