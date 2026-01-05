/**
 * @deprecated This file has been renamed to blockUtils.ts
 * All imports should be updated to use blockUtils.ts instead.
 * This file is kept for backwards compatibility during migration.
 */

// Re-export everything from blockUtils
export * from './blockUtils';

// Legacy name exports
export {
  createEmptyBlock as createEmptySlot,
  createDayBlocks as createDaySlots,
  countFreeBlocks as countFreeSlots,
  getAvailableBlockPositions as getAvailableSlotPositions,
  createTopicBlocks as createTopicSlots,
  updateDayBlocks as updateDaySlots,
  groupBlocksByTopic as groupSlotsByTopic,
  blocksToLearningSessions as slotsToLearningBlocks,
} from './blockUtils';
