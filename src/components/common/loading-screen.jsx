import React from 'react';

/**
 * LoadingScreen - Full-page loading indicator
 *
 * Figma: Loading Screen (Node referenced in gap analysis)
 * Used during app initialization, data loading, and page transitions
 */
const LoadingScreen = ({
  message = 'Wird geladen...',
  fullScreen = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white z-50 flex flex-col items-center justify-center'
    : 'flex flex-col items-center justify-center py-12';

  return (
    <div className={containerClasses}>
      {/* Spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div
          className={`${sizeClasses[size]} rounded-full border-neutral-200`}
        />
        {/* Spinning arc */}
        <div
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-transparent border-t-primary-400 animate-spin`}
        />
      </div>

      {/* Message */}
      {message && (
        <p className="mt-4 text-sm text-neutral-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

/**
 * LoadingSpinner - Inline loading indicator
 * For use within components (buttons, cards, etc.)
 */
export const LoadingSpinner = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border-current opacity-25`}
      />
      <div
        className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-transparent border-t-current animate-spin`}
      />
    </div>
  );
};

/**
 * LoadingOverlay - Semi-transparent overlay with loading indicator
 * For use over existing content
 */
export const LoadingOverlay = ({ message = 'Wird geladen...' }) => {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center rounded-md">
      <div className="relative">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-200" />
        <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-transparent border-t-primary-400 animate-spin" />
      </div>
      {message && (
        <p className="mt-3 text-xs text-neutral-400">{message}</p>
      )}
    </div>
  );
};

/**
 * SkeletonLoader - Placeholder content while loading
 */
export const SkeletonLoader = ({
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded-md',
  className = ''
}) => {
  return (
    <div
      className={`${width} ${height} ${rounded} bg-neutral-200 animate-pulse ${className}`}
    />
  );
};

/**
 * CardSkeleton - Skeleton for card-like content
 */
export const CardSkeleton = ({ lines = 3 }) => {
  return (
    <div className="bg-white rounded-md border border-neutral-200 p-4 space-y-3">
      <SkeletonLoader width="w-1/3" height="h-5" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          width={i === lines - 1 ? 'w-2/3' : 'w-full'}
          height="h-3"
        />
      ))}
    </div>
  );
};

export default LoadingScreen;
