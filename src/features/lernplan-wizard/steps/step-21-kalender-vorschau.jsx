import { useState, useMemo, useCallback } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { ChevronLeft, ChevronRight, RefreshCw, Info, Edit3, X, ArrowLeftRight, Undo2, Redo2, Lock, Unlock } from 'lucide-react';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS } from '../../../data/unterrechtsgebiete-data';

// ============================================
// SWAP VALIDATION LOGIC
// ============================================

/**
 * Validate if a swap is allowed based on verteilungsmodus
 * Returns: { allowed: boolean, status: 'green'|'yellow'|'red', message: string }
 */
const validateSwap = (
  sourceBlock,
  targetBlock,
  sourceDayDate,
  targetDayDate,
  calendarDays,
  verteilungsmodus,
  _rechtsgebieteGewichtung // Reserved for future use
) => {
  // Get day indices
  const sourceDayIdx = calendarDays.findIndex(d =>
    d.date.toDateString() === new Date(sourceDayDate).toDateString()
  );
  const targetDayIdx = calendarDays.findIndex(d =>
    d.date.toDateString() === new Date(targetDayDate).toDateString()
  );

  if (sourceDayIdx === -1 || targetDayIdx === -1) {
    return { allowed: false, status: 'red', message: 'Ungültige Tage' };
  }

  // Check if blocks are locked
  if (sourceBlock.isLocked || targetBlock.isLocked) {
    return { allowed: false, status: 'red', message: 'Gesperrte Blöcke können nicht verschoben werden' };
  }

  // MODE: GEMISCHT - Block-level swap, always allowed
  if (verteilungsmodus === 'gemischt') {
    // Check if swap affects balance significantly
    if (sourceBlock.rechtsgebiet !== targetBlock.rechtsgebiet) {
      return {
        allowed: true,
        status: 'yellow',
        message: 'Tausch ändert die RG-Balance leicht'
      };
    }
    return { allowed: true, status: 'green', message: 'Tausch möglich' };
  }

  // MODE: FOKUSSIERT - Day-level, check hard switch rule
  if (verteilungsmodus === 'fokussiert') {
    // If swapping within same day, always OK
    if (sourceDayIdx === targetDayIdx) {
      return { allowed: true, status: 'green', message: 'Tausch innerhalb des Tages möglich' };
    }

    // Get RGs of previous and next days after swap
    const getAdjacentRgs = (dayIdx) => {
      const prevDayRg = dayIdx > 0
        ? calendarDays[dayIdx - 1].blocks[0]?.rechtsgebiet
        : null;
      const nextDayRg = dayIdx < calendarDays.length - 1
        ? calendarDays[dayIdx + 1].blocks[0]?.rechtsgebiet
        : null;
      return { prevDayRg, nextDayRg };
    };

    // Simulate swap and check hard switch rule
    const sourceNewRg = targetBlock.rechtsgebiet;
    const targetNewRg = sourceBlock.rechtsgebiet;

    const sourceAdj = getAdjacentRgs(sourceDayIdx);
    const targetAdj = getAdjacentRgs(targetDayIdx);

    // Check if swap would violate hard switch rule
    const sourceViolates = sourceNewRg === sourceAdj.prevDayRg || sourceNewRg === sourceAdj.nextDayRg;
    const targetViolates = targetNewRg === targetAdj.prevDayRg || targetNewRg === targetAdj.nextDayRg;

    if (sourceViolates || targetViolates) {
      return {
        allowed: false,
        status: 'red',
        message: 'Tausch verletzt die Tageswechsel-Regel: Kein gleiches RG an aufeinanderfolgenden Tagen'
      };
    }

    return { allowed: true, status: 'green', message: 'Tausch möglich' };
  }

  // MODE: THEMENWEISE - Theme package swap, check contiguity
  if (verteilungsmodus === 'themenweise') {
    const sourceThemeId = sourceBlock.thema?.id || sourceBlock.originalBlockId;
    const targetThemeId = targetBlock.thema?.id || targetBlock.originalBlockId;

    // Same theme - always allowed (internal reorder)
    if (sourceThemeId === targetThemeId) {
      return { allowed: true, status: 'green', message: 'Interne Umsortierung möglich' };
    }

    // Different themes - check if swapping entire packages
    // For now, block individual block swaps between different themes
    return {
      allowed: false,
      status: 'red',
      message: 'Im Themenweise-Modus können nur ganze Themenpakete getauscht werden'
    };
  }

  return { allowed: true, status: 'green', message: 'Tausch möglich' };
};

/**
 * Step 21: Kalender-Vorschau
 * Shows a preview of the generated calendar with the distributed blocks.
 * User can regenerate or proceed to confirmation.
 *
 * UPDATED: Now correctly handles Step 15's data structure:
 * - block.thema (object) = whole theme assigned
 * - block.aufgaben (array) = individual tasks assigned
 */

/**
 * Convert Step 15 lernbloeckeDraft to a flat pool of distributable items
 * Handles both: whole themes (thema) and individual tasks (aufgaben)
 */
const flattenBlocksToPool = (lernbloeckeDraft, selectedRechtsgebiete) => {
  const pool = [];

  // Use selectedRechtsgebiete order if available
  const rgIds = selectedRechtsgebiete?.length > 0
    ? selectedRechtsgebiete
    : Object.keys(lernbloeckeDraft || {});

  rgIds.forEach(rgId => {
    const blocks = lernbloeckeDraft[rgId] || [];
    blocks.forEach(block => {
      // Check what content this block has
      const hasThema = block.thema !== null && block.thema !== undefined;
      const hasAufgaben = Array.isArray(block.aufgaben) && block.aufgaben.length > 0;

      if (hasThema) {
        // Block has a whole theme assigned
        pool.push({
          originalBlockId: block.id,
          rechtsgebiet: rgId,
          type: 'thema',
          thema: block.thema,
          displayName: block.thema.name,
          aufgabenCount: block.thema.aufgabenCount || 0,
        });
      } else if (hasAufgaben) {
        // Block has individual tasks assigned
        // TICKET-8 FIX: Defensive null check for aufgaben
        const aufgabenArray = block.aufgaben || [];
        pool.push({
          originalBlockId: block.id,
          rechtsgebiet: rgId,
          type: 'aufgaben',
          aufgaben: aufgabenArray,
          displayName: aufgabenArray.length === 1
            ? (aufgabenArray[0]?.name || 'Aufgabe')
            : `${aufgabenArray.length} Aufgaben`,
          aufgabenCount: aufgabenArray.length,
        });
      }
      // Empty blocks are not added to the pool
    });
  });

  return pool;
};

/**
 * Generate ordered block sequence for THEMENWEISE mode
 * - Theme packages are planned contiguously
 * - Selection is deficit-based at RG level (most remaining blocks first)
 * - Soft rule: avoid same RG twice in a row if alternatives exist
 */
const generateThemenweiseSequence = (blocksPerRg, rgIds) => {
  const sequence = [];

  // Create working copies of block arrays
  const remainingBlocks = {};
  rgIds.forEach(rgId => {
    remainingBlocks[rgId] = [...(blocksPerRg[rgId] || [])];
  });

  let lastRg = null;
  let hasMoreBlocks = true;

  while (hasMoreBlocks) {
    // Calculate remaining count per RG
    const remainingPerRg = {};
    rgIds.forEach(rgId => {
      remainingPerRg[rgId] = remainingBlocks[rgId].length;
    });

    // Find candidates: RGs with remaining blocks
    // Soft rule: prefer RGs that are NOT the same as last planned package
    let candidates = rgIds.filter(rgId =>
      remainingPerRg[rgId] > 0 && rgId !== lastRg
    );

    // Fallback: if no alternatives, allow same RG
    if (candidates.length === 0) {
      candidates = rgIds.filter(rgId => remainingPerRg[rgId] > 0);
    }

    // No more blocks to plan
    if (candidates.length === 0) {
      hasMoreBlocks = false;
      continue;
    }

    // Pick candidate with highest deficit (most remaining blocks)
    let bestRg = null;
    let bestRemaining = -1;
    for (const rgId of candidates) {
      if (remainingPerRg[rgId] > bestRemaining) {
        bestRemaining = remainingPerRg[rgId];
        bestRg = rgId;
      }
    }

    if (!bestRg || remainingBlocks[bestRg].length === 0) break;

    // Get next theme package from this RG
    const rgBlockList = remainingBlocks[bestRg];
    const firstBlock = rgBlockList[0];
    const themeId = firstBlock.thema?.id || firstBlock.originalBlockId;

    // Collect all blocks with same theme (contiguous package)
    const packageBlocks = [];
    while (rgBlockList.length > 0) {
      const block = rgBlockList[0];
      const blockThemeId = block.thema?.id || block.originalBlockId;

      // If theme ID matches, or it's the first block of package
      if (blockThemeId === themeId || packageBlocks.length === 0) {
        packageBlocks.push({ block, rgId: bestRg });
        rgBlockList.shift(); // Remove from remaining
      } else {
        break; // Theme changed, stop collecting
      }
    }

    // Add package to sequence
    sequence.push(...packageBlocks);
    lastRg = bestRg;
  }

  return sequence;
};

/**
 * Count total assigned items per RG
 */
const countAssignedPerRg = (lernbloeckeDraft, selectedRechtsgebiete) => {
  const counts = {};
  const rgIds = selectedRechtsgebiete?.length > 0
    ? selectedRechtsgebiete
    : Object.keys(lernbloeckeDraft || {});

  rgIds.forEach(rgId => {
    const blocks = lernbloeckeDraft[rgId] || [];
    let count = 0;
    blocks.forEach(block => {
      if (block.thema) {
        count += block.thema.aufgabenCount || 1;
      } else if (block.aufgaben?.length > 0) {
        count += (block.aufgaben || []).length;
      }
    });
    counts[rgId] = count;
  });

  return counts;
};

/**
 * Generate calendar data based on actual lernbloeckeDraft
 * Distributes blocks according to verteilungsmodus
 */
const generateCalendarFromBlocks = (
  startDate,
  endDate,
  weekStructure,
  lernbloeckeDraft,
  rechtsgebieteGewichtung,
  verteilungsmodus,
  selectedRechtsgebiete = []
) => {
  if (!startDate || !endDate) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = [];
  const weekdayMap = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];

  // Get RG IDs in order
  const rgIds = selectedRechtsgebiete?.length > 0
    ? selectedRechtsgebiete
    : Object.keys(lernbloeckeDraft || {}).length > 0
      ? Object.keys(lernbloeckeDraft)
      : Object.keys(rechtsgebieteGewichtung || {});

  if (rgIds.length === 0) {
    console.warn('generateCalendarFromBlocks: No Rechtsgebiete available');
    return [];
  }

  // Flatten blocks into distributable pool
  const blockPool = flattenBlocksToPool(lernbloeckeDraft, selectedRechtsgebiete);

  // If no assigned blocks, use RG-only distribution
  if (blockPool.length === 0) {
    return generateFallbackCalendar(
      start, end, weekStructure, rgIds, verteilungsmodus
    );
  }

  // Group blocks by RG for focused/themenweise modes
  const blocksPerRg = {};
  rgIds.forEach(rgId => {
    blocksPerRg[rgId] = blockPool.filter(b => b.rechtsgebiet === rgId);
  });

  // Track indices for distribution
  const rgBlockIndices = {};
  rgIds.forEach(rgId => { rgBlockIndices[rgId] = 0; });

  let poolIndex = 0;
  let currentDate = new Date(start);
  let dayCounter = 0;
  let currentRgIndex = 0;

  // For THEMENWEISE: Pre-generate ordered block sequence
  // This ensures theme packages are contiguous across day boundaries
  let themenweiseSequence = null;
  let themenweiseIndex = 0;

  if (verteilungsmodus === 'themenweise') {
    themenweiseSequence = generateThemenweiseSequence(blocksPerRg, rgIds);
  }

  while (currentDate <= end) {
    const weekday = weekdayMap[currentDate.getDay()];
    const dayStructure = weekStructure?.[weekday] || [];
    const lernblockCount = dayStructure.filter(b => b === 'lernblock').length;

    if (lernblockCount > 0) {
      const blocks = [];

      if (verteilungsmodus === 'fokussiert') {
        // FOKUSSIERT: One RG per day with day-based deficit logic + hard switch rule
        // Rule: Never same RG as yesterday, pick RG with highest deficit among candidates

        // Track remaining blocks per RG
        const remainingPerRg = {};
        rgIds.forEach(rgId => {
          const total = (blocksPerRg[rgId] || []).length;
          const used = rgBlockIndices[rgId] || 0;
          remainingPerRg[rgId] = Math.max(0, total - used);
        });

        // Find candidates: RGs with remaining blocks that are NOT yesterday's RG
        // Use currentRgIndex to track yesterday's RG (stored as last assigned)
        const yesterdayRg = dayCounter > 0 ? rgIds.find((_, idx) => idx === currentRgIndex) : null;

        let candidates = rgIds.filter(rgId =>
          remainingPerRg[rgId] > 0 && rgId !== yesterdayRg
        );

        // Fallback: If no valid candidates (hard switch impossible), allow yesterday's RG (Variant B)
        if (candidates.length === 0) {
          candidates = rgIds.filter(rgId => remainingPerRg[rgId] > 0);
        }

        // Pick candidate with highest deficit (most remaining blocks = highest need)
        let bestRg = null;
        let bestRemaining = -1;
        for (const rgId of candidates) {
          if (remainingPerRg[rgId] > bestRemaining) {
            bestRemaining = remainingPerRg[rgId];
            bestRg = rgId;
          }
        }

        // Fallback if all RGs are empty
        if (!bestRg) {
          bestRg = rgIds[dayCounter % rgIds.length];
        }

        // Assign up to lernblockCount blocks from bestRg
        const rgBlocks = blocksPerRg[bestRg] || [];
        for (let i = 0; i < lernblockCount; i++) {
          if (rgBlocks.length > 0 && rgBlockIndices[bestRg] < rgBlocks.length) {
            const blockIdx = rgBlockIndices[bestRg];
            const poolBlock = rgBlocks[blockIdx];
            blocks.push(createCalendarBlock(currentDate, i, bestRg, poolBlock));
            rgBlockIndices[bestRg]++;
          } else {
            blocks.push(createEmptyCalendarBlock(currentDate, i, bestRg));
          }
        }

        // Update currentRgIndex to remember today's RG for tomorrow's switch rule
        currentRgIndex = rgIds.indexOf(bestRg);
        dayCounter++;

      } else if (verteilungsmodus === 'themenweise') {
        // THEMENWEISE: Read from pre-generated sequence
        // Theme packages are contiguous and span day boundaries naturally

        for (let i = 0; i < lernblockCount; i++) {
          if (themenweiseSequence && themenweiseIndex < themenweiseSequence.length) {
            const { block: poolBlock, rgId } = themenweiseSequence[themenweiseIndex];
            blocks.push(createCalendarBlock(currentDate, i, rgId, poolBlock));
            themenweiseIndex++;
          } else {
            // No more blocks, fill with empty
            const fallbackRg = rgIds[dayCounter % rgIds.length];
            blocks.push(createEmptyCalendarBlock(currentDate, i, fallbackRg));
          }
        }
        dayCounter++;

      } else {
        // gemischt - DEFICIT-BASED: Pick RG that is furthest behind its target percentage
        // This respects gewichtung while ensuring good mixing
        let lastRgInDay = null;

        for (let i = 0; i < lernblockCount; i++) {
          // Calculate current distribution
          const totalAssigned = Object.values(rgBlockIndices).reduce((sum, c) => sum + c, 0);

          // Find RG with highest deficit (most behind its target)
          let bestRg = null;
          let bestDeficit = -Infinity;

          for (const rgId of rgIds) {
            const rgBlocks = blocksPerRg[rgId] || [];
            if (rgBlocks.length === 0) continue; // Skip RGs with no content

            // Current percentage for this RG
            const currentPct = totalAssigned > 0
              ? (rgBlockIndices[rgId] / totalAssigned) * 100
              : 0;

            // Target percentage (from gewichtung or equal split)
            const targetPct = rechtsgebieteGewichtung?.[rgId]
              || (100 / rgIds.length);

            // Deficit = how far behind target
            let deficit = targetPct - currentPct;

            // Penalty: Avoid same RG twice in a row within the same day
            if (rgId === lastRgInDay && rgIds.length > 1) {
              deficit -= 50; // Strong penalty to avoid repetition
            }

            if (deficit > bestDeficit) {
              bestDeficit = deficit;
              bestRg = rgId;
            }
          }

          // Fallback if no RG has content
          if (!bestRg) {
            bestRg = rgIds[poolIndex % rgIds.length];
          }

          const rgBlocks = blocksPerRg[bestRg] || [];
          if (rgBlocks.length > 0) {
            const blockIdx = rgBlockIndices[bestRg] % rgBlocks.length;
            const poolBlock = rgBlocks[blockIdx];
            blocks.push(createCalendarBlock(currentDate, i, bestRg, poolBlock));
            rgBlockIndices[bestRg]++;
          } else {
            blocks.push(createEmptyCalendarBlock(currentDate, i, bestRg));
          }

          lastRgInDay = bestRg;
          poolIndex++;
        }
      }

      days.push({ date: new Date(currentDate), blocks });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
};

/**
 * Create a calendar block with content from pool
 */
const createCalendarBlock = (date, index, rgId, poolBlock) => ({
  id: `block-${date.toISOString()}-${index}`,
  rechtsgebiet: rgId,
  originalBlockId: poolBlock?.originalBlockId,
  type: poolBlock?.type || 'empty',
  displayName: poolBlock?.displayName || '',
  thema: poolBlock?.thema || null,
  aufgaben: poolBlock?.aufgaben || [],
  aufgabenCount: poolBlock?.aufgabenCount || 0,
});

/**
 * Create an empty calendar block (placeholder)
 */
const createEmptyCalendarBlock = (date, index, rgId) => ({
  id: `block-${date.toISOString()}-${index}`,
  rechtsgebiet: rgId,
  type: 'empty',
  displayName: '',
  thema: null,
  aufgaben: [],
  aufgabenCount: 0,
});

/**
 * Fallback calendar when no blocks assigned
 */
const generateFallbackCalendar = (start, end, weekStructure, rgIds, verteilungsmodus) => {
  const days = [];
  const weekdayMap = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
  let currentDate = new Date(start);
  let lastRgIndex = -1; // Track yesterday's RG for fokussiert mode

  while (currentDate <= end) {
    const weekday = weekdayMap[currentDate.getDay()];
    const dayStructure = weekStructure?.[weekday] || [];
    const lernblockCount = dayStructure.filter(b => b === 'lernblock').length;

    if (lernblockCount > 0) {
      const blocks = [];

      if (verteilungsmodus === 'fokussiert') {
        // FOKUSSIERT: Hard switch rule - never same RG as yesterday
        let candidates = rgIds.filter((_, idx) => idx !== lastRgIndex);
        if (candidates.length === 0) candidates = rgIds;

        // Round-robin among candidates
        const dayCount = days.filter(d => d.blocks.length > 0).length;
        const rgId = candidates[dayCount % candidates.length];

        for (let i = 0; i < lernblockCount; i++) {
          blocks.push(createEmptyCalendarBlock(currentDate, i, rgId));
        }
        lastRgIndex = rgIds.indexOf(rgId);
      } else if (verteilungsmodus === 'themenweise') {
        // THEMENWEISE fallback: Deficit-based RG selection, avoid same RG twice in a row
        const dayCount = days.filter(d => d.blocks.length > 0).length;

        // Simple deficit: distribute evenly across RGs, avoid same as last
        let candidates = rgIds.filter((_, idx) => idx !== lastRgIndex);
        if (candidates.length === 0) candidates = rgIds;

        const rgId = candidates[dayCount % candidates.length];
        for (let i = 0; i < lernblockCount; i++) {
          blocks.push(createEmptyCalendarBlock(currentDate, i, rgId));
        }
        lastRgIndex = rgIds.indexOf(rgId);
      } else {
        // gemischt
        const dayCount = days.filter(d => d.blocks.length > 0).length;
        for (let i = 0; i < lernblockCount; i++) {
          blocks.push(createEmptyCalendarBlock(currentDate, i, rgIds[(dayCount + i) % rgIds.length]));
        }
      }

      days.push({ date: new Date(currentDate), blocks });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
};

/**
 * Multi-Week View Component - Shows 4 weeks at once with visual feedback
 * Supports click-to-swap, hover preview, and lock functionality
 */
const MultiWeekView = ({
  days,
  startWeekOffset,
  weeksToShow,
  selectedBlockId,
  onBlockClick,
  onBlockHover,
  onToggleLock,
  editMode,
  swapPreview
}) => {
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  // Get the first calendar day's date as base
  const firstCalendarDate = days.length > 0 ? new Date(days[0]?.date) : new Date();
  // Find the Monday of the first week
  const baseWeekStart = new Date(firstCalendarDate);
  const dayOfWeek = baseWeekStart.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 1
  baseWeekStart.setDate(baseWeekStart.getDate() - daysToSubtract);

  // Generate dates for all weeks
  const allWeekDates = [];
  for (let week = 0; week < weeksToShow; week++) {
    const weekDates = [];
    const actualWeek = startWeekOffset + week;

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      // Calculate actual date for this cell
      const cellDate = new Date(baseWeekStart);
      cellDate.setDate(baseWeekStart.getDate() + actualWeek * 7 + dayIdx);

      // Find matching day data by comparing dates
      const dayData = days.find(d => {
        const dDate = new Date(d.date);
        return dDate.toDateString() === cellDate.toDateString();
      });

      weekDates.push({ date: cellDate, dayData });
    }
    allWeekDates.push(weekDates);
  }

  // Get swap preview status for a block
  const getBlockPreviewStatus = (blockId) => {
    if (!swapPreview || swapPreview.targetBlockId !== blockId) return null;
    return swapPreview.status;
  };

  // Get border color for swap preview
  const getPreviewBorderClass = (status) => {
    switch (status) {
      case 'green': return 'ring-2 ring-green-500 ring-offset-1';
      case 'yellow': return 'ring-2 ring-yellow-500 ring-offset-1';
      case 'red': return 'ring-2 ring-red-500 ring-offset-1';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      {allWeekDates.map((weekDates, weekIdx) => {
        // Get the month for the first day of this week
        const weekFirstDate = weekDates[0]?.date;
        const monthLabel = weekFirstDate ? monthNames[weekFirstDate.getMonth()] : '';
        const weekNumber = startWeekOffset + weekIdx + 1;

        return (
          <div key={weekIdx} className="border border-neutral-200 rounded-lg overflow-hidden">
            {/* Week header */}
            <div className="bg-neutral-100 px-3 py-1.5 border-b border-neutral-200 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600">
                Woche {weekNumber} • {monthLabel}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-px bg-neutral-200">
              {/* Day headers (only on first week) */}
              {weekIdx === 0 && weekDays.map((day) => (
                <div key={day} className="bg-neutral-50 text-center text-xs font-medium text-neutral-500 py-1.5">
                  {day}
                </div>
              ))}

              {/* Days */}
              {weekDates.map(({ date, dayData }, dayIdx) => {
                const isInRange = dayData !== undefined;

                return (
                  <div
                    key={dayIdx}
                    className={`min-h-[80px] p-1.5 ${isInRange ? 'bg-white' : 'bg-neutral-50'}`}
                  >
                    <div className="text-[10px] text-neutral-400 mb-1 flex items-center justify-between">
                      <span>{date.getDate()}</span>
                      {date.getDate() === 1 && (
                        <span className="text-neutral-500 font-medium">{monthNames[date.getMonth()]}</span>
                      )}
                    </div>

                    {dayData?.blocks?.map((block) => {
                      const colorClass = RECHTSGEBIET_COLORS[block.rechtsgebiet] || 'bg-gray-500';
                      const hasContent = block.type !== 'empty' && block.displayName;
                      const isSelected = selectedBlockId === block.id;
                      const isLocked = block.isLocked;
                      const previewStatus = getBlockPreviewStatus(block.id);
                      const previewBorder = getPreviewBorderClass(previewStatus);

                      return (
                        <div
                          key={block.id}
                          onClick={() => onBlockClick?.(block, dayData.date)}
                          onMouseEnter={() => editMode && onBlockHover?.(block, dayData.date)}
                          onMouseLeave={() => editMode && onBlockHover?.(null, null)}
                          className={`
                            ${colorClass} text-white text-[10px] px-1 py-0.5 rounded mb-0.5 relative
                            cursor-pointer hover:brightness-110
                            ${isSelected ? 'ring-2 ring-offset-1 ring-primary-600 scale-[1.02] z-10' : ''}
                            ${previewBorder}
                            ${isLocked ? 'opacity-70' : ''}
                            transition-all duration-150
                          `}
                          title={editMode
                            ? (isLocked ? 'Gesperrter Block' : isSelected ? 'Klicke einen anderen Block zum Tauschen' : 'Klicke zum Auswählen')
                            : `${RECHTSGEBIET_LABELS[block.rechtsgebiet]}: ${block.displayName || 'Leer'}`
                          }
                        >
                          {/* Lock icon */}
                          {isLocked && (
                            <Lock className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-white/70" />
                          )}

                          {/* Lock toggle button (visible in edit mode on hover) */}
                          {editMode && !isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleLock?.(block.id);
                              }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity group-hover:opacity-100"
                              title={isLocked ? 'Entsperren' : 'Sperren'}
                            >
                              {isLocked
                                ? <Unlock className="w-2.5 h-2.5 text-neutral-600" />
                                : <Lock className="w-2.5 h-2.5 text-neutral-400" />
                              }
                            </button>
                          )}

                          <div className="font-medium truncate">
                            {RECHTSGEBIET_LABELS[block.rechtsgebiet]?.substring(0, 3) || '?'}
                          </div>
                          {hasContent && (
                            <div className="text-[9px] opacity-90 truncate">
                              {block.displayName}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isInRange && !dayData?.blocks?.length && (
                      <div className="text-[9px] text-neutral-300 italic">Frei</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Statistics Component - Shows distribution and comparison to targets
 */
const Statistics = ({ days, rechtsgebieteGewichtung, lernbloeckeDraft, selectedRechtsgebiete }) => {
  // Count blocks per RG in calendar
  const blockCounts = {};
  let totalBlocks = 0;
  let assignedBlocks = 0;

  (days || []).forEach(day => {
    (day.blocks || []).forEach(block => {
      if (block.rechtsgebiet) {
        blockCounts[block.rechtsgebiet] = (blockCounts[block.rechtsgebiet] || 0) + 1;
        totalBlocks++;
        if (block.type !== 'empty') {
          assignedBlocks++;
        }
      }
    });
  });

  // Count assigned items from Step 15
  const assignedPerRg = countAssignedPerRg(lernbloeckeDraft, selectedRechtsgebiete);
  const totalAssigned = Object.values(assignedPerRg).reduce((sum, c) => sum + c, 0);

  const hasGewichtung = rechtsgebieteGewichtung && Object.keys(rechtsgebieteGewichtung).length > 0;
  const hasBlocks = Object.keys(blockCounts).length > 0;

  if (!hasBlocks) {
    return (
      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <h4 className="text-sm font-medium text-neutral-900 mb-2">Verteilung</h4>
        <p className="text-sm text-neutral-500">Keine Blöcke generiert.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <h4 className="text-sm font-medium text-neutral-900 mb-3">Übersicht</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-light text-neutral-900">{totalBlocks}</div>
            <div className="text-xs text-neutral-500">Kalender-Blöcke</div>
          </div>
          <div>
            <div className="text-2xl font-light text-primary-600">{totalAssigned}</div>
            <div className="text-xs text-neutral-500">Zugewiesene Inhalte</div>
          </div>
          <div>
            <div className="text-2xl font-light text-neutral-900">
              {totalBlocks > 0 ? Math.round((assignedBlocks / totalBlocks) * 100) : 0}%
            </div>
            <div className="text-xs text-neutral-500">Befüllt</div>
          </div>
        </div>
      </div>

      {/* Per-RG breakdown */}
      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <h4 className="text-sm font-medium text-neutral-900 mb-3">Verteilung pro Rechtsgebiet</h4>
        <div className="space-y-2">
          {Object.entries(blockCounts).map(([rgId, count]) => {
            const percentage = totalBlocks > 0 ? Math.round((count / totalBlocks) * 100) : 0;
            const targetPercentage = hasGewichtung ? (rechtsgebieteGewichtung[rgId] || 0) : null;
            const assignedCount = assignedPerRg[rgId] || 0;
            const colorClass = RECHTSGEBIET_COLORS[rgId] || 'bg-gray-500';

            return (
              <div key={rgId} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                <span className="flex-1 text-sm text-neutral-700">
                  {RECHTSGEBIET_LABELS[rgId] || rgId}
                </span>
                <span className="text-xs text-neutral-500">
                  {assignedCount} Inhalte
                </span>
                <span className="text-sm font-medium text-neutral-900 w-12 text-right">
                  {percentage}%
                </span>
                {targetPercentage !== null && (
                  <span className={`text-xs w-16 text-right ${
                    Math.abs(percentage - targetPercentage) <= 5
                      ? 'text-green-600'
                      : 'text-amber-600'
                  }`}>
                    (Ziel: {targetPercentage}%)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Step 21 Component
 */
const Step21KalenderVorschau = () => {
  const {
    startDate,
    endDate,
    weekStructure,
    lernbloeckeDraft,
    rechtsgebieteGewichtung,
    verteilungsmodus,
    selectedRechtsgebiete,
    generatedCalendar,
    updateWizardData
  } = useWizard();

  // Navigation: 4-week blocks instead of single weeks
  const [weekBlockOffset, setWeekBlockOffset] = useState(0);
  const WEEKS_PER_VIEW = 4;
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null); // { block, dayDate }
  const [swapPreview, setSwapPreview] = useState(null); // { allowed, status, message }

  // Undo/Redo state
  const [historyStack, setHistoryStack] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  // Generate or use cached calendar
  const calendarDays = useMemo(() => {
    if (generatedCalendar && generatedCalendar.length > 0) {
      return generatedCalendar;
    }
    return generateCalendarFromBlocks(
      startDate,
      endDate,
      weekStructure,
      lernbloeckeDraft,
      rechtsgebieteGewichtung,
      verteilungsmodus,
      selectedRechtsgebiete
    );
  }, [startDate, endDate, weekStructure, lernbloeckeDraft, rechtsgebieteGewichtung, verteilungsmodus, selectedRechtsgebiete, generatedCalendar]);

  // Initialize history with first calendar state
  const initHistory = useCallback((calendar) => {
    if (calendar && calendar.length > 0 && historyStack.length === 0) {
      setHistoryStack([calendar]);
      setHistoryIndex(0);
    }
  }, [historyStack.length]);

  // Initialize history when calendar is first generated
  useMemo(() => {
    initHistory(calendarDays);
  }, [calendarDays, initHistory]);

  // Push new state to history
  const pushToHistory = useCallback((newCalendar) => {
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(newCalendar);
    // Limit history to 50 entries
    if (newStack.length > 50) newStack.shift();
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  }, [historyStack, historyIndex]);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      updateWizardData({ generatedCalendar: historyStack[newIndex] });
      setSelectedBlock(null);
      setSwapPreview(null);
    }
  }, [canUndo, historyIndex, historyStack, updateWizardData]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      updateWizardData({ generatedCalendar: historyStack[newIndex] });
      setSelectedBlock(null);
      setSwapPreview(null);
    }
  }, [canRedo, historyIndex, historyStack, updateWizardData]);

  // Calculate total weeks and week blocks
  const totalWeeks = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    // +1 day to include both start and end date, then divide by 7 for weeks
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.ceil(totalDays / 7);
  }, [startDate, endDate]);

  const totalWeekBlocks = Math.ceil(totalWeeks / WEEKS_PER_VIEW);
  const currentWeekStart = weekBlockOffset * WEEKS_PER_VIEW;

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setSelectedBlock(null);
    setSwapPreview(null);
    setEditMode(false);
    setTimeout(() => {
      const newCalendar = generateCalendarFromBlocks(
        startDate,
        endDate,
        weekStructure,
        lernbloeckeDraft,
        rechtsgebieteGewichtung,
        verteilungsmodus,
        selectedRechtsgebiete
      );
      updateWizardData({ generatedCalendar: newCalendar });
      // Reset history with new calendar
      setHistoryStack([newCalendar]);
      setHistoryIndex(0);
      setIsRegenerating(false);
    }, 500);
  };

  // Handle block hover for swap preview (only in edit mode with block selected)
  const handleBlockHover = useCallback((block, dayDate) => {
    if (!editMode || !selectedBlock || selectedBlock.block.id === block.id) {
      setSwapPreview(null);
      return;
    }

    // Validate the potential swap
    const validation = validateSwap(
      selectedBlock.block,
      block,
      selectedBlock.dayDate,
      dayDate,
      calendarDays,
      verteilungsmodus,
      rechtsgebieteGewichtung
    );
    setSwapPreview({ ...validation, targetBlockId: block.id });
  }, [editMode, selectedBlock, calendarDays, verteilungsmodus, rechtsgebieteGewichtung]);

  // Handle block click for swap functionality with validation
  const handleBlockClick = useCallback((block, dayDate) => {
    // Auto-enable edit mode when clicking a block
    if (!editMode) {
      setEditMode(true);
    }

    if (!selectedBlock) {
      // First click - select this block (unless locked)
      if (block.isLocked) {
        setSwapPreview({ allowed: false, status: 'red', message: 'Gesperrter Block' });
        setTimeout(() => setSwapPreview(null), 1500);
        return;
      }
      setSelectedBlock({ block, dayDate });
      setSwapPreview(null);
    } else if (selectedBlock.block.id === block.id) {
      // Clicked same block - deselect
      setSelectedBlock(null);
      setSwapPreview(null);
    } else {
      // Second click - validate and swap blocks
      const validation = validateSwap(
        selectedBlock.block,
        block,
        selectedBlock.dayDate,
        dayDate,
        calendarDays,
        verteilungsmodus,
        rechtsgebieteGewichtung
      );

      if (!validation.allowed) {
        // Show error feedback, don't swap
        setSwapPreview(validation);
        setTimeout(() => setSwapPreview(null), 2000);
        return;
      }

      // Perform the swap
      const newCalendar = calendarDays.map(day => {
        const newBlocks = day.blocks.map(b => {
          if (b.id === selectedBlock.block.id) {
            // Replace first selected with second
            return { ...block, id: b.id, isLocked: b.isLocked };
          }
          if (b.id === block.id) {
            // Replace second with first selected
            return { ...selectedBlock.block, id: b.id, isLocked: b.isLocked };
          }
          return b;
        });
        return { ...day, blocks: newBlocks };
      });

      pushToHistory(newCalendar);
      updateWizardData({ generatedCalendar: newCalendar });
      setSelectedBlock(null);
      setSwapPreview(null);
    }
  }, [editMode, selectedBlock, calendarDays, updateWizardData, verteilungsmodus, rechtsgebieteGewichtung, pushToHistory]);

  // Toggle lock on a block
  const handleToggleLock = useCallback((blockId) => {
    const newCalendar = calendarDays.map(day => ({
      ...day,
      blocks: day.blocks.map(b =>
        b.id === blockId ? { ...b, isLocked: !b.isLocked } : b
      )
    }));
    pushToHistory(newCalendar);
    updateWizardData({ generatedCalendar: newCalendar });
  }, [calendarDays, updateWizardData, pushToHistory]);

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    setSelectedBlock(null);
    setSwapPreview(null);
  };

  // Check if there are assigned blocks
  const pool = flattenBlocksToPool(lernbloeckeDraft, selectedRechtsgebiete);
  const hasAssignedContent = pool.length > 0;

  return (
    <div>
      <StepHeader
        step={21}
        title="Vorschau deines Lernplans"
        description="Überprüfe die Verteilung deiner Lernblöcke. Du kannst neu generieren oder einzelne Tage später anpassen."
      />

      {/* Warning if no content assigned */}
      {!hasAssignedContent && (
        <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Keine Inhalte zugewiesen</p>
            <p className="text-sm text-amber-700">
              Du hast in Schritt 15 noch keine Themen oder Aufgaben zu Blöcken zugewiesen.
              Der Kalender zeigt nur die Grundstruktur.
            </p>
          </div>
        </div>
      )}

      {/* Edit Mode Banner */}
      {editMode && (
        <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-primary-700">
              <ArrowLeftRight className="w-4 h-4" />
              <span>
                {selectedBlock
                  ? <strong>Block ausgewählt</strong>
                  : 'Klicke einen Block zum Auswählen, dann einen zweiten zum Tauschen'
                }
              </span>
              {selectedBlock && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 rounded text-xs">
                  {RECHTSGEBIET_LABELS[selectedBlock.block.rechtsgebiet]?.substring(0, 3)}: {selectedBlock.block.displayName || 'Leer'}
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedBlock(null)}
              disabled={!selectedBlock}
              className="text-xs text-primary-600 hover:text-primary-800 disabled:opacity-50"
            >
              Auswahl aufheben
            </button>
          </div>

          {/* Swap preview message */}
          {swapPreview && (
            <div className={`mt-2 text-xs px-2 py-1 rounded flex items-center gap-1 ${
              swapPreview.status === 'green' ? 'bg-green-100 text-green-700' :
              swapPreview.status === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                swapPreview.status === 'green' ? 'bg-green-500' :
                swapPreview.status === 'yellow' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              {swapPreview.message}
            </div>
          )}

          {/* Mode info */}
          <div className="mt-2 text-xs text-primary-600">
            <strong>Modus:</strong> {
              verteilungsmodus === 'gemischt' ? 'Gemischt (beliebige Block-Tausche)' :
              verteilungsmodus === 'fokussiert' ? 'Fokussiert (Tageswechsel-Regel beachten)' :
              'Themenweise (Themenpakete bleiben zusammen)'
            }
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        {/* Navigation - 4-week blocks */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekBlockOffset(Math.max(0, weekBlockOffset - 1))}
            disabled={weekBlockOffset === 0}
            className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Vorherige 4 Wochen"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-neutral-700 min-w-[140px] text-center">
            Wochen {currentWeekStart + 1}-{Math.min(currentWeekStart + WEEKS_PER_VIEW, totalWeeks)} von {totalWeeks}
          </span>
          <button
            onClick={() => setWeekBlockOffset(Math.min(totalWeekBlocks - 1, weekBlockOffset + 1))}
            disabled={weekBlockOffset >= totalWeekBlocks - 1}
            className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Nächste 4 Wochen"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo buttons (visible in edit mode) */}
          {editMode && (
            <>
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Rückgängig (Undo)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Wiederholen (Redo)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-neutral-200" />
            </>
          )}

          {/* Edit Mode Toggle */}
          <button
            onClick={toggleEditMode}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              editMode
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {editMode ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {editMode ? 'Bearbeitung beenden' : 'Blöcke anpassen'}
          </button>

          {/* Regenerate Button */}
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            Neu generieren
          </button>
        </div>
      </div>

      {/* Multi-Week View (4 weeks at a time) */}
      <div className="mb-6">
        {calendarDays.length === 0 ? (
          <div className="p-8 bg-amber-50 rounded-lg border border-amber-200 text-center">
            <p className="text-sm text-amber-700">
              <strong>Keine Lerntage generiert.</strong> Überprüfe deine Wochenstruktur und den Lernzeitraum.
            </p>
          </div>
        ) : (
          <MultiWeekView
            days={calendarDays}
            startWeekOffset={currentWeekStart}
            weeksToShow={Math.min(WEEKS_PER_VIEW, totalWeeks - currentWeekStart)}
            selectedBlockId={selectedBlock?.block?.id}
            onBlockClick={handleBlockClick}
            onBlockHover={handleBlockHover}
            onToggleLock={handleToggleLock}
            editMode={editMode}
            swapPreview={swapPreview}
          />
        )}
      </div>

      {/* Statistics */}
      <Statistics
        days={calendarDays}
        rechtsgebieteGewichtung={rechtsgebieteGewichtung}
        lernbloeckeDraft={lernbloeckeDraft}
        selectedRechtsgebiete={selectedRechtsgebiete}
      />

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700 mb-2">
          <strong>Tipp:</strong> Klicke auf &quot;Blöcke anpassen&quot;, um den Bearbeitungsmodus zu aktivieren.
        </p>
        <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
          <li>Klicke einen Block zum Auswählen, dann einen zweiten zum Tauschen</li>
          <li>Farb-Feedback zeigt an, ob ein Tausch erlaubt ist (grün/gelb/rot)</li>
          <li>Nutze Undo/Redo um Änderungen rückgängig zu machen</li>
          <li>Sperre wichtige Blöcke mit dem Schloss-Symbol</li>
        </ul>
      </div>
    </div>
  );
};

export default Step21KalenderVorschau;
