"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createCharityPolishAction,
  updateCharityPolishAction,
} from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/errors";
import type { CharityPolish } from "@/types/admin";

const STATUS_OPTIONS: NonNullable<CharityPolish["status"]>[] = [
  "active",
  "completed",
  "paused",
];

interface CharityPolishFormProps {
  item?: CharityPolish | null;
  mode: "create" | "edit";
}

export function CharityPolishForm({ item, mode }: CharityPolishFormProps) {
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
        const result = await createCharityPolishAction(formData);
        if (result.ok) {
          router.push(`/admin/charity/${result.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (item) {
        const result = await updateCharityPolishAction(item.id, formData);
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
    <form id="charity-form" onSubmit={handleSubmit} method="post" className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
          Polish name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={item?.name}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="charity_name" className="block text-sm font-medium text-ink mb-1">
            Charity name *
          </label>
          <input
            id="charity_name"
            name="charity_name"
            type="text"
            required
            defaultValue={item?.charity_name}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="product_id" className="block text-sm font-medium text-ink mb-1">
            Shopify product ID
          </label>
          <input
            id="product_id"
            name="product_id"
            type="text"
            defaultValue={item?.product_id}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="donation_per_unit" className="block text-sm font-medium text-ink mb-1">
            Donation per unit ($)
          </label>
          <input
            id="donation_per_unit"
            name="donation_per_unit"
            type="number"
            min="0"
            step="0.01"
            defaultValue={item?.donation_per_unit ?? ""}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="total_raised" className="block text-sm font-medium text-ink mb-1">
            Total raised ($)
          </label>
          <input
            id="total_raised"
            name="total_raised"
            type="number"
            min="0"
            step="0.01"
            defaultValue={item?.total_raised ?? ""}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-ink mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={item?.status ?? "active"}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-ink mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={item?.notes}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
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
