import React from 'react';

/**
 * DashboardLayout component
 * 2-column grid layout for dashboard content
 * Responsive: 1 column on mobile, 2 columns on tablet and desktop
 *
 * @param {ReactNode} leftColumn - Content for left column
 * @param {ReactNode} rightColumn - Content for right column
 */
const DashboardLayout = ({ leftColumn, rightColumn, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5 md:gap-6 ${className}`}>
      {/* Left Column */}
      <div className="flex flex-col">
        {leftColumn}
      </div>

      {/* Right Column */}
      <div className="flex flex-col">
        {rightColumn}
      </div>
    </div>
  );
};

export default DashboardLayout;
