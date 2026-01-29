import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

/**
 * ThemaDetail - Right panel showing selected Thema with Aufgaben
 * T27: Updated to match Figma design (color bar, typography)
 * T27 Redesign: Uses selectedAreas + areaId for color lookup
 */
const ThemaDetail = ({
  thema,
  selectedAreas = [],
  onAddAufgabe,
  onDeleteAufgabe,
  onTogglePriority,
  onUpdateThema,
  hierarchyLabels,
  isJura = true,
}) => {
  // T27: Get correct hierarchy labels based on Jura vs non-Jura
  // Jura (5 levels): level4=Thema, level5=Aufgabe
  // Non-Jura (4 levels): level3=Thema, level4=Aufgabe
  const themaLabel = isJura ? hierarchyLabels?.level4 : hierarchyLabels?.level3;
  const aufgabeLabel = isJura ? hierarchyLabels?.level5 : hierarchyLabels?.level4;
  const aufgabeLabelPlural = isJura ? hierarchyLabels?.level5Plural : hierarchyLabels?.level4Plural;
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newAufgabeName, setNewAufgabeName] = useState('');
  const [isAddingAufgabe, setIsAddingAufgabe] = useState(false);

  // T27: Get color bar class based on areaId -> selectedAreas lookup
  const getColorBarClass = (areaId) => {
    const area = selectedAreas.find(a => a.id === areaId);
    return area?.color || 'bg-neutral-400';
  };

  // Priority display helpers
  const getPriorityDisplay = (priority) => {
    switch (priority) {
      case 'high':
        return { text: '!!', color: 'text-red-600 bg-red-50' };
      case 'medium':
        return { text: '!', color: 'text-amber-600 bg-amber-50' };
      default:
        return { text: '', color: '' };
    }
  };

  const handleAddAufgabe = () => {
    if (!newAufgabeName.trim() || !thema) return;
    onAddAufgabe(thema.id, newAufgabeName.trim());
    setNewAufgabeName('');
    setIsAddingAufgabe(false);
  };

  if (!thema) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6M9 16h6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-700 mb-1">
            Kein {themaLabel || 'Thema'} ausgewählt
          </h3>
          <p className="text-sm text-neutral-400">
            Wähle ein {themaLabel || 'Thema'} aus der Navigation um {aufgabeLabelPlural || 'Aufgaben'} zu bearbeiten
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* T27: Thema Header - extralight typography */}
      <div className="px-12 pt-6 pb-4 bg-white">
        {/* Thema Name - T27: text-2xl extralight */}
        {isEditingName ? (
          <input
            type="text"
            value={thema.name}
            onChange={(e) => onUpdateThema(thema.id, { name: e.target.value })}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
            className="w-full text-2xl font-extralight text-neutral-950 bg-transparent border-b border-neutral-300 focus:border-neutral-900 focus:outline-none pb-1"
            autoFocus
          />
        ) : (
          <h2
            className="text-2xl font-extralight text-neutral-950 cursor-pointer hover:text-neutral-700"
            onClick={() => setIsEditingName(true)}
          >
            {thema.name}
          </h2>
        )}

        {/* Thema Description - T27: neutral-400 */}
        {isEditingDescription ? (
          <textarea
            value={thema.description || ''}
            onChange={(e) => onUpdateThema(thema.id, { description: e.target.value })}
            onBlur={() => setIsEditingDescription(false)}
            placeholder="Beschreibung hinzufügen..."
            className="w-full mt-2 text-sm text-neutral-400 bg-transparent border border-neutral-200 rounded-lg p-2 focus:border-neutral-400 focus:outline-none resize-none"
            rows={2}
            autoFocus
          />
        ) : (
          <p
            className="mt-1 text-sm text-neutral-400 cursor-pointer hover:text-neutral-500"
            onClick={() => setIsEditingDescription(true)}
          >
            {thema.description || 'Beschreibung'}
          </p>
        )}

        {/* T32: Fach selector removed - now handled in left navigation */}
      </div>

      {/* T27: Aufgaben List with color bar */}
      <div className="flex-1 overflow-y-auto px-12 pb-6">
        <div className="flex gap-4">
          {/* T27: Vertical color bar (5px width) */}
          <div className={`w-1.5 rounded-full ${getColorBarClass(thema.areaId)}`} />

          {/* Aufgaben Container */}
          <div className="flex-1 space-y-2.5">
            {(thema.aufgaben || []).map((aufgabe) => {
              const priority = getPriorityDisplay(aufgabe.priority);

              return (
                <div
                  key={aufgabe.id}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-white rounded-md border border-neutral-200 group"
                >
                  <div className="flex items-center gap-2">
                    {/* T27: Checkbox - 16x16 (w-4 h-4) */}
                    <div className="w-4 h-4 rounded-sm border border-neutral-200 flex-shrink-0 shadow-xs" />
                    {/* Aufgabe Name */}
                    <span className="text-sm font-medium text-neutral-950">{aufgabe.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* PW-215: Two exclamation marks design */}
                    <button
                      onClick={() => onTogglePriority(thema.id, aufgabe.id)}
                      className="flex items-center px-1 py-0.5 text-xl font-semibold leading-none rounded transition-colors"
                      title={aufgabe.priority === 'high' ? 'Hohe Priorität' : aufgabe.priority === 'medium' ? 'Mittlere Priorität' : 'Keine Priorität'}
                    >
                      <span className={aufgabe.priority === 'medium' || aufgabe.priority === 'high' ? 'text-amber-500' : 'text-neutral-300'}>!</span>
                      <span className={aufgabe.priority === 'high' ? 'text-red-500' : 'text-neutral-300'}>!</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => onDeleteAufgabe(aufgabe.id)}
                      className="p-1 text-neutral-200 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title={`${aufgabeLabel || 'Aufgabe'} löschen`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* T27: Add Aufgabe - simpler style */}
            {isAddingAufgabe ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAufgabeName}
                  onChange={(e) => setNewAufgabeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddAufgabe();
                    if (e.key === 'Escape') {
                      setIsAddingAufgabe(false);
                      setNewAufgabeName('');
                    }
                  }}
                  placeholder={`Neue ${aufgabeLabel || 'Aufgabe'}...`}
                  className="flex-1 px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400"
                  autoFocus
                />
                <button
                  onClick={handleAddAufgabe}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-brand-primary rounded-md hover:opacity-90"
                >
                  Hinzufügen
                </button>
                <button
                  onClick={() => {
                    setIsAddingAufgabe(false);
                    setNewAufgabeName('');
                  }}
                  className="px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingAufgabe(true)}
                className="flex items-center gap-2 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700"
              >
                <Plus size={16} />
                <span>Neue {aufgabeLabel || 'Aufgabe'}</span>
              </button>
            )}

            {/* Empty State */}
            {(thema.aufgaben || []).length === 0 && !isAddingAufgabe && (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-400">
                  Noch keine {aufgabeLabelPlural || 'Aufgaben'} hinzugefügt
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemaDetail;
