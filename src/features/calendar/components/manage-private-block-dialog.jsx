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
import { TrashIcon, CheckIcon } from '../../../components/ui/icon';

/**
 * Manage Private Block Dialog Component
 * Dialog for viewing and editing private appointments/events
 */
const ManagePrivateBlockDialog = ({
  open,
  onOpenChange,
  date,
  block,
  onSave,
  onDelete,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load block data when dialog opens
  useEffect(() => {
    if (open && block) {
      setTitle(block.title || '');
      setDescription(block.description || '');
      setStartDate(block.startDate || formatDateForInput(date));
      setStartTime(block.startTime || '09:00');
      setEndDate(block.endDate || formatDateForInput(date));
      setEndTime(block.endTime || '10:00');
      setShowDeleteConfirm(false);
    } else if (open && date) {
      // New block
      setTitle('');
      setDescription('');
      setStartDate(formatDateForInput(date));
      setStartTime('09:00');
      setEndDate(formatDateForInput(date));
      setEndTime('10:00');
      setShowDeleteConfirm(false);
    }
  }, [open, block, date]);

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

  // Save and close handler
  const handleSaveAndClose = () => {
    if (!date || !onSave) return;
    onSave(date, {
      ...block,
      id: block?.id || `private-${Date.now()}`,
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

  // Delete handler
  const handleDelete = () => {
    if (onDelete && block) {
      onDelete(date, block.id);
      onOpenChange(false);
    }
  };

  // Discard handler
  const handleDiscard = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-md max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle className="text-lg font-light">Privaten Termin verwalten</DialogTitle>
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
                  onChange={(e) => setStartDate(e.target.value)}
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
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={handleDiscard} className="rounded-3xl">
              Änderungen verwerfen
            </Button>
            {block && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Wirklich löschen?</span>
                  <Button
                    variant="default"
                    onClick={handleDelete}
                    className="rounded-3xl text-red-600 hover:bg-red-50"
                  >
                    Ja, löschen
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-3xl"
                  >
                    Abbrechen
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-3xl gap-2"
                >
                  Termin löschen
                  <TrashIcon size={16} />
                </Button>
              )
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleSaveAndClose}
            className="rounded-3xl gap-2"
          >
            Fertig
            <CheckIcon size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManagePrivateBlockDialog;
