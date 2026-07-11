"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const supabase = createClient();
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }

  return { user, isLoading, signIn, signOut };
}
