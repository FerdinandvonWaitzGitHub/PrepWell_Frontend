import { memo, useMemo, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * WeekGrid component
 * Row-based weekly calendar grid based on Figma design
 * - Weekday header stays fixed at top (sticky)
 * - Multi-day events row between header and time grid
 * - Time labels scroll with content
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

// Static arrays moved outside component to prevent re-creation
const WEEK_DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const WeekGrid = memo(function WeekGrid({
  currentDate = new Date(),
  blocks = [],
  privateBlocks = [],
  lernplanBlocks = [], // BUG-023 FIX: Lernplan blocks for Exam mode header bar
  lernplanSlots, // Legacy alias (deprecated)
  onBlockClick,
  onSlotClick,
  className = ''
}) {
  // Support legacy prop name
  const effectiveLernplanBlocks = lernplanBlocks.length > 0 ? lernplanBlocks : (lernplanSlots || []);

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

  // BUG-023 FIX: Group Lernplan blocks by date for header bar display
  const lernplanBlocksByDate = useMemo(() => {
    const byDate = {};
    effectiveLernplanBlocks.forEach(block => {
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
  }, [effectiveLernplanBlocks]);

  // Check if there are any Lernplan blocks in current week
  const hasLernplanBlocks = effectiveLernplanBlocks.length > 0;

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
      {/* Single scrollable container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse table-fixed">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-20 bg-white">
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
            {hasLernplanBlocks && (
              <tr className="h-10 bg-blue-50 border-b border-blue-200">
                {/* Label cell */}
                <th className="align-middle border-r border-blue-200 bg-blue-50 px-1">
                  <span className="text-xs text-blue-600 font-medium">Lernplan</span>
                </th>

                {/* Lernplan block cells for each day */}
                {weekDates.map((date, dayIndex) => {
                  const dateKey = formatDateKey(date);
                  const blocksForDay = lernplanBlocksByDate[dateKey] || [];

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

          {/* Body */}
          <tbody>
            {/* "+X more" row if needed (scrolls with content) */}
            {hiddenRowsCount > 0 && (
              <tr className="h-6 border-b border-neutral-200">
                <td className="border-r border-neutral-100 bg-white" />
                {weekDates.map((date, dayIndex) => {
                  const hiddenBlocks = multiDayRows.slice(2).flat().filter(block => {
                    const dateKey = formatDateKey(date);
                    return block.startDate <= dateKey && block.endDate >= dateKey;
                  });

                  return (
                    <td
                      key={`more-${dayIndex}`}
                      className="border-r border-neutral-100 last:border-r-0 text-center"
                    >
                      {hiddenBlocks.length > 0 && (
                        <button className="text-xs text-neutral-600 hover:text-neutral-900">
                          +{hiddenBlocks.length} mehr
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Time slots */}
            {timeSlots.map((hour) => (
              <tr key={hour} style={{ height: `${getRowHeight(hour)}px` }}>
                {/* Time Label */}
                <td className="align-top text-right pr-2 pt-1 text-xs text-neutral-400 border-r border-b border-neutral-100 bg-white">
                  {hour}
                </td>

                {/* Day Cells */}
                {weekDates.map((date, dayIndex) => {
                  const dayBlocks = getBlocksForDateAndHour(date, hour);

                  return (
                    <td
                      key={`${hour}-${dayIndex}`}
                      onClick={() => dayBlocks.length === 0 && handleSlotClick(date, hour)}
                      className={`relative border-r border-b border-neutral-100 last:border-r-0 p-1 align-top overflow-visible ${
                        dayBlocks.length === 0 ? 'hover:bg-neutral-50 cursor-pointer' : ''
                      }`}
                    >
                      {dayBlocks.map((block) => {
                        const colorClass = BLOCK_COLORS[block.blockType] || BLOCK_COLORS.theme;

                        // Calculate block height based on actual time duration
                        let durationHours = 1; // default 1 hour
                        if (block.startTime && block.endTime) {
                          const [startH, startM] = block.startTime.split(':').map(Number);
                          const [endH, endM] = block.endTime.split(':').map(Number);
                          durationHours = (endH + endM / 60) - (startH + startM / 60);
                        } else if (block.duration) {
                          durationHours = block.duration;
                        }

                        // Each hour row is approximately 54px
                        const hourHeight = 54;
                        const blockHeight = Math.max(44, durationHours * hourHeight - 8);

                        return (
                          <button
                            key={block.id}
                            draggable="false"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onBlockClick) {
                                onBlockClick(block, date);
                              }
                            }}
                            style={{ height: `${blockHeight}px` }}
                            className={`w-full rounded-lg border px-2 py-1.5 text-left overflow-hidden cursor-pointer transition-colors absolute top-1 left-1 right-1 z-10 select-none ${colorClass}`}
                          >
                            <div className="text-xs font-medium text-neutral-900 truncate">
                              {block.title}
                            </div>
                            {blockHeight > 40 && (
                              <div className="text-xs text-neutral-600 truncate">
                                {block.startTime && block.endTime
                                  ? `${block.startTime} - ${block.endTime}`
                                  : BLOCK_TYPE_NAMES[block.blockType]
                                }
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default WeekGrid;
