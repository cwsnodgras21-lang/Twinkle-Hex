import "server-only";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/supabase/server";

/** Current authenticated user (Server Components, Route Handlers, Server Actions). */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
