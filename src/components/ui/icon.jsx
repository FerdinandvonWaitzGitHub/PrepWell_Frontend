import React from 'react';

/**
 * Base Icon component wrapper
 */
export const Icon = ({ children, size = 16, className = '', ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
};

/**
 * ChevronLeft Icon
 */
export const ChevronLeftIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
);

/**
 * ChevronRight Icon
 */
export const ChevronRightIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <path d="M9 18l6-6-6-6" />
  </Icon>
);

/**
 * ChevronDown Icon
 */
export const ChevronDownIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

/**
 * Calendar Icon
 */
export const CalendarIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Icon>
);

/**
 * Check Icon
 */
export const CheckIcon = ({ size = 12, className = '' }) => (
  <Icon size={size} className={className}>
    <polyline points="20 6 9 17 4 12" />
  </Icon>
);

/**
 * ArrowRight Icon
 */
export const ArrowRightIcon = ({ size = 12, className = '' }) => (
  <Icon size={size} className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Icon>
);

/**
 * Plus Icon
 */
export const PlusIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

/**
 * Minus Icon
 */
export const MinusIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

/**
 * Shuffle Icon
 */
export const ShuffleIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <polyline points="16 3 21 3 21 8" />
    <polyline points="8 21 3 21 3 16" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </Icon>
);

/**
 * Archive Icon
 */
export const ArchiveIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </Icon>
);

/**
 * Trash Icon
 */
export const TrashIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Icon>
);

/**
 * ReplaceAll Icon
 */
export const ReplaceAllIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <polyline points="14 2 18 6 14 10" />
    <polyline points="10 22 6 18 10 14" />
    <path d="M18 6H8a6 6 0 0 0 0 12h12" />
  </Icon>
);

/**
 * CalendarRange Icon
 */
export const CalendarRangeIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="14" x2="16" y2="14" />
  </Icon>
);

/**
 * ArrowRightLeft Icon
 */
export const ArrowRightLeftIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <polyline points="17 11 21 7 17 3" />
    <polyline points="7 21 3 17 7 13" />
    <line x1="21" y1="7" x2="3" y2="7" />
    <line x1="3" y1="17" x2="21" y2="17" />
  </Icon>
);

/**
 * MoveRight Icon
 */
export const MoveRightIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <line x1="18" y1="12" x2="6" y2="12" />
    <polyline points="12 6 18 12 12 18" />
    <line x1="2" y1="5" x2="2" y2="19" />
  </Icon>
);

/**
 * MoveLeft Icon
 */
export const MoveLeftIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <line x1="6" y1="12" x2="18" y2="12" />
    <polyline points="12 18 6 12 12 6" />
    <line x1="22" y1="5" x2="22" y2="19" />
  </Icon>
);

/**
 * BookOpenText Icon
 */
export const BookOpenTextIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    <path d="M6 8h2" />
    <path d="M6 12h2" />
    <path d="M16 8h2" />
    <path d="M16 12h2" />
  </Icon>
);

/**
 * Repeat2 Icon
 */
export const Repeat2Icon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <polyline points="2 9 6 5 10 9" />
    <path d="M6 5v8a6 6 0 0 0 6 6h4" />
    <polyline points="22 15 18 19 14 15" />
    <path d="M18 19v-8a6 6 0 0 0-6-6H8" />
  </Icon>
);

/**
 * FilePenLine Icon
 */
export const FilePenLineIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <path d="m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" />
    <path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
    <path d="M8 18h1" />
  </Icon>
);

/**
 * TreePalm Icon
 */
export const TreePalmIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2c0-1.66 1.57-3 3.5-3S11 6.34 11 8z" />
    <path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3c0-1.66-1.57-3-3.5-3s-3.5 1.34-3.5 3z" />
    <path d="m3 3 3 2.5" />
    <path d="M18 3 15 5.5" />
    <path d="M13 12v8" />
  </Icon>
);

/**
 * TrendingUp Icon
 */
export const TrendingUpIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </Icon>
);

/**
 * TrendingDown Icon
 */
export const TrendingDownIcon = ({ size = 16, className = '' }) => (
  <Icon size={size} className={className}>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </Icon>
);

export default Icon;
