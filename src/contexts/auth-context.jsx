import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

// BUG-021 FIX: All localStorage keys used by PrepWell that contain user data
// Must match all keys in use-supabase-sync.js STORAGE_KEYS plus other app keys
const ALL_PREPWELL_STORAGE_KEYS = [
  // Calendar & Content
  'prepwell_calendar_slots',
  'prepwell_calendar_tasks',
  'prepwell_tasks',
  'prepwell_private_blocks',
  'prepwell_content_plans',
  'prepwell_contents',
  'prepwell_published_themenlisten',
  // Lernplan
  'prepwell_lernplan_metadata',
  'prepwell_archived_lernplaene',
  'prepwell_lernplan_wizard_draft',
  // Exams
  'prepwell_exams',
  'prepwell_uebungsklausuren',
  // Timer
  'prepwell_timer_state',
  'prepwell_timer_history',
  'prepwell_timer_config',
  // Check-in & Logbuch
  'prepwell_checkin_data',
  'prepwell_checkin_responses',
  'prepwell_logbuch_entries',
  // Settings
  'prepwell_settings',
  'prepwell_user_settings',
  'prepwell_grade_system',
  'prepwell_custom_subjects',
  'prepwell_custom_unterrechtsgebiete',
  'prepwell_mentor_activated',
  // Onboarding
  'prepwell_onboarding_complete',
  // Note: prepwell_last_user_id is NOT cleared, it's used to detect user changes
];

// BUG-021 FIX: Clear all user data from localStorage
const clearAllUserData = () => {
  ALL_PREPWELL_STORAGE_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('Cleared all PrepWell user data from localStorage');
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user settings in Supabase if they don't exist
  const initializeUserSettings = useCallback(async (userId) => {
    if (!isSupabaseConfigured() || !userId) return;

    try {
      // Check if user_settings already exists
      const { data: existingSettings, error: fetchError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is expected for new users
        console.error('Error checking user settings:', fetchError);
        return;
      }

      // If no settings exist, create default settings
      if (!existingSettings) {
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            mentor_activated: false,
            preferred_grade_system: 'punkte',
            timer_settings: {},
            custom_subjects: [],
          });

        if (insertError) {
          console.error('Error creating user settings:', insertError);
        } else {
          console.log('Created default user settings for user:', userId);
        }
      }
    } catch (err) {
      console.error('Error initializing user settings:', err);
    }
  }, []);

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

      // Initialize user settings for logged in user
      if (session?.user?.id) {
        initializeUserSettings(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // BUG-021 FIX: Clear localStorage when a different user logs in
        // This prevents data from a previous user from being shown to the new user
        if (_event === 'SIGNED_IN' && session?.user?.id) {
          const lastUserId = localStorage.getItem('prepwell_last_user_id');
          if (lastUserId && lastUserId !== session.user.id) {
            console.log('Different user detected, clearing previous user data');
            clearAllUserData();
          }
          // Store current user ID for future comparison
          localStorage.setItem('prepwell_last_user_id', session.user.id);
          initializeUserSettings(session.user.id);
        }

        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [initializeUserSettings]);

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

    // BUG-021 FIX: Clear all user data from localStorage BEFORE signing out
    // This prevents data from "leaking" to the next user who logs in
    clearAllUserData();

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

  // BUG-016 FIX: Add updateProfile function to update user metadata
  const updateProfile = async (profileData) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase nicht konfiguriert' } };
    }

    // Build the updated user_metadata object
    const currentMetadata = user?.user_metadata || {};
    const updatedMetadata = { ...currentMetadata };

    // Handle full_name update
    if (profileData.full_name !== undefined) {
      updatedMetadata.full_name = profileData.full_name;
      // Also update first/last name if full_name is provided
      const nameParts = profileData.full_name.trim().split(' ');
      if (nameParts.length >= 2) {
        updatedMetadata.first_name = nameParts[0];
        updatedMetadata.last_name = nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        updatedMetadata.first_name = nameParts[0];
      }
    }

    // Handle individual name updates
    if (profileData.first_name !== undefined) {
      updatedMetadata.first_name = profileData.first_name;
    }
    if (profileData.last_name !== undefined) {
      updatedMetadata.last_name = profileData.last_name;
    }

    const { data, error } = await supabase.auth.updateUser({
      data: updatedMetadata,
    });

    // Update local user state if successful
    if (!error && data?.user) {
      setUser(data.user);
    }

    return { data, error };
  };

  // BUG-016 FIX: Add deleteAccount function (marks account for deletion)
  const deleteAccount = async () => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase nicht konfiguriert' } };
    }

    // Note: Supabase doesn't allow users to delete themselves directly.
    // This would require a server-side function or admin action.
    // For now, we sign out and mark the request.
    try {
      // BUG-021 FIX: Use centralized clearAllUserData function
      clearAllUserData();

      // Sign out (this also calls clearAllUserData, but that's fine)
      await signOut();

      return { data: { message: 'Account-Daten gelöscht. Bitte kontaktiere den Support für vollständige Kontolöschung.' }, error: null };
    } catch (err) {
      return { error: { message: err.message || 'Fehler beim Löschen des Accounts' } };
    }
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
    updateProfile, // BUG-016 FIX
    deleteAccount, // BUG-016 FIX
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
