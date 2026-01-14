import { useEffect, useState, useRef } from 'react';

/**
 * Get block colors - Figma: neutral colors only (no Rechtsgebiet color coding)
 */
const getBlockColors = (blockType) => {
  // For private blocks, gray
  if (blockType === 'private') {
    return { bg: 'bg-neutral-100', border: 'border-neutral-300', text: 'text-neutral-700' };
  }
  // Default - neutral white with subtle border (Figma design)
  return { bg: 'bg-white', border: 'border-neutral-200', text: 'text-neutral-900' };
};

/**
 * ZeitplanWidget component
 * Displays today's schedule with timeline (6-22 hours)
 * Now with Backend integration via callbacks
 * Design based on Figma: Timeline with colored blocks and "Lernzeitraum blockiert"
 *
 * Status: Backend-connected
 */
const ZeitplanWidget = ({
  className = '',
  data,
  onPreviousDay,
  onNextDay,
  onBlockClick,
  onTimelineClick,
  onTimeRangeSelect, // T4.1: Callback when user drags to select a time range (startTime, endTime)
  onDropTaskToBlock, // Callback when a task is dropped onto a block
  onRemoveTaskFromBlock, // Callback when a task is DELETED from a block (permanent delete)
  onUnscheduleTaskFromBlock, // FR1: Callback when a task is moved BACK to To-Do list
}) => {
  const [blocks, setBlocks] = useState(data?.blocks || []);
  const [dragOverBlockId, setDragOverBlockId] = useState(null);
  const timelineContainerRef = useRef(null);
  const timelineAreaRef = useRef(null);

  // T4.1: State for drag-to-select time range
  const [isDraggingTimeRange, setIsDraggingTimeRange] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);
  const [dragCurrentY, setDragCurrentY] = useState(null);
  const dragJustCompletedRef = useRef(false); // Prevents click event after successful drag

  // BUG-007 FIX: Current time state that updates every minute
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    const intervalId = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(intervalId);
  }, []);

  // Current time values derived from state
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  // Always show full 24 hours (00:00 - 24:00), scrollable
  const baseStartHour = 0;
  const baseEndHour = 24;
  const hourSpan = 24;

  // Hour height for good visibility
  const hourHeight = 52;

  const hours = Array.from({ length: hourSpan }, (_, i) => baseStartHour + i);
  const timeLabelsWidth = 40; // Breite für die Stunden-Labels
  const scheduledBlocks = blocks;
  const totalTimelineHeight = hourSpan * hourHeight;

  // Bug 1b fix: Sync blocks from props - use JSON comparison for deep equality
  // This ensures tasks dropped onto blocks are reflected immediately
  useEffect(() => {
    const newBlocks = data?.blocks || [];
    setBlocks(prevBlocks => {
      // Deep compare to avoid unnecessary updates but catch task changes
      const prevJson = JSON.stringify(prevBlocks);
      const newJson = JSON.stringify(newBlocks);
      if (prevJson !== newJson) {
        return newBlocks;
      }
      return prevBlocks;
    });
  }, [data?.blocks]);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (timelineContainerRef.current) {
      // Scroll to show current time in upper third of visible area
      const scrollToHour = Math.max(0, currentHour - 2);
      const scrollPosition = scrollToHour * hourHeight;
      timelineContainerRef.current.scrollTop = scrollPosition;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plannedDuration = blocks.reduce((sum, block) => sum + Number(block.duration || 0), 0);
  const plannedLabel = data?.plannedLabel || (plannedDuration > 0 ? `${plannedDuration.toFixed(1)}h geplant` : '');

  const handlePreviousDay = () => {
    if (onPreviousDay) {
      onPreviousDay();
    }
  };

  const handleNextDay = () => {
    if (onNextDay) {
      onNextDay();
    }
  };

  // Calculate position and height for each block on timeline (in pixels)
  const getBlockStyle = (startHour, durationHours) => {
    const startPosPx = (startHour - baseStartHour) * hourHeight;
    const heightPx = durationHours * hourHeight;
    return {
      top: `${startPosPx}px`,
      height: `${heightPx}px`,
    };
  };

  // Current time indicator position
  const isInRange = currentHour >= baseStartHour && currentHour < baseEndHour;
  const currentTimePositionPx = isInRange
    ? (currentHour - baseStartHour + currentMinute / 60) * hourHeight
    : null;

  // T4.1: Helper function - Y-Position to hour (snapped to 15min intervals)
  const yToTime = (y) => {
    const rawHour = y / hourHeight;
    // Snap to 0.25 (15min intervals)
    const snapped = Math.round(rawHour * 4) / 4;
    // Clamp to valid range
    return Math.max(baseStartHour, Math.min(baseEndHour, snapped));
  };

  // T4.1: Helper function - Format hour as HH:MM string
  const formatTimeFromHour = (hour) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // T4.1: Helper function - Check collision with existing blocks
  const hasCollision = (startHour, endHour) => {
    return blocks.some(block => {
      const blockEnd = block.startHour + block.duration;
      return startHour < blockEnd && endHour > block.startHour;
    });
  };

  // T4.1: Helper function - Find the maximum endHour without collision (for clamping)
  const findMaxEndWithoutCollision = (startHour) => {
    let maxEnd = baseEndHour;
    blocks.forEach(block => {
      // If block starts after our start, it limits our end
      if (block.startHour > startHour && block.startHour < maxEnd) {
        maxEnd = block.startHour;
      }
    });
    return maxEnd;
  };

  // T4.1: Helper function - Find the minimum startHour without collision (for clamping when dragging upward)
  const findMinStartWithoutCollision = (endHour) => {
    let minStart = baseStartHour;
    blocks.forEach(block => {
      const blockEnd = block.startHour + block.duration;
      // If block ends before our end but after current minStart, it limits our start
      if (blockEnd <= endHour && blockEnd > minStart) {
        minStart = blockEnd;
      }
    });
    return minStart;
  };

  // T4.1: Mouse event handlers for drag-to-select
  const handleTimelineMouseDown = (e) => {
    // Only start drag if clicking on empty area (not on a block)
    if (e.target !== e.currentTarget) return;
    if (!onTimeRangeSelect) return;

    const rect = e.currentTarget.getBoundingClientRect();
    // getBoundingClientRect already accounts for scroll - DO NOT add scrollTop
    const y = e.clientY - rect.top;

    setIsDraggingTimeRange(true);
    setDragStartY(y);
    setDragCurrentY(y);

    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleTimelineMouseMove = (e) => {
    if (!isDraggingTimeRange) return;

    const rect = timelineAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    // getBoundingClientRect already accounts for scroll - DO NOT add scrollTop
    const y = e.clientY - rect.top;
    // Clamp to timeline bounds
    const clampedY = Math.max(0, Math.min(totalTimelineHeight, y));
    setDragCurrentY(clampedY);
  };

  const handleTimelineMouseUp = (e) => {
    if (!isDraggingTimeRange) return;

    const startTime = yToTime(Math.min(dragStartY, dragCurrentY));
    const endTime = yToTime(Math.max(dragStartY, dragCurrentY));

    // Reset drag state
    setIsDraggingTimeRange(false);
    setDragStartY(null);
    setDragCurrentY(null);

    // Minimum duration: 15 minutes (0.25 hours)
    if (endTime - startTime < 0.25) return;

    // Check for collision - if collision exists, clamp the selection
    let finalStart = startTime;
    let finalEnd = endTime;

    if (hasCollision(startTime, endTime)) {
      // Find the valid range based on where user started dragging
      const anchorTime = yToTime(dragStartY);
      const dragDirection = dragCurrentY > dragStartY ? 'down' : 'up';

      if (dragDirection === 'down') {
        // User dragged downward - clamp end to first block
        finalEnd = Math.min(endTime, findMaxEndWithoutCollision(startTime));
      } else {
        // User dragged upward - clamp start to last block end
        finalStart = Math.max(startTime, findMinStartWithoutCollision(endTime));
      }

      // If still collision or too short, abort
      if (hasCollision(finalStart, finalEnd) || finalEnd - finalStart < 0.25) {
        return;
      }
    }

    // Mark that a drag just completed - prevents click event from firing
    dragJustCompletedRef.current = true;
    setTimeout(() => {
      dragJustCompletedRef.current = false;
    }, 0);

    // Call callback with the selected time range
    if (onTimeRangeSelect) {
      onTimeRangeSelect(finalStart, finalEnd);
    }
  };

  // T4.1: Handle mouse leave to cancel drag if mouse exits timeline area
  const handleTimelineMouseLeave = () => {
    if (isDraggingTimeRange) {
      setIsDraggingTimeRange(false);
      setDragStartY(null);
      setDragCurrentY(null);
    }
  };

  // T4.1: Calculate selection overlay position and state
  const selectionOverlay = (() => {
    if (!isDraggingTimeRange || dragStartY === null || dragCurrentY === null) {
      return null;
    }

    const topY = Math.min(dragStartY, dragCurrentY);
    const bottomY = Math.max(dragStartY, dragCurrentY);
    const height = bottomY - topY;

    const startTime = yToTime(topY);
    const endTime = yToTime(bottomY);
    const collision = hasCollision(startTime, endTime);
    const tooShort = endTime - startTime < 0.25;

    return {
      top: topY,
      height: Math.max(height, hourHeight / 4), // Minimum visual height
      startTime,
      endTime,
      isValid: !collision && !tooShort,
      collision,
    };
  })();

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden flex flex-col h-full ${className}`}>
      {/* Header - Figma style */}
      <div className="px-5 py-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-extralight text-neutral-900">Zeitplan für heute</h2>
            {plannedLabel ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-900">
                {plannedLabel}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePreviousDay}
              className="h-9 w-9 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
              aria-label="Vorheriger Tag"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={handleNextDay}
              className="h-9 w-9 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
              aria-label="Nächster Tag"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Timeline - T11: flex-1 min-h-0 for proper flex-based scrolling within viewport height */}
      <div ref={timelineContainerRef} className="p-4 overflow-y-auto flex-1 min-h-0">
        <div className="relative" style={{ height: `${totalTimelineHeight}px` }}>
          {/* Hour Labels and Grid Lines - pointer-events-none so clicks pass through to timelineArea */}
          <div className="relative pointer-events-none" style={{ height: `${totalTimelineHeight}px` }}>
            {hours.map((hour, index) => (
              <div
                key={hour}
                className="absolute left-0 right-0"
                style={{ top: `${index * hourHeight}px` }}
              >
                <div className="flex items-start">
                  <span className="text-xs font-medium text-neutral-400 w-8 -mt-2">{hour}</span>
                  <div className="flex-1 border-t border-neutral-200"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Current Time Indicator - Figma: Red dot + line */}
          {currentTimePositionPx !== null && (
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: `${currentTimePositionPx}px` }}
            >
              <div className="flex items-center">
                {/* Time label */}
                <span className="w-8 text-xs font-bold text-red-500 text-right mr-1">
                  {currentHour}:{currentMinute.toString().padStart(2, '0')}
                </span>
                {/* Red Dot (Figma: Ellipse 6x6px) */}
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {/* Line */}
                <div className="flex-1 border-t-2 border-red-500 ml-0.5" />
              </div>
            </div>
          )}

          {/* Clickable Timeline Area - Opens add dialog when clicked, supports drag-to-select */}
          <div
            ref={timelineAreaRef}
            className={`absolute top-0 bottom-0 ${isDraggingTimeRange ? 'cursor-ns-resize' : 'cursor-pointer'}`}
            style={{ left: `${timeLabelsWidth}px`, right: 0 }}
            onClick={(e) => {
              // Only trigger if clicking on empty area, not on a block, not dragging, and no drag just completed
              if (e.target === e.currentTarget && onTimelineClick && !isDraggingTimeRange && !dragJustCompletedRef.current) {
                onTimelineClick();
              }
            }}
            onMouseDown={handleTimelineMouseDown}
            onMouseMove={handleTimelineMouseMove}
            onMouseUp={handleTimelineMouseUp}
            onMouseLeave={handleTimelineMouseLeave}
          >
            {/* T4.1: Selection Overlay during drag */}
            {selectionOverlay && (
              <div
                className={`absolute left-2 right-2 rounded-lg border-2 border-dashed transition-colors pointer-events-none z-20 flex items-center justify-center ${
                  selectionOverlay.isValid
                    ? 'bg-blue-100/70 border-blue-400'
                    : 'bg-red-100/70 border-red-400'
                }`}
                style={{
                  top: `${selectionOverlay.top}px`,
                  height: `${selectionOverlay.height}px`,
                }}
              >
                <div className={`text-sm font-medium px-2 py-1 rounded ${
                  selectionOverlay.isValid ? 'text-blue-700 bg-blue-50' : 'text-red-700 bg-red-50'
                }`}>
                  {selectionOverlay.isValid ? (
                    <>
                      {formatTimeFromHour(selectionOverlay.startTime)} - {formatTimeFromHour(selectionOverlay.endTime)}
                    </>
                  ) : selectionOverlay.collision ? (
                    'Überschneidung!'
                  ) : (
                    'Mindestens 15 Min.'
                  )}
                </div>
              </div>
            )}
            {/* Scheduled Blocks */}
            {scheduledBlocks.map((block, index) => {
              const isBlocked = block.isBlocked;
              const isDragOver = dragOverBlockId === block.id;
              const blockColors = getBlockColors(block.blockType);

              const handleDragOver = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
                setDragOverBlockId(block.id);
              };

              const handleDragLeave = (e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverBlockId(null);
              };

              const handleDrop = (e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverBlockId(null);

                try {
                  const data = JSON.parse(e.dataTransfer.getData('application/json'));
                  if (onDropTaskToBlock) {
                    if (data.type === 'task') {
                      // Single task drop
                      onDropTaskToBlock(block, data.task, data.source, 'task');
                    } else if (data.type === 'thema') {
                      // T5.4: Complete thema drop with all aufgaben
                      onDropTaskToBlock(block, data.thema, data.source, 'thema');
                    }
                  }
                } catch (err) {
                  console.error('Drop error:', err);
                }
              };

              // Blocked state: "Lernzeitraum blockiert" - neutral with striped pattern
              if (isBlocked) {
                return (
                  <div
                    key={block.id || index}
                    className="absolute left-2 right-2 cursor-pointer rounded-xl border-2 border-neutral-300 p-3 flex flex-col overflow-hidden transition-all hover:shadow-md bg-neutral-100"
                    style={{
                      ...getBlockStyle(block.startHour, block.duration),
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(163, 163, 163, 0.1) 10px, rgba(163, 163, 163, 0.1) 20px)',
                    }}
                    onClick={() => onBlockClick && onBlockClick(block)}
                  >
                    <div className="flex-1 flex flex-col justify-center items-center">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-sm font-medium text-neutral-500">Lernzeitraum blockiert</span>
                      </div>
                      {block.title && (
                        <p className="text-xs text-neutral-400 mt-1">{block.title}</p>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={block.id || index}
                  className={`absolute left-2 right-2 cursor-pointer rounded-xl border-2 p-3 flex flex-col overflow-hidden transition-all hover:shadow-lg ${
                    isDragOver
                      ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300'
                      : `${blockColors.bg} ${blockColors.border} hover:shadow-md`
                  }`}
                  style={getBlockStyle(block.startHour, block.duration)}
                  onClick={() => onBlockClick && onBlockClick(block)}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* Drop indicator overlay */}
                  {isDragOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-100/90 rounded-xl z-10 pointer-events-none">
                      <span className="text-sm font-medium text-blue-600">Hier ablegen</span>
                    </div>
                  )}

                  {/* Content - pointer-events-none to not interfere with drag */}
                  <div className="pointer-events-none flex-1 flex flex-col justify-center">
                    {/* Title Row */}
                    <div className="flex items-center gap-3">
                      {/* Title with colored indicator */}
                      <p className={`font-semibold leading-tight ${blockColors.text}`}>
                        {block.title || 'Lernblock'}
                      </p>

                      {/* Time display */}
                      {block.startTime && block.endTime && (
                        <span className="text-xs text-neutral-500 font-medium">
                          {block.startTime} - {block.endTime}
                        </span>
                      )}

                      {/* TICKET-11: Task-based progress indicator */}
                      {block.tasks && block.tasks.length > 0 && (
                        <span className="text-xs text-neutral-500 font-medium ml-auto">
                          {block.tasks.filter(t => t.completed).length}/{block.tasks.length}
                        </span>
                      )}
                    </div>

                    {/* TICKET-11: Progress bar based on completed tasks */}
                    {block.tasks && block.tasks.length > 0 && (() => {
                      const completedCount = block.tasks.filter(t => t.completed).length;
                      const totalCount = block.tasks.length;
                      const progressPercent = Math.round((completedCount / totalCount) * 100);
                      return (
                        <div className="w-full bg-neutral-200 rounded-full h-1 mt-1.5">
                          <div
                            className={`h-1 rounded-full transition-all ${
                              progressPercent === 100 ? 'bg-green-500' : 'bg-neutral-600'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      );
                    })()}

                    {/* Tasks - vertical layout with thema grouping */}
                    {block.tasks && block.tasks.length > 0 && (
                      <div className="flex flex-col gap-1 min-w-0 mt-2 pointer-events-auto">
                        {block.tasks.slice(0, 3).map((task, taskIndex) => (
                          <div key={task.id || taskIndex} className="flex items-center gap-2 min-w-0 group/task">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              task.completed ? 'bg-green-500' : 'bg-neutral-400'
                            }`} />
                            <span className={`text-sm truncate flex-1 ${
                              task.completed ? 'text-neutral-400 line-through' : 'text-neutral-600'
                            }`}>
                              {/* Show thema title if available */}
                              {task.themaTitle && (
                                <span className="text-neutral-400 mr-1">{task.themaTitle}:</span>
                              )}
                              {task.text}
                            </span>
                            {/* Task actions (delete, unschedule) are only available in the dialog */}
                          </div>
                        ))}
                        {block.tasks.length > 3 && (
                          <span className="text-xs text-neutral-500 font-medium">
                            +{block.tasks.length - 3} weitere
                          </span>
                        )}
                      </div>
                    )}

                    {/* Description (if space allows) */}
                    {block.description && block.duration >= 2 && (
                      <p className="text-xs text-neutral-400 mt-2 line-clamp-2">
                        {block.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZeitplanWidget;
