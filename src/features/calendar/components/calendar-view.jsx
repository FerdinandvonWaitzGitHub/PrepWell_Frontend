import { useState, useCallback } from 'react';
import CalendarHeader from './calendar-header';
import CalendarGrid from './calendar-grid';
import DayManagementDialog from './day-management-dialog';
import AddThemeDialog from './add-theme-dialog';
import CreateThemeSessionDialog from './create-theme-session-dialog';
import CreateRepetitionSessionDialog from './create-repetition-session-dialog';
import CreateExamSessionDialog from './create-exam-session-dialog';
import CreatePrivateSessionDialog from './create-private-session-dialog';
import ManageThemeSessionDialog from './manage-theme-session-dialog'; // Bug 2b fix
import { useCalendar } from '../../../contexts/calendar-context';
import {
  createDayBlocks,
  createEmptyBlock,
  formatDateKey,
  canPlaceTopic,
  getAvailableBlockPositions,
  createTopicBlocks,
  updateDayBlocks,
  blocksToLearningSessions
} from '../../../utils/blockUtils';

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
  // Bug 2b fix: State for block click dialog
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);

  // Use CalendarContext for shared calendar data
  // This data comes from the wizard Step 8 and persists in localStorage
  const {
    blocksByDate,
    visibleBlocksByDate, // BUG-010 FIX: Use filtered blocks for display
    privateBlocksByDate,
    updateDayBlocks: updateContextDayBlocks,
    addPrivateBlock,
    deletePrivateBlock,
    addTimeBlock, // Bug 2a fix: Also add to time_sessions for week view sync
  } = useCalendar();

  // Use context data directly
  const allBlocksByDate = blocksByDate;
  const displayBlocksByDate = visibleBlocksByDate || blocksByDate || {};

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

    const currentBlocks = allBlocksByDate[dateKey];
    if (!currentBlocks) return;

    // Find the block items belonging to this block - support multiple ID patterns
    const blockItems = currentBlocks.filter(s =>
      s.topicId === updatedBlockData.id ||
      s.contentId === updatedBlockData.id ||
      s.id === updatedBlockData.id
    );
    if (blockItems.length === 0) return;

    const oldBlockSize = blockItems.length;
    const newBlockSize = updatedBlockData.blockSize || oldBlockSize;

    // If size changed, we need to recalculate blocks
    if (newBlockSize !== oldBlockSize) {
      // First, clear the old blocks - match by multiple ID patterns
      let updatedBlocks = currentBlocks.map(block => {
        if (block.topicId === updatedBlockData.id ||
            block.contentId === updatedBlockData.id ||
            block.id === updatedBlockData.id) {
          return createEmptyBlock(date, block.position);
        }
        return block;
      });

      // Check if we can place the new size
      const freeBlocks = updatedBlocks.filter(s => s.status === 'empty').length;
      if (freeBlocks < newBlockSize) {
        console.warn(`Cannot resize block: Not enough free blocks. Need ${newBlockSize}, have ${freeBlocks}`);
        return;
      }

      // Get positions for new size
      const positions = getAvailableBlockPositions(updatedBlocks, newBlockSize);
      if (!positions) return;

      // Create new topic blocks with updated data
      const topicBlocks = createTopicBlocks(date, positions, {
        id: updatedBlockData.id,
        title: updatedBlockData.title,
        blockType: updatedBlockData.blockType,
        progress: updatedBlockData.progress,
        description: updatedBlockData.description,
        rechtsgebiet: updatedBlockData.rechtsgebiet,
        unterrechtsgebiet: updatedBlockData.unterrechtsgebiet,
        tasks: updatedBlockData.tasks
      });

      updatedBlocks = updateDayBlocks(updatedBlocks, topicBlocks);

      // Save to CalendarContext (persists to localStorage)
      updateContextDayBlocks(dateKey, updatedBlocks);
    } else {
      // Size unchanged, just update the data in existing blocks - match by multiple ID patterns
      const updatedBlocks = currentBlocks.map(block => {
        if (block.topicId === updatedBlockData.id ||
            block.contentId === updatedBlockData.id ||
            block.id === updatedBlockData.id) {
          return {
            ...block,
            title: updatedBlockData.title,
            topicTitle: updatedBlockData.title,
            blockType: updatedBlockData.blockType,
            progress: updatedBlockData.progress,
            description: updatedBlockData.description,
            updatedAt: new Date().toISOString()
          };
        }
        return block;
      });

      // Save to CalendarContext (persists to localStorage)
      updateContextDayBlocks(dateKey, updatedBlocks);
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

    // Delete learning block (block-based)
    const currentBlocks = allBlocksByDate[dateKey];
    if (!currentBlocks) return;

    // Replace block items with empty blocks
    const updatedBlocks = currentBlocks.map(block => {
      if (block.topicId === blockId || block.contentId === blockId || block.id === blockId) {
        return createEmptyBlock(date, block.position);
      }
      return block;
    });

    // Save to CalendarContext (persists to localStorage)
    updateContextDayBlocks(dateKey, updatedBlocks);
  };

  // Add a learning block to a specific date (Block-based)
  const handleAddBlock = (date, blockData) => {
    const dateKey = formatDateKey(date);

    // Get current blocks for this day, or create empty ones
    const currentBlocks = allBlocksByDate[dateKey] || createDayBlocks(date);

    // Check if we have enough free blocks
    const sizeNeeded = blockData.blockSize || 1;

    if (!canPlaceTopic(currentBlocks, sizeNeeded)) {
      console.warn(`Cannot add block: Not enough free blocks. Need ${sizeNeeded}, but day is full.`);
      // TODO: Show user error message
      return;
    }

    // Get available block positions
    const positions = getAvailableBlockPositions(currentBlocks, sizeNeeded);
    if (!positions) {
      console.warn('Cannot get available positions');
      return;
    }

    // Bug 2a fix: Generate shared ID for both block and time_session
    const sharedBlockId = blockData.id || `topic-${Date.now()}`;

    // Create new topic blocks
    const topicBlocks = createTopicBlocks(date, positions, {
      id: sharedBlockId,
      title: blockData.title,
      blockType: blockData.blockType,
      progress: blockData.progress,
      description: blockData.description,
      rechtsgebiet: blockData.rechtsgebiet,
      unterrechtsgebiet: blockData.unterrechtsgebiet,
      tasks: blockData.tasks
    });

    // Update day blocks
    const updatedBlocks = updateDayBlocks(currentBlocks, topicBlocks);

    // Save to CalendarContext (persists to localStorage)
    updateContextDayBlocks(dateKey, updatedBlocks);

    // Bug 2a fix: Also create a time block for week view synchronization
    // Position-based default times
    const defaultTimes = {
      1: { start: '08:00', end: '10:00' },
      2: { start: '10:00', end: '12:00' },
      3: { start: '14:00', end: '16:00' },
      4: { start: '16:00', end: '18:00' },
    };
    const firstPosition = positions[0] || 1;
    const defaults = defaultTimes[firstPosition] || defaultTimes[1];

    if (addTimeBlock) {
      addTimeBlock(dateKey, {
        id: sharedBlockId, // Bug 2a fix: Use same ID for linking
        title: blockData.title,
        blockType: blockData.blockType,
        description: blockData.description || '',
        rechtsgebiet: blockData.rechtsgebiet,
        unterrechtsgebiet: blockData.unterrechtsgebiet,
        tasks: blockData.tasks || [],
        startTime: defaults.start,
        endTime: defaults.end,
        isFromMonthView: true, // Mark as created from month view
      });
    }
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

  // Learning blocks - convert from block allocations only (no private sessions in month view)
  // BUG-023 FIX: Monatsansicht shows only BlockAllocations, no Sessions
  const getSampleLearningBlocks = (day) => {
    // Create date for this day
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = formatDateKey(date);

    // Get blocks for this date, or create empty ones
    // BUG-010 FIX: Use displayBlocksByDate to exclude archived content plans
    const dayBlocks = displayBlocksByDate[dateKey] || createDayBlocks(date);

    // Convert block allocations to learning sessions for display
    // Note: Private sessions are NOT shown in month view (BUG-023)
    let blocks = blocksToLearningSessions(dayBlocks);

    // Count free blocks to determine if plus button should be shown
    const freeBlocks = dayBlocks.filter(s => s.status === 'empty').length;

    // If there are free blocks (less than 3 blocks occupied), add a plus button
    if (freeBlocks > 0) {
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

  // Bug 2b fix: Handle block click to open block dialog instead of day dialog
  const handleBlockClick = useCallback((block) => {
    console.log('Block clicked:', block);
    setSelectedBlock(block);
    setIsBlockDialogOpen(true);
  }, []);

  // Bug 2b fix: Handle block save from ManageThemeSessionDialog
  const handleBlockSave = useCallback((updatedBlockData) => {
    if (!selectedBlock) return;

    // Get the date from the selected block
    const blockDate = selectedBlock.date || selectedDay?.date;
    if (blockDate) {
      handleUpdateBlock(blockDate, {
        ...updatedBlockData,
        id: selectedBlock.id || selectedBlock.topicId || selectedBlock.contentId,
      });
    }
    setIsBlockDialogOpen(false);
    setSelectedBlock(null);
  }, [selectedBlock, selectedDay?.date]);

  // Bug 2b fix: Handle block delete from ManageThemeSessionDialog
  const handleBlockDelete = useCallback(() => {
    if (!selectedBlock) return;

    const blockDate = selectedBlock.date || selectedDay?.date;
    const blockId = selectedBlock.id || selectedBlock.topicId || selectedBlock.contentId;
    if (blockDate && blockId) {
      handleDeleteBlock(blockDate, blockId, selectedBlock.isPrivate);
    }
    setIsBlockDialogOpen(false);
    setSelectedBlock(null);
  }, [selectedBlock, selectedDay?.date]);

  // Get available blocks for a specific date
  const getAvailableBlocksForDate = (date) => {
    if (!date) return 3;
    const dateKey = formatDateKey(date);
    const dayBlocks = allBlocksByDate[dateKey] || createDayBlocks(date);
    return dayBlocks.filter(s => s.status === 'empty').length;
  };

  // Get learning blocks for a specific date (computed from block allocations only)
  // BUG-023 FIX: Monatsansicht shows only BlockAllocations, no Sessions
  const getBlocksForDate = (date) => {
    if (!date) return [];
    const dateKey = formatDateKey(date);
    // BUG-010 FIX: Use displayBlocksByDate to exclude archived content plans
    const dayBlocks = displayBlocksByDate[dateKey] || createDayBlocks(date);
    const blocks = blocksToLearningSessions(dayBlocks);

    // Note: Private sessions are NOT shown in month view (BUG-023)
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
        onBlockClick={handleBlockClick}
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
        availableBlocks={getAvailableBlocksForDate(selectedDay?.date)}
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

      {/* Create Theme Session Dialog - BUG-023: Use block mode for Month view */}
      <CreateThemeSessionDialog
        open={isCreateThemeDialogOpen}
        onOpenChange={setIsCreateThemeDialogOpen}
        date={selectedThemeDay}
        onSave={handleAddBlock}
        availableBlocks={getAvailableBlocksForDate(selectedThemeDay)}
        mode="block"
      />

      {/* Create Repetition Session Dialog - BUG-023: Use block mode for Month view */}
      <CreateRepetitionSessionDialog
        open={isCreateRepetitionDialogOpen}
        onOpenChange={setIsCreateRepetitionDialogOpen}
        date={selectedBlockDay}
        onSave={handleAddBlock}
        availableBlocks={getAvailableBlocksForDate(selectedBlockDay)}
        mode="block"
      />

      {/* Create Exam Session Dialog - BUG-023: Use block mode for Month view */}
      <CreateExamSessionDialog
        open={isCreateExamDialogOpen}
        onOpenChange={setIsCreateExamDialogOpen}
        date={selectedBlockDay}
        onSave={handleAddBlock}
        availableBlocks={getAvailableBlocksForDate(selectedBlockDay)}
        mode="block"
      />

      {/* Create Private Session Dialog - BUG-023: Use block mode for Month view */}
      <CreatePrivateSessionDialog
        open={isCreatePrivateDialogOpen}
        onOpenChange={setIsCreatePrivateDialogOpen}
        date={selectedBlockDay}
        onSave={handleAddPrivateBlock}
        availableBlocks={getAvailableBlocksForDate(selectedBlockDay)}
        mode="block"
      />

      {/* Bug 2b fix: Manage Theme Session Dialog for existing blocks */}
      <ManageThemeSessionDialog
        open={isBlockDialogOpen}
        onOpenChange={(open) => {
          setIsBlockDialogOpen(open);
          if (!open) setSelectedBlock(null);
        }}
        date={selectedBlock?.date || selectedDay?.date}
        block={selectedBlock}
        onSave={handleBlockSave}
        onDelete={handleBlockDelete}
        availableBlocks={getAvailableBlocksForDate(selectedBlock?.date || selectedDay?.date)}
      />
    </div>
  );
};

export default CalendarView;
