import React from 'react';

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
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    default: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50',
    primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
    secondary: 'bg-primary-300 text-neutral-900 hover:bg-primary-400',
    ghost: 'text-neutral-900 hover:bg-neutral-100',
    icon: 'text-neutral-900 hover:bg-neutral-100 p-2',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm h-8',
    default: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
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
