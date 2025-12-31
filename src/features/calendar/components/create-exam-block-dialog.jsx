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
import { PlusIcon, MinusIcon, ChevronDownIcon } from '../../../components/ui/icon';
import { useUnterrechtsgebiete } from '../../../contexts';

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

// Fixed law areas (Rechtsgebiete)
const RECHTSGEBIETE = [
  { id: 'zivilrecht', name: 'Zivilrecht' },
  { id: 'oeffentliches-recht', name: 'Öffentliches Recht' },
  { id: 'strafrecht', name: 'Strafrecht' }
];

/**
 * Create Exam Block Dialog Component
 * Form for creating a new exam (Klausuren) block
 * Features a toggle to optionally add details (Rechtsgebiet, Unterrechtsgebiet)
 */
const CreateExamBlockDialog = ({ open, onOpenChange, date, onSave, availableSlots = 4 }) => {
  // Use central Unterrechtsgebiete context
  const {
    getUnterrechtsgebieteByRechtsgebiet,
    addUnterrechtsgebiet
  } = useUnterrechtsgebiete();

  // Toggle state for showing details
  const [showDetails, setShowDetails] = useState(false);

  // Form state
  const [blockSize, setBlockSize] = useState(1);
  const [selectedRechtsgebiet, setSelectedRechtsgebiet] = useState(null);
  const [selectedUnterrechtsgebiet, setSelectedUnterrechtsgebiet] = useState(null);

  // Time settings
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');

  // Repeat settings
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatType, setRepeatType] = useState('weekly');
  const [repeatCount, setRepeatCount] = useState(20);
  const [customDays, setCustomDays] = useState([1, 3, 5]);

  // Dropdown states
  const [isRechtsgebietOpen, setIsRechtsgebietOpen] = useState(false);
  const [isUnterrechtsgebietOpen, setIsUnterrechtsgebietOpen] = useState(false);
  const [isRepeatTypeOpen, setIsRepeatTypeOpen] = useState(false);

  // New Unterrechtsgebiet input
  const [isCreatingUnterrechtsgebiet, setIsCreatingUnterrechtsgebiet] = useState(false);
  const [newUnterrechtsgebietName, setNewUnterrechtsgebietName] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setShowDetails(false);
      setBlockSize(1);
      setSelectedRechtsgebiet(null);
      setSelectedUnterrechtsgebiet(null);
      setStartTime('09:00');
      setEndTime('11:00');
      setRepeatEnabled(false);
      setRepeatType('weekly');
      setRepeatCount(20);
      setCustomDays([1, 3, 5]);
      setIsRepeatTypeOpen(false);
      setIsCreatingUnterrechtsgebiet(false);
      setNewUnterrechtsgebietName('');
    }
  }, [open]);

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

  // Format date for display (e.g., "Montag, 1. August 2025")
  const formatDate = (date) => {
    if (!date) return '';
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${weekdays[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Get current Unterrechtsgebiete for selected Rechtsgebiet
  const getCurrentUnterrechtsgebiete = () => {
    if (!selectedRechtsgebiet) return [];
    return getUnterrechtsgebieteByRechtsgebiet(selectedRechtsgebiet.id);
  };

  // Add new Unterrechtsgebiet
  const handleAddUnterrechtsgebiet = () => {
    if (!newUnterrechtsgebietName.trim() || !selectedRechtsgebiet) return;

    const newItem = {
      id: `urg-${Date.now()}`,
      name: newUnterrechtsgebietName.trim()
    };

    addUnterrechtsgebiet(selectedRechtsgebiet.id, newItem);

    setNewUnterrechtsgebietName('');
    setIsCreatingUnterrechtsgebiet(false);
    setSelectedUnterrechtsgebiet(newItem);
  };

  const handleSave = () => {
    if (date && onSave) {
      const examData = {
        id: `exam-${Date.now()}`,
        title: selectedUnterrechtsgebiet?.name || 'Klausur',
        blockType: 'exam',
        blockSize: showDetails ? blockSize : 1,
        hasDetails: showDetails,
        progress: '0/1',
        // Time settings
        hasTime: true,
        startTime,
        endTime,
        startHour: calculateStartHour(),
        duration: calculateDuration(),
        // Repeat settings
        repeatEnabled,
        repeatType: repeatEnabled ? repeatType : null,
        repeatCount: repeatEnabled ? repeatCount : null,
        customDays: repeatEnabled && repeatType === 'custom' ? customDays : null,
      };

      // Add detail fields if toggle is on
      if (showDetails) {
        examData.rechtsgebiet = selectedRechtsgebiet;
        examData.unterrechtsgebiet = selectedUnterrechtsgebiet;
      }

      onSave(date, examData);
    }
    onOpenChange(false);
  };

  const handleDiscard = () => {
    onOpenChange(false);
  };

  // Check if form is valid for saving
  const isFormValid = () => {
    // If details toggle is off, always valid (simple exam block)
    if (!showDetails) return true;
    // If details toggle is on, need rechtsgebiet and unterrechtsgebiet
    return selectedRechtsgebiet && selectedUnterrechtsgebiet;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />

        {/* Header */}
        <DialogHeader>
          <DialogTitle>Neuen Klausurenblock hinzufügen</DialogTitle>
          <DialogDescription>{formatDate(date)}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Uhrzeit */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900">
              Uhrzeit <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-600">Von</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-600">Bis</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                />
              </div>
            </div>
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

          {/* Blockgröße Field - Only shown when details toggle is ON */}
          {showDetails && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900">
                Blockgröße <span className="text-xs text-neutral-500">({availableSlots} Slot{availableSlots !== 1 ? 's' : ''} verfügbar)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBlockSize(Math.max(1, blockSize - 1))}
                  disabled={blockSize <= 1}
                  className="p-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MinusIcon size={16} className="text-neutral-600" />
                </button>
                <span className="flex-1 text-center text-lg font-medium text-neutral-900">{blockSize}</span>
                <button
                  type="button"
                  onClick={() => setBlockSize(Math.min(availableSlots, blockSize + 1))}
                  disabled={blockSize >= availableSlots}
                  className="p-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon size={16} className="text-neutral-600" />
                </button>
              </div>
            </div>
          )}

          {/* Details Toggle */}
          <div className="flex items-start gap-3">
            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                showDetails ? 'bg-neutral-900' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  showDetails ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            {/* Toggle Label and Description */}
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">Details eintragen</p>
              <p className="text-sm text-neutral-500 mt-1">
                Aktiviere den Klausurenblock, um Details einzutragen. Die Klausur wird automatisch in deine Leistungen aufgenommen.
              </p>
            </div>
          </div>

          {/* Detail Fields - Only shown when toggle is ON */}
          {showDetails && (
            <div className="space-y-6 pt-4 border-t border-neutral-100">
              {/* Rechtsgebiet Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900">
                  Rechtsgebiet <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRechtsgebietOpen(!isRechtsgebietOpen);
                      setIsUnterrechtsgebietOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-left cursor-pointer"
                  >
                    <span className={`text-sm ${selectedRechtsgebiet ? 'text-neutral-900' : 'text-neutral-500'}`}>
                      {selectedRechtsgebiet?.name || 'Rechtsgebiet auswählen'}
                    </span>
                    <ChevronDownIcon size={16} className={`text-neutral-400 transition-transform ${isRechtsgebietOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isRechtsgebietOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
                      {RECHTSGEBIETE.map(rg => (
                        <button
                          key={rg.id}
                          type="button"
                          onClick={() => {
                            setSelectedRechtsgebiet(rg);
                            setSelectedUnterrechtsgebiet(null);
                            setIsRechtsgebietOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg ${
                            selectedRechtsgebiet?.id === rg.id ? 'bg-primary-50 text-neutral-900 font-medium' : 'text-neutral-700'
                          }`}
                        >
                          {rg.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Unterrechtsgebiet Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900">
                  Unterrechtsgebiet <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRechtsgebiet) {
                        setIsUnterrechtsgebietOpen(!isUnterrechtsgebietOpen);
                        setIsRechtsgebietOpen(false);
                      }
                    }}
                    disabled={!selectedRechtsgebiet}
                    className={`w-full flex items-center justify-between px-4 py-2 bg-white border border-neutral-200 rounded-lg transition-colors text-left ${
                      selectedRechtsgebiet ? 'hover:bg-neutral-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className={`text-sm ${selectedUnterrechtsgebiet ? 'text-neutral-900' : 'text-neutral-500'}`}>
                      {selectedUnterrechtsgebiet?.name || (selectedRechtsgebiet ? 'Unterrechtsgebiet auswählen' : 'Erst Rechtsgebiet wählen')}
                    </span>
                    <ChevronDownIcon size={16} className={`text-neutral-400 transition-transform ${isUnterrechtsgebietOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUnterrechtsgebietOpen && selectedRechtsgebiet && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {getCurrentUnterrechtsgebiete().length === 0 ? (
                        <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                          Noch keine Unterrechtsgebiete vorhanden
                        </div>
                      ) : (
                        getCurrentUnterrechtsgebiete().map(urg => (
                          <button
                            key={urg.id}
                            type="button"
                            onClick={() => {
                              setSelectedUnterrechtsgebiet(urg);
                              setIsUnterrechtsgebietOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg ${
                              selectedUnterrechtsgebiet?.id === urg.id ? 'bg-primary-50 text-neutral-900 font-medium' : 'text-neutral-700'
                            }`}
                          >
                            {urg.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Add new Unterrechtsgebiet */}
                {selectedRechtsgebiet && (
                  isCreatingUnterrechtsgebiet ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={newUnterrechtsgebietName}
                        onChange={(e) => setNewUnterrechtsgebietName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddUnterrechtsgebiet()}
                        placeholder="Name eingeben..."
                        autoFocus
                        className="flex-1 px-4 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                      <Button variant="primary" size="sm" onClick={handleAddUnterrechtsgebiet}>
                        Speichern
                      </Button>
                      <Button variant="default" size="sm" onClick={() => {
                        setIsCreatingUnterrechtsgebiet(false);
                        setNewUnterrechtsgebietName('');
                      }}>
                        Abbrechen
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCreatingUnterrechtsgebiet(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 bg-primary-100 border-2 border-primary-300 rounded-lg hover:bg-primary-200 transition-colors"
                    >
                      <PlusIcon size={16} className="text-neutral-900" />
                      <span className="text-sm font-medium text-neutral-900">+ Neues Unterrechtsgebiet erstellen</span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </DialogBody>

        {/* Footer */}
        <DialogFooter className="justify-between">
          <Button variant="default" onClick={handleDiscard}>
            Verwerfen
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isFormValid()}
          >
            Fertig
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExamBlockDialog;
