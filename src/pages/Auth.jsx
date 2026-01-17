import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import {
  AuthLayout,
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
} from '../features/auth';

/**
 * Auth Page - Entry Point für Login/Register/Forgot Password
 *
 * Ticket: AU-001 - Login/Registration Screens Figma-Anpassung
 *
 * Änderungen:
 * - Single-Card Layout → Split-Screen (50/50)
 * - Blue-Theme → Black/Neutral-Theme
 * - Tab-System → Separate Formulare mit Navigation-Links
 * - "Weiter ohne Anmeldung" ENTFERNT
 * - "Supabase nicht konfiguriert" Screen ENTFERNT
 */
export default function Auth() {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'

  const { isAuthenticated, loading: authLoading, isSupabaseEnabled } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Supabase nicht konfiguriert - Redirect zur Startseite
  // (Offline-Mode Screen wurde entfernt gemäß Ticket AU-001)
  if (!isSupabaseEnabled) {
    navigate('/');
    return null;
  }

  const handleSwitchView = (newView) => {
    setView(newView);
  };

  const renderForm = () => {
    switch (view) {
      case 'register':
        return (
          <RegisterForm
            onSwitchToLogin={() => handleSwitchView('login')}
            onSuccess={() => handleSwitchView('login')}
          />
        );
      case 'forgot':
        return (
          <ForgotPasswordForm
            onSwitchToLogin={() => handleSwitchView('login')}
          />
        );
      default:
        return (
          <LoginForm
            onSwitchToRegister={() => handleSwitchView('register')}
            onSwitchToForgot={() => handleSwitchView('forgot')}
          />
        );
    }
  };

  return (
    <AuthLayout>
      {renderForm()}
    </AuthLayout>
  );
}
