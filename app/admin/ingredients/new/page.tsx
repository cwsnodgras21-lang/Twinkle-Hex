import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";
import { IngredientForm } from "@/components/admin/ingredients";
import type { IngredientCategory } from "@/types/admin";

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function NewIngredientPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const defaultCategory: IngredientCategory | undefined =
    category === "ingredient" || category === "pigment" || category === "supply"
      ? (category as IngredientCategory)
      : undefined;

  return (
    <AdminPageShell title="New Ingredient" description="Add a raw ingredient, pigment, or supply.">
      <div className="mb-6">
        <Link href="/admin/ingredients" className="text-sm text-teal hover:underline">
          ← Back to ingredients
        </Link>
      </div>
      <FormShell
        title="Ingredient details"
        actions={
          <Link href="/admin/ingredients" className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5">
            Cancel
          </Link>
        }
      >
        <IngredientForm mode="create" defaultCategory={defaultCategory} />
      </FormShell>
    </AdminPageShell>
  );
}
