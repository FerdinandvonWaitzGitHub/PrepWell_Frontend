import React, { useEffect, useState, useRef } from 'react';

/**
 * ZeitplanWidget component
 * Displays today's schedule with timeline (6-22 hours)
 * Now with Backend integration via callbacks
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
  onDropTaskToBlock, // Callback when a task is dropped onto a block
}) => {
  const [blocks, setBlocks] = useState(data?.blocks || []);
  const [containerHeight, setContainerHeight] = useState(0);
  const [dragOverBlockId, setDragOverBlockId] = useState(null);
  const timelineContainerRef = useRef(null);

  const baseStartHour = 6;
  const hourSpan = 17; // 6-22 inkl.

  // Dynamische hourHeight basierend auf verfügbarer Höhe
  // Mindesthöhe 20px für Lesbarkeit, Maximum 50px
  const calculatedHourHeight = containerHeight > 0 ? Math.floor(containerHeight / hourSpan) : 32;
  const hourHeight = Math.max(20, Math.min(50, calculatedHourHeight));

  const hours = Array.from({ length: hourSpan }, (_, i) => baseStartHour + i); // 6-22
  const timeLabelsWidth = 40; // Breite für die Stunden-Labels
  const scheduledBlocks = blocks;
  const totalTimelineHeight = hourSpan * hourHeight;

  useEffect(() => {
    setBlocks(data?.blocks || []);
  }, [data]);

  // Container-Höhe messen und bei Resize aktualisieren
  useEffect(() => {
    const updateHeight = () => {
      if (timelineContainerRef.current) {
        // Berechne verfügbare Höhe: Viewport - Header - Statusbar - Footer - Padding
        const viewportHeight = window.innerHeight;
        const reservedHeight = 280; // Header, Statusbar, Footer, Padding
        const availableHeight = viewportHeight - reservedHeight;
        setContainerHeight(Math.max(300, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
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

  // Current time indicator
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const isInRange = currentHour >= baseStartHour && currentHour < baseStartHour + hourSpan;
  const currentTimePositionPx = isInRange
    ? (currentHour - baseStartHour + currentMinute / 60) * hourHeight
    : null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">Zeitplan für heute</h2>
            {plannedLabel ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700">
                {plannedLabel}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousDay}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              aria-label="Vorheriger Tag"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={handleNextDay}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              aria-label="Nächster Tag"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Timeline - Dynamische Höhe, kein Scrollen */}
      <div ref={timelineContainerRef} className="p-4">
        <div className="relative" style={{ height: `${totalTimelineHeight}px` }}>
          {/* Hour Labels and Grid Lines */}
          <div className="relative" style={{ height: `${totalTimelineHeight}px` }}>
            {hours.map((hour, index) => (
              <div
                key={hour}
                className="absolute left-0 right-0"
                style={{ top: `${index * hourHeight}px` }}
              >
                <div className="flex items-start">
                  <span className="text-xs font-medium text-gray-400 w-8 -mt-2">{hour}</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Current Time Indicator */}
          {currentTimePositionPx !== null && (
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: `${currentTimePositionPx}px` }}
            >
              <div className="flex items-center gap-2">
                <span className="w-8 text-xs font-bold text-red-500 text-right">
                  {currentHour}:{currentMinute.toString().padStart(2, '0')}
                </span>
                <div className="flex-1 border-t-2 border-red-500"></div>
              </div>
            </div>
          )}

          {/* Clickable Timeline Area - Opens add dialog when clicked */}
          <div
            className="absolute top-0 bottom-0 cursor-pointer"
            style={{ left: `${timeLabelsWidth}px`, right: 0 }}
            onClick={(e) => {
              // Only trigger if clicking on empty area, not on a block
              if (e.target === e.currentTarget && onTimelineClick) {
                onTimelineClick();
              }
            }}
          >
            {/* Scheduled Blocks */}
            {scheduledBlocks.map((block, index) => {
              const isBlocked = block.isBlocked;
              const isDragOver = dragOverBlockId === block.id;

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
                  if (data.type === 'task' && onDropTaskToBlock) {
                    onDropTaskToBlock(block, data.task, data.source);
                  }
                } catch (err) {
                  console.error('Drop error:', err);
                }
              };

              return (
                <div
                  key={block.id || index}
                  className={`absolute left-2 right-2 cursor-pointer rounded-lg border-2 p-3 flex flex-col overflow-hidden transition-all hover:shadow-lg ${
                    isDragOver
                      ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300'
                      : isBlocked
                        ? 'bg-gray-100 border-gray-300 text-gray-500'
                        : 'bg-blue-50 border-blue-200 hover:border-blue-400'
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
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-100/90 rounded-lg z-10 pointer-events-none">
                      <span className="text-sm font-medium text-blue-600">Aufgabe hier ablegen</span>
                    </div>
                  )}

                  {/* Content - pointer-events-none to not interfere with drag */}
                  <div className="pointer-events-none flex-1 flex flex-col justify-center">
                    {/* Title and Tasks Row */}
                    <div className="flex items-center">
                      {/* Title */}
                      <p className={`font-semibold leading-tight shrink-0 ${
                        isBlocked ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {block.title || 'Lernblock'}
                      </p>

                      {/* Tasks - horizontal layout */}
                      {block.tasks && block.tasks.length > 0 && (
                        <div className="flex-1 flex items-center gap-4 min-w-0 pl-6">
                          {block.tasks.slice(0, 2).map((task, taskIndex) => (
                            <div key={task.id || taskIndex} className="flex items-center gap-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                task.completed ? 'bg-green-500' : 'bg-blue-500'
                              }`} />
                              <span className={`text-sm truncate ${
                                task.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                              }`}>
                                {task.text}
                              </span>
                            </div>
                          ))}
                          {block.tasks.length > 2 && (
                            <span className="text-sm text-gray-500">
                              +{block.tasks.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Description (if space allows) */}
                    {block.description && block.duration >= 2 && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
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
