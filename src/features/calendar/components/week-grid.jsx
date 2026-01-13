import { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, Lock } from 'lucide-react';
import { getRechtsgebietColor } from '../../../utils/rechtsgebiet-colors';

/**
 * WeekGrid component
 * Row-based weekly calendar grid based on Figma design
 * - Weekday header stays fixed at top (sticky)
 * - Multi-day events row between header and time grid
 * - Time labels scroll with content
 *
 * T9 Features (from ZeitplanWidget):
 * - Tasks in blocks with progress indicator
 * - Current time indicator (red line)
 * - Auto-scroll to current time
 * - Drag-to-select time range
 * - Drag & drop tasks to blocks
 * - Blocked time display
 *
 * Performance optimizations:
 * - Memoized component to prevent re-renders when parent state changes
 * - useMemo for expensive date calculations and block filtering
 * - useCallback for event handlers
 */

// Block type colors - visually distinct for each type (static, no re-creation)
const BLOCK_COLORS = {
  // Learning blocks (theme/lernblock) - primary color
  theme: 'bg-primary-100 border-primary-200 hover:bg-primary-150',
  lernblock: 'bg-primary-100 border-primary-200 hover:bg-primary-150',
  // Repetition - purple tint
  repetition: 'bg-purple-100 border-purple-200 hover:bg-purple-150',
  // Exam - amber/orange for urgency
  exam: 'bg-amber-100 border-amber-200 hover:bg-amber-150',
  // Free time - neutral gray
  free: 'bg-neutral-100 border-neutral-200 hover:bg-neutral-150',
  // Private blocks - violet for clear distinction
  private: 'bg-violet-100 border-violet-300 hover:bg-violet-150',
  // Buffer days - orange for catch-up time
  buffer: 'bg-orange-100 border-orange-200 hover:bg-orange-150',
  // Vacation days - green for rest
  vacation: 'bg-green-100 border-green-200 hover:bg-green-150'
};

// Block type display names
const BLOCK_TYPE_NAMES = {
  theme: 'Thema',
  lernblock: 'Lernblock',
  repetition: 'Wiederholung',
  exam: 'Klausur',
  free: 'Freizeit',
  private: 'Privat',
  buffer: 'Puffertag',
  vacation: 'Urlaubstag'
};

const LERNPLAN_BLOCK_TYPE_COLORS = {
  repetition: 'bg-purple-100 border-purple-200 text-purple-800',
  exam: 'bg-amber-100 border-amber-200 text-amber-800',
  buffer: 'bg-orange-100 border-orange-200 text-orange-800',
  vacation: 'bg-green-100 border-green-200 text-green-800',
  free: 'bg-neutral-100 border-neutral-200 text-neutral-700',
};

const getLernplanBlockLabel = (block) => {
  const unterLabel = block.unterrechtsgebietLabel
    || (typeof block.unterrechtsgebiet === 'string' ? block.unterrechtsgebiet : block.unterrechtsgebiet?.name);

  return (
    unterLabel
    || block.themaTitle
    || block.topicTitle
    || block.title
    || BLOCK_TYPE_NAMES[block.blockType]
    || BLOCK_TYPE_NAMES[block.kind]
    || BLOCK_TYPE_NAMES[block.status]
    || 'Block'
  );
};

const getLernplanBlockSize = (block) => {
  return block.blockSize || block.groupSize || 1;
};

const getLernplanBlockColorClass = (block) => {
  const rgId = block.rechtsgebietId || block.rechtsgebiet || block.metadata?.rgId || block.rgId;
  if (rgId) {
    const colors = getRechtsgebietColor(rgId);
    return `${colors.bg} ${colors.border} ${colors.text}`;
  }

  const typeKey = block.blockType || block.kind || block.status;
  return LERNPLAN_BLOCK_TYPE_COLORS[typeKey] || 'bg-primary-100 border-primary-200 text-primary-800';
};

const LernplanBlockChip = ({ block, onClick }) => {
  const label = getLernplanBlockLabel(block);
  const size = getLernplanBlockSize(block);
  const sizeLabel = size > 1 ? `(${size})` : '';
  const colorClass = getLernplanBlockColorClass(block);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-2 py-1 rounded border text-left text-xs truncate hover:opacity-80 transition-opacity ${colorClass}`}
      title={`${label} ${sizeLabel}`.trim()}
    >
      <div className="flex items-center gap-1">
        <span className="truncate font-medium">
          {label}
        </span>
        {size > 1 && (
          <span className="text-[10px] opacity-70 flex-shrink-0">
            ({size})
          </span>
        )}
      </div>
    </button>
  );
};

// Static arrays moved outside component to prevent re-creation
const WEEK_DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const WeekGrid = memo(function WeekGrid({
  currentDate = new Date(),
  blocks = [],
  privateBlocks = [],
  lernplanBlocks = {}, // Month-view Lernplan blocks (position-based)
  lernplanHeaderBlocks = [], // BUG-023 FIX: Exam-mode header bar blocks
  onBlockClick,
  onSlotClick,
  onLernplanBlockClick,
  // T9: New callbacks from ZeitplanWidget
  onTaskToggle,           // (block, task) => void - Toggle task completion
  onRemoveTaskFromBlock,  // (block, task) => void - Remove task from block
  onTimeRangeSelect,      // (date, startHour, endHour) => void - Drag-to-select
  onDropTaskToBlock,      // (block, item, source, type) => void - Drop task onto block
  className = ''
}) {
  // T9: Refs for scroll container and drag state
  const scrollContainerRef = useRef(null);
  const dragJustCompletedRef = useRef(false);

  // T9: Current time state (updates every minute)
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // T9: Drag-to-select state (per day column)
  const [dragState, setDragState] = useState({
    isDragging: false,
    dayIndex: null,
    startY: null,
    currentY: null,
  });

  // T9: Drag-over block state for drop highlighting
  const [dragOverBlockId, setDragOverBlockId] = useState(null);

  // T9: Update current time every minute
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    const intervalId = setInterval(updateTime, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // T9: Hour height constant (must match row height)
  const hourHeight = 54;

  // T9: Auto-scroll to show 08:00-17:00 by default on mount (only if today is in current week)
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Always scroll to 08:00 so that 08:00-17:00 is visible
      const scrollToHour = 8;
      const scrollPosition = scrollToHour * hourHeight;
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Note: We always scroll to 08:00 regardless of whether today is in the week,
  // because 08:00-17:00 is the typical working time range users want to see.

  // T9: Helper - Y position to hour (snapped to 15min intervals)
  const yToTime = useCallback((y) => {
    const rawHour = y / hourHeight;
    const snapped = Math.round(rawHour * 4) / 4; // 15min intervals
    return Math.max(0, Math.min(24, snapped));
  }, []);

  // T9: Helper - Format hour as HH:MM
  const formatTimeFromHour = useCallback((hour) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }, []);

  const effectiveLernplanHeaderBlocks = lernplanHeaderBlocks || [];

  // Calculate the dates for the week starting from Monday
  const weekDates = useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));

    return Array.from({ length: 7 }, (_, i) => {
      const weekDate = new Date(monday);
      weekDate.setDate(monday.getDate() + i);
      return weekDate;
    });
  }, [currentDate]);

  // Combine learning blocks and private blocks
  const allBlocks = useMemo(() => {
    return [...blocks, ...privateBlocks];
  }, [blocks, privateBlocks]);

  // Separate multi-day blocks from regular blocks
  const { multiDayBlocks, regularBlocks } = useMemo(() => {
    const multiDay = [];
    const regular = [];

    allBlocks.forEach(block => {
      if (block.isMultiDay) {
        multiDay.push(block);
      } else {
        regular.push(block);
      }
    });

    return { multiDayBlocks: multiDay, regularBlocks: regular };
  }, [allBlocks]);

  // Full day time range (0-24)
  const startHour = 0;
  const endHour = 24;

  // Generate time slots
  const timeSlots = useMemo(() => {
    return Array.from(
      { length: endHour - startHour },
      (_, i) => startHour + i
    );
  }, [startHour, endHour]);

  // Format date key for comparison (YYYY-MM-DD)
  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // T10: Lernplan blocks (month view) grouped by date and sorted by position
  const lernplanBlocksByDate = useMemo(() => {
    const byDate = {};
    Object.entries(lernplanBlocks || {}).forEach(([dateKey, blocksForDay]) => {
      const filtered = (blocksForDay || []).filter(block => block && block.status !== 'empty');
      byDate[dateKey] = filtered.sort((a, b) => (a.position || 0) - (b.position || 0));
    });
    return byDate;
  }, [lernplanBlocks]);

  const hasLernplanBlocksRow = useMemo(() => {
    return weekDates.some(date => {
      const dateKey = formatDateKey(date);
      return (lernplanBlocksByDate[dateKey] || []).length > 0;
    });
  }, [weekDates, lernplanBlocksByDate]);

  // Count blocks per day to detect full days (4 slots max)
  const blocksPerDay = useMemo(() => {
    const counts = {};
    regularBlocks.forEach(block => {
      const dateKey = block.date || formatDateKey(new Date());
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return counts;
  }, [regularBlocks]);

  // Check if a day has all slots full (4 or more blocks)
  const isDayFull = (date) => {
    const dateKey = formatDateKey(date);
    return (blocksPerDay[dateKey] || 0) >= 4;
  };

  // Format date for display (e.g., "13. Dez")
  const formatDateDisplay = (date) => {
    return `${date.getDate()}. ${MONTHS[date.getMonth()].slice(0, 3)}`;
  };

  // Get blocks for a specific date and hour
  const getBlocksForDateAndHour = (date, hour) => {
    const dateKey = formatDateKey(date);
    return regularBlocks.filter(block => {
      const blockDate = block.startDate || dateKey;
      if (blockDate !== dateKey) return false;

      if (block.startTime) {
        const blockHour = parseInt(block.startTime.split(':')[0], 10);
        return blockHour === hour;
      }
      return false;
    });
  };

  // Calculate multi-day block span info
  const getMultiDayBlockInfo = (block, date) => {
    const dateKey = formatDateKey(date);
    const startKey = block.startDate;
    const endKey = block.endDate;

    // Find start and end positions within current week
    const weekStartKey = formatDateKey(weekDates[0]);
    const weekEndKey = formatDateKey(weekDates[6]);

    const effectiveStart = startKey < weekStartKey ? weekStartKey : startKey;
    const effectiveEnd = endKey > weekEndKey ? weekEndKey : endKey;

    const startDayIndex = weekDates.findIndex(d => formatDateKey(d) === effectiveStart);
    const endDayIndex = weekDates.findIndex(d => formatDateKey(d) === effectiveEnd);
    const currentDayIndex = weekDates.findIndex(d => formatDateKey(d) === dateKey);

    const isStart = currentDayIndex === startDayIndex;
    const span = endDayIndex - startDayIndex + 1;

    return { isStart, span, startDayIndex, endDayIndex };
  };

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return formatDateKey(date) === formatDateKey(today);
  };

  // Handle slot click - memoized to prevent child re-renders
  const handleSlotClick = useCallback((date, hour) => {
    if (onSlotClick) {
      onSlotClick(date, `${hour.toString().padStart(2, '0')}:00`);
    }
  }, [onSlotClick]);

  // T9: Check collision with existing blocks for a specific date
  const hasCollisionForDate = useCallback((date, startHour, endHour) => {
    const dateKey = formatDateKey(date);
    return regularBlocks.some(block => {
      if ((block.startDate || block.date) !== dateKey) return false;
      if (!block.startTime || !block.endTime) return false;

      const [startH, startM] = block.startTime.split(':').map(Number);
      const [endH, endM] = block.endTime.split(':').map(Number);
      const blockStart = startH + startM / 60;
      const blockEnd = endH + endM / 60;

      return startHour < blockEnd && endHour > blockStart;
    });
  }, [regularBlocks]);

  // T9: Find max end without collision
  const findMaxEndWithoutCollision = useCallback((date, startHour) => {
    const dateKey = formatDateKey(date);
    let maxEnd = 24;
    regularBlocks.forEach(block => {
      if ((block.startDate || block.date) !== dateKey) return;
      if (!block.startTime) return;

      const [startH, startM] = block.startTime.split(':').map(Number);
      const blockStart = startH + startM / 60;

      if (blockStart > startHour && blockStart < maxEnd) {
        maxEnd = blockStart;
      }
    });
    return maxEnd;
  }, [regularBlocks]);

  // T9: Drag-to-select handlers
  const handleDragStart = useCallback((e, dayIndex, cellElement) => {
    if (!onTimeRangeSelect) return;
    if (e.target !== e.currentTarget) return;

    const rect = cellElement.getBoundingClientRect();
    const y = e.clientY - rect.top + (scrollContainerRef.current?.scrollTop || 0);

    setDragState({
      isDragging: true,
      dayIndex,
      startY: y,
      currentY: y,
    });
    e.preventDefault();
  }, [onTimeRangeSelect]);

  const handleDragMove = useCallback((e, dayIndex, cellElement) => {
    if (!dragState.isDragging || dragState.dayIndex !== dayIndex) return;

    const rect = cellElement.getBoundingClientRect();
    const y = e.clientY - rect.top + (scrollContainerRef.current?.scrollTop || 0);
    const clampedY = Math.max(0, Math.min(24 * hourHeight, y));

    setDragState(prev => ({ ...prev, currentY: clampedY }));
  }, [dragState.isDragging, dragState.dayIndex]);

  const handleDragEnd = useCallback((dayIndex) => {
    if (!dragState.isDragging || dragState.dayIndex !== dayIndex) return;

    const startTime = yToTime(Math.min(dragState.startY, dragState.currentY));
    const endTime = yToTime(Math.max(dragState.startY, dragState.currentY));

    setDragState({ isDragging: false, dayIndex: null, startY: null, currentY: null });

    // Minimum 15 minutes
    if (endTime - startTime < 0.25) return;

    const date = weekDates[dayIndex];
    let finalStart = startTime;
    let finalEnd = endTime;

    // Check collision and clamp if needed
    if (hasCollisionForDate(date, startTime, endTime)) {
      finalEnd = Math.min(endTime, findMaxEndWithoutCollision(date, startTime));
      if (hasCollisionForDate(date, finalStart, finalEnd) || finalEnd - finalStart < 0.25) {
        return;
      }
    }

    dragJustCompletedRef.current = true;
    setTimeout(() => { dragJustCompletedRef.current = false; }, 0);

    if (onTimeRangeSelect) {
      onTimeRangeSelect(date, finalStart, finalEnd);
    }
  }, [dragState, weekDates, yToTime, hasCollisionForDate, findMaxEndWithoutCollision, onTimeRangeSelect]);

  // T9: Calculate selection overlay for drag-to-select
  const getSelectionOverlay = useCallback((dayIndex) => {
    if (!dragState.isDragging || dragState.dayIndex !== dayIndex) return null;

    const topY = Math.min(dragState.startY, dragState.currentY);
    const bottomY = Math.max(dragState.startY, dragState.currentY);
    const height = bottomY - topY;

    const startTime = yToTime(topY);
    const endTime = yToTime(bottomY);
    const date = weekDates[dayIndex];
    const collision = hasCollisionForDate(date, startTime, endTime);
    const tooShort = endTime - startTime < 0.25;

    return {
      top: topY,
      height: Math.max(height, hourHeight / 4),
      startTime,
      endTime,
      isValid: !collision && !tooShort,
      collision,
    };
  }, [dragState, weekDates, yToTime, hasCollisionForDate]);

  // T9: Current time position for indicator (only for today column)
  const getTodayColumnIndex = useMemo(() => {
    const today = new Date();
    return weekDates.findIndex(d => formatDateKey(d) === formatDateKey(today));
  }, [weekDates]);

  const currentTimePosition = useMemo(() => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    return (hour + minute / 60) * hourHeight;
  }, [currentTime]);

  // Calculate row height based on blocks
  const getRowHeight = (hour) => {
    let maxBlockSize = 1;
    weekDates.forEach(date => {
      const blocksInSlot = getBlocksForDateAndHour(date, hour);
      blocksInSlot.forEach(block => {
        if (block.blockSize) {
          maxBlockSize = Math.max(maxBlockSize, block.blockSize);
        }
      });
    });
    return 54 + (maxBlockSize - 1) * 30;
  };

  // Check if there are any multi-day blocks in current week
  const hasMultiDayBlocks = multiDayBlocks.some(block => {
    const weekStartKey = formatDateKey(weekDates[0]);
    const weekEndKey = formatDateKey(weekDates[6]);
    return block.startDate <= weekEndKey && block.endDate >= weekStartKey;
  });

  // BUG-023 FIX: Group Lernplan header blocks by date for exam-mode bar
  const lernplanHeaderBlocksByDate = useMemo(() => {
    const byDate = {};
    effectiveLernplanHeaderBlocks.forEach(block => {
      const dateKey = block.startDate;
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push(block);
    });
    // Sort blocks within each date by position
    Object.values(byDate).forEach(blocks => {
      blocks.sort((a, b) => (a.position || 1) - (b.position || 1));
    });
    return byDate;
  }, [effectiveLernplanHeaderBlocks]);

  // Check if there are any Lernplan header blocks in current week
  const hasLernplanHeaderBlocks = effectiveLernplanHeaderBlocks.length > 0;

  // Group multi-day blocks by row (for stacking)
  const multiDayRows = useMemo(() => {
    if (!hasMultiDayBlocks) return [];

    const rows = [];
    const processedBlocks = [];

    multiDayBlocks.forEach(block => {
      const weekStartKey = formatDateKey(weekDates[0]);
      const weekEndKey = formatDateKey(weekDates[6]);

      // Skip if block doesn't overlap with current week
      if (block.startDate > weekEndKey || block.endDate < weekStartKey) return;

      const { startDayIndex, endDayIndex } = getMultiDayBlockInfo(block, weekDates[0]);

      // Find a row where this block can fit
      let rowIndex = rows.findIndex(row => {
        return !row.some(existing => {
          const existingInfo = getMultiDayBlockInfo(existing, weekDates[0]);
          return !(endDayIndex < existingInfo.startDayIndex || startDayIndex > existingInfo.endDayIndex);
        });
      });

      if (rowIndex === -1) {
        rowIndex = rows.length;
        rows.push([]);
      }

      rows[rowIndex].push(block);
      processedBlocks.push(block);
    });

    return rows;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiDayBlocks, weekDates, hasMultiDayBlocks]);

  // Limit to 2 visible rows
  const visibleMultiDayRows = multiDayRows.slice(0, 2);
  const hiddenRowsCount = multiDayRows.length - 2;

  return (
    <div className={`flex flex-col bg-white flex-1 overflow-hidden ${className}`}>
      {/* FIXED Header - NOT scrollable */}
      <table className="w-full border-collapse table-fixed flex-shrink-0">
        <thead className="bg-white">
            <tr>
              {/* Time column header */}
              <th className="w-10 border-b border-r border-neutral-200 bg-white" />

              {/* Weekday headers */}
              {WEEK_DAYS.map((day, index) => {
                const date = weekDates[index];
                const today = isToday(date);
                const isFull = isDayFull(date);

                return (
                  <th
                    key={day}
                    className={`h-14 border-b border-r border-neutral-200 last:border-r-0 font-normal ${
                      today ? 'bg-primary-50' : isFull ? 'bg-amber-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center relative">
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-medium ${today ? 'text-primary-700' : 'text-neutral-900'}`}>
                          {day}
                        </span>
                        {isFull && (
                          <span className="group relative">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-neutral-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                              Alle Slots belegt
                            </span>
                          </span>
                        )}
                      </div>
                      <span className={`text-sm ${today ? 'text-primary-600' : 'text-neutral-500'}`}>
                        {formatDateDisplay(date)}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* T10: Lernplan blocks row (Month view) */}
            {hasLernplanBlocksRow && (
              <tr className="h-10 bg-neutral-50 border-b border-neutral-200">
                {/* Label cell */}
                <th className="align-middle border-r border-neutral-200 bg-neutral-50 px-1">
                  <span className="text-xs text-neutral-600 font-medium">Lernplan</span>
                </th>

                {/* Lernplan block cells for each day */}
                {weekDates.map((date, dayIndex) => {
                  const dateKey = formatDateKey(date);
                  const blocksForDay = lernplanBlocksByDate[dateKey] || [];

                  return (
                    <th
                      key={`lernplan-month-${dayIndex}`}
                      className="border-r border-neutral-100 last:border-r-0 p-1 font-normal bg-neutral-50 align-top"
                    >
                      <div className="flex flex-col gap-1">
                        {blocksForDay.map((block) => (
                          <LernplanBlockChip
                            key={block.id}
                            block={block}
                            onClick={onLernplanBlockClick ? () => onLernplanBlockClick(block, date) : undefined}
                          />
                        ))}
                      </div>
                    </th>
                  );
                })}
              </tr>
            )}

            {/* Multi-day events rows (sticky with header) */}
            {visibleMultiDayRows.length > 0 ? (
              visibleMultiDayRows.map((row, rowIndex) => {
                const isLastRow = rowIndex === visibleMultiDayRows.length - 1;
                return (
                  <tr key={`multiday-${rowIndex}`} className={`h-8 bg-white ${isLastRow ? 'border-b border-neutral-200' : ''}`}>
                    {/* Empty label cell */}
                    <th className={`align-middle border-r border-neutral-100 bg-white ${rowIndex === 0 ? 'border-t border-neutral-200' : ''}`} />

                    {/* Multi-day block cells */}
                    {weekDates.map((date, dayIndex) => {
                      // Find block that starts on this day in this row
                      const blockStartingHere = row.find(block => {
                        const info = getMultiDayBlockInfo(block, date);
                        return info.isStart && info.startDayIndex === dayIndex;
                      });

                      // Check if this cell is covered by a spanning block
                      const isCoveredBySpan = row.some(block => {
                        const info = getMultiDayBlockInfo(block, date);
                        return dayIndex > info.startDayIndex && dayIndex <= info.endDayIndex;
                      });

                      if (isCoveredBySpan) {
                        return null; // Cell is covered by colspan
                      }

                      if (blockStartingHere) {
                        const info = getMultiDayBlockInfo(blockStartingHere, date);
                        const colorClass = BLOCK_COLORS[blockStartingHere.blockType] || BLOCK_COLORS.private;

                        return (
                          <th
                            key={`${rowIndex}-${dayIndex}`}
                            colSpan={info.span}
                            className={`border-r border-neutral-100 last:border-r-0 p-0.5 font-normal bg-white ${rowIndex === 0 ? 'border-t border-neutral-200' : ''}`}
                          >
                            <button
                              draggable="false"
                              onClick={() => onBlockClick && onBlockClick(blockStartingHere, date)}
                              className={`w-full h-6 rounded border px-2 text-left overflow-hidden cursor-pointer transition-colors select-none ${colorClass}`}
                            >
                              <div className="text-xs font-medium text-neutral-900 truncate">
                                {blockStartingHere.title}
                              </div>
                            </button>
                          </th>
                        );
                      }

                      return (
                        <th
                          key={`${rowIndex}-${dayIndex}`}
                          className={`border-r border-neutral-100 last:border-r-0 font-normal bg-white ${rowIndex === 0 ? 'border-t border-neutral-200' : ''}`}
                        />
                      );
                    })}
                  </tr>
                )
              })
            ) : (
              /* Empty reserved row for multi-day events */
              <tr className="h-8 bg-white border-b border-neutral-200">
                <th className="align-middle border-r border-t border-neutral-200 bg-white" />
                {weekDates.map((_, dayIndex) => (
                  <th
                    key={`empty-${dayIndex}`}
                    className="border-r border-t border-neutral-200 last:border-r-0 font-normal bg-white"
                  />
                ))}
              </tr>
            )}

            {/* BUG-023 FIX: Lernplan blocks header bar (Exam mode only) */}
            {hasLernplanHeaderBlocks && (
              <tr className="h-10 bg-blue-50 border-b border-blue-200">
                {/* Label cell */}
                <th className="align-middle border-r border-blue-200 bg-blue-50 px-1">
                  <span className="text-xs text-blue-600 font-medium">Lernplan</span>
                </th>

                {/* Lernplan block cells for each day */}
                {weekDates.map((date, dayIndex) => {
                  const dateKey = formatDateKey(date);
                  const blocksForDay = lernplanHeaderBlocksByDate[dateKey] || [];

                  return (
                    <th
                      key={`lernplan-${dayIndex}`}
                      className="border-r border-blue-100 last:border-r-0 p-1 font-normal bg-blue-50"
                    >
                      <div className="flex gap-1 flex-wrap">
                        {blocksForDay.map((block) => {
                          const colorClass = BLOCK_COLORS[block.blockType] || BLOCK_COLORS.lernblock;
                          return (
                            <button
                              key={block.id}
                              draggable="false"
                              onClick={() => onBlockClick && onBlockClick(block, date)}
                              className={`flex-1 min-w-0 h-7 rounded border px-1.5 text-left overflow-hidden cursor-pointer transition-colors select-none ${colorClass}`}
                              title={`${block.title} (${block.startTime}-${block.endTime})`}
                            >
                              <div className="text-xs font-medium text-neutral-900 truncate">
                                {block.title}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>
        </table>

      {/* Scrollable Time Grid - Only this part scrolls */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        {/* T9 FIX: Div-based time grid (replaces table tbody) */}
        {/* This allows proper drag-to-select across multiple hours */}
        <div className="flex" style={{ height: `${24 * hourHeight}px` }}>
          {/* Time Labels Column */}
          <div className="w-10 flex-shrink-0 bg-white border-r border-neutral-100">
            {timeSlots.map((hour) => (
              <div
                key={hour}
                className="text-right pr-2 text-xs text-neutral-400 border-b border-neutral-100"
                style={{ height: `${hourHeight}px`, paddingTop: '4px' }}
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDates.map((date, dayIndex) => {
            const dateKey = formatDateKey(date);
            const isTodayColumn = dayIndex === getTodayColumnIndex;
            const selectionOverlay = getSelectionOverlay(dayIndex);

            // Get ALL blocks for this day (not just per hour)
            const dayBlocks = regularBlocks.filter(block => {
              const blockDate = block.startDate || block.date;
              return blockDate === dateKey && block.startTime;
            });

            return (
              <div
                key={`day-${dayIndex}`}
                className={`flex-1 relative border-r border-neutral-100 last:border-r-0 ${
                  dragState.isDragging && dragState.dayIndex === dayIndex ? 'cursor-ns-resize' : 'cursor-pointer'
                }`}
                onMouseDown={(e) => {
                  if (!onTimeRangeSelect) return;
                  if (e.target !== e.currentTarget) return;

                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;

                  setDragState({
                    isDragging: true,
                    dayIndex,
                    startY: y,
                    currentY: y,
                  });
                  e.preventDefault();
                }}
                onMouseMove={(e) => {
                  if (!dragState.isDragging || dragState.dayIndex !== dayIndex) return;

                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const clampedY = Math.max(0, Math.min(24 * hourHeight, y));

                  setDragState(prev => ({ ...prev, currentY: clampedY }));
                }}
                onMouseUp={() => handleDragEnd(dayIndex)}
                onMouseLeave={() => {
                  if (dragState.isDragging && dragState.dayIndex === dayIndex) {
                    setDragState({ isDragging: false, dayIndex: null, startY: null, currentY: null });
                  }
                }}
                onClick={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (dragJustCompletedRef.current) return;

                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const hour = Math.floor(y / hourHeight);
                  handleSlotClick(date, hour);
                }}
              >
                {/* Hour grid lines */}
                {timeSlots.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-b border-neutral-100"
                    style={{ top: `${hour * hourHeight}px`, height: `${hourHeight}px` }}
                  />
                ))}

                {/* T9: Current time indicator */}
                {isTodayColumn && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    style={{ top: `${currentTimePosition}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                    <div className="flex-1 h-0.5 bg-red-500" />
                  </div>
                )}

                {/* T9: Drag-to-select overlay */}
                {selectionOverlay && (
                  <div
                    className={`absolute left-1 right-1 rounded-lg border-2 border-dashed z-20 flex items-center justify-center pointer-events-none ${
                      selectionOverlay.isValid
                        ? 'bg-blue-100/70 border-blue-400'
                        : 'bg-red-100/70 border-red-400'
                    }`}
                    style={{
                      top: `${selectionOverlay.top}px`,
                      height: `${selectionOverlay.height}px`,
                    }}
                  >
                    <div className={`text-xs font-medium px-2 py-1 rounded ${
                      selectionOverlay.isValid ? 'text-blue-700 bg-blue-50' : 'text-red-700 bg-red-50'
                    }`}>
                      {selectionOverlay.isValid ? (
                        <>
                          {formatTimeFromHour(selectionOverlay.startTime)} - {formatTimeFromHour(selectionOverlay.endTime)}
                        </>
                      ) : selectionOverlay.collision ? (
                        'Überschneidung!'
                      ) : (
                        'Mind. 15 Min.'
                      )}
                    </div>
                  </div>
                )}

                {/* Blocks */}
                {dayBlocks.map((block) => {
                  const colorClass = BLOCK_COLORS[block.blockType] || BLOCK_COLORS.theme;
                  const isDragOver = dragOverBlockId === block.id;

                  // Calculate block position and height
                  const [startH, startM] = block.startTime.split(':').map(Number);
                  const blockTopPx = (startH + startM / 60) * hourHeight;

                  let durationHours = 1;
                  if (block.endTime) {
                    const [endH, endM] = block.endTime.split(':').map(Number);
                    durationHours = (endH + endM / 60) - (startH + startM / 60);
                  } else if (block.duration) {
                    durationHours = block.duration;
                  }
                  const blockHeight = Math.max(44, durationHours * hourHeight - 8);

                  // T9: Drag & Drop handlers
                  const handleBlockDragOver = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'copy';
                    setDragOverBlockId(block.id);
                  };

                  const handleBlockDragLeave = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverBlockId(null);
                  };

                  const handleBlockDrop = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverBlockId(null);

                    try {
                      const data = JSON.parse(e.dataTransfer.getData('application/json'));
                      if (onDropTaskToBlock) {
                        if (data.type === 'task') {
                          onDropTaskToBlock(block, data.task, data.source, 'task');
                        } else if (data.type === 'thema') {
                          onDropTaskToBlock(block, data.thema, data.source, 'thema');
                        }
                      }
                    } catch (err) {
                      console.error('Drop error:', err);
                    }
                  };

                  // T9: Blocked state rendering
                  if (block.isBlocked) {
                    return (
                      <div
                        key={block.id}
                        className="absolute left-1 right-1 rounded-lg border-2 border-neutral-300 p-2 flex flex-col items-center justify-center cursor-pointer z-10 bg-neutral-100 group"
                        style={{
                          top: `${blockTopPx + 4}px`,
                          height: `${blockHeight}px`,
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(163, 163, 163, 0.1) 10px, rgba(163, 163, 163, 0.1) 20px)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onBlockClick) onBlockClick(block, date);
                        }}
                      >
                        <div className="flex items-center gap-1.5 relative">
                          <Lock className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="text-xs font-medium text-neutral-500">Blockiert</span>
                          {/* Tooltip */}
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-neutral-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                            Lernzeitraum blockiert
                          </span>
                        </div>
                        {block.title && (
                          <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-full">{block.title}</p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={block.id}
                      className={`absolute left-1 right-1 rounded-lg border px-2 py-1.5 text-left overflow-hidden cursor-pointer transition-all z-10 select-none ${
                        isDragOver
                          ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300'
                          : `${colorClass} hover:shadow-md`
                      }`}
                      style={{
                        top: `${blockTopPx + 4}px`,
                        height: `${blockHeight}px`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onBlockClick) onBlockClick(block, date);
                      }}
                      onDragOver={handleBlockDragOver}
                      onDragEnter={handleBlockDragOver}
                      onDragLeave={handleBlockDragLeave}
                      onDrop={handleBlockDrop}
                    >
                      {/* Drop indicator overlay */}
                      {isDragOver && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-100/90 rounded-lg z-10 pointer-events-none">
                          <span className="text-xs font-medium text-blue-600">Hier ablegen</span>
                        </div>
                      )}

                      {/* Block content */}
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-medium text-neutral-900 truncate flex-1">
                          {block.title}
                        </div>
                        {block.startTime && block.endTime && blockHeight > 40 && (
                          <span className="text-xs text-neutral-500 shrink-0">
                            {block.startTime}-{block.endTime}
                          </span>
                        )}
                        {/* T9: Task progress indicator */}
                        {block.tasks && block.tasks.length > 0 && (
                          <span className="text-xs text-neutral-500 shrink-0">
                            {block.tasks.filter(t => t.completed).length}/{block.tasks.length}
                          </span>
                        )}
                      </div>

                      {/* T9: Progress bar */}
                      {block.tasks && block.tasks.length > 0 && blockHeight > 50 && (() => {
                        const completedCount = block.tasks.filter(t => t.completed).length;
                        const totalCount = block.tasks.length;
                        const progressPercent = Math.round((completedCount / totalCount) * 100);
                        return (
                          <div className="w-full bg-neutral-200 rounded-full h-1 mt-1">
                            <div
                              className={`h-1 rounded-full transition-all ${
                                progressPercent === 100 ? 'bg-green-500' : 'bg-neutral-600'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        );
                      })()}

                      {/* T9: Tasks list */}
                      {block.tasks && block.tasks.length > 0 && blockHeight > 70 && (() => {
                        const maxVisible = Math.min(3, Math.floor((blockHeight - 50) / 18));
                        const visibleTasks = block.tasks.slice(0, maxVisible);
                        const hiddenCount = block.tasks.length - maxVisible;

                        return (
                          <div className="flex flex-col gap-0.5 mt-1.5">
                            {visibleTasks.map((task, taskIndex) => (
                              <div key={task.id || taskIndex} className="flex items-center gap-1.5 group/task">
                                {/* T9: Checkbox for task completion */}
                                {onTaskToggle ? (
                                  <input
                                    type="checkbox"
                                    checked={task.completed || false}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      onTaskToggle(block, task);
                                    }}
                                    className="w-3 h-3 rounded border-neutral-300 text-primary-600 cursor-pointer shrink-0"
                                  />
                                ) : (
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    task.completed ? 'bg-green-500' : 'bg-neutral-400'
                                  }`} />
                                )}
                                <span className={`text-xs truncate flex-1 ${
                                  task.completed ? 'text-neutral-400 line-through' : 'text-neutral-600'
                                }`}>
                                  {task.themaTitle && (
                                    <span className="text-neutral-400 mr-0.5">{task.themaTitle}:</span>
                                  )}
                                  {task.text}
                                </span>
                                {/* X button to remove task */}
                                {onRemoveTaskFromBlock && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemoveTaskFromBlock(block, task);
                                    }}
                                    className="p-0.5 text-neutral-300 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity shrink-0"
                                    title="Aus Session entfernen"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {hiddenCount > 0 && (
                              <span className="text-xs text-neutral-400">
                                +{hiddenCount} weitere
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default WeekGrid;
