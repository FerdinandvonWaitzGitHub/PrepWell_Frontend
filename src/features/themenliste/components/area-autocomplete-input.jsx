import { useState, useMemo, useRef, useEffect } from 'react';
import {
  RECHTSGEBIET_COLORS,
  getAllUnterrechtsgebieteFlat
} from '../../../data/unterrechtsgebiete-data';
import { getAllSubjects, getColorClasses } from '../../../utils/rechtsgebiet-colors';
import { Pencil } from 'lucide-react';

/**
 * AreaAutocompleteInput - Inline autocomplete for selecting URGs/Fächer
 *
 * Features:
 * - Displays selected areas as comma-separated text
 * - Typing triggers search in URG names + categories (Jura) or custom subjects (non-Jura)
 * - Dropdown shows max 8 suggestions
 * - Backspace removes last selected area
 * - Click pencil or text to enter edit mode
 *
 * T27: Updated to support both Jura (URGs) and non-Jura (custom subjects)
 */
const AreaAutocompleteInput = ({
  selectedAreas = [],
  onAreasChange,
  isEditing: externalIsEditing,
  onEditingChange,
  placeholder = 'Fach eingeben...',
  isJura = true, // T27: Determines data source - Jura uses URGs, others use custom subjects
}) => {
  // Use external or internal editing state
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;
  const setIsEditing = onEditingChange || setInternalIsEditing;

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // T32 FIX: Refresh counter to re-compute allAreas when settings change
  const [settingsVersion, setSettingsVersion] = useState(0);

  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // T32 FIX: Listen to storage events to refresh subjects when settings change
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Refresh when subject_settings change (key used by rechtsgebiet-colors.js)
      if (!e.key || e.key === 'prepwell_subject_settings') {
        setSettingsVersion(v => v + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // T27: Get areas based on isJura - URGs for Jura, custom subjects for others
  // T32 FIX: Include settingsVersion to re-compute when settings change
  const allAreas = useMemo(() => {
    if (isJura) {
      // Jura: Use detailed URGs
      return getAllUnterrechtsgebieteFlat();
    } else {
      // Non-Jura: Use custom subjects from settings
      const subjects = getAllSubjects(false);
      return subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        kategorie: 'Benutzerdefiniert',
        rechtsgebiet: subject.id, // Use subject id as "rechtsgebiet" for color lookup
        color: getColorClasses(subject.color).solid, // Convert color name to Tailwind class
      }));
    }
  }, [isJura, settingsVersion]);

  // Filter areas based on search query
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return [];

    // T32 FIX: Trim query to handle spaces after comma (e.g. "Mikro, Mak" -> " Mak" -> "mak")
    const query = searchQuery.trim().toLowerCase();
    const selectedIds = new Set(selectedAreas.map(a => a.id));

    return allAreas
      .filter(area =>
        !selectedIds.has(area.id) &&
        (area.name.toLowerCase().includes(query) ||
          (area.kategorie && area.kategorie.toLowerCase().includes(query)))
      )
      .slice(0, 8); // Max 8 suggestions
  }, [searchQuery, allAreas, selectedAreas]);

  // Display name for non-editing mode
  const displayName = useMemo(() => {
    if (selectedAreas.length === 0) return '';
    return selectedAreas.map(a => a.name).join(', ');
  }, [selectedAreas]);

  // Handle entering edit mode
  const handleStartEdit = () => {
    setIsEditing(true);
    setSearchQuery('');
    setShowDropdown(false);
    // Focus input on next tick
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Handle selecting an area from dropdown
  const handleSelectArea = (area) => {
    const newArea = {
      id: area.id,
      name: area.name,
      rechtsgebietId: area.rechtsgebiet,
      color: area.color || RECHTSGEBIET_COLORS[area.rechtsgebiet] || 'bg-neutral-400'
    };
    const newAreas = [...selectedAreas, newArea];
    onAreasChange(newAreas);
    setSearchQuery('');
    setShowDropdown(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  // Handle removing last area (backspace)
  const handleRemoveLastArea = () => {
    if (selectedAreas.length > 0) {
      onAreasChange(selectedAreas.slice(0, -1));
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      if (searchQuery === '' && selectedAreas.length > 0) {
        setIsEditing(false);
      }
      return;
    }

    if (e.key === 'Backspace' && searchQuery === '') {
      e.preventDefault();
      handleRemoveLastArea();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredAreas.length > 0 && showDropdown) {
        // T32 Bug 2 FIX: Ensure highlightedIndex is within bounds
        const safeIndex = Math.min(highlightedIndex, filteredAreas.length - 1);
        handleSelectArea(filteredAreas[safeIndex]);
      } else if (searchQuery === '' && selectedAreas.length > 0) {
        setIsEditing(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < filteredAreas.length - 1 ? prev + 1 : prev
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
      return;
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(value.trim().length > 0);
    setHighlightedIndex(0);
  };

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
        if (selectedAreas.length > 0) {
          setIsEditing(false);
        }
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing, selectedAreas.length, setIsEditing]);

  // Auto-enter edit mode if no areas selected
  useEffect(() => {
    if (selectedAreas.length === 0 && !isEditing) {
      setIsEditing(true);
    }
  }, [selectedAreas.length, isEditing, setIsEditing]);

  // Non-editing display mode
  // T32 Bug 1 FIX: Click anywhere on container/text to enter edit mode
  if (!isEditing && selectedAreas.length > 0) {
    return (
      <div
        className="flex items-center justify-center gap-3 group cursor-pointer"
        onClick={handleStartEdit}
      >
        <h1 className="text-5xl font-extralight text-neutral-900 text-center">
          {displayName}
        </h1>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent double-trigger
            handleStartEdit();
          }}
          className="p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Bearbeiten"
        >
          <Pencil size={20} />
        </button>
      </div>
    );
  }

  // Editing mode
  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto">
      {/* Input container - T27: Centered layout */}
      <div className="flex items-center justify-center">
        {/* Combined display: selected areas + input inline */}
        <div className="flex items-baseline justify-center flex-wrap">
          {/* Selected areas as text */}
          {selectedAreas.length > 0 && (
            <span className="text-5xl font-extralight text-neutral-900 whitespace-nowrap">
              {selectedAreas.map(a => a.name).join(', ')}
              {searchQuery.length > 0 && ', '}
            </span>
          )}

          {/* Input field - T27: Dynamic width, small when empty with areas */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery.trim() && setShowDropdown(true)}
            placeholder={selectedAreas.length === 0 ? placeholder : ''}
            className={`text-5xl font-extralight text-neutral-900 bg-transparent border-none outline-none placeholder:text-neutral-300 ${
              selectedAreas.length === 0 ? 'min-w-[300px] text-center' : 'text-left'
            }`}
            style={{
              width: selectedAreas.length === 0
                ? Math.max(300, searchQuery.length * 35 + 50) + 'px'
                : searchQuery.length > 0
                  ? Math.max(20, searchQuery.length * 35 + 20) + 'px'
                  : '4px' // Minimal width for cursor when empty
            }}
            autoFocus
          />
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && filteredAreas.length > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-96 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {filteredAreas.map((area, index) => (
            <button
              key={area.id}
              onClick={() => handleSelectArea(area)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                index === highlightedIndex
                  ? 'bg-neutral-100'
                  : 'hover:bg-neutral-50'
              }`}
            >
              {/* Color indicator */}
              <span
                className={`w-2 h-8 rounded-full ${area.color}`}
              />
              <div>
                <div className="text-sm font-medium text-neutral-900">
                  {area.name}
                </div>
                {area.kategorie && (
                  <div className="text-xs text-neutral-500">
                    {area.kategorie}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message - T27: Different message for non-Jura */}
      {/* T32 FIX: Show trimmed query in error message */}
      {showDropdown && searchQuery.trim() && filteredAreas.length === 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-96 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 p-4 text-center text-neutral-500 text-sm">
          {isJura ? (
            <>Keine Ergebnisse für &quot;{searchQuery.trim()}&quot;</>
          ) : (
            <>
              Keine Fächer gefunden für &quot;{searchQuery.trim()}&quot;.
              <br />
              <span className="text-xs mt-1 block">
                Erstelle neue Fächer in den Einstellungen → Fächer
              </span>
            </>
          )}
        </div>
      )}

      {/* Help text */}
      {selectedAreas.length > 0 && (
        <p className="text-center text-xs text-neutral-400 mt-2">
          Tippe um weitere hinzuzufügen • Backspace zum Entfernen • Enter zum Abschließen
        </p>
      )}
    </div>
  );
};

export default AreaAutocompleteInput;
