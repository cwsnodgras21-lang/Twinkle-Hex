"use client";

import { useState, type FormEvent } from "react";
import { createAdminUserAction } from "@/app/admin/settings/actions";

export function AddAdminUserForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCreated(null);

    const formData = new FormData();
    formData.set("email", email);

    const result = await createAdminUserAction(formData);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setCreated({ email: result.email, tempPassword: result.tempPassword });
    setEmail("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          placeholder="new-admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-cyan text-ink font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "Adding..." : "Add admin"}
        </button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {created && (
        <div className="bg-teal/10 border border-teal/30 rounded-lg p-4 text-sm space-y-1">
          <p className="font-semibold text-ink">
            Admin account created for {created.email}
          </p>
          <p className="text-ink/80">
            Temporary password: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-ink/10">{created.tempPassword}</code>
          </p>
          <p className="text-ink/60">
            Share this password with them directly (text, call, etc.) - it will not be shown again.
            They can sign in at /login with it.
          </p>
        </div>
      )}
    </div>
  );
}
