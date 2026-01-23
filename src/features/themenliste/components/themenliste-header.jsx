import { useState } from 'react';
import AreaAutocompleteInput from './area-autocomplete-input';

/**
 * ThemenlisteHeader - Header section with URG/Fach selection and description
 *
 * T27: Redesigned to use autocomplete for URG/Fach selection
 * - Title field replaced with Area Autocomplete (comma-separated URGs)
 * - Badges removed (URGs shown directly in autocomplete)
 * - Description remains editable
 */
const ThemenlisteHeader = ({
  selectedAreas = [],
  description,
  onAreasChange,
  onDescriptionChange,
  hierarchyLabels,
  isJura = true, // T27: Pass to autocomplete for correct data source
}) => {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingAreas, setIsEditingAreas] = useState(selectedAreas.length === 0);

  return (
    // T27: Centered layout matching Figma design
    <div className="px-6 py-6 bg-white">
      <div className="flex flex-col items-center gap-2.5">
        {/* T27: URG/Fach Autocomplete - replaces title + badges */}
        <AreaAutocompleteInput
          selectedAreas={selectedAreas}
          onAreasChange={onAreasChange}
          isEditing={isEditingAreas}
          onEditingChange={setIsEditingAreas}
          placeholder={`${hierarchyLabels?.level1 || 'Fach'} eingeben...`}
          isJura={isJura}
        />

        {/* T27: Description - centered with max-width (Figma 900px) */}
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
