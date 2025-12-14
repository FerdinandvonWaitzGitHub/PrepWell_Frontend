import React from 'react';

/**
 * StepHeader - Consistent header for each wizard step
 * Based on Figma: Schritt_X_header pattern
 */
const StepHeader = ({ step, title, description }) => {
  return (
    <div className="mb-8">
      {/* Step number */}
      <p className="text-sm font-semibold text-primary-600 mb-2">
        Schritt {step}
      </p>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
        {title}
      </h1>

      {/* Description */}
      {description && (
        <p className="text-base text-gray-500 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
};

export default StepHeader;
