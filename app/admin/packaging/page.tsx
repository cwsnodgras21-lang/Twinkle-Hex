import { AdminPageShell } from "@/components/admin";
import { PackagingBomEditor } from "@/components/admin/packaging";
import { getPackagingBomForPolish } from "@/lib/admin/packaging";
import { listIngredients } from "@/lib/admin/ingredients";

export default async function PackagingPage() {
  const [bom, supplies] = await Promise.all([
    getPackagingBomForPolish(null).catch(() => null),
    listIngredients("supply").catch(() => []),
  ]);

  return (
    <AdminPageShell
      title="Packaging BOM"
      description="Supplies consumed per finished bottle — bottles, labels, caps. Not part of the polish formula."
    >
      <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm max-w-2xl">
        <PackagingBomEditor bom={bom} supplies={supplies} />
      </div>
    </AdminPageShell>
  );
}
