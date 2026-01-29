import { useState, useEffect } from 'react';
import { X, Check, ChevronDown, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent
} from '../../ui/dialog';

// Available chart statistics with their categories
const CHART_STATISTICS = [
  // Lernzeit
  {
    id: 'lernzeit-per-day',
    label: 'Ø Lernzeit pro Lerntag',
    description: 'Durchschnittliche Lernzeit pro Tag mit Tendenz',
    category: 'Lernzeit',
    color: '#EA580C'
  },
  {
    id: 'lernzeit-per-week',
    label: 'Ø Lernzeit pro Woche',
    description: 'Durchschnittliche Lernzeit pro Woche',
    category: 'Lernzeit',
    color: '#0D9488'
  },
  {
    id: 'lernzeit-per-month',
    label: 'Ø Lernzeit pro Monat',
    description: 'Durchschnittliche Lernzeit pro Monat',
    category: 'Lernzeit',
    color: '#8B5CF6'
  },
  // Scores
  {
    id: 'prep-score',
    label: 'PrepScore',
    description: 'Dein Vorbereitungs-Score über Zeit',
    category: 'Scores',
    color: '#2563EB'
  },
  {
    id: 'well-score',
    label: 'WellScore',
    description: 'Dein Wohlbefindens-Score über Zeit',
    category: 'Scores',
    color: '#16A34A'
  },
  // Zeitpunkte & Muster
  {
    id: 'productive-hours',
    label: 'Produktivste Tageszeit',
    description: 'Zeitrahmen mit den meisten getrackten Sessions',
    category: 'Zeitpunkte & Muster',
    color: '#F59E0B'
  },
  {
    id: 'weekday-productivity',
    label: 'Produktivität pro Wochentag',
    description: 'Lernzeit pro Wochentag über 8 Wochen',
    category: 'Zeitpunkte & Muster',
    color: '#EC4899'
  },
  // Fächer/Rechtsgebiete
  {
    id: 'subject-distribution',
    label: 'Fächergewichtung',
    description: 'Verteilung der Lernzeit nach Rechtsgebiet',
    category: 'Fächer/Rechtsgebiete',
    color: '#10B981'
  },
  {
    id: 'subject-time-weekly',
    label: 'Zeit pro Rechtsgebiet/Woche',
    description: 'Durchschnittliche getrackte Zeit pro Rechtsgebiet',
    category: 'Fächer/Rechtsgebiete',
    color: '#6366F1'
  },
  // Aufgaben & Themen
  {
    id: 'task-completion-week',
    label: 'Aufgaben-Erledigungsrate (Woche)',
    description: 'Erledigungsrate aggregiert über 7 Tage',
    category: 'Aufgaben & Themen',
    color: '#14B8A6'
  },
  {
    id: 'task-completion-month',
    label: 'Aufgaben-Erledigungsrate (Monat)',
    description: 'Erledigungsrate aggregiert über 30 Tage',
    category: 'Aufgaben & Themen',
    color: '#F97316'
  },
  {
    id: 'tasks-per-day',
    label: 'Ø Aufgaben pro Tag',
    description: 'Durchschnittliche Aufgaben pro Lerntag',
    category: 'Aufgaben & Themen',
    color: '#84CC16'
  },
  // Konsistenz & Gewohnheiten
  {
    id: 'streak-history',
    label: 'Streak-Verlauf',
    description: 'Entwicklung der Lernstreaks über Zeit',
    category: 'Konsistenz & Gewohnheiten',
    color: '#22C55E'
  },
  {
    id: 'learning-days-week',
    label: 'Lerntage pro Woche',
    description: 'Anzahl aktiver Lerntage pro Woche',
    category: 'Konsistenz & Gewohnheiten',
    color: '#A855F7'
  },
  {
    id: 'dropout-rate',
    label: 'Ausfallquote vs. Fortschritt',
    description: 'Verhältnis ausgefallene/geplante Puffer',
    category: 'Konsistenz & Gewohnheiten',
    color: '#EF4444'
  },
  // Wiederholungen
  {
    id: 'repetition-blocks',
    label: 'Wiederholungs-Blöcke',
    description: 'Anzahl der Wiederholungsblöcke über Zeit',
    category: 'Wiederholungen',
    color: '#0EA5E9'
  },
  // Klausuren & Leistungen
  {
    id: 'exam-grades',
    label: 'Klausurnoten-Verlauf',
    description: 'Entwicklung der Klausurnoten',
    category: 'Klausuren & Leistungen',
    color: '#D946EF'
  },
  {
    id: 'exams-per-subject',
    label: 'Klausuren pro Rechtsgebiet',
    description: 'Anzahl Klausuren gruppiert nach Rechtsgebiet',
    category: 'Klausuren & Leistungen',
    color: '#F43F5E'
  },
  // Pomodoro & Timer
  {
    id: 'pomodoro-sessions',
    label: 'Pomodoro-Sessions',
    description: 'Anzahl der Pomodoro-Sessions pro Tag',
    category: 'Pomodoro & Timer',
    color: '#06B6D4'
  },
  {
    id: 'session-completion',
    label: 'Session-Abschlussrate',
    description: 'Prozent der abgeschlossenen Timer-Sessions',
    category: 'Pomodoro & Timer',
    color: '#65A30D'
  }
];

// Semester options
const SEMESTER_OPTIONS = [
  { id: 'all', label: 'Alle Semester' },
  { id: 'current', label: 'Aktuelles Semester' },
  { id: 'ws-2025', label: 'WS 2025/26' },
  { id: 'ss-2025', label: 'SS 2025' },
  { id: 'ws-2024', label: 'WS 2024/25' },
  { id: 'ss-2024', label: 'SS 2024' },
];

/**
 * ChartSelectionDialog - Dialog to configure chart display settings
 *
 * Figma Design: https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2658-8982
 *
 * Features:
 * - Select two graphs to display
 * - Choose time frame (semester or custom date range)
 *
 * @param {boolean} open - Dialog open state
 * @param {Function} onOpenChange - Dialog open state change callback
 * @param {Object} chartConfig - Current chart configuration
 * @param {Function} onConfigChange - Callback with new configuration
 */
const ChartSelectionDialog = ({
  open,
  onOpenChange,
  chartConfig = {},
  onConfigChange
}) => {
  const [firstGraph, setFirstGraph] = useState(chartConfig.firstGraph || 'prep-score');
  const [secondGraph, setSecondGraph] = useState(chartConfig.secondGraph || 'well-score');
  const [timeFrameType, setTimeFrameType] = useState(chartConfig.timeFrameType || 'custom');
  const [selectedSemester, setSelectedSemester] = useState(chartConfig.selectedSemester || 'current');
  const [startDate, setStartDate] = useState(chartConfig.startDate || '');
  const [endDate, setEndDate] = useState(chartConfig.endDate || '');

  // Dropdown open states
  const [firstGraphOpen, setFirstGraphOpen] = useState(false);
  const [secondGraphOpen, setSecondGraphOpen] = useState(false);
  const [semesterOpen, setSemesterOpen] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFirstGraph(chartConfig.firstGraph || 'prep-score');
      setSecondGraph(chartConfig.secondGraph || 'well-score');
      setTimeFrameType(chartConfig.timeFrameType || 'custom');
      setSelectedSemester(chartConfig.selectedSemester || 'current');
      setStartDate(chartConfig.startDate || '');
      setEndDate(chartConfig.endDate || '');
    }
  }, [open, chartConfig]);

  const handleSave = () => {
    onConfigChange?.({
      firstGraph,
      secondGraph,
      timeFrameType,
      selectedSemester,
      startDate,
      endDate
    });
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onOpenChange?.(false);
  };

  const getStatLabel = (statId) => {
    const stat = CHART_STATISTICS.find(s => s.id === statId);
    return stat?.label || statId;
  };

  const getSemesterLabel = (semesterId) => {
    const semester = SEMESTER_OPTIONS.find(s => s.id === semesterId);
    return semester?.label || semesterId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6 relative">
        {/* Close Icon */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 w-4 h-4 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-1.5 mb-6">
          <h2 className="text-lg font-light text-neutral-900 leading-none">
            Graphen anpassen
          </h2>
          <p className="text-sm font-normal text-neutral-500 leading-5">
            Wähle die Statistiken und den Zeitrahmen für die Graphen aus.
          </p>
        </div>

        {/* Content - Two Columns */}
        <div className="flex gap-12">
          {/* Left Column - Graph Selection */}
          <div className="flex flex-col gap-8">
            {/* First Graph */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-neutral-900">
                Erster Graph
              </label>
              <div className="relative w-[200px]">
                <button
                  onClick={() => setFirstGraphOpen(!firstGraphOpen)}
                  className="flex items-center justify-between w-full h-9 pl-4 pr-2 bg-white border border-neutral-200 rounded-lg shadow-sm hover:bg-neutral-50 transition-colors"
                >
                  <span className="text-sm font-medium text-neutral-900 truncate">
                    {getStatLabel(firstGraph)}
                  </span>
                  <ChevronDown className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                </button>

                {/* Dropdown */}
                {firstGraphOpen && (
                  <div className="absolute z-10 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg">
                    {CHART_STATISTICS.map(stat => (
                      <button
                        key={stat.id}
                        onClick={() => {
                          setFirstGraph(stat.id);
                          setFirstGraphOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 ${
                          firstGraph === stat.id ? 'bg-neutral-100 font-medium' : ''
                        }`}
                      >
                        {stat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Second Graph */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-neutral-900">
                Zweiter Graph
              </label>
              <div className="relative w-[200px]">
                <button
                  onClick={() => setSecondGraphOpen(!secondGraphOpen)}
                  className="flex items-center justify-between w-full h-9 pl-4 pr-2 bg-white border border-neutral-200 rounded-lg shadow-sm hover:bg-neutral-50 transition-colors"
                >
                  <span className="text-sm font-medium text-neutral-900 truncate">
                    {getStatLabel(secondGraph)}
                  </span>
                  <ChevronDown className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                </button>

                {/* Dropdown */}
                {secondGraphOpen && (
                  <div className="absolute z-10 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg">
                    {CHART_STATISTICS.map(stat => (
                      <button
                        key={stat.id}
                        onClick={() => {
                          setSecondGraph(stat.id);
                          setSecondGraphOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 ${
                          secondGraph === stat.id ? 'bg-neutral-100 font-medium' : ''
                        }`}
                      >
                        {stat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Time Frame */}
          <div className="flex flex-col gap-3 flex-1">
            <label className="text-sm font-medium text-neutral-900">
              Zeitrahmen
            </label>

            {/* Semester Option */}
            <button
              onClick={() => setTimeFrameType('semester')}
              className={`flex gap-3 p-4 rounded-lg border transition-colors text-left ${
                timeFrameType === 'semester'
                  ? 'border-neutral-900'
                  : 'border-neutral-200'
              }`}
            >
              {/* Radio */}
              <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
                timeFrameType === 'semester'
                  ? 'border-neutral-900'
                  : 'border-neutral-300'
              }`}>
                {timeFrameType === 'semester' && (
                  <div className="w-2 h-2 rounded-full bg-neutral-900" />
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1.5 flex-1">
                <span className={`text-sm font-medium leading-none ${
                  timeFrameType === 'semester' ? 'text-neutral-900' : 'text-neutral-500'
                }`}>
                  Semester
                </span>

                {/* Semester Dropdown */}
                <div className="relative mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeFrameType('semester');
                      setSemesterOpen(!semesterOpen);
                    }}
                    className="flex items-center gap-2 h-9 px-4 bg-white border border-neutral-200 rounded-lg shadow-sm hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-neutral-900">
                      {getSemesterLabel(selectedSemester)}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeFrameType('semester');
                      setSemesterOpen(!semesterOpen);
                    }}
                    className="absolute right-0 top-0 flex items-center justify-center w-9 h-9 bg-white border border-neutral-200 rounded-lg shadow-sm hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 text-neutral-600" />
                  </button>

                  {/* Dropdown */}
                  {semesterOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg">
                      {SEMESTER_OPTIONS.map(semester => (
                        <button
                          key={semester.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSemester(semester.id);
                            setSemesterOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 ${
                            selectedSemester === semester.id ? 'bg-neutral-100 font-medium' : ''
                          }`}
                        >
                          {semester.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Custom Date Range Option */}
            <button
              onClick={() => setTimeFrameType('custom')}
              className={`flex gap-3 p-4 rounded-lg border transition-colors text-left ${
                timeFrameType === 'custom'
                  ? 'border-neutral-900'
                  : 'border-neutral-200'
              }`}
            >
              {/* Radio */}
              <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
                timeFrameType === 'custom'
                  ? 'border-neutral-900'
                  : 'border-neutral-300'
              }`}>
                {timeFrameType === 'custom' && (
                  <div className="w-2 h-2 rounded-full bg-neutral-900" />
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col gap-3 flex-1">
                <span className={`text-sm font-medium leading-none ${
                  timeFrameType === 'custom' ? 'text-neutral-900' : 'text-neutral-500'
                }`}>
                  Benutzerdefinierte Zeitrahmen
                </span>

                {/* Date Pickers */}
                <div className="flex flex-col gap-4 w-[300px]">
                  {/* Start Date */}
                  <div className="flex items-center gap-2 h-9 px-3 bg-white border border-neutral-200 rounded-lg shadow-sm">
                    <Calendar className="w-5 h-5 text-neutral-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setTimeFrameType('custom');
                        setStartDate(e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Beginn auswählen"
                      className="flex-1 text-sm font-medium text-neutral-900 bg-transparent border-none focus:outline-none"
                    />
                  </div>

                  {/* End Date */}
                  <div className="flex items-center gap-2 h-9 px-3 bg-white border border-neutral-200 rounded-lg shadow-sm">
                    <Calendar className="w-5 h-5 text-neutral-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setTimeFrameType('custom');
                        setEndDate(e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Ende auswählen"
                      className="flex-1 text-sm font-medium text-neutral-900 bg-transparent border-none focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 mt-6">
          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            className="h-9 px-4 py-2 text-sm font-medium text-neutral-900 bg-white border border-neutral-200 rounded-lg shadow-sm hover:bg-neutral-50 transition-colors"
          >
            Abbrechen
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="h-9 px-4 py-2 flex items-center gap-2 text-sm font-medium text-red-50 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <span>Speichern</span>
            <Check className="w-5 h-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export the statistics list for use in other components
export { CHART_STATISTICS };
export default ChartSelectionDialog;
