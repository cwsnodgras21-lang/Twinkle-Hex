import Link from "next/link";
import { AdminPageShell } from "@/components/admin";
import { RdForm } from "@/components/admin/rd/RdForm";
import { listIngredients } from "@/lib/admin/ingredients";

export default async function NewRdPage() {
  const ingredients = await listIngredients().catch(() => []);
  return (
    <AdminPageShell title="New R&D prototype" description="Observation window for experimental pigments.">
      <div className="mb-6">
        <Link href="/admin/rd" className="text-sm text-teal hover:underline">
          ← Back to R&D
        </Link>
      </div>
      <RdForm
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          lifecycle_status: i.lifecycle_status,
        }))}
      />
    </AdminPageShell>
  );
}
