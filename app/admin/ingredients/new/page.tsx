import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";

export default function NewIngredientPage() {
  return (
    <AdminPageShell
      title="Add Ingredient"
      description="Create a new raw material entry."
    >
      <FormShell
        title="Ingredient details"
        description="Basic info for tracking inventory."
        actions={
          <>
            <button
              type="submit"
              form="ingredient-form"
              className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
            >
              Save
            </button>
            <Link
              href="/admin/ingredients"
              className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Cancel
            </Link>
          </>
        }
      >
        {/* Placeholder form - wire to createIngredient server action when ready */}
        <form id="ingredient-form" className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
              placeholder="e.g. Mica #123"
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
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-ink mb-1">
                Unit
              </label>
              <input
                id="unit"
                name="unit"
                type="text"
                className="w-full border border-ink/20 rounded-lg px-3 py-2"
                placeholder="e.g. g, oz, ml"
              />
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-ink mb-1">
                Quantity on hand
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-ink/20 rounded-lg px-3 py-2"
              />
            </div>
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
              step="0.01"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
              placeholder="Alert when below this"
            />
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
