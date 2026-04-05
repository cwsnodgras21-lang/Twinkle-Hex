import Link from "next/link";
import { AdminPageShell, TableShell, EmptyState } from "@/components/admin";
import { listIngredients } from "@/lib/admin/ingredients";

export default async function AdminIngredientsPage() {
  // Where Supabase table `ingredients` will be queried
  const ingredients = await listIngredients();

  return (
    <AdminPageShell
      title="Ingredients"
      description="Raw materials for polish production."
      actions={
        <Link
          href="/admin/ingredients/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          Add Ingredient
        </Link>
      }
    >
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Name", "SKU", "Quantity", "Unit", "Reorder Point"]}
          empty={ingredients.length === 0}
          emptyContent={
            <EmptyState
              title="No ingredients yet"
              description="Add your first ingredient to start tracking raw materials."
              action={
                <Link
                  href="/admin/ingredients/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  Add Ingredient
                </Link>
              }
            />
          }
        >
          {ingredients.map((ing) => (
            <tr key={ing.id}>
              <td className="px-4 py-3">
                <Link href={`/admin/ingredients/${ing.id}`} className="text-teal hover:underline">
                  {ing.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/70">{ing.sku ?? "—"}</td>
              <td className="px-4 py-3">{ing.quantity_on_hand}</td>
              <td className="px-4 py-3">{ing.unit}</td>
              <td className="px-4 py-3">{ing.reorder_point ?? "—"}</td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
