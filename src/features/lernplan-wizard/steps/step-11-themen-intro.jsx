import { Info } from 'lucide-react';

/**
 * Step 11: Themen & Aufgaben Intro
 * Info screen explaining the next step where users add themes and tasks.
 */

const Step11ThemenIntro = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Icon */}
      <div className="mb-6 p-4 rounded-full bg-primary-100">
        <Info className="w-12 h-12 text-primary-600" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-neutral-900 text-center mb-4">
        Hinzufügen von Themen & Aufgaben
      </h2>

      {/* Description */}
      <p className="text-neutral-600 text-center max-w-lg">
        Im nächsten Schritt kannst du deinen Unterrechtsgebieten Themen & Aufgaben hinzufügen.
        So strukturierst du deinen Lernplan und behältst den Überblick über alle
        wichtigen Inhalte, die du für dein Examen vorbereiten musst.
      </p>
    </div>
  );
};

export default Step11ThemenIntro;
