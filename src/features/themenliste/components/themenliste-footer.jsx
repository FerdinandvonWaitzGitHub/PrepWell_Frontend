import { Archive, X, Check, Loader2, RefreshCw, WifiOff, AlertCircle, Clock, ImagePlus } from 'lucide-react';

/**
 * ThemenlisteFooter - Footer with Archive, Cancel, Save, and auto-save status
 * T27: Updated to match Figma design (texts, colors)
 * T33: Added retry, offline, error, and pending states with manual retry button
 * T33 Phase 5: Optimistic UI with "pending" status for instant feedback
 * PW-202: Added Screenshot Upload button
 */
const ThemenlisteFooter = ({
  onArchive,
  onCancel,
  onFinish,
  onRetry,
  onScreenshotUpload, // PW-202: Callback for screenshot upload
  autoSaveStatus, // 'saved' | 'saving' | 'retrying' | 'offline' | 'error' | 'pending'
  saveError, // { message, canRetry }
  canFinish = true, // T23: Disable finish if validation fails
  isOnline = true, // T33: Online status for UI hints
}) => {
  // T33: Status configuration for different save states
  // T33 Phase 5: Added "pending" for optimistic UI
  const statusConfig = {
    pending: {
      icon: Clock,
      text: 'Änderungen...',
      color: 'text-neutral-400',
      spin: false
    },
    saving: {
      icon: Loader2,
      text: 'Speichern...',
      color: 'text-blue-500',
      spin: true
    },
    retrying: {
      icon: RefreshCw,
      text: 'Erneuter Versuch...',
      color: 'text-amber-500',
      spin: true
    },
    saved: {
      icon: Check,
      text: 'Gespeichert',
      color: 'text-green-500',
      spin: false
    },
    offline: {
      icon: WifiOff,
      text: 'Offline - lokal gespeichert',
      color: 'text-amber-500',
      spin: false
    },
    error: {
      icon: AlertCircle,
      text: 'Fehler',
      color: 'text-red-500',
      spin: false
    }
  };

  const currentStatus = statusConfig[autoSaveStatus] || statusConfig.saved;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="border-t border-neutral-200 bg-white">
      {/* T33: Error banner with retry option */}
      {saveError && (
        <div className="px-6 py-2 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-sm text-red-700">{saveError.message}</span>
          </div>
          {saveError.canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Erneut versuchen
            </button>
          )}
        </div>
      )}

      {/* T33: Offline banner */}
      {!isOnline && autoSaveStatus !== 'offline' && (
        <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
          <WifiOff size={14} className="text-amber-600" />
          <span className="text-sm text-amber-700">
            Du bist offline. Änderungen werden lokal gespeichert.
          </span>
        </div>
      )}

      {/* Main footer */}
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left: Archive Button - T27: "Lernplan archivieren" */}
        <button
          onClick={onArchive}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-light text-neutral-950 hover:bg-neutral-100 rounded-full border border-neutral-200 transition-colors"
        >
          <span>Lernplan archivieren</span>
          <Archive size={16} />
        </button>

        {/* Center: Screenshot Upload Button - PW-202 */}
        {onScreenshotUpload && (
          <button
            onClick={onScreenshotUpload}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors"
          >
            <ImagePlus size={16} />
            <span>Screenshot hochladen</span>
          </button>
        )}

        {/* Right: Cancel + Save Status + Save */}
        <div className="flex items-center gap-2">
          {/* Auto-Save Status - T33: Enhanced with more states */}
          <div className="flex items-center gap-1.5 text-sm mr-2">
            <StatusIcon
              size={14}
              className={`${currentStatus.color} ${currentStatus.spin ? 'animate-spin' : ''}`}
            />
            <span className={currentStatus.color}>{currentStatus.text}</span>
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
            disabled={!canFinish || autoSaveStatus === 'saving' || autoSaveStatus === 'retrying'}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-light text-white bg-brand-primary hover:opacity-90 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <span>Speichern</span>
            <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemenlisteFooter;
