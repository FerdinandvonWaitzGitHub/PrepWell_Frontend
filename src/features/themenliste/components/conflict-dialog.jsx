import { Cloud, Monitor, AlertTriangle } from 'lucide-react';

/**
 * ConflictDialog - T33 Phase 4: Multi-Device Conflict Resolution
 *
 * Shows when localStorage has older data than Supabase DB,
 * letting the user choose which version to keep.
 */
const ConflictDialog = ({
  open,
  localVersion,
  dbVersion,
  onUseLocal,
  onUseCloud,
}) => {
  if (!open) return null;

  // Format timestamp for display
  const formatTime = (iso) => {
    if (!iso) return 'Unbekannt';
    try {
      return new Date(iso).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unbekannt';
    }
  };

  // Calculate time difference
  const getTimeDiff = () => {
    if (!localVersion?.lastModified || !dbVersion?.updatedAt) return null;
    try {
      const localTime = new Date(localVersion.lastModified).getTime();
      const dbTime = new Date(dbVersion.updatedAt).getTime();
      const diffMs = Math.abs(dbTime - localTime);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) return `${diffDays} Tag${diffDays > 1 ? 'e' : ''}`;
      if (diffHours > 0) return `${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
      if (diffMins > 0) return `${diffMins} Minute${diffMins > 1 ? 'n' : ''}`;
      return 'wenige Sekunden';
    } catch {
      return null;
    }
  };

  const localThemenCount = localVersion?.contentPlan?.themen?.length || 0;
  const dbThemenCount = dbVersion?.themen?.length || 0;
  const localAreasCount = localVersion?.contentPlan?.selectedAreas?.length || 0;
  const dbAreasCount = dbVersion?.selectedAreas?.length || 0;
  const timeDiff = getTimeDiff();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Verschiedene Versionen gefunden
              </h2>
              {timeDiff && (
                <p className="text-xs text-neutral-500">
                  Cloud-Version ist {timeDiff} neuer
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-neutral-600">
            Es gibt Änderungen auf einem anderen Gerät. Welche Version möchtest du behalten?
          </p>
        </div>

        {/* Version Comparison */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Local Version */}
            <button
              onClick={onUseLocal}
              className="p-4 border-2 border-neutral-200 rounded-xl text-left hover:border-neutral-400 hover:bg-neutral-50 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Monitor size={18} className="text-neutral-500" />
                <span className="text-sm font-medium text-neutral-700">Dieses Gerät</span>
              </div>
              <div className="text-xs text-neutral-500 mb-2">
                {formatTime(localVersion?.lastModified)}
              </div>
              <div className="space-y-1">
                <div className="text-xs text-neutral-600">
                  {localAreasCount} Fach{localAreasCount !== 1 ? 'er' : ''}
                </div>
                <div className="text-xs text-neutral-600">
                  {localThemenCount} Thema{localThemenCount !== 1 ? 'en' : ''}
                </div>
              </div>
              <div className="mt-3 text-xs font-medium text-neutral-400 group-hover:text-neutral-600">
                Diese Version verwenden
              </div>
            </button>

            {/* Cloud Version */}
            <button
              onClick={onUseCloud}
              className="p-4 border-2 border-blue-200 bg-blue-50 rounded-xl text-left hover:border-blue-400 hover:bg-blue-100 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Cloud size={18} className="text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Cloud</span>
                <span className="text-[10px] font-medium text-blue-600 bg-blue-200 px-1.5 py-0.5 rounded">
                  NEUER
                </span>
              </div>
              <div className="text-xs text-blue-600 mb-2">
                {formatTime(dbVersion?.updatedAt)}
              </div>
              <div className="space-y-1">
                <div className="text-xs text-blue-700">
                  {dbAreasCount} Fach{dbAreasCount !== 1 ? 'er' : ''}
                </div>
                <div className="text-xs text-blue-700">
                  {dbThemenCount} Thema{dbThemenCount !== 1 ? 'en' : ''}
                </div>
              </div>
              <div className="mt-3 text-xs font-medium text-blue-500 group-hover:text-blue-700">
                Empfohlen
              </div>
            </button>
          </div>
        </div>

        {/* Info Footer */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100">
          <p className="text-xs text-neutral-500 text-center">
            Die nicht gewählte Version wird überschrieben und kann nicht wiederhergestellt werden.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConflictDialog;
