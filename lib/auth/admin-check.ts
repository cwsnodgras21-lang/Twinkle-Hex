import type { User } from "@supabase/supabase-js";

/**
 * Pure, dependency-free admin checks safe to import from Edge middleware.
 * Keep this file free of `server-only` / `next/headers` imports.
 */

/**
 * Admin status lives in the Supabase auth `app_metadata` claim, which is
 * embedded in the JWT and can only be written with the service-role key
 * (never by the user themselves), so it's safe to trust as-is.
 *
 * To promote a user to admin, run in the Supabase SQL editor:
 *   update auth.users
 *   set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
 *   where email = 'owner@example.com';
 */
export function isUserAdmin(user: User | null): boolean {
  return user?.app_metadata?.role === "admin";
}

/** Admin-only routes - enforced in middleware.ts and app/admin/layout.tsx */
export const ADMIN_ROUTES = ["/admin"];

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin");
}
