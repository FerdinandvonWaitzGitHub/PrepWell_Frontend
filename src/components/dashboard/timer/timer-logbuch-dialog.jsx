import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { RECHTSGEBIET_LABELS, ALL_UNTERRECHTSGEBIETE } from '../../../data/unterrechtsgebiete-data';
import { useLogbuchSync, useLernplanMetadataSync } from '../../../hooks/use-supabase-sync';

/**
 * Close Icon
 */
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70">
    <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
  </svg>
);

/**
 * Arrow Left Icon
 */
const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10.67 3.33L5.33 8L10.67 12.67" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Check Icon
 */
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2.67 8L6 11.33L13.33 4" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Plus Icon
 */
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 3.33V12.67M3.33 8H12.67" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
  </svg>
);

/**
 * Trash Icon
 */
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4H14M5.33 4V2.67C5.33 2 5.87 1.33 6.67 1.33H9.33C10.13 1.33 10.67 2 10.67 2.67V4M12.67 4V13.33C12.67 14.13 12 14.67 11.33 14.67H4.67C3.87 14.67 3.33 14.13 3.33 13.33V4"
          stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
  </svg>
);

/**
 * Chevron Down Icon
 */
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
  </svg>
);

/**
 * Calculate duration between two times
 */
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '';

  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const startMins = toMinutes(startTime);
  const endMins = toMinutes(endTime);
  const diff = endMins - startMins;

  if (diff <= 0) return '';

  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
};

/**
 * Format today's date in German
 */
const formatTodayDate = () => {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()}. ${months[now.getMonth()]} ${now.getFullYear()}`;
};

/**
 * Split Dropdown Button for Rechtsgebiet selection
 */
const RechtsgebietDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo(() => {
    return Object.entries(RECHTSGEBIET_LABELS).map(([id, label]) => ({
      id,
      label
    }));
  }, []);

  const selectedLabel = useMemo(() => {
    const found = options.find(opt => opt.id === value);
    return found?.label || 'Auswählen...';
  }, [value, options]);

  return (
    <div className="relative">
      <div className="inline-flex justify-start items-start">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="h-9 px-4 py-2 bg-white rounded-tl-lg rounded-bl-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-neutral-200
                     flex justify-start items-center gap-2 cursor-pointer hover:bg-neutral-50 transition-colors"
        >
          <span className="text-neutral-500 text-sm font-normal font-['DM_Sans'] leading-5">
            {selectedLabel}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 px-2 py-2 bg-white rounded-tr-lg rounded-br-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border-r border-t border-b border-neutral-200
                     flex justify-center items-center hover:bg-neutral-50 transition-colors"
        >
          <ChevronDownIcon />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[180px]">
          {options.map(option => (
            <button
              key={option.id}
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 transition-colors
                         ${value === option.id ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-700'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * TimerLogbuchDialog - Manual time tracking log matching Figma design
 * Uses Supabase sync for data persistence
 */
const TimerLogbuchDialog = ({ open, onOpenChange }) => {
  // Supabase sync hooks
  const { data: allEntries, save: saveAllEntries } = useLogbuchSync();
  const { lernplanMetadata } = useLernplanMetadataSync();

  // Local state for today's entries (editable)
  const [entries, setEntries] = useState([]);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Load today's entries when dialog opens
  useEffect(() => {
    if (open) {
      const todayEntries = allEntries.filter(entry => entry.date === today);
      if (todayEntries.length > 0) {
        setEntries(todayEntries);
      } else {
        // Start with one empty entry for new entries
        setEntries([{ startTime: '', endTime: '', rechtsgebiet: '' }]);
      }
    }
  }, [open, allEntries, today]);

  // Get learning goal from Lernplan metadata (synced via Supabase)
  const learningGoal = useMemo(() => {
    if (lernplanMetadata?.hoursPerDay) {
      const hours = Math.floor(lernplanMetadata.hoursPerDay);
      const mins = Math.round((lernplanMetadata.hoursPerDay - hours) * 60);
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    // Default based on blocksPerDay (each block = 2 hours)
    if (lernplanMetadata?.blocksPerDay) {
      const hours = lernplanMetadata.blocksPerDay * 2;
      return `${hours}h`;
    }
    return '8h'; // Default fallback
  }, [lernplanMetadata]);

  // Calculate total learning time
  const totalLearningTime = useMemo(() => {
    let totalMinutes = 0;
    entries.forEach(entry => {
      if (entry.startTime && entry.endTime) {
        const toMinutes = (time) => {
          const [h, m] = time.split(':').map(Number);
          return h * 60 + m;
        };
        const diff = toMinutes(entry.endTime) - toMinutes(entry.startTime);
        if (diff > 0) totalMinutes += diff;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}min`;
  }, [entries]);

  const handleUpdateEntry = useCallback((index, field, value) => {
    setEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleRemoveEntry = useCallback((index) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddEntry = useCallback(() => {
    setEntries(prev => [
      ...prev,
      { startTime: '', endTime: '', rechtsgebiet: '' }
    ]);
  }, []);

  const handleBack = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(async () => {
    // Save entries via Supabase sync (replaces today's entries)
    try {
      // Filter out today's old entries and add the updated ones
      const otherDaysEntries = allEntries.filter(entry => entry.date !== today);

      const todayEntries = entries
        .filter(e => e.startTime && e.endTime && e.rechtsgebiet)
        .map(entry => ({
          ...entry,
          date: today,
          id: entry.id || `logbuch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));

      // Save all entries (Supabase + localStorage fallback)
      await saveAllEntries([...otherDaysEntries, ...todayEntries]);

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving logbuch entries:', error);
    }
  }, [entries, allEntries, today, saveAllEntries, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
        <div
          className="p-6 relative bg-white rounded-[10px] shadow-lg outline outline-1 outline-offset-[-1px] outline-neutral-200
                     inline-flex flex-col justify-center items-start gap-14 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
            <h2 className="self-stretch text-neutral-900 text-lg font-light font-['DM_Sans'] leading-4">
              Logbuch
            </h2>
            <p className="text-neutral-500 text-sm font-normal font-['DM_Sans'] leading-5">
              {formatTodayDate()}
            </p>
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center items-start gap-2">
            {/* Summary Card */}
            <div className="self-stretch p-4 bg-neutral-50/50 rounded-lg flex flex-col justify-center items-start gap-4">
              <div className="self-stretch inline-flex justify-start items-start gap-7">
                <span className="text-neutral-900 text-sm font-medium font-['DM_Sans'] leading-4">
                  Gesamte Lernzeit heute
                </span>
                <span className="text-right text-neutral-900 text-lg font-light font-['DM_Sans'] leading-4">
                  {totalLearningTime}
                </span>
              </div>
              <div className="self-stretch inline-flex justify-start items-start gap-7">
                <span className="text-neutral-900 text-sm font-medium font-['DM_Sans'] leading-4">
                  Lernziel {new Date().toLocaleDateString('de-DE', { weekday: 'long' })}
                </span>
                <span className="text-right text-neutral-900 text-lg font-light font-['DM_Sans'] leading-4">
                  {learningGoal}
                </span>
              </div>
            </div>

            {/* Entries Table */}
            <div className="pr-3.5 py-3.5 bg-white inline-flex justify-start items-start gap-5">
              {/* Von Column */}
              <div className="bg-white inline-flex flex-col justify-start items-start gap-5">
                <div className="h-6 flex flex-col justify-center items-start">
                  <span className="text-neutral-900 text-sm font-medium font-['DM_Sans'] leading-5">Von</span>
                </div>
                {entries.map((entry, index) => (
                  <input
                    key={`start-${index}`}
                    type="time"
                    value={entry.startTime}
                    onChange={(e) => handleUpdateEntry(index, 'startTime', e.target.value)}
                    className="h-9 px-3.5 bg-white rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-neutral-200
                               text-neutral-500 text-sm font-normal font-['DM_Sans'] leading-5"
                  />
                ))}
              </div>

              {/* Arrow Column */}
              <div className="w-9 bg-white inline-flex flex-col justify-start items-start gap-5">
                <div className="w-6 h-6" />
                {entries.map((_, index) => (
                  <div key={`arrow-${index}`} className="self-stretch h-9 px-2.5 flex flex-col justify-center items-center">
                    <span className="text-neutral-500 text-sm font-normal font-['DM_Sans'] leading-5">→</span>
                  </div>
                ))}
              </div>

              {/* Bis Column */}
              <div className="bg-white inline-flex flex-col justify-start items-start gap-5">
                <div className="h-6 flex flex-col justify-center items-start">
                  <span className="text-neutral-900 text-sm font-medium font-['DM_Sans'] leading-5">Bis</span>
                </div>
                {entries.map((entry, index) => (
                  <input
                    key={`end-${index}`}
                    type="time"
                    value={entry.endTime}
                    onChange={(e) => handleUpdateEntry(index, 'endTime', e.target.value)}
                    className="h-9 px-3.5 bg-white rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-neutral-200
                               text-neutral-500 text-sm font-normal font-['DM_Sans'] leading-5"
                  />
                ))}
              </div>

              {/* Duration Column */}
              <div className="bg-white inline-flex flex-col justify-center items-start gap-5">
                <div className="w-6 h-6" />
                {entries.map((entry, index) => (
                  <div key={`duration-${index}`} className="self-stretch h-9 px-2.5 flex flex-col justify-center items-center">
                    <span className="text-neutral-500 text-sm font-normal font-['DM_Sans'] leading-5">
                      {calculateDuration(entry.startTime, entry.endTime)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rechtsgebiet Column */}
              <div className="bg-white inline-flex flex-col justify-start items-start gap-5">
                <div className="h-6 flex flex-col justify-center items-start">
                  <span className="text-neutral-900 text-sm font-medium font-['DM_Sans'] leading-5">Rechtsgebiet</span>
                </div>
                {entries.map((entry, index) => (
                  <RechtsgebietDropdown
                    key={`rg-${index}`}
                    value={entry.rechtsgebiet}
                    onChange={(value) => handleUpdateEntry(index, 'rechtsgebiet', value)}
                  />
                ))}
              </div>

              {/* Delete Column */}
              <div className="bg-white inline-flex flex-col justify-center items-start gap-5">
                <div className="w-6 h-6" />
                {entries.map((_, index) => (
                  <button
                    key={`delete-${index}`}
                    onClick={() => handleRemoveEntry(index)}
                    className="self-stretch h-9 px-2.5 flex flex-col justify-center items-center hover:text-red-500 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                ))}
              </div>
            </div>

            {/* Add Session Button */}
            <button
              onClick={handleAddEntry}
              className="h-8 bg-white inline-flex justify-center items-center gap-2 text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <PlusIcon />
              <span className="text-xs font-medium font-['DM_Sans'] leading-4">Session nachtragen</span>
            </button>
          </div>

          {/* Footer */}
          <div className="self-stretch h-10 inline-flex justify-between items-end">
            <button
              onClick={handleBack}
              className="px-5 py-2.5 rounded-3xl outline outline-1 outline-offset-[-1px] outline-neutral-200
                         inline-flex justify-center items-center gap-2 hover:bg-neutral-50 transition-colors"
            >
              <ArrowLeftIcon />
              <span className="text-neutral-900 text-sm font-light font-['DM_Sans'] leading-5">Zurück</span>
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-slate-600 rounded-3xl
                         inline-flex justify-center items-center gap-2 hover:bg-slate-700 transition-colors"
            >
              <span className="text-white text-sm font-light font-['DM_Sans'] leading-5">Fertig</span>
              <CheckIcon />
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="w-4 h-4 absolute right-4 top-4 rounded-sm hover:bg-neutral-100 flex items-center justify-center"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </>
  );
};

export default TimerLogbuchDialog;
