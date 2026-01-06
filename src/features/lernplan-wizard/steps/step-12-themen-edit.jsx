import { useState, useMemo, useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { Plus, Minus, GripVertical, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 12: Themen & Aufgaben Editor
 * User can add/edit themes and tasks for each Rechtsgebiet.
 * Uses horizontal tabs/pills to switch between Rechtsgebiete.
 */

/**
 * RG Tab Component with theme count indicator
 */
const RgTab = ({ rechtsgebietId, isActive, onClick, themenCount }) => {
  const label = RECHTSGEBIET_LABELS[rechtsgebietId] || rechtsgebietId;
  const colorClass = RECHTSGEBIET_COLORS[rechtsgebietId] || 'bg-gray-500';
  const hasThemes = themenCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2
        ${isActive
          ? `${colorClass} text-white`
          : hasThemes
            ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }
      `}
    >
      {label}
      {/* Theme count badge */}
      <span className={`
        text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center
        ${isActive
          ? 'bg-white/20 text-white'
          : hasThemes
            ? 'bg-green-600 text-white'
            : 'bg-neutral-300 text-neutral-600'
        }
      `}>
        {themenCount}
      </span>
      {/* Checkmark for completed */}
      {hasThemes && !isActive && (
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      )}
    </button>
  );
};

/**
 * URG Section Component
 */
const UrgSection = ({ urg, themen, onAddThema, onRemoveThema }) => {
  const [newThemaName, setNewThemaName] = useState('');

  const handleAdd = () => {
    if (newThemaName.trim()) {
      onAddThema({
        id: `thema-${Date.now()}`,
        name: newThemaName.trim(),
        aufgaben: []
      });
      setNewThemaName('');
    }
  };

  return (
    <div className="mb-6">
      {/* URG Header */}
      <h4 className="text-base font-medium text-neutral-900 mb-3">{urg.name}</h4>

      {/* Themen List */}
      <div className="space-y-2 mb-3">
        {themen.length > 0 ? (
          themen.map((thema) => (
            <div
              key={thema.id}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200"
            >
              <button
                type="button"
                className="p-1 text-neutral-400 hover:text-neutral-600 cursor-grab"
                tabIndex={-1}
              >
                <GripVertical className="w-4 h-4" />
              </button>
              <span className="flex-1 text-sm text-neutral-900">{thema.name}</span>
              <button
                type="button"
                onClick={() => onRemoveThema(thema.id)}
                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-neutral-500 italic">Noch keine Themen hinzugefügt.</p>
        )}
      </div>

      {/* Add Thema Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newThemaName}
          onChange={(e) => setNewThemaName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Neues Thema..."
          className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newThemaName.trim()}
          className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Hinzufügen
        </button>
      </div>
    </div>
  );
};

/**
 * Confirmation Dialog Component
 */
const ConfirmationDialog = ({ rgsWithoutThemes, onContinue, onStay }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Nicht alle Rechtsgebiete haben Themen
            </h3>
          </div>
          <button
            onClick={onStay}
            className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-neutral-600 mb-3">
            Folgende Rechtsgebiete haben noch keine Themen:
          </p>
          <ul className="space-y-1">
            {rgsWithoutThemes.map(rgId => (
              <li key={rgId} className="flex items-center gap-2 text-sm text-neutral-700">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                {RECHTSGEBIET_LABELS[rgId] || rgId}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-neutral-600 mb-6">
          Hast du bereits zu allen Rechtsgebieten Themen hinzugefügt, die du brauchst?
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onStay}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Nein, weitere hinzufügen
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            Ja, weiter
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Step 12 Component
 */
const Step12ThemenEdit = () => {
  const {
    selectedRechtsgebiete,
    unterrechtsgebieteDraft,
    themenDraft,
    updateWizardData,
    setStep12ConfirmationHandler
  } = useWizard();

  const [activeRgIndex, setActiveRgIndex] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const activeRg = selectedRechtsgebiete[activeRgIndex];
  const activeUrgs = unterrechtsgebieteDraft[activeRg] || [];

  // Calculate theme counts per RG
  const themenCountsPerRg = useMemo(() => {
    const counts = {};
    for (const rgId of selectedRechtsgebiete) {
      let count = 0;
      const urgs = unterrechtsgebieteDraft[rgId] || [];
      for (const urg of urgs) {
        const themes = themenDraft[urg.id] || [];
        count += themes.length;
      }
      counts[rgId] = count;
    }
    return counts;
  }, [selectedRechtsgebiete, unterrechtsgebieteDraft, themenDraft]);

  // Find RGs without themes
  const rgsWithoutThemes = useMemo(() => {
    return selectedRechtsgebiete.filter(rgId => themenCountsPerRg[rgId] === 0);
  }, [selectedRechtsgebiete, themenCountsPerRg]);

  // Total theme count
  const totalThemenCount = Object.values(themenCountsPerRg).reduce((a, b) => a + b, 0);
  const hasAnyThemes = totalThemenCount > 0;
  const allRgsHaveThemes = rgsWithoutThemes.length === 0;

  // Register confirmation handler with wizard context
  useEffect(() => {
    if (setStep12ConfirmationHandler) {
      setStep12ConfirmationHandler((goNextCallback) => {
        if (!allRgsHaveThemes && hasAnyThemes) {
          // Show confirmation dialog
          setPendingNavigation(() => goNextCallback);
          setShowConfirmDialog(true);
          return false; // Prevent immediate navigation
        }
        return true; // Allow navigation
      });

      return () => setStep12ConfirmationHandler(null);
    }
  }, [allRgsHaveThemes, hasAnyThemes, setStep12ConfirmationHandler]);

  const handleAddThema = (urgId, thema) => {
    const currentThemen = themenDraft[urgId] || [];
    updateWizardData({
      themenDraft: {
        ...themenDraft,
        [urgId]: [...currentThemen, thema]
      }
    });
  };

  const handleRemoveThema = (urgId, themaId) => {
    const currentThemen = themenDraft[urgId] || [];
    updateWizardData({
      themenDraft: {
        ...themenDraft,
        [urgId]: currentThemen.filter(t => t.id !== themaId)
      }
    });
  };

  const handleConfirmContinue = () => {
    setShowConfirmDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
    }
  };

  const handleConfirmStay = () => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
    // Focus on first RG without themes
    if (rgsWithoutThemes.length > 0) {
      const firstMissingIndex = selectedRechtsgebiete.indexOf(rgsWithoutThemes[0]);
      if (firstMissingIndex >= 0) {
        setActiveRgIndex(firstMissingIndex);
      }
    }
  };

  return (
    <div>
      <StepHeader
        step={12}
        title="Hinzufügen von Themen & Aufgaben"
        description="Füge deinen Unterrechtsgebieten Themen hinzu, die du lernen möchtest."
      />

      {/* Hint Box */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <strong>Tipp:</strong> Klicke auf die Rechtsgebiete unten, um zwischen ihnen zu wechseln
          und Themen für jedes Rechtsgebiet hinzuzufügen. Die Zahl zeigt an, wie viele Themen bereits hinzugefügt wurden.
        </p>
      </div>

      {/* Progress Summary */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-neutral-600">Fortschritt:</span>
        <span className={`font-medium ${allRgsHaveThemes ? 'text-green-600' : 'text-amber-600'}`}>
          {selectedRechtsgebiete.length - rgsWithoutThemes.length} von {selectedRechtsgebiete.length} Rechtsgebieten haben Themen
        </span>
      </div>

      {/* RG Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {selectedRechtsgebiete.map((rgId, index) => (
          <RgTab
            key={rgId}
            rechtsgebietId={rgId}
            isActive={index === activeRgIndex}
            onClick={() => setActiveRgIndex(index)}
            themenCount={themenCountsPerRg[rgId] || 0}
          />
        ))}
      </div>

      {/* URG Sections */}
      <div className="bg-neutral-50 rounded-lg p-4">
        {activeUrgs.length > 0 ? (
          activeUrgs.map((urg) => (
            <UrgSection
              key={urg.id}
              urg={urg}
              themen={themenDraft[urg.id] || []}
              onAddThema={(thema) => handleAddThema(urg.id, thema)}
              onRemoveThema={(themaId) => handleRemoveThema(urg.id, themaId)}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-neutral-500">
              Keine Unterrechtsgebiete für dieses Rechtsgebiet vorhanden.
            </p>
          </div>
        )}
      </div>

      {/* Validation Feedback */}
      <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
        allRgsHaveThemes
          ? 'bg-green-50 border border-green-200'
          : hasAnyThemes
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-red-50 border border-red-200'
      }`}>
        {allRgsHaveThemes ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Alle Rechtsgebiete haben Themen ({totalThemenCount} insgesamt)
              </p>
              <p className="text-sm text-green-700">
                Du kannst jetzt fortfahren!
              </p>
            </div>
          </>
        ) : hasAnyThemes ? (
          <>
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {totalThemenCount} {totalThemenCount === 1 ? 'Thema' : 'Themen'} hinzugefügt
              </p>
              <p className="text-sm text-amber-700">
                {rgsWithoutThemes.length} {rgsWithoutThemes.length === 1 ? 'Rechtsgebiet hat' : 'Rechtsgebiete haben'} noch keine Themen: {rgsWithoutThemes.map(r => RECHTSGEBIET_LABELS[r]).join(', ')}
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Mindestens ein Thema erforderlich
              </p>
              <p className="text-sm text-red-700">
                Füge mindestens einem Unterrechtsgebiet ein Thema hinzu, um fortzufahren.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <ConfirmationDialog
          rgsWithoutThemes={rgsWithoutThemes}
          onContinue={handleConfirmContinue}
          onStay={handleConfirmStay}
        />
      )}
    </div>
  );
};

export default Step12ThemenEdit;
