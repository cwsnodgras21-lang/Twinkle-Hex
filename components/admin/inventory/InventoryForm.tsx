"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createInventoryItemAction } from "@/app/admin/actions";
import type { Release } from "@/types/admin";

interface InventoryFormProps {
  releases: Release[];
}

export function InventoryForm({ releases }: InventoryFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const result = await createInventoryItemAction(formData);
      if (result.ok) {
        router.push("/admin/inventory");
        router.refresh();
      } else {
        setError(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      id="inventory-form"
      onSubmit={async (e) => {
        e.preventDefault();
        await handleSubmit(new FormData(e.currentTarget));
      }}
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
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="e.g. Starlight — full size"
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
          className="w-full border border-ink/20 rounded-lg px-3 py-2 font-mono text-sm"
          placeholder="Optional internal SKU"
        />
      </div>
      <div>
        <label htmlFor="release_id" className="block text-sm font-medium text-ink mb-1">
          Linked release
        </label>
        <select
          id="release_id"
          name="release_id"
          defaultValue=""
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        >
          <option value="">None</option>
          {releases.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
              {r.collection ? ` — ${r.collection}` : ""}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink/50">
          Uses the release UUID from your database — pick a release or leave empty.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="quantity_on_hand"
            className="block text-sm font-medium text-ink mb-1"
          >
            Quantity on hand
          </label>
          <input
            id="quantity_on_hand"
            name="quantity_on_hand"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label
            htmlFor="reserved_quantity"
            className="block text-sm font-medium text-ink mb-1"
          >
            Reserved quantity
          </label>
          <input
            id="reserved_quantity"
            name="reserved_quantity"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-ink mb-1">
          Location
        </label>
        <input
          id="location"
          name="location"
          type="text"
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Shelf, bin, etc."
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create"}
        </button>
      </div>
    </form>
  );
}
