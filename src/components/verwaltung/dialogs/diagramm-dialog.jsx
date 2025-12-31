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
 * DiagrammDialog - Dialog for configuring chart view settings
 */
const DiagrammDialog = ({ open, onOpenChange, onApply }) => {
  // Chart settings
  const [settings, setSettings] = useState({
    viewMode: 'custom', // 'custom' or 'total'
    startDate: '',
    endDate: ''
  });

  // Reset settings when dialog opens
  useEffect(() => {
    if (open) {
      setSettings({
        viewMode: 'custom',
        startDate: '',
        endDate: ''
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
          <DialogTitle>Ansicht des Diagramms ändern</DialogTitle>
          <DialogDescription>
            Wähle den Zeitrahmen für die Leistungsentwicklung.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* View Mode Selection */}
          <div className="space-y-3">
            {/* Custom Option */}
            <label className="flex items-start gap-3 p-3 bg-white border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="radio"
                name="viewMode"
                value="custom"
                checked={settings.viewMode === 'custom'}
                onChange={(e) => setSettings(prev => ({ ...prev, viewMode: e.target.value }))}
                className="mt-0.5 w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
              />
              <div>
                <span className="text-sm font-medium text-neutral-900">Benutzerdefiniert</span>
                <p className="text-xs text-neutral-500 mt-0.5">Zeitrahmen selbst festlegen.</p>
              </div>
            </label>

            {/* Total Study Option */}
            <label className="flex items-start gap-3 p-3 bg-white border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="radio"
                name="viewMode"
                value="total"
                checked={settings.viewMode === 'total'}
                onChange={(e) => setSettings(prev => ({ ...prev, viewMode: e.target.value }))}
                className="mt-0.5 w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
              />
              <div>
                <span className="text-sm font-medium text-neutral-900">Gesamtes Studium</span>
                <p className="text-xs text-neutral-500 mt-0.5">Semesterdurchschnitte über die Gesamtdauer anzeigen.</p>
              </div>
            </label>
          </div>

          {/* Date Range - Only shown when custom is selected */}
          {settings.viewMode === 'custom' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-900">Zeitrahmen festlegen</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500">Beginn auswählen</label>
                  <input
                    type="date"
                    value={settings.startDate}
                    onChange={(e) => setSettings(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500">Ende auswählen</label>
                  <input
                    type="date"
                    value={settings.endDate}
                    onChange={(e) => setSettings(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
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

export default DiagrammDialog;
