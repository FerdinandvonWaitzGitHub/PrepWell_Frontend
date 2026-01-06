import { useState } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { Plus, Minus, GripVertical, Pencil } from 'lucide-react';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 15: Themen für URGs (Sidebar Layout)
 * User can add themes to each URG with a sidebar navigation.
 * Left: URG list (sidebar)
 * Right: Theme editor for selected URG
 */

/**
 * RG Badge Component
 */
const RgBadge = ({ rechtsgebietId, isActive, onClick }) => {
  const label = RECHTSGEBIET_LABELS[rechtsgebietId] || rechtsgebietId;
  const colorClass = RECHTSGEBIET_COLORS[rechtsgebietId] || 'bg-gray-500';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all
        ${isActive
          ? `${colorClass} text-white`
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }
      `}
    >
      {label}
    </button>
  );
};

/**
 * URG Sidebar Item Component
 */
const UrgSidebarItem = ({ urg, isActive, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 rounded-lg transition-all
        ${isActive
          ? 'bg-primary-50 border-l-4 border-primary-600 text-primary-900'
          : 'hover:bg-neutral-50 text-neutral-700'
        }
      `}
    >
      <span className="text-sm font-medium">{urg.name}</span>
    </button>
  );
};

/**
 * Theme Item Component
 */
const ThemeItem = ({ thema, onRemove }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
      <button
        type="button"
        className="p-1 text-neutral-400 hover:text-neutral-600 cursor-grab"
        tabIndex={-1}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="flex-1 text-sm text-neutral-900">{thema.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Step 15 Component
 */
const Step15ThemenUrgs = () => {
  const {
    selectedRechtsgebiete,
    unterrechtsgebieteDraft,
    themenDraft,
    updateWizardData
  } = useWizard();

  const [activeRgIndex, setActiveRgIndex] = useState(0);
  const [activeUrgIndex, setActiveUrgIndex] = useState(0);
  const [newThemaName, setNewThemaName] = useState('');

  const activeRg = selectedRechtsgebiete[activeRgIndex];
  const activeUrgs = unterrechtsgebieteDraft[activeRg] || [];
  const activeUrg = activeUrgs[activeUrgIndex];
  const activeThemen = activeUrg ? (themenDraft[activeUrg.id] || []) : [];

  // Reset URG index when RG changes
  const handleRgChange = (index) => {
    setActiveRgIndex(index);
    setActiveUrgIndex(0);
  };

  const handleAddThema = () => {
    if (newThemaName.trim() && activeUrg) {
      const newThema = {
        id: `thema-${Date.now()}`,
        name: newThemaName.trim(),
        aufgaben: []
      };

      updateWizardData({
        themenDraft: {
          ...themenDraft,
          [activeUrg.id]: [...activeThemen, newThema]
        }
      });
      setNewThemaName('');
    }
  };

  const handleRemoveThema = (themaId) => {
    if (activeUrg) {
      updateWizardData({
        themenDraft: {
          ...themenDraft,
          [activeUrg.id]: activeThemen.filter(t => t.id !== themaId)
        }
      });
    }
  };

  return (
    <div>
      <StepHeader
        step={15}
        title="Füge den Unterrechtsgebieten Themen hinzu."
        description="Wähle ein Unterrechtsgebiet aus der Liste und füge die relevanten Themen hinzu."
      />

      {/* RG Selection */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="text-sm font-medium text-neutral-700 mb-3">
          Erstelle die Themen für:
        </p>
        <div className="flex flex-wrap gap-2">
          {selectedRechtsgebiete.map((rgId, index) => (
            <RgBadge
              key={rgId}
              rechtsgebietId={rgId}
              isActive={index === activeRgIndex}
              onClick={() => handleRgChange(index)}
            />
          ))}
        </div>
      </div>

      {/* Main Content: Sidebar + Editor */}
      <div className="flex gap-4">
        {/* URG Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-neutral-50 rounded-lg p-2 space-y-1">
            {activeUrgs.map((urg, index) => (
              <UrgSidebarItem
                key={urg.id}
                urg={urg}
                isActive={index === activeUrgIndex}
                onClick={() => setActiveUrgIndex(index)}
              />
            ))}

            {/* Edit URGs link */}
            <button
              type="button"
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              <span>URGs anpassen</span>
            </button>
          </div>
        </div>

        {/* Theme Editor */}
        <div className="flex-1">
          {activeUrg ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              {/* URG Title */}
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                {activeUrg.name}
              </h3>

              {/* Themes List */}
              <div className="space-y-2 mb-4">
                {activeThemen.length > 0 ? (
                  activeThemen.map((thema) => (
                    <ThemeItem
                      key={thema.id}
                      thema={thema}
                      onRemove={() => handleRemoveThema(thema.id)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-neutral-500 italic py-4 text-center">
                    Noch keine Themen hinzugefügt.
                  </p>
                )}
              </div>

              {/* Add Theme */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newThemaName}
                  onChange={(e) => setNewThemaName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddThema()}
                  placeholder="Neues Thema hinzufügen..."
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddThema}
                  disabled={!newThemaName.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Hinzufügen
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-lg p-8 text-center">
              <p className="text-neutral-500">
                Keine Unterrechtsgebiete verfügbar. Bitte füge zuerst URGs hinzu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step15ThemenUrgs;
