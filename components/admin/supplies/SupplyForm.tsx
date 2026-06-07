"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Supply } from "@/types/admin";
import {
  createSupplyAction,
  updateSupplyAction,
} from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/errors";

interface SupplyFormProps {
  supply?: Supply | null;
  mode: "create" | "edit";
}

export function SupplyForm({ supply, mode }: SupplyFormProps) {
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
        const result = await createSupplyAction(formData);
        if (result.ok) {
          router.push(`/admin/supplies/${result.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (supply) {
        const result = await updateSupplyAction(supply.id, formData);
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
    <form
      id="supply-form"
      onSubmit={handleSubmit}
      method="post"
      className="space-y-4"
    >
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
          defaultValue={supply?.name}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="e.g. 15ml bottle, wide brush, carton insert"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-ink mb-1">
          Category
        </label>
        <input
          id="category"
          name="category"
          type="text"
          defaultValue={supply?.category}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="e.g. bottles, caps, labels, boxes"
        />
      </div>

      <div>
        <label htmlFor="sku" className="block text-sm font-medium text-ink mb-1">
          SKU
        </label>
        <input
          id="sku"
          name="sku"
          type="text"
          defaultValue={supply?.sku}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Optional internal SKU"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-ink mb-1">
            Unit *
          </label>
          <input
            id="unit"
            name="unit"
            type="text"
            required
            defaultValue={supply?.unit ?? "each"}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
            placeholder="e.g. each, case, roll"
          />
        </div>
        <div>
          <label htmlFor="quantity_on_hand" className="block text-sm font-medium text-ink mb-1">
            Quantity on hand
          </label>
          <input
            id="quantity_on_hand"
            name="quantity_on_hand"
            type="number"
            min="0"
            step="0.0001"
            defaultValue={supply?.quantity_on_hand ?? 0}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="reorder_point" className="block text-sm font-medium text-ink mb-1">
            Reorder point
          </label>
          <input
            id="reorder_point"
            name="reorder_point"
            type="number"
            min="0"
            step="0.0001"
            defaultValue={supply?.reorder_point ?? ""}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
            placeholder="Alert when below this"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-ink mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={supply?.notes}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Internal notes about packaging specs, minimums, or vendor details"
        />
      </div>

      {supply && <input type="hidden" name="id" value={supply.id} />}

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
