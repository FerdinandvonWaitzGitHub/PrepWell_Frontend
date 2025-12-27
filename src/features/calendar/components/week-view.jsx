import { useState, useMemo } from 'react';
import WeekViewHeader from './week-view-header';
import WeekGrid from './week-grid';
import AddThemeDialog from './add-theme-dialog';
import CreateThemeBlockDialog from './create-theme-block-dialog';
import CreateRepetitionBlockDialog from './create-repetition-block-dialog';
import CreateExamBlockDialog from './create-exam-block-dialog';
import CreatePrivateBlockDialog from './create-private-block-dialog';
import ManageThemeBlockDialog from './manage-theme-block-dialog';
import ManageRepetitionBlockDialog from './manage-repetition-block-dialog';
import ManageExamBlockDialog from './manage-exam-block-dialog';
import ManagePrivateBlockDialog from './manage-private-block-dialog';
import { useCalendar } from '../../../contexts/calendar-context';
import { slotsToLearningBlocks } from '../../../utils/slotUtils';

/**
 * WeekView component
 * Weekly calendar view for exam mode
 * Displays week schedule with time-based blocks
 *
 * Data flow: CalendarContext (slotsByDate + privateBlocksByDate) → WeekView
 */
const WeekView = ({ initialDate = new Date(), className = '' }) => {
  const [currentDate, setCurrentDate] = useState(initialDate);

  // Get data from CalendarContext (Single Source of Truth)
  const {
    slotsByDate,
    privateBlocksByDate,
    updateDaySlots,
    addPrivateBlock,
    updatePrivateBlock,
    deletePrivateBlock,
  } = useCalendar();

  // Dialog states
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Add block dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Create dialog states
  const [isCreateThemeOpen, setIsCreateThemeOpen] = useState(false);
  const [isCreateRepetitionOpen, setIsCreateRepetitionOpen] = useState(false);
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isCreatePrivateOpen, setIsCreatePrivateOpen] = useState(false);

  // Manage dialog states
  const [isManageThemeOpen, setIsManageThemeOpen] = useState(false);
  const [isManageRepetitionOpen, setIsManageRepetitionOpen] = useState(false);
  const [isManageExamOpen, setIsManageExamOpen] = useState(false);
  const [isManagePrivateOpen, setIsManagePrivateOpen] = useState(false);

  // Helper: Get week date range (Monday to Sunday)
  const getWeekDateRange = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
  };

  // Helper: Format date to YYYY-MM-DD
  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Helper: Get position-based time slots
  const getTimeForPosition = (position) => {
    const timeSlots = {
      1: { startTime: '08:00', endTime: '10:00' },
      2: { startTime: '10:00', endTime: '12:00' },
      3: { startTime: '14:00', endTime: '16:00' },
      4: { startTime: '16:00', endTime: '18:00' },
    };
    return timeSlots[position] || { startTime: '08:00', endTime: '10:00' };
  };

  // Helper: Find slot by ID (supports both contentId and topicId patterns)
  const findSlotById = (slots, blockId) => {
    return slots.find(s =>
      s.contentId === blockId ||
      s.topicId === blockId ||
      s.id === blockId
    );
  };

  // Transform CalendarContext slots to week view format
  const blocks = useMemo(() => {
    const { monday, sunday } = getWeekDateRange(currentDate);
    const weekBlocks = [];

    // Iterate through each day of the week
    for (let d = new Date(monday); d <= sunday; d.setDate(d.getDate() + 1)) {
      const dateKey = formatDateKey(d);
      const daySlots = slotsByDate[dateKey] || [];

      // Convert slots to learning blocks for this day
      const learningBlocks = slotsToLearningBlocks(daySlots);

      // Transform to week view format with times
      learningBlocks.forEach(block => {
        if (block.isAddButton) return; // Skip add buttons

        // Find the original slot to get position and other data (supports both contentId and topicId)
        const originalSlot = findSlotById(daySlots, block.id);
        const position = originalSlot?.position || 1;
        // Use slot's time settings if available, otherwise use position-based defaults
        const defaultTimes = getTimeForPosition(position);
        const startTime = originalSlot?.startTime || defaultTimes.startTime;
        const endTime = originalSlot?.endTime || defaultTimes.endTime;

        weekBlocks.push({
          id: block.id,
          contentId: block.contentId || originalSlot?.contentId,
          topicId: block.topicId || originalSlot?.topicId,
          title: block.title,
          blockType: block.blockType || 'lernblock',
          blockSize: block.blockSize || 1,
          startDate: dateKey,
          startTime,
          endTime,
          isMultiDay: false,
          description: block.description || '',
          rechtsgebiet: block.rechtsgebiet,
          unterrechtsgebiet: block.unterrechtsgebiet,
          // Time settings from slot
          hasTime: originalSlot?.hasTime || false,
          startHour: originalSlot?.startHour,
          duration: originalSlot?.duration,
          // Repeat settings from slot
          repeatEnabled: originalSlot?.repeatEnabled || false,
          repeatType: originalSlot?.repeatType,
          repeatCount: originalSlot?.repeatCount,
          customDays: originalSlot?.customDays,
          // Tasks from slot
          tasks: originalSlot?.tasks || [],
        });
      });
    }

    return weekBlocks;
  }, [currentDate, slotsByDate]);

  // Transform CalendarContext private blocks to week view format
  const privateBlocks = useMemo(() => {
    const { monday, sunday } = getWeekDateRange(currentDate);
    const weekPrivateBlocks = [];

    // Iterate through each day of the week
    for (let d = new Date(monday); d <= sunday; d.setDate(d.getDate() + 1)) {
      const dateKey = formatDateKey(d);
      const dayPrivateBlocks = privateBlocksByDate[dateKey] || [];

      dayPrivateBlocks.forEach(block => {
        weekPrivateBlocks.push({
          ...block,
          startDate: dateKey,
          blockType: 'private',
          // Ensure time and repeat settings are included
          hasTime: block.hasTime !== undefined ? block.hasTime : true,
          repeatEnabled: block.repeatEnabled || false,
          repeatType: block.repeatType,
          repeatCount: block.repeatCount,
          customDays: block.customDays,
        });
      });
    }

    return weekPrivateBlocks;
  }, [currentDate, privateBlocksByDate]);

  // Get week number - returns "Kalenderwoche X" format
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `Kalenderwoche ${weekNo}`;
  };

  // Navigate to previous week
  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  // Navigate to next week
  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Handle block click - open appropriate manage dialog
  const handleBlockClick = (block, date) => {
    setSelectedBlock(block);
    setSelectedDate(date);

    switch (block.blockType) {
      case 'lernblock':
        setIsManageThemeOpen(true);
        break;
      case 'repetition':
        setIsManageRepetitionOpen(true);
        break;
      case 'exam':
        setIsManageExamOpen(true);
        break;
      case 'private':
        setIsManagePrivateOpen(true);
        break;
      default:
        break;
    }
  };

  // Handle slot click - open add block dialog
  const handleSlotClick = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setIsAddDialogOpen(true);
  };

  // Handle block type selection from AddThemeDialog
  const handleSelectBlockType = (type) => {
    setIsAddDialogOpen(false);
    switch (type) {
      case 'lernblock':
        setIsCreateThemeOpen(true);
        break;
      case 'repetition':
        setIsCreateRepetitionOpen(true);
        break;
      case 'exam':
        setIsCreateExamOpen(true);
        break;
      case 'private':
        setIsCreatePrivateOpen(true);
        break;
      default:
        break;
    }
  };

  // Update a block - uses CalendarContext
  // Supports both contentId and topicId patterns for cross-view compatibility
  const handleUpdateBlock = (date, updatedBlock) => {
    const dateKey = date ? formatDateKey(date) : updatedBlock.startDate;

    if (updatedBlock.blockType === 'private') {
      // Update private block in CalendarContext
      updatePrivateBlock(dateKey, updatedBlock.id, updatedBlock);
    } else {
      // Update learning block in CalendarContext (update the slot)
      const daySlots = slotsByDate[dateKey] || [];
      const updatedSlots = daySlots.map(slot => {
        // Match by contentId, topicId, or id (supports both patterns)
        const isMatch =
          slot.contentId === updatedBlock.id ||
          slot.contentId === updatedBlock.contentId ||
          slot.topicId === updatedBlock.id ||
          slot.topicId === updatedBlock.topicId ||
          slot.id === updatedBlock.id;

        if (isMatch) {
          return {
            ...slot,
            // Update title in both patterns
            title: updatedBlock.title,
            topicTitle: updatedBlock.title,
            blockType: updatedBlock.blockType,
            description: updatedBlock.description,
            rechtsgebiet: updatedBlock.rechtsgebiet,
            unterrechtsgebiet: updatedBlock.unterrechtsgebiet,
            // Time settings
            hasTime: updatedBlock.hasTime || false,
            startTime: updatedBlock.startTime,
            endTime: updatedBlock.endTime,
            startHour: updatedBlock.startHour,
            duration: updatedBlock.duration,
            // Repeat settings
            repeatEnabled: updatedBlock.repeatEnabled || false,
            repeatType: updatedBlock.repeatType,
            repeatCount: updatedBlock.repeatCount,
            customDays: updatedBlock.customDays,
            // Tasks
            tasks: updatedBlock.tasks || [],
            updatedAt: new Date().toISOString(),
          };
        }
        return slot;
      });
      updateDaySlots(dateKey, updatedSlots);
    }
  };

  // Delete a block - uses CalendarContext
  // Supports both contentId and topicId patterns for cross-view compatibility
  const handleDeleteBlock = (date, blockId) => {
    const dateKey = date ? formatDateKey(date) : null;
    if (!dateKey) return;

    // Check if it's a private block
    const dayPrivateBlocks = privateBlocksByDate[dateKey] || [];
    const isPrivate = dayPrivateBlocks.some(b => b.id === blockId);

    if (isPrivate) {
      deletePrivateBlock(dateKey, blockId);
    } else {
      // Delete learning block by removing the slot entirely
      // This is more compatible with Dashboard's delete behavior
      const daySlots = slotsByDate[dateKey] || [];
      const updatedSlots = daySlots.filter(slot => {
        // Match by contentId, topicId, or id (supports both patterns)
        const isMatch =
          slot.contentId === blockId ||
          slot.topicId === blockId ||
          slot.id === blockId;
        return !isMatch;
      });
      updateDaySlots(dateKey, updatedSlots);
    }
  };

  // Generate repeat dates based on repeat settings
  const generateRepeatDates = (startDate, repeatType, repeatCount, customDays) => {
    const dates = [startDate];
    const currentDate = new Date(startDate);

    for (let i = 1; i < repeatCount; i++) {
      if (repeatType === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
        dates.push(new Date(currentDate));
      } else if (repeatType === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
        dates.push(new Date(currentDate));
      } else if (repeatType === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
        dates.push(new Date(currentDate));
      } else if (repeatType === 'custom' && customDays && customDays.length > 0) {
        // Find next matching day
        let found = false;
        let attempts = 0;
        while (!found && attempts < 365) {
          currentDate.setDate(currentDate.getDate() + 1);
          attempts++;
          if (customDays.includes(currentDate.getDay())) {
            dates.push(new Date(currentDate));
            found = true;
          }
        }
      }
    }
    return dates;
  };

  // Add a slot for a single date (helper function)
  const addSlotForDate = (date, blockData, blockId) => {
    const dateKey = formatDateKey(date);
    const daySlots = slotsByDate[dateKey] || [];

    // Find next available position
    const usedPositions = daySlots
      .filter(s => s.status === 'topic' || s.contentId || s.topicId)
      .map(s => s.position);
    let nextPosition = 1;
    while (usedPositions.includes(nextPosition) && nextPosition <= 4) {
      nextPosition++;
    }

    if (nextPosition > 4) {
      console.warn('No available slots for date:', dateKey);
      return null;
    }

    const newSlot = {
      id: `slot-${dateKey}-${nextPosition}-${Date.now()}`,
      date: dateKey,
      position: nextPosition,
      status: 'topic',
      contentId: blockId,
      topicId: blockId,
      title: blockData.title,
      topicTitle: blockData.title,
      blockType: blockData.blockType || 'lernblock',
      description: blockData.description || '',
      rechtsgebiet: blockData.rechtsgebiet,
      unterrechtsgebiet: blockData.unterrechtsgebiet,
      hasTime: blockData.hasTime || false,
      startTime: blockData.startTime,
      endTime: blockData.endTime,
      startHour: blockData.startHour,
      duration: blockData.duration,
      repeatEnabled: false, // Individual slots don't need repeat flag
      tasks: blockData.tasks || [],
      isFromLernplan: false,
      createdAt: new Date().toISOString(),
    };

    const existingSlotIndex = daySlots.findIndex(s => s.position === nextPosition);
    let updatedSlots;
    if (existingSlotIndex >= 0) {
      updatedSlots = [...daySlots];
      updatedSlots[existingSlotIndex] = newSlot;
    } else {
      updatedSlots = [...daySlots, newSlot];
    }

    return { dateKey, updatedSlots };
  };

  // Add a new learning block - uses CalendarContext
  // Creates slots compatible with both contentId and topicId patterns
  // Supports creating multiple slots when repeat is enabled
  const handleAddBlock = (_date, blockData) => {
    const startDate = selectedDate || new Date();
    const blockId = blockData.id || `content-${Date.now()}`;

    // Check if repeat is enabled
    if (blockData.repeatEnabled && blockData.repeatCount > 1) {
      // Generate all dates for the repeat
      const repeatDates = generateRepeatDates(
        startDate,
        blockData.repeatType,
        blockData.repeatCount,
        blockData.customDays
      );

      // Create slots for each date
      const updates = {};
      repeatDates.forEach((date, index) => {
        const result = addSlotForDate(date, blockData, `${blockId}-${index}`);
        if (result) {
          // Merge with any existing updates for this date
          if (updates[result.dateKey]) {
            updates[result.dateKey] = [...updates[result.dateKey], ...result.updatedSlots.filter(s =>
              !updates[result.dateKey].some(existing => existing.id === s.id)
            )];
          } else {
            updates[result.dateKey] = result.updatedSlots;
          }
        }
      });

      // Apply all updates
      Object.entries(updates).forEach(([dateKey, slots]) => {
        updateDaySlots(dateKey, slots);
      });
    } else {
      // Single slot creation (original behavior)
      const result = addSlotForDate(startDate, blockData, blockId);
      if (result) {
        updateDaySlots(result.dateKey, result.updatedSlots);
      }
    }
  };

  // Calculate end time based on start time and block size (1 slot = 2 hours)
  const calculateEndTime = (startTime, blockSize) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (blockSize * 120); // 2 hours per slot
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // Add a new private block - uses CalendarContext
  const handleAddPrivateBlock = (_date, blockData) => {
    const dateKey = selectedDate ? formatDateKey(selectedDate) : new Date().toISOString().split('T')[0];
    addPrivateBlock(dateKey, {
      ...blockData,
      startTime: blockData.startTime || selectedTime || '09:00',
      endTime: blockData.endTime || calculateEndTime(selectedTime || '09:00', blockData.blockSize || 1),
      // Time settings
      hasTime: blockData.hasTime !== undefined ? blockData.hasTime : true,
      startHour: blockData.startHour,
      duration: blockData.duration,
      // Repeat settings
      repeatEnabled: blockData.repeatEnabled || false,
      repeatType: blockData.repeatType,
      repeatCount: blockData.repeatCount,
      customDays: blockData.customDays,
    });
  };

  return (
    <div className={`flex flex-col bg-white h-[calc(100vh-64px)] ${className}`}>
      <WeekViewHeader
        weekTitle={getWeekNumber(currentDate)}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
      />
      <WeekGrid
        currentDate={currentDate}
        blocks={blocks}
        privateBlocks={privateBlocks}
        onBlockClick={handleBlockClick}
        onSlotClick={handleSlotClick}
      />

      {/* Manage Theme Block Dialog */}
      <ManageThemeBlockDialog
        open={isManageThemeOpen}
        onOpenChange={setIsManageThemeOpen}
        date={selectedDate}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableSlots={4}
      />

      {/* Manage Repetition Block Dialog */}
      <ManageRepetitionBlockDialog
        open={isManageRepetitionOpen}
        onOpenChange={setIsManageRepetitionOpen}
        date={selectedDate}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableSlots={4}
      />

      {/* Manage Exam Block Dialog */}
      <ManageExamBlockDialog
        open={isManageExamOpen}
        onOpenChange={setIsManageExamOpen}
        date={selectedDate}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableSlots={4}
      />

      {/* Manage Private Block Dialog */}
      <ManagePrivateBlockDialog
        open={isManagePrivateOpen}
        onOpenChange={setIsManagePrivateOpen}
        date={selectedDate}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
      />

      {/* Add Block Type Selection Dialog */}
      <AddThemeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        date={selectedDate}
        onSelectType={handleSelectBlockType}
      />

      {/* Create Theme Block Dialog */}
      <CreateThemeBlockDialog
        open={isCreateThemeOpen}
        onOpenChange={setIsCreateThemeOpen}
        date={selectedDate}
        onSave={handleAddBlock}
        availableSlots={4}
      />

      {/* Create Repetition Block Dialog */}
      <CreateRepetitionBlockDialog
        open={isCreateRepetitionOpen}
        onOpenChange={setIsCreateRepetitionOpen}
        date={selectedDate}
        onSave={handleAddBlock}
        availableSlots={4}
      />

      {/* Create Exam Block Dialog */}
      <CreateExamBlockDialog
        open={isCreateExamOpen}
        onOpenChange={setIsCreateExamOpen}
        date={selectedDate}
        onSave={handleAddBlock}
        availableSlots={4}
      />

      {/* Create Private Block Dialog */}
      <CreatePrivateBlockDialog
        open={isCreatePrivateOpen}
        onOpenChange={setIsCreatePrivateOpen}
        date={selectedDate}
        initialTime={selectedTime}
        onSave={handleAddPrivateBlock}
      />
    </div>
  );
};

export default WeekView;
