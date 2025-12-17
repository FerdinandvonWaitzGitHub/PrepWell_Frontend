import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Context Providers
import { UnterrechtsgebieteProvider } from './contexts';
import { CalendarProvider } from './contexts/calendar-context';
import { TimerProvider } from './contexts/timer-context';

// Pages
import DashboardPage from './pages/dashboard';
import LernplanPage from './pages/lernplaene';
import CalendarWeekPage from './pages/calendar-week';
import CalendarMonthPage from './pages/calendar-month';
import VerwaltungLeistungenPage from './pages/verwaltung-leistungen';
import VerwaltungAufgabenPage from './pages/verwaltung-aufgaben';
import EinstellungenPage from './pages/einstellungen';
import MentorPage from './pages/mentor';

// Lernplan Wizard
import { LernplanWizardPage } from './features/lernplan-wizard';

/**
 * Router configuration for PrepWell WebApp
 * Based on Figma pages structure
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/lernplan',
    element: <LernplanPage />,
  },
  {
    path: '/lernplan/erstellen',
    element: <LernplanWizardPage />,
  },
  {
    path: '/kalender/woche',
    element: <CalendarWeekPage />,
  },
  {
    path: '/kalender/monat',
    element: <CalendarMonthPage />,
  },
  {
    path: '/verwaltung/leistungen',
    element: <VerwaltungLeistungenPage />,
  },
  {
    path: '/verwaltung/aufgaben',
    element: <VerwaltungAufgabenPage />,
  },
  {
    path: '/einstellungen',
    element: <EinstellungenPage />,
  },
  {
    path: '/mentor',
    element: <MentorPage />,
  },
]);

/**
 * AppRouter component
 */
export default function AppRouter() {
  return (
    <UnterrechtsgebieteProvider>
      <CalendarProvider>
        <TimerProvider>
          <RouterProvider router={router} />
        </TimerProvider>
      </CalendarProvider>
    </UnterrechtsgebieteProvider>
  );
}
