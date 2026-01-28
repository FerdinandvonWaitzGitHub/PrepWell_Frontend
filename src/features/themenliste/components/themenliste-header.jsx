import { useState, useRef, useEffect } from 'react';
import AreaAutocompleteInput from './area-autocomplete-input';
import { Pencil } from 'lucide-react';

/**
 * ThemenlisteHeader - Header section with title, URG/Fach selection and description
 *
 * T27: Redesigned to use autocomplete for URG/Fach selection
 * PW-212: Added editable title field above URG autocomplete
 */
const ThemenlisteHeader = ({
  selectedAreas = [],
  planName = '',
  description,
  onAreasChange,
  onNameChange,
  onDescriptionChange,
  hierarchyLabels,
  isJura = true,
}) => {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingAreas, setIsEditingAreas] = useState(selectedAreas.length === 0);
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // PW-212: Correct label for autocomplete based on hierarchy
  // Jura: Autocomplete selects Unterrechtsgebiete (level2)
  // Non-Jura: Autocomplete selects Fächer (level1)
  const areaLabel = isJura
    ? (hierarchyLabels?.level2 || 'Unterrechtsgebiet')
    : (hierarchyLabels?.level1 || 'Fach');

  return (
    // T27: Centered layout matching Figma design
    <div className="px-6 py-6 bg-white">
      <div className="flex flex-col items-center gap-2.5">
        {/* PW-212: Editable title field - subtle when empty, prominent when filled */}
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={planName}
            onChange={(e) => onNameChange?.(e.target.value)}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingName(false);
              if (e.key === 'Escape') setIsEditingName(false);
            }}
            placeholder="Titel eingeben..."
            className="text-sm text-neutral-600 text-center bg-transparent border-b border-primary-400 outline-none px-4 py-1 placeholder:text-neutral-300"
          />
        ) : planName ? (
          <div
            className="flex items-center justify-center gap-2 group cursor-pointer"
            onClick={() => setIsEditingName(true)}
          >
            <span className="text-sm font-medium text-neutral-500 tracking-wide uppercase">
              {planName}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}
              className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Titel bearbeiten"
            >
              <Pencil size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="text-xs text-neutral-300 hover:text-neutral-400 transition-colors tracking-wide uppercase"
          >
            + Titel hinzufügen
          </button>
        )}

        {/* T27: URG/Fach Autocomplete */}
        <AreaAutocompleteInput
          selectedAreas={selectedAreas}
          onAreasChange={onAreasChange}
          isEditing={isEditingAreas}
          onEditingChange={setIsEditingAreas}
          placeholder={planName ? `${areaLabel} zuordnen...` : `${areaLabel} eingeben...`}
          isJura={isJura}
        />

        {/* T27: Description - centered with max-width */}
        {isEditingDescription ? (
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            onBlur={() => setIsEditingDescription(false)}
            placeholder="Beschreibung hinzufügen..."
            className="w-full max-w-3xl text-center text-sm text-neutral-400 bg-transparent border border-neutral-200 rounded-lg p-2 focus:border-neutral-400 focus:outline-none resize-none"
            rows={2}
            autoFocus
          />
        ) : (
          <p
            className="text-sm font-light text-neutral-500 text-center max-w-3xl cursor-pointer hover:text-neutral-600"
            onClick={() => setIsEditingDescription(true)}
          >
            {description || 'Beschreibung des Lernplans'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ThemenlisteHeader;
