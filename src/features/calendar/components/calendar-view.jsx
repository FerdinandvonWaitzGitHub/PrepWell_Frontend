import { useState } from 'react';
import CalendarHeader from './calendar-header';
import CalendarGrid from './calendar-grid';
import DayManagementDialog from './day-management-dialog';
import AddThemeDialog from './add-theme-dialog';
import CreateThemeSessionDialog from './create-theme-session-dialog';
import CreateRepetitionSessionDialog from './create-repetition-session-dialog';
import CreateExamSessionDialog from './create-exam-session-dialog';
import CreatePrivateSessionDialog from './create-private-session-dialog';
import { useCalendar } from '../../../contexts/calendar-context';
import {
  createDaySlots,
  createEmptySlot,
  formatDateKey,
  canPlaceTopic,
  getAvailableSlotPositions,
  createTopicSlots,
  updateDaySlots,
  slotsToLearningBlocks
} from '../../../utils/slotUtils';

/**
 * CalendarView component
 * Main calendar view for exam mode (Examensmodus)
 * Displays monthly calendar with learning blocks
 */
const CalendarView = ({ initialDate = new Date(), className = '' }) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAddDay, setSelectedAddDay] = useState(null);
  const [isCreateThemeDialogOpen, setIsCreateThemeDialogOpen] = useState(false);
  const [selectedThemeDay, setSelectedThemeDay] = useState(null);
  const [isCreateRepetitionDialogOpen, setIsCreateRepetitionDialogOpen] = useState(false);
  const [isCreateExamDialogOpen, setIsCreateExamDialogOpen] = useState(false);
  const [isCreatePrivateDialogOpen, setIsCreatePrivateDialogOpen] = useState(false);
  const [selectedBlockDay, setSelectedBlockDay] = useState(null);

  // Use CalendarContext for shared calendar data
  // This data comes from the wizard Step 8 and persists in localStorage
  const {
    slotsByDate,
    visibleSlotsByDate, // BUG-010 FIX: Use filtered slots for display
    privateBlocksByDate,
    updateDaySlots: updateContextDaySlots,
    addPrivateBlock,
    deletePrivateBlock,
  } = useCalendar();

  // Update an existing learning block or private block
  const handleUpdateBlock = (date, updatedBlockData) => {
    const dateKey = formatDateKey(date);

    // Check if this is a private block
    const dayPrivateBlocks = privateBlocksByDate[dateKey] || [];
    const isPrivateBlock = updatedBlockData.isPrivate || dayPrivateBlocks.some(b => b.id === updatedBlockData.id);

    if (isPrivateBlock) {
      // Handle private block update - not implemented in this view
      // Private blocks should be edited via the week view or a dedicated dialog
      console.log('Private block update not implemented in month view');
      return;
    }

    const currentSlots = slotsByDate[dateKey];
    if (!currentSlots) return;

    // Find the slots belonging to this block - support multiple ID patterns
    const blockSlots = currentSlots.filter(s =>
      s.topicId === updatedBlockData.id ||
      s.contentId === updatedBlockData.id ||
      s.id === updatedBlockData.id
    );
    if (blockSlots.length === 0) return;

    const oldBlockSize = blockSlots.length;
    const newBlockSize = updatedBlockData.blockSize || oldBlockSize;

    // If size changed, we need to recalculate slots
    if (newBlockSize !== oldBlockSize) {
      // First, clear the old slots - match by multiple ID patterns
      let updatedSlots = currentSlots.map(slot => {
        if (slot.topicId === updatedBlockData.id ||
            slot.contentId === updatedBlockData.id ||
            slot.id === updatedBlockData.id) {
          return createEmptySlot(date, slot.position);
        }
        return slot;
      });

      // Check if we can place the new size
      const freeSlots = updatedSlots.filter(s => s.status === 'empty').length;
      if (freeSlots < newBlockSize) {
        console.warn(`Cannot resize block: Not enough free slots. Need ${newBlockSize}, have ${freeSlots}`);
        return;
      }

      // Get positions for new size
      const positions = getAvailableSlotPositions(updatedSlots, newBlockSize);
      if (!positions) return;

      // Create new topic slots with updated data
      const topicSlots = createTopicSlots(date, positions, {
        id: updatedBlockData.id,
        title: updatedBlockData.title,
        blockType: updatedBlockData.blockType,
        progress: updatedBlockData.progress,
        description: updatedBlockData.description,
        rechtsgebiet: updatedBlockData.rechtsgebiet,
        unterrechtsgebiet: updatedBlockData.unterrechtsgebiet,
        tasks: updatedBlockData.tasks
      });

      updatedSlots = updateDaySlots(updatedSlots, topicSlots);

      // Save to CalendarContext (persists to localStorage)
      updateContextDaySlots(dateKey, updatedSlots);
    } else {
      // Size unchanged, just update the data in existing slots - match by multiple ID patterns
      const updatedSlots = currentSlots.map(slot => {
        if (slot.topicId === updatedBlockData.id ||
            slot.contentId === updatedBlockData.id ||
            slot.id === updatedBlockData.id) {
          return {
            ...slot,
            title: updatedBlockData.title,
            topicTitle: updatedBlockData.title,
            blockType: updatedBlockData.blockType,
            progress: updatedBlockData.progress,
            description: updatedBlockData.description,
            updatedAt: new Date().toISOString()
          };
        }
        return slot;
      });

      // Save to CalendarContext (persists to localStorage)
      updateContextDaySlots(dateKey, updatedSlots);
    }
  };

  // Delete a learning block or private block
  const handleDeleteBlock = (date, blockId, isPrivate = false) => {
    const dateKey = formatDateKey(date);

    // Check if this is a private block
    const dayPrivateBlocks = privateBlocksByDate[dateKey] || [];
    const isPrivateBlock = isPrivate || dayPrivateBlocks.some(b => b.id === blockId);

    if (isPrivateBlock) {
      // Delete private block
      deletePrivateBlock(dateKey, blockId);
      return;
    }

    // Delete learning block (slot-based)
    const currentSlots = slotsByDate[dateKey];
    if (!currentSlots) return;

    // Replace block slots with empty slots
    const updatedSlots = currentSlots.map(slot => {
      if (slot.topicId === blockId || slot.contentId === blockId || slot.id === blockId) {
        return createEmptySlot(date, slot.position);
      }
      return slot;
    });

    // Save to CalendarContext (persists to localStorage)
    updateContextDaySlots(dateKey, updatedSlots);
  };

  // Add a learning block to a specific date (Slot-based)
  const handleAddBlock = (date, blockData) => {
    const dateKey = formatDateKey(date);

    // Get current slots for this day, or create empty ones
    const currentSlots = slotsByDate[dateKey] || createDaySlots(date);

    // Check if we have enough free slots
    const sizeNeeded = blockData.blockSize || 1;

    if (!canPlaceTopic(currentSlots, sizeNeeded)) {
      console.warn(`Cannot add block: Not enough free slots. Need ${sizeNeeded}, but day is full.`);
      // TODO: Show user error message
      return;
    }

    // Get available slot positions
    const positions = getAvailableSlotPositions(currentSlots, sizeNeeded);
    if (!positions) {
      console.warn('Cannot get available positions');
      return;
    }

    // Create new topic slots
    const topicSlots = createTopicSlots(date, positions, {
      id: blockData.id || `topic-${Date.now()}`,
      title: blockData.title,
      blockType: blockData.blockType,
      progress: blockData.progress,
      description: blockData.description,
      rechtsgebiet: blockData.rechtsgebiet,
      unterrechtsgebiet: blockData.unterrechtsgebiet,
      tasks: blockData.tasks
    });

    // Update day slots
    const updatedSlots = updateDaySlots(currentSlots, topicSlots);

    // Save to CalendarContext (persists to localStorage)
    updateContextDaySlots(dateKey, updatedSlots);
  };

  // Add a private block (with repeat support)
  const handleAddPrivateBlock = (date, blockData) => {
    const dateKey = formatDateKey(date);
    addPrivateBlock(dateKey, {
      ...blockData,
      startTime: blockData.startTime || '09:00',
      endTime: blockData.endTime || '11:00',
    });
  };

  // Note: Calendar data now comes from CalendarContext
  // The data is populated when the user completes the Lernplan Wizard (Step 8)
  // No sample data initialization needed anymore

  // Get month and year
  const getMonthYear = (date) => {
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate days for the calendar
  // This is a simplified version - you would fetch this data from your backend
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Convert to Monday = 0, Sunday = 6
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days = [];

    // Add days from previous month to fill the first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        learningBlocks: []
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        learningBlocks: getSampleLearningBlocks(day) // Replace with real data
      });
    }

    // Add days from next month to complete the grid (6 weeks minimum)
    const remainingDays = 42 - days.length; // Show 6 weeks
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        learningBlocks: []
      });
    }

    return days;
  };

  // Learning blocks - convert from slots only (no private blocks in month view)
  // BUG-023 FIX: Monatsansicht shows only Slots, no Blöcke (private, lernblock, etc.)
  const getSampleLearningBlocks = (day) => {
    // Create date for this day
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = formatDateKey(date);

    // Get slots for this date, or create empty ones
    // BUG-010 FIX: Use visibleSlotsByDate to exclude archived content plans
    const slots = visibleSlotsByDate[dateKey] || createDaySlots(date);

    // Convert slots to learning blocks for display
    // Note: Private blocks are NOT shown in month view (BUG-023)
    let blocks = slotsToLearningBlocks(slots);

    // Count free slots to determine if plus button should be shown
    const freeSlots = slots.filter(s => s.status === 'empty').length;

    // If there are free slots (less than 3 slots occupied), add a plus button
    if (freeSlots > 0) {
      blocks = [...blocks, { isAddButton: true }];
    }

    return blocks;
  };

  const today = new Date().getDate();
  const isCurrentMonth =
    currentDate.getMonth() === new Date().getMonth() &&
    currentDate.getFullYear() === new Date().getFullYear();

  // Handle day click to open management dialog
  const handleDayClick = (day, learningBlocks) => {
    console.log('Day clicked:', day, learningBlocks);

    if (!day.isCurrentMonth) {
      console.log('Day is not in current month, ignoring click');
      return; // Only allow clicking current month days
    }

    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day.day
    );

    // Filter out add buttons and out of range blocks
    const actualBlocks = learningBlocks.filter(
      block => !block.isAddButton && !block.isOutOfRange
    );

    console.log('Opening dialog with:', { clickedDate, actualBlocks });

    setSelectedDay({
      date: clickedDate,
      learningBlocks: actualBlocks
    });
    setIsDialogOpen(true);
  };

  // Handle add button click to open add theme dialog
  const handleAddClick = (day) => {
    console.log('Add button clicked for day:', day);

    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day.day
    );

    console.log('Opening add theme dialog for:', clickedDate);

    setSelectedAddDay(clickedDate);
    setIsAddDialogOpen(true);
  };

  // Get available slots for a specific date
  const getAvailableSlotsForDate = (date) => {
    if (!date) return 3;
    const dateKey = formatDateKey(date);
    const slots = slotsByDate[dateKey] || createDaySlots(date);
    return slots.filter(s => s.status === 'empty').length;
  };

  // Get learning blocks for a specific date (computed from slots only)
  // BUG-023 FIX: Monatsansicht shows only Slots, no Blöcke
  const getBlocksForDate = (date) => {
    if (!date) return [];
    const dateKey = formatDateKey(date);
    // BUG-010 FIX: Use visibleSlotsByDate to exclude archived content plans
    const slots = visibleSlotsByDate[dateKey] || createDaySlots(date);
    const blocks = slotsToLearningBlocks(slots);

    // Note: Private blocks are NOT shown in month view (BUG-023)
    return blocks;
  };

  return (
    <div className={`flex flex-col bg-white shadow-xs rounded ${className}`}>
      <CalendarHeader
        title={getMonthYear(currentDate)}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      <CalendarGrid
        days={generateCalendarDays()}
        currentDay={isCurrentMonth ? today : null}
        onDayClick={handleDayClick}
        onAddClick={handleAddClick}
      />

      {/* Day Management Dialog */}
      <DayManagementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        date={selectedDay?.date}
        dayType="Lerntag"
        learningBlocks={getBlocksForDate(selectedDay?.date)}
        onUpdateBlock={handleUpdateBlock}
        onDeleteBlock={handleDeleteBlock}
        availableSlots={getAvailableSlotsForDate(selectedDay?.date)}
      />

      {/* Add Theme Dialog */}
      <AddThemeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        date={selectedAddDay}
        onSelectType={(type) => {
          console.log('Selected theme type:', type);
          setIsAddDialogOpen(false);
          setSelectedBlockDay(selectedAddDay);

          switch(type) {
            case 'lernblock':
              setSelectedThemeDay(selectedAddDay);
              setIsCreateThemeDialogOpen(true);
              break;
            case 'repetition':
              setIsCreateRepetitionDialogOpen(true);
              break;
            case 'exam':
              setIsCreateExamDialogOpen(true);
              break;
            case 'private':
              setIsCreatePrivateDialogOpen(true);
              break;
            default:
              console.log('Unknown block type:', type);
          }
        }}
      />

      {/* Create Theme Session Dialog - BUG-023: Use slot mode for Month view */}
      <CreateThemeSessionDialog
        open={isCreateThemeDialogOpen}
        onOpenChange={setIsCreateThemeDialogOpen}
        date={selectedThemeDay}
        onSave={handleAddBlock}
        availableSlots={getAvailableSlotsForDate(selectedThemeDay)}
        mode="slot"
      />

      {/* Create Repetition Session Dialog - BUG-023: Use slot mode for Month view */}
      <CreateRepetitionSessionDialog
        open={isCreateRepetitionDialogOpen}
        onOpenChange={setIsCreateRepetitionDialogOpen}
        date={selectedBlockDay}
        onSave={handleAddBlock}
        availableSlots={getAvailableSlotsForDate(selectedBlockDay)}
        mode="slot"
      />

      {/* Create Exam Session Dialog - BUG-023: Use slot mode for Month view */}
      <CreateExamSessionDialog
        open={isCreateExamDialogOpen}
        onOpenChange={setIsCreateExamDialogOpen}
        date={selectedBlockDay}
        onSave={handleAddBlock}
        availableSlots={getAvailableSlotsForDate(selectedBlockDay)}
        mode="slot"
      />

      {/* Create Private Session Dialog - BUG-023: Use slot mode for Month view */}
      <CreatePrivateSessionDialog
        open={isCreatePrivateDialogOpen}
        onOpenChange={setIsCreatePrivateDialogOpen}
        date={selectedBlockDay}
        onSave={handleAddPrivateBlock}
        availableSlots={getAvailableSlotsForDate(selectedBlockDay)}
        mode="slot"
      />
    </div>
  );
};

export default CalendarView;
