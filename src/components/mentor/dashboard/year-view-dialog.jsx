import { useState, useMemo } from 'react';
import { useStatistics } from '../../../hooks/useStatistics';

/**
 * MonthHeatmap - Calendar grid for a single month
 * Shows productivity levels per day with colored cells
 */
const MonthHeatmap = ({ year, month, data = {} }) => {
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  // Generate calendar grid for the month
  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get day of week for first day (0 = Sunday, adjust to Monday = 0)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const weeks = [];
    let currentWeek = [];

    // Add empty cells for days before the first
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = data[dateKey] || { score: 0 };

      currentWeek.push({
        day,
        dateKey,
        score: dayData.score || 0
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill remaining days in last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [year, month, data]);

  // Get color class based on score
  const getColorClass = (score) => {
    if (!score || score === 0) return 'bg-gray-100';
    if (score >= 90) return 'bg-gray-900';
    if (score >= 70) return 'bg-gray-600';
    if (score >= 50) return 'bg-gray-400';
    if (score >= 30) return 'bg-gray-300';
    return 'bg-gray-200';
  };

  return (
    <div className="w-80 p-5 bg-white rounded-[10px] border border-gray-200 inline-flex flex-col justify-start items-end gap-2.5">
      {/* Month name */}
      <div className="self-stretch inline-flex justify-start items-center gap-1.5">
        <div className="text-gray-900 text-lg font-light leading-4">
          {monthNames[month]}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2">
        {calendarWeeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className="w-72 h-9 inline-flex justify-between items-start overflow-hidden"
          >
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`w-9 h-9 rounded-[10px] ${
                  day ? getColorClass(day.score) : ''
                }`}
                title={day ? `${day.day}. ${monthNames[month]}: ${day.score}%` : ''}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * YearViewDialog - Full-screen overlay showing yearly productivity heatmap
 */
const YearViewDialog = ({ open, onClose }) => {
  const [selectedMetric, setSelectedMetric] = useState('productivity');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { dailyPerformance = {} } = useStatistics();

  // Available years (current year and previous 2 years)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  // Metrics options
  const metrics = [
    { id: 'productivity', label: 'Produktivität' },
    { id: 'lernzeit', label: 'Lernzeit' },
    { id: 'wellscore', label: 'Well Score' }
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      {/* Header */}
      <div className="px-12 py-2 flex justify-between items-center">
        <div className="w-24 h-9 flex flex-col justify-center items-center">
          <span className="text-xl font-semibold text-gray-900">PrepWell</span>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-normal">
          CN
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 pb-12 flex flex-col items-center gap-6">
        <div className="w-full max-w-[1400px] pl-7 flex justify-start items-start">
          <div className="flex-1 flex flex-col items-center gap-9">
            {/* Title Section */}
            <div className="self-stretch min-h-12 flex flex-col items-center gap-7">
              <div className="w-full max-w-[1389px] flex flex-col items-center gap-2.5">
                <div className="self-stretch py-[5px] flex justify-center items-center gap-2">
                  <div className="flex-1 text-center text-gray-900 text-5xl font-extralight leading-[48px]">
                    Das ist dein Jahr, Celina.
                  </div>
                </div>
                <div className="w-[900px] text-center text-gray-500 text-sm font-light leading-5">
                  Deine Produktivität auf einen Blick. Dunklere Felder bedeuten höhere Aktivität.
                </div>
              </div>

              {/* Filters */}
              <div className="self-stretch flex justify-center items-center gap-9">
                {/* Metric Dropdown */}
                <div className="flex flex-col gap-3">
                  <div className="flex">
                    <select
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value)}
                      className="h-9 px-4 py-2 bg-white rounded-lg border border-gray-300 text-gray-900 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      {metrics.map(metric => (
                        <option key={metric.id} value={metric.id}>
                          {metric.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <span className="text-gray-500 text-sm font-light leading-5">
                  im Jahr
                </span>

                {/* Year Dropdown */}
                <div className="flex flex-col gap-3">
                  <div className="flex">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="h-9 px-4 py-2 bg-white rounded-lg border border-gray-300 text-gray-900 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="self-stretch h-px bg-gray-200" />

            {/* Month Grid - 3 rows of 4 months */}
            <div className="self-stretch flex flex-col items-center gap-10">
              {/* First Row: Jan - Apr */}
              <div className="w-full flex justify-center items-start gap-6">
                {[0, 1, 2, 3].map(month => (
                  <MonthHeatmap
                    key={month}
                    year={selectedYear}
                    month={month}
                    data={dailyPerformance}
                  />
                ))}
              </div>

              {/* Second Row: May - Aug */}
              <div className="w-full flex justify-center items-start gap-6">
                {[4, 5, 6, 7].map(month => (
                  <MonthHeatmap
                    key={month}
                    year={selectedYear}
                    month={month}
                    data={dailyPerformance}
                  />
                ))}
              </div>

              {/* Third Row: Sep - Dec */}
              <div className="w-full flex justify-center items-start gap-6">
                {[8, 9, 10, 11].map(month => (
                  <MonthHeatmap
                    key={month}
                    year={selectedYear}
                    month={month}
                    data={dailyPerformance}
                  />
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-sm">Weniger</span>
              <div className="flex gap-1">
                <div className="w-6 h-6 bg-gray-100 rounded" />
                <div className="w-6 h-6 bg-gray-200 rounded" />
                <div className="w-6 h-6 bg-gray-300 rounded" />
                <div className="w-6 h-6 bg-gray-400 rounded" />
                <div className="w-6 h-6 bg-gray-600 rounded" />
                <div className="w-6 h-6 bg-gray-900 rounded" />
              </div>
              <span className="text-gray-500 text-sm">Mehr</span>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="self-stretch px-7 flex justify-start items-end gap-2.5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-gray-300 flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-900">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-gray-900 text-sm font-light leading-5">
              Zurück zum Mentor
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default YearViewDialog;
