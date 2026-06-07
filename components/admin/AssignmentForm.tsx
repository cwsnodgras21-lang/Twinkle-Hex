"use client";

import { useState } from "react";
import { createAssignmentAction } from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/errors";
import type { Swatcher } from "@/types/admin";

interface AssignmentFormProps {
  releaseId: string;
  swatchers: Swatcher[];
}

export function AssignmentForm({ releaseId, swatchers }: AssignmentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await createAssignmentAction(releaseId, formData);
      if (result.ok) {
        setMessage("Swatcher assignment added.");
        e.currentTarget.reset();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} method="post" className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="p-3 bg-teal/10 border border-teal/20 rounded-lg text-sm text-teal">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="swatcher_id" className="block text-sm font-medium text-ink mb-1">
            Swatcher *
          </label>
          <select
            id="swatcher_id"
            name="swatcher_id"
            required
            defaultValue=""
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          >
            <option value="" disabled>
              Select a swatcher
            </option>
            {swatchers.map((swatcher) => (
              <option key={swatcher.id} value={swatcher.id}>
                {swatcher.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="shade_name" className="block text-sm font-medium text-ink mb-1">
            Shade name
          </label>
          <input
            id="shade_name"
            name="shade_name"
            type="text"
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
            placeholder="Optional shade / polish name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-ink mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="pending"
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="received">Received</option>
            <option value="feedback">Feedback</option>
          </select>
        </div>
        <div>
          <label htmlFor="sent_at" className="block text-sm font-medium text-ink mb-1">
            Sent at
          </label>
          <input
            id="sent_at"
            name="sent_at"
            type="datetime-local"
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="feedback_notes" className="block text-sm font-medium text-ink mb-1">
          Feedback notes
        </label>
        <textarea
          id="feedback_notes"
          name="feedback_notes"
          rows={2}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={pending || swatchers.length === 0}
        className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Assign swatcher"}
      </button>
    </form>
  );
}
