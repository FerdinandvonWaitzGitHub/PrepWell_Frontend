import { useState, useMemo } from 'react';
import WeekViewHeader from './week-view-header';
import WeekGrid from './week-grid';
import AddThemeDialog from './add-theme-dialog';
import CreateThemeSessionDialog from './create-theme-session-dialog';
import CreateRepetitionSessionDialog from './create-repetition-session-dialog';
import CreateExamSessionDialog from './create-exam-session-dialog';
import CreatePrivateSessionDialog from './create-private-session-dialog';
import ManageThemeSessionDialog from './manage-theme-session-dialog';
import ManageRepetitionSessionDialog from './manage-repetition-session-dialog';
import ManageExamSessionDialog from './manage-exam-session-dialog';
import ManagePrivateSessionDialog from './manage-private-session-dialog';
import { useCalendar } from '../../../contexts/calendar-context';
import { useAppMode } from '../../../contexts/appmode-context';
import { blocksToLearningSessions } from '../../../utils/blockUtils';

/**
 * WeekView component
 * Weekly calendar view for exam mode
 * Displays week schedule with time-based blocks
 *
 * Data flow: CalendarContext (blocksByDate + privateBlocksByDate) → WeekView
 */
const WeekView = ({ initialDate = new Date(), className = '' }) => {
  const [currentDate, setCurrentDate] = useState(initialDate);

  // BUG-023 FIX: Get app mode to control block visibility
  // In Normal mode: Hide Lernplan blocks (only show private blocks)
  // In Exam mode: Show Lernplan blocks in header bar
  const { isExamMode } = useAppMode();

  // Get data from CalendarContext (Single Source of Truth)
  // BUG-023 FIX: Use timeBlocksByDate for user-created blocks (time-based)
  // Use visibleBlocksByDate only for Lernplan-generated blocks (position-based, header only)
  const {
    blocksByDate,
    visibleBlocksByDate, // BUG-010 FIX: Filtered Lernplan blocks for header display
    privateBlocksByDate,
    timeBlocksByDate, // BUG-023 FIX: Time-based blocks for Week/Dashboard
    updateDayBlocks,
    addPrivateBlock,
    updatePrivateBlock,
    deletePrivateBlock,
    deleteSeriesPrivateBlocks,
    addTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
  } = useCalendar();

  // Dialog states
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null); // T9: End time for drag-to-select

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

  // Helper: Get position-based time blocks
  const getTimeForPosition = (position) => {
    const timeBlocks = {
      1: { startTime: '08:00', endTime: '10:00' },
      2: { startTime: '10:00', endTime: '12:00' },
      3: { startTime: '14:00', endTime: '16:00' },
      4: { startTime: '16:00', endTime: '18:00' },
    };
    return timeBlocks[position] || { startTime: '08:00', endTime: '10:00' };
  };

  // Helper: Find block by ID (supports both contentId and topicId patterns)
  const findBlockById = (blocks, blockId) => {
    return blocks.find(b =>
      b.contentId === blockId ||
      b.topicId === blockId ||
      b.id === blockId
    );
  };

  // Transform CalendarContext blocks to week view format
  // BUG-023 FIX: Combine time blocks (user-created) with Lernplan blocks
  // - Time blocks: Stored in timeBlocksByDate, always shown in time grid
  // - Lernplan blocks: Stored in visibleBlocksByDate
  //   - Normal mode: Hidden
  //   - Exam mode: Shown in header bar (not time grid)
  const { blocks, lernplanHeaderBlocks } = useMemo(() => {
    const { monday, sunday } = getWeekDateRange(currentDate);
    const weekBlocks = [];
    const weekLernplanBlocks = []; // For Exam mode header bar

    // Iterate through each day of the week
    for (let d = new Date(monday); d <= sunday; d.setDate(d.getDate() + 1)) {
      const dateKey = formatDateKey(d);

      // BUG-023 FIX: Add time blocks (user-created in Week/Dashboard)
      const dayTimeBlocks = (timeBlocksByDate || {})[dateKey] || [];
      dayTimeBlocks.forEach(block => {
        weekBlocks.push({
          id: block.id,
          title: block.title,
          blockType: block.blockType || 'lernblock',
          blockSize: 1,
          startDate: dateKey,
          startTime: block.startTime || '09:00',
          endTime: block.endTime || '10:00',
          isMultiDay: false,
          description: block.description || '',
          rechtsgebiet: block.rechtsgebiet,
          unterrechtsgebiet: block.unterrechtsgebiet,
          hasTime: true,
          repeatEnabled: block.repeatEnabled || false,
          repeatType: block.repeatType,
          repeatCount: block.repeatCount,
          customDays: block.customDays,
          tasks: block.tasks || [],
          isFromLernplan: false, // Always false for time blocks
          isTimeBlock: true, // Mark as time block for identification
        });
      });

      // Process Lernplan blocks (only in Exam mode, for header bar)
      if (isExamMode) {
        // BUG-010 FIX: Use visibleBlocksByDate to exclude archived content plans
        const dayBlocks = (visibleBlocksByDate || {})[dateKey] || [];

        // Convert blocks to learning sessions for this day
        const learningSessions = blocksToLearningSessions(dayBlocks);

        // Transform to week view format with times
        learningSessions.forEach(session => {
          if (session.isAddButton) return; // Skip add buttons

          // Find the original block to get position and other data
          const originalBlock = findBlockById(dayBlocks, session.id);

          // Check if this block is from Lernplan wizard
          const isFromLernplan = originalBlock?.isFromLernplan === true;

          // Only Lernplan blocks go to header bar in Exam mode
          if (isFromLernplan) {
            const position = originalBlock?.position || 1;
            const defaultTimes = getTimeForPosition(position);
            const startTime = originalBlock?.startTime || defaultTimes.startTime;
            const endTime = originalBlock?.endTime || defaultTimes.endTime;

            weekLernplanBlocks.push({
              id: session.id,
              contentId: session.contentId || originalBlock?.contentId,
              topicId: session.topicId || originalBlock?.topicId,
              title: session.title,
              blockType: session.blockType || 'lernblock',
              blockSize: session.blockSize || 1,
              startDate: dateKey,
              startTime,
              endTime,
              isMultiDay: false,
              description: session.description || '',
              rechtsgebiet: session.rechtsgebiet,
              unterrechtsgebiet: session.unterrechtsgebiet,
              hasTime: originalBlock?.hasTime || false,
              startHour: originalBlock?.startHour,
              duration: originalBlock?.duration,
              repeatEnabled: originalBlock?.repeatEnabled || false,
              repeatType: originalBlock?.repeatType,
              repeatCount: originalBlock?.repeatCount,
              customDays: originalBlock?.customDays,
              tasks: originalBlock?.tasks || [],
              isFromLernplan: true,
              position, // Include position for header bar display
            });
          }
        });
      }
    }

    return { blocks: weekBlocks, lernplanHeaderBlocks: weekLernplanBlocks };
  }, [currentDate, timeBlocksByDate, visibleBlocksByDate, isExamMode]);

  // Transform CalendarContext private blocks to week view format
  // BUG-012 FIX: Include multi-day blocks that span into the current week
  const privateBlocks = useMemo(() => {
    const { monday, sunday } = getWeekDateRange(currentDate);
    const weekPrivateBlocks = [];
    const weekStartKey = formatDateKey(monday);
    const weekEndKey = formatDateKey(sunday);
    const processedIds = new Set(); // Avoid duplicates for multi-day blocks

    console.log('[WeekView privateBlocks useMemo] Recalculating...');
    console.log('[WeekView privateBlocks useMemo] privateBlocksByDate keys:', Object.keys(privateBlocksByDate));
    console.log('[WeekView privateBlocks useMemo] Week range:', weekStartKey, 'to', weekEndKey);

    // Check ALL private blocks (from any date) to see if they overlap with current week
    Object.entries(privateBlocksByDate).forEach(([dateKey, dayBlocks]) => {
      dayBlocks.forEach(block => {
        // Skip if already processed (multi-day blocks could appear on multiple start dates)
        if (processedIds.has(block.id)) return;

        const blockStartDate = block.startDate || dateKey;
        const blockEndDate = block.endDate || blockStartDate;

        // Check if block overlaps with current week
        // Block overlaps if: blockStart <= weekEnd AND blockEnd >= weekStart
        if (blockStartDate <= weekEndKey && blockEndDate >= weekStartKey) {
          weekPrivateBlocks.push({
            ...block,
            startDate: blockStartDate,
            endDate: blockEndDate,
            blockType: 'private',
            // Ensure time and repeat settings are included
            hasTime: block.hasTime !== undefined ? block.hasTime : true,
            repeatEnabled: block.repeatEnabled || false,
            repeatType: block.repeatType,
            repeatCount: block.repeatCount,
            customDays: block.customDays,
            // Mark as multi-day if it spans more than one day
            isMultiDay: block.isMultiDay || (blockStartDate !== blockEndDate),
          });
          processedIds.add(block.id);
        }
      });
    });

    console.log('[WeekView] Total privateBlocks for week:', weekPrivateBlocks.length);
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

  // Handle time slot click - open add block dialog
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
  // FIX BUG-005: Handle series creation when editing private blocks
  const handleUpdateBlock = async (date, updatedBlock) => {
    const dateKey = date ? formatDateKey(date) : updatedBlock.startDate;

    if (updatedBlock.blockType === 'private') {
      // Check if we need to create/update a series
      const originalBlock = ((privateBlocksByDate || {})[dateKey] || []).find(b => b.id === updatedBlock.id);
      const hadSeries = originalBlock?.seriesId != null;
      const wantsSeries = updatedBlock.repeatEnabled && updatedBlock.repeatType && updatedBlock.repeatCount > 0;

      console.log('[handleUpdateBlock] Private block update:', { hadSeries, wantsSeries, originalBlock, updatedBlock });

      if (wantsSeries && !hadSeries) {
        // User enabled repeat on an existing non-series block
        // Delete old block and create new series
        console.log('[handleUpdateBlock] Creating new series from existing block');
        await deletePrivateBlock(dateKey, updatedBlock.id);
        await addPrivateBlock(dateKey, updatedBlock);
      } else if (!wantsSeries && hadSeries) {
        // User disabled repeat on a series block
        // Delete entire series and create single block
        console.log('[handleUpdateBlock] Converting series block to single block');
        await deleteSeriesPrivateBlocks(originalBlock.seriesId);
        await addPrivateBlock(dateKey, { ...updatedBlock, repeatEnabled: false, repeatType: null, repeatCount: null });
      } else if (wantsSeries && hadSeries) {
        // User changed repeat settings on existing series
        // Delete old series and create new one
        console.log('[handleUpdateBlock] Updating series with new repeat settings');
        await deleteSeriesPrivateBlocks(originalBlock.seriesId);
        await addPrivateBlock(dateKey, updatedBlock);
      } else {
        // No series change, just update the single block
        console.log('[handleUpdateBlock] Simple update, no series change');
        updatePrivateBlock(dateKey, updatedBlock.id, updatedBlock);
      }
    } else {
      // BUG-023 FIX: Check if this is a time block or a Lernplan slot
      const dayTimeBlocks = (timeBlocksByDate || {})[dateKey] || [];
      const isTimeBlock = dayTimeBlocks.some(block => block.id === updatedBlock.id);

      if (isTimeBlock) {
        // Update time block (user-created in Week/Dashboard)
        console.log('[handleUpdateBlock] BUG-023 FIX: Updating time block');
        await updateTimeBlock(dateKey, updatedBlock.id, {
          title: updatedBlock.title,
          description: updatedBlock.description,
          blockType: updatedBlock.blockType,
          rechtsgebiet: updatedBlock.rechtsgebiet,
          unterrechtsgebiet: updatedBlock.unterrechtsgebiet,
          startTime: updatedBlock.startTime,
          endTime: updatedBlock.endTime,
          tasks: updatedBlock.tasks || [],
        });
      } else {
        // Legacy: Update Lernplan block (for backwards compatibility)
        const dayBlocks = (blocksByDate || {})[dateKey] || [];
        const updatedBlocks = dayBlocks.map(block => {
          const isMatch =
            (updatedBlock.id && (block.contentId === updatedBlock.id || block.topicId === updatedBlock.id || block.id === updatedBlock.id)) ||
            (updatedBlock.contentId && block.contentId && block.contentId === updatedBlock.contentId) ||
            (updatedBlock.topicId && block.topicId && block.topicId === updatedBlock.topicId);

          if (isMatch) {
            return {
              ...block,
              title: updatedBlock.title,
              topicTitle: updatedBlock.title,
              blockType: updatedBlock.blockType,
              description: updatedBlock.description,
              rechtsgebiet: updatedBlock.rechtsgebiet,
              unterrechtsgebiet: updatedBlock.unterrechtsgebiet,
              hasTime: updatedBlock.hasTime || false,
              startTime: updatedBlock.startTime,
              endTime: updatedBlock.endTime,
              startHour: updatedBlock.startHour,
              duration: updatedBlock.duration,
              repeatEnabled: updatedBlock.repeatEnabled || false,
              repeatType: updatedBlock.repeatType,
              repeatCount: updatedBlock.repeatCount,
              customDays: updatedBlock.customDays,
              tasks: updatedBlock.tasks || [],
              updatedAt: new Date().toISOString(),
            };
          }
          return block;
        });
        updateDayBlocks(dateKey, updatedBlocks);
      }
    }
  };

  // Delete a block - uses CalendarContext
  // BUG-023 FIX: Check time blocks first, then private blocks, then Lernplan slots
  const handleDeleteBlock = async (date, blockId) => {
    const dateKey = date ? formatDateKey(date) : null;
    if (!dateKey) return;

    // Check if it's a private block
    const dayPrivateBlocks = (privateBlocksByDate || {})[dateKey] || [];
    const isPrivate = dayPrivateBlocks.some(b => b.id === blockId);

    if (isPrivate) {
      deletePrivateBlock(dateKey, blockId);
      return;
    }

    // BUG-023 FIX: Check if it's a time block
    const dayTimeBlocks = (timeBlocksByDate || {})[dateKey] || [];
    const isTimeBlock = dayTimeBlocks.some(b => b.id === blockId);

    if (isTimeBlock) {
      console.log('[handleDeleteBlock] BUG-023 FIX: Deleting time block');
      await deleteTimeBlock(dateKey, blockId);
      return;
    }

    // Legacy: Delete Lernplan block (for backwards compatibility)
    const dayBlocks = (blocksByDate || {})[dateKey] || [];
    const updatedBlocks = dayBlocks.filter(block => {
      const isMatch =
        block.contentId === blockId ||
        block.topicId === blockId ||
        block.id === blockId;
      return !isMatch;
    });
    updateDayBlocks(dateKey, updatedBlocks);
  };

  // BUG-023 FIX: Add a new learning block - uses timeBlocksByDate
  // Creates time blocks (NOT slots) for Week/Dashboard views
  // This ensures blocks created here are NEVER shown in Month view
  const handleAddBlock = async (_date, blockData) => {
    const startDate = selectedDate || new Date();
    const dateKey = formatDateKey(startDate);

    console.log('[handleAddBlock] BUG-023 FIX: Creating time block for date:', dateKey);

    // Create time block data (time-based, NOT position-based)
    const timeBlockData = {
      title: blockData.title,
      description: blockData.description || '',
      blockType: blockData.blockType || 'lernblock',
      rechtsgebiet: blockData.rechtsgebiet,
      unterrechtsgebiet: blockData.unterrechtsgebiet,
      startTime: blockData.startTime || '09:00',
      endTime: blockData.endTime || '10:00',
      // Repeat settings (handled by addTimeBlock)
      repeatEnabled: blockData.repeatEnabled || false,
      repeatType: blockData.repeatType,
      repeatCount: blockData.repeatCount,
      customDays: blockData.customDays,
      tasks: blockData.tasks || [],
    };

    // Use addTimeBlock which stores in timeBlocksByDate (NOT blocksByDate)
    await addTimeBlock(dateKey, timeBlockData);

    console.log('[handleAddBlock] Time block created successfully');
  };

  // Calculate end time based on start time and block size (1 slot = 2 hours)
  const calculateEndTime = (startTime, blockSize) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (blockSize * 120); // 2 hours per slot
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // T9: Handle task toggle (checkbox) within a block
  const handleTaskToggle = async (block, task) => {
    const dateKey = block.startDate;
    const updatedTasks = (block.tasks || []).map(t =>
      t.id === task.id ? { ...t, completed: !t.completed } : t
    );

    if (block.isTimeBlock) {
      await updateTimeBlock(dateKey, block.id, { tasks: updatedTasks });
    } else if (block.blockType === 'private') {
      updatePrivateBlock(dateKey, block.id, { tasks: updatedTasks });
    } else {
      // Lernplan block
      const dayBlocks = (blocksByDate || {})[dateKey] || [];
      const updatedBlocks = dayBlocks.map(blockItem =>
        blockItem.id === block.id || blockItem.contentId === block.id || blockItem.topicId === block.id
          ? { ...blockItem, tasks: updatedTasks }
          : blockItem
      );
      updateDayBlocks(dateKey, updatedBlocks);
    }
  };

  // T9: Handle remove task from block
  const handleRemoveTaskFromBlock = async (block, task) => {
    const dateKey = block.startDate;
    const updatedTasks = (block.tasks || []).filter(t => t.id !== task.id);

    if (block.isTimeBlock) {
      await updateTimeBlock(dateKey, block.id, { tasks: updatedTasks });
    } else if (block.blockType === 'private') {
      updatePrivateBlock(dateKey, block.id, { tasks: updatedTasks });
    } else {
      const dayBlocks = (blocksByDate || {})[dateKey] || [];
      const updatedBlocks = dayBlocks.map(blockItem =>
        blockItem.id === block.id || blockItem.contentId === block.id || blockItem.topicId === block.id
          ? { ...blockItem, tasks: updatedTasks }
          : blockItem
      );
      updateDayBlocks(dateKey, updatedBlocks);
    }
  };

  // T9: Handle time range selection (drag-to-select)
  const handleTimeRangeSelect = (date, startHour, endHour) => {
    setSelectedDate(date);
    // Convert hours to HH:MM format
    const startTime = `${String(Math.floor(startHour)).padStart(2, '0')}:${String(Math.round((startHour % 1) * 60)).padStart(2, '0')}`;
    const endTime = `${String(Math.floor(endHour)).padStart(2, '0')}:${String(Math.round((endHour % 1) * 60)).padStart(2, '0')}`;
    setSelectedTime(startTime);
    setSelectedEndTime(endTime); // T9: Also set end time for dialog
    // Open add dialog with pre-filled times
    setIsAddDialogOpen(true);
    console.log('[handleTimeRangeSelect] Selected range:', date, startTime, '-', endTime);
  };

  // T9: Handle drop task onto block (drag & drop)
  const handleDropTaskToBlock = async (targetBlock, item, source, type) => {
    console.log('[handleDropTaskToBlock]', { targetBlock, item, source, type });

    // Get the task from the source
    const task = item;
    const dateKey = targetBlock.startDate;

    // Add task to target block
    const updatedTasks = [...(targetBlock.tasks || []), { ...task, completed: false }];

    if (targetBlock.isTimeBlock) {
      await updateTimeBlock(dateKey, targetBlock.id, { tasks: updatedTasks });
    } else if (targetBlock.blockType === 'private') {
      updatePrivateBlock(dateKey, targetBlock.id, { tasks: updatedTasks });
    } else {
      const dayBlocks = (blocksByDate || {})[dateKey] || [];
      const updatedBlocks = dayBlocks.map(blockItem =>
        blockItem.id === targetBlock.id || blockItem.contentId === targetBlock.id || blockItem.topicId === targetBlock.id
          ? { ...blockItem, tasks: updatedTasks }
          : blockItem
      );
      updateDayBlocks(dateKey, updatedBlocks);
    }

    // If task came from another block, remove it from source
    if (source === 'block' && item.sourceBlockId && item.sourceBlockId !== targetBlock.id) {
      // Find source block and remove task
      // This would need source block identification - simplified for now
      console.log('[handleDropTaskToBlock] Task moved from another block');
    }
  };

  // Add a new private block - uses CalendarContext
  const handleAddPrivateBlock = async (_date, blockData) => {
    const dateKey = selectedDate ? formatDateKey(selectedDate) : new Date().toISOString().split('T')[0];
    console.log('[handleAddPrivateBlock] Creating block for date:', dateKey, 'with repeat:', {
      repeatEnabled: blockData.repeatEnabled,
      repeatType: blockData.repeatType,
      repeatCount: blockData.repeatCount,
    });
    const result = await addPrivateBlock(dateKey, {
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
    console.log('[handleAddPrivateBlock] Block created:', result);
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
        lernplanBlocks={isExamMode ? visibleBlocksByDate : {}} // T6.2 FIX: Hide in Normal mode
        lernplanHeaderBlocks={lernplanHeaderBlocks}
        onBlockClick={handleBlockClick}
        onSlotClick={handleSlotClick}
        onTaskToggle={handleTaskToggle}
        onRemoveTaskFromBlock={handleRemoveTaskFromBlock}
        onTimeRangeSelect={handleTimeRangeSelect}
        onDropTaskToBlock={handleDropTaskToBlock}
      />

      {/* Manage Theme Session Dialog */}
      <ManageThemeSessionDialog
        open={isManageThemeOpen}
        onOpenChange={setIsManageThemeOpen}
        date={selectedDate}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableBlocks={4}
      />

      {/* Manage Repetition Session Dialog */}
      <ManageRepetitionSessionDialog
        open={isManageRepetitionOpen}
        onOpenChange={setIsManageRepetitionOpen}
        date={selectedDate}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableBlocks={4}
      />

      {/* Manage Exam Session Dialog */}
      <ManageExamSessionDialog
        open={isManageExamOpen}
        onOpenChange={setIsManageExamOpen}
        date={selectedDate}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableBlocks={4}
      />

      {/* Manage Private Session Dialog */}
      <ManagePrivateSessionDialog
        open={isManagePrivateOpen}
        onOpenChange={setIsManagePrivateOpen}
        date={selectedDate}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        onDeleteSeries={deleteSeriesPrivateBlocks}
      />

      {/* Add Block Type Selection Dialog */}
      <AddThemeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        date={selectedDate}
        onSelectType={handleSelectBlockType}
      />

      {/* Create Theme Session Dialog */}
      <CreateThemeSessionDialog
        open={isCreateThemeOpen}
        onOpenChange={setIsCreateThemeOpen}
        date={selectedDate}
        onSave={handleAddBlock}
        availableBlocks={4}
      />

      {/* Create Repetition Session Dialog */}
      <CreateRepetitionSessionDialog
        open={isCreateRepetitionOpen}
        onOpenChange={setIsCreateRepetitionOpen}
        date={selectedDate}
        onSave={handleAddBlock}
        availableBlocks={4}
      />

      {/* Create Exam Session Dialog */}
      <CreateExamSessionDialog
        open={isCreateExamOpen}
        onOpenChange={setIsCreateExamOpen}
        date={selectedDate}
        onSave={handleAddBlock}
        availableBlocks={4}
      />

      {/* Create Private Session Dialog */}
      <CreatePrivateSessionDialog
        open={isCreatePrivateOpen}
        onOpenChange={setIsCreatePrivateOpen}
        date={selectedDate}
        initialTime={selectedTime}
        initialEndTime={selectedEndTime}
        onSave={handleAddPrivateBlock}
      />
    </div>
  );
};

export default WeekView;
