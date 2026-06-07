"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createBatchAction,
  updateBatchAction,
} from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/errors";
import type { Batch } from "@/types/admin";

const STATUS_OPTIONS: Batch["status"][] = [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
];

const STATUS_LABELS: Record<Batch["status"], string> = {
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface BatchFormProps {
  batch?: Batch | null;
  mode: "create" | "edit";
}

export function BatchForm({ batch, mode }: BatchFormProps) {
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
        const result = await createBatchAction(formData);
        if (result.ok) {
          router.push(`/admin/batches/${result.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (batch) {
        const result = await updateBatchAction(batch.id, formData);
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
    <form id="batch-form" onSubmit={handleSubmit} method="post" className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="batch_number" className="block text-sm font-medium text-ink mb-1">
          Batch number *
        </label>
        <input
          id="batch_number"
          name="batch_number"
          type="text"
          required
          defaultValue={batch?.batch_number}
          className="w-full border border-ink/20 rounded-lg px-3 py-2 font-mono"
          placeholder="e.g. B-2024-001"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-ink mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={batch?.status ?? "planned"}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product_id" className="block text-sm font-medium text-ink mb-1">
            Shopify product ID
          </label>
          <input
            id="product_id"
            name="product_id"
            type="text"
            defaultValue={batch?.product_id}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
            placeholder="Where Shopify product links in"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="planned_date" className="block text-sm font-medium text-ink mb-1">
            Planned date
          </label>
          <input
            id="planned_date"
            name="planned_date"
            type="date"
            defaultValue={batch?.planned_date ?? ""}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="completed_at" className="block text-sm font-medium text-ink mb-1">
            Completed at
          </label>
          <input
            id="completed_at"
            name="completed_at"
            type="datetime-local"
            defaultValue={batch?.completed_at ? new Date(batch.completed_at).toISOString().slice(0, 16) : ""}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="quantity_produced" className="block text-sm font-medium text-ink mb-1">
          Quantity produced
        </label>
        <input
          id="quantity_produced"
          name="quantity_produced"
          type="number"
          min="0"
          step="1"
          defaultValue={batch?.quantity_produced ?? ""}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
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
          defaultValue={batch?.notes}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Production notes, issues, or milestones"
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
