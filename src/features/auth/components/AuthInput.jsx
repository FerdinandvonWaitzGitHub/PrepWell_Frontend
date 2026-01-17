/**
 * AuthInput - Styled Input-Component für Auth-Formulare
 *
 * Figma-Referenz: Design Tokens aus Ticket AU-001
 * - Border: border-gray-200 (#E5E5E5)
 * - Focus: ring-gray-900 (#171717)
 * - Error: border-red-500, ring-red-500
 */
export default function AuthInput({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  rightElement, // Für "Passwort vergessen?" Link
  autoComplete,
  id,
  name,
}) {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="mb-4">
      {/* Label Row */}
      <div className="flex justify-between items-center mb-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-950"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {rightElement}
      </div>

      {/* Input */}
      <input
        id={inputId}
        name={name || inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`
          w-full px-3 py-3 rounded-lg shadow-xs text-sm
          border ${error ? 'border-red-500' : 'border-gray-200'}
          text-gray-950 placeholder:text-gray-500
          focus:outline-none focus:ring-2
          ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-gray-900 focus:border-gray-900'}
          transition-colors
        `}
      />

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
