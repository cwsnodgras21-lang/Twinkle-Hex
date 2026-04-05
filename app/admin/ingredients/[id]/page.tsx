import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell } from "@/components/admin";
import { getIngredientById } from "@/lib/admin/ingredients";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditIngredientPage({ params }: Props) {
  const { id } = await params;
  const ingredient = await getIngredientById(id);
  if (!ingredient) notFound();

  return (
    <AdminPageShell
      title={`Edit: ${ingredient.name}`}
      description="Update ingredient details."
    >
      <FormShell
        title="Ingredient details"
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
        <form id="ingredient-form" className="space-y-4">
          <input type="hidden" name="id" value={ingredient.id} />
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={ingredient.name}
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                defaultValue={ingredient.quantity_on_hand}
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
                step="0.01"
                defaultValue={ingredient.reorder_point ?? ""}
                className="w-full border border-ink/20 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
