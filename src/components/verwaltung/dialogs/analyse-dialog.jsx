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

/**
 * AnalyseDialog - Dialog for configuring performance analysis view
 */
const AnalyseDialog = ({ open, onOpenChange, onApply }) => {
  // Analysis settings
  const [settings, setSettings] = useState({
    groupBy: 'subject', // 'subject' or 'semester'
    startDate: '',
    endDate: '',
    weightByEcts: true
  });

  // Reset settings when dialog opens
  useEffect(() => {
    if (open) {
      setSettings({
        groupBy: 'subject',
        startDate: '',
        endDate: '',
        weightByEcts: true
      });
    }
  }, [open]);

  const handleApply = () => {
    onApply(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-md">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Ansicht der Leistungsanalyse bearbeiten</DialogTitle>
          <DialogDescription>
            Passe die Darstellung deiner Leistungsanalyse an.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Group By Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900">Analyse nach</label>

            {/* Subject Option */}
            <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="groupBy"
                value="subject"
                checked={settings.groupBy === 'subject'}
                onChange={(e) => setSettings(prev => ({ ...prev, groupBy: e.target.value }))}
                className="mt-0.5 w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Fach</span>
                <p className="text-xs text-gray-500 mt-0.5">Leistungen je Fach.</p>
              </div>
            </label>

            {/* Semester Option */}
            <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="groupBy"
                value="semester"
                checked={settings.groupBy === 'semester'}
                onChange={(e) => setSettings(prev => ({ ...prev, groupBy: e.target.value }))}
                className="mt-0.5 w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Semester</span>
                <p className="text-xs text-gray-500 mt-0.5">Leistungen je Semester.</p>
              </div>
            </label>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900">Zeitrahmen festlegen</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">Beginn</label>
                <input
                  type="date"
                  value={settings.startDate}
                  onChange={(e) => setSettings(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">Ende</label>
                <input
                  type="date"
                  value={settings.endDate}
                  onChange={(e) => setSettings(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
              </div>
            </div>
          </div>

          {/* ECTS Weighting Toggle */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700">Noten nach ECTS gewichten</span>
            <button
              type="button"
              onClick={() => setSettings(prev => ({ ...prev, weightByEcts: !prev.weightByEcts }))}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                settings.weightByEcts ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  settings.weightByEcts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={handleApply}>
            Anwenden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnalyseDialog;
