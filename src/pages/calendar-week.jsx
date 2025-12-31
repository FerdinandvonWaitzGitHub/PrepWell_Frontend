import { Header } from '../components/layout';
import { WeekView } from '../features/calendar/components';

/**
 * CalendarWeekPage - Kalender Wochenansicht
 * Calendar week view with time slots
 *
 * Figma: "✅ Kalender > Wochenansicht" (Node-ID: 2136:3140)
 * Status: ✅ Base layout implemented with placeholders
 */
const CalendarWeekPage = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <Header userInitials="CN" currentPage="kalender-woche" />

      {/* Main Content */}
      <main>
        <WeekView initialDate={new Date()} />
      </main>
    </div>
  );
};

export default CalendarWeekPage;
