import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./helpers";
import { isUserAdmin } from "./admin-check";

export type UserRole = "admin" | "customer" | "moderator";

export { isUserAdmin, isAdminRoute, ADMIN_ROUTES } from "./admin-check";

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  const role = user?.app_metadata?.role;
  return role === "admin" || role === "moderator" || role === "customer" ? role : null;
}

/**
 * Guard for Server Actions / route handlers - throws rather than redirecting,
 * since there's no navigation to perform mid-mutation. Callers that expect an
 * { ok, error } result should catch this and surface it as a normal error.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!isUserAdmin(user)) {
    throw new Error("Forbidden: admin access required");
  }
  return user as User;
}

/** Guard for Server Components (layouts/pages) - redirects to /login instead of throwing. */
export async function requireAdminOrRedirect(pathname = "/admin"): Promise<User> {
  const user = await getCurrentUser();
  if (!isUserAdmin(user)) {
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }
  return user as User;
}
