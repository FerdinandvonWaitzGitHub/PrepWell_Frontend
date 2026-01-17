import { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/auth-context';
import AuthInput from './AuthInput';
import OAuthButtons from './OAuthButtons';

/**
 * RegisterForm - Registrierungs-Formular
 *
 * Figma-Referenz: Node 2071:7011
 */
export default function RegisterForm({ onSwitchToLogin, onSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!firstName.trim()) {
      setError('Bitte gib deinen Vornamen ein');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen haben');
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUp(
        email,
        password,
        firstName.trim(),
        lastName.trim()
      );

      if (signUpError) throw signUpError;

      setSuccess('Registrierung erfolgreich! Bitte bestätige deine E-Mail.');

      // Nach erfolgreichem Signup zum Login wechseln
      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => onSwitchToLogin(), 2000);
      }
    } catch (err) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Title */}
      <h2 className="text-2xl font-medium text-gray-950 mb-2">
        Konto erstellen
      </h2>
      <p className="text-sm text-gray-500 mb-8">
        Registriere dich, um PrepWell zu nutzen
      </p>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <AuthInput
            label="Vorname"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Max"
            required
            autoComplete="given-name"
          />
          <AuthInput
            label="Nachname"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Mustermann"
            autoComplete="family-name"
          />
        </div>

        {/* Email */}
        <AuthInput
          label="E-Mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="deine@email.de"
          required
          autoComplete="email"
        />

        {/* Password */}
        <AuthInput
          label="Passwort"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mindestens 6 Zeichen"
          required
          autoComplete="new-password"
        />

        {/* Confirm Password */}
        <AuthInput
          label="Passwort bestätigen"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Passwort wiederholen"
          required
          autoComplete="new-password"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium
                     hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 transition-colors mt-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Konto erstellen'
          )}
        </button>
      </form>

      {/* OAuth Buttons */}
      <OAuthButtons mode="register" />

      {/* Switch to Login */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Du hast bereits ein Konto?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-gray-900 font-medium hover:underline"
        >
          Anmelden
        </button>
      </p>
    </div>
  );
}
