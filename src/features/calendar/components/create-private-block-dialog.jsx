import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose
} from '../../../components/ui/dialog';
import Button from '../../../components/ui/button';
import { CheckIcon } from '../../../components/ui/icon';

/**
 * Create Private Block Dialog Component
 * Dialog for creating new private appointments/events
 */
const CreatePrivateBlockDialog = ({
  open,
  onOpenChange,
  date,
  onSave,
  initialTime = null, // Optional: wenn vom Wochenansicht-Klick
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');

  // Reset form when dialog opens
  useEffect(() => {
    if (open && date) {
      setTitle('');
      setDescription('');
      setStartDate(formatDateForInput(date));
      setStartTime(initialTime || '09:00');
      setEndDate(formatDateForInput(date));
      // Set end time 1 hour after start
      const startHour = parseInt((initialTime || '09:00').split(':')[0]);
      const endHour = Math.min(startHour + 1, 23);
      setEndTime(`${endHour.toString().padStart(2, '0')}:00`);
    }
  }, [open, date, initialTime]);

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDateDisplay = (date) => {
    if (!date) return '';
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${weekdays[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Check if block spans multiple days
  const isMultiDay = () => {
    if (!startDate || !endDate) return false;
    return startDate !== endDate;
  };

  // Generate time options in 5-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Save handler
  const handleSave = () => {
    if (!date || !onSave) return;
    onSave(date, {
      id: `private-${Date.now()}`,
      title: title || 'Privater Termin',
      blockType: 'private',
      blockSize: 1,
      description,
      startDate,
      startTime,
      endDate,
      endTime,
      isMultiDay: isMultiDay()
    });
    onOpenChange(false);
  };

  // Cancel handler
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-md max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle className="text-lg font-light">Neuer privater Termin</DialogTitle>
          <DialogDescription>{formatDateDisplay(date)}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            {/* Titel */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titel eintragen..."
                autoFocus
                className="w-full h-9 px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-200 text-sm"
              />
            </div>

            {/* Start Date & Time */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900">Beginn</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    // Wenn Enddatum vor Startdatum, anpassen
                    if (e.target.value > endDate) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className="flex-1 h-9 px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-200 text-sm"
                />
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-24 h-9 px-2 py-1 bg-white rounded-lg shadow-sm border border-gray-200 text-sm"
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* End Date & Time */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900">Ende</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="flex-1 h-9 px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-200 text-sm"
                />
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-24 h-9 px-2 py-1 bg-white rounded-lg shadow-sm border border-gray-200 text-sm"
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Beschreibung */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900">Beschreibung (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschreibung eintragen..."
                rows={3}
                className="w-full px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-sm resize-none"
              />
            </div>

            {/* Multi-day indicator */}
            {isMultiDay() && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  Dieser Termin erstreckt sich über mehrere Tage und wird in der Wochenansicht oben angezeigt.
                </p>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter className="justify-between">
          <Button variant="default" onClick={handleCancel} className="rounded-3xl">
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="rounded-3xl gap-2"
          >
            Erstellen
            <CheckIcon size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePrivateBlockDialog;
