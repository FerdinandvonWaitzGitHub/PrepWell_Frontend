import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { safeSessionStorage } from '../utils/safe-storage';

// =============================================================================
// AUTH DEBUG MODE - Intercept all fetch requests to Supabase auth endpoints
// This helps identify the source of 400 errors
// =============================================================================
// PW-020: Only enable debug logging in development
const AUTH_DEBUG = import.meta.env.DEV;

if (AUTH_DEBUG && typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const [input, init] = args;
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';

    // Only log auth-related requests
    if (url.includes('/auth/v1/')) {
      const method = init?.method || 'GET';
      console.group(`🔐 [AUTH DEBUG] ${method} ${url.split('/auth/v1/')[1] || url}`);
      console.log('URL:', url);
      console.log('Method:', method);
      console.log('Headers:', init?.headers);
      if (init?.body) {
        try {
          // Don't log passwords
          const body = JSON.parse(init.body as string);
          if (body.password) body.password = '***HIDDEN***';
          console.log('Body:', body);
        } catch {
          console.log('Body:', '[non-JSON]');
        }
      }
      console.log('Call Stack:', new Error().stack);

      try {
        const response = await originalFetch.apply(this, args);
        const clonedResponse = response.clone();

        if (!response.ok) {
          console.error(`❌ Response Status: ${response.status} ${response.statusText}`);
          try {
            const errorBody = await clonedResponse.text();
            console.error('Error Response Body:', errorBody);
          } catch {
            console.error('Could not read error response body');
          }
        } else {
          console.log(`✅ Response Status: ${response.status}`);
        }

        console.groupEnd();
        return response;
      } catch (error) {
        console.error('❌ Fetch Error:', error);
        console.groupEnd();
        throw error;
      }
    }

    return originalFetch.apply(this, args);
  };
  console.log('🔐 [AUTH DEBUG] Fetch interceptor installed - monitoring all /auth/v1/ requests');
}

// Try environment variables first, fallback to hardcoded values
// Note: Anon key is safe to expose - it's meant for public frontend use
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://vitvxwfcutysuifuqnqi.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHZ4d2ZjdXR5c3VpZnVxbnFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MjI0NzQsImV4cCI6MjA4MjM5ODQ3NH0.PkRxGtmflo5hie3KayAt7y38JwnYZH7gLGMxydemZl4';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.info('Using fallback Supabase credentials (env vars not found)');
}

// BUG-001 FIX: Use sessionStorage instead of localStorage
// This ensures the user is logged out when the browser tab is closed
// sessionStorage is automatically cleared when the tab/window is closed

// BUG-2c FIX: Bypass Web Locks to prevent getSession() deadlock
// See: https://github.com/supabase/supabase-js/issues/1594
// The Supabase SDK has a known bug where Web Locks can cause deadlocks,
// making getSession() hang indefinitely. This workaround disables locks.
const noOpLock = async <T>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> => {
  return await fn();
};

// T17 P2 FIX: Use safeSessionStorage instead of sessionStorage
// This provides fallback to in-memory storage when sessionStorage is blocked
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: safeSessionStorage,
          storageKey: 'prepwell-auth',
          autoRefreshToken: true,
          persistSession: true,
          lock: noOpLock, // Bypass Web Locks deadlock bug
        },
      })
    : null;

export const isSupabaseConfigured = (): boolean => !!supabase;
