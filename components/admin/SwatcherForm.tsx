"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createSwatcherAction,
  updateSwatcherAction,
} from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/errors";
import type { Swatcher } from "@/types/admin";

interface SwatcherFormProps {
  swatcher?: Swatcher | null;
  mode: "create" | "edit";
}

export function SwatcherForm({ swatcher, mode }: SwatcherFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (mode === "create") {
        const result = await createSwatcherAction(formData);
        if (result.ok) {
          router.push(`/admin/swatchers/${result.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (swatcher) {
        const result = await updateSwatcherAction(swatcher.id, formData);
        if (result.ok) {
          router.refresh();
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="swatcher-form" onSubmit={handleSubmit} method="post" className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
          Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={swatcher?.name}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={swatcher?.email}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="social_handle" className="block text-sm font-medium text-ink mb-1">
          Social handle
        </label>
        <input
          id="social_handle"
          name="social_handle"
          type="text"
          defaultValue={swatcher?.social_handle}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="@username"
        />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-ink mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={swatcher?.notes}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Preferences, mailing details, or relationship notes"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving..." : mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </form>
  );
}
