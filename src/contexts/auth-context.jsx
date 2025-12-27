import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, firstName = '', lastName = '') => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase nicht konfiguriert' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
        },
      },
    });

    return { data, error };
  };

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase nicht konfiguriert' } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
    }
    return { error };
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase nicht konfiguriert' } };
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { data, error };
  };

  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase nicht konfiguriert' } };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { data, error };
  };

  // Helper to get user's first name
  const getFirstName = () => {
    return user?.user_metadata?.first_name || '';
  };

  // Helper to get user's last name
  const getLastName = () => {
    return user?.user_metadata?.last_name || '';
  };

  // Helper to get user's full name
  const getFullName = () => {
    return user?.user_metadata?.full_name || `${getFirstName()} ${getLastName()}`.trim() || 'User';
  };

  // Helper to get user initials (first letter of first and last name)
  const getInitials = () => {
    const firstName = getFirstName();
    const lastName = getLastName();

    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isSupabaseEnabled: isSupabaseConfigured(),
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    // Name helpers
    getFirstName,
    getLastName,
    getFullName,
    getInitials,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
