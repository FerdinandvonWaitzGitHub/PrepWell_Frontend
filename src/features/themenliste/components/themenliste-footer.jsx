import { Archive, X, Check, Loader2 } from 'lucide-react';

/**
 * ThemenlisteFooter - Footer with Archive, Cancel, Save, and auto-save status
 * T27: Updated to match Figma design (texts, colors)
 */
const ThemenlisteFooter = ({
  onArchive,
  onCancel,
  onFinish,
  autoSaveStatus, // 'saved' | 'saving' | 'error'
  canFinish = true, // T23: Disable finish if validation fails
}) => {
  return (
    <div className="px-6 py-4 bg-white border-t border-neutral-200 flex items-center justify-between">
      {/* Left: Archive Button - T27: "Lernplan archivieren" */}
      <button
        onClick={onArchive}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-light text-neutral-950 hover:bg-neutral-100 rounded-full border border-neutral-200 transition-colors"
      >
        <span>Lernplan archivieren</span>
        <Archive size={16} />
      </button>

      {/* Right: Cancel + Save Status + Save */}
      <div className="flex items-center gap-2">
        {/* Auto-Save Status - T27: Beibehalten für UX */}
        <div className="flex items-center gap-1.5 text-sm mr-2">
          {autoSaveStatus === 'saving' && (
            <>
              <Loader2 size={14} className="animate-spin text-neutral-400" />
              <span className="text-neutral-400">Speichern...</span>
            </>
          )}
          {autoSaveStatus === 'saved' && (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-neutral-400">Gespeichert</span>
            </>
          )}
          {autoSaveStatus === 'error' && (
            <>
              <X size={14} className="text-red-500" />
              <span className="text-red-500">Fehler beim Speichern</span>
            </>
          )}
        </div>

        {/* Cancel Button - T27: font-light, rounded-full */}
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-light text-neutral-950 hover:bg-neutral-100 rounded-full border border-neutral-200 transition-colors"
        >
          Abbrechen
        </button>

        {/* T27: Save Button - "Speichern" with brand-primary color */}
        <button
          onClick={onFinish}
          disabled={!canFinish || autoSaveStatus === 'saving'}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-light text-white bg-brand-primary hover:opacity-90 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-full transition-colors"
        >
          <span>Speichern</span>
          <Check size={16} />
        </button>
      </div>
    </div>
  );
};

export default ThemenlisteFooter;
