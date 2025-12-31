/**
 * SubHeader component
 * Secondary header with page title and actions (timer/tracking)
 */
const SubHeader = ({ title = 'Dashboard', actions, className = '' }) => {
  return (
    <div className={`flex items-center justify-between bg-white px-4 py-2 border-b border-neutral-200 ${className}`}>
      {/* Title */}
      <div className="flex items-center">
        <h1 className="text-lg font-light text-neutral-900">{title}</h1>
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
