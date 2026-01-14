import { memo, useCallback } from 'react';
import { PlusIcon } from '../../../components/ui';
import { getRechtsgebietColor } from '../../../utils/rechtsgebiet-colors';

/**
 * LearningSession component (formerly LearningBlock)
 * Displays a learning session with unterrechtsgebiet and optional title
 *
 * Memoized for performance - prevents unnecessary re-renders in calendar grids
 * where this component is rendered many times per view.
 *
 * @param {string} title - Optional custom title
 * @param {string} blockType - Type of session (theme, repetition, exam, free)
 * @param {object} unterrechtsgebiet - Unterrechtsgebiet object with name
 * @param {string} rechtsgebiet - W5: Rechtsgebiet ID for coloring
 * @param {boolean} isAddButton - Whether this is an add button session
 * @param {boolean} isOutOfRange - Whether the date is outside learning period
 * @param {Function} onAddClick - Callback when the add button is clicked
 */
const LearningSession = memo(function LearningSession({
  title = '',
  blockType = '',
  unterrechtsgebiet = null,
  rechtsgebiet = null, // W5: Rechtsgebiet for coloring
  isAddButton = false,
  isOutOfRange = false,
  onAddClick,
  onClick, // Bug 2b fix: Allow block click handling
  className = ''
}) {
  // Bug 2b fix: Handle block click with stopPropagation to prevent day click
  // Note: useCallback must be called before any early returns (React Hooks rules)
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  }, [onClick]);

  // Render add button variant
  if (isAddButton) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onAddClick) {
            onAddClick();
          }
        }}
        className={`flex items-center justify-center h-5 bg-neutral-50 border border-neutral-200 rounded px-4.5 py-1 hover:bg-neutral-100 transition-colors ${className}`}
      >
        <PlusIcon size={16} className="text-neutral-600" />
      </button>
    );
  }

  // Render out of range message
  if (isOutOfRange) {
    return (
      <div className={`bg-primary-100 border border-primary-200 rounded px-4.5 py-5 pointer-events-none ${className}`}>
        <p className="text-xs text-neutral-600">nicht im Lernzeitraum</p>
      </div>
    );
  }

  // Determine background color based on block type (English keys)
  // W5: If rechtsgebiet is provided, use its color for theme/lernblock/repetition
  const getBackgroundColor = () => {
    // W5: Use rechtsgebiet color if available for learning-related blocks
    if (rechtsgebiet && (blockType === 'lernblock' || blockType === 'theme' || blockType === 'repetition' || !blockType)) {
      const colors = getRechtsgebietColor(rechtsgebiet);
      return `${colors.bg} ${colors.border}`;
    }

    // Consistent with week-grid.jsx colors
    switch (blockType.toLowerCase()) {
      case 'exam':
        return 'bg-amber-50 border-amber-200'; // Amber for urgency
      case 'free':
        return 'bg-neutral-50 border-neutral-200'; // Gray for free time
      case 'private':
        return 'bg-violet-50 border-violet-200'; // Violet for private (distinct)
      case 'repetition':
        return 'bg-purple-50 border-purple-200'; // Purple for repetition
      case 'buffer':
        return 'bg-orange-50 border-orange-200'; // Orange for buffer/catch-up days
      case 'vacation':
        return 'bg-green-50 border-green-200'; // Green for vacation days
      case 'theme':
      case 'lernblock':
      default:
        return 'bg-primary-50 border-primary-100'; // Primary for learning
    }
  };

  // Get display name based on block type
  const getDisplayName = () => {
    if (blockType === 'lernblock' && unterrechtsgebiet?.name) {
      return unterrechtsgebiet.name;
    }
    // Special display names for buffer and vacation
    if (blockType === 'buffer') {
      return title || 'Puffertag';
    }
    if (blockType === 'vacation') {
      return title || 'Urlaubstag';
    }
    // For other block types, use title or fallback
    return title || blockType;
  };

  return (
    <div
      className={`${getBackgroundColor()} border rounded px-4.5 py-2.5 space-y-1 ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${className}`}
      onClick={onClick ? handleClick : undefined}
    >
      {/* Main display: Unterrechtsgebiet for theme, title for others */}
      <div className="bg-neutral-50 rounded px-2 py-0.5">
        <p className="text-xs font-light text-neutral-900">{getDisplayName()}</p>
      </div>

      {/* Optional title (only for theme blocks with unterrechtsgebiet AND custom title) */}
      {blockType === 'lernblock' && unterrechtsgebiet?.name && title && title !== unterrechtsgebiet.name && (
        <div className="bg-neutral-50 rounded px-2 py-0.5">
          <p className="text-xs font-light text-neutral-500">{title}</p>
        </div>
      )}
    </div>
  );
});

// Legacy alias for backwards compatibility
export const LearningBlock = LearningSession;

export default LearningSession;
