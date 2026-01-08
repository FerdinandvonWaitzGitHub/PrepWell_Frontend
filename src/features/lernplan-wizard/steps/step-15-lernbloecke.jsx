import { useState, useMemo, useEffect, useCallback } from 'react';
import { useWizard } from '../context/wizard-context';
import { GripVertical, RotateCcw, AlertTriangle, Info, ChevronDown, ChevronRight, X } from 'lucide-react';
import { RECHTSGEBIET_LABELS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 15: Lernblöcke erstellen (Redesigned v2)
 *
 * Design Decisions:
 * - Themes are collapsible and show individual tasks (Aufgaben)
 * - Both themes AND individual tasks can be dragged
 * - A block can contain: 1 whole theme OR multiple individual tasks (mutually exclusive)
 * - Themes are greyed out when assigned as a whole
 * - Individual tasks are greyed out when assigned individually
 * - Block order can be changed via drag & drop
 * - Reset button per Rechtsgebiet
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
    : 2;

  const weeks = totalDays / 7;
  const freeDays = Math.floor(weeks * freeDaysPerWeek);
  const netDays = totalDays - (bufferDays || 0) - (vacationDays || 0) - freeDays;
  return Math.max(0, Math.floor(netDays));
};

/**
 * Task Item Component (inside collapsible theme)
 * Shows task name with drag handle
 */
const TaskItem = ({ aufgabe, themaId, themaName, urgId, isAssigned, assignedBlockIndex, onDragStart }) => {
  return (
    <div
      draggable={!isAssigned}
      onDragStart={(e) => !isAssigned && onDragStart(e, {
        type: 'aufgabe',
        aufgabe,
        themaId,
        themaName,
        urgId
      })}
      className={`
        flex items-center gap-2 py-1.5 px-2 rounded transition-all
        ${isAssigned
          ? 'opacity-50 cursor-default'
          : 'cursor-grab active:cursor-grabbing hover:bg-neutral-100'
        }
      `}
    >
      {!isAssigned && <GripVertical className="w-3 h-3 text-neutral-400 flex-shrink-0" />}
      <div className="w-3 h-3 border border-neutral-300 rounded flex-shrink-0" />
      <span className={`text-sm flex-1 ${isAssigned ? 'line-through text-neutral-400' : 'text-neutral-700'}`}>
        {aufgabe.name}
      </span>
      {isAssigned && (
        <span className="text-xs bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">
          Block {assignedBlockIndex + 1}
        </span>
      )}
    </div>
  );
};

/**
 * Collapsible Theme Card Component (Left Column)
 * Shows theme name, can expand to show tasks
 */
const ThemeCard = ({
  thema,
  isFullyAssigned,
  assignedBlockIndex,
  assignedAufgabenMap,
  onDragStart
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const aufgaben = thema.aufgaben || [];
  const aufgabenCount = aufgaben.length;

  // Count how many tasks are individually assigned
  const assignedCount = aufgaben.filter(a => assignedAufgabenMap.has(a.id)).length;
  const hasPartialAssignment = assignedCount > 0 && !isFullyAssigned;

  return (
    <div
      className={`
        bg-white rounded-lg border transition-all
        ${isFullyAssigned
          ? 'border-neutral-200 opacity-50'
          : 'border-neutral-300'
        }
      `}
    >
      {/* Theme Header - Always visible, draggable */}
      <div
        draggable={!isFullyAssigned && !hasPartialAssignment}
        onDragStart={(e) => !isFullyAssigned && !hasPartialAssignment && onDragStart(e, { type: 'thema', thema })}
        className={`
          flex items-center gap-2 p-3
          ${isFullyAssigned || hasPartialAssignment
            ? 'cursor-default'
            : 'cursor-grab active:cursor-grabbing hover:bg-neutral-50'
          }
        `}
      >
        {/* Expand/Collapse Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-neutral-100 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          )}
        </button>

        {/* Drag Handle (only if draggable) */}
        {!isFullyAssigned && !hasPartialAssignment && (
          <GripVertical className="w-4 h-4 text-neutral-400 flex-shrink-0" />
        )}

        {/* Theme Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm truncate ${isFullyAssigned ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
            {thema.name}
          </p>
          <p className={`text-xs ${isFullyAssigned ? 'text-neutral-300' : hasPartialAssignment ? 'text-amber-600' : 'text-neutral-500'}`}>
            {hasPartialAssignment
              ? `${assignedCount}/${aufgabenCount} Aufgaben verteilt`
              : `${aufgabenCount} ${aufgabenCount === 1 ? 'Aufgabe' : 'Aufgaben'}`
            }
          </p>
        </div>

        {/* Badge for assigned theme */}
        {isFullyAssigned && (
          <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded">
            Block {assignedBlockIndex + 1}
          </span>
        )}
      </div>

      {/* Expanded: Show Tasks */}
      {isExpanded && !isFullyAssigned && aufgaben.length > 0 && (
        <div className="px-3 pb-3 border-t border-neutral-100 pt-2 space-y-1">
          {aufgaben.map(aufgabe => (
            <TaskItem
              key={aufgabe.id}
              aufgabe={aufgabe}
              themaId={thema.id}
              themaName={thema.name}
              urgId={thema.urgId}
              isAssigned={assignedAufgabenMap.has(aufgabe.id)}
              assignedBlockIndex={assignedAufgabenMap.get(aufgabe.id)}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      )}

      {/* Show info when theme is fully assigned */}
      {isExpanded && isFullyAssigned && (
        <div className="px-3 pb-3 border-t border-neutral-100 pt-2">
          <p className="text-xs text-neutral-400 italic">
            Gesamtes Thema in Block {assignedBlockIndex + 1} zugewiesen
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Lernblock Card Component (Right Column)
 * Can contain: 1 theme OR multiple individual tasks
 * BUG-P5 FIX: Option B - Show Aufgaben-List for both themes and individual tasks
 */
const LernblockCard = ({
  block,
  index,
  onDrop,
  onRemoveThema,
  onRemoveAufgabe,
  onBlockDragStart,
  onBlockDragOver,
  onBlockDrop,
  isDragOverBlock
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const hasThema = block.thema !== null;
  const hasAufgaben = (block.aufgaben || []).length > 0;
  const isEmpty = !hasThema && !hasAufgaben;

  // BUG-P5 FIX: Get aufgaben directly from block.thema (stored when dropped)
  const themaAufgaben = hasThema
    ? (block.thema.aufgaben || [])
    : [];

  const handleDragOver = (e) => {
    e.preventDefault();
    // Show drop zone for theme or aufgabe drops
    if (e.dataTransfer.types.includes('drag-type')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, block.id);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onBlockDragStart(e, index)}
      onDragOver={(e) => {
        handleDragOver(e);
        onBlockDragOver(e, index);
      }}
      onDragLeave={handleDragLeave}
      onDrop={(e) => {
        handleDrop(e);
        onBlockDrop(e, index);
      }}
      className={`
        rounded-lg border-2 p-3 min-h-[72px] transition-all cursor-grab active:cursor-grabbing
        ${isDragOver && isEmpty
          ? 'border-primary-400 bg-primary-50'
          : isDragOverBlock
            ? 'border-blue-400 bg-blue-50'
            : !isEmpty
              ? 'border-neutral-200 bg-white'
              : 'border-dashed border-neutral-300 bg-neutral-50'
        }
      `}
    >
      <div className="flex items-start gap-2 h-full">
        {/* Block Number & Drag Handle */}
        <div className="flex items-center gap-1 text-neutral-400 pt-0.5">
          <GripVertical className="w-4 h-4" />
          <span className="text-xs font-medium w-5">{index + 1}</span>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {/* Theme Content - BUG-P5 FIX: Show aufgaben list instead of just count */}
          {hasThema && (
            <div className="space-y-1">
              {/* Theme Header with remove button */}
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm text-neutral-900">{block.thema.name}</p>
                <button
                  type="button"
                  onClick={() => onRemoveThema(block.id)}
                  className="text-neutral-400 hover:text-red-500 p-1 transition-colors"
                  title="Thema entfernen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Aufgaben List - same style as individual aufgaben */}
              {themaAufgaben.length > 0 ? (
                themaAufgaben.map(aufgabe => (
                  <div key={aufgabe.id} className="flex items-center gap-2 group">
                    <div className="w-3 h-3 border border-neutral-300 rounded flex-shrink-0" />
                    <span className="text-sm text-neutral-700 flex-1">{aufgabe.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 italic">Keine Aufgaben</p>
              )}
            </div>
          )}

          {/* Individual Aufgaben Content */}
          {hasAufgaben && (
            <div className="space-y-1">
              {block.aufgaben.map(aufgabe => (
                <div key={aufgabe.id} className="flex items-center gap-2 group">
                  <div className="w-3 h-3 border border-neutral-300 rounded flex-shrink-0" />
                  <span className="text-sm text-neutral-700 flex-1">{aufgabe.name}</span>
                  <span className="text-xs text-neutral-400">{aufgabe.themaName}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveAufgabe(block.id, aufgabe.id)}
                    className="text-neutral-300 hover:text-red-500 p-0.5 transition-colors opacity-0 group-hover:opacity-100"
                    title="Aufgabe entfernen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {isEmpty && (
            <p className="text-sm text-neutral-400 italic pt-1">
              Thema oder Aufgaben hierher ziehen
            </p>
          )}
        </div>
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

  // Local state for RG selection
  const [activeRgIndex, setActiveRgIndex] = useState(0);
  const [, setDraggingItem] = useState(null); // Used only for drag state cleanup
  const [draggingBlockIndex, setDraggingBlockIndex] = useState(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState(null);

  // Current RG
  const currentRgId = selectedRechtsgebiete[activeRgIndex] || selectedRechtsgebiete[0];
  const currentRgLabel = RECHTSGEBIET_LABELS[currentRgId] || currentRgId;
  const rgGewichtung = rechtsgebieteGewichtung[currentRgId] || 0;

  // Calculate total blocks for this RG based on Gewichtung
  const learningDays = useMemo(() =>
    calculateLearningDays(startDate, endDate, bufferDays, vacationDays, weekStructure),
    [startDate, endDate, bufferDays, vacationDays, weekStructure]
  );

  const totalBlocksForRg = useMemo(() => {
    if (!rgGewichtung) return 0;
    return Math.floor(learningDays * blocksPerDay * (rgGewichtung / 100));
  }, [learningDays, blocksPerDay, rgGewichtung]);

  // Get all themes for current RG (across all URGs)
  const allThemesForRg = useMemo(() => {
    const themes = [];
    const urgs = unterrechtsgebieteDraft[currentRgId] || [];
    urgs.forEach(urg => {
      const urgThemes = themenDraft[urg.id] || [];
      urgThemes.forEach(theme => {
        themes.push({
          ...theme,
          urgId: urg.id,
          urgName: urg.name
        });
      });
    });
    return themes;
  }, [currentRgId, unterrechtsgebieteDraft, themenDraft]);

  // Current blocks for RG
  const currentBlocks = useMemo(() => {
    return lernbloeckeDraft[currentRgId] || [];
  }, [lernbloeckeDraft, currentRgId]);

  // Initialize blocks when component mounts or RG changes
  useEffect(() => {
    if (totalBlocksForRg > 0 && currentBlocks.length === 0) {
      // Create empty blocks based on Gewichtung
      const newBlocks = Array.from({ length: totalBlocksForRg }, (_, i) => ({
        id: `block-${currentRgId}-${i}-${Date.now()}`,
        thema: null,
        aufgaben: []
      }));
      updateWizardData({
        lernbloeckeDraft: { ...lernbloeckeDraft, [currentRgId]: newBlocks }
      });
    }
  }, [currentRgId, totalBlocksForRg, currentBlocks.length, lernbloeckeDraft, updateWizardData]);

  // Track which themes are fully assigned to blocks
  const assignedThemeIds = useMemo(() => {
    const assigned = new Map(); // themaId -> blockIndex
    currentBlocks.forEach((block, index) => {
      if (block.thema) {
        assigned.set(block.thema.id, index);
      }
    });
    return assigned;
  }, [currentBlocks]);

  // Track which individual aufgaben are assigned to blocks
  const assignedAufgabenIds = useMemo(() => {
    const assigned = new Map(); // aufgabeId -> blockIndex
    currentBlocks.forEach((block, index) => {
      (block.aufgaben || []).forEach(aufgabe => {
        assigned.set(aufgabe.id, index);
      });
    });
    return assigned;
  }, [currentBlocks]);

  // Stats
  const totalThemes = allThemesForRg.length;
  const totalAufgaben = allThemesForRg.reduce((sum, t) => sum + (t.aufgaben?.length || 0), 0);
  // BUG-P5 FIX: Use aufgaben array length instead of aufgabenCount
  const aufgabenAssigned = assignedAufgabenIds.size +
    currentBlocks.reduce((sum, b) => sum + (b.thema?.aufgaben?.length || 0), 0);
  const filledBlocks = currentBlocks.filter(b => b.thema || (b.aufgaben || []).length > 0).length;

  // === Drag & Drop Handlers ===

  // Start dragging theme or aufgabe
  const handleDragStart = (e, item) => {
    setDraggingItem(item);
    e.dataTransfer.setData('drag-type', item.type);
    e.dataTransfer.setData('drag-data', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drop item on block
  const handleDropOnBlock = useCallback((e, blockId) => {
    const dragType = e.dataTransfer.getData('drag-type');
    const dragDataStr = e.dataTransfer.getData('drag-data');

    if (!dragType || !dragDataStr) return;

    const dragData = JSON.parse(dragDataStr);

    const updatedBlocks = currentBlocks.map(block => {
      if (block.id !== blockId) return block;

      // If block already has a theme, don't allow anything
      if (block.thema) return block;

      if (dragType === 'thema') {
        // Dropping a theme: Only if block is empty
        if ((block.aufgaben || []).length > 0) return block;

        // BUG-P5 FIX: Store full aufgaben array directly in block.thema
        return {
          ...block,
          thema: {
            id: dragData.thema.id,
            name: dragData.thema.name,
            aufgaben: dragData.thema.aufgaben || [], // Full aufgaben array for display
            urgId: dragData.thema.urgId
          },
          aufgaben: []
        };
      } else if (dragType === 'aufgabe') {
        // Dropping an aufgabe: Add to aufgaben array
        // Check if already in this block
        if ((block.aufgaben || []).some(a => a.id === dragData.aufgabe.id)) {
          return block;
        }

        return {
          ...block,
          aufgaben: [
            ...(block.aufgaben || []),
            {
              id: dragData.aufgabe.id,
              name: dragData.aufgabe.name,
              themaId: dragData.themaId,
              themaName: dragData.themaName,
              urgId: dragData.urgId
            }
          ]
        };
      }

      return block;
    });

    // Remove aufgabe from previous block if it was assigned elsewhere
    if (dragType === 'aufgabe') {
      updatedBlocks.forEach(block => {
        if (block.id !== blockId && block.aufgaben) {
          block.aufgaben = block.aufgaben.filter(a => a.id !== dragData.aufgabe.id);
        }
      });
    }

    updateWizardData({
      lernbloeckeDraft: { ...lernbloeckeDraft, [currentRgId]: updatedBlocks }
    });
    setDraggingItem(null);
  }, [currentBlocks, lernbloeckeDraft, currentRgId, updateWizardData]);

  // Remove theme from block
  const handleRemoveThema = useCallback((blockId) => {
    const updatedBlocks = currentBlocks.map(block => {
      if (block.id === blockId) {
        return { ...block, thema: null };
      }
      return block;
    });
    updateWizardData({
      lernbloeckeDraft: { ...lernbloeckeDraft, [currentRgId]: updatedBlocks }
    });
  }, [currentBlocks, lernbloeckeDraft, currentRgId, updateWizardData]);

  // Remove individual aufgabe from block
  const handleRemoveAufgabe = useCallback((blockId, aufgabeId) => {
    const updatedBlocks = currentBlocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          aufgaben: (block.aufgaben || []).filter(a => a.id !== aufgabeId)
        };
      }
      return block;
    });
    updateWizardData({
      lernbloeckeDraft: { ...lernbloeckeDraft, [currentRgId]: updatedBlocks }
    });
  }, [currentBlocks, lernbloeckeDraft, currentRgId, updateWizardData]);

  // Block reordering drag handlers
  const handleBlockDragStart = (e, index) => {
    setDraggingBlockIndex(index);
    e.dataTransfer.setData('block-index', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleBlockDragOver = (e, index) => {
    e.preventDefault();
    if (draggingBlockIndex !== null && draggingBlockIndex !== index) {
      setDragOverBlockIndex(index);
    }
  };

  const handleBlockDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('block-index'), 10);

    if (isNaN(sourceIndex) || sourceIndex === targetIndex) {
      setDraggingBlockIndex(null);
      setDragOverBlockIndex(null);
      return;
    }

    // Reorder blocks
    const newBlocks = [...currentBlocks];
    const [movedBlock] = newBlocks.splice(sourceIndex, 1);
    newBlocks.splice(targetIndex, 0, movedBlock);

    updateWizardData({
      lernbloeckeDraft: { ...lernbloeckeDraft, [currentRgId]: newBlocks }
    });

    setDraggingBlockIndex(null);
    setDragOverBlockIndex(null);
  }, [currentBlocks, lernbloeckeDraft, currentRgId, updateWizardData]);

  // Reset all assignments for current RG
  const handleReset = () => {
    const resetBlocks = currentBlocks.map(block => ({
      ...block,
      thema: null,
      aufgaben: []
    }));
    updateWizardData({
      lernbloeckeDraft: { ...lernbloeckeDraft, [currentRgId]: resetBlocks }
    });
  };

  // Handle RG change
  const handleRgChange = (newIndex) => {
    setActiveRgIndex(newIndex);
    setDraggingItem(null);
    setDraggingBlockIndex(null);
    setDragOverBlockIndex(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* RG Tabs */}
      <div className="mb-4 flex items-center justify-center gap-2">
        {selectedRechtsgebiete.map((rgId, index) => {
          const label = RECHTSGEBIET_LABELS[rgId] || rgId;
          const isCurrent = index === activeRgIndex;
          const rgBlocks = lernbloeckeDraft[rgId] || [];
          const rgFilled = rgBlocks.filter(b => b.thema || (b.aufgaben || []).length > 0).length;
          const rgTotal = rgBlocks.length;

          return (
            <button
              key={rgId}
              type="button"
              onClick={() => handleRgChange(index)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isCurrent
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {label}
              {rgTotal > 0 && (
                <span className={`ml-1.5 ${isCurrent ? 'text-primary-200' : 'text-neutral-400'}`}>
                  ({rgFilled}/{rgTotal})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-light text-neutral-900">
          Lernblöcke für {currentRgLabel}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Ziehe ganze Themen oder einzelne Aufgaben in die Blöcke.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="px-4 py-1.5 bg-white rounded-full border border-neutral-200 text-sm">
          Gewichtung: <span className="font-medium">{rgGewichtung}%</span>
        </div>
        <div className="px-4 py-1.5 bg-white rounded-full border border-neutral-200 text-sm">
          Aufgaben: <span className="font-medium">{aufgabenAssigned}/{totalAufgaben}</span>
        </div>
        <div className="px-4 py-1.5 bg-white rounded-full border border-neutral-200 text-sm">
          Blöcke: <span className="font-medium">{filledBlocks}/{currentBlocks.length}</span>
        </div>

        {/* Reset Button */}
        {filledBlocks > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Hints */}
      {totalAufgaben === 0 && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Keine Themen vorhanden. Gehe zurück zu Schritt 12 um Themen hinzuzufügen.
          </p>
        </div>
      )}

      {currentBlocks.length - filledBlocks > 0 && filledBlocks > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            <span className="font-medium">{currentBlocks.length - filledBlocks} {(currentBlocks.length - filledBlocks) === 1 ? 'Block' : 'Blöcke'}</span> noch frei.
          </p>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
        {/* Left Column: Themes (Collapsible) */}
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-medium text-neutral-700 mb-3">
            Meine Themen ({totalThemes})
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {allThemesForRg.length > 0 ? (
              allThemesForRg.map(thema => (
                <ThemeCard
                  key={thema.id}
                  thema={thema}
                  isFullyAssigned={assignedThemeIds.has(thema.id)}
                  assignedBlockIndex={assignedThemeIds.get(thema.id)}
                  assignedAufgabenMap={assignedAufgabenIds}
                  onDragStart={handleDragStart}
                />
              ))
            ) : (
              <div className="p-6 bg-neutral-50 rounded-lg text-center text-neutral-500 text-sm">
                Keine Themen vorhanden.
                <br />
                <span className="text-xs">Gehe zurück zu Schritt 12.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Blocks */}
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-medium text-neutral-700 mb-3">
            Lernblöcke ({currentBlocks.length})
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {currentBlocks.length > 0 ? (
              currentBlocks.map((block, index) => (
                <LernblockCard
                  key={block.id}
                  block={block}
                  index={index}
                  onDrop={handleDropOnBlock}
                  onRemoveThema={handleRemoveThema}
                  onRemoveAufgabe={handleRemoveAufgabe}
                  onBlockDragStart={handleBlockDragStart}
                  onBlockDragOver={handleBlockDragOver}
                  onBlockDrop={handleBlockDrop}
                  isDragOverBlock={dragOverBlockIndex === index}
                />
              ))
            ) : totalBlocksForRg === 0 ? (
              <div className="p-6 bg-amber-50 rounded-lg text-center border border-amber-200">
                <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-amber-800 font-medium">Keine Blöcke verfügbar</p>
                <p className="text-xs text-amber-700 mt-1">
                  Setze in Schritt 14 eine Gewichtung für {currentRgLabel}.
                </p>
              </div>
            ) : (
              <div className="p-6 bg-neutral-50 rounded-lg text-center text-neutral-500 text-sm">
                Blöcke werden geladen...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step15Lernbloecke;
