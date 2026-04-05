/**
 * Auth hook placeholder.
 * Future: useUser, useSession, useSignIn, useSignOut.
 * Future: Integrate with Supabase auth state.
 */

"use client";

// Placeholder - implement when auth is wired
export function useAuth() {
  return {
    user: null,
    isLoading: false,
    signIn: async () => {},
    signOut: async () => {},
  };
}
