import { createClient } from '@supabase/supabase-js';

// Try environment variables first, fallback to hardcoded values
// Note: Anon key is safe to expose - it's meant for public frontend use
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vitvxwfcutysuifuqnqi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHZ4d2ZjdXR5c3VpZnVxbnFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MjI0NzQsImV4cCI6MjA4MjM5ODQ3NH0.PkRxGtmflo5hie3KayAt7y38JwnYZH7gLGMxydemZl4';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.info('Using fallback Supabase credentials (env vars not found)');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;
