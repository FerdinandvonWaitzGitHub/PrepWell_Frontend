import { useState } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { Plus, Minus, GripVertical } from 'lucide-react';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 12: Themen & Aufgaben Editor
 * User can add/edit themes and tasks for each Rechtsgebiet.
 * Uses horizontal tabs/pills to switch between Rechtsgebiete.
 */

/**
 * RG Tab Component
 */
const RgTab = ({ rechtsgebietId, isActive, onClick }) => {
  const label = RECHTSGEBIET_LABELS[rechtsgebietId] || rechtsgebietId;
  const colorClass = RECHTSGEBIET_COLORS[rechtsgebietId] || 'bg-gray-500';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all
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
 * URG Section Component
 */
const UrgSection = ({ urg, themen, onAddThema, onRemoveThema }) => {
  const [newThemaName, setNewThemaName] = useState('');

  const handleAdd = () => {
    if (newThemaName.trim()) {
      onAddThema({
        id: `thema-${Date.now()}`,
        name: newThemaName.trim(),
        aufgaben: []
      });
      setNewThemaName('');
    }
  };

  return (
    <div className="mb-6">
      {/* URG Header */}
      <h4 className="text-base font-medium text-neutral-900 mb-3">{urg.name}</h4>

      {/* Themen List */}
      <div className="space-y-2 mb-3">
        {themen.length > 0 ? (
          themen.map((thema) => (
            <div
              key={thema.id}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200"
            >
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
                onClick={() => onRemoveThema(thema.id)}
                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-neutral-500 italic">Noch keine Themen hinzugefügt.</p>
        )}
      </div>

      {/* Add Thema Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newThemaName}
          onChange={(e) => setNewThemaName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Neues Thema..."
          className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newThemaName.trim()}
          className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Hinzufügen
        </button>
      </div>
    </div>
  );
};

/**
 * Step 12 Component
 */
const Step12ThemenEdit = () => {
  const {
    selectedRechtsgebiete,
    unterrechtsgebieteDraft,
    themenDraft,
    updateWizardData
  } = useWizard();

  const [activeRgIndex, setActiveRgIndex] = useState(0);
  const activeRg = selectedRechtsgebiete[activeRgIndex];
  const activeUrgs = unterrechtsgebieteDraft[activeRg] || [];

  const handleAddThema = (urgId, thema) => {
    const currentThemen = themenDraft[urgId] || [];
    updateWizardData({
      themenDraft: {
        ...themenDraft,
        [urgId]: [...currentThemen, thema]
      }
    });
  };

  const handleRemoveThema = (urgId, themaId) => {
    const currentThemen = themenDraft[urgId] || [];
    updateWizardData({
      themenDraft: {
        ...themenDraft,
        [urgId]: currentThemen.filter(t => t.id !== themaId)
      }
    });
  };

  return (
    <div>
      <StepHeader
        step={12}
        title="Hinzufügen von Themen & Aufgaben"
        description="Füge deinen Unterrechtsgebieten Themen hinzu, die du lernen möchtest."
      />

      {/* RG Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {selectedRechtsgebiete.map((rgId, index) => (
          <RgTab
            key={rgId}
            rechtsgebietId={rgId}
            isActive={index === activeRgIndex}
            onClick={() => setActiveRgIndex(index)}
          />
        ))}
      </div>

      {/* URG Sections */}
      <div className="bg-neutral-50 rounded-lg p-4">
        {activeUrgs.length > 0 ? (
          activeUrgs.map((urg) => (
            <UrgSection
              key={urg.id}
              urg={urg}
              themen={themenDraft[urg.id] || []}
              onAddThema={(thema) => handleAddThema(urg.id, thema)}
              onRemoveThema={(themaId) => handleRemoveThema(urg.id, themaId)}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-neutral-500">
              Keine Unterrechtsgebiete für dieses Rechtsgebiet vorhanden.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step12ThemenEdit;
