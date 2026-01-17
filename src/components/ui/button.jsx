/**
 * Button component with multiple variants and sizes
 * Used for navigation, actions, and calendar controls
 */
const Button = ({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    default: 'bg-white text-neutral-950 border border-neutral-200 shadow-xs hover:bg-neutral-50',
    primary: 'bg-neutral-900 text-neutral-50 shadow-xs hover:bg-neutral-800',
    outline: 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50',
    ghost: 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100',
    icon: 'text-neutral-700 border border-neutral-200 hover:bg-neutral-100',
  };

  const sizes = {
    sm: 'px-2 py-2 text-xs h-8',
    default: 'px-4 py-2 text-sm h-10',
    lg: 'px-5 py-2.5 text-sm h-11',
    icon: 'h-8 w-8 p-2',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
