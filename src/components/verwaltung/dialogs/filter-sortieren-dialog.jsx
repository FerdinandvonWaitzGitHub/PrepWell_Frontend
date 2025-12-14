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

// Available subjects for filtering
const SUBJECTS = [
  'Zivilrecht',
  'Strafrecht',
  'Öffentliches Recht',
  'Zivilrechtliche Nebengebiete',
  'Rechtsgeschichte',
  'Philosophie'
];

// Sample semesters
const SEMESTERS = [
  'WS 2024/25',
  'SS 2024',
  'WS 2023/24',
  'SS 2023',
  'WS 2022/23'
];

// Sort options
const SORT_OPTIONS = [
  { value: 'date', label: 'Datum' },
  { value: 'title', label: 'Titel' },
  { value: 'subject', label: 'Fach' },
  { value: 'grade', label: 'Note' },
  { value: 'ects', label: 'ECTS' }
];

// Preset options
const PRESETS = [
  {
    id: 'default',
    name: 'Standard: Alles anzeigen, Neuste zuletzt',
    settings: {
      subjects: [],
      semesters: [],
      primarySort: 'date',
      secondarySort: 'title',
      sortDirection: 'desc'
    }
  },
  {
    id: 'exam-phase',
    name: 'Klausurenphase: Angemeldet, aktuellste zuerst, alle Fächer',
    settings: {
      subjects: [],
      semesters: [],
      primarySort: 'date',
      secondarySort: 'title',
      sortDirection: 'asc'
    }
  },
  {
    id: 'custom',
    name: 'Benutzerdefinierte Sortierung & Filter',
    settings: null
  }
];

/**
 * FilterSortierenDialog - Dialog for filtering and sorting exams
 */
const FilterSortierenDialog = ({ open, onOpenChange, filters, onApply }) => {
  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    subjects: [],
    semesters: [],
    primarySort: 'date',
    secondarySort: 'title',
    sortDirection: 'desc'
  });

  const [selectedPreset, setSelectedPreset] = useState('default');

  // Dropdown states
  const [isPrimarySortOpen, setIsPrimarySortOpen] = useState(false);
  const [isSecondarySortOpen, setIsSecondarySortOpen] = useState(false);

  // Load filters when dialog opens
  useEffect(() => {
    if (open && filters) {
      setLocalFilters(filters);
      setSelectedPreset('custom');
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
        : [...prev.subjects, subject]
    }));
  };

  const handleSemesterToggle = (semester) => {
    setSelectedPreset('custom');
    setLocalFilters(prev => ({
      ...prev,
      semesters: prev.semesters.includes(semester)
        ? prev.semesters.filter(s => s !== semester)
        : [...prev.semesters, semester]
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
      <DialogContent className="relative max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Klausuren Filtern & Sortieren</DialogTitle>
          <DialogDescription>
            Passe die Anzeige deiner Klausuren an.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Presets */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900">Filtern & Sortieren</label>
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
                <label className="text-sm font-medium text-gray-900">Fächer filtern</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {SUBJECTS.map(subject => (
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
              </div>

              {/* Semester Filter */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Semester filtern</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {SEMESTERS.map(semester => (
                    <label
                      key={semester}
                      className="flex items-center gap-3 py-1.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.semesters.includes(semester)}
                        onChange={() => handleSemesterToggle(semester)}
                        className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-700">{semester}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div className="grid grid-cols-2 gap-4">
                {/* Primary Sort */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-900">Sortierung primär</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPrimarySortOpen(!isPrimarySortOpen);
                        setIsSecondarySortOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    >
                      <span className="text-sm text-gray-900">
                        {SORT_OPTIONS.find(s => s.value === localFilters.primarySort)?.label || 'Auswählen'}
                      </span>
                      <ChevronDownIcon size={16} className={`text-gray-400 transition-transform ${isPrimarySortOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isPrimarySortOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {SORT_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setLocalFilters(prev => ({ ...prev, primarySort: option.value }));
                              setIsPrimarySortOpen(false);
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
                </div>

                {/* Secondary Sort */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-900">Sortierung sekundär</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSecondarySortOpen(!isSecondarySortOpen);
                        setIsPrimarySortOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    >
                      <span className="text-sm text-gray-900">
                        {SORT_OPTIONS.find(s => s.value === localFilters.secondarySort)?.label || 'Auswählen'}
                      </span>
                      <ChevronDownIcon size={16} className={`text-gray-400 transition-transform ${isSecondarySortOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSecondarySortOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {SORT_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setLocalFilters(prev => ({ ...prev, secondarySort: option.value }));
                              setIsSecondarySortOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                              localFilters.secondarySort === option.value ? 'bg-primary-50 text-gray-900 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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

export default FilterSortierenDialog;
