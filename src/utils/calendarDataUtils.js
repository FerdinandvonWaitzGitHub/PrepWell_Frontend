/**
 * Calendar Data Utilities
 *
 * Provides helper functions for the Content → Slot → Block data model
 */

import { POSITION_TIME_MAP, createBlockFromSlotAndContent, generateId } from '../types';

/**
 * Create a new Content item
 * @param {Object} data - Content data
 * @returns {Object} Content item
 */
export function createContent(data) {
  return {
    id: data.id || generateId('content'),
    title: data.title || 'Neuer Lernblock',
    description: data.description || '',
    rechtsgebiet: data.rechtsgebiet || '',
    unterrechtsgebiet: data.unterrechtsgebiet || '',
    kapitel: data.kapitel || '',
    blockType: data.blockType || 'lernblock',
    aufgaben: data.aufgaben || [],
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

/**
 * Create a new Slot
 * @param {Object} data - Slot data
 * @returns {Object} Slot item
 */
export function createSlot(data) {
  return {
    id: data.id || generateId('slot'),
    date: data.date,
    position: data.position || 1,
    contentId: data.contentId,
    blockType: data.blockType || 'lernblock',
    isLocked: data.isLocked || false,
    tasks: data.tasks || [],
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

/**
 * Get time info for a slot position
 * @param {1|2|3} position - Slot position
 * @returns {Object} { startHour, endHour, startTime, endTime }
 */
export function getTimeForPosition(position) {
  return POSITION_TIME_MAP[position] || POSITION_TIME_MAP[1];
}

/**
 * Build a Block from Slot and Content
 * @param {Object} slot - The slot
 * @param {Object} content - The content
 * @param {Object} [timeOverride] - Optional time override (for custom times)
 * @returns {Object} Block
 */
export function buildBlock(slot, content, timeOverride = null) {
  return createBlockFromSlotAndContent(slot, content, timeOverride);
}

/**
 * Build blocks for a day from slots and contents
 * @param {Array} slots - Array of slots for the day
 * @param {Object} contentsById - Content lookup by ID
 * @returns {Array} Array of blocks
 */
export function buildBlocksForDay(slots, contentsById) {
  return slots
    .filter(slot => slot.contentId && contentsById[slot.contentId])
    .map(slot => {
      const content = contentsById[slot.contentId];
      return buildBlock(slot, content);
    })
    .sort((a, b) => a.startHour - b.startHour);
}

/**
 * Migrate legacy slot data to new format
 * Extracts content from slot and creates separate content entry
 * @param {Object} legacySlot - Old slot format with embedded content
 * @returns {{ slot: Object, content: Object }} New slot and content
 */
export function migrateLegacySlot(legacySlot) {
  // Create content from embedded data
  const contentId = legacySlot.topicId || generateId('content');

  const content = createContent({
    id: contentId,
    title: legacySlot.topicTitle || legacySlot.title || 'Lernblock',
    description: legacySlot.description || '',
    rechtsgebiet: legacySlot.rechtsgebiet || '',
    unterrechtsgebiet: legacySlot.unterrechtsgebiet || '',
    blockType: legacySlot.blockType || 'lernblock',
    aufgaben: legacySlot.aufgaben || [],
  });

  // Create clean slot
  const slot = createSlot({
    id: legacySlot.id || generateId('slot'),
    date: legacySlot.date,
    position: legacySlot.position || 1,
    contentId: contentId,
    blockType: legacySlot.blockType || 'lernblock',
    isLocked: legacySlot.isLocked || false,
    tasks: legacySlot.tasks || [],
  });

  return { slot, content };
}

/**
 * Migrate all legacy slots by date
 * @param {Object} legacySlotsByDate - Old format { date: [slots] }
 * @returns {{ slotsByDate: Object, contentsById: Object }}
 */
export function migrateLegacyData(legacySlotsByDate) {
  const slotsByDate = {};
  const contentsById = {};

  Object.entries(legacySlotsByDate).forEach(([date, legacySlots]) => {
    slotsByDate[date] = [];

    legacySlots.forEach(legacySlot => {
      const { slot, content } = migrateLegacySlot({ ...legacySlot, date });
      slotsByDate[date].push(slot);
      contentsById[content.id] = content;
    });
  });

  return { slotsByDate, contentsById };
}

/**
 * Build block data for display (ZeitplanWidget format)
 * @param {Object} slot - The slot
 * @param {Object} content - The content
 * @param {Object} [customTime] - Custom time if set
 * @returns {Object} Block data for display
 */
export function buildDisplayBlock(slot, content, customTime = null) {
  const positionTime = getTimeForPosition(slot.position);

  // Use custom time if available
  const startHour = customTime?.startHour ?? positionTime.startHour;
  const duration = customTime?.duration ?? (positionTime.endHour - positionTime.startHour);
  const startTime = customTime?.startTime ?? positionTime.startTime;
  const endTime = customTime?.endTime ?? positionTime.endTime;

  return {
    // IDs
    id: content.id, // Use content ID for consistency
    slotId: slot.id,
    contentId: content.id,

    // Time
    startHour,
    duration,
    startTime,
    endTime,
    hasTime: !!customTime,

    // Display
    title: content.title,
    description: content.description,
    rechtsgebiet: content.rechtsgebiet,
    unterrechtsgebiet: content.unterrechtsgebiet,
    blockType: slot.blockType || content.blockType,

    // State
    position: slot.position,
    isBlocked: slot.isLocked || false,
    tasks: slot.tasks || [],
  };
}

export default {
  createContent,
  createSlot,
  getTimeForPosition,
  buildBlock,
  buildBlocksForDay,
  migrateLegacySlot,
  migrateLegacyData,
  buildDisplayBlock,
};
