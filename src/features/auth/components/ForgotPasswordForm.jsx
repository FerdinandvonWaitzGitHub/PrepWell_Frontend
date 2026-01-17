import { useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/auth-context';
import AuthInput from './AuthInput';

/**
 * ForgotPasswordForm - Passwort-Reset-Formular
 *
 * Figma-Referenz: Node 2071:7571
 */
export default function ForgotPasswordForm({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) throw resetError;
      setSuccess('Passwort-Reset E-Mail wurde gesendet. Überprüfe dein Postfach.');
    } catch (err) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Back Button */}
      <button
        type="button"
        onClick={onSwitchToLogin}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zur Anmeldung
      </button>

      {/* Title */}
      <h2 className="text-2xl font-medium text-gray-950 mb-2">
        Passwort vergessen?
      </h2>
      <p className="text-sm text-gray-500 mb-8">
        Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium
                     hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 transition-colors mt-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : success ? (
            'E-Mail gesendet'
          ) : (
            'Link senden'
          )}
        </button>
      </form>
    </div>
  );
}
