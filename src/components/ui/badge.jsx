/**
 * Badge component for displaying tags, categories, and status indicators
 * Used throughout the calendar for learning blocks, topics, and counts
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'default',
  className = ''
}) => {
  const baseStyles = 'inline-flex items-center gap-1 rounded font-medium transition-colors';

  const variants = {
    default: 'bg-neutral-100 text-neutral-900',
    primary: 'bg-primary-200 text-neutral-900',
    outline: 'border border-neutral-200 bg-white text-neutral-900',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    default: 'px-2 py-1 text-xs',
  };

  return (
    <span
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
