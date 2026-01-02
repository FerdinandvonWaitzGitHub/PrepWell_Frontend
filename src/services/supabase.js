import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log what we have (remove after fixing)
console.log('ENV Debug:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlStart: supabaseUrl?.substring(0, 20),
  mode: import.meta.env.MODE,
  allViteKeys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')),
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using LocalStorage fallback.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;
