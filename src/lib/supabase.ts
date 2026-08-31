import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase Configuration from Project Credentials
const DEFAULT_SUPABASE_URL = 'https://bhovqcmodhsihzuylouz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJob3ZxY21vZGhzaWh6dXlsb3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MTI3NDQsImV4cCI6MjEwMzM4ODc0NH0.ObF0SIqFYKMPfdhT3zoTgdIr4jX81CSk4l5mEe43Osk';

// Format and normalize the URL
function normalizeSupabaseUrl(url: string | undefined): string {
  if (!url) return DEFAULT_SUPABASE_URL;
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/rest/v1/') || cleanUrl.endsWith('/rest/v1')) {
    cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '');
  }
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  return cleanUrl || DEFAULT_SUPABASE_URL;
}

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

export const SUPABASE_URL = normalizeSupabaseUrl(
  (metaEnv.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL
);

export const SUPABASE_ANON_KEY =
  (metaEnv.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

export const PROJECT_METADATA = {
  projectName: 'Resources Room Management',
  projectId: 'bhovqcmodhsihzuylouz',
  url: SUPABASE_URL,
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
};

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
