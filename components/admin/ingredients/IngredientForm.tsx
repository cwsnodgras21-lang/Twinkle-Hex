"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Ingredient, IngredientCategory } from "@/types/admin";
import { createIngredientAction, updateIngredientAction } from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/errors";

interface IngredientFormProps {
  ingredient?: Ingredient | null;
  mode: "create" | "edit";
  /** Preselect a category, e.g. when arriving from a filtered list. */
  defaultCategory?: IngredientCategory;
}

const CATEGORY_OPTIONS: { value: IngredientCategory; label: string }[] = [
  { value: "ingredient", label: "Ingredient" },
  { value: "pigment", label: "Pigment" },
  { value: "supply", label: "Supply" },
];

export function IngredientForm({ ingredient, mode, defaultCategory }: IngredientFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [category, setCategory] = useState<IngredientCategory>(
    ingredient?.category ?? defaultCategory ?? "ingredient"
  );
  const isPigment = category === "pigment";

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
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="ingredient-form" onSubmit={handleSubmit} method="post" className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Category *</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`px-3.5 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                category === opt.value
                  ? "bg-plum text-white border-plum"
                  : "border-ink/20 text-ink/70 hover:bg-ink/5"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={opt.value}
                checked={category === opt.value}
                onChange={() => setCategory(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

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
          className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          placeholder="e.g. TKB Blue, Mica Gold Sparkle, 15mL bottles"
        />
      </div>

      {isPigment && (
        <div>
          <label htmlFor="color_description" className="block text-sm font-medium text-ink mb-1">
            Color description
          </label>
          <input
            id="color_description"
            name="color_description"
            type="text"
            defaultValue={ingredient?.color_description}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            placeholder="e.g. Deep navy with gold shimmer"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-ink mb-1">
            SKU
          </label>
          <input
            id="sku"
            name="sku"
            type="text"
            defaultValue={ingredient?.sku}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            placeholder="Optional internal SKU"
          />
        </div>
        <div>
          <label htmlFor="lifecycle_status" className="block text-sm font-medium text-ink mb-1">
            Lifecycle
          </label>
          <select
            id="lifecycle_status"
            name="lifecycle_status"
            defaultValue={ingredient?.lifecycle_status ?? "tracked"}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          >
            <option value="tracked">Tracked</option>
            <option value="experimental">Experimental (R&amp;D)</option>
            <option value="approved">Approved for production</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-ink mb-1">
            Supplier
          </label>
          <input
            id="supplier"
            name="supplier"
            type="text"
            defaultValue={ingredient?.supplier}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            placeholder="Supplier name"
          />
        </div>
        <div>
          <label htmlFor="supplier_identifier" className="block text-sm font-medium text-ink mb-1">
            Supplier ID
          </label>
          <input
            id="supplier_identifier"
            name="supplier_identifier"
            type="text"
            defaultValue={ingredient?.supplier_identifier}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            placeholder="Supplier catalog / SKU"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="received_date" className="block text-sm font-medium text-ink mb-1">
            Received date
          </label>
          <input
            id="received_date"
            name="received_date"
            type="date"
            defaultValue={ingredient?.received_date ?? ""}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          />
        </div>
        <div>
          <label htmlFor="lot_number" className="block text-sm font-medium text-ink mb-1">
            Lot / batch
          </label>
          <input
            id="lot_number"
            name="lot_number"
            type="text"
            defaultValue={ingredient?.lot_number}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            placeholder="Optional lot number"
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
            defaultValue={ingredient?.unit ?? (category === "supply" ? "each" : "g")}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            placeholder="e.g. g, oz, ml, each"
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
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
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
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            placeholder="Alert when below this"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="purchase_cost" className="block text-sm font-medium text-ink mb-1">
            Purchase cost ($)
          </label>
          <input
            id="purchase_cost"
            name="purchase_cost"
            type="number"
            min="0"
            step="0.01"
            defaultValue={ingredient?.purchase_cost ?? ""}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            placeholder="What you paid"
          />
        </div>
        <div>
          <label htmlFor="purchase_quantity" className="block text-sm font-medium text-ink mb-1">
            Purchased qty
          </label>
          <input
            id="purchase_quantity"
            name="purchase_quantity"
            type="number"
            min="0"
            step="0.0001"
            defaultValue={ingredient?.purchase_quantity ?? ""}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            placeholder="In unit above"
          />
        </div>
        <div>
          <label htmlFor="unit_cost" className="block text-sm font-medium text-ink mb-1">
            Unit cost ($)
          </label>
          <input
            id="unit_cost"
            name="unit_cost"
            type="number"
            min="0"
            step="0.0001"
            defaultValue={ingredient?.unit_cost ?? ""}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            placeholder="Auto from purchase if blank"
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
          className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          placeholder="Internal notes"
        />
      </div>

      {ingredient && <input type="hidden" name="id" value={ingredient.id} />}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </form>
  );
}
