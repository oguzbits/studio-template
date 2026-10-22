/**
 * Returns and validates the Supabase client keys from the environment.
 * No zod: the browser client imports this, and zod would land in every page's JS.
 */
export function getSupabaseClientKeys() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set',
    );
  }

  return { url, anonKey };
}
