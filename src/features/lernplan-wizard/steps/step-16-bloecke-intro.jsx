import { Layers } from 'lucide-react';

/**
 * Step 16: Blöcke Intro
 * Info screen explaining that users need to create learning blocks
 * and assign themes to them.
 */

const Step16BloeckeIntro = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Icon */}
      <div className="mb-6 p-4 rounded-full bg-primary-100">
        <Layers className="w-12 h-12 text-primary-600" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-neutral-900 text-center mb-4">
        Einteilung der Themen in Blöcke
      </h2>

      {/* Description */}
      <p className="text-neutral-600 text-center max-w-lg leading-relaxed">
        Dein Lernplan ist derzeit eine Ansammlung von Unterrechtsgebieten, Themen und Aufgaben
        in Form einer Liste. Damit du deine Lerninhalte sinnvoll in deine Wochenstrukturen
        einsortieren kannst, musst du Lernblöcke in passender Länge erstellen und darin
        Themen unterbringen. Möchtest du ein Thema auf mehrere Blöcke aufteilen, kannst
        du es einfach per Mausklick aufteilen.
      </p>
    </div>
  );
};

export default Step16BloeckeIntro;
