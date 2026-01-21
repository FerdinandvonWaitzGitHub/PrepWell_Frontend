import { useState, useEffect, useMemo } from 'react';
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
import { ChevronDownIcon, CalendarIcon, CheckIcon } from '../../ui/icon';
import { useSemesterLeistungen, getSemesterOptions } from '../../../contexts/semester-leistungen-context';
import { useLabels } from '../../../hooks/use-labels';

// Filter presets
const FILTER_PRESETS = {
  STANDARD: 'standard',
  KLAUSURENPHASE: 'klausurenphase',
  BENUTZERDEFINIERT: 'benutzerdefiniert',
};

/**
 * FilterSortierenDialog - Dialog for filtering and sorting semester performances
 *
 * Figma: Node-ID 2126:2095
 * Layout: 3 presets, Benutzerdefiniert with bordered section containing filters
 */
const FilterSortierenDialog = ({ open, onOpenChange, filters, onApply }) => {
  const { alleRechtsgebiete } = useSemesterLeistungen();
  const { subject, subjectPlural } = useLabels(); // T29: Dynamic labels
  const semesterOptions = getSemesterOptions();

  // Local state
  const [preset, setPreset] = useState(FILTER_PRESETS.STANDARD);
  const [selectedFach, setSelectedFach] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [zeitrahmeBeginn, setZeitrahmeBeginn] = useState('');
  const [zeitrahmeEnde, setZeitrahmeEnde] = useState('');
  const [primarySort, setPrimarySort] = useState('date');
  const [secondarySort, setSecondarySort] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');

  // Dropdown states
  const [isFachOpen, setIsFachOpen] = useState(false);
  const [isSemesterOpen, setIsSemesterOpen] = useState(false);
  const [isPrimarySortOpen, setIsPrimarySortOpen] = useState(false);
  const [isSecondarySortOpen, setIsSecondarySortOpen] = useState(false);

  // Sort options - T29: Dynamic subject label
  const sortOptions = useMemo(() => [
    { value: 'date', label: 'Datum' },
    { value: 'grade', label: 'Note' },
    { value: 'subject', label: subject },
    { value: 'title', label: 'Titel' },
  ], [subject]);

  // Load current filters when dialog opens
  useEffect(() => {
    if (open) {
      // Determine preset based on filters
      if (filters.rechtsgebiete.length === 0 && filters.primarySort === 'date' && filters.sortDirection === 'desc') {
        setPreset(FILTER_PRESETS.STANDARD);
      } else if (filters.sortDirection === 'asc') {
        setPreset(FILTER_PRESETS.KLAUSURENPHASE);
      } else {
        setPreset(FILTER_PRESETS.BENUTZERDEFINIERT);
      }

      setSelectedFach(filters.rechtsgebiete?.[0] || '');
      setSelectedSemester(filters.semester || '');
      setZeitrahmeBeginn(filters.zeitrahmeBeginn || '');
      setZeitrahmeEnde(filters.zeitrahmeEnde || '');
      setPrimarySort(filters.primarySort || 'date');
      setSecondarySort(filters.secondarySort || '');
      setSortDirection(filters.sortDirection || 'desc');

      closeAllDropdowns();
    }
  }, [open, filters]);

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setIsFachOpen(false);
    setIsSemesterOpen(false);
    setIsPrimarySortOpen(false);
    setIsSecondarySortOpen(false);
  };

  // Handle preset change
  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);

    if (newPreset === FILTER_PRESETS.STANDARD) {
      setSelectedFach('');
      setSelectedSemester('');
      setZeitrahmeBeginn('');
      setZeitrahmeEnde('');
      setPrimarySort('date');
      setSecondarySort('');
      setSortDirection('desc');
    } else if (newPreset === FILTER_PRESETS.KLAUSURENPHASE) {
      setSelectedFach('');
      setSelectedSemester('');
      setZeitrahmeBeginn('');
      setZeitrahmeEnde('');
      setPrimarySort('date');
      setSecondarySort('');
      setSortDirection('asc'); // Upcoming first
    }
    // BENUTZERDEFINIERT keeps current values
  };

  // Apply filters
  const handleApply = () => {
    onApply({
      rechtsgebiete: selectedFach ? [selectedFach] : [],
      semester: selectedSemester,
      zeitrahmeBeginn,
      zeitrahmeEnde,
      primarySort,
      secondarySort,
      sortDirection,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-lg">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Leistungen Filtern & Sortieren</DialogTitle>
          <DialogDescription>
            This is a dialog description.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Section Title */}
          <div className="text-sm font-medium text-neutral-900">Filtern & Sortieren</div>

          {/* Preset Selection */}
          <div className="space-y-2">
            {/* Standard */}
            <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
              <input
                type="radio"
                name="preset"
                checked={preset === FILTER_PRESETS.STANDARD}
                onChange={() => handlePresetChange(FILTER_PRESETS.STANDARD)}
                className="w-4 h-4 text-neutral-900"
              />
              <span className="text-sm text-neutral-900">Standard: Alles anzeigen, Neuste zuletzt</span>
            </label>

            {/* Klausurenphase */}
            <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
              <input
                type="radio"
                name="preset"
                checked={preset === FILTER_PRESETS.KLAUSURENPHASE}
                onChange={() => handlePresetChange(FILTER_PRESETS.KLAUSURENPHASE)}
                className="w-4 h-4 text-neutral-900"
              />
              <span className="text-sm text-neutral-900">Klausurenphase: Angemeldet, nächste zuerst, alle Fächer</span>
            </label>

            {/* Benutzerdefiniert */}
            <div className={`border rounded-lg transition-colors ${preset === FILTER_PRESETS.BENUTZERDEFINIERT ? 'border-neutral-400' : 'border-neutral-200'}`}>
              <label className="flex items-center gap-3 p-3 cursor-pointer hover:bg-neutral-50 rounded-t-lg">
                <input
                  type="radio"
                  name="preset"
                  checked={preset === FILTER_PRESETS.BENUTZERDEFINIERT}
                  onChange={() => handlePresetChange(FILTER_PRESETS.BENUTZERDEFINIERT)}
                  className="w-4 h-4 text-neutral-900"
                />
                <span className="text-sm font-medium text-neutral-900">Benutzerdefinierte Sortierung & Filter</span>
              </label>

              {/* Custom Filter Options */}
              {preset === FILTER_PRESETS.BENUTZERDEFINIERT && (
                <div className="px-3 pb-3 pt-1 space-y-4 border-t border-neutral-100">
                  {/* Two Column Layout */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-3">
                      {/* Fächer/Rechtsgebiete filtern - T29: Dynamic labels */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-neutral-700">{subjectPlural} filtern</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              closeAllDropdowns();
                              setIsFachOpen(!isFachOpen);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm"
                          >
                            <span className={selectedFach ? 'text-neutral-900' : 'text-neutral-500'}>
                              {selectedFach || `${subject} auswählen`}
                            </span>
                            <ChevronDownIcon size={14} className="text-neutral-400" />
                          </button>
                          {isFachOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFach('');
                                  setIsFachOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50"
                              >
                                Alle {subjectPlural}
                              </button>
                              {alleRechtsgebiete.map(subject => (
                                <button
                                  key={subject.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedFach(subject.name);
                                    setIsFachOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                                    selectedFach === subject.name ? 'bg-primary-50 font-medium' : ''
                                  }`}
                                >
                                  {subject.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Semester filtern */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-neutral-700">Semester filtern</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              closeAllDropdowns();
                              setIsSemesterOpen(!isSemesterOpen);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm"
                          >
                            <span className={selectedSemester ? 'text-neutral-900' : 'text-neutral-500'}>
                              {selectedSemester || 'Semester auswählen'}
                            </span>
                            <ChevronDownIcon size={14} className="text-neutral-400" />
                          </button>
                          {isSemesterOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSemester('');
                                  setIsSemesterOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50"
                              >
                                Alle Semester
                              </button>
                              {semesterOptions.map(semester => (
                                <button
                                  key={semester}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSemester(semester);
                                    setIsSemesterOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                                    selectedSemester === semester ? 'bg-primary-50 font-medium' : ''
                                  }`}
                                >
                                  {semester}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Zeitrahmen */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-neutral-700">Zeitrahmen festlegen</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg">
                          <CalendarIcon size={14} className="text-neutral-400" />
                          <input
                            type="date"
                            value={zeitrahmeBeginn}
                            onChange={(e) => setZeitrahmeBeginn(e.target.value)}
                            placeholder="Beginn auswählen"
                            className="flex-1 bg-transparent text-sm focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg">
                          <CalendarIcon size={14} className="text-neutral-400" />
                          <input
                            type="date"
                            value={zeitrahmeEnde}
                            onChange={(e) => setZeitrahmeEnde(e.target.value)}
                            placeholder="Ende auswählen"
                            className="flex-1 bg-transparent text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                      {/* Sortierung primär */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-neutral-700">Sortierung primär</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              closeAllDropdowns();
                              setIsPrimarySortOpen(!isPrimarySortOpen);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm"
                          >
                            <span className="text-neutral-900">
                              {sortOptions.find(o => o.value === primarySort)?.label || 'Spalte auswählen'}
                            </span>
                            <ChevronDownIcon size={14} className="text-neutral-400" />
                          </button>
                          {isPrimarySortOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
                              {sortOptions.map(option => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setPrimarySort(option.value);
                                    setIsPrimarySortOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                                    primarySort === option.value ? 'bg-primary-50 font-medium' : ''
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sortierung sekundär */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-neutral-700">Sortierung sekundär</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              closeAllDropdowns();
                              setIsSecondarySortOpen(!isSecondarySortOpen);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm"
                          >
                            <span className={secondarySort ? 'text-neutral-900' : 'text-neutral-500'}>
                              {sortOptions.find(o => o.value === secondarySort)?.label || 'Spalte auswählen'}
                            </span>
                            <ChevronDownIcon size={14} className="text-neutral-400" />
                          </button>
                          {isSecondarySortOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  setSecondarySort('');
                                  setIsSecondarySortOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50"
                              >
                                Keine
                              </button>
                              {sortOptions.filter(o => o.value !== primarySort).map(option => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setSecondarySort(option.value);
                                    setIsSecondarySortOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                                    secondarySort === option.value ? 'bg-primary-50 font-medium' : ''
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
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex items-center justify-end gap-2">
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            className="flex items-center gap-1"
          >
            Speichern
            <CheckIcon size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterSortierenDialog;
