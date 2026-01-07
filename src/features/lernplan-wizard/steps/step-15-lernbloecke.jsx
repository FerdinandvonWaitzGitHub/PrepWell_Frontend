import { useState, useMemo } from 'react';
import { useWizard } from '../context/wizard-context';
import { Plus, Minus, GripVertical, Pencil, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 15: Lernblöcke erstellen
 *
 * User assigns themes to learning blocks with drag & drop.
 * - Left column: "Meine Themen" with size controls (+/- for block count)
 * - Right column: "Meine Lernblöcke" (user creates blocks and assigns themes)
 *
 * Block budget is calculated from:
 * - Total learning days × blocks per day × RG weighting %
 */

/**
 * Calculate total learning days from wizard data
 */
const calculateLearningDays = (startDate, endDate, bufferDays, vacationDays, weekStructure) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  // Count free days per week
  const freeDaysPerWeek = weekStructure
    ? Object.values(weekStructure).filter(blocks =>
        Array.isArray(blocks) && blocks.every(b => b === 'free')
      ).length
    : 2; // Default: Saturday + Sunday

  // Calculate weeks
  const weeks = totalDays / 7;
  const freeDays = Math.floor(weeks * freeDaysPerWeek);

  // Net learning days
  const netDays = totalDays - (bufferDays || 0) - (vacationDays || 0) - freeDays;
  return Math.max(0, Math.floor(netDays));
};

/**
 * RG Tab Component
 */
const RgTab = ({ rechtsgebietId, isActive, onClick, gewichtung }) => {
  const label = RECHTSGEBIET_LABELS[rechtsgebietId] || rechtsgebietId;
  const colorClass = RECHTSGEBIET_COLORS[rechtsgebietId] || 'bg-gray-500';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
        ${isActive
          ? `${colorClass} text-white`
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }
      `}
    >
      {label}
      {gewichtung > 0 && (
        <span className="ml-2 opacity-75">({gewichtung}%)</span>
      )}
    </button>
  );
};

/**
 * URG Tab Component
 */
const UrgTab = ({ urg, isActive, onClick, themenCount }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap
        ${isActive
          ? 'bg-primary-600 text-white'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }
      `}
    >
      {urg.name}
      {themenCount > 0 && (
        <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
          isActive ? 'bg-white/20' : 'bg-neutral-200'
        }`}>
          {themenCount}
        </span>
      )}
    </button>
  );
};

/**
 * Theme Card Component (Left Column)
 */
const ThemeCard = ({
  thema,
  themaSize,
  onSizeChange,
  isExpanded,
  onToggleExpand,
  onDragStart,
  isDragging
}) => {
  const aufgabenCount = thema.aufgaben?.length || 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, thema)}
      className={`
        bg-white rounded-lg border transition-all cursor-grab active:cursor-grabbing
        ${isDragging
          ? 'border-primary-400 bg-primary-50 opacity-50'
          : 'border-neutral-200 hover:border-neutral-300'
        }
      `}
    >
      {/* Header */}
      <div className="p-3 flex items-center gap-3">
        {/* Drag Handle */}
        <div className="text-neutral-400">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Theme Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">{thema.name}</p>
          {aufgabenCount > 0 && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 mt-0.5"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {aufgabenCount} Aufgabe{aufgabenCount !== 1 ? 'n' : ''}
            </button>
          )}
        </div>

        {/* Size Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSizeChange(Math.max(1, themaSize - 1))}
            disabled={themaSize <= 1}
            className="p-1 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-3 h-3" />
          </button>
          <div className="w-8 text-center">
            <span className="text-sm font-semibold">{themaSize}</span>
          </div>
          <button
            type="button"
            onClick={() => onSizeChange(themaSize + 1)}
            disabled={themaSize >= 10}
            className="p-1 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Aufgaben (Expandable) */}
      {isExpanded && aufgabenCount > 0 && (
        <div className="px-3 pb-3 pt-0 border-t border-neutral-100">
          <div className="mt-2 space-y-1">
            {thema.aufgaben.map((aufgabe, idx) => (
              <div key={aufgabe.id || idx} className="flex items-center gap-2 text-xs text-neutral-600">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                <span className="truncate">{aufgabe.name || aufgabe.text || `Aufgabe ${idx + 1}`}</span>
                {aufgabe.priority > 0 && (
                  <span className="text-amber-500">{'!'.repeat(aufgabe.priority)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Lernblock Component (Right Column)
 */
const LernblockCard = ({
  block,
  onRemoveThema,
  onRemoveBlock,
  onDrop,
  isDropTarget
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, block.id);
  };

  const totalSize = block.themen?.reduce((sum, t) => sum + (t.size || 1), 0) || 0;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        bg-white rounded-lg border-2 transition-all min-h-[100px]
        ${isDragOver || isDropTarget
          ? 'border-primary-400 bg-primary-50'
          : 'border-neutral-200'
        }
      `}
    >
      {/* Block Header */}
      <div className="p-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Visual block indicator */}
          <div className="flex gap-0.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-1 h-6 rounded-full ${
                  i <= (block.maxSize || 3) ? 'bg-primary-400' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-neutral-700">
            Lernblock ({totalSize}/{block.maxSize || 3})
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemoveBlock(block.id)}
          className="p-1 text-neutral-400 hover:text-red-500 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Assigned Themes */}
      <div className="p-2 space-y-1">
        {block.themen?.length > 0 ? (
          block.themen.map((thema, idx) => (
            <div
              key={thema.id || idx}
              className="flex items-center justify-between p-2 bg-neutral-50 rounded text-sm"
            >
              <span className="truncate">{thema.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">({thema.size || 1})</span>
                <button
                  type="button"
                  onClick={() => onRemoveThema(block.id, thema.id)}
                  className="text-neutral-400 hover:text-red-500"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-4 text-center text-sm text-neutral-400">
            Themen hierher ziehen
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Step 15 Component
 */
const Step15Lernbloecke = () => {
  const {
    selectedRechtsgebiete,
    unterrechtsgebieteDraft,
    themenDraft,
    rechtsgebieteGewichtung,
    startDate,
    endDate,
    bufferDays,
    vacationDays,
    blocksPerDay,
    weekStructure,
    lernbloeckeDraft,
    updateWizardData
  } = useWizard();

  const [activeRgIndex, setActiveRgIndex] = useState(0);
  const [activeUrgIndex, setActiveUrgIndex] = useState(0);
  const [expandedThemen, setExpandedThemen] = useState({});
  const [draggingThema, setDraggingThema] = useState(null);

  // Theme sizes state (stored separately)
  const [themenSizes, setThemenSizes] = useState({});

  // Current RG and URG
  const activeRg = selectedRechtsgebiete[activeRgIndex] || selectedRechtsgebiete[0];
  const activeUrgs = useMemo(() => {
    return unterrechtsgebieteDraft[activeRg] || [];
  }, [unterrechtsgebieteDraft, activeRg]);
  const activeUrg = activeUrgs[activeUrgIndex];
  const rgGewichtung = rechtsgebieteGewichtung[activeRg] || 0;

  // Current blocks for this RG
  const currentBlocks = useMemo(() => {
    return lernbloeckeDraft[activeRg] || [];
  }, [lernbloeckeDraft, activeRg]);

  // Calculate block budget
  const learningDays = useMemo(() =>
    calculateLearningDays(startDate, endDate, bufferDays, vacationDays, weekStructure),
    [startDate, endDate, bufferDays, vacationDays, weekStructure]
  );

  const totalBlocksForRg = useMemo(() => {
    if (!rgGewichtung) return 0;
    return Math.floor(learningDays * blocksPerDay * (rgGewichtung / 100));
  }, [learningDays, blocksPerDay, rgGewichtung]);

  // Count used blocks (sum of theme sizes in all blocks)
  const usedBlocks = useMemo(() => {
    return currentBlocks.reduce((sum, block) => {
      return sum + (block.themen?.reduce((s, t) => s + (t.size || 1), 0) || 0);
    }, 0);
  }, [currentBlocks]);

  const availableBlocks = Math.max(0, totalBlocksForRg - usedBlocks);
  const usedPercentage = totalBlocksForRg > 0 ? Math.round((usedBlocks / totalBlocksForRg) * 100) : 0;

  // Get themes for current URG
  const currentThemen = useMemo(() => {
    if (!activeUrg) return [];
    return themenDraft[activeUrg.id] || [];
  }, [activeUrg, themenDraft]);

  // Theme counts per URG
  const themenCountsPerUrg = useMemo(() => {
    const counts = {};
    activeUrgs.forEach(urg => {
      counts[urg.id] = (themenDraft[urg.id] || []).length;
    });
    return counts;
  }, [activeUrgs, themenDraft]);

  // Handlers
  const handleRgChange = (index) => {
    setActiveRgIndex(index);
    setActiveUrgIndex(0);
  };

  const handleThemaSizeChange = (themaId, newSize) => {
    setThemenSizes(prev => ({ ...prev, [themaId]: newSize }));
  };

  const toggleThemaExpand = (themaId) => {
    setExpandedThemen(prev => ({ ...prev, [themaId]: !prev[themaId] }));
  };

  // Drag & Drop
  const handleDragStart = (e, thema) => {
    setDraggingThema(thema);
    e.dataTransfer.setData('text/plain', thema.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, blockId) => {
    e.preventDefault();
    const themaId = e.dataTransfer.getData('text/plain');

    if (!themaId || !draggingThema) return;

    const themaSize = themenSizes[themaId] || 1;

    // Add theme to block
    const updatedBlocks = currentBlocks.map(block => {
      if (block.id === blockId) {
        // Check if theme already exists in this block
        const existingThema = block.themen?.find(t => t.id === themaId);
        if (existingThema) return block;

        return {
          ...block,
          themen: [
            ...(block.themen || []),
            { id: themaId, name: draggingThema.name, size: themaSize }
          ]
        };
      }
      return block;
    });

    updateWizardData({
      lernbloeckeDraft: {
        ...lernbloeckeDraft,
        [activeRg]: updatedBlocks
      }
    });

    setDraggingThema(null);
  };

  const handleRemoveThemaFromBlock = (blockId, themaId) => {
    const updatedBlocks = currentBlocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          themen: (block.themen || []).filter(t => t.id !== themaId)
        };
      }
      return block;
    });

    updateWizardData({
      lernbloeckeDraft: {
        ...lernbloeckeDraft,
        [activeRg]: updatedBlocks
      }
    });
  };

  const handleAddBlock = () => {
    const newBlock = {
      id: `block-${Date.now()}`,
      maxSize: blocksPerDay,
      themen: []
    };

    updateWizardData({
      lernbloeckeDraft: {
        ...lernbloeckeDraft,
        [activeRg]: [...currentBlocks, newBlock]
      }
    });
  };

  const handleRemoveBlock = (blockId) => {
    updateWizardData({
      lernbloeckeDraft: {
        ...lernbloeckeDraft,
        [activeRg]: currentBlocks.filter(b => b.id !== blockId)
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-light text-neutral-900 mb-2">
          Lernblöcke für {RECHTSGEBIET_LABELS[activeRg] || activeRg}
        </h1>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-neutral-50 rounded-lg">
        {/* Gewichtung Badge */}
        <div className="px-3 py-1 bg-white rounded-lg border border-neutral-200 text-sm">
          Gewichtung {rgGewichtung}%
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-neutral-500">gesamt</div>
            <div className="text-lg font-semibold">{totalBlocksForRg}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-500">verbraucht</div>
            <div className="text-lg font-semibold">{usedBlocks}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-500">verfügbar</div>
            <div className="text-lg font-semibold">{availableBlocks}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-32">
          <div className="text-xs text-neutral-500 mb-1">{usedPercentage}% verbraucht</div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all"
              style={{ width: `${Math.min(100, usedPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* RG Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {selectedRechtsgebiete.map((rgId, index) => (
          <RgTab
            key={rgId}
            rechtsgebietId={rgId}
            isActive={index === activeRgIndex}
            onClick={() => handleRgChange(index)}
            gewichtung={rechtsgebieteGewichtung[rgId] || 0}
          />
        ))}
      </div>

      {/* URG Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 flex-wrap">
        {activeUrgs.map((urg, index) => (
          <UrgTab
            key={urg.id}
            urg={urg}
            isActive={index === activeUrgIndex}
            onClick={() => setActiveUrgIndex(index)}
            themenCount={themenCountsPerUrg[urg.id] || 0}
          />
        ))}
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <Pencil className="w-3 h-3" />
          URGs anpassen
        </button>
      </div>

      {/* Info Text */}
      <p className="text-center text-neutral-500 mb-6">
        Erstelle Lernblöcke und bringe alle Themen darin unter.
      </p>

      {/* Two Column Layout */}
      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
        {/* Left Column: Meine Themen */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-neutral-900">Meine Themen</h2>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
            >
              <Pencil className="w-3 h-3" />
              Themen anpassen
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {currentThemen.length > 0 ? (
              currentThemen.map(thema => (
                <ThemeCard
                  key={thema.id}
                  thema={thema}
                  themaSize={themenSizes[thema.id] || 1}
                  onSizeChange={(size) => handleThemaSizeChange(thema.id, size)}
                  isExpanded={expandedThemen[thema.id]}
                  onToggleExpand={() => toggleThemaExpand(thema.id)}
                  onDragStart={handleDragStart}
                  isDragging={draggingThema?.id === thema.id}
                />
              ))
            ) : (
              <div className="p-8 bg-neutral-50 rounded-lg text-center">
                <p className="text-neutral-500 text-sm">
                  Keine Themen für dieses Unterrechtsgebiet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Arrow between columns */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block">
          <div className="text-neutral-300 text-4xl">→</div>
        </div>

        {/* Right Column: Meine Lernblöcke */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-neutral-900">Meine Lernblöcke</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {currentBlocks.map(block => (
              <LernblockCard
                key={block.id}
                block={block}
                onRemoveThema={handleRemoveThemaFromBlock}
                onRemoveBlock={handleRemoveBlock}
                onDrop={handleDrop}
                isDropTarget={false}
              />
            ))}

            {/* Add Block Button */}
            <button
              type="button"
              onClick={handleAddBlock}
              className="w-full p-4 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Neuer Lernblock</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step15Lernbloecke;
