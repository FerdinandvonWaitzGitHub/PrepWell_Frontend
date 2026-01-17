import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/auth-context';
import AuthInput from './AuthInput';
import OAuthButtons from './OAuthButtons';

/**
 * LoginForm - Login-Formular
 *
 * Figma-Referenz: Node 2071:7520
 */
export default function LoginForm({ onSwitchToRegister, onSwitchToForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;
      navigate('/');
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
        Willkommen zurück
      </h2>
      <p className="text-sm text-gray-500 mb-8">
        Melde dich an, um fortzufahren
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
          placeholder="••••••••"
          required
          autoComplete="current-password"
          rightElement={
            <button
              type="button"
              onClick={onSwitchToForgot}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Passwort vergessen?
            </button>
          }
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
            'Anmelden'
          )}
        </button>
      </form>

      {/* OAuth Buttons */}
      <OAuthButtons mode="login" />

      {/* Switch to Register */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Du hast noch kein Konto?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-gray-900 font-medium hover:underline"
        >
          Jetzt registrieren
        </button>
      </p>
    </div>
  );
}
