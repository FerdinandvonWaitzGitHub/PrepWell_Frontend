import { useState, useMemo } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 21: Kalender-Vorschau
 * Shows a preview of the generated calendar with the distributed blocks.
 * User can regenerate or proceed to confirmation.
 */

/**
 * Flatten all blocks from lernbloeckeDraft into a distributable pool
 * Each block gets expanded by its size (e.g., size 2 = 2 slots)
 */
const flattenBlocksToPool = (lernbloeckeDraft, selectedRechtsgebiete) => {
  const pool = [];

  // Use selectedRechtsgebiete order if available, otherwise use keys from draft
  const rgIds = selectedRechtsgebiete?.length > 0
    ? selectedRechtsgebiete
    : Object.keys(lernbloeckeDraft);

  rgIds.forEach(rgId => {
    const blocks = lernbloeckeDraft[rgId] || [];
    blocks.forEach(block => {
      // Expand block by its size
      const size = block.size || 1;
      for (let i = 0; i < size; i++) {
        pool.push({
          originalBlockId: block.id,
          rechtsgebiet: rgId,
          themen: block.themen || [],
          slotIndex: i,
          totalSlots: size,
        });
      }
    });
  });

  return pool;
};

/**
 * Generate calendar data based on actual lernbloeckeDraft
 * Distributes blocks according to verteilungsmodus
 */
const generateMockCalendar = (
  startDate,
  endDate,
  weekStructure,
  lernbloeckeDraft,
  rechtsgebieteGewichtung,
  verteilungsmodus,
  selectedRechtsgebiete = []
) => {
  if (!startDate || !endDate) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = [];
  const weekdayMap = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];

  // Get RG IDs in order
  const rgIds = selectedRechtsgebiete?.length > 0
    ? selectedRechtsgebiete
    : Object.keys(lernbloeckeDraft || {}).length > 0
      ? Object.keys(lernbloeckeDraft)
      : Object.keys(rechtsgebieteGewichtung || {});

  // Edge case: No RGs available at all
  if (rgIds.length === 0) {
    console.warn('generateMockCalendar: No Rechtsgebiete available');
    return [];
  }

  // If no blocks exist, fall back to simple RG-based distribution
  const hasBlocks = Object.values(lernbloeckeDraft || {}).some(blocks => blocks?.length > 0);

  if (!hasBlocks) {
    // Fallback: Simple distribution based on RGs only
    let currentDate = new Date(start);
    let rgIndex = 0;

    while (currentDate <= end) {
      const weekday = weekdayMap[currentDate.getDay()];
      const dayStructure = weekStructure?.[weekday] || [];
      const lernblockCount = dayStructure.filter(b => b === 'lernblock').length;

      if (lernblockCount > 0) {
        let blocks = [];

        if (verteilungsmodus === 'fokussiert') {
          const rgId = rgIds[rgIndex % rgIds.length];
          blocks = Array(lernblockCount).fill(null).map((_, idx) => ({
            id: `block-${currentDate.toISOString()}-${idx}`,
            rechtsgebiet: rgId,
            size: 1
          }));
          rgIndex++;
        } else if (verteilungsmodus === 'themenweise') {
          const rgId = rgIds[Math.floor(rgIndex / 7) % rgIds.length];
          blocks = Array(lernblockCount).fill(null).map((_, idx) => ({
            id: `block-${currentDate.toISOString()}-${idx}`,
            rechtsgebiet: rgId,
            size: 1
          }));
          rgIndex++;
        } else {
          // gemischt
          blocks = Array(lernblockCount).fill(null).map((_, idx) => ({
            id: `block-${currentDate.toISOString()}-${idx}`,
            rechtsgebiet: rgIds[(rgIndex + idx) % rgIds.length],
            size: 1
          }));
          rgIndex++;
        }

        days.push({ date: new Date(currentDate), blocks });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  // === Real distribution with lernbloeckeDraft ===

  // Flatten blocks into distributable pool
  const blockPool = flattenBlocksToPool(lernbloeckeDraft, selectedRechtsgebiete);
  // Note: countAvailableSlots() could be used for advanced distribution balancing

  // If we have more slots than blocks, we'll cycle through; if more blocks, we truncate
  let poolIndex = 0;
  let currentDate = new Date(start);
  let dayCounter = 0;
  let currentRgIndex = 0;

  // For themenweise: track blocks per RG
  const blocksPerRg = {};
  rgIds.forEach(rgId => {
    blocksPerRg[rgId] = blockPool.filter(b => b.rechtsgebiet === rgId);
  });
  const rgBlockIndices = {};
  rgIds.forEach(rgId => { rgBlockIndices[rgId] = 0; });

  while (currentDate <= end) {
    const weekday = weekdayMap[currentDate.getDay()];
    const dayStructure = weekStructure?.[weekday] || [];
    const lernblockCount = dayStructure.filter(b => b === 'lernblock').length;

    if (lernblockCount > 0) {
      let blocks = [];

      if (verteilungsmodus === 'fokussiert') {
        // One RG per day - cycle through RGs
        const rgId = rgIds[currentRgIndex % rgIds.length];

        for (let i = 0; i < lernblockCount; i++) {
          // Find next block from this RG
          const rgBlocks = blocksPerRg[rgId] || [];
          const blockIdx = rgBlockIndices[rgId] % Math.max(1, rgBlocks.length);
          const poolBlock = rgBlocks[blockIdx];

          if (poolBlock) {
            blocks.push({
              id: `block-${currentDate.toISOString()}-${i}`,
              rechtsgebiet: rgId,
              originalBlockId: poolBlock.originalBlockId,
              themen: poolBlock.themen,
              size: 1
            });
            rgBlockIndices[rgId]++;
          } else {
            // No blocks for this RG, create placeholder
            blocks.push({
              id: `block-${currentDate.toISOString()}-${i}`,
              rechtsgebiet: rgId,
              size: 1
            });
          }
        }

        currentRgIndex++;
      } else if (verteilungsmodus === 'themenweise') {
        // Complete one RG before moving to next
        // Spend ~7 days on each RG, or until its blocks are exhausted
        const daysPerRg = 7;
        const rgPhase = Math.floor(dayCounter / daysPerRg);
        const rgId = rgIds[rgPhase % rgIds.length];

        for (let i = 0; i < lernblockCount; i++) {
          const rgBlocks = blocksPerRg[rgId] || [];
          const blockIdx = rgBlockIndices[rgId] % Math.max(1, rgBlocks.length);
          const poolBlock = rgBlocks[blockIdx];

          if (poolBlock) {
            blocks.push({
              id: `block-${currentDate.toISOString()}-${i}`,
              rechtsgebiet: rgId,
              originalBlockId: poolBlock.originalBlockId,
              themen: poolBlock.themen,
              size: 1
            });
            rgBlockIndices[rgId]++;
          } else {
            blocks.push({
              id: `block-${currentDate.toISOString()}-${i}`,
              rechtsgebiet: rgId,
              size: 1
            });
          }
        }

        dayCounter++;
      } else {
        // gemischt - mix blocks from pool across different RGs each day
        for (let i = 0; i < lernblockCount; i++) {
          if (blockPool.length > 0) {
            const poolBlock = blockPool[poolIndex % blockPool.length];
            blocks.push({
              id: `block-${currentDate.toISOString()}-${i}`,
              rechtsgebiet: poolBlock.rechtsgebiet,
              originalBlockId: poolBlock.originalBlockId,
              themen: poolBlock.themen,
              size: 1
            });
            poolIndex++;
          } else {
            // Fallback if no blocks in pool
            blocks.push({
              id: `block-${currentDate.toISOString()}-${i}`,
              rechtsgebiet: rgIds[i % rgIds.length],
              size: 1
            });
          }
        }
      }

      days.push({ date: new Date(currentDate), blocks });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
};

/**
 * Week View Component
 */
const WeekView = ({ days, weekStart }) => {
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  // Get days for this week
  const weekDates = [];
  const currentWeekStart = new Date(weekStart);

  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    weekDates.push(date);
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Header */}
      {weekDays.map((day) => (
        <div key={day} className="text-center text-xs font-medium text-neutral-500 py-2">
          {day}
        </div>
      ))}

      {/* Days */}
      {weekDates.map((date) => {
        const dayData = days.find(d =>
          d.date.toDateString() === date.toDateString()
        );

        return (
          <div
            key={date.toISOString()}
            className="min-h-[80px] p-2 bg-white rounded-lg border border-neutral-200"
          >
            <div className="text-xs text-neutral-500 mb-1">
              {date.getDate()}
            </div>

            {dayData?.blocks?.map((block) => {
              const colorClass = RECHTSGEBIET_COLORS[block.rechtsgebiet] || 'bg-gray-500';
              return (
                <div
                  key={block.id}
                  className={`${colorClass} text-white text-xs px-1.5 py-0.5 rounded mb-1 truncate`}
                  title={RECHTSGEBIET_LABELS[block.rechtsgebiet]}
                >
                  {RECHTSGEBIET_LABELS[block.rechtsgebiet]?.substring(0, 3) || '?'}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Statistics Component
 */
const Statistics = ({ days, rechtsgebieteGewichtung }) => {
  // Count blocks per RG
  const blockCounts = {};
  let totalBlocks = 0;

  (days || []).forEach(day => {
    (day.blocks || []).forEach(block => {
      if (block.rechtsgebiet) {
        blockCounts[block.rechtsgebiet] = (blockCounts[block.rechtsgebiet] || 0) + 1;
        totalBlocks++;
      }
    });
  });

  const hasGewichtung = rechtsgebieteGewichtung && Object.keys(rechtsgebieteGewichtung).length > 0;
  const hasBlocks = Object.keys(blockCounts).length > 0;

  if (!hasBlocks) {
    return (
      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <h4 className="text-sm font-medium text-neutral-900 mb-2">Verteilung</h4>
        <p className="text-sm text-neutral-500">Keine Blöcke generiert.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <h4 className="text-sm font-medium text-neutral-900 mb-3">Verteilung</h4>
      <div className="space-y-2">
        {Object.entries(blockCounts).map(([rgId, count]) => {
          const percentage = totalBlocks > 0 ? Math.round((count / totalBlocks) * 100) : 0;
          const targetPercentage = hasGewichtung ? (rechtsgebieteGewichtung[rgId] || 0) : null;
          const colorClass = RECHTSGEBIET_COLORS[rgId] || 'bg-gray-500';

          return (
            <div key={rgId} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colorClass}`} />
              <span className="flex-1 text-sm text-neutral-700">
                {RECHTSGEBIET_LABELS[rgId] || rgId}
              </span>
              <span className="text-sm font-medium text-neutral-900">
                {percentage}%
              </span>
              {targetPercentage !== null && (
                <span className="text-xs text-neutral-500">
                  (Ziel: {targetPercentage}%)
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Step 21 Component
 */
const Step21KalenderVorschau = () => {
  const {
    startDate,
    endDate,
    weekStructure,
    lernbloeckeDraft,
    rechtsgebieteGewichtung,
    verteilungsmodus,
    selectedRechtsgebiete,
    generatedCalendar,
    updateWizardData
  } = useWizard();

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Generate or use cached calendar
  const calendarDays = useMemo(() => {
    if (generatedCalendar && generatedCalendar.length > 0) {
      return generatedCalendar;
    }
    return generateMockCalendar(
      startDate,
      endDate,
      weekStructure,
      lernbloeckeDraft,
      rechtsgebieteGewichtung,
      verteilungsmodus,
      selectedRechtsgebiete
    );
  }, [startDate, endDate, weekStructure, lernbloeckeDraft, rechtsgebieteGewichtung, verteilungsmodus, selectedRechtsgebiete, generatedCalendar]);

  // Calculate week start
  const getWeekStart = (offset) => {
    if (!startDate) return new Date();
    const start = new Date(startDate);
    // Adjust to Monday
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff + (offset * 7));
    return start;
  };

  const weekStart = getWeekStart(currentWeekOffset);

  // Calculate total weeks
  const totalWeeks = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (7 * 24 * 60 * 60 * 1000));
  }, [startDate, endDate]);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    // Simulate regeneration
    setTimeout(() => {
      const newCalendar = generateMockCalendar(
        startDate,
        endDate,
        weekStructure,
        lernbloeckeDraft,
        rechtsgebieteGewichtung,
        verteilungsmodus,
        selectedRechtsgebiete
      );
      updateWizardData({ generatedCalendar: newCalendar });
      setIsRegenerating(false);
    }, 500);
  };

  return (
    <div>
      <StepHeader
        step={21}
        title="Vorschau deines Lernplans"
        description="Überprüfe die Verteilung deiner Lernblöcke. Du kannst neu generieren oder einzelne Tage später anpassen."
      />

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 1))}
            disabled={currentWeekOffset === 0}
            className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-neutral-700 min-w-[120px] text-center">
            Woche {currentWeekOffset + 1} von {totalWeeks}
          </span>
          <button
            onClick={() => setCurrentWeekOffset(Math.min(totalWeeks - 1, currentWeekOffset + 1))}
            disabled={currentWeekOffset >= totalWeeks - 1}
            className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Neu generieren
        </button>
      </div>

      {/* Week View */}
      <div className="mb-6">
        {calendarDays.length === 0 ? (
          <div className="p-8 bg-amber-50 rounded-lg border border-amber-200 text-center">
            <p className="text-sm text-amber-700">
              <strong>Keine Lerntage generiert.</strong> Überprüfe deine Wochenstruktur und den Lernzeitraum.
            </p>
          </div>
        ) : (
          <WeekView days={calendarDays} weekStart={weekStart} />
        )}
      </div>

      {/* Statistics */}
      <Statistics
        days={calendarDays}
        rechtsgebieteGewichtung={rechtsgebieteGewichtung}
      />

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Tipp:</strong> Nach Abschluss des Wizards kannst du einzelne Blöcke
          im Kalender per Drag & Drop verschieben oder bearbeiten.
        </p>
      </div>
    </div>
  );
};

export default Step21KalenderVorschau;
