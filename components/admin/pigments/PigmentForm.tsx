"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Pigment } from "@/types/admin";
import { createPigmentAction, updatePigmentAction } from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/errors";

interface PigmentFormProps {
  pigment?: Pigment | null;
  mode: "create" | "edit";
}

export function PigmentForm({ pigment, mode }: PigmentFormProps) {
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
        const result = await createPigmentAction(formData);
        if (result.ok) {
          router.push(`/admin/pigments/${result.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (pigment) {
        const result = await updatePigmentAction(pigment.id, formData);
        if (result.ok) {
          router.refresh();
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      id="pigment-form"
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
          defaultValue={pigment?.name}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="e.g. Ultramarine Blue, Mica Gold Sparkle"
        />
      </div>
      <div>
        <label htmlFor="color_description" className="block text-sm font-medium text-ink mb-1">
          Color description
        </label>
        <input
          id="color_description"
          name="color_description"
          type="text"
          defaultValue={pigment?.color_description}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="e.g. Deep navy with gold shimmer"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-ink mb-1">
            SKU
          </label>
          <input
            id="sku"
            name="sku"
            type="text"
            defaultValue={pigment?.sku}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
            placeholder="Optional internal SKU"
          />
        </div>
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-ink mb-1">
            Supplier
          </label>
          <input
            id="supplier"
            name="supplier"
            type="text"
            defaultValue={pigment?.supplier}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
            placeholder="Supplier name"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-ink mb-1">
            Unit *
          </label>
          <input
            id="unit"
            name="unit"
            type="text"
            required
            defaultValue={pigment?.unit ?? "g"}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
            placeholder="e.g. g, oz"
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
            defaultValue={pigment?.quantity_on_hand ?? 0}
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
            defaultValue={pigment?.reorder_point ?? ""}
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
          rows={2}
          defaultValue={pigment?.notes}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Internal notes"
        />
      </div>
      {pigment && <input type="hidden" name="id" value={pigment.id} />}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </form>
  );
}
