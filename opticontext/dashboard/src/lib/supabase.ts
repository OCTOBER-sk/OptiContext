import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
});

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export function toAuthUser(user: SupabaseUser): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
    photoURL: user.user_metadata?.avatar_url ?? '',
  };
}
