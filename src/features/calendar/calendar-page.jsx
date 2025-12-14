import React from 'react';
import { Header } from '../../components/layout';
import { CalendarView } from './components';

/**
 * CalendarPage - Kalender Examensmodus (Monatsansicht)
 * Main page for the calendar view in exam mode
 *
 * This is the "ExamMod Kalender > Monatsansicht" page from Figma
 * Figma URL: https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2405-6508
 */
const CalendarPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header userInitials="CN" currentPage="kalender-monat" />

      {/* Main Content */}
      <main className="p-12.5">
        <div className="max-w-[1390px] mx-auto">
          <CalendarView initialDate={new Date(2025, 7, 1)} />
        </div>
      </main>
    </div>
  );
};

export default CalendarPage;
