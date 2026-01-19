import { Archive, X, Check, Loader2 } from 'lucide-react';

/**
 * ThemenlisteFooter - Footer with Archive, Cancel, Finish, and auto-save status
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
      {/* Left: Archive Button */}
      <button
        onClick={onArchive}
        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-3xl border border-neutral-200 transition-colors"
      >
        <Archive size={16} />
        <span>Archivieren</span>
      </button>

      {/* Right: Cancel + Save Status + Finish */}
      <div className="flex items-center gap-3">
        {/* Auto-Save Status */}
        <div className="flex items-center gap-1.5 text-sm">
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

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-3xl border border-neutral-200 transition-colors"
        >
          Abbrechen
        </button>

        {/* T23: Finish Button */}
        <button
          onClick={onFinish}
          disabled={!canFinish || autoSaveStatus === 'saving'}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-3xl transition-colors"
        >
          <Check size={16} />
          <span>Fertig</span>
        </button>
      </div>
    </div>
  );
};

export default ThemenlisteFooter;
