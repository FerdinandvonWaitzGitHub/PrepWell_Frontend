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
        className={`flex items-center justify-center h-5 bg-gray-50 border border-gray-200 rounded px-4.5 py-1 hover:bg-gray-100 transition-colors ${className}`}
      >
        <PlusIcon size={16} className="text-gray-600" />
      </button>
    );
  }

  // Render out of range message
  if (isOutOfRange) {
    return (
      <div className={`bg-primary-100 border border-primary-200 rounded px-4.5 py-5 pointer-events-none ${className}`}>
        <p className="text-xs text-gray-600">nicht im Lernzeitraum</p>
      </div>
    );
  }

  // Determine background color based on block type
  const getBackgroundColor = () => {
    switch (blockType.toLowerCase()) {
      case 'klausur':
        return 'bg-blue-50 border-blue-100';
      case 'frei':
        return 'bg-gray-50 border-gray-200';
      case 'wiederholung':
        return 'bg-primary-50 border-primary-100';
      default:
        return 'bg-primary-50 border-primary-100';
    }
  };

  // Get display name based on block type
  const getDisplayName = () => {
    if (blockType === 'theme' && unterrechtsgebiet?.name) {
      return unterrechtsgebiet.name;
    }
    // For other block types, use title or fallback
    return title || blockType;
  };

  return (
    <div className={`${getBackgroundColor()} border rounded px-4.5 py-2.5 space-y-1 pointer-events-none ${className}`}>
      {/* Main display: Unterrechtsgebiet for theme, title for others */}
      <div className="bg-gray-50 rounded px-2 py-0.5">
        <p className="text-xs font-light text-gray-900">{getDisplayName()}</p>
      </div>

      {/* Optional title (only for theme blocks with unterrechtsgebiet AND custom title) */}
      {blockType === 'theme' && unterrechtsgebiet?.name && title && title !== unterrechtsgebiet.name && (
        <div className="bg-gray-50 rounded px-2 py-0.5">
          <p className="text-xs font-light text-gray-500">{title}</p>
        </div>
      )}
    </div>
  );
};

export default LearningBlock;
