import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose
} from '../../ui/dialog';
import Button from '../../ui/button';
import { ChevronDownIcon } from '../../ui/icon';
import { RECHTSGEBIETE } from '../../../contexts/uebungsklausuren-context';

// Sort options
const SORT_OPTIONS = [
  { value: 'date', label: 'Datum' },
  { value: 'title', label: 'Titel' },
  { value: 'subject', label: 'Rechtsgebiet' },
  { value: 'grade', label: 'Note' },
];

// Preset options
const PRESETS = [
  {
    id: 'default',
    name: 'Standard: Alle anzeigen, Neueste zuerst',
    settings: {
      subjects: [],
      primarySort: 'date',
      sortDirection: 'desc',
    },
  },
  {
    id: 'best-first',
    name: 'Beste Noten zuerst',
    settings: {
      subjects: [],
      primarySort: 'grade',
      sortDirection: 'desc',
    },
  },
  {
    id: 'custom',
    name: 'Benutzerdefiniert',
    settings: null,
  },
];

/**
 * UebungsklausurenFilterDialog - Filter and sort dialog for practice exams
 * Simplified version without semester filter
 */
const UebungsklausurenFilterDialog = ({ open, onOpenChange, filters, onApply }) => {
  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    subjects: [],
    primarySort: 'date',
    sortDirection: 'desc',
  });

  const [selectedPreset, setSelectedPreset] = useState('default');

  // Dropdown state
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Load filters when dialog opens
  useEffect(() => {
    if (open && filters) {
      setLocalFilters(filters);
      // Determine if current filters match a preset
      const matchingPreset = PRESETS.find(p => {
        if (!p.settings) return false;
        return (
          JSON.stringify(p.settings.subjects) === JSON.stringify(filters.subjects) &&
          p.settings.primarySort === filters.primarySort &&
          p.settings.sortDirection === filters.sortDirection
        );
      });
      setSelectedPreset(matchingPreset?.id || 'custom');
    }
  }, [open, filters]);

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset && preset.settings) {
      setLocalFilters(preset.settings);
    }
  };

  const handleSubjectToggle = (subject) => {
    setSelectedPreset('custom');
    setLocalFilters(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const defaultSettings = PRESETS[0].settings;
    setLocalFilters(defaultSettings);
    setSelectedPreset('default');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-md max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Filtern & Sortieren</DialogTitle>
          <DialogDescription>
            Passe die Anzeige deiner Übungsklausuren an.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Presets */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900">Schnellauswahl</label>
            {PRESETS.map(preset => (
              <label
                key={preset.id}
                className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name="preset"
                  value={preset.id}
                  checked={selectedPreset === preset.id}
                  onChange={() => handlePresetChange(preset.id)}
                  className="mt-0.5 w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">{preset.name}</span>
              </label>
            ))}
          </div>

          {/* Custom Filters - Only show when custom is selected */}
          {selectedPreset === 'custom' && (
            <>
              {/* Subject Filter */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Rechtsgebiete</label>
                <div className="space-y-2">
                  {RECHTSGEBIETE.map(subject => (
                    <label
                      key={subject}
                      className="flex items-center gap-3 py-1.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.subjects.includes(subject)}
                        onChange={() => handleSubjectToggle(subject)}
                        className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-700">{subject}</span>
                    </label>
                  ))}
                </div>
                {localFilters.subjects.length === 0 && (
                  <p className="text-xs text-gray-500">
                    Keine Auswahl = Alle anzeigen
                  </p>
                )}
              </div>

              {/* Sort Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Sortierung</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
                  >
                    <span className="text-sm text-gray-900">
                      {SORT_OPTIONS.find(s => s.value === localFilters.primarySort)?.label || 'Auswählen'}
                    </span>
                    <ChevronDownIcon size={16} className={`text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSortOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                      {SORT_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setLocalFilters(prev => ({ ...prev, primarySort: option.value }));
                            setIsSortOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                            localFilters.primarySort === option.value ? 'bg-primary-50 text-gray-900 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort Direction Toggle */}
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setLocalFilters(prev => ({ ...prev, sortDirection: 'desc' }))}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      localFilters.sortDirection === 'desc'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Absteigend
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalFilters(prev => ({ ...prev, sortDirection: 'asc' }))}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      localFilters.sortDirection === 'asc'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Aufsteigend
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter className="justify-between">
          <Button variant="default" onClick={handleReset}>
            Zurücksetzen
          </Button>
          <div className="flex gap-2">
            <Button variant="default" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={handleApply}>
              Anwenden
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UebungsklausurenFilterDialog;
