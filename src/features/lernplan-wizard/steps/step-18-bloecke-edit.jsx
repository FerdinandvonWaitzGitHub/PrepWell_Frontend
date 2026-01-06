import { useState } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { Plus, Minus, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { RECHTSGEBIET_LABELS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 18: Lernblöcke Editor
 * Complex editor where users create learning blocks and assign themes to them.
 * Left side: URG sidebar + Themes list
 * Right side: Learning blocks
 */

/**
 * Progress Stats Component
 */
const ProgressStats = ({ gewichtung, gesamt, verbraucht }) => {
  const verfuegbar = gesamt - verbraucht;
  const percentage = gesamt > 0 ? Math.round((verbraucht / gesamt) * 100) : 0;

  return (
    <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
          Gewichtung {gewichtung}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-xs text-neutral-500">gesamt</p>
          <p className="text-lg font-semibold text-neutral-900">{gesamt}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">verbraucht</p>
          <p className="text-lg font-semibold text-neutral-900">{verbraucht}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">verfügbar</p>
          <p className="text-lg font-semibold text-neutral-900">{verfuegbar}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <p className="text-xs text-neutral-500 mb-1">{percentage}% verbraucht</p>
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${percentage > 100 ? 'bg-red-500' : 'bg-primary-500'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Theme Item Component (draggable)
 */
const ThemeItem = ({ thema, onAddToBlock }) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors">
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
        onClick={onAddToBlock}
        className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
        title="Zu Block hinzufügen"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Lernblock Component
 */
const LernblockItem = ({ block, onRemove, onChangeSize }) => {
  return (
    <div className="p-4 bg-white rounded-lg border border-neutral-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-neutral-900">
          Lernblock ({block.size}/3)
        </span>
        <div className="flex items-center gap-2">
          {/* Size controls */}
          <button
            type="button"
            onClick={() => onChangeSize(Math.max(1, block.size - 1))}
            disabled={block.size <= 1}
            className="p-1 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-sm font-medium w-8 text-center">{block.size}/3</span>
          <button
            type="button"
            onClick={() => onChangeSize(Math.min(3, block.size + 1))}
            disabled={block.size >= 3}
            className="p-1 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors ml-2"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Block content (themes) */}
      {block.themen?.length > 0 ? (
        <div className="space-y-2">
          {block.themen.map((thema, idx) => (
            <div key={idx} className="text-sm text-neutral-700 p-2 bg-neutral-50 rounded">
              {thema.name}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-400 italic">Ziehe Themen hierher</p>
      )}
    </div>
  );
};

/**
 * Step 18 Component
 */
const Step18BloeckeEdit = () => {
  const {
    selectedRechtsgebiete,
    currentBlockRgIndex,
    unterrechtsgebieteDraft,
    themenDraft,
    rechtsgebieteGewichtung,
    lernbloeckeDraft,
    updateWizardData
  } = useWizard();

  const [activeUrgIndex, setActiveUrgIndex] = useState(0);

  const activeRg = selectedRechtsgebiete[currentBlockRgIndex || 0];
  const activeUrgs = unterrechtsgebieteDraft[activeRg] || [];
  const activeUrg = activeUrgs[activeUrgIndex];
  const rgLabel = RECHTSGEBIET_LABELS[activeRg] || activeRg;

  // Get themes for active URG
  const activeThemen = activeUrg ? (themenDraft[activeUrg.id] || []) : [];

  // Get blocks for active RG
  const activeBlocks = lernbloeckeDraft?.[activeRg] || [];

  // Calculate stats (mock values for now)
  const gewichtung = rechtsgebieteGewichtung?.[activeRg] || 33;
  const gesamt = 600; // These would be calculated based on total learning time
  const verbraucht = activeBlocks.reduce((sum, b) => sum + (b.size * 100), 0);

  const handleAddBlock = () => {
    const newBlock = {
      id: `block-${Date.now()}`,
      size: 3,
      themen: []
    };

    updateWizardData({
      lernbloeckeDraft: {
        ...lernbloeckeDraft,
        [activeRg]: [...activeBlocks, newBlock]
      }
    });
  };

  const handleRemoveBlock = (blockId) => {
    updateWizardData({
      lernbloeckeDraft: {
        ...lernbloeckeDraft,
        [activeRg]: activeBlocks.filter(b => b.id !== blockId)
      }
    });
  };

  const handleChangeBlockSize = (blockId, newSize) => {
    updateWizardData({
      lernbloeckeDraft: {
        ...lernbloeckeDraft,
        [activeRg]: activeBlocks.map(b =>
          b.id === blockId ? { ...b, size: newSize } : b
        )
      }
    });
  };

  return (
    <div>
      <StepHeader
        step={18}
        title={`Lernblöcke für ${rgLabel}`}
        description="Erstelle Lernblöcke und bringe alle Themen darin unter."
      />

      {/* Progress Stats */}
      <ProgressStats
        gewichtung={gewichtung}
        gesamt={gesamt}
        verbraucht={verbraucht}
      />

      {/* Main Content */}
      <div className="flex gap-4">
        {/* Left: URG Sidebar + Themes */}
        <div className="w-72 flex-shrink-0">
          {/* URG List */}
          <div className="bg-neutral-50 rounded-lg p-2 mb-4">
            {activeUrgs.map((urg, index) => (
              <button
                key={urg.id}
                onClick={() => setActiveUrgIndex(index)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm transition-all
                  ${index === activeUrgIndex
                    ? 'bg-white shadow-sm font-medium text-neutral-900'
                    : 'text-neutral-600 hover:bg-white/50'
                  }
                `}
              >
                {urg.name}
              </button>
            ))}

            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700">
              <Pencil className="w-4 h-4" />
              URGs anpassen
            </button>
          </div>

          {/* Themes List */}
          {activeUrg && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-neutral-900">Meine Themen</h4>
                <button className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700">
                  <Pencil className="w-3 h-3" />
                  Themen anpassen
                </button>
              </div>
              <div className="space-y-2">
                {activeThemen.map((thema) => (
                  <ThemeItem
                    key={thema.id}
                    thema={thema}
                    onAddToBlock={() => {}}
                  />
                ))}
                {activeThemen.length === 0 && (
                  <p className="text-sm text-neutral-500 italic">Keine Themen vorhanden</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Lernblöcke */}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-neutral-900 mb-3">Meine Lernblöcke</h4>

          <div className="space-y-3 mb-4">
            {activeBlocks.map((block) => (
              <LernblockItem
                key={block.id}
                block={block}
                onRemove={() => handleRemoveBlock(block.id)}
                onChangeSize={(size) => handleChangeBlockSize(block.id, size)}
              />
            ))}
          </div>

          {/* Add Block Button */}
          <button
            type="button"
            onClick={handleAddBlock}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Neuen Lernblock erstellen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step18BloeckeEdit;
