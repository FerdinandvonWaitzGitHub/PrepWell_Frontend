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
    // T13: Reduced offset from 240px to 180px for better height utilization
    // Breakdown: Header(64px) + SubHeader(80px) + Padding(32px) = ~176px
    <div className={`grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5 md:gap-6 md:h-[calc(100vh-180px)] ${className}`}>
      {/* Left Column - T11/T13: Height constraint + min-h-0 for flex overflow */}
      <div className="flex flex-col md:h-full md:overflow-hidden min-h-0">
        {leftColumn}
      </div>

      {/* Right Column - T11/T13: Height constraint + min-h-0 for flex overflow */}
      <div className="flex flex-col md:h-full md:overflow-hidden min-h-0">
        {rightColumn}
      </div>
    </div>
  );
};

export default DashboardLayout;
