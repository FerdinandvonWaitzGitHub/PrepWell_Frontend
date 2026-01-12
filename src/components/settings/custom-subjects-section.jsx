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
} from '../../utils/rechtsgebiet-colors';

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

// Use imported icons or fallbacks
const Plus = PlusIcon || FallbackPlusIcon;
const Trash = TrashIcon || FallbackTrashIcon;
const RotateCcw = RotateCcwIcon || FallbackRotateCcwIcon;
const Palette = PaletteIcon || FallbackPaletteIcon;

/**
 * CustomSubjectsSection Komponente
 *
 * @param {boolean} isJura - Ob Jura-Studiengang (zeigt Standard-Rechtsgebiete)
 */
const CustomSubjectsSection = ({ isJura = true }) => {
  // State
  const [subjects, setSubjects] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('blue');
  const [error, setError] = useState('');

  // Subjects laden
  const loadSubjects = () => {
    setSubjects(getAllSubjects(isJura));
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
  };

  // Auf Default zurücksetzen
  const handleReset = (subjectId) => {
    resetToDefaultColor(subjectId);
    loadSubjects();
  };

  // Custom Subject löschen
  const handleDelete = (subjectId) => {
    if (confirm('Dieses Fach wirklich löschen?')) {
      deleteCustomSubject(subjectId);
      loadSubjects();
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
    } catch (e) {
      setError(e.message);
    }
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
        ) : (
          <p className="text-sm text-neutral-400 py-2">
            {isJura
              ? 'Noch keine eigenen Fächer hinzugefügt'
              : 'Füge dein erstes Fach hinzu'}
          </p>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddDialog(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <Plus size={16} />
        <span>Neues Fach hinzufügen</span>
      </button>

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

export default CustomSubjectsSection;
