import { useState } from 'react';
import { Pencil } from 'lucide-react';

/**
 * ThemenlisteHeader - Header section with title, description, and badges
 */
const ThemenlisteHeader = ({
  name,
  description,
  rechtsgebiete = [],
  onNameChange,
  onDescriptionChange,
  hierarchyLabels,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(!name);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // T27: Get unique rechtsgebiet badges with Figma colors (bg-blue-900 text-blue-50)
  const badges = rechtsgebiete.map(rg => ({
    id: rg.rechtsgebietId,
    label: rg.rechtsgebietId === 'oeffentliches-recht' ? 'Öffentliches Recht' :
           rg.rechtsgebietId === 'zivilrecht' ? 'Zivilrecht' :
           rg.rechtsgebietId === 'strafrecht' ? 'Strafrecht' :
           rg.rechtsgebietId === 'querschnitt' ? 'Querschnitt' : rg.rechtsgebietId,
    // T27: Figma uses consistent dark badge style
    color: rg.rechtsgebietId === 'oeffentliches-recht' ? 'bg-green-800 text-green-100' :
           rg.rechtsgebietId === 'zivilrecht' ? 'bg-blue-900 text-blue-50' :
           rg.rechtsgebietId === 'strafrecht' ? 'bg-red-800 text-red-100' :
           rg.rechtsgebietId === 'querschnitt' ? 'bg-purple-800 text-purple-100' : 'bg-neutral-800 text-neutral-100',
  }));

  return (
    // T27: Centered layout matching Figma design
    <div className="px-6 py-6 bg-white">
      <div className="flex flex-col items-center gap-2.5">
        {/* Badges Row - centered */}
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap justify-center gap-2">
            {badges.length > 0 ? (
              badges.map(badge => (
                <span
                  key={badge.id}
                  className={`px-2 py-0.5 text-xs font-semibold rounded-md ${badge.color}`}
                >
                  {badge.label}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-neutral-800 text-neutral-100">
                Keine {hierarchyLabels?.level1Plural || 'Rechtsgebiete'} ausgewählt
              </span>
            )}
          </div>
          {!isEditingTitle && (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Titel bearbeiten"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>

        {/* T27: Title - centered, 5xl extralight (Figma 48px) */}
        {isEditingTitle ? (
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => name && setIsEditingTitle(false)}
            placeholder="Titel der Themenliste"
            className="w-full text-center text-5xl font-extralight text-neutral-950 bg-transparent border-b border-neutral-300 focus:border-neutral-900 focus:outline-none pb-1"
            autoFocus
          />
        ) : (
          <h1
            className="text-5xl font-extralight text-neutral-950 text-center cursor-pointer hover:text-neutral-700 py-1"
            onClick={() => setIsEditingTitle(true)}
          >
            {name || 'Titel der Themenliste'}
          </h1>
        )}

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
