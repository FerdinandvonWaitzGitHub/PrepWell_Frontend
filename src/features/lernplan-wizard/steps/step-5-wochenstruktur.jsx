import React from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 5: Wochenstruktur
 * User configures block types for each day of the week
 * Based on Figma: Schritt_5_body
 */

// Block types that can be cycled through (English keys for code consistency)
const BLOCK_TYPES = ['lernblock', 'exam', 'repetition', 'free', 'private'];

// Display names for block types (full and short versions - German UI labels)
const BLOCK_TYPE_LABELS = {
  lernblock: { full: 'Lernblock', short: 'Lernen' },
  exam: { full: 'Klausur', short: 'Klausur' },
  repetition: { full: 'Wiederholung', short: 'Wdh.' },
  free: { full: 'Frei', short: 'Frei' },
  private: { full: 'Privat', short: 'Privat' },
  // Fallback for any unknown types
  buffer: { full: 'Puffer', short: 'Puffer' },
  vacation: { full: 'Urlaub', short: 'Urlaub' },
};

// Days of the week (full and short versions)
const DAYS = [
  { key: 'montag', label: 'Montag', short: 'Mo' },
  { key: 'dienstag', label: 'Dienstag', short: 'Di' },
  { key: 'mittwoch', label: 'Mittwoch', short: 'Mi' },
  { key: 'donnerstag', label: 'Donnerstag', short: 'Do' },
  { key: 'freitag', label: 'Freitag', short: 'Fr' },
  { key: 'samstag', label: 'Samstag', short: 'Sa' },
  { key: 'sonntag', label: 'Sonntag', short: 'So' },
];

/**
 * Calculate day type based on blocks
 * - 'lerntag' if all blocks are 'lernblock'
 * - 'free' if all blocks are 'free'
 * - 'gemischt' otherwise
 */
const getDayType = (blocks) => {
  if (!blocks || blocks.length === 0) return 'gemischt';

  const allLernblock = blocks.every(b => b === 'lernblock');
  const allFree = blocks.every(b => b === 'free');

  if (allLernblock) return 'lerntag';
  if (allFree) return 'free';
  return 'gemischt';
};

/**
 * Day type badge component
 */
const DayTypeBadge = ({ type }) => {
  const labels = {
    lerntag: { full: 'Lerntag', short: 'Lern' },
    free: { full: 'Frei', short: 'Frei' },
    gemischt: { full: 'Gemischt', short: 'Mix' },
  };

  return (
    <span className="px-1.5 sm:px-2 py-0.5 bg-neutral-100 rounded-lg text-[10px] sm:text-xs font-semibold text-neutral-600">
      <span className="sm:hidden">{labels[type].short}</span>
      <span className="hidden sm:inline">{labels[type].full}</span>
    </span>
  );
};

/**
 * Chevron Left Icon
 */
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

/**
 * Chevron Right Icon
 */
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/**
 * Info Icon
 */
const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/**
 * Warning Icon
 */
const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/**
 * Block selector component with left/right arrows
 */
const BlockSelector = ({ blockType, onPrev, onNext }) => {
  const isLernblock = blockType === 'lernblock';
  // Fallback for unknown block types
  const labels = BLOCK_TYPE_LABELS[blockType] || { full: blockType, short: blockType };

  return (
    <div
      className={`p-1 sm:p-2 md:p-3 rounded-lg flex items-center justify-between gap-0.5 sm:gap-1 ${
        isLernblock
          ? 'bg-blue-50/50'
          : 'bg-white border border-neutral-200'
      }`}
    >
      <button
        type="button"
        onClick={onPrev}
        className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors"
        aria-label="Vorheriger Block-Typ"
      >
        <ChevronLeft />
      </button>
      <span className="flex-1 text-center text-[10px] sm:text-xs md:text-sm font-medium text-neutral-900 truncate min-w-0">
        <span className="md:hidden">{labels.short}</span>
        <span className="hidden md:inline">{labels.full}</span>
      </span>
      <button
        type="button"
        onClick={onNext}
        className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors"
        aria-label="Nächster Block-Typ"
      >
        <ChevronRight />
      </button>
    </div>
  );
};

/**
 * Day column component
 */
const DayColumn = ({ day, blocks, onBlockChange }) => {
  const dayType = getDayType(blocks);

  const cycleBlockType = (blockIndex, direction) => {
    const currentType = blocks[blockIndex];
    const currentIndex = BLOCK_TYPES.indexOf(currentType);
    let newIndex;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % BLOCK_TYPES.length;
    } else {
      newIndex = (currentIndex - 1 + BLOCK_TYPES.length) % BLOCK_TYPES.length;
    }

    const newBlocks = [...blocks];
    newBlocks[blockIndex] = BLOCK_TYPES[newIndex];
    onBlockChange(day.key, newBlocks);
  };

  return (
    <div className="flex flex-col gap-1 sm:gap-2">
      {/* Day header */}
      <div className="pb-1 sm:pb-2 flex flex-col items-start gap-0.5 sm:gap-1">
        <span className="text-xs sm:text-sm md:text-base font-light text-neutral-900">
          <span className="md:hidden">{day.short}</span>
          <span className="hidden md:inline">{day.label}</span>
        </span>
        <DayTypeBadge type={dayType} />
      </div>

      {/* Block selectors */}
      {blocks.map((blockType, index) => (
        <BlockSelector
          key={index}
          blockType={blockType}
          onPrev={() => cycleBlockType(index, 'prev')}
          onNext={() => cycleBlockType(index, 'next')}
        />
      ))}
    </div>
  );
};

/**
 * Step 5: Wochenstruktur Component
 */
const Step5Wochenstruktur = () => {
  const { weekStructure, blocksPerDay, updateWizardData } = useWizard();

  // Ensure weekStructure has correct number of blocks per day
  const normalizedWeekStructure = React.useMemo(() => {
    const result = {};
    for (const day of DAYS) {
      const currentBlocks = weekStructure[day.key] || [];
      // Adjust to blocksPerDay count
      if (currentBlocks.length === blocksPerDay) {
        result[day.key] = currentBlocks;
      } else if (currentBlocks.length < blocksPerDay) {
        // Add more blocks (default to first block type or 'lernblock')
        const defaultType = currentBlocks[0] || 'lernblock';
        result[day.key] = [
          ...currentBlocks,
          ...Array(blocksPerDay - currentBlocks.length).fill(defaultType),
        ];
      } else {
        // Trim extra blocks
        result[day.key] = currentBlocks.slice(0, blocksPerDay);
      }
    }
    return result;
  }, [weekStructure, blocksPerDay]);

  // Update weekStructure if normalized version differs
  React.useEffect(() => {
    const needsUpdate = DAYS.some(day => {
      const current = weekStructure[day.key];
      const normalized = normalizedWeekStructure[day.key];
      return !current || current.length !== normalized.length ||
        current.some((b, i) => b !== normalized[i]);
    });

    if (needsUpdate) {
      updateWizardData({ weekStructure: normalizedWeekStructure });
    }
  }, [normalizedWeekStructure, weekStructure, updateWizardData]);

  const handleBlockChange = (dayKey, newBlocks) => {
    updateWizardData({
      weekStructure: {
        ...weekStructure,
        [dayKey]: newBlocks,
      },
    });
  };

  // Check if any day has incomplete configuration (all blocks should be set)
  const hasIncompleteDay = DAYS.some(day => {
    const blocks = normalizedWeekStructure[day.key];
    return !blocks || blocks.length !== blocksPerDay;
  });

  return (
    <div>
      <StepHeader
        step={5}
        title="Strukturiere deine Woche."
        description="Definiere für jeden Wochentag, wie du deine Lernblöcke nutzen möchtest. Du kannst dies später jederzeit anpassen."
      />

      <div className="space-y-7">
        {/* Week grid - full width with 7 equal columns */}
        <div className="p-2 sm:p-4 md:p-5 bg-white rounded-[10px] border border-neutral-100 w-full">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-4">
            {DAYS.map((day) => (
              <DayColumn
                key={day.key}
                day={day}
                blocks={normalizedWeekStructure[day.key]}
                onBlockChange={handleBlockChange}
              />
            ))}
          </div>
        </div>

        {/* Info box: Feste und flexible Blöcke */}
        <div className="max-w-[550px] mx-auto px-4 py-3 rounded-[10px] flex items-start gap-3">
          <div className="pt-0.5 text-neutral-900">
            <InfoIcon />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-neutral-900 leading-5">
              Feste und flexible Blöcke
            </h4>
            <p className="text-sm font-normal text-neutral-500 leading-5 mt-1">
              Mit dem intelligenten Lernplan-Manager kannst du einzelne Termine oder ganze Lerntage verschieben. Sobald ein Tag einen festen Termin enthält, wird dieser fixiert und bleibt von Verschiebungen in der Umgebung unbeeinflusst. Feste Blöcke sind "Klausur" und "Frei".
            </p>
          </div>
        </div>

        {/* Warning box (shown if incomplete) */}
        {hasIncompleteDay && (
          <div className="max-w-[550px] mx-auto px-4 py-3 bg-red-50 rounded-[10px] flex items-start gap-3">
            <div className="pt-0.5 text-red-500">
              <WarningIcon />
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-500 leading-5">
                Achtung
              </h4>
              <p className="text-sm font-normal text-red-500 leading-5">
                Bitte wähle für jeden Tag einen Typ aus.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step5Wochenstruktur;
