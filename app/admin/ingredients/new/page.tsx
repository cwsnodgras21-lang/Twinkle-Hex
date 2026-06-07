import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";
import { IngredientForm } from "@/components/admin/ingredients/IngredientForm";

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
        <IngredientForm mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
