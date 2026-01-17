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
} from '../../../components/ui/dialog';
import Button from '../../../components/ui/button';
import { CheckIcon, ChevronDownIcon } from '../../../components/ui/icon';

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
 * Create Private Block Dialog Component
 * Dialog for creating new private appointments/events
 *
 * @param {string} mode - 'session' for time-based (Week/Dashboard), 'block' for position-based (Month)
 */
const CreatePrivateBlockDialog = ({
  open,
  onOpenChange,
  date,
  onSave,
  initialTime = null, // Optional: wenn vom Wochenansicht-Klick
  initialEndTime = null, // T4.1: Optional end time from drag-to-select
  availableBlocks = 4,
  mode = 'session' // 'session' = Uhrzeiten (Woche/Startseite), 'block' = Block-Größe (Monatsansicht)
}) => {
  const maxBlocks = availableBlocks;

  // Form state
  const [allocationSize, setAllocationSize] = useState(1); // For allocation mode (Month)
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
  // TICKET-10: Repeat end mode (count OR date)
  const [repeatEndMode, setRepeatEndMode] = useState('count'); // 'count' | 'date'
  const [repeatEndDate, setRepeatEndDate] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open && date) {
      setAllocationSize(1); // Reset block size for allocation mode
      setTitle('');
      setDescription('');
      setStartDate(formatDateForInput(date));
      setStartTime(initialTime || '09:00');
      setEndDate(formatDateForInput(date));
      // T4.1: Use initialEndTime if provided, otherwise calculate +1 hour from start
      if (initialEndTime) {
        setEndTime(initialEndTime);
      } else {
        const startHour = parseInt((initialTime || '09:00').split(':')[0]);
        const endHour = Math.min(startHour + 1, 23);
        setEndTime(`${endHour.toString().padStart(2, '0')}:00`);
      }
      // Reset repeat settings
      setRepeatEnabled(false);
      setRepeatType('weekly');
      setRepeatCount(20);
      setCustomDays([1, 3, 5]);
      setIsRepeatTypeOpen(false);
    }
  }, [open, date, initialTime, initialEndTime]);

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

  // Format date for input field (YYYY-MM-DD)
  // KA-002 FIX: Verwende lokale Zeit statt UTC
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

    const baseData = {
      id: `private-${Date.now()}`,
      title: title || 'Privater Termin',
      blockType: 'private',
      description,
      // Repeat settings
      repeatEnabled,
      repeatType: repeatEnabled ? repeatType : null,
      repeatCount: repeatEnabled && repeatEndMode === 'count' ? repeatCount : null,
      repeatEndMode: repeatEnabled ? repeatEndMode : null,
      repeatEndDate: repeatEnabled && repeatEndMode === 'date' ? repeatEndDate : null,
      customDays: repeatEnabled && repeatType === 'custom' ? customDays : null,
    };

    // Add mode-specific data
    if (mode === 'session') {
      // Session mode: time-based (Week/Dashboard)
      Object.assign(baseData, {
        blockSize: 1,
        startDate,
        startTime,
        endDate,
        endTime,
        isMultiDay: isMultiDay(),
        hasTime: true,
        startHour: calculateStartHour(),
        duration: calculateDuration(),
      });
    } else {
      // Allocation mode: position-based (Month)
      Object.assign(baseData, {
        blockSize: allocationSize,
        hasTime: false,
        isFromLernplan: false, // Manually created block
      });
    }

    onSave(date, baseData);
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
            {/* Block-Größe Field - Only in allocation mode (Month view) */}
            {mode === 'block' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-900">
                  Block-Größe <span className="text-xs text-neutral-500">({maxBlocks} Block{maxBlocks !== 1 ? 's' : ''} verfügbar)</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setAllocationSize(size)}
                      disabled={size > maxBlocks}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        allocationSize === size
                          ? 'bg-neutral-900 text-white'
                          : size > maxBlocks
                            ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {size} Block{size !== 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Titel */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-900">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titel eintragen..."
                autoFocus
                className="w-full h-9 px-3 py-1 bg-white rounded-lg shadow-sm border border-neutral-200 text-sm"
              />
            </div>

            {/* Start Date & Time - Only in session mode (Week/Dashboard) */}
            {mode === 'session' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-900">Beginn</label>
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
            )}

            {/* End Date & Time - Only in session mode (Week/Dashboard) */}
            {mode === 'session' && (
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
            )}

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

                  {/* TICKET-10: Repeat end mode tabs */}
                  <div className="space-y-3">
                    <label className="text-sm text-neutral-600">Wiederholen bis</label>
                    {/* Tab buttons */}
                    <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setRepeatEndMode('count')}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          repeatEndMode === 'count'
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                      >
                        Anzahl
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepeatEndMode('date')}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          repeatEndMode === 'date'
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                      >
                        Enddatum
                      </button>
                    </div>

                    {/* Count input (shown when repeatEndMode is 'count') */}
                    {repeatEndMode === 'count' && (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={repeatCount}
                          onChange={(e) => setRepeatCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                          className="w-24 px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm text-center"
                        />
                        <span className="text-sm text-neutral-600">Wiederholungen</span>
                      </div>
                    )}

                    {/* Date picker (shown when repeatEndMode is 'date') */}
                    {repeatEndMode === 'date' && (
                      <div className="flex items-center gap-3">
                        <input
                          type="date"
                          value={repeatEndDate}
                          min={date ? date.toISOString().split('T')[0] : ''}
                          onChange={(e) => setRepeatEndDate(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Multi-day indicator - Only in session mode */}
            {mode === 'session' && isMultiDay() && (
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
