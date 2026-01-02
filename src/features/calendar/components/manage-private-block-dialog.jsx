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
import { TrashIcon, CheckIcon, ChevronDownIcon } from '../../../components/ui/icon';

// Repeat type options
const repeatTypeOptions = [
  { id: 'daily', name: 'Täglich' },
  { id: 'weekly', name: 'Wöchentlich' },
  { id: 'monthly', name: 'Monatlich' },
  { id: 'custom', name: 'Benutzerdefiniert' },
];

// Weekday options
const weekdayOptions = [
  { id: 0, short: 'So', name: 'Sonntag' },
  { id: 1, short: 'Mo', name: 'Montag' },
  { id: 2, short: 'Di', name: 'Dienstag' },
  { id: 3, short: 'Mi', name: 'Mittwoch' },
  { id: 4, short: 'Do', name: 'Donnerstag' },
  { id: 5, short: 'Fr', name: 'Freitag' },
  { id: 6, short: 'Sa', name: 'Samstag' },
];

/**
 * Manage Private Block Dialog Component
 * Dialog for viewing and editing private appointments/events
 * Supports series blocks with "Nur diesen" vs. "Gesamte Serie" options
 */
const ManagePrivateBlockDialog = ({
  open,
  onOpenChange,
  date,
  block,
  onSave,
  onDelete,
  onDeleteSeries,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');

  // Repeat settings
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatType, setRepeatType] = useState('weekly');
  const [repeatCount, setRepeatCount] = useState(20);
  const [customDays, setCustomDays] = useState([1, 3, 5]);
  const [isRepeatTypeOpen, setIsRepeatTypeOpen] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Series action state
  const [showSeriesChoice, setShowSeriesChoice] = useState(false);
  const [seriesAction, setSeriesAction] = useState(null); // 'delete' or 'edit'

  // Load block data when dialog opens
  useEffect(() => {
    if (open && block) {
      setTitle(block.title || '');
      setDescription(block.description || '');
      setStartDate(block.startDate || formatDateForInput(date));
      setStartTime(block.startTime || '09:00');
      setEndDate(block.endDate || formatDateForInput(date));
      setEndTime(block.endTime || '10:00');
      // Load repeat settings
      setRepeatEnabled(block.repeatEnabled || false);
      setRepeatType(block.repeatType || 'weekly');
      setRepeatCount(block.repeatCount || 20);
      setCustomDays(block.customDays || [1, 3, 5]);
      setIsRepeatTypeOpen(false);
      setShowDeleteConfirm(false);
      setShowSeriesChoice(false);
      setSeriesAction(null);
    } else if (open && date) {
      // New block
      setTitle('');
      setDescription('');
      setStartDate(formatDateForInput(date));
      setStartTime('09:00');
      setEndDate(formatDateForInput(date));
      setEndTime('10:00');
      // Reset repeat settings
      setRepeatEnabled(false);
      setRepeatType('weekly');
      setRepeatCount(20);
      setCustomDays([1, 3, 5]);
      setIsRepeatTypeOpen(false);
      setShowDeleteConfirm(false);
      setShowSeriesChoice(false);
      setSeriesAction(null);
    }
  }, [open, block, date]);

  // Check if block is part of a series
  const isSeriesBlock = block?.seriesId != null;

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

  // Toggle custom day
  const toggleCustomDay = (dayId) => {
    setCustomDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId);
      } else {
        return [...prev, dayId].sort((a, b) => a - b);
      }
    });
  };

  // Get repeat type name
  const getRepeatTypeName = () => {
    return repeatTypeOptions.find(opt => opt.id === repeatType)?.name || 'Wöchentlich';
  };

  // Calculate duration and start hour
  const calculateDuration = () => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return Math.max(0.5, (endMinutes - startMinutes) / 60);
  };

  const calculateStartHour = () => {
    const [startH, startM] = startTime.split(':').map(Number);
    return startH + startM / 60;
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
      isMultiDay: isMultiDay(),
      // Time calculations
      hasTime: true,
      startHour: calculateStartHour(),
      duration: calculateDuration(),
      // Repeat settings
      repeatEnabled,
      repeatType: repeatEnabled ? repeatType : null,
      repeatCount: repeatEnabled ? repeatCount : null,
      customDays: repeatEnabled && repeatType === 'custom' ? customDays : null,
    });
    onOpenChange(false);
  };

  // Delete handler - shows series choice if applicable
  const handleDeleteClick = () => {
    if (isSeriesBlock) {
      setSeriesAction('delete');
      setShowSeriesChoice(true);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  // Delete single block
  const handleDeleteSingle = () => {
    if (onDelete && block) {
      onDelete(date, block.id);
      onOpenChange(false);
    }
  };

  // Delete entire series
  const handleDeleteEntireSeries = () => {
    if (onDeleteSeries && block?.seriesId) {
      onDeleteSeries(block.seriesId);
      onOpenChange(false);
    } else if (onDelete && block) {
      // Fallback to single delete if series delete not available
      onDelete(date, block.id);
      onOpenChange(false);
    }
  };

  // Handle series choice selection
  const handleSeriesChoice = (choice) => {
    if (seriesAction === 'delete') {
      if (choice === 'single') {
        handleDeleteSingle();
      } else if (choice === 'series') {
        handleDeleteEntireSeries();
      }
    }
    setShowSeriesChoice(false);
    setSeriesAction(null);
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
              <label className="text-sm font-medium text-neutral-900">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titel eintragen..."
                className="w-full h-9 px-3 py-1 bg-white rounded-lg shadow-sm border border-neutral-200 text-sm"
              />
            </div>

            {/* Start Date & Time */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-900">Beginn</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 h-9 px-3 py-1 bg-white rounded-lg shadow-sm border border-neutral-200 text-sm"
                />
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-24 h-9 px-2 py-1 bg-white rounded-lg shadow-sm border border-neutral-200 text-sm"
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* End Date & Time */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-900">Ende</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="flex-1 h-9 px-3 py-1 bg-white rounded-lg shadow-sm border border-neutral-200 text-sm"
                />
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-24 h-9 px-2 py-1 bg-white rounded-lg shadow-sm border border-neutral-200 text-sm"
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Beschreibung */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-900">Beschreibung (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschreibung eintragen..."
                rows={3}
                className="w-full px-3 py-2 bg-white rounded-lg shadow-sm border border-neutral-200 text-sm resize-none"
              />
            </div>

            {/* Wiederholung */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatEnabled}
                  onChange={(e) => setRepeatEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span className="text-sm font-medium text-neutral-900">Termin wiederholen</span>
              </label>

              {repeatEnabled && (
                <div className="space-y-4 pl-8">
                  <div className="space-y-2">
                    <label className="text-sm text-neutral-600">Wiederholung</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsRepeatTypeOpen(!isRepeatTypeOpen)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 text-left"
                      >
                        <span className="text-sm text-neutral-900">{getRepeatTypeName()}</span>
                        <ChevronDownIcon size={16} className={`text-neutral-400 transition-transform ${isRepeatTypeOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isRepeatTypeOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
                          {repeatTypeOptions.map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => { setRepeatType(opt.id); setIsRepeatTypeOpen(false); }}
                              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg ${
                                repeatType === opt.id ? 'bg-neutral-100 font-medium' : ''
                              }`}
                            >
                              {opt.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {repeatType === 'custom' && (
                    <div className="space-y-2">
                      <label className="text-sm text-neutral-600">An diesen Tagen</label>
                      <div className="flex flex-wrap gap-2">
                        {weekdayOptions.map(day => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleCustomDay(day.id)}
                            className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                              customDays.includes(day.id) ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                          >
                            {day.short}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm text-neutral-600">Anzahl Wiederholungen</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={repeatCount}
                        onChange={(e) => setRepeatCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                        className="w-24 px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm text-center"
                      />
                      <span className="text-sm text-neutral-600">mal</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Series indicator */}
            {isSeriesBlock && (
              <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                <p className="text-sm text-violet-700">
                  🔄 Dieser Termin ist Teil einer Serie. Beim Löschen kannst du wählen, ob nur dieser Termin oder die gesamte Serie gelöscht werden soll.
                </p>
              </div>
            )}

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
              showSeriesChoice ? (
                // Series choice dialog
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">
                    {seriesAction === 'delete' ? 'Was möchtest du löschen?' : 'Was bearbeiten?'}
                  </span>
                  <Button
                    variant="default"
                    onClick={() => handleSeriesChoice('single')}
                    className="rounded-3xl"
                  >
                    Nur diesen
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleSeriesChoice('series')}
                    className="rounded-3xl text-red-600 hover:bg-red-50"
                  >
                    Gesamte Serie
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => { setShowSeriesChoice(false); setSeriesAction(null); }}
                    className="rounded-3xl"
                  >
                    Abbrechen
                  </Button>
                </div>
              ) : showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Wirklich löschen?</span>
                  <Button
                    variant="default"
                    onClick={handleDeleteSingle}
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
                  onClick={handleDeleteClick}
                  className="rounded-3xl gap-2"
                >
                  {isSeriesBlock ? 'Termin löschen (Serie)' : 'Termin löschen'}
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
