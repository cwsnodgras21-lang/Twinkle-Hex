/**
 * Auth helper placeholders.
 * Future: Sign in, sign out, sign up, password reset.
 * Future: OAuth providers (Google, etc.)
 * Future: Session validation utilities
 */

// Placeholder - implement when Supabase auth is wired
export async function getCurrentUser() {
  return null;
}

// Placeholder - implement when Supabase auth is wired
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
