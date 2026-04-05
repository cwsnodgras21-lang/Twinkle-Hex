import Link from "next/link";
import { AdminPageShell, TableShell, FiltersBar, EmptyState } from "@/components/admin";
import { listFinishedInventoryItems } from "@/lib/admin/inventory";

export default async function AdminInventoryPage() {
  let items: Awaited<ReturnType<typeof listFinishedInventoryItems>> = [];
  let loadError: string | null = null;
  try {
    items = await listFinishedInventoryItems();
  } catch (e) {
    loadError =
      e instanceof Error ? e.message : "Could not load inventory (check Supabase table).";
  }

  return (
    <AdminPageShell
      title="Finished Goods Inventory"
      description="Stock levels for finished products. Optional link to a release for launch planning."
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/inventory/new"
            className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
          >
            New inventory item
          </Link>
          <Link
            href="/admin/ingredients"
            className="text-sm text-teal hover:underline self-center"
          >
            Ingredients →
          </Link>
        </div>
      }
    >
      {loadError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          {loadError}
        </div>
      )}
      <FiltersBar />
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Name", "SKU", "Qty", "Reserved", "Location"]}
          empty={items.length === 0 && !loadError}
          emptyContent={
            <EmptyState
              title="No inventory items yet"
              description="Add finished goods to track stock. Run migration 003 in Supabase if inserts fail."
              action={
                <Link
                  href="/admin/inventory/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  New inventory item
                </Link>
              }
            />
          }
        >
          {items.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
              <td className="px-4 py-3 text-ink/70 font-mono text-sm">{row.sku ?? "—"}</td>
              <td className="px-4 py-3 text-ink/70">{row.quantity_on_hand}</td>
              <td className="px-4 py-3 text-ink/70">{row.reserved_quantity}</td>
              <td className="px-4 py-3 text-ink/70">{row.location ?? "—"}</td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
