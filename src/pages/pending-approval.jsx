import { useNavigate } from 'react-router-dom';
import { Clock, Mail, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import { useState } from 'react';

/**
 * PendingApproval page
 * Shown to users who have registered but haven't been approved yet by an admin.
 * This is part of the User Approval System (Option 3).
 */
export default function PendingApproval() {
  const { user, signOut, checkApprovalStatus, getFullName } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const isApproved = await checkApprovalStatus();
      if (isApproved) {
        // Redirect to home if now approved
        navigate('/');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-950">PrepWell</h1>
        </div>

        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">
            Freischaltung ausstehend
          </h2>
          <p className="text-neutral-600">
            Hallo {getFullName() || 'User'}! Dein Account wurde erfolgreich erstellt
            und wartet auf Freischaltung durch einen Administrator.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Was passiert als Nächstes?</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li>Ein Administrator prüft deine Registrierung</li>
                <li>Du erhältst eine E-Mail nach der Freischaltung</li>
                <li>Danach kannst du PrepWell vollständig nutzen</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Account Info */}
        {user?.email && (
          <div className="bg-neutral-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-neutral-500">Angemeldet als:</p>
            <p className="font-medium text-neutral-800">{user.email}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {checking ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Status erneut prüfen
              </>
            )}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full bg-neutral-100 text-neutral-700 py-2.5 rounded-lg font-medium hover:bg-neutral-200 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
          <p className="text-sm text-neutral-500">
            Fragen? Kontaktiere uns unter{' '}
            <a href="mailto:team@prepwell.de" className="text-gray-900 hover:underline">
              team@prepwell.de
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
