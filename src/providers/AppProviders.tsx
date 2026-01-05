import { ReactNode } from 'react';

// Context Providers
import { AuthProvider } from '../contexts/auth-context';
import { StudiengangProvider } from '../contexts/studiengang-context';
import { UnterrechtsgebieteProvider } from '../contexts';
import { CalendarProvider } from '../contexts/calendar-context';
import { AppModeProvider } from '../contexts/appmode-context';
import { TimerProvider } from '../contexts/timer-context';
import { MentorProvider } from '../contexts/mentor-context';
import { ExamsProvider } from '../contexts/exams-context';
import { UebungsklausurenProvider } from '../contexts/uebungsklausuren-context';
import { CheckInProvider } from '../contexts/checkin-context';
import { OnboardingProvider } from '../contexts/onboarding-context';

// Error Boundary
import { ErrorBoundary } from '../components/error';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Core Providers - Essential for app functionality
 * Auth must be first, followed by data providers
 */
function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StudiengangProvider>
        <UnterrechtsgebieteProvider>
          <CalendarProvider>
            <AppModeProvider>{children}</AppModeProvider>
          </CalendarProvider>
        </UnterrechtsgebieteProvider>
      </StudiengangProvider>
    </AuthProvider>
  );
}

/**
 * Feature Providers - Specific feature functionality
 * These can be loaded after core providers
 */
function FeatureProviders({ children }: { children: ReactNode }) {
  return (
    <OnboardingProvider>
      <TimerProvider>
        <ExamsProvider>
          <UebungsklausurenProvider>
            <MentorProvider>
              <CheckInProvider>{children}</CheckInProvider>
            </MentorProvider>
          </UebungsklausurenProvider>
        </ExamsProvider>
      </TimerProvider>
    </OnboardingProvider>
  );
}

/**
 * AppProviders - Centralized provider composition
 *
 * Hierarchy:
 * 1. ErrorBoundary (catches all errors)
 * 2. CoreProviders (Auth, Studiengang, Calendar, AppMode)
 * 3. FeatureProviders (Timer, Exams, Mentor, CheckIn, etc.)
 *
 * @example
 * <AppProviders>
 *   <RouterProvider router={router} />
 * </AppProviders>
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary
      title="Anwendungsfehler"
      onError={(error, errorInfo) => {
        // Log to error tracking service in production
        if (import.meta.env.PROD) {
          console.error('App Error:', error, errorInfo);
          // TODO: Send to error tracking service (e.g., Sentry)
        }
      }}
    >
      <CoreProviders>
        <FeatureProviders>{children}</FeatureProviders>
      </CoreProviders>
    </ErrorBoundary>
  );
}

export default AppProviders;
