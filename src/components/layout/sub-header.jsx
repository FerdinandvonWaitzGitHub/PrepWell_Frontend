/**
 * SubHeader component
 * Secondary header with page title and actions (timer/tracking)
 *
 * Figma: H1 titles use font-extralight 24px
 */
const SubHeader = ({ title = 'Dashboard', actions, className = '' }) => {
  return (
    <div className={`flex items-center justify-between bg-white px-6.25 py-3 border-b border-neutral-200 ${className}`}>
      {/* Title - Figma: 24px extralight */}
      <div className="flex items-center">
        <h1 className="text-2xl font-extralight text-neutral-900">{title}</h1>
      </div>

      {/* Actions (Timer, Zeiterfassung, etc.) */}
      {actions && (
        <div className="flex items-center gap-4">
          {actions}
        </div>
      )}
    </div>
  );
};

export default SubHeader;
