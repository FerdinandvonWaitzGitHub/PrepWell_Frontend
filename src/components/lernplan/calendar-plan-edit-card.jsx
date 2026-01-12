import { useState, useMemo, useCallback } from 'react';
import { ChevronDownIcon, PlusIcon } from '../ui';
import { useCalendar } from '../../contexts/calendar-context';
import { useUnterrechtsgebiete } from '../../contexts/unterrechtsgebiete-context';
import RuleViolationDialog from './rule-violation-dialog';
import { checkRuleViolations, redistributeBlocks } from '../../utils/lernplan-rules';
import { getRechtsgebietColor } from '../../utils/rechtsgebiet-colors';

/**
 * CalendarPlanEditCard - Editor for Wizard-created Lernpläne
 *
 * Hierarchical structure (5 levels):
 * Lernplan-Karte [expandable]
 * └── Rechtsgebiet [expandable]
 *     └── Unterrechtsgebiet [expandable]
 *         └── Block (filled OR placeholder '+') [expandable]
 *             └── Thema [expandable]
 *                 └── Aufgaben
 *
 * Features:
 * - Block budget system based on rechtsgebieteGewichtung
 * - Empty blocks shown as placeholders with '+' button
 * - Explicit "Speichern" button triggers rule validation
 * - Protected past/completed blocks from re-sorting
 */
const CalendarPlanEditCard = ({
  isExpanded,
  onToggleExpand,
  onSave,
  onCancel,
}) => {
  const {
    blocksByDate,
    lernplanMetadata,
    updateDayBlocks,
    updateLernplanMetadata,
  } = useCalendar();

  const { RECHTSGEBIET_LABELS, getUnterrechtsgebieteByRechtsgebiet } = useUnterrechtsgebiete();

  // Local state for pending changes
  const [pendingChanges, setPendingChanges] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // UI State
  const [expandedRechtsgebiete, setExpandedRechtsgebiete] = useState(new Set());
  const [expandedUnterrechtsgebiete, setExpandedUnterrechtsgebiete] = useState(new Set());
  const [expandedBlocks, setExpandedBlocks] = useState(new Set());
  const [expandedThemen, setExpandedThemen] = useState(new Set());

  // Dialog state for adding theme to empty block
  const [addThemaDialog, setAddThemaDialog] = useState(null);

  // Rule violation dialog state
  const [ruleViolationDialog, setRuleViolationDialog] = useState({ isOpen: false, violations: [] });

  // Get today's date for past/future comparison
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // T-SET-1: getRechtsgebietColor imported from utils/rechtsgebiet-colors.js

  /**
   * Group blocks by hierarchy: RG → URG → Blocks
   * Also calculates budget and availability per RG
   *
   * Rules:
   * 1. Filter out vacation/buffer/private blocks (only show lernblocks)
   * 2. Filled blocks: Assign to their RG/URG
   * 3. Empty blocks: Distribute proportionally by rechtsgebieteGewichtung
   */
  const hierarchyData = useMemo(() => {
    if (!blocksByDate || !lernplanMetadata) {
      return { rechtsgebiete: [], totalBlocks: 0, budgetByRg: {} };
    }

    const hierarchy = {};
    const gewichtung = lernplanMetadata.rechtsgebieteGewichtung || {};
    const selectedRgs = lernplanMetadata.selectedRechtsgebiete || [];

    // Helper to get URG name from context or block
    const getUrgName = (urgId, rgId) => {
      if (!urgId) return 'Nicht zugeordnet';
      const urgs = getUnterrechtsgebieteByRechtsgebiet?.(rgId) || [];
      const found = urgs.find(u => u.id === urgId);
      if (found) return found.name;
      return urgId;
    };

    // Initialize hierarchy for each selected RG
    selectedRgs.forEach(rg => {
      const rgId = typeof rg === 'string' ? rg : rg.id;
      hierarchy[rgId] = {
        id: rgId,
        name: RECHTSGEBIET_LABELS[rgId] || rgId,
        unterrechtsgebiete: {},
        filledBlocks: 0,
        emptyBlocks: 0,
        unassignedBlocks: [],
      };
    });

    // Collect all learning blocks (filter out vacation/buffer/private)
    const filledBlocks = [];
    const emptyBlocks = [];

    Object.entries(blocksByDate).forEach(([dateKey, blocks]) => {
      const blockDate = new Date(dateKey + 'T12:00:00');
      const isPast = blockDate < today;

      blocks.forEach(block => {
        // Skip non-learning blocks (vacation, buffer, private)
        const blockType = block.blockType || 'lernblock';
        if (blockType === 'vacation' || blockType === 'buffer' || blockType === 'private') {
          return;
        }
        if (block.isVacationDay || block.isBufferDay) {
          return;
        }

        const blockData = {
          ...block,
          date: dateKey,
          isPast: isPast || block.completed,
          isFilled: !!block.topicTitle,
        };

        if (block.topicTitle) {
          filledBlocks.push(blockData);
        } else {
          emptyBlocks.push(blockData);
        }
      });
    });

    const totalLernblocks = filledBlocks.length + emptyBlocks.length;

    // Step 1: Assign filled blocks to their RG/URG
    filledBlocks.forEach(block => {
      const rgId = block.rechtsgebiet || block.metadata?.rgId;
      // Check all possible locations for URG ID:
      // - block.thema?.urgId (wizard Step 12/15 stores it here)
      // - block.metadata?.urgId (if migrated)
      // - block.unterrechtsgebiet (legacy/alternative storage)
      const urgId = block.thema?.urgId || block.metadata?.urgId || block.unterrechtsgebiet;

      if (!rgId) return; // Skip blocks without RG

      // Initialize RG if needed
      if (!hierarchy[rgId]) {
        hierarchy[rgId] = {
          id: rgId,
          name: RECHTSGEBIET_LABELS[rgId] || rgId,
          unterrechtsgebiete: {},
          filledBlocks: 0,
          emptyBlocks: 0,
          unassignedBlocks: [],
        };
      }

      hierarchy[rgId].filledBlocks++;

      if (urgId) {
        if (!hierarchy[rgId].unterrechtsgebiete[urgId]) {
          hierarchy[rgId].unterrechtsgebiete[urgId] = {
            id: urgId,
            name: getUrgName(urgId, rgId),
            blocks: [],
          };
        }
        // Add resolved URG name to block for display
        const blockWithUrgName = {
          ...block,
          resolvedUrgName: getUrgName(urgId, rgId),
        };
        hierarchy[rgId].unterrechtsgebiete[urgId].blocks.push(blockWithUrgName);
      } else {
        // For blocks without URG, try to look up name from all possible sources
        const possibleUrgId = block.thema?.urgId || block.metadata?.urgId || block.unterrechtsgebiet;
        const resolvedName = possibleUrgId ? getUrgName(possibleUrgId, rgId) : null;
        const blockWithUrgName = {
          ...block,
          resolvedUrgName: resolvedName,
        };
        hierarchy[rgId].unassignedBlocks.push(blockWithUrgName);
      }
    });

    // Step 2: Distribute empty blocks proportionally by gewichtung
    // Calculate how many empty blocks each RG should get
    const rgIds = Object.keys(gewichtung);
    const emptyBlockBudget = {};
    let assignedEmpty = 0;

    rgIds.forEach(rgId => {
      const percent = gewichtung[rgId] || 0;
      const budget = Math.round(emptyBlocks.length * (percent / 100));
      emptyBlockBudget[rgId] = budget;
      assignedEmpty += budget;
    });

    // Handle rounding errors - give remaining to first RG
    if (assignedEmpty < emptyBlocks.length && rgIds.length > 0) {
      emptyBlockBudget[rgIds[0]] += (emptyBlocks.length - assignedEmpty);
    }

    // Assign empty blocks to RGs based on budget
    let emptyBlockIndex = 0;
    rgIds.forEach(rgId => {
      const budget = emptyBlockBudget[rgId] || 0;

      // Initialize RG if needed
      if (!hierarchy[rgId]) {
        hierarchy[rgId] = {
          id: rgId,
          name: RECHTSGEBIET_LABELS[rgId] || rgId,
          unterrechtsgebiete: {},
          filledBlocks: 0,
          emptyBlocks: 0,
          unassignedBlocks: [],
        };
      }

      for (let i = 0; i < budget && emptyBlockIndex < emptyBlocks.length; i++) {
        const block = emptyBlocks[emptyBlockIndex];
        // Mark block with assigned RG for display
        const assignedBlock = { ...block, assignedRgId: rgId };
        hierarchy[rgId].unassignedBlocks.push(assignedBlock);
        hierarchy[rgId].emptyBlocks++;
        emptyBlockIndex++;
      }
    });

    // Calculate budget per RG (for display)
    const budgetByRg = {};
    Object.entries(gewichtung).forEach(([rgId, percent]) => {
      const budgetedBlocks = Math.round(totalLernblocks * (percent / 100));
      const filledCount = hierarchy[rgId]?.filledBlocks || 0;
      const available = budgetedBlocks - filledCount;

      budgetByRg[rgId] = {
        budget: budgetedBlocks,
        used: filledCount,
        available: available,
        percent: percent,
        isOverBudget: available < 0,
      };
    });

    // Convert hierarchy object to array
    const rechtsgebieteArray = Object.values(hierarchy).map(rg => ({
      ...rg,
      unterrechtsgebiete: Object.values(rg.unterrechtsgebiete),
    }));

    return {
      rechtsgebiete: rechtsgebieteArray,
      totalBlocks: totalLernblocks,
      budgetByRg,
    };
  }, [blocksByDate, lernplanMetadata, RECHTSGEBIET_LABELS, today, getUnterrechtsgebieteByRechtsgebiet]);

  // Toggle functions for expandable sections
  const toggleRechtsgebiet = (id) => {
    setExpandedRechtsgebiete(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleUnterrechtsgebiet = (id) => {
    setExpandedUnterrechtsgebiete(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleBlock = (id) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleThema = (id) => {
    setExpandedThemen(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /**
   * Handle filling empty block(s) with a new theme
   * Supports multi-block themes (groupSize > 1)
   */
  const handleFillEmptyBlock = useCallback((clickedBlock, themaData, availableEmptyBlocks = []) => {
    const blockCount = themaData.blockCount || 1;
    const now = new Date().toISOString();

    // Generate group ID for multi-block themes
    const groupId = blockCount > 1
      ? `theme-group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      : null;

    // Get blocks to fill: clicked block + next (blockCount-1) empty blocks
    const blocksToFill = [clickedBlock];

    if (blockCount > 1 && availableEmptyBlocks.length > 0) {
      // Sort available empty blocks by date, then position
      const sortedEmpty = [...availableEmptyBlocks]
        .filter(b => b.id !== clickedBlock.id && !b.isFilled)
        .sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return (a.position || 0) - (b.position || 0);
        });

      // Find clicked block's position in the timeline
      const clickedDate = clickedBlock.date;
      const clickedPos = clickedBlock.position || 0;

      // Take next (blockCount - 1) blocks after clicked block
      let added = 0;
      for (const block of sortedEmpty) {
        if (added >= blockCount - 1) break;

        // Only take blocks that come after or on the same day
        if (block.date > clickedDate ||
            (block.date === clickedDate && (block.position || 0) > clickedPos)) {
          blocksToFill.push(block);
          added++;
        }
      }
    }

    // Group blocks by date for efficient updates
    const blocksByDateToUpdate = {};
    blocksToFill.forEach((block, index) => {
      if (!blocksByDateToUpdate[block.date]) {
        blocksByDateToUpdate[block.date] = [];
      }
      blocksByDateToUpdate[block.date].push({
        block,
        groupIndex: index,
        groupSize: blocksToFill.length,
      });
    });

    // Apply updates
    const newPendingChanges = { ...pendingChanges };

    Object.entries(blocksByDateToUpdate).forEach(([dateKey, blocksInfo]) => {
      const currentBlocks = newPendingChanges[dateKey] || blocksByDate[dateKey] || [];

      const updatedBlocks = currentBlocks.map(b => {
        const matchInfo = blocksInfo.find(info => info.block.id === b.id);
        if (matchInfo) {
          return {
            ...b,
            topicTitle: themaData.title,
            tasks: themaData?.aufgaben || [],
            unterrechtsgebiet: themaData.unterrechtsgebietId || b.unterrechtsgebiet,
            // Store URG name in metadata for display
            metadata: {
              ...b.metadata,
              urgId: themaData.unterrechtsgebietId || b.metadata?.urgId,
              urgName: themaData.unterrechtsgebietName || b.metadata?.urgName,
            },
            // Multi-block grouping info
            groupId: groupId,
            groupSize: matchInfo.groupSize,
            groupIndex: matchInfo.groupIndex,
            updatedAt: now,
          };
        }
        return b;
      });

      newPendingChanges[dateKey] = updatedBlocks;
    });

    setPendingChanges(newPendingChanges);
    setHasChanges(true);
  }, [blocksByDate, pendingChanges]);

  /**
   * Handle updating an existing block
   */
  const handleUpdateBlock = useCallback((block, updates) => {
    const dateKey = block.date;
    const currentBlocks = pendingChanges[dateKey] || blocksByDate[dateKey] || [];

    const updatedBlocks = currentBlocks.map(b => {
      if (b.id === block.id) {
        return { ...b, ...updates, updatedAt: new Date().toISOString() };
      }
      return b;
    });

    setPendingChanges(prev => ({
      ...prev,
      [dateKey]: updatedBlocks,
    }));
    setHasChanges(true);
  }, [blocksByDate, pendingChanges]);

  /**
   * Handle adding a task to a block
   */
  const handleAddTask = useCallback((block, taskData) => {
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: taskData.title || '',
      completed: false,
    };

    handleUpdateBlock(block, {
      tasks: [...(block.tasks || []), newTask],
    });
  }, [handleUpdateBlock]);

  /**
   * Handle toggling task completion
   */
  const handleToggleTask = useCallback((block, taskId) => {
    const updatedTasks = (block.tasks || []).map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    handleUpdateBlock(block, { tasks: updatedTasks });
  }, [handleUpdateBlock]);

  /**
   * Handle deleting a task
   */
  const handleDeleteTask = useCallback((block, taskId) => {
    const updatedTasks = (block.tasks || []).filter(t => t.id !== taskId);
    handleUpdateBlock(block, { tasks: updatedTasks });
  }, [handleUpdateBlock]);

  /**
   * Save all pending changes
   */
  const handleSave = useCallback(async () => {
    // Merge pending changes with current blocks for violation check
    const mergedBlocks = { ...blocksByDate };
    Object.entries(pendingChanges).forEach(([dateKey, blocks]) => {
      mergedBlocks[dateKey] = blocks;
    });

    const violations = checkRuleViolations(mergedBlocks, lernplanMetadata);

    if (violations.length > 0) {
      // Show dialog for user to decide
      setRuleViolationDialog({ isOpen: true, violations });
      return;
    }

    // No violations - save directly
    await doSave();
  }, [pendingChanges, blocksByDate, lernplanMetadata]);

  /**
   * Actually perform the save
   */
  const doSave = useCallback(async () => {
    // Apply all pending changes
    for (const [dateKey, blocks] of Object.entries(pendingChanges)) {
      await updateDayBlocks(dateKey, blocks);
    }

    setPendingChanges({});
    setHasChanges(false);
    setRuleViolationDialog({ isOpen: false, violations: [] });
    onSave?.();
  }, [pendingChanges, updateDayBlocks, onSave]);

  /**
   * Handle redistribute from dialog
   */
  const handleRedistribute = useCallback(async () => {
    // Merge pending changes with current blocks
    const mergedBlocks = { ...blocksByDate };
    Object.entries(pendingChanges).forEach(([dateKey, blocks]) => {
      mergedBlocks[dateKey] = blocks;
    });

    // Redistribute blocks
    const redistributed = redistributeBlocks(mergedBlocks, lernplanMetadata);

    // Apply redistributed blocks
    for (const [dateKey, blocks] of Object.entries(redistributed)) {
      await updateDayBlocks(dateKey, blocks);
    }

    setPendingChanges({});
    setHasChanges(false);
    setRuleViolationDialog({ isOpen: false, violations: [] });
    onSave?.();
  }, [blocksByDate, pendingChanges, lernplanMetadata, updateDayBlocks, onSave]);

  /**
   * Handle ignore from dialog
   */
  const handleIgnoreViolations = useCallback(async () => {
    await doSave();
  }, [doSave]);

  /**
   * Cancel all pending changes
   */
  const handleCancel = useCallback(() => {
    setPendingChanges({});
    setHasChanges(false);
    onCancel?.();
  }, [onCancel]);

  // If no active plan, show placeholder
  if (!lernplanMetadata) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center">
        <p className="text-neutral-500">Kein aktiver Kalender-Lernplan vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center h-[70px] px-4 cursor-pointer hover:bg-neutral-50"
        onClick={() => onToggleExpand?.()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
          className="p-1.5 mr-3 text-neutral-500 hover:bg-neutral-100 rounded transition-colors"
        >
          <ChevronDownIcon size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <span className="px-2 py-0.5 text-xs font-medium rounded bg-primary-100 text-primary-700 mr-3">
          Kalender-Lernplan
        </span>

        <h3 className="flex-1 text-base font-medium text-neutral-900">
          {lernplanMetadata.name || 'Lernplan'}
        </h3>

        {/* Budget Overview */}
        <div className="flex items-center gap-2 mr-4">
          {Object.entries(hierarchyData.budgetByRg).map(([rgId, budget]) => (
            <div
              key={rgId}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                budget.isOverBudget ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-600'
              }`}
              title={`${RECHTSGEBIET_LABELS[rgId]}: ${budget.used}/${budget.budget} Blöcke (${budget.percent}%)`}
            >
              <span className={`w-2 h-2 rounded-full ${getRechtsgebietColor(rgId).badge}`} />
              <span>{budget.used}/{budget.budget}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {hasChanges && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              className="px-3 py-1.5 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
            >
              Speichern
            </button>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-neutral-100 bg-neutral-50 p-4">
          {/* Plan Info */}
          <div className="flex items-center gap-4 mb-4 text-sm text-neutral-600">
            <span>
              {lernplanMetadata.startDate && lernplanMetadata.endDate && (
                <>
                  {new Date(lernplanMetadata.startDate).toLocaleDateString('de-DE')} -{' '}
                  {new Date(lernplanMetadata.endDate).toLocaleDateString('de-DE')}
                </>
              )}
            </span>
            <span>{hierarchyData.totalBlocks} Blöcke</span>
            {lernplanMetadata.verteilungsmodus && (
              <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs">
                {lernplanMetadata.verteilungsmodus === 'gemischt' ? 'Gemischt' :
                 lernplanMetadata.verteilungsmodus === 'fokussiert' ? 'Fokussiert' :
                 lernplanMetadata.verteilungsmodus === 'themenweise' ? 'Themenweise' :
                 lernplanMetadata.verteilungsmodus}
              </span>
            )}
          </div>

          {/* Rechtsgebiete List */}
          {hierarchyData.rechtsgebiete.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4 text-center">
              Keine Blöcke im Lernplan
            </p>
          ) : (
            <div className="space-y-3">
              {hierarchyData.rechtsgebiete.map(rg => (
                <RechtsgebietSection
                  key={rg.id}
                  rechtsgebiet={rg}
                  colors={getRechtsgebietColor(rg.id)}
                  budget={hierarchyData.budgetByRg[rg.id]}
                  isExpanded={expandedRechtsgebiete.has(rg.id)}
                  onToggle={() => toggleRechtsgebiet(rg.id)}
                  expandedUnterrechtsgebiete={expandedUnterrechtsgebiete}
                  toggleUnterrechtsgebiet={toggleUnterrechtsgebiet}
                  expandedBlocks={expandedBlocks}
                  toggleBlock={toggleBlock}
                  expandedThemen={expandedThemen}
                  toggleThema={toggleThema}
                  onFillEmptyBlock={(block, emptyBlocksInRg) => setAddThemaDialog({ block, rgId: rg.id, emptyBlocksInRg })}
                  onUpdateBlock={handleUpdateBlock}
                  onAddTask={handleAddTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Thema Dialog */}
      {addThemaDialog && (
        <AddThemaDialog
          block={addThemaDialog.block}
          rgId={addThemaDialog.rgId}
          unterrechtsgebiete={getUnterrechtsgebieteByRechtsgebiet?.(addThemaDialog.rgId) || []}
          availableEmptyBlocks={addThemaDialog.emptyBlocksInRg?.length || 1}
          onConfirm={(themaData) => {
            handleFillEmptyBlock(addThemaDialog.block, themaData, addThemaDialog.emptyBlocksInRg || []);
            setAddThemaDialog(null);
          }}
          onClose={() => setAddThemaDialog(null)}
        />
      )}

      {/* Rule Violation Dialog */}
      <RuleViolationDialog
        isOpen={ruleViolationDialog.isOpen}
        violations={ruleViolationDialog.violations}
        onRedistribute={handleRedistribute}
        onIgnore={handleIgnoreViolations}
        onCancel={() => setRuleViolationDialog({ isOpen: false, violations: [] })}
      />
    </div>
  );
};

/**
 * RechtsgebietSection - Expandable Rechtsgebiet with URGs
 */
const RechtsgebietSection = ({
  rechtsgebiet,
  colors,
  budget,
  isExpanded,
  onToggle,
  expandedUnterrechtsgebiete,
  toggleUnterrechtsgebiet,
  expandedBlocks,
  toggleBlock,
  expandedThemen,
  toggleThema,
  onFillEmptyBlock,
  onUpdateBlock,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) => {
  return (
    <div className={`rounded-lg border ${colors.border} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 ${colors.bg}`}>
        <div className="flex items-center">
          <button onClick={onToggle} className="p-1 mr-2 hover:bg-white/50 rounded">
            <ChevronDownIcon size={16} className={`${colors.text} transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          <span className={`font-medium ${colors.text}`}>{rechtsgebiet?.name || 'Rechtsgebiet'}</span>
        </div>

        {/* Budget Badge */}
        {budget && (
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${
            budget.isOverBudget ? 'bg-red-100 text-red-700' : 'bg-white/60 text-neutral-600'
          }`}>
            <span>{budget.used}/{budget.budget}</span>
            <span>({budget.percent}%)</span>
            {budget.isOverBudget && (
              <span className="text-red-600" title="Budget überschritten">!</span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="bg-white p-3">
          {/* Show URGs if any */}
          {rechtsgebiet.unterrechtsgebiete.length > 0 && (
            <div className="space-y-2">
              {rechtsgebiet.unterrechtsgebiete.map(urg => (
                <UnterrechtsgebietSection
                  key={urg.id}
                  unterrechtsgebiet={urg}
                  isExpanded={expandedUnterrechtsgebiete.has(urg.id)}
                  onToggle={() => toggleUnterrechtsgebiet(urg.id)}
                  expandedBlocks={expandedBlocks}
                  toggleBlock={toggleBlock}
                  expandedThemen={expandedThemen}
                  toggleThema={toggleThema}
                  onFillEmptyBlock={onFillEmptyBlock}
                  onUpdateBlock={onUpdateBlock}
                  onAddTask={onAddTask}
                  onToggleTask={onToggleTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
            </div>
          )}

          {/* Show unassigned blocks (blocks without URG) */}
          {rechtsgebiet.unassignedBlocks && rechtsgebiet.unassignedBlocks.length > 0 && (() => {
            // Get all empty blocks in this RG for multi-block theme support
            const emptyBlocksInRg = rechtsgebiet.unassignedBlocks.filter(b => !b.isFilled && !b.isPast);

            return (
              <div className={rechtsgebiet.unterrechtsgebiete.length > 0 ? 'mt-3' : ''}>
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-neutral-100 border-b border-neutral-200">
                    <span className="text-sm font-medium text-neutral-600">
                      Nicht zugeordnete Blöcke ({rechtsgebiet.unassignedBlocks.length})
                    </span>
                  </div>
                  <div className="bg-white p-3 space-y-2">
                    {rechtsgebiet.unassignedBlocks.map(block => (
                      <BlockCard
                        key={block.id}
                        block={block}
                        isExpanded={expandedBlocks.has(block.id)}
                        onToggle={() => toggleBlock(block.id)}
                        expandedThemen={expandedThemen}
                        toggleThema={toggleThema}
                        onFillEmptyBlock={onFillEmptyBlock}
                        onUpdateBlock={onUpdateBlock}
                        onAddTask={onAddTask}
                        onToggleTask={onToggleTask}
                        onDeleteTask={onDeleteTask}
                        emptyBlocksInRg={emptyBlocksInRg}
                        urgName={block.resolvedUrgName || block.metadata?.urgName || null}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Show message only if no URGs AND no unassigned blocks */}
          {rechtsgebiet.unterrechtsgebiete.length === 0 &&
           (!rechtsgebiet.unassignedBlocks || rechtsgebiet.unassignedBlocks.length === 0) && (
            <p className="text-xs text-neutral-400 py-2">Keine Blöcke in diesem Rechtsgebiet</p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * UnterrechtsgebietSection - Expandable URG with Blocks
 */
const UnterrechtsgebietSection = ({
  unterrechtsgebiet,
  isExpanded,
  onToggle,
  expandedBlocks,
  toggleBlock,
  expandedThemen,
  toggleThema,
  onFillEmptyBlock,
  onUpdateBlock,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) => {
  const filledCount = unterrechtsgebiet.blocks.filter(b => b.isFilled).length;
  const totalCount = unterrechtsgebiet.blocks.length;

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-neutral-50">
        <div className="flex items-center">
          <button onClick={onToggle} className="p-1 mr-2 hover:bg-neutral-200 rounded">
            <ChevronDownIcon size={14} className={`text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          <span className="text-sm font-medium text-neutral-700">{unterrechtsgebiet?.name || 'Unterrechtsgebiet'}</span>
        </div>
        <span className="text-xs text-neutral-500">{filledCount}/{totalCount} Blöcke</span>
      </div>

      {/* Content: Blocks */}
      {isExpanded && (
        <div className="bg-white p-3 space-y-2">
          {unterrechtsgebiet.blocks.map(block => (
            <BlockCard
              key={block.id}
              block={block}
              isExpanded={expandedBlocks.has(block.id)}
              onToggle={() => toggleBlock(block.id)}
              expandedThemen={expandedThemen}
              toggleThema={toggleThema}
              onFillEmptyBlock={onFillEmptyBlock}
              onUpdateBlock={onUpdateBlock}
              onAddTask={onAddTask}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
              urgName={block.resolvedUrgName || unterrechtsgebiet.name}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * BlockCard - Single block (filled or empty placeholder)
 * Supports multi-block themes with groupSize/groupIndex
 */
const BlockCard = ({
  block,
  isExpanded,
  onToggle,
  expandedThemen,
  toggleThema,
  onFillEmptyBlock,
  onUpdateBlock,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  emptyBlocksInRg = [],
  urgName = null,
}) => {
  // Empty block placeholder
  if (!block.isFilled) {
    return (
      <div className="border border-dashed border-neutral-300 rounded-lg p-3 flex items-center justify-between bg-neutral-50/50">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <span>{new Date(block.date + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <span>Block {block.position}</span>
          {block.isPast && <span className="text-xs">(Vergangen)</span>}
        </div>
        {!block.isPast && (
          <button
            onClick={() => onFillEmptyBlock(block, emptyBlocksInRg)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
          >
            <PlusIcon size={12} />
            Thema hinzufügen
          </button>
        )}
      </div>
    );
  }

  // Multi-block theme indicator
  const isGrouped = block.groupSize && block.groupSize > 1;
  const groupLabel = isGrouped ? `${block.groupIndex + 1}/${block.groupSize}` : null;

  // Filled block
  return (
    <div className={`border rounded-lg overflow-hidden ${block.isPast ? 'border-neutral-200 bg-neutral-50' : isGrouped ? 'border-primary-300 border-l-4 border-l-primary-500' : 'border-neutral-300'}`}>
      {/* Block Header */}
      <div className="flex items-center px-3 py-2 bg-white">
        <button onClick={onToggle} className="p-1 mr-2 hover:bg-neutral-100 rounded">
          <ChevronDownIcon size={14} className={`text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex-1 min-w-0">
          {/* URG name above title */}
          {urgName && (
            <span className="text-xs text-neutral-400 block mb-0.5">{urgName}</span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-900 truncate">{block.topicTitle}</span>
            {/* Multi-block group indicator */}
            {isGrouped && (
              <span className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded font-medium">
                {groupLabel}
              </span>
            )}
            {block.isPast && (
              <span className="px-1.5 py-0.5 text-xs bg-neutral-100 text-neutral-500 rounded">
                {block.completed ? 'Erledigt' : 'Vergangen'}
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-500">
            {new Date(block.date + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' · Block '}
            {block.position}
          </span>
        </div>
        <span className="text-xs text-neutral-500">
          {(block.tasks || []).filter(t => t.completed).length}/{(block.tasks || []).length} Aufgaben
        </span>
      </div>

      {/* Expanded: Tasks */}
      {isExpanded && (
        <div className="border-t border-neutral-100 bg-neutral-50 p-3">
          {(block.tasks || []).length > 0 ? (
            <div className="space-y-1.5">
              {block.tasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  disabled={block.isPast}
                  onToggle={() => onToggleTask(block, task.id)}
                  onDelete={() => onDeleteTask(block, task.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 py-1">Keine Aufgaben</p>
          )}

          {/* Add Task Button */}
          {!block.isPast && (
            <button
              onClick={() => onAddTask(block, { title: '' })}
              className="flex items-center gap-1 px-2 py-1 mt-2 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
            >
              <PlusIcon size={10} />
              Aufgabe
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * TaskItem - Single task with checkbox
 */
const TaskItem = ({ task, disabled, onToggle, onDelete }) => {
  return (
    <div className="flex items-center gap-2 group">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={onToggle}
        disabled={disabled}
        className="w-3.5 h-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-400 disabled:opacity-50"
      />
      <span className={`flex-1 text-xs ${task.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
        {task.title || 'Aufgabe'}
      </span>
      {!disabled && (
        <button
          onClick={onDelete}
          className="p-0.5 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Löschen"
        >
          <TrashIcon size={10} />
        </button>
      )}
    </div>
  );
};

/**
 * AddThemaDialog - Dialog for adding a theme to an empty block
 * Supports multi-block themes (1-4 blocks)
 */
const AddThemaDialog = ({ block, rgId, unterrechtsgebiete, availableEmptyBlocks = 1, onConfirm, onClose }) => {
  const [title, setTitle] = useState('');
  const [selectedUrg, setSelectedUrg] = useState(block.unterrechtsgebiet || '');
  const [blockCount, setBlockCount] = useState(1);

  // Max blocks is limited by available empty blocks (including the clicked one)
  const maxBlocks = Math.min(4, availableEmptyBlocks);

  const handleSubmit = () => {
    if (!title.trim()) return;
    // Find URG name for the selected URG
    const selectedUrgData = unterrechtsgebiete.find(u => u.id === selectedUrg);
    onConfirm({
      title: title.trim(),
      unterrechtsgebietId: selectedUrg,
      unterrechtsgebietName: selectedUrgData?.name || null,
      aufgaben: [],
      blockCount: blockCount,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-lg shadow-xl p-4 w-96">
        <h4 className="text-sm font-medium text-neutral-900 mb-4">Thema hinzufügen</h4>

        <div className="space-y-3">
          {/* URG Selector */}
          {unterrechtsgebiete.length > 0 && (
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Unterrechtsgebiet</label>
              <select
                value={selectedUrg}
                onChange={(e) => setSelectedUrg(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">Auswählen...</option>
                {unterrechtsgebiete.filter(u => u).map(urg => (
                  <option key={urg.id} value={urg.id}>{urg?.name || 'Unterrechtsgebiet'}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Thema</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thema eingeben..."
              className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {/* Block Count Selector */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Anzahl Blöcke</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBlockCount(num)}
                  disabled={num > maxBlocks}
                  className={`
                    flex-1 py-2 text-sm font-medium rounded-lg border transition-colors
                    ${blockCount === num
                      ? 'bg-primary-600 text-white border-primary-600'
                      : num > maxBlocks
                        ? 'bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary-400'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
            {maxBlocks < 4 && (
              <p className="text-xs text-neutral-400 mt-1">
                Max. {maxBlocks} {maxBlocks === 1 ? 'Block' : 'Blöcke'} verfügbar
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-3 py-1.5 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg disabled:opacity-50"
          >
            {blockCount > 1 ? `${blockCount} Blöcke hinzufügen` : 'Hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Icons
const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export default CalendarPlanEditCard;
