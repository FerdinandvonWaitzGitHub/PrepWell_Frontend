/**
 * SubjectColorPicker - Farbauswahl-Grid für Rechtsgebiete/Fächer
 *
 * T-SET-1: Custom Rechtsgebiet-Farben & Fächer
 */

import { AVAILABLE_COLORS } from '../../utils/rechtsgebiet-colors';

/**
 * Color Picker Grid Komponente
 * Zeigt 12 Farben in einem 4x3 Grid
 *
 * @param {string} value - Aktuell ausgewählte Farbe
 * @param {function} onChange - Callback wenn Farbe gewählt wird
 * @param {string} className - Zusätzliche CSS-Klassen
 */
const SubjectColorPicker = ({ value, onChange, className = '' }) => {
  return (
    <div className={`grid grid-cols-6 gap-2 ${className}`}>
      {AVAILABLE_COLORS.map((color) => {
        const isSelected = value === color.name;

        return (
          <button
            key={color.name}
            type="button"
            onClick={() => onChange(color.name)}
            className={`
              w-7 h-7 rounded-full transition-all
              bg-${color.name}-500
              hover:scale-110 hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color.name}-500
              ${isSelected ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110' : ''}
            `}
            title={color.label}
            aria-label={`Farbe ${color.label} auswählen`}
            aria-pressed={isSelected}
          />
        );
      })}
    </div>
  );
};

/**
 * Kompakte Farbvorschau mit Dropdown
 * Zeigt aktuellen Farbkreis, bei Klick öffnet sich Picker
 *
 * @param {string} value - Aktuell ausgewählte Farbe
 * @param {function} onChange - Callback wenn Farbe gewählt wird
 * @param {boolean} disabled - Deaktiviert
 */
export const SubjectColorButton = ({ value, onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-8 h-8 rounded-full transition-all
          bg-${value || 'neutral'}-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:shadow-md cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400
        `}
        title="Farbe ändern"
        aria-label="Farbe ändern"
        aria-expanded={isOpen}
      />

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 p-3 bg-white rounded-lg shadow-lg border border-neutral-200 z-50">
            <SubjectColorPicker
              value={value}
              onChange={(color) => {
                onChange(color);
                setIsOpen(false);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

import { useState } from 'react';

export default SubjectColorPicker;
