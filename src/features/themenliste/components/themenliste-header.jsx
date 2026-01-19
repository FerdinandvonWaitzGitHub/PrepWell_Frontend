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

  // Get unique rechtsgebiet badges
  const badges = rechtsgebiete.map(rg => ({
    id: rg.rechtsgebietId,
    label: rg.rechtsgebietId === 'oeffentliches-recht' ? 'Öffentliches Recht' :
           rg.rechtsgebietId === 'zivilrecht' ? 'Zivilrecht' :
           rg.rechtsgebietId === 'strafrecht' ? 'Strafrecht' :
           rg.rechtsgebietId === 'querschnitt' ? 'Querschnitt' : rg.rechtsgebietId,
    color: rg.rechtsgebietId === 'oeffentliches-recht' ? 'bg-green-100 text-green-700' :
           rg.rechtsgebietId === 'zivilrecht' ? 'bg-blue-100 text-blue-700' :
           rg.rechtsgebietId === 'strafrecht' ? 'bg-red-100 text-red-700' :
           rg.rechtsgebietId === 'querschnitt' ? 'bg-purple-100 text-purple-700' : 'bg-neutral-100 text-neutral-700',
  }));

  return (
    <div className="px-6 py-6 bg-white">
      {/* Badges Row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex flex-wrap gap-2">
          {badges.length > 0 ? (
            badges.map(badge => (
              <span
                key={badge.id}
                className={`px-2 py-0.5 text-xs font-medium rounded-md ${badge.color}`}
              >
                {badge.label}
              </span>
            ))
          ) : (
            <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-neutral-100 text-neutral-500">
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

      {/* Title */}
      {isEditingTitle ? (
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={() => name && setIsEditingTitle(false)}
          placeholder="Titel der Themenliste"
          className="w-full text-2xl font-extralight text-neutral-950 bg-transparent border-b border-neutral-300 focus:border-neutral-900 focus:outline-none pb-1 mb-2"
          autoFocus
        />
      ) : (
        <h1
          className="text-2xl font-extralight text-neutral-950 mb-2 cursor-pointer hover:text-neutral-700"
          onClick={() => setIsEditingTitle(true)}
        >
          {name || 'Titel der Themenliste'}
        </h1>
      )}

      {/* Description */}
      {isEditingDescription ? (
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onBlur={() => setIsEditingDescription(false)}
          placeholder="Beschreibung hinzufügen..."
          className="w-full text-sm text-neutral-400 bg-transparent border border-neutral-200 rounded-lg p-2 focus:border-neutral-400 focus:outline-none resize-none"
          rows={2}
          autoFocus
        />
      ) : (
        <p
          className="text-sm text-neutral-400 cursor-pointer hover:text-neutral-500"
          onClick={() => setIsEditingDescription(true)}
        >
          {description || 'Beschreibung hinzufügen...'}
        </p>
      )}
    </div>
  );
};

export default ThemenlisteHeader;
