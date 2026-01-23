/**
 * CustomSubjectsSection - Einstellungen für Fächerfarben
 *
 * T-SET-1: Custom Rechtsgebiet-Farben & Fächer
 *
 * Funktionen:
 * - Juristen: Farben der 4 Standard-Rechtsgebiete ändern, zurücksetzen
 * - Juristen: Neue Custom Rechtsgebiete hinzufügen
 * - Nicht-Juristen: Eigene Fächer hinzufügen, bearbeiten, löschen
 */

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, RotateCcwIcon, PaletteIcon } from '../../components/ui';
import SubjectColorPicker, { SubjectColorButton } from './subject-color-picker';
import {
  getAllSubjects,
  addCustomSubject,
  updateSubjectColor,
  deleteCustomSubject,
  resetToDefaultColor,
  hasCustomColor,
  DEFAULT_RECHTSGEBIETE,
  AVAILABLE_COLORS,
  hasPresetsForProgram,
  getPresetsForProgram,
  initializeSubjectsForProgram,
  getSubjectSettings, // T27: For Supabase sync
} from '../../utils/rechtsgebiet-colors';
import { useUserSettingsSync } from '../../hooks/use-supabase-sync'; // T27: Supabase sync

// Fallback Icons falls nicht in ui vorhanden
const FallbackPlusIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const FallbackTrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6" />
    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2" />
  </svg>
);

const FallbackRotateCcwIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="1,4 1,10 7,10" />
    <path d="M3.51,15a9,9,0,1,0,2.13-9.36L1,10" />
  </svg>
);

const FallbackPaletteIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
    <path d="M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10c0.926,0,1.648-0.746,1.648-1.688 c0-0.437-0.18-0.835-0.437-1.125c-0.29-0.289-0.438-0.652-0.438-1.125a1.64,1.64,0,0,1,1.668-1.668h1.996c3.051,0,5.5-2.45,5.5-5.5C22,6.5,17.5,2,12,2z" />
  </svg>
);

// T7: Sparkles Icon für Presets
const SparklesIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.09 3.26L16 7.34l-2.91 1.08L12 12l-1.09-3.58L8 7.34l2.91-1.08L12 3z" />
    <path d="M19 13l.68 2.04L22 15.72l-1.82.68L19 19l-.68-2.6L16 15.72l1.82-.68L19 13z" />
    <path d="M5 13l.68 2.04L8 15.72l-1.82.68L5 19l-.68-2.6L2 15.72l1.82-.68L5 13z" />
  </svg>
);

// Use imported icons or fallbacks
const Plus = PlusIcon || FallbackPlusIcon;
const Trash = TrashIcon || FallbackTrashIcon;
const RotateCcw = RotateCcwIcon || FallbackRotateCcwIcon;
const Palette = PaletteIcon || FallbackPaletteIcon;

/**
 * CustomSubjectsSection Komponente
 *
 * @param {boolean} isJura - Ob Jura-Studiengang (zeigt Standard-Rechtsgebiete)
 * @param {string} studiengang - T7: ID des Studiengangs für Preset-Vorschläge
 */
const CustomSubjectsSection = ({ isJura = true, studiengang = null }) => {
  // State
  const [subjects, setSubjects] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('blue');
  const [error, setError] = useState('');
  const [showPresetsDialog, setShowPresetsDialog] = useState(false); // T7

  // T27: Supabase sync for subject settings
  const { updateSettings } = useUserSettingsSync();

  // T7: Prüfe ob Presets verfügbar sind
  const presetsAvailable = !isJura && hasPresetsForProgram(studiengang);
  const presets = presetsAvailable ? getPresetsForProgram(studiengang) : [];

  // Subjects laden
  const loadSubjects = () => {
    setSubjects(getAllSubjects(isJura));
  };

  // T27: Sync subject settings to Supabase after any change
  const syncToSupabase = () => {
    const currentSettings = getSubjectSettings();
    updateSettings({ subjectSettings: currentSettings });
  };

  // Initial load + storage event listener
  useEffect(() => {
    loadSubjects();

    const handleStorageChange = () => loadSubjects();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isJura]);

  // Farbe ändern
  const handleColorChange = (subjectId, newColor) => {
    updateSubjectColor(subjectId, newColor);
    loadSubjects();
    syncToSupabase(); // T27: Sync to Supabase
  };

  // Auf Default zurücksetzen
  const handleReset = (subjectId) => {
    resetToDefaultColor(subjectId);
    loadSubjects();
    syncToSupabase(); // T27: Sync to Supabase
  };

  // Custom Subject löschen
  const handleDelete = (subjectId) => {
    if (confirm('Dieses Fach wirklich löschen?')) {
      deleteCustomSubject(subjectId);
      loadSubjects();
      syncToSupabase(); // T27: Sync to Supabase
    }
  };

  // Neues Subject hinzufügen
  const handleAdd = () => {
    setError('');

    if (!newName.trim()) {
      setError('Bitte gib einen Namen ein');
      return;
    }

    try {
      addCustomSubject(newName.trim(), newColor);
      setShowAddDialog(false);
      setNewName('');
      setNewColor('blue');
      loadSubjects();
      syncToSupabase(); // T27: Sync to Supabase
    } catch (e) {
      setError(e.message);
    }
  };

  // T7: Presets verwenden
  const handleUsePresets = () => {
    const added = initializeSubjectsForProgram(studiengang);
    if (added > 0) {
      loadSubjects();
      syncToSupabase(); // T27: Sync to Supabase
    }
    setShowPresetsDialog(false);
  };

  // Subjects aufteilen
  const defaultSubjects = subjects.filter(s => s.isDefault);
  const customSubjects = subjects.filter(s => !s.isDefault);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Palette size={20} className="text-neutral-400" />
        <div>
          <p className="text-sm font-medium text-neutral-900">Fächerfarben</p>
          <p className="text-xs text-neutral-500">
            {isJura
              ? 'Passe die Farben deiner Rechtsgebiete an'
              : 'Erstelle und verwalte deine Fächer'}
          </p>
        </div>
      </div>

      {/* Standard-Rechtsgebiete (nur Jura) */}
      {isJura && defaultSubjects.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Standard-Rechtsgebiete
          </p>
          <div className="space-y-1">
            {defaultSubjects.map((subject) => (
              <SubjectRow
                key={subject.id}
                subject={subject}
                onColorChange={handleColorChange}
                onReset={handleReset}
                canDelete={false}
                canReset={hasCustomColor(subject.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Subjects */}
      <div className="space-y-2">
        {(isJura || customSubjects.length > 0) && (
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            {isJura ? 'Eigene Fächer' : 'Meine Fächer'}
          </p>
        )}

        {customSubjects.length > 0 ? (
          <div className="space-y-1">
            {customSubjects.map((subject) => (
              <SubjectRow
                key={subject.id}
                subject={subject}
                onColorChange={handleColorChange}
                onDelete={handleDelete}
                canDelete={true}
                canReset={false}
              />
            ))}
          </div>
        ) : isJura ? (
          <p className="text-sm text-neutral-400 py-2">
            Noch keine eigenen Fächer hinzugefügt
          </p>
        ) : (
          /* T7: Onboarding Card für Nicht-Juristen ohne Fächer */
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Palette size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Erstelle deine Fächer
                </p>
                <p className="text-xs text-blue-700 mb-3">
                  Um Themenlisten zu erstellen und deinen Lernfortschritt zu tracken,
                  füge zuerst deine Studienfächer hinzu.
                </p>
                <div className="flex flex-wrap gap-2">
                  {/* T7: Presets-Button wenn verfügbar */}
                  {presetsAvailable && (
                    <button
                      onClick={() => setShowPresetsDialog(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <SparklesIcon size={14} />
                      Vorschläge nutzen
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddDialog(true)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      presetsAvailable
                        ? 'text-blue-600 bg-white border border-blue-200 hover:bg-blue-50'
                        : 'text-white bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Plus size={14} />
                    {presetsAvailable ? 'Eigene erstellen' : 'Erstes Fach hinzufügen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Button - nur wenn User bereits Fächer hat oder Jura ist */}
      {(isJura || customSubjects.length > 0) && (
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Neues Fach hinzufügen</span>
        </button>
      )}

      {/* Add Dialog */}
      {showAddDialog && (
        <AddSubjectDialog
          name={newName}
          onNameChange={setNewName}
          color={newColor}
          onColorChange={setNewColor}
          error={error}
          onCancel={() => {
            setShowAddDialog(false);
            setNewName('');
            setNewColor('blue');
            setError('');
          }}
          onAdd={handleAdd}
        />
      )}

      {/* T7: Presets Dialog */}
      {showPresetsDialog && presetsAvailable && (
        <PresetsDialog
          presets={presets}
          onUsePresets={handleUsePresets}
          onCancel={() => setShowPresetsDialog(false)}
          onCustom={() => {
            setShowPresetsDialog(false);
            setShowAddDialog(true);
          }}
        />
      )}
    </div>
  );
};

/**
 * SubjectRow - Einzelne Zeile für ein Fach
 */
const SubjectRow = ({
  subject,
  onColorChange,
  onReset,
  onDelete,
  canDelete,
  canReset,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg group">
      {/* Farbkreis + Name */}
      <div className="flex items-center gap-3">
        <div
          className={`w-5 h-5 rounded-full bg-${subject.color}-500`}
          title={subject.color}
        />
        <span className="text-sm text-neutral-700">{subject.name}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Color Picker */}
        <div className="relative">
          <button
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 rounded transition-colors"
            title="Farbe ändern"
          >
            <Palette size={16} />
          </button>

          {isPickerOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsPickerOpen(false)}
              />
              <div className="absolute right-0 mt-2 p-3 bg-white rounded-lg shadow-lg border border-neutral-200 z-50">
                <SubjectColorPicker
                  value={subject.color}
                  onChange={(color) => {
                    onColorChange(subject.id, color);
                    setIsPickerOpen(false);
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Reset Button (nur für Defaults mit geänderter Farbe) */}
        {canReset && (
          <button
            onClick={() => onReset(subject.id)}
            className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Auf Standardfarbe zurücksetzen"
          >
            <RotateCcw size={16} />
          </button>
        )}

        {/* Delete Button (nur für Custom) */}
        {canDelete && (
          <button
            onClick={() => onDelete(subject.id)}
            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Löschen"
          >
            <Trash size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * AddSubjectDialog - Dialog zum Hinzufügen eines neuen Fachs
 */
const AddSubjectDialog = ({
  name,
  onNameChange,
  color,
  onColorChange,
  error,
  onCancel,
  onAdd,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">
          Neues Fach hinzufügen
        </h3>

        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="z.B. Europarecht"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Color Picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Farbe
          </label>
          <SubjectColorPicker
            value={color}
            onChange={onColorChange}
          />
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * T7: PresetsDialog - Dialog zur Auswahl von Fächer-Presets
 */
const PresetsDialog = ({
  presets,
  onUsePresets,
  onCancel,
  onCustom,
}) => {
  // Helper: Get Tailwind color class from color name
  const getColorClass = (color) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      amber: 'bg-amber-500',
      emerald: 'bg-emerald-500',
      cyan: 'bg-cyan-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      orange: 'bg-orange-500',
      teal: 'bg-teal-500',
      violet: 'bg-violet-500',
    };
    return colorMap[color] || 'bg-neutral-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <SparklesIcon size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-neutral-900">
              Fächer-Vorschläge
            </h3>
            <p className="text-sm text-neutral-500">
              Basierend auf deinem Studiengang
            </p>
          </div>
        </div>

        {/* Presets List */}
        <div className="mb-6">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            {presets.length} Fächer werden hinzugefügt
          </p>
          <div className="space-y-2">
            {presets.map((preset, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-lg"
              >
                <div className={`w-4 h-4 rounded-full ${getColorClass(preset.defaultColor)}`} />
                <span className="text-sm text-neutral-700">{preset.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-neutral-400 mb-4">
          Du kannst die Farben später jederzeit ändern oder weitere Fächer hinzufügen.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onUsePresets}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Vorschläge übernehmen
          </button>
          <button
            onClick={onCustom}
            className="w-full px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Lieber eigene erstellen
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomSubjectsSection;
