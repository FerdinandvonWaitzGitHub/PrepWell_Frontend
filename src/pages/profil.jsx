import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, SubHeader } from '../components/layout';
import { useAuth } from '../contexts/auth-context';
import { useAppMode } from '../contexts/appmode-context';
import { User, Mail, Calendar, Shield, Pencil, Check, X, ToggleLeft, ToggleRight, Trash2, LogOut, AlertTriangle } from 'lucide-react';

/**
 * ProfilPage - Benutzerprofil
 * User profile page with account information
 *
 * Figma: "Profil" (fehlend - neu implementiert)
 * Status: Implementiert
 */
const ProfilPage = () => {
  const navigate = useNavigate();
  const { user, getInitials, updateProfile, deleteAccount, signOut } = useAuth();
  const {
    isExamMode,
    modeDisplayText,
    isTrialMode,
    isSubscribed,
    trialDaysRemaining,
    toggleMode,
    canToggleMode,
    isModeManuallySet,
  } = useAppMode();

  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Get user data
  const initials = getInitials();
  const email = user?.email || 'Nicht angemeldet';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Benutzer';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Unbekannt';

  const handleEditName = () => {
    setEditName(displayName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (updateProfile && editName.trim()) {
      await updateProfile({ full_name: editName.trim() });
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditName('');
  };

  // BUG-016 FIX: Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // BUG-016 FIX: Handle delete account
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      const { error } = await deleteAccount();
      if (error) {
        setDeleteError(error.message);
        setIsDeleting(false);
      } else {
        // Account deleted, redirect to auth
        navigate('/auth');
      }
    } catch (err) {
      setDeleteError(err.message || 'Fehler beim Löschen des Accounts');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <Header userInitials={initials} currentPage="profil" />

      {/* Sub-Header */}
      <SubHeader title="Mein Profil" />

      {/* Main Content */}
      <main className="p-6.25 md:p-12.5">
        <div className="max-w-[700px] mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-md border border-neutral-200 p-6 mb-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6 mb-8">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary-200 text-neutral-900 text-2xl font-medium">
                {initials}
              </div>
              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-xl font-medium text-neutral-900 border border-neutral-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-md"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-medium text-neutral-900">{displayName}</h2>
                    <button
                      onClick={handleEditName}
                      className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-sm text-neutral-400 mt-1">{modeDisplayText}</p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-4 py-3 border-b border-neutral-100">
                <Mail className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">E-Mail</p>
                  <p className="text-sm text-neutral-900">{email}</p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-center gap-4 py-3 border-b border-neutral-100">
                <Calendar className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">Mitglied seit</p>
                  <p className="text-sm text-neutral-900">{createdAt}</p>
                </div>
              </div>

              {/* Account Status */}
              <div className="flex items-center gap-4 py-3 border-b border-neutral-100">
                <Shield className="w-5 h-5 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-xs text-neutral-400 mb-0.5">Kontostatus</p>
                  <div className="flex items-center gap-2">
                    {isTrialMode && (
                      <>
                        <span className="text-sm text-neutral-900">Kostenloser Probemonat</span>
                        <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                          {trialDaysRemaining} {trialDaysRemaining === 1 ? 'Tag' : 'Tage'} übrig
                        </span>
                      </>
                    )}
                    {isSubscribed && (
                      <>
                        <span className="text-sm text-neutral-900">
                          {isExamMode ? 'Examens-Abo' : 'Semester-Abo'}
                        </span>
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          Aktiv
                        </span>
                      </>
                    )}
                    {!isTrialMode && !isSubscribed && (
                      <span className="text-sm text-neutral-900">Kostenlos</span>
                    )}
                  </div>
                </div>
              </div>

              {/* App Mode Toggle */}
              <div className="flex items-center gap-4 py-3">
                {isExamMode ? (
                  <ToggleRight className="w-5 h-5 text-primary-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-neutral-400" />
                )}
                <div className="flex-1">
                  <p className="text-xs text-neutral-400 mb-0.5">App-Modus</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-900">
                      {isExamMode ? 'Examensmodus' : 'Normalmodus'}
                    </span>
                    {canToggleMode ? (
                      <button
                        onClick={toggleMode}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {isExamMode ? 'Zu Normalmodus wechseln' : 'Zu Examensmodus wechseln'}
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-400">
                        (Erstelle einen Lernplan für Examensmodus)
                      </span>
                    )}
                    {isModeManuallySet && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        Manuell
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-md border border-neutral-200 p-6">
            <h3 className="text-sm font-medium text-neutral-900 mb-4">Schnellaktionen</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/einstellungen')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors text-left"
              >
                <User className="w-4 h-4 text-neutral-500" />
                <span>Einstellungen bearbeiten</span>
              </button>
              {/* BUG-016 FIX: Sign out button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-neutral-500" />
                <span>Abmelden</span>
              </button>
            </div>
          </div>

          {/* BUG-016 FIX: Danger Zone */}
          <div className="bg-white rounded-md border border-red-200 p-6 mt-6">
            <h3 className="text-sm font-medium text-red-600 mb-4">Gefahrenzone</h3>
            <div className="space-y-2">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Konto löschen</span>
                </button>
              ) : (
                <div className="p-4 bg-red-50 rounded-md">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Bist du sicher?
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Diese Aktion löscht alle deine lokalen Daten und meldet dich ab.
                        Für die vollständige Kontolöschung kontaktiere bitte den Support.
                      </p>
                    </div>
                  </div>
                  {deleteError && (
                    <p className="text-xs text-red-600 mb-3">{deleteError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-3 py-2 text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50"
                      disabled={isDeleting}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="flex-1 px-3 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Wird gelöscht...' : 'Ja, löschen'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-8 pt-8 border-t border-neutral-200">
            <p className="text-sm text-neutral-500 text-center">
              © 2026 PrepWell GmbH - Impressum & Datenschutzerklärung
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default ProfilPage;
