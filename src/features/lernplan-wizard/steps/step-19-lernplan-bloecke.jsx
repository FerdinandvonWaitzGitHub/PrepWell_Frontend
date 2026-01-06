import { useState } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { Plus, Minus, Pencil } from 'lucide-react';

/**
 * Step 19: Lernplanblöcke
 * Final step where users assign blocks to their learning plan
 * and set block sizes.
 */

/**
 * Block Size Selector Component
 */
const BlockSizeSelector = ({ block, onChangeSize }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-900">Blockgröße</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChangeSize(Math.max(1, block.size - 1))}
          disabled={block.size <= 1}
          className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="px-3 py-1 bg-neutral-100 rounded-lg min-w-[60px] text-center">
          <span className="text-sm font-medium text-neutral-900">{block.size}/3</span>
        </div>

        <button
          type="button"
          onClick={() => onChangeSize(Math.min(3, block.size + 1))}
          disabled={block.size >= 3}
          className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * URG Sidebar Item
 */
const UrgSidebarItem = ({ urg, isActive, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 rounded-lg transition-all
        ${isActive
          ? 'bg-primary-50 border-l-4 border-primary-600 text-primary-900 font-medium'
          : 'hover:bg-neutral-50 text-neutral-700'
        }
      `}
    >
      <span className="text-sm">{urg.name}</span>
    </button>
  );
};

/**
 * Step 19 Component
 */
const Step19LernplanBloecke = () => {
  const {
    selectedRechtsgebiete,
    currentBlockRgIndex,
    unterrechtsgebieteDraft,
    lernplanBloecke,
    updateWizardData
  } = useWizard();

  const [activeUrgIndex, setActiveUrgIndex] = useState(0);

  const activeRg = selectedRechtsgebiete[currentBlockRgIndex || 0];
  const activeUrgs = unterrechtsgebieteDraft[activeRg] || [];
  const activeUrg = activeUrgs[activeUrgIndex];

  // Get lernplan blocks for active URG
  const urgBlocks = activeUrg ? (lernplanBloecke?.[activeUrg.id] || []) : [];

  const handleAddBlock = () => {
    if (!activeUrg) return;

    const newBlock = {
      id: `lernplan-block-${Date.now()}`,
      size: 3
    };

    updateWizardData({
      lernplanBloecke: {
        ...lernplanBloecke,
        [activeUrg.id]: [...urgBlocks, newBlock]
      }
    });
  };

  const handleChangeBlockSize = (blockId, newSize) => {
    if (!activeUrg) return;

    updateWizardData({
      lernplanBloecke: {
        ...lernplanBloecke,
        [activeUrg.id]: urgBlocks.map(b =>
          b.id === blockId ? { ...b, size: newSize } : b
        )
      }
    });
  };

  return (
    <div>
      <StepHeader
        step={19}
        title="Einteilung in Lernplanblöcke"
        description="Lege die Größe deiner Lernplanblöcke fest, um sie später deinen Lerntagen zuzuordnen."
      />

      {/* Main Content */}
      <div className="flex gap-4">
        {/* Left: URG Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-neutral-50 rounded-lg p-2 space-y-1">
            {activeUrgs.map((urg, index) => (
              <UrgSidebarItem
                key={urg.id}
                urg={urg}
                isActive={index === activeUrgIndex}
                onClick={() => setActiveUrgIndex(index)}
              />
            ))}

            <button className="w-full flex items-center gap-2 px-4 py-3 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
              <Pencil className="w-4 h-4" />
              <span>URGs anpassen</span>
            </button>
          </div>
        </div>

        {/* Right: Lernplanblöcke */}
        <div className="flex-1">
          {activeUrg ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Einteilung in Lernplanblöcke
              </h3>

              {/* Blocks List */}
              <div className="space-y-3 mb-4">
                {urgBlocks.map((block) => (
                  <BlockSizeSelector
                    key={block.id}
                    block={block}
                    onChangeSize={(size) => handleChangeBlockSize(block.id, size)}
                  />
                ))}

                {urgBlocks.length === 0 && (
                  <p className="text-sm text-neutral-500 italic py-4 text-center">
                    Noch keine Lernplanblöcke erstellt.
                  </p>
                )}
              </div>

              {/* Add Block Button */}
              <button
                type="button"
                onClick={handleAddBlock}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Neuen Lernplanblock erstellen</span>
              </button>
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-lg p-8 text-center">
              <p className="text-neutral-500">
                Wähle ein Unterrechtsgebiet aus der Liste.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step19LernplanBloecke;
