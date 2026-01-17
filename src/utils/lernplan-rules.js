/**
 * Lernplan Rule Validation Utils
 *
 * Provides rule checking and redistribution logic for Wizard-created Lernpläne.
 * Rules include:
 * - Zielgewichtung (rechtsgebieteGewichtung): Block distribution by percentage
 * - Verteilungsmodus: gemischt (mixed), fokussiert (focused), themenweise (by theme)
 */

/**
 * Check for rule violations in the current block distribution
 *
 * @param {Object} blocksByDate - Blocks keyed by date string
 * @param {Object} metadata - Lernplan metadata with gewichtung and verteilungsmodus
 * @returns {Array} Array of violation objects: { type, rgId?, message, severity }
 */
export function checkRuleViolations(blocksByDate, metadata) {
  const violations = [];

  if (!metadata || !blocksByDate) {
    return violations;
  }

  const gewichtung = metadata.rechtsgebieteGewichtung || {};
  const verteilungsmodus = metadata.verteilungsmodus || 'gemischt';

  // Count blocks by Rechtsgebiet
  const blockCountByRg = {};
  let totalBlocks = 0;

  Object.values(blocksByDate).forEach(blocks => {
    blocks.forEach(block => {
      totalBlocks++;
      const rgId = block.rechtsgebiet || block.metadata?.rgId;
      if (rgId) {
        blockCountByRg[rgId] = (blockCountByRg[rgId] || 0) + 1;
      }
    });
  });

  // Check Zielgewichtung violations
  Object.entries(gewichtung).forEach(([rgId, targetPercent]) => {
    const actualCount = blockCountByRg[rgId] || 0;
    const targetCount = Math.round(totalBlocks * (targetPercent / 100));
    const deviation = actualCount - targetCount;
    const deviationPercent = totalBlocks > 0 ? Math.abs(deviation / totalBlocks) * 100 : 0;

    // Allow 10% tolerance
    if (deviationPercent > 10) {
      const isOverBudget = deviation > 0;
      violations.push({
        type: 'gewichtung',
        rgId,
        severity: isOverBudget ? 'warning' : 'info',
        message: isOverBudget
          ? `${rgId}: ${actualCount} Blöcke (${Math.round(actualCount / totalBlocks * 100)}%), Ziel: ${targetPercent}%`
          : `${rgId}: Weniger Blöcke als geplant (${actualCount}/${targetCount})`,
        actual: actualCount,
        target: targetCount,
        deviation,
      });
    }
  });

  // Check Verteilungsmodus violations
  if (verteilungsmodus === 'fokussiert') {
    // Fokussiert: Each day should focus on one RG
    const violatingDays = [];

    Object.entries(blocksByDate).forEach(([dateKey, blocks]) => {
      const rgsOnDay = new Set();
      blocks.forEach(block => {
        const rgId = block.rechtsgebiet || block.metadata?.rgId;
        if (rgId && block.topicTitle) { // Only count filled blocks
          rgsOnDay.add(rgId);
        }
      });

      if (rgsOnDay.size > 1) {
        violatingDays.push(dateKey);
      }
    });

    if (violatingDays.length > 0) {
      violations.push({
        type: 'verteilungsmodus',
        mode: 'fokussiert',
        severity: 'warning',
        message: `Fokussierter Modus: ${violatingDays.length} Tage haben mehrere Rechtsgebiete`,
        days: violatingDays,
      });
    }
  }

  if (verteilungsmodus === 'themenweise') {
    // Themenweise: Same themes should be grouped together
    // For now, just check if there are gaps in theme sequences
    const themeSequences = new Map(); // themaId -> array of dates

    Object.entries(blocksByDate).forEach(([dateKey, blocks]) => {
      blocks.forEach(block => {
        const themaId = block.metadata?.themaId || block.topicTitle;
        if (themaId) {
          if (!themeSequences.has(themaId)) {
            themeSequences.set(themaId, []);
          }
          themeSequences.get(themaId).push(dateKey);
        }
      });
    });

    // Check for non-contiguous theme sequences (simplified check)
    let fragmentedThemes = 0;
    themeSequences.forEach((dates, themaId) => {
      if (dates.length > 1) {
        // Sort dates and check for gaps
        const sortedDates = dates.sort();
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const daysDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
          if (daysDiff > 7) { // Gap of more than a week
            fragmentedThemes++;
            break;
          }
        }
      }
    });

    if (fragmentedThemes > 0) {
      violations.push({
        type: 'verteilungsmodus',
        mode: 'themenweise',
        severity: 'info',
        message: `Themenweiser Modus: ${fragmentedThemes} Themen sind nicht zusammenhängend`,
        count: fragmentedThemes,
      });
    }
  }

  return violations;
}

/**
 * Get blocks that can be redistributed (not in past, not completed)
 *
 * @param {Object} blocksByDate - Blocks keyed by date string
 * @returns {Object} Filtered blocksByDate with only redistributable blocks
 */
export function getRedistributableBlocks(blocksByDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = {};

  Object.entries(blocksByDate).forEach(([dateKey, blocks]) => {
    const blockDate = new Date(dateKey + 'T12:00:00');

    if (blockDate >= today) {
      // Filter out completed blocks
      const redistributable = blocks.filter(block => !block.completed);
      if (redistributable.length > 0) {
        result[dateKey] = redistributable;
      }
    }
  });

  return result;
}

/**
 * Calculate block budget per Rechtsgebiet based on gewichtung
 *
 * @param {number} totalBlocks - Total number of blocks available
 * @param {Object} gewichtung - { rgId: percent, ... }
 * @returns {Object} { rgId: { budget, percent }, ... }
 */
export function calculateBlockBudget(totalBlocks, gewichtung) {
  const budget = {};

  Object.entries(gewichtung).forEach(([rgId, percent]) => {
    budget[rgId] = {
      budget: Math.round(totalBlocks * (percent / 100)),
      percent,
    };
  });

  return budget;
}

/**
 * Redistribute blocks according to verteilungsmodus
 * Only affects future blocks (date >= today and not completed)
 *
 * @param {Object} blocksByDate - Current blocks by date
 * @param {Object} metadata - Lernplan metadata
 * @param {string} fromDate - Start redistribution from this date (YYYY-MM-DD)
 * @returns {Object} New blocksByDate with redistributed blocks
 */
export function redistributeBlocks(blocksByDate, metadata, fromDate = null) {
  const today = fromDate || new Date().toISOString().split('T')[0];
  const todayDate = new Date(today + 'T12:00:00');

  const verteilungsmodus = metadata.verteilungsmodus || 'gemischt';
  const gewichtung = metadata.rechtsgebieteGewichtung || {};

  // Collect all redistributable blocks
  const redistributableBlocks = [];
  const protectedDates = {}; // Dates with blocks that can't be moved

  Object.entries(blocksByDate).forEach(([dateKey, blocks]) => {
    const blockDate = new Date(dateKey + 'T12:00:00');
    const isPast = blockDate < todayDate;

    blocks.forEach(block => {
      if (isPast || block.completed) {
        // Protected: keep in place
        if (!protectedDates[dateKey]) {
          protectedDates[dateKey] = [];
        }
        protectedDates[dateKey].push(block);
      } else if (block.topicTitle) {
        // Has content: can be redistributed
        redistributableBlocks.push({
          ...block,
          originalDate: dateKey,
        });
      }
      // Empty blocks are ignored - budget forfeits for past blocks
    });
  });

  // Get available blocks (future dates)
  const availableBlocks = [];
  Object.entries(blocksByDate).forEach(([dateKey, blocks]) => {
    const blockDate = new Date(dateKey + 'T12:00:00');
    if (blockDate >= todayDate) {
      blocks.forEach(block => {
        if (!block.completed && !block.topicTitle) {
          availableBlocks.push({ date: dateKey, position: block.position, block });
        }
      });
    }
  });

  // Sort redistributable blocks by RG for assignment
  const blocksByRg = {};
  redistributableBlocks.forEach(block => {
    const rgId = block.rechtsgebiet || block.metadata?.rgId;
    if (!blocksByRg[rgId]) {
      blocksByRg[rgId] = [];
    }
    blocksByRg[rgId].push(block);
  });

  // Redistribute based on mode
  const newBlocksByDate = { ...protectedDates };
  let blockIndex = 0;

  if (verteilungsmodus === 'gemischt') {
    // Mixed: Distribute evenly across all RGs
    // Round-robin assignment
    const rgIds = Object.keys(blocksByRg);
    let rgIndex = 0;

    while (blockIndex < availableBlocks.length) {
      let assigned = false;

      // Try to assign from each RG in round-robin
      for (let i = 0; i < rgIds.length && blockIndex < availableBlocks.length; i++) {
        const currentRgIndex = (rgIndex + i) % rgIds.length;
        const currentRgId = rgIds[currentRgIndex];

        if (blocksByRg[currentRgId]?.length > 0) {
          const block = blocksByRg[currentRgId].shift();
          const targetBlock = availableBlocks[blockIndex];

          const assignedBlock = {
            ...targetBlock.block,
            topicTitle: block.topicTitle,
            tasks: block.tasks,
            metadata: block.metadata,
            rechtsgebiet: block.rechtsgebiet,
            unterrechtsgebiet: block.unterrechtsgebiet,
          };

          if (!newBlocksByDate[targetBlock.date]) {
            newBlocksByDate[targetBlock.date] = [];
          }
          newBlocksByDate[targetBlock.date].push(assignedBlock);

          blockIndex++;
          assigned = true;
        }
      }

      if (!assigned) break; // No more blocks to assign
      rgIndex = (rgIndex + 1) % rgIds.length;
    }
  } else if (verteilungsmodus === 'fokussiert') {
    // Focused: One RG per day
    const sortedDates = [...new Set(availableBlocks.map(s => s.date))].sort();
    const rgIds = Object.keys(blocksByRg);
    let rgIndex = 0;

    sortedDates.forEach(dateKey => {
      const blocksForDay = availableBlocks.filter(s => s.date === dateKey);
      const currentRgId = rgIds[rgIndex % rgIds.length];

      blocksForDay.forEach(targetBlock => {
        if (blocksByRg[currentRgId]?.length > 0) {
          const block = blocksByRg[currentRgId].shift();

          const assignedBlock = {
            ...targetBlock.block,
            topicTitle: block.topicTitle,
            tasks: block.tasks,
            metadata: block.metadata,
            rechtsgebiet: block.rechtsgebiet,
            unterrechtsgebiet: block.unterrechtsgebiet,
          };

          if (!newBlocksByDate[targetBlock.date]) {
            newBlocksByDate[targetBlock.date] = [];
          }
          newBlocksByDate[targetBlock.date].push(assignedBlock);
        }
      });

      // Switch RG for next day (only if we used blocks from current RG)
      if (blocksForDay.length > 0) {
        rgIndex++;
      }
    });
  } else if (verteilungsmodus === 'themenweise') {
    // By theme: Group same themes together
    // Sort blocks by theme, then assign contiguously
    const allBlocks = redistributableBlocks.sort((a, b) => {
      const themeA = a.metadata?.themaId || a.topicTitle || '';
      const themeB = b.metadata?.themaId || b.topicTitle || '';
      return themeA.localeCompare(themeB);
    });

    allBlocks.forEach(block => {
      if (blockIndex < availableBlocks.length) {
        const targetBlock = availableBlocks[blockIndex];

        const assignedBlock = {
          ...targetBlock.block,
          topicTitle: block.topicTitle,
          tasks: block.tasks,
          metadata: block.metadata,
          rechtsgebiet: block.rechtsgebiet,
          unterrechtsgebiet: block.unterrechtsgebiet,
        };

        if (!newBlocksByDate[targetBlock.date]) {
          newBlocksByDate[targetBlock.date] = [];
        }
        newBlocksByDate[targetBlock.date].push(assignedBlock);

        blockIndex++;
      }
    });
  }

  // Sort blocks within each date by position
  Object.keys(newBlocksByDate).forEach(dateKey => {
    newBlocksByDate[dateKey].sort((a, b) => (a.position || 0) - (b.position || 0));
  });

  return newBlocksByDate;
}

/**
 * Validate that a swap between two blocks is allowed
 *
 * @param {Object} block1 - First block
 * @param {Object} block2 - Second block
 * @param {Object} metadata - Lernplan metadata
 * @returns {Object} { allowed: boolean, status: 'green'|'yellow'|'red', message: string }
 */
export function validateSwap(block1, block2, metadata) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if either block is in the past or completed
  const date1 = new Date(block1.date + 'T12:00:00');
  const date2 = new Date(block2.date + 'T12:00:00');

  if (date1 < today || block1.completed) {
    return {
      allowed: false,
      status: 'red',
      message: 'Block 1 liegt in der Vergangenheit oder ist abgeschlossen',
    };
  }

  if (date2 < today || block2.completed) {
    return {
      allowed: false,
      status: 'red',
      message: 'Block 2 liegt in der Vergangenheit oder ist abgeschlossen',
    };
  }

  const verteilungsmodus = metadata?.verteilungsmodus || 'gemischt';

  // Check mode-specific rules
  if (verteilungsmodus === 'fokussiert') {
    // In focused mode, check if swap would create mixed RG day
    const rg1 = block1.rechtsgebiet || block1.metadata?.rgId;
    const rg2 = block2.rechtsgebiet || block2.metadata?.rgId;

    if (rg1 !== rg2) {
      return {
        allowed: true,
        status: 'yellow',
        message: 'Tauschen von verschiedenen Rechtsgebieten bricht den fokussierten Modus',
      };
    }
  }

  return {
    allowed: true,
    status: 'green',
    message: 'Tausch erlaubt',
  };
}

export default {
  checkRuleViolations,
  getRedistributableBlocks,
  calculateBlockBudget,
  redistributeBlocks,
  validateSwap,
};
