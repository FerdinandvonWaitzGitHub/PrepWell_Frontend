import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useWizard } from '../context/wizard-context';
import { useCalendar } from '../../../contexts/calendar-context';
import StepHeader from '../components/step-header';

// Import calendar dialog components for editing blocks
import CreateThemeBlockDialog from '../../calendar/components/create-theme-block-dialog';
import CreateRepetitionBlockDialog from '../../calendar/components/create-repetition-block-dialog';
import CreateExamBlockDialog from '../../calendar/components/create-exam-block-dialog';
import CreatePrivateBlockDialog from '../../calendar/components/create-private-block-dialog';

// Import slot utilities
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
 * Step 8 - Manual Path: Calendar Creation
 * User creates their learning plan directly in a calendar view
 * Based on Figma: Schritt_8_calendar
 */

const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const WEEKDAY_KEYS = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];

/**
 * Chevron icons
 */
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/**
 * Block type badge colors (English keys, German UI labels)
 */
const getBlockTypeStyle = (type) => {
  switch (type) {
    case 'lernblock':
      return 'bg-blue-900 text-blue-100';
    case 'repetition':
      return 'bg-purple-100 text-purple-700';
    case 'exam':
      return 'bg-orange-100 text-orange-700';
    case 'private':
    case 'free':
      return 'bg-neutral-100 text-neutral-600';
    default:
      return 'bg-neutral-100 text-neutral-400';
  }
};

const getBlockTypeLabel = (type) => {
  switch (type) {
    case 'lernblock':
      return 'Lernblock';
    case 'repetition':
      return 'Wiederholung';
    case 'exam':
      return 'Klausur';
    case 'private':
      return 'Privat';
    case 'free':
      return 'Frei';
    default:
      return type;
  }
};

/**
 * Calendar block component
 */
const CalendarBlock = ({ block, blocksCount, totalBlocks, onClick }) => {
  // Get display values from block data
  const blockType = block.blockType || block.type || 'lernblock';
  const title = block.title || block.topic || '';
  const rechtsgebiet = block.rechtsgebiet?.name || block.rechtsgebiet || '';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-2.5 bg-white rounded-[5px] outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col justify-start items-start gap-[5px] text-left hover:outline-primary-300 transition-colors"
    >
      <div className="self-stretch flex justify-between items-center">
        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${getBlockTypeStyle(blockType)}`}>
          {rechtsgebiet || getBlockTypeLabel(blockType)}
        </span>
        {block.progress && (
          <span className="text-neutral-300 text-xs font-semibold">
            {block.progress}
          </span>
        )}
      </div>
      {title && (
        <div className="self-stretch text-neutral-900 text-sm font-light truncate">
          {title}
        </div>
      )}
    </button>
  );
};


/**
 * Calendar day cell
 */
const CalendarDayCell = ({
  day,
  dayOfMonth,
  isInLearningPeriod,
  blocks,
  totalBlocks,
  onBlockClick
}) => {
  return (
    <div
      className={`flex-1 min-h-[100px] p-2.5 border-r border-t border-neutral-200 flex flex-col gap-[5px] ${
        !isInLearningPeriod ? 'opacity-30' : ''
      }`}
    >
      {/* Day number */}
      <div className="text-neutral-900 text-sm font-light">{dayOfMonth}</div>

      {/* Content */}
      {!isInLearningPeriod ? (
        <div className="px-2.5 bg-neutral-100 rounded-[5px] py-1">
          <span className="text-neutral-400 text-xs font-semibold">nicht im Lernzeitraum</span>
        </div>
      ) : (
        <>
          {/* Show all blocks - prefilled from weekStructure */}
          {blocks.map((block, index) => (
            <CalendarBlock
              key={block.id || index}
              block={block}
              blocksCount={index + 1}
              totalBlocks={blocks.length}
              onClick={(e) => {
                e.stopPropagation();
                onBlockClick(block, index);
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};

/**
 * Get days in month
 */
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Get first day of month (0 = Sunday, 1 = Monday, etc.)
 * Adjusted for Monday start (0 = Monday, 6 = Sunday)
 */
const getFirstDayOfMonth = (year, month) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
};

/**
 * Format month name in German
 */
const getMonthName = (month) => {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return months[month];
};

const Step8Calendar = () => {
  const {
    startDate,
    endDate,
    blocksPerDay,
    weekStructure,
    updateWizardData
  } = useWizard();

  // Calendar context for saving to main calendar
  const { setCalendarData } = useCalendar();

  // Calendar state - start at the month of the learning start date
  const [currentDate, setCurrentDate] = useState(() => {
    if (startDate) {
      // Parse date string directly to avoid timezone issues
      const [year, month] = startDate.split('-').map(Number);
      return { year, month: month - 1 }; // month is 0-indexed
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Slot-based calendar entries for user customizations
  const [slotsByDate, setSlotsByDate] = useState({});

  // Dialog states for editing blocks
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedBlockDay, setSelectedBlockDay] = useState(null);
  const [isCreateThemeDialogOpen, setIsCreateThemeDialogOpen] = useState(false);
  const [isCreateRepetitionDialogOpen, setIsCreateRepetitionDialogOpen] = useState(false);
  const [isCreateExamDialogOpen, setIsCreateExamDialogOpen] = useState(false);
  const [isCreatePrivateDialogOpen, setIsCreatePrivateDialogOpen] = useState(false);

  // Parse date string to local Date (avoid timezone issues)
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  // Parse dates (use local time to avoid off-by-one errors)
  const learningStart = parseLocalDate(startDate);
  const learningEnd = parseLocalDate(endDate);

  /**
   * Generate full calendar slots for all days in learning period
   * Combines weekStructure defaults with user customizations
   */
  const generateFullCalendarSlots = useCallback(() => {
    if (!learningStart || !learningEnd) return {};

    const fullSlots = { ...slotsByDate };

    // Iterate through all days in the learning period
    const currentDate = new Date(learningStart);
    while (currentDate <= learningEnd) {
      const dateKey = formatDateKey(currentDate);

      // Only generate default slots if user hasn't customized this day
      if (!fullSlots[dateKey]) {
        const dayOfWeek = currentDate.getDay();
        const adjustedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const dayKey = WEEKDAY_KEYS[adjustedIndex];
        const dayBlocks = weekStructure[dayKey] || [];
        const now = new Date().toISOString();

        // Create slots from weekStructure with correct format for slotsToLearningBlocks
        const slots = dayBlocks.map((blockType, index) => {
          const groupId = `${dateKey}-group-${index}`;
          return {
            id: `${dateKey}-slot-${index}`,
            date: dateKey,
            position: index + 1, // Positions are 1-indexed
            status: 'topic', // Must be 'topic' for slotsToLearningBlocks
            blockType: blockType,
            topicId: `${dateKey}-block-${index}`,
            topicTitle: '',
            groupId: groupId, // Required for slotsToLearningBlocks
            groupSize: 1,
            groupIndex: 0,
            isFromTemplate: true,
            isFromLernplan: true, // Marks as wizard-created (overrides left side)
            createdAt: now,
            updatedAt: now,
          };
        });

        if (slots.length > 0) {
          fullSlots[dateKey] = slots;
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return fullSlots;
  }, [learningStart, learningEnd, slotsByDate, weekStructure]);

  // Store latest values in refs for cleanup function (needed because cleanup captures stale closures)
  const generateFullCalendarSlotsRef = useRef(generateFullCalendarSlots);
  const setCalendarDataRef = useRef(setCalendarData);
  const startDateRef = useRef(startDate);
  const endDateRef = useRef(endDate);
  const blocksPerDayRef = useRef(blocksPerDay);
  const weekStructureRef = useRef(weekStructure);

  // Keep refs updated with latest values
  useEffect(() => {
    generateFullCalendarSlotsRef.current = generateFullCalendarSlots;
    setCalendarDataRef.current = setCalendarData;
    startDateRef.current = startDate;
    endDateRef.current = endDate;
    blocksPerDayRef.current = blocksPerDay;
    weekStructureRef.current = weekStructure;
  });

  /**
   * Save calendar data to CalendarContext when component unmounts (leaving Step 8)
   * Using cleanup function because the component unmounts before useEffect with
   * new currentStep value can run
   */
  useEffect(() => {
    console.log('Step8Calendar mounted');

    // Cleanup function runs when component unmounts (when leaving Step 8)
    return () => {
      console.log('Step8Calendar: Unmounting, saving calendar data...');

      const fullSlots = generateFullCalendarSlotsRef.current();
      console.log('Step8Calendar: Generated slots for', Object.keys(fullSlots).length, 'days');

      // Create metadata for this Lernplan
      const metadata = {
        name: `Lernplan ${new Date().toLocaleDateString('de-DE')}`,
        startDate: startDateRef.current,
        endDate: endDateRef.current,
        blocksPerDay: blocksPerDayRef.current,
        weekStructure: weekStructureRef.current,
      };

      // Save to CalendarContext (this will archive old data if exists)
      setCalendarDataRef.current(fullSlots, metadata);
      console.log('Step8Calendar: Calendar data saved to context');
    };
  }, []); // Empty dependency array - only runs on mount/unmount

  // Check if a date is within learning period (inclusive)
  const isInLearningPeriod = (year, month, day) => {
    if (!learningStart || !learningEnd) return false;
    const date = new Date(year, month, day);
    // Compare dates only (ignore time)
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOnly = new Date(learningStart.getFullYear(), learningStart.getMonth(), learningStart.getDate());
    const endOnly = new Date(learningEnd.getFullYear(), learningEnd.getMonth(), learningEnd.getDate());
    return dateOnly >= startOnly && dateOnly <= endOnly;
  };

  // Get day of week key for a date (montag, dienstag, etc.)
  const getDayKey = (year, month, day) => {
    const date = new Date(year, month, day);
    const dayIndex = date.getDay();
    // Convert from Sunday=0 to our Monday=0 system
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return WEEKDAY_KEYS[adjustedIndex];
  };

  // Get blocks for a specific day - prefilled from weekStructure
  const getBlocksForDay = (year, month, day) => {
    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);

    // If user has customized this day, use their customizations
    if (slotsByDate[dateKey]) {
      return slotsToLearningBlocks(slotsByDate[dateKey]);
    }

    // Otherwise, use the weekStructure from Step 5 as default
    const dayKey = getDayKey(year, month, day);
    const dayBlocks = weekStructure[dayKey] || [];

    // Convert weekStructure block types to display format
    return dayBlocks.map((blockType, index) => ({
      id: `${dateKey}-block-${index}`,
      blockType: blockType, // 'lernblock', 'exam', 'repetition', 'free', 'private'
      title: '', // No title yet - user can add optionally
      progress: `${index + 1}/${dayBlocks.length}`,
      blockSize: 1,
      isFromTemplate: true, // Mark as coming from weekStructure template
    }));
  };

  // Get available slots for a specific date
  const getAvailableSlotsForDate = (date) => {
    if (!date) return blocksPerDay;
    const dateKey = formatDateKey(date);

    // If user has customized this day, check actual slots
    if (slotsByDate[dateKey]) {
      return slotsByDate[dateKey].filter(s => s.status === 'empty').length;
    }

    // Otherwise, slots are "available" for editing but prefilled from template
    // Return the number of blocks that can still be added
    const dayKey = getDayKey(date.getFullYear(), date.getMonth(), date.getDate());
    const existingBlocks = weekStructure[dayKey]?.length || 0;
    return Math.max(0, blocksPerDay - existingBlocks);
  };

  // Add a learning block to a specific date
  const handleAddBlock = (date, blockData) => {
    const dateKey = formatDateKey(date);

    // Get current slots for this day, or create empty ones
    const currentSlots = slotsByDate[dateKey] || createDaySlots(date);

    // Check if we have enough free slots
    const sizeNeeded = blockData.blockSize || 1;

    if (!canPlaceTopic(currentSlots, sizeNeeded)) {
      console.warn(`Cannot add block: Not enough free slots. Need ${sizeNeeded}, but day is full.`);
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
      tasks: blockData.tasks,
      isFromLernplan: true, // Marks as wizard-created
    });

    // Update day slots
    const updatedSlots = updateDaySlots(currentSlots, topicSlots);

    // Save to state
    setSlotsByDate(prev => ({
      ...prev,
      [dateKey]: updatedSlots
    }));
  };

  // Update an existing learning block
  const handleUpdateBlock = (date, updatedBlockData) => {
    const dateKey = formatDateKey(date);
    const currentSlots = slotsByDate[dateKey];

    if (!currentSlots) return;

    // Find the slots belonging to this block
    const blockSlots = currentSlots.filter(s => s.topicId === updatedBlockData.id);
    if (blockSlots.length === 0) return;

    const oldBlockSize = blockSlots.length;
    const newBlockSize = updatedBlockData.blockSize || oldBlockSize;

    // If size changed, we need to recalculate slots
    if (newBlockSize !== oldBlockSize) {
      // First, clear the old slots
      let updatedSlots = currentSlots.map(slot => {
        if (slot.topicId === updatedBlockData.id) {
          return createEmptySlot(date, slot.position);
        }
        return slot;
      });

      // Check if we can place the new size
      const freeSlots = updatedSlots.filter(s => s.status === 'empty').length;
      if (freeSlots < newBlockSize) {
        console.warn(`Cannot resize block: Not enough free slots.`);
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
        tasks: updatedBlockData.tasks,
        isFromLernplan: true, // Marks as wizard-created
      });

      updatedSlots = updateDaySlots(updatedSlots, topicSlots);

      setSlotsByDate(prev => ({
        ...prev,
        [dateKey]: updatedSlots
      }));
    } else {
      // Size unchanged, just update the data in existing slots
      const updatedSlots = currentSlots.map(slot => {
        if (slot.topicId === updatedBlockData.id) {
          return {
            ...slot,
            topicTitle: updatedBlockData.title,
            blockType: updatedBlockData.blockType,
            progress: updatedBlockData.progress,
            description: updatedBlockData.description,
            updatedAt: new Date().toISOString()
          };
        }
        return slot;
      });

      setSlotsByDate(prev => ({
        ...prev,
        [dateKey]: updatedSlots
      }));
    }
  };

  // Delete a learning block
  const handleDeleteBlock = (date, blockId) => {
    const dateKey = formatDateKey(date);
    const currentSlots = slotsByDate[dateKey];

    if (!currentSlots) return;

    // Replace block slots with empty slots
    const updatedSlots = currentSlots.map(slot => {
      if (slot.topicId === blockId) {
        return createEmptySlot(date, slot.position);
      }
      return slot;
    });

    setSlotsByDate(prev => ({
      ...prev,
      [dateKey]: updatedSlots
    }));
  };

  // Calendar grid data
  const calendarGrid = useMemo(() => {
    const { year, month } = currentDate;
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const weeks = [];
    let currentWeek = [];

    // Fill in empty days at start
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    // Fill in days of month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill in remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [currentDate]);

  // Navigation handlers
  const goToPrevMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate({ year: now.getFullYear(), month: now.getMonth() });
  };

  // Handle block click - open the appropriate edit dialog based on block type
  const handleBlockClick = (year, month, day, block, blockIndex) => {
    const clickedDate = new Date(year, month, day);

    if (!isInLearningPeriod(year, month, day)) {
      return;
    }

    // Store selected block info
    setSelectedDay({
      date: clickedDate,
      block: block,
      blockIndex: blockIndex
    });
    setSelectedBlockDay(clickedDate);

    // Open the appropriate dialog based on block type
    const blockType = block.blockType || block.type;

    switch(blockType) {
      case 'lernblock':
        setIsCreateThemeDialogOpen(true);
        break;
      case 'repetition':
        setIsCreateRepetitionDialogOpen(true);
        break;
      case 'exam':
        setIsCreateExamDialogOpen(true);
        break;
      case 'free':
      case 'private':
        setIsCreatePrivateDialogOpen(true);
        break;
      default:
        // For unknown types, open lernblock dialog
        setIsCreateThemeDialogOpen(true);
    }
  };

  return (
    <div>
      <StepHeader
        step={8}
        title="Überprüfe deinen Lernplan im Kalender."
        description="Die Blöcke aus deiner Wochenstruktur sind bereits eingetragen. Klicke auf einen Block, um optional Details hinzuzufügen. Du kannst auch direkt weiter klicken."
      />

      <div className="space-y-6">
        {/* Calendar container */}
        <div className="bg-white rounded-[5px] outline outline-1 outline-offset-[-1px] outline-neutral-200 overflow-hidden">
          {/* Calendar header */}
          <div className="px-5 pb-3.5 flex justify-between items-center">
            <div className="py-4">
              <span className="text-neutral-900 text-lg font-light">
                {getMonthName(currentDate.month)} {currentDate.year}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Today button */}
              <button
                type="button"
                onClick={goToToday}
                className="h-8 px-3 py-2 bg-white rounded-lg shadow-sm outline outline-1 outline-offset-[-1px] outline-neutral-200 flex items-center gap-2 hover:bg-neutral-50 transition-colors"
              >
                <span className="text-neutral-900 text-xs font-medium">Heute</span>
                <CalendarIcon />
              </button>

              {/* Prev button */}
              <button
                type="button"
                onClick={goToPrevMonth}
                className="w-8 h-8 bg-white rounded-lg shadow-sm outline outline-1 outline-offset-[-1px] outline-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors"
              >
                <ChevronLeft />
              </button>

              {/* Next button */}
              <button
                type="button"
                onClick={goToNextMonth}
                className="w-8 h-8 bg-white rounded-lg shadow-sm outline outline-1 outline-offset-[-1px] outline-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors"
              >
                <ChevronRight />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="flex border-b border-neutral-200">
            {WEEKDAYS.map((day, index) => (
              <div
                key={day}
                className={`flex-1 pl-5 py-2 ${index < 6 ? 'border-r border-neutral-200' : ''}`}
              >
                <span className="text-neutral-900 text-sm font-medium">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex flex-col">
            {calendarGrid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex">
                {week.map((day, dayIndex) => {
                  if (day === null) {
                    return (
                      <div
                        key={`empty-${dayIndex}`}
                        className={`flex-1 min-h-[100px] p-2.5 border-t border-neutral-200 ${
                          dayIndex < 6 ? 'border-r' : ''
                        }`}
                      />
                    );
                  }

                  const { year, month } = currentDate;
                  const inPeriod = isInLearningPeriod(year, month, day);
                  const blocks = getBlocksForDay(year, month, day);

                  return (
                    <CalendarDayCell
                      key={day}
                      day={day}
                      dayOfMonth={day}
                      isInLearningPeriod={inPeriod}
                      blocks={inPeriod ? blocks : []}
                      totalBlocks={blocksPerDay}
                      onBlockClick={(block, blockIndex) => handleBlockClick(year, month, day, block, blockIndex)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Info box */}
        <div className="max-w-[550px] mx-auto px-4 py-3 bg-blue-50 rounded-[10px] flex items-start gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-600 flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-sm text-blue-700">
            Klicke auf "Weiter", wenn du fertig bist. Du kannst den Lernplan später jederzeit anpassen.
          </p>
        </div>
      </div>

      {/* Edit Theme Block Dialog (for Lernblock) */}
      <CreateThemeBlockDialog
        open={isCreateThemeDialogOpen}
        onOpenChange={setIsCreateThemeDialogOpen}
        date={selectedBlockDay}
        onSave={handleAddBlock}
        availableSlots={getAvailableSlotsForDate(selectedBlockDay)}
      />

      {/* Edit Repetition Block Dialog (for Wiederholung) */}
      <CreateRepetitionBlockDialog
        open={isCreateRepetitionDialogOpen}
        onOpenChange={setIsCreateRepetitionDialogOpen}
        date={selectedBlockDay}
        onSave={handleAddBlock}
        availableSlots={getAvailableSlotsForDate(selectedBlockDay)}
      />

      {/* Edit Exam Block Dialog (for Klausur) */}
      <CreateExamBlockDialog
        open={isCreateExamDialogOpen}
        onOpenChange={setIsCreateExamDialogOpen}
        date={selectedBlockDay}
        onSave={handleAddBlock}
      />

      {/* Edit Private Block Dialog (for Frei) */}
      <CreatePrivateBlockDialog
        open={isCreatePrivateDialogOpen}
        onOpenChange={setIsCreatePrivateDialogOpen}
        date={selectedBlockDay}
        onSave={handleAddBlock}
      />
    </div>
  );
};

export default Step8Calendar;
