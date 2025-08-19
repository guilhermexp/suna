'use client';

import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export function useSupabase(): SupabaseClient {
  return createClient();
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  const supabase = useSupabase();
  
  return {
    supabase,
    getUser: () => supabase.auth.getUser(),
    getSession: () => supabase.auth.getSession(),
    signOut: () => supabase.auth.signOut(),
  };
}
