"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Ingredient } from "@/types/admin";
import {
  createIngredientAction,
  updateIngredientAction,
} from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/errors";

interface IngredientFormProps {
  ingredient?: Ingredient | null;
  mode: "create" | "edit";
}

export function IngredientForm({ ingredient, mode }: IngredientFormProps) {
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
        const result = await createIngredientAction(formData);
        if (result.ok) {
          router.push(`/admin/ingredients/${result.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (ingredient) {
        const result = await updateIngredientAction(ingredient.id, formData);
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
      id="ingredient-form"
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
          defaultValue={ingredient?.name}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="e.g. Mica #123, Pigment Blue"
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
          defaultValue={ingredient?.sku}
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
          defaultValue={ingredient?.supplier}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Supplier name"
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
            defaultValue={ingredient?.unit ?? "g"}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
            placeholder="e.g. g, oz, ml"
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
            defaultValue={ingredient?.quantity_on_hand ?? 0}
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
            defaultValue={ingredient?.reorder_point ?? ""}
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
          defaultValue={ingredient?.notes}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Internal notes"
        />
      </div>
      {ingredient && <input type="hidden" name="id" value={ingredient.id} />}
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
