import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ADMIN_LOGIN_DISABLED } from "@/lib/auth/admin-check";
import { createAdminClient } from "@/supabase/admin";

/**
 * Supabase client for use in Server Components, Route Handlers, and Server Actions.
 * Uses cookies for auth - respects SSR context.
 *
 * While admin login is temporarily disabled, server reads would otherwise hit
 * admin-only RLS with an anonymous JWT and return empty. Use the service role
 * for those reads so Command Center / ops pages still function.
 */
export async function createClient() {
  if (ADMIN_LOGIN_DISABLED && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminClient();
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component - ignore
          }
        },
      },
    }
  );
}
