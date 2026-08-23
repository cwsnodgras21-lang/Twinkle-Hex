import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell, StatusBadge } from "@/components/admin";
import { IngredientForm, MsdsDocumentsPanel } from "@/components/admin/ingredients";
import { getIngredientById, listIngredientMsdsDocuments } from "@/lib/admin/ingredients";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IngredientDetailPage({ params }: Props) {
  const { id } = await params;
  const ingredient = await getIngredientById(id);
  if (!ingredient) notFound();

  const documents = ingredient.category === "pigment" ? await listIngredientMsdsDocuments(id) : [];
  const low = ingredient.reorder_point != null && ingredient.quantity_on_hand <= ingredient.reorder_point;

  return (
    <AdminPageShell
      title={ingredient.name}
      description="Update stock levels and details."
      actions={low ? <StatusBadge label="Low stock" variant="warning" /> : undefined}
    >
      <div className="mb-6">
        <Link href="/admin/ingredients" className="text-sm text-teal hover:underline">
          ← Back to ingredients
        </Link>
      </div>

      <div className="space-y-8">
        <FormShell title="Details">
          <IngredientForm ingredient={ingredient} mode="edit" />
        </FormShell>

        {ingredient.category === "pigment" && (
          <FormShell title="MSDS / SDS sheets" description="Hazard documentation attached to this pigment.">
            <MsdsDocumentsPanel ingredientId={ingredient.id} documents={documents} />
          </FormShell>
        )}
      </div>
    </AdminPageShell>
  );
}
