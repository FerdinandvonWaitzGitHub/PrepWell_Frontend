import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppMode } from '../../contexts/appmode-context';
import { useAuth } from '../../contexts/auth-context';
import { useStudiengang } from '../../contexts/studiengang-context';
import { useMentor } from '../../contexts/mentor-context';
import {
  GraduationCap,
  BookOpen,
  User,
  Mail,
  Lock,
  Camera,
  Bell,
  Clock,
  Sun,
  Moon,
  Globe,
  Target,
  Calendar,
  Coffee,
  TrendingUp,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Layers,
  Scale,
  Info,
  Brain
} from 'lucide-react';
import { useCalendar } from '../../contexts/calendar-context';
import { RECHTSGEBIET_LABELS } from '../../data/unterrechtsgebiete-data';
import CustomSubjectsSection from './custom-subjects-section';

const STORAGE_KEY = 'prepwell_settings';

// All available Rechtsgebiete
const ALL_RECHTSGEBIETE = Object.keys(RECHTSGEBIET_LABELS);

const defaultSettings = {
  notifications: {
    emailEnabled: true,
    pushEnabled: false,
    remindersEnabled: true,
    reminderTime: '09:00',
  },
  learning: {
    dailyGoalHours: 4,
    preferredStartTime: '08:00',
    breakDuration: 15,
    pomodoroEnabled: true,
    pomodoroDuration: 25,
    // T5.1: Fortschrittsberechnung - 'aufgaben' = nur Aufgaben abhakbar, 'themen' = Themen UND Aufgaben abhakbar
    progressCalculation: 'aufgaben',
    // Dashboard Fortschrittsanzeige: 'both' = Zahlen + Balken, 'bar' = nur Balken, 'numbers' = nur Zahlen
    dashboardProgressDisplay: 'both',
  },
  display: {
    theme: 'light',
    language: 'de',
    timezone: 'Europe/Berlin',
  },
  jura: {
    chapterLevelEnabled: false, // Kapitel-Ebene zwischen Unterrechtsgebiet und Thema
    // Default: alle 4 Rechtsgebiete ausgewählt (ohne Querschnitt)
    selectedRechtsgebiete: ['zivilrecht', 'strafrecht', 'oeffentliches-recht'],
  },
  // TICKET-3: Check-in Einstellungen
  checkin: {
    checkInCount: 2, // 1 = nur Morgen-Check-in, 2 = Morgen- und Abend-Check-in
  },
};

const SettingsContent = ({ className = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showStudiengangSetupHint = searchParams.get('setup') === 'studiengang';

  const {
    isExamMode,
    isNormalMode,
    currentSemester,
    setSemester,
    modeDisplayText,
    toggleMode,
    canToggleMode,
    activeLernplaene,
  } = useAppMode();

  const {
    user,
    getFirstName,
    getLastName,
    updatePassword,
    isAuthenticated
  } = useAuth();

  const { flattenAllKapitel, archiveAndConvertToThemenliste } = useCalendar();
  const { studiengang, setStudiengang, studiengaenge, isJura, hasStudiengang } = useStudiengang();
  // FEAT-001: Get mentor activation status and functions
  const { isActivated: isMentorActivated, activateMentor, deactivateMentor } = useMentor();

  // Clear setup hint after studiengang is selected
  useEffect(() => {
    if (hasStudiengang && showStudiengangSetupHint) {
      setSearchParams({});
    }
  }, [hasStudiengang, showStudiengangSetupHint, setSearchParams]);

  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState(defaultSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Mode switch confirmation modal state
  const [showModeSwitchModal, setShowModeSwitchModal] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  // Load user data
  useEffect(() => {
    if (user) {
      setFirstName(getFirstName());
      setLastName(getLastName());
      setEmail(user.email || '');
    }
  }, [user, getFirstName, getLastName]);

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaveSuccess(true);
    setHasChanges(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancel = () => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    } else {
      setSettings(defaultSettings);
    }
    setHasChanges(false);
  };

  // Handler für Kapitel-Ebene Toggle mit Confirm-Dialog bei Deaktivierung
  const handleChapterLevelToggle = (newValue) => {
    if (!newValue && settings.jura?.chapterLevelEnabled) {
      // Deaktivierung: Confirm-Dialog zeigen
      const confirmed = window.confirm(
        'Möchten Sie die Kapitel-Ebene deaktivieren? Bestehende Kapitel werden aufgelöst und Themen direkt unter Unterrechtsgebiete verschoben.'
      );
      if (!confirmed) return;

      // Flatten-Funktion aus CalendarContext aufrufen
      flattenAllKapitel?.();
    }
    handleSettingChange('jura', 'chapterLevelEnabled', newValue);
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Passwort muss mindestens 6 Zeichen haben');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwörter stimmen nicht überein');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      setPasswordSuccess('Passwort erfolgreich geändert');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordDialog(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.message || 'Fehler beim Ändern des Passworts');
    } finally {
      setPasswordLoading(false);
    }
  };

  const semesters = Array.from({ length: 10 }, (_, i) => i + 1);

  // Handler for mode toggle - shows confirmation if switching to normal mode with active Lernplan
  const handleModeToggle = () => {
    // If switching from Exam to Normal and there's an active Lernplan, show warning
    if (isExamMode && activeLernplaene.length > 0) {
      setShowModeSwitchModal(true);
    } else {
      // No warning needed - just toggle
      toggleMode();
    }
  };

  // Confirm mode switch: archive Lernplan and switch to normal mode
  const confirmModeSwitch = async () => {
    // Archive Lernplan and convert to Themenliste
    // This extracts themes from calendar blocks and creates a ContentPlan
    await archiveAndConvertToThemenliste();
    // Now switch mode
    toggleMode();
    setShowModeSwitchModal(false);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">Einstellungen erfolgreich gespeichert</span>
        </div>
      )}

      {/* Studiengang Setup Hint Banner */}
      {(showStudiengangSetupHint || !hasStudiengang) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-800 font-medium">Studiengang auswählen</p>
            <p className="text-blue-700 text-sm mt-1">
              Bitte wähle deinen Studiengang aus, um die App-Bezeichnungen anzupassen.
              Du findest die Auswahl im Abschnitt &quot;Studium&quot; weiter unten.
            </p>
          </div>
        </div>
      )}

      {/* Lernmodus Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Lernmodus</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              {isExamMode ? (
                <GraduationCap className="w-5 h-5 text-red-500" />
              ) : (
                <BookOpen className="w-5 h-5 text-blue-500" />
              )}
              <div>
                <p className="text-sm font-medium text-neutral-900">Aktueller Modus</p>
                <p className="text-xs text-neutral-500 mt-1">{modeDisplayText}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                isExamMode
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {isExamMode ? 'Examen' : 'Normal'}
              </span>
              {/* Mode toggle button - always available */}
              {canToggleMode && (
                <button
                  onClick={handleModeToggle}
                  className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Wechseln
                </button>
              )}
            </div>
          </div>

          {isNormalMode && (
            <div className="py-3">
              <p className="text-sm font-medium text-neutral-900 mb-3">Semester auswählen</p>
              <div className="flex flex-wrap gap-2">
                {semesters.map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSemester(sem)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                      currentSemester === sem
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {sem}. Semester
                  </button>
                ))}
              </div>
            </div>
          )}

          {isExamMode && (
            <div className="py-3 bg-neutral-50 rounded-lg p-4">
              <p className="text-sm text-neutral-600">
                Du befindest dich im Examensmodus. Der Modus wird automatisch aktiviert,
                wenn ein aktiver Lernplan existiert.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Studium Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Studium
        </h3>

        <div className="space-y-4">
          {/* Studiengang Auswahl */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Studiengang</p>
                <p className="text-xs text-neutral-500">
                  Bestimmt die Bezeichnungen in der App
                </p>
              </div>
            </div>
            <select
              value={studiengang || ''}
              onChange={(e) => setStudiengang(e.target.value || null)}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">Bitte wählen...</option>
              {studiengaenge.map(sg => (
                <option key={sg.id} value={sg.id}>{sg.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* T-SET-1: Fächerfarben für Nicht-Juristen */}
      {!isJura && hasStudiengang && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Fächer
          </h3>
          <CustomSubjectsSection isJura={false} />
        </div>
      )}

      {/* Jura Section - nur bei Jura-Studiengang anzeigen */}
      {isJura && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Jura
          </h3>

          <div className="space-y-4">
            {/* Rechtsgebiete Auswahl */}
            <div className="py-3 border-b border-neutral-100">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Rechtsgebiete für Lernplan</p>
                  <p className="text-xs text-neutral-500">
                    Wähle die Rechtsgebiete, die im Lernplan-Wizard verwendet werden
                  </p>
                </div>
              </div>
              <div className="ml-8 space-y-2">
                {ALL_RECHTSGEBIETE.map(rgId => {
                  const isSelected = settings.jura?.selectedRechtsgebiete?.includes(rgId) || false;
                  const label = RECHTSGEBIET_LABELS[rgId];
                  const selectedCount = settings.jura?.selectedRechtsgebiete?.length || 0;
                  const isLastSelected = isSelected && selectedCount === 1;

                  return (
                    <label
                      key={rgId}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-neutral-50'
                      } ${isLastSelected ? 'cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isLastSelected}
                        onChange={(e) => {
                          const currentSelected = settings.jura?.selectedRechtsgebiete || [];
                          let newSelected;
                          if (e.target.checked) {
                            newSelected = [...currentSelected, rgId];
                          } else {
                            newSelected = currentSelected.filter(id => id !== rgId);
                          }
                          handleSettingChange('jura', 'selectedRechtsgebiete', newSelected);
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500"
                      />
                      <span className={`text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-neutral-700'}`}>
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="ml-8 mt-2 text-xs text-neutral-500">
                Mindestens ein Rechtsgebiet muss ausgewählt sein.
              </p>
            </div>

            {/* Kapitel-Ebene Toggle */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Kapitel-Ebene</p>
                  <p className="text-xs text-neutral-500">
                    Zusätzliche Hierarchie: Unterrechtsgebiet → Kapitel → Thema
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleChapterLevelToggle(!settings.jura?.chapterLevelEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.jura?.chapterLevelEnabled ? 'bg-blue-600' : 'bg-neutral-300'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.jura?.chapterLevelEnabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {/* T-SET-1: Fächerfarben */}
            <div className="border-t border-neutral-100 pt-4 mt-4">
              <CustomSubjectsSection isJura={true} />
            </div>
          </div>
        </div>
      )}

      {/* Profil Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profil
        </h3>

        <div className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Vorname</label>
              <input
                type="text"
                value={firstName}
                disabled
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nachname</label>
              <input
                type="text"
                value={lastName}
                disabled
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500"
              />
            </div>
          </div>
          <p className="text-xs text-neutral-500">Name kann derzeit nicht geändert werden</p>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500"
            />
            <p className="text-xs text-neutral-500 mt-1">E-Mail kann derzeit nicht geändert werden</p>
          </div>

          {/* Password */}
          <div className="flex items-center justify-between py-3 border-t border-neutral-100">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Passwort</p>
                <p className="text-xs text-neutral-500">Passwort ändern</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordDialog(true)}
              disabled={!isAuthenticated}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:text-neutral-400 disabled:cursor-not-allowed"
            >
              Ändern
            </button>
          </div>

          {/* Profile Picture */}
          <div className="flex items-center justify-between py-3 border-t border-neutral-100">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Profilbild</p>
                <p className="text-xs text-neutral-500">Coming Soon</p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-500">
              Bald verfügbar
            </span>
          </div>
        </div>
      </div>

      {/* Benachrichtigungen Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Benachrichtigungen
        </h3>

        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">E-Mail Benachrichtigungen</p>
                <p className="text-xs text-neutral-500">Updates und Neuigkeiten per E-Mail</p>
              </div>
            </div>
            <button
              onClick={() => handleSettingChange('notifications', 'emailEnabled', !settings.notifications.emailEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.notifications.emailEnabled ? 'bg-blue-600' : 'bg-neutral-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.notifications.emailEnabled ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Push Benachrichtigungen</p>
                <p className="text-xs text-neutral-500">Benachrichtigungen im Browser</p>
              </div>
            </div>
            <button
              onClick={() => handleSettingChange('notifications', 'pushEnabled', !settings.notifications.pushEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.notifications.pushEnabled ? 'bg-blue-600' : 'bg-neutral-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.notifications.pushEnabled ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Reminders */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Erinnerungen</p>
                <p className="text-xs text-neutral-500">Tägliche Lernerinnerungen</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {settings.notifications.remindersEnabled && (
                <input
                  type="time"
                  value={settings.notifications.reminderTime}
                  onChange={(e) => handleSettingChange('notifications', 'reminderTime', e.target.value)}
                  className="px-2 py-1 text-sm border border-neutral-200 rounded"
                />
              )}
              <button
                onClick={() => handleSettingChange('notifications', 'remindersEnabled', !settings.notifications.remindersEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.remindersEnabled ? 'bg-blue-600' : 'bg-neutral-300'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.notifications.remindersEnabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lerneinstellungen Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Lerneinstellungen
        </h3>

        <div className="space-y-4">
          {/* Daily Goal */}
          <div className="py-3 border-b border-neutral-100">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Tägliches Lernziel</p>
                <p className="text-xs text-neutral-500">Stunden pro Tag</p>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.learning.dailyGoalHours}
              onChange={(e) => handleSettingChange('learning', 'dailyGoalHours', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>1h</span>
              <span className="font-medium text-blue-600">{settings.learning.dailyGoalHours}h</span>
              <span>10h</span>
            </div>
          </div>

          {/* Preferred Start Time */}
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Bevorzugte Startzeit</p>
                <p className="text-xs text-neutral-500">Wann möchtest du anfangen?</p>
              </div>
            </div>
            <input
              type="time"
              value={settings.learning.preferredStartTime}
              onChange={(e) => handleSettingChange('learning', 'preferredStartTime', e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg"
            />
          </div>

          {/* Break Duration */}
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <Coffee className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Pausendauer</p>
                <p className="text-xs text-neutral-500">Minuten zwischen Lerneinheiten</p>
              </div>
            </div>
            <select
              value={settings.learning.breakDuration}
              onChange={(e) => handleSettingChange('learning', 'breakDuration', parseInt(e.target.value))}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg"
            >
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={20}>20 min</option>
              <option value={30}>30 min</option>
            </select>
          </div>

          {/* Pomodoro */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Pomodoro-Technik</p>
                  <p className="text-xs text-neutral-500">Zeitintervalle für fokussiertes Lernen</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('learning', 'pomodoroEnabled', !settings.learning.pomodoroEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.learning.pomodoroEnabled ? 'bg-blue-600' : 'bg-neutral-300'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.learning.pomodoroEnabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
            {settings.learning.pomodoroEnabled && (
              <div className="ml-8 mt-2">
                <label className="text-xs text-neutral-500">Intervall (Minuten)</label>
                <select
                  value={settings.learning.pomodoroDuration}
                  onChange={(e) => handleSettingChange('learning', 'pomodoroDuration', parseInt(e.target.value))}
                  className="ml-2 px-2 py-1 text-sm border border-neutral-200 rounded"
                >
                  <option value={15}>15 min</option>
                  <option value={25}>25 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={50}>50 min</option>
                </select>
              </div>
            )}
          </div>

          {/* T5.1: Fortschrittsberechnung */}
          <div className="py-3 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Fortschrittsberechnung</p>
                  <p className="text-xs text-neutral-500">Bestimmt, wie der Lernfortschritt berechnet wird</p>
                </div>
              </div>
              <select
                value={settings.learning.progressCalculation || 'aufgaben'}
                onChange={(e) => handleSettingChange('learning', 'progressCalculation', e.target.value)}
                className="px-3 py-2 text-sm border border-neutral-200 rounded-lg"
              >
                <option value="aufgaben">Nach Aufgaben</option>
                <option value="themen">Nach Themen</option>
              </select>
            </div>
            <div className="ml-8 mt-2 p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-600">
                {settings.learning.progressCalculation === 'themen' ? (
                  <>
                    <strong>Nach Themen:</strong> Du kannst Themen und Aufgaben abhaken.
                    Wenn du ein Thema abhakst, werden alle zugehörigen Aufgaben als erledigt markiert.
                  </>
                ) : (
                  <>
                    <strong>Nach Aufgaben:</strong> Du kannst nur Aufgaben abhaken.
                    Der Fortschritt wird anhand der erledigten Aufgaben berechnet.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Dashboard Progress Display Setting */}
          <div>
            <div className="flex items-center justify-between py-3 border-t border-neutral-100">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Fortschrittsanzeige (Startseite)</p>
                  <p className="text-xs text-neutral-500">Bestimmt, wie der Fortschritt auf der Startseite angezeigt wird</p>
                </div>
              </div>
              <select
                value={settings.learning.dashboardProgressDisplay || 'both'}
                onChange={(e) => handleSettingChange('learning', 'dashboardProgressDisplay', e.target.value)}
                className="px-3 py-2 text-sm border border-neutral-200 rounded-lg"
              >
                <option value="both">Zahlen + Balken</option>
                <option value="bar">Nur Balken</option>
                <option value="numbers">Nur Zahlen</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* FEAT-001: Mentor Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Mentor
        </h3>

        <div className="space-y-4">
          {/* Mentor Toggle */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Mentor aktivieren</p>
                <p className="text-xs text-neutral-500">
                  Check-Ins, Statistiken und Wohlbefinden-Tracking
                </p>
              </div>
            </div>
            <button
              onClick={() => isMentorActivated ? deactivateMentor() : activateMentor()}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isMentorActivated ? 'bg-blue-600' : 'bg-neutral-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                isMentorActivated ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* TICKET-3: Check-in Anzahl Einstellung */}
          {isMentorActivated && (
            <div className="flex items-center justify-between py-3 border-t border-neutral-100">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Check-ins pro Tag</p>
                  <p className="text-xs text-neutral-500">
                    Wähle zwischen einem oder zwei täglichen Check-ins
                  </p>
                </div>
              </div>
              <select
                value={settings.checkin?.checkInCount || 2}
                onChange={(e) => handleSettingChange('checkin', 'checkInCount', parseInt(e.target.value))}
                className="px-3 py-2 text-sm border border-neutral-200 rounded-lg"
              >
                <option value={1}>1 Check-in (nur Morgen)</option>
                <option value={2}>2 Check-ins (Morgen & Abend)</option>
              </select>
            </div>
          )}

          {isMentorActivated && (
            <div className="py-3 bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                {settings.checkin?.checkInCount === 1
                  ? 'Der Mentor ist aktiv. Du erhältst täglich einen Morgen-Check-in.'
                  : 'Der Mentor ist aktiv. Du erhältst morgens und abends Check-in Fragen.'
                }
                {' '}Du kannst deine Statistiken im Mentor-Bereich einsehen.
              </p>
            </div>
          )}

          {!isMentorActivated && (
            <div className="py-3 bg-neutral-50 rounded-lg p-4">
              <p className="text-sm text-neutral-600">
                Aktiviere den Mentor, um tägliche Check-ins durchzuführen und
                detaillierte Statistiken über dein Lernverhalten zu erhalten.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Darstellung Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center gap-2">
          <Sun className="w-5 h-5" />
          Darstellung
        </h3>

        <div className="space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              {settings.display.theme === 'dark' ? (
                <Moon className="w-5 h-5 text-neutral-400" />
              ) : (
                <Sun className="w-5 h-5 text-neutral-400" />
              )}
              <div>
                <p className="text-sm font-medium text-neutral-900">Design</p>
                <p className="text-xs text-neutral-500">Farbschema der App</p>
              </div>
            </div>
            <select
              value={settings.display.theme}
              onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg"
            >
              <option value="light">Hell</option>
              <option value="dark">Dunkel (Coming Soon)</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Sprache</p>
                <p className="text-xs text-neutral-500">App-Sprache</p>
              </div>
            </div>
            <select
              value={settings.display.language}
              onChange={(e) => handleSettingChange('display', 'language', e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg"
            >
              <option value="de">Deutsch</option>
              <option value="en">English (Coming Soon)</option>
            </select>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Zeitzone</p>
                <p className="text-xs text-neutral-500">Für Erinnerungen und Kalender</p>
              </div>
            </div>
            <select
              value={settings.display.timezone}
              onChange={(e) => handleSettingChange('display', 'timezone', e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg"
            >
              <option value="Europe/Berlin">Berlin (CET)</option>
              <option value="Europe/Vienna">Wien (CET)</option>
              <option value="Europe/Zurich">Zürich (CET)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Buttons */}
      {hasChanges && (
        <div className="flex justify-end gap-3 pt-4 sticky bottom-4 bg-neutral-50 py-4 px-6 -mx-6 rounded-lg shadow-lg">
          <button
            onClick={handleCancel}
            className="px-6 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Änderungen speichern
          </button>
        </div>
      )}

      {/* Password Change Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">Passwort ändern</h3>
              <button
                onClick={() => {
                  setShowPasswordDialog(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Neues Passwort
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mindestens 6 Zeichen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Passwort bestätigen
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Passwort wiederholen"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {passwordLoading ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Switch Confirmation Modal */}
      {showModeSwitchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Modus wechseln</h3>
              </div>
              <button
                onClick={() => setShowModeSwitchModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-neutral-700 mb-3">
                Du hast {activeLernplaene.length === 1 ? 'einen aktiven Lernplan' : `${activeLernplaene.length} aktive Lernpläne`}.
              </p>
              <p className="text-neutral-600 text-sm mb-3">
                Wenn du in den <strong>Normal-Modus</strong> wechselst:
              </p>
              <ul className="text-sm text-neutral-600 space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Der Lernplan wird aus dem Kalender entfernt</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Der Lernplan wird archiviert</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Du kannst den Lernplan im Examensmodus über den Wizard wiederherstellen</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModeSwitchModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmModeSwitch}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700"
              >
                Wechseln & Archivieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsContent;
