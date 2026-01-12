import { useState } from 'react';
import MentorActivationDialog from './mentor-activation-dialog';

/**
 * MentorNotActivated - Display when mentor feature is not yet activated
 *
 * Minimalist design matching Figma specs.
 */
const MentorNotActivated = ({ className = '' }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className={`flex flex-col items-center justify-center min-h-[70vh] ${className}`}>
      {/* Brain Icon */}
      <div className="mb-6">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-800"
        >
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
        </svg>
      </div>

      {/* Title */}
      <h2 className="text-xl font-medium text-neutral-900 mb-4 text-center">
        Mentor aktivieren
      </h2>

      {/* Description */}
      <p className="text-neutral-500 text-center max-w-sm mb-8 leading-relaxed">
        Möchtest du die Zeiterfassungsfunktionen, tägliche Morgen- und Abend-Check-ins sowie Analysetools nutzen, dann aktiviere den Mentor.
      </p>

      {/* CTA Button */}
      <button
        onClick={() => setIsDialogOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-neutral-900 bg-white border border-neutral-300 rounded-full hover:bg-neutral-50 transition-colors"
      >
        Jetzt Mentor aktivieren
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </button>

      {/* Activation Dialog */}
      <MentorActivationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default MentorNotActivated;
