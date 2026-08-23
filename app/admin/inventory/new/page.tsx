import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";
import { InventoryForm } from "@/components/admin/inventory";
import { listPolishes } from "@/lib/admin/polishes";

export default async function NewInventoryItemPage() {
  const polishes = await listPolishes();

  return (
    <AdminPageShell title="New Stock Item" description="Create a finished polish stock record.">
      <FormShell
        title="Stock details"
        description="Track finished polish stock, reserved bottles, and which recipe it's made from."
        actions={
          <Link href="/admin/inventory" className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5">
            Cancel
          </Link>
        }
      >
        <InventoryForm polishes={polishes} />
      </FormShell>
    </AdminPageShell>
  );
}
