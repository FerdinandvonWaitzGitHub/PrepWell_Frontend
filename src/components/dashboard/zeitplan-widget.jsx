import React, { useEffect, useState } from 'react';

/**
 * ZeitplanWidget component
 * Displays today's schedule with timeline (8-16 hours)
 * Now with Backend integration via callbacks
 *
 * Status: Backend-connected
 */
const ZeitplanWidget = ({
  className = '',
  data,
  onPreviousDay,
  onNextDay,
  onToggleTask,
  onBlockClick,
  onTimelineClick,
}) => {
  const [blocks, setBlocks] = useState(data?.blocks || []);

  const baseStartHour = 8;
  const hourSpan = 9; // 8-16 inkl.

  const hours = Array.from({ length: hourSpan }, (_, i) => baseStartHour + i); // 8-16
  const blockOffset = 48; // px offset from the left for cards to align with ticks
  const blockWidth = 550; // Figma width for cards
  const scheduledBlocks = blocks;

  useEffect(() => {
    setBlocks(data?.blocks || []);
  }, [data]);

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

  const toggleTask = (blockIndex, taskId) => {
    if (onToggleTask) {
      onToggleTask(taskId);
      return;
    }

    // Local fallback if no callback provided
    setBlocks(blocks.map((block, idx) => {
      if (idx !== blockIndex) return block;
      const tasks = (block.tasks || []).map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      return { ...block, tasks };
    }));
  };

  // Calculate position and height for each block on timeline
  const getBlockStyle = (startHour, durationHours) => {
    const startPos = ((startHour - baseStartHour) / hourSpan) * 100;
    const height = (durationHours / hourSpan) * 100;
    return {
      top: `${startPos}%`,
      height: `${height}%`,
    };
  };

  // Current time indicator
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const isInRange = currentHour >= baseStartHour && currentHour < baseStartHour + hourSpan;
  const currentTimePosition = isInRange
    ? ((currentHour - baseStartHour + currentMinute / 60) / hourSpan) * 100
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

      {/* Timeline */}
      <div className="p-4 max-h-[730px] overflow-y-auto">
        <div className="relative">
          {/* Hour Labels and Grid Lines */}
          <div className="space-y-12">
            {hours.map((hour) => (
              <div key={hour} className="relative">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-gray-400 w-8">{hour}</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Current Time Indicator */}
          {currentTimePosition !== null && (
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: `${currentTimePosition}%` }}
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
            className="absolute top-0 left-12 right-0 bottom-0 cursor-pointer"
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
              const tasksForBlock = block.tasks || [];

              return (
                <div
                  key={block.id || index}
                  className="absolute cursor-pointer"
                  style={{
                    ...getBlockStyle(block.startHour, block.duration),
                    left: `${blockOffset}px`,
                    width: `${blockWidth}px`,
                  }}
                  onClick={() => onBlockClick && onBlockClick(block)}
                >
                  {isBlocked ? (
                    <div className="relative h-full w-full bg-gray-100 rounded border border-gray-200 text-gray-500 text-sm flex items-center px-4 hover:bg-gray-200 transition-colors">
                      {block.title || ''}
                      <span className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-gray-400 bg-white"></span>
                    </div>
                  ) : (
                    <div className="relative h-full w-full rounded border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-4 flex flex-col gap-3 hover:shadow-md hover:border-gray-300 transition-all">
                      <span className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-gray-700 bg-white"></span>
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-2 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {(block.tags || []).map((tag) => (
                              <span
                                key={tag}
                                className="px-3 py-1 rounded-2xl bg-black text-white text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div>
                            <p className="text-base font-medium text-gray-900 leading-snug">
                              {block.title || ''}
                            </p>
                            {block.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {block.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-2 text-sm text-gray-700">
                          {tasksForBlock.map((task) => (
                            <label key={task.id} className="flex items-center gap-2 text-sm text-gray-800">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleTask(index, task.id)}
                                className="h-4 w-4 rounded border-gray-300 focus:ring-gray-500 accent-black"
                              />
                              <span className="text-sm text-gray-800">{task.text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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
