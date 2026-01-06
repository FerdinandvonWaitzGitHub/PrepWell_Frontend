import { useState, useRef, useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 4: Tagesblöcke festlegen
 * User defines how many learning blocks per day
 * Based on Figma: Schritt_4_body
 */

/**
 * Chevron Down Icon
 */
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/**
 * Warning Icon
 */
const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const Step4Tagesbloecke = () => {
  const { blocksPerDay, startDate, endDate, bufferDays, vacationDays, updateWizardData } = useWizard();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const blockOptions = [1, 2, 3, 4]; // Max 4 slots per day

  // Calculate blocks based on calendar days (weekStructure is configured in Step 5)
  // Using 5-day week assumption for the estimate
  const calculateStats = () => {
    if (!startDate || !endDate) return { blocksPerWeek: 0, totalBlocks: 0 };

    const start = new Date(startDate);
    const end = new Date(endDate);
    const calendarDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Estimate based on 5 learning days per week (before Step 5 configuration)
    const estimatedLearningDaysPerWeek = 5;
    const blocksPerWeek = estimatedLearningDaysPerWeek * blocksPerDay;

    // Calculate total blocks based on calendar days estimate
    const netCalendarDays = Math.max(0, calendarDays - (bufferDays ?? 0) - (vacationDays ?? 0));
    // Estimate ~71% of calendar days are weekdays (5/7)
    const estimatedLearningDays = Math.round(netCalendarDays * (5 / 7));
    const totalBlocks = estimatedLearningDays * blocksPerDay;

    return { blocksPerWeek, totalBlocks };
  };

  const { blocksPerWeek, totalBlocks } = calculateStats();

  const handleSelect = (value) => {
    updateWizardData({ blocksPerDay: value });
    setIsDropdownOpen(false);
  };

  return (
    <div>
      <StepHeader
        step={4}
        title="In wie viele Blöcke soll ein Tag eingeteilt sein."
        description="Wir bieten dir folgende Optionen, um deinen Lernplan zu erstellen oder auszuwählen."
      />

      <div className="flex flex-col items-center gap-7 py-7">
        {/* Blocks per Day Selector Card */}
        <div className="p-5 bg-white rounded-[10px] border border-neutral-200">
          <div className="flex items-center gap-5">
            <span className="text-lg font-light text-neutral-900">
              Blöcke pro Tag
            </span>

            {/* Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center"
              >
                {/* Number Display */}
                <div className="h-9 pl-5 pr-4 py-2 bg-neutral-50 rounded-l-lg border border-neutral-200 flex items-center justify-center">
                  <span className="text-sm font-light text-neutral-900">
                    {blocksPerDay}
                  </span>
                </div>
                {/* Chevron Button */}
                <div className="w-9 h-9 bg-neutral-50 rounded-r-lg border-t border-r border-b border-neutral-200 flex items-center justify-center text-neutral-900">
                  <ChevronDownIcon />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg z-10 min-w-[80px]">
                  {blockOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg ${
                        option === blocksPerDay ? 'bg-blue-50 text-blue-600 font-medium' : 'text-neutral-900'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Info */}
        <div className="w-full max-w-[520px] p-4 bg-blue-50/50 rounded-lg flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-neutral-900">
              Blöcke pro Woche (bei 5 Lerntagen)
            </span>
            <span className="text-lg font-light text-neutral-900">
              {blocksPerWeek}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-neutral-900">
              Blöcke gesamt (geschätzt)
            </span>
            <span className="text-lg font-light text-neutral-900">
              ~{totalBlocks}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Exakte Werte werden nach Festlegung der Wochenstruktur (Schritt 5) berechnet.
          </p>
        </div>

        {/* Warning Box - shown when no blocks selected */}
        {blocksPerDay < 1 && (
          <div className="px-4 py-3 bg-white rounded-[10px] border border-red-100 flex items-start gap-3">
            <div className="pt-0.5 text-red-500">
              <WarningIcon />
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-500 leading-5">
                Achtung
              </h4>
              <p className="text-sm font-normal text-red-500 leading-5">
                Bitte wähle für jeden Tag einen Typ aus.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step4Tagesbloecke;
