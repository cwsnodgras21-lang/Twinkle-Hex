import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell } from "@/components/admin";
import { IngredientForm } from "@/components/admin/ingredients/IngredientForm";
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
        <IngredientForm ingredient={ingredient} mode="edit" />
      </FormShell>
    </AdminPageShell>
  );
}
