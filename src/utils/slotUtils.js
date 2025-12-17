/**
 * Slot Utilities
 * Helper functions for slot-based calendar logic
 */

/**
 * Create an empty slot for a specific date and position
 */
export const createEmptySlot = (date, position) => {
  const dateStr = formatDateKey(date);
  const now = new Date().toISOString();

  return {
    id: `${dateStr}-${position}`,
    date: dateStr,
    position,
    status: 'empty',
    isLocked: false,
    createdAt: now,
    updatedAt: now
  };
};

/**
 * Create initial 3 empty slots for a day
 */
export const createDaySlots = (date) => {
  return [
    createEmptySlot(date, 1),
    createEmptySlot(date, 2),
    createEmptySlot(date, 3)
  ];
};

/**
 * Format date as 'YYYY-MM-DD'
 */
export const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Count free (empty) slots in a day
 */
export const countFreeSlots = (slots) => {
  return slots.filter(slot => slot.status === 'empty').length;
};

/**
 * Check if a topic with given size can be placed on this day
 */
export const canPlaceTopic = (slots, sizeInSlots) => {
  const freeSlots = countFreeSlots(slots);
  return freeSlots >= sizeInSlots;
};

/**
 * Get the next available slot positions for placing a topic
 */
export const getAvailableSlotPositions = (slots, sizeNeeded) => {
  const emptyPositions = slots
    .filter(slot => slot.status === 'empty')
    .map(slot => slot.position)
    .sort((a, b) => a - b);

  if (emptyPositions.length < sizeNeeded) {
    return null;
  }

  return emptyPositions.slice(0, sizeNeeded);
};

/**
 * Create slots for a new learning block
 */
export const createTopicSlots = (date, positions, topicData) => {
  const dateStr = formatDateKey(date);
  const now = new Date().toISOString();
  const groupId = `group-${dateStr}-${Date.now()}`;

  return positions.map((position, index) => ({
    id: `${dateStr}-${position}`,
    date: dateStr,
    position,
    status: 'topic',
    topicId: topicData.id || `topic-${Date.now()}`,
    topicTitle: topicData.title,
    blockType: topicData.blockType,
    groupId,
    groupSize: positions.length,
    groupIndex: index,
    progress: topicData.progress,
    description: topicData.description,
    rechtsgebiet: topicData.rechtsgebiet,
    unterrechtsgebiet: topicData.unterrechtsgebiet,
    tasks: topicData.tasks,
    isLocked: false,
    createdAt: now,
    updatedAt: now
  }));
};

/**
 * Update slots in a day by replacing specific positions
 */
export const updateDaySlots = (currentSlots, newSlots) => {
  const updatedSlots = [...currentSlots];

  newSlots.forEach(newSlot => {
    const index = updatedSlots.findIndex(s => s.position === newSlot.position);
    if (index !== -1) {
      updatedSlots[index] = newSlot;
    }
  });

  return updatedSlots;
};

/**
 * Group slots by their groupId to render multi-slot topics
 */
export const groupSlotsByTopic = (slots) => {
  const groups = {};

  slots.forEach(slot => {
    if (slot.status === 'topic' && slot.groupId) {
      if (!groups[slot.groupId]) {
        groups[slot.groupId] = [];
      }
      groups[slot.groupId].push(slot);
    }
  });

  // Sort each group by groupIndex
  Object.keys(groups).forEach(groupId => {
    groups[groupId].sort((a, b) => (a.groupIndex || 0) - (b.groupIndex || 0));
  });

  return groups;
};

/**
 * Convert slots to learning blocks for display
 */
export const slotsToLearningBlocks = (slots) => {
  const groups = groupSlotsByTopic(slots);
  const blocks = [];
  const processedGroups = new Set();
  const processedTopicIds = new Set();

  slots.forEach(slot => {
    if (slot.status === 'topic' && slot.groupId && !processedGroups.has(slot.groupId)) {
      // Multi-slot topic with groupId - only add once per group
      const groupSlots = groups[slot.groupId];
      if (groupSlots && groupSlots.length > 0) {
        const firstSlot = groupSlots[0];
        blocks.push({
          id: firstSlot.topicId || firstSlot.id,
          title: firstSlot.topicTitle || '',
          blockType: firstSlot.blockType || 'lernblock',
          progress: firstSlot.progress || '0/1',
          description: firstSlot.description,
          rechtsgebiet: firstSlot.rechtsgebiet,
          unterrechtsgebiet: firstSlot.unterrechtsgebiet,
          tasks: firstSlot.tasks,
          blockSize: groupSlots.length
        });
        processedGroups.add(slot.groupId);
        if (firstSlot.topicId) processedTopicIds.add(firstSlot.topicId);
      }
    } else if (slot.status === 'topic' && !slot.groupId && slot.topicId && !processedTopicIds.has(slot.topicId)) {
      // Single-slot topic without groupId (e.g., from template)
      blocks.push({
        id: slot.topicId || slot.id,
        title: slot.topicTitle || '',
        blockType: slot.blockType || 'lernblock',
        progress: slot.progress || '1/1',
        description: slot.description,
        rechtsgebiet: slot.rechtsgebiet,
        unterrechtsgebiet: slot.unterrechtsgebiet,
        tasks: slot.tasks,
        blockSize: 1
      });
      processedTopicIds.add(slot.topicId);
    } else if (slot.status === 'free') {
      // Free slot
      blocks.push({
        id: slot.id,
        title: slot.topicTitle || 'Frei',
        blockType: 'free',
        progress: '1/1',
        blockSize: 1
      });
    }
  });

  return blocks;
};
