import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

/**
 * ThemaDetail - Right panel showing selected Thema with Aufgaben
 */
const ThemaDetail = ({
  thema,
  onAddAufgabe,
  onDeleteAufgabe,
  onTogglePriority,
  onUpdateThema,
  hierarchyLabels,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newAufgabeName, setNewAufgabeName] = useState('');
  const [isAddingAufgabe, setIsAddingAufgabe] = useState(false);

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
            Kein {hierarchyLabels?.level4 || 'Thema'} ausgewählt
          </h3>
          <p className="text-sm text-neutral-400">
            Wähle ein {hierarchyLabels?.level4 || 'Thema'} aus der Navigation um {hierarchyLabels?.level5Plural || 'Aufgaben'} zu bearbeiten
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-neutral-50 overflow-hidden">
      {/* Thema Header */}
      <div className="p-6 bg-white border-b border-neutral-200">
        {/* Thema Name */}
        {isEditingName ? (
          <input
            type="text"
            value={thema.name}
            onChange={(e) => onUpdateThema(thema.id, { name: e.target.value })}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
            className="w-full text-xl font-medium text-neutral-900 bg-transparent border-b border-neutral-300 focus:border-neutral-900 focus:outline-none pb-1"
            autoFocus
          />
        ) : (
          <h2
            className="text-xl font-medium text-neutral-900 cursor-pointer hover:text-neutral-700"
            onClick={() => setIsEditingName(true)}
          >
            {thema.name}
          </h2>
        )}

        {/* Thema Description */}
        {isEditingDescription ? (
          <textarea
            value={thema.description || ''}
            onChange={(e) => onUpdateThema(thema.id, { description: e.target.value })}
            onBlur={() => setIsEditingDescription(false)}
            placeholder="Beschreibung hinzufügen..."
            className="w-full mt-2 text-sm text-neutral-500 bg-transparent border border-neutral-200 rounded-lg p-2 focus:border-neutral-400 focus:outline-none resize-none"
            rows={2}
            autoFocus
          />
        ) : (
          <p
            className="mt-1 text-sm text-neutral-500 cursor-pointer hover:text-neutral-600"
            onClick={() => setIsEditingDescription(true)}
          >
            {thema.description || 'Beschreibung hinzufügen...'}
          </p>
        )}
      </div>

      {/* Aufgaben List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-2">
          {(thema.aufgaben || []).map((aufgabe) => {
            const priority = getPriorityDisplay(aufgabe.priority);

            return (
              <div
                key={aufgabe.id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200 group"
              >
                {/* Checkbox (visual only for now) */}
                <div className="w-5 h-5 rounded border border-neutral-300 flex-shrink-0" />

                {/* Aufgabe Name */}
                <span className="flex-1 text-sm text-neutral-800">{aufgabe.name}</span>

                {/* Priority Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onTogglePriority(thema.id, aufgabe.id)}
                    className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                      priority.color || 'text-neutral-300 hover:bg-neutral-100'
                    }`}
                    title="Priorität ändern"
                  >
                    {priority.text || '○'}
                  </button>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => onDeleteAufgabe(aufgabe.id)}
                  className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`${hierarchyLabels?.level5 || 'Aufgabe'} löschen`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add Aufgabe */}
        {isAddingAufgabe ? (
          <div className="mt-3 flex items-center gap-2">
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
              placeholder={`Neue ${hierarchyLabels?.level5 || 'Aufgabe'}...`}
              className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
              autoFocus
            />
            <button
              onClick={handleAddAufgabe}
              className="px-3 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800"
            >
              Hinzufügen
            </button>
            <button
              onClick={() => {
                setIsAddingAufgabe(false);
                setNewAufgabeName('');
              }}
              className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingAufgabe(true)}
            className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700 hover:bg-white rounded-lg border border-dashed border-neutral-300 w-full"
          >
            <Plus size={16} />
            <span>Neue {hierarchyLabels?.level5 || 'Aufgabe'}</span>
          </button>
        )}

        {/* Empty State */}
        {(thema.aufgaben || []).length === 0 && !isAddingAufgabe && (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-400">
              Noch keine {hierarchyLabels?.level5Plural || 'Aufgaben'} hinzugefügt
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemaDetail;
