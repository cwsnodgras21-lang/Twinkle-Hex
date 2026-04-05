import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";
import { InventoryForm } from "@/components/admin/inventory";
import { listReleases } from "@/lib/admin/releases";

export default async function NewInventoryItemPage() {
  const releases = await listReleases();

  return (
    <AdminPageShell
      title="New Inventory Item"
      description="Create a finished goods inventory record."
    >
      <FormShell
        title="Inventory details"
        description="Track finished polish stock, reserved bottles, and optional release links."
        actions={
          <Link
            href="/admin/inventory"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Cancel
          </Link>
        }
      >
        <InventoryForm releases={releases} />
      </FormShell>
    </AdminPageShell>
  );
}
