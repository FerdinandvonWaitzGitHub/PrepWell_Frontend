import { PlusIcon } from '../../../components/ui';

/**
 * LearningBlock component
 * Displays a learning block with unterrechtsgebiet and optional title
 *
 * @param {string} title - Optional custom title
 * @param {string} blockType - Type of block (theme, repetition, exam, free)
 * @param {object} unterrechtsgebiet - Unterrechtsgebiet object with name
 * @param {boolean} isAddButton - Whether this is an add button block
 * @param {boolean} isOutOfRange - Whether the date is outside learning period
 * @param {Function} onAddClick - Callback when the add button is clicked
 */
const LearningBlock = ({
  title = '',
  blockType = '',
  unterrechtsgebiet = null,
  isAddButton = false,
  isOutOfRange = false,
  onAddClick,
  className = ''
}) => {
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
  // Consistent with week-grid.jsx colors
  const getBackgroundColor = () => {
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
    <div className={`${getBackgroundColor()} border rounded px-4.5 py-2.5 space-y-1 pointer-events-none ${className}`}>
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
};

export default LearningBlock;
