import { useMemo } from 'react';

/**
 * WeekGrid component
 * Row-based weekly calendar grid based on Figma design
 * - Weekday header stays fixed at top (sticky)
 * - Multi-day events row between header and time grid
 * - Time labels scroll with content
 */

// Block type colors
const BLOCK_COLORS = {
  theme: 'bg-primary-100 border-primary-200 hover:bg-primary-150',
  repetition: 'bg-primary-100 border-primary-200 hover:bg-primary-150',
  exam: 'bg-blue-100 border-blue-200 hover:bg-blue-150',
  free: 'bg-gray-100 border-gray-200 hover:bg-gray-150',
  private: 'bg-violet-100 border-violet-200 hover:bg-violet-150'
};

// Block type display names
const BLOCK_TYPE_NAMES = {
  theme: 'Thema',
  repetition: 'Wiederholung',
  exam: 'Klausur',
  free: 'Freizeit',
  private: 'Privat'
};

const WeekGrid = ({
  currentDate = new Date(),
  blocks = [],
  privateBlocks = [],
  onBlockClick,
  onSlotClick,
  className = ''
}) => {
  const weekDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

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

  // Format date for display (e.g., "13. Dez")
  const formatDateDisplay = (date) => {
    return `${date.getDate()}. ${months[date.getMonth()].slice(0, 3)}`;
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

  // Handle slot click
  const handleSlotClick = (date, hour) => {
    if (onSlotClick) {
      onSlotClick(date, `${hour.toString().padStart(2, '0')}:00`);
    }
  };

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
              <th className="w-10 border-b border-r border-gray-200 bg-white" />

              {/* Weekday headers */}
              {weekDays.map((day, index) => {
                const date = weekDates[index];
                const today = isToday(date);

                return (
                  <th
                    key={day}
                    className={`h-14 border-b border-r border-gray-200 last:border-r-0 font-normal ${
                      today ? 'bg-primary-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className={`text-sm font-medium ${today ? 'text-primary-700' : 'text-gray-900'}`}>
                        {day}
                      </span>
                      <span className={`text-sm ${today ? 'text-primary-600' : 'text-gray-500'}`}>
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
                  <tr key={`multiday-${rowIndex}`} className={`h-8 bg-white ${isLastRow ? 'border-b border-gray-200' : ''}`}>
                    {/* Empty label cell */}
                    <th className={`align-middle border-r border-gray-100 bg-white ${rowIndex === 0 ? 'border-t border-gray-200' : ''}`} />

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
                            className={`border-r border-gray-100 last:border-r-0 p-0.5 font-normal bg-white ${rowIndex === 0 ? 'border-t border-gray-200' : ''}`}
                          >
                            <button
                              onClick={() => onBlockClick && onBlockClick(blockStartingHere, date)}
                              className={`w-full h-6 rounded border px-2 text-left overflow-hidden cursor-pointer transition-colors ${colorClass}`}
                            >
                              <div className="text-xs font-medium text-gray-900 truncate">
                                {blockStartingHere.title}
                              </div>
                            </button>
                          </th>
                        );
                      }

                      return (
                        <th
                          key={`${rowIndex}-${dayIndex}`}
                          className={`border-r border-gray-100 last:border-r-0 font-normal bg-white ${rowIndex === 0 ? 'border-t border-gray-200' : ''}`}
                        />
                      );
                    })}
                  </tr>
                )
              })
            ) : (
              /* Empty reserved row for multi-day events */
              <tr className="h-8 bg-white border-b border-gray-200">
                <th className="align-middle border-r border-t border-gray-200 bg-white" />
                {weekDates.map((_, dayIndex) => (
                  <th
                    key={`empty-${dayIndex}`}
                    className="border-r border-t border-gray-200 last:border-r-0 font-normal bg-white"
                  />
                ))}
              </tr>
            )}
          </thead>

          {/* Body */}
          <tbody>
            {/* "+X more" row if needed (scrolls with content) */}
            {hiddenRowsCount > 0 && (
              <tr className="h-6 border-b border-gray-200">
                <td className="border-r border-gray-100 bg-white" />
                {weekDates.map((date, dayIndex) => {
                  const hiddenBlocks = multiDayRows.slice(2).flat().filter(block => {
                    const dateKey = formatDateKey(date);
                    return block.startDate <= dateKey && block.endDate >= dateKey;
                  });

                  return (
                    <td
                      key={`more-${dayIndex}`}
                      className="border-r border-gray-100 last:border-r-0 text-center"
                    >
                      {hiddenBlocks.length > 0 && (
                        <button className="text-xs text-gray-600 hover:text-gray-900">
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
                <td className="align-top text-right pr-2 pt-1 text-xs text-gray-400 border-r border-b border-gray-100 bg-white">
                  {hour}
                </td>

                {/* Day Cells */}
                {weekDates.map((date, dayIndex) => {
                  const dayBlocks = getBlocksForDateAndHour(date, hour);

                  return (
                    <td
                      key={`${hour}-${dayIndex}`}
                      onClick={() => dayBlocks.length === 0 && handleSlotClick(date, hour)}
                      className={`relative border-r border-b border-gray-100 last:border-r-0 p-1 align-top overflow-visible ${
                        dayBlocks.length === 0 ? 'hover:bg-gray-50 cursor-pointer' : ''
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
                            onClick={(e) => {
                              e.stopPropagation();
                              onBlockClick && onBlockClick(block, date);
                            }}
                            style={{ height: `${blockHeight}px` }}
                            className={`w-full rounded-lg border px-2 py-1.5 text-left overflow-hidden cursor-pointer transition-colors absolute top-1 left-1 right-1 z-10 ${colorClass}`}
                          >
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {block.title}
                            </div>
                            {blockHeight > 40 && (
                              <div className="text-xs text-gray-600 truncate">
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
};

export default WeekGrid;
