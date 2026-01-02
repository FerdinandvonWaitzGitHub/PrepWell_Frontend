import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider, useAuth } from './contexts/auth-context';
import { UnterrechtsgebieteProvider } from './contexts';
import { CalendarProvider } from './contexts/calendar-context';
import { AppModeProvider } from './contexts/appmode-context';
import { TimerProvider } from './contexts/timer-context';
import { MentorProvider } from './contexts/mentor-context';
import { ExamsProvider } from './contexts/exams-context';
import { UebungsklausurenProvider } from './contexts/uebungsklausuren-context';
import { CheckInProvider } from './contexts/checkin-context';
import { OnboardingProvider } from './contexts/onboarding-context';

// Pages
import DashboardPage from './pages/dashboard';
import LernplanPage from './pages/lernplaene';
import CalendarWeekPage from './pages/calendar-week';
import CalendarMonthPage from './pages/calendar-month';
import VerwaltungLeistungenPage from './pages/verwaltung-leistungen';
import VerwaltungAufgabenPage from './pages/verwaltung-aufgaben';
import EinstellungenPage from './pages/einstellungen';
import ProfilPage from './pages/profil';
import MentorPage from './pages/mentor';
import CheckInPage from './pages/checkin';
import AuthPage from './pages/Auth';
import OnboardingPage from './pages/onboarding';

// Lernplan Wizard
import { LernplanWizardPage } from './features/lernplan-wizard';

/**
 * Protected Route wrapper - redirects to auth if not logged in
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

/**
 * Home component - redirects to auth if not logged in
 */
function HomePage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <DashboardPage />;
}

/**
 * Router configuration for PrepWell WebApp
 * Based on Figma pages structure
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/lernplan',
    element: <ProtectedRoute><LernplanPage /></ProtectedRoute>,
  },
  {
    path: '/lernplan/erstellen',
    element: <ProtectedRoute><LernplanWizardPage /></ProtectedRoute>,
  },
  {
    path: '/kalender/woche',
    element: <ProtectedRoute><CalendarWeekPage /></ProtectedRoute>,
  },
  {
    path: '/kalender/monat',
    element: <ProtectedRoute><CalendarMonthPage /></ProtectedRoute>,
  },
  {
    path: '/verwaltung/leistungen',
    element: <ProtectedRoute><VerwaltungLeistungenPage /></ProtectedRoute>,
  },
  {
    path: '/verwaltung/aufgaben',
    element: <ProtectedRoute><VerwaltungAufgabenPage /></ProtectedRoute>,
  },
  {
    path: '/einstellungen',
    element: <ProtectedRoute><EinstellungenPage /></ProtectedRoute>,
  },
  {
    path: '/profil',
    element: <ProtectedRoute><ProfilPage /></ProtectedRoute>,
  },
  {
    path: '/mentor',
    element: <ProtectedRoute><MentorPage /></ProtectedRoute>,
  },
  {
    path: '/checkin',
    element: <ProtectedRoute><CheckInPage /></ProtectedRoute>,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/onboarding',
    element: <ProtectedRoute><OnboardingPage /></ProtectedRoute>,
  },
]);

/**
 * AppRouter component
 */
export default function AppRouter() {
  return (
    <AuthProvider>
      <UnterrechtsgebieteProvider>
        <CalendarProvider>
          <AppModeProvider>
            <OnboardingProvider>
              <TimerProvider>
                <ExamsProvider>
                  <UebungsklausurenProvider>
                    <MentorProvider>
                      <CheckInProvider>
                        <RouterProvider router={router} />
                      </CheckInProvider>
                    </MentorProvider>
                  </UebungsklausurenProvider>
                </ExamsProvider>
              </TimerProvider>
            </OnboardingProvider>
          </AppModeProvider>
        </CalendarProvider>
      </UnterrechtsgebieteProvider>
    </AuthProvider>
  );
}
