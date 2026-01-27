import { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { getRechtsgebietColor, getColorClasses } from '../../../utils/rechtsgebiet-colors';

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

// Block type colors for multi-day and header blocks (static, no re-creation)
const BLOCK_COLORS = {
  // Learning blocks (theme/lernblock) - neutral color
  theme: 'bg-neutral-100 border-neutral-200 hover:bg-neutral-50',
  lernblock: 'bg-neutral-100 border-neutral-200 hover:bg-neutral-50',
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

/**
 * KA-001: Session-Farblogik
 * - Kein Rechtsgebiet → Grau (neutral)
 * - Mit Rechtsgebiet → Farbe aus Einstellungen
 */
const getSessionColorClasses = (session) => {
  // Rechtsgebiet-ID aus verschiedenen möglichen Feldern
  const rgId = session?.rechtsgebiet || session?.rechtsgebietId || session?.metadata?.rgId;

  if (!rgId) {
    // Standard: Grau
    return {
      container: 'bg-neutral-50 border-neutral-300 hover:bg-neutral-100',
      text: 'text-neutral-700'
    };
  }

  // Rechtsgebiet-Farbe aus Einstellungen
  const colors = getRechtsgebietColor(rgId);
  return {
    container: `${colors.bg} ${colors.border} hover:opacity-90`,
    text: colors.text
  };
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
      className={`w-full px-2.5 py-1.5 rounded-md border shadow-xs text-left text-xs truncate hover:shadow-sm hover:-translate-y-px transition-all ${colorClass}`}
      title={`${label} ${sizeLabel}`.trim()}
    >
      <div className="flex items-center gap-1.5">
        <span className="truncate font-semibold">
          {label}
        </span>
        {size > 1 && (
          <span className="text-[10px] opacity-60 flex-shrink-0 font-medium">
            ×{size}
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
  onTimeBlockClick,
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
  // KA-001: Header-Höhe wird in der scroll position berücksichtigt
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Always scroll to 08:00 so that 08:00-17:00 is visible
      const scrollToHour = 8;
      // KA-001: Berechne Header-Höhe dynamisch (wird nach erstem Render korrekt sein)
      const stickyHeader = scrollContainerRef.current.querySelector('.sticky');
      const currentHeaderHeight = stickyHeader?.offsetHeight || 127; // Fallback: 58 + 69 = 127
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

  // Generate time blocks for the day (hourly rows)
  const timeBlocks = useMemo(() => {
    return Array.from(
      { length: endHour - startHour },
      (_, i) => startHour + i
    );
  }, [startHour, endHour]);

  // Format date key for comparison (YYYY-MM-DD)
  // KA-002 FIX: Verwende lokale Zeit statt UTC (toISOString verschiebt um 1 Tag)
  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // T10: Lernplan blocks (month view) grouped by date and by groupId
  // KA-001 FIX: Gruppiere Blöcke nach groupId wie blocksToLearningSessions
  const lernplanBlocksByDate = useMemo(() => {
    const byDate = {};

    Object.entries(lernplanBlocks || {}).forEach(([dateKey, blocksForDay]) => {
      // Filter: nur nicht-leere Blöcke
      const filtered = (blocksForDay || []).filter(block => block && block.status !== 'empty');

      if (filtered.length === 0) return;

      // Gruppiere nach groupId (wie blocksToLearningSessions in blockUtils.ts)
      const groupedBlocks = {};
      const ungroupedBlocks = [];
      const processedGroupIds = new Set();

      filtered.forEach(block => {
        const groupId = block.groupId;

        if (groupId) {
          // Block gehört zu einer Gruppe
          if (!groupedBlocks[groupId]) {
            groupedBlocks[groupId] = [];
          }
          groupedBlocks[groupId].push(block);
        } else {
          // Einzelner Block ohne Gruppe
          ungroupedBlocks.push(block);
        }
      });

      // Erstelle eine Session pro Gruppe (mit blockSize = Anzahl Blöcke)
      const sessions = [];

      // Gruppierte Blöcke: nur EINE Session pro Gruppe
      Object.entries(groupedBlocks).forEach(([groupId, groupBlocks]) => {
        if (processedGroupIds.has(groupId)) return;
        processedGroupIds.add(groupId);

        // Sortiere nach groupIndex/position
        groupBlocks.sort((a, b) => (a.groupIndex || a.position || 0) - (b.groupIndex || b.position || 0));

        // Nimm den ersten Block als Referenz und setze blockSize
        const firstBlock = groupBlocks[0];
        sessions.push({
          ...firstBlock,
          blockSize: groupBlocks.length,
          groupSize: groupBlocks.length
        });
      });

      // Ungroupierte Blöcke: je eine Session
      ungroupedBlocks.forEach(block => {
        sessions.push({
          ...block,
          blockSize: block.blockSize || 1,
          groupSize: block.groupSize || 1
        });
      });

      // Sortiere nach Position des ersten Blocks
      sessions.sort((a, b) => (a.position || 0) - (b.position || 0));

      if (sessions.length > 0) {
        byDate[dateKey] = sessions;
      }
    });
    return byDate;
  }, [lernplanBlocks]);

  // KA-001: Berechne maximale Anzahl Blöcke pro Tag für dynamische Row-Höhe
  const maxLernplanBlocksPerDay = useMemo(() => {
    let max = 0;
    weekDates.forEach(date => {
      const dateKey = formatDateKey(date);
      const blocksCount = (lernplanBlocksByDate[dateKey] || []).length;
      if (blocksCount > max) max = blocksCount;
    });
    return max;
  }, [weekDates, lernplanBlocksByDate]);

  const hasLernplanBlocksRow = useMemo(() => {
    return weekDates.some(date => {
      const dateKey = formatDateKey(date);
      return (lernplanBlocksByDate[dateKey] || []).length > 0;
    });
  }, [weekDates, lernplanBlocksByDate]);

  // Count blocks per day to detect full days (4 blocks max)
  const blocksPerDay = useMemo(() => {
    const counts = {};
    regularBlocks.forEach(block => {
      const dateKey = block.date || formatDateKey(new Date());
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return counts;
  }, [regularBlocks]);

  // Check if a day has all blocks full (4 or more blocks)
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

  // Handle time block click - memoized to prevent child re-renders
  const handleTimeBlockClick = useCallback((date, hour) => {
    if (onTimeBlockClick) {
      onTimeBlockClick(date, `${hour.toString().padStart(2, '0')}:00`);
    }
  }, [onTimeBlockClick]);

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
      console.log('[handleDragEnd] date:', date, 'dayIndex:', dayIndex, 'weekDates:', weekDates);
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
      const blocksInHour = getBlocksForDateAndHour(date, hour);
      blocksInHour.forEach(block => {
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

  // KA-001: CSS Grid Template für einheitliches Layout (Header + Body)
  const gridTemplateColumns = 'minmax(30px, 30px) repeat(7, minmax(0, 1fr))';

  // KA-001: Berechne Header-Höhe für korrekten Auto-Scroll
  // Basis: 58px (Wochentage)
  // + dynamische Lernplan-Row-Höhe wenn vorhanden
  // + 69px Multi-Day Row wenn vorhanden
  // + 40px wenn Exam-Mode Header
  const lernplanRowHeight = hasLernplanBlocksRow ? Math.max(48, maxLernplanBlocksPerDay * 36 + 12) : 0;
  const headerHeight = 58 + lernplanRowHeight + (hasMultiDayBlocks ? 69 : 0) + (hasLernplanHeaderBlocks ? 40 : 0);

  return (
    <div className={`flex flex-col bg-white flex-1 overflow-hidden rounded-[5px] border border-neutral-200 ${className}`}>
      {/* KA-001 FIX: Ein einziger Scroll-Container für Header UND Body */}
      {/* Header ist sticky, Body scrollt darunter - keine Alignment-Probleme mehr! */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden">

        {/* KA-001: STICKY Header - klebt am oberen Rand beim Scrollen */}
        <div className="sticky top-0 z-20 bg-white">
          {/* Tages-Header Zeile */}
          <div
            className="grid border-b border-neutral-200"
            style={{ gridTemplateColumns }}
          >
          {/* Zeit-Spalte Header (leer) */}
          <div className="h-[58px] border-r border-neutral-200 bg-neutral-50/50" />

          {/* Wochentags-Header */}
          {WEEK_DAYS.map((day, index) => {
            const date = weekDates[index];
            const today = isToday(date);
            const isFull = isDayFull(date);

            return (
              <div
                key={day}
                className={`h-[58px] border-r border-neutral-200 last:border-r-0 pl-5 py-2 flex flex-col gap-0.5 justify-center transition-colors ${
                  isFull ? 'bg-amber-50' : 'bg-neutral-50/50'
                }`}
              >
                {/* KA-001: Tagname mit blauem Heute-Indikator */}
                <div className="flex items-center gap-2.5">
                  {today && (
                    <span className="w-[7px] h-[7px] rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${today ? 'text-neutral-950' : 'text-neutral-950'}`}>
                    {day}
                  </span>
                  {isFull && (
                    <span className="group relative">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-neutral-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        Alle Bloecke belegt
                      </span>
                    </span>
                  )}
                </div>
                {/* KA-001: Datum */}
                <span className="text-sm font-normal text-neutral-500">
                  {formatDateDisplay(date)}
                </span>
              </div>
            );
          })}
        </div>

        {/* T10: Lernplan blocks row (Month view) - KA-001: CSS Grid */}
        {/* KA-001 FIX: Dynamische Höhe basierend auf max Blöcke pro Tag */}
        {/* Jeder Block ist ca. 32px hoch + 4px gap = 36px pro Block, min 48px */}
        {hasLernplanBlocksRow && (
          <div
            className="grid bg-gradient-to-b from-neutral-50 to-neutral-100/50 border-b border-neutral-200"
            style={{
              gridTemplateColumns,
              minHeight: `${Math.max(48, maxLernplanBlocksPerDay * 36 + 12)}px`
            }}
          >
            {/* Label cell */}
            <div className="flex items-center justify-center border-r border-neutral-200 bg-neutral-100/50 px-2">
              <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">Plan</span>
            </div>

            {/* Lernplan block cells for each day */}
            {weekDates.map((date, dayIndex) => {
              const dateKey = formatDateKey(date);
              const blocksForDay = lernplanBlocksByDate[dateKey] || [];

              return (
                <div
                  key={`lernplan-month-${dayIndex}`}
                  className="border-r border-neutral-200 last:border-r-0 p-1.5 bg-transparent"
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
                </div>
              );
            })}
          </div>
        )}

        {/* Multi-day events row (Private Langzeit-Termine) - KA-001: CSS Grid */}
        {/* KA-001: Nur anzeigen wenn Multi-Day Events existieren */}
        {hasMultiDayBlocks && (
          <div
            className="grid h-[69px] border-b border-neutral-200"
            style={{ gridTemplateColumns }}
          >
          {/* Empty label cell */}
          <div className="border-r border-neutral-200 bg-neutral-50/30" />

          {/* Multi-day event cells - simplified display without colspan */}
          {weekDates.map((date, dayIndex) => {
            const dateKey = formatDateKey(date);
            // Find all multi-day blocks that span this day
            const blocksOnThisDay = visibleMultiDayRows.flat().filter(block => {
              const info = getMultiDayBlockInfo(block, date);
              return dayIndex >= info.startDayIndex && dayIndex <= info.endDayIndex;
            });

            return (
              <div
                key={`multiday-${dayIndex}`}
                className="border-r border-neutral-200 last:border-r-0 p-1 flex flex-col gap-1 overflow-hidden"
              >
                {blocksOnThisDay.slice(0, 2).map((block) => {
                  const info = getMultiDayBlockInfo(block, date);
                  const colorClass = BLOCK_COLORS[block.blockType] || BLOCK_COLORS.private;
                  const isStart = info.isStart && info.startDayIndex === dayIndex;

                  return (
                    <button
                      key={block.id}
                      draggable="false"
                      onClick={() => onBlockClick && onBlockClick(block, date)}
                      className={`h-6 rounded border px-2 text-left overflow-hidden cursor-pointer transition-colors select-none ${colorClass} ${
                        !isStart ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="text-xs font-medium text-neutral-900 truncate">
                        {isStart ? block.title : '→'}
                      </div>
                    </button>
                  );
                })}
                {blocksOnThisDay.length > 2 && (
                  <span className="text-xs text-neutral-400 px-1">+{blocksOnThisDay.length - 2}</span>
                )}
              </div>
            );
          })}
        </div>
        )}

        {/* BUG-023 FIX: Lernplan blocks header bar (Exam mode only) - KA-001: CSS Grid */}
        {hasLernplanHeaderBlocks && (
          <div
            className="grid h-10 bg-blue-50 border-b border-blue-200"
            style={{ gridTemplateColumns }}
          >
            {/* Label cell */}
            <div className="flex items-center justify-center border-r border-blue-200 bg-blue-50 px-1">
              <span className="text-xs text-blue-600 font-medium">Lernplan</span>
            </div>

            {/* Lernplan block cells for each day */}
            {weekDates.map((date, dayIndex) => {
              const dateKey = formatDateKey(date);
              const blocksForDay = lernplanHeaderBlocksByDate[dateKey] || [];

              return (
                <div
                  key={`lernplan-${dayIndex}`}
                  className="border-r border-blue-100 last:border-r-0 p-1 bg-blue-50 flex gap-1 flex-wrap"
                >
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
              );
            })}
          </div>
        )}
        </div>
        {/* Ende des STICKY Headers */}

        {/* KA-001: Zeit-Grid Body - scrollt unter dem sticky Header */}
        <div className="grid" style={{ gridTemplateColumns, height: `${24 * hourHeight}px` }}>
          {/* KA-001: Zeit-Labels Spalte (30px, Format: nur Stunde) */}
          <div className="bg-neutral-50/30 border-r border-neutral-200">
            {timeBlocks.map((hour) => (
              <div
                key={hour}
                className="text-right pr-1 text-xs font-light text-neutral-400 border-b border-neutral-100"
                style={{ height: `${hourHeight}px`, paddingTop: '4px' }}
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Day Columns - KA-001: Grid-Zellen (kein flex-1 mehr nötig) */}
          {weekDates.map((date, dayIndex) => {
            const dateKey = formatDateKey(date);
            const isTodayColumn = dayIndex === getTodayColumnIndex;
            const selectionOverlay = getSelectionOverlay(dayIndex);

            // Get ALL sessions for this day (not just per hour)
            const daySessions = regularBlocks.filter(block => {
              const blockDate = block.startDate || block.date;
              return blockDate === dateKey && block.startTime;
            });

            return (
              <div
                key={`day-${dayIndex}`}
                className={`relative border-r border-neutral-200 last:border-r-0 ${
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
                  // PW-014 Fix: Use yToTime for 15-min precision (same as drag)
                  const hour = yToTime(y);
                  const timeStr = formatTimeFromHour(hour);
                  if (onTimeBlockClick) {
                    onTimeBlockClick(date, timeStr);
                  }
                }}
              >
                {/* Hour grid lines */}
                {timeBlocks.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-b border-neutral-300 pointer-events-none"
                    style={{ top: `${hour * hourHeight}px`, height: `${hourHeight}px` }}
                  />
                ))}

                {/* KA-001: Current time indicator ENTFERNT (vom User gewünscht) */}

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

                {/* KA-001: Session-Karten mit dynamischer Farblogik */}
                {daySessions.map((session) => {
                  // KA-001: Neue Farblogik - grau default, Rechtsgebiet-Farbe wenn angegeben
                  const sessionColors = getSessionColorClasses(session);
                  const isDragOver = dragOverBlockId === session.id;

                  // Calculate session position and height
                  const [startH, startM] = session.startTime.split(':').map(Number);
                  const sessionTopPx = (startH + startM / 60) * hourHeight;

                  let durationHours = 1;
                  if (session.endTime) {
                    const [endH, endM] = session.endTime.split(':').map(Number);
                    durationHours = (endH + endM / 60) - (startH + startM / 60);
                  } else if (session.duration) {
                    durationHours = session.duration;
                  }
                  const sessionHeight = Math.max(44, durationHours * hourHeight - 8);

                  // T9: Drag & Drop handlers
                  const handleSessionDragOver = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'copy';
                    setDragOverBlockId(session.id);
                  };

                  const handleSessionDragLeave = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverBlockId(null);
                  };

                  const handleSessionDrop = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverBlockId(null);

                    try {
                      const data = JSON.parse(e.dataTransfer.getData('application/json'));
                      if (onDropTaskToBlock) {
                        if (data.type === 'task') {
                          onDropTaskToBlock(session, data.task, data.source, 'task');
                        } else if (data.type === 'thema') {
                          onDropTaskToBlock(session, data.thema, data.source, 'thema');
                        }
                      }
                    } catch (err) {
                      console.error('Drop error:', err);
                    }
                  };

                  // Blocked state rendering
                  if (session.isBlocked) {
                    return (
                      <div
                        key={session.id}
                        className="absolute left-1 right-1 rounded-[5px] border-2 border-neutral-300 p-2 flex flex-col items-center justify-center cursor-pointer z-10 bg-neutral-100 group"
                        style={{
                          top: `${sessionTopPx + 4}px`,
                          height: `${sessionHeight}px`,
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(163, 163, 163, 0.1) 10px, rgba(163, 163, 163, 0.1) 20px)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onBlockClick) onBlockClick(session, date);
                        }}
                      >
                        <div className="flex items-center gap-1.5 relative">
                          <Lock className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="text-sm font-light text-neutral-400">Blockiert</span>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-neutral-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                            Lernzeitraum blockiert
                          </span>
                        </div>
                        {session.title && (
                          <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-full">{session.title}</p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={session.id}
                      className={`absolute left-1 right-1 rounded-[5px] border p-2.5 text-left overflow-hidden cursor-pointer transition-all z-10 select-none ${
                        isDragOver
                          ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300 shadow-md'
                          : sessionColors.container
                      }`}
                      style={{
                        top: `${sessionTopPx + 4}px`,
                        height: `${sessionHeight}px`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onBlockClick) onBlockClick(session, date);
                      }}
                      onDragOver={handleSessionDragOver}
                      onDragEnter={handleSessionDragOver}
                      onDragLeave={handleSessionDragLeave}
                      onDrop={handleSessionDrop}
                    >
                      {/* Drop indicator overlay */}
                      {isDragOver && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-100/90 rounded-[5px] z-10 pointer-events-none">
                          <span className="text-xs font-medium text-blue-600">Hier ablegen</span>
                        </div>
                      )}

                      {/* KA-001: Session-Inhalt - Zeit beibehalten, Aufgaben entfernt */}
                      <div className="flex flex-col gap-1">
                        {/* Zeit-Anzeige: BEIBEHALTEN (ohne Sekunden) */}
                        {session.startTime && session.endTime && (
                          <span className="text-xs text-neutral-500">
                            {session.startTime.slice(0, 5)} - {session.endTime.slice(0, 5)}
                          </span>
                        )}

                        {/* Titel */}
                        <p className={`text-sm font-light truncate ${sessionColors.text}`}>
                          {session.title}
                        </p>

                        {/* KA-001: Aufgaben ENTFERNT - nur im Dialog sichtbar */}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        {/* Ende des Zeit-Grid Body */}

      </div>
      {/* Ende des Scroll-Containers */}
    </div>
  );
});

export default WeekGrid;
