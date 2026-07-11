"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    const redirectTo = searchParams.get("redirect") || "/admin";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-cyan text-ink font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
