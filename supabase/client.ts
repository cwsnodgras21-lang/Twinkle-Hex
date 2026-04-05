import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components.
 * Uses cookies for auth state - safe for browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
