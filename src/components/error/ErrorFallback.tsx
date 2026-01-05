import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary?: () => void;
  title?: string;
  showHomeButton?: boolean;
}

/**
 * Fallback UI displayed when an error is caught by ErrorBoundary
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
  title = 'Etwas ist schiefgelaufen',
  showHomeButton = true,
}: ErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>

        {/* Error Message */}
        <p className="text-gray-600 mb-6">
          {error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </p>

        {/* Error Details (Development only) */}
        {import.meta.env.DEV && error?.stack && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technische Details anzeigen
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-gray-700 overflow-auto max-h-40">
              {error.stack}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Erneut versuchen
            </button>
          )}

          {showHomeButton && (
            <button
              onClick={handleGoHome}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Home className="w-4 h-4" />
              Zur Startseite
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;
