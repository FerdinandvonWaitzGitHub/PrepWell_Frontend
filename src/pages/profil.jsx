import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, SubHeader } from '../components/layout';
import { useAuth } from '../contexts/auth-context';
import { useAppMode } from '../contexts/appmode-context';
import { User, Mail, Calendar, Shield, Pencil, Check, X } from 'lucide-react';

/**
 * ProfilPage - Benutzerprofil
 * User profile page with account information
 *
 * Figma: "Profil" (fehlend - neu implementiert)
 * Status: Implementiert
 */
const ProfilPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, getInitials, updateProfile } = useAuth();
  const { isExamMode, modeDisplayText, isTrialMode, isSubscribed, trialDaysRemaining } = useAppMode();

  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');

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
              <div className="flex items-center gap-4 py-3">
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
