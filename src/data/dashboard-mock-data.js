/**
 * Mock data for Dashboard page
 * Based on Figma design structure
 */

export const lernblockData = {
  blockType: '',
  subject: '',
  title: '',
  description: '',
  tasks: [],
};

export const zeitplanData = {
  completedBlocks: 0,
  totalBlocks: 0,
  currentHour: new Date().getHours(),
  progress: 0,
  plannedLabel: '',
  blocks: [],
};

export const dayProgress = {
  hoursCompleted: 4.5,
  hoursTarget: 8.5,
  percentage: 52,
};
