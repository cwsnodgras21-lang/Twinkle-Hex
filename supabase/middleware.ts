import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

/**
 * Middleware helper to refresh the Supabase auth session and return the
 * current user (if any) so callers can make routing decisions.
 *
 * Cookies set by a refreshed session must be mirrored onto the *response*,
 * not just the incoming request - otherwise the browser never receives the
 * refreshed tokens and sessions silently die once the access token expires.
 */
export async function updateSession(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null }> {
  let supabaseResponse = NextResponse.next({ request });

  // Skip Supabase auth refresh if env vars not configured (e.g. fresh clone)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { response: supabaseResponse, user: null };
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - also gives us the authenticated user (if any)
  // for route-protection decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
