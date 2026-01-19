import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Centralized Providers
import { AppProviders } from './providers';

// Auth hook for protected routes
import { useAuth } from './contexts/auth-context';

// Error Boundary for route-level errors
import { ErrorBoundary } from './components/error';

// Eagerly loaded pages (critical path)
import DashboardPage from './pages/dashboard';
import AuthPage from './pages/Auth';

// Lazily loaded pages (code-splitting)
const LernplanPage = lazy(() => import('./pages/lernplaene'));
const CalendarWeekPage = lazy(() => import('./pages/calendar-week'));
const CalendarMonthPage = lazy(() => import('./pages/calendar-month'));
const VerwaltungLeistungenPage = lazy(() => import('./pages/verwaltung-leistungen'));
const VerwaltungAufgabenPage = lazy(() => import('./pages/verwaltung-aufgaben'));
const EinstellungenPage = lazy(() => import('./pages/einstellungen'));
const ProfilPage = lazy(() => import('./pages/profil'));
const MentorPage = lazy(() => import('./pages/mentor'));
const CheckInPage = lazy(() => import('./pages/checkin'));
const OnboardingPage = lazy(() => import('./pages/onboarding'));
const PendingApprovalPage = lazy(() => import('./pages/pending-approval'));

// Lernplan Wizard (large, code-split)
const LernplanWizardPage = lazy(() => import('./features/lernplan-wizard').then(m => ({ default: m.LernplanWizardPage })));

// Themenliste Editor (T22)
const ThemenlisteEditorPage = lazy(() => import('./pages/themenliste-editor'));

/**
 * Loading fallback for lazy-loaded components
 */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-neutral-500">Laden...</span>
      </div>
    </div>
  );
}

/**
 * Wrapper for lazy-loaded routes with Suspense and Error Boundary
 */
function LazyRoute({ children }) {
  return (
    <ErrorBoundary title="Seitenfehler" showHomeButton={true}>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

/**
 * Protected Route wrapper - redirects to auth if not logged in
 * T14: Also checks approval status
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, isApproved, approvalLoading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // T14: Show loading while checking approval status
  if (approvalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // T14: Redirect to pending approval if not approved
  if (isApproved === false) {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
}

/**
 * Home component - redirects to auth if not logged in
 * T14: Also checks approval status
 */
function HomePage() {
  const { isAuthenticated, loading, isApproved, approvalLoading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // T14: Show loading while checking approval status
  if (approvalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // T14: Redirect to pending approval if not approved
  if (isApproved === false) {
    return <Navigate to="/pending-approval" replace />;
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
    element: <ProtectedRoute><LazyRoute><LernplanPage /></LazyRoute></ProtectedRoute>,
  },
  {
    path: '/lernplan/erstellen',
    element: <ProtectedRoute><LazyRoute><LernplanWizardPage /></LazyRoute></ProtectedRoute>,
  },
  {
    // T22: Themenliste Editor - neue Themenliste erstellen
    path: '/lernplan/themenliste/neu',
    element: <ProtectedRoute><LazyRoute><ThemenlisteEditorPage /></LazyRoute></ProtectedRoute>,
  },
  {
    path: '/kalender/woche',
    element: <ProtectedRoute><LazyRoute><CalendarWeekPage /></LazyRoute></ProtectedRoute>,
  },
  {
    path: '/kalender/monat',
    element: <ProtectedRoute><LazyRoute><CalendarMonthPage /></LazyRoute></ProtectedRoute>,
  },
  {
    path: '/verwaltung/leistungen',
    element: <ProtectedRoute><LazyRoute><VerwaltungLeistungenPage /></LazyRoute></ProtectedRoute>,
  },
  {
    path: '/verwaltung/aufgaben',
    element: <ProtectedRoute><LazyRoute><VerwaltungAufgabenPage /></LazyRoute></ProtectedRoute>,
  },
  {
    path: '/einstellungen',
    element: <ProtectedRoute><LazyRoute><EinstellungenPage /></LazyRoute></ProtectedRoute>,
  },
  {
    path: '/profil',
    element: <ProtectedRoute><LazyRoute><ProfilPage /></LazyRoute></ProtectedRoute>,
  },
  {
    path: '/mentor',
    element: <ProtectedRoute><LazyRoute><MentorPage /></LazyRoute></ProtectedRoute>,
  },
  {
    path: '/checkin',
    element: <ProtectedRoute><LazyRoute><CheckInPage /></LazyRoute></ProtectedRoute>,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    // T14: Pending approval screen for unapproved users
    path: '/pending-approval',
    element: <LazyRoute><PendingApprovalPage /></LazyRoute>,
  },
  {
    path: '/onboarding',
    element: <ProtectedRoute><LazyRoute><OnboardingPage /></LazyRoute></ProtectedRoute>,
  },
], {
  // T25: Opt-in to React Router v7 behavior
  future: {
    v7_startTransition: true,
  },
});

/**
 * AppRouter component
 *
 * Uses centralized AppProviders for cleaner provider composition.
 * Error boundaries are included at both app and route levels.
 */
export default function AppRouter() {
  return (
    <AppProviders>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </AppProviders>
  );
}
