import { createClient } from '@supabase/supabase-js';

// ==========================================
// Karnet - Supabase Configuration
// ==========================================

// These will be set via environment variables
// Users need to configure these in their .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

// ==========================================
// Sync utilities
// ==========================================

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ==========================================
// Data sync functions
// These sync local IndexedDB data with Supabase
// ==========================================

export async function syncToCloud(table: string, data: Record<string, unknown>[]) {
  if (!supabase) throw new Error('Supabase not configured');
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const withUserId = data.map((row) => ({ ...row, user_id: user.id }));
  const { error } = await supabase.from(table).upsert(withUserId, { onConflict: 'id' });
  if (error) throw error;
}

export async function fetchFromCloud(table: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', user.id);
  if (error) throw error;
  return data;
}
