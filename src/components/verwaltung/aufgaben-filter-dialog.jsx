import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '../ui';

// Central subject catalog (placeholder - to be replaced with actual catalog)
const FAECHER_KATALOG = [
  'Zivilrecht',
  'Strafrecht',
  'Öffentliches Recht'
];

/**
 * AufgabenFilterDialog - Filter dialog for tasks
 * Based on Figma design node 2207:4484
 */
const AufgabenFilterDialog = ({
  open,
  onOpenChange,
  filters,
  onApply
}) => {
  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    faecher: [],
    status: 'standard',
    wichtigkeit: [],
    zeitrahmen: 'alle',
    datumVon: '',
    datumBis: ''
  });

  // Sync local state with props when dialog opens
  useEffect(() => {
    if (open && filters) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  // Handle subject checkbox change
  const handleFachChange = (fach) => {
    setLocalFilters(prev => ({
      ...prev,
      faecher: prev.faecher.includes(fach)
        ? prev.faecher.filter(f => f !== fach)
        : [...prev.faecher, fach]
    }));
  };

  // Handle priority checkbox change
  const handleWichtigkeitChange = (priority) => {
    setLocalFilters(prev => ({
      ...prev,
      wichtigkeit: prev.wichtigkeit.includes(priority)
        ? prev.wichtigkeit.filter(p => p !== priority)
        : [...prev.wichtigkeit, priority]
    }));
  };

  // Handle save
  const handleSave = () => {
    onApply(localFilters);
    onOpenChange(false);
  };

  // Handle cancel
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[480px]">
        <DialogHeader className="pb-0">
          <DialogTitle>Aufgaben Filtern & Sortieren</DialogTitle>
        </DialogHeader>

        <DialogBody className="py-4 space-y-5">
          {/* Fächer filtern */}
          <div>
            <h4 className="text-sm font-medium text-neutral-900 mb-2">Fächer filtern</h4>
            <div className="space-y-2">
              {FAECHER_KATALOG.map((fach) => (
                <label key={fach} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.faecher.includes(fach)}
                    onChange={() => handleFachChange(fach)}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">{fach}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status filtern */}
          <div>
            <h4 className="text-sm font-medium text-neutral-900 mb-2">Status filtern</h4>
            <select
              value={localFilters.status}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="standard">Standard</option>
              <option value="erledigt">Erledigt</option>
              <option value="unerledigt">Unerledigt</option>
            </select>
          </div>

          {/* Wichtigkeit filtern */}
          <div>
            <h4 className="text-sm font-medium text-neutral-900 mb-2">Wichtigkeit filtern</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.wichtigkeit.includes('high')}
                  onChange={() => handleWichtigkeitChange('high')}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Hoch (!!)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.wichtigkeit.includes('medium')}
                  onChange={() => handleWichtigkeitChange('medium')}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Mittel (!)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.wichtigkeit.includes('low')}
                  onChange={() => handleWichtigkeitChange('low')}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Niedrig</span>
              </label>
            </div>
          </div>

          {/* Zeitrahmen */}
          <div>
            <h4 className="text-sm font-medium text-neutral-900 mb-2">Zeitrahmen</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="zeitrahmen"
                  value="alle"
                  checked={localFilters.zeitrahmen === 'alle'}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, zeitrahmen: e.target.value }))}
                  className="w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Alle Aufgaben</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="zeitrahmen"
                  value="vergangen"
                  checked={localFilters.zeitrahmen === 'vergangen'}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, zeitrahmen: e.target.value }))}
                  className="w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Vergangene Aufgaben</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="zeitrahmen"
                  value="zukuenftig"
                  checked={localFilters.zeitrahmen === 'zukuenftig'}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, zeitrahmen: e.target.value }))}
                  className="w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Zukünftige Aufgaben</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="zeitrahmen"
                  value="benutzerdefiniert"
                  checked={localFilters.zeitrahmen === 'benutzerdefiniert'}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, zeitrahmen: e.target.value }))}
                  className="w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Benutzerdefinierte Zeitrahmen</span>
              </label>

              {/* Date pickers for custom range */}
              {localFilters.zeitrahmen === 'benutzerdefiniert' && (
                <div className="flex items-center gap-3 mt-3 ml-6">
                  <div className="flex-1">
                    <label className="block text-xs text-neutral-500 mb-1">Von</label>
                    <input
                      type="date"
                      value={localFilters.datumVon}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, datumVon: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-neutral-500 mb-1">Bis</label>
                    <input
                      type="date"
                      value={localFilters.datumBis}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, datumBis: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Speichern
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AufgabenFilterDialog;
