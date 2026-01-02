import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/layout';
import { CalendarView } from '../features/calendar/components';
import { useCalendar } from '../contexts/calendar-context';

const daysData_OLD = [
  // Week 1
  { day: 1, isCurrentMonth: true, isOutOfRange: true },
  {
    day: 2,
    entries: [
      { label: 'Vertragsrecht', variant: 'primary', progress: '3/3', title: 'Tagesthema' },
    ],
  },
  {
    day: 3,
    entries: [
      { label: 'Vertragsrecht', variant: 'primary', progress: '1/3', title: 'Tagesthema' },
      { isAdd: true },
    ],
  },
  { day: 4, entries: [{ isAdd: true }] },
  {
    day: 5,
    entries: [
      { label: 'Klausur', variant: 'gray', progress: '2/3', title: 'Titel' },
      { label: 'Wiederholung', variant: 'gray', progress: '1/3' },
    ],
  },
  { day: 6, entries: [{ label: 'Frei', variant: 'gray', progress: '3/3' }] },
  { day: 7, entries: [{ label: 'Frei', variant: 'gray', progress: '3/3' }] },
  // Week 2
  { day: 8, entries: [{ isAdd: true }] },
  { day: 9, entries: [{ isAdd: true }] },
  { day: 10, entries: [{ isAdd: true }] },
  { day: 11, entries: [{ isAdd: true }] },
  {
    day: 12,
    entries: [
      { label: 'Klausur', variant: 'gray', progress: '2/3', title: 'Titel' },
      { label: 'Wiederholung', variant: 'gray', progress: '1/3' },
    ],
  },
  { day: 13, entries: [{ label: 'Frei', variant: 'gray', progress: '3/3' }] },
  { day: 14, entries: [{ label: 'Frei', variant: 'gray', progress: '3/3' }] },
  // Week 3
  { day: 15, entries: [{ isAdd: true }] },
  { day: 16, entries: [{ isAdd: true }] },
  { day: 17, entries: [{ isAdd: true }] },
  { day: 18, entries: [{ isAdd: true }] },
  {
    day: 19,
    entries: [
      { label: 'Klausur', variant: 'gray', progress: '2/3', title: 'Titel' },
      { label: 'Wiederholung', variant: 'gray', progress: '1/3' },
    ],
  },
  { day: 20, entries: [{ label: 'Frei', variant: 'gray', progress: '3/3' }] },
  { day: 21, entries: [{ label: 'Frei', variant: 'gray', progress: '3/3' }] },
  // Week 4
  { day: 22, entries: [{ isAdd: true }] },
  { day: 23, entries: [{ isAdd: true }] },
  { day: 24, entries: [{ isAdd: true }] },
  { day: 25, entries: [{ isAdd: true }] },
  {
    day: 26,
    entries: [
      { label: 'Klausur', variant: 'gray', progress: '2/3', title: 'Titel' },
      { label: 'Wiederholung', variant: 'gray', progress: '1/3' },
    ],
  },
  { day: 27, entries: [{ label: 'Frei', variant: 'gray', progress: '3/3' }] },
  { day: 28, entries: [{ label: 'Frei', variant: 'gray', progress: '3/3' }] },
  // Week 5 (spillover)
  { day: 29, entries: [{ isAdd: true }] },
  { day: 30, entries: [{ isAdd: true }] },
  { day: 1, isCurrentMonth: false, entries: [{ isAdd: true }] },
  { day: 2, isCurrentMonth: false, entries: [{ isAdd: true }] },
  { day: 3, isCurrentMonth: false, entries: [{ label: 'Klausur', variant: 'gray', progress: '2/3', title: 'Titel' }] },
  { day: 4, isCurrentMonth: false, entries: [{ label: 'Frei', variant: 'gray', progress: '3/3' }] },
  { day: 5, isCurrentMonth: false, entries: [{ label: 'Frei', variant: 'gray', progress: '3/3' }] },
];

const weekDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const Badge = ({ label, variant = 'neutral' }) => {
  const styles = {
    primary: 'bg-blue-900 text-blue-50',
    neutral: 'bg-neutral-100 text-neutral-500',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${styles[variant] || styles.neutral}`}>
      {label}
    </span>
  );
};

const DayCell = ({ day, isCurrentMonth = true, isOutOfRange = false, entries = [] }) => {
  const muted = !isCurrentMonth || isOutOfRange;
  return (
    <div className={`min-h-28 p-2.5 border border-neutral-200 border-t-0 ${muted ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-2 mb-2">
        <span className="text-sm font-light text-neutral-900">{day}</span>
      </div>

      <div className="space-y-2">
        {entries.map((entry, idx) => {
          if (entry.isAdd) {
            return (
              <div
                key={idx}
                className="h-7 px-2.5 bg-neutral-100 rounded flex items-center text-xs text-neutral-400"
              >
                +
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="px-2.5 py-2 bg-white rounded border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.label && <Badge label={entry.label} variant={entry.variant} />}
                  {entry.progress && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold text-neutral-400 border border-neutral-100">
                      {entry.progress}
                    </span>
                  )}
                </div>
              </div>
              {entry.title && (
                <p className="text-sm font-light text-neutral-900 leading-4">{entry.title}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MonthCalendar = () => {
  const [searchParams] = useSearchParams();
  const { contentPlans } = useCalendar();

  // Determine initial date:
  // 1. From URL param ?date=YYYY-MM-DD
  // 2. From active content plan's start date
  // 3. Default to today
  const initialDate = useMemo(() => {
    // Check URL parameter first
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }

    // Check for active content plan
    const activePlan = contentPlans?.find(p => p.isActive);
    if (activePlan?.startDate) {
      const [year, month, day] = activePlan.startDate.split('-').map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }

    // Default to today
    return new Date();
  }, [searchParams, contentPlans]);

  return (
    <div className="relative min-h-screen bg-white flex flex-col">
      <Header userInitials="CN" currentPage="kalender-monat" />

      <main className="px-8 pb-10 pt-4 flex-1">
        <div className="max-w-[1489px] mx-auto">
          {/* Use the new CalendarView component with day management dialog */}
          <CalendarView initialDate={initialDate} />
        </div>
      </main>
    </div>
  );
};

export default MonthCalendar;
