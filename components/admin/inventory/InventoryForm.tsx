"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createInventoryItemAction } from "@/app/admin/actions";
import { PolishSwatch } from "@/components/admin/polishes";
import type { Polish } from "@/types/admin";

interface InventoryFormProps {
  polishes: Polish[];
}

export function InventoryForm({ polishes }: InventoryFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [polishId, setPolishId] = useState("");
  const selected = polishes.find((p) => p.id === polishId);

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
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
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
          className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
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
          className="w-full border border-ink/20 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          placeholder="Optional internal SKU"
        />
      </div>
      <div>
        <label htmlFor="polish_id" className="block text-sm font-medium text-ink mb-1">
          Made from (polish / recipe)
        </label>
        <div className="flex items-center gap-3">
          {selected && <PolishSwatch colorHex={selected.color_hex} />}
          <select
            id="polish_id"
            name="polish_id"
            value={polishId}
            onChange={(e) => setPolishId(e.target.value)}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          >
            <option value="">None</option>
            {polishes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-ink/50">Links this stock back to its recipe — optional.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="quantity_on_hand" className="block text-sm font-medium text-ink mb-1">
            Quantity on hand
          </label>
          <input
            id="quantity_on_hand"
            name="quantity_on_hand"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          />
        </div>
        <div>
          <label htmlFor="reserved_quantity" className="block text-sm font-medium text-ink mb-1">
            Reserved quantity
          </label>
          <input
            id="reserved_quantity"
            name="reserved_quantity"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
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
          className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          placeholder="Shelf, bin, etc."
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Creating…" : "Create"}
        </button>
      </div>
    </form>
  );
}
