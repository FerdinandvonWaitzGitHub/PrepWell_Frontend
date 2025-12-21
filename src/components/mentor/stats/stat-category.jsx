/**
 * StatCategory - Container for a group of related statistics
 *
 * Displays a category header with expandable content area.
 */
const StatCategory = ({
  title,
  icon = null,
  children,
  className = ''
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-xl">{icon}</span>}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default StatCategory;
