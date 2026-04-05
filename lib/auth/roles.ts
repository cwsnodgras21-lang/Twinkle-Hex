/**
 * Role-based access control placeholders.
 * Future: Define roles (admin, customer, moderator).
 * Future: Check user role before rendering admin routes.
 * Future: Integrate with Supabase RLS policies.
 */

export type UserRole = "admin" | "customer" | "moderator";

// Placeholder - implement when auth + roles are defined
// Where Supabase user metadata or profiles table will be queried
export async function getUserRole(): Promise<UserRole | null> {
  return null;
}

/** Admin-only routes - use in middleware to protect /admin/* */
export const ADMIN_ROUTES = ["/admin"];

/** Check if path is an admin route */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

/** Guard for admin-only access. Call at top of admin server actions/layout. */
export async function requireAdmin(): Promise<void> {
  const role = await getUserRole();
  if (role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }
}
