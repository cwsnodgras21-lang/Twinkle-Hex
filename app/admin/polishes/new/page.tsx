import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";
import { PolishForm } from "@/components/admin/polishes";

export default function NewPolishPage() {
  return (
    <AdminPageShell title="New polish" description="You can add the recipe right after creating it.">
      <div className="mb-6">
        <Link href="/admin/polishes" className="text-sm text-teal hover:underline">
          ← Back to polishes
        </Link>
      </div>

      <FormShell
        title="Polish details"
        actions={
          <Link href="/admin/polishes" className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5">
            Cancel
          </Link>
        }
      >
        <PolishForm mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
